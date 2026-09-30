
(function(){
'use strict';
var VERSION='2026-09-30-professional-training-v2';
var state={context:null,course:null,module:null,busy:false};
var root=null;
function q(s,r){return (r||document).querySelector(s)}
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function client(){return (window.LelleeAuthContext&&window.LelleeAuthContext.client)||window.__lelleeSupabaseClient||(typeof sb!=='undefined'?sb:null)}
async function currentUser(){
 var bridged=window.LelleeAuthContext&&window.LelleeAuthContext.getCurrentUser?window.LelleeAuthContext.getCurrentUser():window.__lelleeAuthUser;
 if(bridged)return bridged;
 var c=client();if(!c||!c.auth)return null;
 try{var out=await c.auth.getUser();return out.data&&out.data.user?out.data.user:null}catch(_){return null}
}
async function rpc(name,args){
 var c=client();if(!c)return {data:null,error:new Error('Supabase client unavailable')};
 try{return await c.rpc(name,args||{})}catch(error){return {data:null,error:error}}
}
function money(cents){try{return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents||0)/100)}catch(_){return '$'+(Number(cents||0)/100).toFixed(2)}}
function toast(message,bad){
 var el=q('#professionalTrainingToast');
 if(!el){
  el=document.createElement('div');el.id='professionalTrainingToast';
  el.style.cssText='position:fixed;right:16px;bottom:18px;z-index:22000;max-width:360px;padding:11px 14px;border-radius:9px;color:#fff;background:#30273a;box-shadow:0 12px 32px rgba(20,14,32,.22);font:600 13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif';
  document.body.appendChild(el);
 }
 el.style.background=bad?'#7c3737':'#30273a';el.textContent=message;el.hidden=false;
 clearTimeout(el._timer);el._timer=setTimeout(function(){el.hidden=true},3000);
}
function md(text){
 var s=esc(text||'');
 s=s.replace(/^### (.*)$/gm,'<h4>$1</h4>').replace(/^## (.*)$/gm,'<h3>$1</h3>').replace(/^# (.*)$/gm,'<h2>$1</h2>');
 s=s.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
 s=s.replace(/^\- (.*)$/gm,'<li>$1</li>');
 s=s.replace(/(<li>.*<\/li>)/gs,function(m){return '<ul>'+m+'</ul>'});
 s=s.replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>');
 return '<p>'+s+'</p>';
}
function ensureStyles(){
 if(q('#professionalTrainingV2Styles'))return;
 var style=document.createElement('style');style.id='professionalTrainingV2Styles';
 style.textContent=
 '.pt2{max-width:1180px;margin:0 auto;padding:24px}.pt2-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.pt2-head h2{margin:4px 0 7px;font-size:1.35rem;color:#30273a}.pt2-head p{margin:0;max-width:720px;color:#756d79;font-size:.76rem;line-height:1.55}.pt2-kicker{font-size:.58rem;letter-spacing:.12em;font-weight:800;color:#7752a0}.pt2-note{border:1px solid #e5deea;background:#faf8fc;border-radius:12px;padding:12px 14px;color:#6f6672;font-size:.65rem;line-height:1.5;margin:10px 0 16px}'+
 '.pt2-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.pt2-card{border:1px solid #e5deea;background:#fff;border-radius:14px;padding:16px;box-shadow:0 7px 22px rgba(42,30,55,.045)}.pt2-card.featured{border-color:#d2c2df}.pt2-card h3{font-size:.9rem;margin:6px 0}.pt2-card p{font-size:.64rem;line-height:1.5;color:#726a76}.pt2-price{font-size:1rem;font-weight:850;color:#65409a;margin:9px 0}.pt2-meta{display:flex;gap:6px;flex-wrap:wrap}.pt2-pill{display:inline-flex;padding:4px 7px;border-radius:999px;background:#f2eef6;color:#665b6c;font-size:.51rem;font-weight:750}.pt2-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.pt2-btn{border:1px solid #d8cfe0;background:#fff;color:#65409a;border-radius:8px;padding:8px 10px;font-size:.58rem;font-weight:800;cursor:pointer}.pt2-btn.primary{background:#65409a;color:#fff;border-color:#65409a}.pt2-btn[disabled]{opacity:.5;cursor:not-allowed}'+
 '.pt2-course{margin-top:12px}.pt2-course-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border:1px solid #e5deea;border-radius:13px;padding:14px;background:#fff}.pt2-course-top h3{margin:3px 0;font-size:1rem}.pt2-modules{margin-top:12px;display:grid;gap:8px}.pt2-module-row{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;border:1px solid #e8e1ec;background:#fff;border-radius:11px;padding:10px}.pt2-module-num{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#f2eef6;color:#65409a;font-weight:850;font-size:.65rem}.pt2-module-row.locked{opacity:.57}.pt2-module-row h4{margin:0 0 3px;font-size:.69rem}.pt2-module-row p{margin:0;font-size:.55rem;color:#7a727d}.pt2-score{font-size:.54rem;color:#5f5763}'+
 '.pt2-lesson{border:1px solid #e4dce8;border-radius:14px;background:#fff;padding:18px;margin-top:12px}.pt2-lesson h2{font-size:1.05rem}.pt2-lesson h3{font-size:.86rem;margin-top:18px}.pt2-lesson h4{font-size:.72rem;margin-top:14px}.pt2-lesson p,.pt2-lesson li{font-size:.68rem;line-height:1.62;color:#4d4651}.pt2-lesson ul{padding-left:20px}.pt2-assessment{border-top:1px solid #ebe5ee;margin-top:18px;padding-top:14px}.pt2-question{padding:11px 0;border-bottom:1px solid #eee8f0}.pt2-question>p{font-weight:760;color:#3e3742}.pt2-choice{display:block;border:1px solid #e3dbe7;border-radius:8px;padding:8px 9px;margin:6px 0;font-size:.62rem;cursor:pointer}.pt2-choice input{margin-right:7px}.pt2-textarea{width:100%;box-sizing:border-box;min-height:120px;border:1px solid #dcd3e1;border-radius:9px;padding:10px;font:inherit;font-size:.66rem;line-height:1.5}.pt2-capstone{min-height:260px}.pt2-result{border-radius:9px;padding:10px 12px;margin:10px 0;font-size:.64rem}.pt2-result.pass{background:#f1faf3;color:#356244}.pt2-result.fail{background:#fff3f4;color:#7c3e49}'+
 '@media(max-width:900px){.pt2-grid{grid-template-columns:1fr 1fr}}@media(max-width:640px){.pt2{padding:16px}.pt2-head,.pt2-course-top{display:block}.pt2-grid{grid-template-columns:1fr}.pt2-module-row{grid-template-columns:36px 1fr}.pt2-module-row .pt2-actions{grid-column:1/-1}.pt2-head .pt2-actions{margin-top:10px}}';
 document.head.appendChild(style);
}
function mount(){
 var page=q('#page-training-center');
 if(!page)return false;
 var box=q('.b5-page',page)||page;
 if(q('#professionalTrainingV2',box)){root=q('#professionalTrainingV2',box);return true}
 ensureStyles();
 box.innerHTML='<div class="pt2" id="professionalTrainingV2"><div class="pt2-head"><div><span class="pt2-kicker">LELLEE PROFESSIONAL TRAINING</span><h2>Build skills in stages, with real review gates.</h2><p>Professional courses use sequential modules, applied assessments and human-reviewed capstones. Course completion records learning only; it does not create a professional license, clinical credential or legal authority.</p></div><div class="pt2-actions"><button class="pt2-btn" data-pt2-back>← Professional Hub</button></div></div><div id="pt2Body"><div class="pt2-note">Loading professional training…</div></div></div>';
 root=q('#professionalTrainingV2',box);
 return true;
}
function navigate(page){
 if(typeof window.showPage==='function')window.showPage(page);
 else{
  qa('.page').forEach(function(x){x.classList.remove('active')});
  var target=q('#page-'+page);if(target)target.classList.add('active');
 }
}
function courseByKey(key){return (state.context&&state.context.courses||[]).find(function(c){return c.course_key===key})||null}
function progressPct(course){
 var p=course.progress||[];if(!p.length)return 0;
 var done=p.filter(function(x){return x.status==='passed'}).length;
 return Math.round(done*100/p.length);
}
function renderCatalog(){
 var body=q('#pt2Body');if(!body)return;
 var ctx=state.context||{};
 if(!ctx.authenticated){
  body.innerHTML='<div class="pt2-note"><b>Sign in to access professional training.</b><br>Your course access and learning progress are tied to your Lellee account.</div>';
  return;
 }
 var courses=ctx.courses||[];
 if(!courses.length){
  body.innerHTML='<div class="pt2-note"><b>No professional courses are currently open for enrollment.</b><br>Lellee only displays courses here after curriculum, assessment, scope/safety and capstone release requirements are complete. Draft and Internal Review courses remain hidden.</div>';
  return;
 }
 body.innerHTML='<div class="pt2-grid">'+courses.map(function(c){
  var enrolled=!!c.enrollment;
  var complete=c.enrollment&&c.enrollment.status==='completed';
  var pct=progressPct(c);
  var status=enrolled?(complete?'Completed':pct+'% complete'):(c.checkout_enabled?'Enrollment open':'Enrollment not open');
  var action=enrolled?'<button class="pt2-btn primary" data-pt2-course="'+esc(c.course_key)+'">'+(complete?'Review course':'Continue')+'</button>':
   c.checkout_enabled&&c.checkout_url?'<button class="pt2-btn primary" data-pt2-buy="'+esc(c.course_key)+'">Enroll</button>':
   '<button class="pt2-btn" disabled>Enrollment not open</button>';
  return '<article class="pt2-card '+(c.category==='foundation'?'featured':'')+'"><div class="pt2-meta"><span class="pt2-pill">'+esc(c.category||'course')+'</span><span class="pt2-pill">'+esc(c.estimated_hours)+' hours</span><span class="pt2-pill">'+esc(status)+'</span></div><h3>'+esc(c.title)+'</h3><div class="pt2-price">'+esc(money(c.price_cents))+' <small>one-time</small></div><p>'+esc(c.description||'')+'</p><p><b>Passing standard:</b> '+esc(c.module_pass_score)+'% per instructional module'+(c.capstone_required?' · human-reviewed capstone':'')+'.</p><div class="pt2-actions">'+action+'</div></article>';
 }).join('')+'</div>';
}
function renderCourse(course){
 state.course=course;state.module=null;
 var body=q('#pt2Body');if(!body)return;
 var enrolled=course.enrollment;
 if(!enrolled){renderCatalog();return}
 var progress=course.progress||[];
 body.innerHTML='<div class="pt2-course"><div class="pt2-course-top"><div><span class="pt2-kicker">'+esc(course.category||'COURSE')+'</span><h3>'+esc(course.title)+'</h3><p>'+esc(course.description||'')+'</p><div class="pt2-meta"><span class="pt2-pill">'+esc(course.estimated_hours)+' hours</span><span class="pt2-pill">'+esc(progressPct(course))+'% complete</span><span class="pt2-pill">'+esc(enrolled.status)+'</span></div></div><div class="pt2-actions"><button class="pt2-btn" data-pt2-catalog>All courses</button></div></div><div class="pt2-modules">'+progress.map(function(m){
  var locked=!m.status||m.status==='locked';
  var label=m.status==='needs_review'?'Human review pending':m.status?String(m.status).replace(/_/g,' '):'locked';
  var btn=locked?'<button class="pt2-btn" disabled>Locked</button>':'<button class="pt2-btn '+(m.status==='available'||m.status==='in_progress'?'primary':'')+'" data-pt2-module="'+esc(m.module_id)+'">'+(m.status==='passed'?'Review':m.status==='needs_review'?'View':'Open')+'</button>';
  return '<article class="pt2-module-row '+(locked?'locked':'')+'"><div class="pt2-module-num">'+esc(m.sequence)+'</div><div><h4>'+esc(m.title)+'</h4><p>'+esc(m.estimated_minutes)+' min · '+esc(m.module_type)+' · '+esc(label)+'</p>'+(m.best_score!=null?'<div class="pt2-score">Best score: '+esc(m.best_score)+'%</div>':'')+'</div><div class="pt2-actions">'+btn+'</div></article>';
 }).join('')+'</div><div class="pt2-note"><b>Certificate scope:</b> '+esc(course.certificate_scope_note||'Lellee course completion only; not a professional license or clinical/legal credential.')+'</div></div>';
}
async function loadContext(){
 if(state.busy)return;
 state.busy=true;
 try{
  var out=await rpc('get_my_professional_training_context');
  if(out.error){console.warn('[Professional Training]',out.error);q('#pt2Body').innerHTML='<div class="pt2-note"><b>Professional training could not be loaded.</b><br>'+esc(out.error.message||'Please try again.')+'</div>';return}
  state.context=out.data||{};
  if(state.course){
   var updated=courseByKey(state.course.course_key);
   if(updated){renderCourse(updated);return}
   state.course=null;
  }
  renderCatalog();
 }finally{state.busy=false}
}
async function openCourse(key){var c=courseByKey(key);if(c)renderCourse(c)}
async function openModule(id){
 var out=await rpc('get_my_professional_module',{p_module_id:id});
 if(out.error)return toast(out.error.message||'Module could not be opened.',true);
 state.module=out.data;
 var m=out.data.module||{},p=out.data.progress||{},assessment=out.data.assessment||[];
 if(p.status==='available'){
  var start=await rpc('start_my_professional_module',{p_module_id:id});
  if(start.error)return toast(start.error.message||'Module could not be started.',true);
 }
 var body=q('#pt2Body');if(!body)return;
 var lesson='<div class="pt2-lesson"><div class="pt2-actions"><button class="pt2-btn" data-pt2-return-course>← Course modules</button></div><span class="pt2-kicker">MODULE '+esc(m.sequence)+'</span><h2>'+esc(m.title)+'</h2><div class="pt2-meta"><span class="pt2-pill">'+esc(m.estimated_minutes)+' minutes</span><span class="pt2-pill">Pass '+esc(m.minimum_score)+'%</span></div>'+md(m.content_md||'');
 if(m.learning_objectives&&m.learning_objectives.length)lesson+='<h3>Learning objectives</h3><ul>'+m.learning_objectives.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>';
 if(m.practice_requirements&&m.practice_requirements.length)lesson+='<h3>Practice</h3><ul>'+m.practice_requirements.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>';
 if(m.module_type==='capstone'){
  if(p.status==='needs_review')lesson+='<div class="pt2-result pass"><b>Capstone submitted.</b><br>Human review is pending. You will not be marked complete until the capstone is approved.</div>';
  else lesson+='<div class="pt2-assessment"><h3>Applied capstone</h3><p>Respond fully to the capstone scenario above. Your response is reviewed by a human reviewer.</p><textarea class="pt2-textarea pt2-capstone" id="pt2CapstoneResponse" placeholder="Write your capstone response here…"></textarea><div class="pt2-actions"><button class="pt2-btn primary" data-pt2-submit-capstone="'+esc(m.id)+'">Submit for Human Review</button></div></div>';
 }else if(assessment.length){
  lesson+='<div class="pt2-assessment"><h3>Module assessment</h3><p>Answer every question. A score of '+esc(m.minimum_score)+'% or higher is required.</p><form id="pt2AssessmentForm">'+assessment.map(function(a){
   return '<div class="pt2-question"><p>'+esc(a.item_order)+'. '+esc(a.prompt)+'</p>'+(a.choices||[]).map(function(choice){
    return '<label class="pt2-choice"><input type="radio" name="q_'+esc(a.id)+'" value="'+esc(choice)+'"> '+esc(choice)+'</label>';
   }).join('')+'</div>';
  }).join('')+(m.requires_reflection?'<h3>Reflection</h3><textarea class="pt2-textarea" id="pt2Reflection" placeholder="Write a short reflection on how you would apply this module…"></textarea>':'')+'<div id="pt2AssessmentResult"></div><div class="pt2-actions"><button class="pt2-btn primary" type="button" data-pt2-submit-assessment="'+esc(m.id)+'">Submit Assessment</button></div></form></div>';
 }else lesson+='<div class="pt2-note">This module does not currently have an approved learner assessment.</div>';
 lesson+='</div>';body.innerHTML=lesson;
}
async function submitAssessment(id){
 var assessment=state.module&&state.module.assessment||[];
 var answers={};
 for(var i=0;i<assessment.length;i++){
  var a=assessment[i],checked=q('input[name="q_'+CSS.escape(a.id)+'"]:checked');
  if(!checked)return toast('Answer every assessment question before submitting.',true);
  answers[a.id]=checked.value;
 }
 var reflection=q('#pt2Reflection')?q('#pt2Reflection').value.trim():null;
 var out=await rpc('submit_my_professional_assessment',{p_module_id:id,p_answers:answers,p_reflection:reflection});
 if(out.error)return toast(out.error.message||'Assessment could not be submitted.',true);
 var r=out.data||{},box=q('#pt2AssessmentResult');
 if(box)box.innerHTML='<div class="pt2-result '+(r.passed?'pass':'fail')+'"><b>'+esc(r.score)+'%</b> · '+(r.passed?'Passed':'Not yet passed')+' · required '+esc(r.required_score)+'%</div>';
 toast(r.passed?'Module passed.':'Assessment submitted. Review the material and try again.',!r.passed);
 if(r.passed){await loadContext()}
}
async function submitCapstone(id){
 var text=q('#pt2CapstoneResponse')?q('#pt2CapstoneResponse').value.trim():'';
 if(text.length<250)return toast('Please provide a complete capstone response before submitting.',true);
 var out=await rpc('submit_my_professional_capstone',{p_module_id:id,p_response:{response:text}});
 if(out.error)return toast(out.error.message||'Capstone could not be submitted.',true);
 toast('Capstone submitted for human review.');
 await loadContext();
}
async function buyCourse(key){
 var c=courseByKey(key);if(!c||!c.checkout_enabled||!c.checkout_url)return toast('Enrollment is not open yet.',true);
 var u=await currentUser();if(!u)return toast('Please sign in before enrolling.',true);
 try{
  var url=new URL(String(c.checkout_url));
  if(url.hostname!=='buy.stripe.com')throw new Error('Payment URL is not trusted.');
  url.searchParams.set('client_reference_id',u.id);
  if(u.email)url.searchParams.set('locked_prefilled_email',u.email);
  window.location.assign(url.toString());
 }catch(error){toast(error.message||'Secure checkout is unavailable.',true)}
}
document.addEventListener('click',function(e){
 var back=e.target.closest('[data-pt2-back]');if(back){e.preventDefault();navigate('professional-hub');return}
 var catalog=e.target.closest('[data-pt2-catalog]');if(catalog){e.preventDefault();state.course=null;state.module=null;renderCatalog();return}
 var course=e.target.closest('[data-pt2-course]');if(course){e.preventDefault();openCourse(course.dataset.pt2Course);return}
 var buy=e.target.closest('[data-pt2-buy]');if(buy){e.preventDefault();buyCourse(buy.dataset.pt2Buy);return}
 var module=e.target.closest('[data-pt2-module]');if(module){e.preventDefault();openModule(module.dataset.pt2Module);return}
 var ret=e.target.closest('[data-pt2-return-course]');if(ret){e.preventDefault();var c=state.course&&courseByKey(state.course.course_key);if(c)renderCourse(c);return}
 var submit=e.target.closest('[data-pt2-submit-assessment]');if(submit){e.preventDefault();submitAssessment(submit.dataset.pt2SubmitAssessment);return}
 var cap=e.target.closest('[data-pt2-submit-capstone]');if(cap){e.preventDefault();submitCapstone(cap.dataset.pt2SubmitCapstone);return}
},true);
function activate(){
 if(!mount())return;
 loadContext();
}
document.addEventListener('lellee:pagechange',function(e){if(e.detail&&e.detail.page==='training-center')setTimeout(activate,40)});
var observer=new MutationObserver(function(){if(q('#page-training-center')&&!q('#professionalTrainingV2'))mount()});
observer.observe(document.documentElement,{childList:true,subtree:true});
function start(){if(mount()&&q('#page-training-center.active'))activate()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.LelleeProfessionalTraining=Object.freeze({version:VERSION,refresh:loadContext});
})();