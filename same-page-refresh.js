/* Lellee same-page refresh patch
   Purpose: preserve the currently open app section across browser refreshes.
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
    if (current !== next) {
      history.replaceState(history.state, '', next);
    }
  };

  let requested = hashPage();
  if (!pageExists(requested)) requested = null;

  // When reloading a section URL such as /app#journal, protect that target
  // from any startup code that temporarily opens Today.
  let restoreLock = Boolean(requested);

  const restoreRequestedPage = () => {
    if (!restoreLock || !requested || typeof window.showPage !== 'function') return;
    if (activePage() !== requested) {
      window.showPage(requested);
    }
  };

  const releaseRestoreLock = () => {
    if (!restoreLock) return;
    restoreLock = false;
    const current = activePage();
    if (current) writePageToUrl(current);
  };

  // Once the person begins interacting, normal app navigation takes over.
  document.addEventListener('pointerdown', releaseRestoreLock, { capture: true, once: true });
  document.addEventListener('keydown', releaseRestoreLock, { capture: true, once: true });

  // Watch the existing app's page classes. We do not replace showPage().
  // After navigation, mirror the active section into the URL hash.
  const observer = new MutationObserver(() => {
    const current = activePage();
    if (!current) return;

    if (restoreLock) {
      if (current !== requested) queueMicrotask(restoreRequestedPage);
    } else {
      writePageToUrl(current);
    }
  });

  const start = () => {
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    // Covers async session/profile loading without changing that code.
    [0, 50, 150, 350, 750, 1500, 3000, 5000].forEach((ms) => {
      setTimeout(restoreRequestedPage, ms);
    });

    // Fresh /app visit: record whatever page Lellee normally chooses.
    if (!requested) {
      setTimeout(() => {
        const current = activePage();
        if (current) writePageToUrl(current);
      }, 1200);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
