(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const sb = () => bridge()?.client || window.sb;
  const currentUser = () => bridge()?.getCurrentUser?.() || window.currentUser || null;

  let cache = null;

  function toast(msg, bad=false){
    const t = $('#globalToast');
    if(t){
      t.textContent = msg;
      t.classList.remove('hidden');
      if(bad) t.style.background = '#7f2634';
      setTimeout(() => { t.classList.add('hidden'); t.style.background=''; }, 2600);
    } else {
      alert(msg);
    }
  }

  function injectStyles(){
    if($('#coachClientSharingStyle')) return;
    const st = document.createElement('style');
    st.id = 'coachClientSharingStyle';
    st.textContent = `
      .coach-sharing-panel{border:1px solid #dfe8e3;background:#fbfcfb;border-radius:16px;padding:15px;margin:14px 0;box-shadow:0 8px 22px rgba(20,30,30,.035)}
      .coach-sharing-note{border:1px solid #eadcdc;background:#fff8f7;color:#6e3030;border-radius:12px;padding:10px 12px;margin:10px 0;font-size:.75rem;line-height:1.45}
      .coach-sharing-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}
      .coach-sharing-grid label{display:flex;gap:8px;align-items:flex-start;border:1px solid #e4ebe7;background:#fff;border-radius:11px;padding:9px;font-size:.72rem;line-height:1.35}
      .coach-sharing-form{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
      .coach-sharing-form label{display:grid;gap:4px;font-size:.68rem;font-weight:800;color:#39504d}
      .coach-sharing-form textarea,.coach-sharing-form input,.coach-sharing-form select{border:1px solid #dfe8e3;border-radius:9px;padding:8px;background:#fff}
      .coach-sharing-form .wide{grid-column:1/-1}
      .coach-shared-items{display:grid;gap:7px;margin-top:10px}
      .coach-shared-item{border:1px solid #e4ebe7;background:#fff;border-radius:11px;padding:10px;display:grid;gap:5px}
      .coach-shared-item small{color:#667;line-height:1.35}.coach-sharing-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
      @media(max-width:760px){.coach-sharing-grid,.coach-sharing-form{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  async function loadControls(){
    const client = sb();
    if(!client || !currentUser()) return null;
    const {data,error} = await client.rpc('get_my_coach_sharing_controls');
    if(error){ console.warn(error); return null; }
    cache = data || {relationships:[]};
    return cache;
  }

  function relationshipCard(r){
    const scope = r.data_sharing_scope || {};
    const disabled = !r.can_share ? 'disabled' : '';
    const items = r.shared_items || [];
    return `<article class="coach-sharing-panel" data-sharing-relationship="${esc(r.relationship_id)}">
      <div class="coach-panel-head"><div><span class="approved-kicker">CLIENT-CONTROLLED SHARING</span><h3>${esc(r.business_name || 'Coach')}</h3><p>${esc(r.program_name || '')}${r.service_name ? ' · '+esc(r.service_name) : ''}</p></div></div>
      <div class="coach-sharing-note"><b>Private by default.</b> Your journal, check-ins, support contacts, documents, and recovery history are not shared unless you choose what to share here.</div>
      ${r.can_share ? '' : '<div class="coach-sharing-note"><b>Sharing locked.</b> Accept the coaching relationship before sharing anything.</div>'}
      <div class="coach-sharing-grid">
        ${check('goals','Goals',scope.goals,disabled)}
        ${check('milestones','Milestones',scope.milestones,disabled)}
        ${check('selected_entries','Selected entries only',scope.selected_entries,disabled)}
        ${check('selected_checkins','Selected check-ins only',scope.selected_checkins,disabled)}
        ${check('support_contacts','Support contacts',scope.support_contacts,disabled)}
        ${check('documents','Documents',scope.documents,disabled)}
        ${check('practical_plan','Practical plan',scope.practical_plan,disabled)}
        ${check('safety_plan','Safety plan',scope.safety_plan,disabled)}
      </div>
      <div class="coach-sharing-actions">
        <button class="approved-small-action" data-save-sharing-scope="${esc(r.relationship_id)}" ${disabled}>Save Sharing Preferences</button>
      </div>
      <div class="coach-sharing-form">
        <label>Share type<select data-share-type ${disabled}>
          <option value="note">Note</option><option value="goal">Goal</option><option value="milestone">Milestone</option><option value="selected_entry">Selected entry</option><option value="selected_checkin">Selected check-in</option><option value="support_contact">Support contact</option><option value="document">Document</option><option value="practical_plan">Practical plan</option><option value="safety_plan">Safety plan</option><option value="other">Other</option>
        </select></label>
        <label>Title<input data-share-title maxlength="180" placeholder="What are you sharing?" ${disabled}></label>
        <label class="wide">Content<textarea data-share-content maxlength="8000" rows="3" placeholder="Only paste what you want this coach to see." ${disabled}></textarea></label>
        <label class="wide">Optional source/reference<input data-share-reference maxlength="240" placeholder="Example: goal, review, document name" ${disabled}></label>
      </div>
      <div class="coach-sharing-actions"><button class="approved-small-action" data-share-item="${esc(r.relationship_id)}" ${disabled}>Share This Item</button></div>
      <div class="coach-shared-items">
        ${items.length ? items.map(item => `<div class="coach-shared-item"><b>${esc(item.title || item.share_type)}</b><small>${esc(item.share_type)} · ${esc(item.shared_at ? new Date(item.shared_at).toLocaleString() : '')}</small>${item.shared_content ? `<small>${esc(String(item.shared_content).slice(0,260))}</small>` : ''}<div><button class="approved-link" data-revoke-shared-item="${esc(item.id)}">Revoke</button></div></div>`).join('') : '<div class="approved-resource-empty">No items shared with this coach.</div>'}
      </div>
    </article>`;
  }

  function check(key,label,val,disabled){
    return `<label><input type="checkbox" data-share-scope="${key}" ${val ? 'checked' : ''} ${disabled}> <span>${esc(label)}</span></label>`;
  }

  async function renderSharing(){
    const host = $('#myCoachRelationships');
    if(!host) return;
    const data = await loadControls();
    if(!data) return;
    let wrap = $('#coachClientSharingPanel');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'coachClientSharingPanel';
      host.insertAdjacentElement('afterend', wrap);
    }
    const rows = data.relationships || [];
    wrap.innerHTML = rows.length ? rows.map(relationshipCard).join('') : '';
  }

  async function saveScope(relId){
    const card = document.querySelector(`[data-sharing-relationship="${CSS.escape(relId)}"]`);
    if(!card) return;
    const scope = {};
    card.querySelectorAll('[data-share-scope]').forEach(x => { scope[x.dataset.shareScope] = !!x.checked; });
    const {error} = await sb().rpc('save_my_coach_data_sharing_scope',{p_relationship_id:relId,p_scope:scope});
    if(error) return toast(error.message || 'Could not save sharing preferences.', true);
    toast('Sharing preferences saved.');
    await renderSharing();
  }

  async function shareItem(relId){
    const card = document.querySelector(`[data-sharing-relationship="${CSS.escape(relId)}"]`);
    if(!card) return;
    const payload = {
      p_relationship_id: relId,
      p_share_type: card.querySelector('[data-share-type]')?.value || 'note',
      p_title: card.querySelector('[data-share-title]')?.value || null,
      p_shared_content: card.querySelector('[data-share-content]')?.value || null,
      p_source_reference: card.querySelector('[data-share-reference]')?.value || null
    };
    const {error} = await sb().rpc('share_my_coach_item', payload);
    if(error) return toast(error.message || 'Could not share item.', true);
    toast('Item shared with coach.');
    await renderSharing();
  }

  async function revokeItem(itemId){
    if(!confirm('Revoke this shared item from your coach?')) return;
    const {error} = await sb().rpc('revoke_my_coach_shared_item',{p_shared_item_id:itemId});
    if(error) return toast(error.message || 'Could not revoke item.', true);
    toast('Shared item revoked.');
    await renderSharing();
  }

  function bind(){
    document.addEventListener('click', e => {
      const save = e.target.closest('[data-save-sharing-scope]');
      if(save){ e.preventDefault(); saveScope(save.dataset.saveSharingScope); return; }
      const share = e.target.closest('[data-share-item]');
      if(share){ e.preventDefault(); shareItem(share.dataset.shareItem); return; }
      const revoke = e.target.closest('[data-revoke-shared-item]');
      if(revoke){ e.preventDefault(); revokeItem(revoke.dataset.revokeSharedItem); }
    });

    if(typeof window.showPage === 'function'){
      const oldShow = window.showPage;
      window.showPage = function(name){
        oldShow(name);
        if(name === 'my-coaching') setTimeout(renderSharing, 450);
      };
    }

    const mo = new MutationObserver(() => {
      if($('#myCoachRelationships') && $('.page.active')?.id === 'page-my-coaching') renderSharing();
    });
    mo.observe(document.body,{childList:true,subtree:true});
  }

  function boot(){ injectStyles(); bind(); setTimeout(renderSharing, 1200); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();