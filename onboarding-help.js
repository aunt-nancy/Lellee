
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let isAdmin=false;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,status='',action='',id='',klass=''){
 return `<div class="help-row ${klass}"><div class="help-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div>${action?`<button data-help-action="${esc(action)}" data-help-id="${esc(id)}">${esc(status||'Open')}</button>`:`<em>${esc(status||'')}</em>`}</div>`;
}
function setHelpTab(tab){
 qa('[data-help-tab]').forEach(b=>b.classList.toggle('active',b.dataset.helpTab===tab));
 ['recommended','categories','faqs','glossary','whatsnew'].forEach(x=>q('#helpPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}
async function loadHelpCenter(){
 const d=await rpc('get_help_center_summary');if(!d)return;
 const s=d.summary||{};
 q('#helpArticles').textContent=s.articles||0;q('#helpGuides').textContent=s.guides||0;q('#helpFaqs').textContent=s.faqs||0;q('#helpGlossary').textContent=s.glossary||0;
 q('#helpRecommendedList').innerHTML=(d.recommended||[]).map(x=>row('?',x.title,`${x.category_label} · ${x.content_type}`,'Open','help-article',x.id)).join('');
 q('#helpCategoryList').innerHTML=(d.categories||[]).map(x=>`<article class="help-category-card"><b>${esc(x.label)}</b><small>${esc(x.description||'')}</small><button data-help-action="category" data-help-id="${esc(x.category_key)}">${x.article_count} articles</button></article>`).join('');
 q('#helpFaqList').innerHTML=(d.faqs||[]).map(x=>row('Q',x.question,x.answer_preview,'FAQ')).join('');
 q('#helpGlossaryList').innerHTML=(d.glossary||[]).map(x=>row('G',x.term,x.definition,'')).join('');
 q('#helpWhatsNewList').innerHTML=(d.whats_new||[]).map(x=>row('N',x.title,x.summary,new Date(x.published_at).toLocaleDateString())).join('')||'<div class="approved-resource-empty">No release notes yet.</div>';
 wireHelpActions();
}
async function searchHelp(){
 const text=(q('#helpSearchInput')?.value||'').trim();
 if(!text)return loadHelpCenter();
 const d=await rpc('search_help_center',{p_query:text});
 q('#helpRecommendedList').innerHTML=(d||[]).map(x=>row('?',x.title,`${x.category_label} · ${x.content_type}`,'Open','help-article',x.id)).join('')||'<div class="approved-resource-empty">No help articles matched that search.</div>';
 setHelpTab('recommended');wireHelpActions();
}
async function contactSupport(){
 const subject=prompt('What do you need help with?');if(!subject)return;
 const {error}=await sb.from('support_requests').insert({user_id:currentUser.id,request_type:'question',subject,body:'Submitted from Lellee Help Center.',priority:'normal',feature_area:'help_center',status:'open'});
 if(error)return toast(error.message,true);toast('Support request sent.');
}
function wireHelpActions(){
 qa('[data-help-action="help-article"]').forEach(b=>b.onclick=async()=>{
   const d=await rpc('get_help_article',{p_article_id:b.dataset.helpId});if(!d)return;
   alert(`${d.title}\n\n${d.body_text}`);
 });
 qa('[data-help-action="category"]').forEach(b=>b.onclick=async()=>{
   const d=await rpc('get_help_category_articles',{p_category_key:b.dataset.helpId});
   q('#helpRecommendedList').innerHTML=(d||[]).map(x=>row('?',x.title,x.summary,'Open','help-article',x.id)).join('');
   setHelpTab('recommended');wireHelpActions();
 });
}

async function loadGettingStarted(){
 const d=await rpc('get_my_onboarding_summary');if(!d)return;
 const s=d.summary||{}, pct=s.total?Math.round((s.completed/s.total)*100):0;
 q('#onboardingProgressLabel').textContent=`${pct}% complete`;
 q('#guidedOnboardingProgressBar').style.width=pct+'%';
 q('#onboardingStepList').innerHTML=(d.steps||[]).map(x=>row(x.completed?'✓':'○',x.title,x.description,x.completed?'Done':x.optional?'Optional':'Next','onboarding-step',x.id,x.completed?'ok':'' )).join('');
 q('#firstWeekGuideList').innerHTML=(d.first_week||[]).map(x=>row(x.day_label||'•',x.title,x.description,x.status||'')).join('');
 wireOnboardingActions();
}
function wireOnboardingActions(){
 qa('[data-help-action="onboarding-step"]').forEach(b=>b.onclick=async()=>{
   const {error}=await sb.rpc('complete_onboarding_step',{p_step_id:b.dataset.helpId});
   if(error)return toast(error.message,true);
   loadGettingStarted();
 });
}
async function loadCoachQuickstart(){
 const d=await rpc('get_my_workspace_quickstart',{p_workspace:'coach'});if(!d)return;
 const s=d.summary||{},pct=s.total?Math.round((s.completed/s.total)*100):0;
 q('#coachQuickstartProgress').textContent=pct+'% complete';q('#coachQuickstartBar').style.width=pct+'%';
 q('#coachQuickstartList').innerHTML=(d.steps||[]).map(x=>row(x.completed?'✓':'○',x.title,x.description,x.completed?'Done':'Next','quickstart-step',x.id,x.completed?'ok':'' )).join('');
 wireQuickstart();
}
async function loadOrgQuickstart(){
 const d=await rpc('get_my_workspace_quickstart',{p_workspace:'organization'});if(!d)return;
 const s=d.summary||{},pct=s.total?Math.round((s.completed/s.total)*100):0;
 q('#orgQuickstartProgress').textContent=pct+'% complete';q('#orgQuickstartBar').style.width=pct+'%';
 q('#orgQuickstartList').innerHTML=(d.steps||[]).map(x=>row(x.completed?'✓':'○',x.title,x.description,x.completed?'Done':'Next','quickstart-step',x.id,x.completed?'ok':'' )).join('');
 wireQuickstart();
}
function wireQuickstart(){
 qa('[data-help-action="quickstart-step"]').forEach(b=>b.onclick=async()=>{
   const {error}=await sb.rpc('complete_quickstart_step',{p_step_id:b.dataset.helpId});
   if(error)return toast(error.message,true);
   loadCoachQuickstart();loadOrgQuickstart();
 });
}

async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
function setKnowledgeTab(tab){
 qa('[data-knowledge-tab]').forEach(b=>b.classList.toggle('active',b.dataset.knowledgeTab===tab));
 ['articles','onboarding','tips','glossary','releases','quality'].forEach(x=>q('#knowledgePanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}
async function loadKnowledgeStudio(){
 if(!await checkAdmin())return;
 const d=await rpc('get_knowledge_studio_summary');if(!d)return;
 const s=d.summary||{};
 q('#knowledgeArticles').textContent=s.articles||0;q('#knowledgeFlows').textContent=s.flows||0;q('#knowledgeTips').textContent=s.tips||0;q('#knowledgeDrafts').textContent=s.drafts||0;
 q('#knowledgeArticleList').innerHTML=(d.articles||[]).map(x=>row('A',x.title,`${x.content_type} · ${x.category_label}`,x.status)).join('');
 q('#knowledgeOnboardingList').innerHTML=(d.onboarding||[]).map(x=>row('O',x.name,`${x.audience_type} · ${x.step_count} steps`,x.status)).join('');
 q('#knowledgeTipList').innerHTML=(d.tips||[]).map(x=>row('T',x.title,`${x.surface_key} · ${x.audience_type}`,x.status)).join('');
 q('#knowledgeGlossaryList').innerHTML=(d.glossary||[]).map(x=>row('G',x.term,x.definition,x.status)).join('');
 q('#knowledgeReleaseList').innerHTML=(d.releases||[]).map(x=>row('N',x.title,x.summary,x.status)).join('');
 q('#knowledgeQualityList').innerHTML=(d.quality||[]).map(x=>`<article class="help-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addArticle(){
 const title=prompt('Help article title:');if(!title)return;
 const body=prompt('Short help article text:');if(!body)return;
 const {data:cat}=await sb.from('help_categories').select('category_key').eq('active',true).order('display_order').limit(1).maybeSingle();
 const {error}=await sb.from('help_articles').insert({title,summary:body.slice(0,180),body_text:body,content_type:'article',category_key:cat?.category_key||'getting_started',status:'draft',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadKnowledgeStudio();
}

qa('[data-help-tab]').forEach(b=>b.onclick=()=>setHelpTab(b.dataset.helpTab));
qa('[data-knowledge-tab]').forEach(b=>b.onclick=()=>setKnowledgeTab(b.dataset.knowledgeTab));
q('#helpSearchButton')?.addEventListener('click',searchHelp);
q('#helpSearchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')searchHelp()});
q('#helpContactSupport')?.addEventListener('click',contactSupport);
q('#knowledgeAddArticle')?.addEventListener('click',addArticle);

if(typeof showPage==='function'){
 const old=showPage;
 showPage=function(name){
   old(name);
   if(name==='help-center')loadHelpCenter();
   if(name==='getting-started')loadGettingStarted();
   if(name==='coach-quickstart')loadCoachQuickstart();
   if(name==='organization-quickstart')loadOrgQuickstart();
   if(name==='knowledge-studio')loadKnowledgeStudio();
 };
}
})();
