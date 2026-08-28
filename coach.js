(() => {
  const menu = document.getElementById('coachMenu');
  const nav = document.getElementById('coachNav');
  if(menu && nav){
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', e => {
      if(e.target.closest('a') && nav.classList.contains('open')){
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded','false');
      }
    });
  }
})();