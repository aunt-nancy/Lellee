
(()=>{
'use strict';
const pages=['today','journey','personal-plan','stability-map','return-path','journals','journal-companion','story-archive','resources','long-term-maintenance'];
document.querySelectorAll('.recovery-hub-grid [data-page]').forEach(b=>b.addEventListener('click',()=>{if(typeof showPage==='function')showPage(b.dataset.page)}));
window.LELLEE_RECOVERY_COMPLETION={
  version:'1.0-mega',
  integratedPages:pages,
  progressiveDisclosure:true,
  tap21ConsumerLanguage:true,
  automaticProgramSwitch:false,
  automaticJourneyReset:false
};
})();
