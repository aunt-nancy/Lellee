
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="governance-row ${klass}"><div class="governance-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function setTab(tab){qa('[data-gov-tab]').forEach(b=>b.classList.toggle('active',b.dataset.govTab===tab));['quality','duplicates','merges','canonical','lineage','dictionary','stewards','guardrails'].forEach(x=>q('#govPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function load(){
 const d=await rpc('get_data_governance_summary');if(!d)return;const s=d.summary||{};
 q('#govOpenIssues').textContent=s.open_issues||0;q('#govDuplicates').textContent=s.duplicates||0;q('#govMergeReview').textContent=s.merge_requests||0;q('#govRules').textContent=s.active_rules||0;
 q('#govQualityList').innerHTML=(d.quality||[]).map(x=>row('Q',x.label,`${x.entity_type} · ${x.rule_type}`,x.status,x.status==='active'?'ok':'' )).join('')||'<div class="approved-resource-empty">No quality rules.</div>';
 q('#govDuplicateList').innerHTML=(d.duplicates||[]).map(x=>row('D',x.display_label,`${x.entity_type} · ${x.match_basis}`,x.review_status,x.review_status==='pending'?'attention':'' )).join('')||'<div class="approved-resource-empty">No duplicate candidates.</div>';
 q('#govMergeList').innerHTML=(d.merges||[]).map(x=>row('M',x.title,`${x.entity_type} · ${x.status}`,x.requested_by_label||'',x.status==='pending'?'attention':'' )).join('')||'<div class="approved-resource-empty">No merge requests.</div>';
 q('#govCanonicalList').innerHTML=(d.canonical||[]).map(x=>row('C',x.canonical_label,`${x.entity_type} · ${x.source_count} sources`,x.status,x.status==='active'?'ok':'' )).join('');
 q('#govLineageList').innerHTML=(d.lineage||[]).map(x=>row('L',x.field_label,`${x.entity_type} · ${x.source_system}`,x.lineage_status)).join('');
 q('#govDictionaryList').innerHTML=(d.dictionary||[]).map(x=>row('T',x.field_name,`${x.entity_type} · ${x.data_type}`,x.status)).join('');
 q('#govStewardList').innerHTML=(d.stewards||[]).map(x=>row('S',x.scope_label,`${x.scope_type} · ${x.role_label}`,x.status,x.status==='active'?'ok':'' )).join('');
 q('#govGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="governance-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addRule(){
 const label=prompt('Data-quality rule name:');if(!label)return;
 const entity=prompt('Entity type: organization, provider, coach, program, contract, invoice, other','organization')||'other';
 const type=prompt('Rule type: required, format, uniqueness, freshness, reference, consistency, other','required')||'other';
 const {error}=await sb.from('data_quality_rules').insert({label,entity_type:entity,rule_type:type,status:'active',severity:'normal',created_by:currentUser.id});
 if(error)return toast(error.message,true);load();
}
qa('[data-gov-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.govTab));
q('#govAddRule')?.addEventListener('click',addRule);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='data-governance')load()}}
})();
