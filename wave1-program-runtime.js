(function(){
  'use strict';

  const VERSION='2026-09-11-wave1-internal-qa1';
  const PROGRAMS=Object.freeze({
    caregiving:{
      name:'Caregiving',
      subtitle:'Reduce the mental load of caring for someone else while protecting your own capacity.',
      stages:['Get Oriented','Get Organized','Build Support','Find a Rhythm','Adjust to Change','Sustain Yourself'],
      today:['What matters most today?','One care task','One thing for you'],
      tools:['Care Profiles','My Care Plan','Medication Organizer','Appointments','Prepare for Appointment','Care Calendar','Care Team','Share the Load','Document Vault','Resource Finder','Respite & Break Planner','Emergency Information','Care Transition','Caregiver Plan','Expense & Benefits Organizer','Care Binder'],
      help:['I’m overwhelmed','I’m exhausted / need a break','I don’t have enough help','Someone who was helping is no longer available','I’m having trouble managing everything','The care situation suddenly changed','I’m worried about the person I’m caring for','I’m worried about myself','I need a service or resource','Something else'],
      progress:['Care information is more organized','More help is available','Appointments are easier to manage','Regular breaks are becoming possible','Fewer tasks are unresolved'],
      differentiator:'What matters now, what can wait, and what can someone else do?'
    },
    reentry:{
      name:'Returning Home / Reentry',
      subtitle:'Practical sequencing for returning home and rebuilding stability without surveillance or scoring.',
      stages:['Coming Home','Get Stable','Rebuild Routine','Move Forward','Reconnect','Build the Next Chapter'],
      today:['One essential task','One stability task','One forward-looking task'],
      tools:['My Return Plan','Essential Documents','Requirements & Appointments','Housing','Benefits','Transportation','Employment & Education','Support Network','Next Steps'],
      help:['I don’t have somewhere safe to stay','I need identification or documents','I don’t understand a requirement or deadline','I need transportation','I need work or income','I need benefits or basic needs','I need help figuring out what comes first','Something else'],
      progress:['Essential documents are coming together','Housing options are clearer','Appointments and requirements are organized','Employment or training steps are moving','Support connections are growing'],
      differentiator:'Stability and sequencing without a reentry score.'
    },
    'housing-stability':{
      name:'Housing Stability',
      subtitle:'Move from housing crisis or uncertainty toward stable housing with follow-through, not just listings.',
      stages:['What’s Urgent?','Understand My Situation','Find Options','Get Ready','Get Stable','Stay Stable'],
      today:['Urgent deadline','One housing action','One application or document step'],
      tools:['Housing Situation','Deadline Tracker','Housing Search','Application Organizer','Document Vault','Benefits & Rent Assistance','Housing Counselor & Legal Resources','Move Plan','Stay Stable Plan'],
      help:['I may lose my housing','I have nowhere to stay','I received a notice','I can’t pay rent or utilities','I need to find housing','I need help with an application','I think I’m experiencing housing discrimination','Something changed'],
      progress:['Deadlines are identified','Documents are ready','Applications are moving','Resources are connected','Housing is becoming more stable'],
      differentiator:'Housing search + documents + benefits + deadlines + follow-through.'
    },
    'independent-living':{
      name:'Building Independence',
      subtitle:'Build self-direction, access, and practical life systems while choosing the support that works for you.',
      stages:['What I Want','Daily Life','Getting Around & Access','Money & Responsibilities','Work, School & Community','My Support, My Choice'],
      today:['One personally chosen goal','One practical action','One upcoming responsibility'],
      tools:['My Independence Goals','Daily-Life Systems','Transportation','Accessibility & Assistive Technology','Benefits','Money & Household Organization','Work & School','Self-Advocacy','Support Plan','Emergency Preparedness'],
      help:['I need help doing something on my own','Transportation or access is stopping me','I need an accommodation','Paperwork or benefits are confusing','I need help speaking up for myself','I need more support','I want less help with something','I don’t know where to start'],
      progress:['Daily systems are easier to use','Access barriers are clearer','Responsibilities are more organized','Self-advocacy is growing','Support better matches personal choice'],
      differentiator:'Independence means self-direction, not doing everything without help.'
    }
  });

  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let allowed=false;
  let activeSlug='caregiving';

  function client(){ return window.LelleeAuthContext?.client||null; }
  function user(){ return window.LelleeAuthContext?.getCurrentUser?.()||null; }
  function navigate(page){
    const fn=window.LelleeNavigatePage||window.showPage;
    if(typeof fn==='function') fn(page);
  }

  function injectStyle(){
    if($('#wave1ProgramRuntimeStyle'))return;
    const s=document.createElement('style');
    s.id='wave1ProgramRuntimeStyle';
    s.textContent=`
      #page-wave1-programs .approved-inner,#page-wave1-workspace .approved-inner{max-width:1120px;margin:0 auto}
      .w1-status{display:inline-flex;align-items:center;gap:6px;border:1px solid #ded6e7;background:#f7f3fa;color:#684590;border-radius:999px;padding:6px 9px;font-size:.58rem;font-weight:850;letter-spacing:.04em}
      .w1-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin-top:16px}
      .w1-program-card{border:1px solid #e5e0e8;border-radius:12px;background:#fff;padding:17px;box-shadow:0 4px 14px rgba(31,25,44,.035)}
      .w1-program-card h3{font-size:.9rem;margin:8px 0 6px}.w1-program-card p{font-size:.7rem;line-height:1.5;color:#6d6671;margin:0 0 12px}
      .w1-program-card button,.w1-tab,.w1-help-choice{border:1px solid #ddd2e7;background:#fff;color:#5b2fa0;border-radius:8px;padding:8px 11px;font-size:.63rem;font-weight:800;cursor:pointer}
      .w1-program-card button{background:#5b2fa0;color:#fff;border-color:#5b2fa0}
      .w1-workspace-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:14px}
      .w1-workspace-head h2{font-size:1.25rem;margin:5px 0}.w1-workspace-head p{font-size:.72rem;line-height:1.5;color:#6d6671;max-width:760px;margin:0}
      .w1-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}.w1-tab.active{background:#5b2fa0;color:#fff;border-color:#5b2fa0}
      .w1-panel{border:1px solid #e6e1e9;border-radius:12px;background:#fff;padding:17px;min-height:190px}
      .w1-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.w1-mini{border:1px solid #ece7ef;border-radius:10px;background:#fcfbfd;padding:13px}.w1-mini b{display:block;font-size:.72rem;margin-bottom:5px}.w1-mini p,.w1-mini small{font-size:.62rem;line-height:1.45;color:#706977}
      .w1-stage-list,.w1-tool-list,.w1-progress-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.w1-list-item{border:1px solid #ece7ef;border-radius:9px;padding:11px 12px;background:#fcfbfd;font-size:.66rem;font-weight:750;color:#4b4450}
      .w1-help-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.w1-help-choice{text-align:left;color:#4d3e59}
      .w1-boundary{margin-top:14px;border:1px solid #e1d9e6;background:#faf7fc;border-radius:10px;padding:12px 13px;font-size:.61rem;line-height:1.5;color:#68606d}
      .w1-internal-note{border-left:3px solid #7a57a6;background:#f6f1f9;padding:10px 12px;margin:12px 0;font-size:.61rem;line-height:1.5;color:#5f5664}
      @media(max-width:760px){.w1-grid,.w1-cards,.w1-stage-list,.w1-tool-list,.w1-progress-list,.w1-help-grid{grid-template-columns:1fr}.w1-workspace-head{display:block}}
    `;
    document.head.appendChild(s);
  }

  function makePage(id){
    let page=document.getElementById('page-'+id);
    if(page)return page;
    page=document.createElement('section');
    page.className='page';
    page.id='page-'+id;
    document.querySelector('.content')?.appendChild(page);
    return page;
  }

  function renderProgramsPage(){
    const page=makePage('wave1-programs');
    page.innerHTML=`<div class="approved-inner">
      <div class="approved-inner-head"><div><span class="approved-kicker">WAVE 1 · INTERNAL PILOT</span><h2>My Programs — internal QA</h2><p>These Program Packs are implemented for controlled review only. They are not public launch status.</p></div><span class="w1-status">INTERNAL QA</span></div>
      <div class="w1-internal-note"><b>Shared Lellee core:</b> Today framework, Journal, Calendar, reminders, Document Vault, Resources, Trusted People, Progress, account/session infrastructure. Each Program Pack supplies its own stages, priorities, tools, help routing, evidence rules, resources, safety and language.</div>
      <div class="w1-grid">${Object.entries(PROGRAMS).map(([slug,p])=>`<article class="w1-program-card"><span class="w1-status">PILOT</span><h3>${esc(p.name)}</h3><p>${esc(p.subtitle)}</p><button type="button" data-w1-open="${esc(slug)}">Open internal workspace</button></article>`).join('')}</div>
    </div>`;
  }

  function panelHtml(slug,tab){
    const p=PROGRAMS[slug]; if(!p)return '';
    if(tab==='today')return `<div class="w1-cards">${p.today.map((x,i)=>`<article class="w1-mini"><b>${i===0?'Most Important Today':i===1?'Next useful step':'Keep it manageable'}</b><p>${esc(x)}</p></article>`).join('')}</div><div class="w1-boundary">Today intentionally surfaces a small number of meaningful actions first. More items belong behind progressive disclosure rather than becoming a long checklist.</div>`;
    if(tab==='journey')return `<div class="w1-stage-list">${p.stages.map((x,i)=>`<div class="w1-list-item">${i+1}. ${esc(x)}</div>`).join('')}</div><div class="w1-boundary">Stages guide emphasis; they are not grades or performance levels. History is preserved when circumstances change.</div>`;
    if(tab==='tools')return `<div class="w1-tool-list">${p.tools.map(x=>`<div class="w1-list-item">${esc(x)}</div>`).join('')}</div>`;
    if(tab==='help')return `<div class="w1-help-grid">${p.help.map(x=>`<button class="w1-help-choice" type="button" data-w1-help-choice>${esc(x)}</button>`).join('')}</div><div class="w1-boundary">“I Need Help” identifies the type of help first. Only genuine immediate-danger situations leave the ordinary workflow for the appropriate safety/emergency pathway.</div>`;
    if(tab==='resources')return `<div class="w1-cards"><article class="w1-mini"><b>Resources Agent</b><p>Finds and verifies relevant services, then returns a small set of practical matches.</p></article><article class="w1-mini"><b>Housing Agent</b><p>Handles housing searches when housing is part of the need, using only authorized search context.</p></article><article class="w1-mini"><b>Reminder Agent</b><p>Turns chosen follow-up steps into user-approved reminders.</p></article></div><div class="w1-boundary">Resource results should connect to documents, follow-up, reminders and trusted helpers rather than ending as a directory of links.</div>`;
    if(tab==='progress')return `<div class="w1-progress-list">${p.progress.map(x=>`<div class="w1-list-item">${esc(x)}</div>`).join('')}</div><div class="w1-boundary"><b>No score.</b> Progress is descriptive. Harder periods are treated as changed circumstances, not failure.</div>`;
    return '';
  }

  function renderWorkspace(slug='caregiving',tab='today'){
    if(!PROGRAMS[slug])slug='caregiving'; activeSlug=slug;
    const p=PROGRAMS[slug];
    const page=makePage('wave1-workspace');
    page.innerHTML=`<div class="approved-inner">
      <div class="w1-workspace-head"><div><span class="approved-kicker">INTERNAL PROGRAM PACK</span><h2>${esc(p.name)}</h2><p>${esc(p.subtitle)}</p></div><div><span class="w1-status">PILOT · NOT PUBLIC</span><button class="approved-link" type="button" data-page="wave1-programs">← All Wave 1 programs</button></div></div>
      <div class="w1-internal-note"><b>Opportunity-gap focus:</b> ${esc(p.differentiator)}</div>
      <div class="w1-tabs">${[['today','Today'],['journey','Journey'],['tools','Tools'],['help','I Need Help'],['resources','Resources'],['progress','Progress']].map(([k,l])=>`<button type="button" class="w1-tab ${k===tab?'active':''}" data-w1-tab="${k}">${l}</button>`).join('')}</div>
      <div id="w1ProgramPanel" class="w1-panel">${panelHtml(slug,tab)}</div>
    </div>`;
  }

  function ensureNavigation(){
    const inner=document.querySelector('.nav-category[data-category="account"] .nav-category-items-inner');
    if(!inner||inner.querySelector('[data-page="wave1-programs"]'))return;
    const b=document.createElement('button');
    b.type='button';b.className='nav-item';b.dataset.page='wave1-programs';b.id='wave1ProgramsNav';
    b.innerHTML='<span class="nav-icon">◫</span><span>My Programs (Pilot)</span>';
    inner.insertBefore(b,inner.firstChild);
  }

  async function checkAccess(){
    const c=client(),u=user();
    if(!c||!u)return false;
    if(window.LelleeAdminContext?.isAdmin===true)return true;
    try{
      const {data,error}=await c.rpc('is_lellee_admin');
      return !error&&data===true;
    }catch(_){return false}
  }

  function wire(){
    document.addEventListener('click',e=>{
      const open=e.target.closest('[data-w1-open]');
      if(open){renderWorkspace(open.dataset.w1Open,'today');navigate('wave1-workspace');return}
      const tab=e.target.closest('[data-w1-tab]');
      if(tab){renderWorkspace(activeSlug,tab.dataset.w1Tab);return}
      const help=e.target.closest('[data-w1-help-choice]');
      if(help){
        const panel=$('#w1ProgramPanel');
        if(panel)panel.insertAdjacentHTML('beforeend','<div class="w1-boundary"><b>QA placeholder:</b> The selected need will route to the appropriate Lellee tool, agent, trusted person, resource workflow, or safety pathway. No automatic diagnosis or emergency disposition.</div>');
      }
    },true);
  }

  async function start(){
    if(window.LelleeWave1ProgramRuntime?.version===VERSION)return;
    injectStyle();
    renderProgramsPage();
    renderWorkspace('caregiving','today');
    allowed=await checkAccess();
    if(allowed)ensureNavigation();
    wire();
    window.LelleeWave1ProgramRuntime=Object.freeze({version:VERSION,internalOnly:true,programs:Object.keys(PROGRAMS),open(slug){if(!allowed)return false;renderWorkspace(slug,'today');navigate('wave1-workspace');return true}});
    console.info('Lellee Wave 1 Program Pack runtime ready:',VERSION,allowed?'admin access enabled':'hidden for non-admin');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,900),{once:true});
  else setTimeout(start,900);
})();
