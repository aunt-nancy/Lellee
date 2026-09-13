(()=>{
'use strict';
const VERSION='2026-09-13-journey-plan-limits-v2';
const $=s=>document.querySelector(s);
const db=()=>window.LelleeAuthContext?.client||null;
let last=null,busy=false;

function addStyle(){
  if($('#journeyPlanLimitStyle'))return;
  const s=document.createElement('style');
  s.id='journeyPlanLimitStyle';
  s.textContent=`
#journeyPlanLimitSummary{display:flex;justify-content:space-between;gap:14px;align-items:center;border:1px solid #ddd3e7;background:linear-gradient(135deg,#faf7fc,#fff);border-radius:12px;padding:13px 14px;margin:0 0 12px;color:#51475a}
#journeyPlanLimitSummary .jpl-copy{min-width:0}.jpl-kicker{display:block;font-size:.56rem;font-weight:900;letter-spacing:.07em;color:#745091;text-transform:uppercase;margin-bottom:3px}.jpl-title{display:block;font-size:.74rem;color:#352c40}.jpl-detail{display:block;margin-top:3px;font-size:.6rem;line-height:1.45;color:#706777}.jpl-meter{flex:0 0 auto;border:1px solid #d8cae3;background:#f5eff9;color:#5b2fa0;border-radius:999px;padding:7px 10px;font-size:.61rem;font-weight:900;white-space:nowrap}#journeyPlanLimitSummary.at-limit{border-color:#e1d2b9;background:#fffaf2}#journeyPlanLimitSummary.over-limit{border-color:#ead0d5;background:#fff8f9}@media(max-width:640px){#journeyPlanLimitSummary{align-items:stretch;flex-direction:column}.jpl-meter{text-align:center}}
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

function patchHub(s){
  const wrap=$('#programSwitcherList');if(!wrap||!s)return false;
  addStyle();
  const active=Array.isArray(s.active_journeys)?s.active_journeys:[];
  const total=Number.isFinite(Number(s.total_active_journey_count))?Number(s.total_active_journey_count):active.length;

  // Access cards are owned by the My Journeys runtime. The plan display must never
  // remove a journey card because controlled-beta/admin access can be valid without
  // consuming a commercial plan slot.
  const existingActive=[...wrap.querySelectorAll('.mj-summary')].find(x=>x.id!=='journeyPlanLimitSummary');
  if(existingActive)existingActive.innerHTML=`<b>${total} active journey${total===1?'':'s'} on this account.</b> You can move between them freely. Opening a journey changes what you are viewing; it does not pause your other active journeys.`;

  let box=$('#journeyPlanLimitSummary');
  if(!box){box=document.createElement('div');box.id='journeyPlanLimitSummary';wrap.insertBefore(box,wrap.firstChild)}
  box.className=s.over_limit?'over-limit':s.at_limit?'at-limit':'';
  const count=Number(s.active_journey_count||0),limit=Number(s.active_journey_limit||1);
  box.innerHTML=`<div class="jpl-copy"><span class="jpl-kicker">${String(s.plan_label||'Lellee').replace(/[&<>"']/g,'')}</span><b class="jpl-title">Plan journey usage</b><small class="jpl-detail">${planMessage(s)}</small></div><span class="jpl-meter">${count} of ${limit} active journey${limit===1?'':'s'}</span>`;
  return true;
}

async function refresh(){
  if(busy)return;busy=true;
  try{const s=await fetchSummary();if(s){patchHub(s);setTimeout(()=>patchHub(s),250);setTimeout(()=>patchHub(s),900)}}finally{busy=false}
}

document.addEventListener('lellee:pagechange',e=>{if(e.detail?.page==='program-switcher')setTimeout(refresh,80)});
document.addEventListener('click',e=>{if(e.target.closest('[data-page="program-switcher"]'))setTimeout(refresh,160)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,1200),{once:true});else setTimeout(refresh,1200);

window.LelleeJourneyPlanLimits=Object.freeze({version:VERSION,refresh,summary:()=>last});
})();