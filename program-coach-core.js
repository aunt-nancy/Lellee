
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,e=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(e)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2600)}};

let business=null,programs=[],coachTab='clients';
let myCoachState={relationships:[],messages:[]};

async function loadPrograms(){
 if(typeof sb==='undefined')return;
 const {data}=await sb.from('programs').select('id,slug,name,short_description,status,display_order').in('status',['active','pilot','planned']).order('display_order');
 programs=data||[];
 const box=q('#programCoreCatalog');
 if(box){
  box.innerHTML=programs.map(p=>`<article class="program-core-card ${p.status==='active'?'active':''}"><small>LELLEE PROGRAM</small><h3>${esc(p.name)}</h3><p>${esc(p.short_description||'Program architecture prepared for future expansion.')}</p><span class="program-core-status ${p.status==='active'?'active':''}">${p.status.toUpperCase()}</span></article>`).join('');
  q('#programCoreCount')&&(q('#programCoreCount').textContent=`${programs.filter(p=>p.status!=='active').length} planned`);
 }
 const sel=q('#coachPrimaryProgram');
 if(sel&&!sel.options.length)sel.innerHTML=programs.filter(p=>p.status==='active'||p.status==='pilot').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
}

async function loadBusiness(){
 if(!currentUser)return;
 const {data}=await sb.from('coach_businesses').select('*').eq('owner_user_id',currentUser.id).maybeSingle();
 business=data||null;
 const title=q('#coachBusinessStatusTitle'),text=q('#coachBusinessStatusText'),pill=q('#coachBusinessStatusPill');
 if(!business){title&&(title.textContent='Not started');text&&(text.textContent='Create a business profile to begin the review process.');pill&&(pill.textContent='START');return}
 title&&(title.textContent=business.business_name);
 text&&(text.textContent=business.status==='approved'?'Approved — your Coach Dashboard is available.':business.status==='pending_review'?'Submitted for review.':'Business profile saved as draft.');
 pill&&(pill.textContent=business.status.replaceAll('_',' ').toUpperCase());
 q('#coachBusinessName')&&(q('#coachBusinessName').value=business.business_name||'');
 q('#coachPublicName')&&(q('#coachPublicName').value=business.public_name||'');
 q('#coachAudience')&&(q('#coachAudience').value=business.target_audience||'');
 q('#coachBio')&&(q('#coachBio').value=business.bio||'');
 q('#coachCredentials')&&(q('#coachCredentials').value=business.credentials_disclosure||'');
 q('#coachBusinessModel')&&(q('#coachBusinessModel').value=business.business_model||'solo');
 q('#coachPrimaryProgram')&&business.primary_program_id&&(q('#coachPrimaryProgram').value=business.primary_program_id);
 // Consumer Recovery does not expose the independent-business dashboard.
 q('#coachNavItem')?.classList.add('hidden');
}

async function submitBusiness(){
 if(!currentUser)return;
 const name=q('#coachBusinessName').value.trim(),publicName=q('#coachPublicName').value.trim(),programId=q('#coachPrimaryProgram').value;
 if(!name||!publicName||!programId)return toast('Business name, public name and program are required.',true);
 if(!q('#coachBusinessDisclosure').checked||!q('#coachBusinessPrivacy').checked)return toast('Confirm both coaching disclosures.',true);
 const payload={owner_user_id:currentUser.id,business_name:name,public_name:publicName,primary_program_id:programId,business_model:q('#coachBusinessModel').value,target_audience:q('#coachAudience').value.trim()||null,bio:q('#coachBio').value.trim()||null,credentials_disclosure:q('#coachCredentials').value.trim()||null,status:'pending_review',submitted_at:new Date().toISOString()};
 const res=business?await sb.from('coach_businesses').update(payload).eq('id',business.id):await sb.from('coach_businesses').insert(payload);
 if(res.error)return toast(res.error.message,true);
 toast('Coaching business submitted for review.');loadBusiness();
}

function setCoachTab(tab){
 coachTab=tab;qa('[data-coach-tab]').forEach(b=>b.classList.toggle('active',b.dataset.coachTab===tab));
 ['clients','groups','services','messages','assignments','leads'].forEach(x=>q(`#coachPanel${x[0].toUpperCase()+x.slice(1)}`)?.classList.toggle('hidden',x!==tab));
}

async function loadDashboard(){
 if(!currentUser)return;
 await loadBusiness();
 if(!business||business.status!=='approved')return;
 q('#coachDashboardBusinessName').textContent=business.business_name;
 const [rels,groups,services,msgs,leads,assignments]=await Promise.all([
  sb.from('coach_client_relationships').select('id,client_user_id,status,created_at,profiles:client_user_id(display_name)').eq('business_id',business.id),
  sb.from('coach_groups').select('id,name,status,capacity,coach_group_members(id)').eq('business_id',business.id),
  sb.from('coach_service_packages').select('*').eq('business_id',business.id).order('created_at',{ascending:false}),
  sb.from('coach_messages').select('id,relationship_id,body,read_at,created_at').eq('business_id',business.id).order('created_at',{ascending:false}).limit(30),
  sb.from('coach_leads').select('*').eq('business_id',business.id).order('created_at',{ascending:false}),
  sb.from('coach_assignments').select('*').eq('business_id',business.id).order('created_at',{ascending:false})
 ]);
 const active=(rels.data||[]).filter(x=>x.status==='active');
 const activeGroups=(groups.data||[]).filter(x=>x.status==='active');
 const openSeats=activeGroups.reduce((n,g)=>n+Math.max(0,(g.capacity||0)-(g.coach_group_members?.length||0)),0);
 q('#coachMetricClients').textContent=active.length;q('#coachMetricGroups').textContent=activeGroups.length;q('#coachMetricCapacity').textContent=openSeats;q('#coachMetricMessages').textContent=(msgs.data||[]).filter(x=>!x.read_at).length;
 q('#coachClientList').innerHTML=active.length?active.map(x=>`<div class="coach-list-row"><div class="coach-list-icon">◉</div><div><b>${esc(x.profiles?.display_name||'Client')}</b><small>Active coaching relationship</small></div><button data-coach-message-rel="${x.id}">Message</button></div>`).join(''):'<div class="approved-resource-empty">No active clients yet.</div>';
 q('#coachGroupList').innerHTML=(groups.data||[]).length?(groups.data||[]).map(g=>`<div class="coach-list-row"><div class="coach-list-icon">◎</div><div><b>${esc(g.name)}</b><small>${g.coach_group_members?.length||0} of ${g.capacity||0} seats · ${esc(g.status)}</small></div><button>Open</button></div>`).join(''):'<div class="approved-resource-empty">No coaching groups yet.</div>';
 q('#coachServiceList').innerHTML=(services.data||[]).length?(services.data||[]).map(s=>`<div class="coach-list-row"><div class="coach-list-icon">$</div><div><b>${esc(s.name)}</b><small>${esc(s.service_type.replaceAll('_',' '))} · ${s.price_amount!=null?'$'+Number(s.price_amount).toFixed(2):'Price not set'} · ${esc(s.billing_model.replaceAll('_',' '))}</small></div><button>Edit</button></div>`).join(''):'<div class="approved-resource-empty">No services or packages yet.</div>';
 q('#coachLeadList').innerHTML=(leads.data||[]).length?(leads.data||[]).map(l=>`<div class="coach-list-row"><div class="coach-list-icon">+</div><div><b>${esc(l.name||l.email||'Lead')}</b><small>${esc(l.status.replaceAll('_',' '))}</small></div><button>Open</button></div>`).join(''):'<div class="approved-resource-empty">No leads yet.</div>';
 q('#coachAssignmentList').innerHTML=(assignments.data||[]).length?(assignments.data||[]).map(a=>`<div class="coach-list-row"><div class="coach-list-icon">✓</div><div><b>${esc(a.title)}</b><small>${esc(a.status)}</small></div><button>Open</button></div>`).join(''):'<div class="approved-resource-empty">No assignments yet.</div>';
 q('#coachMessageList').innerHTML=(msgs.data||[]).length?(msgs.data||[]).map(m=>`<div class="coach-list-row"><div class="coach-list-icon">✉</div><div><b>Client message</b><small>${esc(String(m.body||'').slice(0,120))}</small></div><button>Open</button></div>`).join(''):'<div class="approved-resource-empty">No messages yet.</div>';
}

async function promptInvite(){
 if(!business)return;
 const email=prompt('Client email address:');if(!email)return;
 const {data,error}=await sb.rpc('create_coach_invite',{p_business_id:business.id,p_program_id:business.primary_program_id,p_email:email});
 if(error)return toast(error.message,true);
 if(data)prompt('Copy this secure invite link and send it to the client:',`${location.origin}/app?page=my-coaching&invite=${data}`);
}

async function newGroup(){
 if(!business)return;const name=prompt('Group name:');if(!name)return;const cap=Number(prompt('Maximum group size:','8')||8);
 const {error}=await sb.from('coach_groups').insert({business_id:business.id,program_id:business.primary_program_id,name,capacity:Math.max(2,Math.min(cap,50)),status:'active'});
 if(error)return toast(error.message,true);loadDashboard();
}
async function newService(){
 if(!business)return;const name=prompt('Service/package name:');if(!name)return;const type=prompt('Type: one_to_one, group, or hybrid','group')||'group';const price=Number(prompt('Price per person (numbers only):','49')||0);
 const {error}=await sb.from('coach_service_packages').insert({business_id:business.id,program_id:business.primary_program_id,name,service_type:type,billing_model:'monthly',price_amount:price,active:true});
 if(error)return toast(error.message,true);loadDashboard();
}
async function newLead(){
 if(!business)return;const email=prompt('Lead email:');if(!email)return;await sb.from('coach_leads').insert({business_id:business.id,email,status:'new'});loadDashboard();
}

function ensureMyCoachingDialog(){
 let d=q('#myCoachingDialog');
 if(!d){
  d=document.createElement('dialog');
  d.id='myCoachingDialog';
  d.className='coach-live-dialog';
  d.innerHTML='<div class="coach-live-dialog-inner" id="myCoachingDialogInner"></div>';
  document.body.appendChild(d);
 }
 return d;
}
function closeMyCoachingDialog(){q('#myCoachingDialog')?.close()}

function myCoachName(rel){
 return rel?.coach_businesses?.public_name||rel?.coach_businesses?.business_name||'Coach';
}

async function loadMyCoaching(){
 if(!currentUser)return;

 const params=new URLSearchParams(location.search);
 const token=params.get('invite')||params.get('coach_invite');
 if(token){
  const accepted=await sb.rpc('accept_coach_invite',{p_token:token});
  if(!accepted.error&&accepted.data){
   toast('Coaching invitation accepted.');
   const url=new URL(location.href);
   url.searchParams.delete('invite');
   url.searchParams.delete('coach_invite');
   history.replaceState({},'',url.pathname+(url.searchParams.toString()?'?'+url.searchParams.toString():'')+url.hash);
  }else if(accepted.error){
   toast(accepted.error.message||'Could not accept coaching invitation.',true);
  }
 }

 const relResult=await sb.from('coach_client_relationships')
  .select('id,status,business_id,program_id,coach_businesses(business_name,public_name)')
  .eq('client_user_id',currentUser.id)
  .order('started_at',{ascending:false});
 if(relResult.error)return toast(relResult.error.message,true);
 const rels=relResult.data||[];
 myCoachState.relationships=rels;

 const box=q('#myCoachRelationships');
 if(box)box.innerHTML=rels.length?rels.map(function(r){
  return '<div class="coach-list-row"><div class="coach-list-icon">◎</div><div><b>'+esc(myCoachName(r))+'</b>'+
   '<small>'+esc(r.status)+' · Your private data stays private unless you share it.</small></div>'+
   '<button data-my-coach-conversation="'+esc(r.id)+'">Conversation</button></div>';
 }).join(''):'<div class="approved-resource-empty">No coaching relationships yet.</div>';

 const assignmentBox=q('#myCoachAssignments'),messageBox=q('#myCoachMessages');
 const relIds=rels.map(function(r){return r.id});
 if(!relIds.length){
  if(assignmentBox)assignmentBox.innerHTML='<div class="approved-resource-empty">No coaching assignments yet.</div>';
  if(messageBox)messageBox.innerHTML='<div class="approved-resource-empty">No coach conversations yet.</div>';
  return;
 }

 const recipientResult=await sb.from('coach_assignment_recipients')
  .select('id,assignment_id,relationship_id,completed_at')
  .in('relationship_id',relIds);
 if(recipientResult.error)return toast(recipientResult.error.message,true);
 const recipients=recipientResult.data||[];
 const assignmentIds=[...new Set(recipients.map(function(x){return x.assignment_id}))];
 let assignments=[];
 if(assignmentIds.length){
  const assignmentResult=await sb.from('coach_assignments')
   .select('id,title,instructions,due_at,status,program_id,created_at')
   .in('id',assignmentIds)
   .order('created_at',{ascending:false});
  if(assignmentResult.error)return toast(assignmentResult.error.message,true);
  assignments=assignmentResult.data||[];
 }
 const assignmentMap=new Map(assignments.map(function(a){return [a.id,a]}));
 const relMap=new Map(rels.map(function(r){return [r.id,r]}));
 const assignmentRows=recipients.map(function(rec){
  const a=assignmentMap.get(rec.assignment_id),rel=relMap.get(rec.relationship_id);
  if(!a)return '';
  const canComplete=!rec.completed_at&&a.status==='active'&&rel?.status==='active';
  return '<article class="coach-live-item"><div class="coach-live-row"><div><b>'+esc(a.title)+'</b>'+
   '<small>'+esc(myCoachName(rel))+(a.due_at?' · due '+esc(new Date(a.due_at).toLocaleString()):'')+'</small></div>'+
   '<span class="coach-live-pill">'+esc(rec.completed_at?'COMPLETED':String(a.status||'active').toUpperCase())+'</span></div>'+
   (a.instructions?'<div class="coach-conversation-preview">'+esc(a.instructions)+'</div>':'')+
   '<div class="coach-live-actions">'+(canComplete?'<button class="primary" data-my-coach-complete="'+esc(rec.id)+'">Mark Complete</button>':'')+
   '<button data-my-coach-conversation="'+esc(rec.relationship_id)+'">Conversation</button></div></article>';
 }).filter(Boolean);
 if(assignmentBox)assignmentBox.innerHTML=assignmentRows.length?assignmentRows.join(''):'<div class="approved-resource-empty">No coaching assignments yet.</div>';

 const messageResult=await sb.from('coach_messages')
  .select('id,relationship_id,sender_user_id,body,created_at,read_at')
  .in('relationship_id',relIds)
  .order('created_at',{ascending:false})
  .limit(100);
 if(messageResult.error)return toast(messageResult.error.message,true);
 const messages=messageResult.data||[];
 myCoachState.messages=messages;

 const threadMap=new Map();
 rels.forEach(function(rel){
  if(rel.status==='ended')return;
  threadMap.set(rel.id,{rel:rel,latest:null,unread:0});
 });
 messages.forEach(function(m){
  if(!threadMap.has(m.relationship_id)){
   const rel=relMap.get(m.relationship_id);
   if(rel)threadMap.set(m.relationship_id,{rel:rel,latest:null,unread:0});
  }
  const t=threadMap.get(m.relationship_id);if(!t)return;
  if(!t.latest)t.latest=m;
  if(!m.read_at&&m.sender_user_id!==currentUser.id)t.unread+=1;
 });
 const threads=[...threadMap.values()];
 if(messageBox)messageBox.innerHTML=threads.length?threads.map(function(t){
  return '<article class="coach-live-item"><div class="coach-live-row"><div><b>'+esc(myCoachName(t.rel))+'</b>'+
   '<small>'+esc(t.latest?String(t.latest.body||'').slice(0,140):'No messages yet')+'</small></div>'+
   (t.unread?'<span class="coach-live-pill">'+esc(t.unread)+' NEW</span>':'')+'</div>'+
   '<div class="coach-live-actions"><button class="primary" data-my-coach-conversation="'+esc(t.rel.id)+'">Open Conversation</button></div></article>';
 }).join(''):'<div class="approved-resource-empty">No coach conversations yet.</div>';
}

async function completeMyCoachAssignment(recipientId){
 const out=await sb.rpc('complete_my_coach_assignment_recipient',{p_recipient_id:recipientId});
 if(out.error)return toast(out.error.message,true);
 toast('Assignment marked complete.');
 await loadMyCoaching();
}

async function openMyCoachConversation(relId){
 const rel=myCoachState.relationships.find(function(x){return x.id===relId});
 if(!rel)return toast('Coaching relationship could not be found.',true);
 const result=await sb.from('coach_messages')
  .select('id,relationship_id,sender_user_id,body,created_at,read_at')
  .eq('relationship_id',relId)
  .order('created_at',{ascending:true})
  .limit(250);
 if(result.error)return toast(result.error.message,true);

 const mark=await sb.from('coach_messages')
  .update({read_at:new Date().toISOString()})
  .eq('relationship_id',relId)
  .neq('sender_user_id',currentUser.id)
  .is('read_at',null);
 if(mark.error)console.warn('Could not mark coach messages read',mark.error);

 const history=(result.data||[]).map(function(m){
  const mine=m.sender_user_id===currentUser.id;
  return '<div class="coach-conversation-message '+(mine?'mine':'theirs')+'"><div><b>'+esc(mine?'You':myCoachName(rel))+'</b>'+
   '<small>'+esc(new Date(m.created_at).toLocaleString())+'</small></div><p>'+esc(m.body)+'</p></div>';
 }).join('')||'<div class="coach-live-empty">No messages yet. Start the conversation below.</div>';

 const d=ensureMyCoachingDialog(),inner=q('#myCoachingDialogInner');
 inner.innerHTML='<div class="coach-live-dialog-head"><div><span class="approved-kicker">MY COACHING</span><h3>'+esc(myCoachName(rel))+'</h3>'+
  '<p>Messages stay inside this coaching relationship.</p></div><button class="coach-live-close" type="button" data-my-coaching-close>×</button></div>'+
  '<div class="coach-conversation-thread" id="myCoachConversationThread">'+history+'</div>'+
  (rel.status==='active'?'<form id="myCoachConversationForm" data-relationship-id="'+esc(rel.id)+'"><div class="coach-live-form"><label class="wide">Reply<textarea id="myCoachConversationReply" maxlength="4000" required></textarea></label></div>'+
   '<div class="coach-live-footer"><button type="button" data-my-coaching-close>Close</button><button class="primary" type="submit">Send Reply</button></div></form>':
   '<div class="coach-live-review-note">This conversation is read-only because the coaching relationship is not active.</div><div class="coach-live-footer"><button type="button" data-my-coaching-close>Close</button></div>');
 d.showModal();
 requestAnimationFrame(function(){const thread=q('#myCoachConversationThread');if(thread)thread.scrollTop=thread.scrollHeight;});
 await loadMyCoaching();
}

async function sendMyCoachConversation(relId){
 const rel=myCoachState.relationships.find(function(x){return x.id===relId});
 if(!rel||rel.status!=='active')return toast('This coaching relationship is not active.',true);
 const body=q('#myCoachConversationReply')?.value.trim();
 if(!body)return toast('Enter a message.',true);
 const out=await sb.from('coach_messages').insert({
  business_id:rel.business_id,relationship_id:rel.id,group_id:null,sender_user_id:currentUser.id,body:body
 });
 if(out.error)return toast(out.error.message,true);
 await loadMyCoaching();
 await openMyCoachConversation(rel.id);
}

async function init(){
 await loadPrograms();await loadBusiness();
}

q('#submitCoachBusiness')?.addEventListener('click',submitBusiness);
qa('[data-coach-tab]').forEach(b=>b.addEventListener('click',()=>setCoachTab(b.dataset.coachTab)));
q('#coachInviteClient')?.addEventListener('click',promptInvite);
q('#coachNewGroup')?.addEventListener('click',newGroup);
q('#coachNewService')?.addEventListener('click',newService);
q('#coachNewLead')?.addEventListener('click',newLead);

document.addEventListener('click',function(event){
 const complete=event.target.closest('[data-my-coach-complete]');
 if(complete){event.preventDefault();completeMyCoachAssignment(complete.dataset.myCoachComplete);return;}
 const conversation=event.target.closest('[data-my-coach-conversation]');
 if(conversation){event.preventDefault();openMyCoachConversation(conversation.dataset.myCoachConversation);return;}
 if(event.target.closest('[data-my-coaching-close]')){event.preventDefault();closeMyCoachingDialog();}
},true);

document.addEventListener('submit',function(event){
 if(event.target?.id!=='myCoachConversationForm')return;
 event.preventDefault();
 sendMyCoachConversation(event.target.dataset.relationshipId);
});

if(typeof showPage==='function'){
 const oldShow=showPage;showPage=function(name){oldShow(name);if(name==='programs')loadPrograms();if(name==='coach-business'){loadPrograms();loadBusiness()}if(name==='coach-dashboard')loadDashboard();if(name==='my-coaching')loadMyCoaching()};
}
let tries=0;const timer=setInterval(()=>{tries++;if(typeof currentUser!=='undefined'&&currentUser){clearInterval(timer);init()}else if(tries>40)clearInterval(timer)},200);
})();
