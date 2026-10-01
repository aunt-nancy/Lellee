
(function(){
'use strict';

var VERSION='2026-10-01-professional-review-center-v6';
var state={courses:[],reviewers:[],controls:{},release:{courses:[],is_key_administrator:false},evidence:{courses:[]},workload:{summary:{},reviewers:[],domains:[],is_key_administrator:false},deadlines:{summary:{},settings:{},alerts:[],is_key_administrator:false},selectedCourse:null,selectedReview:null,selectedAssignment:null,selectedReviewerVerification:null,selectedCapacityReviewer:null,loaded:false,busy:false};
var client=(typeof sb!=='undefined'&&sb)?sb:(window.LelleeAuthContext&&window.LelleeAuthContext.client?window.LelleeAuthContext.client:null);

function q(sel,root){return (root||document).querySelector(sel)}
function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function toast(message,bad){
 var t=q('#globalToast');
 if(!t)return;
 t.textContent=message;
 t.classList.remove('hidden');
 if(bad)t.style.background='#7f2634';
 setTimeout(function(){t.classList.add('hidden');t.style.background=''},2600);
}
function label(type){
 var map={source:'Source',curriculum:'Curriculum',assessment:'Assessment',scope:'Scope & Safety',capstone:'Capstone'};
 return map[type]||type;
}
function statusLabel(status){
 if(status==='approved')return 'Approved';
 if(status==='revisions_required')return 'Revisions required';
 return 'Internal review';
}
function money(cents){
 try{return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents||0)/100)}
 catch(_){return '$'+(Number(cents||0)/100).toFixed(2)}
}
function issueLabel(key){
 var map={
  review_domains_not_all_approved:'Human review domains not all approved',
  curriculum_review_not_approved:'Curriculum review not approved',
  assessment_review_not_approved:'Assessment review not approved',
  modules_not_all_approved:'Modules not all approved',
  approved_question_bank_below_minimum:'Approved question bank below minimum',
  approved_scenario_count_below_minimum:'Approved scenario count below minimum',
  approved_human_capstone_rubric_missing:'Approved human capstone/rubric missing',
  evidence_requirements_not_approved:'Evidence requirements not approved',
  instructional_content_or_sources_incomplete:'Instructional content or sources incomplete',
  insufficient_required_modules:'Required module count incomplete'
 };
 return map[key]||String(key||'').replace(/_/g,' ');
}
async function isAdmin(){
 if(!client)return false;
 try{
  var out=await client.rpc('is_lellee_admin');
  return !out.error&&out.data===true;
 }catch(_){return false}
}
async function rpc(name,args){
 if(!client)return {data:null,error:new Error('Supabase client unavailable')};
 try{return await client.rpc(name,args||{})}
 catch(error){return {data:null,error:error}}
}

function ensureStyles(){
 if(q('#professionalTrainingReviewStyles'))return;
 var style=document.createElement('style');
 style.id='professionalTrainingReviewStyles';
 style.textContent=
 '.ptr-wrap{margin:0 0 16px}.ptr-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin:0 0 10px}.ptr-head h3{margin:3px 0;font-size:.88rem}.ptr-head p{margin:0;color:#746d78;font-size:.62rem;line-height:1.5}'+
 '.ptr-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:0 0 12px}.ptr-metrics article{border:1px solid #e6e0e9;background:#fff;border-radius:9px;padding:10px}.ptr-metrics b{display:block;font-size:1rem;color:#65409a}.ptr-metrics small{font-size:.55rem;color:#777}'+
 '.ptr-course{border:1px solid #e4dce9;border-radius:13px;background:#fff;padding:14px;margin:10px 0}.ptr-course-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.ptr-course-head h4{margin:3px 0;font-size:.82rem}.ptr-course-head p{margin:0;color:#746d78;font-size:.61rem;line-height:1.45}.ptr-price{text-align:right;white-space:nowrap}.ptr-price b{display:block;color:#65409a;font-size:.88rem}.ptr-price small{font-size:.54rem;color:#777}'+
 '.ptr-domains{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-top:10px}.ptr-domain{border:1px solid #e8e3e9;border-radius:10px;padding:9px;background:#fbfafc;min-width:0}.ptr-domain.approved{border-color:#cfe4d5;background:#f7fcf8}.ptr-domain.revisions_required{border-color:#efd1d5;background:#fff8f9}.ptr-domain>b{display:block;font-size:.6rem}.ptr-domain>small{display:block;font-size:.52rem;line-height:1.42;color:#777;margin:3px 0}.ptr-domain button{border:1px solid #d8cfe0;background:#fff;border-radius:7px;padding:6px 8px;font-size:.53rem;font-weight:760;color:#65409a;cursor:pointer}'+
 '.ptr-signoff{border-top:1px solid #eee8f0;margin-top:5px;padding-top:5px;font-size:.49rem;color:#68616b;line-height:1.35}.ptr-assignments{margin-top:10px;border-top:1px solid #eee8f0;padding-top:9px}.ptr-assignment{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #eee8f0;border-radius:8px;padding:7px 9px;margin:5px 0;font-size:.53rem}.ptr-assignment b{font-size:.56rem}.ptr-assignment small{display:block;color:#777;margin-top:2px}.ptr-assignment-actions{display:flex;gap:5px;flex-wrap:wrap}.ptr-assignment button{border:1px solid #d8cfe0;background:#fff;border-radius:7px;padding:5px 7px;font-size:.51rem;font-weight:750;color:#65409a;cursor:pointer}.ptr-blockers{margin-top:9px;border-top:1px solid #eee8f0;padding-top:8px;font-size:.54rem;color:#7c5660}.ptr-blockers.ok{color:#3b7853}.ptr-audit-note{border:1px solid #e6e0e9;background:#faf8fc;border-radius:10px;padding:10px 12px;font-size:.56rem;line-height:1.5;color:#6d6570;margin:8px 0 12px}'+
 '.ptr-dialog{border:0;border-radius:16px;padding:0;width:min(620px,calc(100% - 24px));max-height:calc(100dvh - 28px);overflow:hidden;box-shadow:0 30px 90px rgba(28,19,39,.3)}.ptr-dialog::backdrop{background:rgba(26,19,34,.58)}.ptr-dialog-inner{padding:20px;max-height:calc(100dvh - 28px);overflow-y:auto}.ptr-dialog h3{margin:4px 0 5px;font-size:1rem}.ptr-dialog p{font-size:.62rem;color:#706a73;line-height:1.5}'+
 '.ptr-evidence{margin-top:10px;border-top:1px solid #eee8f0;padding-top:9px}.ptr-evidence-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid #e6e0e9;border-radius:9px;padding:8px 9px;margin:6px 0;background:#faf9fb}.ptr-evidence-row b{display:block;font-size:.57rem}.ptr-evidence-row small{display:block;font-size:.51rem;color:#777;margin-top:2px}.ptr-evidence-row button{border:1px solid #d8cfe0;background:#fff;border-radius:7px;padding:5px 7px;font-size:.51rem;font-weight:750;color:#65409a;cursor:pointer}.ptr-evidence-content{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid #e6e0e9;border-radius:9px;background:#fbfafc;padding:12px;font:500 .62rem/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;color:#433b47}.ptr-source{border:1px solid #e6e0e9;border-radius:9px;padding:9px;margin:6px 0;font-size:.56rem;line-height:1.45}.ptr-source a{color:#65409a;font-weight:760}.ptr-assessment-review{border-top:1px solid #eee8f0;padding-top:9px;margin-top:9px;font-size:.57rem;line-height:1.45}.ptr-assessment-review ol{padding-left:20px}.ptr-assessment-review .correct{font-weight:800;color:#356244}.ptr-evidence-meta{display:flex;gap:6px;flex-wrap:wrap;margin:7px 0}.ptr-evidence-meta span{border-radius:999px;background:#f2eef6;padding:4px 7px;font-size:.5rem;color:#625966;font-weight:750}'+ '.ptr-workload{border:1px solid #e4dce9;border-radius:13px;background:#fff;padding:14px;margin:10px 0}.ptr-workload-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:9px 0 12px}.ptr-workload-grid article{border:1px solid #e8e2eb;border-radius:9px;padding:9px;background:#faf9fb}.ptr-workload-grid b{display:block;font-size:.86rem;color:#65409a}.ptr-workload-grid small{font-size:.51rem;color:#777}.ptr-domain-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.ptr-domain-coverage{border:1px solid #e8e2eb;border-radius:9px;padding:8px 9px;font-size:.53rem;line-height:1.4}.ptr-domain-coverage.gap{border-color:#efd1d5;background:#fff8f9}.ptr-domain-coverage.single{border-color:#eadcbf;background:#fffdf7}.ptr-domain-coverage b{display:block;font-size:.56rem}.ptr-workload-reviewer{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border-top:1px solid #eee8f0;padding:8px 0;font-size:.53rem}.ptr-workload-reviewer small{display:block;color:#777;margin-top:2px}.ptr-workload-reviewer button{border:1px solid #d8cfe0;background:#fff;border-radius:7px;padding:5px 7px;font-size:.51rem;font-weight:750;color:#65409a;cursor:pointer}'+ '.ptr-deadlines{border:1px solid #e4dce9;border-radius:13px;background:#fff;padding:14px;margin:10px 0}.ptr-deadline-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:9px 0 12px}.ptr-deadline-grid article{border:1px solid #e8e2eb;border-radius:9px;padding:9px;background:#faf9fb}.ptr-deadline-grid b{display:block;font-size:.86rem;color:#65409a}.ptr-deadline-grid small{font-size:.51rem;color:#777}.ptr-alert{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid #e6e0e9;border-radius:9px;padding:9px 10px;margin:6px 0;font-size:.54rem;background:#faf9fb}.ptr-alert.overdue{border-color:#e7bdc5;background:#fff7f8}.ptr-alert.stalled{border-color:#ead6ad;background:#fffdf6}.ptr-alert.due_soon{border-color:#d8cee4;background:#faf8fc}.ptr-alert.acknowledged{opacity:.68}.ptr-alert b{display:block;font-size:.57rem}.ptr-alert small{display:block;color:#777;margin-top:2px}.ptr-alert-actions{display:flex;gap:5px;flex-wrap:wrap}.ptr-alert button{border:1px solid #d8cfe0;background:#fff;border-radius:7px;padding:5px 7px;font-size:.51rem;font-weight:750;color:#65409a;cursor:pointer}'+
 '.ptr-form{display:grid;grid-template-columns:1fr 1fr;gap:9px}.ptr-form label{display:grid;gap:4px;font-size:.57rem;font-weight:750;color:#625966}.ptr-form .wide{grid-column:1/-1}.ptr-form input,.ptr-form select,.ptr-form textarea{width:100%;box-sizing:border-box;border:1px solid #ddd5e1;border-radius:8px;padding:8px;background:#fff;font:inherit;font-size:.63rem}.ptr-form textarea{min-height:74px;resize:vertical}.ptr-attest{display:flex!important;grid-template-columns:none!important;flex-direction:row;gap:8px!important;align-items:flex-start;font-weight:650!important}.ptr-attest input{width:auto;margin-top:2px}.ptr-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:12px}'+
 '@media(max-width:760px){.ptr-metrics{grid-template-columns:1fr 1fr}.ptr-domains{grid-template-columns:1fr}.ptr-form{grid-template-columns:1fr}.ptr-form .wide{grid-column:auto}.ptr-course-head,.ptr-head{display:block}.ptr-price{text-align:left;margin-top:6px}}';
 document.head.appendChild(style);
}
function ensureUi(){
 var panel=q('#credentialPanelTraining');
 if(!panel)return false;
 ensureStyles();
 var tab=q('[data-credential-tab="training"]');
 if(tab)tab.textContent='Professional Training';
 if(!q('#professionalTrainingReviewCenter')){
  var wrap=document.createElement('section');
  wrap.id='professionalTrainingReviewCenter';
  wrap.className='ptr-wrap';
  wrap.innerHTML=
   '<div class="ptr-head"><div><span class="approved-kicker">COURSE REVIEW & RELEASE</span><h3>Professional training human review center</h3><p>Record qualified human signoffs for sources, curriculum, assessments, scope/safety and capstones. Course publishing and checkout remain hard-blocked until all release requirements pass.</p></div><button class="approved-small-action" id="ptrRefresh" type="button">Refresh</button></div>'+
   '<div id="ptrMetrics"></div>'+
   '<div id="ptrDeadlines"></div>'+
   '<div id="ptrWorkload"></div>'+
   '<div class="ptr-audit-note"><b>Audit rule:</b> Reviewer qualifications are verified manually in-house before a signoff can count. Scope reviews with two required domains must be completed by different verified reviewers.</div>'+ '<div id="ptrReviewerRegistry"></div>'+
   '<div id="ptrCourseList"></div>';
  panel.insertBefore(wrap,panel.firstChild);
  var oldList=q('#credentialTrainingList');
  if(oldList&&!q('#ptrExistingTrainingHeading')){
   var heading=document.createElement('div');
   heading.id='ptrExistingTrainingHeading';
   heading.className='ptr-audit-note';
   heading.innerHTML='<b>Verified training records</b><br>Existing completion/verification records remain listed below this professional-course review center.';
   oldList.parentNode.insertBefore(heading,oldList);
  }
  var dialog=document.createElement('dialog');
  dialog.id='ptrDialog';
  dialog.className='ptr-dialog';
  dialog.innerHTML=
   '<div class="ptr-dialog-inner"><span class="approved-kicker">HUMAN REVIEW SIGNOFF</span><h3 id="ptrDialogTitle">Record review</h3><p id="ptrRequirement"></p>'+
   '<div class="ptr-form">'+
   '<label class="wide">Verified in-house reviewer<select id="ptrReviewer"></select></label>'+
   '<div class="wide ptr-audit-note" id="ptrReviewerDetail"></div>'+
   '<label class="wide">Review notes<textarea id="ptrNotes" placeholder="Material reviewed, corrections requested, limitations and basis for signoff."></textarea></label>'+
   '<label class="wide ptr-attest"><input id="ptrAttest" type="checkbox"><span>I attest that the named reviewer has the stated qualifications, reviewed this domain, and this record accurately reflects the reviewer decision.</span></label>'+
   '</div><div class="ptr-actions"><button class="approved-link" id="ptrCancel" type="button">Cancel</button><button class="approved-link" id="ptrRevisions" type="button">Revisions Required</button><button class="approved-small-action" id="ptrApprove" type="button">Record Approval</button></div></div>';
  document.body.appendChild(dialog);
  q('#ptrRefresh').addEventListener('click',load);
  q('#ptrCancel').addEventListener('click',function(){dialog.close()});
  q('#ptrApprove').addEventListener('click',function(){save('approved')});
  q('#ptrRevisions').addEventListener('click',function(){save('revisions_required')});

  var evidenceDialog=document.createElement('dialog');
  evidenceDialog.id='ptrEvidenceDialog';
  evidenceDialog.className='ptr-dialog';
  evidenceDialog.style.width='min(900px,calc(100% - 24px))';
  evidenceDialog.innerHTML=
   '<div class="ptr-dialog-inner"><span class="approved-kicker">EVIDENCE PACKET · ADMIN ONLY</span><h3 id="ptrEvidenceTitle">Evidence review</h3><div id="ptrEvidenceBody"></div><div class="ptr-actions"><button class="approved-small-action" id="ptrEvidenceClose" type="button">Close</button></div></div>';
  document.body.appendChild(evidenceDialog);
  q('#ptrEvidenceClose').addEventListener('click',function(){evidenceDialog.close()});

  var reviewerDialog=document.createElement('dialog');
  reviewerDialog.id='ptrReviewerDialog';
  reviewerDialog.className='ptr-dialog';
  reviewerDialog.innerHTML=
   '<div class="ptr-dialog-inner"><span class="approved-kicker">IN-HOUSE REVIEWER</span><h3>Register reviewer</h3><p>Enter the reviewer exactly as the in-house verification record should appear. Registration alone does not authorize signoff; the reviewer must still be marked Verified In-House.</p>'+
   '<div class="ptr-form">'+
   '<label class="wide">Full name<input id="ptrReviewerName" type="text" autocomplete="name" placeholder="Reviewer full name"></label>'+
   '<label class="wide">Qualification / credential<textarea id="ptrReviewerQualification" placeholder="Degree, credential, licensure, professional experience, or other qualification relevant to the assigned review domain."></textarea></label>'+
   '<label class="wide">Reviewer domain(s)<textarea id="ptrReviewerDomains" placeholder="Comma-separated, for example: independent_living_sme, instructional_design"></textarea></label>'+
   '<div class="wide ptr-audit-note" id="ptrReviewerDomainHelp"></div>'+
   '<label>Organization<input id="ptrReviewerOrganization" type="text" placeholder="Optional"></label>'+
   '<label>Evidence / internal reference<input id="ptrReviewerEvidence" type="text" placeholder="Optional verification reference"></label>'+
   '</div><div class="ptr-actions"><button class="approved-link" id="ptrReviewerCancel" type="button">Cancel</button><button class="approved-small-action" id="ptrReviewerSave" type="button">Register Reviewer</button></div></div>';
  document.body.appendChild(reviewerDialog);
  q('#ptrReviewerCancel').addEventListener('click',function(){reviewerDialog.close()});
  q('#ptrReviewerSave').addEventListener('click',saveReviewerForm);

  var assignmentDialog=document.createElement('dialog');
  assignmentDialog.id='ptrAssignmentDialog';
  assignmentDialog.className='ptr-dialog';
  assignmentDialog.innerHTML=
   '<div class="ptr-dialog-inner"><span class="approved-kicker">REVIEW ASSIGNMENT</span><h3 id="ptrAssignmentTitle">Assign reviewer</h3><p id="ptrAssignmentRequirement"></p>'+
   '<div class="ptr-form">'+
   '<label class="wide">Verified In-House reviewer<select id="ptrAssignmentReviewer"></select></label>'+
   '<div class="wide ptr-audit-note" id="ptrAssignmentReviewerDetail"></div>'+
   '<label>Due date<input id="ptrAssignmentDue" type="date"></label>'+
   '<label class="wide">Assignment notes<textarea id="ptrAssignmentNotes" placeholder="What should the reviewer focus on? Optional."></textarea></label>'+
   '</div><div class="ptr-actions"><button class="approved-link" id="ptrAssignmentCancel" type="button">Cancel</button><button class="approved-small-action" id="ptrAssignmentSave" type="button">Save Assignment</button></div></div>';
  document.body.appendChild(assignmentDialog);
  q('#ptrAssignmentCancel').addEventListener('click',function(){assignmentDialog.close()});
  q('#ptrAssignmentSave').addEventListener('click',saveAssignmentForm);

  var verificationDialog=document.createElement('dialog');
  verificationDialog.id='ptrVerificationDialog';
  verificationDialog.className='ptr-dialog';
  verificationDialog.innerHTML=
   '<div class="ptr-dialog-inner"><span class="approved-kicker">IN-HOUSE VERIFICATION</span><h3 id="ptrVerificationTitle">Verify reviewer</h3><p id="ptrVerificationIntro"></p>'+
   '<div class="ptr-audit-note" id="ptrVerificationReviewerDetail"></div>'+
   '<div class="ptr-form">'+
   '<label class="wide ptr-attest"><input id="ptrVerifyIdentity" type="checkbox"><span>Identity was checked against the in-house information available for this reviewer.</span></label>'+
   '<label class="wide ptr-attest"><input id="ptrVerifyQualification" type="checkbox"><span>Qualification/experience was reviewed and is relevant to the proposed reviewer role.</span></label>'+
   '<label class="wide ptr-attest"><input id="ptrVerifyEvidence" type="checkbox"><span>Supporting evidence or internal verification information was reviewed.</span></label>'+
   '<label class="wide ptr-attest"><input id="ptrVerifyConflict" type="checkbox"><span>Conflict/independence concerns were considered for reviewer use.</span></label>'+
   '<div class="wide ptr-audit-note"><b>Reviewer domains verified</b><div id="ptrVerificationDomains" style="margin-top:6px"></div></div>'+
   '<label class="wide">Verification / rejection notes<textarea id="ptrVerificationNotes" placeholder="Record what was checked, limitations, relevant experience, and the basis for the decision."></textarea></label>'+
   '</div><div class="ptr-actions"><button class="approved-link" id="ptrVerificationCancel" type="button">Cancel</button><button class="approved-link" id="ptrVerificationReject" type="button">Reject Reviewer</button><button class="approved-small-action" id="ptrVerificationApprove" type="button">Verify In-House</button></div></div>';
  document.body.appendChild(verificationDialog);
  q('#ptrVerificationCancel').addEventListener('click',function(){verificationDialog.close()});
  q('#ptrVerificationReject').addEventListener('click',function(){saveReviewerVerification(false)});
  q('#ptrVerificationApprove').addEventListener('click',function(){saveReviewerVerification(true)});

  var capacityDialog=document.createElement('dialog');
  capacityDialog.id='ptrCapacityDialog';
  capacityDialog.className='ptr-dialog';
  capacityDialog.innerHTML=
   '<div class="ptr-dialog-inner"><span class="approved-kicker">REVIEWER CAPACITY</span><h3 id="ptrCapacityTitle">Set reviewer capacity</h3><p>Capacity is an operational limit, not a credential. Leave maximum assignments blank if no numerical cap has been set.</p>'+
   '<div class="ptr-form">'+
   '<label>Availability<select id="ptrCapacityStatus"><option value="available">Available</option><option value="limited">Limited</option><option value="unavailable">Unavailable</option></select></label>'+
   '<label>Maximum active assignments<input id="ptrCapacityMax" type="number" min="1" max="100" step="1" placeholder="No set limit"></label>'+
   '<label class="wide">Capacity notes<textarea id="ptrCapacityNotes" placeholder="Optional staffing or scheduling note."></textarea></label>'+
   '</div><div class="ptr-actions"><button class="approved-link" id="ptrCapacityCancel" type="button">Cancel</button><button class="approved-small-action" id="ptrCapacitySave" type="button">Save Capacity</button></div></div>';
  document.body.appendChild(capacityDialog);
  q('#ptrCapacityCancel').addEventListener('click',function(){capacityDialog.close()});
  q('#ptrCapacitySave').addEventListener('click',saveReviewerCapacity);

  var reminderSettingsDialog=document.createElement('dialog');
  reminderSettingsDialog.id='ptrReminderSettingsDialog';
  reminderSettingsDialog.className='ptr-dialog';
  reminderSettingsDialog.innerHTML=
   '<div class="ptr-dialog-inner"><span class="approved-kicker">REVIEW DEADLINE SETTINGS</span><h3>Deadline & reminder thresholds</h3><p>These settings control internal Professional Training alerts only. They do not send email, SMS, or push notifications.</p>'+
   '<div class="ptr-form">'+
   '<label class="wide ptr-attest"><input id="ptrReminderEnabled" type="checkbox"><span>Enable internal review deadline alerts</span></label>'+
   '<label>Due-soon window (days)<input id="ptrDueSoonDays" type="number" min="1" max="30" step="1"></label>'+
   '<label>Stalled-review threshold (days)<input id="ptrStalledDays" type="number" min="1" max="60" step="1"></label>'+
   '</div><div class="ptr-actions"><button class="approved-link" id="ptrReminderSettingsCancel" type="button">Cancel</button><button class="approved-small-action" id="ptrReminderSettingsSave" type="button">Save Settings</button></div></div>';
  document.body.appendChild(reminderSettingsDialog);
  q('#ptrReminderSettingsCancel').addEventListener('click',function(){reminderSettingsDialog.close()});
  q('#ptrReminderSettingsSave').addEventListener('click',saveReminderSettings);
 }
 return true;
}
function render(data){
 state.courses=data.courses||[];
 state.reviewers=data.reviewers||[];
 state.controls=data.controls||{};
 state.release=data.release||state.release||{courses:[],is_key_administrator:false};
 state.evidence=data.evidence||state.evidence||{courses:[]};
 state.workload=data.workload||state.workload||{summary:{},reviewers:[],domains:[],is_key_administrator:false};
 state.deadlines=data.deadlines||state.deadlines||{summary:{},settings:{},alerts:[],is_key_administrator:false};
 var s=data.summary||{};
 q('#ptrMetrics').innerHTML=
  '<div class="ptr-metrics">'+
  '<article><b>'+esc(s.courses||0)+'</b><small>courses</small></article>'+
  '<article><b>'+esc(s.modules||0)+'</b><small>modules</small></article>'+
  '<article><b>'+esc(s.assessments||0)+'</b><small>assessment items</small></article>'+
  '<article><b>'+esc(s.enrollments||0)+'</b><small>enrollments</small></article>'+
  '<article><b>'+esc(s.published||0)+'</b><small>published</small></article>'+
  '<article><b>'+esc(s.checkout_enabled||0)+'</b><small>checkout enabled</small></article>'+
  '</div>';

 var ds=state.deadlines.summary||{};
 var dcfg=state.deadlines.settings||{};
 var alerts=(state.deadlines.alerts||[]).map(function(a){
  var statusText=String(a.status||'').replace(/_/g,' ');
  var typeText=String(a.reminder_type||'').replace(/_/g,' ');
  var due=a.due_date?' · due '+esc(a.due_date):'';
  var timing='';
  if(a.reminder_type==='overdue'&&a.days_until_due!=null)timing=' · '+esc(Math.abs(a.days_until_due))+' day(s) overdue';
  else if(a.reminder_type==='due_soon'&&a.days_until_due!=null)timing=' · '+esc(a.days_until_due)+' day(s) remaining';
  var actions=a.status==='open'
    ? '<button type="button" data-ptr-reminder-action="acknowledge" data-ptr-reminder-id="'+esc(a.id)+'">Acknowledge</button>'
    : a.status==='acknowledged'
      ? '<button type="button" data-ptr-reminder-action="reopen" data-ptr-reminder-id="'+esc(a.id)+'">Reopen</button>'
      : '';
  return '<div class="ptr-alert '+esc(a.reminder_type)+' '+esc(a.status)+'"><div><b>'+esc(typeText)+' · '+esc(a.course_title||'Course')+' · '+esc(label(a.review_type))+'</b><span>'+esc(a.reviewer_domain||'')+' · '+esc(a.reviewer_name||'No reviewer')+due+timing+'</span><small>Status: '+esc(statusText)+'</small></div><div class="ptr-alert-actions">'+actions+'</div></div>';
 }).join('');
 var settingsButton=state.deadlines.is_key_administrator
  ? '<button type="button" class="approved-small-action" id="ptrReminderSettings">Settings</button>'
  : '';
 q('#ptrDeadlines').innerHTML=
  '<section class="ptr-deadlines"><div class="ptr-head"><div><span class="approved-kicker">REVIEW DEADLINES & ALERTS</span><h3>Due soon, overdue and stalled reviews</h3><p>Internal alerts refresh hourly. Current thresholds: due soon within '+esc(dcfg.due_soon_days||7)+' days · stalled after '+esc(dcfg.stalled_days||7)+' days.</p></div>'+settingsButton+'</div>'+
  '<div class="ptr-deadline-grid">'+
   '<article><b>'+esc(ds.open_alerts||0)+'</b><small>open alerts</small></article>'+
   '<article><b>'+esc(ds.due_soon||0)+'</b><small>due soon</small></article>'+
   '<article><b>'+esc(ds.overdue||0)+'</b><small>overdue</small></article>'+
   '<article><b>'+esc(ds.stalled||0)+'</b><small>stalled</small></article>'+
   '<article><b>'+esc(ds.assignments_without_due_date||0)+'</b><small>active without due date</small></article>'+
  '</div>'+
  (alerts||'<div class="approved-resource-empty">No active review deadline alerts.</div>')+
  '<div class="ptr-audit-note"><b>Delivery rule:</b> These are Professional Training internal alerts only. They do not use Lellee push/email/SMS delivery unless a separate notification channel is approved later.</div></section>';
 var tab=q('[data-credential-tab="training"]');
 if(tab)tab.textContent='Professional Training'+(Number(ds.open_alerts||0)>0?' ('+Number(ds.open_alerts||0)+')':'');

 var ws=state.workload.summary||{};
 var domainRows=(state.workload.domains||[]).map(function(d){
  var available=Number(d.available_verified_reviewers||0);
  var cls=available===0?'gap':available===1?'single':'';
  var coverage=available===0?'No available verified reviewer':available===1?'Single-reviewer dependency':available+' available verified reviewers';
  return '<div class="ptr-domain-coverage '+cls+'"><b>'+esc(d.reviewer_domain)+'</b><span>'+esc(coverage)+'</span><br><small>'+esc(d.unassigned_slots||0)+' unassigned · '+esc(d.active_slots||0)+' active · '+esc(d.total_slots||0)+' total slots</small></div>';
 }).join('');
 var reviewerLoadRows=(state.workload.reviewers||[]).map(function(w){
  var capacity=w.max_active_assignments==null?'No set cap':esc(w.active_assignments||0)+' / '+esc(w.max_active_assignments);
  var availability=String(w.availability_status||'available').replace(/_/g,' ');
  var action=state.workload.is_key_administrator?'<button type="button" data-ptr-capacity="'+esc(w.id)+'">Set Capacity</button>':'';
  return '<div class="ptr-workload-reviewer"><div><b>'+esc(w.full_name)+'</b> · '+esc(availability)+'<small>'+esc((w.reviewer_domains||[]).join(', '))+' · Active: '+esc(w.active_assignments||0)+' · Capacity: '+capacity+' · Overdue: '+esc(w.overdue_assignments||0)+' · Due next 7 days: '+esc(w.due_next_7_days||0)+'</small></div>'+action+'</div>';
 }).join('');
 q('#ptrWorkload').innerHTML=
  '<section class="ptr-workload"><div class="ptr-head"><div><span class="approved-kicker">REVIEWER WORKLOAD & STAFFING</span><h3>Coverage, active load and staffing gaps</h3><p>No default reviewer maximum is assumed. Key Admin may set a reviewer-specific capacity or mark a reviewer unavailable.</p></div></div>'+
  '<div class="ptr-workload-grid">'+
   '<article><b>'+esc(ws.verified_reviewers||0)+'</b><small>verified reviewers</small></article>'+
   '<article><b>'+esc(ws.active_assignments||0)+'</b><small>active assignments</small></article>'+
   '<article><b>'+esc(ws.unassigned_slots||0)+'</b><small>unassigned slots</small></article>'+
   '<article><b>'+esc(ws.overdue_assignments||0)+'</b><small>overdue</small></article>'+
   '<article><b>'+esc(ws.domains_without_available_reviewer||0)+'</b><small>domains with no available reviewer</small></article>'+
  '</div>'+
  '<div class="ptr-audit-note"><b>Domain coverage</b><br>Zero available reviewers is a staffing gap. One available reviewer is shown as a single-reviewer dependency; no additional staffing threshold is assumed.</div>'+
  '<div class="ptr-domain-grid">'+domainRows+'</div>'+
  '<div style="margin-top:12px"><b>Reviewer load</b>'+(
    reviewerLoadRows||'<div class="approved-resource-empty">No reviewer records yet. Register and verify in-house reviewers to populate workload data.</div>'
  )+'</div></section>';

 var verifiedReviewers=state.reviewers.filter(function(r){return r.verification_status==='verified_in_house'&&r.active});
 var pendingReviewers=state.reviewers.filter(function(r){return r.verification_status==='pending'&&r.active});
 var controlHtml='';
 if(state.controls.is_key_administrator){
  var overrideOn=!!state.controls.dual_review_override_enabled;
  var linkedId=state.controls.key_admin_reviewer_id||null;
  controlHtml='<div class="ptr-audit-note"><b>Temporary key-administrator dual review:</b> '+(overrideOn?'ON':'OFF')+
   (overrideOn&&state.controls.dual_review_override_reason?'<br>Reason: '+esc(state.controls.dual_review_override_reason):'')+
   '<br><button type="button" class="approved-small-action" id="ptrToggleDualReview">'+(overrideOn?'Turn Override OFF':'Turn Override ON')+'</button>'+
   (!linkedId?'<br><small>Before enabling, link one Verified In-House reviewer record to the key administrator.</small>':'')+
   '</div>';
 }
 q('#ptrReviewerRegistry').innerHTML=
  '<div class="ptr-course"><div class="ptr-head"><div><span class="approved-kicker">IN-HOUSE REVIEWER REGISTRY</span><h3>Manual reviewer verification</h3><p>Register reviewers, verify qualifications in-house, then use only verified reviewers for course signoff.</p></div><button class="approved-small-action" id="ptrAddReviewer" type="button">+ Add Reviewer</button></div>'+
  controlHtml+
  '<div class="ptr-audit-note"><b>'+esc(verifiedReviewers.length)+'</b> verified in-house · <b>'+esc(pendingReviewers.length)+'</b> pending verification</div>'+
  (state.reviewers.length?state.reviewers.map(function(r){
    var actions=r.verification_status==='pending'&&r.active
      ? '<button type="button" data-ptr-verify-reviewer="'+esc(r.id)+'">Verify In-House</button> <button type="button" data-ptr-reject-reviewer="'+esc(r.id)+'">Reject</button>'
      : '';
    var workloadReviewer=(state.workload.reviewers||[]).find(function(w){return w.id===r.id})||null;
    if(state.controls.is_key_administrator&&r.verification_status==='verified_in_house'&&r.active){
      if(workloadReviewer){
        actions+=(actions?' ':'')+'<button type="button" data-ptr-capacity="'+esc(r.id)+'">Capacity</button>';
      }
      if(r.linked_to_current_key_admin){
        actions+=(actions?' ':'')+'<span><b>Key Admin Reviewer</b></span>';
      }else if(!state.controls.key_admin_reviewer_id){
        actions+=(actions?' ':'')+'<button type="button" data-ptr-link-key-admin="'+esc(r.id)+'">Link as Key Admin Reviewer</button>';
      }
    }
    return '<div class="ptr-signoff"><b>'+esc(r.full_name)+'</b> · '+esc(r.verification_status)+'<br>'+esc(r.qualification)+'<br><small>'+esc((r.reviewer_domains||[]).join(', '))+(r.organization?' · '+esc(r.organization):'')+'</small><br>'+actions+'</div>';
   }).join(''):'<div class="approved-resource-empty">No reviewers registered yet.</div>')+
  '</div>';
 q('#ptrCourseList').innerHTML=state.courses.map(function(course){
  var reviews=(course.reviews||[]).map(function(review){
   var latest={};
   (review.signoffs||[]).forEach(function(signoff){if(!latest[signoff.reviewer_domain])latest[signoff.reviewer_domain]=signoff});
   var signoffs=Object.keys(latest).map(function(domain){
    var x=latest[domain];
    return '<div class="ptr-signoff"><b>'+esc(x.reviewer_domain)+'</b> · '+esc(x.reviewer_name)+' · '+esc(x.decision)+'<br>'+esc(x.reviewer_qualification||'')+'</div>';
   }).join('');
   if(!signoffs)signoffs='<small>No human signoff recorded.</small>';
   var domains=(review.required_domains||[]).map(esc).join(' + ');
   var separate=review.distinct_reviewers_required?' · different reviewers required':'';
   return '<article class="ptr-domain '+esc(review.status)+'">'+
    '<b>'+esc(label(review.review_type))+' · '+esc(statusLabel(review.status))+'</b>'+
    '<small>Required: '+domains+' · '+esc(review.minimum_signoffs||1)+' signoff(s)'+separate+'</small>'+
    signoffs+
    '<button type="button" data-ptr-course="'+esc(course.course_key)+'" data-ptr-review="'+esc(review.review_type)+'">Record review</button>'+
    '</article>';
  }).join('');
  var assignmentHtml=(course.assignments||[]).map(function(a){
   var stateText=a.status==='unassigned'?'Unassigned':a.status==='assigned'?'Assigned':a.status==='in_review'?'In review':a.status==='completed'?'Completed':a.status;
   var reviewer=a.reviewer_name||'No reviewer';
   var due=a.due_date?' · due '+a.due_date:'';
   var actions='';
   if(a.status==='unassigned'||a.status==='completed'){
    actions='<button type="button" data-ptr-assign-slot="'+esc(a.id)+'">'+(a.status==='completed'?'Reassign':'Assign')+'</button>';
   }else if(a.status==='assigned'){
    actions='<button type="button" data-ptr-start-slot="'+esc(a.id)+'">Start Review</button><button type="button" data-ptr-assign-slot="'+esc(a.id)+'">Reassign</button>';
   }else if(a.status==='in_review'){
    actions='<button type="button" data-ptr-assign-slot="'+esc(a.id)+'">Reassign</button>';
   }
   return '<div class="ptr-assignment"><div><b>'+esc(label(a.review_type))+' · '+esc(a.reviewer_domain)+'</b><small>'+esc(stateText)+' · '+esc(reviewer)+due+'</small></div><div class="ptr-assignment-actions">'+actions+'</div></div>';
  }).join('');
  var evidenceCourse=(state.evidence.courses||[]).find(function(x){return x.course_key===course.course_key})||null;
  var evidenceHtml='';
  if(evidenceCourse&&(evidenceCourse.modules||[]).length){
    evidenceHtml='<div class="ptr-evidence"><b>Evidence-informed module drafts</b><small>'+esc(evidenceCourse.evidence_approved||0)+'/'+esc(evidenceCourse.evidence_total||0)+' evidence records approved · '+esc(evidenceCourse.evidence_internal_review||0)+' in internal review</small>'+
      (evidenceCourse.modules||[]).map(function(em){
        var counts=esc(em.source_count||0)+' sources · '+esc(em.assessment_items||0)+' assessments · '+esc(em.scenario_items||0)+' scenarios · '+esc(em.content_characters||0)+' lesson characters';
        return '<div class="ptr-evidence-row"><div><b>'+esc(em.sequence)+'. '+esc(em.title)+'</b><small>'+esc(String(em.evidence_status||'').replace(/_/g,' '))+' · '+counts+'</small></div><button type="button" data-ptr-evidence-module="'+esc(em.module_id)+'">Open Evidence Packet</button></div>';
      }).join('')+
      '<div class="ptr-audit-note"><b>Approval rule:</b> Opening this packet does not approve anything. Use the assigned Source/Curriculum/Assessment review cards above to record verified human decisions.</div></div>';
  }
  var release=(state.release.courses||[]).find(function(x){return x.course_key===course.course_key})||{};
  var issues=release.issues||course.issues||[];
  var blockers=issues.length?
   '<div class="ptr-blockers"><b>Release blockers:</b> '+issues.map(issueLabel).map(esc).join(' · ')+'</div>':
   '<div class="ptr-blockers ok"><b>All review gates are complete.</b> Publishing and checkout remain separate controlled actions.</div>';
  var releaseActions='';
  if(state.release.is_key_administrator){
    if(course.status!=='published'){
      releaseActions='<button type="button" class="approved-small-action" data-ptr-publish="'+esc(course.course_key)+'" '+(release.publish_ready?'':'disabled')+'>Publish Course</button>';
    }else if(!course.checkout_enabled){
      releaseActions='<button type="button" class="approved-small-action" data-ptr-enable-checkout="'+esc(course.course_key)+'" '+(release.checkout_ready?'':'disabled')+'>Enable Checkout</button>';
    }else{
      releaseActions='<button type="button" class="approved-link" data-ptr-disable-checkout="'+esc(course.course_key)+'">Disable Checkout</button>';
    }
  }else{
    releaseActions='<small>Key administrator required for release actions.</small>';
  }
  var evidenceNote=Number(release.evidence_total||0)>0
    ? '<small>Evidence: '+esc(release.evidence_approved||0)+'/'+esc(release.evidence_total)+' approved</small>'
    : '';
  var stripeStatus=release.stripe_setup_status||'not tracked';
  var paymentNote='<small>Stripe setup: '+esc(String(stripeStatus).replace(/_/g,' '))+
    ' · Payment link: '+(release.payment_link_configured?'configured':'not configured')+'</small>';
  return '<article class="ptr-course"><div class="ptr-course-head"><div><span class="approved-kicker">'+esc(course.category==='foundation'?'FOUNDATION':'SPECIALTY')+'</span><h4>'+esc(course.title)+'</h4><p>'+esc(course.estimated_hours)+' hrs · '+esc(course.modules)+' modules · '+esc(course.assessments)+' questions · '+esc(course.scenarios)+' scenarios · '+esc(course.status)+'</p></div><div class="ptr-price"><b>'+esc(money(course.price_cents))+'</b><small>'+(course.checkout_enabled?'checkout enabled':'checkout off')+'</small><br>'+evidenceNote+'<br>'+paymentNote+'<div class="ptr-actions">'+releaseActions+'</div></div></div>'+evidenceHtml+'<div class="ptr-assignments"><b>Reviewer assignment queue</b>'+assignmentHtml+'</div><div class="ptr-domains">'+reviews+'</div>'+blockers+'</article>';
 }).join('')||'<div class="approved-resource-empty">No professional courses found.</div>';
}
async function load(){
 if(state.busy)return;
 if(!ensureUi())return;
 state.busy=true;
 try{
  if(!await isAdmin()){q('#ptrCourseList').innerHTML='<div class="approved-resource-empty">Administrator access required.</div>';return}
  var results=await Promise.all([
   rpc('get_admin_professional_training_review_center'),
   rpc('get_admin_professional_release_controls'),
   rpc('get_admin_professional_training_evidence_center'),
   rpc('get_admin_professional_reviewer_workload'),
   rpc('get_admin_professional_review_deadline_center')
  ]);
  var out=results[0],releaseOut=results[1],evidenceOut=results[2],workloadOut=results[3],deadlineOut=results[4];
  if(out.error){console.warn('Professional review center',out.error);q('#ptrCourseList').innerHTML='<div class="approved-resource-empty">Professional review data could not be loaded.</div>';return}
  if(releaseOut.error){console.warn('Professional release controls',releaseOut.error)}
  if(evidenceOut.error){console.warn('Professional evidence center',evidenceOut.error)}
  if(workloadOut.error){console.warn('Professional reviewer workload',workloadOut.error)}
  if(deadlineOut.error){console.warn('Professional review deadlines',deadlineOut.error)}
  var data=out.data||{};
  data.release=releaseOut.error?{courses:[],is_key_administrator:false}:(releaseOut.data||{});
  data.evidence=evidenceOut.error?{courses:[]}:(evidenceOut.data||{courses:[]});
  data.workload=workloadOut.error?{summary:{},reviewers:[],domains:[],is_key_administrator:false}:(workloadOut.data||{});
  data.deadlines=deadlineOut.error?{summary:{},settings:{},alerts:[],is_key_administrator:false}:(deadlineOut.data||{});
  state.loaded=true;
  render(data);
 }finally{state.busy=false}
}
function openReview(courseKey,reviewType){
 var course=state.courses.find(function(x){return x.course_key===courseKey});
 var review=course&&course.reviews?course.reviews.find(function(x){return x.review_type===reviewType}):null;
 if(!course||!review){toast('Review requirement could not be loaded.',true);return}
 state.selectedCourse=courseKey;
 state.selectedReview=reviewType;
 q('#ptrDialogTitle').textContent=course.title+' · '+label(reviewType);
 q('#ptrRequirement').textContent=(review.instructions||'')+' Required domain(s): '+(review.required_domains||[]).join(', ')+'.'+(review.distinct_reviewers_required?' This review requires different reviewers for the required domains.':'');
 var activeAssignments=(course.assignments||[]).filter(function(a){
  return a.review_type===reviewType&&a.reviewer_id&&(a.status==='assigned'||a.status==='in_review');
 });
 var assignedIds=activeAssignments.map(function(a){return a.reviewer_id});
 var eligible=state.reviewers.filter(function(r){
  return r.verification_status==='verified_in_house'&&r.active&&assignedIds.indexOf(r.id)>=0;
 });
 if(!eligible.length){toast('Assign a Verified In-House reviewer to this exact review slot before recording a decision.',true);return}
 q('#ptrReviewer').innerHTML=eligible.map(function(r){return '<option value="'+esc(r.id)+'">'+esc(r.full_name)+' · '+esc((r.reviewer_domains||[]).join(', '))+'</option>'}).join('');
 q('#ptrReviewerDetail').textContent=eligible[0].qualification+(eligible[0].organization?' · '+eligible[0].organization:'');
 q('#ptrReviewer').onchange=function(){
  var selected=eligible.find(function(r){return r.id===q('#ptrReviewer').value});
  q('#ptrReviewerDetail').textContent=selected?selected.qualification+(selected.organization?' · '+selected.organization:''):'';
 };
 q('#ptrNotes').value='';
 q('#ptrAttest').checked=false;
 q('#ptrDialog').showModal();
}
async function save(decision){
 if(!state.selectedCourse||!state.selectedReview)return;
 var reviewerId=q('#ptrReviewer').value;
 var notes=q('#ptrNotes').value.trim()||null;
 var attest=!!q('#ptrAttest').checked;
 if(!reviewerId){toast('Select a verified in-house reviewer.',true);return}
 if(!attest){toast('Reviewer attestation is required.',true);return}
 var approve=q('#ptrApprove'),revise=q('#ptrRevisions');
 if(approve)approve.disabled=true;if(revise)revise.disabled=true;
 try{
  var out=await rpc('admin_record_verified_professional_review_signoff',{
   p_course_key:state.selectedCourse,
   p_review_type:state.selectedReview,
   p_reviewer_id:reviewerId,
   p_decision:decision,
   p_notes:notes,
   p_attestation:true
  });
  if(out.error){toast(out.error.message||'Review could not be saved.',true);return}
  q('#ptrDialog').close();
  toast(label(state.selectedReview)+' review recorded: '+statusLabel(out.data&&out.data.review_status?out.data.review_status:decision)+'.');
  await load();
 }finally{if(approve)approve.disabled=false;if(revise)revise.disabled=false}
}
async function openEvidenceModule(moduleId){
 var dialog=q('#ptrEvidenceDialog'),body=q('#ptrEvidenceBody'),title=q('#ptrEvidenceTitle');
 if(!dialog||!body||!title)return;
 title.textContent='Loading evidence packet…';
 body.innerHTML='<div class="ptr-audit-note">Loading module evidence, lesson and assessment bank…</div>';
 dialog.showModal();
 var out=await rpc('get_admin_professional_training_evidence_module',{p_module_id:moduleId});
 if(out.error){title.textContent='Evidence packet unavailable';body.innerHTML='<div class="ptr-audit-note">'+esc(out.error.message||'Evidence packet could not be loaded.')+'</div>';return}
 var data=out.data||{},m=data.module||{},e=data.evidence||{},items=data.assessment_items||[];
 title.textContent=(m.sequence?m.sequence+'. ':'')+(m.title||'Evidence review');
 var sources=(m.source_refs||[]).map(function(s){
  var url=String(s.url||'');
  var link=/^https:\/\//i.test(url)?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title||url)+'</a>':esc(s.title||url);
  return '<div class="ptr-source">'+link+'<br><small>'+esc(s.source_type||'source')+' · '+esc(s.published_or_reviewed_year||'')+(s.current_or_recent?' · current/recent':'')+'</small><br>'+esc(s.claim_supported||'')+'</div>';
 }).join('');
 var objectives=(m.learning_objectives||[]).map(function(x){return '<li>'+esc(x)+'</li>'}).join('');
 var practice=(m.practice_requirements||[]).map(function(x){return '<li>'+esc(x)+'</li>'}).join('');
 var assessments=items.map(function(a){
  var choices=(a.choices||[]).map(function(choice,i){return '<li class="'+(i===a.correct_answer_index?'correct':'')+'">'+esc(choice)+(i===a.correct_answer_index?' ✓':'')+'</li>'}).join('');
  return '<div class="ptr-assessment-review"><b>'+esc(a.item_order)+'. '+esc(a.prompt)+'</b><ol>'+choices+'</ol><small><b>Rationale:</b> '+esc(a.rationale||'')+'<br><b>Source note:</b> '+esc(a.source_note||'')+'</small></div>';
 }).join('');
 body.innerHTML=
  '<div class="ptr-evidence-meta"><span>Module: '+esc(m.review_status||'')+'</span><span>Evidence: '+esc(e.status||'')+'</span><span>'+esc((m.source_refs||[]).length)+' sources</span><span>'+esc(items.length)+' assessment items</span></div>'+
  '<div class="ptr-audit-note"><b>Mixed/negative evidence:</b><br>'+esc(e.mixed_evidence_note||'Not recorded')+'</div>'+
  '<div class="ptr-audit-note"><b>Claim-strength limit:</b><br>'+esc(e.claim_strength_note||'Not recorded')+'</div>'+
  (e.reviewer_note?'<div class="ptr-audit-note"><b>Build note:</b><br>'+esc(e.reviewer_note)+'</div>':'')+
  '<h4>Learning objectives</h4><ul>'+objectives+'</ul>'+
  '<h4>Practice requirements</h4><ul>'+practice+'</ul>'+
  '<h4>Evidence sources</h4>'+sources+
  '<h4>Lesson draft</h4><div class="ptr-evidence-content">'+esc(m.content_md||'')+'</div>'+
  '<h4>Assessment bank · answer key visible to Admin</h4>'+assessments+
  '<div class="ptr-audit-note"><b>Human review required:</b> This packet is evidence for the assigned reviewers. It does not approve the course or replace the separate Source, Curriculum and Assessment signoffs.</div>';
}
async function publishProfessionalCourse(courseKey){
 var expected='PUBLISH '+courseKey;
 var confirmation=prompt('Publishing makes this course visible to learners. Checkout will remain OFF.\n\nType exactly:\n'+expected,'');
 if(confirmation!==expected)return confirmation==null?null:toast('Confirmation did not match. Course was not published.',true);
 var out=await rpc('admin_publish_professional_course_v2',{p_course_key:courseKey,p_confirmation:confirmation});
 if(out.error)return toast(out.error.message||'Course could not be published.',true);
 toast('Course published. Checkout remains OFF.');
 await load();
}
async function setProfessionalCourseCheckout(courseKey,enabled){
 var expected=(enabled?'ENABLE CHECKOUT ':'DISABLE CHECKOUT ')+courseKey;
 var confirmation=prompt((enabled?'This will make paid enrollment available for the published course.':'This will immediately stop new paid enrollments for this course.')+'\n\nType exactly:\n'+expected,'');
 if(confirmation!==expected)return confirmation==null?null:toast('Confirmation did not match. Checkout was not changed.',true);
 var out=await rpc('admin_set_professional_course_checkout_v2',{
  p_course_key:courseKey,p_enabled:enabled,p_confirmation:confirmation
 });
 if(out.error)return toast(out.error.message||'Checkout could not be changed.',true);
 toast(enabled?'Checkout enabled.':'Checkout disabled.');
 await load();
}
async function linkKeyAdminReviewer(id){
 var out=await rpc('admin_link_reviewer_to_current_key_admin',{p_reviewer_id:id});
 if(out.error)return toast(out.error.message||'Reviewer could not be linked to the key administrator.',true);
 toast('Reviewer linked to the key administrator.');
 await load();
}
async function toggleDualReviewOverride(){
 if(!state.controls.is_key_administrator)return toast('Key administrator access required.',true);
 var enabling=!state.controls.dual_review_override_enabled;
 var reason=null;
 if(enabling){
  reason=prompt('Reason for temporarily allowing the key administrator to fill both reviewer roles:','Temporary staffing coverage while reviewer staffing is being expanded.');
  if(!reason)return;
 }
 var out=await rpc('admin_set_key_admin_dual_review_override',{p_enabled:enabling,p_reason:reason});
 if(out.error)return toast(out.error.message||'Dual-review override could not be changed.',true);
 toast(enabling?'Temporary dual-review override enabled.':'Temporary dual-review override disabled.');
 await load();
}
function assignReviewSlot(id){
 var assignment=null,courseFound=null;
 state.courses.some(function(course){
  var found=(course.assignments||[]).find(function(a){return a.id===id})||null;
  if(found){assignment=found;courseFound=course;return true}
  return false;
 });
 if(!assignment)return toast('Review assignment could not be found.',true);
 var eligible=state.reviewers.filter(function(r){
  var w=(state.workload.reviewers||[]).find(function(x){return x.id===r.id})||null;
  var workloadOkay=!w||((w.availability_status||'available')!=='unavailable'&&!w.at_capacity);
  return r.verification_status==='verified_in_house'&&r.active&&workloadOkay&&(r.reviewer_domains||[]).indexOf(assignment.reviewer_domain)>=0;
 });
 if(!eligible.length)return toast('No Verified In-House reviewer is available for '+assignment.reviewer_domain+'.',true);
 state.selectedAssignment=assignment;
 var dialog=q('#ptrAssignmentDialog');
 q('#ptrAssignmentTitle').textContent=(assignment.status==='unassigned'?'Assign':'Reassign')+' · '+label(assignment.review_type);
 q('#ptrAssignmentRequirement').textContent=(courseFound?courseFound.title+' · ':'')+'Required reviewer domain: '+assignment.reviewer_domain+'. Only active reviewers verified in-house for this exact domain are listed.';
 q('#ptrAssignmentReviewer').innerHTML=eligible.map(function(r){
  return '<option value="'+esc(r.id)+'" '+(r.id===assignment.reviewer_id?'selected':'')+'>'+esc(r.full_name)+' · '+esc(r.qualification)+'</option>';
 }).join('');
 q('#ptrAssignmentDue').value=assignment.due_date||'';
 q('#ptrAssignmentNotes').value=assignment.assignment_notes||'';
 function showDetail(){
  var selected=eligible.find(function(r){return r.id===q('#ptrAssignmentReviewer').value});
  q('#ptrAssignmentReviewerDetail').textContent=selected
    ? selected.full_name+' · '+selected.qualification+(selected.organization?' · '+selected.organization:'')+' · '+(selected.reviewer_domains||[]).join(', ')
    : '';
 }
 q('#ptrAssignmentReviewer').onchange=showDetail;
 showDetail();
 dialog.showModal();
}
async function saveAssignmentForm(){
 var assignment=state.selectedAssignment;
 if(!assignment)return toast('Review assignment could not be found.',true);
 var reviewerId=q('#ptrAssignmentReviewer').value;
 var due=q('#ptrAssignmentDue').value||null;
 var notes=q('#ptrAssignmentNotes').value.trim()||null;
 if(!reviewerId)return toast('Select a Verified In-House reviewer.',true);
 var save=q('#ptrAssignmentSave');if(save)save.disabled=true;
 try{
  var out=await rpc('admin_assign_professional_reviewer',{
   p_assignment_id:assignment.id,p_reviewer_id:reviewerId,p_due_date:due,p_notes:notes
  });
  if(out.error)return toast(out.error.message||'Reviewer could not be assigned.',true);
  q('#ptrAssignmentDialog').close();
  state.selectedAssignment=null;
  toast('Reviewer assigned to '+assignment.reviewer_domain+'.');
  await load();
 }finally{if(save)save.disabled=false}
}
async function startReviewSlot(id){
 var out=await rpc('admin_start_professional_review_assignment',{p_assignment_id:id});
 if(out.error)return toast(out.error.message||'Review could not be started.',true);
 toast('Review marked In Review.');
 await load();
}
function addReviewer(){
 var dialog=q('#ptrReviewerDialog');if(!dialog)return;
 q('#ptrReviewerName').value='';
 q('#ptrReviewerQualification').value='';
 q('#ptrReviewerDomains').value='';
 q('#ptrReviewerOrganization').value='';
 q('#ptrReviewerEvidence').value='';
 var domains=[];
 state.courses.forEach(function(course){
  (course.assignments||[]).forEach(function(a){
   if(domains.indexOf(a.reviewer_domain)<0)domains.push(a.reviewer_domain);
  });
 });
 domains.sort();
 q('#ptrReviewerDomainHelp').innerHTML='<b>Current reviewer domains:</b><br>'+domains.map(esc).join(' · ');
 dialog.showModal();
 q('#ptrReviewerName').focus();
}
async function saveReviewerForm(){
 var name=q('#ptrReviewerName').value.trim();
 var qualification=q('#ptrReviewerQualification').value.trim();
 var domains=q('#ptrReviewerDomains').value.split(',').map(function(x){return x.trim()}).filter(Boolean);
 var organization=q('#ptrReviewerOrganization').value.trim()||null;
 var evidence=q('#ptrReviewerEvidence').value.trim()||null;
 if(!name)return toast('Reviewer full name is required.',true);
 if(qualification.length<10)return toast('Enter a meaningful reviewer qualification or credential.',true);
 if(!domains.length)return toast('Enter at least one reviewer domain.',true);
 var save=q('#ptrReviewerSave');if(save)save.disabled=true;
 try{
  var out=await rpc('admin_register_professional_reviewer',{
   p_full_name:name,p_qualification:qualification,p_reviewer_domains:domains,
   p_organization:organization,p_evidence_ref:evidence
  });
  if(out.error)return toast(out.error.message||'Reviewer could not be registered.',true);
  q('#ptrReviewerDialog').close();
  toast('Reviewer registered. Verify in-house before using for signoff.');
  await load();
 }finally{if(save)save.disabled=false}
}
function openReminderSettings(){
 if(!state.deadlines.is_key_administrator)return toast('Key administrator access required.',true);
 var cfg=state.deadlines.settings||{};
 q('#ptrReminderEnabled').checked=cfg.reminders_enabled!==false;
 q('#ptrDueSoonDays').value=cfg.due_soon_days||7;
 q('#ptrStalledDays').value=cfg.stalled_days||7;
 q('#ptrReminderSettingsDialog').showModal();
}
async function saveReminderSettings(){
 var enabled=!!q('#ptrReminderEnabled').checked;
 var dueSoon=parseInt(q('#ptrDueSoonDays').value,10);
 var stalled=parseInt(q('#ptrStalledDays').value,10);
 if(!Number.isInteger(dueSoon)||dueSoon<1||dueSoon>30)return toast('Due-soon days must be between 1 and 30.',true);
 if(!Number.isInteger(stalled)||stalled<1||stalled>60)return toast('Stalled-review days must be between 1 and 60.',true);
 var save=q('#ptrReminderSettingsSave');if(save)save.disabled=true;
 try{
  var out=await rpc('admin_set_professional_review_reminder_settings',{
   p_enabled:enabled,p_due_soon_days:dueSoon,p_stalled_days:stalled
  });
  if(out.error)return toast(out.error.message||'Reminder settings could not be saved.',true);
  q('#ptrReminderSettingsDialog').close();
  toast('Review reminder settings updated.');
  await load();
 }finally{if(save)save.disabled=false}
}
async function updateReviewReminder(id,action){
 var out=await rpc('admin_update_professional_review_reminder',{
  p_reminder_id:id,p_action:action,p_snooze_days:null
 });
 if(out.error)return toast(out.error.message||'Reminder could not be updated.',true);
 toast(action==='acknowledge'?'Review alert acknowledged.':'Review alert reopened.');
 await load();
}
function openReviewerCapacity(id){
 if(!state.workload.is_key_administrator)return toast('Key administrator access required to change reviewer capacity.',true);
 var w=(state.workload.reviewers||[]).find(function(x){return x.id===id});
 if(!w)return toast('Reviewer workload record could not be found.',true);
 state.selectedCapacityReviewer=w;
 q('#ptrCapacityTitle').textContent='Capacity · '+w.full_name;
 q('#ptrCapacityStatus').value=w.availability_status||'available';
 q('#ptrCapacityMax').value=w.max_active_assignments==null?'':w.max_active_assignments;
 q('#ptrCapacityNotes').value=w.capacity_notes||'';
 q('#ptrCapacityDialog').showModal();
}
async function saveReviewerCapacity(){
 var w=state.selectedCapacityReviewer;
 if(!w)return toast('Reviewer workload record could not be found.',true);
 var status=q('#ptrCapacityStatus').value;
 var raw=q('#ptrCapacityMax').value.trim();
 var max=raw?parseInt(raw,10):null;
 var notes=q('#ptrCapacityNotes').value.trim()||null;
 if(max!==null&&(!Number.isInteger(max)||max<1||max>100))return toast('Maximum active assignments must be between 1 and 100, or left blank.',true);
 var save=q('#ptrCapacitySave');if(save)save.disabled=true;
 try{
  var out=await rpc('admin_set_professional_reviewer_capacity',{
   p_reviewer_id:w.id,
   p_availability_status:status,
   p_max_active_assignments:max,
   p_notes:notes
  });
  if(out.error)return toast(out.error.message||'Reviewer capacity could not be saved.',true);
  q('#ptrCapacityDialog').close();
  state.selectedCapacityReviewer=null;
  toast('Reviewer capacity updated.');
  await load();
 }finally{if(save)save.disabled=false}
}
function verifyReviewer(id,verified){
 var reviewer=state.reviewers.find(function(r){return r.id===id});
 if(!reviewer)return toast('Reviewer could not be found.',true);
 state.selectedReviewerVerification=reviewer;
 var dialog=q('#ptrVerificationDialog');
 q('#ptrVerificationTitle').textContent=verified?'Verify In-House Reviewer':'Review / Reject Reviewer';
 q('#ptrVerificationIntro').textContent=verified
  ? 'Complete every verification item and confirm each declared reviewer domain before this reviewer can sign off on professional training.'
  : 'You may record a rejection without completing every checklist item, but a clear rejection reason is required.';
 q('#ptrVerificationReviewerDetail').innerHTML=
  '<b>'+esc(reviewer.full_name)+'</b><br>'+
  esc(reviewer.qualification||'')+
  (reviewer.organization?'<br>'+esc(reviewer.organization):'')+
  (reviewer.evidence_ref?'<br><small>Evidence/reference: '+esc(reviewer.evidence_ref)+'</small>':'');
 ['#ptrVerifyIdentity','#ptrVerifyQualification','#ptrVerifyEvidence','#ptrVerifyConflict'].forEach(function(sel){q(sel).checked=false});
 q('#ptrVerificationNotes').value='';
 q('#ptrVerificationDomains').innerHTML=(reviewer.reviewer_domains||[]).map(function(domain){
  return '<label class="ptr-attest" style="margin:5px 0"><input type="checkbox" data-ptr-verify-domain="'+esc(domain)+'"><span>'+esc(domain)+'</span></label>';
 }).join('')||'<small>No reviewer domains are currently declared.</small>';
 q('#ptrVerificationApprove').hidden=!verified;
 q('#ptrVerificationReject').hidden=false;
 dialog.showModal();
}
async function saveReviewerVerification(verified){
 var reviewer=state.selectedReviewerVerification;
 if(!reviewer)return toast('Reviewer could not be found.',true);
 var notes=q('#ptrVerificationNotes').value.trim();
 var domains=qa('[data-ptr-verify-domain]',q('#ptrVerificationDialog')).filter(function(x){return x.checked}).map(function(x){return x.dataset.ptrVerifyDomain});
 var checklist={
  identity_checked:!!q('#ptrVerifyIdentity').checked,
  qualification_checked:!!q('#ptrVerifyQualification').checked,
  evidence_reviewed:!!q('#ptrVerifyEvidence').checked,
  conflict_independence_checked:!!q('#ptrVerifyConflict').checked,
  checked_domains:domains
 };
 if(verified){
  if(!checklist.identity_checked||!checklist.qualification_checked||!checklist.evidence_reviewed||!checklist.conflict_independence_checked)
   return toast('Complete every in-house verification checklist item before approval.',true);
  if(domains.length!==(reviewer.reviewer_domains||[]).length)
   return toast('Verify every declared reviewer domain before approval.',true);
 }
 if(notes.length<10)return toast(verified?'Enter verification notes of at least 10 characters.':'Enter a rejection reason of at least 10 characters.',true);
 var approve=q('#ptrVerificationApprove'),reject=q('#ptrVerificationReject');
 if(approve)approve.disabled=true;if(reject)reject.disabled=true;
 try{
  var out=await rpc('admin_verify_professional_reviewer_v2',{
   p_reviewer_id:reviewer.id,
   p_verified:verified,
   p_checklist:checklist,
   p_notes:notes
  });
  if(out.error)return toast(out.error.message||'Reviewer verification could not be saved.',true);
  q('#ptrVerificationDialog').close();
  state.selectedReviewerVerification=null;
  toast(verified?'Reviewer verified in-house.':'Reviewer rejected.');
  await load();
 }finally{
  if(approve)approve.disabled=false;if(reject)reject.disabled=false;
 }
}
function activate(){
 if(!ensureUi())return;
 load();
}
document.addEventListener('click',function(event){
 var reminderSettings=event.target.closest('#ptrReminderSettings');
 if(reminderSettings){event.preventDefault();openReminderSettings();return}
 var reminderAction=event.target.closest('[data-ptr-reminder-action]');
 if(reminderAction){event.preventDefault();updateReviewReminder(reminderAction.dataset.ptrReminderId,reminderAction.dataset.ptrReminderAction);return}
 var capacity=event.target.closest('[data-ptr-capacity]');
 if(capacity){event.preventDefault();openReviewerCapacity(capacity.dataset.ptrCapacity);return}
 var evidenceModule=event.target.closest('[data-ptr-evidence-module]');
 if(evidenceModule){event.preventDefault();openEvidenceModule(evidenceModule.dataset.ptrEvidenceModule);return}
 var publish=event.target.closest('[data-ptr-publish]');
 if(publish){event.preventDefault();publishProfessionalCourse(publish.dataset.ptrPublish);return}
 var enableCheckout=event.target.closest('[data-ptr-enable-checkout]');
 if(enableCheckout){event.preventDefault();setProfessionalCourseCheckout(enableCheckout.dataset.ptrEnableCheckout,true);return}
 var disableCheckout=event.target.closest('[data-ptr-disable-checkout]');
 if(disableCheckout){event.preventDefault();setProfessionalCourseCheckout(disableCheckout.dataset.ptrDisableCheckout,false);return}
 var toggle=event.target.closest('#ptrToggleDualReview');
 if(toggle){event.preventDefault();toggleDualReviewOverride();return}
 var linkAdmin=event.target.closest('[data-ptr-link-key-admin]');
 if(linkAdmin){event.preventDefault();linkKeyAdminReviewer(linkAdmin.dataset.ptrLinkKeyAdmin);return}
 var assign=event.target.closest('[data-ptr-assign-slot]');
 if(assign){event.preventDefault();assignReviewSlot(assign.dataset.ptrAssignSlot);return}
 var startSlot=event.target.closest('[data-ptr-start-slot]');
 if(startSlot){event.preventDefault();startReviewSlot(startSlot.dataset.ptrStartSlot);return}
 var add=event.target.closest('#ptrAddReviewer');
 if(add){event.preventDefault();addReviewer();return}
 var verify=event.target.closest('[data-ptr-verify-reviewer]');
 if(verify){event.preventDefault();verifyReviewer(verify.dataset.ptrVerifyReviewer,true);return}
 var reject=event.target.closest('[data-ptr-reject-reviewer]');
 if(reject){event.preventDefault();verifyReviewer(reject.dataset.ptrRejectReviewer,false);return}
 var button=event.target.closest('[data-ptr-course]');
 if(button){event.preventDefault();openReview(button.dataset.ptrCourse,button.dataset.ptrReview);return}
 var tab=event.target.closest('[data-credential-tab="training"]');
 if(tab)setTimeout(activate,60);
},true);
document.addEventListener('lellee:pagechange',function(event){
 if(event.detail&&event.detail.page==='credentialing-center')setTimeout(function(){if(q('[data-credential-tab="training"].active'))activate();else ensureUi()},80);
});
function start(){
 ensureUi();
 if(q('#page-credentialing-center.active')&&q('[data-credential-tab="training"].active'))activate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.LelleeProfessionalTrainingReview={version:VERSION,refresh:load};
})();
