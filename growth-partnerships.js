
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="growth-row ${klass}"><div class="growth-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}

async function submitInterest(){
 const org=(q('#growthInterestOrg')?.value||'').trim(), name=(q('#growthInterestName')?.value||'').trim(), email=(q('#growthInterestEmail')?.value||'').trim(), type=q('#growthInterestType')?.value, note=(q('#growthInterestNote')?.value||'').trim();
 if(!org||!name||!email)return toast('Organization, name and work email are required.',true);
 const {error}=await sb.from('growth_inbound_interest').insert({organization_name:org,contact_name:name,work_email:email,interest_type:type,note,status:'new',source_type:'in_app_form',submitted_by_user_id:currentUser?.id||null});
 if(error)return toast(error.message,true);
 ['growthInterestOrg','growthInterestName','growthInterestEmail','growthInterestNote'].forEach(id=>{if(q('#'+id))q('#'+id).value=''});
 toast('Partnership interest sent.');
}

function setTab(tab){qa('[data-growth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.growthTab===tab));['pipeline','leads','outreach','proposals','sponsorships','grants','attribution','guardrails'].forEach(x=>q('#growthPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function load(){
 const d=await rpc('get_growth_center_summary');if(!d)return;const s=d.summary||{};
 q('#growthLeads').textContent=s.leads||0;q('#growthOpportunities').textContent=s.opportunities||0;q('#growthProposals').textContent=s.proposals||0;q('#growthPipelineValue').textContent='$'+Number(s.pipeline_value||0).toLocaleString();
 q('#growthPipelineList').innerHTML=(d.pipeline||[]).map(x=>row('O',x.name,`${x.opportunity_type} · ${x.stage_label} · ${x.owner_label||'Unassigned'}`,x.projected_value_label||'',x.stage_key==='won'?'ok':x.stage_key==='lost'?'fail':'' )).join('')||'<div class="approved-resource-empty">No active opportunities.</div>';
 q('#growthLeadList').innerHTML=(d.leads||[]).map(x=>row('L',x.organization_name,`${x.lead_type} · ${x.source_type} · ${x.status}`,x.owner_label||'Unassigned',x.status==='qualified'?'ok':'' )).join('')||'<div class="approved-resource-empty">No leads.</div>';
 q('#growthOutreachList').innerHTML=(d.outreach||[]).map(x=>row('→',x.subject_label,`${x.channel} · ${x.status} · ${x.organization_name}`,x.owner_label||'',x.status==='draft'?'attention':'' )).join('')||'<div class="approved-resource-empty">No outreach activity.</div>';
 q('#growthProposalList').innerHTML=(d.proposals||[]).map(x=>row('P',x.title,`${x.organization_name} · ${x.status}`,x.amount_label||'')).join('')||'<div class="approved-resource-empty">No proposals.</div>';
 q('#growthSponsorshipList').innerHTML=(d.sponsorships||[]).map(x=>row('$',x.name,`${x.organization_name} · ${x.status}`,x.amount_label||'')).join('')||'<div class="approved-resource-empty">No sponsorship opportunities.</div>';
 q('#growthGrantList').innerHTML=(d.grants||[]).map(x=>row('G',x.name,`${x.funder_name} · ${x.status} · ${x.deadline_label||'no deadline'}`,x.amount_label||'')).join('')||'<div class="approved-resource-empty">No grant opportunities.</div>';
 q('#growthAttributionList').innerHTML=(d.attribution||[]).map(x=>row('A',x.source_label,`${x.lead_count} leads · ${x.won_count} won`,x.conversion_label)).join('');
 q('#growthGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="growth-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addLead(){
 const org=prompt('Organization/business name:');if(!org)return;
 const type=prompt('Lead type: organization, provider, coach, sponsor, employer, nonprofit, county, education, healthcare','organization')||'organization';
 const source=prompt('Source: manual, inbound, agent_research, referral, event, public_directory','manual')||'manual';
 const {error}=await sb.from('growth_leads').insert({organization_name:org,lead_type:type,source_type:source,status:'new',owner_user_id:currentUser.id,created_by:currentUser.id});
 if(error)return toast(error.message,true);load();
}
async function addOpportunity(){
 const name=prompt('Opportunity name:');if(!name)return;
 const type=prompt('Type: organization_license, sponsored_access, provider_partnership, sponsorship, employer, county, grant, other','organization_license')||'other';
 const value=Number(prompt('Projected value (optional):','0'))||0;
 const {error}=await sb.from('growth_opportunities').insert({name,opportunity_type:type,stage_key:'discovery',projected_value:value,owner_user_id:currentUser.id,created_by:currentUser.id});
 if(error)return toast(error.message,true);load();
}
q('#growthInterestSubmit')?.addEventListener('click',submitInterest);
qa('[data-growth-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.growthTab));
q('#growthAddLead')?.addEventListener('click',addLead);
q('#growthAddOpportunity')?.addEventListener('click',addOpportunity);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='growth-center')load()}}
})();
