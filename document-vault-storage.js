(function(){
  'use strict';

  const BUCKET='lellee-document-vault';
  const MAX_BYTES=10*1024*1024;
  const ALLOWED=new Set(['application/pdf','image/jpeg','image/png','image/webp']);
  let cachedDocs=new Map();
  let lastActive=false;
  let refreshing=false;

  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const client=()=>{
    if(window.LelleeAuthContext?.client)return window.LelleeAuthContext.client;
    try{if(typeof sb!=='undefined')return sb}catch(_){/* noop */}
    return null;
  };
  const user=()=>{
    if(window.LelleeAuthContext?.getCurrentUser)return window.LelleeAuthContext.getCurrentUser();
    try{if(typeof currentUser!=='undefined')return currentUser}catch(_){/* noop */}
    return null;
  };
  const page=()=>document.getElementById('page-document-vault');

  function toast(message,bad=false){
    const t=document.getElementById('globalToast');
    if(t){
      t.textContent=message;
      t.classList.remove('hidden');
      if(bad)t.style.background='#7f2634';
      setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2600);
      return;
    }
    if(bad)alert(message);
  }

  function cleanName(name){
    return String(name||'document').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'document';
  }

  function ensureStyle(){
    if(document.getElementById('vaultStorageLiveStyle'))return;
    const style=document.createElement('style');
    style.id='vaultStorageLiveStyle';
    style.textContent=`
      #page-document-vault .vault-file-actions{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}
      #page-document-vault .vault-file-actions button{border:1px solid #ddd1e9;background:#fff;color:#5b2fa0;border-radius:7px;padding:6px 9px;font-size:.58rem;font-weight:800}
      #page-document-vault .vault-file-actions button.primary{background:#5b2fa0;color:#fff;border-color:#5b2fa0}
      #page-document-vault .vault-file-status{display:inline-block;margin-top:4px;font-size:.55rem;color:#6e6672}
      #page-document-vault .vault-file-status.uploaded{color:#26734c;font-weight:800}
      #page-document-vault .vault-live-note{border:1px solid #d9eadf;background:#f3faf5;border-radius:9px;padding:10px 12px;font-size:.62rem;line-height:1.45;color:#425448}
      #page-document-vault .forms-row{align-items:center}
      @media(max-width:700px){#page-document-vault .vault-file-actions{width:100%;margin:7px 0 0}.vault-file-actions button{flex:1}}
    `;
    document.head.appendChild(style);
  }

  function patchCopy(){
    const p=page(); if(!p)return;
    const head=p.querySelector('.approved-inner-head');
    const h2=head?.querySelector('h2');
    const para=head?.querySelector('p');
    if(h2)h2.textContent='Keep important documents private, organized and available when you need them.';
    if(para)para.textContent='Track document type and expiration, and optionally upload a private PDF or image. Files stay in your own protected Lellee vault and are not public.';
    const note=p.querySelector('.forms-note');
    if(note){
      note.className='vault-live-note';
      note.innerHTML='<b>Private file storage is on.</b><br>Uploads are limited to PDF, JPEG, PNG or WebP files up to 10 MB. Files use short-lived private links and are not publicly indexed. External sharing remains off.';
    }
    const add=document.getElementById('vaultAddDocument');
    if(add)add.textContent='+ Add Document & File';
  }

  function filePicker(){
    return new Promise(resolve=>{
      const input=document.createElement('input');
      input.type='file';
      input.accept='.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';
      input.style.display='none';
      input.addEventListener('change',()=>{const f=input.files?.[0]||null;input.remove();resolve(f)},{once:true});
      document.body.appendChild(input);
      input.click();
    });
  }

  function validateFile(file){
    if(!file)return 'No file selected.';
    if(file.size>MAX_BYTES)return 'That file is larger than 10 MB.';
    if(!ALLOWED.has(file.type))return 'Use a PDF, JPEG, PNG or WebP file.';
    return '';
  }

  async function uploadFile(file,path){
    const c=client();
    const {error}=await c.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
    if(error)throw error;
  }

  async function removeFile(path){
    if(!path)return;
    const c=client();
    const {error}=await c.storage.from(BUCKET).remove([path]);
    if(error)throw error;
  }

  function rowHtml(doc){
    const detail=`${doc.document_type||'other'} · ${doc.status||'current'}${doc.expires_on?' · expires '+doc.expires_on:''}`;
    const fileState=doc.has_file?'<span class="vault-file-status uploaded">Private file uploaded</span>':'<span class="vault-file-status">No file attached</span>';
    const actions=doc.has_file
      ? `<div class="vault-file-actions"><button class="primary" data-vault-open="${esc(doc.id)}">Open file</button><button data-vault-remove="${esc(doc.id)}">Remove file</button></div>`
      : `<div class="vault-file-actions"><button class="primary" data-vault-attach="${esc(doc.id)}">Add file</button></div>`;
    return `<div class="forms-row ${doc.expires_soon?'attention':''}"><div class="forms-icon">◇</div><div><b>${esc(doc.label)}</b><small>${esc(detail)}</small>${fileState}</div><em>${esc(doc.share_status||'private')}</em>${actions}</div>`;
  }

  async function refresh(){
    if(refreshing)return;
    const p=page(),c=client(),u=user();
    if(!p||!c||!u)return;
    refreshing=true;
    try{
      patchCopy();
      const {data,error}=await c.rpc('get_my_document_vault_summary');
      if(error)throw error;
      const s=data?.summary||{};
      const docs=Array.isArray(data?.documents)?data.documents:[];
      cachedDocs=new Map(docs.map(d=>[String(d.id),d]));
      const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val};
      set('vaultDocuments',s.documents||0);set('vaultExpiring',s.expiring||0);set('vaultShared',s.shared||0);set('vaultUploads',s.uploads_enabled?'On':'Off');
      const list=document.getElementById('vaultDocumentList');
      if(list)list.innerHTML=docs.length?docs.map(rowHtml).join(''):'<div class="approved-resource-empty">No document records yet.</div>';
    }catch(error){console.warn('[Vault Storage]',error);toast(error.message||'Document Vault could not refresh.',true)}finally{refreshing=false}
  }

  async function addDocumentWithFile(){
    const c=client(),u=user();if(!c||!u)return toast('Sign in to use Document Vault.',true);
    const file=await filePicker();if(!file)return;
    const invalid=validateFile(file);if(invalid)return toast(invalid,true);
    const label=prompt('Document label (example: Driver license):',file.name.replace(/\.[^.]+$/,''));if(!label)return;
    const type=(prompt('Document type: identity, benefits, housing, employment, medical, legal, education, other','other')||'other').trim().toLowerCase();
    const allowedTypes=new Set(['identity','benefits','housing','employment','medical','legal','education','other']);
    if(!allowedTypes.has(type))return toast('Choose one of the listed document types.',true);
    const exp=(prompt('Expiration date YYYY-MM-DD (optional):','')||'').trim()||null;
    if(exp&&!/^\d{4}-\d{2}-\d{2}$/.test(exp))return toast('Use expiration format YYYY-MM-DD.',true);
    const uuid=crypto.randomUUID();
    const path=`${u.id}/${uuid}/${cleanName(file.name)}`;
    try{
      toast('Uploading private document…');
      await uploadFile(file,path);
      const {error}=await c.from('document_vault_items').insert({user_id:u.id,label:label.trim(),document_type:type,status:'current',expires_on:exp,file_storage_reference:path,file_upload_status:'uploaded'});
      if(error){try{await removeFile(path)}catch(_){/* cleanup best effort */}throw error}
      toast('Private document saved.');
      await refresh();
    }catch(error){toast(error.message||'Upload failed.',true)}
  }

  async function attachFile(id){
    const c=client(),u=user(),doc=cachedDocs.get(String(id));if(!c||!u||!doc)return;
    const file=await filePicker();if(!file)return;
    const invalid=validateFile(file);if(invalid)return toast(invalid,true);
    const path=`${u.id}/${crypto.randomUUID()}/${cleanName(file.name)}`;
    try{
      toast('Uploading private file…');
      await uploadFile(file,path);
      const {error}=await c.from('document_vault_items').update({file_storage_reference:path,file_upload_status:'uploaded',updated_at:new Date().toISOString()}).eq('id',doc.id).eq('user_id',u.id);
      if(error){try{await removeFile(path)}catch(_){/* cleanup best effort */}throw error}
      toast('File added.');await refresh();
    }catch(error){toast(error.message||'Upload failed.',true)}
  }

  async function openFile(id){
    const c=client(),doc=cachedDocs.get(String(id));if(!c||!doc?.file_storage_reference)return;
    try{
      const {data,error}=await c.storage.from(BUCKET).createSignedUrl(doc.file_storage_reference,120);
      if(error)throw error;
      const win=window.open(data.signedUrl,'_blank','noopener,noreferrer');
      if(!win)location.href=data.signedUrl;
    }catch(error){toast(error.message||'File could not be opened.',true)}
  }

  async function detachFile(id){
    const c=client(),u=user(),doc=cachedDocs.get(String(id));if(!c||!u||!doc?.file_storage_reference)return;
    if(!confirm(`Remove the stored file for “${doc.label}”? The document record will remain.`))return;
    try{
      await removeFile(doc.file_storage_reference);
      const {error}=await c.from('document_vault_items').update({file_storage_reference:null,file_upload_status:'deleted',updated_at:new Date().toISOString()}).eq('id',doc.id).eq('user_id',u.id);
      if(error)throw error;
      toast('Stored file removed.');await refresh();
    }catch(error){toast(error.message||'File could not be removed.',true)}
  }

  document.addEventListener('click',event=>{
    const add=event.target.closest('#vaultAddDocument');
    if(add){event.preventDefault();event.stopImmediatePropagation();addDocumentWithFile();return}
    const open=event.target.closest('[data-vault-open]');if(open){event.preventDefault();openFile(open.dataset.vaultOpen);return}
    const attach=event.target.closest('[data-vault-attach]');if(attach){event.preventDefault();attachFile(attach.dataset.vaultAttach);return}
    const remove=event.target.closest('[data-vault-remove]');if(remove){event.preventDefault();detachFile(remove.dataset.vaultRemove);return}
  },true);

  ensureStyle();
  setInterval(()=>{
    const active=page()?.classList.contains('active')===true;
    if(active&&!lastActive)setTimeout(refresh,100);
    lastActive=active;
  },400);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{patchCopy();if(page()?.classList.contains('active'))refresh()},{once:true});
  else {patchCopy();if(page()?.classList.contains('active'))refresh()}

  window.LelleeDocumentVaultStorage=Object.freeze({refresh});
})();