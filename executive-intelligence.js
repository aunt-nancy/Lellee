
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="executive-row ${klass}"><div class="executive-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function setTab(tab){qa('[data-exec-tab]').forEach(b=>b.classList.toggle('active',b.dataset.execTab===tab));['dashboard','impact','reports','goals','risks','scenarios','narratives','guardrails'].forEach(x=>q('#execPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadAdmin(){
 const d=await rpc('get_executive_intelligence_summary');if(!d)return;const s=d.summary||{};
 q('#execActivePrograms').textContent=s.active_programs||0;q('#execInstitutionalAccounts').textContent=s.institutional_accounts||0;q('#execPipeline').textContent='$'+Number(s.open_pipeline||0).toLocaleString();q('#execOutstanding').textContent='$'+Number(s.outstanding_receivables||0).toLocaleString();
 q('#execDashboardList').innerHTML=(d.dashboard||[]).map(x=>row('K',x.label,x.detail,x.value_label||'',x.status==='attention'?'attention':x.status==='good'?'ok':'' )).join('');
 q('#execImpactList').innerHTML=(d.impact||[]).map(x=>row('I',x.title,`${x.scope_label} · ${x.period_label}`,x.status,x.status==='approved'?'ok':x.status==='review'?'attention':'' )).join('')||'<div class="approved-resource-empty">No impact snapshots.</div>';
 q('#execReportList').innerHTML=(d.reports||[]).map(x=>row('R',x.title,`${x.report_type} · ${x.period_label}`,x.status,x.status==='review'?'attention':x.status==='approved'?'ok':'' )).join('')||'<div class="approved-resource-empty">No reporting periods.</div>';
 q('#execGoalList').innerHTML=(d.goals||[]).map(x=>row('G',x.title,`${x.category} · ${x.status}`,x.progress_label||'')).join('');
 q('#execRiskList').innerHTML=(d.risks||[]).map(x=>row('!',x.title,`${x.risk_type} · ${x.severity} · ${x.status}`,x.owner_label||'',x.severity==='critical'||x.severity==='high'?'attention':'' )).join('');
 q('#execScenarioList').innerHTML=(d.scenarios||[]).map(x=>row('S',x.name,`${x.scenario_type} · ${x.status}`,x.horizon_label||'')).join('');
 q('#execNarrativeList').innerHTML=(d.narratives||[]).map(x=>row('N',x.title,`${x.narrative_type} · ${x.status}`,x.period_label||'',x.status==='review'?'attention':'' )).join('');
 q('#execGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="executive-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addImpact(){
 const title=prompt('Impact snapshot title:');if(!title)return;
 const scope=prompt('Scope: platform, program, organization, funding, customer_success','platform')||'platform';
 const {error}=await sb.from('executive_impact_snapshots').insert({title,scope_type:scope,status:'draft',period_start:new Date().toISOString().slice(0,10),period_end:new Date().toISOString().slice(0,10),created_by:currentUser.id});
 if(error)return toast(error.message,true);loadAdmin();
}
async function addReport(){
 const title=prompt('Report title:');if(!title)return;
 const type=prompt('Type: board, funder, grant, sponsor, institutional, annual, other','board')||'board';
 const {error}=await sb.from('executive_report_periods').insert({title,report_type:type,status:'draft',period_start:new Date().toISOString().slice(0,10),period_end:new Date().toISOString().slice(0,10),created_by:currentUser.id});
 if(error)return toast(error.message,true);loadAdmin();
}
async function addScenario(){
 const name=prompt('Scenario name:');if(!name)return;
 const type=prompt('Type: revenue, growth, staffing, program, institutional, funding, other','revenue')||'other';
 const {error}=await sb.from('executive_scenarios').insert({name,scenario_type:type,status:'draft',horizon_months:12,created_by:currentUser.id});
 if(error)return toast(error.message,true);loadAdmin();
}
async function loadImpactWorkspace(){
 const d=await rpc('get_impact_reporting_workspace');if(!d)return;const s=d.summary||{};
 q('#impactOpenReports').textContent=s.open_reports||0;q('#impactMetrics').textContent=s.approved_metrics||0;q('#impactNarratives').textContent=s.narratives_review||0;q('#impactDueSoon').textContent=s.due_soon||0;
 q('#impactReportWorkspaceList').innerHTML=(d.reports||[]).map(x=>row('R',x.title,`${x.report_type} · ${x.period_label}`,x.status,x.status==='review'?'attention':x.status==='approved'?'ok':'' )).join('')||'<div class="approved-resource-empty">No open reports.</div>';
}
qa('[data-exec-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.execTab));
q('#execAddImpactSnapshot')?.addEventListener('click',addImpact);
q('#execAddReportPeriod')?.addEventListener('click',addReport);
q('#execAddScenario')?.addEventListener('click',addScenario);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='executive-intelligence')loadAdmin();if(name==='impact-reporting')loadImpactWorkspace()}}
})();
