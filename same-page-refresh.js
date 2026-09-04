/* Lellee same-page refresh patch
   Purpose: preserve the currently open app section across browser refreshes
   without competing with normal dashboard/session rendering.
   This file does not change Supabase, auth, billing, content, or Vercel routing.
*/
(() => {
  'use strict';

  const PAGE_PREFIX = 'page-';

  const pageExists = (name) =>
    Boolean(name && document.getElementById(PAGE_PREFIX + name));

  const hashPage = () => {
    try {
      return decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
    } catch (_) {
      return (window.location.hash || '').replace(/^#/, '');
    }
  };

  const activePage = () => {
    const el = document.querySelector('.page.active[id^="page-"]');
    return el ? el.id.slice(PAGE_PREFIX.length) : null;
  };

  const writePageToUrl = (name) => {
    if (!pageExists(name)) return;
    const next = `${location.pathname}${location.search}#${encodeURIComponent(name)}`;
    const current = `${location.pathname}${location.search}${location.hash}`;
    if (current !== next) history.replaceState(history.state, '', next);
  };

  let requested = hashPage();
  if (!pageExists(requested)) requested = null;

  // Today is the normal signed-in landing page. Never lock or repeatedly
  // restore it during startup; doing so competes with dashboard rendering.
  let restoreLock = Boolean(requested && requested !== 'today');

  const restoreRequestedPage = () => {
    if (!restoreLock || !requested || typeof window.showPage !== 'function') return;
    if (activePage() !== requested) window.showPage(requested);
    restoreLock = false;
    const current = activePage();
    if (current) writePageToUrl(current);
  };

  const releaseRestoreLock = () => {
    if (!restoreLock) return;
    restoreLock = false;
    const current = activePage();
    if (current) writePageToUrl(current);
  };

  document.addEventListener('pointerdown', releaseRestoreLock, { capture: true, once: true });
  document.addEventListener('keydown', releaseRestoreLock, { capture: true, once: true });

  // Only observe actual app page class changes. The previous body-wide
  // subtree observer fired for every dashboard card/status class mutation.
  const observer = new MutationObserver(() => {
    const current = activePage();
    if (!current) return;
    if (!restoreLock) writePageToUrl(current);
  });

  const start = () => {
    document.querySelectorAll('.page[id^="page-"]').forEach((page) => {
      observer.observe(page, { attributes: true, attributeFilter: ['class'] });
    });

    // One bounded restore for a non-Today deep link after startup settles.
    if (restoreLock) setTimeout(restoreRequestedPage, 900);

    // Fresh /app visit or /app#today: record the page Lellee itself chooses.
    if (!restoreLock) {
      setTimeout(() => {
        const current = activePage();
        if (current) writePageToUrl(current);
      }, 900);
    }
  };

  window.addEventListener('hashchange', () => {
    const next = hashPage();
    if (!pageExists(next)) return;

    requested = next;
    restoreLock = false;

    if (typeof window.showPage === 'function' && activePage() !== next) {
      window.showPage(next);
    }
  });

  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
