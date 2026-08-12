
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2300)}};

let programId=null,program=null,profile=null,routes=[],programs=[],editingRoute=null,isAdmin=false,inactivityTimer=null;

async function getProgram(){
 if(!currentUser)return;
 const {data:s}=await sb.from('user_program_state').select('active_program_id').eq('user_id',currentUser.id).maybeSingle();
 programId=s?.active_program_id||null;
 if(programId){const {data:p}=await sb.from('programs').select('id,slug,name,short_description').eq('id',programId).maybeSingle();program=p||null}
}
async function loadSafetyCenter(){
 if(!programId)await getProgram();
 if(!programId)return;
 const [pr,rt,prefs]=await Promise.all([
  sb.from('program_safety_profiles_v2').select('*').eq('program_id',programId).maybeSingle(),
  sb.from('program_safety_routes').select('*').eq('program_id',programId).eq('status','published').order('display_order'),
  sb.from('user_privacy_mode').select('*').eq('user_id',currentUser.id).maybeSingle()
 ]);
 profile=pr.data||null;routes=rt.data||[];
 q('#safetyCenterTitle').textContent=program?.slug==='recovery'?'What would help right now?':`What would help with ${program?.name||'this'} right now?`;
 q('#safetyCenterDescription').textContent='Choose what is closest to what you need. Lellee will keep the next step simple.';
 const quick=!!profile?.quick_exit_required&&((prefs.data?.quick_exit_enabled??true)!==false);
 q('#safetyQuickExitWrap').classList.toggle('hidden',!quick);
 renderSafetyRoutes();
 applyAutoClear(prefs.data);
}
function renderSafetyRoutes(){
 const box=q('#safetyActionGrid');if(!box)return;
 box.classList.remove('hidden');q('#safetyGuidanceCard').classList.add('hidden');
 box.innerHTML=routes.length?routes.map(x=>`<button class="safety-action-card ${x.urgency}" data-safety-route="${x.id}"><span>${routeIcon(x.urgency)}</span><b>${esc(x.user_label)}</b><small>${esc(shortAction(x.primary_action))}</small></button>`).join(''):'<div class="approved-resource-empty">No safety routes are configured for this program yet.</div>';
 qa('[data-safety-route]').forEach(b=>b.onclick=()=>showGuidance(b.dataset.safetyRoute));
}
function routeIcon(u){return u==='emergency'?'!':u==='urgent'?'⚑':u==='elevated'?'◇':'♡'}
function shortAction(a){return ({in_app_guidance:'Get a simple next step',support_contact:'Reach someone you trust',resource_navigation:'Find practical help',crisis_support:'Connect with crisis support',emergency_care:'Get emergency help',leave_environment:'Move to a safer place'})[a]||'Open guidance'}
function showGuidance(id){
 const r=routes.find(x=>x.id===id);if(!r)return;
 q('#safetyActionGrid').classList.add('hidden');q('#safetyGuidanceCard').classList.remove('hidden');
 q('#safetyGuidanceIcon').textContent=routeIcon(r.urgency);q('#safetyGuidanceKicker').textContent=r.urgency.toUpperCase();q('#safetyGuidanceTitle').textContent=r.user_label;q('#safetyGuidanceText').textContent=r.guidance_text||'Choose the next step that feels most useful.';
 const actions=q('#safetyGuidanceActions');
 const label=r.action_button_label||shortAction(r.primary_action);
 if(r.primary_action==='support_contact')actions.innerHTML=`<button data-page-target="support">${esc(label)}</button>`;
 else if(r.primary_action==='resource_navigation')actions.innerHTML=`<button data-page-target="resource-navigator">${esc(label)}</button>`;
 else if(r.primary_action==='leave_environment')actions.innerHTML=`<button id="safetyLeavePage">${esc(label)}</button>`;
 else if(['crisis_support','emergency_care'].includes(r.primary_action))actions.innerHTML=`<button data-external-safety="${esc(r.external_action_url||'')}">${esc(label)}</button>`;
 else actions.innerHTML=`<button data-page-target="tools">${esc(label)}</button>`;
 qa('[data-page-target]').forEach(b=>b.onclick=()=>showPage(b.dataset.pageTarget));
 qa('[data-external-safety]').forEach(b=>b.onclick=()=>{const u=b.dataset.externalSafety;if(u)window.location.href=u;else toast('Open your local emergency or crisis support option now.',true)});
 q('#safetyLeavePage')?.addEventListener('click',quickExit);
}
function quickExit(){window.location.replace('https://www.google.com/')}
function applyAutoClear(pref){
 clearTimeout(inactivityTimer);
 if(!profile?.auto_clear_seconds||!(pref?.auto_clear_enabled))return;
 inactivityTimer=setTimeout(()=>{if(!q('#page-safety-center')?.classList.contains('hidden'))showPage('today')},profile.auto_clear_seconds*1000);
}
async function loadPrivacyMode(){
 if(!currentUser)return;
 const {data}=await sb.from('user_privacy_mode').select('*').eq('user_id',currentUser.id).maybeSingle();
 const p=data||{};
 q('#privacyModeNotifications').checked=p.private_notification_previews??true;
 q('#privacyModeProgramName').checked=p.hide_program_name??true;
 q('#privacyModeQuickExit').checked=p.quick_exit_enabled??true;
 q('#privacyModeAutoClear').checked=p.auto_clear_enabled??false;
}
async function savePrivacyMode(){
 const payload={user_id:currentUser.id,private_notification_previews:q('#privacyModeNotifications').checked,hide_program_name:q('#privacyModeProgramName').checked,quick_exit_enabled:q('#privacyModeQuickExit').checked,auto_clear_enabled:q('#privacyModeAutoClear').checked,updated_at:new Date().toISOString()};
 const {error}=await sb.from('user_privacy_mode').upsert(payload,{onConflict:'user_id'});
 if(error)return toast(error.message,true);
 // keep notification preference aligned
 await sb.from('notification_preferences').upsert({user_id:currentUser.id,private_push_previews:payload.private_notification_previews,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 q('#privacyModeMsg').textContent='Saved.';toast('Privacy Mode saved.');
}

async function checkAdmin(){
 const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();
 isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin;
}
async function loadPrograms(){
 if(!await checkAdmin())return;
 const {data}=await sb.from('programs').select('id,slug,name,status,display_order').order('display_order');
 programs=data||[];
 const s=q('#safetyBuilderProgram');const prev=s.value;
 s.innerHTML=programs.map(x=>`<option value="${x.id}">${esc(x.name)} · ${esc(x.status)}</option>`).join('');
 if(prev&&programs.some(x=>x.id===prev))s.value=prev;
 loadBuilder();
}
async function loadBuilder(){
 const pid=q('#safetyBuilderProgram')?.value;if(!pid)return;
 const [pr,rt,bl]=await Promise.all([
  sb.from('program_safety_profiles_v2').select('*').eq('program_id',pid).maybeSingle(),
  sb.from('program_safety_routes').select('*').eq('program_id',pid).order('display_order'),
  sb.from('program_launch_blockers').select('*').eq('program_id',pid).eq('resolved',false).order('created_at')
 ]);
 profile=pr.data||null;routes=rt.data||[];
 q('#safetyProfileStatus').value=profile?.status||'draft';
 q('#safetyReviewLevel').value=profile?.review_level||'standard';
 q('#safetyQuickExitRequired').value=String(profile?.quick_exit_required??false);
 q('#safetyPrivateNotifications').value=String(profile?.private_notifications_required??true);
 q('#safetyCoachEscalation').value=String(profile?.coach_escalation_default??false);
 q('#safetyOrgEscalation').value=String(profile?.organization_escalation_default??false);
 q('#safetyProfileNotes').value=profile?.review_notes||'';
 q('#safetyMetricRoutes').textContent=routes.filter(x=>x.status!=='archived').length;
 q('#safetyMetricUrgent').textContent=routes.filter(x=>['urgent','emergency'].includes(x.urgency)&&x.status!=='archived').length;
 q('#safetyMetricBlocked').textContent=(bl.data||[]).length;
 q('#safetyMetricReviewed').textContent=profile?.status==='approved'?'Yes':'No';
 q('#safetyRouteList').innerHTML=routes.length?routes.map(x=>`<div class="safety-route-row"><div class="safety-route-icon">${routeIcon(x.urgency)}</div><div><b>${esc(x.user_label)}</b><small>${esc(x.urgency)} · ${esc(x.primary_action.replaceAll('_',' '))}</small><p>${esc(x.guidance_text||'')}</p><div class="safety-route-tags"><span>${esc(x.status)}</span></div></div><button data-safety-route-edit="${x.id}">Edit</button></div>`).join(''):'<div class="approved-resource-empty">No routes yet.</div>';
 q('#safetyBlockerList').innerHTML=(bl.data||[]).length?(bl.data||[]).map(x=>`<div class="safety-route-row"><div class="safety-route-icon">!</div><div><b>${esc(x.blocker_type.replaceAll('_',' '))}</b><small>${esc(x.severity)} · unresolved</small><p>${esc(x.description)}</p><div class="safety-route-tags"><span class="blocker">BLOCKS LAUNCH</span></div></div><button data-resolve-blocker="${x.id}">Resolve</button></div>`).join(''):'<div class="approved-resource-empty">No unresolved safety blockers.</div>';
 qa('[data-safety-route-edit]').forEach(b=>b.onclick=()=>openRoute(b.dataset.safetyRouteEdit));
 qa('[data-resolve-blocker]').forEach(b=>b.onclick=()=>resolveBlocker(b.dataset.resolveBlocker));
}
async function saveProfile(){
 const pid=q('#safetyBuilderProgram').value;
 const payload={program_id:pid,status:q('#safetyProfileStatus').value,review_level:q('#safetyReviewLevel').value,quick_exit_required:q('#safetyQuickExitRequired').value==='true',private_notifications_required:q('#safetyPrivateNotifications').value==='true',coach_escalation_default:q('#safetyCoachEscalation').value==='true',organization_escalation_default:q('#safetyOrgEscalation').value==='true',review_notes:q('#safetyProfileNotes').value.trim()||null,reviewed_by:q('#safetyProfileStatus').value==='approved'?currentUser.id:null,reviewed_at:q('#safetyProfileStatus').value==='approved'?new Date().toISOString():null,updated_at:new Date().toISOString()};
 const {error}=await sb.from('program_safety_profiles_v2').upsert(payload,{onConflict:'program_id'});
 if(error)return toast(error.message,true);q('#safetyProfileMsg').textContent='Saved.';loadBuilder();
}
function openRoute(id=null){
 editingRoute=id?routes.find(x=>x.id===id):null;
 q('#safetyRouteEditorTitle').textContent=editingRoute?'Edit Help Route':'New Help Route';
 q('#safetyRouteKey').value=editingRoute?.route_key||'';
 q('#safetyRouteLabel').value=editingRoute?.user_label||'';
 q('#safetyRouteUrgency').value=editingRoute?.urgency||'routine';
 q('#safetyRouteAction').value=editingRoute?.primary_action||'in_app_guidance';
 q('#safetyRouteGuidance').value=editingRoute?.guidance_text||'';
 q('#safetyRouteButtonLabel').value=editingRoute?.action_button_label||'';
 q('#safetyRouteOrder').value=editingRoute?.display_order||10;
 q('#safetyRouteStatus').value=editingRoute?.status||'draft';
 q('#safetyRouteArchive').classList.toggle('hidden',!editingRoute||editingRoute.status==='archived');
 q('#safetyRouteEditor').classList.remove('hidden');
}
function closeRoute(){q('#safetyRouteEditor').classList.add('hidden');editingRoute=null}
async function saveRoute(){
 const p={program_id:q('#safetyBuilderProgram').value,route_key:q('#safetyRouteKey').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'_'),user_label:q('#safetyRouteLabel').value.trim(),urgency:q('#safetyRouteUrgency').value,primary_action:q('#safetyRouteAction').value,guidance_text:q('#safetyRouteGuidance').value.trim()||null,action_button_label:q('#safetyRouteButtonLabel').value.trim()||null,display_order:Number(q('#safetyRouteOrder').value)||10,status:q('#safetyRouteStatus').value,updated_at:new Date().toISOString()};
 if(!p.route_key||!p.user_label)return toast('Route key and user label are required.',true);
 const res=editingRoute?await sb.from('program_safety_routes').update(p).eq('id',editingRoute.id):await sb.from('program_safety_routes').insert(p);
 if(res.error)return toast(res.error.message,true);closeRoute();loadBuilder();
}
async function archiveRoute(){if(!editingRoute)return;await sb.from('program_safety_routes').update({status:'archived'}).eq('id',editingRoute.id);closeRoute();loadBuilder()}
async function resolveBlocker(id){const note=prompt('Resolution note:');if(!note)return;const {error}=await sb.from('program_launch_blockers').update({resolved:true,resolution_note:note,resolved_by:currentUser.id,resolved_at:new Date().toISOString()}).eq('id',id);if(error)return toast(error.message,true);loadBuilder()}

q('#safetyQuickExit')?.addEventListener('click',quickExit);
q('#safetyGuidanceBack')?.addEventListener('click',renderSafetyRoutes);
q('#savePrivacyMode')?.addEventListener('click',savePrivacyMode);
q('#safetyBuilderProgram')?.addEventListener('change',loadBuilder);
q('#safetyBuilderRefresh')?.addEventListener('click',loadBuilder);
q('#safetyAddRoute')?.addEventListener('click',()=>openRoute());
q('#saveSafetyProfile')?.addEventListener('click',saveProfile);
q('#safetyRouteEditorClose')?.addEventListener('click',closeRoute);
q('#safetyRouteSave')?.addEventListener('click',saveRoute);
q('#safetyRouteArchive')?.addEventListener('click',archiveRoute);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='safety-center'){getProgram().then(loadSafetyCenter)}if(name==='privacy-mode')loadPrivacyMode();if(name==='safety-profile-builder')loadPrograms()};
}
})();
