(()=>{
'use strict';
let returnFocus=null;
const q=selector=>document.querySelector(selector);
const visible=element=>!!(element&&element.getClientRects().length&&!element.disabled&&element.getAttribute('aria-hidden')!=='true');
function modalControls(box){return Array.from(box.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(visible)}
function setBackgroundBlocked(blocked){const shell=q('.app-shell');if(!shell)return;shell.inert=blocked;if(blocked)shell.setAttribute('aria-hidden','true');else shell.removeAttribute('aria-hidden')}
function syncAuthModal(){
 const overlay=q('#authOverlay'),box=overlay?.querySelector('.auth-box');if(!overlay||!box)return;
 const open=!overlay.classList.contains('hidden');
 setBackgroundBlocked(open);
 if(open){
  if(!overlay.contains(document.activeElement))returnFocus=document.activeElement;
  queueMicrotask(()=>q('#authEmail')?.focus());
 }else if(returnFocus){
  const target=visible(returnFocus)?returnFocus:q('#lelleeMain');target?.focus();returnFocus=null;
 }
}
function configure(){
 const overlay=q('#authOverlay'),box=overlay?.querySelector('.auth-box');if(!overlay||!box)return;
 box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','authTitle');box.setAttribute('aria-describedby','authMsg');
 q('#authMsg')?.setAttribute('aria-live','polite');
 const email=q('#authEmail'),password=q('#authPassword'),labels=overlay.querySelectorAll('.auth-field label');
 if(email&&labels[0])labels[0].htmlFor=email.id;if(password&&labels[1])labels[1].htmlFor=password.id;
 overlay.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||overlay.classList.contains('hidden'))return;
  const controls=modalControls(box);if(!controls.length)return;
  const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 });
 new MutationObserver(syncAuthModal).observe(overlay,{attributes:true,attributeFilter:['class']});
 syncAuthModal();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',configure,{once:true});else configure();
})();
