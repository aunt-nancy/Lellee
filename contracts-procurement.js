
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="contract-row ${klass}"><div class="contract-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function setTab(tab){qa('[data-contract-tab]').forEach(b=>b.classList.toggle('active',b.dataset.contractTab===tab));['agreements','approvals','renewals','vendors','procurement','compliance','receivables','guardrails'].forEach(x=>q('#contractPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadContracts(){
 const d=await rpc('get_contract_operations_summary');if(!d)return;const s=d.summary||{};
 q('#contractOpsActive').textContent=s.active_agreements||0;q('#contractOpsReview').textContent=s.needs_review||0;q('#contractOpsRenewals').textContent=s.renewals||0;q('#contractOpsVendors').textContent=s.vendors||0;
 q('#contractAgreementList').innerHTML=(d.agreements||[]).map(x=>row('A',x.title,`${x.counterparty_name} · ${x.agreement_type} · ${x.status}`,x.term_label||'',x.status==='active'?'ok':x.status==='review'?'attention':'' )).join('')||'<div class="approved-resource-empty">No agreements.</div>';
 q('#contractApprovalList').innerHTML=(d.approvals||[]).map(x=>row('✓',x.title,`${x.approval_type} · ${x.status}`,x.required_role||'',x.status==='pending'?'attention':'ok')).join('')||'<div class="approved-resource-empty">No pending approvals.</div>';
 q('#contractRenewalList').innerHTML=(d.renewals||[]).map(x=>row('↻',x.title,`${x.counterparty_name} · ${x.renewal_date_label}`,x.days_remaining_label||'',x.renewal_status==='due_soon'?'attention':'' )).join('')||'<div class="approved-resource-empty">No upcoming renewals.</div>';
 q('#contractVendorList').innerHTML=(d.vendors||[]).map(x=>row('V',x.name,`${x.vendor_type} · ${x.status}`,x.risk_status,x.risk_status==='attention'?'attention':'')).join('')||'<div class="approved-resource-empty">No vendors.</div>';
 q('#contractProcurementList').innerHTML=(d.procurement||[]).map(x=>row('P',x.title,`${x.request_type} · ${x.status}`,x.amount_label||'',x.status==='review'?'attention':'' )).join('')||'<div class="approved-resource-empty">No procurement requests.</div>';
 q('#contractRequirementList').innerHTML=(d.requirements||[]).map(x=>row('R',x.label,`${x.requirement_type} · ${x.counterparty_name}`,x.status,x.status==='missing'||x.status==='expired'?'attention':'ok')).join('')||'<div class="approved-resource-empty">No tracked requirements.</div>';
 q('#contractReceivableList').innerHTML=(d.receivables||[]).map(x=>row('$',x.label,`${x.counterparty_name} · ${x.status}`,x.amount_label||'',x.status==='overdue'?'attention':'' )).join('')||'<div class="approved-resource-empty">No receivable records.</div>';
 q('#contractGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="contract-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addAgreement(){
 const title=prompt('Agreement title:');if(!title)return;
 const counterparty=prompt('Counterparty name:');if(!counterparty)return;
 const type=prompt('Type: organization_license, provider, coach, sponsorship, vendor, data_processing, baa_readiness, grant, other','organization_license')||'other';
 const {error}=await sb.from('contract_agreements').insert({title,counterparty_name:counterparty,agreement_type:type,status:'draft',created_by:currentUser.id,owner_user_id:currentUser.id});
 if(error)return toast(error.message,true);loadContracts();
}
async function addVendor(){
 const name=prompt('Vendor name:');if(!name)return;
 const type=prompt('Vendor type: software, professional_service, infrastructure, communications, payment, legal, insurance, other','software')||'other';
 const {error}=await sb.from('contract_vendors').insert({name,vendor_type:type,status:'review',risk_status:'not_reviewed',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadContracts();
}
async function addProcurement(){
 const title=prompt('Procurement request:');if(!title)return;
 const type=prompt('Request type: new_vendor, renewal, software, service, equipment, other','new_vendor')||'other';
 const amount=Number(prompt('Estimated amount (optional):','0'))||0;
 const {error}=await sb.from('contract_procurement_requests').insert({title,request_type:type,estimated_amount:amount,status:'draft',requested_by:currentUser.id});
 if(error)return toast(error.message,true);loadContracts();
}
async function loadHandoff(){
 const d=await rpc('get_deal_handoff_summary');if(!d)return;const s=d.summary||{};
 q('#handoffDeals').textContent=s.deals||0;q('#handoffAgreements').textContent=s.agreements||0;q('#handoffImplementations').textContent=s.implementations||0;q('#handoffBilling').textContent=s.billing_prep||0;
 q('#dealHandoffList').innerHTML=(d.deals||[]).map(x=>row('→',x.name,`${x.opportunity_type} · ${x.organization_name||''}`,x.handoff_status,x.handoff_status==='ready'?'attention':'ok')).join('')||'<div class="approved-resource-empty">No deals ready for handoff.</div>';
}
qa('[data-contract-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.contractTab));
q('#contractAddAgreement')?.addEventListener('click',addAgreement);
q('#contractAddVendor')?.addEventListener('click',addVendor);
q('#contractAddProcurement')?.addEventListener('click',addProcurement);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='contract-operations')loadContracts();if(name==='deal-handoff')loadHandoff()}}
})();
