(()=>{
'use strict';
const SRC='/lellee-sidebar-logo.png?v=20260913-828-lock';
function apply(){
  const wrap=document.querySelector('.sidebar .logo-wrap');
  const logo=document.querySelector('.sidebar .approved-logo');
  if(wrap){
    wrap.style.setProperty('background','#10245f','important');
    wrap.style.setProperty('background-image','none','important');
  }
  if(!logo)return false;
  if(logo.getAttribute('src')!==SRC)logo.setAttribute('src',SRC);
  logo.removeAttribute('srcset');
  logo.style.setProperty('display','block','important');
  logo.style.setProperty('visibility','visible','important');
  logo.style.setProperty('opacity','1','important');
  logo.style.setProperty('background','transparent','important');
  logo.style.setProperty('object-fit','contain','important');
  logo.alt='Lellee — Your journey. Your support. Your way.';
  return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
[100,300,700,1500,3000].forEach(ms=>setTimeout(apply,ms));
document.addEventListener('lellee:pagechange',()=>setTimeout(apply,0));
window.LelleeLogo828={apply,version:'2026-09-13-828-lock'};
})();