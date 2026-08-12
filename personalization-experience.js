
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let prefs=null,isAdmin=false;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function modeName(v){return ({balanced:'Balanced',low_energy:'Low Energy',focused:'Focused',explore:'Explore'})[v]||'Balanced'}
function modeHelp(v){return ({balanced:'A calm mix of guidance, tools and practical next steps.',low_energy:'Fewer choices and shorter actions when you want less to manage.',focused:'One clear priority at a time.',explore:'More optional tools, resources and learning to browse.'})[v]||''}
function row(icon,title,detail,value=''){return `<div class="personalization-row"><div class="personalization-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(String(value||''))}</em></div>`}
function applyPrefs(p){
 document.documentElement.dataset.textSize=p.text_size||'standard';
 document.documentElement.dataset.motion=p.motion_preference||'standard';
 document.documentElement.dataset.contrast=p.contrast_preference||'standard';
}
async function loadPrefs(){
 const d=await rpc('get_my_experience_preferences');if(!d)return;
 prefs=d;
 applyPrefs(prefs);
 qa('[data-experience-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.experienceMode===prefs.experience_mode));
 const set=(id,v)=>{if(q(id))q(id).value=v??''};
 set('#prefReadingLevel',prefs.reading_level);set('#prefTextSize',prefs.text_size);set('#prefMotion',prefs.motion_preference);set('#prefContrast',prefs.contrast_preference);set('#prefPathway',prefs.pathway);set('#prefTradition',prefs.tradition||'');set('#prefTone',prefs.tone);set('#prefLocale',prefs.locale);set('#prefQuietStart',prefs.quiet_hours_start||'');set('#prefQuietEnd',prefs.quiet_hours_end||'');
}
async function savePrefs(){
 const selected=q('[data-experience-mode].selected')?.dataset.experienceMode||prefs?.experience_mode||'balanced';
 const payload={
  p_experience_mode:selected,p_reading_level:q('#prefReadingLevel').value,p_text_size:q('#prefTextSize').value,
  p_motion_preference:q('#prefMotion').value,p_contrast_preference:q('#prefContrast').value,
  p_pathway:q('#prefPathway').value,p_tradition:q('#prefTradition').value||null,p_tone:q('#prefTone').value,
  p_locale:q('#prefLocale').value,p_quiet_hours_start:q('#prefQuietStart').value||null,p_quiet_hours_end:q('#prefQuietEnd').value||null
 };
 const d=await rpc('save_my_experience_preferences',payload);if(!d)return toast('Preferences could not be saved.',true);
 prefs=d;applyPrefs(d);q('#experiencePrefMsg').textContent='Saved.';toast('Experience preferences saved.');
}
async function loadForYou(){
 const d=await rpc('get_my_personalized_home');if(!d)return;
 const p=d.preferences||{};
 q('#personalizationModeName').textContent=modeName(p.experience_mode);q('#personalizationModeHelp').textContent=modeHelp(p.experience_mode);
 const primary=d.primary;
 q('#forYouPrimary').innerHTML=primary?recHtml(primary,true):'<div class="approved-resource-empty">No recommendation is needed right now.</div>';
 q('#forYouRecommendations').innerHTML=(d.recommendations||[]).map(x=>recHtml(x,false)).join('')||'<div class="approved-resource-empty">You are caught up.</div>';
 q('#forYouRhythm').innerHTML=(d.rhythm||[]).map(x=>`<article><b>${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
 wireRecActions();
}
function recHtml(x,primary){
 return `<article class="${primary?'':'recommendation-card'}"><b>${esc(x.title)}</b><p>${esc(x.description||'')}</p><small>Why: ${esc(x.reason||'Based on your selected Lellee preferences.')}</small><div class="recommendation-actions"><button data-rec-open="${x.id}" data-rec-page="${esc(x.action_page||'today')}">Open</button><button data-rec-snooze="${x.id}">Snooze</button><button data-rec-dismiss="${x.id}">Dismiss</button></div></article>`;
}
function wireRecActions(){
 qa('[data-rec-open]').forEach(b=>b.onclick=async()=>{await rpc('record_recommendation_action',{p_recommendation_id:b.dataset.recOpen,p_action:'opened'});showPage(b.dataset.recPage)});
 qa('[data-rec-snooze]').forEach(b=>b.onclick=async()=>{await rpc('record_recommendation_action',{p_recommendation_id:b.dataset.recSnooze,p_action:'snoozed'});loadForYou()});
 qa('[data-rec-dismiss]').forEach(b=>b.onclick=async()=>{await rpc('record_recommendation_action',{p_recommendation_id:b.dataset.recDismiss,p_action:'dismissed'});loadForYou()});
}
async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
function setExperienceTab(tab){qa('[data-experience-tab]').forEach(b=>b.classList.toggle('active',b.dataset.experienceTab===tab));['rules','tags','localization','presets','guardrails'].forEach(x=>q('#experiencePanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadStudio(){
 if(!await checkAdmin())return;
 const d=await rpc('get_experience_studio_summary');if(!d)return;
 const s=d.summary||{};
 q('#experienceRules').textContent=s.rules||0;q('#experienceTags').textContent=s.tags||0;q('#experienceLocales').textContent=s.locales||0;q('#experienceRecommendations').textContent=s.active_recommendations||0;
 q('#experienceRuleList').innerHTML=(d.rules||[]).map(x=>row('R',x.name,`${x.status} · ${x.recommendation_type}`,x.priority)).join('')||'<div class="approved-resource-empty">No rules.</div>';
 q('#experienceTagList').innerHTML=(d.tags||[]).map(x=>row('#',x.label,x.tag_key,x.category)).join('')||'<div class="approved-resource-empty">No tags.</div>';
 q('#experienceLocaleList').innerHTML=(d.locales||[]).map(x=>row('文',x.label,x.locale,x.status)).join('');
 q('#experiencePresetList').innerHTML=(d.presets||[]).map(x=>`<article><b>${esc(x.name)}</b><small>${esc(x.description)}</small></article>`).join('');
 q('#experienceGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="personalization-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addRule(){
 const name=prompt('Rule name:');if(!name)return;const type=prompt('Recommendation type: content, tool, resource, task, goal, learning, program','content')||'content';const title=prompt('Recommendation title:');if(!title)return;const page=prompt('Page to open:','today')||'today';
 const {error}=await sb.from('experience_recommendation_rules').insert({name,recommendation_type:type,title,action_page:page,status:'draft',priority:100,created_by:currentUser.id});
 if(error)return toast(error.message,true);loadStudio();
}
async function addTag(){
 const key=prompt('Tag key (example: short_action):');if(!key)return;const label=prompt('Tag label:','Short Action');if(!label)return;const category=prompt('Category:','experience')||'experience';
 const {error}=await sb.from('experience_tags').insert({tag_key:key,label,category});
 if(error)return toast(error.message,true);loadStudio();
}

qa('[data-experience-mode]').forEach(b=>b.onclick=()=>{qa('[data-experience-mode]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
q('#saveExperiencePreferences')?.addEventListener('click',savePrefs);
qa('[data-experience-tab]').forEach(b=>b.onclick=()=>setExperienceTab(b.dataset.experienceTab));
q('#experienceAddRule')?.addEventListener('click',addRule);
q('#experienceAddTag')?.addEventListener('click',addTag);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='for-you')loadForYou();if(name==='experience-preferences')loadPrefs();if(name==='experience-studio')loadStudio()};
}
let tries=0;const timer=setInterval(()=>{tries++;if(typeof currentUser!=='undefined'&&currentUser){clearInterval(timer);loadPrefs()}else if(tries>40)clearInterval(timer)},200);
})();
