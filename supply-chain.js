
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="supply-row ${klass}"><div class="supply-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function setTab(tab){qa('[data-supply-tab]').forEach(b=>b.classList.toggle('active',b.dataset.supplyTab===tab));['suppliers','sourcing','purchaseorders','receiving','quality','inventory','returns','guardrails'].forEach(x=>q('#supplyPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function load(){
 const d=await rpc('get_supply_chain_summary');if(!d)return;const s=d.summary||{};
 q('#supplySuppliers').textContent=s.suppliers||0;q('#supplyOpenPOs').textContent=s.purchase_orders||0;q('#supplyReceiving').textContent=s.receiving||0;q('#supplyReorder').textContent=s.reorder_review||0;
 q('#supplySupplierList').innerHTML=(d.suppliers||[]).map(x=>row('S',x.name,`${x.supplier_type} · ${x.status}`,x.risk_status,x.risk_status==='attention'||x.risk_status==='high_risk'?'attention':'ok')).join('')||'<div class="approved-resource-empty">No suppliers.</div>';
 q('#supplySourcingList').innerHTML=(d.sourcing||[]).map(x=>row('C',x.product_name,`${x.supplier_name} · ${x.status}`,x.cost_label||'')).join('');
 q('#supplyPOList').innerHTML=(d.purchase_orders||[]).map(x=>row('P',x.po_label,`${x.supplier_name} · ${x.status}`,x.total_label||'',x.status==='approval_required'?'attention':'' )).join('');
 q('#supplyReceivingList').innerHTML=(d.receiving||[]).map(x=>row('R',x.receipt_label,`${x.supplier_name} · ${x.status}`,x.quantity_label||'')).join('');
 q('#supplyQualityList').innerHTML=(d.quality||[]).map(x=>row('Q',x.product_name,`${x.inspection_type} · ${x.status}`,x.result_label||'',x.status==='failed'||x.status==='hold'?'attention':'ok')).join('');
 q('#supplyInventoryList').innerHTML=(d.inventory||[]).map(x=>row('I',x.location_label,`${x.status} · ${x.item_count} items`,x.variance_label||'',x.status==='review'?'attention':'' )).join('');
 q('#supplyReturnList').innerHTML=(d.returns||[]).map(x=>row('↩',x.return_label,`${x.return_type} · ${x.status}`,x.quantity_label||'',x.status==='review'?'attention':'' )).join('');
 q('#supplyGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="supply-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addSupplier(){
 const name=prompt('Supplier name:');if(!name)return;
 const type=prompt('Supplier type: manufacturer, wholesaler, printer, fulfillment, packaging, other','manufacturer')||'other';
 const {error}=await sb.from('physical_suppliers').insert({name,supplier_type:type,status:'review',risk_status:'not_reviewed',created_by:currentUser.id});
 if(error)return toast(error.message,true);load();
}
async function addPO(){
 const supplier=prompt('Supplier name/reference for this purchase order:');if(!supplier)return;
 const {error}=await sb.from('physical_purchase_orders').insert({supplier_name_snapshot:supplier,status:'draft',approval_status:'pending',created_by:currentUser.id,owner_user_id:currentUser.id});
 if(error)return toast(error.message,true);load();
}
qa('[data-supply-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.supplyTab));
q('#supplyAddSupplier')?.addEventListener('click',addSupplier);
q('#supplyAddPO')?.addEventListener('click',addPO);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='supply-chain')load()}}
})();
