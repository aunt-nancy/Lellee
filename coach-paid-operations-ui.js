(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => '$' + Number(v || 0).toFixed(2);
  const when = v => v ? new Date(v).toLocaleString() : '—';
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const sb = () => bridge()?.client;

  let lastRendered = 0;
  let contextCache = null;
  let sessionCache = null;

  function injectStyles(){
    if($('#coachPaidOpsStyle')) return;
    const st = document.createElement('style');
    st.id = 'coachPaidOpsStyle';
    st.textContent = [
      '.coach-paid-ops-panel{border:1px solid #dfe8e3;background:#fbfcfb;border-radius:16px;padding:14px;margin:14px 0}',
      '.coach-paid-ops-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}',
      '.coach-paid-ops-head h3{margin:2px 0 4px}',
      '.coach-paid-ops-head p{margin:0;color:#667;font-size:.78rem;line-height:1.35}',
      '.coach-paid-ops-grid{display:grid;grid-template-columns:1fr;gap:12px}',
      '.coach-paid-ops-section{display:grid;gap:9px}',
      '.coach-paid-ops-section h4{margin:4px 0 0;font-size:.86rem;color:#173047}',
      '.coach-paid-ops-list{display:grid;gap:9px}',
      '.coach-paid-ops-card{background:#fff;border:1px solid #e7ece9;border-radius:12px;padding:11px}',
      '.coach-paid-ops-row{display:flex;justify-content:space-between;gap:12px;align-items:center}',
      '.coach-paid-ops-row b{display:block}.coach-paid-ops-row small{display:block;color:#667;margin-top:2px}',
      '.coach-paid-ops-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}',
      '.coach-paid-ops-actions button{border:1px solid #d7e3de;background:#fff;border-radius:999px;padding:7px 10px;font-weight:800;font-size:.72rem}',
      '.coach-paid-ops-actions button.primary{background:#075b4d;color:#fff;border-color:#075b4d}',
      '.coach-paid-ops-actions button.danger{background:#fff4f5;color:#8c3548;border-color:#efd3d8}',
      '.coach-paid-ops-detail{margin-top:8px;background:#f4f8f6;border:1px solid #dce9e3;border-radius:10px;padding:9px;font-size:.74rem;line-height:1.4}',
      '.coach-paid-ops-pill{display:inline-flex;align-items:center;border:1px solid #dce8e3;border-radius:999px;padding:4px 8px;font-size:.65rem;font-weight:850;color:#075b4d;background:#f5fbf9}',
      '.coach-paid-ops-warning{color:#8c3548;background:#fff4f5;border-color:#efd3d8}',
      '.coach-paid-ops-muted{color:#667;font-size:.72rem}',
      '@media(max-width:700px){.coach-paid-ops-row{align-items:flex-start;flex-direction:column}}'
    ].join('');
    document.head.appendChild(st);
  }

  function dashboardHost(){
    return $('#coachPanelClients') || $('#coachClientList')?.parentElement || $('#page-coach-dashboard .approved-inner') || $('#page-coach-dashboard .section-shell');
  }

  async function loadContext(){
    const client = sb();
    if(!client) return null;
    const {data,error} = await client.rpc('get_my_coach_dashboard_context');
    if(error) throw error;
    contextCache = data || {};
    return contextCache;
  }

  async function loadSessions(){
    const client = sb();
    if(!client) return null;
    const {data,error} = await client.rpc('get_my_coach_paid_session_controls');
    if(error) throw error;
    sessionCache = data || {sessions:[]};
    return sessionCache;
  }

  function activeClients(ctx){
    return (ctx?.clients || []).filter(c => c.status === 'active' && (!c.client_acceptance_status || c.client_acceptance_status === 'accepted'));
  }

  async function showReadiness(relId){
    const detail = $('#paidOpsDetail-' + relId);
    if(detail) detail.textContent = 'Checking readiness…';
    const client = sb();
    const {data,error} = await client.rpc('get_my_coach_relationship_payment_readiness', {p_relationship_id: relId});
    if(error){ if(detail) detail.textContent = error.message || 'Readiness unavailable.'; return; }
    const blocked = data.blocked_reasons || {};
    const blockedText = Object.values(blocked).filter(Boolean).join(' ');
    if(detail){
      detail.innerHTML = `
        <b>${data.paid_session_ready ? 'Ready for paid session' : 'Not ready yet'}</b><br>
        Client accepted: <b>${data.client_accepted ? 'Yes' : 'No'}</b><br>
        Payment required: <b>${data.payment_required ? 'Yes' : 'No'}</b><br>
        Payment ready: <b>${data.payment_ready ? 'Yes' : 'No'}</b><br>
        Customer total: <b>${money(data.customer_total_amount)}</b><br>
        ${blockedText ? '<span class="coach-paid-ops-pill coach-paid-ops-warning">'+esc(blockedText)+'</span>' : '<span class="coach-paid-ops-pill">All current readiness checks passed</span>'}
      `;
    }
  }

  async function scheduleSession(relId){
    const raw = prompt('Session date and time (example: 2026-10-08 14:00):');
    if(!raw) return;
    const normalized = raw.trim().replace(' ', 'T');
    const d = new Date(normalized);
    if(Number.isNaN(d.getTime())){ alert('Use a valid date/time like 2026-10-08 14:00.'); return; }
    const title = prompt('Session title:', 'Coaching Session') || 'Coaching Session';
    const client = sb();
    const {data,error} = await client.rpc('create_my_coach_schedule_event', {
      p_relationship_id: relId,
      p_scheduled_start: d.toISOString(),
      p_duration_minutes: 50,
      p_title: title,
      p_meeting_location: null,
      p_meeting_url: null,
      p_operational_note: 'Created from Paid Coaching Operations readiness panel.'
    });
    if(error){ alert(error.message || 'Could not schedule session.'); return; }
    await showReadiness(relId);
    await refresh(true);
    alert(data?.paid_session_ready ? 'Session scheduled and ready.' : 'Session scheduled with payment/readiness status: ' + (data?.payment_status || 'pending'));
  }

  async function updateSessionStatus(eventId, status){
    let reason = null;
    let refundReason = null;
    if(status === 'cancelled') reason = prompt('Cancellation reason or note:', '') || null;
    if(status === 'no_show') reason = prompt('No-show note:', '') || null;
    if(status === 'refund_review') refundReason = prompt('Refund review reason:', '') || null;
    const note = prompt('Optional internal note:', '') || null;
    const client = sb();
    const {data,error} = await client.rpc('update_my_coach_paid_session_status', {
      p_event_id: eventId,
      p_status: status,
      p_note: note,
      p_cancellation_reason: reason,
      p_refund_reason: refundReason
    });
    if(error){ alert(error.message || 'Could not update session status.'); return; }
    await refresh(true);
    alert(data?.message || 'Session status updated.');
  }

  function sessionCard(s){
    const warning = (s.payment_status && !['not_required','ready','manual_paid','paid','checkout_completed'].includes(String(s.payment_status))) || s.refund_status === 'review_pending';
    return `
      <article class="coach-paid-ops-card">
        <div class="coach-paid-ops-row">
          <div><b>${esc(s.title || 'Coaching Session')}</b><small>${esc(s.client_name || 'Client')} · ${when(s.scheduled_start)} · ${esc(s.service_name || 'No selected service')}</small></div>
          <span class="coach-paid-ops-pill ${warning ? 'coach-paid-ops-warning' : ''}">${esc(String(s.status || '').replaceAll('_',' '))}</span>
        </div>
        <div class="coach-paid-ops-detail">
          Payment: <b>${esc(String(s.payment_status || 'not_required').replaceAll('_',' '))}</b> · Customer total: <b>${money(s.customer_total_amount)}</b><br>
          Cancellation: <b>${esc(String(s.cancellation_status || 'none').replaceAll('_',' '))}</b> · Refund: <b>${esc(String(s.refund_status || 'none').replaceAll('_',' '))}</b><br>
          ${s.formula ? '<span class="coach-paid-ops-muted">'+esc(s.formula)+'</span>' : '<span class="coach-paid-ops-muted">Payment collection remains gated until launch review.</span>'}
        </div>
        <div class="coach-paid-ops-actions">
          <button data-session-status="confirmed" data-session-id="${esc(s.id)}">Confirm</button>
          <button class="primary" data-session-status="completed" data-session-id="${esc(s.id)}">Complete</button>
          <button data-session-status="no_show" data-session-id="${esc(s.id)}">No-show</button>
          <button class="danger" data-session-status="cancelled" data-session-id="${esc(s.id)}">Cancel</button>
          <button data-session-status="refund_review" data-session-id="${esc(s.id)}">Refund review</button>
        </div>
      </article>`;
  }

  function renderPanel(ctx, sessionsCtx){
    const host = dashboardHost();
    if(!host) return;
    let panel = $('#coachPaidOpsPanel');
    if(!panel){
      panel = document.createElement('section');
      panel.id = 'coachPaidOpsPanel';
      panel.className = 'coach-paid-ops-panel';
      host.parentElement ? host.parentElement.insertBefore(panel, host.nextSibling) : host.appendChild(panel);
    }
    const clients = activeClients(ctx);
    const sessions = sessionsCtx?.sessions || [];
    panel.innerHTML = `
      <div class="coach-paid-ops-head">
        <div><span class="approved-kicker">PAID COACHING OPERATIONS</span><h3>Session readiness and controls</h3><p>Paid coaching cannot start until client acceptance is complete and payment status is clear. Payment collection remains gated until launch review.</p></div>
        <span class="coach-paid-ops-pill">Payments gated</span>
      </div>
      <div class="coach-paid-ops-grid">
        <div class="coach-paid-ops-section"><h4>Client readiness</h4><div class="coach-paid-ops-list">
          ${clients.length ? clients.map(c => `
            <article class="coach-paid-ops-card">
              <div class="coach-paid-ops-row"><div><b>${esc(c.client_name || 'Client')}</b><small>${esc(c.service_name || 'No selected service')} · ${esc(c.status || '')}</small></div><span class="coach-paid-ops-pill">${esc(c.program_name || 'Program')}</span></div>
              <div class="coach-paid-ops-actions"><button data-paid-ready="${esc(c.id)}">Check readiness</button><button class="primary" data-paid-schedule="${esc(c.id)}">Schedule guarded session</button></div>
              <div class="coach-paid-ops-detail" id="paidOpsDetail-${esc(c.id)}">Readiness not checked yet.</div>
            </article>`).join('') : '<div class="coach-paid-ops-detail">No active accepted clients are available yet.</div>'}
        </div></div>
        <div class="coach-paid-ops-section"><h4>Session status controls</h4><div class="coach-paid-ops-list">
          ${sessions.length ? sessions.map(sessionCard).join('') : '<div class="coach-paid-ops-detail">No sessions in the current 30-day past / 90-day upcoming window.</div>'}
        </div></div>
      </div>`;
    panel.querySelectorAll('[data-paid-ready]').forEach(b => b.onclick = () => showReadiness(b.dataset.paidReady));
    panel.querySelectorAll('[data-paid-schedule]').forEach(b => b.onclick = () => scheduleSession(b.dataset.paidSchedule));
    panel.querySelectorAll('[data-session-status]').forEach(b => b.onclick = () => updateSessionStatus(b.dataset.sessionId, b.dataset.sessionStatus));
  }

  async function refresh(force=false){
    if(!force && Date.now() - lastRendered < 1200) return;
    lastRendered = Date.now();
    const host = dashboardHost();
    if(!host) return;
    try{
      const [ctx, sessionsCtx] = await Promise.all([loadContext(), loadSessions()]);
      if(ctx?.has_business) renderPanel(ctx, sessionsCtx);
    }catch(err){
      console.warn('Paid coaching ops panel unavailable', err);
    }
  }

  function boot(){
    injectStyles();
    const mo = new MutationObserver(() => refresh(false));
    mo.observe(document.body, {childList:true, subtree:true});
    setInterval(() => refresh(false), 4000);
    refresh(true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
