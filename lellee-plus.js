
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
