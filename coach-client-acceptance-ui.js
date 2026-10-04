(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => '$' + Number(v || 0).toFixed(2);
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const sb = () => bridge()?.client;

  function quoteLine(q){
    if(!q || !q.customer_total_amount) return 'Pricing will be confirmed with the coach.';
    return `${money(q.coach_price_after_adjustment_amount ?? q.coach_keeps_before_tax_amount)} coach price + ${money(q.processing_fee_amount)} processing fees = ${money(q.customer_total_amount)} customer total`;
  }

  function ensureHost(){
    let host = $('#coachPendingAcceptanceList');
    if(host) return host;
    const parent = $('#myCoachInvites') || $('#myCoachRelationships') || $('#page-my-coaching .approved-inner') || $('#page-my-coaching');
    if(!parent) return null;
    const wrap = document.createElement('section');
    wrap.className = 'coach-acceptance-panel';
    wrap.innerHTML = `
      <div class="coach-panel-head"><div><span class="approved-kicker">COACHING REQUESTS</span><h3>Review coaching relationships before they start</h3></div></div>
      <div class="coach-list" id="coachPendingAcceptanceList"></div>`;
    parent.insertAdjacentElement(parent.id === 'myCoachInvites' ? 'beforebegin' : 'afterbegin', wrap);
    return $('#coachPendingAcceptanceList');
  }

  async function loadPending(){
    const client = sb();
    const host = ensureHost();
    if(!client || !host) return;
    const {data,error} = await client.rpc('get_my_pending_coach_relationships');
    if(error){ host.innerHTML = ''; return; }
    const rows = Array.isArray(data) ? data : [];
    if(!rows.length){ host.closest('.coach-acceptance-panel')?.classList.add('hidden'); return; }
    host.closest('.coach-acceptance-panel')?.classList.remove('hidden');
    host.innerHTML = rows.map(r => {
      const q = r.pricing_quote || {};
      return `<article class="coach-acceptance-card" data-pending-coach-rel="${esc(r.relationship_id)}">
        <div class="coach-live-row"><div><b>${esc(r.business_name || 'Coaching Business')}</b><small>${esc(r.program_name || 'Lellee Coaching')}${r.service_name ? ' · '+esc(r.service_name) : ''}</small></div><span class="coach-live-pill">ACTION NEEDED</span></div>
        <div class="coach-acceptance-price"><b>${esc(quoteLine(q))}</b>${q.discount_example_formula ? `<small>${esc(q.discount_example_formula)}</small>` : ''}</div>
        <div class="coach-live-review-note"><b>Privacy default:</b> Your journal, check-ins, support contacts, and recovery history are not shared automatically. Accepting starts the coaching relationship only. You choose what to share later.</div>
        <label class="coach-acceptance-check"><input type="checkbox" data-privacy-ack="${esc(r.relationship_id)}"> I understand my private Lellee information is not automatically shared.</label>
        <div class="coach-live-actions"><button class="primary" data-accept-coach-rel="${esc(r.relationship_id)}">Accept coaching</button><button data-decline-coach-rel="${esc(r.relationship_id)}">Decline</button></div>
      </article>`;
    }).join('');
  }

  async function respond(id, accept){
    const client = sb(); if(!client || !id) return;
    if(accept && !$(`[data-privacy-ack="${id}"]`)?.checked){
      alert('Please confirm the privacy acknowledgement before accepting.');
      return;
    }
    let reason = null;
    if(!accept) reason = prompt('Optional: reason for declining?','') || null;
    const {error} = await client.rpc('accept_my_coach_relationship', {
      p_relationship_id: id,
      p_accept: !!accept,
      p_data_sharing_scope: {},
      p_decline_reason: reason
    });
    if(error){ alert(error.message || 'Could not update coaching relationship.'); return; }
    await loadPending();
    if(typeof window.showPage === 'function') window.showPage('my-coaching');
  }

  function injectStyles(){
    if($('#coachClientAcceptanceStyle')) return;
    const st = document.createElement('style');
    st.id = 'coachClientAcceptanceStyle';
    st.textContent = '.coach-acceptance-panel{margin:0 0 16px}.coach-acceptance-card{border:1px solid #dfe8e3;background:#fbfdfb;border-radius:14px;padding:14px;margin:10px 0}.coach-acceptance-price{background:#fff;border:1px solid #e5ebe8;border-radius:10px;padding:10px;margin:10px 0}.coach-acceptance-price b{display:block;color:#075b4d}.coach-acceptance-price small{display:block;color:#667;margin-top:3px}.coach-acceptance-check{display:flex;gap:8px;align-items:flex-start;font-size:.78rem;margin:10px 0;color:#32423c}.hidden{display:none!important}';
    document.head.appendChild(st);
  }

  function boot(){
    injectStyles();
    document.addEventListener('click', e => {
      const accept = e.target.closest?.('[data-accept-coach-rel]');
      if(accept){ respond(accept.dataset.acceptCoachRel, true); return; }
      const decline = e.target.closest?.('[data-decline-coach-rel]');
      if(decline){ respond(decline.dataset.declineCoachRel, false); }
    });
    const oldShow = window.showPage;
    if(typeof oldShow === 'function' && !oldShow.__coachAcceptanceWrapped){
      const wrapped = function(name){
        oldShow(name);
        if(name === 'my-coaching') setTimeout(loadPending, 250);
      };
      wrapped.__coachAcceptanceWrapped = true;
      window.showPage = wrapped;
    }
    setTimeout(loadPending, 1000);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
