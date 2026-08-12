
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let analyticsTab='overview',isAdmin=false,programs=[];

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function pct(n,d){return d?Math.round((Number(n||0)/Number(d||1))*100):0}
function rankRows(rows=[]){
 return rows.length?rows.map((x,i)=>`<div class="analytics-rank-row"><span>${i+1}</span><div><b>${esc(x.label||x.name||'')}</b><small>${esc(x.detail||'')}</small></div><em>${esc(String(x.value??0))}</em></div>`).join(''):'<div class="approved-resource-empty">No data yet.</div>';
}
function bars(rows=[]){
 const max=Math.max(1,...rows.map(x=>Number(x.value||0)));
 return rows.map(x=>`<div class="analytics-bar-row"><span>${esc(x.label)}</span><div class="analytics-bar-track"><i style="width:${Math.round(Number(x.value||0)/max*100)}%"></i></div><b>${esc(String(x.value||0))}</b></div>`).join('');
}
function table(headers,rows){
 return `<table class="analytics-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
async function checkAdmin(){
 const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();
 isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin;
}
async function loadProgramFilter(){
 const {data}=await sb.from('programs').select('id,name,status,display_order').order('display_order');
 programs=data||[];
 q('#analyticsProgramFilter').innerHTML='<option value="">All programs</option>'+programs.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
}
async function loadAnalytics(){
 if(!await checkAdmin())return;
 await loadProgramFilter();
 const days=Number(q('#analyticsRange')?.value||30),pid=q('#analyticsProgramFilter')?.value||null;
 const data=await rpc('get_lellee_admin_analytics',{p_days:days,p_program_id:pid||null});
 if(!data)return toast('Analytics could not load.',true);
 renderAdmin(data);
}
function renderAdmin(d){
 const k=d.kpis||{};
 q('#analyticsUsers').textContent=k.total_users||0;q('#analyticsNewUsers').textContent=`${k.new_users||0} new`;
 q('#analyticsDAU').textContent=k.dau||0;q('#analyticsWAU').textContent=`${k.wau||0} weekly active`;
 q('#analyticsMAU').textContent=k.mau||0;q('#analyticsStickiness').textContent=`${pct(k.dau,k.mau)}% DAU/MAU`;
 q('#analyticsRetention30').textContent=`${k.retention_30||0}%`;q('#analyticsRetention7').textContent=`${k.retention_7||0}% at 7 days`;
 q('#analyticsActivePrograms').textContent=k.active_programs||0;q('#analyticsPilotPrograms').textContent=`${k.pilot_programs||0} pilots`;
 q('#analyticsCoachBusinesses').textContent=k.coach_businesses||0;q('#analyticsCoachClients').textContent=`${k.active_coach_clients||0} clients`;
 q('#analyticsOrganizations').textContent=k.organizations||0;q('#analyticsOrgSeats').textContent=`${k.sponsored_seats||0} sponsored seats`;
 q('#analyticsPlus').textContent=k.plus_members||0;q('#analyticsPlusRate').textContent=`${k.plus_conversion||0}% conversion`;

 q('#analyticsActivityBars').innerHTML=bars(d.activity_trend||[]);
 q('#analyticsTopAreas').innerHTML=rankRows(d.top_areas||[]);
 q('#analyticsSignals').innerHTML=(d.signals||[]).map(x=>`<article class="analytics-signal ${esc(x.level||'')}"><b>${esc(x.title)}</b><p>${esc(x.text)}</p></article>`).join('');

 const f=d.funnel||{};
 q('#analyticsFunnel').innerHTML=[
  ['Signups',f.signups],['Onboarded',f.onboarded],['Activated',f.activated],['Retained 30d',f.retained_30],['Plus',f.plus]
 ].map(([l,v])=>`<div class="analytics-funnel-step"><b>${v||0}</b><small>${l}</small></div>`).join('');
 q('#analyticsConversion').innerHTML=rankRows(d.conversion||[]);
 q('#analyticsOnboarding').innerHTML=rankRows(d.onboarding||[]);

 q('#analyticsProgramTable').innerHTML=table(
  ['Program','Status','Enrolled','Active 30d','Demand','Content'],
  (d.programs||[]).map(x=>[
   `<strong>${esc(x.name)}</strong>`,esc(x.status),x.enrolled||0,x.active_30||0,x.demand||0,x.published_content||0
  ])
 );

 q('#analyticsCoachSupply').innerHTML=rankRows(d.coach_supply||[]);
 q('#analyticsCoachDemand').innerHTML=rankRows(d.coach_demand||[]);
 q('#analyticsGroupUtilization').innerHTML=table(
  ['Group','Business','Enrolled','Capacity','Occupancy'],
  (d.groups||[]).map(x=>[
   `<strong>${esc(x.name)}</strong>`,esc(x.business||''),x.enrolled||0,x.capacity||0,`${x.occupancy||0}%`
  ])
 );

 q('#analyticsOrganizationTable').innerHTML=table(
  ['Organization','Status','Licenses','Seats','Assigned','Active'],
  (d.organizations||[]).map(x=>[
   `<strong>${esc(x.name)}</strong>`,esc(x.status),x.licenses||0,x.seats||0,x.assigned||0,x.active||0
  ])
 );

 q('#analyticsContentPipeline').innerHTML=rankRows(d.content_pipeline||[]);
 q('#analyticsContentEngagement').innerHTML=rankRows(d.content_engagement||[]);

 q('#analyticsRetentionGrid').innerHTML=[
   ['7-day',k.retention_7],['30-day',k.retention_30],['90-day',k.retention_90]
 ].map(([l,v])=>`<article class="analytics-retention-cell"><b>${v||0}%</b><small>${l} retention</small></article>`).join('');
 q('#analyticsRetentionTrend').innerHTML=bars(d.activity_trend||[]);

 q('#analyticsPrivacyChecks').innerHTML=(d.privacy_checks||[]).map(x=>`<article class="analytics-check"><b>${x.pass?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
function setTab(tab){
 analyticsTab=tab;
 qa('[data-analytics-tab]').forEach(b=>b.classList.toggle('active',b.dataset.analyticsTab===tab));
 ['overview','funnel','programs','coaching','organizations','content','retention','privacy'].forEach(x=>q('#analyticsPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}

async function loadCoachAnalytics(){
 const {data:b}=await sb.from('coach_businesses').select('id,business_name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();
 if(!b)return;
 q('#coachAnalyticsName').textContent=b.public_name||b.business_name;
 const d=await rpc('get_coach_business_analytics',{p_business_id:b.id,p_days:30});if(!d)return;
 const k=d.kpis||{};
 q('#coachAnalyticsLeads').textContent=k.leads||0;q('#coachAnalyticsLeadRate').textContent=`${k.lead_conversion||0}% converted`;
 q('#coachAnalyticsClients').textContent=k.active_clients||0;q('#coachAnalyticsNewClients').textContent=`${k.new_clients||0} new`;
 q('#coachAnalyticsGroups').textContent=k.active_groups||0;q('#coachAnalyticsSeats').textContent=`${k.open_seats||0} open seats`;
 q('#coachAnalyticsConsults').textContent=k.consultations||0;q('#coachAnalyticsConsultRate').textContent=`${k.consult_conversion||0}% converted`;
 q('#coachAnalyticsServices').innerHTML=rankRows(d.services||[]);
 q('#coachAnalyticsGroupList').innerHTML=rankRows(d.groups||[]);
}

async function loadOrgAnalytics(){
 const {data:o}=await sb.from('organizations').select('id,name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();
 if(!o)return;
 q('#orgAnalyticsName').textContent=o.public_name||o.name;
 const d=await rpc('get_organization_analytics_v2',{p_organization_id:o.id});if(!d)return;
 const k=d.kpis||{};
 q('#orgAnalyticsSeats').textContent=k.licensed_seats||0;q('#orgAnalyticsAssigned').textContent=`${k.assigned||0} assigned`;
 q('#orgAnalyticsActive').textContent=k.active||0;q('#orgAnalyticsActivation').textContent=`${k.activation_rate||0}% activation`;
 q('#orgAnalyticsPrograms').textContent=k.programs||0;q('#orgAnalyticsCohorts').textContent=`${k.cohorts||0} cohorts`;
 q('#orgAnalyticsMilestones').textContent=k.milestones||0;
 q('#orgAnalyticsProgramList').innerHTML=table(
  ['Program','Seats','Assigned','Active'],
  (d.programs||[]).map(x=>[`<strong>${esc(x.name)}</strong>`,x.seats||0,x.assigned||0,x.active||0])
 );
 q('#orgAnalyticsOutcomeList').innerHTML=rankRows(d.outcomes||[]);
}

// Privacy-safe product event tracker.
const SENSITIVE_PAGES=new Set(['journal','message-thread','safety-center','support','privacy-center','my-coaching']);
async function trackEvent(eventName,eventArea,props={}){
 try{
   await sb.rpc('track_product_event',{
     p_event_name:eventName,
     p_event_area:eventArea,
     p_program_id:null,
     p_properties:props
   });
 }catch(e){}
}
if(typeof showPage==='function'){
 const oldShow=showPage;
 showPage=function(name){
   oldShow(name);
   if(name==='analytics')loadAnalytics();
   if(name==='coach-analytics')loadCoachAnalytics();
   if(name==='organization-analytics')loadOrgAnalytics();
   if(!SENSITIVE_PAGES.has(name))trackEvent('page_view',name,{});
 };
}

qa('[data-analytics-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.analyticsTab));
q('#analyticsRefresh')?.addEventListener('click',loadAnalytics);
q('#analyticsRange')?.addEventListener('change',loadAnalytics);
q('#analyticsProgramFilter')?.addEventListener('change',loadAnalytics);
})();
