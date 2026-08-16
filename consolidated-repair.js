(() => {
  'use strict';
  const VERSION='2026-08-15-r1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const client=()=>window.sb||null;
  const currentUser=async()=>{
    const c=client(); if(!c)return null;
    try{const {data}=await c.auth.getUser();return data?.user||null}catch{return null}
  };
  const timeout=(promise,ms=7000,label='Request')=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label} timed out. Please try again.`)),ms))]);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const slug=v=>String(v||'').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';
  const localDate=d=>{const x=d?new Date(d):new Date();return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
  const toast=(text,type='info')=>{
    if(typeof window.showToast==='function'){try{return window.showToast(text,type)}catch{}}
    let el=$('#b7RepairToast'); if(!el){el=document.createElement('div');el.id='b7RepairToast';el.className='prod-toast';document.body.appendChild(el)}
    el.textContent=text;el.dataset.type=type==='error'?'error':'';el.classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add('hidden'),3500);
  };
  const activePage=()=>$('.page.active')?.id?.replace(/^page-/,'')||'today';
  const activate=(page)=>{
    const target=$(`#page-${CSS.escape(page)}`);if(!target)return false;
    $$('.page').forEach(p=>p.classList.remove('active'));target.classList.add('active');
    $$('.nav-item,[data-page]').forEach(b=>{if(b.matches('.nav-item,.mobile-bottom button'))b.classList.toggle('active',b.dataset.page===page)});
    try{localStorage.setItem('lellee:last-page:v2',page)}catch{}
    window.scrollTo({top:0,behavior:'auto'});return true;
  };
  function replaceButton(selector,handler){
    const old=$(selector);if(!old||old.dataset.b7Repair==='true')return old;
    const fresh=old.cloneNode(true);fresh.dataset.b7Repair='true';old.replaceWith(fresh);
    fresh.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();handler(e,fresh)},true);return fresh;
  }

  /* ---------- navigation cleanup ---------- */
  function ensureSettingsNav(){
    const account=$('.nav-category[data-category="account"] .nav-category-items-inner');if(!account)return;
    account.querySelector('[data-page="workspace-home"]')?.remove();
    account.querySelector('[data-page="professional-hub"]')?.remove();
    const existing=account.querySelector('[data-page="settings"]');
    if(!existing){
      const b=document.createElement('button');b.type='button';b.className='nav-item';b.dataset.page='settings';b.innerHTML='<span class="nav-icon">⚙</span>Settings';account.appendChild(b);
    }
    const order=['global-search','plus','language-accessibility','settings'];
    order.forEach(page=>{const b=account.querySelector(`[data-page="${page}"]`);if(b)account.appendChild(b)});
    [...account.children].forEach(b=>{if(b.matches('[data-page="help-center"],[data-page="admin"]'))account.appendChild(b)});
  }

  function repairExpertPractices(){
    const button=$('.nav-category[data-category="grow"] [data-page="expert-guided-practices"]');
    if(!button||button.dataset.b7Repair==='true')return;
    const fresh=button.cloneNode(true);fresh.dataset.b7Repair='true';button.replaceWith(fresh);
    fresh.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();activate('expert-guided-practices');$('.nav-category[data-category="grow"]')?.classList.add('open')},true);
  }

  function addProfessionalPromo(){
    if($('#b7ProfessionalPromo'))return;
    const page=$('#page-today');if(!page)return;
    const promo=document.createElement('section');promo.id='b7ProfessionalPromo';promo.className='b7-professional-promo';
    promo.innerHTML='<div><small>FOR INDEPENDENT PROFESSIONALS</small><h3>Build Your Own Helping Business</h3><p>Training, business tools, marketing support, and Lellee-powered agents are available separately from your personal Recovery experience.</p></div><button class="approved-small-action" type="button">Explore Professional Lellee →</button>';
    promo.querySelector('button').addEventListener('click',()=>activate('professional-hub'));
    page.appendChild(promo);
  }

  /* ---------- Learn: replace freezing completion handler ---------- */
  async function saveLearning(status,button){
    if(button?.dataset.busy==='1')return; if(button){button.dataset.busy='1';button.disabled=true;button.textContent=status==='completed'?'Saving…':'Saving…'}
    const title=$('#learningDetailTitle')?.textContent.trim()||'Lesson';const key=slug(title);const now=new Date().toISOString();
    try{
      const u=await currentUser();const c=client();
      if(c&&u){
        const row={user_id:u.id,item_key:key,item_type:($('#learningDetailType')?.textContent||'lesson').toLowerCase(),title,status,saved_at:now,completed_at:status==='completed'?now:null};
        const {error}=await timeout(c.from('lellee_learning_progress').upsert(row,{onConflict:'user_id,item_key'}),7000,'Learning save');if(error)throw error;
      }else{
        const k='lellee:b7-learning';const rows=JSON.parse(localStorage.getItem(k)||'[]').filter(x=>x.item_key!==key);rows.push({item_key:key,title,status,saved_at:now,completed_at:status==='completed'?now:null});localStorage.setItem(k,JSON.stringify(rows));
      }
      if(button){button.textContent=status==='completed'?'✓ Completed':'Saved for Later';button.classList.toggle('b3-complete',status==='completed')}
      $$('.approved-learning-card').forEach(card=>{if(slug(card.querySelector('h3')?.textContent)===key){card.classList.toggle('b3-completed',status==='completed');let pill=card.querySelector('.b3-learning-card-status');if(!pill){pill=document.createElement('span');pill.className='b3-learning-card-status b3-status-pill';card.querySelector('.approved-learning-actions')?.before(pill)}pill.textContent=status==='completed'?'✓ Completed':'Saved for later';}});
      toast(status==='completed'?'Lesson completed':'Saved for later');
    }catch(err){console.error('Lellee repair learning:',err);toast(err.message||'Could not save the lesson.','error');if(button)button.textContent=status==='completed'?'Mark Complete':'Save for Later'}
    finally{if(button){button.dataset.busy='0';button.disabled=false}}
  }
  function repairLearning(){
    replaceButton('#markLearningComplete',(e,b)=>saveLearning('completed',b));
    replaceButton('#saveLearningItem',(e,b)=>saveLearning('saved',b));
  }

  /* ---------- Journal Review Entries ---------- */
  function journalContent(row){return row.content??row.text??row.body??''}
  async function loadJournalEntriesSafe(){
    const list=$('#entriesList'),host=$('#journalEntryCards');if(!list||!host)return;
    list.classList.remove('hidden');host.innerHTML='<div class="b7-safe-state">Loading your saved entries…</div>';
    try{
      const u=await currentUser(),c=client();let rows=[];
      if(c&&u){const {data,error}=await timeout(c.from('journal_entries').select('*').eq('user_id',u.id).order('created_at',{ascending:false}).limit(100),7000,'Journal history');if(error)throw error;rows=data||[]}
      if(!rows.length){host.innerHTML='<div class="b7-safe-state">No saved journal entries yet.</div>';return}
      host.innerHTML=rows.map(r=>`<article class="b3-journal-card"><div class="b3-journal-card-head"><small>${esc(new Date(r.created_at||r.entry_date||Date.now()).toLocaleDateString())}</small></div><h3>${esc(r.title||'Journal entry')}</h3><p>${esc(journalContent(r)).slice(0,500)||'Blank entry'}</p></article>`).join('');
      list.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){console.error('Lellee repair journal:',err);host.innerHTML=`<div class="b7-safe-state error">${esc(err.message||'Journal entries could not be loaded.')}</div>`}
  }
  function repairJournal(){replaceButton('#toggleEntries',()=>loadJournalEntriesSafe())}

  /* ---------- Then & Now visible comparison ---------- */
  const themePrompts={current_feeling:'How I was feeling',evening_what_helped:'What helped me',life_areas_needing_care:'Areas needing care'};
  const summarizeGuided=row=>{const choices=Array.isArray(row.selected_choices)?row.selected_choices.filter(Boolean):[];return [choices.join(', '),row.optional_reflection].filter(Boolean).join(' — ')||'No written detail saved.'};
  async function buildThenNowSafe(){
    const host=$('#thenNowResultV2');if(!host)return;host.innerHTML='<div class="b7-safe-state">Building your comparison…</div>';
    const key=$('#tnKeyV2')?.value||'current_feeling';
    try{
      const u=await currentUser(),c=client();if(!c||!u)throw new Error('Sign in to build a comparison.');
      let query=c.from('guided_responses').select('response_date,prompt_key,selected_choices,optional_reflection').eq('user_id',u.id).eq('prompt_key',key).order('response_date',{ascending:true}).limit(200);
      const {data,error}=await timeout(query,7000,'Then & Now');if(error)throw error;const rows=data||[];
      if(rows.length<2){host.innerHTML='<div class="b7-safe-state">You need at least two saved responses to this theme before Lellee can compare them.</div>';return}
      const first=rows[0],last=rows[rows.length-1];
      host.innerHTML=`<article class="b7-then-card"><small>THEN · ${esc(first.response_date)}</small><h3>${esc(themePrompts[key]||'Earlier response')}</h3><p>${esc(summarizeGuided(first))}</p></article><div class="b7-arrow">→</div><article class="b7-then-card"><small>NOW · ${esc(last.response_date)}</small><h3>${esc(themePrompts[key]||'Most recent response')}</h3><p>${esc(summarizeGuided(last))}</p></article>`;
      host.classList.add('b7-rendered');host.scrollIntoView({behavior:'smooth',block:'center'});toast('Comparison built');
    }catch(err){console.error('Lellee repair Then & Now:',err);host.innerHTML=`<div class="b7-safe-state error">${esc(err.message||'The comparison could not be loaded.')}</div>`}
  }
  function repairThenNow(){replaceButton('#buildThenNowV2',()=>buildThenNowSafe())}

  /* ---------- Recovery Story visible preview ---------- */
  async function buildStorySafe(){
    const host=$('#storyPreviewV2');if(!host)return;host.innerHTML='<div class="b7-safe-state">Building your private preview…</div>';
    try{
      const title=$('#storyTitleV2')?.value.trim()||'My Recovery Story';const opening=$('#storyOpeningV2')?.value.trim()||'This story is built from the parts of recovery I chose to preserve.';
      const edition=$('#storyEditionV2')?.selectedOptions?.[0]?.textContent||'Recovery Story';
      const sections=[];
      if($('#storyMilestonesV2')?.checked)sections.push('<section><h3>Milestones</h3><p>Your saved milestone reflections can appear here when available.</p></section>');
      if($('#storyThenNowV2')?.checked)sections.push('<section><h3>Then & Now</h3><p>Your approved comparison reflections can show changes in your own words.</p></section>');
      if($('#storyGoalsV2')?.checked)sections.push('<section><h3>Goals</h3><p>Your recovery goals can help show what you were working toward.</p></section>');
      if($('#storyGuidedV2')?.checked)sections.push('<section><h3>Approved Guided Reflections</h3><p>Only guided material you previously allowed for Recovery Story use is eligible.</p></section>');
      if($('#storyJournalV2')?.checked)sections.push('<section><h3>Selected Journal Material</h3><p>Journal text remains excluded unless you deliberately select it for your story.</p></section>');
      host.innerHTML=`<article class="approved-story-paper"><div class="story-cover"><span>PRIVATE RECOVERY RECORD</span><h1>${esc(title)}</h1><small>${esc(edition)}</small></div><section><h3>Opening</h3><p>${esc(opening).replace(/\n/g,'<br>')}</p></section>${sections.join('')}<div class="story-print-actions"><button class="approved-small-action" type="button" id="b7PrintStory">Print / Save as PDF</button></div></article>`;
      host.classList.add('b7-rendered');host.scrollIntoView({behavior:'smooth',block:'start'});toast('Story preview built');
    }catch(err){console.error(err);host.innerHTML=`<div class="b7-safe-state error">${esc(err.message||'The story preview could not be built.')}</div>`}
  }
  function repairStory(){replaceButton('#buildStoryPreviewV2',()=>buildStorySafe());document.addEventListener('click',e=>{if(e.target.closest('#b7PrintStory'))window.print()},true)}

  /* ---------- Lellee Plus Recovery Review routing ---------- */
  function repairRecoveryReview(){
    const old=$('.plus-review-preview');if(!old||old.dataset.b7Repair==='true')return;
    const fresh=old.cloneNode(true);fresh.dataset.b7Repair='true';fresh.tabIndex=0;fresh.setAttribute('role','button');fresh.setAttribute('aria-label','Open Your Recovery Review');old.replaceWith(fresh);
    const open=e=>{e?.preventDefault();e?.stopImmediatePropagation();fresh.classList.add('b7-active');activate('recovery-review');setTimeout(()=>$('#buildRecoveryReview')?.focus(),40)};
    fresh.addEventListener('click',open,true);fresh.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e)}});
  }

  /* ---------- Support Network: intercept before Build 4 heavy refresh ---------- */
  const relationshipLabels={friend:'Friend',family_member:'Family Member',sponsor:'Sponsor',lellee_coach:'Lellee Coach',counselor_therapist:'Counselor / Therapist',peer_support:'Peer Support',case_manager:'Case Manager',faith_spiritual:'Faith / Spiritual Support',other:'Support person'};
  async function loadSupportSafe(){
    const host=$('#supportPeopleList');if(!host)return;host.innerHTML='<div class="b7-safe-state">Loading your support people…</div>';
    try{
      const u=await currentUser(),c=client();if(!c||!u)throw new Error('Sign in to view your support network.');
      const {data,error}=await timeout(c.from('lellee_support_people').select('*').eq('user_id',u.id).eq('active',true).order('is_primary',{ascending:false}).order('created_at'),6500,'Support network');if(error)throw error;const rows=data||[];
      if(!rows.length){host.innerHTML='<div class="b7-safe-state">No support people saved yet.</div>';return}
      host.innerHTML=rows.map(r=>`<div class="approved-list-row"><span>♡</span><div><b>${esc(r.name)}</b><small>${esc(r.relationship==='other'?(r.relationship_other||'Support person'):(relationshipLabels[r.relationship]||'Support person'))}${r.is_primary?' · Primary':''}</small></div><div class="b4-row-actions">${r.phone?`<a class="approved-link" href="tel:${esc(r.phone)}">Call</a>`:''}</div></div>`).join('');
    }catch(err){console.error('Lellee repair support network:',err);host.innerHTML=`<div class="b7-safe-state error">${esc(err.message||'Support people could not be loaded.')}</div>`}
  }
  function interceptSupportNetwork(){
    document.addEventListener('click',e=>{const link=e.target.closest('[data-page="support-network"]');if(!link)return;e.preventDefault();e.stopImmediatePropagation();activate('support-network');loadSupportSafe()},true);
  }

  /* ---------- Recovery day: use local calendar day and DB recovery date ---------- */
  function inclusiveDay(dateStr){
    if(!dateStr)return null;const parts=String(dateStr).slice(0,10).split('-').map(Number);if(parts.length!==3||parts.some(Number.isNaN))return null;
    const start=Date.UTC(parts[0],parts[1]-1,parts[2]);const now=new Date();const today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());return Math.max(1,Math.floor((today-start)/86400000)+1);
  }
  async function repairRecoveryDay(){
    try{const u=await currentUser(),c=client();if(!c||!u)return;const {data,error}=await timeout(c.from('recovery_profiles').select('recovery_date').eq('user_id',u.id).maybeSingle(),5500,'Recovery date');if(error||!data?.recovery_date)return;const day=inclusiveDay(data.recovery_date);if(!day)return;$$('[data-recovery-day]').forEach(el=>el.textContent=String(day));const m=$('#recoveryDay');if(m)m.textContent=String(day);if(window.data)window.data.recoveryDate=data.recovery_date}catch(err){console.warn('Recovery day repair:',err.message)}
  }

  /* ---------- Language: save directly, persist locally, apply a safe UI dictionary ---------- */
  const ES={
    'Today':'Hoy','For You':'Para ti','My Recovery':'Mi recuperación','Daily':'Diario','Grow & Learn':'Crecer y aprender','Learn':'Aprender','Expert-Guided Practices':'Prácticas guiadas por expertos','Tools':'Herramientas','Recovery Paths':'Caminos de recuperación','Connect':'Conectar','Meetings':'Reuniones','Community':'Comunidad','Reflect & Track':'Reflexionar y seguir','Journal':'Diario personal','Progress':'Progreso','Calendar':'Calendario','Find Support':'Encontrar apoyo','Resources':'Recursos','Inbox':'Mensajes','Account':'Cuenta','Search':'Buscar','Lellee Plus':'Lellee Plus','Language & Accessibility':'Idioma y accesibilidad','Settings':'Configuración','Need Help Now?':'¿Necesitas ayuda ahora?','Get Help Now':'Obtener ayuda ahora','Sign out':'Cerrar sesión','Days in Recovery':'Días en recuperación','Recovery Momentum':'Impulso de recuperación','TODAY':'HOY','Check-In':'Registro','Daily Focus':'Enfoque diario','Gratitude':'Gratitud','Recovery Action':'Acción de recuperación','Evening Reflection':'Reflexión nocturna','Help Me Right Now':'Ayúdame ahora','Open Inbox':'Abrir mensajes','View Progress':'Ver progreso','Save Language & Accessibility':'Guardar idioma y accesibilidad','Interface language':'Idioma de la interfaz','Time zone':'Zona horaria','Text size':'Tamaño del texto','Reduced motion':'Reducir movimiento','Voice input':'Entrada por voz','Translate Lellee interface':'Traducir la interfaz de Lellee','Translate my own writing':'Traducir mis propios escritos','Language and privacy':'Idioma y privacidad'
  };
  function translateTextNode(node,toSpanish){
    if(node.nodeType!==Node.TEXT_NODE||!node.parentElement)return;const p=node.parentElement;if(['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION'].includes(p.tagName))return;const raw=node.nodeValue;const trimmed=raw.trim();if(!trimmed)return;
    if(!node.__b7en)node.__b7en=raw;
    if(!toSpanish){node.nodeValue=node.__b7en;return}
    const original=node.__b7en.trim();const translated=ES[original];if(translated)node.nodeValue=node.__b7en.replace(original,translated);
  }
  function applyLanguage(lang){
    const spanish=lang==='es';document.documentElement.lang=spanish?'es':'en';
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>translateTextNode(n,spanish));
    const select=$('#b6Language');if(select)select.value=lang;
  }
  async function getLanguagePreference(){
    try{const cached=JSON.parse(localStorage.getItem('lellee:platform-preferences:v6')||'null');if(cached?.language_code)return cached}catch{}
    try{const u=await currentUser(),c=client();if(c&&u){const {data,error}=await timeout(c.from('lellee_platform_preferences').select('*').eq('user_id',u.id).maybeSingle(),5000,'Language preference');if(!error&&data)return data}}catch{}
    return null;
  }
  async function saveLanguageSafe(button){
    if(button?.dataset.busy==='1')return;const lang=$('#b6Language')?.value||'en';const zone=$('#b6Timezone')?.value||Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Los_Angeles';
    const row={language_code:lang,locale_code:lang==='es'?'es-US':'en-US',timezone:zone,text_scale:Number($('#b6TextScale')?.value||1),reduced_motion:!!$('#b6ReducedMotion')?.checked,speech_to_text_enabled:$('#b6Voice')?.checked!==false,interface_translation_enabled:$('#b6InterfaceTranslation')?.checked!==false,user_content_translation_enabled:!!$('#b6UserTranslation')?.checked,updated_at:new Date().toISOString()};
    if(button){button.dataset.busy='1';button.classList.add('b7-saving');button.disabled=true}
    try{
      const u=await currentUser(),c=client();if(c&&u){const {error}=await timeout(c.from('lellee_platform_preferences').upsert({...row,user_id:u.id},{onConflict:'user_id'}),6500,'Language save');if(error)throw error}
      localStorage.setItem('lellee:platform-preferences:v6',JSON.stringify(row));applyLanguage(lang);const msg=$('#b6PreferenceMsg');if(msg){msg.textContent=lang==='es'?'Idioma y accesibilidad guardados.':'Language & Accessibility saved.';msg.className='b6-message success'}toast(lang==='es'?'Preferencias guardadas':'Preferences saved');
    }catch(err){console.error('Language save:',err);const msg=$('#b6PreferenceMsg');if(msg){msg.textContent=err.message||'Could not save preferences.';msg.className='b6-message error'}toast(err.message||'Could not save preferences.','error')}
    finally{if(button){button.dataset.busy='0';button.classList.remove('b7-saving');button.disabled=false}}
  }
  function repairLanguageButton(){replaceButton('#b6SavePreferences',(e,b)=>saveLanguageSafe(b))}
  async function restoreLanguage(){const p=await getLanguagePreference();if(!p)return;const lang=p.interface_translation_enabled===false?'en':(p.language_code||'en');applyLanguage(lang);setTimeout(()=>{if($('#b6Language'))$('#b6Language').value=lang},100)}

  /* ---------- Professional wording/pricing UI ---------- */
  function patchProfessionalCopy(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{
      if(!n.nodeValue)return;
      n.nodeValue=n.nodeValue.replace(/Paid required employee training/gi,'Required Lellee Coach training').replace(/completes paid required employee training/gi,'completes required Lellee Coach training');
    });
    $$('.b5-training-card').forEach(card=>{
      const text=card.textContent||'';if(!/Complete (Lellee Training|Professional) Bundle/i.test(text)&&!text.includes('$499'))return;
      const h=card.querySelector('h3');if(h)h.textContent='Complete Professional Bundle';
      if(!card.querySelector('.b7-bundle-note')){const note=document.createElement('div');note.className='b7-bundle-note';note.innerHTML='<b>Includes 2 months of Lellee Professional service.</b><br>After the included period: $29.99/month + 7% of Lellee-generated business. Lellee takes 0% of independently sourced clients.';card.appendChild(note)}
    });
    $$('.b5-empty').forEach(box=>{if(/Start an independent business profile before using the Social Media Agent/i.test(box.textContent)){const b=box.querySelector('button');if(b)b.textContent='Set Up Business Profile to Continue'}});
  }

  /* ---------- boot ---------- */
  let queued=false;
  function repairDynamic(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensureSettingsNav();repairExpertPractices();repairLearning();repairJournal();repairThenNow();repairStory();repairRecoveryReview();repairLanguageButton();patchProfessionalCopy()})}
  function init(){
    ensureSettingsNav();repairExpertPractices();addProfessionalPromo();repairLearning();repairJournal();repairThenNow();repairStory();repairRecoveryReview();interceptSupportNetwork();repairLanguageButton();patchProfessionalCopy();repairRecoveryDay();restoreLanguage();
    const content=$('.content');if(content)new MutationObserver(repairDynamic).observe(content,{childList:true,subtree:true});
    window.addEventListener('online',()=>toast('Back online'));
    console.info(`Lellee consolidated repair ${VERSION} loaded`);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,60));else setTimeout(init,60);
})();
