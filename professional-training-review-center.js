
(function(){
'use strict';

var VERSION='2026-09-29-professional-review-center-v1';
var state={courses:[],reviewers:[],controls:{},selectedCourse:null,selectedReview:null,loaded:false,busy:false};
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
 }
 return true;
}
function render(data){
 state.courses=data.courses||[];
 state.reviewers=data.reviewers||[];
 state.controls=data.controls||{};
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
    if(state.controls.is_key_administrator&&r.verification_status==='verified_in_house'&&r.active){
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
  var issues=course.issues||[];
  var blockers=issues.length?
   '<div class="ptr-blockers"><b>Release blockers:</b> '+issues.map(issueLabel).map(esc).join(' · ')+'</div>':
   '<div class="ptr-blockers ok"><b>All review gates are complete.</b> Publishing and checkout remain separate controlled actions.</div>';
  return '<article class="ptr-course"><div class="ptr-course-head"><div><span class="approved-kicker">'+esc(course.category==='foundation'?'FOUNDATION':'SPECIALTY')+'</span><h4>'+esc(course.title)+'</h4><p>'+esc(course.estimated_hours)+' hrs · '+esc(course.modules)+' modules · '+esc(course.assessments)+' questions · '+esc(course.scenarios)+' scenarios · '+esc(course.status)+'</p></div><div class="ptr-price"><b>'+esc(money(course.price_cents))+'</b><small>'+(course.checkout_enabled?'checkout enabled':'checkout off')+'</small></div></div><div class="ptr-assignments"><b>Reviewer assignment queue</b>'+assignmentHtml+'</div><div class="ptr-domains">'+reviews+'</div>'+blockers+'</article>';
 }).join('')||'<div class="approved-resource-empty">No professional courses found.</div>';
}
async function load(){
 if(state.busy)return;
 if(!ensureUi())return;
 state.busy=true;
 try{
  if(!await isAdmin()){q('#ptrCourseList').innerHTML='<div class="approved-resource-empty">Administrator access required.</div>';return}
  var out=await rpc('get_admin_professional_training_review_center');
  if(out.error){console.warn('Professional review center',out.error);q('#ptrCourseList').innerHTML='<div class="approved-resource-empty">Professional review data could not be loaded.</div>';return}
  state.loaded=true;
  render(out.data||{});
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
async function assignReviewSlot(id){
 var assignment=null;
 state.courses.some(function(course){
  assignment=(course.assignments||[]).find(function(a){return a.id===id})||null;
  return !!assignment;
 });
 if(!assignment)return toast('Review assignment could not be found.',true);
 var eligible=state.reviewers.filter(function(r){
  return r.verification_status==='verified_in_house'&&r.active&&(r.reviewer_domains||[]).indexOf(assignment.reviewer_domain)>=0;
 });
 if(!eligible.length)return toast('No Verified In-House reviewer is available for '+assignment.reviewer_domain+'.',true);
 var options=eligible.map(function(r,i){return (i+1)+'. '+r.full_name+' — '+r.qualification}).join('\n');
 var choice=prompt('Select reviewer for '+assignment.reviewer_domain+':\n'+options,'1');
 if(!choice)return;
 var idx=parseInt(choice,10)-1;
 if(!Number.isInteger(idx)||idx<0||idx>=eligible.length)return toast('Enter the reviewer number shown in the list.',true);
 var due=prompt('Due date YYYY-MM-DD (optional):','')||null;
 var notes=prompt('Assignment notes (optional):','')||null;
 var out=await rpc('admin_assign_professional_reviewer',{
  p_assignment_id:id,p_reviewer_id:eligible[idx].id,p_due_date:due,p_notes:notes
 });
 if(out.error)return toast(out.error.message||'Reviewer could not be assigned.',true);
 toast('Reviewer assigned to '+assignment.reviewer_domain+'.');
 await load();
}
async function startReviewSlot(id){
 var out=await rpc('admin_start_professional_review_assignment',{p_assignment_id:id});
 if(out.error)return toast(out.error.message||'Review could not be started.',true);
 toast('Review marked In Review.');
 await load();
}
async function addReviewer(){
 var name=prompt('Reviewer full name:');if(!name)return;
 var qualification=prompt('Reviewer qualification / credential:');if(!qualification)return;
 var domains=prompt('Reviewer domain(s), comma-separated (example: coaching_sme, instructional_design):');if(!domains)return;
 var organization=prompt('Organization (optional):','')||null;
 var evidence=prompt('Internal verification reference or evidence note (optional):','')||null;
 var list=domains.split(',').map(function(x){return x.trim()}).filter(Boolean);
 var out=await rpc('admin_register_professional_reviewer',{
  p_full_name:name,p_qualification:qualification,p_reviewer_domains:list,
  p_organization:organization,p_evidence_ref:evidence
 });
 if(out.error)return toast(out.error.message||'Reviewer could not be registered.',true);
 toast('Reviewer registered. Verify in-house before using for signoff.');
 await load();
}
async function verifyReviewer(id,verified){
 var note=prompt(verified?'In-house verification notes:':'Reason reviewer was rejected:','')||null;
 var out=await rpc('admin_verify_professional_reviewer',{p_reviewer_id:id,p_verified:verified,p_notes:note});
 if(out.error)return toast(out.error.message||'Reviewer verification could not be saved.',true);
 toast(verified?'Reviewer verified in-house.':'Reviewer rejected.');
 await load();
}
function activate(){
 if(!ensureUi())return;
 load();
}
document.addEventListener('click',function(event){
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
