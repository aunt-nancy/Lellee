
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function adminRow(icon,title,detail,status='',klass=''){return `<div class="search-admin-row ${klass}"><div class="search-admin-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function resultRow(x){return `<div class="search-result"><div class="search-result-icon">⌕</div><div><b>${esc(x.title)}</b><small>${esc(x.summary||'')} · ${esc(x.entity_type||'')}</small></div><em>${esc(x.topic_label||'')}</em></div>`}
function setTab(tab){qa('[data-search-tab]').forEach(b=>b.classList.toggle('active',b.dataset.searchTab===tab));['documents','taxonomy','synonyms','graph','freshness','ranking','qa','guardrails'].forEach(x=>q('#searchPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadDiscover(){
 const d=await rpc('get_discovery_topics');if(!d)return;
 q('#discoverTopicChips').innerHTML=(d||[]).map(x=>`<button data-discover-topic="${esc(x.term_key)}">${esc(x.label)}</button>`).join('');
 qa('[data-discover-topic]').forEach(b=>b.onclick=()=>{q('#discoverSearchInput').value=b.textContent;runSearch()});
}
async function runSearch(){
 const term=(q('#discoverSearchInput')?.value||'').trim();
 if(!term){q('#discoverResults').innerHTML='';q('#discoverResultCount').textContent='';return}
 const d=await rpc('search_lellee_discovery',{p_query:term,p_limit:30});if(!d)return;
 q('#discoverResultCount').textContent=`${d.length} result${d.length===1?'':'s'}`;
 q('#discoverResults').innerHTML=(d||[]).map(resultRow).join('')||'<div class="approved-resource-empty">No approved results found.</div>';
}
async function loadAdmin(){
 const d=await rpc('get_search_taxonomy_summary');if(!d)return;const s=d.summary||{};
 q('#searchIndexedDocs').textContent=s.indexed_documents||0;q('#searchTerms').textContent=s.terms||0;q('#searchRelationships').textContent=s.relationships||0;q('#searchStale').textContent=s.stale||0;
 q('#searchDocumentList').innerHTML=(d.documents||[]).map(x=>adminRow('I',x.title,`${x.entity_type} · ${x.visibility} · ${x.index_status}`,x.freshness_status,x.freshness_status==='stale'?'attention':'ok')).join('');
 q('#searchTaxonomyList').innerHTML=(d.taxonomy||[]).map(x=>adminRow('T',x.label,`${x.term_type} · ${x.status}`,x.document_count_label||'')).join('');
 q('#searchSynonymList').innerHTML=(d.synonyms||[]).map(x=>adminRow('S',x.synonym,`→ ${x.canonical_label}`,x.status)).join('');
 q('#searchGraphList').innerHTML=(d.graph||[]).map(x=>adminRow('G',x.relationship_label,`${x.source_label} → ${x.target_label}`,x.status)).join('');
 q('#searchFreshnessList').innerHTML=(d.freshness||[]).map(x=>adminRow('F',x.title,`${x.entity_type} · updated ${x.updated_label||'unknown'}`,x.freshness_status,x.freshness_status==='stale'?'attention':'')).join('');
 q('#searchRankingList').innerHTML=(d.ranking||[]).map(x=>adminRow('R',x.label,x.description,x.status)).join('');
 q('#searchQaList').innerHTML=(d.qa||[]).map(x=>adminRow('Q',x.query_text,`${x.expected_behavior} · ${x.status}`,x.last_result||'',x.status==='fail'?'attention':'')).join('');
 q('#searchGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="search-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addDocument(){
 const title=prompt('Search document title:');if(!title)return;
 const type=prompt('Entity type: program, tool, learning, help, resource, provider, content, other','content')||'other';
 const summary=prompt('Short searchable summary:','')||'';
 const {error}=await sb.from('search_documents').insert({entity_type:type,title,summary,visibility:'approved',index_status:'indexed',freshness_status:'fresh',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadAdmin();
}
async function addTerm(){
 const label=prompt('Taxonomy term:');if(!label)return;
 const key=label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const type=prompt('Term type: topic, need, life_area, program, resource_type, audience, other','topic')||'topic';
 const {error}=await sb.from('search_taxonomy_terms').insert({term_key:key,label,term_type:type,status:'active',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadAdmin();
}
q('#discoverSearchButton')?.addEventListener('click',runSearch);
q('#discoverSearchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')runSearch()});
qa('[data-search-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.searchTab));
q('#searchAddDocument')?.addEventListener('click',addDocument);
q('#searchAddTerm')?.addEventListener('click',addTerm);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='discover')loadDiscover();if(name==='search-taxonomy')loadAdmin()}}
})();
