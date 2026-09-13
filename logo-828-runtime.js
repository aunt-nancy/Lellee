(()=>{
'use strict';
const SRC='/lellee-sidebar-logo.png?v=20260913-828-lock-2';
function apply(){
  const wrap=document.querySelector('.sidebar .logo-wrap');
  const logo=document.querySelector('.sidebar .approved-logo');
  if(wrap){
    /* The logo area must be the SAME dark navy as the menu — no separate blue panel. */
    wrap.style.setProperty('background','transparent','important');
    wrap.style.setProperty('background-color','transparent','important');
    wrap.style.setProperty('background-image','none','important');
    wrap.style.setProperty('border-bottom','0','important');
    wrap.style.setProperty('box-shadow','none','important');
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
  logo.alt='Lellee — Your journey. Your support. Your way.';
  return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
[100,300,700,1500,3000].forEach(ms=>setTimeout(apply,ms));
document.addEventListener('lellee:pagechange',()=>setTimeout(apply,0));
window.LelleeLogo828={apply,version:'2026-09-13-828-dark-menu-match'};
})();