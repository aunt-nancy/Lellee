
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="finance-row ${klass}"><div class="finance-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function setTab(tab){qa('[data-finance-tab]').forEach(b=>b.classList.toggle('active',b.dataset.financeTab===tab));['invoices','receivables','payments','funding','forecast','credits','approvals','guardrails'].forEach(x=>q('#financePanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadAdmin(){
 const d=await rpc('get_revenue_operations_summary');if(!d)return;const s=d.summary||{};
 q('#financeOpenInvoices').textContent=s.open_invoices||0;q('#financeOutstanding').textContent='$'+Number(s.outstanding||0).toLocaleString();q('#financeDue30').textContent='$'+Number(s.due_30||0).toLocaleString();q('#financeForecast').textContent='$'+Number(s.forecast_12mo||0).toLocaleString();
 q('#financeInvoiceList').innerHTML=(d.invoices||[]).map(x=>row('I',x.invoice_label,`${x.counterparty_name} · ${x.status} · due ${x.due_label||'—'}`,x.amount_label||'',x.status==='overdue'?'attention':x.status==='paid_recorded'?'ok':'' )).join('')||'<div class="approved-resource-empty">No invoice records.</div>';
 q('#financeReceivableList').innerHTML=(d.receivables||[]).map(x=>row('$',x.label,`${x.counterparty_name} · ${x.aging_bucket}`,x.amount_label||'',x.aging_bucket!=='current'?'attention':'' )).join('');
 q('#financePaymentList').innerHTML=(d.payments||[]).map(x=>row('✓',x.label,`${x.counterparty_name} · ${x.payment_method_label||'recorded payment'}`,x.amount_label||'','ok')).join('');
 q('#financeFundingList').innerHTML=(d.funding||[]).map(x=>row('F',x.name,`${x.funding_type} · ${x.status}`,x.amount_label||'')).join('');
 q('#financeForecastList').innerHTML=(d.forecast||[]).map(x=>row('↗',x.period_label,`${x.category} · ${x.status}`,x.amount_label||'')).join('');
 q('#financeCreditList').innerHTML=(d.credits||[]).map(x=>row('C',x.label,`${x.counterparty_name} · ${x.status}`,x.amount_label||'')).join('');
 q('#financeApprovalList').innerHTML=(d.approvals||[]).map(x=>row('A',x.title,`${x.approval_type} · ${x.status}`,x.amount_label||'',x.status==='pending'?'attention':'ok')).join('');
 q('#financeGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="finance-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addInvoice(){
 const counterparty=prompt('Organization / counterparty name:');if(!counterparty)return;
 const amount=Number(prompt('Invoice amount:','0'))||0;
 const due=prompt('Due date (YYYY-MM-DD):','')||null;
 const label=prompt('Invoice label:','Institutional invoice')||'Institutional invoice';
 const {error}=await sb.from('finance_invoice_records').insert({counterparty_name:counterparty,invoice_label:label,amount,due_date:due,status:'prepared',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadAdmin();
}
async function loadOrg(){
 const d=await rpc('get_my_organization_billing_summary');if(!d)return;const s=d.summary||{};
 q('#orgBillingOpen').textContent=s.open_invoices||0;q('#orgBillingOutstanding').textContent='$'+Number(s.outstanding||0).toLocaleString();q('#orgBillingPaid').textContent='$'+Number(s.paid_recorded||0).toLocaleString();q('#orgBillingNextDue').textContent=s.next_due_label||'—';
 q('#orgBillingInvoiceList').innerHTML=(d.invoices||[]).map(x=>row('I',x.invoice_label,`${x.status} · due ${x.due_label||'—'}`,x.amount_label||'',x.status==='overdue'?'attention':x.status==='paid_recorded'?'ok':'' )).join('')||'<div class="approved-resource-empty">No invoice records.</div>';
}
qa('[data-finance-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.financeTab));
q('#financeAddInvoice')?.addEventListener('click',addInvoice);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='revenue-operations')loadAdmin();if(name==='organization-billing')loadOrg()}}
})();
