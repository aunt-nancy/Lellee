(()=>{
'use strict';
const VERSION='2026-09-16-journey-nav-label-v1';
const LABELS={caregiving:'My Caregiving',reentry:'My Returning Home','housing-stability':'My Housing Stability','independent-living':'My Building Independence'};
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function activeLabel(){
  const slug=document.body?.dataset?.lelleeJourney||'';
  if(LABELS[slug])return LABELS[slug];
  const heading=(document.querySelector('.topbar .greeting h1')?.textContent||'').trim();
  if(/^Caregiving(?:\s|$)/i.test(heading))return LABELS.caregiving;
  if(/^Returning Home|^Reentry/i.test(heading))return LABELS.reentry;
  if(/^Housing Stability/i.test(heading))return LABELS['housing-stability'];
  if(/^Building Independence/i.test(heading))return LABELS['independent-living'];
  return 'My Recovery';
}
function setButtonLabel(button,label){
  const icon=button.querySelector('.nav-icon,.bi,.mi');
  let target=$$('span',button).filter(span=>span!==icon&&!span.classList.contains('inbox-nav-badge')).at(-1)||null;
  if(!target){
    [...button.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>node.remove());
    target=document.createElement('span');
    target.dataset.journeyNavLabel='true';
    button.appendChild(target);
  }
  if(target.textContent!==label)target.textContent=label;
}
function sync(){const label=activeLabel();$$('.sidebar .nav-item[data-page="recovery"]').forEach(button=>setButtonLabel(button,label))}
function schedule(){[0,60,180,420,900,1600].forEach(ms=>setTimeout(sync,ms))}
function start(){schedule();const sidebar=document.querySelector('.sidebar .nav-list');if(sidebar)new MutationObserver(sync).observe(sidebar,{childList:true,subtree:true});if(document.body)new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-lellee-journey']});document.addEventListener('click',event=>{if(event.target.closest?.('[data-page],[data-mj-open],[data-mj-hub]'))setTimeout(schedule,0)},true);document.addEventListener('lellee:pagechange',schedule)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.LelleeJourneyNavLabel=Object.freeze({version:VERSION,refresh:schedule});
})();
