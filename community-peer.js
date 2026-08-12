
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let currentCommunityGroup=null,isAdmin=false;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,status='',action='',id='',klass=''){
 return `<div class="community-row ${klass}"><div class="community-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div>${action?`<button data-community-action="${esc(action)}" data-community-id="${esc(id)}">${esc(status||'Open')}</button>`:`<em>${esc(status||'')}</em>`}</div>`;
}
function setCommunityTab(tab){qa('[data-community-tab]').forEach(b=>b.classList.toggle('active',b.dataset.communityTab===tab));['groups','events','partners','guidelines'].forEach(x=>q('#communityPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadCommunity(){
 const d=await rpc('get_my_community_summary');if(!d)return;
 const s=d.summary||{};
 q('#communityMyGroups').textContent=s.groups||0;q('#communityUpcomingEvents').textContent=s.events||0;q('#communityConnections').textContent=s.peers||0;q('#communityUnread').textContent=s.unread||0;
 q('#communityMyGroupList').innerHTML=(d.groups||[]).map(x=>row('◎',x.name,`${x.program_name||'Lellee'} · ${x.member_count} members`,'Open','open-group',x.id)).join('')||'<div class="approved-resource-empty">You have not joined a community group yet.</div>';
 q('#communityEventList').innerHTML=(d.events||[]).map(x=>row('◷',x.title,`${new Date(x.starts_at).toLocaleString()} · ${x.delivery_mode}`,x.rsvp_status||'')).join('')||'<div class="approved-resource-empty">No upcoming community events.</div>';
 q('#communityPeerList').innerHTML=(d.peers||[]).map(x=>row('↔',x.label,`${x.connection_type} · ${x.status}`,x.status)).join('')||'<div class="approved-resource-empty">No peer connections yet.</div>';
 q('#communityGuidelineList').innerHTML=(d.guidelines||[]).map(x=>`<article class="community-guideline"><b>${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
 wireActions();
}
async function loadDiscover(){
 const {data:programs}=await sb.from('programs').select('id,name').in('status',['active','pilot']).order('display_order');
 q('#communityProgramFilter').innerHTML='<option value="">All programs</option>'+(programs||[]).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
 const d=await rpc('discover_community_groups',{p_program_id:q('#communityProgramFilter').value||null,p_group_type:q('#communityFormatFilter').value||null,p_delivery_mode:q('#communityDeliveryFilter').value||null});
 q('#communityDiscoverList').innerHTML=(d||[]).map(x=>`<article class="community-discover-card"><b>${esc(x.name)}</b><p>${esc(x.description||'')}</p><small>${esc(x.program_name||'Lellee')} · ${esc(x.group_type)} · ${esc(x.delivery_mode)} · ${x.member_count} members</small><button data-community-action="join-group" data-community-id="${x.id}">${x.joined?'Open':'Join'}</button></article>`).join('')||'<div class="approved-resource-empty">No groups match those filters.</div>';
 wireActions();
}
async function openGroup(id){
 currentCommunityGroup=id;
 const d=await rpc('get_community_group_detail',{p_group_id:id});if(!d)return toast('Group could not load.',true);
 q('#communityGroupKicker').textContent=(d.program_name||'LELLEE').toUpperCase();
 q('#communityGroupName').textContent=d.name;
 q('#communityGroupDescription').textContent=d.description||'';
 q('#communityGroupMeta').innerHTML=[d.group_type,d.delivery_mode,`${d.member_count} members`,d.privacy_level].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('');
 q('#communityPostList').innerHTML=(d.posts||[]).map(x=>row('•',x.author_label||'Community member',`${new Date(x.created_at).toLocaleString()} · ${x.reply_count} replies`,'Report','report-post',x.id)).join('')||'<div class="approved-resource-empty">No posts yet.</div>';
 q('#communityGroupEventList').innerHTML=(d.events||[]).map(x=>row('◷',x.title,`${new Date(x.starts_at).toLocaleString()} · ${x.delivery_mode}`,x.rsvp_count+' attending')).join('')||'<div class="approved-resource-empty">No events scheduled.</div>';
 showPage('community-group');wireActions();
}
async function joinGroup(id){
 const {data,error}=await sb.rpc('join_community_group',{p_group_id:id});
 if(error)return toast(error.message,true);
 if(data?.already_member){openGroup(id);return}
 toast('Joined community group.');openGroup(id);
}
async function createPost(){
 if(!currentCommunityGroup)return;
 const body=prompt('Share with the group:');if(!body)return;
 const {error}=await sb.from('community_posts').insert({group_id:currentCommunityGroup,user_id:currentUser.id,body,status:'published'});
 if(error)return toast(error.message,true);openGroup(currentCommunityGroup);
}
async function reportPost(id){
 const reason=prompt('Reason for reporting: harassment, spam, unsafe content, privacy, other','other')||'other';
 const {error}=await sb.from('community_reports').insert({reporter_user_id:currentUser.id,content_type:'post',content_id:id,reason,status:'open'});
 if(error)return toast(error.message,true);toast('Report submitted.');
}
function wireActions(){
 qa('[data-community-action="open-group"]').forEach(b=>b.onclick=()=>openGroup(b.dataset.communityId));
 qa('[data-community-action="join-group"]').forEach(b=>b.onclick=()=>joinGroup(b.dataset.communityId));
 qa('[data-community-action="report-post"]').forEach(b=>b.onclick=()=>reportPost(b.dataset.communityId));
}

async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
function setCommunityOpsTab(tab){qa('[data-community-ops-tab]').forEach(b=>b.classList.toggle('active',b.dataset.communityOpsTab===tab));['groups','events','reports','roles','health'].forEach(x=>q('#communityOpsPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadCommunityOps(){
 if(!await checkAdmin())return;
 const d=await rpc('get_community_operations_summary');if(!d)return;
 const s=d.summary||{};
 q('#communityOpsGroups').textContent=s.groups||0;q('#communityOpsMembers').textContent=s.members||0;q('#communityOpsReports').textContent=s.reports||0;q('#communityOpsEvents').textContent=s.events||0;
 q('#communityOpsGroupList').innerHTML=(d.groups||[]).map(x=>row('◎',x.name,`${x.status} · ${x.member_count} members`,x.program_name||'')).join('')||'<div class="approved-resource-empty">No groups.</div>';
 q('#communityOpsEventList').innerHTML=(d.events||[]).map(x=>row('◷',x.title,`${new Date(x.starts_at).toLocaleString()} · ${x.status}`,x.rsvp_count+' RSVPs')).join('')||'<div class="approved-resource-empty">No events.</div>';
 q('#communityOpsReportList').innerHTML=(d.reports||[]).map(x=>row('!',x.reason,`${x.content_type} · ${x.status} · ${new Date(x.created_at).toLocaleDateString()}`,x.severity||'normal',x.severity==='high'?'attention':'' )).join('')||'<div class="approved-resource-empty">No open reports.</div>';
 q('#communityOpsRoleList').innerHTML=(d.roles||[]).map(x=>row('R',x.role_label,x.description,x.status)).join('');
 q('#communityOpsHealthList').innerHTML=(d.health||[]).map(x=>row(x.status==='ok'?'✓':'!',x.label,x.detail,x.status,x.status==='ok'?'':'attention')).join('');
}
async function addGroup(){
 const name=prompt('Group name:');if(!name)return;
 const type=prompt('Group type: discussion, accountability, education, social','discussion')||'discussion';
 const delivery=prompt('Delivery: virtual, in_person, hybrid','virtual')||'virtual';
 const {data:recovery}=await sb.from('programs').select('id').eq('slug','recovery').maybeSingle();
 const {error}=await sb.from('community_groups').insert({name,program_id:recovery?.id||null,group_type:type,delivery_mode:delivery,status:'draft',privacy_level:'members_only',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadCommunityOps();
}
async function addEvent(){
 const title=prompt('Event title:');if(!title)return;const when=prompt('Date/time YYYY-MM-DD HH:MM:');if(!when)return;
 const {error}=await sb.from('community_events').insert({title,starts_at:when.replace(' ','T'),delivery_mode:'virtual',status:'draft',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadCommunityOps();
}

qa('[data-community-tab]').forEach(b=>b.onclick=()=>setCommunityTab(b.dataset.communityTab));
qa('[data-community-ops-tab]').forEach(b=>b.onclick=()=>setCommunityOpsTab(b.dataset.communityOpsTab));
['communityProgramFilter','communityFormatFilter','communityDeliveryFilter'].forEach(id=>q('#'+id)?.addEventListener('change',loadDiscover));
q('#communityNewPost')?.addEventListener('click',createPost);
q('#communityOpsAddGroup')?.addEventListener('click',addGroup);
q('#communityOpsAddEvent')?.addEventListener('click',addEvent);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='community')loadCommunity();if(name==='community-discover')loadDiscover();if(name==='community-ops')loadCommunityOps()};
}
})();
