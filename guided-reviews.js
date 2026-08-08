
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
