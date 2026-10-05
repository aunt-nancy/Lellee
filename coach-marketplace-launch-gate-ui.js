(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const sb = () => bridge()?.client || window.sb || null;
  let state = null;
  let busy = false;

  function injectStyles(){
    if($('#coachMarketplaceGateStyle')) return;
    const st=document.createElement('style');
    st.id='coachMarketplaceGateStyle';
    st.textContent = [
      '.coach-market-gate{border:1px solid #e6ddc9;background:#fffdf8;border-radius:18px;padding:16px;margin:16px 0;box-shadow:0 8px 22px rgba(92,70,30,.05)}',
      '.coach-market-gate-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}',
      '.coach-market-gate-head h3{margin:2px 0 5px}.coach-market-gate-head p{margin:0;color:#685f50;font-size:.78rem;line-height:1.4}',
      '.coach-market-gate-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 12px}',
      '.coach-market-gate-summary article{background:#fff;border:1px solid #eee4cf;border-radius:12px;padding:10px;text-align:center}',
      '.coach-market-gate-summary b{display:block;font-size:1.05rem}.coach-market-gate-summary small{display:block;color:#786f61;font-size:.64rem}',
      '.coach-market-gate-list{display:grid;gap:8px}',
      '.coach-market-gate-item{background:#fff;border:1px solid #eee4cf;border-radius:12px;padding:11px}',
      '.coach-market-gate-row{display:flex;gap:12px;justify-content:space-between;align-items:flex-start}',
      '.coach-market-gate-row b{display:block}.coach-market-gate-row small{display:block;color:#756c60;margin-top:3px;line-height:1.35}',
      '.coach-market-gate-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}',
      '.coach-market-gate-actions button{border:1px solid #e4d6bd;background:#fff;border-radius:999px;padding:6px 9px;font-weight:850;font-size:.68rem}',
      '.coach-market-gate-actions button.primary{background:#6b4b13;color:#fff;border-color:#6b4b13}',
      '.coach-market-gate-pill{display:inline-flex;align-items:center;border-radius:999px;padding:4px 8px;font-size:.62rem;font-weight:900;border:1px solid #e1d2b8;background:#fff8e7;color:#6b4b13;white-space:nowrap}',
      '.coach-market-gate-pill.approved,.coach-market-gate-pill.open{background:#eef8f1;color:#17623f;border-color:#cfe9d8}',
      '.coach-market-gate-pill.blocked,.coach-market-gate-pill.closed{background:#fff1f3;color:#8c3548;border-color:#edd0d7}',
      '.coach-market-gate-pill.pending{background:#fff8e7;color:#7f5711;border-color:#efd99e}',
      '.coach-market-gate-detail{margin-top:7px;color:#6a6256;font-size:.7rem;line-height:1.35}',
      '@media(max-width:820px){.coach-market-gate-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.coach-market-gate-row,.coach-market-gate-head{flex-direction:column}}'
    ].join('');
    document.head.appendChild(st);
  }

  function host(){
    return $('#page-admin-operations .approved-inner') || $('#page-admin .approved-inner') || $('#adminOperationsWorkspace') || $('#page-coach-dashboard .approved-inner') || $('#page-settings .approved-inner');
  }

  async function load(){
    const client=sb();
    if(!client || busy) return;
    try{
      busy=true;
      const {data,error}=await client.rpc('get_coach_marketplace_launch_readiness');
      if(error) return;
      state=data;
      render();
    }catch(_){
      // Admin-only panel; hide when unavailable.
    }finally{busy=false;}
  }

  async function updateItem(key,status){
    const detail = prompt(`Optional note for ${status.toUpperCase()}:`, '') || null;
    const client=sb();
    const {error}=await client.rpc('admin_update_coach_marketplace_launch_review_item', {p_item_key:key, p_status:status, p_detail:detail});
    if(error){ alert(error.message || 'Could not update review item.'); return; }
    await load();
  }

  async function setMarketplace(enabled){
    const label = enabled ? 'enable public marketplace' : 'close public marketplace';
    if(!confirm('Confirm: '+label+'?')) return;
    const client=sb();
    const {error}=await client.rpc('admin_set_coach_public_marketplace_enabled', {p_enabled:enabled});
    if(error){ alert(error.message || 'Marketplace gate prevented this change.'); return; }
    await load();
  }

  function render(){
    const h=host();
    if(!h || !state) return;
    injectStyles();
    let panel=$('#coachMarketplaceLaunchGatePanel');
    if(!panel){
      panel=document.createElement('section');
      panel.id='coachMarketplaceLaunchGatePanel';
      panel.className='coach-market-gate';
      h.prepend(panel);
    }
    const items=state.review_items || [];
    const open=!!state.marketplace_public_enabled;
    panel.innerHTML = `
      <div class="coach-market-gate-head">
        <div><span class="approved-kicker">COACHING MARKETPLACE GATE</span><h3>Launch readiness gate</h3><p>Public marketplace stays closed until critical QA, legal/disclosures, payment checkout review, and live desktop/mobile acceptance are approved.</p></div>
        <span class="coach-market-gate-pill ${open?'open':'closed'}">${open?'Public marketplace open':'Public marketplace closed'}</span>
      </div>
      <div class="coach-market-gate-summary">
        <article><b>${state.qa?.critical_passed ?? 0}/${state.qa?.critical_total ?? 0}</b><small>Critical QA passed</small></article>
        <article><b>${state.review_approved_total ?? 0}/${state.review_required_total ?? 0}</b><small>Reviews approved</small></article>
        <article><b>${state.payments_enabled ? 'On' : 'Off'}</b><small>Payments enabled</small></article>
        <article><b>${state.ready ? 'Yes' : 'No'}</b><small>Launch ready</small></article>
      </div>
      <div class="coach-market-gate-actions">
        <button class="primary" data-market-enable>Enable public marketplace</button>
        <button data-market-disable>Close public marketplace</button>
      </div>
      <div class="coach-market-gate-detail">Money movement remains off unless separately reviewed and enabled. This gate controls public marketplace visibility only.</div>
      <div class="coach-market-gate-list">
        ${items.map(i => `
          <article class="coach-market-gate-item">
            <div class="coach-market-gate-row">
              <div><b>${esc(i.item_label)}</b><small>${esc(i.detail || '')}</small></div>
              <span class="coach-market-gate-pill ${esc(i.status)}">${esc(String(i.status || 'pending').replaceAll('_',' '))}</span>
            </div>
            <div class="coach-market-gate-actions">
              <button data-gate-approve="${esc(i.item_key)}">Approve</button>
              <button data-gate-block="${esc(i.item_key)}">Block</button>
              <button data-gate-pending="${esc(i.item_key)}">Pending</button>
              <button data-gate-na="${esc(i.item_key)}">Not required</button>
            </div>
          </article>`).join('')}
      </div>`;
    panel.querySelector('[data-market-enable]')?.addEventListener('click',()=>setMarketplace(true));
    panel.querySelector('[data-market-disable]')?.addEventListener('click',()=>setMarketplace(false));
    panel.querySelectorAll('[data-gate-approve]').forEach(b=>b.onclick=()=>updateItem(b.dataset.gateApprove,'approved'));
    panel.querySelectorAll('[data-gate-block]').forEach(b=>b.onclick=()=>updateItem(b.dataset.gateBlock,'blocked'));
    panel.querySelectorAll('[data-gate-pending]').forEach(b=>b.onclick=()=>updateItem(b.dataset.gatePending,'pending'));
    panel.querySelectorAll('[data-gate-na]').forEach(b=>b.onclick=()=>updateItem(b.dataset.gateNa,'not_required'));
  }

  function boot(){
    const mo=new MutationObserver(()=>{ if(state) render(); else load(); });
    mo.observe(document.body,{childList:true,subtree:true});
    setInterval(load, 8000);
    load();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
