
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="success-row ${klass}"><div class="success-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function setTab(tab){qa('[data-success-tab]').forEach(b=>b.classList.toggle('active',b.dataset.successTab===tab));['accounts','implementation','milestones','training','reviews','risks','renewals','expansion','guardrails'].forEach(x=>q('#successPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadAdmin(){
 const d=await rpc('get_customer_success_summary');if(!d)return;const s=d.summary||{};
 q('#successImplementations').textContent=s.implementations||0;q('#successMilestones').textContent=s.milestones_due||0;q('#successRisks').textContent=s.risks||0;q('#successRenewals').textContent=s.renewals||0;
 q('#successAccountList').innerHTML=(d.accounts||[]).map(x=>row('A',x.organization_name,`${x.account_status} · ${x.implementation_status}`,x.owner_label||'Unassigned',x.account_health==='attention'?'attention':x.account_health==='healthy'?'ok':'' )).join('')||'<div class="approved-resource-empty">No customer-success accounts.</div>';
 q('#successImplementationList').innerHTML=(d.implementations||[]).map(x=>row('I',x.organization_name,`${x.status} · ${x.progress_percent}% complete`,x.target_launch_label||'',x.status==='at_risk'?'attention':'' )).join('');
 q('#successMilestoneList').innerHTML=(d.milestones||[]).map(x=>row('M',x.title,`${x.organization_name} · ${x.status}`,x.due_label||'',x.status==='blocked'||x.status==='overdue'?'attention':'' )).join('');
 q('#successTrainingList').innerHTML=(d.training||[]).map(x=>row('T',x.title,`${x.organization_name} · ${x.status}`,x.scheduled_label||'')).join('');
 q('#successReviewList').innerHTML=(d.reviews||[]).map(x=>row('Q',x.title,`${x.organization_name} · ${x.status}`,x.review_date_label||'')).join('');
 q('#successRiskList').innerHTML=(d.risks||[]).map(x=>row('!',x.title,`${x.organization_name} · ${x.severity} · ${x.status}`,x.owner_label||'',x.severity==='high'||x.severity==='critical'?'attention':'' )).join('');
 q('#successRenewalList').innerHTML=(d.renewals||[]).map(x=>row('↻',x.organization_name,`${x.readiness_status} · ${x.renewal_date_label}`,x.days_remaining_label||'',x.readiness_status==='at_risk'?'attention':'' )).join('');
 q('#successExpansionList').innerHTML=(d.expansion||[]).map(x=>row('+',x.title,`${x.organization_name} · ${x.opportunity_type} · ${x.status}`,x.projected_value_label||'')).join('');
 q('#successGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="success-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addAccount(){
 const org=prompt('Organization name:');if(!org)return;
 const {error}=await sb.from('customer_success_accounts').insert({organization_name:org,account_status:'onboarding',implementation_status:'not_started',account_health:'not_scored',owner_user_id:currentUser.id,created_by:currentUser.id});
 if(error)return toast(error.message,true);loadAdmin();
}
async function loadOrg(){
 const d=await rpc('get_my_organization_success_summary');if(!d)return;const s=d.summary||{};
 q('#orgSuccessProgress').textContent=(s.progress_percent||0)+'%';q('#orgSuccessSeats').textContent=s.activated_seats||0;q('#orgSuccessTraining').textContent=s.training_items||0;q('#orgSuccessNextReview').textContent=s.next_review_label||'—';
 q('#orgSuccessMilestones').innerHTML=(d.milestones||[]).map(x=>row('M',x.title,`${x.status}`,x.due_label||'',x.status==='blocked'||x.status==='overdue'?'attention':x.status==='completed'?'ok':'' )).join('')||'<div class="approved-resource-empty">No rollout milestones yet.</div>';
}
qa('[data-success-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.successTab));
q('#successAddAccount')?.addEventListener('click',addAccount);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='customer-success')loadAdmin();if(name==='organization-success')loadOrg()}}
})();
