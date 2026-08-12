
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>'$'+Number(v||0).toFixed(2);
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let commerceTab='plans',isAdmin=false;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,value=''){
 return `<div class="commerce-row"><div class="commerce-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(String(value||''))}</em></div>`;
}
async function loadAccess(){
 const d=await rpc('get_my_commerce_access');if(!d)return;
 const k=d.summary||{};
 q('#accessTier').textContent=k.tier||'Free';q('#accessPrograms').textContent=k.program_entitlements||0;q('#accessSponsored').textContent=k.sponsored_access||0;q('#accessOrders').textContent=k.orders||0;
 q('#accessPlanList').innerHTML=(d.plans||[]).map(p=>`<article class="commerce-plan ${p.plan_key==='plus'?'featured':''}"><b>${esc(p.name)}</b><strong>${p.price_label?esc(p.price_label):'Free'}</strong><small>${esc(p.description||'')}</small><button data-request-plan="${p.id}">${p.active_for_purchase?'Choose Plan':'Prepared'}</button></article>`).join('');
 q('#accessEntitlementList').innerHTML=(d.entitlements||[]).length?(d.entitlements||[]).map(x=>row('✓',x.label,x.source_label||x.entitlement_type,x.status)).join(''):'<div class="approved-resource-empty">No additional entitlements.</div>';
 q('#accessOrderList').innerHTML=(d.orders||[]).length?(d.orders||[]).map(x=>row('◇',x.label,`${x.order_type} · ${x.status}`,money(x.total_amount))).join(''):'<div class="approved-resource-empty">No orders or requests yet.</div>';
 qa('[data-request-plan]').forEach(b=>b.onclick=()=>requestPlan(b.dataset.requestPlan));
}
async function requestPlan(id){
 const {data,error}=await sb.rpc('create_commerce_request',{p_item_type:'plan',p_item_id:id,p_quantity:1,p_notes:null});
 if(error)return toast(error.message,true);toast('Plan request recorded. Live checkout remains unchanged.');loadAccess();
}
async function loadShop(){
 const {data,error}=await sb.from('commerce_products').select('*').eq('active',true).eq('consumer_visible',true).order('display_order');
 if(error)return toast(error.message,true);
 q('#lelleeShopList').innerHTML=(data||[]).map(x=>`<article class="commerce-product"><b>${esc(x.name)}</b><strong>${money(x.price_amount)}</strong><small>${esc(x.description||'')}</small><button data-product-request="${x.id}">Request / Save</button></article>`).join('');
 qa('[data-product-request]').forEach(b=>b.onclick=async()=>{const {error}=await sb.rpc('create_commerce_request',{p_item_type:'product',p_item_id:b.dataset.productRequest,p_quantity:1,p_notes:null});if(error)return toast(error.message,true);toast('Product request recorded.')});
}
async function loadCoachRevenue(){
 const {data:b}=await sb.from('coach_businesses').select('id,business_name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();if(!b)return;
 q('#coachRevenueName').textContent=b.public_name||b.business_name;
 const d=await rpc('get_coach_revenue_summary',{p_business_id:b.id});if(!d)return;
 const k=d.summary||{};
 q('#coachRevenueServices').textContent=k.services||0;q('#coachRevenueClients').textContent=k.clients||0;q('#coachRevenueGroups').textContent=k.groups||0;q('#coachRevenueProjected').textContent=money(k.projected_gross);
 q('#coachRevenueServiceList').innerHTML=(d.services||[]).map(x=>row('$',x.name,`${x.service_type.replaceAll('_',' ')} · ${x.billing_model.replaceAll('_',' ')}`,money(x.price_amount))).join('');
 q('#coachRevenueGroupList').innerHTML=(d.groups||[]).map(x=>row('◎',x.name,`${x.enrolled}/${x.capacity} seats · ${money(x.group_price)} per person`,money(x.projected_value))).join('');
 q('#coachPayoutStatus').textContent=d.payout_message||'Coach payouts are not active.';
}
async function loadOrgCommerce(){
 const {data:o}=await sb.from('organizations').select('id,name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();if(!o)return;
 q('#orgCommerceName').textContent=o.public_name||o.name;
 const d=await rpc('get_organization_commerce_summary',{p_organization_id:o.id});if(!d)return;
 const k=d.summary||{};
 q('#orgCommerceLicenses').textContent=k.licenses||0;q('#orgCommerceSeats').textContent=k.seats||0;q('#orgCommerceAssigned').textContent=k.assigned||0;q('#orgCommerceValue').textContent=money(k.contract_value);
 q('#orgCommerceLicenseList').innerHTML=(d.licenses||[]).map(x=>row('◇',x.program_name,`${x.status} · ${x.seat_limit} seats`,money(x.configured_value))).join('');
 q('#orgCommerceQuoteList').innerHTML=(d.quotes||[]).length?(d.quotes||[]).map(x=>row('▣',x.quote_name,`${x.status} · ${x.term_label||''}`,money(x.total_amount))).join(''):'<div class="approved-resource-empty">No quotes yet.</div>';
}
async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
async function loadRevenueOps(){
 if(!await checkAdmin())return;
 const d=await rpc('get_revenue_ops_summary');if(!d)return;
 const k=d.summary||{};
 q('#revenueUsers').textContent=k.entitled_accounts||0;q('#revenueCoachOrders').textContent=k.coach_records||0;q('#revenueOrgContracts').textContent=k.org_quotes||0;q('#revenueProducts').textContent=k.products||0;q('#revenueGross').textContent=money(k.recorded_value);q('#revenuePending').textContent=money(k.pending_value);

 q('#revenuePlanList').innerHTML=(d.plans||[]).map(x=>row('P',x.name,`${x.billing_interval||'free'} · ${x.status}`,x.price_amount==null?'Free':money(x.price_amount))).join('');
 q('#revenueEntitlementList').innerHTML=(d.entitlements||[]).map(x=>row('✓',x.label,`${x.entitlement_type} · ${x.status}`,x.accounts||0)).join('');
 q('#revenueCoachList').innerHTML=(d.coaching||[]).map(x=>row('◎',x.business_name,`${x.services} services · ${x.clients} clients`,money(x.projected_value))).join('');
 q('#revenueOrgList').innerHTML=(d.organizations||[]).map(x=>row('▣',x.organization_name,`${x.licenses} licenses · ${x.seats} seats`,money(x.configured_value))).join('');
 q('#revenueSponsorList').innerHTML=(d.sponsorships||[]).map(x=>row('S',x.name,`${x.status} · ${x.placement_type}`,money(x.price_amount))).join('');
 q('#revenueProductList').innerHTML=(d.products||[]).map(x=>row('◇',x.name,`${x.product_type} · ${x.status}`,money(x.price_amount))).join('');
 q('#revenueDiscountList').innerHTML=(d.discounts||[]).map(x=>row('%',x.name,`${x.discount_type} · ${x.status}`,x.value_label)).join('');
 q('#paymentReadinessList').innerHTML=(d.payment_readiness||[]).map(x=>row(x.enabled?'✓':'○',x.label,x.detail,x.enabled?'ON':'OFF')).join('');
}
function setCommerceTab(tab){
 commerceTab=tab;qa('[data-commerce-tab]').forEach(b=>b.classList.toggle('active',b.dataset.commerceTab===tab));
 ['plans','entitlements','coaching','organizations','sponsorships','products','discounts','settings'].forEach(x=>q('#commercePanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}
async function simplePromptInsert(table,fields){
 const payload={};
 for(const [key,label,def] of fields){
  const v=prompt(label,def||'');if(v===null)return;
  payload[key]=v;
 }
 const {error}=await sb.from(table).insert(payload);if(error)return toast(error.message,true);toast('Saved.');loadRevenueOps();
}
q('#commerceAddProduct')?.addEventListener('click',()=>simplePromptInsert('commerce_products',[['name','Product name','Lellee Journal'],['product_type','Type: journal, printed_story, giveaway, merchandise','journal'],['price_amount','Price','12.99']]));
q('#commerceAddSponsorPackage')?.addEventListener('click',()=>simplePromptInsert('commerce_sponsorship_packages',[['name','Package name','Featured Resource'],['placement_type','Placement type','resource_listing'],['price_amount','Price','99']]));
q('#commerceAddDiscount')?.addEventListener('click',()=>simplePromptInsert('commerce_discount_rules',[['name','Rule name','Community Scholarship'],['discount_type','Type: percent, fixed, free_access, grant','percent'],['discount_value','Value','25']]));
q('#commerceAddPlan')?.addEventListener('click',()=>toast('Use the seeded Free/Plus plans first; additional plan creation can be added when needed.'));
qa('[data-commerce-tab]').forEach(b=>b.onclick=()=>setCommerceTab(b.dataset.commerceTab));

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='my-access')loadAccess();if(name==='lellee-shop')loadShop();if(name==='coach-revenue')loadCoachRevenue();if(name==='organization-commerce')loadOrgCommerce();if(name==='revenue-ops')loadRevenueOps()};
}
})();
