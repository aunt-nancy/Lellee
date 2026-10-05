(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => '$' + Number(v || 0).toFixed(2);
  const dateTime = v => v ? new Date(v).toLocaleString() : 'Not scheduled';
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const sb = () => bridge()?.client;

  let lastRun = 0;

  function injectStyles(){
    if($('#coachClientPaidStyle')) return;
    const st = document.createElement('style');
    st.id = 'coachClientPaidStyle';
    st.textContent = [
      '.coach-client-paid-panel{border:1px solid #e1e8e5;background:#fbfcfb;border-radius:16px;padding:14px;margin:14px 0}',
      '.coach-client-paid-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px}',
      '.coach-client-paid-head h3{margin:2px 0 4px}.coach-client-paid-head p{margin:0;color:#667;font-size:.78rem;line-height:1.35}',
      '.coach-client-paid-list{display:grid;gap:10px}',
      '.coach-client-paid-card{background:#fff;border:1px solid #e7ece9;border-radius:12px;padding:11px}',
      '.coach-client-paid-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}',
      '.coach-client-paid-row b{display:block}.coach-client-paid-row small{display:block;color:#667;margin-top:2px}',
      '.coach-client-paid-pill{display:inline-flex;align-items:center;border:1px solid #dce8e3;border-radius:999px;padding:4px 8px;font-size:.65rem;font-weight:850;color:#075b4d;background:#f5fbf9}',
      '.coach-client-paid-warning{color:#8c3548;background:#fff4f5;border-color:#efd3d8}',
      '.coach-client-paid-detail{margin-top:9px;background:#f4f8f6;border:1px solid #dce9e3;border-radius:10px;padding:9px;font-size:.74rem;line-height:1.4}',
      '.coach-client-session-list{display:grid;gap:7px;margin-top:9px}',
      '.coach-client-session-item{border:1px solid #eef1ef;border-radius:10px;padding:8px;background:#fff}',
      '@media(max-width:700px){.coach-client-paid-row{flex-direction:column}}'
    ].join('');
    document.head.appendChild(st);
  }

  function host(){
    return $('#myCoachRelationships') || $('#page-my-coaching .approved-inner') || $('#page-my-coaching .section-shell');
  }

  function statusPill(text, warning=false){
    return '<span class="coach-client-paid-pill '+(warning?'coach-client-paid-warning':'')+'">'+esc(text)+'</span>';
  }

  function render(ctx){
    const h = host();
    if(!h) return;
    let panel = $('#coachClientPaidPanel');
    if(!panel){
      panel = document.createElement('section');
      panel.id = 'coachClientPaidPanel';
      panel.className = 'coach-client-paid-panel';
      h.parentElement ? h.parentElement.insertBefore(panel, h.nextSibling) : h.appendChild(panel);
    }
    const rels = ctx.relationships || [];
    panel.innerHTML = `
      <div class="coach-client-paid-head">
        <div><span class="approved-kicker">PAID COACHING</span><h3>Payment and session readiness</h3><p>Payment collection is prepared but remains off until launch review. This panel shows service totals, payment status, sessions, and cancellation/refund policy without sharing private Lellee data.</p></div>
        ${statusPill(ctx.policy?.payments_enabled ? 'Payments enabled' : 'Payments gated', !ctx.policy?.payments_enabled)}
      </div>
      <div class="coach-client-paid-list">
        ${rels.length ? rels.map(renderRelationship).join('') : '<div class="coach-client-paid-detail">No coaching payment or session records yet.</div>'}
      </div>`;
  }

  function renderRelationship(r){
    const readiness = r.payment_readiness || {};
    const policy = readiness.policy || {};
    const sessions = r.sessions || [];
    const blocked = readiness.blocked_reasons || {};
    const blockedText = Object.values(blocked).filter(Boolean).join(' ');
    return `<article class="coach-client-paid-card">
      <div class="coach-client-paid-row">
        <div><b>${esc(r.business_name || 'Coach')}</b><small>${esc(r.service_name || 'No selected service')} · ${esc(r.program_name || 'Program')}</small></div>
        ${statusPill(readiness.paid_session_ready ? 'Ready' : 'Not ready yet', !readiness.paid_session_ready)}
      </div>
      <div class="coach-client-paid-detail">
        Customer total: <b>${money(readiness.customer_total_amount)}</b><br>
        Client accepted: <b>${readiness.client_accepted ? 'Yes' : 'No'}</b><br>
        Payment required: <b>${readiness.payment_required ? 'Yes' : 'No'}</b><br>
        Payment ready: <b>${readiness.payment_ready ? 'Yes' : 'No'}</b><br>
        Collection status: <b>${policy.payments_enabled ? 'Enabled' : 'Gated/off until launch review'}</b><br>
        Cancellation window: <b>${esc(policy.cancellation_window_hours || 24)} hours</b><br>
        Refund review window: <b>${esc(policy.refund_review_window_days || 7)} days</b><br>
        ${blockedText ? statusPill(blockedText,true) : statusPill('No current readiness block')}
      </div>
      <div class="coach-client-session-list">
        ${sessions.length ? sessions.map(renderSession).join('') : '<div class="coach-client-session-item"><small>No sessions scheduled yet.</small></div>'}
      </div>
    </article>`;
  }

  function renderSession(s){
    return `<div class="coach-client-session-item">
      <b>${esc(s.title || 'Coaching Session')}</b>
      <small>${esc(dateTime(s.scheduled_start))} · ${esc(String(s.duration_minutes || 50))} min</small><br>
      ${statusPill('Session: '+(s.status || 'scheduled'))}
      ${statusPill('Payment: '+(s.payment_status || 'not required'), s.payment_status && !['paid','not_required'].includes(s.payment_status))}
      ${s.cancellation_status && s.cancellation_status !== 'none' ? statusPill('Cancellation: '+s.cancellation_status, true) : ''}
      ${s.refund_status && s.refund_status !== 'none' ? statusPill('Refund: '+s.refund_status, true) : ''}
    </div>`;
  }

  async function refresh(){
    if(Date.now() - lastRun < 1200) return;
    lastRun = Date.now();
    if(!host()) return;
    const client = sb();
    if(!client) return;
    const {data,error} = await client.rpc('get_my_client_coach_paid_context');
    if(error){ console.warn('Client paid coaching panel unavailable', error); return; }
    render(data || {});
  }

  function boot(){
    injectStyles();
    const mo = new MutationObserver(refresh);
    mo.observe(document.body,{childList:true,subtree:true});
    setInterval(refresh, 5000);
    refresh();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
