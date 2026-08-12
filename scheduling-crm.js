
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let calendarDate=new Date(),coachBusiness=null,organization=null,isAdmin=false;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,action=''){
 return `<div class="crm-row"><div class="crm-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div>${action?`<button>${esc(action)}</button>`:'<span></span>'}</div>`;
}
async function loadCalendar(){
 const y=calendarDate.getFullYear(),m=calendarDate.getMonth();
 q('#calendarMonthLabel').textContent=calendarDate.toLocaleString(undefined,{month:'long',year:'numeric'});
 const start=new Date(y,m,1),end=new Date(y,m+1,0);
 const data=await rpc('get_my_calendar',{p_start_date:start.toISOString().slice(0,10),p_end_date:end.toISOString().slice(0,10)});
 if(!data)return;
 const events=data.events||[],summary=data.summary||{};
 q('#calendarUpcoming').textContent=summary.upcoming||0;q('#calendarCoaching').textContent=summary.coaching||0;q('#calendarMilestones').textContent=summary.milestones||0;q('#calendarReminders').textContent=summary.reminders||0;
 renderCalendar(y,m,events);
 q('#calendarUpcomingList').innerHTML=(data.upcoming||[]).length?(data.upcoming||[]).map(x=>row(iconFor(x.event_type),x.title,new Date(x.starts_at).toLocaleString())).join(''):'<div class="approved-resource-empty">Nothing upcoming.</div>';
}
function iconFor(t){return ({appointment:'◷',coach_session:'◎',group_session:'◉',milestone:'◆',reminder:'✦'})[t]||'•'}
function renderCalendar(y,m,events){
 const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),offset=first.getDay(),prevDays=new Date(y,m,0).getDate();
 let html=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<div class="calendar-day-head">${x}</div>`).join('');
 for(let i=0;i<42;i++){
  let d,muted=false,dateObj;
  if(i<offset){d=prevDays-offset+i+1;dateObj=new Date(y,m-1,d);muted=true}
  else if(i>=offset+days){d=i-offset-days+1;dateObj=new Date(y,m+1,d);muted=true}
  else{d=i-offset+1;dateObj=new Date(y,m,d)}
  const key=dateObj.toISOString().slice(0,10),today=key===new Date().toISOString().slice(0,10);
  const ev=events.filter(x=>String(x.starts_at).slice(0,10)===key).slice(0,3);
  html+=`<div class="calendar-day ${muted?'muted':''} ${today?'today':''}"><strong>${d}</strong>${ev.map(x=>`<span class="calendar-event-dot">${esc(x.title)}</span>`).join('')}</div>`;
 }
 q('#calendarGrid').innerHTML=html;
}
async function addPersonalAppointment(){
 const title=prompt('Appointment title:');if(!title)return;
 const when=prompt('Date and time (YYYY-MM-DD HH:MM):');if(!when)return;
 const {error}=await sb.from('life_appointments').insert({user_id:currentUser.id,title,scheduled_at:when.replace(' ','T'),status:'scheduled'});
 if(error)return toast(error.message,true);loadCalendar();
}

async function loadCoachCrm(){
 const {data:b}=await sb.from('coach_businesses').select('id,business_name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();
 coachBusiness=b||null;if(!b)return;
 q('#coachSchedulerName').textContent=b.public_name||b.business_name;
 const d=await rpc('get_coach_crm_summary',{p_business_id:b.id});if(!d)return;
 const s=d.summary||{};
 q('#coachSchedConsults').textContent=s.open_consultations||0;q('#coachSchedSessions').textContent=s.upcoming_sessions||0;q('#coachSchedFollowups').textContent=s.followups_due||0;q('#coachSchedOpenSlots').textContent=s.open_slots||0;
 q('#coachScheduleList').innerHTML=(d.sessions||[]).map(x=>row(x.session_scope==='group'?'◉':'◎',x.title,new Date(x.scheduled_start).toLocaleString()+' · '+x.status)).join('')||'<div class="approved-resource-empty">No upcoming sessions.</div>';
 q('#coachAvailabilityList').innerHTML=(d.availability||[]).map(x=>row('◷',x.label,`${x.day_label} · ${x.start_time}–${x.end_time}`)).join('')||'<div class="approved-resource-empty">No availability rules.</div>';
 q('#coachConsultationList').innerHTML=(d.consultations||[]).map(x=>row('?',x.label,`${x.status} · ${new Date(x.created_at).toLocaleDateString()}`,'Open')).join('')||'<div class="approved-resource-empty">No consultation requests.</div>';
 q('#coachFollowupList').innerHTML=(d.followups||[]).map(x=>row('→',x.title,`${x.status} · due ${x.due_at?new Date(x.due_at).toLocaleString():'unscheduled'}`,'Open')).join('')||'<div class="approved-resource-empty">No follow-ups due.</div>';
 q('#coachContactHistory').innerHTML=(d.history||[]).map(x=>row('✦',x.event_label,new Date(x.created_at).toLocaleString())).join('')||'<div class="approved-resource-empty">No contact history.</div>';
}
async function scheduleCoachSession(){
 if(!coachBusiness)return;
 const title=prompt('Session title:','Coaching Session');if(!title)return;
 const when=prompt('Date and time (YYYY-MM-DD HH:MM):');if(!when)return;
 const {error}=await sb.from('coach_schedule_events').insert({business_id:coachBusiness.id,created_by:currentUser.id,title,session_scope:'one_to_one',scheduled_start:when.replace(' ','T'),duration_minutes:50,status:'scheduled'});
 if(error)return toast(error.message,true);loadCoachCrm();
}
async function addAvailability(){
 if(!coachBusiness)return;
 const day=Number(prompt('Day of week: 0=Sunday ... 6=Saturday','1'));const start=prompt('Start time HH:MM','09:00');const end=prompt('End time HH:MM','17:00');
 if(start===null||end===null)return;
 const {error}=await sb.from('coach_availability_rules').insert({business_id:coachBusiness.id,user_id:currentUser.id,day_of_week:day,start_time:start,end_time:end,active:true});
 if(error)return toast(error.message,true);loadCoachCrm();
}
async function addCoachFollowup(){
 if(!coachBusiness)return;
 const title=prompt('Follow-up:');if(!title)return;
 const due=prompt('Due date/time YYYY-MM-DD HH:MM:','')||null;
 const {error}=await sb.from('crm_followups').insert({owner_user_id:currentUser.id,workspace_type:'coach',business_id:coachBusiness.id,title,due_at:due?due.replace(' ','T'):null,status:'open'});
 if(error)return toast(error.message,true);loadCoachCrm();
}
function setCoachTab(tab){qa('[data-coach-crm-tab]').forEach(b=>b.classList.toggle('active',b.dataset.coachCrmTab===tab));['schedule','availability','consultations','followups','history'].forEach(x=>q('#coachCrmPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}

async function loadOrgOutreach(){
 const {data:o}=await sb.from('organizations').select('id,name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();organization=o||null;if(!o)return;
 q('#orgOutreachName').textContent=o.public_name||o.name;
 const d=await rpc('get_organization_outreach_summary',{p_organization_id:o.id});if(!d)return;
 const s=d.summary||{};
 q('#orgOutreachInvites').textContent=s.pending_invites||0;q('#orgOutreachActive').textContent=s.active_users||0;q('#orgOutreachFollowups').textContent=s.followups_due||0;q('#orgOutreachAnnouncements').textContent=s.announcements||0;
 q('#orgOutreachList').innerHTML=(d.outreach||[]).map(x=>row('◇',x.label,`${x.status} · ${x.program_name||''}`,'Open')).join('')||'<div class="approved-resource-empty">No outreach items.</div>';
 q('#orgAnnouncementList').innerHTML=(d.announcements||[]).map(x=>row('✦',x.title,`${x.status} · ${new Date(x.created_at).toLocaleDateString()}`)).join('')||'<div class="approved-resource-empty">No announcements.</div>';
 q('#orgFollowupList').innerHTML=(d.followups||[]).map(x=>row('→',x.title,`${x.status} · ${x.due_at?new Date(x.due_at).toLocaleString():'unscheduled'}`)).join('')||'<div class="approved-resource-empty">No follow-ups.</div>';
 q('#orgContactHistory').innerHTML=(d.history||[]).map(x=>row('✦',x.event_label,new Date(x.created_at).toLocaleString())).join('')||'<div class="approved-resource-empty">No history.</div>';
}
async function newOrgAnnouncement(){
 if(!organization)return;
 const title=prompt('Announcement title:');if(!title)return;
 const body=prompt('Announcement message:');if(!body)return;
 const {error}=await sb.from('workspace_announcements').insert({workspace_type:'organization',organization_id:organization.id,title,body,status:'draft',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadOrgOutreach();
}
async function addOrgFollowup(){
 if(!organization)return;
 const title=prompt('Follow-up:');if(!title)return;
 const due=prompt('Due date/time YYYY-MM-DD HH:MM:','')||null;
 const {error}=await sb.from('crm_followups').insert({owner_user_id:currentUser.id,workspace_type:'organization',organization_id:organization.id,title,due_at:due?due.replace(' ','T'):null,status:'open'});
 if(error)return toast(error.message,true);loadOrgOutreach();
}
function setOrgTab(tab){qa('[data-org-crm-tab]').forEach(b=>b.classList.toggle('active',b.dataset.orgCrmTab===tab));['outreach','announcements','followups','history'].forEach(x=>q('#orgCrmPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}

async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
async function loadAdminComms(){
 if(!await checkAdmin())return;
 const d=await rpc('get_admin_communications_summary');if(!d)return;
 const s=d.summary||{};
 q('#commDrafts').textContent=s.drafts||0;q('#commScheduled').textContent=s.scheduled||0;q('#commSent').textContent=s.sent||0;q('#commPrograms').textContent=s.programs_targeted||0;
 q('#adminAnnouncementList').innerHTML=(d.announcements||[]).map(x=>row('✦',x.title,`${x.audience_type} · ${x.status} · ${new Date(x.created_at).toLocaleDateString()}`,'Open')).join('')||'<div class="approved-resource-empty">No communications yet.</div>';
}
async function newAdminAnnouncement(){
 const title=prompt('Announcement title:');if(!title)return;
 const body=prompt('Announcement message:');if(!body)return;
 const {error}=await sb.from('workspace_announcements').insert({workspace_type:'admin',audience_type:'all_users',title,body,status:'draft',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadAdminComms();
}

q('#calendarPrev')?.addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()-1,1);loadCalendar()});
q('#calendarNext')?.addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+1,1);loadCalendar()});
q('#calendarAddEvent')?.addEventListener('click',addPersonalAppointment);
qa('[data-coach-crm-tab]').forEach(b=>b.onclick=()=>setCoachTab(b.dataset.coachCrmTab));
qa('[data-org-crm-tab]').forEach(b=>b.onclick=()=>setOrgTab(b.dataset.orgCrmTab));
q('#coachScheduleSession')?.addEventListener('click',scheduleCoachSession);
q('#coachAddAvailability')?.addEventListener('click',addAvailability);
q('#coachAddFollowup')?.addEventListener('click',addCoachFollowup);
q('#orgNewAnnouncement')?.addEventListener('click',newOrgAnnouncement);
q('#orgAddFollowup')?.addEventListener('click',addOrgFollowup);
q('#adminNewAnnouncement')?.addEventListener('click',newAdminAnnouncement);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='calendar')loadCalendar();if(name==='coach-scheduler')loadCoachCrm();if(name==='organization-outreach')loadOrgOutreach();if(name==='communications-admin')loadAdminComms()};
}
})();
