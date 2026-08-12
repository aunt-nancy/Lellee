
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let isAdmin=false;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,status='',klass=''){
 return `<div class="release-row ${klass}"><div class="release-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`;
}
async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}

async function loadQa(){
 if(!await checkAdmin())return;
 const d=await rpc('get_qa_center_summary');if(!d)return;
 const s=d.summary||{};
 q('#qaSuites').textContent=s.suites||0;q('#qaPassing').textContent=s.passing||0;q('#qaFailing').textContent=s.failing||0;q('#qaCritical').textContent=s.critical||0;
 q('#qaPlatformChecks').innerHTML=(d.platform_checks||[]).map(x=>row(x.status==='pass'?'✓':'!',x.label,x.detail,x.status,x.status==='pass'?'ok':x.severity==='critical'?'blocked':'attention')).join('');
 q('#qaSuiteList').innerHTML=(d.suites||[]).map(x=>row('Q',x.name,`${x.category} · ${x.test_count} tests`,x.status,x.status==='pass'?'ok':x.status==='fail'?'blocked':'' )).join('');
 q('#qaResultList').innerHTML=(d.results||[]).map(x=>row(x.status==='pass'?'✓':'!',x.test_name,`${x.status} · ${new Date(x.created_at).toLocaleString()}`,x.suite_name,x.status==='pass'?'ok':'attention')).join('');
}
async function runChecks(){
 const d=await rpc('run_platform_preflight_checks');if(!d)return toast('Platform checks could not run.',true);
 toast(`Platform checks complete: ${d.passed||0} passed, ${d.failed||0} failed.`);
 loadQa();
}

function setPilotTab(tab){qa('[data-pilot-ops-tab]').forEach(b=>b.classList.toggle('active',b.dataset.pilotOpsTab===tab));['cohorts','feedback','issues','readiness'].forEach(x=>q('#pilotOpsPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadPilotOps(){
 if(!await checkAdmin())return;
 const d=await rpc('get_pilot_operations_summary');if(!d)return;
 const s=d.summary||{};
 q('#pilotOpsCohorts').textContent=s.cohorts||0;q('#pilotOpsUsers').textContent=s.users||0;q('#pilotOpsFeedback').textContent=s.feedback||0;q('#pilotOpsIssues').textContent=s.issues||0;
 q('#pilotOpsCohortList').innerHTML=(d.cohorts||[]).map(x=>row('P',x.name,`${x.program_name} · ${x.status} · ${x.member_count} users`,x.readiness_status||'' )).join('')||'<div class="approved-resource-empty">No pilot cohorts.</div>';
 q('#pilotOpsFeedbackList').innerHTML=(d.feedback||[]).map(x=>row('♡',x.subject,`${x.program_name||'Program'} · ${x.status}`,x.priority||'' )).join('')||'<div class="approved-resource-empty">No pilot feedback.</div>';
 q('#pilotOpsIssueList').innerHTML=(d.issues||[]).map(x=>row('!',x.title,`${x.severity} · ${x.status}`,x.program_name||'',x.severity==='critical'?'blocked':'attention')).join('')||'<div class="approved-resource-empty">No pilot issues.</div>';
 q('#pilotOpsReadinessList').innerHTML=(d.readiness||[]).map(x=>row(x.status==='ready'?'✓':'○',x.program_name,x.detail,x.status,x.status==='ready'?'ok':'attention')).join('');
}
async function addPilotCohort(){
 const name=prompt('Pilot cohort name:');if(!name)return;
 const {data:programs}=await sb.from('programs').select('id,name,slug').in('status',['planned','pilot']).order('display_order');
 if(!programs?.length)return toast('No planned/pilot programs available.',true);
 const choices=programs.map((p,i)=>`${i+1}. ${p.name}`).join('\n');
 const n=Number(prompt('Choose program:\n'+choices,'1'));if(!n||!programs[n-1])return;
 const {error}=await sb.from('pilot_cohorts').insert({name,program_id:programs[n-1].id,status:'planning',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadPilotOps();
}

function setReleaseTab(tab){qa('[data-release-tab]').forEach(b=>b.classList.toggle('active',b.dataset.releaseTab===tab));['candidates','gates','environment','rollbacks'].forEach(x=>q('#releasePanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadRelease(){
 if(!await checkAdmin())return;
 const d=await rpc('get_release_center_summary');if(!d)return;
 const s=d.summary||{};
 q('#releaseCandidates').textContent=s.candidates||0;q('#releaseBlocked').textContent=s.blocked||0;q('#releaseApproved').textContent=s.approved||0;q('#releaseReady').textContent=s.ready||0;
 q('#releaseCandidateList').innerHTML=(d.candidates||[]).map(x=>row('R',x.name,`${x.release_type} · ${x.status}`,x.version_label||'',x.status==='blocked'?'blocked':x.status==='approved'?'ok':'' )).join('')||'<div class="approved-resource-empty">No release candidates.</div>';
 q('#releaseGateList').innerHTML=(d.gates||[]).map(x=>row(x.status==='pass'?'✓':'○',x.label,x.detail,x.status,x.status==='pass'?'ok':x.required?'blocked':'attention')).join('');
 q('#releaseEnvironmentList').innerHTML=(d.environment||[]).map(x=>row(x.status==='ok'?'✓':'!',x.label,x.detail,x.status,x.status==='ok'?'ok':'attention')).join('');
 q('#releaseRollbackList').innerHTML=(d.rollbacks||[]).map(x=>row('↶',x.release_name,x.notes,new Date(x.created_at).toLocaleDateString())).join('')||'<div class="approved-resource-empty">No rollback notes.</div>';
}
async function addReleaseCandidate(){
 const name=prompt('Release candidate name:','Lellee Release Candidate');if(!name)return;
 const version=prompt('Version label:','1.0.0-rc')||null;
 const type=prompt('Release type: platform, program, hotfix','platform')||'platform';
 const {error}=await sb.from('release_candidates').insert({name,version_label:version,release_type:type,status:'draft',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadRelease();
}

async function loadReliability(){
 if(!await checkAdmin())return;
 const d=await rpc('get_reliability_center_summary');if(!d)return;
 const s=d.summary||{};
 q('#reliabilityFailures').textContent=s.failures||0;q('#reliabilityQueue').textContent=s.stale_queue||0;q('#reliabilityIncidents').textContent=s.incidents||0;q('#reliabilityDrift').textContent=s.drift||0;
 q('#reliabilitySignalList').innerHTML=(d.signals||[]).map(x=>row(x.status==='ok'?'✓':'!',x.label,x.detail,x.status,x.status==='ok'?'ok':x.severity==='critical'?'blocked':'attention')).join('');
 q('#reliabilitySnapshotList').innerHTML=(d.snapshots||[]).map(x=>row('◷',x.label,new Date(x.created_at).toLocaleString(),x.overall_status,x.overall_status==='pass'?'ok':'attention')).join('')||'<div class="approved-resource-empty">No reliability snapshots yet.</div>';
}

q('#qaRunPlatformChecks')?.addEventListener('click',runChecks);
q('#qaRefresh')?.addEventListener('click',loadQa);
qa('[data-pilot-ops-tab]').forEach(b=>b.onclick=()=>setPilotTab(b.dataset.pilotOpsTab));
qa('[data-release-tab]').forEach(b=>b.onclick=()=>setReleaseTab(b.dataset.releaseTab));
q('#pilotOpsAddCohort')?.addEventListener('click',addPilotCohort);
q('#releaseAddCandidate')?.addEventListener('click',addReleaseCandidate);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){
   old(name);
   if(name==='qa-center')loadQa();
   if(name==='pilot-operations')loadPilotOps();
   if(name==='release-center')loadRelease();
   if(name==='reliability-center')loadReliability();
 };
}
})();
