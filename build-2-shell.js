(() => {
  'use strict';

  const PAGE_KEY = 'lellee:last-page:v2';
  const CATEGORY_KEY = 'lellee:last-nav-category:v2';
  const LOGO_SRC = '/lellee-approved-logo-transparent.svg?v=20260903-system1';

  const CATEGORY_MAP = {
    daily: { label: 'Daily', icon: '✦', pages: ['today', 'for-you', 'recovery'] },
    grow: { label: 'Grow & Learn', icon: '◇', pages: ['learn', 'expert-guided-practices', 'tools', 'recovery-paths-v2'] },
    connect: { label: 'Connect', icon: '♡', pages: ['meetings', 'community'] },
    reflect: { label: 'Reflect & Track', icon: '↗', pages: ['journal', 'progress', 'calendar'] },
    support: { label: 'Find Support', icon: '⌕', pages: ['resources', 'inbox'] },
    account: { label: 'Account', icon: '⚙', pages: ['workspace-home', 'global-search', 'plus', 'settings', 'help-center', 'admin'] }
  };

  const RELATED_CATEGORY = {
    today: 'daily', 'for-you': 'daily', recovery: 'daily', journey: 'daily', day2: 'daily',
    'recovery-hub': 'daily', 'personal-plan': 'daily', 'return-path': 'daily', 'stability-map': 'daily',
    learn: 'grow', lesson: 'grow', tools: 'grow', 'recovery-paths-v2': 'grow', 'expert-guided-practices': 'grow',
    meetings: 'connect', community: 'connect', support: 'connect', 'support-network': 'connect',
    journal: 'reflect', 'journal-companion': 'reflect', progress: 'reflect', 'progress-hub': 'reflect', calendar: 'reflect',
    milestones: 'reflect', 'then-now': 'reflect', story: 'reflect', 'story-archive': 'reflect', history: 'reflect',
    longterm: 'reflect', 'long-term-maintenance': 'reflect', 'monthly-review': 'reflect', 'weekly-review': 'reflect',
    resources: 'support', inbox: 'support',
    'workspace-home': 'account', 'global-search': 'account', plus: 'account', settings: 'account', 'help-center': 'account',
    admin: 'account', account: 'account', 'account-recovery': 'account', 'data-lifecycle': 'account'
  };

  let navList;
  const categoryNodes = new Map();
  let backdrop;

  function preferredButton(page) {
    const all = [...document.querySelectorAll(`.sidebar .nav-item[data-page="${CSS.escape(page)}"]`)];
    if (!all.length) return null;
    const preferred = all.find(el => el.id) || all[0];
    all.filter(el => el !== preferred).forEach(el => el.classList.add('b2-nav-duplicate'));
    return preferred;
  }

  function createExpertPracticesPage() {
    if (document.getElementById('page-expert-guided-practices')) return;
    const content = document.querySelector('.content');
    if (!content) return;
    const section = document.createElement('section');
    section.className = 'page';
    section.id = 'page-expert-guided-practices';
    section.innerHTML = `
      <div class="approved-inner">
        <div class="approved-inner-head">
          <div>
            <span class="approved-kicker">EXPERT-GUIDED PRACTICES</span>
            <h2>Recognized guidance, translated into practical next steps.</h2>
            <p>Lellee organizes pathway guidance by service level while keeping safety-critical information available to everyone.</p>
          </div>
          <button class="approved-link" data-page="learn">Back to Learn</button>
        </div>
        <div class="b2-practice-intro">
          <article class="b2-practice-card"><span>Free</span><h3>Foundational guidance</h3><p>Essential education, basic practices, checklists, and safety information.</p></article>
          <article class="b2-practice-card"><span>Plus</span><h3>Structured practice</h3><p>Pathway-specific exercises, guided plans, and progress-based skill building.</p></article>
          <article class="b2-practice-card"><span>Premium</span><h3>Personalized sequences</h3><p>Advanced guidance that adapts to progress and connects relevant service areas.</p></article>
        </div>
      </div>`;
    content.appendChild(section);
  }

  function navigateTo(page) {
    const router = window.LelleeNavigatePage || window.showPage;
    if (typeof router === 'function') {
      router(page);
      return true;
    }
    const target = document.getElementById(`page-${page}`);
    if (!target) return false;
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    target.classList.add('active');
    return true;
  }

  function makePlaceholderButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-item b2-nav-placeholder';
    button.dataset.page = 'expert-guided-practices';
    button.innerHTML = '<span class="nav-icon">▧</span>Expert-Guided Practices';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      navigateTo('expert-guided-practices');
    });
    return button;
  }

  function openCategory(name, persist = true) {
    if (!categoryNodes.has(name)) name = 'daily';
    categoryNodes.forEach((node, key) => {
      const open = key === name;
      node.classList.toggle('open', open);
      node.querySelector('.nav-category-toggle')?.setAttribute('aria-expanded', String(open));
    });
    if (persist) localStorage.setItem(CATEGORY_KEY, name);
  }

  function categoryForPage(page) {
    return RELATED_CATEGORY[page] || Object.entries(CATEGORY_MAP).find(([, config]) => config.pages.includes(page))?.[0] || 'daily';
  }

  function activePageName() {
    const active = document.querySelector('.page.active');
    return active?.id?.replace(/^page-/, '') || 'today';
  }

  function updateCategoryForActivePage(pageName = activePageName()) {
    const page = pageName || activePageName();
    openCategory(categoryForPage(page));
    document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(button => {
      button.classList.toggle('active', button.dataset.page === page);
    });
    const mobileTitle = document.querySelector('.mobile-title');
    if (mobileTitle) {
      const target = document.getElementById(`page-${page}`);
      const label = preferredButton(page)?.textContent?.trim() || target?.querySelector('h2')?.textContent?.trim() || 'Lellee';
      mobileTitle.textContent = label.replace(/Build 3$/, '').trim();
    }
  }

  function buildAccordion() {
    navList = document.querySelector('.sidebar .nav-list');
    if (!navList || navList.dataset.build2Ready === 'true') return;
    navList.dataset.build2Ready = 'true';
    createExpertPracticesPage();

    const selected = new Map();
    Object.values(CATEGORY_MAP).flatMap(config => config.pages).forEach(page => {
      let button = preferredButton(page);
      if (!button && page === 'expert-guided-practices') button = makePlaceholderButton();
      if (button) selected.set(page, button);
    });

    [...navList.querySelectorAll(':scope > .nav-item')].forEach(button => {
      if (![...selected.values()].includes(button)) button.classList.add('b2-nav-unused');
    });

    const fragment = document.createDocumentFragment();
    Object.entries(CATEGORY_MAP).forEach(([key, config]) => {
      const group = document.createElement('div');
      group.className = 'nav-category';
      group.dataset.category = key;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-category-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = `<span class="b2-cat-icon">${config.icon}</span><span>${config.label}</span><span class="b2-cat-chevron">›</span>`;

      const items = document.createElement('div');
      items.className = 'nav-category-items';
      const inner = document.createElement('div');
      inner.className = 'nav-category-items-inner';
      config.pages.forEach(page => {
        const button = selected.get(page);
        if (button) inner.appendChild(button);
      });
      items.appendChild(inner);
      group.append(toggle, items);
      fragment.appendChild(group);
      categoryNodes.set(key, group);

      toggle.addEventListener('click', () => {
        const alreadyOpen = group.classList.contains('open');
        if (alreadyOpen) {
          group.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        } else {
          openCategory(key);
        }
      });
    });

    navList.replaceChildren(fragment);
    const active = activePageName();
    const savedCategory = localStorage.getItem(CATEGORY_KEY);
    openCategory(savedCategory || categoryForPage(active), false);
    updateCategoryForActivePage(active);
  }

  function openMobileMenu() {
    document.querySelector('.sidebar')?.classList.add('b2-mobile-open');
    backdrop?.classList.add('open');
    document.body.classList.add('b2-menu-open');
  }

  function closeMobileMenu() {
    document.querySelector('.sidebar')?.classList.remove('b2-mobile-open');
    backdrop?.classList.remove('open');
    document.body.classList.remove('b2-menu-open');
  }

  function setupMobileDrawer() {
    const sidebar = document.querySelector('.sidebar');
    const logoWrap = sidebar?.querySelector('.logo-wrap');
    if (!sidebar || !logoWrap || logoWrap.dataset.b2DrawerReady === 'true') return;
    logoWrap.dataset.b2DrawerReady = 'true';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'b2-sidebar-close';
    close.setAttribute('aria-label', 'Close menu');
    close.textContent = '×';
    close.addEventListener('click', closeMobileMenu);
    logoWrap.appendChild(close);

    backdrop = document.createElement('div');
    backdrop.className = 'b2-sidebar-backdrop';
    backdrop.addEventListener('click', closeMobileMenu);
    document.body.appendChild(backdrop);

    const oldButton = document.querySelector('.mobile-menu-btn');
    if (oldButton) {
      const newButton = oldButton.cloneNode(true);
      newButton.removeAttribute('data-page');
      newButton.setAttribute('aria-label', 'Open navigation menu');
      newButton.addEventListener('click', openMobileMenu);
      oldButton.replaceWith(newButton);
    }
    window.addEventListener('keydown', event => { if (event.key === 'Escape') closeMobileMenu(); });
  }

  function setSidebarLogo() {
    const logo = document.querySelector('.sidebar .approved-logo');
    if (!logo) return;
    const next = new URL(LOGO_SRC, location.origin).href;
    if (logo.src !== next) logo.src = LOGO_SRC;
    logo.removeAttribute('srcset');
    logo.alt = 'Lellee — Your journey. Your support. Your way.';
  }

  function watchPageState() {
    document.addEventListener('click', event => {
      const pageButton = event.target.closest?.('[data-page]');
      if (!pageButton?.dataset.page) return;
      setTimeout(() => updateCategoryForActivePage(), 0);
      closeMobileMenu();
    }, true);

    document.addEventListener('lellee:pagechange', event => {
      updateCategoryForActivePage(event.detail?.page || activePageName());
      closeMobileMenu();
    });

    document.getElementById('signOutBtn')?.addEventListener('click', () => {
      localStorage.removeItem(PAGE_KEY);
      localStorage.removeItem(CATEGORY_KEY);
    });
  }

  function voiceLanguage() {
    const lang = (document.documentElement.lang || navigator.language || 'en').toLowerCase();
    return lang.startsWith('es') ? 'es-US' : 'en-US';
  }

  function voiceStatus(message) {
    let status = document.querySelector('.b2-voice-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'b2-voice-status';
      status.setAttribute('role', 'status');
      document.body.appendChild(status);
    }
    status.textContent = message;
    clearTimeout(voiceStatus.timer);
    voiceStatus.timer = setTimeout(() => status.remove(), 2600);
  }

  function eligibleVoiceField(field) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return false;
    if (field.disabled || field.readOnly || field.dataset.noVoice === 'true') return false;
    if (field instanceof HTMLInputElement && field.type !== 'text') return false;
    if (field.closest('.auth-overlay')) return false;
    return true;
  }

  function enhanceVoiceField(field) {
    if (!eligibleVoiceField(field) || field.dataset.voiceReady === 'true') return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    field.dataset.voiceReady = 'true';

    const wrapper = document.createElement('span');
    wrapper.className = `b2-voice-wrap${field instanceof HTMLTextAreaElement ? ' b2-textarea' : ''}`;
    field.parentNode.insertBefore(wrapper, field);
    wrapper.appendChild(field);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'b2-voice-button';
    button.setAttribute('aria-label', 'Speak to enter text');
    button.title = 'Speak to enter text';
    button.textContent = '🎙';
    wrapper.appendChild(button);

    button.addEventListener('click', () => {
      const recognition = new Recognition();
      recognition.lang = voiceLanguage();
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => { button.classList.add('listening'); voiceStatus('Listening… Speak now.'); };
      recognition.onresult = event => {
        const text = event.results?.[0]?.[0]?.transcript?.trim();
        if (!text) return;
        const prefix = field.value && !/\s$/.test(field.value) ? ' ' : '';
        field.value = `${field.value}${prefix}${text}`;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.focus();
        voiceStatus('Voice text added. Review it before saving.');
      };
      recognition.onerror = event => {
        if (event.error !== 'aborted') voiceStatus('Voice input was not completed. You can try again or type instead.');
      };
      recognition.onend = () => button.classList.remove('listening');
      recognition.start();
    });
  }

  function setupVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    document.querySelectorAll('textarea,input[type="text"]').forEach(enhanceVoiceField);
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.('textarea,input[type="text"]')) enhanceVoiceField(node);
        node.querySelectorAll?.('textarea,input[type="text"]').forEach(enhanceVoiceField);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }

  function initialize() {
    setSidebarLogo();
    buildAccordion();
    setupMobileDrawer();
    watchPageState();
    setupVoiceInput();
    console.info('Lellee Build 2 consolidated shell 2026-09-03 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
