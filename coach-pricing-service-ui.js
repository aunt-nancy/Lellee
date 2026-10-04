(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const money = v => '$' + Number(v || 0).toFixed(2);
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const sb = () => bridge()?.client;

  const DEFAULT_WEEKLY = 150;
  const DEFAULT_FREQ = 'monthly_single';

  function quoteBoxId(prefix){ return prefix + 'PricingQuote'; }
  function frequencyOptions(selected=DEFAULT_FREQ){
    const opts = [
      ['monthly_single','Single Monthly Session · default'],
      ['weekly_session','Weekly Session'],
      ['biweekly_single','Biweekly Single Session'],
      ['monthly_subscription','Monthly Subscription']
    ];
    return opts.map(([v,l]) => `<option value="${v}" ${v===selected?'selected':''}>${l}</option>`).join('');
  }
  function pricingFields(prefix, selected=DEFAULT_FREQ, weekly=DEFAULT_WEEKLY, adjustment=0){
    return `
      <div class="coach-pricing-panel" data-coach-pricing-panel="${prefix}">
        <span class="approved-kicker">PRICING</span>
        <div class="coach-live-form">
          <label>Offer type<select id="${prefix}PricingFrequency">${frequencyOptions(selected)}</select></label>
          <label>Weekly starting price<input id="${prefix}WeeklyPrice" type="number" min="0" step="0.01" value="${esc(weekly)}"></label>
          <label>Coach adjustment<input id="${prefix}CoachAdjustment" type="number" step="0.01" value="${esc(adjustment)}" placeholder="0, -20, +20"></label>
          <label class="wide">Adjustment rule<input disabled value="Discounts keep fees; increases recalculate fees"></label>
        </div>
        <div class="coach-live-review-note"><b>Default:</b> Single Monthly Session. A negative adjustment is a coach-funded discount. A positive adjustment increases the coach price and recalculates processing fees.</div>
        <div id="${quoteBoxId(prefix)}" class="coach-pricing-quote">Loading pricing…</div>
      </div>`;
  }
  function renderQuote(prefix, q){
    const box = $('#' + quoteBoxId(prefix));
    if(!box || !q) return;
    box.innerHTML = `
      <div class="coach-pricing-grid">
        <article><b>${esc(q.frequency_label || 'Offer')}</b><small>Offer type</small></article>
        <article><b>${money(q.listed_coach_price_amount ?? q.coach_base_amount)}</b><small>Listed coach price</small></article>
        <article><b>${q.coach_adjustment_amount > 0 ? '+' : ''}${money(q.coach_adjustment_amount || 0)}</b><small>Coach adjustment</small></article>
        <article><b>${money(q.coach_price_after_adjustment_amount ?? q.coach_keeps_before_tax_amount)}</b><small>Coach price after adjustment</small></article>
        <article><b>${money(q.processing_fee_amount)}</b><small>Processing fees</small></article>
        <article><b>${money(q.customer_total_amount)}</b><small>Customer total</small></article>
      </div>
      <small>${esc(q.discount_example_formula || '')}</small>`;
  }
  async function refreshQuote(prefix){
    const client = sb(); if(!client) return;
    const weekly = Number($('#' + prefix + 'WeeklyPrice')?.value || DEFAULT_WEEKLY);
    const freq = $('#' + prefix + 'PricingFrequency')?.value || DEFAULT_FREQ;
    const adjustment = Number($('#' + prefix + 'CoachAdjustment')?.value || 0);
    const {data,error} = await client.rpc('quote_coach_frequency_price_adjusted', {
      p_weekly_price: weekly,
      p_frequency_key: freq,
      p_coach_adjustment: adjustment
    });
    if(error){
      const box=$('#' + quoteBoxId(prefix)); if(box) box.textContent=error.message || 'Pricing unavailable.';
      return;
    }
    renderQuote(prefix,data);
  }
  function bindPricing(prefix){
    ['PricingFrequency','WeeklyPrice','CoachAdjustment'].forEach(suffix => {
      const el = $('#' + prefix + suffix);
      if(el && !el.dataset.pricingBound){
        el.dataset.pricingBound = '1';
        el.addEventListener('input', () => refreshQuote(prefix));
        el.addEventListener('change', () => refreshQuote(prefix));
      }
    });
    refreshQuote(prefix);
  }

  function enhanceNewServiceDialog(){
    const form = $('#coachServiceForm');
    if(!form || form.dataset.pricingEnhanced) return;
    form.dataset.pricingEnhanced = '1';
    const price = $('#liveServicePrice');
    if(price){ price.value = '195.00'; price.closest('label').style.display='none'; }
    const billing = $('#liveServiceBilling');
    if(billing) billing.value = 'monthly';
    const desc = $('#liveServiceDescription')?.closest('label');
    if(desc) desc.insertAdjacentHTML('beforebegin', pricingFields('liveService', DEFAULT_FREQ, DEFAULT_WEEKLY, 0));
    bindPricing('liveService');
  }
  async function saveNewServicePricing(serviceId){
    const client = sb(); if(!client || !serviceId) return;
    await client.rpc('save_my_coach_service_pricing_adjusted', {
      p_service_id: serviceId,
      p_weekly_price: Number($('#liveServiceWeeklyPrice')?.value || DEFAULT_WEEKLY),
      p_frequency_key: $('#liveServicePricingFrequency')?.value || DEFAULT_FREQ,
      p_coach_adjustment: Number($('#liveServiceCoachAdjustment')?.value || 0)
    });
  }

  function findLatestServiceId(){
    const rows = window.LelleeCoachDashboardLive ? null : null;
    const serviceCards = Array.from(document.querySelectorAll('[data-coach-open-service]'));
    return serviceCards[0]?.dataset?.coachOpenService || null;
  }

  function enhanceManageServiceDialog(){
    const form = $('#coachServiceManagementForm');
    if(!form || form.dataset.pricingEnhanced) return;
    form.dataset.pricingEnhanced = '1';
    const selected = ($('#coachManageServiceBilling')?.value === 'monthly') ? DEFAULT_FREQ : 'weekly_session';
    const price = Number($('#coachManageServicePrice')?.value || 195);
    const weekly = selected === DEFAULT_FREQ ? (price / 1.3).toFixed(2) : price.toFixed(2);
    const desc = $('#coachManageServiceDescription')?.closest('label');
    if(desc) desc.insertAdjacentHTML('beforebegin', pricingFields('coachManageService', selected, weekly || DEFAULT_WEEKLY, Number($('#coachManageServiceAdjustment')?.value || 0)));
    bindPricing('coachManageService');
  }
  async function saveManagedServicePricing(serviceId){
    const client = sb(); if(!client || !serviceId) return;
    await client.rpc('save_my_coach_service_pricing_adjusted', {
      p_service_id: serviceId,
      p_weekly_price: Number($('#coachManageServiceWeeklyPrice')?.value || DEFAULT_WEEKLY),
      p_frequency_key: $('#coachManageServicePricingFrequency')?.value || DEFAULT_FREQ,
      p_coach_adjustment: Number($('#coachManageServiceCoachAdjustment')?.value || 0)
    });
  }

  function injectStyles(){
    if($('#coachPricingServiceStyle')) return;
    const st=document.createElement('style');
    st.id='coachPricingServiceStyle';
    st.textContent='.coach-pricing-panel{border:1px solid #dfe8e3;background:#fbfcfb;border-radius:14px;padding:13px;margin:8px 0 12px}.coach-pricing-quote{margin-top:9px}.coach-pricing-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:8px 0}.coach-pricing-grid article{background:#fff;border:1px solid #e5ebe8;border-radius:10px;padding:9px}.coach-pricing-grid b{display:block;color:#075b4d}.coach-pricing-grid small{font-size:.62rem;color:#667}@media(max-width:700px){.coach-pricing-grid{grid-template-columns:1fr}}';
    document.head.appendChild(st);
  }

  function boot(){
    injectStyles();
    const mo = new MutationObserver(() => { enhanceNewServiceDialog(); enhanceManageServiceDialog(); });
    mo.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('submit', e => {
      if(e.target?.id === 'coachServiceForm'){
        setTimeout(async () => { try { await saveNewServicePricing(findLatestServiceId()); } catch(err){ console.warn(err); } }, 900);
      }
      if(e.target?.id === 'coachServiceManagementForm'){
        const serviceId = document.querySelector('[data-coach-open-service]')?.dataset?.coachOpenService;
        setTimeout(async () => { try { await saveManagedServicePricing(serviceId); } catch(err){ console.warn(err); } }, 700);
      }
    }, true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
