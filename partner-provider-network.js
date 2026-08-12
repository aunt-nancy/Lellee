
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let isAdmin=false,partnerEntity=null;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,status='',klass=''){
 return `<div class="provider-row ${klass}"><div class="provider-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`;
}

async function loadMyReferrals(){
 const d=await rpc('get_my_partner_referrals');if(!d)return;
 const s=d.summary||{};
 q('#myReferralOpen').textContent=s.open||0;q('#myReferralAccepted').textContent=s.accepted||0;q('#myReferralWaitlist').textContent=s.waitlist||0;q('#myReferralClosed').textContent=s.closed||0;
 q('#myReferralList').innerHTML=(d.referrals||[]).map(x=>row('→',x.service_title,`${x.partner_name} · ${x.category_label} · ${x.updated_label}`,x.status,x.status==='accepted'?'ok':x.status==='waitlist'?'attention':'' )).join('')||'<div class="approved-resource-empty">You have not requested any provider referrals yet.</div>';
}

function setPartnerTab(tab){
 qa('[data-partner-tab]').forEach(b=>b.classList.toggle('active',b.dataset.partnerTab===tab));
 ['services','referrals','locations','verification','sponsorship'].forEach(x=>q('#partnerPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}
async function loadPartnerPortal(){
 const {data:e}=await sb.from('partner_entities').select('id,name,public_name,status,verification_status').eq('owner_user_id',currentUser.id).maybeSingle();
 partnerEntity=e||null;if(!e)return;
 q('#partnerPortalName').textContent=e.public_name||e.name;
 const d=await rpc('get_partner_portal_summary',{p_partner_id:e.id});if(!d)return;
 const s=d.summary||{};
 q('#partnerServices').textContent=s.services||0;q('#partnerOpenReferrals').textContent=s.referrals||0;q('#partnerLocations').textContent=s.locations||0;q('#partnerVerification').textContent=s.verification||'Pending';
 q('#partnerServiceList').innerHTML=(d.services||[]).map(x=>row('S',x.title,`${x.category_label} · ${x.delivery_mode} · ${x.availability_status}`,x.status)).join('')||'<div class="approved-resource-empty">No services configured.</div>';
 q('#partnerReferralList').innerHTML=(d.referrals||[]).map(x=>row('→',x.service_title,`${x.status} · requested ${x.created_label}`,x.next_step_label||'')).join('')||'<div class="approved-resource-empty">No referral requests.</div>';
 q('#partnerLocationList').innerHTML=(d.locations||[]).map(x=>row('L',x.label,`${x.city||''}${x.state?' · '+x.state:''} · ${x.status}`,x.location_type)).join('')||'<div class="approved-resource-empty">No locations.</div>';
 q('#partnerVerificationList').innerHTML=(d.verification||[]).map(x=>row('V',x.review_type,`${x.status} · ${x.reviewed_label||'not reviewed'}`,x.outcome_label||'')).join('')||'<div class="approved-resource-empty">No verification reviews yet.</div>';
 q('#partnerSponsorshipList').innerHTML=(d.sponsorship||[]).map(x=>row('$',x.label,`${x.status} · ${x.starts_label||''}`,x.ranking_effect?'ranking enabled':'no ranking effect',x.ranking_effect?'attention':'ok')).join('')||'<div class="approved-resource-empty">No sponsorship records.</div>';
}
async function addPartnerService(){
 if(!partnerEntity)return;
 const title=prompt('Service name:');if(!title)return;
 const {data:cats}=await sb.from('partner_service_categories').select('category_key,label').eq('active',true).order('display_order');
 if(!cats?.length)return toast('No service categories available.',true);
 const options=cats.map((x,i)=>`${i+1}. ${x.label}`).join('\n');
 const n=Number(prompt('Choose category:\n'+options,'1'));if(!n||!cats[n-1])return;
 const delivery=prompt('Delivery: in_person, virtual, hybrid, mobile','in_person')||'in_person';
 const {error}=await sb.from('partner_services').insert({partner_id:partnerEntity.id,category_key:cats[n-1].category_key,title,delivery_mode:delivery,status:'draft',availability_status:'unknown',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadPartnerPortal();
}
async function addPartnerLocation(){
 if(!partnerEntity)return;
 const label=prompt('Location label:','Main location');if(!label)return;
 const city=prompt('City:','')||null;
 const state=prompt('State:','CA')||null;
 const {error}=await sb.from('partner_locations').insert({partner_id:partnerEntity.id,label,city,state,location_type:'service_site',status:'active'});
 if(error)return toast(error.message,true);loadPartnerPortal();
}

async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
function setNetworkTab(tab){
 qa('[data-network-tab]').forEach(b=>b.classList.toggle('active',b.dataset.networkTab===tab));
 ['partners','services','verification','referrals','quality','sponsorship','guardrails'].forEach(x=>q('#networkPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}
async function loadNetworkOps(){
 if(!await checkAdmin())return;
 const d=await rpc('get_provider_network_operations');if(!d)return;
 const s=d.summary||{};
 q('#networkPartners').textContent=s.partners||0;q('#networkVerified').textContent=s.verified||0;q('#networkServices').textContent=s.services||0;q('#networkOpenReferrals').textContent=s.open_referrals||0;
 q('#networkPartnerList').innerHTML=(d.partners||[]).map(x=>row('P',x.name,`${x.entity_type} · ${x.status}`,x.verification_status,x.verification_status==='verified'?'ok':'' )).join('');
 q('#networkServiceList').innerHTML=(d.services||[]).map(x=>row('S',x.title,`${x.partner_name} · ${x.category_label} · ${x.availability_status}`,x.status)).join('');
 q('#networkVerificationList').innerHTML=(d.verification||[]).map(x=>row('V',x.partner_name,`${x.review_type} · ${x.status}`,x.outcome_label||'',x.status==='pending'?'attention':'' )).join('');
 q('#networkReferralList').innerHTML=(d.referrals||[]).map(x=>row('→',x.service_title,`${x.partner_name} · ${x.status} · ${x.age_label}`,x.next_step_label||'')).join('');
 q('#networkQualityList').innerHTML=(d.quality||[]).map(x=>row('!',x.partner_name,`${x.flag_type} · ${x.status}`,x.severity,x.severity==='high'?'attention':'' )).join('')||'<div class="approved-resource-empty">No open quality flags.</div>';
 q('#networkSponsorshipList').innerHTML=(d.sponsorship||[]).map(x=>row('$',x.partner_name,`${x.label} · ${x.status}`,x.ranking_effect?'ranking effect':'labeled only',x.ranking_effect?'blocked':'ok')).join('')||'<div class="approved-resource-empty">No sponsorship records.</div>';
 q('#networkGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="provider-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addNetworkPartner(){
 const name=prompt('Partner/provider name:');if(!name)return;
 const type=prompt('Type: recovery, housing, employment, caregiving, benefits, community, healthcare, education, legal, transportation, food, other','community')||'other';
 const {error}=await sb.from('partner_entities').insert({name,public_name:name,entity_type:type,status:'draft',verification_status:'unverified',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadNetworkOps();
}

qa('[data-partner-tab]').forEach(b=>b.onclick=()=>setPartnerTab(b.dataset.partnerTab));
qa('[data-network-tab]').forEach(b=>b.onclick=()=>setNetworkTab(b.dataset.networkTab));
q('#partnerAddService')?.addEventListener('click',addPartnerService);
q('#partnerAddLocation')?.addEventListener('click',addPartnerLocation);
q('#networkAddPartner')?.addEventListener('click',addNetworkPartner);

if(typeof showPage==='function'){
 const old=showPage;
 showPage=function(name){
   old(name);
   if(name==='my-referrals')loadMyReferrals();
   if(name==='partner-portal')loadPartnerPortal();
   if(name==='provider-network-ops')loadNetworkOps();
 };
}
})();
