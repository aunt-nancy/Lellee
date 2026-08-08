
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
