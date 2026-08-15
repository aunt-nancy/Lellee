(() => {
  'use strict';

  const SUPABASE_URL='https://hkrrxscyhtxmbvxevfkw.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_QPwVWU-qNnc3GJb_FoFnlQ_kEHa3dtU';
  const sb=window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);

  const TOPIC_ORDER=['recovery','reentry','caregiving','housing-stability','workforce-reentry','grief','independent-living','family-recovery','not-sure'];
  const TOPIC_ALIASES={
    'work-new-beginnings':'workforce-reentry',
    'grief-loss':'grief',
    'family-support':'family-recovery'
  };
  const fallbackTopics=[
    {topic_key:'recovery',label:'Recovery',description:'Build stability and support around alcohol or substance use.',icon_key:'leaf',availability:'available'},
    {topic_key:'reentry',label:'Returning Home',description:'Rebuild routines, documents, housing and work after incarceration.',icon_key:'door-open',availability:'guided_exploration'},
    {topic_key:'caregiving',label:'Caregiving',description:'Get practical support while caring for a parent, partner or loved one.',icon_key:'hands-heart',availability:'guided_exploration'},
    {topic_key:'housing-stability',label:'Housing Stability',description:'Get organized around housing, tenancy, benefits and stable routines.',icon_key:'home',availability:'guided_exploration'},
    {topic_key:'workforce-reentry',label:'Work & New Beginnings',description:'Prepare for work, applications, interviews and a steady routine.',icon_key:'briefcase',availability:'guided_exploration'},
    {topic_key:'grief',label:'Grief & Life After Loss',description:'Find your footing after a death, loss or major life change.',icon_key:'butterfly',availability:'guided_exploration'},
    {topic_key:'independent-living',label:'Independent Living',description:'Build everyday skills, routines and confidence for greater independence.',icon_key:'spark',availability:'guided_exploration'},
    {topic_key:'family-recovery',label:'Family Support',description:'Support your family, rebuild relationships and help someone you love.',icon_key:'people',availability:'guided_exploration'},
    {topic_key:'not-sure',label:'I’m Not Sure',description:'Tell Lellee what is going on and get help finding a sensible place to begin.',icon_key:'compass',availability:'guided_exploration'}
  ];
  const icons={home:'⌂','hands-heart':'♡','door-open':'↗',briefcase:'▣',leaf:'⌁',spark:'✦',people:'◎',butterfly:'♡',compass:'✦',default:'✦'};

  const copy={
    en:{
      language_label:'Language',nav_home:'Home',nav_how:'How Lellee Works',nav_paths:'Support Paths',nav_tools:'Tools',nav_coaching:'Coaching',nav_resources:'Resources',nav_login:'Log In',start_journey:'Start Your Journey',explore_support:'Explore Support',
      hero_kicker:'WELCOME TO LELLEE',hero_title:'Your journey.<br>Your support.<br><em>Your way.</em>',hero_body:'Guided daily support and practical tools to help you move through the part of life you’re navigating now.',hero_note:'It only takes a few answers to find a good place to begin.',journey_title:'YOUR LELLEE JOURNEY',journey_subtitle:'One account • Support that can grow with you',support_heading:'How can we support you today?',support_subheading:'These topics can move based on approved demand and search trends, while every Lellee support path stays available.',help_choose:"I’m not sure — help me figure it out →",
      survey_start:'START YOUR JOURNEY',survey_intro_title:'You don’t have to know exactly what you need yet.',survey_intro_body:'Tell Lellee what is going on. We’ll suggest one clear place to begin. You choose whether to start it.',begin:'Begin',question_one:'QUESTION 1',need_title:'What would you like support with right now?',need_body:'Choose one broad area. You can add another support path later.',need_dropdown_label:'Main area of support',choose_one:'Choose one',need_text_label:'What is going on right now?',need_text_placeholder:'A short sentence is enough.',need_text_hint:'Optional. This helps Lellee understand your situation without asking you to choose from a long list.',continue:'Continue',back:'← Back',optional:'OPTIONAL',context_title:'Anything else you want Lellee to understand?',context_body:'You can skip this. This text is not used for advertising or public search indexing.',context_placeholder:'For example: I’m caring for my dad, behind on bills, and trying to return to work.',show_starting_point:'Show My Starting Point',finding_start:'Finding a good place to begin…',result_kicker:'YOUR LELLEE STARTING POINT',result_title:'Here’s a good place to begin.',start_here:'START HERE',also_connected:'Also connected to your journey:',result_note:'This is a recommendation, not a diagnosis. Nothing starts until you choose it.',choose_path:'Choose This Starting Point',change_answer:'Change My Answer',
      account_kicker:'SAVE YOUR STARTING POINT',account_title:'Create your Lellee account.',account_body:'We’ll collect only the basic information needed for the path you selected. You can change it later.',selected_path:'SELECTED PATH',create_account:'Create account',sign_in:'Sign in',first_name:'First name or nickname',first_name_placeholder:'What should Lellee call you?',email:'Email',password:'Password',confirm_password:'Confirm password',a_few_details:'A few details for this path',change_later:'You can change these later.',path_note:'Anything important for your first step?',path_note_placeholder:'Optional',adult_confirm:'I confirm I am at least 18 years old.',terms_confirm:'I reviewed the <a href="/terms.html" target="_blank">Terms</a>, <a href="/privacy.html" target="_blank">Privacy Policy</a>, and <a href="/consumer-health-privacy.html" target="_blank">Consumer Health Data Notice</a>.',safety_confirm:'I understand Lellee is support and guidance, not emergency or professional medical treatment.',create_and_continue:'Create Account & Continue',sign_in_continue:'Sign In & Continue',saving_account:'Saving your starting point…',almost_done:'ALMOST DONE',check_email_title:'Check your email.',check_email_body:'Use the confirmation link from Lellee to finish creating your account. Your selected starting point will be waiting for you.',go_to_lellee:'Go to Lellee',
      available:'Available now',explore:'Explore with Lellee',coming:'Explore this need',other:'Other',listening:'Listening…',voice_added:'Voice text added.',voice_unavailable:'Speech-to-text is not available in this browser.',voice_error:'Lellee could not hear that. You can type your answer instead.',required_need:'Choose a main area of support.',password_mismatch:'The passwords do not match.',legal_required:'Please confirm the age, legal and safety statements.',account_error:'Lellee could not create or sign in to the account. Please try again.',route_error:'Your account is ready, but Lellee could not finish the path setup. You can continue to Lellee Home.',fallback_reason:'This is a practical place to begin based on the area you selected.'
    },
    es:{
      language_label:'Idioma',nav_home:'Inicio',nav_how:'Cómo funciona Lellee',nav_paths:'Áreas de apoyo',nav_tools:'Herramientas',nav_coaching:'Coaching',nav_resources:'Recursos',nav_login:'Iniciar sesión',start_journey:'Comienza tu camino',explore_support:'Explorar apoyo',
      hero_kicker:'BIENVENIDO A LELLEE',hero_title:'Tu camino.<br>Tu apoyo.<br><em>A tu manera.</em>',hero_body:'Apoyo diario guiado y herramientas prácticas para ayudarte con la etapa de vida que estás atravesando ahora.',hero_note:'Solo se necesitan unas pocas respuestas para encontrar un buen punto de partida.',journey_title:'TU CAMINO CON LELLEE',journey_subtitle:'Una cuenta • Apoyo que puede crecer contigo',support_heading:'¿Cómo podemos apoyarte hoy?',support_subheading:'Los temas pueden cambiar según la demanda aprobada y las tendencias de búsqueda, pero todas las áreas de apoyo permanecen disponibles.',help_choose:'No estoy seguro — ayúdame a decidir →',
      survey_start:'COMIENZA TU CAMINO',survey_intro_title:'No tienes que saber exactamente qué necesitas todavía.',survey_intro_body:'Cuéntale a Lellee lo que está pasando. Te sugeriremos un lugar claro para comenzar. Tú decides si deseas iniciarlo.',begin:'Comenzar',question_one:'PREGUNTA 1',need_title:'¿Con qué te gustaría recibir apoyo ahora?',need_body:'Elige un área general. Más adelante puedes agregar otra área de apoyo.',need_dropdown_label:'Área principal de apoyo',choose_one:'Elige una opción',need_text_label:'¿Qué está pasando en este momento?',need_text_placeholder:'Una frase corta es suficiente.',need_text_hint:'Opcional. Esto ayuda a Lellee a entender tu situación sin mostrarte una lista larga de opciones.',continue:'Continuar',back:'← Atrás',optional:'OPCIONAL',context_title:'¿Hay algo más que quieras que Lellee entienda?',context_body:'Puedes omitirlo. Este texto no se usa para publicidad ni para búsquedas públicas.',context_placeholder:'Por ejemplo: cuido a mi papá, estoy atrasado con las cuentas y trato de volver a trabajar.',show_starting_point:'Mostrar mi punto de partida',finding_start:'Buscando un buen lugar para comenzar…',result_kicker:'TU PUNTO DE PARTIDA EN LELLEE',result_title:'Este es un buen lugar para comenzar.',start_here:'COMIENZA AQUÍ',also_connected:'También relacionado con tu camino:',result_note:'Esta es una recomendación, no un diagnóstico. Nada comienza hasta que tú lo elijas.',choose_path:'Elegir este punto de partida',change_answer:'Cambiar mi respuesta',
      account_kicker:'GUARDA TU PUNTO DE PARTIDA',account_title:'Crea tu cuenta de Lellee.',account_body:'Solo recopilaremos la información básica necesaria para el camino que elegiste. Puedes cambiarla más adelante.',selected_path:'CAMINO ELEGIDO',create_account:'Crear cuenta',sign_in:'Iniciar sesión',first_name:'Nombre o apodo',first_name_placeholder:'¿Cómo debe llamarte Lellee?',email:'Correo electrónico',password:'Contraseña',confirm_password:'Confirmar contraseña',a_few_details:'Algunos datos para este camino',change_later:'Puedes cambiarlos más adelante.',path_note:'¿Algo importante para tu primer paso?',path_note_placeholder:'Opcional',adult_confirm:'Confirmo que tengo al menos 18 años.',terms_confirm:'Revisé los <a href="/terms.html" target="_blank">Términos</a>, la <a href="/privacy.html" target="_blank">Política de privacidad</a> y el <a href="/consumer-health-privacy.html" target="_blank">Aviso de datos de salud del consumidor</a>.',safety_confirm:'Entiendo que Lellee ofrece apoyo y orientación, no tratamiento médico profesional ni servicios de emergencia.',create_and_continue:'Crear cuenta y continuar',sign_in_continue:'Iniciar sesión y continuar',saving_account:'Guardando tu punto de partida…',almost_done:'CASI TERMINAS',check_email_title:'Revisa tu correo electrónico.',check_email_body:'Usa el enlace de confirmación de Lellee para terminar de crear tu cuenta. Tu punto de partida estará esperándote.',go_to_lellee:'Ir a Lellee',
      available:'Disponible ahora',explore:'Explorar con Lellee',coming:'Explorar esta necesidad',other:'Otro',listening:'Escuchando…',voice_added:'Se agregó el texto de voz.',voice_unavailable:'La función de voz a texto no está disponible en este navegador.',voice_error:'Lellee no pudo escuchar eso. Puedes escribir tu respuesta.',required_need:'Elige un área principal de apoyo.',password_mismatch:'Las contraseñas no coinciden.',legal_required:'Confirma las declaraciones de edad, legales y de seguridad.',account_error:'Lellee no pudo crear la cuenta ni iniciar sesión. Inténtalo de nuevo.',route_error:'Tu cuenta está lista, pero Lellee no pudo terminar la configuración del camino. Puedes continuar a Lellee Home.',fallback_reason:'Este es un lugar práctico para comenzar según el área que elegiste.'
    }
  };

  const topicText={
    es:{
      recovery:['Recuperación','Desarrolla estabilidad y apoyo respecto al consumo de alcohol o sustancias.'],
      reentry:['Regreso a la comunidad','Reconstruye rutinas, documentos, vivienda y trabajo después del encarcelamiento.'],
      caregiving:['Cuidado de un ser querido','Recibe apoyo práctico mientras cuidas a un padre, pareja u otro ser querido.'],
      'housing-stability':['Estabilidad de vivienda','Organiza vivienda, alquiler, beneficios y rutinas estables.'],
      'workforce-reentry':['Trabajo y nuevos comienzos','Prepárate para solicitudes, entrevistas, trabajo y una rutina estable.'],
      grief:['Duelo y vida después de una pérdida','Recupera tu estabilidad después de una muerte, pérdida o cambio importante.'],
      'independent-living':['Vida independiente','Desarrolla habilidades cotidianas, rutinas y confianza.'],
      'family-recovery':['Apoyo familiar','Apoya a tu familia, reconstruye relaciones y ayuda a un ser querido.'],
      'not-sure':['No estoy seguro','Cuéntale a Lellee lo que está pasando y recibe ayuda para encontrar un buen comienzo.']
    }
  };

  const pathFields={
    recovery:[
      {key:'recovery_stage',label:{en:'Where are you in your recovery journey?',es:'¿En qué etapa de recuperación estás?'},options:[['exploring','Exploring / thinking about change','Explorando / pensando en un cambio'],['early','Early recovery','Recuperación temprana'],['building','Building stability','Construyendo estabilidad'],['maintenance','Long-term maintenance','Mantenimiento a largo plazo'],['returning','Returning after a setback','Regresando después de una dificultad'],['other','Other','Otro']]},
      {key:'recovery_approach',label:{en:'Which approach feels closest right now?',es:'¿Qué enfoque se acerca más a lo que deseas ahora?'},options:[['exploring','Exploring','Explorando'],['mixed','Mixed','Mixto'],['12-step','12-Step','12 pasos'],['skills','Skills-based / SMART','Basado en habilidades / SMART'],['therapy','Therapy / counseling','Terapia / consejería'],['medication-supported','Medication-supported','Apoyado con medicamentos'],['other','Other','Otro']]}
    ],
    reentry:[
      {key:'reentry_stage',label:{en:'Where are you in the reentry process?',es:'¿En qué etapa del proceso de reintegración estás?'},options:[['preparing','Preparing for release','Preparándome para salir'],['recent','Recently returned home','Regresé recientemente'],['supervision','Probation or parole','Libertad condicional o supervisión'],['rebuilding','Rebuilding longer-term','Reconstruyendo a largo plazo'],['other','Other','Otro']]},
      {key:'reentry_priority',label:{en:'What needs attention first?',es:'¿Qué necesita atención primero?'},options:[['documents','Documents / identification','Documentos / identificación'],['housing','Housing','Vivienda'],['work','Work','Trabajo'],['recovery','Recovery support','Apoyo de recuperación'],['legal','Legal or supervision needs','Necesidades legales o de supervisión'],['family','Family connection','Conexión familiar'],['other','Other','Otro']]}
    ],
    caregiving:[
      {key:'care_relationship',label:{en:'Who are you caring for?',es:'¿A quién cuidas?'},options:[['parent','Parent','Padre o madre'],['partner','Partner or spouse','Pareja o cónyuge'],['child','Child','Hijo o hija'],['relative','Other relative','Otro familiar'],['friend','Friend','Amigo o amiga'],['other','Other','Otro']]},
      {key:'care_focus',label:{en:'What would help most first?',es:'¿Qué ayudaría más primero?'},options:[['stress','Managing stress','Manejar el estrés'],['respite','Finding a break / respite','Encontrar descanso / relevo'],['services','Finding services','Encontrar servicios'],['planning','Planning and organization','Planificación y organización'],['health','Health-care coordination','Coordinación de atención médica'],['other','Other','Otro']]}
    ],
    'housing-stability':[
      {key:'housing_situation',label:{en:'Which situation is closest?',es:'¿Qué situación se parece más a la tuya?'},options:[['stable-concerned','Housed but concerned','Tengo vivienda pero estoy preocupado'],['behind','Behind on rent or utilities','Atrasado en alquiler o servicios'],['temporary','Temporary or doubled-up housing','Vivienda temporal o compartida'],['shelter','In a shelter or program','En un refugio o programa'],['unhoused','Currently unhoused','Actualmente sin vivienda'],['other','Other','Otro']]},
      {key:'housing_urgency',label:{en:'How soon do you need a next step?',es:'¿Qué tan pronto necesitas un próximo paso?'},options:[['today','Today','Hoy'],['week','Within a week','Dentro de una semana'],['month','Within a month','Dentro de un mes'],['planning','Planning ahead','Planificando con anticipación'],['other','Other','Otro']]}
    ],
    'workforce-reentry':[
      {key:'employment_status',label:{en:'What is your current work situation?',es:'¿Cuál es tu situación laboral actual?'},options:[['working','Currently working','Actualmente trabajando'],['unemployed','Not working','No estoy trabajando'],['returning','Returning after time away','Regresando después de un tiempo'],['training','In school or training','En escuela o capacitación'],['leave','On disability or medical leave','Con licencia médica o por discapacidad'],['other','Other','Otro']]},
      {key:'work_goal',label:{en:'What would help first?',es:'¿Qué ayudaría primero?'},options:[['search','Find job leads','Encontrar oportunidades'],['resume','Resume or application','Currículum o solicitud'],['interview','Interview preparation','Preparación para entrevista'],['routine','Build a work routine','Crear una rutina de trabajo'],['training','Find training','Encontrar capacitación'],['career','Change careers','Cambiar de carrera'],['other','Other','Otro']]}
    ],
    grief:[
      {key:'loss_timeframe',label:{en:'When did the loss or major change happen?',es:'¿Cuándo ocurrió la pérdida o el cambio importante?'},options:[['recent','Recently','Recientemente'],['months','Several months ago','Hace varios meses'],['year','A year or more ago','Hace un año o más'],['ongoing','Ongoing or unclear loss','Pérdida continua o ambigua'],['other','Other','Otro']]},
      {key:'grief_focus',label:{en:'What would help most right now?',es:'¿Qué ayudaría más ahora?'},options:[['daily','Getting through daily life','Manejar la vida diaria'],['support','Finding support','Encontrar apoyo'],['routine','Rebuilding routines','Reconstruir rutinas'],['family','Supporting family','Apoyar a la familia'],['work','Managing work or school','Manejar trabajo o estudios'],['other','Other','Otro']]}
    ],
    'independent-living':[
      {key:'living_focus',label:{en:'Which skill area matters most first?',es:'¿Qué área de habilidades importa más primero?'},options:[['routines','Daily routines','Rutinas diarias'],['money','Money and budgeting','Dinero y presupuesto'],['cooking','Cooking and meals','Cocina y comidas'],['transportation','Transportation','Transporte'],['health','Health appointments','Citas de salud'],['housing','Housing skills','Habilidades de vivienda'],['work-school','Work or school','Trabajo o estudios'],['other','Other','Otro']]},
      {key:'current_support',label:{en:'What support do you have now?',es:'¿Qué apoyo tienes actualmente?'},options:[['independent','Mostly independent','Mayormente independiente'],['family','Family support','Apoyo familiar'],['program','Program or agency support','Apoyo de programa o agencia'],['shared','Shared living support','Apoyo en vivienda compartida'],['other','Other','Otro']]}
    ],
    'family-recovery':[
      {key:'family_role',label:{en:'Which role is closest?',es:'¿Qué rol se parece más al tuyo?'},options:[['supporting','Supporting a loved one','Apoyando a un ser querido'],['rebuilding','Rebuilding a relationship','Reconstruyendo una relación'],['parent','Parent or caregiver','Padre, madre o cuidador'],['partner','Partner or spouse','Pareja o cónyuge'],['other','Other','Otro']]},
      {key:'family_focus',label:{en:'What would help first?',es:'¿Qué ayudaría primero?'},options:[['communication','Communication','Comunicación'],['boundaries','Boundaries','Límites'],['recovery-support','Supporting recovery','Apoyar la recuperación'],['conflict','Managing conflict','Manejar conflictos'],['resources','Finding family resources','Encontrar recursos familiares'],['other','Other','Otro']]}
    ],
    'not-sure':[
      {key:'main_goal',label:{en:'What would feel most useful first?',es:'¿Qué sería más útil primero?'},options:[['stability','Feel more stable','Sentirme más estable'],['options','Understand my options','Entender mis opciones'],['structure','Build daily structure','Crear estructura diaria'],['services','Find services or resources','Encontrar servicios o recursos'],['support','Connect with support','Conectarme con apoyo'],['other','Other','Otro']]}
    ]
  };

  function storageGet(key){try{return localStorage.getItem(key);}catch(_){return null;}}
  function storageSet(key,value){try{localStorage.setItem(key,value);}catch(_){}}
  function sessionSet(key,value){try{sessionStorage.setItem(key,value);}catch(_){}}

  let topics=fallbackTopics.map(normalizeTopic);
  let locale=storageGet('lellee_language') || (navigator.language?.toLowerCase().startsWith('es')?'es':'en');
  let authMode='signup';
  let survey={sessionId:null,token:null,primaryNeed:'',needText:'',context:'',result:null,preview:false};

  const dialog=document.getElementById('journeyDialog');
  const topicGrid=document.getElementById('topicGrid');
  const surveyError=document.getElementById('surveyError');
  const voiceStatus=document.getElementById('voiceStatus');
  const t=(key)=>copy[locale]?.[key] ?? copy.en[key] ?? key;

  function normalizeKey(key){return TOPIC_ALIASES[key] || key;}
  function normalizeTopic(topic){return {...topic,topic_key:normalizeKey(topic.topic_key),description:topic.description || topic.short_description || ''};}
  function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function topicByKey(key){return topics.find(item=>item.topic_key===normalizeKey(key)) || fallbackTopics.find(item=>item.topic_key===normalizeKey(key));}
  function topicLabel(key){const canonical=normalizeKey(key);const translated=topicText[locale]?.[canonical];return translated?.[0] || topicByKey(canonical)?.label || canonical;}
  function topicDescription(key){const canonical=normalizeKey(key);const translated=topicText[locale]?.[canonical];return translated?.[1] || topicByKey(canonical)?.description || '';}
  function topicIcon(topic){return icons[topic?.icon_key] || icons[topic?.topic_key] || icons.default;}
  function availabilityText(topic){if(topic.availability==='available' || topic.status==='active')return t('available');if(topic.availability==='coming_soon' || topic.status==='planned')return t('coming');return t('explore');}

  function applyLanguage(nextLocale){
    locale=nextLocale==='es'?'es':'en';
    storageSet('lellee_language',locale);
    document.documentElement.lang=locale;
    document.querySelectorAll('[data-i18n]').forEach(el=>{const value=t(el.dataset.i18n);if(value!==undefined)el.textContent=value;});
    document.querySelectorAll('[data-i18n-html]').forEach(el=>{const value=t(el.dataset.i18nHtml);if(value!==undefined)el.innerHTML=value;});
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const value=t(el.dataset.i18nPlaceholder);if(value!==undefined)el.placeholder=value;});
    const select=document.getElementById('languageSelect');if(select)select.value=locale;
    renderTopics();
    buildPrimaryNeedSelect(survey.primaryNeed || document.getElementById('primaryNeed')?.value || '');
    if(!document.querySelector('[data-step="account"]')?.classList.contains('hidden'))buildPathIntake();
    updateAuthModeUI();
  }

  function renderTopics(){
    if(!topicGrid)return;
    topicGrid.innerHTML='';
    const visible=TOPIC_ORDER.filter(key=>key!=='not-sure').map(topicByKey).filter(Boolean).slice(0,6);
    visible.forEach((topic,index)=>{
      const button=document.createElement('button');
      button.type='button';button.className=`support-card tone-${index%6}`;button.dataset.topicKey=topic.topic_key;
      button.innerHTML=`<span class="support-icon">${topicIcon(topic)}</span><h3>${escapeHtml(topicLabel(topic.topic_key))}</h3><p>${escapeHtml(topicDescription(topic.topic_key))}</p><span class="card-action">${escapeHtml(availabilityText(topic))}</span>`;
      button.addEventListener('click',()=>openSurveyWithTopic(topic.topic_key));
      topicGrid.appendChild(button);
    });
  }

  async function loadTopics(){
    if(!sb){renderTopics();return;}
    try{
      const {data,error}=await sb.rpc('get_public_support_topics');
      if(error)throw error;
      if(Array.isArray(data)&&data.length){
        const normalized=data.map(normalizeTopic);
        const merged=new Map(fallbackTopics.map(item=>[item.topic_key,normalizeTopic(item)]));
        normalized.forEach(item=>merged.set(item.topic_key,{...merged.get(item.topic_key),...item}));
        topics=[...merged.values()];
      }
    }catch(error){console.warn('Using Lellee support-topic fallback.',error?.message||error);}
    renderTopics();
  }

  function buildPrimaryNeedSelect(selected=''){
    const select=document.getElementById('primaryNeed');if(!select)return;
    const value=normalizeKey(selected || select.value || '');
    select.innerHTML=`<option value="">${escapeHtml(t('choose_one'))}</option>`;
    TOPIC_ORDER.forEach(key=>{
      const option=document.createElement('option');option.value=key;option.textContent=topicLabel(key);select.appendChild(option);
    });
    select.value=TOPIC_ORDER.includes(value)?value:'';
    document.getElementById('needNext').disabled=!select.value;
  }

  function referralFromUrl(){const url=new URL(location.href);return url.searchParams.get('ref')||url.searchParams.get('referral')||'';}
  async function ensureSurveySession(){
    if(survey.sessionId&&survey.token)return true;
    if(!sb){survey.preview=true;survey.sessionId='preview';survey.token='preview';return true;}
    clearError();
    try{
      const {data,error}=await sb.rpc('create_journey_survey_session',{p_source:'landing',p_referral_code:referralFromUrl()||null});
      if(error)throw error;
      survey.sessionId=data?.session_id;survey.token=data?.session_token;
      sessionSet('lelleeJourneySurvey',JSON.stringify({session_id:survey.sessionId,session_token:survey.token}));
      return Boolean(survey.sessionId&&survey.token);
    }catch(error){console.error(error);showError(locale==='es'?'Lellee no pudo iniciar las preguntas. Inténtalo de nuevo.':'Lellee could not start the questions right now. Please try again.');return false;}
  }

  function showStep(name){
    clearError();
    document.querySelectorAll('.survey-step').forEach(section=>section.classList.toggle('hidden',section.dataset.step!==name));
    const progress={intro:8,need:34,context:62,result:80,account:94,confirmation:100}[name]||8;
    const bar=document.getElementById('surveyProgressBar');if(bar)bar.style.width=`${progress}%`;
    dialog?.scrollTo({top:0,behavior:'smooth'});
  }

  function resetJourney(){
    survey.primaryNeed='';survey.needText='';survey.context='';survey.result=null;
    const need=document.getElementById('needText');if(need)need.value='';
    const context=document.getElementById('surveyContext');if(context)context.value='';
    const note=document.getElementById('pathIntakeNote');if(note)note.value='';
    buildPrimaryNeedSelect('');
  }

  function openSurvey(){resetJourney();dialog?.showModal();showStep('intro');}
  async function openSurveyWithTopic(key){
    resetJourney();survey.primaryNeed=normalizeKey(key);dialog?.showModal();await ensureSurveySession();buildPrimaryNeedSelect(survey.primaryNeed);showStep('need');
  }

  async function saveAnswer(stepKey,answer,containsFreeText=false){
    if(survey.preview||!sb)return true;
    try{
      const {error}=await sb.rpc('save_journey_survey_answer',{p_session_id:survey.sessionId,p_session_token:survey.token,p_step_key:stepKey,p_answer:answer,p_contains_free_text:Boolean(containsFreeText)});
      if(error)throw error;return true;
    }catch(error){console.error(error);showError(locale==='es'?'Lellee no pudo guardar esa respuesta. Inténtalo de nuevo.':'Lellee could not save that answer. Please try again.');return false;}
  }

  async function createRecommendation(){
    if(!(await ensureSurveySession()))return;
    const button=document.getElementById('contextNext');const working=document.getElementById('surveyWorking');
    button.disabled=true;working.classList.remove('hidden');clearError();
    try{
      const primary=normalizeKey(survey.primaryNeed || document.getElementById('primaryNeed').value);
      survey.primaryNeed=primary;
      survey.needText=document.getElementById('needText').value.trim();
      survey.context=document.getElementById('surveyContext').value.trim();
      if(!primary){showError(t('required_need'));showStep('need');return;}

      await saveAnswer('needs',{topics:[primary]},false);
      await saveAnswer('priority',{topic_key:primary==='not-sure'?'':primary},false);
      await saveAnswer('support_style',{style:'guided'},false);
      const combined=[survey.needText,survey.context].filter(Boolean).join('\n\n');
      if(combined){
        await saveAnswer('context',{text:combined},true);
        if(sb&&!survey.preview){try{await sb.rpc('preview_journey_text_route',{p_text:combined});}catch(_){}}
      }

      let result=null;
      if(sb&&!survey.preview){
        try{
          const {data,error}=await sb.rpc('recommend_journey_route',{p_session_id:survey.sessionId,p_session_token:survey.token});
          if(error)throw error;result=data;
        }catch(error){console.warn('Using selected-path recommendation.',error?.message||error);}
      }
      const fallbackKey=primary==='not-sure'?'recovery':primary;
      survey.result=result || {primary_topic_key:fallbackKey,primary_label:topicLabel(fallbackKey),reason:t('fallback_reason'),related_topic_keys:[]};
      renderResult();showStep('result');
    }catch(error){console.error(error);showError(locale==='es'?'Lellee no pudo crear la recomendación. Inténtalo de nuevo.':'Lellee could not create your recommendation right now. Please try again.');}
    finally{button.disabled=false;working.classList.add('hidden');}
  }

  function renderResult(){
    const result=survey.result||{};
    const primary=normalizeKey(result.primary_topic_key||survey.primaryNeed||'not-sure');
    survey.result={...result,primary_topic_key:primary};
    document.getElementById('resultPrimary').textContent=result.primary_label&&locale==='en'?result.primary_label:topicLabel(primary);
    document.getElementById('resultReason').textContent=result.reason||t('fallback_reason');
    const relatedKeys=(Array.isArray(result.related_topic_keys)?result.related_topic_keys:[]).map(normalizeKey).filter(key=>key!==primary).slice(0,1);
    const wrap=document.getElementById('resultRelatedWrap');const related=document.getElementById('resultRelated');related.innerHTML='';
    relatedKeys.forEach(key=>{const pill=document.createElement('span');pill.textContent=topicLabel(key);related.appendChild(pill);});
    wrap.classList.toggle('hidden',relatedKeys.length===0);
  }

  function fieldDefinitionForPath(){const key=normalizeKey(survey.result?.primary_topic_key||survey.primaryNeed||'not-sure');return pathFields[key]||pathFields['not-sure'];}
  function buildPathIntake(){
    const primary=normalizeKey(survey.result?.primary_topic_key||survey.primaryNeed||'not-sure');
    document.getElementById('accountPathLabel').textContent=topicLabel(primary);
    const wrap=document.getElementById('pathIntakeFields');wrap.innerHTML='';
    fieldDefinitionForPath().forEach(def=>{
      const label=document.createElement('label');label.className='intake-field';label.dataset.key=def.key;
      const text=document.createElement('span');text.textContent=def.label[locale]||def.label.en;label.appendChild(text);
      const select=document.createElement('select');select.className='intake-select';select.dataset.intakeKey=def.key;
      const blank=document.createElement('option');blank.value='';blank.textContent=t('choose_one');select.appendChild(blank);
      def.options.forEach(([value,en,es])=>{const option=document.createElement('option');option.value=value;option.textContent=locale==='es'?es:en;select.appendChild(option);});
      label.appendChild(select);
      const other=document.createElement('input');other.className='intake-other hidden';other.dataset.otherFor=def.key;other.maxLength=160;other.placeholder=t('other');label.appendChild(other);
      select.addEventListener('change',()=>other.classList.toggle('hidden',select.value!=='other'));
      wrap.appendChild(label);
    });
  }

  function collectPathIntake(){
    const details={};
    document.querySelectorAll('.intake-select').forEach(select=>{
      const key=select.dataset.intakeKey;details[key]=select.value||null;
      if(select.value==='other'){details[`${key}_other`]=document.querySelector(`[data-other-for="${CSS.escape(key)}"]`)?.value.trim()||null;}
    });
    details.note=document.getElementById('pathIntakeNote').value.trim()||null;
    details.language=locale;
    details.topic_key=normalizeKey(survey.result?.primary_topic_key||survey.primaryNeed||'not-sure');
    return details;
  }

  function updateAuthModeUI(){
    document.querySelectorAll('[data-auth-mode]').forEach(button=>button.classList.toggle('active',button.dataset.authMode===authMode));
    const signup=authMode==='signup';
    document.getElementById('signupOnlyFields').classList.toggle('hidden',!signup);
    document.querySelector('.signup-confirm-field').classList.toggle('hidden',!signup);
    document.getElementById('accountLegal').classList.toggle('hidden',!signup);
    document.getElementById('accountTitle').textContent=signup?t('account_title'):t('sign_in');
    document.getElementById('accountSubmit').textContent=signup?t('create_and_continue'):t('sign_in_continue');
    document.getElementById('accountPassword').autocomplete=signup?'new-password':'current-password';
  }

  function buildAppUrl(){
    const url=new URL('/app',location.origin);const primary=normalizeKey(survey.result?.primary_topic_key||survey.primaryNeed||'not-sure');
    url.searchParams.set('welcome','1');url.searchParams.set('recommended',primary);url.searchParams.set('language',locale);
    if(survey.sessionId&&survey.sessionId!=='preview')url.searchParams.set('journeySurvey',survey.sessionId);
    if(survey.token&&survey.token!=='preview')url.searchParams.set('journeyToken',survey.token);
    return url;
  }

  async function finalizeSelectedPath(){
    if(!sb||survey.preview){location.assign(buildAppUrl().toString());return;}
    const intake=collectPathIntake();
    const displayName=authMode==='signup'?document.getElementById('accountName').value.trim():null;
    try{await sb.rpc('claim_journey_survey_session',{p_session_id:survey.sessionId,p_session_token:survey.token});}catch(error){console.warn('Survey claim:',error?.message||error);}
    try{await sb.rpc('accept_journey_route',{p_session_id:survey.sessionId,p_session_token:survey.token});}catch(error){console.warn('Route accept:',error?.message||error);}
    try{await sb.rpc('save_journey_account_intake',{p_topic_key:intake.topic_key,p_language_code:locale,p_display_name:displayName||null,p_intake_data:intake,p_survey_session_id:survey.sessionId});}catch(error){console.warn('Path intake save:',error?.message||error);}
    try{await sb.rpc('start_selected_support_path',{p_topic_key:normalizeKey(survey.result?.primary_topic_key||survey.primaryNeed)});}catch(error){console.warn('Path start:',error?.message||error);}
    location.assign(buildAppUrl().toString());
  }

  async function submitAccount(event){
    event.preventDefault();clearError();
    if(!sb){showError(t('account_error'));return;}
    const email=document.getElementById('accountEmail').value.trim();const password=document.getElementById('accountPassword').value;
    const confirm=document.getElementById('accountPasswordConfirm').value;const working=document.getElementById('accountWorking');const submit=document.getElementById('accountSubmit');
    if(authMode==='signup'&&password!==confirm){showError(t('password_mismatch'));return;}
    if(authMode==='signup'&&(!document.getElementById('accountAdult').checked||!document.getElementById('accountTerms').checked||!document.getElementById('accountSafety').checked)){showError(t('legal_required'));return;}
    if(!(await ensureSurveySession()))return;
    submit.disabled=true;working.classList.remove('hidden');
    try{
      const intake=collectPathIntake();
      await saveAnswer('path_intake',intake,Boolean(intake.note));
      const pending={session_id:survey.sessionId,session_token:survey.token,topic_key:intake.topic_key,language:locale};
      storageSet('lellee_pending_journey',JSON.stringify(pending));
      const redirect=buildAppUrl().toString();
      if(authMode==='signup'){
        const name=document.getElementById('accountName').value.trim();
        const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:redirect,data:{display_name:name,preferred_language:locale,starting_topic_key:intake.topic_key,journey_survey_session_id:survey.sessionId,journey_survey_token:survey.token,pathway_intake:intake}}});
        if(error)throw error;
        if(data?.session){await finalizeSelectedPath();return;}
        document.getElementById('confirmationContinue').href=redirect;
        document.getElementById('confirmationMessage').textContent=t('check_email_body');
        showStep('confirmation');
      }else{
        const {data,error}=await sb.auth.signInWithPassword({email,password});
        if(error)throw error;
        if(data?.session){await finalizeSelectedPath();return;}
        throw new Error('No session returned.');
      }
    }catch(error){console.error(error);showError(error?.message||t('account_error'));}
    finally{submit.disabled=false;working.classList.add('hidden');}
  }

  function startVoice(targetId,button){
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){showVoice(t('voice_unavailable'));return;}
    const target=document.getElementById(targetId);if(!target)return;
    const recognition=new Recognition();recognition.lang=locale==='es'?'es-US':'en-US';recognition.interimResults=false;recognition.maxAlternatives=1;
    button.classList.add('listening');showVoice(t('listening'));
    recognition.onresult=(event)=>{const transcript=event.results?.[0]?.[0]?.transcript?.trim();if(transcript){target.value=[target.value.trim(),transcript].filter(Boolean).join(target.value.trim()?' ':'');target.dispatchEvent(new Event('input',{bubbles:true}));showVoice(t('voice_added'));}};
    recognition.onerror=()=>showVoice(t('voice_error'));
    recognition.onend=()=>button.classList.remove('listening');
    recognition.start();
  }

  function showVoice(message){voiceStatus.textContent=message;voiceStatus.classList.remove('hidden');clearTimeout(showVoice.timer);showVoice.timer=setTimeout(()=>voiceStatus.classList.add('hidden'),3500);}
  function showError(message){surveyError.textContent=message;surveyError.classList.remove('hidden');}
  function clearError(){surveyError.textContent='';surveyError.classList.add('hidden');}

  document.getElementById('menuToggle')?.addEventListener('click',event=>{const nav=document.getElementById('siteNav');nav.classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',nav.classList.contains('open')?'true':'false');});
  document.getElementById('languageSelect')?.addEventListener('change',event=>applyLanguage(event.target.value));
  document.querySelectorAll('[data-start-survey]').forEach(element=>element.addEventListener('click',openSurvey));
  document.getElementById('surveyClose')?.addEventListener('click',()=>dialog.close());
  document.getElementById('surveyBegin')?.addEventListener('click',async()=>{await ensureSurveySession();buildPrimaryNeedSelect(survey.primaryNeed);showStep('need');});
  document.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>showStep(button.dataset.back)));
  document.getElementById('primaryNeed')?.addEventListener('change',event=>{survey.primaryNeed=normalizeKey(event.target.value);document.getElementById('needNext').disabled=!event.target.value;});
  document.getElementById('needNext')?.addEventListener('click',()=>{if(!document.getElementById('primaryNeed').value){showError(t('required_need'));return;}survey.primaryNeed=normalizeKey(document.getElementById('primaryNeed').value);survey.needText=document.getElementById('needText').value.trim();showStep('context');});
  document.getElementById('contextNext')?.addEventListener('click',createRecommendation);
  document.getElementById('choosePath')?.addEventListener('click',()=>{buildPathIntake();authMode='signup';updateAuthModeUI();showStep('account');});
  document.getElementById('exploreAgain')?.addEventListener('click',()=>{buildPrimaryNeedSelect(survey.primaryNeed);showStep('need');});
  document.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>{authMode=button.dataset.authMode;updateAuthModeUI();clearError();}));
  document.getElementById('journeyAuthForm')?.addEventListener('submit',submitAccount);
  document.addEventListener('click',event=>{const button=event.target.closest('[data-voice-target]');if(button)startVoice(button.dataset.voiceTarget,button);});

  applyLanguage(locale);
  loadTopics();
})();
