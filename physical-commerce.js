
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="commerce-physical-row ${klass}"><div class="commerce-physical-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function setTab(tab){qa('[data-physical-tab]').forEach(b=>b.classList.toggle('active',b.dataset.physicalTab===tab));['catalog','inventory','orders','fulfillment','giveaways','sponsored','eligibility','guardrails'].forEach(x=>q('#physicalPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadShop(){
 const d=await rpc('get_physical_shop_catalog');if(!d)return;
 q('#shopCategoryChips').innerHTML=(d.categories||[]).map(x=>`<button data-shop-category="${esc(x.category_key)}">${esc(x.label)}</button>`).join('');
 q('#shopProductGrid').innerHTML=(d.products||[]).map(x=>`<article class="commerce-product-card"><b>${esc(x.name)}</b><small>${esc(x.short_description||'')}</small><em>${esc(x.price_label||'')}</em></article>`).join('')||'<div class="approved-resource-empty">No products are currently available.</div>';
}
async function loadAdmin(){
 const d=await rpc('get_physical_commerce_summary');if(!d)return;const s=d.summary||{};
 q('#physicalProducts').textContent=s.products||0;q('#physicalLowStock').textContent=s.low_stock||0;q('#physicalOpenOrders').textContent=s.orders||0;q('#physicalShipments').textContent=s.shipments||0;
 q('#physicalCatalogList').innerHTML=(d.catalog||[]).map(x=>row('P',x.name,`${x.category_label} · ${x.status}`,x.price_label||'',x.status==='active'?'ok':'' )).join('');
 q('#physicalInventoryList').innerHTML=(d.inventory||[]).map(x=>row('I',x.product_name,`${x.location_label} · ${x.quantity_on_hand} on hand`,x.stock_status,x.stock_status==='low'||x.stock_status==='out'?'attention':'ok')).join('');
 q('#physicalOrderList').innerHTML=(d.orders||[]).map(x=>row('O',x.order_label,`${x.order_type} · ${x.status}`,x.total_label||'',x.status==='exception'?'attention':'' )).join('');
 q('#physicalFulfillmentList').innerHTML=(d.fulfillment||[]).map(x=>row('F',x.order_label,`${x.status} · ${x.carrier_label||'carrier not assigned'}`,x.tracking_label||'')).join('');
 q('#physicalGiveawayList').innerHTML=(d.giveaways||[]).map(x=>row('G',x.name,`${x.status} · ${x.distribution_type}`,x.remaining_label||'')).join('');
 q('#physicalSponsoredList').innerHTML=(d.sponsored||[]).map(x=>row('S',x.name,`${x.sponsor_name} · ${x.status}`,x.quantity_label||'')).join('');
 q('#physicalEligibilityList').innerHTML=(d.eligibility||[]).map(x=>row('E',x.product_name,`${x.program_label} · ${x.access_type}`,x.status)).join('');
 q('#physicalGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="commerce-physical-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addProduct(){
 const name=prompt('Product name:');if(!name)return;
 const category=prompt('Category: journal, kit, giveaway, apparel, stationery, comfort, caregiver, reentry, other','journal')||'other';
 const price=Number(prompt('Price in dollars (0 for giveaway):','0'))||0;
 const {error}=await sb.from('physical_products').insert({name,category_key:category,status:'draft',base_price:price,created_by:currentUser.id});
 if(error)return toast(error.message,true);loadAdmin();
}
qa('[data-physical-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.physicalTab));
q('#physicalAddProduct')?.addEventListener('click',addProduct);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='shop')loadShop();if(name==='physical-commerce')loadAdmin()}}
})();
