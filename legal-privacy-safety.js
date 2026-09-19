(()=>{
'use strict';
const q=s=>document.querySelector(s);
const qq=s=>[...document.querySelectorAll(s)];
const versions={terms:'terms-2026-09-18',privacy:'privacy-2026-09-18',consumer:'consumer-health-2026-09-18',safety:'safety-2026-09-18'};
const noticeSources=[
 {title:'Terms of Use',path:'/terms.html'},
 {title:'Privacy Policy',path:'/privacy.html'},
 {title:'Consumer Health Data Privacy Notice',path:'/consumer-health-privacy.html'},
 {title:'Safety Notice',path:'/safety.html'}
];
const reviewState={
 signup:{loaded:false,loading:false,complete:false,scroll:'#legalSignupScroll',progress:'#legalSignupProgress',check:'#legalSignupAgree'},
 gate:{loaded:false,loading:false,complete:false,scroll:'#legalGateScroll',progress:'#legalGateProgress',check:'#legalGateAgree'}
};
let gateEnabled=false;

function toast(m,bad=false){const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},3200)}}
function updateNoticeReview(kind){
 const state=reviewState[kind],scroll=q(state.scroll),check=q(state.check),progress=q(state.progress);
 if(!state.loaded||state.complete||!scroll||!check)return;
 const atEnd=Math.ceil(scroll.scrollTop+scroll.clientHeight)>=scroll.scrollHeight-4;
 if(!atEnd)return;
 state.complete=true;check.disabled=false;
 if(progress){progress.textContent='All four notices reviewed. You may now check the acknowledgment.';progress.classList.add('complete')}
}
async function loadNoticeGroup(kind){
 const state=reviewState[kind],scroll=q(state.scroll),check=q(state.check),progress=q(state.progress);
 if(!state||state.loaded||state.loading||!scroll||!check)return;
 state.loading=true;check.disabled=true;check.checked=false;
 if(progress)progress.textContent='Loading the approved legal notices…';
 try{
  const sections=[];
  for(const notice of noticeSources){
   const response=await fetch(notice.path,{credentials:'same-origin',cache:'no-store'});
   if(!response.ok)throw new Error('Notice failed to load');
   const doc=new DOMParser().parseFromString(await response.text(),'text/html'),source=doc.querySelector('main');
   if(!source)throw new Error('Notice content is unavailable');
   const section=document.createElement('section');section.className='legal-review-document';
   const heading=document.createElement('h2');heading.className='legal-review-document-title';
   const link=document.createElement('a');link.href=notice.path;link.target='_blank';link.rel='noopener';link.textContent=notice.title;
   heading.appendChild(link);section.appendChild(heading);
   Array.from(source.children).forEach(node=>section.appendChild(node.cloneNode(true)));sections.push(section);
  }
  scroll.replaceChildren(...sections);
  const end=document.createElement('p');end.className='legal-review-end';end.textContent='End of legal notices';scroll.appendChild(end);
  state.loaded=true;scroll.scrollTop=0;
  if(progress)progress.textContent='Scroll through all four notices to enable the acknowledgment.';
  scroll.addEventListener('scroll',()=>updateNoticeReview(kind),{passive:true});requestAnimationFrame(()=>updateNoticeReview(kind));
 }catch(_){
  scroll.innerHTML='<p>The notices could not load. Refresh this page and try again.</p><p><a href="/terms.html" target="_blank" rel="noopener">Terms of Use</a></p><p><a href="/privacy.html" target="_blank" rel="noopener">Privacy Policy</a></p><p><a href="/consumer-health-privacy.html" target="_blank" rel="noopener">Consumer Health Data Privacy Notice</a></p><p><a href="/safety.html" target="_blank" rel="noopener">Safety Notice</a></p>';
  if(progress)progress.textContent='The acknowledgment will remain unavailable until the notices load.';
 }finally{state.loading=false}
}

async function loadGateSetting(){
 if(typeof sb==='undefined')return;
 const {data}=await sb.from('app_public_settings').select('value').eq('key','legal_launch_gate_enabled').maybeSingle();
 gateEnabled=data?.value==='true';
 const signup=q('#legalSignupNotice');
 if(signup){const creating=q('#authSubmit')?.textContent?.toLowerCase().includes('create');signup.classList.toggle('hidden',!creating);if(creating)loadNoticeGroup('signup')}
}

async function gateExistingUser(){
 if(!gateEnabled||typeof currentUser==='undefined'||!currentUser)return;
 const {data:a}=await sb.from('legal_acceptances').select('id').eq('user_id',currentUser.id)
 .eq('terms_version',versions.terms).eq('privacy_version',versions.privacy)
 .eq('consumer_health_version',versions.consumer).eq('safety_version',versions.safety).maybeSingle();
 q('#legalAcceptanceOverlay')?.classList.toggle('hidden',!!a);if(!a)loadNoticeGroup('gate');
}

async function acceptLegal(){
 const check=q('#legalGateAgree'),status=q('#legalGateStatus');
 if(check?.disabled){if(status)status.textContent='Scroll to the end of all four notices first.';q('#legalGateScroll')?.focus();return}
 if(!check?.checked){if(status)status.textContent='Check the acknowledgment before continuing.';check?.focus();return}
 const {error}=await sb.from('legal_acceptances').insert({user_id:currentUser.id,terms_version:versions.terms,privacy_version:versions.privacy,consumer_health_version:versions.consumer,safety_version:versions.safety,adult_confirmed:true,user_agent:navigator.userAgent});
 if(error){if(status)status.textContent=error.message;return}
 q('#legalAcceptanceOverlay')?.classList.add('hidden');toast('Privacy and safety acceptance saved.');
}

function nice(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
async function loadRequests(){
 if(typeof currentUser==='undefined'||!currentUser||typeof sb==='undefined')return;
 const {data,error}=await sb.from('privacy_requests').select('id,request_type,status,submitted_at').eq('user_id',currentUser.id).order('submitted_at',{ascending:false}).limit(8);
 const box=q('#legalPrivacyRequestList');if(!box)return;
 if(error){box.innerHTML='<div class="approved-resource-empty">Request history unavailable.</div>';return}
 box.innerHTML=(data||[]).length?(data||[]).map(r=>`<div class="legal-request-row"><b>${nice(r.request_type)}</b><small>${nice(r.status)} · ${new Date(r.submitted_at).toLocaleDateString()}</small></div>`).join(''):'<div class="approved-resource-empty">No privacy requests submitted yet.</div>';
}
async function submitRequest(){
 if(typeof currentUser==='undefined'||!currentUser)return toast('Please sign in first.',true);
 const type=q('#legalPrivacyRequestType')?.value,details=q('#legalPrivacyRequestDetails')?.value.trim()||null,status=q('#legalPrivacyRequestStatus');
 const {error}=await sb.from('privacy_requests').insert({user_id:currentUser.id,request_type:type,details});
 if(error){if(status)status.textContent=error.message;return}
 if(status)status.textContent='Submitted. Lellee may verify identity before completing the request.';
 q('#legalPrivacyRequestDetails').value='';loadRequests();
}

q('#legalAcceptContinue')?.addEventListener('click',acceptLegal);
q('#submitLegalPrivacyRequest')?.addEventListener('click',submitRequest);
q('#authToggle')?.addEventListener('click',()=>setTimeout(loadGateSetting,0));
q('#authForm')?.addEventListener('submit',e=>{
 const creating=q('#authSubmit')?.textContent?.toLowerCase().includes('create'),check=q('#legalSignupAgree');
 if(creating&&(check?.disabled||!check?.checked)){
  e.preventDefault();e.stopImmediatePropagation();
  q('#authMsg').textContent=check?.disabled?'Scroll to the end of the grouped legal notices first.':'Check the legal acknowledgment before creating your account.';
  q('#authMsg').className='auth-msg error';if(check?.disabled)q('#legalSignupScroll')?.focus();else check?.focus();
 }
},true);

if(typeof showPage==='function'){
 const oldShow=showPage;
 showPage=function(name){oldShow(name);if(name==='privacy-center')loadRequests()}
}

let tries=0;const timer=setInterval(async()=>{tries++;await loadGateSetting();if(typeof currentUser!=='undefined'&&currentUser){clearInterval(timer);gateExistingUser();loadRequests()}else if(tries>40)clearInterval(timer)},200);
})();