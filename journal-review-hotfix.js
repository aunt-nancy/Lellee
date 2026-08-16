(() => {
  'use strict';
  const VERSION = '2026-08-16-journal-review-r1';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  let cachedRows = [];
  let loading = false;

  function supabaseClient() {
    try { if (typeof sb !== 'undefined' && sb?.auth) return sb; } catch (_) {}
    return window.sb || null;
  }

  async function resolveUser() {
    try {
      if (typeof currentUser !== 'undefined' && currentUser?.id) return currentUser;
    } catch (_) {}
    const c = supabaseClient();
    if (!c) return null;
    try {
      const { data } = await c.auth.getSession();
      if (data?.session?.user) return data.session.user;
    } catch (_) {}
    try {
      const { data } = await c.auth.getUser();
      return data?.user || null;
    } catch (_) { return null; }
  }

  function localFallbackRows() {
    try {
      if (typeof data !== 'undefined' && Array.isArray(data?.journalEntries)) {
        return data.journalEntries.map((r, i) => ({
          id: `local-${i}`,
          content: r?.text || r?.content || '',
          created_at: r?.date || r?.created_at || new Date().toISOString(),
          title: r?.title || null
        }));
      }
    } catch (_) {}
    return [];
  }

  function render(rows) {
    const host = $('#journalEntryCards');
    if (!host) return;
    cachedRows = Array.isArray(rows) ? rows : [];
    applyFilters();
  }

  function contentFor(row) {
    return row?.content ?? row?.text ?? row?.body ?? '';
  }

  function applyFilters() {
    const host = $('#journalEntryCards');
    if (!host) return;
    const q = ($('#journalSearch')?.value || '').trim().toLowerCase();
    let rows = cachedRows.slice();
    if (q) rows = rows.filter(r => `${r?.title || ''} ${contentFor(r)}`.toLowerCase().includes(q));

    if (!rows.length) {
      host.innerHTML = '<div class="b7-safe-state">No saved journal entries found.</div>';
      return;
    }

    host.innerHTML = rows.map(r => {
      const rawDate = r?.created_at || r?.entry_date || r?.date || new Date().toISOString();
      let dateLabel = 'Saved entry';
      try { dateLabel = new Date(rawDate).toLocaleDateString(); } catch (_) {}
      const text = contentFor(r).trim();
      return `<article class="b3-journal-card journal-review-hotfix-card">
        <div class="b3-journal-card-head"><small>${esc(dateLabel)}</small></div>
        ${r?.title ? `<h3>${esc(r.title)}</h3>` : ''}
        <p>${esc(text || 'Blank entry').replace(/\n/g, '<br>')}</p>
      </article>`;
    }).join('');
  }

  async function loadEntries() {
    if (loading) return;
    const list = $('#entriesList');
    const host = $('#journalEntryCards');
    if (!list || !host) return;

    list.classList.remove('hidden');
    host.innerHTML = '<div class="b7-safe-state">Loading your saved entries…</div>';
    loading = true;

    try {
      const c = supabaseClient();
      const user = await resolveUser();
      let rows = [];

      if (c && user?.id) {
        const request = c.from('journal_entries')
          .select('id,content,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Journal history timed out.')), 7000));
        const { data: dbRows, error } = await Promise.race([request, timeout]);
        if (error) throw error;
        rows = dbRows || [];
      }

      if (!rows.length) rows = localFallbackRows();
      render(rows);
      list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('Lellee journal review hotfix:', err);
      const fallback = localFallbackRows();
      if (fallback.length) render(fallback);
      else host.innerHTML = `<div class="b7-safe-state error">${esc(err?.message || 'Journal entries could not be loaded.')}</div>`;
    } finally {
      loading = false;
    }
  }

  function toggleEntries(button) {
    const list = $('#entriesList');
    if (!list) return;
    if (!list.classList.contains('hidden')) {
      list.classList.add('hidden');
      if (button) button.textContent = 'Review Entries';
      return;
    }
    if (button) button.textContent = 'Hide Entries';
    loadEntries();
  }

  // Delegated capture listener is intentional. Recovery has several older
  // listeners attached directly to #toggleEntries. Catching this at document
  // capture makes the Review Entries control reliable even if another build
  // clones/replaces the button later.
  document.addEventListener('click', event => {
    const button = event.target.closest?.('#toggleEntries');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    toggleEntries(button);
  }, true);

  document.addEventListener('input', event => {
    if (event.target?.id === 'journalSearch') applyFilters();
  }, true);

  console.info(`Lellee journal review hotfix ${VERSION} loaded`);
})();
