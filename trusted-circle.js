/* Trusted Circle UI: existing auth client, one module and canonical page events. */
(() => {
  'use strict';
  if (window.LelleeCircleUI) return;
  const VERSION = '2026-09-06-circle-ui-1';
  const PROJECT = 'https://vnfjszmhmcxkxegzvivg.supabase.co';
  const pages = ['trusted-circle', 'supporter-dashboard', 'collaboration-ops'];
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const state = {page: null, nonce: 0, authKnown: false, authUser: null,
    client: null, subscription: null, data: null, labels: [], programs: [], dialog: null, busy: false};
  const roots = () => pages.map(p => $('#page-' + p)).filter(Boolean);
  const active = () => pages.find(p => $('#page-' + p)?.classList.contains('active')) || null;
  const client = () => window.LelleeAuthContext?.client || window.LelleeAuthContext?.getClient?.() || null;
  const uid = () => state.authKnown ? state.authUser : (window.LelleeAuthContext?.getCurrentUser?.()?.id || null);
  function node(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') e.textContent = String(v);
      else if (k === 'class') e.className = v;
      else e.setAttribute(k, v === true ? '' : String(v));
    });
    for (const c of children) if (c !== null && c !== undefined) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    return e;
  }
  function button(text, action, id, extra = {}) {
    return node('button', {type: 'button', class: 'approved-link', text,
      'data-circle-action': action, 'data-circle-id': id, ...extra});
  }
  function row(title, detail = '', actions = []) {
    return node('div', {class: 'circle-row'}, [node('div', {class: 'circle-icon', text: '♡', 'aria-hidden': true}),
      node('div', {}, [node('b', {text: title}), node('small', {text: detail})]),
      node('div', {class: 'circle-ui-actions'}, actions)]);
  }
  function list(id, rows, empty = 'Nothing here yet.') {
    const e = $('#' + id); if (e) e.replaceChildren(...(rows.length ? rows : [node('p', {class: 'approved-resource-empty', text: empty})]));
  }
  function text(id, value) { const e = $('#' + id); if (e) e.textContent = String(value ?? 0); }
  function message(value, bad = false) {
    const el = $('#page-' + (state.page || active()) + ' [data-circle-ui-status]');
    if (el) { el.textContent = value; el.setAttribute('role', bad ? 'alert' : 'status'); }
  }
  function closeDialog() {
    const d = state.dialog; state.dialog = null;
    if (d) { if (d.open) d.close(); d.remove(); }
  }
  function clear() {
    state.nonce++; state.data = null; state.labels = []; state.programs = [];
    closeDialog();
    roots().forEach(r => {
      r.querySelectorAll('.circle-list,.circle-guardrail-grid').forEach(e => e.replaceChildren());
      r.querySelectorAll('.circle-summary-grid b,[id^="collabOps"]').forEach(e => e.textContent = '—');
    });
  }
  function context() {
    const c = client();
    if (!c || String(c.supabaseUrl || '').replace(/\/$/, '') !== PROJECT) {
      throw new Error('Trusted Circle is unavailable because the account connection is not configured for Lellee. Nothing was submitted.');
    }
    const user = uid();
    if (!user) throw new Error('Sign in to use your private Trusted Circle.');
    return {c, user};
  }
  function current(ticket, user, page) {
    return ticket === state.nonce && user === uid() && page === active() && !document.hidden;
  }
  async function result(promise) {
    const r = await promise;
    if (r?.error) throw new Error(r.error.message || 'The request could not be completed.');
    return r?.data;
  }
  function person(id) {
    const p = state.labels.find(x => x.relationship_id === id);
    return p?.account_email || 'Connection ' + String(id || '').slice(0, 8);
  }
  function programName(id) {
    return !id ? 'General practical support' : (state.programs.find(p => p.program_id === id)?.programs?.name || 'Program ' + id.slice(0, 8));
  }
  function when(v) { const d = new Date(v); return v && !Number.isNaN(+d) ? d.toLocaleString() : ''; }
  async function refresh() {
    const page = active(); if (!page || document.hidden) return false;
    state.page = page; closeDialog();
    const ticket = ++state.nonce;
    try {
      attachAuth(); const {c, user} = context();
      message('Loading your current permissions…');
      if (page === 'collaboration-ops') {
        // Canonical Admin RPC. The database independently checks authorization.
        const allowed = await result(c.rpc('is_lellee_admin'));
        if (!current(ticket, user, page)) return false;
        if (allowed !== true) throw new Error('Admin access is required.');
        const data = await result(c.rpc('get_collaboration_operations_summary'));
        if (!current(ticket, user, page)) return false;
        state.data = data; renderAdmin(data); message('Updated.'); return true;
      }
      const name = page === 'trusted-circle' ? 'get_my_trusted_circle_summary' : 'get_my_supporter_dashboard';
      const [data, labels, programs] = await Promise.all([
        result(c.rpc(name)), result(c.rpc('get_my_circle_participants')),
        result(c.from('program_collaboration_settings').select('*,programs(id,name)'))
      ]);
      if (!current(ticket, user, page)) return false;
      state.data = data || {}; state.labels = labels || []; state.programs = programs || [];
      page === 'trusted-circle' ? renderOwner(state.data) : renderSupporter(state.data);
      message('Updated. Shared information is shown only while current permission allows it.'); return true;
    } catch (err) {
      if (ticket !== state.nonce) return false;
      clear(); message(err.message || 'Unable to load Trusted Circle. Please refresh.', true); return false;
    }
  }
  function renderOwner(d) {
    const s = d.summary || {};
    ['Members','ActiveShares','SharedTasks','Checkins'].forEach((k, i) => text('circle' + k, s[['members','active_shares','shared_tasks','open_checkins'][i]]));
    list('circlePeopleList', (d.people || []).map(x => row(person(x.id), `${x.role_label} · ${x.status} · ${programName(x.program_id)}`,
      [x.status === 'active' ? button('Pause', 'pause', x.id) : null, button('Revoke', 'revoke', x.id)].filter(Boolean))));
    list('circleSharingList', (d.shares || []).map(x => row(x.scope_label, `${person(x.relationship_id)} · ${programName(x.program_id)}${x.expires_at ? ' · ends ' + when(x.expires_at) : ' · no expiration'}`,
      [button('Revoke', 'revoke-share', x.id)])), 'No sharing permissions currently in effect.');
    list('circleTaskList', (d.tasks || []).map(x => row(x.title, `${person(x.relationship_id)} · ${x.status}${x.due_label ? ' · due ' + x.due_label : ''}`,
      [x.status !== 'completed' ? button('Complete', 'owner-task-complete', x.id) : null, button('Remove', 'delete-task', x.id)].filter(Boolean))));
    list('circleAppointmentList', (d.appointments || []).map(x => row(x.title, `${person(x.relationship_id)} · ${when(x.starts_at)} · ${x.location_label || ''}`,
      [button('Remove', 'delete-appointment', x.id)])));
    list('circleCheckinList', (d.checkins || []).map(x => row(x.title, `${person(x.relationship_id)} · ${x.status}${x.response_label ? ' · ' + x.response_label : ''}`,
      [button('Cancel request', 'cancel-checkin', x.id)])));
    list('circleEmergencyList', (d.emergency_contacts || []).map(x => row(x.label, `${x.relationship_label || ''} · ${x.phone_masked || 'No phone recorded'} · private to you`,
      [button('Remove', 'delete-contact', x.id)])));
  }
  function renderSupporter(d) {
    const s = d.summary || {};
    ['People','Tasks','Checkins','Shares'].forEach(k => text('supporter' + k, s[k.toLowerCase()]));
    list('circleIncomingList', (d.invitations || []).map(x => row(person(x.id), `${x.role_label} · ${programName(x.program_id)} · invitation`,
      [button('Accept', 'accept', x.id), button('Decline', 'decline', x.id)])), 'No pending invitations.');
    list('supporterRelationshipList', (d.relationships || []).map(x => row(person(x.id), `${x.role_label} · ${x.status} · ${programName(x.program_id)}`,
      [button('Leave', 'leave', x.id)])));
    list('supporterTaskList', (d.tasks || []).map(x => row(x.title, `${person(x.relationship_id)} · ${x.status}${x.due_label ? ' · due ' + x.due_label : ''}`,
      x.assigned_to === 'owner' ? [] : [button('Mark complete', 'respond-task', x.id)])));
    list('circleSupporterCheckins', (d.checkins || []).map(x => row(x.title, `${person(x.relationship_id)} · ${x.status}`,
      [x.status === 'requested' ? button('Acknowledge', 'ack-checkin', x.id) : null, button('Respond / complete', 'respond-checkin', x.id)].filter(Boolean))));
    list('circleSupporterAppointments', (d.appointments || []).map(x => row(x.title, `${person(x.relationship_id)} · ${when(x.starts_at)} · ${x.location_label || ''}`)));
  }
  function renderAdmin(d) {
    const s = d.summary || {};
    ['Relationships','Shares','Expired','Programs'].forEach(k => text('collabOps' + k, s[k.toLowerCase()]));
    list('collabRoleList', (d.roles || []).map(x => row(x.label, x.description + ' · ' + x.status)));
    list('collabScopeList', (d.scopes || []).map(x => row(x.label, x.description + (x.sensitive ? ' · restricted' : ''))));
    list('collabRelationshipList', (d.relationships || []).map(x => row(x.role_label, `${x.status} · ${x.share_count} permission records`)));
    list('collabProgramList', (d.programs || []).map(x => row(x.program_name, `${x.status} · ${x.collaboration_enabled ? 'enabled' : 'off'}`)));
    list('collabGuardrailList', (d.guardrails || []).map(x => row(x.label, x.detail)));
  }
  function field(name, label, type = 'text', attrs = {}) {
    const input = node(type === 'textarea' ? 'textarea' : 'input', {name, id: 'circleField-' + name, ...(type === 'textarea' ? {} : {type}), ...attrs});
    return node('label', {class: 'circle-ui-field'}, [node('span', {text: label}), input]);
  }
  function select(name, label, options) {
    return node('label', {class: 'circle-ui-field'}, [node('span', {text: label}),
      node('select', {name, id: 'circleField-' + name, required: true},
        [node('option', {value: '', text: 'Choose…'}), ...options.map(([v, l]) => node('option', {value: v, text: l}))])]);
  }
  function consent(note) {
    return node('label', {class: 'circle-ui-consent'}, [node('input', {type: 'checkbox', name: 'confirm', required: true}), node('span', {text: note})]);
  }
  function form(title, help, fields, actionLabel, submit) {
    const {user} = context(); closeDialog();
    const page = state.page, epoch = state.nonce;
    const d = node('dialog', {id: 'lelleeCircleDialog', 'aria-labelledby': 'circleDialogTitle'});
    const f = node('form'); const error = node('p', {role: 'alert', class: 'circle-ui-error'});
    const save = node('button', {type: 'submit', class: 'approved-small-action', text: actionLabel});
    const cancel = node('button', {type: 'button', class: 'approved-link', text: 'Cancel'});
    cancel.addEventListener('click', closeDialog);
    f.append(node('h2', {id: 'circleDialogTitle', text: title}), node('p', {text: help}), ...fields, error,
      node('div', {class: 'circle-ui-actions'}, [cancel, save]));
    let submitting = false;
    f.addEventListener('submit', async event => {
      event.preventDefault(); if (submitting || !f.reportValidity()) return;
      if (user !== uid() || epoch !== state.nonce || active() !== page) { closeDialog(); return; }
      submitting = true; save.disabled = true; error.textContent = '';
      try {
        context();
        const out = await submit(new FormData(f), user);
        if (out === false) throw new Error('The permission or record changed. Refresh before trying again.');
        if (user !== uid() || epoch !== state.nonce || active() !== page) return;
        closeDialog(); await refresh();
      } catch (err) {
        if (d.isConnected && user === uid()) error.textContent = err.message || 'Nothing could be saved.';
      } finally { submitting = false; save.disabled = false; }
    });
    d.addEventListener('close', () => { if (state.dialog === d) state.dialog = null; d.remove(); });
    d.append(f); document.body.append(d); state.dialog = d; d.showModal(); return f;
  }
  function recipientFields() {
    const rels = state.labels.filter(x => x.owner_view && x.status === 'active');
    if (!rels.length) throw new Error('Invite a trusted person and wait for their acceptance first.');
    return [select('relationship', 'Person', rels.map(x => [x.relationship_id, x.account_email + ' · ' + x.role_key])),
      select('program', 'Program scope', []), rels];
  }
  function wirePrograms(f, rels, kind) {
    const r = f.elements.relationship, p = f.elements.program;
    r.addEventListener('change', () => {
      const rel = rels.find(x => x.relationship_id === r.value);
      const items = rel ? state.programs.filter(x => x.collaboration_enabled && x.programs?.name &&
        (rel.role_key === 'case_manager' ? x.professional_support_roles_enabled : x.family_roles_enabled) &&
        (kind === 'task' ? x.shared_tasks_enabled : kind === 'appointment' ? x.shared_appointments_enabled : true) &&
        (!rel.program_id || x.program_id === rel.program_id)).map(x => [x.program_id, x.programs.name]) : [];
      if (rel && !rel.program_id) items.unshift(['general', 'General practical support (not program-specific)']);
      p.replaceChildren(node('option', {value: '', text: items.length ? 'Choose…' : 'No enabled scope available'}),
        ...items.map(([v,l]) => node('option', {value:v, text:l})));
    });
  }
  function iso(value, required = false) {
    if (!value && !required) return null;
    const d = new Date(value); if (!value || Number.isNaN(+d)) throw new Error('Enter a valid date and time.');
    return d.toISOString();
  }
  function scope(values, user) {
    if (!state.labels.some(x => x.relationship_id === values.get('relationship') && x.owner_view && x.status === 'active')) throw new Error('Select an active relationship.');
    const selected = values.get('program'); if (!selected) throw new Error('Select a program scope.');
    return {owner_user_id: user, relationship_id: values.get('relationship'), program_id: selected === 'general' ? null : selected};
  }
  async function create(kind) {
    if (state.busy) return; state.busy = true;
    try {
      // Refresh before opening a person picker; no first-person or program defaults.
      const refreshed = await refresh(); if (!refreshed || !state.data || active() !== 'trusted-circle') return;
      const c = context().c;
      if (kind === 'invite') {
        form('Invite a trusted person', 'Use their verified Lellee account email. Your account email will be visible to them in this invitation. This creates an in-app invitation, not an email notification.',
          [field('email','Their Lellee account email','email',{required:true,maxlength:320}),
            select('role','Relationship role', ['family','caregiver','mentor','case_manager','advocate','friend','other'].map(x=>[x,x.replace('_',' ')])),
            consent('I want to invite this account. Nothing is shared until they accept and I choose what to share.')], 'Create invitation',
          v => result(c.rpc('invite_trusted_circle_member',{p_email:v.get('email').trim(),p_role_key:v.get('role')}))); return;
      }
      if (kind === 'contact') {
        form('Private emergency contact', 'This record is private to you. Lellee will not automatically contact this person.',
          [field('label','Contact name','text',{required:true,maxlength:200}), field('relation','Relationship','text',{maxlength:200}),
            field('phone','Phone (optional)','tel',{maxlength:100})], 'Save private contact',
          (v,u) => result(c.from('trusted_circle_emergency_contacts').insert({user_id:u,label:v.get('label').trim(),relationship_label:v.get('relation').trim()||null,phone_masked:v.get('phone').trim()||null,status:'active'}))); return;
      }
      const [personField,programField,rels] = recipientFields();
      if (kind === 'share') {
        const f = form('Choose a sharing permission', 'This permission covers only the tasks or appointments you explicitly save for this person and program. It does not include journals, messages or safety activity.',
          [personField,programField,select('scope','What may they see?',[['shared_tasks','Selected shared tasks'],['shared_appointments','Selected shared appointments']]),
            field('starts','Starts (local time; blank means now)','datetime-local'),field('expires','Ends (local time; blank means no expiration)','datetime-local'),
            consent('I authorize this person to see my selected records in this category and program during this time window.')], 'Save permission',
          async(v,u) => {
            const starts=iso(v.get('starts')) || new Date().toISOString(), ends=iso(v.get('expires'));
            if (ends && (+new Date(ends)<=Date.now() || ends<=starts)) throw new Error('The end must be later than now and the start.');
            const payload={...scope(v,u),scope_key:v.get('scope'),starts_at:starts,expires_at:ends};
            let query=c.from('trusted_circle_shares').select('id').eq('relationship_id',payload.relationship_id).eq('scope_key',payload.scope_key);
            query=payload.program_id===null?query.is('program_id',null):query.eq('program_id',payload.program_id);
            const rows=await result(query);
            // No silent upsert or automatic reactivation of an earlier consent record.
            if ((rows||[]).length) throw new Error('A permission record already exists for this category and program. Use Manage permission history to remove the old grant before creating a replacement.');
            if (u!==uid() || !f.isConnected) throw new Error('Account or page changed. Nothing was submitted.');
            return result(c.from('trusted_circle_shares').insert(payload));
          }); wirePrograms(f,rels,'checkin'); return;
      }
      const appointment=kind==='appointment', checkin=kind==='checkin';
      const table=appointment?'trusted_circle_shared_appointments':checkin?'trusted_circle_checkins':'trusted_circle_shared_tasks';
      const f=form(appointment?'Selected appointment':checkin?'Practical check-in request':'Selected shared task',
        checkin?'Only this practical request is sent to the selected supporter. It is not your private daily check-in, mood or safety history.':
          'Saving selects this record for this person and program. They can read it only while the matching sharing permission is active.',
        [personField,programField,field('title',checkin?'Request':'Title','text',{required:true,maxlength:300}),
          field('due',appointment?'Appointment date/time (local)':checkin?'Due date/time (local, optional)':'Due date (optional)',appointment||checkin?'datetime-local':'date',{required:appointment}),
          ...(appointment?[field('location','Location (optional)','text',{maxlength:1000})]:[]),
          consent('I selected this person and program and want to save this record for that collaboration.')], 'Save',
        (v,u)=> {
          const p={...scope(v,u),title:v.get('title').trim()};
          if(appointment) Object.assign(p,{starts_at:iso(v.get('due'),true),location_label:v.get('location').trim()||null,status:'scheduled'});
          else if(checkin) Object.assign(p,{due_at:iso(v.get('due')),status:'requested'});
          else Object.assign(p,{due_on:v.get('due')||null,status:'open'});
          return result(c.from(table).insert(p));
        }); wirePrograms(f,rels,kind);
    } catch(err) {message(err.message,true);} finally {state.busy=false;}
  }
  async function history() {
    const {c,user}=context(), epoch=state.nonce, page=active();
    const rows=await result(c.from('trusted_circle_shares').select('id,relationship_id,scope_key,program_id,status,starts_at,expires_at').eq('owner_user_id',user));
    if(!current(epoch,user,page))return;
    const choices=(rows||[]).map(x=>[x.id,`${person(x.relationship_id)} · ${x.scope_key.replace('shared_','')} · ${programName(x.program_id)} · ${x.status} · ${when(x.starts_at)}${x.expires_at?' to '+when(x.expires_at):''}`]);
    if(!choices.length){message('No permission history.');return;}
    form('Manage permission history','Removing a record also removes that permission. Create a new explicit permission afterward only when appropriate.',
      [select('grant','Permission record',choices),consent('Remove this permission record.')],'Remove permission',
      v=>result(c.from('trusted_circle_shares').delete().eq('id',v.get('grant')).eq('owner_user_id',user).select('id')).then(x=>Boolean(x?.length)));
  }
  function confirmAction(action,id) {
    const {c,user}=context();
    const relation=['accept','decline','pause','revoke','leave'].includes(action);
    const labels={accept:'Accept invitation',decline:'Decline invitation',pause:'Pause access',revoke:'Revoke access',leave:'Leave relationship',
      'revoke-share':'Revoke sharing','owner-task-complete':'Complete task','delete-task':'Remove task','delete-appointment':'Remove appointment',
      'delete-contact':'Remove private contact','cancel-checkin':'Cancel request','respond-task':'Complete shared task','ack-checkin':'Acknowledge request','respond-checkin':'Complete request'};
    if(!labels[action])return;
    const help=relation?`${labels[action]} for ${person(id)}? Acceptance does not give account login access or automatically share private records.`:
      'Confirm this action on the selected record. Revocation stops later authorized reads; it cannot remove a copy already viewed or saved.';
    form(labels[action],help,[...(action==='respond-checkin'?[field('response','Reply (optional)','textarea',{maxlength:2000})]:[])],labels[action],async v=>{
      if(relation)return result(c.rpc('respond_trusted_circle_relationship',{p_relationship_id:id,p_action:action}));
      if(action==='revoke-share')return result(c.rpc('revoke_trusted_circle_share',{p_share_id:id}));
      if(action==='respond-task'||action==='ack-checkin'||action==='respond-checkin')return result(c.rpc('respond_trusted_circle_item',{
        p_item_kind:action==='respond-task'?'task':'checkin',p_item_id:id,p_status:action==='ack-checkin'?'acknowledged':'completed',p_response:v.get('response')||null}));
      const table=action.includes('appointment')?'trusted_circle_shared_appointments':action.includes('contact')?'trusted_circle_emergency_contacts':
        action.includes('checkin')?'trusted_circle_checkins':'trusted_circle_shared_tasks';
      let query=c.from(table);
      query=action.startsWith('delete-')?query.delete():query.update({status:action==='cancel-checkin'?'cancelled':'completed'});
      const rows=await result(query.eq('id',id).eq(table.endsWith('contacts')?'user_id':'owner_user_id',user).select('id'));
      return Boolean(rows?.length);
    });
  }
  function addSection(parentId,id,title) {
    const p=$('#'+parentId);if(!p||$('#'+id))return;
    p.append(node('section',{class:'circle-card'},[node('h3',{text:title}),node('div',{class:'circle-list',id})]));
  }
  function mount() {
    roots().forEach(r=>{
      if(!r.querySelector('[data-circle-ui-status]')) r.querySelector('.approved-inner-head')?.after(
        node('div',{class:'circle-ui-toolbar'},[node('p',{'data-circle-ui-status':true,role:'status','aria-live':'polite'}),button('Refresh','refresh')]));
    });
    if($('#circlePanelSharing')&&!$('#circleNewPermission')) $('#circlePanelSharing').prepend(
      node('div',{class:'circle-ui-actions'},[button('Add permission','new-share',null,{id:'circleNewPermission'}),button('Manage permission history','history')]));
    if($('#circlePanelTasks')&&!$('#circleNewAppointment')) $('#circlePanelTasks .commerce-panel-head')?.append(button('Add appointment','new-appointment',null,{id:'circleNewAppointment'}));
    addSection('circlePanelTasks','circleAppointmentList','Selected appointments');
    const supporter=$('#page-supporter-dashboard .approved-inner');
    if(supporter&&!$('#circleIncomingList')) {
      const s=node('section',{class:'circle-card'},[node('h3',{text:'Invitations for you'}),node('div',{id:'circleIncomingList',class:'circle-list'})]);
      supporter.querySelector('.circle-summary-grid')?.after(s);
    }
    if(supporter&&!supporter.id)supporter.id='circleSupporterInner';
    addSection('circleSupporterInner','circleSupporterCheckins','Practical check-in requests');
    addSection('circleSupporterInner','circleSupporterAppointments','Selected appointments');
    [['circleAddPerson','new-invite'],['circleAddSharedTask','new-task'],['circleRequestCheckin','new-checkin'],['circleAddEmergency','new-contact']].forEach(([id,a])=>{
      const b=$('#'+id);if(b){b.type='button';b.dataset.circleAction=a;}
    });
  }
  function attachAuth() {
    const c=client();if(!c||c===state.client)return;
    state.subscription?.unsubscribe?.();state.client=c;state.authKnown=false;state.authUser=null;
    const {data}=c.auth.onAuthStateChange((event,session)=>{
      const next=session?.user?.id||null;
      const changed=!state.authKnown||next!==state.authUser;
      state.authKnown=true;state.authUser=next;
      if(changed||event==='SIGNED_OUT') {
        clear();
        // Never await Supabase inside its Auth callback.
        if(next)setTimeout(()=>{if(next===uid()&&active()&&!document.hidden)refresh();},0);
        else message('Sign in to use your private Trusted Circle.');
      }
    });state.subscription=data?.subscription;
  }
  function pageChange() {
    const p=active();if(p!==state.page){clear();state.page=p;}
    if(p){mount();attachAuth();refresh();}
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||!roots().some(r=>r.contains(b)))return;
    const tab=b.dataset.circleTab,collab=b.dataset.collabTab;
    if(tab){
      $$('[data-circle-tab]').forEach(x=>x.classList.toggle('active',x===b));
      ['people','sharing','tasks','checkins','emergency'].forEach(k=>$('#circlePanel'+k[0].toUpperCase()+k.slice(1))?.classList.toggle('hidden',k!==tab));return;
    }
    if(collab){
      $$('[data-collab-tab]').forEach(x=>x.classList.toggle('active',x===b));
      ['roles','scopes','relationships','programs','guardrails'].forEach(k=>$('#collabPanel'+k[0].toUpperCase()+k.slice(1))?.classList.toggle('hidden',k!==collab));return;
    }
    const a=b.dataset.circleAction;if(!a)return;event.preventDefault();
    Promise.resolve().then(()=>{
      if(a==='refresh')return refresh();if(a.startsWith('new-'))return create(a.slice(4));
      if(a==='history')return history();return confirmAction(a,b.dataset.circleId);
    }).catch(err=>message(err.message,true));
  });
  document.addEventListener('lellee:pagechange',pageChange);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else if(active())refresh();});
  window.addEventListener('pagehide',clear);
  window.addEventListener('pageshow',()=>{if(active())refresh();});
  window.addEventListener('focus',()=>{if(active()&&!state.dialog&&!document.hidden)refresh();});
  function init(){mount();attachAuth();pageChange();}
  window.LelleeCircleUI=Object.freeze({version:VERSION,refresh,clear});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
