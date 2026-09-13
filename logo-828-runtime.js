(()=>{
'use strict';
const SRC='/lellee-sidebar-logo.png?v=20260913-828-lock-2';
const TAG_ID='lelleeSidebarTagline';
function apply(){
  const wrap=document.querySelector('.sidebar .logo-wrap');
  const logo=document.querySelector('.sidebar .approved-logo');
  if(wrap){
    /* Logo area inherits the exact same dark navy as the menu. */
    wrap.style.setProperty('background','transparent','important');
    wrap.style.setProperty('background-color','transparent','important');
    wrap.style.setProperty('background-image','none','important');
    wrap.style.setProperty('border-bottom','0','important');
    wrap.style.setProperty('box-shadow','none','important');
    wrap.style.setProperty('position','relative','important');
  }
  if(!logo)return false;
  if(logo.getAttribute('src')!==SRC)logo.setAttribute('src',SRC);
  logo.removeAttribute('srcset');
  logo.style.setProperty('display','block','important');
  logo.style.setProperty('visibility','visible','important');
  logo.style.setProperty('opacity','1','important');
  logo.style.setProperty('background','transparent','important');
  logo.style.setProperty('background-color','transparent','important');
  logo.style.setProperty('background-image','none','important');
  logo.style.setProperty('border','0','important');
  logo.style.setProperty('box-shadow','none','important');
  logo.style.setProperty('object-fit','contain','important');
  /* Hide only the tiny baked-in tagline so it can be redrawn 2pt larger below. */
  logo.style.setProperty('clip-path','inset(0 0 14px 0)','important');
  logo.alt='Lellee';

  if(wrap){
    let tag=document.getElementById(TAG_ID);
    if(!tag){
      tag=document.createElement('div');
      tag.id=TAG_ID;
      tag.textContent='Your journey. Your support. Your way.';
      wrap.appendChild(tag);
    }
    tag.style.setProperty('position','absolute','important');
    tag.style.setProperty('left','4px','important');
    tag.style.setProperty('right','4px','important');
    tag.style.setProperty('bottom','4px','important');
    tag.style.setProperty('z-index','4','important');
    tag.style.setProperty('margin','0','important');
    tag.style.setProperty('padding','0','important');
    tag.style.setProperty('text-align','center','important');
    tag.style.setProperty('font-family','Arial, sans-serif','important');
    tag.style.setProperty('font-size','8pt','important');
    tag.style.setProperty('line-height','1.15','important');
    tag.style.setProperty('font-weight','500','important');
    tag.style.setProperty('letter-spacing','.01em','important');
    tag.style.setProperty('color','#f8f5fb','important');
    tag.style.setProperty('white-space','nowrap','important');
    tag.style.setProperty('pointer-events','none','important');
  }
  return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
[100,300,700,1500,3000].forEach(ms=>setTimeout(apply,ms));
document.addEventListener('lellee:pagechange',()=>setTimeout(apply,0));
window.LelleeLogo828={apply,version:'2026-09-13-828-tagline-lowered'};
})();