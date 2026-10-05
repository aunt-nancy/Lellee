(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const sb = () => bridge()?.client || window.sb || null;
  let state = null;
  let busy = false;

  function injectStyles(){
    if($('#coachDisclosureReviewStyle')) return;
    const st = document.createElement('style');
    st.id = 'coachDisclosureReviewStyle';
    st.textContent = [
      '.coach-disclosure-review{border:1px solid #e6ded6;background:#fffdf9;border-radius:18px;padding:16px;margin:16px 0;box-shadow:0 8px 24px rgba(70,50,20,.04)}',
      '.coach-disclosure-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}',
      '.coach-disclosure-head h3{margin:2px 0 5px}.coach-disclosure-head p{margin:0;color:#6b6258;font-size:.78rem;line-height:1.4}',
      '.coach-disclosure-list{display:grid;gap:10px}',
      '.coach-disclosure-card{background:#fff;border:1px solid #eee5da;border-radius:14px;padding:12px}',
      '.coach-disclosure-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}',
      '.coach-disclosure-row b{display:block}.coach-disclosure-row small{display:block;color:#6b6258;line-height:1.35;margin-top:4px}',
      '.coach-disclosure-body{margin-top:9px;background:#fbf7f1;border:1px solid #eee2d5;border-radius:10px;padding:10px;font-size:.74rem;line-height:1.45;white-space:pre-wrap;color:#372f27;max-height:180px;overflow:auto}',
      '.coach-disclosure-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}',
      '.coach-disclosure-actions button{border:1px solid #e1d4c4;background:#fff;border-radius:999px;padding:6px 9px;font-weight:850;font-size:.68rem}',
      '.coach-disclosure-actions button.primary{background:#6b4a22;color:#fff;border-color:#6b4a22}',
      '.coach-disclosure-pill{display:inline-flex;align-items:center;border-radius:999px;padding:4px 8px;font-size:.62rem;font-weight:900;border:1px solid #e3d7c9;background:#fffaf4;color:#674a26;white-space:nowrap}',
      '.coach-disclosure-pill.approved{background:#eef8f1;color:#17623f;border-color:#cfe9d8}',
      '.coach-disclosure-pill.needs_revision{background:#fff1f3;color:#8c3548;border-color:#edd0d7}',
      '.coach-disclosure-pill.review{background:#eef4fb;color:#244b73;border-color:#d2e2f1}',
      '.coach-disclosure-pill.draft{background:#f3f5f7;color:#5d6570}',
      '@media(max-width:820px){.coach-disclosure-row,.coach-disclosure-head{flex-direction:column}}'
    ].join('');
    document.head.appendChild(st);
  }

  function host(){
    return $('#page-admin-operations .approved-inner') || $('#page-admin .approved-inner') || $('#adminOperationsWorkspace') || $('#page-coach-credentials .approved-inner') || $('#page-settings .approved-inner') || $('#page-coach-dashboard .approved-inner');
  }

  async function load(){
    const client = sb();
    if(!client || busy) return;
    try{
      busy = true;
      const {data,error} = await client.rpc('get_coach_marketplace_disclosure_packet');
      if(error || !data?.is_admin) return;
      state = data;
      render();
    }catch(_){
      // Admin-only panel remains hidden when unavailable.
    }finally{
      busy = false;
    }
  }

  async function updateDisclosure(key, status){
    const current = (state?.items || []).find(x => x.disclosure_key === key);
    const note = prompt(`Reviewer note for ${status.replaceAll('_',' ')}:`, current?.reviewer_note || '') || null;
    let body = null;
    if(status === 'review' || status === 'approved' || status === 'needs_revision'){
      body = current?.body || null;
    }
    const client = sb();
    const {error} = await client.rpc('admin_update_coach_marketplace_disclosure', {
      p_disclosure_key: key,
      p_status: status,
      p_body: body,
      p_reviewer_note: note
    });
    if(error){ alert(error.message || 'Could not update disclosure.'); return; }
    await load();
  }

  function render(){
    const h = host();
    if(!h || !state?.items) return;
    injectStyles();
    let panel = $('#coachDisclosureReviewPanel');
    if(!panel){
      panel = document.createElement('section');
      panel.id = 'coachDisclosureReviewPanel';
      panel.className = 'coach-disclosure-review';
      h.prepend(panel);
    }
    const items = state.items || [];
    const approved = items.filter(x => x.status === 'approved').length;
    panel.innerHTML = `
      <div class="coach-disclosure-head">
        <div><span class="approved-kicker">COACHING DISCLOSURE REVIEW</span><h3>Marketplace legal/disclosure packet</h3><p>Draft launch language for scope, independent business terms, privacy, pricing, refund/cancellation, checkout review, and live acceptance items. Approving an item also updates its launch-gate review item.</p></div>
        <span class="coach-disclosure-pill ${approved===items.length?'approved':'draft'}">${approved}/${items.length} approved</span>
      </div>
      <div class="coach-disclosure-list">
        ${items.map(item => `
          <article class="coach-disclosure-card">
            <div class="coach-disclosure-row">
              <div><b>${esc(item.title)}</b><small>${esc(item.summary || '')}</small><small>Audience: ${esc(item.audience)} · Gate: ${esc(item.review_status || 'pending')}</small></div>
              <span class="coach-disclosure-pill ${esc(item.status)}">${esc(String(item.status || 'draft').replaceAll('_',' '))}</span>
            </div>
            <div class="coach-disclosure-body">${esc(item.body || 'Body hidden until approved or admin review.')}</div>
            ${item.reviewer_note ? `<small class="coach-disclosure-body">Reviewer note: ${esc(item.reviewer_note)}</small>` : ''}
            <div class="coach-disclosure-actions">
              <button data-disc-review="${esc(item.disclosure_key)}">Mark review</button>
              <button class="primary" data-disc-approve="${esc(item.disclosure_key)}">Approve</button>
              <button data-disc-revise="${esc(item.disclosure_key)}">Needs revision</button>
              <button data-disc-draft="${esc(item.disclosure_key)}">Back to draft</button>
            </div>
          </article>`).join('')}
      </div>`;
    panel.querySelectorAll('[data-disc-review]').forEach(b=>b.onclick=()=>updateDisclosure(b.dataset.discReview,'review'));
    panel.querySelectorAll('[data-disc-approve]').forEach(b=>b.onclick=()=>updateDisclosure(b.dataset.discApprove,'approved'));
    panel.querySelectorAll('[data-disc-revise]').forEach(b=>b.onclick=()=>updateDisclosure(b.dataset.discRevise,'needs_revision'));
    panel.querySelectorAll('[data-disc-draft]').forEach(b=>b.onclick=()=>updateDisclosure(b.dataset.discDraft,'draft'));
  }

  function boot(){
    const mo = new MutationObserver(()=>{ if(state) render(); else load(); });
    mo.observe(document.body, {childList:true, subtree:true});
    setInterval(load, 9000);
    load();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
