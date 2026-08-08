
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,e=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(e)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}else if(window.showSync)showSync(m)};
let plusActive=false, journalEntries=[],collections=[],favoritesOnly=false,selectedEdition='year2';

async function membershipCheck(){
 if(!currentUser){plusActive=false;return false}
 const {data:r}=await sb.from('user_memberships').select('tier,status').eq('user_id',currentUser.id).maybeSingle();
 plusActive=r?.tier==='plus'&&['active','trialing'].includes(r?.status);
 ['journal','reminder','story'].forEach(k=>{
   q(`#${k}PlusLock`)?.classList.toggle('hidden',plusActive);
   q(`#${k}PlusContent`)?.classList.toggle('hidden',!plusActive);
 });
 return plusActive;
}
async function loadCollections(){
 if(!currentUser)return;
 const {data:r}=await sb.from('journal_collections').select('*').eq('user_id',currentUser.id).order('name');
 collections=r||[];
 const s=q('#journalPlusCollectionFilter');if(s){
   s.innerHTML='<option value="">All collections</option>'+collections.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
 }
 q('#journalPlusCollectionCount')&&(q('#journalPlusCollectionCount').textContent=collections.length);
}
async function loadJournalPlus(){
 if(!await membershipCheck())return;
 const range=q('#journalPlusRange')?.value||'all';
 let query=sb.from('journal_entries').select('id,entry_date,title,prompt_text,content').eq('user_id',currentUser.id).order('entry_date',{ascending:false});
 if(range!=='all'){const d=new Date();d.setDate(d.getDate()-Number(range));query=query.gte('entry_date',d.toISOString().slice(0,10))}
 const [{data:e},{data:f},{data:links}]=await Promise.all([
   query,
   sb.from('journal_favorites').select('journal_entry_id').eq('user_id',currentUser.id),
   sb.from('journal_collection_items').select('journal_entry_id,collection_id').eq('user_id',currentUser.id)
 ]);
 journalEntries=e||[];const fav=new Set((f||[]).map(x=>x.journal_entry_id));
 const linkMap={};(links||[]).forEach(x=>{(linkMap[x.journal_entry_id]??=[]).push(x.collection_id)});
 const search=(q('#journalPlusSearch')?.value||'').toLowerCase().trim(),cf=q('#journalPlusCollectionFilter')?.value||'';
 const filtered=journalEntries.filter(x=>{
   if(favoritesOnly&&!fav.has(x.id))return false;
   if(cf&&!(linkMap[x.id]||[]).includes(cf))return false;
   if(search&&!`${x.title||''} ${x.prompt_text||''} ${x.content||''}`.toLowerCase().includes(search))return false;
   return true;
 });
 q('#journalPlusCount')&&(q('#journalPlusCount').textContent=filtered.length);
 q('#journalPlusFavoriteCount')&&(q('#journalPlusFavoriteCount').textContent=fav.size);
 const box=q('#journalPlusList');if(!box)return;
 box.innerHTML=filtered.length?filtered.map(x=>{
   const cols=(linkMap[x.id]||[]).map(id=>collections.find(c=>c.id===id)?.name).filter(Boolean);
   return `<article class="journal-plus-card"><div class="journal-plus-card-head"><div><small>${esc(x.entry_date)}</small><h3>${esc(x.title||x.prompt_text||'Journal Entry')}</h3></div><span>${fav.has(x.id)?'★':'☆'}</span></div><p>${esc(String(x.content||'').slice(0,260))}</p><div>${cols.map(c=>`<span class="collection-pill">${esc(c)}</span>`).join(' ')}</div><div class="journal-plus-card-actions"><button data-favorite-journal="${x.id}">${fav.has(x.id)?'Remove favorite':'Favorite'}</button><button data-collect-journal="${x.id}">Add to collection</button></div></article>`;
 }).join(''):'<div class="approved-resource-empty"><b>No matching journal entries.</b></div>';
 qa('[data-favorite-journal]').forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.favoriteJournal,fav.has(b.dataset.favoriteJournal)));
 qa('[data-collect-journal]').forEach(b=>b.onclick=()=>addToCollection(b.dataset.collectJournal));
}
async function toggleFavorite(id,on){
 if(on)await sb.from('journal_favorites').delete().eq('user_id',currentUser.id).eq('journal_entry_id',id);
 else await sb.from('journal_favorites').insert({user_id:currentUser.id,journal_entry_id:id});
 loadJournalPlus();
}
async function addToCollection(id){
 if(!collections.length)return toast('Create a collection first.',true);
 const name=prompt('Collection name:');if(!name)return;
 const c=collections.find(x=>x.name.toLowerCase()===name.toLowerCase());
 if(!c)return toast('That collection does not exist.',true);
 await sb.from('journal_collection_items').upsert({user_id:currentUser.id,collection_id:c.id,journal_entry_id:id},{onConflict:'user_id,collection_id,journal_entry_id'});
 loadJournalPlus();
}
async function newCollection(){
 const name=prompt('New collection name:');if(!name?.trim())return;
 const {error}=await sb.from('journal_collections').insert({user_id:currentUser.id,name:name.trim()});
 if(error)return toast(error.message,true);
 await loadCollections();loadJournalPlus();toast('Collection created.');
}
const reminderDefaults={
 meeting:['Meeting / Appointment','Recovery support is on your schedule.'],
 support:['Reach Out','A little connection can be enough for today.'],
 journal:['Journal','Take a few minutes to notice what is here.'],
 health:['Health / Routine','Take care of one thing your body or routine needs.'],
 milestone:['Milestone / Review','Your recovery history deserves a moment of reflection.'],
 custom:['Custom reminder','']
};
function openReminder(type){
 const d=reminderDefaults[type]||reminderDefaults.custom;
 q('#reminderEditorTitle').textContent=d[0];q('#reminderPlusTitle').value=d[0];q('#reminderPlusMessage').value=d[1];q('#reminderEditor').classList.remove('hidden');
}
async function loadRemindersPlus(){
 if(!await membershipCheck())return;
 const {data:r}=await sb.from('custom_reminder_sets').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false});
 const rows=r||[];q('#reminderPlusCount')&&(q('#reminderPlusCount').textContent=`${rows.length} saved`);
 const box=q('#reminderPlusList');if(!box)return;
 box.innerHTML=rows.length?rows.map(x=>`<article class="connection-row"><div class="connection-row-icon">◷</div><div><b>${esc(x.title)}</b><small>${esc((x.days_of_week||[]).map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(' • '))}${x.reminder_time?` • ${esc(String(x.reminder_time).slice(0,5))}`:''}</small></div><div class="meta"><button class="approved-link" data-delete-reminder-plus="${x.id}">Delete</button></div></article>`).join(''):'<div class="approved-resource-empty"><b>No custom Reminder+ sets yet.</b></div>';
 qa('[data-delete-reminder-plus]').forEach(b=>b.onclick=async()=>{await sb.from('custom_reminder_sets').delete().eq('user_id',currentUser.id).eq('id',b.dataset.deleteReminderPlus);loadRemindersPlus()});
}
async function saveReminder(){
 const days=[...q('#reminderPlusDays').selectedOptions].map(x=>Number(x.value)),title=q('#reminderPlusTitle').value.trim();
 if(!title||!days.length)return toast('Add a title and at least one day.',true);
 const {error}=await sb.from('custom_reminder_sets').insert({user_id:currentUser.id,title,message:q('#reminderPlusMessage').value.trim()||null,days_of_week:days,reminder_time:q('#reminderPlusTime').value,enabled:true});
 if(error)return toast(error.message,true);
 q('#reminderEditor').classList.add('hidden');loadRemindersPlus();toast('Reminder+ saved.');
}
function renderStoryPreview(){
 const sections=qa('[data-story-section]:checked').map(x=>x.dataset.storySection);
 const labels={year2:'Year 2 Edition',year5:'5-Year Edition',year10:'10-Year Edition'};
 q('#storyEditionPreview').innerHTML=`<span class="approved-kicker">${esc(labels[selectedEdition])}</span><h3>My Recovery Story</h3><p>This edition is prepared from the parts of your Lellee history you choose to include.</p><ul>${sections.map(s=>`<li>${esc(s.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()))}</li>`).join('')}</ul>${q('#storyEditionNote').value.trim()?`<p><em>${esc(q('#storyEditionNote').value.trim())}</em></p>`:''}`;
}
async function loadStoryEditions(){
 if(!await membershipCheck())return;
 renderStoryPreview();
}
async function saveStoryEdition(){
 const sections=qa('[data-story-section]:checked').map(x=>x.dataset.storySection);
 const {error}=await sb.from('recovery_story_editions').insert({user_id:currentUser.id,edition_type:selectedEdition,included_sections:sections,edition_note:q('#storyEditionNote').value.trim()||null,status:'draft'});
 if(error)return toast(error.message,true);toast('Story edition setup saved.');
}
function bind(){
 q('#journalPlusSearch')?.addEventListener('input',loadJournalPlus);q('#journalPlusRange')?.addEventListener('change',loadJournalPlus);q('#journalPlusCollectionFilter')?.addEventListener('change',loadJournalPlus);
 q('#showJournalFavorites')?.addEventListener('click',()=>{favoritesOnly=!favoritesOnly;q('#showJournalFavorites').textContent=favoritesOnly?'Show all':'Favorites only';loadJournalPlus()});
 q('#newJournalCollection')?.addEventListener('click',newCollection);
 qa('[data-reminder-template]').forEach(b=>b.addEventListener('click',()=>openReminder(b.dataset.reminderTemplate)));
 q('#cancelReminderPlus')?.addEventListener('click',()=>q('#reminderEditor').classList.add('hidden'));q('#saveReminderPlus')?.addEventListener('click',saveReminder);
 qa('[data-story-edition]').forEach(b=>b.addEventListener('click',()=>{selectedEdition=b.dataset.storyEdition;qa('[data-story-edition]').forEach(x=>x.classList.toggle('selected',x===b));renderStoryPreview()}));
 qa('[data-story-section]').forEach(x=>x.addEventListener('change',renderStoryPreview));q('#storyEditionNote')?.addEventListener('input',renderStoryPreview);
 q('#saveStoryEdition')?.addEventListener('click',saveStoryEdition);q('#printStoryEdition')?.addEventListener('click',()=>window.print());
}
bind();
const oldShow=showPage;
showPage=function(name){oldShow(name);if(name==='journal-plus'){Promise.all([loadCollections()]).then(loadJournalPlus)}if(name==='reminders-plus')loadRemindersPlus();if(name==='story-editions')loadStoryEditions()};
})();
