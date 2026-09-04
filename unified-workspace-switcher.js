(() => {
  'use strict';

  const $=s=>document.querySelector(s);
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const ACTIVE_KEY='lellee_active_workspace_v1';
  const RECENT_KEY='lellee_workspace_recent_v1';

  const PAGE_LABELS={
    today:'Today','program-switcher':'My Programs',inbox:'Inbox','life-admin':'My Plan','global-search':'Search Lellee','help-center':'Help Center',
    'coach-dashboard':'Coach Dashboard','coach-analytics':'Coach Analytics','coach-revenue':'Coach Revenue','coach-scheduler':'Scheduling & CRM','coach-automation':'Coach Automation','coach-credentials':'Credentials & Intake','coach-quickstart':'Coach Quick Start',
    'organization-dashboard':'Organization Dashboard','organization-analytics':'Organization Analytics','organization-commerce':'Licensing & Revenue','organization-outreach':'Organization Outreach','organization-automation':'Organization Automation','organization-integrations':'Organization Data Exchange','organization-forms':'Organization Forms','organization-quickstart':'Organization Quick Start',
    admin:'Admin','agent-workbench':'Agent Workbench','growth-center':'Growth Center','revenue-ops':'Revenue Operations','release-candidate':'Release Candidate','organization-admin':'Organization Admin','coach-admin':'Coach Admin','my-staff-work':'My Staff Work'
  };

  const WORKSPACE_PAGES={
    personal:new Set(['today','program-switcher','inbox','life-admin','global-search','help-center','settings','account','my-access','calendar','for-you','community','milestones','then-now','story','history','longterm','plus']),
    coach:new Set(['coach-business','coach-dashboard','coach-analytics','coach-revenue','coach-scheduler','coach-automation','coach-credentials','coach-quickstart','my-coaching']),
    organization:new Set(['organization-setup','organization-dashboard','organization-analytics','organization-commerce','organization-outreach','organization-automation','organization-integrations','organization-forms','organization-quickstart','sponsored-access']),
    admin:new Set(['admin','agent-workbench','growth-center','revenue-ops','release-candidate','organization-admin','coach-admin','my-staff-work','program-demand','program-builder'])
  };

  const QUICK={
    personal:[['today','Today','Your personal starting point.'],['program-switcher','My Programs','Recovery and any approved/pilot programs.'],['inbox','Inbox','Your private Lellee messages and updates.'],['life-admin','My Plan','Tasks, appointments, documents and practical next steps.'],['global-search','Search Lellee','Find programs, guidance, resources and practical tools.'],['help-center','Help','Find Lellee guidance and support.']],
    coach:[['coach-dashboard','Coach Dashboard','Clients, groups, services, messages, assignments and leads.'],['coach-analytics','Analytics','Business-operating metrics without private journal analysis.'],['coach-revenue','Revenue','Configured service and group economics.'],['coach-scheduler','Scheduling & CRM','Sessions, availability and follow-up.'],['coach-automation','Automation','Privacy-safe operational rules.'],['coach-credentials','Credentials & Intake','Claims, training and client intake.'],['coach-quickstart','Quick Start','See the next setup step.']],
    organization:[['organization-dashboard','Organization Dashboard','Licenses, sponsored access, cohorts, reports and team.'],['organization-analytics','Analytics','Aggregate utilization with privacy safeguards.'],['organization-commerce','Licensing & Revenue','Licenses and quote preparation.'],['organization-outreach','Outreach','Invitations, announcements and follow-up.'],['organization-automation','Automation','Operational rules and drafts only.'],['organization-integrations','Data Exchange','Staged roster/reporting/integration preparation.'],['organization-forms','Forms','Operational forms and aggregate surveys.'],['organization-quickstart','Quick Start','See the next organization setup step.']],
    admin:[['admin','Admin Home','Platform administration.'],['agent-workbench','Agent Workbench','Queue and review human-controlled agent work.'],['growth-center','Growth Center','Human-owned partnership pipeline.'],['revenue-ops','Revenue Operations','Plans, commerce preparation and revenue reporting.'],['organization-admin','Organization Admin','Review organization and licensing access.'],['coach-admin','Coach Admin','Review coaching-business access.'],['release-candidate','Release Candidate','Recovery release readiness without turning launch gates on.']]
  };

  let access={
    personal:{available:true,label:'Personal',status:'Available',detail:'Your private Lellee programs, tools, messages, resources and progress.',entry:'today',role:'Account owner'},
    coach:{available:false,label:'Coach',status:'Not connected',detail:'Run a coaching business without mixing coach operations into your Personal workspace.',entry:'coach-dashboard',setup:'coach-business'},
    organization:{available:false,label:'Organization',status:'Not connected',detail:'Manage sponsored access, cohorts and aggregate organization operations.',entry:'organization-dashboard',setup:'organization-setup'},
    admin:{available:false,label:'Admin',status:'Not connected',detail:'Platform administration and human-reviewed operational work.',entry:'admin'}
  };

  function bridge(){return window.LelleeAuthContext?.client?window.LelleeAuthContext:null}
  function user(){return bridge()?.getCurrentUser?.()||null}
  function sb(){return bridge()?.client}
  function setWorkspace(name){if(!access[name]?.available&&name!=='personal')return;try{localStorage.setItem(ACTIVE_KEY,name)}catch(_){}updateContextButton(name);renderWorkspaceHome()}
  function getWorkspace(){let w='personal';try{w=localStorage.getItem(ACTIVE_KEY)||'personal'}catch(_){}if(!access[w]?.available)w='personal';return w}
  function workspaceForPage(page){for(const [w,set] of Object.entries(WORKSPACE_PAGES))if(set.has(page))return w;return null}
  function nav(page){const w=workspaceForPage(page);if(w&&access[w]?.available)setWorkspace(w);recordRecent(page,w||getWorkspace());if(typeof window.showPage==='function'){window.showPage(page);return}const el=document.querySelector(`[data-page="${page}"]`);if(el)el.click()}
  function recordRecent(page,workspace){if(!PAGE_LABELS[page])return;let rows=[];try{rows=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')}catch(_){}rows=rows.filter(x=>x.page!==page);rows.unshift({page,workspace:workspace||'personal',at:Date.now()});rows=rows.slice(0,8);try{localStorage.setItem(RECENT_KEY,JSON.stringify(rows))}catch(_){}}
  function recentRows(){try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]').filter(x=>PAGE_LABELS[x.page]).slice(0,5)}catch(_){return[]}}

  async function loadAccess(){
    const c=bridge(),u=user();if(!c||!u)return;const client=c.client;
    try{const m=await client.from('coach_business_members').select('business_id,role,status').eq('user_id',u.id).eq('status','active').limit(1);if(!m.error&&m.data?.[0]){const b=await client.from('coach_businesses').select('id,business_name,public_name,status').eq('id',m.data[0].business_id).maybeSingle();access.coach.available=true;access.coach.role=m.data[0].role||'coach';access.coach.businessName=b.data?.business_name||b.data?.public_name||'Coaching Business';access.coach.status=b.data?.status?title(b.data.status):'Connected';access.coach.entry=b.data?.status==='approved'?'coach-dashboard':'coach-business'}}catch(_){}
    try{const m=await client.from('organization_members').select('organization_id,role,status').eq('user_id',u.id).eq('status','active').limit(1);if(!m.error&&m.data?.[0]){const o=await client.from('organizations').select('id,name,public_name,status').eq('id',m.data[0].organization_id).maybeSingle();access.organization.available=true;access.organization.role=m.data[0].role||'member';access.organization.businessName=o.data?.name||o.data?.public_name||'Organization';access.organization.status=o.data?.status?title(o.data.status):'Connected';access.organization.entry=o.data?.status==='approved'?'organization-dashboard':'organization-setup'}}catch(_){}

    try{
      const a=await client.rpc('is_lellee_admin');
      if(!a.error&&a.data===true){
        access.admin.available=true;access.admin.status='Active';access.admin.role='Administrator';
        window.LelleeAdminContext={...(window.LelleeAdminContext||{}),isAdmin:true};
        if(!access.coach.available){access.coach={...access.coach,available:true,label:'Coach Admin',status:'Admin oversight',detail:'Administrative oversight of coaching operations. Client membership and private journal access are not granted.',entry:'coach-admin',role:'Administrator',setup:null,oversight:true}}
        if(!access.organization.available){access.organization={...access.organization,available:true,label:'Organization Admin',status:'Admin oversight',detail:'Administrative oversight of organization operations. Membership and private participant data access are not granted.',entry:'organization-admin',role:'Administrator',setup:null,oversight:true}}
      }else{window.LelleeAdminContext={...(window.LelleeAdminContext||{}),isAdmin:false}}
    }catch(_){}

    const current=getWorkspace();if(current!=='personal'&&!access[current]?.available){try{localStorage.setItem(ACTIVE_KEY,'personal')}catch(_){}}
    const coachNav=$('#coachNavItem');if(coachNav)coachNav.classList.toggle('hidden',!access.coach.available||access.coach.oversight===true);
    updateContextButton(getWorkspace());renderWorkspaceHome();renderAccessPage();
  }

  function title(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
  function ensureContextButton(){if($('#workspaceContextButton'))return;const signout=$('#signOutBtn');if(!signout)return;const b=document.createElement('button');b.type='button';b.id='workspaceContextButton';b.className='workspace-context-button';b.innerHTML='<span class="dot"></span><span id="workspaceContextLabel">Personal</span>';b.addEventListener('click',()=>nav('workspace-home'));signout.parentElement?.insertBefore(b,signout)}
  function updateContextButton(w){ensureContextButton();const b=$('#workspaceContextButton'),l=$('#workspaceContextLabel');if(!b||!l)return;b.dataset.workspace=w;l.textContent=access[w]?.label||'Personal'}
  function cardHtml(key){const a=access[key],icon={personal:'P',coach:'C',organization:'O',admin:'A'}[key],current=getWorkspace()===key,name=a.businessName?`${a.label} · ${a.businessName}`:a.label;return `<article class="workspace-switch-card ${key} ${current?'current':''}"><div class="workspace-switch-top"><div style="display:flex;gap:10px;align-items:flex-start"><span class="workspace-switch-icon">${icon}</span><div><h3>${esc(name)}</h3><p>${esc(a.detail)}</p></div></div><span class="workspace-switch-pill">${esc(a.status)}</span></div><div class="workspace-switch-actions"><button class="primary" data-workspace-open="${key}">${current?'Open current workspace':'Switch & open'}</button><button data-workspace-access-detail="${key}">Access</button></div></article>`}

  function renderWorkspaceHome(){
    const host=$('#workspaceCardGrid');if(!host)return;const current=getWorkspace(),a=access[current]||access.personal;setText('workspaceCurrentName',a.businessName?`${a.label} · ${a.businessName}`:a.label);setText('workspaceCurrentDescription',a.detail);setText('workspaceCurrentPill',a.label.toUpperCase());
    const keys=['personal','coach','organization','admin'].filter(k=>access[k].available);host.innerHTML=keys.map(cardHtml).join('');
    const missing=[];if(!access.coach.available)missing.push(['coach-business','Coach Business']);if(!access.organization.available)missing.push(['organization-setup','Organization']);let add=$('#workspaceAddRoles');if(!add&&missing.length){add=document.createElement('div');add.id='workspaceAddRoles';add.className='workspace-switch-add';host.insertAdjacentElement('afterend',add)}if(add){if(!missing.length){add.remove()}else add.innerHTML=`<div><b>Add another role only when you need it.</b><small>Your Personal workspace remains separate from business and organization roles.</small></div><div class="workspace-switch-add-actions">${missing.map(x=>`<button data-page="${x[0]}">Set up ${x[1]}</button>`).join('')}</div>`}
    const recent=$('#workspaceRecentList'),rows=recentRows().filter(x=>access[x.workspace]?.available||x.workspace==='personal');if(recent)recent.innerHTML=rows.length?rows.map(x=>`<div class="workspace-recent-entry"><div><b>${esc(PAGE_LABELS[x.page])}</b><small>${esc(access[x.workspace]?.label||'Personal')} · ${new Date(x.at).toLocaleString()}</small></div><button data-workspace-recent-page="${esc(x.page)}">Open</button></div>`).join(''):`<div class="workspace-recent-entry"><div><b>No recent workspace activity yet.</b><small>Your recent workspace destinations will appear here.</small></div></div>`;
    const quick=$('#workspaceQuickGrid'),items=QUICK[current]||QUICK.personal;if(quick)quick.innerHTML=items.map(x=>`<article class="workspace-quick-entry"><div><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div><button data-workspace-quick-page="${esc(x[0])}">Open</button></article>`).join('')
  }

  function renderAccessPage(){const host=$('#workspaceAccessList');if(!host)return;const keys=['personal','coach','organization','admin'];host.innerHTML=keys.map(k=>{const a=access[k],available=a.available||k==='personal',name=a.businessName?`${a.label} · ${a.businessName}`:a.label;return `<article class="workspace-access-entry"><div><b>${esc(name)}</b><small>${esc(a.detail)}</small><div class="workspace-access-meta"><span class="workspace-access-tag">${available?'CONNECTED':'NOT CONNECTED'}</span><span class="workspace-access-tag">${esc(a.status)}</span>${a.role?`<span class="workspace-access-tag">${esc(title(a.role))}</span>`:''}</div></div>${available?`<button data-workspace-open="${k}">Open</button>`:(a.setup?`<button data-page="${a.setup}">Set up</button>`:'')}</article>`}).join('')}
  function setText(id,v){const e=$('#'+id);if(e)e.textContent=v}

  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-workspace-open]');if(open){e.preventDefault();e.stopImmediatePropagation();const w=open.dataset.workspaceOpen;if(access[w]?.available){if(access[w].oversight){setWorkspace('admin');nav(access[w].entry)}else{setWorkspace(w);nav(access[w].entry)}}return}
    const recent=e.target.closest('[data-workspace-recent-page]');if(recent){e.preventDefault();e.stopImmediatePropagation();nav(recent.dataset.workspaceRecentPage);return}
    const quick=e.target.closest('[data-workspace-quick-page]');if(quick){e.preventDefault();e.stopImmediatePropagation();nav(quick.dataset.workspaceQuickPage);return}
    const detail=e.target.closest('[data-workspace-access-detail]');if(detail){e.preventDefault();e.stopImmediatePropagation();nav('workspace-access');return}
    const page=e.target.closest('[data-page]');if(page){const p=page.dataset.page,w=workspaceForPage(p);if(w&&access[w]?.available){try{localStorage.setItem(ACTIVE_KEY,w)}catch(_){}updateContextButton(w)}if(PAGE_LABELS[p])recordRecent(p,w||getWorkspace());if(p==='workspace-home')setTimeout(renderWorkspaceHome,25);if(p==='workspace-access')setTimeout(renderAccessPage,25)}
  },true);

  function boot(){ensureContextButton();let tries=0;const timer=setInterval(async()=>{tries++;if(bridge()&&user()){clearInterval(timer);await loadAccess();const active=$('.page.active')?.id?.replace('page-',''),w=workspaceForPage(active);if(w&&access[w]?.available){try{localStorage.setItem(ACTIVE_KEY,w)}catch(_){}updateContextButton(w)}}if(tries>240)clearInterval(timer)},250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.LelleeUnifiedWorkspaces={loadAccess,renderWorkspaceHome,renderAccessPage};
})();