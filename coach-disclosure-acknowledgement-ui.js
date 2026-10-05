(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bridge = () => window.LelleeAuthContext?.client ? window.LelleeAuthContext : null;
  const sb = () => bridge()?.client || window.sb || null;
  let busy = false;

  function style(){
    if($('#coachDisclosureAckStyle')) return;
    const st=document.createElement('style');
    st.id='coachDisclosureAckStyle';
    st.textContent=[
      '.coach-disclosure-ack{border:1px solid #eadfcd;background:#fffdf8;border-radius:16px;padding:14px;margin:14px 0}',
      '.coach-disclosure-ack h3{margin:2px 0 5px}.coach-disclosure-ack p{margin:0;color:#665;font-size:.78rem;line-height:1.4}',
      '.coach-disclosure-ack-list{display:grid;gap:8px;margin-top:10px}',
      '.coach-disclosure-ack-card{background:#fff;border:1px solid #efe7d8;border-radius:12px;padding:10px}',
      '.coach-disclosure-ack-card b{display:block}.coach-disclosure-ack-card small{display:block;color:#665;margin-top:3px;line-height:1.35}',
      '.coach-disclosure-ack-card details{margin-top:7px}.coach-disclosure-ack-card summary{font-weight:800;cursor:pointer;color:#075b4d}',
      '.coach-disclosure-ack-body{white-space:pre-wrap;color:#433;font-size:.72rem;line-height:1.45;margin-top:6px}',
      '.coach-disclosure-ack-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}',
      '.coach-disclosure-ack-actions button{border:1px solid #e1d5be;background:#fff;border-radius:999px;padding:7px 10px;font-weight:850;font-size:.7rem}',
      '.coach-disclosure-ack-actions button.primary{background:#075b4d;color:#fff;border-color:#075b4d}',
      '.coach-disclosure-pill{display:inline-flex;border:1px solid #e3d7c1;border-radius:999px;padding:4px 8px;font-size:.62rem;font-weight:900;background:#fff8ea;color:#745017;margin-top:7px}',
      '.coach-disclosure-pill.ok{background:#eef8f1;color:#17623f;border-color:#cfe9d8}',
      '.coach-disclosure-pill.blocked{background:#fff1f3;color:#8c3548;border-color:#edd0d7}'
    ].join('');
    document.head.appendChild(st);
  }

  function clientHost(){
    return $('#myCoachRelationships')?.parentElement || $('#page-my-coaching .approved-inner') || $('#page-my-coaching .section-shell');
  }
  function coachHost(){
    return $('#page-coach-dashboard .approved-inner') || $('#coachPanelClients')?.parentElement || $('#page-coach-business .approved-inner');
  }

  async function loadFor(role, host, businessId=null, relationshipId=null){
    const client=sb();
    if(!client || !host) return;
    const {data,error}=await client.rpc('get_my_coaching_disclosure_requirements', {
      p_role_context: role,
      p_relationship_id: relationshipId,
      p_business_id: businessId
    });
    if(error) return;
    render(role, host, data, businessId, relationshipId);
  }

  async function ack(key, role, businessId, relationshipId){
    const client=sb();
    const {error}=await client.rpc('acknowledge_my_coaching_disclosure', {
      p_disclosure_key:key,
      p_role_context:role,
      p_relationship_id:relationshipId||null,
      p_business_id:businessId||null,
      p_user_agent:navigator.userAgent
    });
    if(error){ alert(error.message || 'Could not acknowledge disclosure.'); return; }
    await refresh();
  }

  function render(role, host, data, businessId, relationshipId){
    style();
    const id = role==='coach' ? 'coachDisclosureAckPanelCoach' : 'coachDisclosureAckPanelClient';
    let panel=$('#'+id);
    if(!panel){
      panel=document.createElement('section');
      panel.id=id;
      panel.className='coach-disclosure-ack';
      host.prepend(panel);
    }
    const disclosures=data?.disclosures||[];
    if(!disclosures.length){ panel.remove(); return; }
    panel.innerHTML=`
      <div><span class="approved-kicker">COACHING DISCLOSURES</span><h3>${role==='coach'?'Coach disclosure acknowledgments':'Client disclosure acknowledgments'}</h3><p>Disclosures must be reviewed and approved before ordinary users can acknowledge them. The public marketplace remains closed until launch review is cleared.</p></div>
      <span class="coach-disclosure-pill ${data.all_acknowledged?'ok':'blocked'}">${data.all_acknowledged?'All acknowledged':(data.missing_count||0)+' pending'}</span>
      <div class="coach-disclosure-ack-list">
        ${disclosures.map(d=>`
          <article class="coach-disclosure-ack-card">
            <b>${esc(d.title)}</b><small>${esc(d.summary||'')}</small>
            <span class="coach-disclosure-pill ${d.approved?'ok':'blocked'}">${d.approved?'Approved for acknowledgment':'Pending review'}</span>
            ${d.acknowledged?'<span class="coach-disclosure-pill ok">Acknowledged</span>':''}
            <details><summary>Read disclosure</summary><div class="coach-disclosure-ack-body">${esc(d.body||'')}</div></details>
            <div class="coach-disclosure-ack-actions">
              <button class="primary" ${d.approved&&!d.acknowledged?'':'disabled'} data-ack-disclosure="${esc(d.disclosure_key)}">Acknowledge</button>
            </div>
          </article>`).join('')}
      </div>`;
    panel.querySelectorAll('[data-ack-disclosure]').forEach(b=>b.onclick=()=>ack(b.dataset.ackDisclosure, role, businessId, relationshipId));
  }

  async function findCoachBusinessId(){
    const client=sb();
    try{
      const ctx = await client.rpc('get_my_coach_dashboard_context');
      return ctx?.data?.business_id || ctx?.data?.business?.id || null;
    }catch(_){ return null; }
  }

  async function refresh(){
    if(busy) return;
    const client=sb();
    if(!client) return;
    busy=true;
    try{
      const ch=clientHost();
      if(ch) await loadFor('client', ch, null, null);
      const coach=coachHost();
      if(coach){
        const bid=await findCoachBusinessId();
        await loadFor('coach', coach, bid, null);
      }
    }finally{busy=false;}
  }

  function boot(){
    const mo=new MutationObserver(refresh);
    mo.observe(document.body,{childList:true,subtree:true});
    setInterval(refresh,7000);
    refresh();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
