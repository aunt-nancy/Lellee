(()=>{
'use strict';
const BAR_ID='lelleeRecoveryJourneySwitcher';
const STYLE_ID='lelleeRecoveryJourneySwitcherStyle';

function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
#${BAR_ID}{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 16px;padding:12px 14px;border:1px solid #e0d7e8;border-radius:12px;background:#faf7fc;color:#40364b}
#${BAR_ID} .lellee-switch-copy{min-width:0}
#${BAR_ID} .lellee-switch-kicker{display:block;margin-bottom:2px;color:#73518f;font-size:.58rem;font-weight:900;letter-spacing:.07em;text-transform:uppercase}
#${BAR_ID} b{display:block;font-size:.76rem;color:#352c40}
#${BAR_ID} small{display:block;margin-top:2px;color:#706777;font-size:.61rem;line-height:1.45}
#${BAR_ID} button{flex:0 0 auto;border:1px solid #5b2fa0;border-radius:9px;background:#5b2fa0;color:#fff;padding:9px 12px;font:inherit;font-size:.64rem;font-weight:850;cursor:pointer}
#${BAR_ID} button:focus-visible{outline:3px solid #8a65ad;outline-offset:2px}
@media(max-width:640px){#${BAR_ID}{align-items:stretch;flex-direction:column}#${BAR_ID} button{width:100%}}
`;
  document.head.appendChild(style);
}

function navigateToPrograms(){
  const go=window.LelleeNavigatePage||window.showPage;
  if(typeof go==='function'){
    go('program-switcher');
    return;
  }
  const existing=document.querySelector('[data-page="program-switcher"]');
  if(existing){existing.click();return;}
  location.href='/app#program-switcher';
}

function ensureSwitcher(){
  addStyle();
  const page=document.getElementById('page-today');
  if(!page||document.getElementById(BAR_ID))return false;
  const host=page.querySelector('.approved-inner')||page;
  const bar=document.createElement('div');
  bar.id=BAR_ID;
  bar.setAttribute('role','region');
  bar.setAttribute('aria-label','Switch Lellee journey');
  bar.innerHTML=`<div class="lellee-switch-copy"><span class="lellee-switch-kicker">RECOVERY TODAY</span><b>Want to work on a different journey?</b><small>Open My Programs to switch to another journey available on your account.</small></div><button type="button">Switch Journey</button>`;
  bar.querySelector('button').addEventListener('click',navigateToPrograms);
  host.insertBefore(bar,host.firstChild);
  return true;
}

document.addEventListener('lellee:pagechange',event=>{
  if(event.detail?.page==='today')requestAnimationFrame(ensureSwitcher);
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureSwitcher,{once:true});
else ensureSwitcher();

let tries=0;
const timer=setInterval(()=>{
  tries++;
  if(ensureSwitcher()||tries>=30)clearInterval(timer);
},200);

window.LelleeRecoveryJourneySwitcher={ensure:ensureSwitcher,open:navigateToPrograms,version:'2026-09-12-v1'};
})();
