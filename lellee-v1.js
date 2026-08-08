/* ===== group-a-core.js ===== */

(()=>{
'use strict';
const GA={tools:[],activeTool:null,personal:{enabled:true,style:'gentle',beliefVariants:true},currentItem:null,learn:null,collections:[],journalRows:[]};
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],val=id=>q('#'+id)?.value?.trim?.()||'';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const txt=(id,v)=>{const e=q('#'+id);if(e)e.textContent=v??''};const toast=m=>showSync(m);
const PH=[{key:'stabilize',name:'Stabilize',start:1,end:30,desc:'Safety, steadiness, support, and the next manageable choice.'},{key:'build',name:'Build',start:31,end:60,desc:'Routines, coping, support, and recovery protection.'},{key:'understand',name:'Understand',start:61,end:90,desc:'Patterns, triggers, thoughts, emotions, and needs.'},{key:'rebuild',name:'Rebuild',start:91,end:120,desc:'Daily life, responsibilities, boundaries, relationships, and self-trust.'},{key:'strengthen',name:'Strengthen',start:121,end:150,desc:'Warning signs, relapse prevention, boundaries, and recovery under pressure.'},{key:'grow',name:'Grow',start:151,end:183,desc:'Identity, values, purpose, connection, and a fuller recovery life.'},{key:'maintenance',name:'Maintenance',start:184,end:365,desc:'Protect what works and adapt recovery as life changes.'},{key:'year_2',name:'Year Two',start:366,end:730,desc:'Build durable, self-directed recovery and long-range goals.'},{key:'long_term',name:'Long-Term Recovery',start:731,end:999999,desc:'Lighter weekly guidance, annual review, and support when life changes.'}];
const phaseFor=d=>PH.find(p=>d>=p.start&&d<=p.end)||PH[PH.length-1];
const pct=d=>{const p=phaseFor(d);return p.key==='long_term'?100:Math.max(0,Math.min(100,((d-p.start+1)/(p.end-p.start+1))*100))};
function anchor(d){if(d<=183)return{day:d,mode:'daily'};if(d<=365)return{day:184+Math.floor((d-184)/7)*7,mode:'weekly'};if(d<=730)return{day:366+Math.floor((d-366)/7)*7,mode:'weekly'};return{longIndex:(Math.floor((d-731)/7)%12)+1,mode:'weekly'}}
function fallback(d){let list=d<=30?phase1Curriculum:d<=60?phase2Curriculum:d<=90?phase3Curriculum:d<=120?phase4Curriculum:d<=150?phase5Curriculum:d<=183?phase6Curriculum:d<=365?maintenanceCurriculum:year2Curriculum;const a=anchor(d),r=(list||[]).find(x=>x.d===a.day)||(list||[])[0];return{day_number:r?.d||d,phase_key:phaseFor(d).key,title:r?.t||'Recovery Check-In',summary:r?.lead||'Notice what matters today.',prompt:r?.focus||'What deserves your attention?',choices:r?.choices||[],actions:r?.actions||[],reflection_prompt:'What do you want to remember from this?',cadence:a.mode}}
async function contentFor(d=daysInRecovery()){const a=anchor(d);try{let r=a.longIndex?await sb.from('journey_content').select('*').eq('phase_key','long_term').eq('cadence_index',a.longIndex).eq('published',true).maybeSingle():await sb.from('journey_content').select('*').eq('day_number',a.day).eq('published',true).maybeSingle();if(!r.error&&r.data)return r.data}catch(e){}return fallback(d)}
function beliefOption(){if(!GA.personal.beliefVariants)return null;const b=String(data.belief||'').toLowerCase(),faith=String(data.faith||'').toLowerCase(),den=String(data.denomination||'').toLowerCase();if(b.includes('secular'))return null;if(b.includes('faith')){if(faith==='christian'&&den==='baptist')return 'Optional: prayer, Scripture reflection, or contact with a trusted Baptist church/recovery support.';if(faith==='christian')return 'Optional: prayer, Scripture reflection, or connection with a trusted Christian support person.';return 'Optional: include a prayer or faith practice that fits your tradition.'}if(b.includes('spiritual')||b.includes('mixed'))return 'Optional: include meditation, prayer, nature, or another spiritual practice if it helps.';return null}
async function renderJourney(){const d=daysInRecovery(),p=phaseFor(d),item=await contentFor(d),a=anchor(d),next=PH[PH.indexOf(p)+1];txt('journeyDayNumber',d);txt('journeyPhaseKicker',`${a.mode.toUpperCase()} GUIDANCE • CURRENT PHASE`);txt('journeyPhaseTitle',p.name);txt('journeyPhaseDescription',p.desc);if(q('#journeyPhaseMeter'))q('#journeyPhaseMeter').style.width=pct(d)+'%';txt('journeyPhaseProgress',p.key==='long_term'?`Recovery Day ${d} • weekly long-term guidance`:`${Math.round(pct(d))}% through ${p.name}`);txt('journeyNextTransition',next?next.name:'Annual Review');txt('journeyNextTransitionText',next?`${Math.max(0,next.start-d)} days until the next phase`:'Long-term recovery continues without an end date');txt('journeyTodayTitle',item.title);txt('journeyTodaySummary',item.summary);const box=q('#journeyRoadmap');if(box)box.innerHTML=PH.map((x,i)=>{const st=x.key===p.key?'current':d>x.end?'past':'future',label=x.key==='long_term'?'YEAR 3+':x.key==='year_2'?'DAYS 366–730':x.key==='maintenance'?'DAYS 184–365':`DAYS ${x.start}–${x.end}`;return`<article class="approved-phase-step ${st}"><span>${i+1}</span><div><small>${label}</small><h3>${x.name}</h3><p>${st==='current'?'Current phase':st==='past'?'Available to review':'Opens later'}</p></div></article>`}).join('')}
async function renderGuided(){const d=daysInRecovery(),p=phaseFor(d),item=await contentFor(d),a=anchor(d);GA.currentItem=item;txt('guidedDayPhase',`${p.name.toUpperCase()} • ${a.mode.toUpperCase()} GUIDANCE`);txt('guidedDayTitle',item.title);txt('guidedDayLead',item.summary);txt('guidedDayLabel',`DAY ${d}`);txt('guidedPhaseLabel',p.name);if(q('#guidedPhaseBar'))q('#guidedPhaseBar').style.width=pct(d)+'%';txt('guidedPromptTitle',item.prompt);txt('guidedPromptText','Choose anything that fits. You can skip every choice.');txt('guidedReflectionPrompt',item.reflection_prompt||'A few words is enough.');q('#guidedChoiceGrid').innerHTML=(item.choices||[]).map(x=>`<button type="button" class="day2-choice">${esc(x)}</button>`).join('');let acts=[...(item.actions||[])],belief=beliefOption();if(belief)acts.push(belief);q('#guidedActionChoices').innerHTML=acts.map(x=>`<button type="button" class="day2-choice">${esc(x)}</button>`).join('');qa('#guidedChoiceGrid .day2-choice').forEach(b=>b.onclick=()=>b.classList.toggle('selected'));qa('#guidedActionChoices .day2-choice').forEach(b=>b.onclick=()=>{qa('#guidedActionChoices .day2-choice').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});q('#groupABeliefNote')?.remove();if(belief){const n=document.createElement('div');n.id='groupABeliefNote';n.className='groupa-belief-note';n.textContent='Belief-aligned options are optional and never replace clinical or safety guidance.';q('.approved-next-step-card')?.appendChild(n)}await loadGuided()}
async function loadGuided(){if(!currentUser||!GA.currentItem)return;const key=`journey_core_${GA.currentItem.day_number||('long_'+anchor(daysInRecovery()).longIndex)}`;try{const{data:r}=await sb.from('guided_responses').select('*').eq('user_id',currentUser.id).eq('response_date',todayKey()).eq('prompt_key',key).maybeSingle();if(!r)return;const choices=Array.isArray(r.selected_choices)?r.selected_choices:[];qa('#guidedChoiceGrid .day2-choice').forEach(b=>b.classList.toggle('selected',choices.includes(b.textContent.trim())));if(q('#guidedReflectionText'))q('#guidedReflectionText').value=r.optional_reflection||'';const act=r.metadata?.selected_action;qa('#guidedActionChoices .day2-choice').forEach(b=>b.classList.toggle('selected',b.textContent.trim()===act))}catch(e){}}
async function saveGuided(){if(!currentUser||!GA.currentItem)return alert('Please sign in first.');const item=GA.currentItem,key=`journey_core_${item.day_number||('long_'+anchor(daysInRecovery()).longIndex)}`,selected=qa('#guidedChoiceGrid .day2-choice.selected').map(x=>x.textContent.trim()),action=q('#guidedActionChoices .day2-choice.selected')?.textContent.trim()||null;const payload={user_id:currentUser.id,response_date:todayKey(),recovery_day:daysInRecovery(),phase_key:phaseFor(daysInRecovery()).key,curriculum_day:item.day_number||daysInRecovery(),content_slug:`group-a-${key}`,prompt_key:key,prompt_version:1,prompt_text:item.prompt,selected_choices:selected,optional_reflection:val('guidedReflectionText')||null,allow_milestone_review:true,allow_recovery_story:false,metadata:{selected_action:action,title:item.title,cadence:anchor(daysInRecovery()).mode}};const{error}=await sb.from('guided_responses').upsert(payload,{onConflict:'user_id,response_date,prompt_key'});if(error)return alert(error.message);if(action)await sb.from('recovery_actions').insert({user_id:currentUser.id,action_date:todayKey(),action_type:'recovery_action',content:action,completed:true});toast("Today's guidance saved.");renderHistory();personalize()}
async function renderHistory(){const box=q('#journeyHistoryList');if(!box||!currentUser)return;try{const{data:r}=await sb.from('guided_responses').select('*').eq('user_id',currentUser.id).like('prompt_key','journey_core_%').order('response_date',{ascending:false}).limit(50);box.innerHTML=(r||[]).length?r.map(x=>`<article class="groupa-history-card"><small>${x.response_date}${x.recovery_day?` • Day ${x.recovery_day}`:''} • ${esc((x.phase_key||'').replace('_',' '))}</small><h3>${esc(x.metadata?.title||x.prompt_text)}</h3><p>${esc((x.selected_choices||[]).join(' • ')||'No choices selected')}${x.optional_reflection?`<br><em>${esc(x.optional_reflection)}</em>`:''}</p></article>`).join(''):'<div class="approved-resource-empty"><b>No saved guided days yet.</b></div>'}catch(e){box.innerHTML='<div class="approved-resource-empty">Run the Group A SQL to activate guided history.</div>'}}

const FALLBACK=[
{slug:'craving-reset',title:'Craving Reset',category:'cravings',summary:'Create distance from an urge and protect the next few minutes.',steps:['Name the urge without arguing with it.','Move away from alcohol, drugs, or a high-risk setting if you can.','Contact a safe support person before the urge becomes stronger.','Use water, food, movement, grounding, or a meeting to create time.','Reassess after the urge has had time to change.'],recommended_for:['craving','urge','substance'],symbol:'◉'},
{slug:'urge-surfing',title:'Urge Surfing',category:'cravings',summary:'Notice an urge as a changing wave instead of a command.',steps:['Notice where the urge shows up in your body.','Describe the sensation without fighting it.','Watch for changes in intensity.','Keep yourself away from access while the urge rises and falls.','Use support if the urge is becoming unsafe.'],recommended_for:['craving','urge'],symbol:'≈'},
{slug:'grounding-54321',title:'5-4-3-2-1 Grounding',category:'calming',summary:'Bring attention back to the present when thoughts or anxiety are racing.',steps:['Name 5 things you can see.','Name 4 things you can physically feel.','Name 3 things you can hear.','Name 2 things you can smell.','Name 1 thing you can taste or one breath you can notice.'],recommended_for:['anxious','overwhelmed','panic'],symbol:'◎'},
{slug:'paced-breathing',title:'Paced Breathing',category:'calming',summary:'Use a slower exhale to help your body settle.',steps:['Sit or stand somewhere safe.','Breathe in gently.','Let the exhale be a little longer than the inhale.','Repeat without forcing a very deep breath.','Stop if breathing exercises make you feel worse and choose another grounding tool.'],recommended_for:['stress','angry','overwhelmed'],symbol:'≈'},
{slug:'halt-check',title:'HALT Check',category:'planning',summary:'Check whether hunger, anger, loneliness, or tiredness is making recovery harder.',steps:['Ask: am I hungry?','Ask: am I angry or activated?','Ask: am I lonely or disconnected?','Ask: am I tired?','Meet the most basic need first, then reassess.'],recommended_for:['hungry','angry','lonely','tired'],symbol:'H'},
{slug:'trigger-review',title:'Trigger Review',category:'triggers',summary:'Study what happened before an urge without blaming yourself.',steps:['What happened just before the urge?','Who was there?','What were you feeling or thinking?','What warning sign showed up first?','What could create more safety next time?'],recommended_for:['trigger','people','places','conflict'],symbol:'↻'},
{slug:'exit-plan',title:'Exit a High-Risk Situation',category:'cravings',summary:'Make leaving easier when substances or risky people are nearby.',steps:['Decide that leaving is allowed even if it feels awkward.','Move toward a safer location.','Contact someone who supports your recovery.','Arrange safe transportation if needed.','Once safe, decide what support you need next.'],recommended_for:['around substances','risky place'],symbol:'↗'},
{slug:'anger-pause',title:'Anger Pause',category:'calming',summary:'Create space before saying or doing something that could make things harder.',steps:['Do not send the message or continue the argument yet.','Move away if it is safe.','Notice what your body is doing.','Use grounding, walking, or another calming tool.','Return only when you can choose your next action.'],recommended_for:['angry','conflict'],symbol:'!'},
{slug:'connection-step',title:'Move Toward Connection',category:'connection',summary:'Use a small connection step before loneliness becomes isolation.',steps:['Name one safe person or place.','Choose a low-pressure contact: text, call, meeting, or shared activity.','Say something simple such as “I could use some company.”','If one person is unavailable, try another support.','Do not treat one unavailable person as a reason to isolate.'],recommended_for:['lonely','alone','isolating'],symbol:'♡'},
{slug:'sleep-reset',title:'Sleep Reset',category:'sleep',summary:'Protect recovery by making tonight a little easier on your body and mind.',steps:['Choose a realistic bedtime window.','Reduce stimulating screens or conflict close to bedtime.','Limit late caffeine if it affects you.','Prepare the room for sleep.','Discuss persistent or severe sleep problems with a healthcare professional.'],recommended_for:['sleep','tired'],symbol:'☾'},
{slug:'boundary-builder',title:'Boundary Builder',category:'relationships',summary:'Turn “this is too much” into a clear recovery-protecting boundary.',steps:['Name the situation costing you stability.','Decide what you will do—not what you will force another person to do.','Use a short, clear sentence.','Plan how you will follow through.','Use support if safety or coercion is involved.'],recommended_for:['boundary','relationship','family'],symbol:'◇'},
{slug:'support-script',title:'Ask for Help Script',category:'connection',summary:'Make reaching out easier when you do not know what to say.',steps:['Choose a safe person.','Start with: “I do not need you to fix this.”','Say what is happening in one sentence.','Ask for one specific thing.','If that person cannot help, contact another support.'],recommended_for:['support','help','lonely'],symbol:'☎'},
{slug:'warning-sign-plan',title:'Early Warning Plan',category:'planning',summary:'Decide what to do when recovery starts drifting before a return to use.',steps:['List your earliest warning signs.','Choose the first support person you will contact.','Choose one place or situation you will avoid.','Name one recovery routine you will restart immediately.','Include professional or emergency support when needed.'],recommended_for:['warning','relapse','drift'],symbol:'◆'},
{slug:'after-use',title:'After a Return to Use',category:'planning',summary:'Respond to a return to use with safety and the next appropriate support step.',steps:['Get to a safer environment.','Do not drive or add substances to “even things out.”','Contact someone you trust.','Seek urgent medical help for overdose symptoms, breathing problems, loss of consciousness, severe illness, or other emergencies.','After immediate safety, reconnect with treatment or recovery support and review what happened without treating it as the end of recovery.'],recommended_for:['already used','relapse','return to use'],symbol:'↺'},
{slug:'one-task',title:'One-Task Reset',category:'planning',summary:'Reduce overwhelm by shrinking the day to one practical next step.',steps:['Write down what is competing for attention.','Circle the one thing that most affects safety or stability.','Break it into a 5–20 minute step.','Do only that step.','Reassess after it is complete.'],recommended_for:['overwhelmed','money','work','housing'],symbol:'1'},
{slug:'meeting-ready',title:'Get Ready for Support',category:'connection',summary:'Make attending a meeting, group, or appointment easier.',steps:['Confirm the time and location or link.','Plan transportation or a quiet place.','Decide whether to contact someone beforehand.','Bring one question if useful.','Afterward, note one thing you want to carry forward.'],recommended_for:['meeting','support','treatment'],symbol:'▤'},
{slug:'values-check',title:'Values Check',category:'values',summary:'Reconnect a hard decision with what matters to you.',steps:['Name the decision.','Name the value you want to protect.','Notice which option moves closer to that value.','Choose the smallest value-aligned action.','Revisit the decision later if you do not need to decide immediately.'],recommended_for:['purpose','values','decision'],symbol:'✦'},
{slug:'delay-decide',title:'Delay, Then Decide',category:'planning',summary:'Create time between an impulse and a decision.',steps:['If it is safe, delay the decision for 10 minutes.','Change your location or put distance between you and the impulse.','Use one grounding or connection tool.','Ask what the decision could cost tomorrow.','Decide again after the delay.'],recommended_for:['impulsive','urge','conflict'],symbol:'◷'}];
async function getTools(){try{const{data:r,error}=await sb.from('recovery_tools').select('*').eq('published',true).order('sort_order');if(!error&&r?.length)return r}catch(e){}return FALLBACK}
async function renderTools(cat='all'){GA.tools=await getTools();qa('[data-groupa-tool-cat]').forEach(b=>b.classList.toggle('active',b.dataset.groupaToolCat===cat));const rows=cat==='all'?GA.tools:GA.tools.filter(x=>x.category===cat),box=q('#groupAToolGrid');if(!box)return;box.innerHTML=rows.map(x=>`<article class="groupa-tool-card"><div class="sym">${esc(x.symbol||'◇')}</div><small>${esc(x.category)}</small><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p><button class="approved-link" data-groupa-tool="${esc(x.slug)}">Open →</button></article>`).join('');qa('[data-groupa-tool]').forEach(b=>b.onclick=()=>openTool(b.dataset.groupaTool))}
async function openTool(slug){if(!GA.tools.length)GA.tools=await getTools();const t=GA.tools.find(x=>x.slug===slug)||FALLBACK.find(x=>x.slug===slug);if(!t)return;GA.activeTool=t;txt('groupAToolDetailCat',String(t.category||'tool').toUpperCase());txt('groupAToolDetailTitle',t.title);txt('groupAToolDetailSummary',t.summary);q('#groupAToolSteps').innerHTML=(t.steps||[]).map((s,i)=>`<div class="groupa-tool-step"><span>${i+1}</span><p>${esc(s)}</p></div>`).join('');q('#groupAToolDetail').classList.remove('hidden');q('#groupAToolDetail').scrollIntoView({behavior:'smooth',block:'start'});if(currentUser)sb.from('tool_use_log').insert({user_id:currentUser.id,tool_slug:t.slug}).then(()=>{})}
async function completeTool(){if(!GA.activeTool)return;if(currentUser)await sb.from('tool_use_log').insert({user_id:currentUser.id,tool_slug:GA.activeTool.slug,completed_at:new Date().toISOString()});toast('Tool marked used.')}

async function loadPersonal(){if(!currentUser)return;try{const{data:r}=await sb.from('personalization_preferences').select('*').eq('user_id',currentUser.id).maybeSingle();if(r)GA.personal={enabled:r.enabled!==false,style:r.recommendation_style||'gentle',beliefVariants:r.belief_variants!==false}}catch(e){}if(q('#groupAPersonalizationEnabled'))q('#groupAPersonalizationEnabled').value=String(GA.personal.enabled);if(q('#groupAPersonalizationStyle'))q('#groupAPersonalizationStyle').value=GA.personal.style;if(q('#groupABeliefVariants'))q('#groupABeliefVariants').value=String(GA.personal.beliefVariants)}
async function savePersonal(){if(!currentUser)return;GA.personal={enabled:q('#groupAPersonalizationEnabled')?.value!=='false',style:q('#groupAPersonalizationStyle')?.value||'gentle',beliefVariants:q('#groupABeliefVariants')?.value!=='false'};await sb.from('personalization_preferences').upsert({user_id:currentUser.id,enabled:GA.personal.enabled,recommendation_style:GA.personal.style,belief_variants:GA.personal.beliefVariants},{onConflict:'user_id'});personalize()}
async function personalize(){await loadPersonal();let slug='grounding-54321',why='A grounding tool is a simple place to start when nothing more specific stands out.';if(GA.personal.enabled&&currentUser){try{const since=new Date();since.setDate(since.getDate()-21);const[g,c]=await Promise.all([sb.from('guided_responses').select('selected_choices,optional_reflection').eq('user_id',currentUser.id).gte('response_date',since.toISOString().slice(0,10)).order('response_date',{ascending:false}).limit(30),sb.from('daily_checkins').select('mood,stress,craving').eq('user_id',currentUser.id).gte('checkin_date',since.toISOString().slice(0,10)).order('checkin_date',{ascending:false}).limit(21)]);const s=((g.data||[]).flatMap(x=>x.selected_choices||[]).join(' ')+' '+(g.data||[]).map(x=>x.optional_reflection||'').join(' ')).toLowerCase(),cr=(c.data||[]).filter(x=>x.craving!=null),avg=cr.reduce((a,x)=>a+Number(x.craving),0)/Math.max(1,cr.length);const map=[[()=>avg>=6||/(craving|urge|substance|using)/.test(s),'craving-reset','Cravings or high-risk situations have appeared in your recent activity.'],[()=>/(lonely|isolation|alone)/.test(s),'connection-step','Connection may deserve a little more attention right now.'],[()=>/(angry|anger|irritable|conflict)/.test(s),'anger-pause','Slowing conflict down may be useful right now.'],[()=>/(sleep|tired|fatigue)/.test(s),'sleep-reset','Rest and sleep may deserve some protection.'],[()=>/(trigger|risky place|risky people)/.test(s),'trigger-review','A short trigger review may help you notice the pattern earlier.'],[()=>/(boundary|family|relationship)/.test(s),'boundary-builder','A recovery-protecting boundary may be worth practicing.'],[()=>/(overwhelmed|money|work|housing|legal)/.test(s),'one-task','There may be several things competing for your attention. One task is enough.'],[()=>/(purpose|values|meaning|future)/.test(s),'values-check','A values check may help connect recovery with the life you are building.']];const hit=map.find(x=>x[0]());if(hit){slug=hit[1];why=hit[2]}}catch(e){}}GA.recommended=slug;const t=(await getTools()).find(x=>x.slug===slug)||FALLBACK.find(x=>x.slug===slug);txt('groupAForYouTitle',t?.title||'One useful next step');txt('groupAForYouText',GA.personal.enabled?why:'Personalization is off. Lellee is showing a general recovery tool.');txt('groupAToolRecTitle',t?.title||'Recovery Tool');txt('groupAToolRecText',GA.personal.enabled?why:'Personalization is off. Browse any tool that fits.')}

async function renderLearn(view='recommended',topic=null){const p=phaseFor(daysInRecovery());txt('learnPhaseBadge',p.name.toUpperCase());txt('learnPhaseTitle',`Recommended for ${p.name}`);const box=view==='saved'?q('#savedLearningList'):view==='worksheets'?q('#worksheetList'):topic?q('#topicLearningList'):q('#recommendedLearningList');if(!box)return;try{let rows=[];if(view==='saved'&&currentUser){const{data:r}=await sb.from('saved_learning').select('content_item_id,content_items(*)').eq('user_id',currentUser.id).order('created_at',{ascending:false});rows=(r||[]).map(x=>x.content_items).filter(Boolean)}else{let qry=sb.from('content_items').select('*').eq('published',true);if(view==='worksheets')qry=qry.eq('content_type','worksheet');else if(topic)qry=qry.contains('tags',[topic]);else qry=qry.or(`phase_key.eq.${p.key},phase_key.is.null`);const{data:r}=await qry.order('day_number',{ascending:true}).limit(24);rows=r||[]}box.innerHTML=rows.length?rows.map(x=>`<article class="approved-learning-card"><div class="approved-learning-meta"><span>${esc((x.content_type||'lesson').replace('_',' '))}</span><em>${esc((x.phase_key||'all recovery').replace('_',' '))}</em></div><h3>${esc(x.title)}</h3><p>${esc(x.summary||'')}</p><div class="approved-learning-actions"><button class="approved-link" data-ga-learn-open="${x.id}">Open</button><button class="approved-link" data-ga-learn-save="${x.id}">Save</button></div></article>`).join(''):'<div class="approved-resource-empty"><b>No published items in this view yet.</b></div>';qa('[data-ga-learn-open]').forEach(b=>b.onclick=()=>openLearn(b.dataset.gaLearnOpen));qa('[data-ga-learn-save]').forEach(b=>b.onclick=()=>saveLearn(b.dataset.gaLearnSave))}catch(e){box.innerHTML='<div class="approved-resource-empty">Run the Group A SQL to activate the learning library.</div>'}}
async function openLearn(id){const{data:x,error}=await sb.from('content_items').select('*').eq('id',id).single();if(error||!x)return;GA.learn=x;txt('learningDetailType',String(x.content_type||'learning').toUpperCase());txt('learningDetailTitle',x.title);txt('learningDetailSummary',x.summary||'');let body=esc(x.body_markdown||'').replace(/\n\n/g,'</p><p>'),belief=beliefOption();if(belief)body+=`</p><div class="groupa-belief-note">${esc(belief)}</div><p>`;q('#learningDetailBody').innerHTML='<p>'+body+'</p>';showPage('learning-detail')}
async function saveLearn(id){if(!currentUser)return;const{error}=await sb.from('saved_learning').upsert({user_id:currentUser.id,content_item_id:id},{onConflict:'user_id,content_item_id'});if(error)return alert(error.message);toast('Saved for later.')}
async function completeLearn(){if(!currentUser||!GA.learn)return;const{error}=await sb.from('learning_progress').upsert({user_id:currentUser.id,content_item_id:GA.learn.id,status:'completed',completed_at:new Date().toISOString()},{onConflict:'user_id,content_item_id'});if(error)return alert(error.message);toast('Marked complete.')}

/* Preserve prior Journal Companion usability while Group B will harden the full app. */
async function ensureCollections(){if(!currentUser)return;try{let{data:r}=await sb.from('journal_collections').select('*').eq('user_id',currentUser.id).order('sort_order');if(!r?.length){await sb.from('journal_collections').insert([{user_id:currentUser.id,name:'Daily Journal',system_key:'daily',sort_order:10},{user_id:currentUser.id,name:"Things I'm Learning",system_key:'learning',sort_order:20},{user_id:currentUser.id,name:'Gratitude & Good Moments',system_key:'gratitude',sort_order:30}]);({data:r}=await sb.from('journal_collections').select('*').eq('user_id',currentUser.id).order('sort_order'))}GA.collections=r||[];if(q('#journalCollectionSelect'))q('#journalCollectionSelect').innerHTML=GA.collections.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');if(q('#journalFilterCollection'))q('#journalFilterCollection').innerHTML='<option value="">All collections</option>'+GA.collections.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}catch(e){}}
async function saveJournal(){const body=val('journalText');if(!currentUser||!body)return;await ensureCollections();const{error}=await sb.from('journal_entries').insert({user_id:currentUser.id,entry_date:todayKey(),title:val('journalTitleV2')||null,prompt_key:q('#journalPromptSelect')?.value||'custom',prompt_text:q('#journalPromptTitle')?.textContent||null,phase_key:phaseFor(daysInRecovery()).key,content:body,is_favorite:!!q('#journalFavoriteV2')?.checked,collection_id:q('#journalCollectionSelect')?.value||null,source:'digital',physical_volume:q('#journalPhysicalVolume')?.value||null,physical_page:val('journalPhysicalPage')||null,allow_recovery_story:!!q('#journalStoryOptInV2')?.checked});if(error)return alert(error.message);q('#journalText').value='';toast('Journal entry saved.');loadJournalEntries()}
async function loadJournalEntries(){if(!currentUser)return;await ensureCollections();try{const{data:r}=await sb.from('journal_entries').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false}).limit(100);GA.journalRows=r||[];const box=q('#journalEntryCards');if(box)box.innerHTML=GA.journalRows.map(x=>`<article class="approved-journal-entry-card"><small>${x.entry_date}</small><h3>${esc(x.title||x.prompt_text||'Journal entry')}</h3><p>${esc(x.content).slice(0,260)}</p></article>`).join('')||'<div class="approved-resource-empty">No entries yet.</div>'}catch(e){}}

function bind(){q('#openGuidedDay2')?.addEventListener('click',()=>{renderGuided();showPage('guided-day')});q('#openJourneyToday')?.addEventListener('click',()=>{renderGuided();showPage('guided-day')});q('#openJourneyHistory')?.addEventListener('click',()=>{q('#journeyHistoryPanel')?.classList.toggle('hidden');renderHistory()});q('#saveGuidedJourneyA')?.addEventListener('click',saveGuided);qa('[data-groupa-tool-cat]').forEach(b=>b.addEventListener('click',()=>renderTools(b.dataset.groupaToolCat)));q('#groupACloseTool')?.addEventListener('click',()=>q('#groupAToolDetail')?.classList.add('hidden'));q('#groupACompleteTool')?.addEventListener('click',completeTool);q('#groupAOpenRecommended')?.addEventListener('click',()=>openTool(GA.recommended));q('#groupAForYouAction')?.addEventListener('click',()=>{showPage('tools');setTimeout(()=>openTool(GA.recommended),80)});q('#saveSettings')?.addEventListener('click',savePersonal);qa('[data-learn-tab]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.learnTab;qa('[data-learn-tab]').forEach(x=>x.classList.toggle('active',x===b));q('#learnRecommendedPanel')?.classList.toggle('hidden',v!=='recommended');q('#learnTopicsPanel')?.classList.toggle('hidden',v!=='topics');q('#learnSavedPanel')?.classList.toggle('hidden',v!=='saved');q('#learnWorksheetsPanel')?.classList.toggle('hidden',v!=='worksheets');renderLearn(v)}));qa('[data-topic]').forEach(b=>b.addEventListener('click',()=>renderLearn('topic',b.dataset.topic)));q('#saveLearningItem')?.addEventListener('click',()=>GA.learn&&saveLearn(GA.learn.id));q('#markLearningComplete')?.addEventListener('click',completeLearn)}
async function refresh(){await loadPersonal();await Promise.allSettled([renderJourney(),renderTools(),personalize(),renderLearn('recommended'),ensureCollections()])}
GA.saveJournal=saveJournal;GA.loadJournalEntries=loadJournalEntries;window.LelleeGroupA=GA;bind();let tries=0;const wait=setInterval(()=>{tries++;if(currentUser){clearInterval(wait);refresh()}else if(tries>30)clearInterval(wait)},200);const oldShow=showPage;showPage=function(name){oldShow(name);if(name==='journey')renderJourney();if(name==='guided-day')renderGuided();if(name==='tools')renderTools();if(name==='learn')renderLearn('recommended');if(name==='journal')loadJournalEntries()};
})();


/* ===== group-b-production.js ===== */

(()=>{
'use strict';
const GB={version:'1.0.0-rc1',resourceType:'all',routeApplied:false};
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],v=id=>q('#'+id)?.value?.trim?.()||'';
const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const set=(id,x)=>{const e=q('#'+id);if(e)e.textContent=x??''};
function notify(msg,error=false){const t=q('#globalToast');if(t){t.textContent=msg;t.classList.remove('hidden');t.style.background=error?'#7f2634':'';setTimeout(()=>t.classList.add('hidden'),2600)}else if(window.showSync)showSync(msg)}
function toggle(id,show){q('#'+id)?.classList.toggle('hidden',show===undefined?!q('#'+id)?.classList.contains('hidden'):!show)}

/* Planner */
async function saveMeeting(){if(!currentUser||!v('meetingName'))return;const {error}=await sb.from('saved_meetings').insert({user_id:currentUser.id,meeting_name:v('meetingName'),meeting_format:q('#meetingFormat')?.value||null,meeting_day:q('#meetingDay')?.value===''?null:Number(q('#meetingDay').value),meeting_time:q('#meetingTime')?.value||null,location_text:v('meetingLocation')||null});if(error)return notify(error.message,true);notify('Meeting saved.');toggle('meetingForm',false);renderPlanner()}
async function saveGoal(){if(!currentUser||!v('goalTitle'))return;const {error}=await sb.from('goals').insert({user_id:currentUser.id,title:v('goalTitle'),category:v('goalCategory')||null,target_date:q('#goalDate')?.value||null,status:'active'});if(error)return notify(error.message,true);notify('Goal saved.');toggle('goalForm',false);renderPlanner()}
async function saveAction(){if(!currentUser||!v('plannedAction'))return;const {error}=await sb.from('recovery_actions').insert({user_id:currentUser.id,action_date:q('#plannedActionDate')?.value||todayKey(),action_type:'recovery_action',content:v('plannedAction'),completed:false});if(error)return notify(error.message,true);notify('Recovery action saved.');toggle('actionForm',false);renderPlanner()}
async function renderPlanner(){const box=q('#plannerSavedList');if(!box||!currentUser)return;const[m,g,a]=await Promise.all([sb.from('saved_meetings').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false}).limit(12),sb.from('goals').select('*').eq('user_id',currentUser.id).eq('status','active').order('target_date',{ascending:true}).limit(12),sb.from('recovery_actions').select('*').eq('user_id',currentUser.id).eq('completed',false).order('action_date',{ascending:true}).limit(12)]);const rows=[...(m.data||[]).map(x=>({k:'Meeting',t:x.meeting_name,s:`${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][x.meeting_day]||''} ${x.meeting_time||''}`})),...(g.data||[]).map(x=>({k:'Goal',t:x.title,s:x.target_date||'Active'})),...(a.data||[]).map(x=>({k:'Action',t:x.content||'Recovery action',s:x.action_date}))];box.innerHTML=rows.length?rows.map(x=>`<div class="approved-list-row"><span>◇</span><div><b>${esc(x.t)}</b><small>${esc(x.k)} • ${esc(x.s)}</small></div></div>`).join(''):'<div class="groupb-empty">Meetings, goals, and planned recovery actions will appear here.</div>'}

/* Support Network */
async function saveSupport(){if(!currentUser||!v('supportName'))return;if(q('#supportPrimary')?.checked)await sb.from('support_contacts').update({is_primary:false}).eq('user_id',currentUser.id);const {error}=await sb.from('support_contacts').insert({user_id:currentUser.id,contact_name:v('supportName'),relationship_label:v('supportRelationship')||null,phone:v('supportPhone')||null,email:v('supportEmail')||null,is_primary:!!q('#supportPrimary')?.checked,preferred_method:v('supportPhone')?'call':v('supportEmail')?'email':null});if(error)return notify(error.message,true);notify('Support person saved.');toggle('supportForm',false);renderSupport()}
async function renderSupport(){if(!currentUser)return;const {data:r,error}=await sb.from('support_contacts').select('*').eq('user_id',currentUser.id).order('is_primary',{ascending:false}).order('created_at',{ascending:true});if(error)return;const rows=r||[];const draw=(compact=false)=>rows.map(x=>`<div class="${compact?'groupb-row':'approved-list-row'}"><div><b>${esc(x.contact_name)}${x.is_primary?' • Primary':''}</b><small>${esc(x.relationship_label||'Support person')}${x.phone?` • ${esc(x.phone)}`:''}${x.email?` • ${esc(x.email)}`:''}</small></div><div class="groupb-actions">${x.phone?`<a href="tel:${esc(x.phone)}">Call</a>`:''}${x.phone?`<a href="sms:${esc(x.phone)}">Text</a>`:''}</div></div>`).join('');if(q('#supportPeopleList'))q('#supportPeopleList').innerHTML=rows.length?draw(false):'<div class="groupb-empty">Add people you trust so support stays easy to find.</div>';if(q('#helpSupportList'))q('#helpSupportList').innerHTML=rows.length?draw(true):'<div class="groupb-empty">No personal support contacts saved yet.</div>'}

/* Help Me Right Now */
const HELP={
 craving:['Protect the next few minutes',['Move away from alcohol, drugs, or the high-risk setting if you can.','Contact a safe support person before the urge grows.','Open Craving Reset or grounding in Tools.','Make the time horizon smaller: protect the next 10 minutes.']],
 overwhelmed:['Slow the situation down',['Reduce noise and decisions.','Use grounding or paced breathing.','Choose one practical next task.','Ask for support if you are becoming less safe.']],
 angry:['Create space before acting',['Do not send the message or continue the argument yet.','Move away if safe.','Use the Anger Pause tool.','Return only when you can choose your next action.']],
 lonely:['Move toward safe connection',['Text or call one safe person.','Try a meeting, group, or safe public place.','If one person is unavailable, try another support.','Use the Connection tool rather than waiting for isolation to deepen.']],
 around_substances:['Make the environment safer',['Leave the immediate area if you can.','Do not debate whether you should be able to handle it.','Contact support and arrange safe transportation if needed.','Use the high-risk Exit Plan tool.']],
 used:['Respond first with safety',['Get to a safer environment.','Do not drive or take more substances to “even things out.”','Contact someone you trust.','Seek emergency medical care for overdose symptoms, breathing problems, loss of consciousness, severe illness, or another medical emergency.','After immediate safety, reconnect with treatment or recovery support.']]
};
function helpPath(k){const h=HELP[k],box=q('#helpPathPanel');if(!h||!box)return;box.innerHTML=`<div class="approved-insight-panel"><span class="approved-kicker">RIGHT NOW</span><h3>${esc(h[0])}</h3>${h[1].map((x,i)=>`<div class="groupb-row"><b>${i+1}</b><small>${esc(x)}</small></div>`).join('')}${k==='used'?'<div class="groupb-safety">In the U.S. and its territories, if you are in suicidal crisis or emotional distress, call or text <b>988</b>. Lellee is not an emergency service.</div>':''}</div>`}

/* Resources + News */
async function resources(tab='local'){qa('[data-resource-tab]').forEach(b=>b.classList.toggle('active',b.dataset.resourceTab===tab));q('#resourceLocalPanel')?.classList.toggle('hidden',tab!=='local');q('#resourceNewsPanel')?.classList.toggle('hidden',tab!=='news');q('#resourceSavedPanel')?.classList.toggle('hidden',tab!=='saved');set('resourceLocation',[data.city,data.state].filter(Boolean).join(', ')||'Your area');if(tab==='saved')return savedResources();if(tab==='news'){const box=q('#recoveryNewsList');if(!box)return;const {data:r}=await sb.from('recovery_news').select('*').eq('published',true).order('published_at',{ascending:false}).limit(30);box.innerHTML=(r||[]).length?r.map(x=>`<div class="approved-list-row"><span>◇</span><div><b>${esc(x.title)}</b><small>${esc(x.summary||x.source_name||'Recovery update')}</small></div>${x.source_url?`<a class="approved-link" target="_blank" rel="noopener" href="${esc(x.source_url)}">Open</a>`:''}</div>`).join(''):'<div class="groupb-empty">Curated recovery news will appear here after it is reviewed and published.</div>';return}const box=q('#localResourceList');if(!box)return;let query=sb.from('local_resources').select('*').eq('published',true);if(GB.resourceType!=='all')query=query.eq('resource_type',GB.resourceType);if(data.state)query=query.or(`state.eq.${data.state},state.is.null`);const {data:r}=await query.order('featured',{ascending:false}).order('name').limit(50);box.innerHTML=(r||[]).length?r.map(x=>`<div class="approved-list-row"><span>⌂</span><div><b>${esc(x.name)}</b><small>${esc([x.resource_type,x.city,x.state].filter(Boolean).join(' • '))}</small></div><button class="approved-link" data-save-resource="${x.id}">Save</button></div>`).join(''):'<div class="groupb-empty">No vetted local resources have been published for this view yet.</div>';qa('[data-save-resource]').forEach(b=>b.onclick=()=>saveResource(b.dataset.saveResource))}
async function saveResource(id){if(!currentUser)return;const {error}=await sb.from('saved_resources').upsert({user_id:currentUser.id,resource_id:id},{onConflict:'user_id,resource_id'});if(error)return notify(error.message,true);notify('Resource saved.')}
async function savedResources(){const box=q('#savedResourceList');if(!box||!currentUser)return;const {data:r}=await sb.from('saved_resources').select('resource_id,local_resources(*)').eq('user_id',currentUser.id);box.innerHTML=(r||[]).length?r.map(x=>`<div class="approved-list-row"><span>★</span><div><b>${esc(x.local_resources?.name||'Saved resource')}</b><small>${esc(x.local_resources?.resource_type||'')}</small></div></div>`).join(''):'<div class="groupb-empty">Resources you save will appear here.</div>'}

/* Notifications + PWA */
async function loadNotif(){if(!currentUser)return;const {data:r}=await sb.from('notification_preferences').select('*').eq('user_id',currentUser.id).maybeSingle();if(r){[['notifDailyEnabled',r.daily_enabled],['notifDailyTime',r.daily_time],['notifMeetingEnabled',r.meeting_enabled],['notifMeetingMinutes',r.meeting_minutes_before],['notifMilestoneEnabled',r.milestone_enabled],['notifWeeklyEnabled',r.weekly_enabled],['notifWeeklyDay',r.weekly_day],['notifWeeklyTime',r.weekly_time],['notifQuietStart',r.quiet_start],['notifQuietEnd',r.quiet_end]].forEach(([id,x])=>{const e=q('#'+id);if(e&&x!=null)e.value=typeof x==='boolean'?String(x):String(x).slice(0,5)})}notifStatus();reminders()}
async function saveNotif(){if(!currentUser)return;const p={user_id:currentUser.id,daily_enabled:q('#notifDailyEnabled')?.value==='true',daily_time:q('#notifDailyTime')?.value||'09:00',meeting_enabled:q('#notifMeetingEnabled')?.value==='true',meeting_minutes_before:Number(q('#notifMeetingMinutes')?.value||30),milestone_enabled:q('#notifMilestoneEnabled')?.value==='true',weekly_enabled:q('#notifWeeklyEnabled')?.value==='true',weekly_day:Number(q('#notifWeeklyDay')?.value||0),weekly_time:q('#notifWeeklyTime')?.value||'19:00',quiet_start:q('#notifQuietStart')?.value||'21:00',quiet_end:q('#notifQuietEnd')?.value||'08:00',browser_notifications:'Notification'in window&&Notification.permission==='granted'};const {error}=await sb.from('notification_preferences').upsert(p,{onConflict:'user_id'});if(error)return notify(error.message,true);notify('Reminder settings saved.')}
function notifStatus(){set('notificationPermissionStatus',!('Notification'in window)?'Notifications are not supported in this browser.':Notification.permission==='granted'?'Notifications are allowed.':Notification.permission==='denied'?'Notifications are blocked in browser settings.':'Permission has not been requested.')}
async function askNotif(){if(!('Notification'in window))return notify('Notifications are not supported here.',true);await Notification.requestPermission();notifStatus()}
async function localNotif(){if(!('Notification'in window)||Notification.permission!=='granted')return notify('Allow notifications first.',true);new Notification('Lellee',{body:'This is a local notification test.',icon:'/icon-192.png'})}
function b64(v){const pad='='.repeat((4-v.length%4)%4),raw=atob((v+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function enablePush(){if(!currentUser)return;if(Notification.permission!=='granted')await askNotif();if(Notification.permission!=='granted')return;try{const reg=await navigator.serviceWorker.ready,{data:k}=await sb.from('app_public_settings').select('value').eq('key','vapid_public_key').maybeSingle();if(!k?.value)return notify('VAPID public key is not configured in app_public_settings.',true);let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(k.value)});const j=sub.toJSON();const {error}=await sb.from('push_subscriptions').upsert({user_id:currentUser.id,endpoint:j.endpoint,p256dh:j.keys?.p256dh,auth:j.keys?.auth,user_agent:navigator.userAgent,enabled:true},{onConflict:'endpoint'});if(error)throw error;notify('Background push is enabled on this device. The end-to-end test can be completed before launch.')}catch(e){notify(e.message||String(e),true)}}
async function reminders(){const box=q('#reminderCenterList');if(!box||!currentUser)return;const {data:r}=await sb.from('reminders').select('*').eq('user_id',currentUser.id).in('status',['pending','snoozed']).order('due_at',{ascending:true}).limit(30);box.innerHTML=(r||[]).length?r.map(x=>`<div class="groupb-row"><div><b>${esc(x.title)}</b><small>${x.due_at?new Date(x.due_at).toLocaleString():''}</small></div><div class="groupb-actions"><button data-reminder-done="${x.id}">Complete</button><button data-reminder-dismiss="${x.id}">Dismiss</button></div></div>`).join(''):'<div class="groupb-empty">No pending reminders.</div>';qa('[data-reminder-done]').forEach(b=>b.onclick=async()=>{await sb.from('reminders').update({status:'completed'}).eq('id',b.dataset.reminderDone);reminders()});qa('[data-reminder-dismiss]').forEach(b=>b.onclick=async()=>{await sb.from('reminders').update({status:'dismissed'}).eq('id',b.dataset.reminderDismiss);reminders()})}

/* Privacy, export, date history, deletion */
async function privacy(){if(!currentUser)return;set('accountEmail',currentUser.email||'');const {data:r}=await sb.from('privacy_preferences').select('*').eq('user_id',currentUser.id).maybeSingle();if(q('#consentTerms'))q('#consentTerms').checked=!!r?.terms_acknowledged;if(q('#consentPrivacy'))q('#consentPrivacy').checked=!!r?.privacy_acknowledged;if(q('#consentPersonalization'))q('#consentPersonalization').checked=r?.personalization_allowed!==false;set('consentStatus',r?'Your saved choices are shown above.':'Review and save your choices.');const {data:d}=await sb.from('account_deletion_requests').select('*').eq('user_id',currentUser.id).order('requested_at',{ascending:false}).limit(1);set('deleteRequestStatus',d?.length?`Latest request: ${d[0].status}`:'No active deletion request.')}
async function savePrivacy(){if(!currentUser)return;const p={user_id:currentUser.id,terms_acknowledged:!!q('#consentTerms')?.checked,privacy_acknowledged:!!q('#consentPrivacy')?.checked,personalization_allowed:!!q('#consentPersonalization')?.checked,acknowledged_at:new Date().toISOString()};const {error}=await sb.from('privacy_preferences').upsert(p,{onConflict:'user_id'});if(error)return notify(error.message,true);for(const [type,granted] of [['terms_acknowledgement',p.terms_acknowledged],['privacy_acknowledgement',p.privacy_acknowledged],['personalization',p.personalization_allowed]])await sb.from('user_consents').insert({user_id:currentUser.id,consent_type:type,consent_version:'v1-release-candidate',granted,metadata:{source:'privacy_center'}});notify('Privacy choices saved.');if(window.LelleeGroupA){window.LelleeGroupA.personal={...window.LelleeGroupA.personal,enabled:p.personalization_allowed}}}
async function exportData(){if(!currentUser)return;const tables=['profiles','recovery_profiles','user_preferences','local_preferences','daily_checkins','recovery_actions','journal_entries','journal_collections','goals','triggers','support_contacts','phase_progress','milestones','saved_meetings','guided_responses','milestone_reviews','periodic_reviews','recovery_story_projects','saved_learning','learning_progress','personalization_preferences','privacy_preferences','notification_preferences','reminders','recovery_date_history'];const out={app:'Lellee',version:GB.version,exported_at:new Date().toISOString(),data:{}};for(const t of tables){try{let z=sb.from(t).select('*');z=t==='profiles'?z.eq('id',currentUser.id):z.eq('user_id',currentUser.id);const {data:r,error}=await z;if(!error)out.data[t]=r}catch(e){}}const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`lellee-recovery-export-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);notify('Recovery data export created.')}
async function changeDate(){if(!currentUser||!q('#newRecoveryDate')?.value)return;const nd=q('#newRecoveryDate').value,{data:r}=await sb.from('recovery_profiles').select('recovery_date').eq('user_id',currentUser.id).single();await sb.from('recovery_date_history').insert({user_id:currentUser.id,previous_date:r?.recovery_date||null,new_date:nd,note:v('recoveryDateNote')||null});const {error}=await sb.from('recovery_profiles').update({recovery_date:nd}).eq('user_id',currentUser.id);if(error)return notify(error.message,true);data.recoveryDate=nd;save();renderBasics();notify('Recovery date updated. Previous recovery history was preserved.')}
async function deletion(){if(!currentUser||!q('#deleteConfirm')?.checked)return notify('Confirm that you understand the request.',true);const {error}=await sb.from('account_deletion_requests').insert({user_id:currentUser.id,email:currentUser.email||null,reason:v('deleteReason')||null,status:'requested'});if(error)return notify(error.message,true);notify('Deletion request recorded.');toggle('deleteRequestForm',false);privacy()}
async function resetMail(){const email=currentUser?.email||q('#authEmail')?.value;if(!email)return;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/app'});if(error)return notify(error.message,true);notify('Password reset email sent.')}
async function newPassword(){const a=v('newPassword'),b=v('newPasswordConfirm');if(a.length<8||a!==b)return notify('Passwords must match and be at least 8 characters.',true);const {error}=await sb.auth.updateUser({password:a});if(error)return notify(error.message,true);notify('Password updated.');toggle('newPasswordForm',false)}

/* Diagnostics + PWA */
async function diagnostics(){const auth=!!currentUser;let db=false;try{const {error}=await sb.from('profiles').select('id').eq('id',currentUser?.id||'00000000-0000-0000-0000-000000000000').limit(1);db=!error}catch(e){}const sw='serviceWorker'in navigator&&!!(await navigator.serviceWorker.getRegistration()),net=navigator.onLine,note=('Notification'in window)?Notification.permission:'unsupported';[['diagAuthIcon','diagAuth',auth,'Signed in','Not signed in'],['diagDbIcon','diagDb',db,'Database reachable','Database check failed'],['diagSwIcon','diagSw',sw,'Service worker active','Service worker not active'],['diagNetIcon','diagNet',net,'Online','Offline']].forEach(([i,t,ok,y,n])=>{set(i,ok?'✓':'!');set(t,ok?y:n);q('#'+i)?.classList.toggle('groupb-status-good',ok);q('#'+i)?.classList.toggle('groupb-status-bad',!ok)});set('diagNotifIcon',note==='granted'?'✓':'○');set('diagNotif',`Notification permission: ${note}`);notify('Health check complete.')}
let installEvent=null;
function pwa(){if('serviceWorker'in navigator)navigator.serviceWorker.register('/service-worker.js').catch(()=>{});window.addEventListener('online',()=>q('#offlineBar')?.classList.add('hidden'));window.addEventListener('offline',()=>q('#offlineBar')?.classList.remove('hidden'));window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;q('#installPrompt')?.classList.remove('hidden')});q('#installLellee')?.addEventListener('click',async()=>{if(installEvent){installEvent.prompt();await installEvent.userChoice;installEvent=null;q('#installPrompt')?.classList.add('hidden')}else notify('On iPhone/iPad: use Share → Add to Home Screen.')});q('#dismissInstall')?.addEventListener('click',()=>q('#installPrompt')?.classList.add('hidden'))}

/* Routing */
function pageRefresh(name){if(name==='planner')renderPlanner();if(name==='support-network'||name==='help-now')renderSupport();if(name==='resources')resources('local');if(name==='notifications')loadNotif();if(['privacy-center','data-lifecycle','recovery-date','account-recovery','account'].includes(name))privacy();if(name==='diagnostics')diagnostics()}
function routeFromUrl(){if(GB.routeApplied||!currentUser)return;const name=new URLSearchParams(location.search).get('page');if(name&&q('#page-'+name)){GB.routeApplied=true;showPage(name);pageRefresh(name)}}

/* Bind */
function bind(){
 q('#openMeetingForm')?.addEventListener('click',()=>toggle('meetingForm'));q('#openGoalForm')?.addEventListener('click',()=>toggle('goalForm'));q('#openActionForm')?.addEventListener('click',()=>toggle('actionForm'));qa('[data-close-planner]').forEach(b=>b.addEventListener('click',()=>['meetingForm','goalForm','actionForm'].forEach(id=>toggle(id,false))));q('#saveMeeting')?.addEventListener('click',saveMeeting);q('#saveGoal')?.addEventListener('click',saveGoal);q('#savePlannedAction')?.addEventListener('click',saveAction);
 q('#openSupportForm')?.addEventListener('click',()=>toggle('supportForm'));q('#closeSupportForm')?.addEventListener('click',()=>toggle('supportForm',false));q('#saveSupportPerson')?.addEventListener('click',saveSupport);qa('[data-help-path]').forEach(b=>b.addEventListener('click',()=>helpPath(b.dataset.helpPath)));
 qa('[data-resource-tab]').forEach(b=>b.addEventListener('click',()=>resources(b.dataset.resourceTab)));qa('[data-resource-type]').forEach(b=>b.addEventListener('click',()=>{GB.resourceType=b.dataset.resourceType;qa('[data-resource-type]').forEach(x=>x.classList.toggle('active',x===b));resources('local')}));
 q('#requestNotifications')?.addEventListener('click',askNotif);q('#enableBackgroundPush')?.addEventListener('click',enablePush);q('#sendTestNotification')?.addEventListener('click',localNotif);q('#saveNotificationPrefs')?.addEventListener('click',saveNotif);q('#refreshReminderCenter')?.addEventListener('click',reminders);q('#resetNotificationPrefs')?.addEventListener('click',()=>{[['notifDailyEnabled','true'],['notifDailyTime','09:00'],['notifMeetingEnabled','true'],['notifMeetingMinutes','30'],['notifMilestoneEnabled','true'],['notifWeeklyEnabled','true'],['notifWeeklyDay','0'],['notifWeeklyTime','19:00'],['notifQuietStart','21:00'],['notifQuietEnd','08:00']].forEach(([id,x])=>{if(q('#'+id))q('#'+id).value=x})});
 q('#saveConsents')?.addEventListener('click',savePrivacy);q('#prodExport')?.addEventListener('click',exportData);q('#lifecycleExport')?.addEventListener('click',exportData);q('#saveRecoveryDateChange')?.addEventListener('click',changeDate);q('#openDeleteRequest')?.addEventListener('click',()=>toggle('deleteRequestForm'));q('#closeDeleteRequest')?.addEventListener('click',()=>toggle('deleteRequestForm',false));q('#submitDeleteRequest')?.addEventListener('click',deletion);q('#recoverySendEmail')?.addEventListener('click',resetMail);q('#openNewPasswordForm')?.addEventListener('click',()=>toggle('newPasswordForm'));q('#closeNewPasswordForm')?.addEventListener('click',()=>toggle('newPasswordForm',false));q('#saveNewPassword')?.addEventListener('click',newPassword);q('#runDiagnostics')?.addEventListener('click',diagnostics);
}
window.LelleeBuildB=GB;
bind();pwa();
const oldShow=showPage;showPage=function(name){oldShow(name);pageRefresh(name)};
let tries=0;const wait=setInterval(()=>{tries++;if(currentUser){clearInterval(wait);Promise.allSettled([renderPlanner(),renderSupport(),privacy()]);routeFromUrl()}else if(tries>40)clearInterval(wait)},200);
})();


/* ===== guided-reviews.js ===== */

(()=>{
'use strict';
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const selected=id=>qa(`#${id} button.selected`).map(x=>x.textContent.trim());
const note=id=>q('#'+id)?.value?.trim()||'';
function feedback(msg,error=false){
  const t=q('#globalToast');
  if(t){t.textContent=msg;t.classList.remove('hidden');if(error)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2300)}
  else if(window.showSync)showSync(msg);
}
function bindChoices(){
  qa('.guided-review-choices button').forEach(b=>{
    b.addEventListener('click',()=>{
      const box=b.closest('.guided-review-choices');
      if(box?.classList.contains('single-preferred')){
        qa(`#${box.id} button`).forEach(x=>x.classList.remove('selected'));
      }
      b.classList.toggle('selected');
    });
  });
}
function replaceButton(id,handler){
  const old=q('#'+id); if(!old)return;
  const fresh=old.cloneNode(true);
  old.replaceWith(fresh);
  fresh.addEventListener('click',handler);
}
function recoveryDay(){
  try{return Math.max(1,daysInRecovery())}catch(e){return null}
}
async function saveWeekly(){
  if(!currentUser)return feedback('Please sign in first.',true);
  const now=new Date(), start=new Date(now);
  start.setDate(now.getDate()-now.getDay());
  const helped=selected('weeklyHelpedChoices');
  const challenges=selected('weeklyHardChoices');
  const next=selected('weeklyNextChoices');
  const reflection=note('weeklyNote')||null;
  if(!helped.length&&!challenges.length&&!next.length&&!reflection)return feedback('Choose or write at least one thing before saving.',true);
  const key='weekly_'+start.toISOString().slice(0,10);
  const {error}=await sb.from('periodic_reviews').upsert({
    user_id:currentUser.id,
    review_key:key,
    review_type:'weekly',
    period_start:start.toISOString().slice(0,10),
    period_end:todayKey(),
    recovery_day:recoveryDay(),
    helped,
    challenges,
    reflection,
    next_focus:next.join(' • ')||null
  },{onConflict:'user_id,review_key'});
  if(error)return feedback(error.message,true);
  feedback('Weekly review saved.');
}
async function saveMonthly(){
  if(!currentUser)return feedback('Please sign in first.',true);
  const now=new Date(), start=new Date(now.getFullYear(),now.getMonth(),1), end=new Date(now.getFullYear(),now.getMonth()+1,0);
  const growth=selected('monthlyGrowthChoices');
  const care=selected('monthlyCareChoices');
  const protect=selected('monthlyProtectChoices');
  const reflection=note('monthlyNote')||null;
  if(!growth.length&&!care.length&&!protect.length&&!reflection)return feedback('Choose or write at least one thing before saving.',true);
  const key=`monthly_${now.getFullYear()}_${String(now.getMonth()+1).padStart(2,'0')}`;
  const {error}=await sb.from('periodic_reviews').upsert({
    user_id:currentUser.id,
    review_key:key,
    review_type:'monthly',
    period_start:start.toISOString().slice(0,10),
    period_end:end.toISOString().slice(0,10),
    recovery_day:recoveryDay(),
    helped:growth,
    challenges:care,
    reflection,
    next_focus:protect.join(' • ')||null
  },{onConflict:'user_id,review_key'});
  if(error)return feedback(error.message,true);
  feedback('Monthly review saved.');
}
async function buildThenNow(){
  if(!currentUser)return feedback('Please sign in first.',true);
  const key=q('#tnKeyV2')?.value||'current_feeling';
  const {data:rows,error}=await sb.from('guided_responses')
    .select('response_date,recovery_day,prompt_key,prompt_text,selected_choices,optional_reflection')
    .eq('user_id',currentUser.id)
    .eq('prompt_key',key)
    .order('response_date',{ascending:true});
  const box=q('#thenNowResultV2');
  if(error)return feedback(error.message,true);
  if(!rows||rows.length<2){
    box.innerHTML='<div class="approved-resource-empty"><b>Not enough history yet.</b><small>Then & Now needs this theme saved on at least two different days.</small></div>';
    return;
  }
  const first=rows[0], latest=rows[rows.length-1];
  box.dataset.key=key;box.dataset.first=first.response_date;box.dataset.last=latest.response_date;
  const choices=r=>Array.isArray(r.selected_choices)&&r.selected_choices.length?r.selected_choices.join(' • '):'No choices saved';
  box.innerHTML=`<article class="approved-time-card then">
    <span class="approved-kicker">THEN</span><h3>${first.prompt_text}</h3>
    <small>${first.response_date}${first.recovery_day?` • Day ${first.recovery_day}`:''}</small>
    <p class="approved-choice-line">${choices(first)}</p>
    ${first.optional_reflection?`<blockquote>${first.optional_reflection}</blockquote>`:''}
  </article>
  <div class="approved-time-arrow">→</div>
  <article class="approved-time-card now">
    <span class="approved-kicker">NOW</span><h3>${latest.prompt_text}</h3>
    <small>${latest.response_date}${latest.recovery_day?` • Day ${latest.recovery_day}`:''}</small>
    <p class="approved-choice-line">${choices(latest)}</p>
    ${latest.optional_reflection?`<blockquote>${latest.optional_reflection}</blockquote>`:''}
  </article>`;
}
async function saveThenNow(){
  if(!currentUser)return feedback('Please sign in first.',true);
  const box=q('#thenNowResultV2');
  if(!box?.dataset.key)return feedback('Build a comparison first.',true);
  const observations=selected('thenNowObservationChoices');
  const reflection=note('thenNowReflection')||null;
  if(!observations.length&&!reflection)return feedback('Choose or write at least one observation before saving.',true);
  const key=`then_now_${box.dataset.key}_${box.dataset.last}`;
  const {error}=await sb.from('milestone_reviews').upsert({
    user_id:currentUser.id,
    milestone_key:key,
    milestone_date:todayKey(),
    recovery_day:recoveryDay(),
    title:'Then & Now',
    comparison_snapshot:{
      prompt_key:box.dataset.key,
      first_date:box.dataset.first,
      latest_date:box.dataset.last
    },
    selected_observations:observations,
    reflection,
    allow_recovery_story:!!q('#thenNowStoryOptIn')?.checked
  },{onConflict:'user_id,milestone_key'});
  if(error)return feedback(error.message,true);
  feedback('Then & Now reflection saved.');
}
bindChoices();
replaceButton('saveWeeklyReview',saveWeekly);
replaceButton('saveMonthlyReview',saveMonthly);
replaceButton('buildThenNowV2',buildThenNow);
replaceButton('saveThenNowReflection',saveThenNow);
})();


/* ===== connections-progress.js ===== */

(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const set=(id,v)=>{const e=q('#'+id);if(e)e.textContent=v??''};
let historyFilter='all';

const PHASES=[
 {key:'stabilize',name:'Stabilize',start:1,end:30,desc:'Safety, steadiness, support, and the next manageable choice.'},
 {key:'build',name:'Build',start:31,end:60,desc:'Routines, coping, support, and recovery protection.'},
 {key:'understand',name:'Understand',start:61,end:90,desc:'Patterns, triggers, thoughts, emotions, and needs.'},
 {key:'rebuild',name:'Rebuild',start:91,end:120,desc:'Daily life, responsibilities, boundaries, relationships, and self-trust.'},
 {key:'strengthen',name:'Strengthen',start:121,end:150,desc:'Warning signs, relapse prevention, and recovery under pressure.'},
 {key:'grow',name:'Grow',start:151,end:183,desc:'Identity, purpose, connection, and a fuller recovery life.'},
 {key:'maintenance',name:'Maintenance',start:184,end:365,desc:'Protect what works and adapt recovery as life changes.'},
 {key:'year_2',name:'Year Two',start:366,end:730,desc:'Build durable, self-directed recovery and long-range goals.'},
 {key:'long_term',name:'Long-Term Recovery',start:731,end:999999,desc:'Lighter weekly guidance, annual review, and support when life changes.'}
];
function rday(){try{return Math.max(1,daysInRecovery())}catch(e){return 1}}
function phase(){const d=rday();return PHASES.find(x=>d>=x.start&&d<=x.end)||PHASES[PHASES.length-1]}
function phasePct(){const d=rday(),p=phase();return p.key==='long_term'?100:Math.max(0,Math.min(100,((d-p.start+1)/(p.end-p.start+1))*100))}
function weekday(n){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][Number(n)]||'Weekly'}
function timeLabel(t){if(!t)return'';const parts=String(t).slice(0,5).split(':');let h=Number(parts[0]),m=parts[1],ap=h>=12?'PM':'AM';h=h%12||12;return `${h}:${m} ${ap}`}
function nextOccurrence(dayNum,timeStr){
  if(dayNum===null||dayNum===undefined||dayNum==='')return null;
  const now=new Date(),target=new Date(now);
  let diff=(Number(dayNum)-now.getDay()+7)%7;
  const [hh,mm]=String(timeStr||'12:00').slice(0,5).split(':').map(Number);
  target.setHours(hh||0,mm||0,0,0);
  if(diff===0&&target<=now)diff=7;
  target.setDate(now.getDate()+diff);
  return target;
}
async function renderMeetings(){
  if(!currentUser)return;
  const box=q('#meetingPlanList');if(!box)return;
  const {data:rows,error}=await sb.from('saved_meetings').select('*').eq('user_id',currentUser.id).order('meeting_day',{ascending:true}).order('meeting_time',{ascending:true});
  if(error){box.innerHTML='<div class="approved-resource-empty">Your meeting plan could not be loaded.</div>';return}
  const list=rows||[];
  set('savedMeetingCount',`${list.length} saved`);
  const withNext=list.map(x=>({...x,_next:nextOccurrence(x.meeting_day,x.meeting_time)})).filter(x=>x._next).sort((a,b)=>a._next-b._next);
  const next=withNext[0];
  set('nextMeetingTitle',next?.meeting_name||'No meeting scheduled yet');
  set('nextMeetingMeta',next?`${next._next.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})} • ${timeLabel(next.meeting_time)}${next.location_text?` • ${next.location_text}`:''}`:'Add a meeting in Recovery Planner and it will appear here.');
  box.innerHTML=list.length?list.map(x=>`<article class="connection-row">
    <div class="connection-row-icon">${x.meeting_format==='online'?'◉':'▣'}</div>
    <div><b>${esc(x.meeting_name)}</b><small>${esc(weekday(x.meeting_day))}${x.meeting_time?` • ${esc(timeLabel(x.meeting_time))}`:''}${x.location_text?` • ${esc(x.location_text)}`:''}</small></div>
    <div class="meta">${esc((x.meeting_format||'saved').replace('_',' '))}</div>
  </article>`).join(''):'<div class="approved-resource-empty"><b>No saved meetings yet.</b><small>Use Recovery Planner to create your personal meeting plan.</small></div>';
}
async function renderProgress(){
  if(!currentUser)return;
  const d=rday(),p=phase(),pct=phasePct();
  set('progressPhaseKicker',`CURRENT PHASE • DAY ${d}`);set('progressPhaseTitle',p.name);set('progressPhaseDescription',p.desc);set('progressLivePercent',p.key==='long_term'?'Long-term weekly guidance':`${Math.round(pct)}% through ${p.name}`);if(q('#progressLiveBar'))q('#progressLiveBar').style.width=pct+'%';
  qa('[data-recovery-day]').forEach(x=>x.textContent=d);
  const start=new Date();start.setDate(1);const monthStart=start.toISOString().slice(0,10);
  const [g,j,s,m,t,rw,ms,gm,jm]=await Promise.all([
    sb.from('guided_responses').select('response_date').eq('user_id',currentUser.id),
    sb.from('journal_entries').select('id,entry_date').eq('user_id',currentUser.id),
    sb.from('support_contacts').select('id').eq('user_id',currentUser.id),
    sb.from('saved_meetings').select('id').eq('user_id',currentUser.id),
    sb.from('tool_use_log').select('id,started_at').eq('user_id',currentUser.id),
    sb.from('periodic_reviews').select('id,period_end').eq('user_id',currentUser.id),
    sb.from('milestone_reviews').select('id,milestone_date').eq('user_id',currentUser.id),
    sb.from('guided_responses').select('response_date').eq('user_id',currentUser.id).gte('response_date',monthStart),
    sb.from('journal_entries').select('entry_date').eq('user_id',currentUser.id).gte('entry_date',monthStart)
  ]);
  const guidedDays=new Set((g.data||[]).map(x=>x.response_date)).size;
  set('progressGuidedDays',guidedDays);set('progressJournalEntries',(j.data||[]).length);set('progressSupportPeople',(s.data||[]).length);set('progressMeetings',(m.data||[]).length);set('progressToolsUsed',(t.data||[]).length);set('progressReviews',(rw.data||[]).length+(ms.data||[]).length);
  const monthGuided=new Set((gm.data||[]).map(x=>x.response_date)).size,monthJournal=(jm.data||[]).length;
  set('progressMonthHeadline',monthGuided||monthJournal?`${monthGuided} guided days • ${monthJournal} journal entries`:'Your month is taking shape');
  set('progressMonthText',monthGuided||monthJournal?'This is a record of activity, not a score. Use it to notice what you are returning to consistently.':'As you save guided recovery and journal entries, this monthly view will update.');
}
async function renderCommunity(){
  if(!currentUser)return;
  const [s,m,r]=await Promise.all([
    sb.from('support_contacts').select('contact_name,is_primary').eq('user_id',currentUser.id).order('is_primary',{ascending:false}),
    sb.from('saved_meetings').select('meeting_name').eq('user_id',currentUser.id),
    sb.from('local_resources').select('id,name,resource_type').in('resource_type',['peer_support','community']).limit(20)
  ]);
  const supports=s.data||[],meetings=m.data||[],resources=r.data||[];
  set('communitySupportHeadline',supports.length?`${supports.length} ${supports.length===1?'person':'people'} in My Support`:'Your support network');
  set('communitySupportText',supports.length?`${supports[0]?.contact_name||'Your support'}${supports.length>1?` and ${supports.length-1} more`:''} are saved in your private support network.`:'Add people you trust so support stays easier to reach.');
  set('communityMeetingHeadline',meetings.length?`${meetings.length} saved ${meetings.length===1?'meeting':'meetings'}`:'Your meeting plan');
  set('communityMeetingText',meetings.length?`${meetings[0]?.meeting_name||'Your next meeting'} is part of your saved recovery connection plan.`:'Add meetings you choose in Recovery Planner.');
  set('communityResourceHeadline',resources.length?`${resources.length} peer/community resources available`:'Find another layer of support');
  set('communityResourceText',resources.length?`Lellee has vetted peer or community resources available in Resources.`:'Vetted peer-support and community resources can be prioritized by location.');
}
function timelineDate(x){const d=new Date(`${x}T12:00:00`);return isNaN(d)?x:d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}
async function loadHistory(){
  if(!currentUser)return;
  const range=q('#historyRange')?.value||'90';
  let from=null;if(range!=='all'){const d=new Date();d.setDate(d.getDate()-Number(range));from=d.toISOString().slice(0,10)}
  const [g,j,r,m]=await Promise.all([
    sb.from('guided_responses').select('id,response_date,recovery_day,prompt_text,selected_choices,optional_reflection,metadata').eq('user_id',currentUser.id).order('response_date',{ascending:false}).limit(250),
    sb.from('journal_entries').select('id,entry_date,title,prompt_text,content').eq('user_id',currentUser.id).order('entry_date',{ascending:false}).limit(250),
    sb.from('periodic_reviews').select('id,review_type,period_end,reflection,next_focus').eq('user_id',currentUser.id).order('period_end',{ascending:false}).limit(100),
    sb.from('milestone_reviews').select('id,milestone_date,title,reflection,milestone_key').eq('user_id',currentUser.id).order('milestone_date',{ascending:false}).limit(100)
  ]);
  let guided=(g.data||[]),journal=(j.data||[]),reviews=(r.data||[]),milestones=(m.data||[]);
  if(from){guided=guided.filter(x=>x.response_date>=from);journal=journal.filter(x=>x.entry_date>=from);reviews=reviews.filter(x=>x.period_end>=from);milestones=milestones.filter(x=>x.milestone_date>=from)}
  set('historyGuidedCount',guided.length);set('historyJournalCount',journal.length);set('historyReviewCount',reviews.length);set('historyMilestoneCount',milestones.length);
  const items=[
    ...guided.map(x=>({type:'guided',date:x.response_date,title:x.metadata?.title||x.prompt_text||'Guided recovery',body:(x.selected_choices||[]).join(' • ')||x.optional_reflection||'Saved guided response',icon:'✓'})),
    ...journal.map(x=>({type:'journal',date:x.entry_date,title:x.title||x.prompt_text||'Journal entry',body:String(x.content||'').slice(0,220),icon:'✎'})),
    ...reviews.map(x=>({type:'review',date:x.period_end,title:x.review_type==='monthly'?'Monthly Review':'Weekly Review',body:x.reflection||x.next_focus||'Saved recovery review',icon:'↗'})),
    ...milestones.map(x=>({type:'milestone',date:x.milestone_date,title:x.title||'Milestone',body:x.reflection||'Saved milestone review',icon:'◆'}))
  ].filter(x=>historyFilter==='all'||x.type===historyFilter).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const box=q('#historyTimeline');if(!box)return;
  box.innerHTML=items.length?items.map(x=>`<article class="history-item">
    <div class="history-dot">${x.icon}</div>
    <div><small>${esc(x.type)} • ${esc(timelineDate(x.date))}</small><h3>${esc(x.title)}</h3><p>${esc(x.body||'')}</p></div>
  </article>`).join(''):'<div class="approved-resource-empty"><b>No history in this view yet.</b><small>Try another filter or time range.</small></div>';
}
function bind(){
  qa('[data-history-filter]').forEach(b=>b.addEventListener('click',()=>{historyFilter=b.dataset.historyFilter;qa('[data-history-filter]').forEach(x=>x.classList.toggle('active',x===b));loadHistory()}));
  q('#historyRange')?.addEventListener('change',loadHistory);
}
bind();
const oldShow=showPage;
showPage=function(name){oldShow(name);if(name==='meetings')renderMeetings();if(name==='progress')renderProgress();if(name==='community')renderCommunity();if(name==='history')loadHistory()};
let tries=0;const wait=setInterval(()=>{tries++;if(currentUser){clearInterval(wait);Promise.allSettled([renderMeetings(),renderProgress(),renderCommunity()])}else if(tries>30)clearInterval(wait)},200);
})();


/* ===== paths-resources.js ===== */

(()=>{
'use strict';
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const set=(id,v)=>{const e=q('#'+id);if(e)e.textContent=v??''};
const PATH_LABELS={
  '12_step':'12-Step','skills_based':'SMART / Skills-Based','therapy_counseling':'Therapy & Counseling',
  'medication_supported':'Medication-Supported','peer_support':'Peer Support','faith_spiritual':'Faith / Spiritual Support',
  'recovery_community':'Recovery Community','health_wellness':'Health / Wellness','mixed':'Mixed Approach','exploring':'Exploring'
};
const APPROACH_UI={
  '12_step':'12-Step','skills_based':'SMART / skills-based','therapy_counseling':'Therapy / counseling',
  'medication_supported':'Medication-supported','peer_support':'Peer support','mixed':'Mixed','exploring':'Exploring'
};
const PATH_INFO={
 '12_step':['12-Step','Fellowship, sponsorship, meetings, and a structured step process.',['Can add regular peer connection','Can provide sponsorship/mentorship','Can offer a structured recovery framework']],
 'skills_based':['SMART / Skills-Based','Practical motivation, coping, thinking, and behavior-change skills.',['Emphasizes self-management skills','Uses practical tools and exercises','Can complement treatment or other pathways']],
 'therapy_counseling':['Therapy & Counseling','Professional behavioral-health support for substance use, mental health, trauma, relationships, or behavior change.',['Can address deeper patterns','Can support co-occurring mental-health needs','May be individual, group, family, or specialized care']],
 'medication_supported':['Medication-Supported','Medication can be an evidence-based part of an individualized treatment and recovery plan.',['Requires appropriate medical care','Can work alongside counseling and peer support','Medication is not treated as a lesser form of recovery']],
 'peer_support':['Peer Support','Recovery connection with people who have lived experience.',['Can reduce isolation','Can provide practical recovery encouragement','Can complement clinical treatment']],
 'faith_spiritual':['Faith / Spiritual Support','Optional spiritual or faith-based support when it fits your beliefs.',['Belief preference remains optional','Can coexist with any legitimate recovery pathway','Never replaces medical or safety guidance']]
};
let primary='exploring',supporting=[],resourceType='all',resourceView='finder',resourceRows=[],savedIds=new Set();

function dbApproachToKey(v){return v||'exploring'}
function supportSelected(){return qa('[data-path-support].selected').map(x=>x.dataset.pathSupport)}
function primarySelected(){return q('[data-path-primary].selected')?.dataset.pathPrimary||primary}

async function loadPaths(){
  if(!currentUser)return;
  try{
    const [u,p]=await Promise.all([
      sb.from('user_preferences').select('recovery_approach,belief_preference,faith_tradition,denomination').eq('user_id',currentUser.id).single(),
      sb.from('recovery_path_preferences').select('*').eq('user_id',currentUser.id).maybeSingle()
    ]);
    primary=p.data?.primary_path||dbApproachToKey(u.data?.recovery_approach)||'exploring';
    supporting=Array.isArray(p.data?.supporting_paths)?p.data.supporting_paths:[];
    qa('[data-path-primary]').forEach(b=>b.classList.toggle('selected',b.dataset.pathPrimary===primary));
    qa('[data-path-support]').forEach(b=>b.classList.toggle('selected',supporting.includes(b.dataset.pathSupport)));
    const belief=u.data?.belief_preference||'exploring',faith=u.data?.faith_tradition,den=u.data?.denomination;
    set('pathBeliefTitle',belief==='secular'?'Secular preference':belief==='spiritual'?'Spiritual preference':belief==='faith_based'?'Faith-based preference':belief==='mixed'?'Mixed belief preference':'Exploring belief preference');
    set('pathBeliefText',[belief.replace('_',' '),faith,den].filter(Boolean).join(' • ')||'Lellee only includes belief-aligned options when you choose them.');
    renderPathSummary();renderExplorer();
  }catch(e){renderPathSummary();renderExplorer()}
}
function renderPathSummary(){
  const p=primarySelected(),extra=supportSelected();
  set('pathPrimarySummary',PATH_LABELS[p]||'Exploring');
  set('pathSupportSummary',extra.length?`Also using: ${extra.map(x=>PATH_LABELS[x]||x).join(' • ')}`:'Choose any additional pathways that support you.');
}
function renderExplorer(){
  const keys=[primarySelected(),...supportSelected()].filter((x,i,a)=>a.indexOf(x)===i).filter(x=>PATH_INFO[x]);
  const use=keys.length?keys:['12_step','skills_based','therapy_counseling','medication_supported','peer_support','faith_spiritual'];
  const box=q('#pathExplorer');if(!box)return;
  box.innerHTML=use.map(k=>{const x=PATH_INFO[k];return `<article class="path-explorer-card"><small>${esc(PATH_LABELS[k]||k)}</small><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p><ul>${x[2].map(v=>`<li>${esc(v)}</li>`).join('')}</ul></article>`}).join('');
}
async function savePaths(){
  if(!currentUser)return;
  primary=primarySelected();supporting=supportSelected();
  const {error}=await sb.from('recovery_path_preferences').upsert({
    user_id:currentUser.id,primary_path:primary,supporting_paths:supporting
  },{onConflict:'user_id'});
  if(error)return show(error.message,true);
  await sb.from('user_preferences').update({recovery_approach:primary}).eq('user_id',currentUser.id);
  if(typeof data!=='undefined'){data.approach=APPROACH_UI[primary]||'Exploring';if(typeof save==='function')save()}
  renderPathSummary();renderExplorer();show('Recovery paths saved.');
}
function show(msg,error=false){const t=q('#globalToast');if(t){t.textContent=msg;t.classList.remove('hidden');if(error)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}else if(window.showSync)showSync(msg)}

async function loadResources(){
  if(!currentUser)return;
  set('resourceLocation',[data?.city,data?.state].filter(Boolean).join(', ')||'Your area');
  const [r,s]=await Promise.all([
    sb.from('local_resources').select('*').eq('published',true).order('featured',{ascending:false}).order('name'),
    sb.from('saved_resources').select('resource_id').eq('user_id',currentUser.id)
  ]);
  resourceRows=r.data||[];savedIds=new Set((s.data||[]).map(x=>x.resource_id));renderResources();
}
function filters(){
  return {
    search:(q('#resourceSearch')?.value||'').toLowerCase().trim(),
    path:q('#resourcePathFilter')?.value||'',
    access:q('#resourceAccessFilter')?.value||''
  };
}
function matches(r,f){
  if(resourceType!=='all'&&r.resource_type!==resourceType)return false;
  if(f.search&&!`${r.name||''} ${r.description||''} ${r.city||''} ${r.state||''}`.toLowerCase().includes(f.search))return false;
  if(f.path&&!(Array.isArray(r.pathways)&&r.pathways.includes(f.path)))return false;
  if(f.access==='free'&&r.cost_level!=='free')return false;
  if(f.access==='low_cost'&&!['free','low_cost'].includes(r.cost_level))return false;
  if(f.access==='virtual'&&!r.virtual_available)return false;
  return true;
}
function pathTags(r){return (Array.isArray(r.pathways)?r.pathways:[]).slice(0,3).map(x=>`<span>${esc(PATH_LABELS[x]||x.replaceAll('_',' '))}</span>`).join('')}
function card(r,isSponsored=false){
  const meta=[r.city,r.state,r.virtual_available?'Virtual available':null,r.cost_level==='free'?'Free':r.cost_level==='low_cost'?'Low cost':null].filter(Boolean).join(' • ');
  const saved=savedIds.has(r.id);
  return `<article class="resource-v2-card ${isSponsored?'sponsored':''}">
    <div class="resource-card-top"><span class="resource-tag">${esc((r.resource_type||'resource').replaceAll('_',' '))}</span>${isSponsored?`<span class="sponsor-tag">${esc(r.sponsor_label||'Sponsored')}</span>`:''}</div>
    <h3>${esc(r.name)}</h3>
    <p>${esc(r.description||'Recovery-supporting resource.')}</p>
    <div class="resource-meta">${esc(meta||'Location/details available from provider')}</div>
    <div class="resource-path-tags">${pathTags(r)}</div>
    <div class="resource-card-actions">
      ${r.website_url?`<a href="${esc(r.website_url)}" target="_blank" rel="noopener">Website</a>`:''}
      ${r.phone?`<a href="tel:${esc(r.phone)}">Call</a>`:''}
      <button data-resource-save-v2="${r.id}">${saved?'Saved ✓':'Save'}</button>
    </div>
  </article>`;
}
function renderResources(){
  if(resourceView==='news')return renderNews();
  if(resourceView==='saved')return renderSaved();
  const f=filters(),rows=resourceRows.filter(r=>matches(r,f));
  const sponsored=rows.filter(r=>r.sponsored===true);
  const organic=rows.filter(r=>r.sponsored!==true);
  q('#sponsoredResourceSection')?.classList.toggle('hidden',!sponsored.length);
  if(q('#sponsoredResourceList'))q('#sponsoredResourceList').innerHTML=sponsored.map(r=>card(r,true)).join('');
  set('resourceResultCount',`${organic.length} ${organic.length===1?'result':'results'}`);
  set('resourceResultTitle',data?.city?`Resources around ${data.city}`:'Published resources');
  const box=q('#resourceFinderList');if(box)box.innerHTML=organic.length?organic.map(r=>card(r,false)).join(''):'<div class="approved-resource-empty"><b>No matching resources yet.</b><small>Try removing a filter or check again as the vetted directory grows.</small></div>';
  bindSaveButtons();
}
async function renderNews(){
  const box=q('#resourceNewsListV2');if(!box)return;
  const {data:r,error}=await sb.from('recovery_news').select('*').eq('published',true).order('published_at',{ascending:false}).limit(40);
  if(error){box.innerHTML='<div class="approved-resource-empty">Recovery news could not be loaded.</div>';return}
  box.innerHTML=(r||[]).length?(r||[]).map(x=>`<article class="resource-news-row"><small>${esc([x.source_name,x.published_at?new Date(x.published_at).toLocaleDateString():null].filter(Boolean).join(' • '))}</small><h3>${esc(x.title)}</h3><p>${esc(x.summary||'')}</p>${x.source_url?`<a class="approved-link" href="${esc(x.source_url)}" target="_blank" rel="noopener">Read source →</a>`:''}</article>`).join(''):'<div class="approved-resource-empty"><b>No curated news published yet.</b></div>';
}
function renderSaved(){
  const box=q('#resourceSavedListV2');if(!box)return;
  const rows=resourceRows.filter(r=>savedIds.has(r.id));
  box.innerHTML=rows.length?rows.map(r=>card(r,r.sponsored===true)).join(''):'<div class="approved-resource-empty"><b>No saved resources yet.</b><small>Save resources you may want to return to.</small></div>';
  bindSaveButtons();
}
function bindSaveButtons(){qa('[data-resource-save-v2]').forEach(b=>b.onclick=()=>toggleSave(b.dataset.resourceSaveV2))}
async function toggleSave(id){
  if(savedIds.has(id)){await sb.from('saved_resources').delete().eq('user_id',currentUser.id).eq('resource_id',id);savedIds.delete(id)}
  else{await sb.from('saved_resources').insert({user_id:currentUser.id,resource_id:id});savedIds.add(id)}
  renderResources();
}
function setResourceView(v){
  resourceView=v;
  qa('[data-resource-view]').forEach(b=>b.classList.toggle('active',b.dataset.resourceView===v));
  q('#resourceFinderPanel')?.classList.toggle('hidden',v!=='finder');
  q('#resourceNewsPanelV2')?.classList.toggle('hidden',v!=='news');
  q('#resourceSavedPanelV2')?.classList.toggle('hidden',v!=='saved');
  if(v==='news')renderNews();else if(v==='saved')renderSaved();else renderResources();
}
function bind(){
  qa('[data-path-primary]').forEach(b=>b.addEventListener('click',()=>{qa('[data-path-primary]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');renderPathSummary();renderExplorer()}));
  qa('[data-path-support]').forEach(b=>b.addEventListener('click',()=>{b.classList.toggle('selected');renderPathSummary();renderExplorer()}));
  q('#saveRecoveryPaths')?.addEventListener('click',savePaths);
  qa('[data-resource-view]').forEach(b=>b.addEventListener('click',()=>setResourceView(b.dataset.resourceView)));
  qa('[data-resource-type-v2]').forEach(b=>b.addEventListener('click',()=>{resourceType=b.dataset.resourceTypeV2;qa('[data-resource-type-v2]').forEach(x=>x.classList.toggle('active',x===b));renderResources()}));
  q('#resourceSearch')?.addEventListener('input',renderResources);
  q('#resourcePathFilter')?.addEventListener('change',renderResources);
  q('#resourceAccessFilter')?.addEventListener('change',renderResources);
}
bind();
const oldShow=showPage;
showPage=function(name){oldShow(name);if(name==='paths')loadPaths();if(name==='resources')loadResources()};
let tries=0;const timer=setInterval(()=>{tries++;if(currentUser){clearInterval(timer);Promise.allSettled([loadPaths(),loadResources()])}else if(tries>30)clearInterval(timer)},200);
})();


/* ===== lellee-plus.js ===== */

(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const set=(id,v)=>{const e=q('#'+id);if(e)e.textContent=v??''};
const toast=(m,err=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(err)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2300)}else if(window.showSync)showSync(m)};
let membership={tier:'free',status:'free'},priceMonthly=3.99,currentReview=null;
const isPlus=()=>membership.tier==='plus'&&['active','trialing'].includes(membership.status);

async function loadPlusSettings(){
 try{
  const {data:r}=await sb.from('app_public_settings').select('key,value').in('key',['plus_monthly_price','plus_annual_price']);
  const m=Object.fromEntries((r||[]).map(x=>[x.key,x.value]));
  priceMonthly=Number(m.plus_monthly_price||3.99);
 }catch(e){}
 set('plusPriceMonthly',`$${priceMonthly.toFixed(2)}`);set('plusComparePrice',`$${priceMonthly.toFixed(2)}`);
}
async function loadMembership(){
 if(!currentUser)return;
 try{const {data:r}=await sb.from('user_memberships').select('*').eq('user_id',currentUser.id).maybeSingle();membership=r||{tier:'free',status:'free'}}catch(e){membership={tier:'free',status:'free'}}
 const plus=isPlus();q('#plusStatusBand')?.classList.toggle('active',plus);set('plusStatusTitle',plus?'Lellee Plus active':'Free account');set('plusStatusBadge',plus?'PLUS':'FREE');
 set('plusStatusText',plus?'Your Plus features are active.':'You have the full core recovery experience. Plus features are optional.');
}
async function beginPlus(){
 if(!currentUser)return toast('Please sign in first.',true);
 const {error}=await sb.from('plus_checkout_requests').insert({user_id:currentUser.id,requested_plan:'monthly',requested_price:priceMonthly,status:'requested',return_url:location.origin+'/app?page=plus'});
 if(error)return toast(error.message,true);
 toast('Plus checkout request saved. Secure payment checkout will be connected separately.');
 q('#startPlusMembership').textContent='Checkout setup pending';
}
async function collectReview(daysBack){
 const since=new Date();since.setDate(since.getDate()-Number(daysBack));const from=since.toISOString().slice(0,10),iso=since.toISOString();
 const [g,j,t,m,s,r,ms]=await Promise.all([
  sb.from('guided_responses').select('response_date,selected_choices,optional_reflection,metadata').eq('user_id',currentUser.id).gte('response_date',from).order('response_date',{ascending:false}),
  sb.from('journal_entries').select('entry_date,title,prompt_text,content').eq('user_id',currentUser.id).gte('entry_date',from).order('entry_date',{ascending:false}),
  sb.from('tool_use_log').select('tool_slug,started_at').eq('user_id',currentUser.id).gte('started_at',iso).order('started_at',{ascending:false}),
  sb.from('saved_meetings').select('id,meeting_name').eq('user_id',currentUser.id),
  sb.from('support_contacts').select('id,contact_name').eq('user_id',currentUser.id),
  sb.from('periodic_reviews').select('review_type,period_end,helped,challenges,next_focus,reflection').eq('user_id',currentUser.id).gte('period_end',from).order('period_end',{ascending:false}),
  sb.from('milestone_reviews').select('title,milestone_date,reflection').eq('user_id',currentUser.id).gte('milestone_date',from).order('milestone_date',{ascending:false})
 ]);
 return {from,guided:g.data||[],journal:j.data||[],tools:t.data||[],meetings:m.data||[],support:s.data||[],reviews:r.data||[],milestones:ms.data||[]};
}
function top(values){const m={};values.flat().filter(Boolean).forEach(v=>{v=String(v).trim();m[v]=(m[v]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0]||null}
function toolLabel(v){return String(v||'Recovery Tool').replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase())}
function patterns(d){
 const choices=d.guided.flatMap(x=>Array.isArray(x.selected_choices)?x.selected_choices:[]);
 const helped=[...d.reviews.flatMap(x=>Array.isArray(x.helped)?x.helped:[]),...choices.filter(x=>/(support|meeting|routine|rest|sleep|coping|boundary|health|connection|faith|treatment)/i.test(x))];
 const challenges=[...d.reviews.flatMap(x=>Array.isArray(x.challenges)?x.challenges:[]),...choices.filter(x=>/(craving|stress|family|relationship|money|work|school|sleep|lonely|health|overwhelm|trigger|anger|conflict)/i.test(x))];
 const supportTop=top(helped),challengeTop=top(challenges),toolTop=top(d.tools.map(x=>toolLabel(x.tool_slug)));
 const activeDays=new Set([...d.guided.map(x=>x.response_date),...d.journal.map(x=>x.entry_date),...d.reviews.map(x=>x.period_end),...d.milestones.map(x=>x.milestone_date)]).size;
 let consistency='Beginning',consistencyText='A few saved recovery moments are enough to begin noticing patterns.';
 if(activeDays>=20){consistency='Steady reflection';consistencyText='You returned to Lellee on many days in this period. This describes activity, not recovery quality.'}
 else if(activeDays>=8){consistency='Building a rhythm';consistencyText='You returned often enough for some patterns to become easier to notice.'}
 else if(activeDays>0){consistency='Getting started';consistencyText='Your saved activity is beginning to form a recovery history.'}
 let carry='Stay connected',carryText='Connection is a useful default to protect when no stronger pattern stands out.';
 const c=(challengeTop||'').toLowerCase();
 if(c.includes('sleep')){carry='Protect sleep';carryText='Sleep appeared as an area needing care, so protecting rest may be worth carrying forward.'}
 else if(/crav|trigger/.test(c)){carry='Use support and coping earlier';carryText='Cravings or triggers appeared, so earlier support and coping may create more choices.'}
 else if(/money|work|school|overwhelm/.test(c)){carry='Keep the next task small';carryText='Practical stress appeared, so one manageable next step may protect recovery better than solving everything at once.'}
 else if(/family|relationship|conflict/.test(c)){carry='Protect boundaries and connection';carryText='Relationship pressure appeared, so clear boundaries and safe support may deserve attention.'}
 else if(c.includes('lonely')){carry='Move toward safe connection';carryText='Loneliness appeared, so intentional connection may be worth protecting.'}
 return {activeDays,supportTop,challengeTop,toolTop,consistency,consistencyText,carry,carryText};
}
function evidence(d){
 const rows=[
  ...d.guided.slice(0,6).map(x=>({i:'✓',d:x.response_date,t:x.metadata?.title||'Guided Recovery',b:(x.selected_choices||[]).join(' • ')||x.optional_reflection||'Saved response'})),
  ...d.journal.slice(0,4).map(x=>({i:'✎',d:x.entry_date,t:x.title||x.prompt_text||'Journal Entry',b:String(x.content||'').slice(0,150)})),
  ...d.tools.slice(0,4).map(x=>({i:'◇',d:String(x.started_at||'').slice(0,10),t:toolLabel(x.tool_slug),b:'Recovery tool used'})),
  ...d.reviews.slice(0,3).map(x=>({i:'↗',d:x.period_end,t:x.review_type==='monthly'?'Monthly Review':'Weekly Review',b:x.next_focus||x.reflection||'Saved review'})),
  ...d.milestones.slice(0,3).map(x=>({i:'◆',d:x.milestone_date,t:x.title||'Milestone',b:x.reflection||'Saved milestone'}))
 ].sort((a,b)=>String(b.d).localeCompare(String(a.d))).slice(0,14);
 set('reviewEvidenceCount',`${rows.length} shown`);
 q('#reviewEvidenceList').innerHTML=rows.length?rows.map(x=>`<div class="review-evidence-row"><span>${x.i}</span><div><b>${esc(x.t)}</b><small>${esc(x.d||'')}</small><p>${esc(x.b||'')}</p></div></div>`).join(''):'<div class="approved-resource-empty"><b>No recent saved activity in this period.</b></div>';
}
async function buildReview(){
 if(!currentUser)return toast('Please sign in first.',true);
 if(!isPlus()){q('#recoveryReviewLock')?.classList.remove('hidden');q('#recoveryReviewContent')?.classList.add('hidden');return}
 q('#recoveryReviewLock')?.classList.add('hidden');q('#recoveryReviewContent')?.classList.remove('hidden');
 const period=Number(q('#recoveryReviewPeriod')?.value||30),d=await collectReview(period),p=patterns(d);currentReview={period,data:d,patterns:p,built_at:new Date().toISOString()};
 set('reviewActiveDays',p.activeDays);set('reviewHeadline',p.activeDays?`${p.activeDays} active ${p.activeDays===1?'day':'days'} in the last ${period} days`:`No saved activity in the last ${period} days`);
 set('reviewLead',p.activeDays?'This summary describes what appeared in your saved Lellee activity. It does not rate your recovery.':'A review becomes more useful as you save activity over time.');
 set('reviewTopSupport',p.supportTop||'Still learning');set('reviewTopSupportText',p.supportTop?`${p.supportTop} appeared repeatedly as something connected with recovery protection.`:'No clear repeated support stood out yet.');
 set('reviewTopChallenge',p.challengeTop||'Still learning');set('reviewTopChallengeText',p.challengeTop?`${p.challengeTop} appeared more than once as something that may deserve care.`:'No clear repeated challenge stood out yet.');
 set('reviewTopTool',p.toolTop||'No tools logged yet');set('reviewTopToolText',p.toolTop?`${p.toolTop} was the most frequently logged tool in this period.`:'Tools you use will appear here over time.');
 set('reviewConsistencyTitle',p.consistency);set('reviewConsistencyText',p.consistencyText);
 set('reviewConnectionTitle',`${d.support.length} support ${d.support.length===1?'person':'people'} • ${d.meetings.length} saved ${d.meetings.length===1?'meeting':'meetings'}`);
 set('reviewConnectionText',d.support.length||d.meetings.length?'Connection is part of your current recovery structure.':'You have not saved support people or meetings yet; that may or may not fit your recovery approach.');
 set('reviewCarryTitle',p.carry);set('reviewCarryText',p.carryText);evidence(d);
}
async function saveReview(){
 if(!currentUser||!currentReview)return toast('Build the review first.',true);
 const p=currentReview.patterns,{error}=await sb.from('recovery_review_snapshots').insert({user_id:currentUser.id,period_days:currentReview.period,period_start:currentReview.data.from,period_end:todayKey(),active_days:p.activeDays,top_support:p.supportTop,top_challenge:p.challengeTop,top_tool:p.toolTop,consistency_label:p.consistency,carry_forward:p.carry,review_payload:currentReview,allow_recovery_story:!!q('#reviewStoryOptIn')?.checked});
 if(error)return toast(error.message,true);toast('Recovery Review saved.');
}
function bind(){
 q('#startPlusMembership')?.addEventListener('click',beginPlus);
 q('#showPlusComparison')?.addEventListener('click',()=>q('#plusComparison')?.classList.remove('hidden'));
 q('#closePlusComparison')?.addEventListener('click',()=>q('#plusComparison')?.classList.add('hidden'));
 q('#buildRecoveryReview')?.addEventListener('click',buildReview);
 q('#saveRecoveryReview')?.addEventListener('click',saveReview);
 q('#printRecoveryReview')?.addEventListener('click',()=>window.print());
}
bind();
const oldShow=showPage;showPage=function(name){oldShow(name);if(name==='plus'){loadPlusSettings();loadMembership()}if(name==='recovery-review'){Promise.all([loadPlusSettings(),loadMembership()]).then(()=>{q('#recoveryReviewLock')?.classList.toggle('hidden',isPlus());q('#recoveryReviewContent')?.classList.toggle('hidden',!isPlus())})}};
let tries=0;const timer=setInterval(()=>{tries++;if(currentUser){clearInterval(timer);Promise.allSettled([loadPlusSettings(),loadMembership()])}else if(tries>30)clearInterval(timer)},200);
})();


/* ===== plus-billing.js ===== */

(()=>{
'use strict';
const q=s=>document.querySelector(s);
const toast=(m,err=false)=>{
  const t=q('#globalToast');
  if(t){t.textContent=m;t.classList.remove('hidden');if(err)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2600)}
  else if(window.showSync)showSync(m);
};
function replaceButton(id,handler){
  const old=q('#'+id);if(!old)return null;
  const fresh=old.cloneNode(true);
  old.replaceWith(fresh);
  fresh.addEventListener('click',handler);
  return fresh;
}
async function invoke(name,body={}){
  const {data,error}=await sb.functions.invoke(name,{body});
  if(error)throw error;
  if(data?.error)throw new Error(data.error);
  return data;
}
async function startCheckout(){
  if(!currentUser)return toast('Please sign in first.',true);
  const plan=q('#plusPlanChoice')?.value||'monthly';
  const btn=q('#startPlusMembership');
  if(btn){btn.disabled=true;btn.textContent='Opening secure checkout…'}
  try{
    const data=await invoke('create-plus-checkout',{plan});
    if(!data?.url)throw new Error('Checkout URL was not returned.');
    location.assign(data.url);
  }catch(e){
    toast(e?.message||'Could not open checkout.',true);
    if(btn){btn.disabled=false;btn.textContent='Start Lellee Plus'}
  }
}
async function manageBilling(){
  if(!currentUser)return toast('Please sign in first.',true);
  const btn=q('#managePlusBilling');
  if(btn){btn.disabled=true;btn.textContent='Opening billing…'}
  try{
    const data=await invoke('create-billing-portal',{});
    if(!data?.url)throw new Error('Billing portal URL was not returned.');
    location.assign(data.url);
  }catch(e){
    toast(e?.message||'Could not open billing management.',true);
    if(btn){btn.disabled=false;btn.textContent='Manage Billing'}
  }
}
async function refreshMembershipUI(){
  if(!currentUser)return;
  try{
    const {data:r}=await sb.from('user_memberships').select('*').eq('user_id',currentUser.id).maybeSingle();
    const active=r?.tier==='plus'&&['active','trialing'].includes(r?.status);
    q('#managePlusBilling')?.classList.toggle('hidden',!r?.provider_customer_id);
    const start=q('#startPlusMembership');
    if(start){
      start.classList.toggle('hidden',active);
      start.disabled=false;
      start.textContent='Start Lellee Plus';
    }
    if(active){
      q('#plusStatusBand')?.classList.add('active');
      if(q('#plusStatusTitle'))q('#plusStatusTitle').textContent='Lellee Plus active';
      if(q('#plusStatusBadge'))q('#plusStatusBadge').textContent='PLUS';
      if(q('#plusStatusText'))q('#plusStatusText').textContent=r.current_period_end
        ? `Your Plus access is active through ${new Date(r.current_period_end).toLocaleDateString()}.`
        : 'Your Plus features are active.';
    }
  }catch(e){}
}
function checkoutReturn(){
  const u=new URL(location.href),state=u.searchParams.get('checkout'),box=q('#plusCheckoutBanner');
  if(!box||!state)return;
  box.classList.remove('hidden','success','cancelled','error');
  if(state==='success'){
    box.classList.add('success');
    box.textContent='Payment completed. Lellee is confirming your Plus membership from Stripe. This normally updates within moments.';
    let tries=0;
    const timer=setInterval(async()=>{
      tries++;await refreshMembershipUI();
      const {data:r}=await sb.from('user_memberships').select('tier,status').eq('user_id',currentUser.id).maybeSingle();
      if(r?.tier==='plus'&&['active','trialing'].includes(r.status)){
        clearInterval(timer);box.textContent='Lellee Plus is active ✓';
      }else if(tries>=10)clearInterval(timer);
    },1500);
  }else if(state==='cancelled'){
    box.classList.add('cancelled');
    box.textContent='Checkout was cancelled. Your free Lellee account is unchanged.';
  }
  u.searchParams.delete('checkout');u.searchParams.delete('session_id');
  history.replaceState({},'',u.pathname+(u.searchParams.toString()?`?${u.searchParams}`:'')+u.hash);
}
replaceButton('startPlusMembership',startCheckout);
replaceButton('managePlusBilling',manageBilling);
let attempts=0;
const wait=setInterval(()=>{
  attempts++;
  if(currentUser){clearInterval(wait);refreshMembershipUI();checkoutReturn()}
  else if(attempts>30)clearInterval(wait);
},200);
})();


/* ===== plus-features.js ===== */

(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,e=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(e)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}else if(window.showSync)showSync(m)};
let plusActive=false, journalEntries=[],collections=[],favoritesOnly=false,selectedEdition='year2';

async function membershipCheck(){
 if(!currentUser){plusActive=false;return false}
 const {data:r}=await sb.from('user_memberships').select('tier,status').eq('user_id',currentUser.id).maybeSingle();
 plusActive=r?.tier==='plus'&&['active','trialing'].includes(r?.status);
 ['journal','reminder','story'].forEach(k=>{
   q(`#${k}PlusLock`)?.classList.toggle('hidden',plusActive);
   q(`#${k}PlusContent`)?.classList.toggle('hidden',!plusActive);
 });
 return plusActive;
}
async function loadCollections(){
 if(!currentUser)return;
 const {data:r}=await sb.from('journal_collections').select('*').eq('user_id',currentUser.id).order('name');
 collections=r||[];
 const s=q('#journalPlusCollectionFilter');if(s){
   s.innerHTML='<option value="">All collections</option>'+collections.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
 }
 q('#journalPlusCollectionCount')&&(q('#journalPlusCollectionCount').textContent=collections.length);
}
async function loadJournalPlus(){
 if(!await membershipCheck())return;
 const range=q('#journalPlusRange')?.value||'all';
 let query=sb.from('journal_entries').select('id,entry_date,title,prompt_text,content').eq('user_id',currentUser.id).order('entry_date',{ascending:false});
 if(range!=='all'){const d=new Date();d.setDate(d.getDate()-Number(range));query=query.gte('entry_date',d.toISOString().slice(0,10))}
 const [{data:e},{data:f},{data:links}]=await Promise.all([
   query,
   sb.from('journal_favorites').select('journal_entry_id').eq('user_id',currentUser.id),
   sb.from('journal_collection_items').select('journal_entry_id,collection_id').eq('user_id',currentUser.id)
 ]);
 journalEntries=e||[];const fav=new Set((f||[]).map(x=>x.journal_entry_id));
 const linkMap={};(links||[]).forEach(x=>{(linkMap[x.journal_entry_id]??=[]).push(x.collection_id)});
 const search=(q('#journalPlusSearch')?.value||'').toLowerCase().trim(),cf=q('#journalPlusCollectionFilter')?.value||'';
 const filtered=journalEntries.filter(x=>{
   if(favoritesOnly&&!fav.has(x.id))return false;
   if(cf&&!(linkMap[x.id]||[]).includes(cf))return false;
   if(search&&!`${x.title||''} ${x.prompt_text||''} ${x.content||''}`.toLowerCase().includes(search))return false;
   return true;
 });
 q('#journalPlusCount')&&(q('#journalPlusCount').textContent=filtered.length);
 q('#journalPlusFavoriteCount')&&(q('#journalPlusFavoriteCount').textContent=fav.size);
 const box=q('#journalPlusList');if(!box)return;
 box.innerHTML=filtered.length?filtered.map(x=>{
   const cols=(linkMap[x.id]||[]).map(id=>collections.find(c=>c.id===id)?.name).filter(Boolean);
   return `<article class="journal-plus-card"><div class="journal-plus-card-head"><div><small>${esc(x.entry_date)}</small><h3>${esc(x.title||x.prompt_text||'Journal Entry')}</h3></div><span>${fav.has(x.id)?'★':'☆'}</span></div><p>${esc(String(x.content||'').slice(0,260))}</p><div>${cols.map(c=>`<span class="collection-pill">${esc(c)}</span>`).join(' ')}</div><div class="journal-plus-card-actions"><button data-favorite-journal="${x.id}">${fav.has(x.id)?'Remove favorite':'Favorite'}</button><button data-collect-journal="${x.id}">Add to collection</button></div></article>`;
 }).join(''):'<div class="approved-resource-empty"><b>No matching journal entries.</b></div>';
 qa('[data-favorite-journal]').forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.favoriteJournal,fav.has(b.dataset.favoriteJournal)));
 qa('[data-collect-journal]').forEach(b=>b.onclick=()=>addToCollection(b.dataset.collectJournal));
}
async function toggleFavorite(id,on){
 if(on)await sb.from('journal_favorites').delete().eq('user_id',currentUser.id).eq('journal_entry_id',id);
 else await sb.from('journal_favorites').insert({user_id:currentUser.id,journal_entry_id:id});
 loadJournalPlus();
}
async function addToCollection(id){
 if(!collections.length)return toast('Create a collection first.',true);
 const name=prompt('Collection name:');if(!name)return;
 const c=collections.find(x=>x.name.toLowerCase()===name.toLowerCase());
 if(!c)return toast('That collection does not exist.',true);
 await sb.from('journal_collection_items').upsert({user_id:currentUser.id,collection_id:c.id,journal_entry_id:id},{onConflict:'user_id,collection_id,journal_entry_id'});
 loadJournalPlus();
}
async function newCollection(){
 const name=prompt('New collection name:');if(!name?.trim())return;
 const {error}=await sb.from('journal_collections').insert({user_id:currentUser.id,name:name.trim()});
 if(error)return toast(error.message,true);
 await loadCollections();loadJournalPlus();toast('Collection created.');
}
const reminderDefaults={
 meeting:['Meeting / Appointment','Recovery support is on your schedule.'],
 support:['Reach Out','A little connection can be enough for today.'],
 journal:['Journal','Take a few minutes to notice what is here.'],
 health:['Health / Routine','Take care of one thing your body or routine needs.'],
 milestone:['Milestone / Review','Your recovery history deserves a moment of reflection.'],
 custom:['Custom reminder','']
};
function openReminder(type){
 const d=reminderDefaults[type]||reminderDefaults.custom;
 q('#reminderEditorTitle').textContent=d[0];q('#reminderPlusTitle').value=d[0];q('#reminderPlusMessage').value=d[1];q('#reminderEditor').classList.remove('hidden');
}
async function loadRemindersPlus(){
 if(!await membershipCheck())return;
 const {data:r}=await sb.from('custom_reminder_sets').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false});
 const rows=r||[];q('#reminderPlusCount')&&(q('#reminderPlusCount').textContent=`${rows.length} saved`);
 const box=q('#reminderPlusList');if(!box)return;
 box.innerHTML=rows.length?rows.map(x=>`<article class="connection-row"><div class="connection-row-icon">◷</div><div><b>${esc(x.title)}</b><small>${esc((x.days_of_week||[]).map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(' • '))}${x.reminder_time?` • ${esc(String(x.reminder_time).slice(0,5))}`:''}</small></div><div class="meta"><button class="approved-link" data-delete-reminder-plus="${x.id}">Delete</button></div></article>`).join(''):'<div class="approved-resource-empty"><b>No custom Reminder+ sets yet.</b></div>';
 qa('[data-delete-reminder-plus]').forEach(b=>b.onclick=async()=>{await sb.from('custom_reminder_sets').delete().eq('user_id',currentUser.id).eq('id',b.dataset.deleteReminderPlus);loadRemindersPlus()});
}
async function saveReminder(){
 const days=[...q('#reminderPlusDays').selectedOptions].map(x=>Number(x.value)),title=q('#reminderPlusTitle').value.trim();
 if(!title||!days.length)return toast('Add a title and at least one day.',true);
 const {error}=await sb.from('custom_reminder_sets').insert({user_id:currentUser.id,title,message:q('#reminderPlusMessage').value.trim()||null,days_of_week:days,reminder_time:q('#reminderPlusTime').value,enabled:true});
 if(error)return toast(error.message,true);
 q('#reminderEditor').classList.add('hidden');loadRemindersPlus();toast('Reminder+ saved.');
}
function renderStoryPreview(){
 const sections=qa('[data-story-section]:checked').map(x=>x.dataset.storySection);
 const labels={year2:'Year 2 Edition',year5:'5-Year Edition',year10:'10-Year Edition'};
 q('#storyEditionPreview').innerHTML=`<span class="approved-kicker">${esc(labels[selectedEdition])}</span><h3>My Recovery Story</h3><p>This edition is prepared from the parts of your Lellee history you choose to include.</p><ul>${sections.map(s=>`<li>${esc(s.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()))}</li>`).join('')}</ul>${q('#storyEditionNote').value.trim()?`<p><em>${esc(q('#storyEditionNote').value.trim())}</em></p>`:''}`;
}
async function loadStoryEditions(){
 if(!await membershipCheck())return;
 renderStoryPreview();
}
async function saveStoryEdition(){
 const sections=qa('[data-story-section]:checked').map(x=>x.dataset.storySection);
 const {error}=await sb.from('recovery_story_editions').insert({user_id:currentUser.id,edition_type:selectedEdition,included_sections:sections,edition_note:q('#storyEditionNote').value.trim()||null,status:'draft'});
 if(error)return toast(error.message,true);toast('Story edition setup saved.');
}
function bind(){
 q('#journalPlusSearch')?.addEventListener('input',loadJournalPlus);q('#journalPlusRange')?.addEventListener('change',loadJournalPlus);q('#journalPlusCollectionFilter')?.addEventListener('change',loadJournalPlus);
 q('#showJournalFavorites')?.addEventListener('click',()=>{favoritesOnly=!favoritesOnly;q('#showJournalFavorites').textContent=favoritesOnly?'Show all':'Favorites only';loadJournalPlus()});
 q('#newJournalCollection')?.addEventListener('click',newCollection);
 qa('[data-reminder-template]').forEach(b=>b.addEventListener('click',()=>openReminder(b.dataset.reminderTemplate)));
 q('#cancelReminderPlus')?.addEventListener('click',()=>q('#reminderEditor').classList.add('hidden'));q('#saveReminderPlus')?.addEventListener('click',saveReminder);
 qa('[data-story-edition]').forEach(b=>b.addEventListener('click',()=>{selectedEdition=b.dataset.storyEdition;qa('[data-story-edition]').forEach(x=>x.classList.toggle('selected',x===b));renderStoryPreview()}));
 qa('[data-story-section]').forEach(x=>x.addEventListener('change',renderStoryPreview));q('#storyEditionNote')?.addEventListener('input',renderStoryPreview);
 q('#saveStoryEdition')?.addEventListener('click',saveStoryEdition);q('#printStoryEdition')?.addEventListener('click',()=>window.print());
}
bind();
const oldShow=showPage;
showPage=function(name){oldShow(name);if(name==='journal-plus'){Promise.all([loadCollections()]).then(loadJournalPlus)}if(name==='reminders-plus')loadRemindersPlus();if(name==='story-editions')loadStoryEditions()};
})();


/* ===== admin-operations.js ===== */

(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,e=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(e)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}else if(window.showSync)showSync(m)};
let isAdmin=false,resources=[],news=[],sponsors=[],editingResource=null,editingNews=null,editingSponsor=null;

async function checkAdmin(){
  if(!currentUser)return false;
  try{
    const {data:r}=await sb.from('admin_user_roles').select('role').eq('user_id',currentUser.id).maybeSingle();
    isAdmin=!!r&&['admin','editor'].includes(r.role);
  }catch(e){isAdmin=false}
  q('#adminNavItem')?.classList.toggle('hidden',!isAdmin);
  q('#adminUnauthorized')?.classList.toggle('hidden',isAdmin);
  q('#adminContent')?.classList.toggle('hidden',!isAdmin);
  if(isAdmin)setText('adminRoleBadge','ADMIN');
  return isAdmin;
}
function setText(id,v){const e=q('#'+id);if(e)e.textContent=v??''}
function open(id){q('#'+id)?.classList.remove('hidden')}
function close(id){q('#'+id)?.classList.add('hidden')}

async function loadAdmin(){
  if(!await checkAdmin())return;
  const [r,n,s,p]=await Promise.all([
    sb.from('local_resources').select('*').order('name'),
    sb.from('recovery_news').select('*').order('published_at',{ascending:false}),
    sb.from('sponsor_accounts').select('*').order('created_at',{ascending:false}),
    sb.from('user_memberships').select('user_id').eq('tier','plus').in('status',['active','trialing'])
  ]);
  resources=r.data||[];news=n.data||[];sponsors=s.data||[];
  setText('adminResourceCount',resources.filter(x=>x.published).length);
  setText('adminSponsoredCount',resources.filter(x=>x.sponsored).length);
  setText('adminNewsCount',news.filter(x=>x.published).length);
  setText('adminPlusCount',(p.data||[]).length);
  renderResources();renderNews();renderSponsors();loadSettings();
}
function renderResources(){
  const search=(q('#adminResourceSearch')?.value||'').toLowerCase(),type=q('#adminResourceType')?.value||'',status=q('#adminResourceStatus')?.value||'';
  const rows=resources.filter(x=>{
    if(search&&!`${x.name||''} ${x.city||''} ${x.state||''}`.toLowerCase().includes(search))return false;
    if(type&&x.resource_type!==type)return false;
    if(status==='published'&&!x.published)return false;
    if(status==='draft'&&x.published)return false;
    if(status==='sponsored'&&!x.sponsored)return false;
    return true;
  });
  q('#adminResourceList').innerHTML=rows.length?rows.map(x=>`<div class="admin-list-row"><div class="admin-list-icon">⌂</div><div><b>${esc(x.name)}</b><small>${esc((x.resource_type||'resource').replaceAll('_',' '))} • ${esc([x.city,x.state].filter(Boolean).join(', '))}${x.sponsored?' • SPONSORED':''}${x.published?' • Published':' • Draft'}</small></div><div class="admin-list-actions"><button data-edit-resource="${x.id}">Edit</button></div></div>`).join(''):'<div class="approved-resource-empty">No matching resources.</div>';
  qa('[data-edit-resource]').forEach(b=>b.onclick=()=>editResource(b.dataset.editResource));
}
function editResource(id){
  const x=resources.find(r=>r.id===id);editingResource=x||null;
  q('#adminResourceEditorTitle').textContent=x?'Edit Resource':'Add Resource';
  const map={arName:x?.name||'',arType:x?.resource_type||'meeting',arCity:x?.city||'',arState:x?.state||'',arPhone:x?.phone||'',arWebsite:x?.website_url||'',arCost:x?.cost_level||'',arVirtual:String(!!x?.virtual_available),arDescription:x?.description||'',arPublished:String(x?.published??true),arSponsored:String(!!x?.sponsored),arSponsorLabel:x?.sponsor_label||'',arVerified:x?.verified_at?String(x.verified_at).slice(0,10):'',arPathways:(x?.pathways||[]).join(', ')};
  Object.entries(map).forEach(([id,v])=>{if(q('#'+id))q('#'+id).value=v});
  q('#adminDeleteResource').classList.toggle('hidden',!x);open('adminResourceEditor');
}
async function saveResource(){
  const payload={name:q('#arName').value.trim(),resource_type:q('#arType').value,city:q('#arCity').value.trim()||null,state:q('#arState').value.trim().toUpperCase()||null,phone:q('#arPhone').value.trim()||null,website_url:q('#arWebsite').value.trim()||null,cost_level:q('#arCost').value||null,virtual_available:q('#arVirtual').value==='true',description:q('#arDescription').value.trim()||null,published:q('#arPublished').value==='true',sponsored:q('#arSponsored').value==='true',sponsor_label:q('#arSponsorLabel').value.trim()||null,verified_at:q('#arVerified').value?new Date(q('#arVerified').value+'T12:00:00').toISOString():null,pathways:q('#arPathways').value.split(',').map(x=>x.trim()).filter(Boolean)};
  if(!payload.name)return toast('Resource name is required.',true);
  const res=editingResource?await sb.from('local_resources').update(payload).eq('id',editingResource.id):await sb.from('local_resources').insert(payload);
  if(res.error)return toast(res.error.message,true);close('adminResourceEditor');await loadAdmin();toast('Resource saved.');
}
async function deleteResource(){if(!editingResource||!confirm('Delete this resource?'))return;const {error}=await sb.from('local_resources').delete().eq('id',editingResource.id);if(error)return toast(error.message,true);close('adminResourceEditor');loadAdmin()}

function renderNews(){
  q('#adminNewsList').innerHTML=news.length?news.map(x=>`<div class="admin-list-row"><div class="admin-list-icon">◇</div><div><b>${esc(x.title)}</b><small>${esc(x.source_name||'No source')} • ${x.published?'Published':'Draft'}</small></div><div class="admin-list-actions"><button data-edit-news="${x.id}">Edit</button></div></div>`).join(''):'<div class="approved-resource-empty">No news items yet.</div>';
  qa('[data-edit-news]').forEach(b=>b.onclick=()=>editNews(b.dataset.editNews));
}
function editNews(id){
  const x=news.find(r=>r.id===id);editingNews=x||null;q('#adminNewsEditorTitle').textContent=x?'Edit News Item':'Add News Item';
  q('#anTitle').value=x?.title||'';q('#anSource').value=x?.source_name||'';q('#anUrl').value=x?.source_url||'';q('#anDate').value=x?.published_at?String(x.published_at).slice(0,10):'';q('#anPublished').value=String(!!x?.published);q('#anSummary').value=x?.summary||'';q('#adminDeleteNews').classList.toggle('hidden',!x);open('adminNewsEditor');
}
async function saveNews(){
  const payload={title:q('#anTitle').value.trim(),source_name:q('#anSource').value.trim()||null,source_url:q('#anUrl').value.trim()||null,published_at:q('#anDate').value?new Date(q('#anDate').value+'T12:00:00').toISOString():null,published:q('#anPublished').value==='true',summary:q('#anSummary').value.trim()||null,reviewed_at:new Date().toISOString()};
  if(!payload.title)return toast('Title is required.',true);const res=editingNews?await sb.from('recovery_news').update(payload).eq('id',editingNews.id):await sb.from('recovery_news').insert(payload);if(res.error)return toast(res.error.message,true);close('adminNewsEditor');loadAdmin();toast('News item saved.');
}
async function deleteNews(){if(!editingNews||!confirm('Delete this news item?'))return;const {error}=await sb.from('recovery_news').delete().eq('id',editingNews.id);if(error)return toast(error.message,true);close('adminNewsEditor');loadAdmin()}

function renderSponsors(){
  q('#adminSponsorList').innerHTML=sponsors.length?sponsors.map(x=>`<div class="admin-list-row"><div class="admin-list-icon">$</div><div><b>${esc(x.organization_name)}</b><small>${esc(x.status)}${x.monthly_amount!=null?` • $${Number(x.monthly_amount).toFixed(2)}/mo`:''}${x.end_date?` • through ${x.end_date}`:''}</small></div><div class="admin-list-actions"><button data-edit-sponsor="${x.id}">Edit</button></div></div>`).join(''):'<div class="approved-resource-empty">No sponsors yet.</div>';
  qa('[data-edit-sponsor]').forEach(b=>b.onclick=()=>editSponsor(b.dataset.editSponsor));
}
function editSponsor(id){
  const x=sponsors.find(r=>r.id===id);editingSponsor=x||null;q('#adminSponsorEditorTitle').textContent=x?'Edit Sponsor':'Add Sponsor';
  q('#asName').value=x?.organization_name||'';q('#asEmail').value=x?.contact_email||'';q('#asStart').value=x?.start_date||'';q('#asEnd').value=x?.end_date||'';q('#asStatus').value=x?.status||'prospect';q('#asAmount').value=x?.monthly_amount??'';q('#asNotes').value=x?.notes||'';q('#adminDeleteSponsor').classList.toggle('hidden',!x);open('adminSponsorEditor');
}
async function saveSponsor(){
  const payload={organization_name:q('#asName').value.trim(),contact_email:q('#asEmail').value.trim()||null,start_date:q('#asStart').value||null,end_date:q('#asEnd').value||null,status:q('#asStatus').value,monthly_amount:q('#asAmount').value?Number(q('#asAmount').value):null,notes:q('#asNotes').value.trim()||null};
  if(!payload.organization_name)return toast('Organization name is required.',true);const res=editingSponsor?await sb.from('sponsor_accounts').update(payload).eq('id',editingSponsor.id):await sb.from('sponsor_accounts').insert(payload);if(res.error)return toast(res.error.message,true);close('adminSponsorEditor');loadAdmin();toast('Sponsor saved.');
}
async function deleteSponsor(){if(!editingSponsor||!confirm('Delete this sponsor record?'))return;const {error}=await sb.from('sponsor_accounts').delete().eq('id',editingSponsor.id);if(error)return toast(error.message,true);close('adminSponsorEditor');loadAdmin()}

async function loadSettings(){
  const {data:r}=await sb.from('app_public_settings').select('key,value').in('key',['plus_monthly_price','plus_annual_price','sponsorship_enabled','recovery_news_enabled']);
  const m=Object.fromEntries((r||[]).map(x=>[x.key,x.value]));
  q('#adminPlusMonthly').value=m.plus_monthly_price||'3.99';q('#adminPlusAnnual').value=m.plus_annual_price||'39.99';q('#adminSponsorshipEnabled').value=m.sponsorship_enabled||'true';q('#adminNewsEnabled').value=m.recovery_news_enabled||'true';
}
async function saveSettings(){
  const rows=[['plus_monthly_price',q('#adminPlusMonthly').value],['plus_annual_price',q('#adminPlusAnnual').value],['sponsorship_enabled',q('#adminSponsorshipEnabled').value],['recovery_news_enabled',q('#adminNewsEnabled').value]].map(([key,value])=>({key,value,updated_at:new Date().toISOString()}));
  const {error}=await sb.from('app_public_settings').upsert(rows,{onConflict:'key'});if(error)return toast(error.message,true);toast('App settings saved.');
}
function setTab(tab){
  qa('[data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));
  q('#adminResourcesPanel').classList.toggle('hidden',tab!=='resources');q('#adminNewsPanel').classList.toggle('hidden',tab!=='news');q('#adminSponsorsPanel').classList.toggle('hidden',tab!=='sponsors');q('#adminSettingsPanel').classList.toggle('hidden',tab!=='settings');
}
function bind(){
  qa('[data-admin-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.adminTab));
  q('#adminResourceSearch')?.addEventListener('input',renderResources);q('#adminResourceType')?.addEventListener('change',renderResources);q('#adminResourceStatus')?.addEventListener('change',renderResources);
  q('#adminNewResource')?.addEventListener('click',()=>editResource(null));q('#adminSaveResource')?.addEventListener('click',saveResource);q('#adminDeleteResource')?.addEventListener('click',deleteResource);
  q('#adminNewNews')?.addEventListener('click',()=>editNews(null));q('#adminSaveNews')?.addEventListener('click',saveNews);q('#adminDeleteNews')?.addEventListener('click',deleteNews);
  q('#adminNewSponsor')?.addEventListener('click',()=>editSponsor(null));q('#adminSaveSponsor')?.addEventListener('click',saveSponsor);q('#adminDeleteSponsor')?.addEventListener('click',deleteSponsor);
  q('#adminSaveSettings')?.addEventListener('click',saveSettings);
  qa('[data-close-admin-editor]').forEach(b=>b.onclick=()=>close(b.dataset.closeAdminEditor));
}
bind();
const oldShow=showPage;showPage=function(name){oldShow(name);if(name==='admin')loadAdmin()};
let tries=0;const timer=setInterval(()=>{tries++;if(currentUser){clearInterval(timer);checkAdmin()}else if(tries>30)clearInterval(timer)},200);
})();



(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const toast=(m,e=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(e)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2400)}else if(window.showSync)showSync(m)};
let step=1,state={intent:null,path:'exploring',belief:'exploring'};

function showStep(n){step=Math.max(1,Math.min(5,n));qa('.onboarding-step').forEach(x=>x.classList.toggle('active',Number(x.dataset.onboardingStep)===step));q('#onboardingBack')?.classList.toggle('hidden',step===1);q('#onboardingNext').textContent=step===5?'Finish Setup':'Continue';q('#onboardingStepLabel').textContent=`STEP ${step} OF 5`;q('#onboardingProgressBar').style.width=`${step*20}%`}
function faithFields(){q('#onboardingFaithFields')?.classList.toggle('hidden',!['faith_based','mixed'].includes(state.belief))}
async function preload(){
 if(!currentUser)return;
 const [p,r,u,l,o]=await Promise.all([sb.from('profiles').select('display_name').eq('id',currentUser.id).maybeSingle(),sb.from('recovery_profiles').select('recovery_date,current_goal').eq('user_id',currentUser.id).maybeSingle(),sb.from('user_preferences').select('recovery_approach,belief_preference,faith_tradition,denomination').eq('user_id',currentUser.id).maybeSingle(),sb.from('local_preferences').select('city,state').eq('user_id',currentUser.id).maybeSingle(),sb.from('onboarding_state').select('*').eq('user_id',currentUser.id).maybeSingle()]);
 q('#onboardingName').value=p.data?.display_name||data?.name||'';q('#onboardingRecoveryDate').value=r.data?.recovery_date||data?.recoveryDate||'';q('#onboardingGoal').value=r.data?.current_goal||data?.goal||'';
 state.path=u.data?.recovery_approach||o.data?.recovery_path||'exploring';state.belief=u.data?.belief_preference||o.data?.belief_preference||'exploring';state.intent=o.data?.primary_intent||null;
 q('#onboardingFaith').value=u.data?.faith_tradition||'';q('#onboardingDenomination').value=u.data?.denomination||'';q('#onboardingCity').value=l.data?.city||data?.city||'';q('#onboardingState').value=l.data?.state||data?.state||'';
 qa('[data-onboarding-path]').forEach(b=>b.classList.toggle('selected',b.dataset.onboardingPath===state.path));qa('[data-onboarding-belief]').forEach(b=>b.classList.toggle('selected',b.dataset.onboardingBelief===state.belief));qa('[data-onboarding-intent]').forEach(b=>b.classList.toggle('selected',b.dataset.onboardingIntent===state.intent));faithFields();
}
async function check(force=false){if(!currentUser)return;try{const {data:o}=await sb.from('onboarding_state').select('completed').eq('user_id',currentUser.id).maybeSingle();if(force||o?.completed===false){await preload();showStep(1);q('#finalOnboardingOverlay')?.classList.remove('hidden')}}catch(e){}}
async function saveSetup(){
 const name=q('#onboardingName').value.trim(),recoveryDate=q('#onboardingRecoveryDate').value,goal=q('#onboardingGoal').value.trim()||null,faith=q('#onboardingFaith').value||null,den=q('#onboardingDenomination').value.trim()||null,city=q('#onboardingCity').value.trim()||null,st=q('#onboardingState').value.trim().toUpperCase()||null;
 if(!name)return toast('Add the name you want Lellee to use.',true);if(!recoveryDate)return toast('Choose a recovery date or use today.',true);
 const rs=await Promise.all([
  sb.from('profiles').update({display_name:name}).eq('id',currentUser.id),
  sb.from('recovery_profiles').update({recovery_date:recoveryDate,current_goal:goal}).eq('user_id',currentUser.id),
  sb.from('user_preferences').update({recovery_approach:state.path,belief_preference:state.belief,faith_tradition:faith,denomination:den,show_faith_content:['faith_based','mixed'].includes(state.belief),show_spiritual_content:['spiritual','faith_based','mixed'].includes(state.belief)}).eq('user_id',currentUser.id),
  sb.from('local_preferences').update({city,state:st}).eq('user_id',currentUser.id),
  sb.from('onboarding_state').upsert({user_id:currentUser.id,completed:true,completed_at:new Date().toISOString(),primary_intent:state.intent,recovery_path:state.path,belief_preference:state.belief},{onConflict:'user_id'})
 ]);
 const err=rs.find(x=>x.error)?.error;if(err)return toast(err.message,true);
 try{await sb.from('recovery_path_preferences').upsert({user_id:currentUser.id,primary_path:state.path},{onConflict:'user_id'})}catch(e){}
 data.name=name;data.recoveryDate=recoveryDate;data.goal=goal||'';data.city=city||'';data.state=st||'';data.faith=faith||'';data.denomination=den||'';if(typeof save==='function')save();if(typeof renderBasics==='function')renderBasics();q('#finalOnboardingOverlay')?.classList.add('hidden');showPage('today');toast('Your Lellee setup is ready.');
}
function next(){if(step===1&&!q('#onboardingName').value.trim())return toast('Add the name you want Lellee to use.',true);if(step===2&&!q('#onboardingRecoveryDate').value)return toast('Choose a recovery date or use today.',true);if(step<5)showStep(step+1);else saveSetup()}
async function later(){if(!currentUser)return;await sb.from('onboarding_state').upsert({user_id:currentUser.id,completed:false,last_skipped_at:new Date().toISOString()},{onConflict:'user_id'});q('#finalOnboardingOverlay')?.classList.add('hidden');toast('You can finish setup later from Settings.')}
async function polishAccess(){
 if(!currentUser)return;
 let billing=false,plus=false;
 try{const {data:r}=await sb.from('app_public_settings').select('value').eq('key','billing_enabled').maybeSingle();billing=r?.value==='true'}catch(e){}
 try{const {data:m}=await sb.from('user_memberships').select('tier,status').eq('user_id',currentUser.id).maybeSingle();plus=m?.tier==='plus'&&['active','trialing'].includes(m?.status)}catch(e){}
 const plusPages=new Set(['journal-plus','reminders-plus','story-editions','recovery-review']);
 qa('[data-page]').forEach(el=>{if(!plusPages.has(el.dataset.page)||plus||el.querySelector('.final-plus-badge'))return;const b=document.createElement('span');b.className='final-plus-badge';b.textContent='PLUS';el.appendChild(b)});
 if(!billing){const old=q('#startPlusMembership');if(old){const fresh=old.cloneNode(true);old.replaceWith(fresh);fresh.textContent='Plus billing coming at launch';fresh.classList.add('final-billing-disabled');fresh.addEventListener('click',()=>toast('Lellee Plus is built. Secure Stripe checkout will be connected during final launch setup.'))}}
}
function bind(){q('#onboardingBack')?.addEventListener('click',()=>showStep(step-1));q('#onboardingNext')?.addEventListener('click',next);q('#onboardingSkip')?.addEventListener('click',later);q('#onboardingUseToday')?.addEventListener('click',()=>q('#onboardingRecoveryDate').value=new Date().toISOString().slice(0,10));qa('[data-onboarding-intent]').forEach(b=>b.addEventListener('click',()=>{state.intent=b.dataset.onboardingIntent;qa('[data-onboarding-intent]').forEach(x=>x.classList.toggle('selected',x===b))}));qa('[data-onboarding-path]').forEach(b=>b.addEventListener('click',()=>{state.path=b.dataset.onboardingPath;qa('[data-onboarding-path]').forEach(x=>x.classList.toggle('selected',x===b))}));qa('[data-onboarding-belief]').forEach(b=>b.addEventListener('click',()=>{state.belief=b.dataset.onboardingBelief;qa('[data-onboarding-belief]').forEach(x=>x.classList.toggle('selected',x===b));faithFields()}));q('#redoOnboarding')?.addEventListener('click',()=>check(true))}
window.LelleeFinalOnboarding={check};bind();let tries=0;const timer=setInterval(()=>{tries++;if(currentUser){clearInterval(timer);check();polishAccess()}else if(tries>40)clearInterval(timer)},200);
})();
