
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>'$'+Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2500)}};
let marketEnabled=false,marketRows=[],selectedBusiness=null,selectedService=null,myBusiness=null,isAdmin=false;

function injectMarketplacePricingStyles(){
 if(q('#coachMarketplacePricingStyle'))return;
 const st=document.createElement('style');
 st.id='coachMarketplacePricingStyle';
 st.textContent='.coach-market-price{margin-top:8px;display:grid;gap:3px}.coach-market-price b{color:#075b4d;font-size:.98rem}.coach-market-price small{color:#6b7280;line-height:1.35}.coach-market-card .coach-market-price{border-top:1px solid rgba(7,91,77,.1);padding-top:8px}.coach-service-selected{outline:2px solid rgba(7,91,77,.28);background:#f5fbf8}.coach-price-disclosure{display:block;margin-top:4px;color:#6b7280;font-size:.72rem;line-height:1.35}.coach-price-total{display:block;color:#075b4d;font-weight:900}.coach-market-card-head span{white-space:nowrap;color:#075b4d;font-weight:900}';
 document.head.appendChild(st);
}
function asNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
function quoteForService(s){
 const quote=s?.pricing_quote||s?.price_quote_snapshot||s?.price_explanation||{};
 const free=s?.billing_model==='free';
 const listed=asNum(quote.listed_coach_price_amount)??asNum(s?.listed_coach_price_amount)??asNum(s?.price_amount);
 const adjustment=asNum(quote.coach_adjustment_amount)??asNum(s?.coach_adjustment_amount)??(asNum(s?.coach_discount_amount)?-asNum(s.coach_discount_amount):0);
 const coachAfter=free?0:(asNum(quote.coach_price_after_adjustment_amount)??asNum(s?.coach_price_after_discount)??(listed!=null?listed+(adjustment||0):null));
 const processing=free?0:(asNum(quote.processing_fee_amount)??asNum((quote.processing_fee_cents||0)/100));
 const total=free?0:(asNum(quote.customer_total_amount)??asNum((quote.customer_total_cents||0)/100)??(coachAfter!=null&&processing!=null?coachAfter+processing:null));
 const frequency=quote.frequency_label||s?.pricing_frequency_key?.replaceAll('_',' ')||s?.billing_model?.replaceAll('_',' ')||'Service';
 return {free,listed,adjustment:adjustment||0,coachAfter,processing,total,frequency,formula:quote.discount_example_formula||'',policy:quote.adjustment_policy_label||'Customer total includes coach price and processing fees.'};
}
function serviceTotal(s){return quoteForService(s).total}
function servicePriceHtml(s,compact=false){
 const p=quoteForService(s);
 if(p.free)return '<div class="coach-market-price"><b>Free</b><small>No customer charge.</small></div>';
 if(p.total==null)return '<div class="coach-market-price"><b>Contact for total</b><small>Coach price and processing fees are not fully configured yet.</small></div>';
 const adj=p.adjustment>0?' + '+money(p.adjustment)+' coach increase':(p.adjustment<0?' − '+money(Math.abs(p.adjustment))+' coach discount':'');
 return '<div class="coach-market-price">'+
   '<b>'+money(p.total)+' customer total</b>'+
   '<small>'+esc(p.frequency)+(adj?esc(adj):'')+'</small>'+
   (!compact?'<small>'+money(p.coachAfter)+' coach price + '+money(p.processing)+' processing fees</small>':'')+
   (!compact&&p.formula?'<small>'+esc(p.formula)+'</small>':'')+
 '</div>';
}
function lowestService(services){
 return services.map(s=>({service:s,total:serviceTotal(s)})).filter(x=>x.total!=null&&!Number.isNaN(x.total)).sort((a,b)=>a.total-b.total)[0]||null;
}
async function setting(key){
 const {data}=await sb.from('app_public_settings').select('value').eq('key',key).maybeSingle();
 return data?.value||null;
}
async function loadMarket(){
 injectMarketplacePricingStyles();
 marketEnabled=(await setting('coach_public_marketplace_enabled'))==='true';
 q('#coachMarketplaceOff')?.classList.toggle('hidden',marketEnabled);
 q('#coachMarketplaceContent')?.classList.toggle('hidden',!marketEnabled);
 if(!marketEnabled)return;

 const {data,error}=await sb.from('coach_marketplace_profiles')
 .select('business_id,business_name,public_name,bio,credentials_disclosure,primary_program_id,programs(name),coach_service_packages(id,name,service_type,price_amount,billing_model,active,pricing_frequency_key,weekly_base_price_amount,listed_coach_price_amount,coach_adjustment_amount,coach_discount_amount,coach_price_after_discount,price_quote_snapshot,pricing_quote,price_explanation),coach_groups(id,name,capacity,status,start_date,coach_group_members(id))')
 .eq('visible',true).order('public_name');
 if(error)return toast(error.message,true);
 marketRows=data||[];
 const programs=[...new Map(marketRows.map(r=>[r.primary_program_id,r.programs?.name]).filter(x=>x[0])).entries()];
 const ps=q('#coachMarketProgram');if(ps)ps.innerHTML='<option value="">All active programs</option>'+programs.map(([id,name])=>`<option value="${id}">${esc(name)}</option>`).join('');
 renderMarket();
}
function renderMarket(){
 const text=(q('#coachMarketSearch')?.value||'').toLowerCase(),program=q('#coachMarketProgram')?.value||'',type=q('#coachMarketType')?.value||'',price=q('#coachMarketPrice')?.value||'';
 const rows=marketRows.filter(r=>{
  if(text&&!`${r.public_name||''} ${r.business_name||''} ${r.bio||''}`.toLowerCase().includes(text))return false;
  if(program&&r.primary_program_id!==program)return false;
  const services=(r.coach_service_packages||[]).filter(s=>s.active);
  if(type&&!services.some(s=>s.service_type===type))return false;
  if(price){
   const totals=services.map(serviceTotal).filter(n=>n!=null&&!Number.isNaN(n));
   if(price==='free'&&!totals.some(p=>p===0))return false;
   if(price==='under50'&&!totals.some(p=>p>0&&p<50))return false;
   if(price==='under100'&&!totals.some(p=>p>0&&p<100))return false;
  }
  return true;
 });
 const box=q('#coachMarketList');if(!box)return;
 box.innerHTML=rows.length?rows.map(r=>{
  const services=(r.coach_service_packages||[]).filter(s=>s.active);
  const types=[...new Set(services.map(s=>s.service_type))];
  const low=lowestService(services);
  return `<article class="coach-market-card" data-business="${r.business_id}"><div class="coach-market-card-head"><div><small>${esc(r.programs?.name||'Lellee')}</small><h3>${esc(r.public_name||r.business_name)}</h3></div><span>${low?`from ${money(low.total)} total`:''}</span></div><p>${esc(String(r.bio||'').slice(0,220))}</p>${low?servicePriceHtml(low.service,true):''}<div class="coach-market-tags">${types.map(t=>`<span>${esc(t.replaceAll('_',' '))}</span>`).join('')}</div></article>`;
 }).join(''):'<div class="approved-resource-empty">No matching approved coaches.</div>';
 qa('[data-business]').forEach(x=>x.onclick=()=>openProfile(x.dataset.business));
}
async function openProfile(id){
 selectedBusiness=marketRows.find(x=>x.business_id===id);selectedService=null;
 if(!selectedBusiness)return;
 q('#coachProfileName').textContent=selectedBusiness.public_name||selectedBusiness.business_name;
 q('#coachProfileBusiness').textContent=selectedBusiness.business_name||'';
 q('#coachProfilePublicName').textContent=selectedBusiness.public_name||'';
 q('#coachProfileBio').textContent=selectedBusiness.bio||'';
 q('#coachProfileCredentials').textContent=selectedBusiness.credentials_disclosure||'Credentials/training disclosure not provided.';
 const services=(selectedBusiness.coach_service_packages||[]).filter(s=>s.active);
 q('#coachProfileServices').innerHTML=services.length?services.map(s=>`<div class="coach-list-row" data-service-row="${s.id}"><div class="coach-list-icon">$</div><div><b>${esc(s.name)}</b><small>${esc(s.service_type.replaceAll('_',' '))} · ${esc(s.billing_model.replaceAll('_',' '))}</small>${servicePriceHtml(s,false)}<span class="coach-price-disclosure">Customer total includes coach price and processing fees. Discounts and price increases are already reflected when configured by the coach.</span></div><button data-service="${s.id}">Select</button></div>`).join(''):'<div class="approved-resource-empty">No active services.</div>';
 qa('[data-service]').forEach(b=>b.onclick=(ev)=>{ev.stopPropagation();selectService(b.dataset.service)});
 const groups=(selectedBusiness.coach_groups||[]).filter(g=>['forming','active'].includes(g.status));
 q('#coachProfileGroups').innerHTML=groups.length?groups.map(g=>`<div class="coach-list-row"><div class="coach-list-icon">◎</div><div><b>${esc(g.name)}</b><small>${g.coach_group_members?.length||0} of ${g.capacity} seats · ${esc(g.status)}</small></div><button data-group="${g.id}">Interest</button></div>`).join(''):'<div class="approved-resource-empty">No open group cohorts.</div>';
 showPage('coach-profile');
}
function selectService(id){
 selectedService=(selectedBusiness?.coach_service_packages||[]).find(s=>s.id===id)||null;
 qa('[data-service-row]').forEach(row=>row.classList.toggle('coach-service-selected',row.dataset.serviceRow===id));
 q('#coachProfileMsg').textContent=selectedService?`Selected ${selectedService.name}. Customer total: ${money(serviceTotal(selectedService)||0)}.`:'';
}
async function requestConsultation(){
 if(!currentUser||!selectedBusiness)return;
 const selectedLine=selectedService?`Selected service: ${selectedService.name}. Customer total shown: ${money(serviceTotal(selectedService)||0)}.\n\n`:'';
 const note=prompt(selectedLine+'Optional: what would you like the coach to know before contacting you?','')||null;
 const row={business_id:selectedBusiness.business_id,user_id:currentUser.id,program_id:selectedBusiness.primary_program_id,service_package_id:selectedService?.id||null,note,status:'new'};
 const {error}=await sb.from('coach_consultation_requests').insert(row);
 if(error)return toast(error.message,true);
 q('#coachProfileMsg').textContent='Consultation request sent.';toast('Consultation request sent.');
}
async function joinWaitlist(){
 if(!currentUser||!selectedBusiness)return;
 const {error}=await sb.from('coach_waitlist').insert({business_id:selectedBusiness.business_id,user_id:currentUser.id,program_id:selectedBusiness.primary_program_id,status:'waiting'});
 if(error)return toast(error.message,true);
 q('#coachProfileMsg').textContent='Added to coaching waitlist.';toast('Added to waitlist.');
}
async function getMyBusiness(){
 if(!currentUser)return null;
 const {data}=await sb.from('coach_businesses').select('*').eq('owner_user_id',currentUser.id).maybeSingle();
 myBusiness=data||null;return myBusiness;
}
async function loadCohorts(){
 await getMyBusiness();if(!myBusiness)return;
 const [g,w]=await Promise.all([
  sb.from('coach_groups').select('id,name,status,capacity,start_date,end_date,group_price,coach_group_members(id)').eq('business_id',myBusiness.id).order('start_date'),
  sb.from('coach_waitlist').select('id').eq('business_id',myBusiness.id).eq('status','waiting')
 ]);
 const rows=g.data||[],active=rows.filter(x=>['forming','active'].includes(x.status));
 const enrolled=active.reduce((n,x)=>n+(x.coach_group_members?.length||0),0),seats=active.reduce((n,x)=>n+Math.max(0,(x.capacity||0)-(x.coach_group_members?.length||0)),0);
 q('#cohortMetricSeats').textContent=seats;q('#cohortMetricEnrolled').textContent=enrolled;q('#cohortMetricWaitlist').textContent=(w.data||[]).length;q('#cohortMetricPrograms').textContent=active.length;
 q('#coachCohortList').innerHTML=rows.length?rows.map(x=>`<div class="coach-list-row"><div class="coach-list-icon">◎</div><div><b>${esc(x.name)}</b><small>${x.coach_group_members?.length||0}/${x.capacity} enrolled · ${x.group_price!=null?'$'+Number(x.group_price).toFixed(2)+' per person · ':''}${esc(x.status)}</small></div><button>Manage</button></div>`).join(''):'<div class="approved-resource-empty">No cohorts yet.</div>';
}
async function newCohort(){
 await getMyBusiness();if(!myBusiness)return;
 const name=prompt('Cohort name:');if(!name)return;
 const cap=Math.max(2,Math.min(Number(prompt('Capacity:','8')||8),50));
 const price=Number(prompt('Group price per person:','49')||0);
 const start=prompt('Start date (YYYY-MM-DD):','')||null;
 const {error}=await sb.from('coach_groups').insert({business_id:myBusiness.id,program_id:myBusiness.primary_program_id,name,capacity:cap,group_price:price,start_date:start,status:'forming'});
 if(error)return toast(error.message,true);loadCohorts();
}
async function checkAdmin(){
 if(typeof currentUser==='undefined'||!currentUser){isAdmin=false;return false;}
 try{const {data,error}=await sb.rpc('is_lellee_admin');isAdmin=!error&&data===true}catch(_){isAdmin=false}
 return isAdmin;
}
async function loadCoachAdmin(){
 if(!await checkAdmin())return;
 const {data,error}=await sb.from('coach_businesses').select('id,business_name,public_name,status,target_audience,credentials_disclosure,marketplace_visible,created_at').order('submitted_at',{ascending:false});
 if(error)return toast(error.message,true);
 const rows=data||[];
 q('#coachAdminPending').textContent=rows.filter(x=>x.status==='pending_review').length;
 q('#coachAdminApproved').textContent=rows.filter(x=>x.status==='approved').length;
 q('#coachAdminMarketplace').textContent=rows.filter(x=>x.marketplace_visible).length;
 q('#coachAdminList').innerHTML=rows.length?rows.map(x=>`<div class="coach-list-row"><div class="coach-list-icon">◎</div><div><b>${esc(x.business_name)}</b><small>${esc(x.status.replaceAll('_',' '))} · ${esc(String(x.credentials_disclosure||'No credential disclosure').slice(0,110))}</small></div><div class="coach-admin-actions">${x.status==='pending_review'?`<button data-approve-coach="${x.id}">Approve</button>`:''}<button data-toggle-market="${x.id}">${x.marketplace_visible?'Hide':'Show'}</button></div></div>`).join(''):'<div class="approved-resource-empty">No coaching businesses.</div>';
 qa('[data-approve-coach]').forEach(b=>b.onclick=()=>approveCoach(b.dataset.approveCoach));
 qa('[data-toggle-market]').forEach(b=>b.onclick=()=>toggleMarket(b.dataset.toggleMarket));
}
async function approveCoach(id){
 if(!await checkAdmin())return toast('Administrator access required.',true);
 const {error}=await sb.from('coach_businesses').update({status:'approved',approved_at:new Date().toISOString(),approved_by:currentUser.id}).eq('id',id);
 if(error)return toast(error.message,true);loadCoachAdmin();
}
async function toggleMarket(id){
 if(!await checkAdmin())return toast('Administrator access required.',true);
 const row=[...qa('[data-toggle-market]')].find(x=>x.dataset.toggleMarket===id);
 const show=row?.textContent==='Show';
 if(show&&(await setting('coach_public_marketplace_enabled'))!=='true')return toast('Global coach marketplace is still OFF.',true);
 const {error}=await sb.from('coach_businesses').update({marketplace_visible:show}).eq('id',id);
 if(error)return toast(error.message,true);loadCoachAdmin();
}

q('#coachMarketSearch')?.addEventListener('input',renderMarket);
q('#coachMarketProgram')?.addEventListener('change',renderMarket);
q('#coachMarketType')?.addEventListener('change',renderMarket);
q('#coachMarketPrice')?.addEventListener('change',renderMarket);
q('#coachRequestConsultation')?.addEventListener('click',requestConsultation);
q('#coachJoinWaitlist')?.addEventListener('click',joinWaitlist);
q('#coachNewCohort')?.addEventListener('click',newCohort);

if(typeof showPage==='function'){
 const oldShow=showPage;
 showPage=function(name){
  oldShow(name);
  if(name==='coaches')loadMarket();
  if(name==='coach-cohorts')loadCohorts();
  if(name==='coach-admin')loadCoachAdmin();
 };
}
injectMarketplacePricingStyles();
})();
