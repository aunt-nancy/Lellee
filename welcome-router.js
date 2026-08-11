
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2500)}};
let selectedProgram=null,isAdmin=false;

async function getProgram(slug){
 const {data}=await sb.from('programs').select('id,slug,name,short_description,status').eq('slug',slug).maybeSingle();
 return data||null;
}
async function openInterest(slug){
 selectedProgram=await getProgram(slug);
 if(!selectedProgram)return toast('Program not found.',true);
 q('#programInterestTitle').textContent=selectedProgram.status==='active'?`${selectedProgram.name} is available now.`:`Interested in ${selectedProgram.name}?`;
 q('#programInterestDescription').textContent=selectedProgram.short_description||'Tell Lellee this type of support matters to you.';
 q('#programInterestName').textContent=selectedProgram.name;
 const active=selectedProgram.status==='active';
 q('#programInterestActive').classList.toggle('hidden',!active);
 q('#programInterestPlanned').classList.toggle('hidden',active);
 showPage('program-interest');
}
async function saveInterest(){
 if(!currentUser||!selectedProgram)return;
 const reasons=qa('[data-program-interest-reason]:checked').map(x=>x.value);
 const note=q('#programInterestNote').value.trim()||null;
 const {error}=await sb.from('program_interest_requests').upsert({
   user_id:currentUser.id,
   program_id:selectedProgram.id,
   reasons,
   note,
   status:'interested',
   updated_at:new Date().toISOString()
 },{onConflict:'user_id,program_id'});
 if(error)return toast(error.message,true);
 q('#programInterestMsg').textContent='Saved. Lellee will use this signal to help prioritize future programs.';
 toast('Interest saved.');
}
async function loadProgramCatalogLinks(){
 const box=q('#programCoreCatalog');if(!box)return;
 const cards=qa('#programCoreCatalog .program-core-card');
 cards.forEach((card,i)=>{
   const planned=card.querySelector('.program-core-status')?.textContent==='PLANNED';
   if(planned&&!card.querySelector('.program-demand-link')){
     const name=card.querySelector('h3')?.textContent||'';
     const p=programs?.find?.(x=>x.name===name);
     if(p){
       const b=document.createElement('button');
       b.className='approved-link program-demand-link';
       b.textContent="I'm interested →";
       b.onclick=()=>openInterest(p.slug);
       card.appendChild(b);
     }
   }
 });
}
async function checkAdmin(){
 const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();
 isAdmin=!!data?.active&&['admin','editor'].includes(data.role);
 return isAdmin;
}
async function loadDemand(){
 if(!await checkAdmin())return;
 const {data,error}=await sb.from('program_interest_summary').select('*').order('interest_count',{ascending:false});
 if(error)return toast(error.message,true);
 const rows=data||[],total=rows.reduce((n,x)=>n+Number(x.interest_count||0),0),people=rows.reduce((n,x)=>n+Number(x.unique_people||0),0),top=rows[0]?.interest_count||0;
 q('#programDemandTotal').textContent=total;q('#programDemandPeople').textContent=people;q('#programDemandTopCount').textContent=top;
 q('#programDemandList').innerHTML=rows.length?rows.map((x,i)=>`<div class="program-demand-row"><div class="program-demand-rank">${i+1}</div><div><b>${esc(x.program_name)}</b><small>${esc(x.status)} · ${x.personal_use_count||0} personal · ${x.professional_count||0} professional/organization</small></div><span class="program-demand-count">${x.interest_count}</span></div>`).join(''):'<div class="approved-resource-empty">No program interest signals yet.</div>';
}
function routeQuery(){
 if(!currentUser)return;
 const params=new URLSearchParams(location.search),interest=params.get('interest'),program=params.get('program');
 if(interest){openInterest(interest);return}
 if(program==='recovery'){showPage('today')}
}
q('#saveProgramInterest')?.addEventListener('click',saveInterest);
q('#programInterestOpenActive')?.addEventListener('click',()=>showPage('today'));

if(typeof showPage==='function'){
 const oldShow=showPage;
 showPage=function(name){
   oldShow(name);
   if(name==='programs')setTimeout(loadProgramCatalogLinks,150);
   if(name==='program-demand')loadDemand();
 };
}
let tries=0;const timer=setInterval(()=>{tries++;if(typeof currentUser!=='undefined'&&currentUser){clearInterval(timer);routeQuery()}else if(tries>40)clearInterval(timer)},200);
})();
