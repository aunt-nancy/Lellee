/*
  Lellee Final Recovery QA Repair
  2026-08-16
  Loaded LAST. This file intentionally avoids global MutationObservers.
*/
(function(){
  'use strict';

  const LOCALE_KEY='lellee-locale-v2';
  const VERSION='20260816-final-r1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function ctx(){ return window.LelleeAuthContext || null; }
  function client(){ return ctx()?.client || window.__lelleeSupabaseClient || null; }
  async function user(){
    const bridged=ctx()?.getCurrentUser?.() || window.__lelleeAuthUser || null;
    if(bridged) return bridged;
    const c=client();
    if(!c?.auth) return null;
    try{ const {data}=await c.auth.getUser(); return data?.user || null; }catch(_){ return null; }
  }
  function esc(v){
    return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function toast(message,type='ok'){
    let el=$('#lelleeFinalToast');
    if(!el){
      el=document.createElement('div');
      el.id='lelleeFinalToast';
      el.style.cssText='position:fixed;right:16px;bottom:18px;z-index:20000;max-width:360px;padding:11px 14px;border-radius:9px;color:#fff;background:#30273a;box-shadow:0 12px 32px rgba(20,14,32,.22);font:600 13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif';
      document.body.appendChild(el);
    }
    el.style.background=type==='error'?'#7c3737':'#30273a';
    el.textContent=message;
    el.hidden=false;
    clearTimeout(el._lelleeTimer);
    el._lelleeTimer=setTimeout(()=>{el.hidden=true},3000);
  }

  function openPage(name){
    try{
      if(typeof window.showPage==='function'){
        window.showPage(name);
      }else{
        $$('.page').forEach(p=>p.classList.remove('active'));
        const page=$('#page-'+name) || $('#page-today');
        page?.classList.add('active');
        $$('.nav-item,.mobile-bottom button[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
        window.scrollTo({top:0,behavior:'smooth'});
      }
    }catch(_){
      $$('.page').forEach(p=>p.classList.remove('active'));
      ($('#page-'+name)||$('#page-today'))?.classList.add('active');
    }
    setTimeout(()=>{
      applySavedLocale();
      refreshRecoveryDay();
      if(name==='plus') refreshPlusStatus();
      if(name==='support-network') loadSupportPeople();
      if(name==='journal') repairJournalReviewButton();
    },120);
  }

  /* ---------------------------------------------------------
     Recovery day: one local calendar calculation everywhere.
     Jul 4 -> Aug 16 displays 43 elapsed days, not UTC-dependent 42/44.
     --------------------------------------------------------- */
  function recoveryDateFromState(){
    const field=$('#setRecoveryDate');
    if(field?.value) return field.value;
    try{
      const d=JSON.parse(localStorage.getItem('lellee-v1-site')||'{}');
      if(d?.recoveryDate) return d.recoveryDate;
    }catch(_){ }
    return null;
  }
  function parseYmd(s){
    const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(!m) return null;
    return {y:+m[1],m:+m[2],d:+m[3]};
  }
  function canonicalRecoveryDays(){
    const start=parseYmd(recoveryDateFromState());
    if(!start) return 1;
    const now=new Date();
    const startUTC=Date.UTC(start.y,start.m-1,start.d);
    const nowUTC=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
    return Math.max(1,Math.floor((nowUTC-startUTC)/86400000));
  }
  function refreshRecoveryDay(){
    const n=canonicalRecoveryDays();
    $$('[data-recovery-day]').forEach(el=>el.textContent=String(n));
    if($('#monthlyRecoveryDay')) $('#monthlyRecoveryDay').textContent=String(n);
    if($('#milestoneCurrentDay')) $('#milestoneCurrentDay').textContent='DAY '+n;
    if($('#ltDays')) $('#ltDays').textContent=String(n);
  }
  try{ window.daysInRecovery=canonicalRecoveryDays; }catch(_){ }

  /* ---------------------------------------------------------
     Plus: server membership is source of truth. No stale browser
     state may display "Plus active" on a Free account.
     --------------------------------------------------------- */
  async function refreshPlusStatus(){
    const title=$('#plusStatusTitle'), text=$('#plusStatusText'), badge=$('#plusStatusBadge');
    if(!title||!text||!badge) return;
    let active=false, status='free';
    const c=client(), u=await user();
    if(c&&u){
      try{
        const {data,error}=await c.from('user_memberships').select('tier,status').eq('user_id',u.id).maybeSingle();
        if(!error && data){
          status=data.status||'free';
          active=data.tier==='plus' && ['active','trialing'].includes(status);
        }
      }catch(_){ }
    }
    if(active){
      title.textContent='Lellee Plus';
      text.textContent=status==='trialing'?'Your Plus trial is active.':'Your Plus membership is active.';
      badge.textContent=status==='trialing'?'TRIAL':'PLUS';
    }else{
      title.textContent='Lellee Free';
      text.textContent='Core recovery is active. Lellee Plus pricing has not been finalized yet.';
      badge.textContent='FREE';
    }
    const p=$('#plusPriceMonthly'); if(p) p.textContent='TBD';
    const cp=$('#plusComparePrice'); if(cp) cp.textContent='TBD';
    const start=$('#startPlusMembership');
    if(start && !active){ start.textContent='Plus pricing coming soon'; }
  }

  function wireRecoveryReviewCard(){
    const card=$('.plus-review-preview');
    if(!card) return;
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label','Open Your Recovery Review');
    card.style.cursor='pointer';
    card.style.outlineOffset='3px';
    if(card.dataset.finalRepairWired) return;
    card.dataset.finalRepairWired='1';
    card.addEventListener('click',()=>openPage('recovery-review'));
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();openPage('recovery-review')}
    });
  }

  /* ---------------------------------------------------------
     Language persistence. DB preference + local fallback.
     We preserve the selection across navigation and refresh.
     --------------------------------------------------------- */
  const ES={
    'Today':'Hoy','For You':'Para ti','My Recovery':'Mi recuperación','Learn':'Aprender',
    'Expert-Guided Practices':'Prácticas guiadas por expertos','Tools':'Herramientas',
    'Recovery Paths':'Caminos de recuperación','Meetings':'Reuniones','Community':'Comunidad',
    'Journal':'Diario','Progress':'Progreso','Calendar':'Calendario','Resources':'Recursos',
    'Inbox':'Bandeja','Search':'Buscar','Settings':'Configuración','Account':'Cuenta',
    'Language & Accessibility':'Idioma y accesibilidad','Help':'Ayuda','Help Me Right Now':'Ayuda ahora',
    'Get Help Now':'Obtener ayuda ahora','Sign out':'Cerrar sesión','Back to Today':'Volver a Hoy',
    'My Support':'Mi apoyo','My Support Network':'Mi red de apoyo','My people':'Mi gente',
    'Saved meetings':'Reuniones guardadas','Add Person':'Agregar persona','Save Person':'Guardar persona',
    'Close':'Cerrar','Save Preferences':'Guardar preferencias','Language':'Idioma',
    'English (US)':'Inglés (EE. UU.)','Lellee Plus':'Lellee Plus','Lellee Free':'Lellee Gratis',
    'Your Recovery Review':'Tu revisión de recuperación','Build Review':'Crear revisión',
    'Weekly Review':'Revisión semanal','Monthly Review':'Revisión mensual','My Insights':'Mis perspectivas',
    'Milestones':'Hitos','Then & Now':'Antes y ahora','Recovery Story':'Historia de recuperación',
    'Build Story Preview':'Crear vista previa','Save Draft':'Guardar borrador','Print / Save as PDF':'Imprimir / Guardar como PDF',
    'Review Entries':'Revisar entradas','Open Companion':'Abrir Companion','Journal Companion':'Journal Companion',
    'View add-on options':'Ver opciones del complemento','Unlock Companion':'Desbloquear Companion',
    'Privacy by default':'Privacidad por defecto','Private to your Lellee account.':'Privado en tu cuenta de Lellee.',
    'Good morning':'Buenos días','Good afternoon':'Buenas tardes','Good evening':'Buenas noches',
    'Days in Recovery':'Días en recuperación','Recovery Momentum':'Impulso de recuperación',
    'Current Phase':'Fase actual','My Journey':'Mi camino','My History':'Mi historial',
    'Find Support':'Encontrar apoyo','Reflect & Track':'Reflexionar y seguir','Connect':'Conectar',
    'Grow & Learn':'Crecer y aprender'
  };
  const EN=Object.fromEntries(Object.entries(ES).map(([k,v])=>[v,k]));
  function localLocale(){ return localStorage.getItem(LOCALE_KEY)||'en-US'; }
  function translateLeaf(el,locale){
    if(!el || el.closest('#journalEntryCards,#messageThreadBody,#supportPeopleList,.approved-story-paper,[data-no-translate]')) return;
    if(el.children.length) return;
    const raw=el.textContent?.trim(); if(!raw) return;
    const map=locale==='es-US'?ES:EN;
    if(map[raw]) el.textContent=map[raw];
  }
  function applyLocale(locale){
    locale=locale==='es-US'?'es-US':'en-US';
    localStorage.setItem(LOCALE_KEY,locale);
    document.documentElement.lang=locale==='es-US'?'es':'en';
    const sel=$('#prefLocale'); if(sel) sel.value=locale;
    const esOpt=$('#prefLocale option[value="es-US"]'); if(esOpt) esOpt.textContent='Español (US)';
    const zoneSelectors='button,a,h1,h2,h3,p,small,b,span';
    $$(zoneSelectors).forEach(el=>translateLeaf(el,locale));
    const greeting=$('#greetingText');
    if(greeting && locale==='es-US'){
      const t=greeting.textContent||'';
      greeting.textContent=t.replace(/^Good morning/,'Buenos días').replace(/^Good afternoon/,'Buenas tardes').replace(/^Good evening/,'Buenas noches');
    }
    if(greeting && locale==='en-US'){
      const t=greeting.textContent||'';
      greeting.textContent=t.replace(/^Buenos días/,'Good morning').replace(/^Buenas tardes/,'Good afternoon').replace(/^Buenas noches/,'Good evening');
    }
  }
  function applySavedLocale(){ applyLocale(localLocale()); }
  async function loadLocaleFromServer(){
    const c=client(), u=await user(); if(!c||!u){applySavedLocale();return}
    let locale=null;
    try{
      const {data}=await c.from('user_experience_preferences').select('locale').eq('user_id',u.id).maybeSingle();
      locale=data?.locale||null;
    }catch(_){ }
    if(!locale){
      try{
        const {data}=await c.from('profiles').select('locale').eq('id',u.id).maybeSingle();
        locale=data?.locale||null;
      }catch(_){ }
    }
    if(locale==='es-US'||locale==='en-US') localStorage.setItem(LOCALE_KEY,locale);
    applySavedLocale();
  }
  async function saveLocale(locale){
    locale=locale==='es-US'?'es-US':'en-US';
    localStorage.setItem(LOCALE_KEY,locale);
    applyLocale(locale);
    const c=client(), u=await user(); if(!c||!u) return;
    try{
      await c.from('user_experience_preferences').upsert({user_id:u.id,locale,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    }catch(_){ }
    try{ await c.from('profiles').update({locale}).eq('id',u.id); }catch(_){ }
    const msg=$('#experiencePrefMsg');
    if(msg) msg.textContent=locale==='es-US'?'Idioma guardado: Español.':'Language saved: English.';
  }

  /* ---------------------------------------------------------
     Support network: merge current + legacy own rows so a prior
     support contact is not lost merely because UI schema changed.
     --------------------------------------------------------- */
  function normalizeSupport(row,source){
    return {
      id:row.id||'', source,
      name:row.contact_name||row.name||row.display_name||row.full_name||'Support person',
      relationship:row.relationship_label||row.relationship||row.relationship_type||row.role||'Support',
      phone:row.phone||row.phone_number||'',
      email:row.email||row.email_address||'',
      primary:Boolean(row.is_primary??row.primary_support??row.primary??false),
      created_at:row.created_at||''
    };
  }
  async function loadSupportPeople(){
    const c=client(), u=await user(), box=$('#supportPeopleList');
    if(!c||!u||!box) return;
    const all=[];
    for(const table of ['lellee_support_people','support_contacts']){
      try{
        const {data,error}=await c.from(table).select('*').eq('user_id',u.id).order('created_at',{ascending:true});
        if(!error && Array.isArray(data)) data.forEach(r=>all.push(normalizeSupport(r,table)));
      }catch(_){ }
    }
    const seen=new Set();
    const rows=all.filter(r=>{
      const k=[r.name,r.phone,r.email].map(x=>String(x||'').trim().toLowerCase()).join('|');
      if(seen.has(k)) return false; seen.add(k); return true;
    });
    if(!rows.length){
      box.innerHTML='<div class="approved-resource-empty"><b>No support people saved yet.</b><small>Add someone you would actually contact.</small></div>';
      if($('#progressSupportPeople')) $('#progressSupportPeople').textContent='0';
      return;
    }
    box.innerHTML=rows.map(r=>`<div class="approved-list-row final-support-row" data-no-translate>
      <span>${r.primary?'★':'♡'}</span><div><b>${esc(r.name)}</b><small>${esc(r.relationship)}${r.phone?' · '+esc(r.phone):''}${r.email?' · '+esc(r.email):''}</small></div><em>${r.primary?'Primary':'Saved'}</em>
    </div>`).join('');
    if($('#progressSupportPeople')) $('#progressSupportPeople').textContent=String(rows.length);
    if($('#communitySupportHeadline')) $('#communitySupportHeadline').textContent=rows.length===1?'1 support person':rows.length+' support people';
    if($('#communitySupportText')) $('#communitySupportText').textContent='Your saved support people are available when you need them.';
    const help=$('#helpSupportList');
    if(help){
      help.innerHTML=rows.slice().sort((a,b)=>Number(b.primary)-Number(a.primary)).slice(0,4).map(r=>`<div class="approved-list-row" data-no-translate><span>♡</span><div><b>${esc(r.name)}</b><small>${esc(r.relationship)}</small></div>${r.phone?`<a class="approved-link" href="tel:${esc(r.phone)}">Call</a>`:''}</div>`).join('');
    }
  }

  /* ---------------------------------------------------------
     Journal review: schema-tolerant direct read of journal_entries.
     --------------------------------------------------------- */
  async function loadJournalEntriesFinal(){
    const c=client(), u=await user(), list=$('#entriesList'), cards=$('#journalEntryCards');
    if(!c||!u||!list||!cards) return;
    list.classList.remove('hidden');
    cards.innerHTML='<div class="approved-resource-empty"><b>Loading your entries…</b><small>Please wait.</small></div>';
    try{
      const {data,error}=await c.from('journal_entries').select('*').eq('user_id',u.id).order('created_at',{ascending:false}).limit(100);
      if(error) throw error;
      const rows=data||[];
      if(!rows.length){ cards.innerHTML='<div class="approved-resource-empty"><b>No journal entries yet.</b><small>Your saved entries will appear here.</small></div>'; return; }
      cards.innerHTML=rows.map((r,i)=>{
        const body=r.content??r.body??r.reflection??'';
        const title=r.title||r.prompt_text||r.prompt||'Journal entry';
        const date=r.entry_date||r.created_at||'';
        return `<article class="approved-journal-entry-card" data-no-translate>
          <div class="approved-entry-top"><span>${r.is_favorite||r.favorite?'★ Favorite':'Journal'}</span><span>${esc(String(date).slice(0,10))}</span></div>
          <h3>${esc(title)}</h3><p>${esc(String(body).slice(0,240))}${String(body).length>240?'…':''}</p>
          <button class="approved-link" data-final-journal-index="${i}">Open Entry →</button>
        </article>`;
      }).join('');
      window.__lelleeFinalJournalRows=rows;
    }catch(err){
      cards.innerHTML=`<div class="approved-resource-empty"><b>Entries could not be loaded.</b><small>${esc(err?.message||'Please try again.')}</small></div>`;
    }
  }
  function openJournalEntryFinal(index){
    const r=window.__lelleeFinalJournalRows?.[index]; if(!r) return;
    const body=r.content??r.body??r.reflection??'';
    const title=r.title||r.prompt_text||r.prompt||'Journal entry';
    if($('#journalEntryDetailTitle')) $('#journalEntryDetailTitle').textContent=title;
    if($('#journalEntryDetailMeta')) $('#journalEntryDetailMeta').textContent=String(r.entry_date||r.created_at||'').slice(0,10)+' · Private journal entry';
    if($('#journalEntryDetailBody')) $('#journalEntryDetailBody').innerHTML=`<h3>${esc(title)}</h3><p data-no-translate>${esc(body).replace(/\n/g,'<br>')}</p>`;
    if($('#detailFavoriteToggle')) $('#detailFavoriteToggle').checked=Boolean(r.is_favorite||r.favorite);
    openPage('journal-entry');
  }
  function repairJournalReviewButton(){
    const b=$('#toggleEntries'); if(b) b.setAttribute('aria-controls','entriesList');
  }

  /* ---------------------------------------------------------
     Recovery Story: dedicated Lellee preview page, not inline scroll.
     --------------------------------------------------------- */
  function ensureStoryPreviewPage(){
    if($('#page-story-preview-final')) return;
    const page=document.createElement('section');
    page.className='page'; page.id='page-story-preview-final';
    page.innerHTML=`<div class="approved-inner">
      <div class="approved-inner-head"><div><span class="approved-kicker">MY RECOVERY STORY</span><h2>My Recovery Story Preview</h2><p>A dedicated preview of the story you chose to build.</p></div>
      <div class="final-story-actions"><button class="approved-link" id="finalStoryBack">← Progress</button><button class="approved-link" id="finalStoryEdit">Edit Story</button><button class="approved-link" id="finalStorySave">Save Draft</button><button class="approved-small-action" id="finalStoryPrint">Print / Save as PDF</button></div></div>
      <div id="finalStoryPreviewBody"></div>
    </div>`;
    const content=$('.content'); content?.appendChild(page);
    $('#finalStoryBack')?.addEventListener('click',()=>openPage('progress'));
    $('#finalStoryEdit')?.addEventListener('click',()=>openPage('story'));
    $('#finalStorySave')?.addEventListener('click',()=>$('#saveStoryDraftV2')?.click());
    $('#finalStoryPrint')?.addEventListener('click',()=>window.print());
  }
  function storyPreviewReady(){
    const src=$('#storyPreviewV2'); if(!src) return false;
    return Boolean(src.querySelector('.approved-story-paper')) || !src.querySelector('.approved-resource-empty');
  }
  function copyStoryPreview(){
    ensureStoryPreviewPage();
    const src=$('#storyPreviewV2'), dest=$('#finalStoryPreviewBody');
    if(!src||!dest||!storyPreviewReady()) return false;
    dest.innerHTML=src.innerHTML;
    openPage('story-preview-final');
    return true;
  }
  function waitForStoryPreview(tries=0){
    if(copyStoryPreview()) return;
    if(tries<30) setTimeout(()=>waitForStoryPreview(tries+1),120);
  }

  /* ---------------------------------------------------------
     Journal Companion checkout routing. The UI is wired to a
     secure payment handoff without silently enabling billing.
     --------------------------------------------------------- */
  function ensureJournalCheckoutPage(){
    if($('#page-journal-companion-checkout')) return;
    const page=document.createElement('section');
    page.className='page'; page.id='page-journal-companion-checkout';
    page.innerHTML=`<div class="approved-inner">
      <div class="approved-inner-head"><div><span class="approved-kicker">JOURNAL COMPANION</span><h2>Unlock Journal Companion</h2><p>Continue to Lellee's secure payment system for the digital companion add-on.</p></div><button class="approved-link" id="journalCheckoutBack">← Journal Companion</button></div>
      <div class="final-checkout-card"><div><span class="approved-kicker">MONTHLY ADD-ON</span><h3>Journal Companion</h3><p>Expanded digital prompts, collections, physical-journal pairing, and long-term review.</p></div><div class="final-checkout-price"><b>$4.99</b><small>/month</small></div></div>
      <div class="final-checkout-note"><b>Secure checkout</b><p>Payment details are handled by the configured payment provider. Lellee does not place card secrets in browser code.</p></div>
      <div class="final-checkout-actions"><button class="approved-link" id="journalCheckoutCancel">Cancel</button><button class="approved-small-action" id="journalCheckoutContinue">Continue to Secure Checkout</button></div>
      <div class="approved-setting-note" id="journalCheckoutStatus"></div>
    </div>`;
    $('.content')?.appendChild(page);
    $('#journalCheckoutBack')?.addEventListener('click',()=>openPage('journal-companion'));
    $('#journalCheckoutCancel')?.addEventListener('click',()=>openPage('journal-companion'));
    $('#journalCheckoutContinue')?.addEventListener('click',startJournalCheckout);
  }
  function openJournalCheckout(){ ensureJournalCheckoutPage(); openPage('journal-companion-checkout'); }
  async function startJournalCheckout(){
    const status=$('#journalCheckoutStatus'), button=$('#journalCheckoutContinue');
    if(button) button.disabled=true;
    if(status) status.textContent='Connecting to secure checkout…';
    try{
      const c=client(), u=await user();
      if(!c||!u) throw new Error('Please sign in before starting checkout.');

      // First allow a server-managed Payment Link / checkout URL if one is configured.
      try{
        const {data}=await c.from('app_public_settings').select('key,value').in('key',['journal_companion_payment_link','journal_companion_checkout_url']);
        const url=(data||[]).map(x=>x.value).find(v=>/^https:\/\//i.test(String(v||'')));
        if(url){ window.location.assign(url); return; }
      }catch(_){ }

      // Preferred path: authenticated Supabase Edge Function creates a Stripe-hosted checkout session.
      const {data,error}=await c.functions.invoke('create-journal-companion-checkout',{body:{plan:'monthly'}});
      if(error) throw error;
      if(data?.url){ window.location.assign(data.url); return; }
      throw new Error(data?.error||'Secure checkout is not configured yet.');
    }catch(err){
      if(status) status.textContent=(err?.message||'Secure checkout is not configured yet.')+' The purchase link is wired, but the server-side Stripe checkout must be enabled before a charge can occur.';
      toast('Journal Companion checkout needs the server-side Stripe connection.', 'error');
    }finally{ if(button) button.disabled=false; }
  }

  /* ---------------------------------------------------------
     Styles for repaired interactive areas and dedicated pages.
     --------------------------------------------------------- */
  function injectStyles(){
    if($('#lelleeFinalRepairStyles')) return;
    const s=document.createElement('style'); s.id='lelleeFinalRepairStyles';
    s.textContent=`
      .plus-review-preview[role="button"]{transition:.15s ease}.plus-review-preview[role="button"]:hover{box-shadow:0 6px 18px rgba(60,40,85,.10)}
      .plus-review-preview[role="button"]:focus-visible{outline:3px solid rgba(101,64,154,.35)}
      .final-story-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
      .final-checkout-card{display:flex;justify-content:space-between;align-items:center;gap:24px;background:linear-gradient(135deg,#f3eef7,#fffaf4);border:1px solid #e2dbe6;border-radius:12px;padding:22px;margin:10px 0 12px}
      .final-checkout-card h3{margin:5px 0;font-size:1rem}.final-checkout-card p{margin:0;color:#706a73;font-size:.72rem;line-height:1.55}
      .final-checkout-price{text-align:right;white-space:nowrap}.final-checkout-price b{display:block;font-size:1.8rem;color:#65409a}.final-checkout-price small{font-size:.7rem;color:#777}
      .final-checkout-note{border:1px solid #e7e2e8;background:#fff;border-radius:9px;padding:14px 16px}.final-checkout-note b{font-size:.75rem}.final-checkout-note p{font-size:.65rem;color:#777;line-height:1.5;margin:5px 0 0}
      .final-checkout-actions{display:flex;justify-content:flex-end;gap:14px;align-items:center;margin:14px 0}
      .final-support-row{cursor:default!important}
      @media(max-width:700px){.final-checkout-card{display:block}.final-checkout-price{text-align:left;margin-top:14px}.final-story-actions{justify-content:flex-start;margin-top:10px}}
    `;
    document.head.appendChild(s);
  }

  function isJournalPaymentClick(target){
    const btn=target.closest('button,a,[role="button"]'); if(!btn) return false;
    const id=(btn.id||'').toLowerCase();
    const txt=(btn.textContent||'').trim().toLowerCase();
    return id.includes('journal')&&(id.includes('unlock')||id.includes('checkout')||id.includes('addon')) ||
      /unlock companion|unlock journal companion|view add-on options|view addon options/.test(txt);
  }

  function init(){
    injectStyles();
    ensureStoryPreviewPage();
    ensureJournalCheckoutPage();
    wireRecoveryReviewCard();
    repairJournalReviewButton();
    refreshRecoveryDay();
    refreshPlusStatus();
    applySavedLocale();

    document.addEventListener('change',e=>{
      if(e.target?.id==='prefLocale') saveLocale(e.target.value);
    },true);

    document.addEventListener('click',e=>{
      if(isJournalPaymentClick(e.target)){
        e.preventDefault(); e.stopImmediatePropagation(); openJournalCheckout(); return;
      }
      const t=e.target.closest?.('#startPlusMembership');
      if(t){
        e.preventDefault(); e.stopImmediatePropagation();
        const banner=$('#plusCheckoutBanner');
        if(banner){banner.classList.remove('hidden');banner.textContent='Lellee Plus pricing has not been finalized yet. No charge was started.'}
        toast('Lellee Plus pricing is still pending.'); return;
      }
      if(e.target.closest?.('#saveExperiencePreferences')){
        const locale=$('#prefLocale')?.value||localLocale();
        setTimeout(()=>saveLocale(locale),80);
      }
      if(e.target.closest?.('#saveSupportPerson')) setTimeout(loadSupportPeople,700);
      if(e.target.closest?.('#toggleEntries')){
        e.preventDefault(); e.stopImmediatePropagation(); loadJournalEntriesFinal(); return;
      }
      const ji=e.target.closest?.('[data-final-journal-index]');
      if(ji){e.preventDefault();openJournalEntryFinal(Number(ji.dataset.finalJournalIndex));return;}
      if(e.target.closest?.('#buildStoryPreviewV2')) setTimeout(()=>waitForStoryPreview(0),60);
      const pageButton=e.target.closest?.('[data-page]');
      if(pageButton){
        const name=pageButton.dataset.page;
        setTimeout(()=>{
          applySavedLocale(); refreshRecoveryDay();
          if(name==='plus') refreshPlusStatus();
          if(name==='support-network') loadSupportPeople();
        },220);
      }
    },true);

    window.addEventListener('pageshow',()=>{setTimeout(()=>{applySavedLocale();refreshRecoveryDay();refreshPlusStatus()},100)});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){applySavedLocale();refreshRecoveryDay()}});

    // Auth can complete after this file loads. Retry a few times without observers.
    [250,900,1800].forEach(ms=>setTimeout(()=>{
      loadLocaleFromServer(); wireRecoveryReviewCard(); refreshPlusStatus(); refreshRecoveryDay();
    },ms));
  }

  window.LelleeFinalRepair={version:VERSION,openPage,refreshPlusStatus,loadSupportPeople,loadJournalEntriesFinal,applyLocale,openJournalCheckout,canonicalRecoveryDays};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
