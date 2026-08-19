(() => {
  'use strict';
  const client = typeof sb !== 'undefined' ? sb : null;
  const PAGE_KEY='lellee:last-page:v2';
  const CATEGORY_KEY='lellee:last-nav-category:v2';
  const PREF_CACHE='lellee:platform-preferences:v6';
  const LANGUAGE_CHOICE_KEY='lellee:explicit-language-choice:v6';
  const embeddedSpanishByKey={"nav.daily":"Diario","nav.grow":"Crecer y aprender","nav.connect":"Conectar","nav.reflect":"Reflexionar y registrar","nav.support":"Encontrar apoyo","nav.account":"Cuenta","nav.today":"Hoy","nav.for_you":"Para ti","nav.my_recovery":"Mi recuperación","nav.learn":"Aprender","nav.expert_guided":"Prácticas guiadas por expertos","nav.tools":"Herramientas","nav.recovery_paths":"Caminos de recuperación","nav.meetings":"Reuniones","nav.community":"Comunidad","nav.journal":"Diario","nav.progress":"Progreso","nav.calendar":"Calendario","nav.resources":"Recursos","nav.inbox":"Bandeja de entrada","nav.workspaces":"Espacios de trabajo","nav.search":"Buscar","nav.plus":"Lellee Plus","nav.settings":"Configuración","nav.help":"Ayuda","nav.language":"Idioma y accesibilidad","nav.release":"Preparación para lanzamiento","common.save":"Guardar","common.edit":"Editar","common.delete":"Eliminar","common.cancel":"Cancelar","common.close":"Cerrar","common.open":"Abrir","common.add":"Agregar","common.create":"Crear","common.continue":"Continuar","common.back":"Atrás","common.refresh":"Actualizar","common.sign_out":"Cerrar sesión","common.loading":"Manteniendo Lellee sincronizado…","today.guided":"Recuperación guiada de hoy","today.help":"Ayúdame ahora","today.get_help":"Obtener ayuda ahora","today.rings":"Círculos de recuperación","today.upcoming":"Próximamente","today.inspiration":"Inspiración de hoy","today.checkin":"Registro","today.focus":"Enfoque diario","today.gratitude":"Gratitud","today.action":"Acción de recuperación","today.reflection":"Reflexión de la noche","platform.title":"Idioma y accesibilidad","platform.subtitle":"Elige cómo Lellee se comunica y muestra la información para ti.","platform.language":"Idioma de la interfaz","platform.timezone":"Zona horaria","platform.text_size":"Tamaño del texto","platform.reduced_motion":"Reducir movimiento y animación","platform.voice":"Mostrar controles de voz a texto","platform.interface_translation":"Traducir la interfaz de Lellee","platform.user_translation":"Ofrecer traducción de mis propios escritos solo cuando la solicite","platform.privacy_title":"Idioma y privacidad","platform.privacy_text":"Tus diarios y otros escritos personales permanecen en el idioma que usaste. Lellee no traduce ni comparte esos escritos automáticamente.","platform.save":"Guardar idioma y accesibilidad","platform.saved":"Configuración de idioma y accesibilidad guardada.","platform.english":"Inglés","platform.spanish":"Español","platform.normal":"Estándar","platform.large":"Grande","platform.larger":"Más grande","release.title":"Integración de plataforma y preparación para lanzamiento","release.subtitle":"Las seis compilaciones están instaladas. Las revisiones finales de calidad siguen separadas y no se han marcado como completas.","release.refresh":"Actualizar revisiones","release.export":"Exportar informe de calidad","professional.hub":"Centro profesional","professional.training":"Centro de capacitación","professional.staff":"Espacio de trabajo del coach empleado","professional.business":"Constructor de negocio","professional.social":"Agente de redes sociales","messages.success":"Guardado correctamente.","messages.error":"Algo requiere atención. Inténtalo de nuevo."};
  const embeddedSpanishByEnglish={"Daily":"Diario","Grow & Learn":"Crecer y aprender","Connect":"Conectar","Reflect & Track":"Reflexionar y registrar","Find Support":"Encontrar apoyo","Account":"Cuenta","Today":"Hoy","For You":"Para ti","My Recovery":"Mi recuperación","Learn":"Aprender","Expert-Guided Practices":"Prácticas guiadas por expertos","Tools":"Herramientas","Recovery Paths":"Caminos de recuperación","Meetings":"Reuniones","Community":"Comunidad","Journal":"Diario","Progress":"Progreso","Calendar":"Calendario","Resources":"Recursos","Inbox":"Bandeja de entrada","Workspaces":"Espacios de trabajo","Search":"Buscar","Settings":"Configuración","Help":"Ayuda","Language & Accessibility":"Idioma y accesibilidad","Release Readiness":"Preparación para lanzamiento","Save":"Guardar","Edit":"Editar","Delete":"Eliminar","Cancel":"Cancelar","Close":"Cerrar","Open":"Abrir","Add":"Agregar","Create":"Crear","Continue":"Continuar","Back":"Atrás","Refresh":"Actualizar","Sign out":"Cerrar sesión","Keeping Lellee in sync…":"Manteniendo Lellee sincronizado…","Today's Guided Recovery":"Recuperación guiada de hoy","Help Me Right Now":"Ayúdame ahora","Get Help Now":"Obtener ayuda ahora","Recovery Rings":"Círculos de recuperación","Upcoming":"Próximamente","Today's Inspiration":"Inspiración de hoy","Check-In":"Registro","Daily Focus":"Enfoque diario","Gratitude":"Gratitud","Recovery Action":"Acción de recuperación","Evening Reflection":"Reflexión de la noche","Choose how Lellee communicates and displays information for you.":"Elige cómo Lellee se comunica y muestra la información para ti.","Interface language":"Idioma de la interfaz","Time zone":"Zona horaria","Text size":"Tamaño del texto","Reduce motion and animation":"Reducir movimiento y animación","Show speech-to-text controls":"Mostrar controles de voz a texto","Translate the Lellee interface":"Traducir la interfaz de Lellee","Offer translation for my own writing only when I request it":"Ofrecer traducción de mis propios escritos solo cuando la solicite","Language and privacy":"Idioma y privacidad","Your journals and other personal writing stay in the language you used. Lellee does not translate or share that writing automatically.":"Tus diarios y otros escritos personales permanecen en el idioma que usaste. Lellee no traduce ni comparte esos escritos automáticamente.","Save Language & Accessibility":"Guardar idioma y accesibilidad","Language and accessibility settings saved.":"Configuración de idioma y accesibilidad guardada.","English":"Inglés","Spanish":"Español","Standard":"Estándar","Large":"Grande","Larger":"Más grande","Platform Integration & Release Readiness":"Integración de plataforma y preparación para lanzamiento","All six builds are installed. Final quality checks remain separate and have not been marked complete.":"Las seis compilaciones están instaladas. Las revisiones finales de calidad siguen separadas y no se han marcado como completas.","Refresh Checks":"Actualizar revisiones","Export QA Report":"Exportar informe de calidad","Professional Hub":"Centro profesional","Training Center":"Centro de capacitación","Staff Coach Workspace":"Espacio de trabajo del coach empleado","Business Builder":"Constructor de negocio","Social Media Agent":"Agente de redes sociales","Saved successfully.":"Guardado correctamente.","Something needs attention. Please try again.":"Algo requiere atención. Inténtalo de nuevo."};
  const exactSpanish={"Daily": "Diario", "Grow & Learn": "Crecer y aprender", "Connect": "Conectar", "Reflect & Track": "Reflexionar y registrar", "Find Support": "Encontrar apoyo", "Account": "Cuenta", "Today": "Hoy", "For You": "Para ti", "My Recovery": "Mi recuperación", "Learn": "Aprender", "Expert-Guided Practices": "Prácticas guiadas por expertos", "Tools": "Herramientas", "Recovery Paths": "Caminos de recuperación", "Meetings": "Reuniones", "Community": "Comunidad", "Journal": "Diario", "Progress": "Progreso", "Calendar": "Calendario", "Resources": "Recursos", "Inbox": "Bandeja de entrada", "Workspaces": "Espacios de trabajo", "Search": "Buscar", "Settings": "Configuración", "Help": "Ayuda", "Language & Accessibility": "Idioma y accesibilidad", "Release Readiness": "Preparación para lanzamiento", "Save": "Guardar", "Edit": "Editar", "Delete": "Eliminar", "Cancel": "Cancelar", "Close": "Cerrar", "Open": "Abrir", "Add": "Agregar", "Create": "Crear", "Continue": "Continuar", "Back": "Atrás", "Refresh": "Actualizar", "Sign out": "Cerrar sesión", "Today's Guided Recovery": "Recuperación guiada de hoy", "Help Me Right Now": "Ayúdame ahora", "Get Help Now": "Obtener ayuda ahora", "Recovery Rings": "Círculos de recuperación", "Upcoming": "Próximamente", "Today's Inspiration": "Inspiración de hoy", "Check-In": "Registro", "Daily Focus": "Enfoque diario", "Gratitude": "Gratitud", "Recovery Action": "Acción de recuperación", "Evening Reflection": "Reflexión de la noche", "Professional Hub": "Centro profesional", "Training Center": "Centro de capacitación", "Staff Coach Workspace": "Espacio de trabajo del coach empleado", "Business Builder": "Constructor de negocio", "Social Media Agent": "Agente de redes sociales", "Notification Settings": "Configuración de notificaciones", "Account & Privacy": "Cuenta y privacidad", "Recovery News": "Noticias de recuperación", "Saved": "Guardado", "My Insights": "Mis perspectivas", "Milestones": "Hitos", "Then & Now": "Antes y ahora", "Recovery Story": "Historia de recuperación", "Weekly Review": "Revisión semanal", "Monthly Review": "Revisión mensual", "Free": "Gratis", "Plus": "Plus", "Premium": "Premium", "Other": "Otro", "Relationship": "Relación", "Format": "Formato", "Location or link": "Ubicación o enlace", "Meeting Name": "Nombre de la reunión", "Save Meeting": "Guardar reunión", "Add Person": "Agregar persona", "Save Person": "Guardar persona"};
  const placeholderSpanish={"Search Lellee": "Buscar en Lellee", "Write here…": "Escribe aquí…", "What is going on right now?": "¿Qué está pasando ahora?", "Add a routine": "Agregar una rutina", "Add a warning sign": "Agregar una señal de alerta", "Add a trigger": "Agregar un desencadenante", "Add a coping step": "Agregar una estrategia", "Add a person": "Agregar una persona"};
  Object.assign(exactSpanish,embeddedSpanishByEnglish);
  const state={
    user:null,preferences:{language_code:'en',locale_code:'en-US',timezone:'America/Los_Angeles',text_scale:1,reduced_motion:false,speech_to_text_enabled:true,interface_translation_enabled:true,user_content_translation_enabled:false},
    membership:{service_tier:'free',status:'active'},entitlements:[],translations:{...embeddedSpanishByKey},locales:[],readiness:null,isAdmin:false,translating:false
  };
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const escapeHtml=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const text=(key,fallback='')=>state.translations?.[key]||fallback;
  const tierRank=t=>t==='premium'?3:t==='plus'?2:1;

  function toast(message,type=''){
    const el=$('#globalToast');
    if(el){el.textContent=message;el.dataset.type=type;el.classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add('hidden'),3300);return;}
    const node=document.createElement('div');node.className='prod-toast';node.dataset.type=type;node.textContent=message;document.body.appendChild(node);setTimeout(()=>node.remove(),3300);
  }
  function message(target,value,type=''){const el=typeof target==='string'?$(target):target;if(!el)return;el.textContent=value||'';if(type)el.dataset.type=type;else delete el.dataset.type;}

  function installNetworkFeedback(){
    if($('#b6NetworkBar'))return;
    const bar=document.createElement('div');bar.id='b6NetworkBar';bar.className='b6-network-bar';document.body.appendChild(bar);
    const pill=document.createElement('div');pill.id='b6ConnectionPill';pill.className='b6-connection-pill hidden';document.body.appendChild(pill);
    let pending=0,timer;
    const original=window.fetch.bind(window);
    window.fetch=async(...args)=>{
      pending++;clearTimeout(timer);timer=setTimeout(()=>{if(pending>0)bar.classList.add('active')},220);
      try{return await original(...args)}finally{pending=Math.max(0,pending-1);if(!pending){clearTimeout(timer);bar.classList.remove('active')}}
    };
    const update=()=>{
      if(navigator.onLine){pill.textContent=state.preferences.language_code==='es'?'Conectado':'Online';pill.className='b6-connection-pill';setTimeout(()=>pill.classList.add('hidden'),1600)}
      else{pill.textContent=state.preferences.language_code==='es'?'Sin conexión · Lellee sincronizará más tarde':'Offline · Lellee will sync later';pill.className='b6-connection-pill offline'}
    };
    window.addEventListener('online',update);window.addEventListener('offline',update);if(!navigator.onLine)update();
  }

  function installPages(){
    const content=$('.content');if(!content||$('#page-language-accessibility'))return;
    content.insertAdjacentHTML('beforeend',`
      <section class="page" id="page-language-accessibility"><div class="b6-page">
        <div class="b6-page-head"><div><span class="b6-kicker" data-b6-i18n="platform.title">LANGUAGE & ACCESSIBILITY</span><h2 data-b6-i18n="platform.title">Language & Accessibility</h2><p data-b6-i18n="platform.subtitle">Choose how Lellee communicates and displays information for you.</p></div><button class="b6-link" data-page="settings">← Settings</button></div>
        <div class="b6-grid">
          <article class="b6-card b6-card-wide"><div class="b6-form-grid">
            <label><span data-b6-i18n="platform.language">Interface language</span><select id="b6Language"><option value="en">English</option><option value="es">Español</option></select></label>
            <label><span data-b6-i18n="platform.timezone">Time zone</span><select id="b6Timezone"><option value="America/Los_Angeles">Pacific</option><option value="America/Denver">Mountain</option><option value="America/Phoenix">Arizona</option><option value="America/Chicago">Central</option><option value="America/New_York">Eastern</option><option value="America/Anchorage">Alaska</option><option value="Pacific/Honolulu">Hawaii</option><option value="UTC">UTC</option></select></label>
            <label><span data-b6-i18n="platform.text_size">Text size</span><select id="b6TextScale"><option value="1">Standard</option><option value="1.12">Large</option><option value="1.25">Larger</option></select></label>
            <div></div>
            <label class="b6-check"><input id="b6ReducedMotion" type="checkbox"><span data-b6-i18n="platform.reduced_motion">Reduce motion and animation</span></label>
            <label class="b6-check"><input id="b6Voice" type="checkbox"><span data-b6-i18n="platform.voice">Show speech-to-text controls</span></label>
            <label class="b6-check"><input id="b6InterfaceTranslation" type="checkbox"><span data-b6-i18n="platform.interface_translation">Translate the Lellee interface</span></label>
            <label class="b6-check"><input id="b6UserTranslation" type="checkbox"><span data-b6-i18n="platform.user_translation">Offer translation for my own writing only when I request it</span></label>
          </div><div class="b6-actions"><button class="b6-primary" id="b6SavePreferences" data-b6-i18n="platform.save">Save Language & Accessibility</button></div><div class="b6-message" id="b6PreferenceMsg"></div></article>
          <article class="b6-privacy-note b6-card-wide"><b data-b6-i18n="platform.privacy_title">Language and privacy</b><br><span data-b6-i18n="platform.privacy_text">Your journals and other personal writing stay in the language you used. Lellee does not translate or share that writing automatically.</span></article>
          <article class="b6-card"><span class="b6-kicker">SERVICE ACCESS</span><h3>Guidance follows your service level</h3><p>Safety-critical guidance remains available to everyone. Structured and personalized practices follow Plus, Premium, and add-on entitlements.</p><div class="b6-tier-row"><div class="b6-tier"><b>Free</b><small>Foundations and safety</small></div><div class="b6-tier"><b>Plus</b><small>Structured practice</small></div><div class="b6-tier"><b>Premium</b><small>Personalized sequences</small></div></div></article>
          <article class="b6-card"><span class="b6-kicker">CURRENT ACCOUNT</span><h3 id="b6TierTitle">Free</h3><p id="b6TierText">Your effective access is calculated from membership and active add-ons.</p></article>
        </div>
      </div></section>
      <section class="page" id="page-release-readiness"><div class="b6-page">
        <div class="b6-page-head"><div><span class="b6-kicker">BUILD 6</span><h2 data-b6-i18n="release.title">Platform Integration & Release Readiness</h2><p data-b6-i18n="release.subtitle">All six builds are installed. Final quality checks remain separate and have not been marked complete.</p></div><div class="b6-actions"><button class="b6-secondary" id="b6RefreshChecks" data-b6-i18n="release.refresh">Refresh Checks</button><button class="b6-primary" id="b6ExportReport" data-b6-i18n="release.export">Export QA Report</button></div></div>
        <div class="b6-summary" id="b6Summary"></div><div class="b6-check-list" id="b6CheckList"></div><div class="b6-message" id="b6ReleaseMsg"></div>
      </div></section>`);
  }

  function installNav(){
    const account=$('.nav-category[data-category="account"] .nav-category-items-inner');if(!account)return false;
    if(!account.querySelector('[data-page="language-accessibility"]')){
      const button=document.createElement('button');button.type='button';button.className='nav-item';button.dataset.page='language-accessibility';button.innerHTML='<span class="nav-icon">◎</span><span data-b6-i18n="nav.language">Language & Accessibility</span>';const settings=account.querySelector('[data-page="settings"]');account.insertBefore(button,settings||null);
    }
    if(state.isAdmin&&!account.querySelector('[data-page="release-readiness"]')){
      const button=document.createElement('button');button.type='button';button.className='nav-item';button.dataset.page='release-readiness';button.innerHTML='<span class="nav-icon">✓</span><span data-b6-i18n="nav.release">Release Readiness</span>';account.appendChild(button);
    }
    return true;
  }

  function openAccountCategory(){
    const account=$('.nav-category[data-category="account"]');if(!account)return;
    $$('.nav-category').forEach(group=>{const open=group===account;group.classList.toggle('open',open);group.querySelector('.nav-category-toggle')?.setAttribute('aria-expanded',String(open))});
    localStorage.setItem(CATEGORY_KEY,'account');
  }
  function navigate(page){
    const target=$(`#page-${CSS.escape(page)}`);if(!target)return false;
    if(typeof showPage==='function')showPage(page);else{$$('.page').forEach(p=>p.classList.remove('active'));target.classList.add('active');window.scrollTo({top:0,behavior:'auto'})}
    localStorage.setItem(PAGE_KEY,page);if(['language-accessibility','release-readiness'].includes(page))openAccountCategory();
    if(page==='language-accessibility')renderPreferences();if(page==='release-readiness')renderReadiness();return true;
  }

  function applyPreferenceState(){
    const p=state.preferences||{};const lang=p.interface_translation_enabled===false?'en':(p.language_code||'en');
    document.documentElement.lang=lang;document.documentElement.dir='ltr';
    document.documentElement.style.fontSize=`${16*Number(p.text_scale||1)}px`;
    document.documentElement.classList.toggle('b6-reduced-motion',!!p.reduced_motion);
    document.body.classList.toggle('b6-voice-off',p.speech_to_text_enabled===false);
    document.body.classList.toggle('b6-large-text',Number(p.text_scale||1)>1.05);
    try{localStorage.setItem(PREF_CACHE,JSON.stringify(p))}catch(_e){}
    applyTranslations();updateLocalDates();renderPreferences();

    // Build 6 is the canonical interface-language source. Notify compatibility
    // layers so older language code cannot silently switch the app back to English.
    try{
      window.dispatchEvent(new CustomEvent('lellee:language-changed',{
        detail:{language_code:lang,locale_code:p.locale_code||(lang==='es'?'es-US':'en-US')}
      }));
    }catch(_e){}
    try{
      window.LelleeFinalRepair?.applyLocale?.(lang==='es'?'es-US':'en-US',{syncBuild6:false});
    }catch(_e){}
  }

  const nodeOriginal=new WeakMap();const placeholderOriginal=new WeakMap();
  function skipTranslation(el){
    if(!el)return true;const tag=el.tagName?.toLowerCase();if(['script','style','textarea','pre','code','option'].includes(tag))return true;
    if(el.closest?.('[data-user-content],.approved-journal-entry-card,.story-entry,.b5-draft-card,#journalEntryDetailBody,#journalText,#storyReflection'))return true;
    return false;
  }
  function translateTextNodes(root=document.body){
    if(state.translating||!root)return;state.translating=true;
    const spanish=state.preferences.interface_translation_enabled!==false&&state.preferences.language_code==='es';
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){const parent=node.parentElement;if(skipTranslation(parent))continue;const raw=nodeOriginal.get(node)??node.nodeValue;const trimmed=raw.trim();if(!trimmed)continue;if(!nodeOriginal.has(node))nodeOriginal.set(node,raw);const translated=spanish?exactSpanish[trimmed]:null;if(spanish&&translated){const lead=raw.match(/^\s*/)?.[0]||'';const trail=raw.match(/\s*$/)?.[0]||'';node.nodeValue=lead+translated+trail}else node.nodeValue=raw;}
    $$('input[placeholder],textarea[placeholder]',root).forEach(el=>{const raw=placeholderOriginal.get(el)??el.placeholder;if(!placeholderOriginal.has(el))placeholderOriginal.set(el,raw);el.placeholder=spanish?(placeholderSpanish[raw]||raw):raw});
    state.translating=false;
  }
  function applyDataTranslations(root=document){const spanish=state.preferences.interface_translation_enabled!==false&&state.preferences.language_code==='es';$$('[data-b6-i18n]',root).forEach(el=>{const key=el.dataset.b6I18n;const fallback=el.dataset.b6En||el.textContent;if(!el.dataset.b6En)el.dataset.b6En=fallback;el.textContent=spanish?(state.translations[key]||fallback):el.dataset.b6En})}
  function applyTranslations(root=document){applyDataTranslations(root);translateTextNodes(root===document?document.body:root)}
  let translateTimer;
  function watchTranslations(){new MutationObserver(mutations=>{if(state.translating)return;clearTimeout(translateTimer);translateTimer=setTimeout(()=>mutations.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)applyTranslations(n)})),80)}).observe(document.body,{childList:true,subtree:true})}

  function updateLocalDates(){
    const p=state.preferences;const locale=p.locale_code||(p.language_code==='es'?'es-US':'en-US');const zone=p.timezone||'America/Los_Angeles';
    const today=$('#todayDate');if(today)today.textContent=new Intl.DateTimeFormat(locale,{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:zone}).format(new Date());
    $$('time[datetime],[data-local-date]').forEach(el=>{const value=el.getAttribute('datetime')||el.dataset.localDate;if(!value)return;const date=new Date(value);if(!Number.isNaN(date.valueOf()))el.textContent=new Intl.DateTimeFormat(locale,{year:'numeric',month:'short',day:'numeric',timeZone:zone}).format(date)});
  }

  function renderPreferences(){
    const p=state.preferences;if(!$('#b6Language'))return;
    $('#b6Language').value=p.language_code||'en';$('#b6Timezone').value=p.timezone||'America/Los_Angeles';
    const scale=Number(p.text_scale||1);$('#b6TextScale').value=scale>=1.2?'1.25':scale>=1.06?'1.12':'1';
    $('#b6ReducedMotion').checked=!!p.reduced_motion;$('#b6Voice').checked=p.speech_to_text_enabled!==false;$('#b6InterfaceTranslation').checked=p.interface_translation_enabled!==false;$('#b6UserTranslation').checked=!!p.user_content_translation_enabled;
    const tier=state.membership?.service_tier||'free';$('#b6TierTitle').textContent=tier.charAt(0).toUpperCase()+tier.slice(1);$('#b6TierText').textContent=`${state.entitlements.length} active add-on${state.entitlements.length===1?'':'s'} · interface ${p.language_code==='es'?'Español':'English'}`;
  }
  async function loadTranslationsForLanguage(language){
    // The approved launch Spanish catalog is bundled locally so selecting Español
    // works even before or during a database/network problem.
    state.translations=language==='es'?{...embeddedSpanishByKey}:{};
    if(!client)return;
    try{
      const {data,error}=await client.from('lellee_translation_catalog')
        .select('translation_key,translation_value')
        .eq('language_code',language)
        .in('review_status',['approved','professional_review','internal']);
      if(!error&&Array.isArray(data)){
        state.translations={
          ...(language==='es'?embeddedSpanishByKey:{}),
          ...Object.fromEntries(data.map(row=>[row.translation_key,row.translation_value]))
        };
      }
    }catch(error){console.warn('Lellee translation refresh skipped:',error)}
  }

  async function persistPreferencesDirect(preferences){
    if(!client)return {ok:false,error:new Error('No database client')};
    const user=state.user||window.LelleeAuthContext?.getCurrentUser?.()||null;
    if(!user?.id)return {ok:false,error:new Error('Authentication required')};
    const row={
      user_id:user.id,
      language_code:preferences.language_code,
      locale_code:preferences.locale_code,
      timezone:preferences.timezone,
      text_scale:preferences.text_scale,
      reduced_motion:preferences.reduced_motion,
      speech_to_text_enabled:preferences.speech_to_text_enabled,
      interface_translation_enabled:preferences.interface_translation_enabled,
      user_content_translation_enabled:preferences.user_content_translation_enabled
    };
    try{
      const {data,error}=await client.from('lellee_platform_preferences')
        .upsert(row,{onConflict:'user_id'})
        .select('*')
        .single();
      return error?{ok:false,error}:{ok:true,data};
    }catch(error){return {ok:false,error}}
  }

  async function savePreferences(){
    const button=$('#b6SavePreferences');button.disabled=true;
    const language=$('#b6Language').value;
    message('#b6PreferenceMsg',language==='es'?'Guardando…':'Saving…');
    const payload={
      p_language_code:language,
      p_locale_code:language==='es'?'es-US':'en-US',
      p_timezone:$('#b6Timezone').value,
      p_text_scale:Number($('#b6TextScale').value),
      p_reduced_motion:$('#b6ReducedMotion').checked,
      p_speech_to_text_enabled:$('#b6Voice').checked,
      p_interface_translation_enabled:$('#b6InterfaceTranslation').checked,
      p_user_content_translation_enabled:$('#b6UserTranslation').checked
    };

    const localPreferences={
      ...state.preferences,
      language_code:language,
      locale_code:payload.p_locale_code,
      timezone:payload.p_timezone,
      text_scale:payload.p_text_scale,
      reduced_motion:payload.p_reduced_motion,
      speech_to_text_enabled:payload.p_speech_to_text_enabled,
      interface_translation_enabled:payload.p_interface_translation_enabled,
      user_content_translation_enabled:payload.p_user_content_translation_enabled
    };

    // Approved behavior: saving changes the interface immediately and persists
    // locally before any network round-trip.
    state.preferences=localPreferences;
    try{
      localStorage.setItem(LANGUAGE_CHOICE_KEY,language);
      localStorage.setItem(PREF_CACHE,JSON.stringify(localPreferences));
    }catch(_e){}
    await loadTranslationsForLanguage(language);
    applyPreferenceState();

    let serverSaved=!client;
    let serverError=null;

    if(client){
      try{
        const {data,error}=await client.rpc('lellee_save_platform_preferences',payload);
        if(!error&&data){
          state.preferences={...localPreferences,...data};
          serverSaved=true;
        }else{
          serverError=error||new Error('Preference save failed');
          // Fallback to the same user-owned preferences table. This preserves
          // account-level persistence when the RPC is temporarily unavailable.
          const direct=await persistPreferencesDirect(localPreferences);
          if(direct.ok){
            state.preferences={...localPreferences,...(direct.data||{})};
            serverSaved=true;
            serverError=null;
          }else if(direct.error){
            serverError=direct.error;
          }
        }
      }catch(error){
        serverError=error;
        const direct=await persistPreferencesDirect(localPreferences);
        if(direct.ok){
          state.preferences={...localPreferences,...(direct.data||{})};
          serverSaved=true;
          serverError=null;
        }else if(direct.error){
          serverError=direct.error;
        }
      }
    }

    try{localStorage.setItem(PREF_CACHE,JSON.stringify(state.preferences))}catch(_e){}
    await loadTranslationsForLanguage(language);
    applyPreferenceState();
    button.disabled=false;

    if(serverSaved){
      const savedText=language==='es'?'Idioma y accesibilidad guardados.':'Language and accessibility settings saved.';
      message('#b6PreferenceMsg',savedText,'success');
      toast(savedText);
    }else{
      // Same-device persistence remains intact. Surface the account-sync issue
      // instead of silently reverting the selected language.
      const warning=language==='es'
        ? 'Español guardado en este dispositivo. La sincronización de la cuenta necesita atención.'
        : 'Saved on this device. Account sync needs attention.';
      message('#b6PreferenceMsg',warning,'error');
      toast(warning,'error');
      console.warn('Lellee preference account sync failed:',serverError);
    }
  }

  function hasFeature(key){
    const tier=state.membership?.service_tier||'free';const entitlementKeys=new Set(state.entitlements.map(e=>e.entitlement_key));
    const map={safety_help:{tier:'free'},journal_basic:{tier:'free'},expert_practices_foundation:{tier:'free'},expert_practices_plus:{tier:'plus'},expert_practices_premium:{tier:'premium'},journal_companion:{tier:'free',entitlement:'journal_companion',required:true},lellee_coach:{tier:'premium',entitlement:'lellee_coach_addon',required:true},business_builder:{tier:'free',entitlement:'independent_business_tools',required:true},social_agent:{tier:'free',entitlement:'independent_business_tools',required:true}};
    const rule=map[key];if(!rule)return false;const tierOkay=tierRank(tier)>=tierRank(rule.tier);return rule.required?tierOkay&&entitlementKeys.has(rule.entitlement):tierOkay||entitlementKeys.has(rule.entitlement);
  }

  function installDoubleClickGuard(){
    document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled||button.matches('[data-page],[data-b5-page],.nav-category-toggle,.close-x,.approved-link,.b6-link'))return;const label=(button.textContent||'').trim();const id=button.id||'';if(!/(save|create|add|complete|submit|send|request|mark|used|approve|enroll|delete)/i.test(`${id} ${label}`))return;const now=Date.now(),last=Number(button.dataset.b6LastClick||0);if(now-last<1100){event.preventDefault();event.stopImmediatePropagation();return}button.dataset.b6LastClick=String(now);button.classList.add('b6-action-busy');setTimeout(()=>button.classList.remove('b6-action-busy'),850)},true);
  }

  function renderReadiness(){
    if(!$('#b6CheckList'))return;const r=state.readiness||{counts:{pass:0,warning:0,fail:0,pending:0},checks:[]};const c=r.counts||{};
    $('#b6Summary').innerHTML=[['pass','Passing',c.pass||0],['warning','Warnings',c.warning||0],['fail','Failures',c.fail||0],['pending','QA Pending',c.pending||0]].map(([key,label,value])=>`<article><b>${value}</b><small>${label}</small></article>`).join('');
    $('#b6CheckList').innerHTML=(r.checks||[]).map(item=>`<article class="b6-check-row ${escapeHtml(item.status)}"><span class="b6-check-icon">${item.status==='pass'?'✓':item.status==='fail'?'!':'•'}</span><div><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.detail||'')}</p></div><span class="b6-status ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></article>`).join('')||'<div class="b6-card">Checks have not loaded yet.</div>';
  }
  async function refreshReadiness(run=false){
    if(!client)return;message('#b6ReleaseMsg','Refreshing checks…');const fn=run?'lellee_refresh_release_checks':'lellee_build6_release_readiness';const {data,error}=await client.rpc(fn);if(error){message('#b6ReleaseMsg',error.message,'error');return}state.readiness=data;renderReadiness();message('#b6ReleaseMsg','Checks refreshed. Final QA remains pending.','success');
  }
  function exportReadiness(){const report={generated_at:new Date().toISOString(),build:6,readiness:state.readiness,preferences:state.preferences,membership:state.membership,entitlements:state.entitlements.map(e=>e.entitlement_key)};const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`lellee-build-6-qa-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}

  async function hydrate(){
    let cached=null,explicitLanguage=null;
    try{
      cached=JSON.parse(localStorage.getItem(PREF_CACHE)||'null');
      explicitLanguage=localStorage.getItem(LANGUAGE_CHOICE_KEY);
      if(cached)state.preferences={...state.preferences,...cached};
    }catch(_e){}
    if(explicitLanguage==='es'||explicitLanguage==='en'){
      state.preferences={
        ...state.preferences,
        language_code:explicitLanguage,
        locale_code:explicitLanguage==='es'?'es-US':'en-US',
        interface_translation_enabled:explicitLanguage==='es'?true:state.preferences.interface_translation_enabled!==false
      };
    }
    await loadTranslationsForLanguage(state.preferences.language_code||'en');
    applyPreferenceState();if(!client)return;
    const sessionUser=window.LelleeAuthContext?.getCurrentUser?.()||null;state.user=sessionUser;state.isAdmin=['admin','owner','service_role'].includes(sessionUser?.app_metadata?.role||'');installNav();
    if(!state.user)return;
    const {data,error}=await client.rpc('lellee_get_platform_bootstrap');
    if(!error&&data){
      const serverPreferences=data.preferences||{};
      state.preferences={...state.preferences,...serverPreferences};

      // An explicit choice made on this device is newer user intent and must not
      // be silently replaced by stale English from an older server row.
      if(explicitLanguage==='es'||explicitLanguage==='en'){
        state.preferences={
          ...state.preferences,
          language_code:explicitLanguage,
          locale_code:explicitLanguage==='es'?'es-US':'en-US',
          interface_translation_enabled:explicitLanguage==='es'?true:state.preferences.interface_translation_enabled!==false
        };
      }

      state.membership=data.membership||state.membership;
      state.entitlements=data.entitlements||[];
      state.locales=data.locales||[];
      await loadTranslationsForLanguage(state.preferences.language_code||'en');
      applyPreferenceState();

      // Best-effort reconciliation: bring the account row up to the explicit
      // local choice after authentication.
      if(explicitLanguage==='es'||explicitLanguage==='en'){
        persistPreferencesDirect(state.preferences).catch(()=>{});
      }
    }
    const readiness=await client.rpc('lellee_build6_release_readiness');if(!readiness.error){state.readiness=readiness.data;renderReadiness()}
  }

  function bindEvents(){
    document.addEventListener('click',event=>{const page=event.target.closest('[data-page="language-accessibility"],[data-page="release-readiness"]');if(page){event.preventDefault();navigate(page.dataset.page)}});

    $('#b6Language')?.addEventListener('change',async event=>{
      const language=event.target.value==='es'?'es':'en';
      if(language==='es'&&$('#b6InterfaceTranslation'))$('#b6InterfaceTranslation').checked=true;
      state.preferences={
        ...state.preferences,
        language_code:language,
        locale_code:language==='es'?'es-US':'en-US',
        interface_translation_enabled:language==='es'?true:$('#b6InterfaceTranslation')?.checked!==false
      };
      try{
        localStorage.setItem(LANGUAGE_CHOICE_KEY,language);
        localStorage.setItem(PREF_CACHE,JSON.stringify(state.preferences));
      }catch(_e){}
      await loadTranslationsForLanguage(language);
      applyPreferenceState();
    });

    $('#b6SavePreferences')?.addEventListener('click',savePreferences);$('#b6RefreshChecks')?.addEventListener('click',()=>refreshReadiness(true));$('#b6ExportReport')?.addEventListener('click',exportReadiness);
    const content=$('.content');if(content)new MutationObserver(()=>{const active=$('.page.active')?.id?.replace('page-','');if(['language-accessibility','release-readiness'].includes(active)){localStorage.setItem(PAGE_KEY,active);openAccountCategory();if(active==='language-accessibility')renderPreferences();else renderReadiness()}}).observe(content,{subtree:true,attributes:true,attributeFilter:['class']});
  }

  async function initialize(){
    installNetworkFeedback();installPages();installDoubleClickGuard();watchTranslations();bindEvents();
    let tries=0;const timer=setInterval(()=>{if(installNav()||++tries>40)clearInterval(timer)},100);
    await hydrate();installNav();applyTranslations();
    
    window.LelleePlatform={get preferences(){return state.preferences},get membership(){return state.membership},get entitlements(){return state.entitlements},hasFeature,formatDate:(value,options={})=>new Intl.DateTimeFormat(state.preferences.locale_code||'en-US',{timeZone:state.preferences.timezone||'America/Los_Angeles',...options}).format(new Date(value)),navigate,refreshReadiness};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
