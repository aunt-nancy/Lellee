
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let isAdmin=false,organization=null;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,status='',klass=''){
 return `<div class="integration-row ${klass}"><div class="integration-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`;
}
async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}

async function loadPortability(){
 const d=await rpc('get_my_data_portability_summary');if(!d)return;
 const s=d.summary||{};
 q('#portabilityExports').textContent=s.exports||0;q('#portabilityImports').textContent=s.imports||0;q('#portabilityCalendar').textContent=s.calendar_exports||0;q('#portabilityConnections').textContent=s.connections||0;
 q('#portabilityRequestList').innerHTML=(d.jobs||[]).map(x=>row(x.direction==='export'?'⇩':'⇧',x.label,`${x.direction} · ${x.format} · ${new Date(x.created_at).toLocaleDateString()}`,x.status,x.status==='failed'?'attention':'' )).join('')||'<div class="approved-resource-empty">No portability jobs yet.</div>';
}
async function requestExport(type){
 const d=await rpc('create_my_portability_job',{p_package_type:type,p_format:type==='calendar'?'ics':'json'});if(!d)return toast('Could not create export request.',true);
 toast('Export request created.');loadPortability();
}

function setOrgIntegrationTab(tab){qa('[data-org-integration-tab]').forEach(b=>b.classList.toggle('active',b.dataset.orgIntegrationTab===tab));['jobs','feeds','sso'].forEach(x=>q('#orgIntegrationPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadOrgIntegrations(){
 const {data:o}=await sb.from('organizations').select('id,name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();organization=o||null;if(!o)return;
 q('#orgIntegrationName').textContent=o.public_name||o.name;
 const d=await rpc('get_organization_integration_summary',{p_organization_id:o.id});if(!d)return;
 const s=d.summary||{};
 q('#orgIntegrationJobs').textContent=s.jobs||0;q('#orgIntegrationFeeds').textContent=s.feeds||0;q('#orgIntegrationClients').textContent=s.api_clients||0;q('#orgIntegrationSso').textContent=s.sso_status||'Prepared';
 q('#orgIntegrationJobList').innerHTML=(d.jobs||[]).map(x=>row(x.direction==='import'?'⇧':'⇩',x.label,`${x.direction} · ${x.format}`,x.status)).join('')||'<div class="approved-resource-empty">No data jobs.</div>';
 q('#orgIntegrationFeedList').innerHTML=(d.feeds||[]).map(x=>row('F',x.name,`${x.feed_type} · ${x.status}`,x.direction)).join('')||'<div class="approved-resource-empty">No partner feeds.</div>';
 q('#orgIntegrationSsoList').innerHTML=(d.sso||[]).map(x=>row('S',x.provider_label,x.protocol,x.status,x.status==='enabled'?'ok':'attention')).join('')||'<div class="approved-resource-empty">SSO is prepared but not configured.</div>';
}
async function newOrgJob(){
 if(!organization)return;
 const direction=prompt('Job type: import or export','import')||'import';
 const dataType=prompt('Data type: roster, cohort, aggregate_report','roster')||'roster';
 const format=prompt('Format: csv or json','csv')||'csv';
 const {error}=await sb.from('integration_data_jobs').insert({organization_id:organization.id,created_by:currentUser.id,direction,data_type:dataType,format,status:'requested'});
 if(error)return toast(error.message,true);loadOrgIntegrations();
}

function setIntegrationTab(tab){qa('[data-integration-tab]').forEach(b=>b.classList.toggle('active',b.dataset.integrationTab===tab));['clients','webhooks','feeds','migrations','sso','health'].forEach(x=>q('#integrationPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadIntegrationCenter(){
 if(!await checkAdmin())return;
 const d=await rpc('get_integration_center_summary');if(!d)return;
 const s=d.summary||{};
 q('#integrationClients').textContent=s.api_clients||0;q('#integrationWebhooks').textContent=s.webhooks||0;q('#integrationFeeds').textContent=s.feeds||0;q('#integrationFailures').textContent=s.failures||0;
 q('#integrationClientList').innerHTML=(d.clients||[]).map(x=>row('A',x.name,`${x.client_type} · ${x.status}`,x.scope_label||'',x.status==='active'?'ok':'attention')).join('')||'<div class="approved-resource-empty">No API clients.</div>';
 q('#integrationWebhookList').innerHTML=(d.webhooks||[]).map(x=>row('W',x.name,`${x.event_count} events · ${x.status}`,x.delivery_status,x.status==='active'?'ok':'attention')).join('')||'<div class="approved-resource-empty">No webhook endpoints.</div>';
 q('#integrationFeedList').innerHTML=(d.feeds||[]).map(x=>row('F',x.name,`${x.feed_type} · ${x.direction}`,x.status,x.status==='active'?'ok':'attention')).join('')||'<div class="approved-resource-empty">No partner feeds.</div>';
 q('#integrationMigrationList').innerHTML=(d.migrations||[]).map(x=>row('M',x.name,`${x.source_system} → Lellee`,x.status,x.status==='failed'?'attention':'' )).join('')||'<div class="approved-resource-empty">No migration jobs.</div>';
 q('#integrationSsoList').innerHTML=(d.sso||[]).map(x=>row('S',x.provider_label,`${x.protocol} · ${x.status}`,x.organization_name||'Platform',x.status==='enabled'?'ok':'attention')).join('')||'<div class="approved-resource-empty">No SSO configurations.</div>';
 q('#integrationHealthList').innerHTML=(d.health||[]).map(x=>row(x.status==='ok'?'✓':'!',x.label,x.detail,x.status,x.status==='ok'?'ok':'attention')).join('');
}
async function addClient(){
 const name=prompt('API client name:');if(!name)return;const type=prompt('Client type: organization, partner, internal','partner')||'partner';
 const {error}=await sb.from('integration_api_clients').insert({name,client_type:type,status:'prepared',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadIntegrationCenter();
}
async function addWebhook(){
 const name=prompt('Webhook name:');if(!name)return;const endpoint=prompt('HTTPS endpoint URL:');if(!endpoint)return;
 const {error}=await sb.from('integration_webhook_endpoints').insert({name,endpoint_url:endpoint,status:'prepared',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadIntegrationCenter();
}
async function addFeed(){
 const name=prompt('Feed name:');if(!name)return;const type=prompt('Feed type: resources, roster, aggregate_reporting','resources')||'resources';
 const direction=prompt('Direction: inbound or outbound','inbound')||'inbound';
 const {error}=await sb.from('integration_partner_feeds').insert({name,feed_type:type,direction,status:'prepared',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadIntegrationCenter();
}
async function runHealth(){
 const d=await rpc('run_integration_health_checks');if(!d)return toast('Integration health could not run.',true);
 toast(`Integration health: ${d.passed||0} passing, ${d.attention||0} need attention.`);
 loadIntegrationCenter();
}

qa('[data-portability-export]').forEach(b=>b.onclick=()=>requestExport(b.dataset.portabilityExport));
qa('[data-org-integration-tab]').forEach(b=>b.onclick=()=>setOrgIntegrationTab(b.dataset.orgIntegrationTab));
q('#orgIntegrationNewJob')?.addEventListener('click',newOrgJob);
qa('[data-integration-tab]').forEach(b=>b.onclick=()=>setIntegrationTab(b.dataset.integrationTab));
q('#integrationAddClient')?.addEventListener('click',addClient);
q('#integrationAddWebhook')?.addEventListener('click',addWebhook);
q('#integrationAddFeed')?.addEventListener('click',addFeed);
q('#integrationRunHealth')?.addEventListener('click',runHealth);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='data-portability')loadPortability();if(name==='organization-integrations')loadOrgIntegrations();if(name==='integration-center')loadIntegrationCenter()};
}
})();
