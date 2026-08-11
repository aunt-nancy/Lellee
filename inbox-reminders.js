
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2500)}};

let inboxRows=[],inboxTab='all',selectedNotification=null;

function niceTime(v){
 if(!v)return '';
 const d=new Date(v),now=new Date(),diff=Math.floor((now-d)/60000);
 if(diff<1)return 'now';if(diff<60)return `${diff}m`;
 if(diff<1440)return `${Math.floor(diff/60)}h`;
 return d.toLocaleDateString();
}
function typeIcon(t){
 return t==='milestone'?'◆':t==='coach_message'?'◎':t==='group_announcement'?'◉':t==='system'?'✦':'✉';
}
function typeLabel(t){
 const m={milestone:'MILESTONE',coach_message:'COACH',group_announcement:'GROUP',system:'LELLEE',message:'MESSAGE'};
 return m[t]||'MESSAGE';
}
async function loadInbox(){
 if(!currentUser)return;
 const {data,error}=await sb.from('user_notifications')
 .select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false}).limit(100);
 if(error)return toast(error.message,true);
 inboxRows=data||[];
 renderInbox();
 updateBadges();
}
function filteredRows(){
 return inboxRows.filter(x=>{
  if(inboxTab==='all')return true;
  if(inboxTab==='messages')return ['message','system'].includes(x.notification_type);
  if(inboxTab==='milestones')return x.notification_type==='milestone';
  if(inboxTab==='coaching')return ['coach_message','group_announcement'].includes(x.notification_type);
  return true;
 });
}
function renderInbox(){
 const rows=filteredRows(),box=q('#inboxList');if(!box)return;
 q('#inboxUnreadCount').textContent=inboxRows.filter(x=>!x.read_at).length;
 q('#inboxMessageCount').textContent=inboxRows.filter(x=>['message','system'].includes(x.notification_type)).length;
 q('#inboxMilestoneCount').textContent=inboxRows.filter(x=>x.notification_type==='milestone').length;
 q('#inboxCoachCount').textContent=inboxRows.filter(x=>['coach_message','group_announcement'].includes(x.notification_type)).length;
 box.innerHTML=rows.length?rows.map(x=>`<article class="inbox-row ${x.read_at?'':'unread'}" data-notification="${x.id}"><div class="inbox-icon">${typeIcon(x.notification_type)}</div><div><b>${esc(x.title)}</b><small>${esc(x.sender_label||'Lellee')}</small><p>${esc(String(x.preview_text||'').slice(0,180))}</p><span class="inbox-type">${typeLabel(x.notification_type)}</span></div><span class="inbox-time">${niceTime(x.created_at)}</span></article>`).join(''):'<div class="approved-resource-empty">Nothing here yet.</div>';
 qa('[data-notification]').forEach(r=>r.onclick=()=>openNotification(r.dataset.notification));
}
function updateBadges(){
 const n=inboxRows.filter(x=>!x.read_at).length;
 q('#inboxNavBadge')&&(q('#inboxNavBadge').textContent=n,q('#inboxNavBadge').classList.toggle('hidden',n===0));
 q('#todayInboxUnread')&&(q('#todayInboxUnread').textContent=n);
}
async function openNotification(id){
 const row=inboxRows.find(x=>x.id===id);if(!row)return;
 selectedNotification=row;
 if(!row.read_at){
  await sb.from('user_notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('user_id',currentUser.id);
  row.read_at=new Date().toISOString();updateBadges();
 }
 q('#messageThreadTitle').textContent=row.title;
 q('#messageThreadMeta').textContent=`${row.sender_label||'Lellee'} · ${new Date(row.created_at).toLocaleString()}`;
 const body=q('#messageThreadBody');
 const reply=q('#messageReplyBox');
 if(row.notification_type==='coach_message'&&row.source_table==='coach_messages'&&row.source_id){
  const {data:m}=await sb.from('coach_messages').select('id,relationship_id,group_id,sender_user_id,body,created_at').eq('id',row.source_id).maybeSingle();
  if(m){
   const query=m.relationship_id
    ? sb.from('coach_messages').select('*').eq('relationship_id',m.relationship_id).order('created_at')
    : sb.from('coach_messages').select('*').eq('group_id',m.group_id).order('created_at');
   const {data:thread}=await query;
   body.innerHTML=(thread||[]).map(x=>`<div class="message-bubble ${x.sender_user_id===currentUser.id?'mine':''}"><small>${x.sender_user_id===currentUser.id?'You':'Coach'} · ${niceTime(x.created_at)}</small><p>${esc(x.body)}</p></div>`).join('');
   reply.classList.remove('hidden');reply.dataset.relationshipId=m.relationship_id||'';reply.dataset.groupId=m.group_id||'';
  }
 } else {
  body.innerHTML=`<div class="message-bubble"><small>${esc(row.sender_label||'Lellee')}</small><p>${esc(row.body_text||row.preview_text||'')}</p></div>`;
  reply.classList.add('hidden');
 }
 showPage('message-thread');
}
async function sendReply(){
 const text=q('#messageReplyText').value.trim();if(!text)return;
 const box=q('#messageReplyBox'),rel=box.dataset.relationshipId||null,group=box.dataset.groupId||null;
 let businessId=null;
 if(rel){const {data:r}=await sb.from('coach_client_relationships').select('business_id').eq('id',rel).maybeSingle();businessId=r?.business_id}
 if(group){const {data:g}=await sb.from('coach_groups').select('business_id').eq('id',group).maybeSingle();businessId=g?.business_id}
 if(!businessId)return toast('Could not identify coaching relationship.',true);
 const {error}=await sb.from('coach_messages').insert({business_id:businessId,relationship_id:rel,group_id:group,sender_user_id:currentUser.id,body:text});
 if(error)return toast(error.message,true);
 q('#messageReplyText').value='';toast('Message sent.');if(selectedNotification)openNotification(selectedNotification.id);
}
async function markAllRead(){
 await sb.from('user_notifications').update({read_at:new Date().toISOString()}).eq('user_id',currentUser.id).is('read_at',null);
 inboxRows.forEach(x=>x.read_at=x.read_at||new Date().toISOString());renderInbox();updateBadges();
}

async function loadPrefs(){
 if(!currentUser)return;
 const {data}=await sb.from('notification_preferences').select('*').eq('user_id',currentUser.id).maybeSingle();
 if(!data)return;
 q('#prefInAppMessages').checked=data.in_app_messages;
 q('#prefMilestoneReminders').checked=data.milestone_reminders;
 q('#prefCoachMessages').checked=data.coach_messages;
 q('#prefPushEnabled').checked=data.push_enabled;
 q('#prefPrivatePreviews').checked=data.private_push_previews;
 const windows=data.milestone_reminder_days||[7,1,0];
 qa('[data-milestone-window]').forEach(x=>x.checked=windows.includes(Number(x.value)));
}
async function savePrefs(){
 const days=qa('[data-milestone-window]:checked').map(x=>Number(x.value));
 const payload={user_id:currentUser.id,in_app_messages:q('#prefInAppMessages').checked,milestone_reminders:q('#prefMilestoneReminders').checked,coach_messages:q('#prefCoachMessages').checked,push_enabled:q('#prefPushEnabled').checked,private_push_previews:q('#prefPrivatePreviews').checked,milestone_reminder_days:days,updated_at:new Date().toISOString()};
 const {error}=await sb.from('notification_preferences').upsert(payload,{onConflict:'user_id'});
 if(error)return toast(error.message,true);
 q('#notificationSettingsMsg').textContent='Saved.';toast('Notification settings saved.');
}
async function generateMilestoneReminders(){
 if(!currentUser)return;
 try{await sb.rpc('generate_user_milestone_notifications',{p_user_id:currentUser.id})}catch(e){}
}
async function init(){
 if(!currentUser)return;
 await generateMilestoneReminders();
 await loadInbox();
}

qa('[data-inbox-tab]').forEach(b=>b.onclick=()=>{inboxTab=b.dataset.inboxTab;qa('[data-inbox-tab]').forEach(x=>x.classList.toggle('active',x===b));renderInbox()});
q('#inboxMarkAllRead')?.addEventListener('click',markAllRead);
q('#saveNotificationSettings')?.addEventListener('click',savePrefs);
q('#sendMessageReply')?.addEventListener('click',sendReply);

if(typeof showPage==='function'){
 const oldShow=showPage;
 showPage=function(name){
  oldShow(name);
  if(name==='inbox'){generateMilestoneReminders().then(loadInbox)}
  if(name==='notification-settings')loadPrefs();
 };
}
let tries=0;const timer=setInterval(()=>{tries++;if(typeof currentUser!=='undefined'&&currentUser){clearInterval(timer);init()}else if(tries>40)clearInterval(timer)},200);
})();
