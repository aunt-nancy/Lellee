(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => '$' + Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const client = () => bridge()?.client || window.supabaseClient || null;

  function quoteFor(service){
    const q = service?.pricing_quote && Object.keys(service.pricing_quote || {}).length ? service.pricing_quote :
      (service?.price_quote_snapshot && Object.keys(service.price_quote_snapshot || {}).length ? service.price_quote_snapshot : null);
    if(q) return q;
    const price = Number(service?.price_amount || 0);
    return {
      frequency_label: service?.billing_model ? String(service.billing_model).replaceAll('_',' ') : 'Service',
      listed_coach_price_amount: price,
      coach_price_after_adjustment_amount: Number(service?.coach_price_after_discount ?? price),
      processing_fee_amount: Number(service?.price_explanation?.processing_fee_amount || 0),
      customer_total_amount: Number(service?.price_explanation?.customer_total_amount || price),
      discount_example_formula: service?.price_explanation?.formula || ''
    };
  }

  function servicePriceCard(service){
    const q = quoteFor(service);
    const adjustment = Number(q.coach_adjustment_amount || 0);
    const adjLabel = adjustment > 0 ? 'Coach increase' : (adjustment < 0 ? 'Coach discount' : 'No adjustment');
    return `<article class="coach-pricing-ops-card">
      <div class="coach-pricing-ops-row"><div><b>${esc(service.name || 'Service')}</b><small>${esc(q.frequency_label || service.billing_model || 'Service offer')}</small></div><span>${money(q.customer_total_amount)}</span></div>
      <div class="coach-pricing-ops-grid">
        <span><b>${money(q.listed_coach_price_amount ?? service.price_amount)}</b><small>Listed coach price</small></span>
        <span><b>${adjustment > 0 ? '+' : ''}${money(adjustment)}</b><small>${esc(adjLabel)}</small></span>
        <span><b>${money(q.coach_price_after_adjustment_amount ?? service.coach_price_after_discount ?? service.price_amount)}</b><small>Coach after adjustment</small></span>
        <span><b>${money(q.processing_fee_amount)}</b><small>Processing fees</small></span>
        <span><b>${money(q.customer_total_amount)}</b><small>Customer total</small></span>
      </div>
      ${q.discount_example_formula ? `<small class="coach-pricing-ops-formula">${esc(q.discount_example_formula)}</small>` : ''}
    </article>`;
  }

  async function getBusinessId(sb){
    try{
      const ctx = await sb.rpc('get_my_coach_operations_context');
      if(!ctx.error && ctx.data?.business_id) return ctx.data.business_id;
    }catch(_){ }
    const user = bridge()?.getCurrentUser?.();
    if(!user) return null;
    const m = await sb.from('coach_business_members').select('business_id').eq('user_id', user.id).eq('status','active').limit(1);
    return m.data?.[0]?.business_id || null;
  }

  async function loadServices(sb, businessId){
    const {data,error} = await sb.from('coach_service_packages')
      .select('id,name,service_type,billing_model,price_amount,pricing_frequency_key,weekly_base_price_amount,listed_coach_price_amount,coach_adjustment_amount,coach_discount_amount,coach_price_after_discount,pricing_quote,price_quote_snapshot,price_explanation,active')
      .eq('business_id', businessId)
      .eq('active', true)
      .order('created_at', {ascending:true});
    if(error) throw error;
    return data || [];
  }

  async function loadConsultations(sb, businessId){
    const {data,error} = await sb.from('coach_consultation_requests')
      .select('id,status,created_at,service_package_id,note,coach_service_packages(id,name,service_type,billing_model,price_amount,pricing_quote,price_quote_snapshot,price_explanation,coach_adjustment_amount,coach_price_after_discount)')
      .eq('business_id', businessId)
      .neq('status', 'closed')
      .order('created_at', {ascending:false});
    if(error) return [];
    return data || [];
  }

  function ensureStyles(){
    if($('#coachPricingOpsStyle')) return;
    const st = document.createElement('style');
    st.id = 'coachPricingOpsStyle';
    st.textContent = '.coach-pricing-ops-panel{border:1px solid #dce8e3;background:#fbfdfc;border-radius:16px;padding:14px;margin:12px 0}.coach-pricing-ops-panel h4{margin:0 0 4px;color:#075b4d}.coach-pricing-ops-panel p{margin:0 0 10px;color:#667;font-size:.76rem}.coach-pricing-ops-list{display:grid;gap:9px}.coach-pricing-ops-card{background:#fff;border:1px solid #e4ece8;border-radius:13px;padding:11px}.coach-pricing-ops-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.coach-pricing-ops-row b{display:block}.coach-pricing-ops-row small{color:#667}.coach-pricing-ops-row span{font-weight:900;color:#075b4d}.coach-pricing-ops-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:9px}.coach-pricing-ops-grid span{background:#f7faf8;border:1px solid #e5ece8;border-radius:9px;padding:7px}.coach-pricing-ops-grid b{display:block;color:#173047}.coach-pricing-ops-grid small{font-size:.58rem;color:#667}.coach-pricing-ops-formula{display:block;margin-top:7px;color:#51615b}.coach-pricing-ops-empty{background:#fff;border:1px dashed #d8e3de;border-radius:12px;padding:10px;color:#667}@media(max-width:780px){.coach-pricing-ops-grid{grid-template-columns:1fr 1fr}.coach-pricing-ops-row{display:block}}';
    document.head.appendChild(st);
  }

  async function renderRevenuePricing(){
    const host = $('#coachRevenueServiceList');
    if(!host || $('#coachRevenueCustomerTotalPricing')) return;
    const sb = client(); if(!sb) return;
    const bid = await getBusinessId(sb); if(!bid) return;
    const services = await loadServices(sb, bid);
    const panel = document.createElement('section');
    panel.id = 'coachRevenueCustomerTotalPricing';
    panel.className = 'coach-pricing-ops-panel';
    panel.innerHTML = `<h4>Customer-total pricing</h4><p>Shows the buyer-facing total for each active service: coach price after adjustment plus processing fees. Payment collection remains governed by launch/payment settings.</p><div class="coach-pricing-ops-list">${services.length ? services.map(servicePriceCard).join('') : '<div class="coach-pricing-ops-empty">No active priced services yet.</div>'}</div>`;
    host.parentElement?.insertBefore(panel, host.nextSibling);
  }

  async function renderConsultationPricing(){
    const host = $('#coachConsultationList');
    if(!host || $('#coachConsultationSelectedServicePricing')) return;
    const sb = client(); if(!sb) return;
    const bid = await getBusinessId(sb); if(!bid) return;
    const rows = (await loadConsultations(sb, bid)).filter(r => r.service_package_id && r.coach_service_packages);
    const panel = document.createElement('section');
    panel.id = 'coachConsultationSelectedServicePricing';
    panel.className = 'coach-pricing-ops-panel';
    panel.innerHTML = `<h4>Selected-service pricing on requests</h4><p>When a customer selects a service before requesting a consultation, the request keeps that service package attached.</p><div class="coach-pricing-ops-list">${rows.length ? rows.map(r => {
      const service = r.coach_service_packages;
      const q = quoteFor(service);
      return `<article class="coach-pricing-ops-card"><div class="coach-pricing-ops-row"><div><b>${esc(service.name || 'Selected service')}</b><small>Request ${esc(String(r.status || '').replaceAll('_',' '))}</small></div><span>${money(q.customer_total_amount)}</span></div>${q.discount_example_formula ? `<small class="coach-pricing-ops-formula">${esc(q.discount_example_formula)}</small>` : ''}</article>`;
    }).join('') : '<div class="coach-pricing-ops-empty">No consultation requests have a selected service yet.</div>'}</div>`;
    host.parentElement?.insertBefore(panel, host.nextSibling);
  }

  function resetPanels(){
    $('#coachRevenueCustomerTotalPricing')?.remove();
    $('#coachConsultationSelectedServicePricing')?.remove();
  }

  function scheduleRender(){
    ensureStyles();
    setTimeout(() => { renderRevenuePricing().catch(console.warn); renderConsultationPricing().catch(console.warn); }, 350);
  }

  function boot(){
    ensureStyles();
    const mo = new MutationObserver(() => scheduleRender());
    mo.observe(document.body, {childList:true, subtree:true});
    document.addEventListener('click', e => {
      const page = e.target?.closest?.('[data-page]')?.dataset?.page;
      if(page){ resetPanels(); scheduleRender(); }
    }, true);
    scheduleRender();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
