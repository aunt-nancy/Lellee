(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = v => v ? new Date(v).toLocaleDateString() : '—';
  const fmtDateTime = v => v ? new Date(v).toLocaleString() : '—';
  const datetimeLocal = v => {
    if(!v) return '';
    const d=new Date(v), local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,16);
  };
  const money = v => (v===null || v===undefined || v==='') ? 'Price not set' : `$${Number(v).toFixed(2)}`;
  const typeLabel = v => ({one_to_one:'1-to-1',group:'Group',hybrid:'Hybrid'}[v] || String(v||'').replaceAll('_',' '));
  const statusLabel = v => String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

  let state = {
    context:null,
    certification:null,
    user:null,
    business:null,
    selectedClient:null,
    clientWorkspace:null,
    selectedGroup:null,
    groupWorkspace:null,
    selectedService:null,
    selectedLead:null,
    selectedAssignment:null,
    selectedConversation:null,
    loading:false,
    ethicsStatus:null,ethicsHistory:[],ethicsLesson:null,ethicsWatchSession:null,ethicsHeartbeat:null
  };

  function bridge(){ return window.LelleeAuthContext?.client ? window.LelleeAuthContext : null; }
  function sb(){ return bridge()?.client; }
  function user(){ return bridge()?.getCurrentUser?.() || null; }
  function pageClick(page){ const el=document.querySelector(`[data-page="${page}"]`); if(el){ el.click(); return true; } return false; }

  function ensureDialog(){
    let d = $('#coachLiveDialog');
    if(!d){
      d=document.createElement('dialog');
      d.id='coachLiveDialog';
      d.className='coach-live-dialog';
      d.innerHTML='<div class="coach-live-dialog-inner" id="coachLiveDialogInner"></div>';
      document.body.appendChild(d);
    }
    return d;
  }

  function dialog(title, subtitle, body, footer=''){
    const d=ensureDialog(), inner=$('#coachLiveDialogInner');
    inner.innerHTML=`
      <div class="coach-live-dialog-head">
        <div><span class="approved-kicker">COACH BUSINESS</span><h3>${esc(title)}</h3><p>${esc(subtitle||'')}</p></div>
        <button class="coach-live-close" type="button" data-coach-live-close>×</button>
      </div>
      ${body}
      ${footer}`;
    d.showModal();
    return d;
  }

  function closeDialog(){ $('#coachLiveDialog')?.close(); }

  async function loadContext(){
    if(state.loading) return state.context;
    const c=bridge(), u=user();
    if(!c || !u) return null;
    state.loading=true;
    try{
      const [dashboardResult, certificationResult]=await Promise.all([
        c.client.rpc('get_my_coach_dashboard_context'),
        c.client.rpc('get_my_coach_certification_context')
      ]);
      if(dashboardResult.error) throw dashboardResult.error;
      if(certificationResult.error) throw certificationResult.error;
      state.context=dashboardResult.data || {};
      state.certification=certificationResult.data || {};
      state.user=u;
      state.business=state.context.business || null;
      return state.context;
    } finally {
      state.loading=false;
    }
  }

  async function loadBusinessPage(){
    try{
      const ctx=await loadContext();
      if(!ctx) return;

      const select=$('#coachPrimaryProgram');
      if(select){
        select.innerHTML=(ctx.programs||[]).map(p=>
          `<option value="${p.id}">${esc(p.name)}${p.status!=='active'?' · '+esc(statusLabel(p.status)):''}</option>`
        ).join('');
      }

      const b=ctx.business;
      if(b){
        $('#coachBusinessName').value=b.business_name||'';
        $('#coachPublicName').value=b.public_name||'';
        $('#coachPrimaryProgram').value=b.primary_program_id||'';
        $('#coachBusinessModel').value=b.business_model||'solo';
        $('#coachAudience').value=b.target_audience||'';
        $('#coachBio').value=b.bio||'';
        $('#coachCredentials').value=b.credentials_disclosure||'';
        $('#coachBusinessDisclosure').checked=!!b.submitted_at;
        $('#coachBusinessPrivacy').checked=!!b.submitted_at;

        const title=$('#coachBusinessStatusTitle'), text=$('#coachBusinessStatusText'), pill=$('#coachBusinessStatusPill');
        if(title) title.textContent=statusLabel(b.status);
        if(pill) pill.textContent=String(b.status||'').toUpperCase().replaceAll('_',' ');
        if(text){
          text.textContent = ({
            pending_review:'Your coaching business is waiting for human review.',
            approved:'Your coaching business is approved. You can open the Coach Dashboard.',
            rejected:'Changes are required before approval.',
            paused:'This coaching business is paused.',
            draft:'Complete the form and submit it for review.'
          })[b.status] || 'Review your coaching business information.';
        }

        if(b.review_note && $('#coachBusinessStatusCard') && !$('#coachBusinessReviewNote')){
          $('#coachBusinessStatusCard').insertAdjacentHTML('afterend',
            `<div class="coach-live-review-note" id="coachBusinessReviewNote"><b>Reviewer note:</b> ${esc(b.review_note)}</div>`);
        }

        if(!$('#coachBusinessOpenDashboard')){
          const footer=$('#submitCoachBusiness')?.parentElement;
          if(footer){
            const btn=document.createElement('button');
            btn.id='coachBusinessOpenDashboard';
            btn.type='button';
            btn.className='approved-link';
            btn.textContent='Open Coach Dashboard';
            btn.addEventListener('click',()=>pageClick('coach-dashboard'));
            footer.insertBefore(btn,$('#submitCoachBusiness'));
          }
        }
      }else{
        const title=$('#coachBusinessStatusTitle'), text=$('#coachBusinessStatusText'), pill=$('#coachBusinessStatusPill');
        if(title) title.textContent='Not Started';
        if(text) text.textContent='Create a coaching business profile to begin the human review process.';
        if(pill) pill.textContent='START';
      }
    }catch(err){
      console.error('Coach business page load failed',err);
      const msg=$('#coachBusinessMsg');
      if(msg) msg.textContent=err.message||String(err);
    }
  }

  async function submitBusiness(){
    const u=user();
    if(!u) return alert('Sign in required.');
    if(!$('#coachBusinessDisclosure')?.checked || !$('#coachBusinessPrivacy')?.checked){
      return alert('Confirm both professional-scope and privacy statements before submitting.');
    }
    const payload={
      p_business_name:$('#coachBusinessName').value.trim(),
      p_public_name:$('#coachPublicName').value.trim(),
      p_primary_program_id:$('#coachPrimaryProgram').value,
      p_business_model:$('#coachBusinessModel').value,
      p_target_audience:$('#coachAudience').value.trim() || null,
      p_bio:$('#coachBio').value.trim() || null,
      p_credentials_disclosure:$('#coachCredentials').value.trim() || null
    };
    if(!payload.p_business_name || !payload.p_public_name || !payload.p_primary_program_id){
      return alert('Business name, public name, and primary program are required.');
    }
    const btn=$('#submitCoachBusiness');
    const prior=btn?.textContent;
    if(btn){ btn.disabled=true; btn.textContent='Submitting…'; }
    try{
      const {error}=await sb().rpc('submit_my_coach_business',payload);
      if(error) throw error;
      state.context=null;
      const msg=$('#coachBusinessMsg');
      if(msg) msg.textContent='Submitted for human review.';
      await loadBusinessPage();
    }catch(err){
      alert(err.message||String(err));
    }finally{
      if(btn){ btn.disabled=false; btn.textContent=prior||'Submit Coaching Business'; }
    }
  }

  function businessRequired(){
    if(!state.context?.business){
      pageClick('coach-business');
      alert('Complete your coaching business setup first.');
      return false;
    }
    return true;
  }


  function ensureEthicsStyles(){if($('#coachEthicsStyles'))return;const s=document.createElement('style');s.id='coachEthicsStyles';s.textContent='.coach-ethics-card{border:1px solid #dfe8e3;background:#fbfcfb;border-radius:14px;padding:14px;margin:12px 0 16px}.coach-ethics-head{display:flex;justify-content:space-between;gap:12px}.coach-ethics-head h3{margin:2px 0 4px;color:#075b4d;font-family:Georgia,serif}.coach-ethics-head p{margin:0;color:#667;font-size:.72rem}.coach-ethics-status{padding:5px 8px;border-radius:999px;background:#edf7f3;color:#075b4d;font-size:.58rem;font-weight:800;height:max-content}.coach-ethics-status.due{background:#fff1df;color:#8b5a16}.coach-ethics-status.pending{background:#f0edf7;color:#65419b}.coach-ethics-meta,.coach-ethics-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.coach-ethics-meta span{font-size:.6rem;padding:5px 7px;border-radius:999px;background:#f0f3f1}.coach-ethics-actions button{border:1px solid #cfd9d4;background:white;border-radius:8px;padding:7px 10px}.coach-ethics-actions .primary{background:#075b4d;color:white}.coach-ethics-dialog{width:min(900px,92vw);max-height:90vh;border:0;border-radius:16px;padding:0}.coach-ethics-dialog::backdrop{background:rgba(18,28,25,.55)}.coach-ethics-shell{padding:22px;color:#173047}.coach-ethics-video{width:100%;max-height:430px;background:#111;border-radius:12px;margin:10px 0}.coach-ethics-progress{height:7px;background:#e7ece9;border-radius:999px;overflow:hidden;margin:8px 0}.coach-ethics-progress i{display:block;height:100%;background:#075b4d;width:0}.coach-ethics-script{white-space:pre-wrap;border:1px solid #e2e7e4;background:#fbfaf7;border-radius:10px;padding:12px;max-height:220px;overflow:auto;font-size:.72rem;line-height:1.5}.coach-ethics-question{border:1px solid #e1e6e3;border-radius:10px;padding:11px;margin:9px 0}.coach-ethics-choice{display:block;margin:5px 0;font-size:.72rem}.coach-ethics-history-row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #e7ebe9;padding:8px 0;font-size:.7rem}';document.head.appendChild(s)}
  function ensureEthicsCard(){ensureEthicsStyles();let x=$('#coachEthicsCard');if(x)return x;const r=$('#coachReadinessGrid');if(!r)return null;x=document.createElement('section');x.id='coachEthicsCard';x.className='coach-ethics-card';(r.parentElement||r).insertAdjacentElement('afterend',x);return x}
  async function loadEthicsDashboard(){const [a,h]=await Promise.all([sb().rpc('get_my_coach_ethics_status'),sb().rpc('get_my_coach_ethics_history')]);if(a.error){console.warn(a.error);return}state.ethicsStatus=a.data||{};state.ethicsHistory=h.error?[]:(h.data||[]);renderEthicsCard()}
  function renderEthicsCard(){const x=ensureEthicsCard();if(!x)return;const s=state.ethicsStatus||{},n=s.next_microlearning||null,d=s.status==='due',p=s.status==='pending_content_review',cur=s.status==='current';const label=({current:'CURRENT',due:'DUE',pending_content_review:'PENDING CONTENT APPROVAL',not_required:'NOT REQUIRED'})[s.status]||statusLabel(s.status||'');x.innerHTML='<div class="coach-ethics-head"><div><span class="approved-kicker">ONGOING ETHICS</span><h3>Monthly Ethics Microlearning</h3><p>'+(p?'Curriculum is awaiting required human review and video approval before release.':cur?'Current through '+esc(fmtDateTime(s.next_due_at))+'.':d&&n?'Your next 15-minute ethics lesson is ready. Complete the video and score at least 90%.':'Ongoing ethics status appears here.')+'</p></div><span class="coach-ethics-status '+(d?'due':p?'pending':'')+'">'+esc(label)+'</span></div><div class="coach-ethics-meta"><span>15-minute video</span><span>10 questions</span><span>90% minimum</span><span>Failed quiz = full rewatch</span>'+(s.last_score!=null?'<span>Last score '+esc(s.last_score)+'%</span>':'')+'</div><div class="coach-ethics-actions">'+(d&&n?'<button class="primary" data-coach-ethics-open="'+esc(n.id)+'">Start ethics lesson</button>':'')+'<button data-coach-ethics-history>Completion history</button></div>'}
  function ensureEthicsDialog(){let d=$('#coachEthicsDialog');if(d)return d;d=document.createElement('dialog');d.id='coachEthicsDialog';d.className='coach-ethics-dialog';d.innerHTML='<div class="coach-ethics-shell" id="coachEthicsDialogBody"></div>';document.body.appendChild(d);return d}
  function stopEthicsHeartbeat(){if(state.ethicsHeartbeat){clearInterval(state.ethicsHeartbeat);state.ethicsHeartbeat=null}}
  async function pulseEthics(){if(!state.ethicsWatchSession)return;const r=await sb().rpc('heartbeat_my_coach_ethics_video',{p_watch_session_id:state.ethicsWatchSession});if(r.error)return;const b=$('#coachEthicsWatchProgress i'),l=$('#coachEthicsWatchLabel');if(b&&r.data?.required_seconds)b.style.width=Math.min(100,Number(r.data.watched_seconds||0)/Number(r.data.required_seconds)*100)+'%';if(l)l.textContent=Math.floor(Number(r.data?.watched_seconds||0)/60)+' / '+Math.ceil(Number(r.data?.required_seconds||0)/60)+' min watched'}
  async function beginEthicsWatch(id){if(state.ethicsWatchSession)return;const r=await sb().rpc('start_my_coach_ethics_video',{p_microlearning_id:id});if(r.error)throw r.error;state.ethicsWatchSession=r.data.watch_session_id;stopEthicsHeartbeat();state.ethicsHeartbeat=setInterval(()=>{const v=$('#coachEthicsVideo');if(v&&!v.paused&&!v.ended)pulseEthics()},15000)}
  async function finishEthicsWatch(id){await pulseEthics();const r=await sb().rpc('finish_my_coach_ethics_video',{p_watch_session_id:state.ethicsWatchSession});if(r.error)throw r.error;stopEthicsHeartbeat();state.ethicsWatchSession=null;await openEthicsLesson(id,true)}
  async function openEthicsLesson(id,after=false){const r=await sb().rpc('get_my_coach_ethics_lesson',{p_microlearning_id:id});if(r.error)return alert(r.error.message||String(r.error));state.ethicsLesson=r.data||{};state.ethicsWatchSession=null;stopEthicsHeartbeat();const l=state.ethicsLesson,d=ensureEthicsDialog(),b=$('#coachEthicsDialogBody'),qs=l.questions||[];const quiz=qs.length?'<form id="coachEthicsQuizForm" data-ethics-id="'+esc(id)+'"><h4>Ethics quiz · 90% required</h4>'+qs.map(q=>'<div class="coach-ethics-question"><b>'+q.sequence+'. '+esc(q.question)+'</b>'+(q.choices||[]).map(ch=>'<label class="coach-ethics-choice"><input type="radio" name="ethics_'+q.id+'" value="'+esc(ch)+'" required> '+esc(ch)+'</label>').join('')+'</div>').join('')+'<div class="coach-live-footer"><button type="button" data-coach-ethics-close>Close</button><button class="primary" type="submit">Submit Quiz</button></div></form>':'<div class="coach-live-review-note">'+(l.rewatch_required?'Rewatch required. Complete the full video again before the quiz unlocks.':'Complete the full video to unlock the quiz.')+'</div><div class="coach-live-footer"><button data-coach-ethics-close>Close</button></div>';b.innerHTML='<div class="coach-live-dialog-head"><div><span class="approved-kicker">MONTHLY ETHICS · MODULE '+esc(l.sequence)+'</span><h3>'+esc(l.title)+'</h3><p>'+esc(l.description||'')+'</p></div><button class="coach-live-close" data-coach-ethics-close>×</button></div><video id="coachEthicsVideo" class="coach-ethics-video" controls preload="metadata" src="'+esc(l.video_url||'')+'"></video><div class="coach-ethics-progress" id="coachEthicsWatchProgress"><i></i></div><small id="coachEthicsWatchLabel">Full video completion is required before the quiz unlocks.</small><details><summary>Lesson transcript / accessibility text</summary><div class="coach-ethics-script">'+esc(l.video_script_md||'')+'</div></details>'+quiz;const v=$('#coachEthicsVideo');if(v&&!l.video_watched){v.addEventListener('play',()=>beginEthicsWatch(id).catch(e=>{v.pause();alert(e.message||String(e))}),{once:true});v.addEventListener('ended',()=>finishEthicsWatch(id).catch(e=>alert(e.message||String(e))),{once:true})}d.showModal();if(after)$('#coachEthicsQuizForm')?.scrollIntoView({behavior:'smooth'})}
  async function submitEthicsQuiz(f){const id=f.dataset.ethicsId,a={};(state.ethicsLesson?.questions||[]).forEach(q=>{const v=f.querySelector('input[name="ethics_'+q.id+'"]:checked');if(v)a[q.id]=v.value});if(Object.keys(a).length!==(state.ethicsLesson?.questions||[]).length)throw new Error('Answer all 10 questions.');const r=await sb().rpc('submit_my_coach_ethics_quiz',{p_microlearning_id:id,p_answers:a});if(r.error)throw r.error;if(r.data.passed){alert('Passed: '+r.data.score+'%. Next due '+fmtDateTime(r.data.next_due_at)+'.');ensureEthicsDialog().close();await loadEthicsDashboard()}else{alert('Score: '+r.data.score+'%. Minimum 90%. Rewatch the full video before retaking.');await openEthicsLesson(id)}}
  function openEthicsHistory(){const d=ensureEthicsDialog(),b=$('#coachEthicsDialogBody'),r=state.ethicsHistory||[];b.innerHTML='<div class="coach-live-dialog-head"><div><span class="approved-kicker">ONGOING ETHICS</span><h3>Completion History</h3></div><button class="coach-live-close" data-coach-ethics-close>×</button></div>'+(r.length?r.map(x=>'<div class="coach-ethics-history-row"><div><b>'+esc(x.title)+'</b><small style="display:block">Completed '+esc(fmtDateTime(x.completed_at))+'</small></div><div><b>'+esc(x.score)+'%</b><small style="display:block">Next due '+esc(fmtDateTime(x.next_due_at))+'</small></div></div>').join(''):'<div class="coach-live-empty">No completed ethics lessons yet.</div>')+'<div class="coach-live-footer"><button data-coach-ethics-close>Close</button></div>';d.showModal()}

  async function loadDashboard(){
    try{
      state.context=null;
      const ctx=await loadContext();
      if(!ctx) return;
      if(!ctx.has_business){
        pageClick('coach-business');
        return;
      }
      const b=ctx.business;
      $('#coachDashboardBusinessName').textContent=b.business_name || 'My Coaching Business';
      $('#coachMetricClients').textContent=ctx.metrics?.clients ?? 0;
      $('#coachMetricGroups').textContent=ctx.metrics?.groups ?? 0;
      $('#coachMetricCapacity').textContent=ctx.metrics?.open_seats ?? 0;
      $('#coachMetricMessages').textContent=ctx.metrics?.unread_messages ?? 0;
      renderReadiness();
      await loadEthicsDashboard();

      renderClients();
      renderGroups();
      renderServices();
      renderMessages();
      renderAssignments();
      renderLeads();

      const head=$('#page-coach-dashboard .approved-inner-head');
      if(head && !$('#coachDashboardRefresh')){
        const btn=document.createElement('button');
        btn.id='coachDashboardRefresh';
        btn.className='approved-link';
        btn.textContent='Refresh';
        btn.addEventListener('click',loadDashboard);
        head.appendChild(btn);
      }
      ensureMessageAction();
    }catch(err){
      console.error('Coach dashboard load failed',err);
      const host=$('#coachClientList');
      if(host) host.innerHTML=`<div class="coach-live-error">${esc(err.message||err)}</div>`;
    }
  }

  function renderReadiness(){
    const host=$('#coachReadinessGrid'); if(!host) return;
    const readiness=state.certification?.readiness || {};
    const items=[
      ['Business approved',readiness.business_approved],
      ['Credential submitted',readiness.credential_submitted],
      ['Training recorded',readiness.training_recorded],
      ['Certificate issued',readiness.certificate_issued]
    ];
    host.innerHTML=items.map(([label,complete])=>`
      <span class="coach-readiness-step ${complete?'complete':''}"><b>${complete?'✓':'○'}</b>${esc(label)}</span>
    `).join('');
  }

  function renderClients(){
    const host=$('#coachClientList'); if(!host) return;
    const rows=state.context?.clients||[];
    host.innerHTML=rows.length ? rows.map(r=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(r.client_name||'Client')}</b><small>${esc(r.client_email||'')} ${r.program_name?'· '+esc(r.program_name):''}</small></div>
          <span class="coach-live-pill">${esc(statusLabel(r.status))}</span>
        </div>
        <div class="coach-live-meta"><span class="coach-live-pill">Started ${esc(fmtDate(r.started_at))}</span>${r.service_name?`<span class="coach-live-pill">${esc(r.service_name)}</span>`:''}</div>
        <div class="coach-live-actions"><button class="primary" data-coach-open-client="${r.id}">Open Client</button><button data-coach-message-rel="${r.id}">Message</button></div>
      </article>`).join('') :
      `<div class="coach-live-empty">No active coaching relationships yet. Invite a client after your business is approved.</div>`;
  }

  function renderGroups(){
    const host=$('#coachGroupList'); if(!host) return;
    const rows=state.context?.groups||[];
    host.innerHTML=rows.length ? rows.map(g=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(g.name)}</b><small>${esc(g.program_name||'')} ${g.start_date?'· starts '+esc(fmtDate(g.start_date)):''}</small></div>
          <span class="coach-live-pill">${esc(statusLabel(g.status))}</span>
        </div>
        <div class="coach-live-meta">
          <span class="coach-live-pill">${g.members||0}/${g.capacity} members</span>
          <span class="coach-live-pill">${esc(money(g.group_price))}</span>
        </div>
        <div class="coach-live-actions"><button class="primary" data-coach-open-group="${g.id}">Open Group</button><button data-coach-message-group="${g.id}">Message group</button></div>
      </article>`).join('') :
      `<div class="coach-live-empty">No groups yet. Create a group or hybrid coaching program when you are ready.</div>`;
  }

  function renderServices(){
    const host=$('#coachServiceList'); if(!host) return;
    const rows=state.context?.services||[];
    host.innerHTML=rows.length ? rows.map(s=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(s.name)}</b><small>${esc(s.description||'')} ${s.program_name?'· '+esc(s.program_name):''}</small></div>
          <span class="coach-live-pill">${s.active?'ACTIVE':'INACTIVE'}</span>
        </div>
        <div class="coach-live-meta">
          <span class="coach-live-pill">${esc(typeLabel(s.service_type))}</span>
          <span class="coach-live-pill">${esc(money(s.price_amount))}</span>
          <span class="coach-live-pill">${esc(statusLabel(s.billing_model))}</span>
        </div>
        <div class="coach-live-actions"><button class="primary" data-coach-open-service="${s.id}">Open Service</button></div>
      </article>`).join('') :
      `<div class="coach-live-empty">No services yet. Define a 1-to-1, group, hybrid, package, or free coaching offer.</div>`;
  }

  function messageTargetLabel(m){
    if(m.relationship_id){
      const c=(state.context?.clients||[]).find(x=>x.id===m.relationship_id);
      return c ? c.client_name : 'Client';
    }
    if(m.group_id){
      const g=(state.context?.groups||[]).find(x=>x.id===m.group_id);
      return g ? g.name : 'Group';
    }
    return 'Coaching';
  }

  function conversationThreads(){
    const threads=new Map();
    (state.context?.clients||[]).forEach(function(client){
      if(client.status==='ended')return;
      threads.set('rel:'+client.id,{
        kind:'rel',id:client.id,label:client.client_name||'Client',
        sublabel:[client.client_email,client.program_name,statusLabel(client.status)].filter(Boolean).join(' · '),
        replyEnabled:client.status==='active',latest:null,preview:'No messages yet',unread:0
      });
    });
    (state.context?.groups||[]).forEach(function(group){
      if(!['forming','active','paused'].includes(group.status))return;
      threads.set('group:'+group.id,{
        kind:'group',id:group.id,label:group.name||'Group',
        sublabel:[group.program_name,statusLabel(group.status)].filter(Boolean).join(' · '),
        replyEnabled:['forming','active'].includes(group.status),latest:null,preview:'No messages yet',unread:0
      });
    });
    (state.context?.messages||[]).forEach(function(m){
      const kind=m.relationship_id?'rel':'group';
      const id=m.relationship_id||m.group_id;
      if(!id)return;
      const key=kind+':'+id;
      if(!threads.has(key)){
        threads.set(key,{kind:kind,id:id,label:messageTargetLabel(m),sublabel:kind==='rel'?'Client conversation':'Group conversation',replyEnabled:false,latest:null,preview:'',unread:0});
      }
      const t=threads.get(key),when=new Date(m.created_at).getTime();
      if(!t.latest||when>new Date(t.latest.created_at).getTime()){t.latest=m;t.preview=m.body||'';}
      if(!m.read_at&&m.sender_user_id!==state.user?.id)t.unread+=1;
    });
    return Array.from(threads.values()).sort(function(a,b){
      const at=a.latest?new Date(a.latest.created_at).getTime():0;
      const bt=b.latest?new Date(b.latest.created_at).getTime():0;
      if(bt!==at)return bt-at;
      return String(a.label).localeCompare(String(b.label));
    });
  }

  function renderMessages(){
    const host=$('#coachMessageList');if(!host)return;
    const rows=conversationThreads();
    host.innerHTML=rows.length?rows.map(function(t){
      return '<article class="coach-live-item coach-conversation-card">'+
        '<div class="coach-live-row"><div><b>'+esc(t.label)+'</b><small>'+esc(t.sublabel||'')+'</small></div>'+
        (t.unread?'<span class="coach-live-pill">'+esc(t.unread)+' NEW</span>':'')+'</div>'+
        '<div class="coach-conversation-preview">'+esc(t.preview||'No messages yet')+'</div>'+
        '<div class="coach-live-meta">'+(t.latest?'<span class="coach-live-pill">'+esc(fmtDateTime(t.latest.created_at))+'</span>':'')+'</div>'+
        '<div class="coach-live-actions"><button class="primary" data-coach-conversation-kind="'+esc(t.kind)+'" data-coach-conversation-id="'+esc(t.id)+'">Open Conversation</button></div>'+
      '</article>';
    }).join(''):'<div class="coach-live-empty">No client or group conversations are available yet.</div>';
  }

  function renderAssignments(){
    const host=$('#coachAssignmentList');if(!host)return;
    const rows=state.context?.assignments||[];
    host.innerHTML=rows.length?rows.map(function(a){
      return '<article class="coach-live-item">'+
        '<div class="coach-live-row"><div><b>'+esc(a.title)+'</b><small>'+esc(a.instructions||'')+(a.program_name?' · '+esc(a.program_name):'')+'</small></div>'+
        '<span class="coach-live-pill">'+esc(statusLabel(a.status))+'</span></div>'+
        '<div class="coach-live-meta"><span class="coach-live-pill">Due '+esc(a.due_at?fmtDateTime(a.due_at):'not set')+'</span>'+
        '<span class="coach-live-pill">'+esc(a.recipient_count||0)+' recipient'+(Number(a.recipient_count)===1?'':'s')+'</span></div>'+
        '<div class="coach-live-actions"><button class="primary" data-coach-open-assignment="'+esc(a.id)+'">Open Assignment</button></div>'+
      '</article>';
    }).join(''):'<div class="coach-live-empty">No assignments yet.</div>';
  }

  function renderLeads(){
    const host=$('#coachLeadList'); if(!host) return;
    const rows=state.context?.leads||[];
    host.innerHTML=rows.length ? rows.map(l=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(l.name||l.email||'Lead')}</b><small>${esc([l.email,l.phone,l.source].filter(Boolean).join(' · '))}</small></div>
          <span class="coach-live-pill">${esc(statusLabel(l.status))}</span>
        </div>
        <div class="coach-live-meta">${l.interested_service_id?`<span class="coach-live-pill">${esc(((state.context?.services||[]).find(s=>s.id===l.interested_service_id)||{}).name||'Service')}</span>`:''}</div>
        ${l.notes?`<small style="margin-top:7px">${esc(l.notes)}</small>`:''}
        <div class="coach-live-actions"><button class="primary" data-coach-open-lead="${l.id}">Open Lead</button></div>
      </article>`).join('') :
      `<div class="coach-live-empty">No leads yet.</div>`;
  }

  function ensureMessageAction(){
    const panel=$('#coachPanelMessages .coach-panel-head');
    if(panel && !$('#coachNewMessage')){
      const b=document.createElement('button');
      b.id='coachNewMessage';
      b.className='approved-small-action';
      b.textContent='+ New Message';
      panel.appendChild(b);
    }
  }

  function programOptions(selected=''){
    return (state.context?.programs||[]).map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('');
  }

  function serviceOptions(){
    return `<option value="">No service package</option>`+(state.context?.services||[]).filter(s=>s.active).map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }

  function openInvite(){
    const b=state.context?.business;
    if(!b) return;
    if(b.status!=='approved') return alert('Human approval is required before inviting clients.');
    dialog('Invite Client','The client must sign in with the exact email address you invite.',`
      <form id="coachInviteForm">
        <div class="coach-live-form">
          <label class="wide">Client email<input id="coachInviteEmail" type="email" required></label>
          <label class="wide">Program<select id="coachInviteProgram">${programOptions(b.primary_program_id)}</select></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Create invitation</button></div>
      </form>`);
  }

  async function createInvite(){
    const email=$('#coachInviteEmail').value.trim();
    const program=$('#coachInviteProgram').value;
    const {data,error}=await sb().rpc('create_coach_invite',{
      p_business_id:state.business.id,p_program_id:program,p_email:email
    });
    if(error) throw error;
    const link=`${location.origin}/app?coach_invite=${encodeURIComponent(data)}`;
    $('#coachLiveDialogInner').innerHTML=`
      <div class="coach-live-dialog-head"><div><span class="approved-kicker">INVITATION READY</span><h3>Send this private invitation link</h3><p>The link works only for the invited email address and expires according to the invitation policy.</p></div><button class="coach-live-close" data-coach-live-close>×</button></div>
      <div class="coach-invite-link" id="coachInviteLink">${esc(link)}</div>
      <div class="coach-live-footer"><button type="button" id="copyCoachInvite">Copy link</button><button class="primary" type="button" data-coach-live-close>Done</button></div>`;
  }

  function openService(){
    if(!businessRequired()) return;
    dialog('New Service','Define the offer now. Coach payment collection remains disabled.',`
      <form id="coachServiceForm">
        <div class="coach-live-form">
          <label class="wide">Service name<input id="liveServiceName" required></label>
          <label>Program<select id="liveServiceProgram">${programOptions(state.business.primary_program_id)}</select></label>
          <label>Service type<select id="liveServiceType"><option value="one_to_one">1-to-1</option><option value="group">Group</option><option value="hybrid">Hybrid</option></select></label>
          <label>Billing model<select id="liveServiceBilling"><option value="monthly">Monthly</option><option value="per_session">Per session</option><option value="package">Package</option><option value="free">Free</option></select></label>
          <label>Price<input id="liveServicePrice" type="number" min="0" step="0.01" placeholder="Optional"></label>
          <label>Sessions included<input id="liveServiceSessions" type="number" min="0" placeholder="Optional"></label>
          <label>Group capacity<input id="liveServiceCapacity" type="number" min="2" max="50" placeholder="Optional"></label>
          <label>Individual touchpoints<input id="liveServiceTouchpoints" type="number" min="0" placeholder="Optional"></label>
          <label class="wide">Description<textarea id="liveServiceDescription"></textarea></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Create service</button></div>
      </form>`);
  }

  async function createService(){
    const row={
      business_id:state.business.id,
      program_id:$('#liveServiceProgram').value,
      name:$('#liveServiceName').value.trim(),
      description:$('#liveServiceDescription').value.trim()||null,
      service_type:$('#liveServiceType').value,
      billing_model:$('#liveServiceBilling').value,
      price_amount:$('#liveServicePrice').value===''?null:Number($('#liveServicePrice').value),
      sessions_included:$('#liveServiceSessions').value===''?null:Number($('#liveServiceSessions').value),
      group_capacity:$('#liveServiceCapacity').value===''?null:Number($('#liveServiceCapacity').value),
      individual_touchpoints:$('#liveServiceTouchpoints').value===''?null:Number($('#liveServiceTouchpoints').value),
      active:true
    };
    const {error}=await sb().from('coach_service_packages').insert(row);
    if(error) throw error;
    closeDialog(); await loadDashboard();
  }

  function openGroup(){
    if(!businessRequired()) return;
    dialog('New Group','Create a forming or active coaching group. Public enrollment stays off.',`
      <form id="coachGroupForm">
        <div class="coach-live-form">
          <label class="wide">Group name<input id="liveGroupName" required></label>
          <label>Program<select id="liveGroupProgram">${programOptions(state.business.primary_program_id)}</select></label>
          <label>Service package<select id="liveGroupService">${serviceOptions()}</select></label>
          <label>Capacity<input id="liveGroupCapacity" type="number" min="2" max="50" value="8"></label>
          <label>Status<select id="liveGroupStatus"><option value="forming">Forming</option><option value="active">Active</option></select></label>
          <label>Start date<input id="liveGroupStart" type="date"></label>
          <label>End date<input id="liveGroupEnd" type="date"></label>
          <label>Group price<input id="liveGroupPrice" type="number" min="0" step="0.01" placeholder="Optional"></label>
          <label class="wide">Description<textarea id="liveGroupDescription"></textarea></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Create group</button></div>
      </form>`);
  }

  async function createGroup(){
    const row={
      business_id:state.business.id,
      program_id:$('#liveGroupProgram').value,
      service_package_id:$('#liveGroupService').value||null,
      name:$('#liveGroupName').value.trim(),
      description:$('#liveGroupDescription').value.trim()||null,
      capacity:Number($('#liveGroupCapacity').value||8),
      status:$('#liveGroupStatus').value,
      start_date:$('#liveGroupStart').value||null,
      end_date:$('#liveGroupEnd').value||null,
      group_price:$('#liveGroupPrice').value===''?null:Number($('#liveGroupPrice').value),
      public_enrollment_open:false,
      waitlist_enabled:true
    };
    const {error}=await sb().from('coach_groups').insert(row);
    if(error) throw error;
    closeDialog(); await loadDashboard();
  }

  function openLead(){
    if(!businessRequired()) return;
    dialog('Add Lead','Store business prospect/contact information only. Do not put private recovery information in lead notes.',`
      <form id="coachLeadForm">
        <div class="coach-live-form">
          <label>Name<input id="liveLeadName"></label>
          <label>Email<input id="liveLeadEmail" type="email"></label>
          <label>Phone<input id="liveLeadPhone"></label>
          <label>Source<input id="liveLeadSource" placeholder="Referral, social, website…"></label>
          <label>Interested service<select id="liveLeadService">${serviceOptions()}</select></label>
          <label>Status<select id="liveLeadStatus"><option value="new">New</option><option value="contacted">Contacted</option><option value="consultation">Consultation</option><option value="invited">Invited</option><option value="converted">Converted</option><option value="closed">Closed</option></select></label>
          <label class="wide">Notes<textarea id="liveLeadNotes" placeholder="Business/contact notes only"></textarea></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Add lead</button></div>
      </form>`);
  }

  async function createLead(){
    const row={
      business_id:state.business.id,
      name:$('#liveLeadName').value.trim()||null,
      email:$('#liveLeadEmail').value.trim()||null,
      phone:$('#liveLeadPhone').value.trim()||null,
      source:$('#liveLeadSource').value.trim()||null,
      interested_service_id:$('#liveLeadService').value||null,
      status:$('#liveLeadStatus').value,
      notes:$('#liveLeadNotes').value.trim()||null
    };
    const {error}=await sb().from('coach_leads').insert(row);
    if(error) throw error;
    closeDialog(); await loadDashboard();
  }


  function serviceForId(id){
    return (state.context?.services||[]).find(x=>x.id===id)||null;
  }

  function leadForId(id){
    return (state.context?.leads||[]).find(x=>x.id===id)||null;
  }

  function leadServiceOptions(selected=''){
    return '<option value="">No interested service</option>'+(state.context?.services||[]).map(s=>
      '<option value="'+esc(s.id)+'" '+(s.id===selected?'selected':'')+'>'+esc(s.name)+(s.active?'':' · inactive')+'</option>'
    ).join('');
  }

  function openServiceManagement(serviceId){
    const service=serviceForId(serviceId);
    if(!service) return alert('Coaching service could not be found.');
    state.selectedService=service;
    dialog('Manage Service',service.program_name||'Program',
      '<form id="coachServiceManagementForm"><div class="coach-live-form">'+
        '<label class="wide">Service name<input id="coachManageServiceName" value="'+esc(service.name)+'" required></label>'+
        '<label>Program<input value="'+esc(service.program_name||'Program')+'" disabled></label>'+
        '<label>Service type<select id="coachManageServiceType">'+
          ['one_to_one','group','hybrid'].map(x=>'<option value="'+x+'" '+(service.service_type===x?'selected':'')+'>'+esc(typeLabel(x))+'</option>').join('')+
        '</select></label>'+
        '<label>Billing model<select id="coachManageServiceBilling">'+
          ['monthly','per_session','package','free'].map(x=>'<option value="'+x+'" '+(service.billing_model===x?'selected':'')+'>'+esc(statusLabel(x))+'</option>').join('')+
        '</select></label>'+
        '<label>Price<input id="coachManageServicePrice" type="number" min="0" step="0.01" value="'+esc(service.price_amount==null?'':service.price_amount)+'"></label>'+
        '<label>Sessions included<input id="coachManageServiceSessions" type="number" min="0" value="'+esc(service.sessions_included==null?'':service.sessions_included)+'"></label>'+
        '<label>Group capacity<input id="coachManageServiceCapacity" type="number" min="2" max="50" value="'+esc(service.group_capacity==null?'':service.group_capacity)+'"></label>'+
        '<label>Individual touchpoints<input id="coachManageServiceTouchpoints" type="number" min="0" value="'+esc(service.individual_touchpoints==null?'':service.individual_touchpoints)+'"></label>'+
        '<label class="wide">Description<textarea id="coachManageServiceDescription">'+esc(service.description||'')+'</textarea></label>'+
        '<label class="wide coach-service-active"><input id="coachManageServiceActive" type="checkbox" '+(service.active?'checked':'')+'><span>Service is active and available for new client/group setup</span></label>'+
      '</div><div class="coach-live-review-note"><b>Existing clients:</b> Deactivating a service stops it from being selected for new setups. It does not erase existing client or group records.</div>'+
      '<div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Save Service</button></div></form>');
  }

  async function saveServiceManagement(){
    const s=state.selectedService;
    if(!s) throw new Error('Service is unavailable.');
    const billing=$('#coachManageServiceBilling')?.value||s.billing_model;
    const payload={
      p_service_id:s.id,
      p_name:$('#coachManageServiceName')?.value.trim(),
      p_description:$('#coachManageServiceDescription')?.value.trim()||null,
      p_service_type:$('#coachManageServiceType')?.value||s.service_type,
      p_billing_model:billing,
      p_price_amount:billing==='free'?0:($('#coachManageServicePrice')?.value===''?null:Number($('#coachManageServicePrice')?.value)),
      p_sessions_included:$('#coachManageServiceSessions')?.value===''?null:Number($('#coachManageServiceSessions')?.value),
      p_group_capacity:$('#coachManageServiceCapacity')?.value===''?null:Number($('#coachManageServiceCapacity')?.value),
      p_individual_touchpoints:$('#coachManageServiceTouchpoints')?.value===''?null:Number($('#coachManageServiceTouchpoints')?.value),
      p_active:!!$('#coachManageServiceActive')?.checked
    };
    const {error}=await sb().rpc('update_my_coach_service',payload);
    if(error) throw error;
    closeDialog();
    state.context=null;
    await loadDashboard();
  }

  async function openLeadManagement(leadId){
    const lead=leadForId(leadId);
    if(!lead) return alert('Lead could not be found.');
    state.selectedLead=lead;
    const follow=await sb().from('crm_followups')
      .select('id,title,note,due_at,status,completed_at,created_at')
      .eq('workspace_type','coach')
      .eq('business_id',state.business.id)
      .eq('lead_id',lead.id)
      .order('created_at',{ascending:false})
      .limit(30);
    if(follow.error) throw follow.error;
    const followRows=(follow.data||[]).map(x=>
      '<article class="coach-client-line"><div><b>'+esc(x.title)+'</b><small>'+esc(x.note||'')+(x.due_at?' · due '+esc(fmtDateTime(x.due_at)):'')+'</small></div><span class="coach-live-pill">'+esc(statusLabel(x.status))+'</span></article>'
    ).join('')||'<div class="coach-live-empty">No follow-ups for this lead.</div>';
    const canInvite=!!lead.email && state.business?.status==='approved' && lead.status!=='converted' && lead.status!=='closed';
    dialog('Manage Lead','Business prospect/contact record. Keep private support and recovery information out of lead notes.',
      '<form id="coachLeadManagementForm"><div class="coach-live-form">'+
        '<label>Name<input id="coachManageLeadName" value="'+esc(lead.name||'')+'"></label>'+
        '<label>Email<input id="coachManageLeadEmail" type="email" value="'+esc(lead.email||'')+'"></label>'+
        '<label>Phone<input id="coachManageLeadPhone" value="'+esc(lead.phone||'')+'"></label>'+
        '<label>Source<input id="coachManageLeadSource" value="'+esc(lead.source||'')+'"></label>'+
        '<label>Interested service<select id="coachManageLeadService">'+leadServiceOptions(lead.interested_service_id||'')+'</select></label>'+
        '<label>Status<select id="coachManageLeadStatus">'+
          ['new','contacted','consultation','invited','converted','closed'].map(x=>'<option value="'+x+'" '+(lead.status===x?'selected':'')+'>'+esc(statusLabel(x))+(x==='converted'?' · accepted client only':'')+'</option>').join('')+
        '</select></label>'+
        '<label class="wide">Notes<textarea id="coachManageLeadNotes" placeholder="Business/contact notes only">'+esc(lead.notes||'')+'</textarea></label>'+
      '</div><div class="coach-live-review-note"><b>Client conversion:</b> “Converted” is allowed only after the person accepts a coaching invitation. Creating an invitation does not create a client relationship.</div>'+
      '<div class="coach-client-actions">'+
        (canInvite?'<button type="button" data-lead-invite="'+esc(lead.id)+'">Invite as Client</button>':'')+
        '<button type="button" data-lead-followup="'+esc(lead.id)+'">Add Follow-Up</button>'+
      '</div>'+
      '<section class="coach-lead-followups"><h4>Follow-Ups</h4>'+followRows+'</section>'+
      '<div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Save Lead</button></div></form>');
  }

  async function saveLeadManagement(){
    const l=state.selectedLead;
    if(!l) throw new Error('Lead is unavailable.');
    const payload={
      p_lead_id:l.id,
      p_name:$('#coachManageLeadName')?.value.trim()||null,
      p_email:$('#coachManageLeadEmail')?.value.trim()||null,
      p_phone:$('#coachManageLeadPhone')?.value.trim()||null,
      p_source:$('#coachManageLeadSource')?.value.trim()||null,
      p_interested_service_id:$('#coachManageLeadService')?.value||null,
      p_status:$('#coachManageLeadStatus')?.value||l.status,
      p_notes:$('#coachManageLeadNotes')?.value.trim()||null
    };
    const {error}=await sb().rpc('update_my_coach_lead',payload);
    if(error) throw error;
    closeDialog();
    state.context=null;
    await loadDashboard();
  }

  async function inviteLeadAsClient(leadId){
    const lead=leadForId(leadId);
    if(!lead?.email) throw new Error('Lead email is required before creating a client invitation.');
    if(state.business?.status!=='approved') throw new Error('Human approval is required before inviting clients.');
    const service=(state.context?.services||[]).find(s=>s.id===lead.interested_service_id)||null;
    const programId=service?.program_id||state.business.primary_program_id;
    const {data,error}=await sb().rpc('create_coach_invite',{
      p_business_id:state.business.id,
      p_program_id:programId,
      p_email:lead.email
    });
    if(error) throw error;

    const update=await sb().rpc('update_my_coach_lead',{
      p_lead_id:lead.id,p_name:lead.name||null,p_email:lead.email,p_phone:lead.phone||null,
      p_source:lead.source||null,p_interested_service_id:lead.interested_service_id||null,
      p_status:'invited',p_notes:lead.notes||null
    });
    if(update.error) throw update.error;

    const link=location.origin+'/app?coach_invite='+encodeURIComponent(data);
    const inner=$('#coachLiveDialogInner');
    inner.innerHTML=
      '<div class="coach-live-dialog-head"><div><span class="approved-kicker">CLIENT INVITATION</span><h3>Invitation ready for '+esc(lead.name||lead.email)+'</h3><p>The person must sign in with '+esc(lead.email)+' and accept before a coaching relationship exists.</p></div><button class="coach-live-close" data-coach-live-close>×</button></div>'+
      '<div class="coach-invite-link" id="coachInviteLink">'+esc(link)+'</div>'+
      '<div class="coach-live-footer"><button type="button" id="copyCoachInvite">Copy link</button><button class="primary" type="button" data-coach-live-close>Done</button></div>';
    state.context=null;
  }

  function openLeadFollowup(leadId){
    const lead=leadForId(leadId);
    if(!lead) return;
    state.selectedLead=lead;
    dialog('Lead Follow-Up',lead.name||lead.email||'Lead',
      '<form id="coachLeadFollowupForm"><div class="coach-live-form">'+
        '<label class="wide">Follow-up title<input id="coachLeadFollowupTitle" required></label>'+
        '<label class="wide">Due date/time<input id="coachLeadFollowupDue" type="datetime-local"></label>'+
        '<label class="wide">Note<textarea id="coachLeadFollowupNote" placeholder="Business/contact follow-up note."></textarea></label>'+
      '</div><div class="coach-live-footer"><button type="button" data-coach-open-lead="'+esc(lead.id)+'">Back</button><button class="primary" type="submit">Add Follow-Up</button></div></form>');
  }

  async function createLeadFollowup(){
    const lead=state.selectedLead;
    if(!lead) throw new Error('Lead is unavailable.');
    const title=$('#coachLeadFollowupTitle')?.value.trim();
    if(!title) throw new Error('Follow-up title is required.');
    const row={
      owner_user_id:state.user.id,
      workspace_type:'coach',
      business_id:state.business.id,
      organization_id:null,
      related_user_id:null,
      consultation_request_id:null,
      lead_id:lead.id,
      title,
      note:$('#coachLeadFollowupNote')?.value.trim()||null,
      due_at:$('#coachLeadFollowupDue')?.value?new Date($('#coachLeadFollowupDue').value).toISOString():null,
      status:'open'
    };
    const {error}=await sb().from('crm_followups').insert(row);
    if(error) throw error;
    await openLeadManagement(lead.id);
  }

  function assignmentTargets(){
    const clients=(state.context?.clients||[]).filter(x=>x.status==='active');
    const groups=(state.context?.groups||[]).filter(x=>['forming','active'].includes(x.status));
    return [
      ...clients.map(c=>`<option value="rel:${c.id}" data-program="${c.program_id}">Client · ${esc(c.client_name)}</option>`),
      ...groups.map(g=>`<option value="group:${g.id}" data-program="${g.program_id}">Group · ${esc(g.name)}</option>`)
    ].join('');
  }

  function openAssignment(kind='',targetId=''){
    if(!businessRequired()) return;
    if(!(state.context?.clients||[]).length && !(state.context?.groups||[]).length) return alert('Add a client relationship or group first.');
    dialog('New Assignment','Send a structured next step to one client or one group.',`
      <form id="coachAssignmentForm">
        <div class="coach-live-form">
          <label class="wide">Target<select id="liveAssignmentTarget">${assignmentTargets()}</select></label>
          <label class="wide">Title<input id="liveAssignmentTitle" required></label>
          <label class="wide">Instructions<textarea id="liveAssignmentInstructions"></textarea></label>
          <label>Due date/time<input id="liveAssignmentDue" type="datetime-local"></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Create assignment</button></div>
      </form>`);
    if(kind&&targetId){
      const target=$('#liveAssignmentTarget');
      if(target) target.value=kind+':'+targetId;
    }
  }

  async function createAssignment(){
    const target=$('#liveAssignmentTarget').value;
    const parts=target.split(':'),kind=parts[0],targetId=parts[1];
    const opt=$('#liveAssignmentTarget').selectedOptions[0];
    const programId=opt.dataset.program;
    const out=await sb().rpc('create_my_coach_assignment',{
      p_program_id:programId,
      p_title:$('#liveAssignmentTitle').value.trim(),
      p_instructions:$('#liveAssignmentInstructions').value.trim()||null,
      p_due_at:$('#liveAssignmentDue').value?new Date($('#liveAssignmentDue').value).toISOString():null,
      p_relationship_id:kind==='rel'?targetId:null,
      p_group_id:kind==='group'?targetId:null
    });
    if(out.error)throw out.error;
    closeDialog();
    state.context=null;
    await loadDashboard();
  }

  function assignmentForId(id){
    return (state.context?.assignments||[]).find(function(x){return x.id===id})||null;
  }

  async function openAssignmentManagement(assignmentId){
    const assignment=assignmentForId(assignmentId);
    if(!assignment)return alert('Assignment could not be found.');
    state.selectedAssignment=assignment;
    const recipients=await sb().from('coach_assignment_recipients')
      .select('id,relationship_id,group_id,origin_group_id,completed_at')
      .eq('assignment_id',assignment.id)
      .order('id',{ascending:true});
    if(recipients.error)throw recipients.error;
    const rows=recipients.data||[],completed=rows.filter(function(x){return !!x.completed_at}).length;
    const recipientHtml=rows.map(function(r){
      const client=(state.context?.clients||[]).find(function(x){return x.id===r.relationship_id})||null;
      const origin=(state.context?.groups||[]).find(function(x){return x.id===r.origin_group_id})||null;
      const legacyGroup=(state.context?.groups||[]).find(function(x){return x.id===r.group_id})||null;
      const label=client?.client_name||legacyGroup?.name||'Recipient';
      const detail=[client?.client_email,origin?'via '+origin.name:null,r.completed_at?'Completed '+fmtDateTime(r.completed_at):'Not completed'].filter(Boolean).join(' · ');
      return '<article class="coach-assignment-recipient '+(r.completed_at?'complete':'')+'"><div><b>'+esc(label)+'</b><small>'+esc(detail)+'</small></div>'+
        (client&&client.status==='active'?'<button type="button" data-coach-conversation-kind="rel" data-coach-conversation-id="'+esc(client.id)+'">Conversation</button>':'')+
        '</article>';
    }).join('')||'<div class="coach-live-empty">No assignment recipients were found.</div>';
    dialog('Manage Assignment',assignment.program_name||'Program',
      '<form id="coachAssignmentManagementForm"><div class="coach-live-form">'+
        '<label class="wide">Title<input id="coachManageAssignmentTitle" value="'+esc(assignment.title)+'" required></label>'+
        '<label class="wide">Instructions<textarea id="coachManageAssignmentInstructions">'+esc(assignment.instructions||'')+'</textarea></label>'+
        '<label>Due date/time<input id="coachManageAssignmentDue" type="datetime-local" value="'+esc(datetimeLocal(assignment.due_at))+'"></label>'+
        '<label>Status<select id="coachManageAssignmentStatus">'+
          ['draft','active','closed'].map(function(x){return '<option value="'+x+'" '+(assignment.status===x?'selected':'')+'>'+esc(statusLabel(x))+'</option>'}).join('')+
        '</select></label>'+
      '</div>'+
      '<div class="coach-assignment-summary"><b>'+esc(completed)+' of '+esc(rows.length)+' completed</b><span>'+esc(rows.length-completed)+' outstanding</span></div>'+
      '<section class="coach-assignment-recipients"><h4>Recipients & Completion</h4>'+recipientHtml+'</section>'+
      '<div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Save Assignment</button></div></form>');
  }

  async function saveAssignmentManagement(){
    const a=state.selectedAssignment;
    if(!a)throw new Error('Assignment is unavailable.');
    const due=$('#coachManageAssignmentDue')?.value;
    const out=await sb().rpc('update_my_coach_assignment',{
      p_assignment_id:a.id,
      p_title:$('#coachManageAssignmentTitle')?.value.trim(),
      p_instructions:$('#coachManageAssignmentInstructions')?.value.trim()||null,
      p_due_at:due?new Date(due).toISOString():null,
      p_status:$('#coachManageAssignmentStatus')?.value||a.status
    });
    if(out.error)throw out.error;
    closeDialog();
    state.context=null;
    await loadDashboard();
  }

  function conversationTarget(kind,id){
    if(kind==='rel'){
      const client=(state.context?.clients||[]).find(function(x){return x.id===id});
      return client?{kind:kind,id:id,label:client.client_name||'Client',replyEnabled:client.status==='active'}:null;
    }
    const group=(state.context?.groups||[]).find(function(x){return x.id===id});
    return group?{kind:kind,id:id,label:group.name||'Group',replyEnabled:['forming','active'].includes(group.status)}:null;
  }

  function conversationSenderLabel(message){
    if(message.sender_user_id===state.user?.id)return 'You';
    const client=(state.context?.clients||[]).find(function(x){return x.client_user_id===message.sender_user_id});
    return client?.client_name||'Participant';
  }

  async function openConversation(kind,id){
    const target=conversationTarget(kind,id);
    if(!target)return alert('Conversation target could not be found.');
    state.selectedConversation=target;
    let query=sb().from('coach_messages')
      .select('id,relationship_id,group_id,sender_user_id,body,created_at,read_at')
      .eq('business_id',state.business.id)
      .order('created_at',{ascending:true})
      .limit(250);
    query=kind==='rel'?query.eq('relationship_id',id):query.eq('group_id',id);
    const result=await query;
    if(result.error)throw result.error;

    let mark=sb().from('coach_messages')
      .update({read_at:new Date().toISOString()})
      .eq('business_id',state.business.id)
      .neq('sender_user_id',state.user.id)
      .is('read_at',null);
    mark=kind==='rel'?mark.eq('relationship_id',id):mark.eq('group_id',id);
    const marked=await mark;
    if(marked.error)console.warn('Could not mark conversation read',marked.error);

    (state.context?.messages||[]).forEach(function(m){
      const matches=kind==='rel'?m.relationship_id===id:m.group_id===id;
      if(matches&&m.sender_user_id!==state.user?.id&&!m.read_at)m.read_at=new Date().toISOString();
    });
    const unread=(state.context?.messages||[]).filter(function(m){return !m.read_at&&m.sender_user_id!==state.user?.id}).length;
    if($('#coachMetricMessages'))$('#coachMetricMessages').textContent=unread;
    renderMessages();

    const messages=result.data||[];
    const history=messages.map(function(m){
      const mine=m.sender_user_id===state.user?.id;
      return '<div class="coach-conversation-message '+(mine?'mine':'theirs')+'"><div><b>'+esc(conversationSenderLabel(m))+'</b><small>'+esc(fmtDateTime(m.created_at))+'</small></div><p>'+esc(m.body)+'</p></div>';
    }).join('')||'<div class="coach-live-empty">No messages yet. Start this conversation below.</div>';

    dialog(target.label,kind==='rel'?'Client conversation':'Group conversation',
      '<div class="coach-conversation-thread" id="coachConversationThread">'+history+'</div>'+
      (target.replyEnabled?
        '<form id="coachConversationForm"><div class="coach-live-form"><label class="wide">Reply<textarea id="coachConversationReply" maxlength="4000" required></textarea></label></div><div class="coach-live-footer"><button type="button" data-coach-live-close>Close</button><button class="primary" type="submit">Send Reply</button></div></form>':
        '<div class="coach-live-review-note">This conversation is read-only because the coaching relationship or group is not currently active.</div><div class="coach-live-footer"><button type="button" data-coach-live-close>Close</button></div>'
      ));
    requestAnimationFrame(function(){
      const thread=$('#coachConversationThread');
      if(thread)thread.scrollTop=thread.scrollHeight;
    });
  }

  async function sendConversationReply(){
    const target=state.selectedConversation;
    if(!target||!target.replyEnabled)throw new Error('This conversation is not available for replies.');
    const body=$('#coachConversationReply')?.value.trim();
    if(!body)throw new Error('Enter a message.');
    const row={
      business_id:state.business.id,
      relationship_id:target.kind==='rel'?target.id:null,
      group_id:target.kind==='group'?target.id:null,
      sender_user_id:state.user.id,
      body:body
    };
    const out=await sb().from('coach_messages').insert(row);
    if(out.error)throw out.error;
    state.context=null;
    await loadDashboard();
    await openConversation(target.kind,target.id);
  }

  function messageTargets(selectedKind='',selectedId=''){
    const clients=(state.context?.clients||[]).filter(x=>x.status==='active');
    const groups=(state.context?.groups||[]).filter(x=>['forming','active'].includes(x.status));
    return [
      ...clients.map(c=>`<option value="rel:${c.id}" ${selectedKind==='rel'&&selectedId===c.id?'selected':''}>Client · ${esc(c.client_name)}</option>`),
      ...groups.map(g=>`<option value="group:${g.id}" ${selectedKind==='group'&&selectedId===g.id?'selected':''}>Group · ${esc(g.name)}</option>`)
    ].join('');
  }

  function openMessage(kind='',id=''){
    if(!businessRequired()) return;
    const options=messageTargets(kind,id);
    if(!options) return alert('No active coaching relationship or group is available for messaging.');
    dialog('New Message','Messages stay inside the coaching relationship/group. Do not use this for emergencies.',`
      <form id="coachMessageForm">
        <div class="coach-live-form">
          <label class="wide">Recipient<select id="liveMessageTarget">${options}</select></label>
          <label class="wide">Message<textarea id="liveMessageBody" maxlength="4000" required></textarea></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Send message</button></div>
      </form>`);
  }

  async function sendMessage(){
    const [kind,id]=$('#liveMessageTarget').value.split(':');
    const row={
      business_id:state.business.id,
      relationship_id:kind==='rel'?id:null,
      group_id:kind==='group'?id:null,
      sender_user_id:state.user.id,
      body:$('#liveMessageBody').value.trim()
    };
    const {error}=await sb().from('coach_messages').insert(row);
    if(error) throw error;
    closeDialog(); await loadDashboard();
  }

  async function markMessagesRead(){
    if(!state.business?.id) return;
    const {error}=await sb().rpc('mark_my_coach_messages_read',{p_business_id:state.business.id});
    if(error) console.warn('Could not update message read state',error);
    await loadDashboard();
  }

  async function handleInviteToken(){
    const token=new URLSearchParams(location.search).get('coach_invite');
    if(!token || !user()) return false;
    try{
      const {error}=await sb().rpc('accept_coach_invite',{p_token:token});
      if(error) throw error;
      const url=new URL(location.href);
      url.searchParams.delete('coach_invite');
      history.replaceState({},'',url.pathname+url.search+url.hash);
      pageClick('my-coaching');
      alert('Coaching invitation accepted. You control what Lellee information you share with your coach.');
      return true;
    }catch(err){
      alert(`Could not accept coaching invitation: ${err.message||err}`);
      return true;
    }
  }



  function groupForId(id){
    return (state.context?.groups||[]).find(x=>x.id===id)||null;
  }

  function groupServiceOptions(group){
    const rows=(state.context?.services||[]).filter(s=>s.active&&s.program_id===group.program_id);
    return '<option value="">No service package</option>'+rows.map(s=>
      '<option value="'+esc(s.id)+'" '+(s.id===group.service_package_id?'selected':'')+'>'+esc(s.name)+' · '+esc(money(s.price_amount))+'</option>'
    ).join('');
  }

  async function loadGroupWorkspaceData(group){
    const [members,sessions]=await Promise.all([
      sb().from('coach_group_members').select('relationship_id,status,joined_at').eq('group_id',group.id),
      sb().from('coach_schedule_events').select('id,title,scheduled_start,duration_minutes,session_scope,status,operational_note,meeting_location,meeting_url,created_at').eq('group_id',group.id).order('scheduled_start',{ascending:false}).limit(50)
    ]);
    if(members.error) throw members.error;
    if(sessions.error) throw sessions.error;
    return {members:members.data||[],sessions:sessions.data||[]};
  }

  function renderGroupWorkspace(group,data){
    const inner=$('#coachLiveDialogInner'); if(!inner) return;
    const memberMap=new Map((data.members||[]).map(x=>[x.relationship_id,x]));
    const eligible=(state.context?.clients||[]).filter(c=>c.program_id===group.program_id);
    const memberRows=eligible.map(client=>{
      const membership=memberMap.get(client.id);
      const active=membership?.status==='active';
      const canAdd=client.status==='active'&&['forming','active'].includes(group.status);
      return '<article class="coach-client-line"><div><b>'+esc(client.client_name||'Client')+'</b><small>'+esc(client.client_email||'')+' · '+esc(statusLabel(client.status))+(active?' · joined '+esc(fmtDate(membership.joined_at)):'')+'</small></div>'+
        (active?'<button type="button" data-group-client-toggle="'+esc(client.id)+'" data-group-id="'+esc(group.id)+'" data-next-active="false">Remove</button>':
          (canAdd?'<button type="button" data-group-client-toggle="'+esc(client.id)+'" data-group-id="'+esc(group.id)+'" data-next-active="true">Add</button>':''))+
        '</article>';
    }).join('')||'<div class="coach-live-empty">No client relationships match this group program.</div>';

    const sessionRows=(data.sessions||[]).map(s=>'<article class="coach-client-line"><div><b>'+esc(s.title||fmtDateTime(s.scheduled_start))+'</b><small>'+esc(fmtDateTime(s.scheduled_start))+' · '+esc(s.duration_minutes)+' min'+(s.operational_note?' · '+esc(s.operational_note):'')+'</small></div><span class="coach-live-pill">'+esc(statusLabel(s.status))+'</span></article>').join('')||
      '<div class="coach-live-empty">No group sessions scheduled.</div>';

    inner.innerHTML=
      '<div class="coach-live-dialog-head"><div><span class="approved-kicker">GROUP MANAGEMENT</span><h3>'+esc(group.name)+'</h3><p>'+esc(group.program_name||'Program')+' · '+esc(group.members||0)+'/'+esc(group.capacity)+' active members</p></div><button class="coach-live-close" type="button" data-coach-live-close>×</button></div>'+
      '<form id="coachGroupManagementForm" data-group-id="'+esc(group.id)+'" class="coach-live-form">'+
        '<label class="wide">Group name<input id="coachManageGroupName" value="'+esc(group.name)+'" required></label>'+
        '<label>Service package<select id="coachManageGroupService">'+groupServiceOptions(group)+'</select></label>'+
        '<label>Status<select id="coachManageGroupStatus">'+
          ['forming','active','paused','completed','archived'].map(x=>'<option value="'+x+'" '+(group.status===x?'selected':'')+'>'+esc(statusLabel(x))+'</option>').join('')+
        '</select></label>'+
        '<label>Capacity<input id="coachManageGroupCapacity" type="number" min="2" max="50" value="'+esc(group.capacity)+'" required></label>'+
        '<label>Group price<input id="coachManageGroupPrice" type="number" min="0" step="0.01" value="'+esc(group.group_price==null?'':group.group_price)+'"></label>'+
        '<label>Start date<input id="coachManageGroupStart" type="date" value="'+esc(group.start_date||'')+'"></label>'+
        '<label>End date<input id="coachManageGroupEnd" type="date" value="'+esc(group.end_date||'')+'"></label>'+
        '<label class="wide">Description<textarea id="coachManageGroupDescription">'+esc(group.description||'')+'</textarea></label>'+
        '<div class="wide coach-live-footer"><button type="button" data-coach-message-group="'+esc(group.id)+'">Message Group</button><button type="button" data-group-session="'+esc(group.id)+'">Schedule Session</button><button class="primary" type="submit">Save Group</button></div>'+
      '</form>'+
      '<div class="coach-client-grid" style="margin-top:14px">'+
        '<section><h4>Members</h4>'+memberRows+'</section>'+
        '<section><h4>Group Sessions</h4>'+sessionRows+'</section>'+
      '</div>';
  }

  async function openGroupManagement(groupId){
    const group=groupForId(groupId);
    if(!group) return alert('Coaching group could not be found.');
    state.selectedGroup=group;
    state.groupWorkspace=null;
    dialog(group.name,'Loading group workspace…','<div class="coach-live-empty">Loading members and sessions…</div>');
    try{
      const data=await loadGroupWorkspaceData(group);
      state.groupWorkspace=data;
      renderGroupWorkspace(group,data);
    }catch(err){
      const inner=$('#coachLiveDialogInner');
      if(inner) inner.innerHTML='<div class="coach-live-dialog-head"><div><span class="approved-kicker">GROUP MANAGEMENT</span><h3>Group workspace unavailable</h3></div><button class="coach-live-close" data-coach-live-close>×</button></div><div class="coach-live-error">'+esc(err.message||err)+'</div>';
    }
  }

  async function saveGroupManagement(){
    const group=state.selectedGroup;
    if(!group) throw new Error('Group is unavailable.');
    const payload={
      p_group_id:group.id,
      p_name:$('#coachManageGroupName')?.value.trim(),
      p_description:$('#coachManageGroupDescription')?.value.trim()||null,
      p_service_package_id:$('#coachManageGroupService')?.value||null,
      p_capacity:Number($('#coachManageGroupCapacity')?.value||group.capacity),
      p_status:$('#coachManageGroupStatus')?.value||group.status,
      p_start_date:$('#coachManageGroupStart')?.value||null,
      p_end_date:$('#coachManageGroupEnd')?.value||null,
      p_group_price:$('#coachManageGroupPrice')?.value===''?null:Number($('#coachManageGroupPrice')?.value)
    };
    const {error}=await sb().rpc('update_my_coach_group',payload);
    if(error) throw error;
    closeDialog();
    state.context=null;
    await loadDashboard();
  }

  async function toggleGroupClient(groupId,relationshipId,active){
    const {error}=await sb().rpc('set_my_coach_client_group_membership',{
      p_relationship_id:relationshipId,p_group_id:groupId,p_active:active
    });
    if(error) throw error;
    state.context=null;
    await loadDashboard();
    await openGroupManagement(groupId);
  }

  function openGroupSession(groupId){
    const group=groupForId(groupId);
    if(!group||!['forming','active'].includes(group.status)) return alert('The group must be forming or active to schedule a session.');
    state.selectedGroup=group;
    dialog('Schedule Group Session',group.name,
      '<form id="coachGroupSessionForm"><div class="coach-live-form">'+
        '<label class="wide">Date & time<input id="coachGroupSessionStart" type="datetime-local" required></label>'+
        '<label>Duration (minutes)<input id="coachGroupSessionDuration" type="number" min="10" max="240" value="60" required></label>'+
        '<label>Session type<select id="coachGroupSessionType"><option value="group_coaching">Group Coaching</option><option value="group_checkin">Group Check-in</option></select></label>'+
        '<label class="wide">Operational note<textarea id="coachGroupSessionNote" placeholder="Scheduling or operational note only."></textarea></label>'+
      '</div><div class="coach-live-footer"><button type="button" data-coach-open-group="'+esc(group.id)+'">Back</button><button class="primary" type="submit">Schedule</button></div></form>');
  }

  async function createGroupSession(){
    const group=state.selectedGroup;
    if(!group) throw new Error('Group is unavailable.');
    const start=$('#coachGroupSessionStart')?.value;
    if(!start) throw new Error('Choose a session date and time.');
    const sessionKind=$('#coachGroupSessionType')?.value||'group_coaching';
    const row={
      business_id:state.business.id,
      created_by:state.user.id,
      relationship_id:null,
      group_id:group.id,
      consultation_request_id:null,
      title:(sessionKind==='group_checkin'?'Group Check-in · ':'Group Coaching · ')+(group.name||'Group'),
      session_scope:'group',
      scheduled_start:new Date(start).toISOString(),
      duration_minutes:Number($('#coachGroupSessionDuration')?.value||60),
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Los_Angeles',
      meeting_location:null,
      meeting_url:null,
      operational_note:$('#coachGroupSessionNote')?.value.trim()||null,
      status:'scheduled'
    };
    const {error}=await sb().from('coach_schedule_events').insert(row);
    if(error) throw error;
    await openGroupManagement(group.id);
  }

  function clientForRelationship(id){
    return (state.context?.clients||[]).find(x=>x.id===id)||null;
  }

  function clientServiceOptions(client){
    const rows=(state.context?.services||[]).filter(s=>s.active&&s.program_id===client.program_id);
    return '<option value="">No service package</option>'+rows.map(s=>
      '<option value="'+esc(s.id)+'" '+(s.id===client.service_package_id?'selected':'')+'>'+esc(s.name)+' · '+esc(money(s.price_amount))+'</option>'
    ).join('');
  }

  async function loadClientWorkspaceData(client){
    const businessId=state.business?.id;
    if(!businessId) throw new Error('Coach business is unavailable.');
    const [memberships,sessions,shared,recipients,formAssignments,formDefinitions,followups]=await Promise.all([
      sb().from('coach_group_members').select('group_id,status,joined_at').eq('relationship_id',client.id),
      sb().from('coach_schedule_events').select('id,title,scheduled_start,duration_minutes,session_scope,status,operational_note,meeting_location,meeting_url,created_at').eq('relationship_id',client.id).order('scheduled_start',{ascending:false}).limit(50),
      sb().from('coach_shared_items').select('id,share_type,title,shared_content,source_reference,shared_at,revoked_at').eq('relationship_id',client.id).is('revoked_at',null).order('shared_at',{ascending:false}).limit(50),
      sb().from('coach_assignment_recipients').select('assignment_id,completed_at').eq('relationship_id',client.id),
      sb().from('form_assignments').select('id,form_id,due_at,status,completed_at,created_at').eq('business_id',businessId).eq('user_id',client.client_user_id).order('created_at',{ascending:false}).limit(50),
      sb().from('form_definitions').select('id,title,description,form_type,program_id,status').eq('business_id',businessId).order('updated_at',{ascending:false}),
      sb().from('crm_followups').select('id,title,note,due_at,status,completed_at,created_at').eq('workspace_type','coach').eq('business_id',businessId).eq('related_user_id',client.client_user_id).order('created_at',{ascending:false}).limit(50)
    ]);
    for(const result of [memberships,sessions,shared,recipients,formAssignments,formDefinitions,followups]){
      if(result.error) throw result.error;
    }
    const assignmentMap=new Map((state.context?.assignments||[]).map(a=>[a.id,a]));
    const assigned=(recipients.data||[]).map(r=>({...r,assignment:assignmentMap.get(r.assignment_id)||null})).filter(x=>x.assignment);
    const formMap=new Map((formDefinitions.data||[]).map(x=>[x.id,x]));
    const forms=(formAssignments.data||[]).map(x=>({...x,definition:formMap.get(x.form_id)||null}));
    const availableIntake=(formDefinitions.data||[]).filter(x=>x.form_type==='intake'&&x.status==='published'&&(x.program_id===null||x.program_id===client.program_id));
    return {
      memberships:memberships.data||[],
      sessions:sessions.data||[],
      shared:shared.data||[],
      assignments:assigned,
      forms,
      availableIntake,
      followups:followups.data||[]
    };
  }

  function renderClientWorkspace(client,data){
    const inner=$('#coachLiveDialogInner'); if(!inner) return;
    const memberMap=new Map((data.memberships||[]).map(x=>[x.group_id,x]));
    const groups=(state.context?.groups||[]).filter(g=>g.program_id===client.program_id&&['forming','active'].includes(g.status));
    const groupRows=groups.map(g=>{
      const m=memberMap.get(g.id),active=m?.status==='active';
      return '<article class="coach-client-line"><div><b>'+esc(g.name)+'</b><small>'+esc(g.members||0)+'/'+esc(g.capacity)+' members · '+esc(statusLabel(g.status))+'</small></div>'+
        (client.status==='active'?'<button type="button" data-client-group-toggle="'+esc(g.id)+'" data-relationship-id="'+esc(client.id)+'" data-next-active="'+(active?'false':'true')+'">'+(active?'Remove':'Add')+'</button>':'')+
        '</article>';
    }).join('')||'<div class="coach-live-empty">No active groups match this client program.</div>';

    const sessionRows=(data.sessions||[]).map(s=>'<article class="coach-client-line"><div><b>'+esc(s.title||fmtDateTime(s.scheduled_start))+'</b><small>'+esc(fmtDateTime(s.scheduled_start))+' · '+esc(s.duration_minutes)+' min'+(s.operational_note?' · '+esc(s.operational_note):'')+'</small></div><span class="coach-live-pill">'+esc(statusLabel(s.status))+'</span></article>').join('')||
      '<div class="coach-live-empty">No sessions scheduled for this client.</div>';

    const assignmentRows=(data.assignments||[]).map(x=>'<article class="coach-client-line"><div><b>'+esc(x.assignment.title)+'</b><small>Due '+esc(x.assignment.due_at?fmtDateTime(x.assignment.due_at):'not set')+'</small></div><span class="coach-live-pill">'+esc(x.completed_at?'Completed':statusLabel(x.assignment.status))+'</span></article>').join('')||
      '<div class="coach-live-empty">No assignments for this client.</div>';

    const formRows=(data.forms||[]).map(x=>'<article class="coach-client-line"><div><b>'+esc(x.definition?.title||'Assigned form')+'</b><small>'+esc(x.due_at?'Due '+fmtDateTime(x.due_at):'No due date')+'</small></div><span class="coach-live-pill">'+esc(statusLabel(x.status))+'</span></article>').join('')||
      '<div class="coach-live-empty">No forms assigned to this client.</div>';

    const followupRows=(data.followups||[]).map(x=>'<article class="coach-client-line"><div><b>'+esc(x.title)+'</b><small>'+esc(x.note||'')+(x.due_at?' · due '+esc(fmtDateTime(x.due_at)):'')+'</small></div><span class="coach-live-pill">'+esc(statusLabel(x.status))+'</span></article>').join('')||
      '<div class="coach-live-empty">No follow-ups for this client.</div>';

    const sharedRows=(data.shared||[]).map(x=>'<article class="coach-client-shared"><div class="coach-live-row"><div><b>'+esc(x.title||statusLabel(x.share_type))+'</b><small>'+esc(statusLabel(x.share_type))+' · shared '+esc(fmtDateTime(x.shared_at))+'</small></div><span class="coach-live-pill">CLIENT SHARED</span></div>'+(x.shared_content?'<p>'+esc(x.shared_content)+'</p>':'')+'</article>').join('')||
      '<div class="coach-live-empty">This client has not shared any Lellee items with this coach.</div>';

    const ended=client.status==='ended';
    inner.innerHTML=
      '<div class="coach-live-dialog-head"><div><span class="approved-kicker">CLIENT MANAGEMENT</span><h3>'+esc(client.client_name||'Client')+'</h3><p>'+esc(client.client_email||'')+' · '+esc(client.program_name||'Program')+'</p></div><button class="coach-live-close" type="button" data-coach-live-close>×</button></div>'+
      '<div class="coach-client-summary"><span class="coach-live-pill">'+esc(statusLabel(client.status))+'</span><span>Started '+esc(fmtDate(client.started_at))+'</span><span>Consent recorded for this coaching relationship</span></div>'+
      '<form id="coachClientRelationshipForm" data-relationship-id="'+esc(client.id)+'" class="coach-client-controls">'+
        '<label>Service package<select id="coachClientService" '+(ended?'disabled':'')+'>'+clientServiceOptions(client)+'</select></label>'+
        '<label>Relationship status<select id="coachClientStatus" '+(ended?'disabled':'')+'><option value="active" '+(client.status==='active'?'selected':'')+'>Active</option><option value="paused" '+(client.status==='paused'?'selected':'')+'>Paused</option>'+(ended?'<option value="ended" selected>Ended</option>':'')+'</select></label>'+
        '<button class="primary" type="submit" '+(ended?'disabled':'')+'>Save Client Setup</button>'+
      '</form>'+
      '<div class="coach-client-actions">'+
        '<button type="button" data-client-message="'+esc(client.id)+'">Message</button>'+
        '<button type="button" data-client-assignment="'+esc(client.id)+'" '+(client.status!=='active'?'disabled':'')+'>New Assignment</button>'+
        '<button type="button" data-client-session="'+esc(client.id)+'" '+(client.status!=='active'?'disabled':'')+'>Schedule Session</button>'+
        '<button type="button" data-client-followup="'+esc(client.id)+'">Add Follow-Up</button>'+
        '<button type="button" data-client-intake="'+esc(client.id)+'" '+(!(data.availableIntake||[]).length||client.status!=='active'?'disabled':'')+'>Assign Intake Form</button>'+
        (!ended?'<button type="button" class="danger" data-client-end="'+esc(client.id)+'">End Relationship</button>':'')+
      '</div>'+
      '<div class="coach-client-grid">'+
        '<section><h4>Groups</h4>'+groupRows+'</section>'+
        '<section><h4>Sessions</h4>'+sessionRows+'</section>'+
        '<section><h4>Assignments</h4>'+assignmentRows+'</section>'+
        '<section><h4>Forms</h4>'+formRows+'</section>'+
        '<section><h4>Follow-Ups</h4>'+followupRows+'</section>'+
        '<section class="wide"><h4>Shared by Client</h4><p class="coach-client-privacy">Only information the client explicitly shared with this coaching relationship appears here. Private journals, private check-ins and other unshared Lellee data are not available to the coach.</p>'+sharedRows+'</section>'+
      '</div>';
  }

  async function openClientManagement(relationshipId){
    const client=clientForRelationship(relationshipId);
    if(!client) return alert('Client relationship could not be found.');
    state.selectedClient=client;
    state.clientWorkspace=null;
    dialog(client.client_name||'Client','Loading client workspace…','<div class="coach-live-empty">Loading service, groups, sessions, assignments, forms and client-shared items…</div>');
    try{
      const data=await loadClientWorkspaceData(client);
      state.clientWorkspace=data;
      renderClientWorkspace(client,data);
    }catch(err){
      const inner=$('#coachLiveDialogInner');
      if(inner) inner.innerHTML='<div class="coach-live-dialog-head"><div><span class="approved-kicker">CLIENT MANAGEMENT</span><h3>Client workspace unavailable</h3></div><button class="coach-live-close" data-coach-live-close>×</button></div><div class="coach-live-error">'+esc(err.message||err)+'</div>';
    }
  }

  async function saveClientRelationship(){
    const client=state.selectedClient;
    if(!client) throw new Error('Client relationship is unavailable.');
    const service=$('#coachClientService')?.value||null;
    const status=$('#coachClientStatus')?.value||client.status;
    const {error}=await sb().rpc('update_my_coach_client_relationship',{
      p_relationship_id:client.id,p_service_package_id:service,p_status:status
    });
    if(error) throw error;
    closeDialog();
    state.context=null;
    await loadDashboard();
  }

  async function endClientRelationship(relationshipId){
    const client=clientForRelationship(relationshipId);
    if(!client) return;
    if(!confirm('End the coaching relationship with '+(client.client_name||'this client')+'? This also removes active group memberships. The client must consent to a new invitation before coaching can restart.')) return;
    const {error}=await sb().rpc('update_my_coach_client_relationship',{
      p_relationship_id:client.id,
      p_service_package_id:client.service_package_id||null,
      p_status:'ended'
    });
    if(error) throw error;
    closeDialog();
    state.context=null;
    await loadDashboard();
  }

  async function toggleClientGroup(relationshipId,groupId,active){
    const {error}=await sb().rpc('set_my_coach_client_group_membership',{
      p_relationship_id:relationshipId,p_group_id:groupId,p_active:active
    });
    if(error) throw error;
    state.context=null;
    await loadDashboard();
    await openClientManagement(relationshipId);
  }

  function openClientSession(relationshipId){
    const client=clientForRelationship(relationshipId);
    if(!client||client.status!=='active') return alert('An active coaching relationship is required to schedule a session.');
    state.selectedClient=client;
    dialog('Schedule Session',client.client_name||'Client',
      '<form id="coachClientSessionForm" data-relationship-id="'+esc(client.id)+'"><div class="coach-live-form">'+
        '<label class="wide">Date & time<input id="coachClientSessionStart" type="datetime-local" required></label>'+
        '<label>Duration (minutes)<input id="coachClientSessionDuration" type="number" min="10" max="240" value="50" required></label>'+
        '<label>Session type<select id="coachClientSessionType"><option value="coaching">Coaching</option><option value="checkin">Check-in</option></select></label>'+
        '<label class="wide">Operational note<textarea id="coachClientSessionNote" placeholder="Scheduling or operational note only."></textarea></label>'+
      '</div><div class="coach-live-footer"><button type="button" data-coach-open-client="'+esc(client.id)+'">Back</button><button class="primary" type="submit">Schedule</button></div></form>');
  }

  async function createClientSession(){
    const client=state.selectedClient;
    if(!client) throw new Error('Client relationship is unavailable.');
    const start=$('#coachClientSessionStart')?.value;
    if(!start) throw new Error('Choose a session date and time.');
    const sessionKind=$('#coachClientSessionType')?.value||'coaching';
    const row={
      business_id:state.business.id,
      created_by:state.user.id,
      relationship_id:client.id,
      group_id:null,
      consultation_request_id:null,
      title:(sessionKind==='checkin'?'Check-in · ':'Coaching Session · ')+(client.client_name||'Client'),
      session_scope:'one_to_one',
      scheduled_start:new Date(start).toISOString(),
      duration_minutes:Number($('#coachClientSessionDuration')?.value||50),
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Los_Angeles',
      meeting_location:null,
      meeting_url:null,
      operational_note:$('#coachClientSessionNote')?.value.trim()||null,
      status:'scheduled'
    };
    const {error}=await sb().from('coach_schedule_events').insert(row);
    if(error) throw error;
    await openClientManagement(client.id);
  }

  function openClientFollowup(relationshipId){
    const client=clientForRelationship(relationshipId);
    if(!client) return;
    state.selectedClient=client;
    dialog('Add Follow-Up',client.client_name||'Client',
      '<form id="coachClientFollowupForm"><div class="coach-live-form">'+
        '<label class="wide">Follow-up title<input id="coachClientFollowupTitle" required></label>'+
        '<label class="wide">Due date/time<input id="coachClientFollowupDue" type="datetime-local"></label>'+
        '<label class="wide">Note<textarea id="coachClientFollowupNote" placeholder="Business/operational follow-up note."></textarea></label>'+
      '</div><div class="coach-live-footer"><button type="button" data-coach-open-client="'+esc(client.id)+'">Back</button><button class="primary" type="submit">Add Follow-Up</button></div></form>');
  }

  async function createClientFollowup(){
    const client=state.selectedClient;
    if(!client) throw new Error('Client relationship is unavailable.');
    const row={
      owner_user_id:state.user.id,
      workspace_type:'coach',
      business_id:state.business.id,
      organization_id:null,
      related_user_id:client.client_user_id,
      consultation_request_id:null,
      lead_id:null,
      title:$('#coachClientFollowupTitle')?.value.trim(),
      note:$('#coachClientFollowupNote')?.value.trim()||null,
      due_at:$('#coachClientFollowupDue')?.value?new Date($('#coachClientFollowupDue').value).toISOString():null,
      status:'open'
    };
    if(!row.title) throw new Error('Follow-up title is required.');
    const {error}=await sb().from('crm_followups').insert(row);
    if(error) throw error;
    await openClientManagement(client.id);
  }

  function openClientIntake(relationshipId){
    const client=clientForRelationship(relationshipId);
    if(!client||client.status!=='active') return alert('An active coaching relationship is required.');
    const forms=state.clientWorkspace?.availableIntake||[];
    if(!forms.length) return alert('No published intake form is available for this client program.');
    state.selectedClient=client;
    dialog('Assign Intake Form',client.client_name||'Client',
      '<form id="coachClientIntakeForm"><div class="coach-live-form">'+
        '<label class="wide">Form<select id="coachClientIntakeSelect">'+forms.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+'</option>').join('')+'</select></label>'+
        '<label class="wide">Due date/time<input id="coachClientIntakeDue" type="datetime-local"></label>'+
      '</div><div class="coach-live-footer"><button type="button" data-coach-open-client="'+esc(client.id)+'">Back</button><button class="primary" type="submit">Assign Form</button></div></form>');
  }

  async function assignClientIntake(){
    const client=state.selectedClient;
    if(!client) throw new Error('Client relationship is unavailable.');
    const due=$('#coachClientIntakeDue')?.value;
    const {error}=await sb().rpc('assign_coach_intake_form',{
      p_form_id:$('#coachClientIntakeSelect')?.value,
      p_client_user_id:client.client_user_id,
      p_due_at:due?new Date(due).toISOString():null
    });
    if(error) throw error;
    await openClientManagement(client.id);
  }

  async function loadAdminCoachReview(){
    if(!user()) return;
    const bq=await sb().from('coach_businesses')
      .select('id,business_name,public_name,business_model,target_audience,bio,credentials_disclosure,status,review_note,marketplace_visible,submitted_at,reviewed_at,primary_program_id')
      .order('submitted_at',{ascending:false,nullsFirst:false});
    if(bq.error){
      const host=$('#coachAdminList'); if(host) host.innerHTML=`<div class="coach-live-error">${esc(bq.error.message)}</div>`;
      return;
    }
    const programs=(state.context?.programs)||[];
    const pname=id=>programs.find(p=>p.id===id)?.name||'Program';
    const rows=bq.data||[];
    $('#coachAdminPending').textContent=rows.filter(x=>x.status==='pending_review').length;
    $('#coachAdminApproved').textContent=rows.filter(x=>x.status==='approved').length;
    $('#coachAdminMarketplace').textContent=rows.filter(x=>x.marketplace_visible).length;
    const host=$('#coachAdminList'); if(!host) return;
    host.innerHTML=rows.length?rows.map(b=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(b.business_name)}</b><small>${esc(b.public_name)} · ${esc(pname(b.primary_program_id))} · ${esc(statusLabel(b.business_model))}</small></div>
          <span class="coach-live-pill">${esc(statusLabel(b.status))}</span>
        </div>
        <small style="margin-top:8px"><b>Audience:</b> ${esc(b.target_audience||'Not provided')}</small>
        <small><b>Bio:</b> ${esc(b.bio||'Not provided')}</small>
        <small><b>Credentials/disclosure:</b> ${esc(b.credentials_disclosure||'Not provided')}</small>
        ${b.review_note?`<div class="coach-live-review-note"><b>Review note:</b> ${esc(b.review_note)}</div>`:''}
        <div class="coach-admin-review-actions">
          <button class="approve" data-coach-admin-decision="approved" data-business-id="${b.id}">Approve</button>
          <button data-coach-admin-decision="pending_review" data-business-id="${b.id}">Return to Review</button>
          <button data-coach-admin-decision="paused" data-business-id="${b.id}">Pause</button>
          <button class="reject" data-coach-admin-decision="rejected" data-business-id="${b.id}">Reject / Changes</button>
        </div>
      </article>`).join(''):`<div class="coach-live-empty">No coaching businesses have been submitted.</div>`;
  }

  async function adminDecision(businessId,decision){
    const note=decision==='approved' ? (prompt('Optional approval note:','')||'') : (prompt('Reviewer note:','')||'');
    if(decision==='rejected' && !note.trim()) return alert('Add a review note explaining what must change.');
    const {error}=await sb().rpc('admin_review_coach_business',{
      p_business_id:businessId,p_decision:decision,p_review_note:note||null
    });
    if(error) throw error;
    await loadAdminCoachReview();
  }

  function showCoachTab(tab){
    document.querySelectorAll('[data-coach-tab]').forEach(b=>b.classList.toggle('active',b.dataset.coachTab===tab));
    ['clients','groups','services','messages','assignments','leads'].forEach(name=>{
      const el=$(`#coachPanel${name[0].toUpperCase()+name.slice(1)}`);
      if(el) el.classList.toggle('hidden',name!==tab);
    });
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-coach-live-close]')) closeDialog();
    if(e.target.closest('[data-coach-ethics-close]')){stopEthicsHeartbeat();state.ethicsWatchSession=null;$('#coachEthicsDialog')?.close();}
    const eo=e.target.closest('[data-coach-ethics-open]');if(eo){e.preventDefault();openEthicsLesson(eo.dataset.coachEthicsOpen);}
    if(e.target.closest('[data-coach-ethics-history]')){e.preventDefault();openEthicsHistory();}


    const page=e.target.closest('[data-page]');
    if(page){
      const p=page.dataset.page;
      if(p==='coach-business') setTimeout(()=>{state.context=null;loadBusinessPage();},40);
      if(p==='coach-dashboard') setTimeout(loadDashboard,40);
      if(p==='coach-admin') setTimeout(async()=>{state.context=null;await loadContext();loadAdminCoachReview();},40);
    }

    const tab=e.target.closest('[data-coach-tab]');
    if(tab){
      e.preventDefault(); e.stopImmediatePropagation();
      showCoachTab(tab.dataset.coachTab);
    }

    if(e.target.closest('#submitCoachBusiness')){
      e.preventDefault(); e.stopImmediatePropagation(); submitBusiness();
    }
    if(e.target.closest('#coachInviteClient')){
      e.preventDefault(); e.stopImmediatePropagation(); openInvite();
    }
    if(e.target.closest('#coachNewService')){
      e.preventDefault(); e.stopImmediatePropagation(); openService();
    }
    if(e.target.closest('#coachNewGroup')){
      e.preventDefault(); e.stopImmediatePropagation(); openGroup();
    }
    if(e.target.closest('#coachNewLead')){
      e.preventDefault(); e.stopImmediatePropagation(); openLead();
    }
    if(e.target.closest('#coachNewAssignment')){
      e.preventDefault(); e.stopImmediatePropagation(); openAssignment();
    }
    if(e.target.closest('#coachNewMessage')){
      e.preventDefault(); e.stopImmediatePropagation(); openMessage();
    }

    const assignmentOpen=e.target.closest('[data-coach-open-assignment]');
    if(assignmentOpen){
      e.preventDefault();
      openAssignmentManagement(assignmentOpen.dataset.coachOpenAssignment).catch(function(err){alert(err.message||String(err));});
    }

    const conversation=e.target.closest('[data-coach-conversation-kind]');
    if(conversation){
      e.preventDefault();
      openConversation(conversation.dataset.coachConversationKind,conversation.dataset.coachConversationId).catch(function(err){alert(err.message||String(err));});
    }

    const openService=e.target.closest('[data-coach-open-service]');
    if(openService){ e.preventDefault(); openServiceManagement(openService.dataset.coachOpenService); }

    const openLead=e.target.closest('[data-coach-open-lead]');
    if(openLead){ e.preventDefault(); openLeadManagement(openLead.dataset.coachOpenLead).catch(err=>alert(err.message||String(err))); }
    const leadInvite=e.target.closest('[data-lead-invite]');
    if(leadInvite){ e.preventDefault(); inviteLeadAsClient(leadInvite.dataset.leadInvite).catch(err=>alert(err.message||String(err))); }
    const leadFollowup=e.target.closest('[data-lead-followup]');
    if(leadFollowup){ e.preventDefault(); openLeadFollowup(leadFollowup.dataset.leadFollowup); }

    const openGroup=e.target.closest('[data-coach-open-group]');
    if(openGroup){ e.preventDefault(); openGroupManagement(openGroup.dataset.coachOpenGroup); }

    const groupClientToggle=e.target.closest('[data-group-client-toggle]');
    if(groupClientToggle){
      e.preventDefault();
      toggleGroupClient(groupClientToggle.dataset.groupId,groupClientToggle.dataset.groupClientToggle,groupClientToggle.dataset.nextActive==='true').catch(err=>alert(err.message||String(err)));
    }
    const groupSession=e.target.closest('[data-group-session]');
    if(groupSession){ e.preventDefault(); openGroupSession(groupSession.dataset.groupSession); }

    const openClient=e.target.closest('[data-coach-open-client]');
    if(openClient){ e.preventDefault(); openClientManagement(openClient.dataset.coachOpenClient); }

    const clientMessage=e.target.closest('[data-client-message]');
    if(clientMessage){e.preventDefault();openConversation('rel',clientMessage.dataset.clientMessage).catch(function(err){alert(err.message||String(err));});}
    const clientAssignment=e.target.closest('[data-client-assignment]');
    if(clientAssignment){ e.preventDefault(); openAssignment('rel',clientAssignment.dataset.clientAssignment); }
    const clientSession=e.target.closest('[data-client-session]');
    if(clientSession){ e.preventDefault(); openClientSession(clientSession.dataset.clientSession); }
    const clientFollowup=e.target.closest('[data-client-followup]');
    if(clientFollowup){ e.preventDefault(); openClientFollowup(clientFollowup.dataset.clientFollowup); }
    const clientIntake=e.target.closest('[data-client-intake]');
    if(clientIntake){ e.preventDefault(); openClientIntake(clientIntake.dataset.clientIntake); }
    const clientEnd=e.target.closest('[data-client-end]');
    if(clientEnd){ e.preventDefault(); endClientRelationship(clientEnd.dataset.clientEnd).catch(err=>alert(err.message||String(err))); }
    const groupToggle=e.target.closest('[data-client-group-toggle]');
    if(groupToggle){
      e.preventDefault();
      toggleClientGroup(groupToggle.dataset.relationshipId,groupToggle.dataset.clientGroupToggle,groupToggle.dataset.nextActive==='true').catch(err=>alert(err.message||String(err)));
    }

    const rel=e.target.closest('[data-coach-message-rel]');
    if(rel){e.preventDefault();openConversation('rel',rel.dataset.coachMessageRel).catch(function(err){alert(err.message||String(err));});}
    const grp=e.target.closest('[data-coach-message-group]');
    if(grp){e.preventDefault();openConversation('group',grp.dataset.coachMessageGroup).catch(function(err){alert(err.message||String(err));});}

    const dec=e.target.closest('[data-coach-admin-decision]');
    if(dec){
      e.preventDefault();
      adminDecision(dec.dataset.businessId,dec.dataset.coachAdminDecision).catch(err=>alert(err.message||String(err)));
    }

    if(e.target.closest('#copyCoachInvite')){
      const txt=$('#coachInviteLink')?.textContent||'';
      navigator.clipboard?.writeText(txt).then(()=>{e.target.textContent='Copied';}).catch(()=>{});
    }
  },true);

  document.addEventListener('submit',e=>{
    const id=e.target?.id;
    if(!id) return;
    const run=async fn=>{
      e.preventDefault();
      try{ await fn(); }catch(err){ alert(err.message||String(err)); }
    };
    if(id==='coachEthicsQuizForm') run(()=>submitEthicsQuiz(e.target));
    if(id==='coachInviteForm') run(createInvite);
    if(id==='coachServiceForm') run(createService);
    if(id==='coachGroupForm') run(createGroup);
    if(id==='coachLeadForm') run(createLead);
    if(id==='coachAssignmentForm') run(createAssignment);
    if(id==='coachMessageForm') run(sendMessage);
    if(id==='coachClientRelationshipForm') run(saveClientRelationship);
    if(id==='coachClientSessionForm') run(createClientSession);
    if(id==='coachClientFollowupForm') run(createClientFollowup);
    if(id==='coachClientIntakeForm') run(assignClientIntake);
    if(id==='coachGroupManagementForm') run(saveGroupManagement);
    if(id==='coachGroupSessionForm') run(createGroupSession);
    if(id==='coachServiceManagementForm') run(saveServiceManagement);
    if(id==='coachLeadManagementForm') run(saveLeadManagement);
    if(id==='coachLeadFollowupForm') run(createLeadFollowup);
    if(id==='coachAssignmentManagementForm') run(saveAssignmentManagement);
    if(id==='coachConversationForm') run(sendConversationReply);
  });

  function boot(){
    const timer=setInterval(async()=>{
      if(bridge() && user()){
        clearInterval(timer);
        state.user=user();
        await handleInviteToken();
        const active=$('.page.active');
        if(active?.id==='page-coach-business') loadBusinessPage();
        if(active?.id==='page-coach-dashboard') loadDashboard();
        if(active?.id==='page-coach-admin'){ await loadContext(); loadAdminCoachReview(); }
      }
    },250);
    setTimeout(()=>clearInterval(timer),60000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  window.LelleeCoachDashboardLive={loadDashboard,loadBusinessPage,loadAdminCoachReview};
})();
