(() => {
  'use strict';

  function $(s, root=document){ return root.querySelector(s); }
  function $$(s, root=document){ return Array.from(root.querySelectorAll(s)); }

  function replaceTextNode(el, from, to){
    if(!el) return;
    const value = el.textContent || '';
    if(value.includes(from)) el.textContent = value.replace(from, to);
  }

  function relabelCoachPractice(){
    const businessPage = $('#page-coach-business');
    if(businessPage){
      const kicker = $('.approved-kicker', businessPage);
      const heading = $('.approved-inner-head h2', businessPage);
      const paragraph = $('.approved-inner-head p', businessPage);
      if(kicker) kicker.textContent = 'INDEPENDENT COACHING PRACTICE';
      if(heading) heading.textContent = 'Run your independent coaching practice with Lellee tools.';
      if(paragraph) paragraph.textContent = 'Independent professionals work for themselves. They are not Lellee Coaches unless separately engaged by Lellee under an approved W-2 or 1099 arrangement, and they must use accurate credentials and scope descriptions.';

      $$('label', businessPage).forEach(label => {
        replaceTextNode(label, 'Business name', 'Practice name');
        replaceTextNode(label, 'Public coach/business name', 'Public coach/practice name');
        replaceTextNode(label, 'Business model', 'Practice model');
      });
      $$('input, textarea, select', businessPage).forEach(field => {
        if(field.placeholder === 'Example: New Day Recovery Coaching') field.placeholder = 'Example: New Day Coaching Practice';
        if(field.placeholder === 'Name clients will see') field.placeholder = 'Practice name clients will see';
      });
      $$('*', businessPage).forEach(el => {
        if(el.childElementCount) return;
        replaceTextNode(el, 'Coach Business Status', 'Coaching Practice Status');
        replaceTextNode(el, 'Create a business profile to begin the review process.', 'Create a practice profile to begin the review process.');
      });
    }

    const dashboard = $('#page-coach-dashboard');
    if(dashboard){
      const kicker = $('.approved-kicker', dashboard);
      const heading = $('.approved-inner-head h2', dashboard);
      const paragraph = $('.approved-inner-head p', dashboard);
      if(kicker) kicker.textContent = 'INDEPENDENT COACHING PRACTICE';
      if(heading && heading.id !== 'coachDashboardBusinessName') heading.textContent = 'My Coaching Practice';
      if(paragraph) paragraph.textContent = 'Manage your clients, groups, services and communication. This independent practice workspace is separate from W-2 Lellee Coach employment.';
    }

    $$('[data-page="coach-business"], [data-page="coach-dashboard"], #coachNavItem').forEach(el => {
      replaceTextNode(el, 'Coach Business', 'Coaching Practice');
      replaceTextNode(el, 'Independent Business', 'Coaching Practice');
    });
  }

  function boot(){
    relabelCoachPractice();
    const mo = new MutationObserver(relabelCoachPractice);
    mo.observe(document.body, {childList:true, subtree:true, characterData:true});
    setInterval(relabelCoachPractice, 2500);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
