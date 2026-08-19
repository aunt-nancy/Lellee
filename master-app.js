(() => {
  const SUPABASE_URL='https://hkrrxscyhtxmbvxevfkw.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_QPwVWU-qNnc3GJb_FoFnlQ_kEHa3dtU';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  let user=null, topics=[], enrollments=[];

  const $=s=>document.querySelector(s);
  const params=new URLSearchParams(location.search);
  const surveyId=params.get('journeySurvey');
  const surveyToken=params.get('journeyToken');
  const recommended=params.get('recommended');

  const authGate=$('#authGate'), authForm=$('#authForm'), authMsg=$('#authMsg');
  let authMode='signin';

  function setAuthMode(mode,msg=''){
    authMode=mode;
    $('#authTitle').textContent=mode==='signin'?'Log in to continue your journey.':'Create your Lellee account.';
    $('#authSubmit').textContent=mode==='signin'?'Log In':'Create Account';
    $('#authToggle').textContent=mode==='signin'?'Create an account':'Back to Log In';
    $('#authPassword').autocomplete=mode==='signin'?'current-password':'new-password';
    authMsg.textContent=msg;
  }
  $('#authToggle').addEventListener('click',()=>setAuthMode(authMode==='signin'?'signup':'signin'));
  authForm.addEventListener('submit',async e=>{
    e.preventDefault(); authMsg.textContent='';
    const email=$('#authEmail').value.trim(),password=$('#authPassword').value;
    let result;
    if(authMode==='signin') result=await sb.auth.signInWithPassword({email,password});
    else result=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/app'+location.search}});
    if(result.error){authMsg.textContent=result.error.message;return}
    if(authMode==='signup'&&!result.data.session){setAuthMode('signin','Account created. Confirm your email, then log in.');return}
    await begin(result.data.user);
  });
  $('#signOutBtn').addEventListener('click',async()=>{await sb.auth.signOut();location.href='/app'});

  async function begin(u){
    user=u;authGate.classList.add('hidden');
    await Promise.all([loadProfile(),loadTopics(),loadEnrollments()]);
    renderRecommendation();renderJourneys();
  }
  async function loadProfile(){
    try{
      const {data}=await sb.from('profiles').select('display_name').eq('id',user.id).maybeSingle();
      const name=data?.display_name?.trim()||user.email?.split('@')[0]||'friend';
      $('#userHello').textContent='Hi, '+name;
      $('#welcomeTitle').textContent='Welcome, '+name+'.';
    }catch(_){}
  }
  async function loadTopics(){
    try{
      const {data}=await sb.rpc('get_public_support_topics');
      if(Array.isArray(data))topics=data;
    }catch(_){}
  }
  async function loadEnrollments(){
    try{
      const {data,error}=await sb.from('program_enrollments')
        .select('status,is_primary,enrolled_at,programs(id,slug,name,short_description,status)')
        .eq('user_id',user.id).in('status',['active','paused']);
      if(error)throw error;enrollments=data||[];
    }catch(e){console.warn(e);enrollments=[]}
  }
  function topicLabel(key){
    return topics.find(t=>t.topic_key===key)?.label || key?.replaceAll('-',' ').replace(/\b\w/g,m=>m.toUpperCase()) || 'Your Starting Point';
  }
  function renderRecommendation(){
    if(!recommended)return;
    $('#recommendationPanel').classList.remove('hidden');
    $('#recommendationLabel').textContent=topicLabel(recommended);
  }
  $('#acceptRecommendation').addEventListener('click',async()=>{
    const msg=$('#recommendationMsg');msg.textContent='Saving your starting point…';
    try{
      if(surveyId&&surveyToken){
        const {error}=await sb.rpc('accept_journey_route',{p_session_id:surveyId,p_session_token:surveyToken});
        if(error)throw error;
      }
      const {data,error}=await sb.rpc('start_selected_support_path',{p_topic_key:recommended});
      if(error)throw error;
      if(data?.status==='started'&&data?.program_slug==='recovery'){
        msg.textContent='Recovery is ready. Opening your Recovery journey…';
        setTimeout(()=>location.href='/app/recovery',450);
        return;
      }
      if(data?.status==='interest_recorded'){
        msg.textContent='Saved. This Lellee path is being prepared; your interest has been recorded.';
      }else{
        msg.textContent='Saved. Your Lellee starting point is now part of your account.';
      }
      await loadEnrollments();renderJourneys();
    }catch(e){console.error(e);msg.textContent='We could not save that starting point. Please try again.'}
  });

  async function loadPreferences(){
    try{
      const {data}=await sb.from('user_support_path_preferences')
        .select('topic_key,preference_role,active,selected_at').eq('user_id',user.id).eq('active',true);
      return data||[];
    }catch(_){return[]}
  }
  async function renderJourneys(){
    const grid=$('#activeJourneyGrid');grid.innerHTML='';
    const prefs=await loadPreferences();
    const used=new Set();
    enrollments.forEach((e,i)=>{
      const p=e.programs;if(!p)return;
      used.add(p.slug);
      const card=document.createElement('article');card.className='journey-card';
      const active=p.status==='active'||p.status==='pilot';
      card.innerHTML=`<span class="journey-status">${e.is_primary?'PRIMARY PROGRAM':'ACTIVE PROGRAM'}</span>
        <h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.short_description||'Your Lellee program.')}</p>
        ${p.slug==='recovery'?'<a class="primary" href="/app/recovery">Continue Recovery</a>':
          active?'<button class="secondary" disabled>Program workspace being connected</button>':
          '<button class="secondary" disabled>Coming later</button>'}`;
      grid.appendChild(card);
    });
    prefs.forEach(pr=>{
      if(used.has(pr.topic_key))return;
      const card=document.createElement('article');card.className='journey-card';
      card.innerHTML=`<span class="journey-status">${pr.preference_role==='primary'?'CHOSEN STARTING POINT':'CONNECTED SUPPORT'}</span>
        <h2>${escapeHtml(topicLabel(pr.topic_key))}</h2>
        <p>This support area is saved to your Lellee account. Availability can differ by program.</p>
        <a class="secondary" href="/?topic=${encodeURIComponent(pr.topic_key)}">Review Support</a>`;
      grid.appendChild(card);
    });
    if(!grid.children.length){
      grid.innerHTML=`<article class="journey-card"><span class="journey-status">START HERE</span><h2>Choose what would help now</h2><p>Start Your Journey will help Lellee suggest a sensible place to begin.</p><a class="primary" href="/">Start Your Journey</a></article>`;
    }
    syncPrimaryJourneyActions();
  }
  function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}

  function activeRecoveryEnrollment(){
    return enrollments.find(e=>e?.programs?.slug==='recovery'&&['active','paused'].includes(e.status));
  }
  function syncPrimaryJourneyActions(){
    const recovery=activeRecoveryEnrollment();
    const continueLink=$('#continuePrimaryJourney');
    const updateLink=$('#updateJourneyLink');
    if(continueLink)continueLink.classList.toggle('hidden',!recovery);
    if(updateLink)updateLink.classList.toggle('primary',!recovery);
    if(updateLink)updateLink.classList.toggle('secondary',!!recovery);
  }
  function openPrimaryJourney(){
    if(activeRecoveryEnrollment()){location.href='/app/recovery';return}
    showSection('home');
    setTimeout(()=>$('#homeJourneyArea')?.scrollIntoView({behavior:'smooth',block:'start'}),40);
  }

  function showSection(name){
    const requested=name;
    if(name==='journeys')name='home';
    document.querySelectorAll('.app-section').forEach(s=>s.classList.toggle('active',s.id==='section-'+name));
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.section===name));
    window.scrollTo({top:0,behavior:'smooth'});
    if(requested==='journeys')setTimeout(()=>$('#homeJourneyArea')?.scrollIntoView({behavior:'smooth',block:'start'}),40);
  }
  document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.section)));
  document.querySelectorAll('[data-section-jump]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.sectionJump)));
  $('#todayJourneyAction')?.addEventListener('click',openPrimaryJourney);
  $('#homeJourneyBlock')?.addEventListener('click',openPrimaryJourney);
  $('#supportJourneyAction')?.addEventListener('click',()=>{showSection('home');setTimeout(()=>$('#homeJourneyArea')?.scrollIntoView({behavior:'smooth',block:'start'}),40)});

  sb.auth.getSession().then(({data})=>{
    if(data.session?.user)begin(data.session.user);
  });
})();
