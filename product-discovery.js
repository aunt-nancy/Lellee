
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="product-row ${klass}"><div class="product-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function setTab(tab){qa('[data-product-tab]').forEach(b=>b.classList.toggle('active',b.dataset.productTab===tab));['feedback','requests','roadmap','research','experiments','adoption','learning','guardrails'].forEach(x=>q('#productPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function load(){
 const d=await rpc('get_product_discovery_summary');if(!d)return;const s=d.summary||{};
 q('#productFeedbackOpen').textContent=s.open_feedback||0;q('#productRequests').textContent=s.feature_requests||0;q('#productRoadmap').textContent=s.roadmap_items||0;q('#productExperiments').textContent=s.experiments_review||0;
 q('#productFeedbackList').innerHTML=(d.feedback||[]).map(x=>row('F',x.title,`${x.feedback_type} · ${x.source_type} · ${x.area}`,x.status,x.status==='new'?'attention':'' )).join('')||'<div class="approved-resource-empty">No feedback yet.</div>';
 q('#productRequestList').innerHTML=(d.requests||[]).map(x=>row('R',x.title,`${x.request_type} · ${x.status}`,x.vote_label||'')).join('');
 q('#productRoadmapList').innerHTML=(d.roadmap||[]).map(x=>row('P',x.title,`${x.category} · ${x.status}`,x.priority_label||'',x.status==='blocked'?'attention':x.status==='released'?'ok':'' )).join('');
 q('#productResearchList').innerHTML=(d.research||[]).map(x=>row('U',x.title,`${x.research_type} · ${x.status}`,x.participant_type||'')).join('');
 q('#productExperimentList').innerHTML=(d.experiments||[]).map(x=>row('E',x.name,`${x.experiment_type} · ${x.status}`,x.review_status,x.status==='review'||x.review_status==='pending'?'attention':'' )).join('');
 q('#productAdoptionList').innerHTML=(d.adoption||[]).map(x=>row('A',x.feature_label,`${x.scope_type} · ${x.period_label}`,x.adoption_label||'')).join('');
 q('#productLearningList').innerHTML=(d.learning||[]).map(x=>row('L',x.title,`${x.learning_type} · ${x.status}`,x.decision_label||'')).join('');
 q('#productGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="product-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addFeedback(){
 const title=prompt('Feedback title:');if(!title)return;
 const note=prompt('Feedback details:');if(!note)return;
 const {error}=await sb.from('product_feedback').insert({title,feedback_text:note,feedback_type:'idea',area:'other',source_type:'staff',status:'new',submitted_by_user_id:currentUser.id});
 if(error)return toast(error.message,true);load();
}
async function addRoadmap(){
 const title=prompt('Roadmap item:');if(!title)return;
 const category=prompt('Category: consumer, coach, organization, admin, platform, content, growth, other','platform')||'other';
 const {error}=await sb.from('product_roadmap_items').insert({title,category,status:'discovery',priority:'normal',created_by:currentUser.id});
 if(error)return toast(error.message,true);load();
}
async function addExperiment(){
 const name=prompt('Experiment name:');if(!name)return;
 const type=prompt('Type: usability, onboarding, content, navigation, messaging, pricing_display, other','usability')||'other';
 const {error}=await sb.from('product_experiments').insert({name,experiment_type:type,status:'draft',review_status:'pending',sensitive_targeting_allowed:false,automatic_production_change:false,created_by:currentUser.id});
 if(error)return toast(error.message,true);load();
}
async function submitUserFeedback(){
 const text=(q('#feedbackText')?.value||'').trim();if(!text)return toast('Please enter your feedback.',true);
 const {error}=await sb.from('product_feedback').insert({
   title:text.slice(0,80),
   feedback_text:text,
   feedback_type:q('#feedbackType')?.value||'idea',
   area:q('#feedbackArea')?.value||'other',
   source_type:'consumer',
   status:'new',
   submitted_by_user_id:currentUser?.id||null,
   contains_sensitive_content:false
 });
 if(error)return toast(error.message,true);
 q('#feedbackText').value='';toast('Feedback sent. Thank you.');
}
qa('[data-product-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.productTab));
q('#productAddFeedback')?.addEventListener('click',addFeedback);
q('#productAddRoadmap')?.addEventListener('click',addRoadmap);
q('#productAddExperiment')?.addEventListener('click',addExperiment);
q('#feedbackSubmit')?.addEventListener('click',submitUserFeedback);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='product-discovery')load()}}
})();
