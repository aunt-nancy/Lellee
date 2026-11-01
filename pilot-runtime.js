(() => {
  'use strict';

  const auth = window.LelleeAuthContext;
  if (!auth?.client) {
    console.warn('Lellee Pilot Runtime: auth bridge unavailable.');
    return;
  }

  const sb = auth.client;
  const $ = (s) => document.querySelector(s);
  const esc = (s='') => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const CONTROLLED = ['reentry','caregiving','independent-living','housing-stability','grief','workforce-reentry','family-recovery'];
  const ICONS = {
    recovery:'♡', reentry:'↗', caregiving:'♡', 'independent-living':'✦',
    'housing-stability':'⌂', grief:'◇', 'workforce-reentry':'▣', 'family-recovery':'◎'
  };
  const MODULE_ICON = {
    today:'☀',journey:'↗',help_now:'♡',journal:'▧',tools:'⌁',learn:'◇',support:'◎',resources:'⌂',milestones:'◆',
    documents:'▤',appointments:'◷',benefits:'✓',employment:'▣',housing:'⌂'
  };
  const MODULE_PAGE = {
    today:'program-home', journey:'program-journey-runtime', help_now:'help-now', journal:'journal', tools:'tools', learn:'learn',
    support:'community', resources:'resources', milestones:'milestones', documents:'life-admin', appointments:'life-admin', benefits:'life-admin', employment:'life-admin', housing:'life-admin'
  };

  let user = null;
  let settings = {};
  let programs = [];
  let activeProgram = null;
  let activeProgress = null;
  let activeStages = [];
  let activeModules = [];
  let activeContent = [];
  let todayItem = null;
  let selectedChoices = new Set();
  let activityLoadSequence = 0;
  let responseLoadOkay = false;

  function page(name){
    if (typeof window.showPage === 'function') window.showPage(name);
    else {
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      document.querySelector(`#page-${name}`)?.classList.add('active');
      window.scrollTo({top:0});
    }
  }

  async function waitForUser(timeout=12000){
    const started=Date.now();
    while(Date.now()-started < timeout){
      user = auth.getCurrentUser?.() || null;
      if(user) return user;
      await new Promise(r=>setTimeout(r,180));
    }
    return null;
  }

  async function loadSettings(){
    const keys=['pilot_program_runtime_enabled','program_switcher_enabled','non_recovery_runtime_mode','recovery_legacy_renderer_enabled','content_engine_v2_consumer_enabled','public_multi_program_launch_enabled'];
    const {data,error}=await sb.from('app_public_settings').select('key,value').in('key',keys);
    if(error) throw error;
    settings=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
  }

  function protectedRuntimeOkay(){
    return settings.pilot_program_runtime_enabled==='true'
      && settings.program_switcher_enabled==='true'
      && settings.recovery_legacy_renderer_enabled==='true'
      && settings.content_engine_v2_consumer_enabled==='false'
      && settings.public_multi_program_launch_enabled==='false';
  }

  async function loadPrograms(){
    const [{data:pilot,error:pErr},{data:recovery,error:rErr}] = await Promise.all([
      sb.from('program_pilot_enrollments').select('program_id,status').eq('user_id',user.id).eq('status','active'),
      sb.from('programs').select('id,slug,name,short_description,status,audience,display_order,terminology,journey_config,privacy_config').eq('slug','recovery').maybeSingle()
    ]);
    if(pErr) throw pErr;
    if(rErr) throw rErr;

    const pilotIds=(pilot||[]).map(x=>x.program_id);
    let pilotPrograms=[];
    if(pilotIds.length){
      const {data,error}=await sb.from('programs')
        .select('id,slug,name,short_description,status,audience,display_order,terminology,journey_config,privacy_config')
        .in('id',pilotIds).in('slug',CONTROLLED);
      if(error) throw error;
      pilotPrograms=data||[];
    }

    const merged=[];
    if(recovery) merged.push({...recovery,isRecovery:true,pilotStatus:'live'});
    pilotPrograms.sort((a,b)=>(a.display_order||999)-(b.display_order||999)).forEach(p=>merged.push({...p,isRecovery:false,pilotStatus:'active'}));
    programs=merged;
    return programs;
  }

  function programJourneyName(p){
    return p?.terminology?.journey || `${p?.name || 'Lellee'} Journey`;
  }

  function programToneClass(slug){
    return `runtime-tone-${slug || 'default'}`;
  }

  function renderSwitcher(){
    const wrap=$('#programSwitcherList');
    if(!wrap) return;
    wrap.innerHTML='';

    if(!protectedRuntimeOkay()){
      wrap.innerHTML='<div class="runtime-state-card runtime-state-warning"><b>Internal program access is paused.</b><p>The protected runtime settings are not in their expected test configuration.</p></div>';
      return;
    }

    const intro=document.createElement('div');
    intro.className='runtime-switcher-summary';
    intro.innerHTML=`<div><b>${programs.length}</b><span>programs available to this test account</span></div><p>Recovery keeps its current live experience. Additional programs use the controlled pilot runtime and remain private to enrolled test accounts.</p>`;
    wrap.appendChild(intro);

    programs.forEach((p,index)=>{
      const card=document.createElement('article');
      card.className=`runtime-program-card ${programToneClass(p.slug)}`;
      card.innerHTML=`
        <div class="runtime-program-icon">${ICONS[p.slug]||'✦'}</div>
        <div class="runtime-program-copy">
          <div class="runtime-program-meta"><span>${p.isRecovery?'LIVE':'INTERNAL PILOT'}</span><em>${p.isRecovery?'Current Recovery experience':'Private test access'}</em></div>
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.short_description||'A Lellee support program.')}</p>
        </div>
        <button class="runtime-open-program">${p.isRecovery?'Open Recovery':'Open Program'} →</button>`;
      card.querySelector('button').addEventListener('click',()=>openProgram(p));
      wrap.appendChild(card);
    });
  }

  async function openProgram(program){
    ++activityLoadSequence;
    if(program.isRecovery){
      activeProgram=null;
      page('today');
      return;
    }
    activeProgram=program;
    if(!await loadProgramRuntime(program)) return;
    renderProgramHome();
    page('program-home');
  }

  async function loadProgramRuntime(program){
    const [progressQ,modulesQ,stagesQ,contentQ] = await Promise.all([
      sb.from('pilot_program_progress').select('*').eq('user_id',user.id).eq('program_id',program.id).maybeSingle(),
      sb.from('program_modules').select('module_key,label,enabled,display_order,settings').eq('program_id',program.id).eq('enabled',true).order('display_order'),
      sb.from('program_journey_stages').select('id,stage_key,name,description,sequence,start_day,end_day,status').eq('program_id',program.id).in('status',['published','review','draft']).order('sequence'),
      sb.from('program_content_items').select('id,stage_id,content_key,content_type,title,intro_text,body_text,suggested_choices,reflection_prompt,sequence,day_number,week_number,estimated_minutes,status,tags').eq('program_id',program.id).in('status',['published','review','draft']).order('sequence')
    ]);
    if(activeProgram?.id!==program.id) return false;
    for(const q of [progressQ,modulesQ,stagesQ,contentQ]) if(q.error) throw q.error;
    activeProgress=progressQ.data||{current_day:1,current_week:1,current_stage_id:null};
    activeModules=modulesQ.data||[];
    activeStages=stagesQ.data||[];
    activeContent=contentQ.data||[];

    let stage=activeStages.find(s=>s.id===activeProgress.current_stage_id) || activeStages[0] || null;
    if(stage && !activeProgress.current_stage_id) activeProgress.current_stage_id=stage.id;

    todayItem = activeContent.find(c=>c.stage_id===stage?.id) || activeContent.find(c=>Array.isArray(c.tags)&&c.tags.includes('weekly_review')) || activeContent[0] || null;
    if(todayItem) await loadActivityResponse(todayItem,program.id);
    return activeProgram?.id===program.id;
  }

  async function loadActivityResponse(item,programId){
      const request=++activityLoadSequence;
      selectedChoices=new Set();
      responseLoadOkay=false;
      let result;
      try { result=await sb.from('pilot_daily_responses')
        .select('selected_choices,reflection,completed_at')
        .eq('user_id',user.id).eq('program_id',programId).eq('content_item_id',item.id).maybeSingle(); }
      catch { result={data:null,error:{message:'Saved response unavailable'}}; }
      if(request!==activityLoadSequence || activeProgram?.id!==programId || todayItem?.id!==item.id) return;
      const {data,error}=result;
      responseLoadOkay=!error;
      if(!error && data){
        selectedChoices=new Set(data.selected_choices||[]);
        item._savedReflection=data.reflection||'';
        item._completedAt=data.completed_at||null;
      }
  }

  async function chooseActivity(item){
    if(!activeProgram || !activeContent.includes(item)) return;
    const programId=activeProgram.id;
    todayItem=item;
    if(item.stage_id) activeProgress.current_stage_id=item.stage_id;
    await loadActivityResponse(item,programId);
    if(activeProgram?.id!==programId || todayItem?.id!==item.id) return;
    renderProgramHome();
    page('program-home');
  }

  function renderProgramHome(){
    if(!activeProgram) return;
    const stage=activeStages.find(s=>s.id===activeProgress?.current_stage_id)||activeStages[0]||null;
    $('#runtimeProgramKicker').textContent='LELLEE · INTERNAL PILOT';
    $('#runtimeProgramName').textContent=activeProgram.name;
    $('#runtimeProgramDescription').textContent=activeProgram.short_description||'';
    $('#runtimeJourneyLabel').textContent=programJourneyName(activeProgram);
    $('#runtimeStageLabel').textContent=stage?.name||'Starting Point';

    const title=$('#runtimeTodayTitle'), intro=$('#runtimeTodayIntro'), choices=$('#runtimeTodayChoices'), refWrap=$('#runtimeTodayReflectionWrap'), refLabel=$('#runtimeTodayReflectionLabel'), ref=$('#runtimeTodayReflection'), save=$('#runtimeSaveToday'), msg=$('#runtimeTodayMsg');
    ref.setAttribute('aria-labelledby','runtimeTodayReflectionLabel');
    msg.setAttribute('role','status'); msg.setAttribute('aria-live','polite');
    choices.innerHTML='';
    msg.textContent='';

    if(todayItem){
      title.textContent=todayItem.title||'Your next step';
      intro.textContent=todayItem.body_text||todayItem.intro_text||'Choose one useful step for today.';
      intro.style.whiteSpace='pre-line';
      const list=Array.isArray(todayItem.suggested_choices)?todayItem.suggested_choices:[];
      list.forEach(choice=>{
        const b=document.createElement('button');
        b.type='button'; b.className='runtime-choice'; b.textContent=choice;
        b.classList.toggle('selected',selectedChoices.has(choice));
        b.setAttribute('aria-pressed',String(selectedChoices.has(choice)));
        b.addEventListener('click',()=>{selectedChoices.has(choice)?selectedChoices.delete(choice):selectedChoices.add(choice);b.classList.toggle('selected');b.setAttribute('aria-pressed',String(selectedChoices.has(choice)))});
        choices.appendChild(b);
      });
      if(todayItem.reflection_prompt){
        refWrap.classList.remove('hidden');
        refLabel.textContent=todayItem.reflection_prompt;
        ref.value=todayItem._savedReflection||'';
      } else {
        refWrap.classList.add('hidden'); ref.value='';
      }
      save.disabled=!responseLoadOkay;
      if(!responseLoadOkay) msg.textContent='Your saved response could not be loaded. Reopen the activity to retry before saving.';
      else if(todayItem._completedAt) msg.textContent='Saved previously — you can revise it.';
    } else {
      title.textContent='This program is ready for structure review';
      intro.textContent='The program is enrolled for internal testing, but no readable pilot content is available yet.';
      refWrap.classList.add('hidden'); save.disabled=true;
    }

    renderModules();
    renderStageList();
  }

  function renderModules(){
    const wrap=$('#runtimeModuleGrid');
    wrap.innerHTML='';
    const shown=activeModules.filter(m=>m.module_key!=='today').slice(0,12);
    shown.forEach(m=>{
      const b=document.createElement('button');
      b.className='runtime-module-card';
      b.innerHTML=`<span>${MODULE_ICON[m.module_key]||'◇'}</span><b>${esc(m.label)}</b><small>${moduleHelp(m.module_key)}</small>`;
      b.addEventListener('click',()=>{
        if(m.module_key==='journey') renderJourneyPage();
        page(MODULE_PAGE[m.module_key]||'program-home');
      });
      wrap.appendChild(b);
    });
  }

  function moduleHelp(key){
    return ({journey:'See the stages in this program.',help_now:'Immediate support options.',journal:'Private reflection space.',tools:'Practical tools.',learn:'Program learning.',support:'Connection and support.',resources:'Find useful resources.',milestones:'Review progress without scoring.',documents:'Organize important documents.',appointments:'Keep track of appointments.',benefits:'Track benefit-related steps.',employment:'Work-related planning.',housing:'Housing-related planning.'})[key]||'Open this program area.';
  }

  function renderStageList(){
    const wrap=$('#runtimeStageList');
    wrap.innerHTML='';
    const currentId=activeProgress?.current_stage_id || activeStages[0]?.id;
    activeStages.forEach((s,index)=>{
      const item=document.createElement('div');
      item.className='runtime-stage-row';
      if(s.id===currentId)item.classList.add('current');
      item.innerHTML=`<span>${index+1}</span><div><b>${esc(s.name)}</b><small>${esc(s.description||'')}</small></div><em>${s.id===currentId?'Current':'Available'}</em>`;
      wrap.appendChild(item);
    });
  }

  function renderJourneyPage(){
    if(!activeProgram)return;
    $('#runtimeJourneyTitle').textContent=programJourneyName(activeProgram);
    $('#runtimeJourneyDescription').textContent='Move through this journey at your own pace. Stages are guides, not compliance gates.';
    const stages=$('#runtimeJourneyStages'), content=$('#runtimeJourneyContent');
    stages.innerHTML=''; content.innerHTML='';
    const currentId=activeProgress?.current_stage_id || activeStages[0]?.id;
    activeStages.forEach((s,index)=>{
      const b=document.createElement('button');
      b.className='runtime-journey-stage-button';
      b.setAttribute('aria-current',s.id===currentId?'step':'false');
      if(s.id===currentId)b.classList.add('current');
      b.innerHTML=`<span>${index+1}</span><div><b>${esc(s.name)}</b><small>${esc(s.description||'')}</small></div>`;
      b.addEventListener('click',()=>renderStageContent(s));
      stages.appendChild(b);
    });
    renderStageContent(activeStages.find(s=>s.id===currentId)||activeStages[0]);
  }

  function renderStageContent(stage){
    const wrap=$('#runtimeJourneyContent');
    wrap.innerHTML='';
    if(!stage){wrap.innerHTML='<div class="runtime-state-card"><p>No stages are available yet.</p></div>';return}
    const items=activeContent.filter(c=>c.stage_id===stage.id);
    const head=document.createElement('div');
    head.className='runtime-journey-content-head';
    head.innerHTML=`<span>STAGE</span><h3>${esc(stage.name)}</h3><p>${esc(stage.description||'')}</p>`;
    wrap.appendChild(head);
    if(!items.length){
      wrap.insertAdjacentHTML('beforeend','<div class="runtime-state-card"><p>No readable content has been added to this stage yet.</p></div>');
      return;
    }
    items.forEach(item=>{
      const a=document.createElement('article');
      a.className='runtime-content-card';
      a.innerHTML=`<div><span>${esc((item.content_type||'prompt').replaceAll('_',' '))}</span><em>${item.estimated_minutes||5} min</em></div><h4>${esc(item.title)}</h4><p style="white-space:pre-line">${esc(item.body_text||item.intro_text||'')}</p>${item.reflection_prompt?`<blockquote>${esc(item.reflection_prompt)}</blockquote>`:''}`;
      const use=document.createElement('button');
      use.type='button'; use.className='runtime-open-program';
      use.textContent='Use this activity';
      use.setAttribute('aria-label','Use activity: '+item.title);
      use.addEventListener('click',()=>chooseActivity(item));
      a.appendChild(use);
      wrap.appendChild(a);
    });
  }

  async function saveToday(){
    if(!activeProgram || !todayItem || !user || !responseLoadOkay)return;
    const btn=$('#runtimeSaveToday'), msg=$('#runtimeTodayMsg');
    const program=activeProgram, item=todayItem;
    const progress={...activeProgress};
    btn.disabled=true; msg.textContent='Saving…';
    const reflection=$('#runtimeTodayReflection')?.value?.trim()||null;
    const payload={
      user_id:user.id, program_id:program.id, content_item_id:item.id,
      selected_choices:[...selectedChoices], reflection, completed_at:new Date().toISOString(), updated_at:new Date().toISOString()
    };
    const same=()=>activeProgram?.id===program.id && todayItem?.id===item.id;
    let responseSaved=false;
    try {
      const {error}=await sb.from('pilot_daily_responses').upsert(payload,{onConflict:'user_id,program_id,content_item_id'});
      if(error) throw error;
      responseSaved=true;
      if(!same()) return;
      const {error:progressError}=await sb.from('pilot_program_progress').upsert({
        user_id:user.id,program_id:program.id,current_day:progress.current_day||1,current_week:progress.current_week||1,current_stage_id:progress.current_stage_id||item.stage_id||null,last_opened_at:new Date().toISOString(),updated_at:new Date().toISOString()
      },{onConflict:'user_id,program_id'});
      if(same()){
        msg.textContent=progressError?'Activity saved privately. The journey position could not be updated; you can try saving again.':'Saved privately to this program.';
        item._completedAt=new Date().toISOString();
      }
    } catch(error) {
      if(same()) msg.textContent=responseSaved?'Activity saved privately. The journey position could not be updated; you can try saving again.':'Could not save yet. Please try again.';
      console.error(error);
    } finally { if(same()) btn.disabled=!responseLoadOkay; }
  }

  async function init(){
    if(!(await waitForUser())) return;
    try{
      await loadSettings();
      await loadPrograms();
      renderSwitcher();
      $('#runtimeSaveToday')?.addEventListener('click',saveToday);
      document.querySelectorAll('[data-page="program-switcher"]').forEach(b=>b.addEventListener('click',()=>{loadPrograms().then(renderSwitcher).catch(console.error)}));
      window.LelleePilotRuntime={reload:async()=>{await loadSettings();await loadPrograms();renderSwitcher()},openProgram};
    }catch(error){
      console.error('Lellee Pilot Runtime initialization failed:',error);
      const wrap=$('#programSwitcherList');
      if(wrap)wrap.innerHTML='<div class="runtime-state-card runtime-state-warning"><b>Programs could not be loaded.</b><p>The pilot runtime is installed, but its data could not be read for this account.</p></div>';
    }
  }

  init();
})();

// Caregiving coordination stays isolated from the locked Recovery markup.
(()=>{
 if(document.querySelector('script[data-caregiving-coordinator]'))return;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/caregiving-coordinator.css?v=20261101-1';style.dataset.caregivingCoordinator='1';document.head.appendChild(style);
 const script=document.createElement('script');script.src='/caregiving-coordinator.js?v=20261101-1';script.defer=true;script.dataset.caregivingCoordinator='1';document.head.appendChild(script);
 const a11yStyle=document.createElement('link');a11yStyle.rel='stylesheet';a11yStyle.href='/accessibility-acceptance.css?v=20261101-1';a11yStyle.dataset.accessibilityAcceptance='1';document.head.appendChild(a11yStyle);
 const a11yScript=document.createElement('script');a11yScript.src='/accessibility-acceptance.js?v=20261101-1';a11yScript.defer=true;a11yScript.dataset.accessibilityAcceptance='1';document.head.appendChild(a11yScript);
})();
