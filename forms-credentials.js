
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let isAdmin=false,coachBusiness=null,organization=null;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,status='',klass=''){
 return `<div class="forms-row ${klass}"><div class="forms-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`;
}
async function checkAdmin(){
 if(typeof currentUser==='undefined'||!currentUser){isAdmin=false;return false;}
 try{const {data,error}=await sb.rpc('is_lellee_admin');isAdmin=!error&&data===true}catch(_){isAdmin=false}
 return isAdmin;
}

function setMyFormsTab(tab){qa('[data-my-forms-tab]').forEach(b=>b.classList.toggle('active',b.dataset.myFormsTab===tab));['assigned','completed','surveys'].forEach(x=>q('#myFormsPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadMyForms(){
 const d=await rpc('get_my_forms_summary');if(!d)return;
 const s=d.summary||{};
 q('#formsDue').textContent=s.due||0;q('#formsInProgress').textContent=s.in_progress||0;q('#formsCompleted').textContent=s.completed||0;q('#formsSurveys').textContent=s.surveys||0;
 q('#myFormsAssignedList').innerHTML=(d.assigned||[]).map(x=>row('▤',x.title,`${x.form_type} · ${x.due_label||'no due date'}`,x.status,x.due_status==='overdue'?'attention':'' )).join('')||'<div class="approved-resource-empty">No assigned forms.</div>';
 q('#myFormsCompletedList').innerHTML=(d.completed||[]).map(x=>row('✓',x.title,`${x.form_type} · ${new Date(x.completed_at).toLocaleDateString()}`,'completed','ok')).join('')||'<div class="approved-resource-empty">No completed forms yet.</div>';
 q('#myFormsSurveyList').innerHTML=(d.surveys||[]).map(x=>row('♡',x.title,x.description||'Optional survey',x.status)).join('')||'<div class="approved-resource-empty">No optional surveys.</div>';
}

async function loadVault(){
 const d=await rpc('get_my_document_vault_summary');if(!d)return;
 const s=d.summary||{};
 q('#vaultDocuments').textContent=s.documents||0;q('#vaultExpiring').textContent=s.expiring||0;q('#vaultShared').textContent=s.shared||0;q('#vaultUploads').textContent=s.uploads_enabled?'On':'Off';
 q('#vaultDocumentList').innerHTML=(d.documents||[]).map(x=>row('◇',x.label,`${x.document_type} · ${x.status}${x.expires_on?' · expires '+x.expires_on:''}`,x.share_status||'private',x.expires_soon?'attention':'' )).join('')||'<div class="approved-resource-empty">No document records yet.</div>';
}
async function addVaultDocument(){
 const label=prompt('Document label (example: Driver license):');if(!label)return;
 const type=prompt('Document type: identity, benefits, housing, employment, medical, legal, education, other','other')||'other';
 const exp=prompt('Expiration date YYYY-MM-DD (optional):','')||null;
 const {error}=await sb.from('document_vault_items').insert({user_id:currentUser.id,label,document_type:type,status:'current',expires_on:exp||null});
 if(error)return toast(error.message,true);loadVault();
}

function setCoachCredTab(tab){qa('[data-coach-cred-tab]').forEach(b=>b.classList.toggle('active',b.dataset.coachCredTab===tab));['credentials','training','intake'].forEach(x=>q('#coachCredPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadCoachCredentials(){
 const {data:b}=await sb.from('coach_businesses').select('id,business_name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();coachBusiness=b||null;if(!b)return;
 q('#coachCredentialName').textContent=b.public_name||b.business_name;
 const d=await rpc('get_coach_credential_summary',{p_business_id:b.id});if(!d)return;
 const s=d.summary||{};
 q('#coachCredCount').textContent=s.credentials||0;q('#coachCredVerified').textContent=s.verified||0;q('#coachCredTraining').textContent=s.training||0;q('#coachCredForms').textContent=s.intake_forms||0;
 q('#coachCredentialList').innerHTML=(d.credentials||[]).map(x=>row('C',x.label,`${x.credential_type} · ${x.issuer||'issuer not listed'}`,x.verification_status,x.verification_status==='verified'?'ok':x.verification_status==='expired'?'attention':'' )).join('')||'<div class="approved-resource-empty">No credentials entered.</div>';
 q('#coachTrainingList').innerHTML=(d.training||[]).map(x=>row('T',x.title,`${x.status}${x.completed_at?' · '+new Date(x.completed_at).toLocaleDateString():''}`,x.hours?x.hours+' hrs':'')).join('')||'<div class="approved-resource-empty">No training records.</div>';
 q('#coachIntakeFormList').innerHTML=(d.intake_forms||[]).map(x=>row('▤',x.title,`${x.status} · ${x.assignment_count} assignments`,x.form_type)).join('')||'<div class="approved-resource-empty">No client-intake forms configured.</div>';
}
async function addCoachCredential(){
 if(!coachBusiness)return;
 const label=prompt('Credential/certification name:');if(!label)return;
 const type=prompt('Type: certification, license, training, education, lived_experience, other','certification')||'certification';
 const issuer=prompt('Issuer/organization (optional):','')||null;
 const {error}=await sb.from('professional_credential_claims').insert({business_id:coachBusiness.id,user_id:currentUser.id,label,credential_type:type,issuer,verification_status:'self_reported'});
 if(error)return toast(error.message,true);loadCoachCredentials();
}

function setOrgFormsTab(tab){qa('[data-org-forms-tab]').forEach(b=>b.classList.toggle('active',b.dataset.orgFormsTab===tab));['assignments','surveys','templates'].forEach(x=>q('#orgFormsPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadOrgForms(){
 const {data:o}=await sb.from('organizations').select('id,name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();organization=o||null;if(!o)return;
 q('#orgFormsName').textContent=o.public_name||o.name;
 const d=await rpc('get_organization_forms_summary',{p_organization_id:o.id});if(!d)return;
 const s=d.summary||{};
 q('#orgFormsAssigned').textContent=s.assigned||0;q('#orgFormsCompleted').textContent=s.completed||0;q('#orgFormsSurveys').textContent=s.surveys||0;q('#orgFormsTemplates').textContent=s.templates||0;
 q('#orgFormAssignmentList').innerHTML=(d.assignments||[]).map(x=>row('▤',x.form_title,`${x.status} · ${x.assigned_count} assigned`,x.completed_count+' completed')).join('')||'<div class="approved-resource-empty">No organization assignments.</div>';
 q('#orgSurveyList').innerHTML=(d.surveys||[]).map(x=>row('♡',x.title,`${x.status} · ${x.response_count} responses`,x.audience_type)).join('')||'<div class="approved-resource-empty">No survey campaigns.</div>';
 q('#orgFormTemplateList').innerHTML=(d.templates||[]).map(x=>row('T',x.title,x.form_type,x.status)).join('')||'<div class="approved-resource-empty">No organization templates.</div>';
}

function setFormsStudioTab(tab){qa('[data-forms-studio-tab]').forEach(b=>b.classList.toggle('active',b.dataset.formsStudioTab===tab));['forms','assessments','surveys','privacy'].forEach(x=>q('#formsStudioPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadFormsStudio(){
 if(!await checkAdmin())return;
 const d=await rpc('get_forms_studio_summary');if(!d)return;
 const s=d.summary||{};
 q('#formsStudioForms').textContent=s.forms||0;q('#formsStudioQuestions').textContent=s.questions||0;q('#formsStudioAssignments').textContent=s.assignments||0;q('#formsStudioResponses').textContent=s.responses||0;
 q('#formsStudioFormList').innerHTML=(d.forms||[]).map(x=>row('▤',x.title,`${x.form_type} · v${x.current_version}`,x.status)).join('');
 q('#formsStudioAssessmentList').innerHTML=(d.assessments||[]).map(x=>row('A',x.title,`${x.scoring_mode} · ${x.status}`,x.diagnostic_use_allowed?'diagnostic':'non-diagnostic')).join('')||'<div class="approved-resource-empty">No assessment instruments.</div>';
 q('#formsStudioSurveyList').innerHTML=(d.surveys||[]).map(x=>row('♡',x.title,`${x.status} · ${x.audience_type}`,x.response_count+' responses')).join('')||'<div class="approved-resource-empty">No survey campaigns.</div>';
 q('#formsStudioPrivacyList').innerHTML=(d.guardrails||[]).map(x=>`<article class="forms-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addForm(){
 if(!await checkAdmin())return toast('Administrator access required.',true);
 const title=prompt('Form title:');if(!title)return;
 const type=prompt('Type: intake, checkin, survey, acknowledgment, consent, assessment, feedback','intake')||'intake';
 const {error}=await sb.from('form_definitions').insert({title,form_type:type,status:'draft',created_by:currentUser.id,privacy_mode:'private_user'});
 if(error)return toast(error.message,true);loadFormsStudio();
}

function setCredentialTab(tab){qa('[data-credential-tab]').forEach(b=>b.classList.toggle('active',b.dataset.credentialTab===tab));['claims','types','training','requirements'].forEach(x=>q('#credentialPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}

function ensureCoachTrainingAdminUi(){
 const page=q('#page-credentialing-center');
 if(!page)return;
 const head=page.querySelector('.approved-inner-head');
 const h2=head?.querySelector('h2');
 const p=head?.querySelector('p');
 const kicker=head?.querySelector('.approved-kicker');
 if(kicker)kicker.textContent='ADMIN · COACH TRAINING & CREDENTIALING';
 if(h2)h2.textContent='Coach training, readiness and credentialing.';
 if(p)p.textContent='Review the Lellee training catalog, modules, enrollments, progress, competency scores, credential claims and readiness requirements.';
 const panel=q('#credentialPanelTraining');
 if(panel&&!q('#coachTrainingAdminSummary')){
   const style=document.createElement('style');style.id='coachTrainingAdminStyle';style.textContent=`
    .coach-training-admin-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:0 0 12px}.coach-training-admin-metrics article{border:1px solid #e6e0e9;background:#fff;border-radius:9px;padding:10px}.coach-training-admin-metrics b{display:block;font-size:1rem;color:#65409a}.coach-training-admin-metrics small{font-size:.56rem;color:#777}.coach-training-admin-section{margin:12px 0}.coach-training-admin-section h4{font-size:.68rem;margin:0 0 7px}.coach-training-admin-actions{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 10px}@media(max-width:760px){.coach-training-admin-metrics{grid-template-columns:1fr 1fr}.coach-training-admin-metrics article:last-child{grid-column:1/-1}}`;
   document.head.appendChild(style);
   panel.insertAdjacentHTML('afterbegin',`<div id="coachTrainingAdminSummary"></div><div class="coach-training-admin-actions"><button class="approved-small-action" id="openLelleeTrainingCenter" type="button">Open Training Center</button><button class="approved-small-action" id="refreshCoachTrainingAdmin" type="button">Refresh Training Data</button></div><section class="coach-training-admin-section"><h4>Lellee course catalog</h4><div id="coachTrainingCatalogList"></div></section><section class="coach-training-admin-section"><h4>Enrollments</h4><div id="coachTrainingEnrollmentList"></div></section><section class="coach-training-admin-section"><h4>Recent competency progress</h4><div id="coachTrainingProgressList"></div></section>`);
   q('#openLelleeTrainingCenter')?.addEventListener('click',()=>{if(typeof showPage==='function')showPage('training-center')});
   q('#refreshCoachTrainingAdmin')?.addEventListener('click',loadCoachTrainingAdmin);
 }
}

async function loadCoachTrainingAdmin(){
 if(!await checkAdmin())return;
 ensureCoachTrainingAdminUi();
 const [catalogRes,moduleRes,enrollRes,progressRes]=await Promise.all([
   sb.from('lellee_training_catalog').select('course_key,display_name,audience,category,service_area,estimated_hours,sequence,active').eq('active',true).order('sequence'),
   sb.from('lellee_training_modules').select('id,course_key,module_key,title,sequence,required_score,required,active').eq('active',true).order('course_key').order('sequence'),
   sb.from('lellee_training_enrollments').select('id,user_id,course_key,learner_type,status,payment_status,paid_percent,current_unlock_percent,started_at,completed_at,created_at').order('created_at',{ascending:false}).limit(100),
   sb.from('lellee_training_progress').select('id,enrollment_id,user_id,module_id,status,score,attempts,completed_at,updated_at').order('updated_at',{ascending:false}).limit(200)
 ]);
 const errors=[catalogRes.error,moduleRes.error,enrollRes.error,progressRes.error].filter(Boolean);
 if(errors.length){console.warn('Coach Training Admin',errors);q('#coachTrainingAdminSummary').innerHTML='<div class="approved-resource-empty">Training administration data could not be fully loaded.</div>';return}
 const catalog=catalogRes.data||[],modules=moduleRes.data||[],enrollments=enrollRes.data||[],progress=progressRes.data||[];
 const passed=progress.filter(x=>x.status==='passed');
 const scores=passed.map(x=>Number(x.score)).filter(Number.isFinite);
 const avg=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
 q('#coachTrainingAdminSummary').innerHTML=`<div class="coach-training-admin-metrics"><article><b>${catalog.length}</b><small>active courses</small></article><article><b>${modules.length}</b><small>active modules</small></article><article><b>${enrollments.length}</b><small>enrollments</small></article><article><b>${passed.length}</b><small>modules passed</small></article><article><b>${avg}%</b><small>average passing score</small></article></div>`;
 const moduleCount={};modules.forEach(m=>moduleCount[m.course_key]=(moduleCount[m.course_key]||0)+1);
 q('#coachTrainingCatalogList').innerHTML=catalog.map(c=>row('L',c.display_name,`${c.audience||'all'} · ${c.category||'training'} · ${moduleCount[c.course_key]||0} modules`,c.estimated_hours?`${c.estimated_hours} hrs`:'active','ok')).join('')||'<div class="approved-resource-empty">No active courses.</div>';
 q('#coachTrainingEnrollmentList').innerHTML=enrollments.map(e=>row('E',catalog.find(c=>c.course_key===e.course_key)?.display_name||e.course_key,`${e.learner_type||'learner'} · learner ${String(e.user_id).slice(0,8)} · ${e.payment_status||'n/a'} · ${Number(e.current_unlock_percent||0)}% unlocked`,e.status||'unknown',e.status==='completed'?'ok':'' )).join('')||'<div class="approved-resource-empty">No training enrollments yet.</div>';
 const moduleById=Object.fromEntries(modules.map(m=>[m.id,m]));
 q('#coachTrainingProgressList').innerHTML=progress.slice(0,50).map(x=>{const m=moduleById[x.module_id];return row(x.status==='passed'?'✓':'•',m?.title||'Training module',`${m?.course_key||'course'} · learner ${String(x.user_id).slice(0,8)} · ${x.attempts||0} attempt(s)`,x.score==null?x.status:`${Number(x.score)}%`,x.status==='passed'?'ok':x.status==='failed'?'attention':'')}).join('')||'<div class="approved-resource-empty">No module progress yet.</div>';
}

async function loadCredentialing(){
 if(!await checkAdmin())return;
 ensureCoachTrainingAdminUi();
 const d=await rpc('get_credentialing_center_summary');if(!d)return;
 const s=d.summary||{};
 q('#credentialClaims').textContent=s.claims||0;q('#credentialPending').textContent=s.pending||0;q('#credentialVerified').textContent=s.verified||0;q('#credentialExpiring').textContent=s.expiring||0;
 q('#credentialClaimList').innerHTML=(d.claims||[]).map(x=>row('C',x.label,`${x.credential_type} · ${x.owner_label}`,x.verification_status,x.verification_status==='verified'?'ok':'attention')).join('')||'<div class="approved-resource-empty">No credential claims.</div>';
 q('#credentialTypeList').innerHTML=(d.types||[]).map(x=>row('T',x.label,x.description,x.status)).join('');
 q('#credentialTrainingList').innerHTML=(d.training||[]).map(x=>row('L',x.title,`${x.delivery_type} · ${x.status}`,x.required_hours?x.required_hours+' hrs':'')).join('');
 q('#credentialRequirementList').innerHTML=(d.requirements||[]).map(x=>row('R',x.label,`${x.applies_to} · ${x.status}`,x.required?'required':'optional')).join('');
 await loadCoachTrainingAdmin();
}

function relabelAdminCoachTraining(){
 qa('#page-admin .admin-home-tool-row>span').forEach(el=>{if(el.textContent.trim()==='Credentialing')el.textContent='Coach Training & Credentialing'});
}

document.addEventListener('click',e=>{
 if(e.target.closest('[data-admin-home-group="people-partners"]'))setTimeout(relabelAdminCoachTraining,0);
},true);

qa('[data-my-forms-tab]').forEach(b=>b.onclick=()=>setMyFormsTab(b.dataset.myFormsTab));
qa('[data-coach-cred-tab]').forEach(b=>b.onclick=()=>setCoachCredTab(b.dataset.coachCredTab));
qa('[data-org-forms-tab]').forEach(b=>b.onclick=()=>setOrgFormsTab(b.dataset.orgFormsTab));
qa('[data-forms-studio-tab]').forEach(b=>b.onclick=()=>setFormsStudioTab(b.dataset.formsStudioTab));
qa('[data-credential-tab]').forEach(b=>b.onclick=()=>{setCredentialTab(b.dataset.credentialTab);if(b.dataset.credentialTab==='training')loadCoachTrainingAdmin()});
q('#vaultAddDocument')?.addEventListener('click',addVaultDocument);
q('#coachAddCredential')?.addEventListener('click',addCoachCredential);
q('#formsStudioAddForm')?.addEventListener('click',addForm);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){
   old(name);
   if(name==='my-forms')loadMyForms();
   if(name==='document-vault')loadVault();
   if(name==='coach-credentials')loadCoachCredentials();
   if(name==='organization-forms')loadOrgForms();
   if(name==='forms-studio')loadFormsStudio();
   if(name==='credentialing-center')loadCredentialing();
   if(name==='admin')setTimeout(relabelAdminCoachTraining,0);
 };
}
setTimeout(relabelAdminCoachTraining,800);
})();
