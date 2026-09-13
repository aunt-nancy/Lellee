(()=>{
'use strict';
const VERSION='2026-09-13-journey-activity-controls-v3';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const db=()=>window.LelleeAuthContext?.client||null;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
let last=null,busy=false,actionBusy=false;

function addStyle(){
  if($('#journeyPlanLimitStyle'))return;
  const s=document.createElement('style');
  s.id='journeyPlanLimitStyle';
  s.textContent=`
#journeyPlanLimitSummary{display:flex;justify-content:space-between;gap:14px;align-items:center;border:1px solid #ddd3e7;background:linear-gradient(135deg,#faf7fc,#fff);border-radius:12px;padding:13px 14px;margin:0 0 12px;color:#51475a}
#journeyPlanLimitSummary .jpl-copy{min-width:0}.jpl-kicker{display:block;font-size:.56rem;font-weight:900;letter-spacing:.07em;color:#745091;text-transform:uppercase;margin-bottom:3px}.jpl-title{display:block;font-size:.74rem;color:#352c40}.jpl-detail{display:block;margin-top:3px;font-size:.6rem;line-height:1.45;color:#706777}.jpl-meter{flex:0 0 auto;border:1px solid #d8cae3;background:#f5eff9;color:#5b2fa0;border-radius:999px;padding:7px 10px;font-size:.61rem;font-weight:900;white-space:nowrap}#journeyPlanLimitSummary.at-limit{border-color:#e1d2b9;background:#fffaf2}#journeyPlanLimitSummary.over-limit{border-color:#ead0d5;background:#fff8f9}
.jpl-card-manage{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid #eee8f1;padding-top:9px;margin-top:1px;font-size:.57rem;line-height:1.4;color:#706777}.jpl-card-manage b{color:#51475a}.jpl-toggle{border:1px solid #cdbbdc;background:#fff;color:#5b2fa0;border-radius:8px;padding:7px 9px;font:inherit;font-size:.58rem;font-weight:850;cursor:pointer;white-space:nowrap}.jpl-toggle:hover{background:#f7f1fa}.jpl-toggle:focus-visible{outline:3px solid #8a65ad;outline-offset:2px}.jpl-toggle:disabled{opacity:.55;cursor:wait}.jpl-beta-note{display:inline-flex;align-items:center;gap:5px;border:1px solid #d8cae3;background:#f8f3fb;color:#624080;border-radius:999px;padding:5px 7px;font-weight:850;white-space:nowrap}
#journeyInactiveSection{margin-top:18px;border-top:1px solid #e7e0ea;padding-top:15px}#journeyInactiveSection h3{margin:0 0 4px;font-size:.78rem;color:#40344c}#journeyInactiveSection>p{margin:0 0 11px;font-size:.61rem;line-height:1.5;color:#706777}.jpl-inactive-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.jpl-inactive-card{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e7e1e9;border-radius:11px;background:#fcfbfd;padding:12px}.jpl-inactive-card h4{margin:0 0 3px;font-size:.7rem;color:#44394d}.jpl-inactive-card p{margin:0;font-size:.58rem;line-height:1.4;color:#756d79}.jpl-inactive-card .jpl-state{display:inline-block;margin-bottom:4px;font-size:.52rem;font-weight:900;letter-spacing:.05em;color:#74677d;text-transform:uppercase}
#journeyPlanLimitMessage{margin:10px 0 0;padding:9px 11px;border:1px solid #ddd3e7;background:#faf7fc;border-radius:9px;font-size:.6rem;line-height:1.45;color:#51475a}#journeyPlanLimitMessage:empty{display:none}#journeyPlanLimitMessage.jpl-error{border-color:#e3c9ce;background:#fff8f9}
@media(max-width:640px){#journeyPlanLimitSummary{align-items:stretch;flex-direction:column}.jpl-meter{text-align:center}.jpl-card-manage,.jpl-inactive-card{align-items:stretch;flex-direction:column}.jpl-toggle{width:100%}.jpl-inactive-grid{grid-template-columns:1fr}.jpl-beta-note{align-self:flex-start}}
`;
  document.head.appendChild(s);
}

async function fetchSummary(){
  const c=db();if(!c)return null;
  try{const {data,error}=await c.rpc('get_my_journey_access_summary');if(error)throw error;last=data||null;return last}catch(e){console.warn('Journey plan limit summary unavailable',e);return null}
}

function betaNote(s){
  const n=Number(s.beta_exempt_count||0);
  if(!n)return '';
  return ` ${n} controlled-beta journey${n===1?'':'s'} ${n===1?'does':'do'} not use a plan slot while testing.`;
}

function planMessage(s){
  const limit=Number(s.active_journey_limit||1),left=Number(s.remaining_slots||0),extra=betaNote(s);
  if(s.over_limit)return `Your plan includes ${limit} active journey${limit===1?'':'s'}. Your existing journey work stays saved. Make a journey inactive before starting another.${extra}`;
  if(s.at_limit)return `You are using all ${limit} active journey slot${limit===1?'':'s'}. Existing journeys remain available. To start another, make one journey inactive or upgrade your plan.${extra}`;
  return `${left} active journey slot${left===1?'':'s'} available. Opening one journey never pauses your other active journeys.${extra}`;
}

function message(text='',isError=false){
  let m=$('#journeyPlanLimitMessage');
  const wrap=$('#programSwitcherList');
  if(!m&&wrap){m=document.createElement('div');m.id='journeyPlanLimitMessage';m.setAttribute('role','status');m.setAttribute('aria-live','polite');const summary=$('#journeyPlanLimitSummary');summary?.insertAdjacentElement('afterend',m)}
  if(m){m.textContent=text;m.classList.toggle('jpl-error',!!isError)}
}

function controlsReady(s){return s?.journey_activity_controls===true}

function decorateActiveCards(s){
  $$('.jpl-card-manage').forEach(x=>x.remove());
  if(!controlsReady(s))return;
  const active=Array.isArray(s.active_journeys)?s.active_journeys:[];
  const bySlug=new Map(active.map(x=>[x.slug,x]));
  $$('.mj-card').forEach(card=>{
    const slug=card.querySelector('[data-mj-open]')?.dataset?.mjOpen;
    const row=bySlug.get(slug);if(!row)return;
    const manage=document.createElement('div');manage.className='jpl-card-manage';
    if(row.access_type==='controlled_beta'){
      manage.innerHTML='<span><b>Controlled beta</b><br>This test journey does not use one of your plan slots.</span><span class="jpl-beta-note">Beta access · no plan slot</span>';
    }else if(row.can_make_inactive){
      manage.innerHTML=`<span><b>Keep your work, free the slot.</b><br>Making this journey inactive keeps its setup, goals, progress and history saved.</span><button type="button" class="jpl-toggle" data-jpl-toggle="inactive" data-program-id="${esc(row.program_id)}" data-program-name="${esc(row.name)}">Make Inactive</button>`;
    }
    if(manage.childNodes.length)card.appendChild(manage);
  });
}

function renderInactive(s){
  $('#journeyInactiveSection')?.remove();
  if(!controlsReady(s))return;
  const rows=Array.isArray(s.inactive_journeys)?s.inactive_journeys:[];
  if(!rows.length)return;
  const wrap=$('#programSwitcherList');if(!wrap)return;
  const section=document.createElement('section');section.id='journeyInactiveSection';section.setAttribute('aria-label','Inactive journeys');
  section.innerHTML=`<h3>Inactive journeys</h3><p>Your work is still saved. Make a journey active again when you have an available plan slot.</p><div class="jpl-inactive-grid">${rows.map(row=>`<article class="jpl-inactive-card"><div><span class="jpl-state">Inactive</span><h4>${esc(row.name)}</h4><p>Setup, goals, progress and history remain saved.</p></div><button type="button" class="jpl-toggle" data-jpl-toggle="active" data-program-id="${esc(row.program_id)}" data-program-name="${esc(row.name)}">Make Active</button></article>`).join('')}</div>`;
  wrap.appendChild(section);
}

function patchHub(s){
  const wrap=$('#programSwitcherList');if(!wrap||!s)return false;
  addStyle();
  const active=Array.isArray(s.active_journeys)?s.active_journeys:[];
  const total=Number.isFinite(Number(s.total_active_journey_count))?Number(s.total_active_journey_count):active.length;

  // Access cards are owned by the My Journeys runtime. The plan layer augments
  // them but never removes a card, because beta/admin access can be valid without
  // consuming a commercial plan slot.
  const existingActive=[...wrap.querySelectorAll('.mj-summary')].find(x=>x.id!=='journeyPlanLimitSummary');
  if(existingActive)existingActive.innerHTML=`<b>${total} active journey${total===1?'':'s'} on this account.</b> You can move between them freely. Opening a journey changes what you are viewing; it does not pause your other active journeys.`;

  let box=$('#journeyPlanLimitSummary');
  if(!box){box=document.createElement('div');box.id='journeyPlanLimitSummary';wrap.insertBefore(box,wrap.firstChild)}
  box.className=s.over_limit?'over-limit':s.at_limit?'at-limit':'';
  const count=Number(s.active_journey_count||0),limit=Number(s.active_journey_limit||1);
  box.innerHTML=`<div class="jpl-copy"><span class="jpl-kicker">${esc(s.plan_label||'Lellee')}</span><b class="jpl-title">Plan journey usage</b><small class="jpl-detail">${planMessage(s)}</small></div><span class="jpl-meter">${count} of ${limit} active journey${limit===1?'':'s'}</span>`;
  decorateActiveCards(s);renderInactive(s);
  return true;
}

function actionErrorText(reason,s){
  const limit=Number(s?.active_journey_limit||last?.active_journey_limit||1);
  if(reason==='plan_limit_reached')return `Your plan includes ${limit} active journey${limit===1?'':'s'}. Make another journey inactive or upgrade before activating this one.`;
  if(reason==='controlled_beta_managed')return 'Controlled-beta access is managed separately and does not use a plan slot.';
  if(reason==='not_enrolled')return 'This journey has not been started on your account yet.';
  if(reason==='status_not_reactivatable'||reason==='status_not_deactivatable')return 'This journey cannot be changed from its current account status.';
  if(reason==='sign_in_required')return 'Please sign in again to manage your journeys.';
  return 'Lellee could not change that journey right now. Please try again.';
}

async function setJourneyActivity(programId,makeActive,name,button){
  if(actionBusy)return;
  const c=db();if(!c){message('Please sign in again to manage your journeys.',true);return}
  if(!makeActive){
    const ok=window.confirm(`Make ${name||'this journey'} inactive?\n\nYour setup, goals, progress and history will stay saved. This only frees an active-journey slot.`);
    if(!ok)return;
  }
  actionBusy=true;if(button)button.disabled=true;message(makeActive?'Making journey active…':'Making journey inactive…');
  try{
    const {data,error}=await c.rpc('set_my_journey_active',{p_program_id:programId,p_active:makeActive});
    if(error)throw error;
    if(!data?.success){message(actionErrorText(data?.reason,data?.summary),true);return}
    const changed=!!data.changed;
    message(changed?(makeActive?`${name||'Journey'} is active again.`:`${name||'Journey'} is now inactive. Your saved work was kept.`):(makeActive?'This journey is already active.':'This journey is already inactive.'));
    last=data.summary||await fetchSummary();
    await window.LelleeMyJourneys?.reload?.();
    scheduleRefresh();
  }catch(e){
    console.warn('Journey activity change failed',e);
    // Older production databases do not expose this RPC. The UI is normally hidden
    // until the backend advertises journey_activity_controls=true, but fail closed.
    message('Journey activity controls are not available yet. No journey data was changed.',true);
  }finally{actionBusy=false;if(button)button.disabled=false}
}

function scheduleRefresh(){
  [60,260,650,1150,1650].forEach(ms=>setTimeout(async()=>{
    if(ms===60){const s=await fetchSummary();if(s)patchHub(s)}else if(last)patchHub(last);
  },ms));
}

async function refresh(){
  if(busy)return;busy=true;
  try{const s=await fetchSummary();if(s){patchHub(s);[250,700,1300,1800].forEach(ms=>setTimeout(()=>last&&patchHub(last),ms))}}finally{busy=false}
}

document.addEventListener('lellee:pagechange',e=>{if(e.detail?.page==='program-switcher')setTimeout(refresh,80)});
document.addEventListener('click',e=>{
  const toggle=e.target.closest('[data-jpl-toggle]');
  if(toggle){e.preventDefault();setJourneyActivity(toggle.dataset.programId,toggle.dataset.jplToggle==='active',toggle.dataset.programName,toggle);return}
  if(e.target.closest('[data-page="program-switcher"]'))setTimeout(refresh,160);
},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,1200),{once:true});else setTimeout(refresh,1200);

window.LelleeJourneyPlanLimits=Object.freeze({version:VERSION,refresh,summary:()=>last});
})();
