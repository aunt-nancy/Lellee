
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let isAdmin=false,organization=null;

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

// Coach-facing credential, training, certificate, and intake interactions are
// owned by coach-operations-completion.js. Keep this bundle focused on shared
// forms/vault features and the administrator credentialing center so the two
// runtimes do not fetch or render the same coach page concurrently.

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

function setCredentialTab(tab){qa('[data-credential-tab]').forEach(b=>b.classList.toggle('active',b.dataset.credentialTab===tab));['claims','types','training','certificates','requirements'].forEach(x=>q('#credentialPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}

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
   panel.insertAdjacentHTML('afterbegin',`<div id="coachTrainingAdminSummary"></div><div class="coach-training-admin-actions"><button class="approved-small-action" id="openLelleeTrainingCenter" type="button">Open Training Center</button><button class="approved-small-action" id="refreshCoachTrainingAdmin" type="button">Refresh Training Data</button><button class="approved-small-action" id="openEthicsReviewCenter" type="button">Ethics Review Center</button></div><section class="coach-training-admin-section hidden" id="coachEthicsReviewCenter"><h4>Ongoing ethics microlearning review</h4><div id="coachEthicsReviewSummary"></div><div id="coachEthicsReviewList"></div></section><section class="coach-training-admin-section"><h4>Lellee course catalog</h4><div id="coachTrainingCatalogList"></div></section><section class="coach-training-admin-section"><h4>Enrollments</h4><div id="coachTrainingEnrollmentList"></div></section><section class="coach-training-admin-section"><h4>Recent competency progress</h4><div id="coachTrainingProgressList"></div></section>`);
   q('#openLelleeTrainingCenter')?.addEventListener('click',()=>{if(typeof showPage==='function')showPage('training-center')});
   q('#refreshCoachTrainingAdmin')?.addEventListener('click',loadCoachTrainingAdmin);
   q('#openEthicsReviewCenter')?.addEventListener('click',()=>{q('#coachEthicsReviewCenter')?.classList.remove('hidden');loadEthicsReviewCenter()});
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


let ethicsReviewData=null;
async function loadEthicsReviewCenter(){
 if(!await checkAdmin())return;
 const d=await rpc('get_admin_coach_ethics_review_center');if(!d)return;
 ethicsReviewData=d;
 const s=d.summary||{},settings=d.settings||{};
 q('#coachEthicsReviewSummary').innerHTML=`<div class="coach-training-admin-metrics"><article><b>${s.modules||0}</b><small>ethics modules</small></article><article><b>${s.pending||0}</b><small>pending review</small></article><article><b>${s.changes_required||0}</b><small>changes required</small></article><article><b>${s.approved||0}</b><small>approved</small></article><article><b>${settings.quiz_pass_percent||90}%</b><small>minimum quiz score</small></article></div>`;
 q('#coachEthicsReviewList').innerHTML=(d.modules||[]).map(m=>{
   const reviews=m.reviews||[];
   const badges=reviews.map(r=>`<span class="coach-ethics-review-badge ${r.status}">${esc(r.review_domain.replaceAll('_',' '))}: ${esc(r.status.replaceAll('_',' '))}</span>`).join('');
   return `<article class="forms-admin-review ${m.review_status==='approved'?'ok':m.review_status==='changes_required'?'attention':''}"><div>${row(String(m.sequence),m.title,`${m.video_minutes} min · ${m.estimated_word_count||0} words · ${(m.quiz||[]).length} questions`,m.review_status,m.review_status==='approved'?'ok':'attention')}</div><div class="coach-ethics-review-badges">${badges}</div><div class="forms-admin-actions"><button data-admin-open-ethics-module="${m.id}">Review module</button></div></article>`;
 }).join('')||'<div class="approved-resource-empty">No ethics modules.</div>';
 if(!q('#coachEthicsReviewStyle')){
   const st=document.createElement('style');st.id='coachEthicsReviewStyle';st.textContent='.coach-ethics-review-badges{display:flex;gap:5px;flex-wrap:wrap;margin:5px 0 8px}.coach-ethics-review-badge{font-size:.55rem;padding:4px 7px;border-radius:999px;background:#eee}.coach-ethics-review-badge.approved{background:#e7f4ee;color:#075b4d}.coach-ethics-review-badge.changes_required{background:#fae9ed;color:#8d3346}.coach-ethics-review-dialog{width:min(960px,92vw);max-height:86vh;padding:0;border:0;border-radius:14px}.coach-ethics-review-dialog::backdrop{background:rgba(20,30,35,.55)}.ethics-review-shell{padding:22px;color:#173047}.ethics-review-script{white-space:pre-wrap;max-height:300px;overflow:auto;border:1px solid #e2e6e4;background:#fbfaf7;padding:15px;border-radius:10px;font-size:.76rem;line-height:1.55}.ethics-review-question{border:1px solid #e4e4e4;border-radius:9px;padding:10px;margin:7px 0}.ethics-review-question small{display:block;color:#667;margin-top:4px}.ethics-review-domain{border-top:1px solid #ddd;padding:10px 0}.ethics-review-actions{display:flex;gap:7px;flex-wrap:wrap}.ethics-review-evidence{background:#f2f6f4;padding:12px;border-radius:9px;font-size:.72rem;line-height:1.5;margin:10px 0}';document.head.appendChild(st);
 }
}
function ensureEthicsReviewDialog(){
 let d=q('#coachEthicsReviewDialog');if(d)return d;
 d=document.createElement('dialog');d.id='coachEthicsReviewDialog';d.className='coach-ethics-review-dialog';d.innerHTML='<div class="ethics-review-shell" id="coachEthicsReviewDialogBody"></div>';document.body.appendChild(d);return d;
}
function openEthicsModuleReview(id){
 const m=(ethicsReviewData?.modules||[]).find(x=>x.id===id);if(!m)return;
 const d=ensureEthicsReviewDialog(),body=q('#coachEthicsReviewDialogBody');
 const reviews=m.reviews||[],quiz=m.quiz||[];
 body.innerHTML=`<div class="admin-cert-preview-head"><span class="approved-kicker">ETHICS MODULE ${m.sequence} · HUMAN REVIEW REQUIRED</span><h3>${esc(m.title)}</h3><div>${esc(m.description||'')}</div></div>
 <div class="ethics-review-evidence"><b>Evidence summary</b><br>${esc(m.evidence_summary||'No evidence summary recorded.')}</div>
 <h4>Learning objectives</h4><ul>${(m.learning_objectives||[]).map(x=>'<li>'+esc(x)+'</li>').join('')}</ul>
 <h4>Lesson / video script</h4><div class="ethics-review-script">${esc(m.video_script_md||'')}</div>
 <h4>Scored quiz · 90% required</h4><div>${quiz.map(x=>`<div class="ethics-review-question"><b>${x.sequence}. ${esc(x.question)}</b><small>Correct: ${esc(x.correct_choice)}</small><small>Rationale: ${esc(x.rationale||'')}</small></div>`).join('')}</div>
 <h4>Required review domains</h4><div>${reviews.map(r=>`<div class="ethics-review-domain"><b>${esc(r.review_domain.replaceAll('_',' '))}</b> · ${esc(r.status.replaceAll('_',' '))}${r.reviewer_name?'<small style="display:block">Reviewed by '+esc(r.reviewer_name)+' · '+esc(r.reviewer_qualification||'')+'</small>':''}<div class="ethics-review-actions"><button data-ethics-review-decision="approved" data-domain="${r.review_domain}" data-module="${m.id}">Approve domain</button><button data-ethics-review-decision="changes_required" data-domain="${r.review_domain}" data-module="${m.id}">Changes required</button></div></div>`).join('')}</div>
 <div class="admin-cert-preview-actions"><button data-ethics-return-module="${m.id}">Return entire module for changes</button><button data-ethics-review-close>Close</button></div>`;
 d.showModal();
}
async function decideEthicsReview(moduleId,domain,decision){
 const reviewerName=prompt('Reviewer name:','');if(!reviewerName)return;
 const qualification=prompt('Reviewer qualification / role:','');if(!qualification)return;
 const findings=prompt(decision==='approved'?'Optional review notes:':'Required changes / findings:','')||'';
 if(decision==='changes_required'&&!findings.trim())return toast('Describe the required changes.',true);
 const {error}=await sb.rpc('admin_review_coach_ethics_lesson',{p_microlearning_id:moduleId,p_review_domain:domain,p_decision:decision,p_reviewer_name:reviewerName,p_reviewer_qualification:qualification,p_findings:findings||null});
 if(error)return toast(error.message,true);
 toast(decision==='approved'?'Review domain approved.':'Changes required recorded.');
 await loadEthicsReviewCenter();openEthicsModuleReview(moduleId);
}
async function returnEthicsModule(id){
 const note=prompt('What changes are required for this module?','');if(!note)return;
 const {error}=await sb.rpc('admin_return_coach_ethics_lesson_to_review',{p_microlearning_id:id,p_note:note});
 if(error)return toast(error.message,true);
 toast('Module returned for changes.');q('#coachEthicsReviewDialog')?.close();loadEthicsReviewCenter();
}

async function loadCredentialing(){
 if(!await checkAdmin())return;
 const d=await rpc('get_admin_coach_certification_context');if(!d)return;
 const s=d.summary||{};
 q('#credentialClaims').textContent=s.claims||0;q('#credentialPending').textContent=s.pending||0;q('#credentialVerified').textContent=s.verified||0;q('#credentialExpiring').textContent=s.expiring||0;
 q('#credentialCertificates').textContent=s.certificates||0;
 q('#credentialClaimList').innerHTML=(d.claims||[]).map(x=>`<article class="forms-admin-review ${x.verification_status==='verified'?'ok':'attention'}"><div>${row('C',x.label,`${x.credential_type} · ${x.owner_label}${x.issuer?' · '+x.issuer:''}`,x.verification_status,x.verification_status==='verified'?'ok':'attention')}</div><div class="forms-admin-actions">${x.verification_status!=='verified'?`<button data-admin-credential-review="${x.id}" data-review-status="verified">Verify</button><button data-admin-credential-review="${x.id}" data-review-status="unable_to_verify">Unable to verify</button>`:x.certificate_id?`<span>Record ${esc(x.certificate_number)}</span>`:`<button data-admin-preview-claim-certificate="${x.id}">Preview & issue record</button>`}</div></article>`).join('')||'<div class="approved-resource-empty">No credential claims.</div>';
 q('#credentialTypeList').innerHTML=(d.types||[]).map(x=>row('T',x.label,x.description,x.status)).join('');
 q('#credentialTrainingList').innerHTML=(d.training||[]).map(x=>`<article class="forms-admin-review ${x.verified?'ok':''}"><div>${row('L',x.title,`${x.owner_label} · ${x.status}${x.hours?' · '+x.hours+' hrs':''}`,x.verified?'verified':'unverified',x.verified?'ok':'attention')}</div><div class="forms-admin-actions">${!x.verified&&x.status==='completed'?`<button data-admin-verify-training="${x.id}">Verify completion</button>`:x.verified&&!x.certificate_id?`<button data-admin-preview-training-certificate="${x.id}">Preview & issue certificate</button>`:x.certificate_id?`<span>Certificate ${esc(x.certificate_number)}</span>`:''}</div></article>`).join('')||'<div class="approved-resource-empty">No training records.</div>';
 q('#credentialCertificateList').innerHTML=(d.certificates||[]).map(x=>`<article class="forms-admin-review ${x.status==='active'?'ok':'attention'}">${row('✓',x.title,`${x.owner_label} · ${x.certificate_number} · issued ${new Date(x.issued_on).toLocaleDateString()}`,x.status,x.status==='active'?'ok':'attention')}<div class="forms-admin-actions"><button data-admin-view-certificate="${x.id}">View certificate</button><button data-admin-verify-issued-certificate="${esc(x.certificate_number)}">Verify</button><button data-admin-certificate-history="${x.id}">History</button>${x.status==='active'?`<button data-admin-revoke-certificate="${x.id}">Revoke</button>`:x.status==='revoked'?`<button data-admin-reissue-certificate="${x.id}">Reissue</button>`:''}</div></article>`).join('')||'<div class="approved-resource-empty">No certificates issued.</div>';
 q('#credentialRequirementList').innerHTML='<article class="forms-guardrail"><b>✓ Business review</b><small>The coaching business must be approved before public operation.</small></article><article class="forms-guardrail"><b>✓ Human verification</b><small>Professional claims stay self-reported until reviewed by a Lellee administrator.</small></article><article class="forms-guardrail"><b>✓ Certificate scope</b><small>Lellee certificates record reviewed completion only and never represent a professional license or clinical credential.</small></article>';
}

async function reviewCredential(id,status){
 const note=prompt(status==='verified'?'Optional verification note:':'Why could this claim not be verified?','')||null;
 const {error}=await sb.rpc('admin_review_coach_credential',{p_claim_id:id,p_status:status,p_note:note});
 if(error)return toast(error.message,true);toast(status==='verified'?'Credential verified.':'Credential updated.');loadCredentialing();
}
async function verifyTraining(id){
 const record=await sb.from('training_records').select('id,professional_enrollment_id').eq('id',id).maybeSingle();
 if(record.error)return toast(record.error.message,true);
 let error=null;
 if(record.data?.professional_enrollment_id){
   const out=await sb.rpc('admin_verify_professional_enrollment',{p_enrollment_id:record.data.professional_enrollment_id,p_verified:true});
   error=out.error;
 }else{
   const out=await sb.rpc('admin_review_training_record',{p_training_record_id:id,p_verified:true});
   error=out.error;
 }
 if(error)return toast(error.message,true);
 toast('Training completion verified.');
 loadCredentialing();
}
function ensureCertificateAdminDialog(){
 let d=q('#adminCertificatePreviewDialog');
 if(d)return d;
 d=document.createElement('dialog');
 d.id='adminCertificatePreviewDialog';
 d.innerHTML='<div class="admin-cert-preview-shell" id="adminCertificatePreviewBody"></div>';
 document.body.appendChild(d);
 if(!q('#adminCertificatePreviewStyle')){
   const s=document.createElement('style');s.id='adminCertificatePreviewStyle';s.textContent=
   '.admin-cert-preview-shell{width:min(680px,88vw);padding:22px;font-family:Arial;color:#173047}.admin-cert-preview-head{border-bottom:2px solid #b57abd;padding-bottom:12px;margin-bottom:16px}.admin-cert-preview-head h3{margin:4px 0;color:#075b4d;font-family:Georgia,serif;font-size:25px}.admin-cert-preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.admin-cert-preview-grid div{border:1px solid #e1e7e4;border-radius:10px;padding:10px}.admin-cert-preview-grid span{display:block;font-size:9px;letter-spacing:1.2px;color:#707980;margin-bottom:4px}.admin-cert-preview-scope{margin-top:12px;padding:11px;background:#f4f7f5;border-radius:9px;font-size:12px;line-height:1.45}.admin-cert-preview-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.admin-cert-preview-actions button{padding:9px 13px}.admin-cert-preview-ready{font-size:11px;font-weight:800;color:#075b4d}.admin-cert-preview-blocked{font-size:11px;font-weight:800;color:#9b3e4d}@media(max-width:600px){.admin-cert-preview-grid{grid-template-columns:1fr}}';
   document.head.appendChild(s);
 }
 return d;
}
async function previewCertificate(source,id){
 const args={p_credential_claim_id:source==='claim'?id:null,p_training_record_id:source==='training'?id:null};
 const {data,error}=await sb.rpc('admin_preview_coach_certificate',args);
 if(error)return toast(error.message,true);
 const d=ensureCertificateAdminDialog(),body=q('#adminCertificatePreviewBody');
 const fmt=v=>v?new Date(String(v).slice(0,10)+'T12:00:00').toLocaleDateString():'—';
 body.innerHTML='<div class="admin-cert-preview-head"><span class="approved-kicker">LELLEE COACHING · TEMPLATE V1</span><h3>Certificate Preview</h3><div class="'+(data.eligible?'admin-cert-preview-ready':'admin-cert-preview-blocked')+'">'+esc(data.eligibility_note||'')+'</div></div>'+
 '<div class="admin-cert-preview-grid"><div><span>RECIPIENT</span><b>'+esc(data.recipient_name||'—')+'</b></div><div><span>CERTIFICATE</span><b>'+esc(data.certificate_title||'—')+'</b></div>'+
 '<div><span>COURSE / RECORD</span><b>'+esc(data.course_title||'—')+'</b></div><div><span>TRAINING HOURS</span><b>'+esc(data.training_hours==null?'—':data.training_hours+' hours')+'</b></div>'+
 '<div><span>COMPLETION DATE</span><b>'+esc(fmt(data.completion_date))+'</b></div><div><span>EXPIRATION</span><b>'+esc(fmt(data.expires_on))+'</b></div>'+
 '<div><span>ISSUER</span><b>'+esc(data.issuer||'Lellee')+'</b></div><div><span>CERTIFICATE NUMBER</span><b>'+esc(data.certificate_number||'Assigned automatically when issued')+'</b></div></div>'+
 '<div class="admin-cert-preview-scope">'+esc(data.scope_note||'')+'</div>'+
 '<div class="admin-cert-preview-actions"><button type="button" data-admin-cert-preview-close>Cancel</button>'+(data.eligible?'<button type="button" class="primary" data-admin-confirm-certificate="'+esc(id)+'" data-source="'+esc(source)+'">Issue Certificate</button>':'')+'</div>';
 d.showModal();
}
async function issueCertificate(source,id){
 const args={p_credential_claim_id:source==='claim'?id:null,p_training_record_id:source==='training'?id:null,p_title:null,p_expires_on:null,p_note:null};
 const {data,error}=await sb.rpc('admin_issue_coach_certificate',args);
 if(error)return toast(error.message,true);
 q('#adminCertificatePreviewDialog')?.close();
 toast(source==='claim'?'Verification record issued.':'Lellee certificate issued.');
 await loadCredentialing();
 return data;
}
async function viewAdminCertificate(id){
 const {data,error}=await sb.rpc('get_printable_coach_certificate',{p_certificate_id:id});
 if(error)return toast(error.message,true);
 const w=window.open('','_blank');if(!w)return toast('Allow pop-ups to view the certificate.',true);
 const fmt=v=>v?new Date(String(v).slice(0,10)+'T12:00:00').toLocaleDateString():'—';
 w.document.write('<!doctype html><html><head><title>'+esc(data.certificate_number||'Certificate')+'</title><style>@page{size:landscape;margin:.25in}body{font-family:Arial;color:#173047;padding:30px}main{border:8px solid #075b4d;padding:40px;text-align:center}h1{font-family:Georgia;color:#075b4d;letter-spacing:4px}.name{font-family:Georgia;font-size:34px;border-bottom:1px solid #aaa;padding:12px}.meta{display:flex;justify-content:space-around;margin:28px 0}.scope{font-size:11px;color:#667}.actions{position:fixed;top:10px;right:10px}@media print{.actions{display:none}}</style></head><body><div class="actions"><button onclick="print()">Print / Save PDF</button></div><main><img src="/lellee-coaching-logo-light-v1.png" style="max-width:330px;max-height:120px"><h1>CERTIFICATE OF COMPLETION</h1><p>THIS CERTIFIES THAT</p><div class="name">'+esc(data.recipient_name||'Certificate Recipient')+'</div><h2>'+esc(data.course_title||data.certificate_title||'Lellee Training')+'</h2><div class="meta"><span>Completed<br><b>'+esc(fmt(data.completion_date))+'</b></span><span>Hours<br><b>'+esc(data.training_hours==null?'—':data.training_hours)+'</b></span><span>Issued<br><b>'+esc(fmt(data.issued_on))+'</b></span><span>Certificate<br><b>'+esc(data.certificate_number||'')+'</b></span></div><p class="scope">'+esc(data.scope_note||'')+'<br>'+esc(data.verification_statement||'')+'</p></main></body></html>');
 w.document.close();
}
async function revokeCertificate(id){
 const note=prompt('Reason for revocation:','')||null;if(!note)return;
 const {error}=await sb.rpc('admin_revoke_coach_certificate',{p_certificate_id:id,p_note:note});
 if(error)return toast(error.message,true);toast('Certificate revoked.');loadCredentialing();
}

async function reissueCertificate(id){
 const reason=prompt('Reason for reissuing this revoked certificate:','')||null;
 if(!reason)return;
 if(!confirm('Issue a replacement certificate with a NEW certificate number? The revoked certificate will remain permanently in history.'))return;
 const {data,error}=await sb.rpc('admin_reissue_coach_certificate',{p_certificate_id:id,p_reason:reason});
 if(error)return toast(error.message,true);
 toast('Replacement certificate issued with a new certificate number.');
 await loadCredentialing();
 if(data)viewCertificateHistory(data);
}
async function viewCertificateHistory(id){
 const {data,error}=await sb.rpc('get_admin_coach_certificate_history',{p_certificate_id:id});
 if(error)return toast(error.message,true);
 const d=ensureCertificateAdminDialog(),body=q('#adminCertificatePreviewBody');
 const chain=data?.chain||[],audit=data?.audit||[];
 const fmt=v=>v?new Date(v).toLocaleString():'—';
 body.innerHTML='<div class="admin-cert-preview-head"><span class="approved-kicker">LELLEE COACHING · CERTIFICATE AUDIT</span><h3>Certificate History</h3><div class="admin-cert-preview-ready">Revoked records are permanent and certificate numbers are never reused.</div></div>'+
 '<div>'+chain.map((x,i)=>'<div class="forms-admin-review '+(x.status==='active'?'ok':'attention')+'" style="margin-bottom:8px"><b>'+(i===0?'Original':'Replacement '+i)+' · '+esc(x.certificate_number)+'</b><small style="display:block">'+esc(x.title||'')+' · '+esc(String(x.status||'').toUpperCase())+' · issued '+esc(String(x.issued_on||''))+(x.revoked_at?' · revoked '+esc(fmt(x.revoked_at)):'')+'</small>'+(x.reissue_reason?'<small style="display:block">Reissue reason: '+esc(x.reissue_reason)+'</small>':'')+'</div>').join('')+'</div>'+
 '<h4 style="margin:16px 0 7px">Audit trail</h4><div>'+audit.map(a=>'<div class="forms-admin-review" style="margin-bottom:6px"><b>'+esc(a.action_label||a.action)+'</b><small style="display:block">'+esc(fmt(a.created_at))+'</small></div>').join('')+'</div>'+
 '<div class="admin-cert-preview-actions"><button type="button" data-admin-cert-preview-close>Close</button></div>';
 d.showModal();
}

function relabelAdminCoachTraining(){
 qa('#page-admin .admin-home-tool-row>span').forEach(el=>{if(el.textContent.trim()==='Credentialing')el.textContent='Coach Training & Credentialing'});
}

document.addEventListener('click',e=>{
 if(e.target.closest('[data-admin-home-group="people-partners"]'))setTimeout(relabelAdminCoachTraining,0);
 const credentialAction=e.target.closest('[data-admin-credential-review]');
 if(credentialAction){e.preventDefault();reviewCredential(credentialAction.dataset.adminCredentialReview,credentialAction.dataset.reviewStatus)}
 const trainingAction=e.target.closest('[data-admin-verify-training]');
 if(trainingAction){e.preventDefault();verifyTraining(trainingAction.dataset.adminVerifyTraining)}
 const claimCertificate=e.target.closest('[data-admin-preview-claim-certificate]');
 if(claimCertificate){e.preventDefault();previewCertificate('claim',claimCertificate.dataset.adminPreviewClaimCertificate)}
 const trainingCertificate=e.target.closest('[data-admin-preview-training-certificate]');
 if(trainingCertificate){e.preventDefault();previewCertificate('training',trainingCertificate.dataset.adminPreviewTrainingCertificate)}
 const confirmCertificate=e.target.closest('[data-admin-confirm-certificate]');
 if(confirmCertificate){e.preventDefault();issueCertificate(confirmCertificate.dataset.source,confirmCertificate.dataset.adminConfirmCertificate)}
 if(e.target.closest('[data-admin-cert-preview-close]'))q('#adminCertificatePreviewDialog')?.close();
 const viewCertificate=e.target.closest('[data-admin-view-certificate]');
 if(viewCertificate){e.preventDefault();viewAdminCertificate(viewCertificate.dataset.adminViewCertificate)}
 const verifyIssued=e.target.closest('[data-admin-verify-issued-certificate]');
 if(verifyIssued){e.preventDefault();window.open('/certificate-verify.html?certificate='+encodeURIComponent(verifyIssued.dataset.adminVerifyIssuedCertificate),'_blank','noopener')}
 const revokeAction=e.target.closest('[data-admin-revoke-certificate]');
 if(revokeAction){e.preventDefault();revokeCertificate(revokeAction.dataset.adminRevokeCertificate)}
 const reissueAction=e.target.closest('[data-admin-reissue-certificate]');
 if(reissueAction){e.preventDefault();reissueCertificate(reissueAction.dataset.adminReissueCertificate)}
 const historyAction=e.target.closest('[data-admin-certificate-history]');
 if(historyAction){e.preventDefault();viewCertificateHistory(historyAction.dataset.adminCertificateHistory)}

 const openEthics=e.target.closest('[data-admin-open-ethics-module]');
 if(openEthics){e.preventDefault();openEthicsModuleReview(openEthics.dataset.adminOpenEthicsModule)}
 const ethicsDecision=e.target.closest('[data-ethics-review-decision]');
 if(ethicsDecision){e.preventDefault();decideEthicsReview(ethicsDecision.dataset.module,ethicsDecision.dataset.domain,ethicsDecision.dataset.ethicsReviewDecision)}
 const ethicsReturn=e.target.closest('[data-ethics-return-module]');
 if(ethicsReturn){e.preventDefault();returnEthicsModule(ethicsReturn.dataset.ethicsReturnModule)}
 if(e.target.closest('[data-ethics-review-close]'))q('#coachEthicsReviewDialog')?.close();
},true);

qa('[data-my-forms-tab]').forEach(b=>b.onclick=()=>setMyFormsTab(b.dataset.myFormsTab));
qa('[data-org-forms-tab]').forEach(b=>b.onclick=()=>setOrgFormsTab(b.dataset.orgFormsTab));
qa('[data-forms-studio-tab]').forEach(b=>b.onclick=()=>setFormsStudioTab(b.dataset.formsStudioTab));
qa('[data-credential-tab]').forEach(b=>b.onclick=()=>setCredentialTab(b.dataset.credentialTab));
q('#vaultAddDocument')?.addEventListener('click',addVaultDocument);
q('#formsStudioAddForm')?.addEventListener('click',addForm);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){
   old(name);
   if(name==='my-forms')loadMyForms();
   if(name==='document-vault')loadVault();
   if(name==='organization-forms')loadOrgForms();
   if(name==='forms-studio')loadFormsStudio();
   if(name==='credentialing-center')loadCredentialing();
   if(name==='admin')setTimeout(relabelAdminCoachTraining,0);
 };
}
setTimeout(relabelAdminCoachTraining,800);
})();
