(() => {
  'use strict';

  const B4 = {
    supportPeople: [], meetings: [], groups: [], groupMemberships: [],
    membership: { service_tier: 'free', status: 'active' }, catalog: [],
    editingSupportId: null, editingMeetingId: null
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const client = () => (typeof sb !== 'undefined' ? sb : null);

  async function user() {
    if (typeof currentUser !== 'undefined' && currentUser?.id) return currentUser;
    const c = client(); if (!c) return null;
    const { data } = await c.auth.getUser();
    return data?.user || null;
  }

  function esc(value = '') {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[ch]);
  }
  function normalize(value = '') { return String(value).toLowerCase().trim().replace(/\s+/g, ' '); }
  function digits(value = '') { return String(value).replace(/\D/g, ''); }
  function toast(message, type = 'success') {
    $('#b4Toast')?.remove();
    const el = document.createElement('div'); el.id = 'b4Toast'; el.className = `b4-toast ${type === 'error' ? 'error' : ''}`; el.textContent = message;
    document.body.appendChild(el); setTimeout(() => el.remove(), 3600);
  }
  function capture(id, handler) {
    const el = document.getElementById(id); if (!el || el.dataset.b4Capture === 'true') return;
    el.dataset.b4Capture = 'true';
    el.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); handler(event); }, true);
  }
  function navigate(page) {
    const btn = document.querySelector(`[data-page="${page}"]`);
    if (btn) btn.click(); else if (typeof showPage === 'function') showPage(page);
  }
  function localDate(date = new Date()) {
    const p = new Intl.DateTimeFormat('en-CA', {year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).reduce((a,x)=>{if(x.type!=='literal')a[x.type]=x.value;return a;},{});
    return `${p.year}-${p.month}-${p.day}`;
  }
  const RELATIONSHIPS = {
    friend:'Friend', family_member:'Family Member', sponsor:'Sponsor', lellee_coach:'Lellee Coach',
    counselor_therapist:'Counselor / Therapist', peer_support:'Peer Support', case_manager:'Case Manager',
    faith_spiritual:'Faith / Spiritual Support', other:'Other'
  };
  const MEETING_TYPES = {
    peer_support:'Peer Support', twelve_step:'12-Step', smart_skills:'SMART / Skills-Based',
    counseling_therapy:'Counseling / Therapy', medication_supported:'Medication-Supported',
    faith_spiritual:'Faith / Spiritual', other:'Other'
  };
  const TIER_RANK = { free: 0, plus: 1, premium: 2 };

  /* ---------------- SUPPORT PEOPLE ---------------- */
  function enhanceSupportForm() {
    const input = $('#supportRelationship');
    if (input && input.tagName !== 'SELECT') {
      const select = document.createElement('select'); select.id = 'supportRelationship';
      select.innerHTML = Object.entries(RELATIONSHIPS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
      input.replaceWith(select);
      const other = document.createElement('input'); other.id = 'supportRelationshipOther'; other.className = 'b4-other-field hidden'; other.placeholder = 'Describe the relationship';
      select.insertAdjacentElement('afterend', other);
    }
    const select = $('#supportRelationship');
    if (select && !$('#supportRelationshipOther')) {
      const other = document.createElement('input'); other.id = 'supportRelationshipOther'; other.className = 'b4-other-field hidden'; other.placeholder = 'Describe the relationship';
      select.insertAdjacentElement('afterend', other);
    }
    select?.addEventListener('change', () => $('#supportRelationshipOther')?.classList.toggle('hidden', select.value !== 'other'));
  }

  function openSupportEditor(row = null) {
    enhanceSupportForm(); B4.editingSupportId = row?.id || null;
    $('#supportName').value = row?.name || '';
    $('#supportRelationship').value = row?.relationship || 'friend';
    $('#supportRelationshipOther').value = row?.relationship_other || '';
    $('#supportRelationshipOther').classList.toggle('hidden', $('#supportRelationship').value !== 'other');
    $('#supportPhone').value = row?.phone || '';
    $('#supportEmail').value = row?.email || '';
    $('#supportPrimary').checked = Boolean(row?.is_primary);
    const head = $('#supportForm .approved-planner-head b'); if (head) head.textContent = row ? 'Edit support person' : 'Add support person';
    $('#saveSupportPerson').textContent = row ? 'Save Changes' : 'Save Person';
    $('#supportForm').classList.remove('hidden');
    $('#supportName').focus();
  }
  function closeSupportEditor() { B4.editingSupportId = null; $('#supportForm')?.classList.add('hidden'); }

  async function saveSupportPerson() {
    const c = client(), u = await user(); if (!c || !u) return toast('Sign in to save a support person.', 'error');
    const name = $('#supportName')?.value.trim(); if (!name) return toast('Enter the person’s name.', 'error');
    const relationship = $('#supportRelationship')?.value || 'other';
    const phone = $('#supportPhone')?.value.trim() || null, email = $('#supportEmail')?.value.trim().toLowerCase() || null;
    const payload = {
      user_id:u.id, name, relationship,
      relationship_other: relationship === 'other' ? ($('#supportRelationshipOther')?.value.trim() || null) : null,
      phone, email, is_primary:Boolean($('#supportPrimary')?.checked), active:true,
      dedupe_key:`${normalize(name)}|${digits(phone)}|${normalize(email)}`
    };
    if (payload.is_primary) await c.from('lellee_support_people').update({is_primary:false}).eq('user_id',u.id);
    let result;
    if (B4.editingSupportId) result = await c.from('lellee_support_people').update(payload).eq('id',B4.editingSupportId).eq('user_id',u.id);
    else result = await c.from('lellee_support_people').upsert(payload,{onConflict:'user_id,dedupe_key'});
    if (result.error) return toast(result.error.message, 'error');
    const wasEditing = Boolean(B4.editingSupportId);
    closeSupportEditor(); await loadSupportPeople(); toast(wasEditing ? 'Support person updated.' : 'Support person saved.');
  }

  async function loadSupportPeople() {
    const c = client(), u = await user(); if (!c || !u) return;
    const {data,error} = await c.from('lellee_support_people').select('*').eq('user_id',u.id).eq('active',true).order('is_primary',{ascending:false}).order('name');
    if (error) return; B4.supportPeople = data || []; renderSupportPeople();
  }
  function supportMeta(row) {
    const relationship = row.relationship === 'other' ? (row.relationship_other || 'Other') : (RELATIONSHIPS[row.relationship] || row.relationship);
    const parts = [`<span>${esc(relationship)}</span>`];
    if (row.phone) parts.push(`<a href="tel:${esc(row.phone)}">${esc(row.phone)}</a>`);
    if (row.email) parts.push(`<a href="mailto:${esc(row.email)}">${esc(row.email)}</a>`);
    return parts.join('');
  }
  function renderSupportPeople() {
    const list = $('#supportPeopleList');
    if (list) list.innerHTML = B4.supportPeople.length ? B4.supportPeople.map(row => `<div class="approved-list-row b4-person-row"><span>♡</span><div><b>${esc(row.name)}${row.is_primary?'<em class="b4-primary-badge">Primary</em>':''}</b><div class="b4-support-meta">${supportMeta(row)}</div></div><div class="b4-row-actions"><button data-b4-primary-support="${row.id}">${row.is_primary?'Primary':'Make Primary'}</button><button data-b4-edit-support="${row.id}">Edit</button><button class="danger" data-b4-delete-support="${row.id}">Delete</button></div></div>`).join('') : '<div class="b4-empty">No support people saved yet.</div>';
    const help = $('#helpSupportList');
    if (help) help.innerHTML = B4.supportPeople.length ? B4.supportPeople.slice(0,3).map(row => `<div class="approved-list-row"><span>♡</span><div><b>${esc(row.name)}</b><small>${esc(row.relationship === 'other' ? row.relationship_other || 'Support person' : RELATIONSHIPS[row.relationship] || 'Support person')}</small></div>${row.phone?`<a class="approved-link" href="tel:${esc(row.phone)}">Call</a>`:'<button class="approved-link" data-page="support-network">Open</button>'}</div>`).join('') : '<div class="b4-empty">Add someone you trust in My Support.</div>';
    const headline = $('#communitySupportHeadline'), text = $('#communitySupportText');
    if (headline) headline.textContent = B4.supportPeople.length ? `${B4.supportPeople.length} person${B4.supportPeople.length===1?'':'s'} in your support network` : 'Your support network';
    if (text && B4.supportPeople[0]) text.textContent = `${B4.supportPeople[0].name}${B4.supportPeople[0].is_primary?' is your primary support person.': ' and your saved contacts stay private.'}`;
  }
  async function updateSupport(id, changes) { const c=client(),u=await user(); if(!c||!u)return; if(changes.is_primary) await c.from('lellee_support_people').update({is_primary:false}).eq('user_id',u.id); const {error}=await c.from('lellee_support_people').update(changes).eq('id',id).eq('user_id',u.id); if(error)return toast(error.message,'error'); await loadSupportPeople(); }

  /* ---------------- MEETINGS ---------------- */
  function addMeetingField(labelText, element) { const label=document.createElement('label'); label.textContent=labelText; label.appendChild(element); return label; }
  function enhanceMeetingForm() {
    const form = $('#meetingForm'); if (!form || $('#b4MeetingFields')) return;
    const day = $('#meetingDay'); if (day && ![...day.options].some(o=>o.value==='')) day.insertAdjacentHTML('afterbegin','<option value="">Choose day</option>');
    const box = document.createElement('div'); box.id='b4MeetingFields';
    box.innerHTML = `<div class="approved-field-row"><label>Support type<select id="b4MeetingType">${Object.entries(MEETING_TYPES).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select><input class="b4-other-field hidden" id="b4MeetingTypeOther" placeholder="Describe the meeting type"/></label><label>Recurrence<select id="b4MeetingRecurrence"><option value="weekly">Weekly</option><option value="one_time">One time</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option><option value="custom">Custom</option></select></label></div><div class="approved-field-row"><label>Exact date (optional)<input id="b4MeetingDate" type="date"/></label><label>End time (optional)<input id="b4MeetingEndTime" type="time"/></label></div><div class="approved-field-row"><label>Reminder<select id="b4MeetingReminder"><option value="0">No reminder</option><option value="15">15 minutes before</option><option selected value="30">30 minutes before</option><option value="60">1 hour before</option><option value="120">2 hours before</option><option value="1440">1 day before</option></select></label><label>Timezone<input id="b4MeetingTimezone" readonly/></label></div><label>Notes (optional)<textarea id="b4MeetingNotes" maxlength="1000" placeholder="Anything useful to remember"></textarea></label><p class="b4-form-note">Add an exact date for one-time events. Weekly meetings can use the day and time fields above.</p>`;
    $('#meetingLocation')?.closest('label')?.insertAdjacentElement('afterend', box);
    $('#b4MeetingTimezone').value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
    $('#b4MeetingType').addEventListener('change',()=>$('#b4MeetingTypeOther').classList.toggle('hidden',$('#b4MeetingType').value!=='other'));
    $('#b4MeetingDate').addEventListener('change',()=>{ if($('#b4MeetingDate').value){ const d=new Date(`${$('#b4MeetingDate').value}T12:00:00`); $('#meetingDay').value=String(d.getDay()); $('#b4MeetingRecurrence').value='one_time'; }});
  }
  function openMeetingEditor(row=null) {
    enhanceMeetingForm(); B4.editingMeetingId=row?.id||null;
    $('#meetingName').value=row?.title||''; $('#meetingFormat').value=row?.format||'in_person'; $('#meetingDay').value=row?.day_of_week??''; $('#meetingTime').value=row?.start_time?.slice(0,5)||''; $('#meetingLocation').value=row?.location_or_link||'';
    $('#b4MeetingType').value=row?.meeting_type||'peer_support'; $('#b4MeetingTypeOther').value=row?.meeting_type_other||''; $('#b4MeetingTypeOther').classList.toggle('hidden',$('#b4MeetingType').value!=='other');
    $('#b4MeetingRecurrence').value=row?.recurrence||'weekly'; $('#b4MeetingDate').value=row?.meeting_date||''; $('#b4MeetingEndTime').value=row?.end_time?.slice(0,5)||''; $('#b4MeetingReminder').value=String(row?.reminder_minutes??30); $('#b4MeetingNotes').value=row?.notes||''; $('#b4MeetingTimezone').value=row?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone;
    $('#meetingForm .approved-planner-head b').textContent=row?'Edit meeting':'Save a meeting'; $('#saveMeeting').textContent=row?'Save Changes':'Save Meeting'; $('#meetingForm').classList.remove('hidden'); $('#meetingName').focus();
  }
  function meetingKey(p){return `${normalize(p.title)}|${p.meeting_date||''}|${p.day_of_week??''}|${p.start_time||''}|${normalize(p.location_or_link)}`;}
  async function saveMeeting() {
    const c=client(),u=await user(); if(!c||!u)return toast('Sign in to save a meeting.','error');
    const title=$('#meetingName')?.value.trim(); if(!title)return toast('Enter a meeting name.','error');
    const date=$('#b4MeetingDate')?.value||null; let day=$('#meetingDay')?.value; day=day===''?null:Number(day);
    if(!date && day===null)return toast('Choose a day or an exact date.','error');
    const payload={user_id:u.id,title,meeting_type:$('#b4MeetingType')?.value||'peer_support',meeting_type_other:$('#b4MeetingType')?.value==='other'?$('#b4MeetingTypeOther')?.value.trim()||null:null,format:$('#meetingFormat')?.value||'in_person',day_of_week:day,meeting_date:date,start_time:$('#meetingTime')?.value||null,end_time:$('#b4MeetingEndTime')?.value||null,timezone:$('#b4MeetingTimezone')?.value||Intl.DateTimeFormat().resolvedOptions().timeZone,location_or_link:$('#meetingLocation')?.value.trim()||null,recurrence:$('#b4MeetingRecurrence')?.value||'weekly',reminder_minutes:Number($('#b4MeetingReminder')?.value||30),notes:$('#b4MeetingNotes')?.value.trim()||null,status:'active'};
    payload.client_event_key=meetingKey(payload);
    let result; if(B4.editingMeetingId) result=await c.from('lellee_meetings').update(payload).eq('id',B4.editingMeetingId).eq('user_id',u.id); else result=await c.from('lellee_meetings').upsert(payload,{onConflict:'user_id,client_event_key'});
    if(result.error)return toast(result.error.message,'error'); B4.editingMeetingId=null; $('#meetingForm').classList.add('hidden'); await loadMeetings(); toast('Meeting saved.');
  }
  async function loadMeetings(){const c=client(),u=await user();if(!c||!u)return;const {data,error}=await c.from('lellee_meetings').select('*').eq('user_id',u.id).neq('status','archived').order('meeting_date',{ascending:true,nullsFirst:false}).order('day_of_week').order('start_time');if(error)return;B4.meetings=data||[];renderMeetings();}
  function nextOccurrence(row){const now=new Date();const time=(row.start_time||'09:00').slice(0,5);if(row.meeting_date){const d=new Date(`${row.meeting_date}T${time}:00`);return d>=now?d:null;}if(row.day_of_week===null||row.day_of_week===undefined)return null;const d=new Date(now);d.setSeconds(0,0);const [h,m]=time.split(':').map(Number);d.setHours(h||0,m||0,0,0);let add=(Number(row.day_of_week)-d.getDay()+7)%7;if(add===0&&d<=now)add=7;d.setDate(d.getDate()+add);return d;}
  function fmtOccurrence(d){return d?new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(d):'Schedule not set';}
  function meetingRow(row){const next=nextOccurrence(row);return `<div class="approved-list-row"><span>▣</span><div><b>${esc(row.title)}</b><div class="b4-meeting-meta"><span>${esc(MEETING_TYPES[row.meeting_type]||'Meeting')}</span><span>${esc(row.format.replace('_',' '))}</span><span>${esc(fmtOccurrence(next))}</span>${row.location_or_link?`<span>${esc(row.location_or_link)}</span>`:''}</div></div><div class="b4-row-actions"><button data-b4-edit-meeting="${row.id}">Edit</button><button data-b4-pause-meeting="${row.id}">${row.status==='paused'?'Resume':'Pause'}</button><button class="danger" data-b4-delete-meeting="${row.id}">Archive</button></div></div>`;}
  function renderMeetings(){const active=B4.meetings.filter(x=>x.status==='active');const list=$('#meetingPlanList');if(list)list.innerHTML=B4.meetings.length?B4.meetings.map(meetingRow).join(''):'<div class="b4-empty">No saved meetings yet.</div>';const count=$('#savedMeetingCount');if(count)count.textContent=`${B4.meetings.length} saved`;const sorted=active.map(row=>({row,date:nextOccurrence(row)})).filter(x=>x.date).sort((a,b)=>a.date-b.date);const next=sorted[0];if($('#nextMeetingTitle'))$('#nextMeetingTitle').textContent=next?.row.title||'No meeting scheduled yet';if($('#nextMeetingMeta'))$('#nextMeetingMeta').textContent=next?`${fmtOccurrence(next.date)}${next.row.location_or_link?` · ${next.row.location_or_link}`:''}`:'Add a meeting in Recovery Planner and it will appear here.';if($('#communityMeetingHeadline'))$('#communityMeetingHeadline').textContent=next?next.row.title:'Your meeting plan';if($('#communityMeetingText'))$('#communityMeetingText').textContent=next?`Next: ${fmtOccurrence(next.date)}`:'Saved meetings appear here as part of your connection plan.';renderCalendarMeetings();}
  function renderCalendarMeetings(){const page=$('#page-calendar');if(!page)return;let section=$('#b4CalendarMeetings');if(!section){section=document.createElement('section');section.id='b4CalendarMeetings';section.className='b4-calendar-meetings';$('#calendarGrid')?.insertAdjacentElement('afterend',section);}const items=B4.meetings.filter(x=>x.status==='active').map(row=>({row,date:nextOccurrence(row)})).filter(x=>x.date).sort((a,b)=>a.date-b.date).slice(0,8);section.innerHTML=`<span class="approved-kicker">SAVED MEETINGS</span><h3>Dated and recurring meetings</h3><div class="b4-calendar-list">${items.length?items.map(({row,date})=>`<div class="b4-calendar-row"><div class="b4-calendar-date">${date.toLocaleDateString(undefined,{month:'short',day:'numeric'}).replace(' ','<br>')}</div><div><b>${esc(row.title)}</b><small>${esc(fmtOccurrence(date))}${row.location_or_link?` · ${esc(row.location_or_link)}`:''}</small></div><div class="b4-row-actions"><button data-b4-edit-meeting="${row.id}">Edit</button></div></div>`).join(''):'<div class="b4-empty">Add a date or weekly schedule to a meeting and it will appear here.</div>'}</div>`;}
  async function updateMeeting(id,changes){const c=client(),u=await user();if(!c||!u)return;const {error}=await c.from('lellee_meetings').update(changes).eq('id',id).eq('user_id',u.id);if(error)return toast(error.message,'error');await loadMeetings();}

  /* ---------------- GROUPS ---------------- */
  async function loadAccess(){const c=client(),u=await user();if(!c||!u)return;const [m,cat]=await Promise.all([c.from('lellee_memberships').select('*').eq('user_id',u.id).maybeSingle(),c.from('lellee_plan_catalog').select('*').eq('is_active',true).order('sequence')]);if(m.data)B4.membership=m.data;if(!cat.error)B4.catalog=cat.data||[];renderMembership();}
  async function loadGroups(){const c=client(),u=await user();if(!c||!u)return;const [g,m]=await Promise.all([c.from('lellee_support_groups').select('*').eq('is_active',true).eq('pathway','recovery').order('priority'),c.from('lellee_group_memberships').select('*').eq('user_id',u.id)]);if(!g.error)B4.groups=g.data||[];if(!m.error)B4.groupMemberships=m.data||[];renderGroups();}
  function renderGroups(){const community=$('#page-community .approved-inner');if(!community)return;let section=$('#b4RecommendedGroups');if(!section){section=document.createElement('section');section.id='b4RecommendedGroups';section.className='b4-group-section';const insight=$('#page-community .approved-insight-panel');insight?.insertAdjacentElement('beforebegin',section);}const tier=B4.membership?.service_tier||'free';const memberships=new Map(B4.groupMemberships.map(x=>[x.group_id,x]));const active=B4.groups.filter(g=>['requested','active'].includes(memberships.get(g.id)?.status));const accessible=B4.groups.filter(g=>(TIER_RANK[g.service_tier]??0)<=(TIER_RANK[tier]??0));const chosen=[];[...active,...accessible,...B4.groups].forEach(g=>{if(g&&!chosen.some(x=>x.id===g.id)&&chosen.length<2)chosen.push(g);});section.innerHTML=`<div class="b4-group-head"><div><span class="approved-kicker">RECOMMENDED GROUP SUPPORT</span><h3>Start with one group—not an endless directory.</h3><p>Lellee recommends one primary group and one closely related option. Additional groups can open as your needs and progress change.</p></div><span class="b4-group-limit">2 choices shown</span></div><div class="b4-group-grid">${chosen.map((g,i)=>{const mem=memberships.get(g.id);const locked=(TIER_RANK[g.service_tier]??0)>(TIER_RANK[tier]??0);const label=mem?.status==='active'?'Open Group':mem?.status==='requested'?'Request Sent':locked?`View ${g.service_tier}`:'Request to Join';return `<article class="b4-group-card ${i===0?'primary':''} ${locked?'locked':''}"><div class="top"><span>${i===0?'Primary recommendation':'Related option'}</span><em class="b4-status-badge">${g.service_tier}</em></div><h4>${esc(g.name)}</h4><p>${esc(g.summary)}</p><small>${esc(g.schedule_label||g.meeting_format)}</small><button ${mem?.status==='requested'?'disabled':''} data-b4-group="${g.id}" data-b4-group-tier="${g.service_tier}" data-b4-group-locked="${locked}">${label}</button></article>`;}).join('')||'<div class="b4-empty">Group recommendations will appear here.</div>'}</div>`;}
  async function requestGroup(id){const c=client(),u=await user();if(!c||!u)return;const group=B4.groups.find(x=>x.id===id);if(!group)return;const existingPrimary=B4.groupMemberships.some(x=>x.is_primary&&['requested','active'].includes(x.status));const {error}=await c.from('lellee_group_memberships').upsert({user_id:u.id,group_id:id,status:'requested',is_primary:!existingPrimary,requested_at:new Date().toISOString()},{onConflict:'user_id,group_id'});if(error)return toast(error.message,'error');await c.from('lellee_inbox_messages').upsert({recipient_user_id:u.id,message_key:`group-request:${id}`,message_type:'group',title:'Group request received',body:`Your request for ${group.name} was received. Lellee will show scheduling and availability when the group is ready.`,source_label:'Lellee Groups',action_page:'community'},{onConflict:'recipient_user_id,message_key'});await Promise.all([loadGroups(),loadInbox()]);toast('Group request saved.');}

  /* ---------------- INBOX + NOTIFICATIONS ---------------- */
  async function ensureWelcomeMessage(){const c=client(),u=await user();if(!c||!u)return;await c.from('lellee_inbox_messages').upsert({recipient_user_id:u.id,message_key:'build4-welcome',message_type:'system',title:'Your Lellee Inbox is ready',body:'In-app messages are on by default. Milestones, Lellee Coach messages, and group notices can appear here without exposing private journal content.',source_label:'Lellee',action_page:'notification-settings'},{onConflict:'recipient_user_id,message_key'});}
  async function loadInbox(){const c=client(),u=await user();if(!c||!u)return;await ensureWelcomeMessage();const {data,error}=await c.from('lellee_inbox_messages').select('*').eq('recipient_user_id',u.id).lte('visible_from',new Date().toISOString()).order('visible_from',{ascending:false}).limit(100);if(error)return;renderInbox(data||[]);}
  function renderInbox(rows){const list=$('#inboxList');const visible=rows.filter(x=>!x.expires_at||new Date(x.expires_at)>new Date());const unread=visible.filter(x=>!x.read_at);if($('#inboxUnreadCount'))$('#inboxUnreadCount').textContent=unread.length;if($('#inboxMessageCount'))$('#inboxMessageCount').textContent=visible.length;if($('#inboxMilestoneCount'))$('#inboxMilestoneCount').textContent=visible.filter(x=>x.message_type==='milestone').length;if($('#inboxCoachCount'))$('#inboxCoachCount').textContent=visible.filter(x=>['coaching','group'].includes(x.message_type)).length;if($('#todayInboxUnread'))$('#todayInboxUnread').textContent=unread.length;if($('#inboxNavBadge')){$('#inboxNavBadge').textContent=unread.length;$('#inboxNavBadge').classList.toggle('hidden',!unread.length);}if(!list)return;list.innerHTML=visible.length?visible.map(row=>`<button class="b4-inbox-row ${row.read_at?'':'unread'}" data-b4-message="${row.id}"><span class="b4-inbox-icon">${row.message_type==='milestone'?'◆':row.message_type==='group'?'◎':row.message_type==='coaching'?'♡':'✉'}</span><div><b>${esc(row.title)}</b><p>${esc(row.body)}</p><small>${esc(row.source_label||'Lellee')} · ${new Date(row.visible_from).toLocaleDateString()}</small></div>${row.read_at?'':'<i class="b4-inbox-dot"></i>'}</button>`).join(''):'<div class="b4-empty">Nothing in your inbox yet.</div>';B4.inboxRows=visible;}
  async function openMessage(id){const row=(B4.inboxRows||[]).find(x=>x.id===id);if(!row)return;const c=client(),u=await user();if(c&&u&&!row.read_at)await c.from('lellee_inbox_messages').update({read_at:new Date().toISOString()}).eq('id',id).eq('recipient_user_id',u.id);if($('#messageThreadTitle'))$('#messageThreadTitle').textContent=row.title;if($('#messageThreadMeta'))$('#messageThreadMeta').textContent=`${row.source_label||'Lellee'} · ${new Date(row.visible_from).toLocaleString()}`;if($('#messageThreadBody'))$('#messageThreadBody').innerHTML=`<div class="approved-reading-sheet"><p>${esc(row.body)}</p>${row.action_page?`<button class="approved-small-action" data-page="${esc(row.action_page)}">Open related area</button>`:''}</div>`;$('#messageReplyBox')?.classList.add('hidden');navigate('message-thread');await loadInbox();}
  async function markAllRead(){const c=client(),u=await user();if(!c||!u)return;await c.from('lellee_inbox_messages').update({read_at:new Date().toISOString()}).eq('recipient_user_id',u.id).is('read_at',null);await loadInbox();toast('Inbox marked read.');}
  async function loadNotifications(){const c=client(),u=await user();if(!c||!u)return;const {data,error}=await c.from('lellee_notification_preferences').select('*').eq('user_id',u.id).maybeSingle();if(error)return;const p=data||{};const setCheck=(id,v)=>{const e=$(`#${id}`);if(e)e.checked=Boolean(v);};const setValue=(id,v)=>{const e=$(`#${id}`);if(e&&v!==undefined&&v!==null)e.value=String(v).slice(0,5);};setCheck('prefInAppMessages',p.in_app_messages!==false);setCheck('prefMilestoneReminders',p.milestone_reminders!==false);setCheck('prefCoachMessages',p.coach_messages!==false);setCheck('prefPushEnabled',p.push_enabled);setCheck('prefPrivatePreviews',p.private_previews!==false);$$('[data-milestone-window]').forEach(e=>e.checked=(p.milestone_windows||[7,1,0]).includes(Number(e.value)));setValue('notifDailyEnabled',p.daily_enabled===false?'false':'true');setValue('notifDailyTime',p.daily_time||'09:00');setValue('notifMeetingEnabled',p.meeting_enabled===false?'false':'true');setValue('notifMeetingMinutes',p.meeting_minutes??30);setValue('notifMilestoneEnabled',p.milestone_reminders===false?'false':'true');setValue('notifWeeklyEnabled',p.weekly_enabled===false?'false':'true');setValue('notifWeeklyDay',p.weekly_day??0);setValue('notifWeeklyTime',p.weekly_time||'19:00');setValue('notifQuietStart',p.quiet_start||'21:00');setValue('notifQuietEnd',p.quiet_end||'08:00');}
  async function saveNotifications(){const c=client(),u=await user();if(!c||!u)return toast('Sign in to save notification settings.','error');const check=(id,fallback)=>{const e=$(`#${id}`);return e?Boolean(e.checked):fallback;};const value=(id,fallback)=>$(`#${id}`)?.value??fallback;const payload={user_id:u.id,in_app_messages:check('prefInAppMessages',true),milestone_reminders:check('prefMilestoneReminders',value('notifMilestoneEnabled','true')==='true'),coach_messages:check('prefCoachMessages',true),push_enabled:check('prefPushEnabled',false),private_previews:check('prefPrivatePreviews',true),milestone_windows:$$('[data-milestone-window]:checked').map(x=>Number(x.value)),daily_enabled:value('notifDailyEnabled','true')==='true',daily_time:value('notifDailyTime','09:00'),meeting_enabled:value('notifMeetingEnabled','true')==='true',meeting_minutes:Number(value('notifMeetingMinutes',30)),weekly_enabled:value('notifWeeklyEnabled','true')==='true',weekly_day:Number(value('notifWeeklyDay',0)),weekly_time:value('notifWeeklyTime','19:00'),quiet_start:value('notifQuietStart','21:00'),quiet_end:value('notifQuietEnd','08:00')};const {error}=await c.from('lellee_notification_preferences').upsert(payload,{onConflict:'user_id'});const msg=$('#notificationSettingsMsg');if(error){if(msg)msg.textContent=error.message;return toast(error.message,'error');}if(msg)msg.textContent='Saved';toast('Notification settings saved.');}

  /* ---------------- MEMBERSHIP ---------------- */
  const catalog = key => B4.catalog.find(x=>x.plan_key===key)||{};
  function price(item){if(item.monthly_price!==null&&item.monthly_price!==undefined)return `$${Number(item.monthly_price).toFixed(2)}/mo`;if(item.one_time_price!==null&&item.one_time_price!==undefined)return `$${Number(item.one_time_price).toFixed(2)}`;return 'Price at launch';}
  function renderMembership(){const plus=catalog('plus'),premium=catalog('premium'),journal=catalog('journal_companion'),coach=catalog('lellee_coach_addon'),extra=catalog('additional_coaching_15');if($('#plusPriceMonthly'))$('#plusPriceMonthly').textContent=plus.monthly_price==null?'TBD':`$${Number(plus.monthly_price).toFixed(2)}`;if($('#plusComparePrice'))$('#plusComparePrice').textContent=plus.monthly_price==null?'TBD':`$${Number(plus.monthly_price).toFixed(2)}`;if($('#plusStatusTitle'))$('#plusStatusTitle').textContent=`${(B4.membership.service_tier||'free').replace(/^./,x=>x.toUpperCase())} account`;if($('#plusStatusBadge'))$('#plusStatusBadge').textContent=(B4.membership.service_tier||'free').toUpperCase();if($('#startPlusMembership'))$('#startPlusMembership').textContent='Notify Me About Plus';const page=$('#page-plus .approved-inner');if(!page)return;let grid=$('#b4MembershipCatalog');if(!grid){grid=document.createElement('section');grid.id='b4MembershipCatalog';grid.className='b4-membership-catalog';$('#plusStatusBand')?.insertAdjacentElement('afterend',grid);}grid.innerHTML=`<article class="b4-membership-card"><span>LELLEE FREE</span><h3>Core support stays available</h3><div class="b4-membership-price">$0</div><p>Daily guidance, safety support, Journal, meetings, resources and basic progress.</p></article><article class="b4-membership-card"><span>LELLEE PLUS</span><h3>Structured extras</h3><div class="b4-membership-price">${price(plus)}</div><p>The final Plus price remains pending approval. No charge is activated by this build.</p></article><article class="b4-membership-card featured"><span>LELLEE PREMIUM</span><h3>Advanced personalized support</h3><div class="b4-membership-price">${price(premium)}</div><p>Advanced practices, longer-term planning and cross-pathway guidance.</p></article><div class="b4-addons"><div class="b4-addon"><b>Journal Companion · ${price(journal)}</b><small>Three-volume companion and collections.</small></div><div class="b4-addon"><b>Lellee Coach · ${price(coach)}</b><small>W-2 Lellee Coach; Premium required.</small></div><div class="b4-addon"><b>Extra 15-minute session · ${price(extra)}</b><small>Additional coaching check-in.</small></div></div>`;}
  async function requestPlusInterest(){const c=client(),u=await user();if(!c||!u)return toast('Sign in first.','error');const {error}=await c.from('lellee_membership_interests').upsert({user_id:u.id,product_key:'plus',status:'requested',metadata:{requested_from:'recovery_plus'}},{onConflict:'user_id,product_key'});if(error)return toast(error.message,'error');$('#startPlusMembership').textContent='Interest Saved ✓';toast('Lellee Plus interest saved. No charge was made.');}
  function showComparison(show=true){$('#plusComparison')?.classList.toggle('hidden',!show);if(show)$('#plusComparison')?.scrollIntoView({behavior:'smooth',block:'center'});}

  /* ---------------- BIND + PAGE REFRESH ---------------- */
  function bind() {
    enhanceSupportForm(); enhanceMeetingForm();
    capture('openSupportForm',()=>openSupportEditor()); capture('closeSupportForm',closeSupportEditor); capture('saveSupportPerson',saveSupportPerson);
    capture('openMeetingForm',()=>openMeetingEditor()); capture('saveMeeting',saveMeeting);
    capture('saveNotificationSettings',saveNotifications); capture('saveNotificationPrefs',saveNotifications); capture('resetNotificationPrefs',async()=>{const c=client(),u=await user();if(!c||!u)return;await c.from('lellee_notification_preferences').delete().eq('user_id',u.id);await c.from('lellee_notification_preferences').insert({user_id:u.id});await loadNotifications();toast('Notification defaults restored.');});
    capture('inboxMarkAllRead',markAllRead); capture('showPlusComparison',()=>showComparison(true)); capture('closePlusComparison',()=>showComparison(false)); capture('startPlusMembership',requestPlusInterest);

    document.addEventListener('click', async event => {
      const editSupport=event.target.closest('[data-b4-edit-support]'); if(editSupport){event.preventDefault();return openSupportEditor(B4.supportPeople.find(x=>x.id===editSupport.dataset.b4EditSupport));}
      const deleteSupport=event.target.closest('[data-b4-delete-support]'); if(deleteSupport){event.preventDefault();if(confirm('Remove this support person?'))return updateSupport(deleteSupport.dataset.b4DeleteSupport,{active:false,is_primary:false});}
      const primary=event.target.closest('[data-b4-primary-support]'); if(primary){event.preventDefault();return updateSupport(primary.dataset.b4PrimarySupport,{is_primary:true});}
      const editMeeting=event.target.closest('[data-b4-edit-meeting]'); if(editMeeting){event.preventDefault();navigate('planner');setTimeout(()=>openMeetingEditor(B4.meetings.find(x=>x.id===editMeeting.dataset.b4EditMeeting)),80);return;}
      const pause=event.target.closest('[data-b4-pause-meeting]'); if(pause){event.preventDefault();const row=B4.meetings.find(x=>x.id===pause.dataset.b4PauseMeeting);return updateMeeting(row.id,{status:row.status==='paused'?'active':'paused'});}
      const delMeeting=event.target.closest('[data-b4-delete-meeting]'); if(delMeeting){event.preventDefault();if(confirm('Archive this meeting?'))return updateMeeting(delMeeting.dataset.b4DeleteMeeting,{status:'archived'});}
      const group=event.target.closest('[data-b4-group]'); if(group){event.preventDefault();if(group.dataset.b4GroupLocked==='true')return navigate('plus');return requestGroup(group.dataset.b4Group);}
      const message=event.target.closest('[data-b4-message]'); if(message){event.preventDefault();return openMessage(message.dataset.b4Message);}
      const page=event.target.closest('[data-page]')?.dataset.page;
      if(page)setTimeout(()=>refreshPage(page),100);
    });
  }
  async function refreshPage(page){if(['support-network','help-now','community'].includes(page))await Promise.all([loadSupportPeople(),loadGroups()]);if(['meetings','planner','calendar','community'].includes(page))await loadMeetings();if(['inbox','message-thread'].includes(page))await loadInbox();if(['notification-settings','notifications'].includes(page))await loadNotifications();if(page==='plus')await loadAccess();}
  async function init(){bind();await Promise.all([loadAccess(),loadSupportPeople(),loadMeetings(),loadGroups(),loadInbox(),loadNotifications()]);setTimeout(()=>{const active=$('.page.active')?.id?.replace('page-','');if(active)refreshPage(active);},250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80),{once:true});else setTimeout(init,80);
})();
