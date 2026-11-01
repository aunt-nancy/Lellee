(()=>{
'use strict';
const VERSION='caregiving-coordinator-20261101-v1';
const TYPE_META={
 appointment:{label:'Appointments',icon:'◷'},medication:{label:'Medications',icon:'+'},
 note:{label:'Notes',icon:'✎'},routine:{label:'Routines',icon:'↻'},contact:{label:'Contacts',icon:'♡'}
};
const COLOR={sage:'#8ba486',lavender:'#9a83b5',sky:'#709bb8',gold:'#b99a55',rose:'#ba7b87',navy:'#4a526f'};
let recipients=[],records=[],selectedId=null,backendCaregiving=false,loadedFor=null,loading=false,navEl=null;
const q=s=>document.querySelector(s),qa=s=>Array.from(document.querySelectorAll(s));
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function user(){try{return currentUser||window.currentUser||null}catch(_){return window.currentUser||null}}
function client(){try{return sb||window.sb||null}catch(_){return window.sb||null}}
function toast(message,bad=false){const el=q('#globalToast');if(!el)return;el.textContent=message;el.style.background=bad?'#7f2634':'#213b38';el.classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.classList.add('hidden');el.style.background=''},2800)}
function caregivingRequested(){
 const params=new URLSearchParams(location.search);const requested=(params.get('recommended')||params.get('program')||'').replaceAll('_','-');
 let saved='';try{saved=sessionStorage.getItem('lellee_browse_program_v1')||sessionStorage.getItem('lellee:active-consumer-journey:v1')||''}catch(_){}
 if(requested)return requested==='caregiving';
 try{if(typeof activeBrowseProgram!=='undefined'&&activeBrowseProgram==='caregiving')return true}catch(_){}
 return saved==='caregiving'||backendCaregiving;
}
function build(){
 if(q('#page-caregiving-coordinator'))return;
 const nav=document.createElement('button');navEl=nav;nav.type='button';nav.className='nav-item caregiving-coordinator-nav';nav.dataset.page='caregiving-coordinator';nav.innerHTML='<span class="nav-icon">♡</span>Care Coordination';
 const anchor=q('.sidebar [data-page="tools"]')||q('.sidebar [data-page="resources"]');anchor?.after(nav);
 const content=q('#lelleeMain .content')||q('main .content')||q('.content');if(!content)return;
 const page=document.createElement('section');page.id='page-caregiving-coordinator';page.className='page';page.innerHTML=`
  <div class="caregiving-coordinator-shell">
   <header class="caregiving-hero"><div><span class="caregiving-kicker">Private Caregiving Workspace</span><h2>Care Coordination</h2><p>Keep each person's information separate while seeing appointments, routines and responsibilities together. Lellee organizes what you enter; it does not diagnose, prescribe or replace a qualified professional.</p></div><div class="caregiving-actions"><button class="approved-small-action" id="caregivingAddRecipient" type="button">Add person</button><button class="approved-link" id="caregivingAddRecord" type="button">Add item</button></div></header>
   <div class="caregiving-private-note">Private by default. Every profile and item is restricted to your signed-in account.</div>
   <div id="caregivingSignedOut" class="caregiving-signin hidden"><h3>Sign in to use your private Caregiving workspace</h3><p>You can continue browsing Caregiving without an account. Sign in is required only to save people, appointments, medication organization, notes, routines and contacts.</p><button class="approved-small-action" id="caregivingSignIn" type="button">Sign In When Ready</button></div>
   <div id="caregivingPrivateWorkspace" class="hidden">
    <div class="caregiving-stats" aria-label="Caregiving overview"><div class="caregiving-stat"><b id="caregivingRecipientCount">0</b><small>People supported</small></div><div class="caregiving-stat"><b id="caregivingAppointmentCount">0</b><small>Upcoming appointments</small></div><div class="caregiving-stat"><b id="caregivingMedicationCount">0</b><small>Medication records</small></div><div class="caregiving-stat"><b id="caregivingRoutineCount">0</b><small>Open routines</small></div><div class="caregiving-stat"><b id="caregivingContactCount">0</b><small>Saved contacts</small></div></div>
    <div class="caregiving-grid"><aside class="caregiving-panel"><div class="caregiving-panel-head"><h3>People you support</h3><button class="approved-link" id="caregivingAddRecipientInline" type="button">Add</button></div><div id="caregivingRecipientList" class="caregiving-recipient-list"></div></aside><section class="caregiving-panel"><div class="caregiving-panel-head"><h3 id="caregivingDetailTitle">Consolidated overview</h3><button class="approved-link hidden" id="caregivingEditRecipient" type="button">Edit profile</button></div><div id="caregivingDetail"></div></section></div>
   </div>
  </div>`;content.appendChild(page);
 const dialogs=document.createElement('div');dialogs.innerHTML=`
 <dialog class="caregiving-dialog" id="caregivingRecipientDialog"><form method="dialog" id="caregivingRecipientForm"><h3 id="caregivingRecipientDialogTitle">Add a person</h3><input type="hidden" id="caregivingRecipientId"><div class="caregiving-form-grid"><label>Name or private label<input id="caregivingRecipientName" maxlength="120" required autocomplete="off"></label><label>Relationship<input id="caregivingRecipientRelationship" maxlength="120" placeholder="Parent, partner, child…" autocomplete="off"></label><label>Color<select id="caregivingRecipientColor"><option value="sage">Sage</option><option value="lavender">Lavender</option><option value="sky">Sky</option><option value="gold">Gold</option><option value="rose">Rose</option><option value="navy">Navy</option></select></label><label class="full">Important organizing details<textarea id="caregivingRecipientDetails" maxlength="4000" placeholder="Optional details you want kept with this profile"></textarea></label></div><p class="caregiving-guardrail">Use this space for organization. Contact a qualified professional for medical, legal or emergency guidance.</p><div class="caregiving-dialog-actions"><button value="cancel" type="button" data-close-caregiving-dialog="caregivingRecipientDialog">Cancel</button><button class="approved-small-action" type="submit" value="save">Save profile</button></div></form></dialog>
 <dialog class="caregiving-dialog" id="caregivingRecordDialog"><form method="dialog" id="caregivingRecordForm"><h3>Add a Caregiving item</h3><div class="caregiving-form-grid"><label>Person<select id="caregivingRecordRecipient" required></select></label><label>Item type<select id="caregivingRecordType"><option value="appointment">Appointment</option><option value="medication">Medication organization</option><option value="note">Note</option><option value="routine">Routine</option><option value="contact">Contact</option></select></label><label class="full">Title<input id="caregivingRecordTitle" maxlength="180" required autocomplete="off"></label><label>Date and time<input id="caregivingRecordDate" type="datetime-local"></label><label>Schedule or instructions<input id="caregivingRecordSchedule" maxlength="500" placeholder="Example: weekdays at 8 AM"></label><label>Phone<input id="caregivingRecordPhone" maxlength="80" inputmode="tel" autocomplete="off"></label><label class="full">Details<textarea id="caregivingRecordDetails" maxlength="8000"></textarea></label></div><p class="caregiving-guardrail">Medication entries are organizational records only. Do not change medication or treatment without guidance from the prescribing professional.</p><div class="caregiving-dialog-actions"><button value="cancel" type="button" data-close-caregiving-dialog="caregivingRecordDialog">Cancel</button><button class="approved-small-action" type="submit" value="save">Save item</button></div></form></dialog>`;document.body.appendChild(dialogs);
 bind();updateVisibility();render();
}
function updateVisibility(){
 const visible=caregivingRequested(),nav=navEl||q('.caregiving-coordinator-nav');
 if(nav&&visible&&!nav.isConnected){const anchor=q('.sidebar [data-page="tools"]')||q('.sidebar [data-page="resources"]');anchor?.after(nav)}
 if(nav&&!visible)nav.remove();
 const preview=q('#page-program-preview .program-preview-actions')||q('#page-program-preview .approved-actions');
 if(!visible)q('#caregivingPreviewOpen')?.remove();
 else if(preview&&!q('#caregivingPreviewOpen')){const button=document.createElement('button');button.id='caregivingPreviewOpen';button.type='button';button.className='approved-link';button.textContent='Open Care Coordination';button.onclick=openWorkspace;preview.appendChild(button)}
}
function requestSignIn(){try{if(typeof requireAccount==='function'){requireAccount('use your private Caregiving workspace');return}}catch(_){}q('#programPreviewSignIn')?.click()}
function preserveCaregivingSelection(){
 try{sessionStorage.setItem('lellee_browse_program_v1','caregiving');sessionStorage.setItem('lellee:active-consumer-journey:v1','caregiving')}catch(_){}
 try{if(typeof activeBrowseProgram!=='undefined')activeBrowseProgram='caregiving';if(typeof programBrowsePreviewMode!=='undefined')programBrowsePreviewMode=true}catch(_){}
}
function openWorkspace(){preserveCaregivingSelection();updateVisibility();try{showPage('caregiving-coordinator')}catch(_){window.LelleeNavigatePage?.('caregiving-coordinator')}void load()}
async function detectBackendProgram(){
 const u=user(),c=client();if(!u||!c)return;
 try{const state=await c.from('user_program_state').select('active_program_id').eq('user_id',u.id).maybeSingle();if(!state.data?.active_program_id)return;const program=await c.from('programs').select('slug').eq('id',state.data.active_program_id).maybeSingle();backendCaregiving=program.data?.slug==='caregiving';updateVisibility()}catch(_){}
}
async function load(force=false){
 preserveCaregivingSelection();const u=user(),c=client();render();if(!u||!c)return;if(loading||(!force&&loadedFor===u.id))return;loading=true;
 try{const [people,items]=await Promise.all([c.from('caregiving_recipients').select('*').eq('user_id',u.id).eq('active',true).order('sort_order').order('created_at'),c.from('caregiving_records').select('*').eq('user_id',u.id).order('scheduled_for',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false})]);if(people.error)throw people.error;if(items.error)throw items.error;recipients=people.data||[];records=items.data||[];selectedId=selectedId&&recipients.some(x=>x.id===selectedId)?selectedId:null;loadedFor=u.id;render()}catch(error){toast(error.message||'Caregiving records could not be loaded.',true)}finally{loading=false}
}
function setText(id,value){const el=q('#'+id);if(el)el.textContent=String(value)}
function count(type,predicate=()=>true){return records.filter(x=>x.record_type===type&&predicate(x)).length}
function render(){
 const signedIn=!!user();q('#caregivingSignedOut')?.classList.toggle('hidden',signedIn);q('#caregivingPrivateWorkspace')?.classList.toggle('hidden',!signedIn);q('#caregivingAddRecipient')?.classList.toggle('hidden',!signedIn);q('#caregivingAddRecord')?.classList.toggle('hidden',!signedIn);if(!signedIn)return;
 setText('caregivingRecipientCount',recipients.length);setText('caregivingAppointmentCount',count('appointment',x=>!x.is_complete));setText('caregivingMedicationCount',count('medication',x=>!x.is_complete));setText('caregivingRoutineCount',count('routine',x=>!x.is_complete));setText('caregivingContactCount',count('contact'));
 const list=q('#caregivingRecipientList');if(list)list.innerHTML=recipients.length?recipients.map(person=>{const n=records.filter(x=>x.recipient_id===person.id&&!x.is_complete).length;return `<button type="button" class="caregiving-recipient${selectedId===person.id?' selected':''}" data-caregiving-recipient="${person.id}" style="--care-color:${COLOR[person.color_key]||COLOR.sage}"><b>${esc(person.display_name)}</b><span>${esc(person.relationship_label||'Care recipient')} · ${n} open item${n===1?'':'s'}</span></button>`}).join(''):'<div class="caregiving-empty">Add the first person you support. You can keep three or more profiles separate.</div>';
 const edit=q('#caregivingEditRecipient');edit?.classList.toggle('hidden',!selectedId);if(selectedId)renderRecipient();else renderOverview();
}
function recordCard(item){
 const person=recipients.find(x=>x.id===item.recipient_id),meta=TYPE_META[item.record_type]||{label:item.record_type,icon:'•'};const when=item.scheduled_for?new Date(item.scheduled_for).toLocaleString([], {dateStyle:'medium',timeStyle:'short'}):item.schedule_text||'';
 return `<article class="caregiving-record${item.is_complete?' done':''}"><div class="caregiving-record-icon">${meta.icon}</div><div><b>${esc(item.title)}</b><small>${esc(person?.display_name||'Care recipient')}${when?' · '+esc(when):''}${item.phone?' · '+esc(item.phone):''}</small>${item.details?`<p>${esc(item.details)}</p>`:''}</div><div class="caregiving-record-actions">${['appointment','routine','medication'].includes(item.record_type)?`<button type="button" data-caregiving-toggle="${item.id}">${item.is_complete?'Reopen':'Done'}</button>`:''}<button type="button" data-caregiving-delete-record="${item.id}">Remove</button></div></article>`;
}
function renderOverview(){
 setText('caregivingDetailTitle','Consolidated overview');const box=q('#caregivingDetail');if(!box)return;
 const open=records.filter(x=>!x.is_complete).sort((a,b)=>String(a.scheduled_for||'9999').localeCompare(String(b.scheduled_for||'9999'))).slice(0,20);
 box.innerHTML=recipients.length?`<div class="caregiving-section"><h4>Across everyone</h4><div class="caregiving-overview-list">${open.length?open.map(recordCard).join(''):'<div class="caregiving-empty">No open appointments, medication records or routines yet.</div>'}</div></div>`:'<div class="caregiving-empty"><b>Your consolidated overview starts here.</b><br>Add each person separately, then attach their appointments, medication organization, notes, routines and contacts.</div>';
}
function renderRecipient(){
 const person=recipients.find(x=>x.id===selectedId);if(!person){selectedId=null;return renderOverview()}setText('caregivingDetailTitle',person.display_name);const box=q('#caregivingDetail');if(!box)return;const mine=records.filter(x=>x.recipient_id===person.id);
 box.innerHTML=`${person.relationship_label||person.important_details?`<div class="caregiving-private-note"><b>${esc(person.relationship_label||'Care recipient')}</b>${person.important_details?`<br>${esc(person.important_details)}`:''}</div>`:''}<div class="caregiving-actions" style="margin-top:12px"><button type="button" class="approved-small-action" data-caregiving-add-for="${person.id}">Add item for ${esc(person.display_name)}</button><button type="button" class="approved-link" data-caregiving-overview>Back to overview</button></div>${Object.entries(TYPE_META).map(([type,meta])=>{const rows=mine.filter(x=>x.record_type===type);return `<section class="caregiving-section"><h4>${meta.label} · ${rows.length}</h4><div class="caregiving-type-list">${rows.length?rows.map(recordCard).join(''):`<div class="caregiving-empty">No ${meta.label.toLowerCase()} saved.</div>`}</div></section>`}).join('')}`;
}
function recipientOptions(){const select=q('#caregivingRecordRecipient');if(select)select.innerHTML=recipients.map(x=>`<option value="${x.id}">${esc(x.display_name)}</option>`).join('')}
function openRecipient(id=null){
 if(!user())return requestSignIn();const person=id?recipients.find(x=>x.id===id):null;q('#caregivingRecipientDialogTitle').textContent=person?'Edit profile':'Add a person';q('#caregivingRecipientId').value=person?.id||'';q('#caregivingRecipientName').value=person?.display_name||'';q('#caregivingRecipientRelationship').value=person?.relationship_label||'';q('#caregivingRecipientColor').value=person?.color_key||'sage';q('#caregivingRecipientDetails').value=person?.important_details||'';q('#caregivingRecipientDialog').showModal();q('#caregivingRecipientName').focus();
}
function openRecord(recipientId=selectedId){
 if(!user())return requestSignIn();if(!recipients.length)return openRecipient();recipientOptions();q('#caregivingRecordForm').reset();recipientOptions();q('#caregivingRecordRecipient').value=recipientId||recipients[0].id;q('#caregivingRecordDialog').showModal();q('#caregivingRecordTitle').focus();
}
async function saveRecipient(event){
 event.preventDefault();const u=user(),c=client();if(!u||!c)return requestSignIn();const id=q('#caregivingRecipientId').value;const row={user_id:u.id,display_name:q('#caregivingRecipientName').value.trim(),relationship_label:q('#caregivingRecipientRelationship').value.trim()||null,color_key:q('#caregivingRecipientColor').value,important_details:q('#caregivingRecipientDetails').value.trim()||null};if(!row.display_name)return toast('Add a name or private label.',true);const result=id?await c.from('caregiving_recipients').update(row).eq('id',id).eq('user_id',u.id).select().single():await c.from('caregiving_recipients').insert(row).select().single();if(result.error)return toast(result.error.message,true);q('#caregivingRecipientDialog').close();selectedId=result.data.id;loadedFor=null;await load(true);toast(id?'Profile updated.':'Care recipient added.')
}
async function saveRecord(event){
 event.preventDefault();const u=user(),c=client();if(!u||!c)return requestSignIn();const localDate=q('#caregivingRecordDate').value;const row={user_id:u.id,recipient_id:q('#caregivingRecordRecipient').value,record_type:q('#caregivingRecordType').value,title:q('#caregivingRecordTitle').value.trim(),details:q('#caregivingRecordDetails').value.trim()||null,scheduled_for:localDate?new Date(localDate).toISOString():null,schedule_text:q('#caregivingRecordSchedule').value.trim()||null,phone:q('#caregivingRecordPhone').value.trim()||null};if(!row.title)return toast('Add a title.',true);const result=await c.from('caregiving_records').insert(row);if(result.error)return toast(result.error.message,true);q('#caregivingRecordDialog').close();selectedId=row.recipient_id;loadedFor=null;await load(true);toast('Caregiving item saved.')
}
async function toggleRecord(id){const item=records.find(x=>x.id===id),u=user(),c=client();if(!item||!u||!c)return;const result=await c.from('caregiving_records').update({is_complete:!item.is_complete}).eq('id',id).eq('user_id',u.id);if(result.error)return toast(result.error.message,true);item.is_complete=!item.is_complete;render()}
async function removeRecord(id){const u=user(),c=client();if(!u||!c)return;if(!confirm('Remove this Caregiving item?'))return;const result=await c.from('caregiving_records').delete().eq('id',id).eq('user_id',u.id);if(result.error)return toast(result.error.message,true);records=records.filter(x=>x.id!==id);render();toast('Item removed.')}
function bind(){
 q('#caregivingSignIn')?.addEventListener('click',requestSignIn);q('#caregivingAddRecipient')?.addEventListener('click',()=>openRecipient());q('#caregivingAddRecipientInline')?.addEventListener('click',()=>openRecipient());q('#caregivingAddRecord')?.addEventListener('click',()=>openRecord());q('#caregivingEditRecipient')?.addEventListener('click',()=>openRecipient(selectedId));q('#caregivingRecipientForm')?.addEventListener('submit',saveRecipient);q('#caregivingRecordForm')?.addEventListener('submit',saveRecord);qa('[data-close-caregiving-dialog]').forEach(button=>button.addEventListener('click',()=>q('#'+button.dataset.closeCaregivingDialog)?.close()));
 document.addEventListener('click',event=>{const el=event.target instanceof Element?event.target.closest('[data-caregiving-recipient],[data-caregiving-add-for],[data-caregiving-overview],[data-caregiving-toggle],[data-caregiving-delete-record]'):null;if(!el)return;if(el.dataset.caregivingRecipient){selectedId=el.dataset.caregivingRecipient;render()}else if(el.dataset.caregivingAddFor)openRecord(el.dataset.caregivingAddFor);else if('caregivingOverview' in el.dataset){selectedId=null;render()}else if(el.dataset.caregivingToggle)void toggleRecord(el.dataset.caregivingToggle);else if(el.dataset.caregivingDeleteRecord)void removeRecord(el.dataset.caregivingDeleteRecord)});
}
function installNavigationHook(){try{const prior=showPage;showPage=function(name){prior(name);if(name==='caregiving-coordinator')void load()};window.LelleeNavigatePage=showPage}catch(_){}}
function boot(){build();installNavigationHook();void detectBackendProgram();let tries=0;const timer=setInterval(()=>{tries++;const id=user()?.id||null;if(id&&id!==loadedFor){void detectBackendProgram();if(q('#page-caregiving-coordinator')?.classList.contains('active'))void load()}if(tries>60||loadedFor===id)clearInterval(timer)},250)}
window.LelleeCaregivingCoordinator={version:VERSION,open:openWorkspace,refresh:()=>load(true)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
