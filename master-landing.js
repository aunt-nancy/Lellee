(() => {
  const SUPABASE_URL='https://hkrrxscyhtxmbvxevfkw.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_QPwVWU-qNnc3GJb_FoFnlQ_kEHa3dtU';
  const sb=window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);

  const fallbackTopics=[
    {topic_key:'caregiving',label:'Caregiving',description:'Support yourself while caring for a parent, partner or loved one.',icon_key:'heart',availability:'guided_exploration'},
    {topic_key:'housing-stability',label:'Housing Stability',description:'Get organized around housing, stability and the next practical step.',icon_key:'home',availability:'guided_exploration'},
    {topic_key:'reentry',label:'Returning Home',description:'Rebuild after jail, prison, probation or another justice-system transition.',icon_key:'door',availability:'guided_exploration'},
    {topic_key:'workforce-reentry',label:'Returning to Work',description:'Move toward work, routine, confidence and income.',icon_key:'briefcase',availability:'guided_exploration'},
    {topic_key:'recovery',label:'Recovery',description:'Build stability and support around alcohol or substance use.',icon_key:'leaf',availability:'available'},
    {topic_key:'grief',label:'Life After Loss',description:'Find your footing after a death, major loss or painful life change.',icon_key:'heart',availability:'guided_exploration'},
    {topic_key:'independent-living',label:'Building Independence',description:'Build routines, daily skills, confidence and greater independence.',icon_key:'spark',availability:'guided_exploration'},
    {topic_key:'family-recovery',label:'Family Support',description:'Support a loved one and strengthen family stability.',icon_key:'people',availability:'guided_exploration'}
  ];
  const icons={home:'⌂',heart:'♡',door:'↗',briefcase:'▣',leaf:'⌁',spark:'✦',people:'◎',default:'✦'};
  let topics=fallbackTopics;
  let survey={sessionId:null,token:null,selected:new Set(),priority:null,supportStyle:null,result:null};
  const dialog=document.getElementById('journeyDialog');
  const topicGrid=document.getElementById('topicGrid');
  const surveyError=document.getElementById('surveyError');

  const esc=(s='')=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const icon=t=>icons[t.icon_key]||icons[t.topic_key]||icons.default;
  const availabilityText=t=>t.availability==='available'?'Explore now':t.availability==='coming_soon'?'Explore this need':'Start here';

  function renderTopics(){
    topicGrid.innerHTML='';
    topics.slice(0,6).forEach((t,i)=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className=`support-card tone-${i%6}`;
      btn.innerHTML=`<span class="support-icon">${icon(t)}</span><h3>${esc(t.label)}</h3><p>${esc(t.description||'')}</p><span class="card-action">${availabilityText(t)}</span>`;
      btn.addEventListener('click',()=>openSurveyWithTopic(t.topic_key));
      topicGrid.appendChild(btn);
    });
  }
  async function loadTopics(){
    if(!sb){renderTopics();return}
    try{
      const {data,error}=await sb.rpc('get_public_support_topics');
      if(error) throw error;
      if(Array.isArray(data)&&data.length) topics=data;
    }catch(e){console.warn('Using approved Lellee topic fallback.',e?.message||e)}
    renderTopics();
  }

  document.getElementById('menuToggle')?.addEventListener('click',e=>{
    const nav=document.getElementById('siteNav');
    nav.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded',nav.classList.contains('open')?'true':'false');
  });
  document.querySelectorAll('[data-start-survey]').forEach(el=>el.addEventListener('click',()=>openSurvey()));
  document.getElementById('surveyClose')?.addEventListener('click',()=>dialog.close());
  document.getElementById('surveyBegin')?.addEventListener('click',async()=>{
    await ensureSurveySession();buildNeedChoices();showStep('needs');
  });
  document.querySelectorAll('[data-back]').forEach(btn=>btn.addEventListener('click',()=>showStep(btn.dataset.back)));

  const referralFromUrl=()=>{const u=new URL(location.href);return u.searchParams.get('ref')||u.searchParams.get('referral')||''};

  async function ensureSurveySession(){
    if(survey.sessionId&&survey.token) return true;
    if(!sb) return true; // Preview/offline fallback still demonstrates survey flow.
    clearError();
    const {data,error}=await sb.rpc('create_journey_survey_session',{p_source:'landing',p_referral_code:referralFromUrl()||null});
    if(error){showError('Lellee could not start the survey right now. Please try again.');console.error(error);return false}
    survey.sessionId=data?.session_id;survey.token=data?.session_token;
    try{sessionStorage.setItem('lelleeJourneySurvey',JSON.stringify({session_id:survey.sessionId,session_token:survey.token}))}catch(_){}
    return Boolean(survey.sessionId&&survey.token);
  }

  function openSurvey(){resetSurveyUI(false);dialog.showModal();showStep('intro')}
  async function openSurveyWithTopic(key){
    resetSurveyUI(false);survey.selected.add(key);dialog.showModal();await ensureSurveySession();buildNeedChoices();showStep('needs');
  }
  function resetSurveyUI(full=true){
    clearError();
    if(full) survey={sessionId:null,token:null,selected:new Set(),priority:null,supportStyle:null,result:null};
    else{survey.selected=new Set(survey.selected||[]);survey.priority=null;survey.supportStyle=null;survey.result=null}
    document.querySelectorAll('.survey-step').forEach(s=>s.classList.add('hidden'));
    document.querySelectorAll('[data-support-style]').forEach(b=>b.classList.remove('selected'));
    const ctx=document.getElementById('surveyContext');if(ctx)ctx.value='';
  }
  function showStep(name){
    clearError();
    document.querySelectorAll('.survey-step').forEach(s=>s.classList.toggle('hidden',s.dataset.step!==name));
    const pct={intro:8,needs:28,priority:48,support:68,context:86,result:100}[name]||8;
    document.getElementById('surveyProgressBar').style.width=pct+'%';
  }
  function buildNeedChoices(){
    const wrap=document.getElementById('surveyTopicChoices');wrap.innerHTML='';
    topics.filter(t=>t.topic_key!=='not-sure').slice(0,16).forEach((t,i)=>{
      const b=document.createElement('button');b.type='button';b.dataset.topicKey=t.topic_key;
      b.innerHTML=`<b>${icon(t)} ${esc(t.label)}</b><br><small>${esc(t.description||'')}</small>`;
      if(survey.selected.has(t.topic_key)) b.classList.add('selected');
      b.addEventListener('click',()=>{
        if(survey.selected.has(t.topic_key))survey.selected.delete(t.topic_key);else survey.selected.add(t.topic_key);
        b.classList.toggle('selected',survey.selected.has(t.topic_key));
        document.getElementById('needsNext').disabled=survey.selected.size===0;
      });
      wrap.appendChild(b);
    });
    const unsure=document.createElement('button');unsure.type='button';unsure.innerHTML='<b>✦ I’m not sure</b><br><small>Help me figure out where to begin.</small>';
    unsure.addEventListener('click',()=>{survey.selected.clear();survey.selected.add('not-sure');buildNeedChoices();document.getElementById('needsNext').disabled=false});
    wrap.appendChild(unsure);
    document.getElementById('needsNext').disabled=survey.selected.size===0;
  }

  document.getElementById('needsNext')?.addEventListener('click',async()=>{
    if(!survey.selected.size)return;if(!(await ensureSurveySession()))return;
    const ok=await saveAnswer('needs',{topics:[...survey.selected]},false);if(!ok)return;buildPriorityChoices();showStep('priority');
  });
  function buildPriorityChoices(){
    const wrap=document.getElementById('priorityChoices');wrap.innerHTML='';
    [...survey.selected].forEach(key=>{
      const t=topics.find(x=>x.topic_key===key)||{label:key==='not-sure'?'I’m not sure':key};
      const b=document.createElement('button');b.type='button';b.textContent=t.label;
      b.addEventListener('click',()=>{survey.priority=key;wrap.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b))});wrap.appendChild(b);
    });
    if(!survey.selected.has('not-sure')){
      const b=document.createElement('button');b.type='button';b.textContent='I’m not sure which one should come first';
      b.addEventListener('click',()=>{survey.priority=null;wrap.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b))});wrap.appendChild(b);
    }
  }
  document.getElementById('priorityNext')?.addEventListener('click',async()=>{
    if(!(await ensureSurveySession()))return;const ok=await saveAnswer('priority',{topic_key:survey.priority||''},false);if(ok)showStep('support');
  });
  document.querySelectorAll('[data-support-style]').forEach(btn=>btn.addEventListener('click',()=>{
    survey.supportStyle=btn.dataset.supportStyle;
    document.querySelectorAll('[data-support-style]').forEach(x=>x.classList.toggle('selected',x===btn));
    document.getElementById('supportNext').disabled=false;
  }));
  document.getElementById('supportNext')?.addEventListener('click',async()=>{
    if(!survey.supportStyle)return;if(!(await ensureSurveySession()))return;
    const ok=await saveAnswer('support_style',{style:survey.supportStyle},false);if(ok)showStep('context');
  });
  document.getElementById('contextNext')?.addEventListener('click',async()=>{
    if(!(await ensureSurveySession()))return;
    const btn=document.getElementById('contextNext'),working=document.getElementById('surveyWorking');btn.disabled=true;working.classList.remove('hidden');clearError();
    try{
      const text=document.getElementById('surveyContext').value.trim();
      if(sb&&text){await saveAnswer('context',{text},true);try{await sb.rpc('preview_journey_text_route',{p_text:text})}catch(_){}}
      if(sb){
        const {data,error}=await sb.rpc('recommend_journey_route',{p_session_id:survey.sessionId,p_session_token:survey.token});
        if(error)throw error;survey.result=data;
      }else{
        const first=[...survey.selected][0];
        const t=topics.find(x=>x.topic_key===first)||topics[0];
        survey.result={primary_topic_key:t.topic_key,primary_label:t.label,reason:'This looks like a useful place to begin based on what you selected.',related_topic_keys:[...survey.selected].slice(1,4)};
      }
      renderResult();showStep('result');
    }catch(e){console.error(e);showError('Lellee could not create your recommendation right now. Please try again.')}
    finally{btn.disabled=false;working.classList.add('hidden')}
  });

  async function saveAnswer(stepKey,answer,containsFreeText){
    if(!sb)return true;clearError();
    try{
      const {error}=await sb.rpc('save_journey_survey_answer',{p_session_id:survey.sessionId,p_session_token:survey.token,p_step_key:stepKey,p_answer:answer,p_contains_free_text:Boolean(containsFreeText)});
      if(error)throw error;return true;
    }catch(e){console.error(e);showError('Lellee could not save that answer. Please try again.');return false}
  }
  function renderResult(){
    const r=survey.result||{};
    document.getElementById('resultPrimary').textContent=r.primary_label||'Explore Lellee';
    document.getElementById('resultReason').textContent=r.reason||'Lellee can help you explore a few options and choose where to begin.';
    const wrap=document.getElementById('resultRelatedWrap'),rel=document.getElementById('resultRelated');rel.innerHTML='';
    const keys=Array.isArray(r.related_topic_keys)?r.related_topic_keys:[];
    keys.forEach(k=>{const t=topics.find(x=>x.topic_key===k);const s=document.createElement('span');s.textContent=t?.label||k;rel.appendChild(s)});
    wrap.classList.toggle('hidden',keys.length===0);
    const app=document.getElementById('continueToApp'),q=new URLSearchParams();
    if(survey.sessionId)q.set('journeySurvey',survey.sessionId);if(survey.token)q.set('journeyToken',survey.token);if(r.primary_topic_key)q.set('recommended',r.primary_topic_key);
    app.href='/app?'+q.toString();
  }
  document.getElementById('exploreAgain')?.addEventListener('click',()=>{survey.selected=new Set();survey.priority=null;survey.supportStyle=null;survey.result=null;buildNeedChoices();showStep('needs')});
  function showError(msg){surveyError.textContent=msg;surveyError.classList.remove('hidden')}
  function clearError(){surveyError.textContent='';surveyError.classList.add('hidden')}
  loadTopics();
})();
