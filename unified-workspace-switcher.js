(() => {
  'use strict';

  const $=s=>document.querySelector(s);
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ACTIVE_KEY='lellee_active_workspace_v1';
  const RECENT_KEY='lellee_workspace_recent_v1';
  const ADMIN_TAB_KEY='lellee_admin_tab_v1';

  const PAGE_LABELS={
    today:'Today',
    'program-switcher':'My Programs',
    inbox:'Inbox',
    'life-admin':'My Plan',
    'global-search':'Search Lellee',
    'help-center':'Help Center',
    'coach-dashboard':'Coach Dashboard',
    'coach-analytics':'Coach Analytics',
    'coach-revenue':'Coach Revenue',
    'coach-scheduler':'Scheduling & CRM',
    'coach-automation':'Coach Automation',
    'coach-credentials':'Credentials & Intake',
    'coach-quickstart':'Coach Quick Start',
    'organization-dashboard':'Organization Dashboard',
    'organization-analytics':'Organization Analytics',
    'organization-commerce':'Licensing & Revenue',
    'organization-outreach':'Organization Outreach',
    'organization-automation':'Organization Automation',
    'organization-integrations':'Organization Data Exchange',
    'organization-forms':'Organization Forms',
    'organization-quickstart':'Organization Quick Start',
    admin:'Admin',
    analytics:'Analytics & Insights',
    'program-builder':'Program Builder',
    'program-demand':'Program Demand',
    'content-studio':'Content Studio',
    'safety-profile-builder':'Safety Profiles',
    'platform-health':'Platform Health',
    'agent-workbench':'Agent Workbench',
    'growth-center':'Growth Center',
    'revenue-ops':'Revenue Operations',
    'release-candidate':'Release Candidate',
    'organization-admin':'Organization Admin',
    'coach-admin':'Coach Admin',
    'my-staff-work':'My Staff Work',
    'resource-admin':'Resource Quality',
    'pilot-enrollment-admin':'Pilot Enrollment',
    'communications-admin':'Communications Admin',
    'support-ops':'Support Operations',
    'privacy-ops':'Privacy Operations',
    'trust-ops':'Trust & Audit',
    'automation-studio':'Automation Studio',
    'experience-studio':'Experience Studio',
    'qa-center':'QA Center',
    'pilot-operations':'Pilot Operations',
    'release-center':'Release Center',
    'reliability-center':'Reliability',
    'security-operations':'Security & Continuity',
    'integration-center':'Integration Center',
    'community-ops':'Community Operations',
    'forms-studio':'Forms Studio',
    'credentialing-center':'Credentialing',
    'staff-operations':'Staff Operations',
    'collaboration-ops':'Collaboration Operations',
    'knowledge-studio':'Knowledge Studio',
    'provider-network-ops':'Provider Network',
    'communications-ops':'Communications Operations',
    'platform-integrity':'Platform Integrity',
    'admin-agent-operations':'Agent Controls',
    'agent-operations':'Agent Operations',
    'contract-operations':'Contract Operations',
    'customer-success':'Customer Success',
    'revenue-operations':'Revenue Operations',
    'executive-intelligence':'Executive Intelligence',
    'data-governance':'Data Governance',
    'product-discovery':'Product Discovery',
    'search-taxonomy':'Search & Taxonomy',
    'physical-commerce':'Physical Commerce',
    'supply-chain':'Supply Chain',
    'pwa-operations':'PWA & Mobile'
  };

  const ADMIN_PAGE_IDS=[
    'admin','analytics','program-builder','program-demand','content-studio','safety-profile-builder','platform-health','agent-workbench','growth-center','revenue-ops','release-candidate','organization-admin','coach-admin','my-staff-work',
    'resource-admin','pilot-enrollment-admin','communications-admin','support-ops','privacy-ops','trust-ops','automation-studio','experience-studio','qa-center','pilot-operations','release-center','reliability-center','security-operations','integration-center','community-ops','forms-studio','credentialing-center','staff-operations','collaboration-ops','knowledge-studio','provider-network-ops','communications-ops','platform-integrity','admin-agent-operations','agent-operations','contract-operations','customer-success','revenue-operations','executive-intelligence','data-governance','product-discovery','search-taxonomy','physical-commerce','supply-chain','pwa-operations'
  ];

  const WORKSPACE_PAGES={
    personal:new Set(['today','program-switcher','inbox','life-admin','global-search','help-center','settings','account','my-access','calendar','for-you','community','milestones','then-now','story','history','longterm','plus']),
    coach:new Set(['coach-business','coach-dashboard','coach-analytics','coach-revenue','coach-scheduler','coach-automation','coach-credentials','coach-quickstart','my-coaching']),
    organization:new Set(['organization-setup','organization-dashboard','organization-analytics','organization-commerce','organization-outreach','organization-automation','organization-integrations','organization-forms','organization-quickstart','sponsored-access']),
    admin:new Set(ADMIN_PAGE_IDS)
  };

  const QUICK={
    personal:[
      ['today','Today','Your personal starting point.'],
      ['program-switcher','My Programs','Recovery and any approved/pilot programs.'],
      ['inbox','Inbox','Your private Lellee messages and updates.'],
      ['life-admin','My Plan','Tasks, appointments, documents and practical next steps.'],
      ['global-search','Search Lellee','Find programs, guidance, resources and practical tools.'],
      ['help-center','Help','Find Lellee guidance and support.']
    ],
    coach:[
      ['coach-dashboard','Coach Dashboard','Clients, groups, services, messages, assignments and leads.'],
      ['coach-analytics','Analytics','Business-operating metrics without private journal analysis.'],
      ['coach-revenue','Revenue','Configured service and group economics.'],
      ['coach-scheduler','Scheduling & CRM','Sessions, availability and follow-up.'],
      ['coach-automation','Automation','Privacy-safe operational rules.'],
      ['coach-credentials','Credentials & Intake','Claims, training and client intake.'],
      ['coach-quickstart','Quick Start','See the next setup step.']
    ],
    organization:[
      ['organization-dashboard','Organization Dashboard','Licenses, sponsored access, cohorts, reports and team.'],
      ['organization-analytics','Analytics','Aggregate utilization with privacy safeguards.'],
      ['organization-commerce','Licensing & Revenue','Licenses and quote preparation.'],
      ['organization-outreach','Outreach','Invitations, announcements and follow-up.'],
      ['organization-automation','Automation','Operational rules and drafts only.'],
      ['organization-integrations','Data Exchange','Staged roster/reporting/integration preparation.'],
      ['organization-forms','Forms','Operational forms and aggregate surveys.'],
      ['organization-quickstart','Quick Start','See the next organization setup step.']
    ]
  };

  const ADMIN_TABS=[
    {key:'overview',label:'Overview',items:[['admin','Admin Home','Platform administration and priority controls.'],['platform-health','Platform Health','Integration and system health checks.'],['release-candidate','Release Candidate','Recovery release readiness without turning launch gates on.'],['my-staff-work','My Staff Work','Your assigned operational work.']]},
    {key:'people',label:'People',items:[['organization-admin','Organization Admin','Review organization and licensing access.'],['coach-admin','Coach Admin','Review coaching-business access.']]},
    {key:'programs',label:'Programs',items:[['program-builder','Program Builder','Build and maintain Lellee programs.'],['program-demand','Program Demand','Review demand and program opportunity signals.']]},
    {key:'content',label:'Content',items:[['content-studio','Content Studio','Create, review and publish program content.']]},
    {key:'operations',label:'Operations',items:[['agent-workbench','Agent Workbench','Queue and review human-controlled agent work.'],['growth-center','Growth Center','Human-owned partnership pipeline.'],['revenue-ops','Revenue Operations','Plans, commerce preparation and revenue reporting.']]},
    {key:'safety',label:'Safety',items:[['safety-profile-builder','Safety Profiles','Program safety controls and review.']]},
    {key:'analytics',label:'Analytics',items:[['analytics','Analytics & Insights','Platform performance and operating insights.']]}
  ];

  const ADMIN_HOME_GROUPS=[
    {
      key:'programs-content',label:'Programs & Content',icon:'01',detail:'Programs, content, resources, forms, knowledge and search.',
      items:[
        {label:'Program Builder',pages:[['program-builder','Open']]},
        {label:'Content Studio',pages:[['content-studio','Open']]},
        {label:'Resource Quality',pages:[['resource-admin','Open']]},
        {label:'Experience Studio',pages:[['experience-studio','Open']]},
        {label:'Knowledge Studio',pages:[['knowledge-studio','Open']]},
        {label:'Forms Studio',pages:[['forms-studio','Open']]},
        {label:'Search & Taxonomy',pages:[['search-taxonomy','Open']]}
      ]
    },
    {
      key:'people-partners',label:'People & Partners',icon:'02',detail:'Coach, organization, credential, provider and staff administration.',
      items:[
        {label:'Coach Approvals',pages:[['coach-admin','Open']]},
        {label:'Organizations',pages:[['organization-admin','Open']]},
        {label:'Credentialing',pages:[['credentialing-center','Open']]},
        {label:'Provider Network',pages:[['provider-network-ops','Open']]},
        {label:'Staff Operations',pages:[['staff-operations','Open']]},
        {label:'Collaboration',pages:[['collaboration-ops','Open']]},
        {label:'Customer Success',pages:[['customer-success','Open']]}
      ]
    },
    {
      key:'operations-automation',label:'Operations & Automation',icon:'03',detail:'Operational workflows, automation, agents, communications and pilots.',
      items:[
        {label:'Agent Operations',pages:[['admin-agent-operations','Controls'],['agent-operations','Operations'],['agent-workbench','Workbench']]},
        {label:'Automation Studio',pages:[['automation-studio','Open']]},
        {label:'Communications',pages:[['communications-admin','Admin'],['communications-ops','Operations']]},
        {label:'Support Operations',pages:[['support-ops','Open']]},
        {label:'Community Operations',pages:[['community-ops','Open']]},
        {label:'Pilots',pages:[['pilot-enrollment-admin','Enrollment'],['pilot-operations','Operations']]}
      ]
    },
    {
      key:'safety-privacy',label:'Safety, Privacy & Trust',icon:'04',detail:'Safety controls, privacy, audit and quality assurance.',
      items:[
        {label:'Safety Profiles',pages:[['safety-profile-builder','Open']]},
        {label:'Privacy Operations',pages:[['privacy-ops','Open']]},
        {label:'Trust & Audit',pages:[['trust-ops','Open']]},
        {label:'QA Center',pages:[['qa-center','Open']]}
      ]
    },
    {
      key:'growth-revenue',label:'Growth, Revenue & Commerce',icon:'05',detail:'Growth, revenue, contracts, commerce, sourcing and product discovery.',
      items:[
        {label:'Growth Center',pages:[['growth-center','Open']]},
        {label:'Revenue Operations',pages:[['revenue-ops','Core'],['revenue-operations','Operations']]},
        {label:'Contract Operations',pages:[['contract-operations','Open']]},
        {label:'Physical Commerce',pages:[['physical-commerce','Open']]},
        {label:'Supply Chain',pages:[['supply-chain','Open']]},
        {label:'Product Discovery',pages:[['product-discovery','Open']]}
      ]
    },
    {
      key:'data-intelligence',label:'Data & Intelligence',icon:'06',detail:'Analytics, executive intelligence and data governance.',
      items:[
        {label:'Analytics & Insights',pages:[['analytics','Open']]},
        {label:'Executive Intelligence',pages:[['executive-intelligence','Open']]},
        {label:'Data Governance',pages:[['data-governance','Open']]}
      ]
    },
    {
      key:'platform-release',label:'Platform & Release',icon:'07',detail:'Platform health, reliability, security, integrations and release operations.',
      items:[
        {label:'Platform Health',pages:[['platform-health','Open']]},
        {label:'Reliability',pages:[['reliability-center','Open']]},
        {label:'Platform Integrity',pages:[['platform-integrity','Open']]},
        {label:'Security & Continuity',pages:[['security-operations','Open']]},
        {label:'Integration Center',pages:[['integration-center','Open']]},
        {label:'Release',pages:[['release-candidate','Candidate'],['release-center','Center']]},
        {label:'PWA & Mobile',pages:[['pwa-operations','Open']]}
      ]
    }
  ];

  let access={
    personal:{available:true,label:'Personal',status:'Available',detail:'Your private Lellee programs, tools, messages, resources and progress.',entry:'today',role:'Account owner'},
    coach:{available:false,label:'Coach',status:'Not connected',detail:'Run a coaching business without mixing coach operations into your Personal workspace.',entry:'coach-dashboard',setup:'coach-business'},
    organization:{available:false,label:'Organization',status:'Not connected',detail:'Manage sponsored access, cohorts and aggregate organization operations.',entry:'organization-dashboard',setup:'organization-setup'},
    admin:{available:false,label:'Admin',status:'Not connected',detail:'Platform administration and human-reviewed operational work.',entry:'admin'}
  };

  let quickObserver=null;
  let quickRenderQueued=false;

  function bridge(){return window.LelleeAuthContext?.client?window.LelleeAuthContext:null}
  function user(){return bridge()?.getCurrentUser?.()||null}
  function sb(){return bridge()?.client}
  function setWorkspace(name){
    if(!access[name]?.available && name!=='personal') return;
    try{localStorage.setItem(ACTIVE_KEY,name)}catch(_){}
    updateContextButton(name);
    renderWorkspaceHome();
  }
  function getWorkspace(){
    let w='personal';
    try{w=localStorage.getItem(ACTIVE_KEY)||'personal'}catch(_){}
    if(!access[w]?.available)w='personal';
    return w;
  }
  function workspaceForPage(page){
    for(const [w,set] of Object.entries(WORKSPACE_PAGES)) if(set.has(page)) return w;
    return null;
  }
  function nav(page){
    const w=workspaceForPage(page);
    if(w && access[w]?.available) setWorkspace(w);
    recordRecent(page,w||getWorkspace());
    if(typeof window.showPage==='function'){window.showPage(page);return}
    const el=document.querySelector(`[data-page="${page}"]`);
    if(el){el.click();return}
  }
  function recordRecent(page,workspace){
    if(!PAGE_LABELS[page])return;
    let rows=[];
    try{rows=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')}catch(_){}
    rows=rows.filter(x=>x.page!==page);
    rows.unshift({page,workspace:workspace||'personal',at:Date.now()});
    rows=rows.slice(0,8);
    try{localStorage.setItem(RECENT_KEY,JSON.stringify(rows))}catch(_){}
  }
  function recentRows(){
    try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]').filter(x=>PAGE_LABELS[x.page]).slice(0,5)}catch(_){return []}
  }

  async function loadAccess(){
    const c=bridge(),u=user();if(!c||!u)return;
    const client=c.client;

    try{
      const m=await client.from('coach_business_members').select('business_id,role,status').eq('user_id',u.id).eq('status','active').limit(1);
      if(!m.error && m.data?.[0]){
        const b=await client.from('coach_businesses').select('id,business_name,public_name,status').eq('id',m.data[0].business_id).maybeSingle();
        access.coach.available=true;
        access.coach.role=m.data[0].role||'coach';
        access.coach.businessName=b.data?.business_name||b.data?.public_name||'Coaching Business';
        access.coach.status=b.data?.status ? title(b.data.status) : 'Connected';
        access.coach.entry=b.data?.status==='approved'?'coach-dashboard':'coach-business';
      }
    }catch(_){}

    try{
      const m=await client.from('organization_members').select('organization_id,role,status').eq('user_id',u.id).eq('status','active').limit(1);
      if(!m.error && m.data?.[0]){
        const o=await client.from('organizations').select('id,name,public_name,status').eq('id',m.data[0].organization_id).maybeSingle();
        access.organization.available=true;
        access.organization.role=m.data[0].role||'member';
        access.organization.businessName=o.data?.name||o.data?.public_name||'Organization';
        access.organization.status=o.data?.status ? title(o.data.status) : 'Connected';
        access.organization.entry=o.data?.status==='approved'?'organization-dashboard':'organization-setup';
      }
    }catch(_){}

    try{
      const a=await client.rpc('is_lellee_admin');
      if(!a.error && a.data===true){
        access.admin.available=true;access.admin.status='Active';access.admin.role='Administrator';
      }
    }catch(_){}

    const current=getWorkspace();
    if(current!=='personal'&&!access[current]?.available){
      try{localStorage.setItem(ACTIVE_KEY,'personal')}catch(_){}
    }

    const coachNav=$('#coachNavItem');
    if(coachNav)coachNav.classList.toggle('hidden',!access.coach.available);

    updateContextButton(getWorkspace());
    renderWorkspaceHome();
    renderAccessPage();
    renderAdminHomeConsolidation();
  }

  function title(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}

  function ensureContextButton(){
    if($('#workspaceContextButton'))return;
    const signout=$('#signOutBtn');
    if(!signout)return;
    const b=document.createElement('button');
    b.type='button';b.id='workspaceContextButton';b.className='workspace-context-button';
    b.innerHTML='<span class="dot"></span><span id="workspaceContextLabel">Personal</span>';
    b.addEventListener('click',()=>nav('workspace-home'));
    signout.parentElement?.insertBefore(b,signout);
  }
  function updateContextButton(w){
    ensureContextButton();
    const b=$('#workspaceContextButton'),l=$('#workspaceContextLabel');
    if(!b||!l)return;
    b.dataset.workspace=w;
    l.textContent=access[w]?.label||'Personal';
  }

  function cardHtml(key){
    const a=access[key];
    const icon={personal:'P',coach:'C',organization:'O',admin:'A'}[key];
    const current=getWorkspace()===key;
    const name=a.businessName?`${a.label} · ${a.businessName}`:a.label;
    return `<article class="workspace-switch-card ${key} ${current?'current':''}">
      <div class="workspace-switch-top">
        <div style="display:flex;gap:10px;align-items:flex-start">
          <span class="workspace-switch-icon">${icon}</span>
          <div><h3>${esc(name)}</h3><p>${esc(a.detail)}</p></div>
        </div>
        <span class="workspace-switch-pill">${esc(a.status)}</span>
      </div>
      <div class="workspace-switch-actions">
        <button class="primary" data-workspace-open="${key}">${current?'Open current workspace':'Switch & open'}</button>
        <button data-workspace-access-detail="${key}">Access</button>
      </div>
    </article>`;
  }

  function ensureAdminTabStyles(){
    if($('#lelleeAdminWorkspaceTabsStyle'))return;
    const style=document.createElement('style');
    style.id='lelleeAdminWorkspaceTabsStyle';
    style.textContent=`
      .workspace-admin-tabs{grid-column:1/-1;display:grid;gap:12px;min-width:0}
      .workspace-admin-tabbar{display:flex;flex-wrap:wrap;gap:7px;align-items:center}
      .workspace-admin-tab{border:1px solid var(--line);background:var(--white);color:var(--ink);border-radius:999px;padding:8px 11px;font-size:.67rem;font-weight:850;line-height:1}
      .workspace-admin-tab:hover{background:var(--lav)}
      .workspace-admin-tab.active{background:var(--lav);border-color:var(--lav2);color:var(--purple)}
      .workspace-admin-panel{display:grid;gap:10px}
      .workspace-admin-panel .workspace-quick-entry{margin:0}
      @media(max-width:820px){
        .workspace-admin-tabbar{flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}
        .workspace-admin-tab{flex:0 0 auto}
      }`;
    document.head.appendChild(style);
  }

  function ensureAdminHomeStyles(){
    if($('#lelleeAdminHomeConsolidationStyle'))return;
    const style=document.createElement('style');
    style.id='lelleeAdminHomeConsolidationStyle';
    style.textContent=`
      #page-admin .admin-home-consolidated-head{display:block!important;align-items:stretch!important;padding-bottom:14px}
      .admin-home-top{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:13px}
      .admin-home-top h2{font-size:1rem;margin:3px 0 3px}.admin-home-top p{margin:0;color:#77727b;font-size:.67rem;line-height:1.45;max-width:700px}
      .admin-home-attention{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:9px 10px;border:1px solid #e6dfea;background:#fbf9fd;border-radius:10px;margin-bottom:12px}
      .admin-home-attention b{font-size:.62rem;color:#5d4774;margin-right:3px}.admin-home-attention button{border:1px solid #ddd3e6;background:#fff;color:#5a3d7d;border-radius:8px;padding:6px 8px;font-size:.56rem;font-weight:850}
      .admin-home-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:9px}
      .admin-home-card{border:1px solid #e3dce8;background:#fff;border-radius:12px;padding:12px;text-align:left;color:#31293a;min-height:92px;display:grid;grid-template-columns:34px 1fr auto;gap:9px;align-items:start;box-shadow:0 3px 10px rgba(40,28,52,.035)}
      .admin-home-card:hover{border-color:#cdbbe0;background:#fdfbff}.admin-home-card.active{border-color:#8f6ab5;background:#f6f0fb}
      .admin-home-num{width:32px;height:32px;border-radius:9px;background:#eee6f7;color:#65409a;display:grid;place-items:center;font-size:.58rem;font-weight:900}
      .admin-home-card b{display:block;font-size:.7rem;margin-bottom:3px}.admin-home-card small{display:block;color:#766e7b;font-size:.56rem;line-height:1.35}.admin-home-arrow{font-size:.72rem;color:#806795;margin-top:4px}
      .admin-home-detail{margin-top:11px;border:1px solid #e3dce8;background:#fbfafc;border-radius:12px;padding:12px;display:none}
      .admin-home-detail.open{display:block}.admin-home-detail-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px}.admin-home-detail-head b{font-size:.72rem}.admin-home-detail-head small{font-size:.56rem;color:#78707c}
      .admin-home-tool-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
      .admin-home-tool-row{border:1px solid #e5dfe9;background:#fff;border-radius:9px;padding:9px 10px;display:flex;justify-content:space-between;align-items:center;gap:8px;min-width:0}
      .admin-home-tool-row>span{font-size:.62rem;font-weight:800;color:#403647}.admin-home-tool-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.admin-home-tool-actions button{border:1px solid #ddd4e3;background:#fff;color:#5c4771;border-radius:7px;padding:5px 7px;font-size:.52rem;font-weight:850;white-space:nowrap}
      @media(max-width:760px){.admin-home-top{display:block}.admin-home-top .admin-role-pill{display:inline-block;margin-top:8px}.admin-home-tool-list{grid-template-columns:1fr}}
      @media(max-width:520px){.admin-home-grid{grid-template-columns:1fr}.admin-home-card{min-height:0}.admin-home-tool-row{display:block}.admin-home-tool-actions{justify-content:flex-start;margin-top:7px}}
    `;
    document.head.appendChild(style);
  }

  function renderAdminHomeGroup(key){
    const group=ADMIN_HOME_GROUPS.find(x=>x.key===key);
    const panel=$('#adminHomeGroupDetail');
    if(!group||!panel)return;
    document.querySelectorAll('[data-admin-home-group]').forEach(b=>b.classList.toggle('active',b.dataset.adminHomeGroup===key));
    panel.classList.add('open');
    panel.innerHTML=`
      <div class="admin-home-detail-head"><b>${esc(group.label)}</b><small>${esc(group.detail)}</small></div>
      <div class="admin-home-tool-list">
        ${group.items.map(item=>`<div class="admin-home-tool-row"><span>${esc(item.label)}</span><div class="admin-home-tool-actions">${item.pages.map(p=>`<button type="button" data-page="${esc(p[0])}">${esc(p[1])}</button>`).join('')}</div></div>`).join('')}
      </div>`;
  }

  function renderAdminHomeConsolidation(){
    const page=$('#page-admin');
    const head=page?.querySelector('.approved-inner-head');
    if(!head)return;
    ensureAdminHomeStyles();
    head.classList.add('admin-home-consolidated-head');
    head.innerHTML=`
      <div class="admin-home-top">
        <div><span class="approved-kicker">ADMIN</span><h2>Operate Lellee without touching the database directly</h2><p>Use seven control areas instead of dozens of separate Admin buttons. Detailed tools appear only when you open a category.</p></div>
        <span class="admin-role-pill" id="adminRoleBadge">ADMIN</span>
      </div>
      <div class="admin-home-attention" aria-label="Needs attention">
        <b>Needs Attention</b>
        <button type="button" data-page="coach-admin">Coach Approvals</button>
        <button type="button" data-page="organization-admin">Organizations</button>
        <button type="button" data-page="trust-ops">Trust & Audit</button>
        <button type="button" data-page="qa-center">QA Center</button>
      </div>
      <div class="admin-home-grid" aria-label="Admin control areas">
        ${ADMIN_HOME_GROUPS.map(g=>`<button type="button" class="admin-home-card" data-admin-home-group="${esc(g.key)}"><span class="admin-home-num">${esc(g.icon)}</span><span><b>${esc(g.label)}</b><small>${esc(g.detail)}</small></span><span class="admin-home-arrow">›</span></button>`).join('')}
      </div>
      <div class="admin-home-detail" id="adminHomeGroupDetail" aria-live="polite"></div>`;
  }

  function getAdminTab(){
    let key='overview';
    try{key=localStorage.getItem(ADMIN_TAB_KEY)||'overview'}catch(_){}
    return ADMIN_TABS.some(x=>x.key===key)?key:'overview';
  }

  function renderAdminQuick(quick){
    if(!quick)return;
    ensureAdminTabStyles();
    const selected=getAdminTab();
    const tab=ADMIN_TABS.find(x=>x.key===selected)||ADMIN_TABS[0];
    quick.innerHTML=`
      <div class="workspace-admin-tabs">
        <div class="workspace-admin-tabbar" role="tablist" aria-label="Admin sections">
          ${ADMIN_TABS.map(x=>`<button type="button" class="workspace-admin-tab ${x.key===tab.key?'active':''}" role="tab" aria-selected="${x.key===tab.key?'true':'false'}" data-admin-workspace-tab="${esc(x.key)}">${esc(x.label)}</button>`).join('')}
        </div>
        <div class="workspace-admin-panel" role="tabpanel" aria-label="${esc(tab.label)}">
          ${tab.items.map(x=>`<article class="workspace-quick-entry"><div><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div><button data-workspace-quick-page="${esc(x[0])}">Open</button></article>`).join('')}
        </div>
      </div>`;
  }

  function ensureQuickOwnership(){
    const quick=$('#workspaceQuickGrid');
    if(!quick||quickObserver)return;
    quickObserver=new MutationObserver(()=>{
      if(getWorkspace()!=='admin'||quick.querySelector('.workspace-admin-tabs')||quickRenderQueued)return;
      quickRenderQueued=true;
      queueMicrotask(()=>{
        quickRenderQueued=false;
        if(getWorkspace()==='admin'&&!quick.querySelector('.workspace-admin-tabs'))renderAdminQuick(quick);
      });
    });
    quickObserver.observe(quick,{childList:true});
  }

  function renderWorkspaceHome(){
    const host=$('#workspaceCardGrid');if(!host)return;
    const current=getWorkspace(),a=access[current]||access.personal;
    setText('workspaceCurrentName',a.businessName?`${a.label} · ${a.businessName}`:a.label);
    setText('workspaceCurrentDescription',a.detail);
    setText('workspaceCurrentPill',a.label.toUpperCase());

    const keys=['personal','coach','organization','admin'].filter(k=>access[k].available);
    host.innerHTML=keys.map(cardHtml).join('');

    const missing=[];
    if(!access.coach.available)missing.push(['coach-business','Coach Business']);
    if(!access.organization.available)missing.push(['organization-setup','Organization']);
    let add=$('#workspaceAddRoles');
    if(!add && missing.length){
      add=document.createElement('div');add.id='workspaceAddRoles';add.className='workspace-switch-add';
      host.insertAdjacentElement('afterend',add);
    }
    if(add){
      if(!missing.length){add.remove()}
      else add.innerHTML=`<div><b>Add another role only when you need it.</b><small>Your Personal workspace remains separate from business and organization roles.</small></div><div class="workspace-switch-add-actions">${missing.map(x=>`<button data-page="${x[0]}">Set up ${x[1]}</button>`).join('')}</div>`;
    }

    const recent=$('#workspaceRecentList');
    const rows=recentRows().filter(x=>access[x.workspace]?.available || x.workspace==='personal');
    if(recent)recent.innerHTML=rows.length?rows.map(x=>`<div class="workspace-recent-entry"><div><b>${esc(PAGE_LABELS[x.page])}</b><small>${esc(access[x.workspace]?.label||'Personal')} · ${new Date(x.at).toLocaleString()}</small></div><button data-workspace-recent-page="${esc(x.page)}">Open</button></div>`).join(''):`<div class="workspace-recent-entry"><div><b>No recent workspace activity yet.</b><small>Your recent workspace destinations will appear here.</small></div></div>`;

    const quick=$('#workspaceQuickGrid');
    if(current==='admin')renderAdminQuick(quick);
    else{
      const items=QUICK[current]||QUICK.personal;
      if(quick)quick.innerHTML=items.map(x=>`<article class="workspace-quick-entry"><div><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div><button data-workspace-quick-page="${esc(x[0])}">Open</button></article>`).join('');
    }
    ensureQuickOwnership();
  }

  function renderAccessPage(){
    const host=$('#workspaceAccessList');if(!host)return;
    const keys=['personal','coach','organization','admin'];
    host.innerHTML=keys.map(k=>{
      const a=access[k];
      const available=a.available||k==='personal';
      const name=a.businessName?`${a.label} · ${a.businessName}`:a.label;
      return `<article class="workspace-access-entry"><div><b>${esc(name)}</b><small>${esc(a.detail)}</small><div class="workspace-access-meta"><span class="workspace-access-tag">${available?'CONNECTED':'NOT CONNECTED'}</span><span class="workspace-access-tag">${esc(a.status)}</span>${a.role?`<span class="workspace-access-tag">${esc(title(a.role))}</span>`:''}</div></div>${available?`<button data-workspace-open="${k}">Open</button>`:(a.setup?`<button data-page="${a.setup}">Set up</button>`:'')}</article>`;
    }).join('');
  }

  function setText(id,v){const e=$('#'+id);if(e)e.textContent=v}

  document.addEventListener('click',e=>{
    const group=e.target.closest('[data-admin-home-group]');
    if(group){e.preventDefault();e.stopImmediatePropagation();renderAdminHomeGroup(group.dataset.adminHomeGroup);return}

    const tab=e.target.closest('[data-admin-workspace-tab]');
    if(tab){e.preventDefault();e.stopImmediatePropagation();try{localStorage.setItem(ADMIN_TAB_KEY,tab.dataset.adminWorkspaceTab)}catch(_){}renderAdminQuick($('#workspaceQuickGrid'));return}

    const open=e.target.closest('[data-workspace-open]');
    if(open){e.preventDefault();e.stopImmediatePropagation();const w=open.dataset.workspaceOpen;if(access[w]?.available){setWorkspace(w);nav(access[w].entry)}return}

    const recent=e.target.closest('[data-workspace-recent-page]');
    if(recent){e.preventDefault();e.stopImmediatePropagation();nav(recent.dataset.workspaceRecentPage);return}

    const quick=e.target.closest('[data-workspace-quick-page]');
    if(quick){e.preventDefault();e.stopImmediatePropagation();nav(quick.dataset.workspaceQuickPage);return}

    const detail=e.target.closest('[data-workspace-access-detail]');
    if(detail){e.preventDefault();e.stopImmediatePropagation();nav('workspace-access');return}

    const page=e.target.closest('[data-page]');
    if(page){
      const p=page.dataset.page,w=workspaceForPage(p);
      if(w && access[w]?.available){try{localStorage.setItem(ACTIVE_KEY,w)}catch(_){}updateContextButton(w)}
      if(PAGE_LABELS[p])recordRecent(p,w||getWorkspace());
      if(p==='workspace-home')setTimeout(renderWorkspaceHome,25);
      if(p==='workspace-access')setTimeout(renderAccessPage,25);
      if(p==='admin')setTimeout(renderAdminHomeConsolidation,25);
    }
  },true);

  function boot(){
    ensureContextButton();
    ensureQuickOwnership();
    renderAdminHomeConsolidation();
    let tries=0;
    const timer=setInterval(async()=>{
      tries++;
      if(bridge()&&user()){
        clearInterval(timer);
        await loadAccess();
        const active=$('.page.active')?.id?.replace('page-','');
        const w=workspaceForPage(active);
        if(w&&access[w]?.available){try{localStorage.setItem(ACTIVE_KEY,w)}catch(_){}updateContextButton(w)}
      }
      if(tries>240)clearInterval(timer);
    },250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  window.LelleeUnifiedWorkspaces={loadAccess,renderWorkspaceHome,renderAccessPage,renderAdminQuick,renderAdminHomeConsolidation};
})();