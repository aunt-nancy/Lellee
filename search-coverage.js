
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2600)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return {error}}return {data}}
function row(icon,title,detail,status='',klass=''){return `<div class="coverage-row ${klass}"><div class="coverage-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function setTab(tab){qa('[data-coverage-tab]').forEach(b=>b.classList.toggle('active',b.dataset.coverageTab===tab));['sources','runs','documents','mappings','errors','guardrails'].forEach(x=>q('#coveragePanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function load(){
 const r=await rpc('get_search_coverage_summary');if(r.error)return;const d=r.data,s=d.summary||{};
 q('#coverageSources').textContent=s.sources||0;q('#coverageIndexed').textContent=s.indexed||0;q('#coverageMapped').textContent=s.mappings||0;q('#coverageErrors').textContent=s.errors||0;
 q('#coverageSourceList').innerHTML=(d.sources||[]).map(x=>row('S',x.label,`${x.table_name} · ${x.entity_type} · ${x.sync_mode}`,x.availability,x.availability==='available'?'ok':'attention')).join('');
 q('#coverageRunList').innerHTML=(d.runs||[]).map(x=>row('R',x.source_label,`${x.status} · ${x.inserted_count} inserted · ${x.updated_count} updated`,x.finished_label||'',x.status==='failed'?'fail':x.status==='completed'?'ok':'attention')).join('');
 q('#coverageDocumentList').innerHTML=(d.documents||[]).map(x=>row('D',x.title,`${x.entity_type} · ${x.source_label}`,x.freshness_status,x.freshness_status==='stale'?'attention':'ok')).join('');
 q('#coverageMappingList').innerHTML=(d.mappings||[]).map(x=>row('T',x.term_label,`${x.document_count} documents`,x.relationship_type)).join('');
 q('#coverageErrorList').innerHTML=(d.errors||[]).map(x=>row('!',x.source_label,x.error_message,x.status,'fail')).join('')||'<div class="approved-resource-empty">No open sync errors.</div>';
 q('#coverageGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="coverage-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function runAll(){
 const b=q('#coverageRunAll');if(b){b.disabled=true;b.textContent='Running…'}
 const r=await rpc('run_all_approved_search_syncs');
 if(b){b.disabled=false;b.textContent='Run Approved Syncs'}
 if(r.error)return toast(r.error.message||'Search sync failed.',true);
 const d=r.data||{};
 toast(`Search sync complete: ${d.sources_completed||0} sources, ${d.documents_indexed||0} documents.`);
 load();
}
qa('[data-coverage-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.coverageTab));
q('#coverageRunAll')?.addEventListener('click',runAll);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='search-coverage')load()}}
})();
