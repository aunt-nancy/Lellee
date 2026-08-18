(()=>{
'use strict';
if(window.__lelleeApprovedProgressRuntime)return;
window.__lelleeApprovedProgressRuntime=true;

const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const set=(id,v)=>{const e=q('#'+id);if(e)e.textContent=v??''};
let historyFilter='all';

// Restored from the previously approved Connections + Progress build.
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

function rday(){
  try{return Math.max(1,Number(daysInRecovery())||1)}catch(_){
    const n=Number(q('[data-recovery-day]')?.textContent||1);return Math.max(1,n||1);
  }
}
function phase(){const d=rday();return PHASES.find(x=>d>=x.start&&d<=x.end)||PHASES[PHASES.length-1]}
function phasePct(){const d=rday(),p=phase();return p.key==='long_term'?100:Math.max(0,Math.min(100,((d-p.start+1)/(p.end-p.start+1))*100))}
function uid(){
  try{return currentUser?.id||window.LelleeAuthContext?.getCurrentUser?.()?.id||null}catch(_){return window.LelleeAuthContext?.getCurrentUser?.()?.id||null}
}
function client(){
  try{return sb||window.LelleeAuthContext?.getClient?.()||null}catch(_){return window.LelleeAuthContext?.getClient?.()||null}
}
async function rows(table,columns='*',configure){
  const db=client(),userId=uid();
  if(!db||!userId)return [];
  try{
    let query=db.from(table).select(columns).eq('user_id',userId);
    if(configure)query=configure(query);
    const {data,error}=await query;
    if(error){console.warn('[Lellee Progress]',table,error.message||error);return []}
    return data||[];
  }catch(error){console.warn('[Lellee Progress]',table,error);return []}
}

async function renderProgress(){
  const d=rday(),p=phase(),pct=phasePct();
  // Phase/day are deterministic and should render even if a secondary data query fails.
  set('progressPhaseKicker',`CURRENT PHASE · DAY ${d}`);
  set('progressPhaseTitle',p.name);
  set('progressPhaseDescription',p.desc);
  set('progressLivePercent',p.key==='long_term'?'Long-term weekly guidance':`${Math.round(pct)}% through ${p.name}`);
  const bar=q('#progressLiveBar');if(bar)bar.style.width=pct+'%';
  qa('[data-recovery-day]').forEach(x=>x.textContent=d);

  if(!uid()||!client())return;
  const start=new Date();start.setDate(1);start.setHours(0,0,0,0);
  const monthStart=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-01`;

  const [g,j,s,m,t,rw,ms,gm,jm]=await Promise.all([
    rows('guided_responses','response_date'),
    rows('journal_entries','id,entry_date'),
    rows('support_contacts','id'),
    rows('saved_meetings','id'),
    rows('tool_use_log','id,started_at'),
    rows('periodic_reviews','id,period_end'),
    rows('milestone_reviews','id,milestone_date'),
    rows('guided_responses','response_date',x=>x.gte('response_date',monthStart)),
    rows('journal_entries','entry_date',x=>x.gte('entry_date',monthStart))
  ]);

  const guidedDays=new Set(g.map(x=>x.response_date).filter(Boolean)).size;
  set('progressGuidedDays',guidedDays);
  set('progressJournalEntries',j.length);
  set('progressSupportPeople',s.length);
  set('progressMeetings',m.length);
  set('progressToolsUsed',t.length);
  set('progressReviews',rw.length+ms.length);

  const monthGuided=new Set(gm.map(x=>x.response_date).filter(Boolean)).size;
  const monthJournal=jm.length;
  set('progressMonthHeadline',monthGuided||monthJournal?`${monthGuided} guided days · ${monthJournal} journal entries`:'Your month is taking shape');
  set('progressMonthText',monthGuided||monthJournal?'This is a record of activity, not a score. Use it to notice what you are returning to consistently.':'As you save guided recovery and journal entries, this monthly view will update.');
}

function timelineDate(x){
  if(!x)return'';const d=new Date(`${x}T12:00:00`);
  return isNaN(d)?x:d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}
async function loadHistory(){
  const userId=uid(),db=client();if(!userId||!db)return;
  const range=q('#historyRange')?.value||'90';
  let from=null;if(range!=='all'){const d=new Date();d.setDate(d.getDate()-Number(range));from=d.toISOString().slice(0,10)}

  const [guided,journal,reviews,milestones]=await Promise.all([
    rows('guided_responses','id,response_date,recovery_day,prompt_text,selected_choices,optional_reflection,metadata',x=>x.order('response_date',{ascending:false}).limit(250)),
    rows('journal_entries','id,entry_date,title,prompt_text,content',x=>x.order('entry_date',{ascending:false}).limit(250)),
    rows('periodic_reviews','id,review_type,period_end,reflection,next_focus',x=>x.order('period_end',{ascending:false}).limit(100)),
    rows('milestone_reviews','id,milestone_date,title,reflection,milestone_key',x=>x.order('milestone_date',{ascending:false}).limit(100))
  ]);

  let g=guided,j=journal,r=reviews,m=milestones;
  if(from){g=g.filter(x=>x.response_date>=from);j=j.filter(x=>x.entry_date>=from);r=r.filter(x=>x.period_end>=from);m=m.filter(x=>x.milestone_date>=from)}
  set('historyGuidedCount',g.length);set('historyJournalCount',j.length);set('historyReviewCount',r.length);set('historyMilestoneCount',m.length);

  const items=[
    ...g.map(x=>({type:'guided',date:x.response_date,title:x.metadata?.title||x.prompt_text||'Guided recovery',body:(x.selected_choices||[]).join(' · ')||x.optional_reflection||'Saved guided response',icon:'✓'})),
    ...j.map(x=>({type:'journal',date:x.entry_date,title:x.title||x.prompt_text||'Journal entry',body:String(x.content||'').slice(0,220),icon:'✎'})),
    ...r.map(x=>({type:'review',date:x.period_end,title:x.review_type==='monthly'?'Monthly Review':'Weekly Review',body:x.reflection||x.next_focus||'Saved recovery review',icon:'↗'})),
    ...m.map(x=>({type:'milestone',date:x.milestone_date,title:x.title||'Milestone',body:x.reflection||'Saved milestone review',icon:'◆'}))
  ].filter(x=>historyFilter==='all'||x.type===historyFilter).sort((a,b)=>String(b.date).localeCompare(String(a.date)));

  const box=q('#historyTimeline');if(!box)return;
  box.innerHTML=items.length?items.map(x=>`<article class="history-item"><div class="history-dot">${x.icon}</div><div><small>${esc(x.type)} · ${esc(timelineDate(x.date))}</small><h3>${esc(x.title)}</h3><p>${esc(x.body||'')}</p></div></article>`).join(''):'<div class="approved-resource-empty"><b>No history in this view yet.</b><small>Try another filter or time range.</small></div>';
}

function bindHistory(){
  qa('[data-history-filter]').forEach(b=>{
    if(b.dataset.progressBound)return;b.dataset.progressBound='1';
    b.addEventListener('click',()=>{historyFilter=b.dataset.historyFilter;qa('[data-history-filter]').forEach(x=>x.classList.toggle('active',x===b));loadHistory()});
  });
  const range=q('#historyRange');if(range&&!range.dataset.progressBound){range.dataset.progressBound='1';range.addEventListener('change',loadHistory)}
}

function installPageHook(){
  if(typeof showPage!=='function')return false;
  if(showPage.__lelleeProgressHook)return true;
  const previous=showPage;
  const wrapped=function(name,...rest){
    const result=previous(name,...rest);
    if(name==='progress')queueMicrotask(()=>renderProgress());
    if(name==='history')queueMicrotask(()=>{bindHistory();loadHistory()});
    return result;
  };
  wrapped.__lelleeProgressHook=true;
  showPage=wrapped;
  return true;
}

bindHistory();
installPageHook();
// Also catch navigation even if another later module wraps/replaces showPage.
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-page]');if(!button)return;
  if(button.dataset.page==='progress')setTimeout(renderProgress,0);
  if(button.dataset.page==='history')setTimeout(()=>{bindHistory();loadHistory()},0);
},false);

let attempts=0;
const ready=setInterval(()=>{
  attempts++;
  installPageHook();
  if(uid()){
    clearInterval(ready);
    renderProgress();
    bindHistory();
  }else if(attempts>50)clearInterval(ready);
},200);

window.addEventListener('lellee:session-ready',()=>{setTimeout(renderProgress,0);bindHistory()});
})();
