(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const sb = () => bridge()?.client || window.sb || null;
  let state = null;
  let busy = false;

  function injectStyles(){
    if($('#coachingLaunchAcceptanceStyle')) return;
    const st=document.createElement('style');
    st.id='coachingLaunchAcceptanceStyle';
    st.textContent = [
      '.coach-launch-qa{border:1px solid #e0e7ea;background:#fbfcfd;border-radius:18px;padding:16px;margin:16px 0;box-shadow:0 8px 22px rgba(20,30,40,.04)}',
      '.coach-launch-qa-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}',
      '.coach-launch-qa-head h3{margin:2px 0 5px}.coach-launch-qa-head p{margin:0;color:#667;font-size:.78rem;line-height:1.4}',
      '.coach-launch-qa-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:10px 0 12px}',
      '.coach-launch-qa-summary article{background:#fff;border:1px solid #e8ecef;border-radius:12px;padding:10px;text-align:center}',
      '.coach-launch-qa-summary b{display:block;font-size:1.05rem}.coach-launch-qa-summary small{display:block;color:#667;font-size:.64rem}',
      '.coach-launch-qa-list{display:grid;gap:8px;max-height:620px;overflow:auto;padding-right:3px}',
      '.coach-launch-qa-test{background:#fff;border:1px solid #e8ecef;border-radius:12px;padding:11px}',
      '.coach-launch-qa-row{display:flex;gap:12px;justify-content:space-between;align-items:flex-start}',
      '.coach-launch-qa-row b{display:block}.coach-launch-qa-row small{display:block;color:#667;margin-top:3px;line-height:1.35}',
      '.coach-launch-qa-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
      '.coach-launch-qa-steps{margin:9px 0 0;padding:9px 10px;background:#f8fafb;border:1px solid #e6ecef;border-radius:10px}',
      '.coach-launch-qa-steps strong{display:block;font-size:.68rem;letter-spacing:.06em;color:#31515a;margin-bottom:5px;text-transform:uppercase}',
      '.coach-launch-qa-steps ol{margin:0;padding-left:19px;display:grid;gap:4px}',
      '.coach-launch-qa-steps li{font-size:.72rem;color:#4d5963;line-height:1.35}',
      '.coach-launch-qa-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}',
      '.coach-launch-qa-actions button{border:1px solid #dde6ea;background:#fff;border-radius:999px;padding:6px 9px;font-weight:850;font-size:.68rem}',
      '.coach-launch-qa-pill{display:inline-flex;align-items:center;border-radius:999px;padding:4px 8px;font-size:.62rem;font-weight:900;border:1px solid #dce6ea;background:#f7fafb;color:#31515a;white-space:nowrap}',
      '.coach-launch-qa-pill.pass{background:#eef8f1;color:#17623f;border-color:#cfe9d8}',
      '.coach-launch-qa-pill.fail{background:#fff1f3;color:#8c3548;border-color:#edd0d7}',
      '.coach-launch-qa-pill.blocked{background:#fff7e7;color:#7f5711;border-color:#efd99e}',
      '.coach-launch-qa-pill.not_run{background:#f3f5f7;color:#5d6570}',
      '.coach-launch-qa-detail{margin-top:7px;color:#5d6570;font-size:.7rem;line-height:1.35}',
      '@media(max-width:820px){.coach-launch-qa-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.coach-launch-qa-row{flex-direction:column}.coach-launch-qa-head{flex-direction:column}}'
    ].join('');
    document.head.appendChild(st);
  }

  function host(){
    return $('#page-admin-operations .approved-inner') || $('#page-admin .approved-inner') || $('#adminOperationsWorkspace') || $('#page-coach-credentials .approved-inner') || $('#page-coach-dashboard .approved-inner') || $('#page-settings .approved-inner');
  }

  async function load(){
    const client=sb();
    if(!client || busy) return;
    try{
      busy=true;
      const {data,error}=await client.rpc('get_coaching_launch_acceptance_status');
      if(error) return;
      state=data;
      render();
    }catch(_){
      // Admin-only panel: stay hidden if access is not available.
    }finally{busy=false;}
  }

  async function record(testKey,status){
    const detail = prompt(`Optional note for ${status.toUpperCase()}:`, '') || null;
    const client=sb();
    const {error}=await client.rpc('record_coaching_launch_acceptance_result', {p_test_key:testKey, p_status:status, p_detail:detail});
    if(error){ alert(error.message || 'Could not record result.'); return; }
    await load();
  }

  function renderSteps(t){
    const steps = Array.isArray(t.manual_steps) ? t.manual_steps : [];
    if(!steps.length) return '';
    return `<div class="coach-launch-qa-steps"><strong>Walkthrough steps</strong><ol>${steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol></div>`;
  }

  function render(){
    const h=host();
    if(!h || !state?.ready) return;
    injectStyles();
    let panel=$('#coachingLaunchAcceptancePanel');
    if(!panel){
      panel=document.createElement('section');
      panel.id='coachingLaunchAcceptancePanel';
      panel.className='coach-launch-qa';
      h.prepend(panel);
    }
    const s=state.summary || {};
    const tests=state.tests || [];
    panel.innerHTML = `
      <div class="coach-launch-qa-head">
        <div><span class="approved-kicker">COACHING LAUNCH QA</span><h3>End-to-end acceptance checklist</h3><p>One master checklist for coach, client, admin, desktop, mobile, privacy, payment readiness, and marketplace launch gates. Open each test, follow the walkthrough steps, then record Pass, Fail, Blocked, or Not run.</p></div>
        <span class="coach-launch-qa-pill ${s.launch_ready?'pass':'blocked'}">${s.launch_ready?'Launch ready':'Launch blocked'}</span>
      </div>
      <div class="coach-launch-qa-summary">
        <article><b>${s.total ?? s.total_tests ?? 0}</b><small>Total tests</small></article>
        <article><b>${s.passed ?? 0}</b><small>Passed</small></article>
        <article><b>${s.failed ?? 0}</b><small>Failed</small></article>
        <article><b>${s.blocked ?? 0}</b><small>Blocked</small></article>
        <article><b>${s.not_run ?? 0}</b><small>Not run</small></article>
      </div>
      <div class="coach-launch-qa-list">
        ${tests.map(t => `
          <article class="coach-launch-qa-test">
            <div class="coach-launch-qa-row">
              <div><b>${esc(t.name)}</b><small>${esc(t.expected_result || '')}</small></div>
              <span class="coach-launch-qa-pill ${esc(t.latest_status)}">${esc(String(t.latest_status || 'not_run').replaceAll('_',' '))}</span>
            </div>
            <div class="coach-launch-qa-meta">
              <span class="coach-launch-qa-pill">${esc(t.severity || 'normal')}</span>
              <span class="coach-launch-qa-pill">${esc(t.actor_role || 'Admin')}</span>
              <span class="coach-launch-qa-pill">${esc(t.device_scope || 'Desktop + Mobile')}</span>
            </div>
            ${renderSteps(t)}
            ${t.latest_detail ? `<div class="coach-launch-qa-detail">Latest note: ${esc(t.latest_detail)}</div>` : ''}
            <div class="coach-launch-qa-actions">
              <button data-qa-pass="${esc(t.test_key)}">Pass</button>
              <button data-qa-fail="${esc(t.test_key)}">Fail</button>
              <button data-qa-blocked="${esc(t.test_key)}">Blocked</button>
              <button data-qa-notrun="${esc(t.test_key)}">Not run</button>
            </div>
          </article>`).join('')}
      </div>`;
    panel.querySelectorAll('[data-qa-pass]').forEach(b=>b.onclick=()=>record(b.dataset.qaPass,'pass'));
    panel.querySelectorAll('[data-qa-fail]').forEach(b=>b.onclick=()=>record(b.dataset.qaFail,'fail'));
    panel.querySelectorAll('[data-qa-blocked]').forEach(b=>b.onclick=()=>record(b.dataset.qaBlocked,'blocked'));
    panel.querySelectorAll('[data-qa-notrun]').forEach(b=>b.onclick=()=>record(b.dataset.qaNotrun,'not_run'));
  }

  function boot(){
    const mo=new MutationObserver(()=>{ if(state) render(); else load(); });
    mo.observe(document.body,{childList:true,subtree:true});
    setInterval(load, 8000);
    load();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
