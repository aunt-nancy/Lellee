(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => '$' + Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const sb = () => bridge()?.client;

  let pricingRows = [];
  let loading = false;

  function toast(message, bad=false){
    const t = $('#globalToast');
    if(t){
      t.textContent = message;
      t.classList.remove('hidden');
      if(bad) t.style.background = '#7f2634';
      setTimeout(() => { t.classList.add('hidden'); t.style.background=''; }, 2600);
      return;
    }
    if(bad) alert(message);
  }

  async function loadPricingRows(){
    const client = sb();
    if(!client || loading) return pricingRows;
    loading = true;
    try{
      const {data,error} = await client.rpc('get_my_coach_consultation_pricing_context');
      if(error) throw error;
      pricingRows = Array.isArray(data) ? data : [];
      return pricingRows;
    }catch(err){
      console.warn('Consultation pricing context unavailable', err);
      return pricingRows;
    }finally{
      loading = false;
    }
  }

  function priceCard(row){
    if(!row || !row.service_package_id){
      return '<div class="coach-convert-price"><b>No selected service yet</b><small>This is a general consultation request. Select a service before conversion when possible.</small></div>';
    }
    return '<div class="coach-convert-price">'+
      '<div><b>'+esc(row.service_name || 'Selected service')+'</b><small>'+esc([row.service_type,row.billing_model].filter(Boolean).map(x=>String(x).replaceAll('_',' ')).join(' · '))+'</small></div>'+
      '<div class="coach-convert-price-grid">'+
        '<span><b>'+money(row.coach_price_after_adjustment_amount || row.listed_coach_price_amount)+'</b><small>Coach price</small></span>'+
        '<span><b>'+money(row.processing_fee_amount || 0)+'</b><small>Processing fees</small></span>'+
        '<span><b>'+money(row.customer_total_amount || row.listed_coach_price_amount)+'</b><small>Customer total</small></span>'+
      '</div>'+
      (row.formula ? '<small class="coach-convert-formula">'+esc(row.formula)+'</small>' : '')+
    '</div>';
  }

  function ensureStyles(){
    if($('#coachConsultConvertStyle')) return;
    const st = document.createElement('style');
    st.id = 'coachConsultConvertStyle';
    st.textContent = [
      '.coach-convert-price{margin:9px 0 7px;padding:10px;border:1px solid #dfe8e3;background:#fbfdfb;border-radius:12px;display:grid;gap:7px}',
      '.coach-convert-price b{color:#075b4d}.coach-convert-price small{display:block;color:#68746f;font-size:.68rem;line-height:1.35}',
      '.coach-convert-price-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}',
      '.coach-convert-price-grid span{background:#fff;border:1px solid #e6ece8;border-radius:10px;padding:8px}',
      '.coach-convert-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px}',
      '.coach-convert-note{font-size:.66rem;color:#6c716f;line-height:1.35;margin-top:5px}',
      '@media(max-width:700px){.coach-convert-price-grid{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(st);
  }

  async function convertRequest(id, btn){
    if(!id) return;
    const row = pricingRows.find(x => x.consultation_request_id === id);
    const label = row?.service_name ? ' for '+row.service_name : '';
    if(!confirm('Convert this consultation request'+label+' into an active coaching client relationship?')) return;
    const client = sb();
    if(!client) return toast('Sign in required.', true);
    btn.disabled = true;
    btn.textContent = 'Converting…';
    try{
      const {data,error} = await client.rpc('convert_my_coach_consultation_to_client', {p_request_id:id});
      if(error) throw error;
      btn.textContent = 'Converted';
      btn.classList.add('converted');
      toast('Consultation converted to active client.');
      pricingRows = pricingRows.filter(x => x.consultation_request_id !== id);
      setTimeout(() => {
        if(typeof showPage === 'function') showPage('coach-scheduler');
      }, 600);
      return data;
    }catch(err){
      btn.disabled = false;
      btn.textContent = 'Convert to Client';
      toast(err.message || 'Could not convert consultation.', true);
    }
  }

  function enhanceConsultationList(){
    const list = $('#coachConsultationList');
    if(!list) return;
    const openButtons = $$('[data-open-coach-consultation]');
    openButtons.forEach(open => {
      const id = open.dataset.openCoachConsultation;
      const card = open.closest('.coach-ops-item, article, .coach-live-item, div');
      if(!id || !card || card.dataset.consultConvertEnhanced) return;
      card.dataset.consultConvertEnhanced = '1';
      const row = pricingRows.find(x => x.consultation_request_id === id);
      open.insertAdjacentHTML('beforebegin', '<button type="button" class="primary" data-convert-consultation="'+esc(id)+'">Convert to Client</button>');
      card.insertAdjacentHTML('beforeend', priceCard(row));
      card.insertAdjacentHTML('beforeend', '<div class="coach-convert-note">Conversion keeps the selected service package, creates an active client relationship, creates a first-session follow-up, and does not share private Lellee journal or check-in data automatically.</div>');
    });
    $$('[data-convert-consultation]').forEach(btn => {
      if(btn.dataset.convertBound) return;
      btn.dataset.convertBound = '1';
      btn.addEventListener('click', () => convertRequest(btn.dataset.convertConsultation, btn));
    });
  }

  async function refresh(){
    await loadPricingRows();
    enhanceConsultationList();
  }

  function boot(){
    ensureStyles();
    const mo = new MutationObserver(() => { refresh(); });
    mo.observe(document.body,{childList:true,subtree:true});
    refresh();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
