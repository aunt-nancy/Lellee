
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
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
async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}

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
 const title=prompt('Form title:');if(!title)return;
 const type=prompt('Type: intake, checkin, survey, acknowledgment, consent, assessment, feedback','intake')||'intake';
 const {error}=await sb.from('form_definitions').insert({title,form_type:type,status:'draft',created_by:currentUser.id,privacy_mode:'private_user'});
 if(error)return toast(error.message,true);loadFormsStudio();
}

function setCredentialTab(tab){qa('[data-credential-tab]').forEach(b=>b.classList.toggle('active',b.dataset.credentialTab===tab));['claims','types','training','requirements'].forEach(x=>q('#credentialPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadCredentialing(){
 if(!await checkAdmin())return;
 const d=await rpc('get_credentialing_center_summary');if(!d)return;
 const s=d.summary||{};
 q('#credentialClaims').textContent=s.claims||0;q('#credentialPending').textContent=s.pending||0;q('#credentialVerified').textContent=s.verified||0;q('#credentialExpiring').textContent=s.expiring||0;
 q('#credentialClaimList').innerHTML=(d.claims||[]).map(x=>row('C',x.label,`${x.credential_type} · ${x.owner_label}`,x.verification_status,x.verification_status==='verified'?'ok':'attention')).join('')||'<div class="approved-resource-empty">No credential claims.</div>';
 q('#credentialTypeList').innerHTML=(d.types||[]).map(x=>row('T',x.label,x.description,x.status)).join('');
 q('#credentialTrainingList').innerHTML=(d.training||[]).map(x=>row('L',x.title,`${x.delivery_type} · ${x.status}`,x.required_hours?x.required_hours+' hrs':'')).join('');
 q('#credentialRequirementList').innerHTML=(d.requirements||[]).map(x=>row('R',x.label,`${x.applies_to} · ${x.status}`,x.required?'required':'optional')).join('');
}

qa('[data-my-forms-tab]').forEach(b=>b.onclick=()=>setMyFormsTab(b.dataset.myFormsTab));
qa('[data-coach-cred-tab]').forEach(b=>b.onclick=()=>setCoachCredTab(b.dataset.coachCredTab));
qa('[data-org-forms-tab]').forEach(b=>b.onclick=()=>setOrgFormsTab(b.dataset.orgFormsTab));
qa('[data-forms-studio-tab]').forEach(b=>b.onclick=()=>setFormsStudioTab(b.dataset.formsStudioTab));
qa('[data-credential-tab]').forEach(b=>b.onclick=()=>setCredentialTab(b.dataset.credentialTab));
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
 };
}
})();
