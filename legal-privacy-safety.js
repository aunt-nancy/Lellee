(()=>{
'use strict';
const q=s=>document.querySelector(s);
const qq=s=>[...document.querySelectorAll(s)];
const versions={terms:'terms-2026-08-counsel',privacy:'privacy-2026-08-counsel',consumer:'consumer-health-2026-08-counsel',safety:'safety-2026-08-counsel'};
let gateEnabled=false;

function toast(m,bad=false){const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},3200)}}

async function loadGateSetting(){
 if(typeof sb==='undefined')return;
 const {data}=await sb.from('app_public_settings').select('value').eq('key','legal_launch_gate_enabled').maybeSingle();
 gateEnabled=data?.value==='true';
 const signup=q('#legalSignupNotice');
 if(signup){
   const creating=q('#authSubmit')?.textContent?.toLowerCase().includes('create');
   signup.classList.toggle('hidden',!(gateEnabled&&creating));
 }
}

async function gateExistingUser(){
 if(!gateEnabled||typeof currentUser==='undefined'||!currentUser)return;
 const {data:a}=await sb.from('legal_acceptances').select('id').eq('user_id',currentUser.id)
 .eq('terms_version',versions.terms).eq('privacy_version',versions.privacy)
 .eq('consumer_health_version',versions.consumer).eq('safety_version',versions.safety).maybeSingle();
 q('#legalAcceptanceOverlay')?.classList.toggle('hidden',!!a);
}

async function acceptLegal(){
 if(!q('#legalGateAdult')?.checked||!q('#legalGateAgree')?.checked||!q('#legalGateSafety')?.checked){q('#legalGateStatus').textContent='Please confirm all three items.';return}
 const {error}=await sb.from('legal_acceptances').insert({user_id:currentUser.id,terms_version:versions.terms,privacy_version:versions.privacy,consumer_health_version:versions.consumer,safety_version:versions.safety,adult_confirmed:true,user_agent:navigator.userAgent});
 if(error){q('#legalGateStatus').textContent=error.message;return}
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

// If legal gate is enabled later, show confirmations on signup without modifying legacy auth code.
q('#authToggle')?.addEventListener('click',()=>setTimeout(loadGateSetting,0));
q('#authForm')?.addEventListener('submit',e=>{
 const creating=q('#authSubmit')?.textContent?.toLowerCase().includes('create');
 if(gateEnabled&&creating&&(!q('#legalSignupAdult')?.checked||!q('#legalSignupAgree')?.checked||!q('#legalSignupSafety')?.checked)){
   e.preventDefault();e.stopImmediatePropagation();
   q('#authMsg').textContent='Please confirm age, Terms, Privacy, Consumer Health Data and Safety notices before creating an account.';
   q('#authMsg').className='auth-msg error';
 }
},true);

if(typeof showPage==='function'){
 const oldShow=showPage;
 showPage=function(name){oldShow(name);if(name==='privacy-center')loadRequests()}
}

let tries=0;const timer=setInterval(async()=>{tries++;await loadGateSetting();if(typeof currentUser!=='undefined'&&currentUser){clearInterval(timer);gateExistingUser();loadRequests()}else if(tries>40)clearInterval(timer)},200);
})();