(() => {
  'use strict';

  const BUILD = 'b3';
  const state = {
    hydrated: false,
    journalEntries: [],
    journalCollections: [],
    journalMeta: new Map(),
    journalVolumeFilter: '',
    currentJournalEntry: null,
    learningProgress: new Map(),
    selectedPaths: new Set(),
    searchFilter: 'all',
    thenNowRows: [],
    storySnapshot: null
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const db = () => (typeof sb !== 'undefined' ? sb : null);
  const member = () => (typeof currentUser !== 'undefined' ? currentUser : null);
  const uid = () => member()?.id || null;
  const localKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const monthKey = () => localKey().slice(0, 7);
  const slug = value => String(value || '').toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const formatDate = value => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  };

  function toast(message, type = 'success') {
    if (typeof showSync === 'function' && type !== 'error') {
      showSync(message);
      return;
    }
    let el = $('#globalToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'globalToast';
      el.className = 'prod-toast hidden';
      document.body.appendChild(el);
    }
    el.dataset.type = type;
    el.textContent = message;
    el.classList.remove('hidden');
    window.setTimeout(() => el.classList.add('hidden'), 2600);
  }

  function navigate(page) {
    if (typeof showPage === 'function') {
      showPage(page);
      return;
    }
    const button = document.querySelector(`[data-page="${CSS.escape(page)}"]`);
    if (button) button.click();
  }

  function localStoreKey(name) {
    return `lellee:${BUILD}:${uid() || 'guest'}:${name}`;
  }
  function readLocal(name, fallback) {
    try { return JSON.parse(localStorage.getItem(localStoreKey(name)) || 'null') ?? fallback; }
    catch { return fallback; }
  }
  function writeLocal(name, value) {
    localStorage.setItem(localStoreKey(name), JSON.stringify(value));
  }

  async function selectOwn(table, columns = '*', configure) {
    const client = db();
    if (!client || !uid()) return { data: [], error: null };
    try {
      let query = client.from(table).select(columns).eq('user_id', uid());
      if (configure) query = configure(query);
      return await query;
    } catch (error) {
      console.warn(`[Build 3] ${table} select`, error);
      return { data: [], error };
    }
  }

  async function upsertOwn(table, row, onConflict) {
    const client = db();
    if (!client || !uid()) return { data: null, error: new Error('No signed-in member') };
    try {
      return await client.from(table).upsert({ ...row, user_id: uid() }, onConflict ? { onConflict } : undefined).select();
    } catch (error) {
      console.warn(`[Build 3] ${table} upsert`, error);
      return { data: null, error };
    }
  }

  async function deleteOwn(table, configure) {
    const client = db();
    if (!client || !uid()) return { error: new Error('No signed-in member') };
    try {
      let query = client.from(table).delete().eq('user_id', uid());
      query = configure(query);
      return await query;
    } catch (error) {
      return { error };
    }
  }

  /* ------------------------------------------------------------------
     Journal + Journal Companion
  ------------------------------------------------------------------ */
  const promptMap = {
    today_recovery_need: ['What does my recovery need from me today?', 'You can answer the prompt, write about something else, or leave the page blank.'],
    what_helped: ['What helped me protect my recovery today?', 'Notice anything that offered support, steadiness, or relief.'],
    what_was_hard: ['What was hardest today?', 'Write only what feels useful. You do not have to explain everything.'],
    something_i_notice: ['What am I noticing about myself?', 'Patterns can be small. Curiosity is enough.'],
    gratitude: ['What am I grateful for right now?', 'Small, ordinary things count.'],
    letter: ['What do I need to say, even if I never send it?', 'This remains private unless you deliberately choose otherwise.'],
    custom: ['Write freely', 'Use this space in the way that helps you most.']
  };

  function entryRef(entry) { return String(entry?.id ?? entry?.entry_id ?? entry?.created_at ?? entry?.entry_date ?? crypto.randomUUID()); }
  function entryContent(entry) { return String(entry?.content ?? entry?.body ?? entry?.text ?? entry?.entry_text ?? ''); }
  function entryDate(entry) { return entry?.created_at ?? entry?.entry_date ?? entry?.date ?? null; }
  function entryTitle(entry) {
    const meta = state.journalMeta.get(entryRef(entry));
    return meta?.title || entry?.title || promptMap[meta?.prompt_key]?.[0] || 'Journal entry';
  }

  async function fetchJournalEntries() {
    const client = db();
    if (client && uid()) {
      let result;
      try {
        result = await client.from('journal_entries').select('*').eq('user_id', uid()).order('created_at', { ascending: false }).limit(500);
      } catch (error) { result = { data: null, error }; }
      if (!result?.error && Array.isArray(result?.data)) {
        state.journalEntries = result.data;
        return;
      }
    }
    const local = (typeof data !== 'undefined' && Array.isArray(data.journalEntries)) ? data.journalEntries : readLocal('journal-entries', []);
    state.journalEntries = local.map((item, index) => ({ ...item, id: item.id || `local-${index}-${item.date || ''}`, content: item.content || item.text || '' }));
  }

  async function fetchJournalMeta() {
    const result = await selectOwn('lellee_journal_entry_meta', '*', q => q.order('updated_at', { ascending: false }));
    const rows = result.error ? readLocal('journal-meta', []) : (result.data || []);
    state.journalMeta = new Map(rows.map(row => [String(row.entry_ref), row]));
  }

  async function fetchCollections() {
    const result = await selectOwn('lellee_journal_collections', '*', q => q.order('created_at', { ascending: true }));
    state.journalCollections = result.error ? readLocal('journal-collections', []) : (result.data || []);
    renderCollectionControls();
  }

  function collectionName(id) {
    return state.journalCollections.find(item => item.id === id)?.name || 'Daily Journal';
  }

  function renderCollectionControls() {
    const entrySelect = $('#journalCollectionSelect');
    const filterSelect = $('#journalFilterCollection');
    if (entrySelect) {
      const current = entrySelect.value;
      entrySelect.innerHTML = '<option value="">Daily Journal</option>' + state.journalCollections.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
      if ([...entrySelect.options].some(o => o.value === current)) entrySelect.value = current;
    }
    if (filterSelect) {
      const current = filterSelect.value;
      filterSelect.innerHTML = '<option value="">All collections</option>' + state.journalCollections.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
      if ([...filterSelect.options].some(o => o.value === current)) filterSelect.value = current;
    }
    const currentCollection = $('#journalCurrentCollection');
    if (currentCollection) currentCollection.textContent = collectionName(entrySelect?.value || '');

    const list = $('#journalCollectionsList');
    if (list) {
      list.innerHTML = state.journalCollections.length ? state.journalCollections.map(item => `
        <div class="approved-collection-row">
          <span>▧</span><div><b>${escapeHtml(item.name)}</b><small>Private journal collection</small></div>
          <button class="approved-link" type="button" data-b3-delete-collection="${escapeHtml(item.id)}">Delete</button>
        </div>`).join('') : '<div class="b3-empty">Create a collection when you want to keep related entries together.</div>';
    }
  }

  function renderJournalCards() {
    const host = $('#journalEntryCards');
    if (!host) return;
    host.classList.add('b3-entry-grid');
    const search = ($('#journalSearch')?.value || '').trim().toLowerCase();
    const collection = $('#journalFilterCollection')?.value || '';
    const type = $('#journalFilterType')?.value || '';
    let rows = [...state.journalEntries];
    rows = rows.filter(entry => {
      const ref = entryRef(entry);
      const meta = state.journalMeta.get(ref) || {};
      if (state.journalVolumeFilter && meta.physical_volume !== state.journalVolumeFilter) return false;
      if (collection && meta.collection_id !== collection) return false;
      if (type === 'favorites' && !meta.favorite) return false;
      if (type === 'story' && !meta.story_opt_in) return false;
      const hay = `${entryTitle(entry)} ${entryContent(entry)} ${collectionName(meta.collection_id)}`.toLowerCase();
      if (search && !hay.includes(search)) return false;
      return true;
    });
    if (!rows.length) {
      host.innerHTML = '<div class="b3-empty">No entries match these filters yet. Your saved entries remain private.</div>';
      return;
    }
    host.innerHTML = rows.map(entry => {
      const ref = entryRef(entry);
      const meta = state.journalMeta.get(ref) || {};
      const tags = [meta.collection_id ? collectionName(meta.collection_id) : '', meta.physical_volume ? meta.physical_volume.replace('_', ' ').replace('volume', 'Volume') : '', meta.favorite ? 'Favorite' : '', meta.story_opt_in ? 'Story approved' : ''].filter(Boolean);
      return `<article class="b3-journal-card">
        <div class="b3-journal-card-head"><small>${escapeHtml(formatDate(entryDate(entry)))}</small>${meta.favorite ? '<span aria-label="Favorite">♡</span>' : ''}</div>
        <h3>${escapeHtml(entryTitle(entry))}</h3>
        <p>${escapeHtml(entryContent(entry) || 'Blank entry')}</p>
        <div class="b3-entry-tags">${tags.map(tag => `<span class="b3-entry-tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <button class="approved-link" type="button" data-b3-open-entry="${escapeHtml(ref)}">Open entry →</button>
      </article>`;
    }).join('');
  }

  async function loadJournalWorkspace() {
    await Promise.all([fetchJournalEntries(), fetchJournalMeta(), fetchCollections()]);
    renderJournalCards();
  }

  async function saveJournalMeta(ref, changes) {
    const existing = state.journalMeta.get(String(ref)) || {};
    const row = { ...existing, ...changes, entry_ref: String(ref) };
    delete row.id; delete row.user_id; delete row.created_at; delete row.updated_at;
    const result = await upsertOwn('lellee_journal_entry_meta', row, 'user_id,entry_ref');
    if (result.error) {
      const local = [...state.journalMeta.values()].filter(x => String(x.entry_ref) !== String(ref));
      local.push({ ...row, user_id: uid() });
      writeLocal('journal-meta', local);
    }
    state.journalMeta.set(String(ref), { ...existing, ...row });
    renderJournalCards();
  }

  async function attachLatestJournalMeta(snapshot) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, attempt ? 500 : 900));
      await fetchJournalEntries();
      const latest = state.journalEntries[0];
      if (!latest) continue;
      await saveJournalMeta(entryRef(latest), snapshot);
      toast('Journal details saved');
      return;
    }
  }

  function openJournalEntry(ref) {
    const entry = state.journalEntries.find(item => entryRef(item) === String(ref));
    if (!entry) return;
    state.currentJournalEntry = entry;
    const meta = state.journalMeta.get(String(ref)) || {};
    $('#journalEntryDetailTitle').textContent = entryTitle(entry);
    $('#journalEntryDetailMeta').textContent = `${formatDate(entryDate(entry))} • ${collectionName(meta.collection_id)}`;
    $('#detailFavoriteToggle').checked = !!meta.favorite;
    $('#detailStoryToggle').checked = !!meta.story_opt_in;
    const host = $('#journalEntryDetailBody');
    host.innerHTML = `
      <div class="b3-entry-view" id="b3EntryView">
        <h3>${escapeHtml(entryTitle(entry))}</h3>
        <p>${escapeHtml(entryContent(entry)).replace(/\n/g, '<br>')}</p>
        <div class="b3-entry-edit-actions"><button class="approved-link" type="button" id="b3EditEntry">Edit entry</button></div>
      </div>
      <div class="b3-entry-editor b3-hidden" id="b3EntryEditor">
        <label>Title<input id="b3EntryTitle" maxlength="160" value="${escapeHtml(entryTitle(entry))}"></label>
        <label>Entry<textarea id="b3EntryContent">${escapeHtml(entryContent(entry))}</textarea></label>
        <div class="b3-entry-edit-actions"><button class="approved-link" type="button" id="b3CancelEntryEdit">Cancel</button><button class="approved-small-action" type="button" id="b3SaveEntryEdit">Save Entry</button></div>
      </div>`;
    navigate('journal-entry');
  }

  async function updateJournalEntryContent() {
    const entry = state.currentJournalEntry;
    if (!entry) return;
    const content = $('#b3EntryContent')?.value ?? '';
    const title = $('#b3EntryTitle')?.value.trim() || 'Journal entry';
    const client = db();
    if (client && uid() && entry.id) {
      const { error } = await client.from('journal_entries').update({ content }).eq('user_id', uid()).eq('id', entry.id);
      if (error) {
        toast(`Entry text was not updated: ${error.message}`, 'error');
        return;
      }
    }
    if ('content' in entry) entry.content = content; else entry.text = content;
    await saveJournalMeta(entryRef(entry), { title });
    openJournalEntry(entryRef(entry));
    toast('Journal entry updated');
  }

  async function createCollection() {
    const input = $('#newCollectionName');
    const name = input?.value.trim();
    if (!name) { toast('Enter a collection name', 'error'); return; }
    const result = await upsertOwn('lellee_journal_collections', { name }, 'user_id,name');
    if (result.error) {
      const duplicate = state.journalCollections.some(item => item.name.toLowerCase() === name.toLowerCase());
      if (!duplicate) {
        const local = [...state.journalCollections, { id: crypto.randomUUID(), user_id: uid(), name }];
        writeLocal('journal-collections', local);
      }
    }
    input.value = '';
    await fetchCollections();
    toast('Collection created');
  }

  async function deleteCollection(id) {
    if (!window.confirm('Delete this collection? The journal entries will remain saved.')) return;
    const result = await deleteOwn('lellee_journal_collections', query => query.eq('id', id));
    if (result.error) writeLocal('journal-collections', state.journalCollections.filter(item => item.id !== id));
    state.journalCollections = state.journalCollections.filter(item => item.id !== id);
    renderCollectionControls();
    toast('Collection removed');
  }

  async function hasJournalCompanion() {
    const result = await selectOwn('lellee_feature_entitlements', '*', query => query.eq('feature_key', 'journal_companion').in('status', ['active', 'trialing']).limit(1));
    if (result.error) return true; // SQL not installed yet: do not strand an existing tester.
    const row = result.data?.[0];
    if (!row) return false;
    return !row.ends_at || new Date(row.ends_at) > new Date();
  }

  async function renderJournalCompanionAccess() {
    const page = $('#page-journal-companion .approved-inner');
    if (!page || page.querySelector('.b3-companion-banner')) return;
    const head = page.querySelector('.approved-inner-head');
    const banner = document.createElement('div');
    banner.className = 'b3-companion-banner';
    banner.innerHTML = `<div><span class="approved-kicker">OPTIONAL ADD-ON</span><h3>Journal Companion</h3><p>Advanced collections, physical-journal pairing, volume review, and long-term organization. The basic digital Journal remains included.</p></div><div class="b3-price-stack"><b>$4.99/month</b><small>3 months included with an eligible physical Lellee journal</small><div class="b3-companion-actions"><button class="approved-small-action" type="button" data-page="plus">Unlock Companion</button></div></div>`;
    head.after(banner);
    const allowed = await hasJournalCompanion();
    if (allowed) return;
    const content = [...page.children].filter(child => child !== head && child !== banner);
    content.forEach(child => child.classList.add('b3-hidden', 'b3-companion-protected'));
    const lock = document.createElement('div');
    lock.className = 'b3-companion-lock';
    lock.innerHTML = `<div class="b3-lock-icon">▦</div><h3>Unlock Journal Companion</h3><p>Your basic Journal remains available. Journal Companion adds structured volumes, expanded collections, physical-page pairing, and intentional long-term review.</p><button class="approved-small-action" type="button" data-page="plus">View add-on options</button>`;
    banner.after(lock);
  }

  function setPrompt(key) {
    const [title, lead] = promptMap[key] || promptMap.custom;
    if ($('#journalPromptSelect')) $('#journalPromptSelect').value = key;
    if ($('#journalPromptTitle')) $('#journalPromptTitle').textContent = title;
    if ($('#journalPromptLead')) $('#journalPromptLead').textContent = lead;
  }

  function setupJournal() {
    $('#toggleEntries')?.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation();
      const list = $('#entriesList');
      list?.classList.toggle('hidden');
      if (!list?.classList.contains('hidden')) loadJournalWorkspace();
    }, true);
    $('#journalSearch')?.addEventListener('input', renderJournalCards);
    $('#journalFilterCollection')?.addEventListener('change', renderJournalCards);
    $('#journalFilterType')?.addEventListener('change', renderJournalCards);
    $('#journalCollectionSelect')?.addEventListener('change', event => {
      if ($('#journalCurrentCollection')) $('#journalCurrentCollection').textContent = collectionName(event.target.value);
    });
    $('#journalPromptSelect')?.addEventListener('change', event => setPrompt(event.target.value));

    $('#createJournalCollection')?.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation(); createCollection();
    }, true);

    $('#saveJournal')?.addEventListener('click', () => {
      const snapshot = {
        collection_id: $('#journalCollectionSelect')?.value || null,
        prompt_key: $('#journalPromptSelect')?.value || 'custom',
        title: $('#journalTitleV2')?.value.trim() || null,
        physical_volume: $('#journalPhysicalVolume')?.value || null,
        physical_page: $('#journalPhysicalPage')?.value.trim() || null,
        favorite: !!$('#journalFavoriteV2')?.checked,
        story_opt_in: !!$('#journalStoryOptInV2')?.checked
      };
      attachLatestJournalMeta(snapshot);
    }, true);

    $('#saveJournalEntryPermissions')?.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!state.currentJournalEntry) return;
      saveJournalMeta(entryRef(state.currentJournalEntry), {
        favorite: !!$('#detailFavoriteToggle')?.checked,
        story_opt_in: !!$('#detailStoryToggle')?.checked
      }).then(() => toast('Entry permissions updated'));
    }, true);

    $('#printJournalEntry')?.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation(); window.print();
    }, true);

    document.addEventListener('click', event => {
      const open = event.target.closest('[data-b3-open-entry]');
      if (open) { openJournalEntry(open.dataset.b3OpenEntry); return; }
      const remove = event.target.closest('[data-b3-delete-collection]');
      if (remove) { deleteCollection(remove.dataset.b3DeleteCollection); return; }
      const volume = event.target.closest('[data-volume-filter]');
      if (volume) {
        event.preventDefault(); event.stopImmediatePropagation();
        state.journalVolumeFilter = volume.dataset.volumeFilter;
        navigate('journal');
        $('#entriesList')?.classList.remove('hidden');
        loadJournalWorkspace();
        return;
      }
      const prompt = event.target.closest('[data-use-journal-prompt]');
      if (prompt) {
        event.preventDefault(); event.stopImmediatePropagation();
        state.journalVolumeFilter = '';
        navigate('journal'); setPrompt(prompt.dataset.useJournalPrompt);
        window.setTimeout(() => $('#journalText')?.focus(), 80);
        return;
      }
      if (event.target.closest('#b3EditEntry')) {
        $('#b3EntryView')?.classList.add('b3-hidden'); $('#b3EntryEditor')?.classList.remove('b3-hidden');
      }
      if (event.target.closest('#b3CancelEntryEdit')) {
        $('#b3EntryEditor')?.classList.add('b3-hidden'); $('#b3EntryView')?.classList.remove('b3-hidden');
      }
      if (event.target.closest('#b3SaveEntryEdit')) updateJournalEntryContent();
    }, true);
  }

  /* ------------------------------------------------------------------
     Learning and recovery paths
  ------------------------------------------------------------------ */
  function learningKey() { return slug($('#learningDetailTitle')?.textContent || 'lesson'); }

  async function fetchLearningProgress() {
    const result = await selectOwn('lellee_learning_progress');
    const rows = result.error ? readLocal('learning-progress', []) : (result.data || []);
    state.learningProgress = new Map(rows.map(row => [row.item_key, row]));
    annotateLearningCards();
    updateLearningDetail();
  }

  function annotateLearningCards() {
    $$('.approved-learning-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent.trim();
      if (!title) return;
      const progress = state.learningProgress.get(slug(title));
      card.classList.toggle('b3-completed', progress?.status === 'completed');
      card.classList.toggle('b3-saved', progress?.status === 'saved');
      card.querySelector('.b3-learning-card-status')?.remove();
      if (progress) {
        const status = document.createElement('span');
        status.className = `b3-learning-card-status b3-status-pill ${progress.status}`;
        status.textContent = progress.status === 'completed' ? '✓ Completed' : 'Saved for later';
        card.querySelector('.approved-learning-actions')?.before(status);
      }
    });
  }

  function updateLearningDetail() {
    const key = learningKey();
    const progress = state.learningProgress.get(key);
    const complete = $('#markLearningComplete');
    const saved = $('#saveLearningItem');
    if (complete) {
      complete.textContent = progress?.status === 'completed' ? '✓ Completed' : 'Mark Complete';
      complete.classList.toggle('b3-complete', progress?.status === 'completed');
    }
    if (saved) saved.textContent = progress ? (progress.status === 'completed' ? 'Completed lesson' : 'Saved for Later') : 'Save for Later';
  }

  async function saveLearning(status) {
    const title = $('#learningDetailTitle')?.textContent.trim() || 'Lesson';
    const key = slug(title);
    const now = new Date().toISOString();
    const row = {
      item_key: key,
      item_type: ($('#learningDetailType')?.textContent || 'lesson').toLowerCase(),
      title,
      status,
      saved_at: now,
      completed_at: status === 'completed' ? now : null
    };
    const result = await upsertOwn('lellee_learning_progress', row, 'user_id,item_key');
    if (result.error) {
      const local = [...state.learningProgress.values()].filter(item => item.item_key !== key);
      local.push({ ...row, user_id: uid() }); writeLocal('learning-progress', local);
    }
    state.learningProgress.set(key, row);
    annotateLearningCards(); updateLearningDetail();
    toast(status === 'completed' ? 'Lesson completed' : 'Saved for later');
  }

  const pathDetails = {
    '12_step': { title: '12-Step', summary: 'A fellowship-based approach using meetings, sponsorship, mutual support, and a structured set of recovery steps.', contributes: ['Regular recovery connection', 'Peer accountability', 'A shared recovery language'], first: ['Explore a meeting', 'Notice whether sponsorship or fellowship feels useful', 'Keep other recovery supports active when needed'] },
    'skills_based': { title: 'SMART / Skills-Based', summary: 'A practical skills approach focused on motivation, coping with urges, managing thoughts and behaviors, and building a balanced life.', contributes: ['Coping and decision-making skills', 'Tools for urges and triggers', 'Self-directed behavior change'], first: ['Open one coping tool', 'Learn one trigger pattern', 'Practice one small behavior change'] },
    'therapy_counseling': { title: 'Therapy & Counseling', summary: 'Professional support that can address mental health, trauma, relationships, behavior patterns, and individualized treatment needs.', contributes: ['Individualized professional care', 'Mental-health and trauma support', 'Relationship and behavior work'], first: ['Identify the type of support you need', 'Use Resources to locate appropriate care', 'Keep urgent or medical concerns with qualified professionals'] },
    'medication_supported': { title: 'Medication-Supported Recovery', summary: 'Medication can be one part of an individualized recovery plan when prescribed and monitored by an appropriate medical professional.', contributes: ['Support for cravings or withdrawal in appropriate cases', 'A medical layer of recovery care', 'Coordination with counseling and peer support'], first: ['Talk with a qualified medical provider', 'Ask about benefits, risks, and follow-up', 'Do not start, stop, or change medication through Lellee'] },
    'peer_support': { title: 'Peer Support', summary: 'Recovery support from people with lived experience who can offer connection, practical encouragement, and hope without replacing clinical care.', contributes: ['Connection with lived experience', 'Practical encouragement', 'Reduced isolation'], first: ['Identify one safe peer-support setting', 'Choose the amount of connection that feels manageable', 'Keep privacy and boundaries clear'] },
    'faith_spiritual': { title: 'Faith & Spirituality', summary: 'Optional faith-based or spiritual practices can be included when they align with the member’s beliefs and preferences.', contributes: ['Meaning, hope, and values', 'Faith-community connection', 'Spiritual practices that support recovery'], first: ['Choose whether faith-aligned content is relevant', 'Set your tradition or leave it open', 'Use spiritual support alongside other needed care'] }
  };

  async function fetchSelectedPaths() {
    const result = await selectOwn('lellee_selected_paths');
    const rows = result.error ? readLocal('selected-paths', []) : (result.data || []);
    state.selectedPaths = new Set(rows.map(row => row.path_key));
    $$('.approved-path-grid [data-path]').forEach(button => button.classList.toggle('b3-selected', state.selectedPaths.has(button.dataset.path)));
  }

  async function toggleSelectedPath(key) {
    const selected = state.selectedPaths.has(key);
    if (selected) {
      const result = await deleteOwn('lellee_selected_paths', query => query.eq('path_key', key));
      if (result.error) writeLocal('selected-paths', [...state.selectedPaths].filter(item => item !== key).map(path_key => ({ path_key })));
      state.selectedPaths.delete(key);
      toast('Path removed from your options');
    } else {
      const result = await upsertOwn('lellee_selected_paths', { path_key: key }, 'user_id,path_key');
      if (result.error) writeLocal('selected-paths', [...state.selectedPaths, key].map(path_key => ({ path_key })));
      state.selectedPaths.add(key);
      toast('Path added to your recovery options');
    }
    $$('.approved-path-grid [data-path]').forEach(button => button.classList.toggle('b3-selected', state.selectedPaths.has(button.dataset.path)));
    renderPathDetail(key);
  }

  function renderPathDetail(key) {
    const detail = pathDetails[key];
    const panel = $('#pathDetailPanel');
    if (!detail || !panel) return;
    $$('.approved-path-grid [data-path]').forEach(button => button.classList.toggle('b3-selected', button.dataset.path === key || state.selectedPaths.has(button.dataset.path)));
    panel.classList.remove('hidden');
    panel.innerHTML = `<span class="approved-kicker">${escapeHtml(detail.title.toUpperCase())}</span><div class="b3-path-detail-grid"><div><h3>How this path may help</h3><p>${escapeHtml(detail.summary)}</p><h3>What it can contribute</h3><ul>${detail.contributes.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div><div><h3>A calm place to begin</h3><ol>${detail.first.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol><div class="b3-path-actions"><button class="approved-small-action" type="button" data-b3-select-path="${escapeHtml(key)}">${state.selectedPaths.has(key) ? 'Remove from my options' : 'Add to my recovery options'}</button><button class="approved-link" type="button" data-page="learn">Open related learning →</button></div></div></div>`;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderExpertPractices() {
    const page = $('#page-expert-guided-practices .approved-inner');
    if (!page) return;
    page.innerHTML = `<div class="approved-inner-head"><div><span class="approved-kicker">EXPERT-GUIDED PRACTICES</span><h2>Recognized guidance, translated into practical steps.</h2><p>Recovery practices deepen with service level. Safety-critical guidance remains available to everyone.</p></div><button class="approved-link" data-page="learn">← Learn</button></div><div class="b3-practice-lead"><span class="approved-kicker">RECOVERY FOUNDATION</span><h3>Grounded in recognized recovery, peer-support, trauma-informed, and behavior-change practices</h3><p>Lellee translates professional frameworks into plain language. It does not present education as diagnosis, medical treatment, or a replacement for qualified care.</p></div><div class="b3-practice-grid"><article class="b3-practice-tier" data-tier="free"><span class="b3-status-pill">Free</span><h3>Foundational practices</h3><p>Useful essentials that help members begin safely without a paywall.</p><ul><li>Grounding and coping basics</li><li>Recognizing triggers and warning signs</li><li>Building a support map</li><li>Understanding recovery pathways</li><li>Safety and when to seek professional help</li></ul><button class="approved-small-action" type="button" data-page="tools">Open foundational tools</button></article><article class="b3-practice-tier" data-tier="plus"><span class="b3-status-pill saved">Plus</span><h3>Structured guided practice</h3><p>Deeper pathway exercises released in manageable steps.</p><ul><li>Relapse-prevention planning</li><li>Communication and boundaries</li><li>Emotional-regulation practice</li><li>Recovery-capital building</li><li>Guided action plans and reviews</li></ul><button class="approved-small-action" type="button" data-page="plus">View Plus practices</button></article><article class="b3-practice-tier" data-tier="premium"><span class="b3-status-pill">Premium</span><h3>Personalized advanced sequences</h3><p>Advanced practices coordinated with progress, preferences, and connected service areas.</p><ul><li>Personalized practice sequencing</li><li>Longer-term maintenance planning</li><li>Cross-pathway guidance</li><li>Advanced reviews and carry-forward plans</li><li>Priority access to new advanced practices</li></ul><button class="approved-small-action" type="button" data-page="plus">View Premium guidance</button></article></div>`;
  }

  function setupLearningAndPaths() {
    $('#markLearningComplete')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); saveLearning('completed'); }, true);
    $('#saveLearningItem')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); saveLearning('saved'); }, true);
    document.addEventListener('click', event => {
      const path = event.target.closest('.approved-path-grid [data-path]');
      if (path) { event.preventDefault(); event.stopImmediatePropagation(); renderPathDetail(path.dataset.path); return; }
      const select = event.target.closest('[data-b3-select-path]');
      if (select) { event.preventDefault(); toggleSelectedPath(select.dataset.b3SelectPath); }
    }, true);
    new MutationObserver(() => { annotateLearningCards(); updateLearningDetail(); }).observe($('#page-learn') || document.body, { subtree: true, childList: true });
  }

  /* ------------------------------------------------------------------
     Privacy-aware search
  ------------------------------------------------------------------ */
  const searchIndex = [
    ['Today', 'Your daily recovery dashboard, guided actions, inspiration, and upcoming items.', 'program', 'today', 'daily dashboard check in gratitude recovery action'],
    ['For You', 'Personalized suggestions based on preferences and saved activity—not private journal text.', 'content', 'for-you', 'recommendations personalized next step rhythm'],
    ['My Recovery', 'Your current recovery phase, journey, plans, and long-term direction.', 'program', 'recovery', 'journey phase recovery plan'],
    ['Learn', 'Lessons and worksheets organized by current phase and topic.', 'content', 'learn', 'education lesson worksheet triggers sleep recovery'],
    ['Expert-Guided Practices', 'Plain-language practices grounded in recognized frameworks and organized by service level.', 'content', 'expert-guided-practices', 'expert practice tap 21 skills guidance'],
    ['Tools', 'Grounding, cravings, calming, triggers, sleep, connection, planning, and values tools.', 'content', 'tools', 'coping tools grounding breathing cravings halt'],
    ['Recovery Paths', 'Explore 12-Step, skills-based, counseling, medication-supported, peer, and faith-aligned approaches.', 'content', 'recovery-paths-v2', '12 step smart skills therapy medication peer faith'],
    ['Meetings', 'Your saved meeting plan and next meeting.', 'personal', 'meetings', 'meeting meetings peer support group planner'],
    ['Journal', 'Private writing, prompts, saved entries, favorites, and Recovery Story permissions.', 'personal', 'journal', 'journal entry writing prompt reflection'],
    ['Progress', 'Guided days, journals, tools, reviews, milestones, and long-term reflection.', 'personal', 'progress', 'progress goals reviews milestones tools used'],
    ['Calendar', 'Appointments, coaching sessions, milestones, and reminders.', 'personal', 'calendar', 'appointment reminder schedule meeting date'],
    ['Resources', 'Vetted recovery, housing, employment, treatment, and community resources.', 'resource', 'resources', 'resource directory treatment housing employment'],
    ['Community', 'Support people, meetings, and peer/community connection without an endless feed.', 'program', 'community', 'support network peer community'],
    ['Inbox', 'Messages, reminders, coaching, and group notices.', 'personal', 'inbox', 'messages reminders coach group'],
    ['Lellee Plus', 'Optional paid features that add deeper review and convenience without paywalling safety.', 'program', 'plus', 'plus premium journal companion subscription'],
    ['Settings', 'Recovery approach, faith preferences, personalization, language, and account settings.', 'personal', 'settings', 'preferences language account recovery approach']
  ].map(([title, description, type, page, keywords]) => ({ title, description, type, page, keywords }));

  async function dynamicSearchRows() {
    const rows = [];
    if (typeof data !== 'undefined' && data.goal) rows.push({ title: data.goal, description: 'Your current recovery goal', type: 'personal', page: 'progress-hub', keywords: `goal ${data.goal}` });
    const goalResult = await selectOwn('recovery_goals', '*', query => query.limit(50));
    (goalResult.data || []).forEach(goal => rows.push({ title: goal.title || goal.goal || 'Recovery goal', description: 'Saved recovery goal', type: 'personal', page: 'progress-hub', keywords: `${goal.title || ''} ${goal.category || ''}` }));
    return rows;
  }

  async function runSearch() {
    const input = $('#globalSearchInput');
    const host = $('#globalSearchResults');
    if (!input || !host) return;
    const query = input.value.trim().toLowerCase();
    if (!query) { host.innerHTML = '<div class="b3-empty">Enter a word or phrase to search Lellee.</div>'; return; }
    const dynamic = await dynamicSearchRows();
    const rows = [...searchIndex, ...dynamic].filter(item => {
      if (state.searchFilter !== 'all' && item.type !== state.searchFilter) return false;
      return `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(query);
    });
    host.innerHTML = rows.length ? rows.slice(0, 20).map(item => `<article class="b3-search-result"><div class="b3-search-icon">⌕</div><div><small>${escapeHtml(item.type)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div><button class="approved-link" type="button" data-b3-search-page="${escapeHtml(item.page)}">Open →</button></article>`).join('') : `<div class="b3-empty"><b>No exact match yet.</b><br>Try a broader term such as “meetings,” “journal,” “goals,” “tools,” or “resources.”</div>`;
  }

  function setupSearch() {
    $('#globalSearchButton')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); runSearch(); }, true);
    $('#globalSearchInput')?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); runSearch(); } });
    $$('.global-search-filters [data-search-filter]').forEach(button => button.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation();
      state.searchFilter = button.dataset.searchFilter;
      $$('.global-search-filters [data-search-filter]').forEach(item => item.classList.toggle('active', item === button));
      if ($('#globalSearchInput')?.value.trim()) runSearch();
    }, true));
    document.addEventListener('click', event => {
      const result = event.target.closest('[data-b3-search-page]');
      if (result) { event.preventDefault(); navigate(result.dataset.b3SearchPage); }
    }, true);
  }

  /* ------------------------------------------------------------------
     Goal dropdown-first flow
  ------------------------------------------------------------------ */
  const goalOptions = {
    meetings_support: ['Attend one recovery meeting this week', 'Contact one support person', 'Add a trusted support person', 'Try one peer-support option'],
    coping_skills: ['Use one coping tool each day', 'Practice grounding when stress rises', 'Create a trigger-response plan', 'Pause before reacting'],
    health_self_care: ['Improve my sleep routine', 'Eat and hydrate more consistently', 'Schedule a health appointment', 'Move my body three times this week'],
    relationships: ['Set one healthy boundary', 'Have one honest conversation', 'Repair one relationship carefully', 'Ask for support sooner'],
    work_school: ['Complete one application', 'Update my résumé', 'Attend work or class consistently', 'Finish one overdue task'],
    housing: ['Contact one housing resource', 'Complete one housing application', 'Organize housing documents', 'Follow up on a housing lead'],
    legal_reentry: ['Complete one reentry requirement', 'Contact my case manager', 'Organize legal documents', 'Prepare for one appointment'],
    faith_spirituality: ['Attend a faith or spiritual support activity', 'Practice one spiritual routine', 'Talk with a trusted faith leader', 'Reflect on one value'],
    recovery_routine: ['Follow my morning recovery routine', 'Protect my evening routine', 'Review my recovery plan', 'Reduce one high-risk situation'],
    other: ['Other']
  };
  const goalLabels = {
    meetings_support: 'Meetings & Support', coping_skills: 'Coping Skills', health_self_care: 'Health & Self-Care', relationships: 'Relationships', work_school: 'Work or School', housing: 'Housing', legal_reentry: 'Legal or Reentry', faith_spirituality: 'Faith or Spirituality', recovery_routine: 'Recovery Routine', other: 'Other'
  };

  function patchPlannerGoalForm() {
    const title = $('#goalTitle');
    const category = $('#goalCategory');
    if (!title || !category || title.dataset.b3Patched === 'true') return;
    title.dataset.b3Patched = 'true';
    title.closest('.b2-voice-wrap')?.querySelector('.b2-voice-button')?.remove();
    category.closest('.b2-voice-wrap')?.querySelector('.b2-voice-button')?.remove();
    title.type = 'hidden'; category.type = 'hidden';
    const categorySelect = document.createElement('select');
    categorySelect.id = 'b3GoalCategory';
    categorySelect.innerHTML = '<option value="">Choose a general area</option>' + Object.entries(goalLabels).map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('');
    const presetSelect = document.createElement('select');
    presetSelect.id = 'b3GoalPreset';
    presetSelect.disabled = true;
    presetSelect.innerHTML = '<option value="">Choose a goal</option>';
    const other = document.createElement('input');
    other.id = 'b3GoalOther'; other.className = 'b3-hidden'; other.placeholder = 'Describe your goal';
    category.parentElement.insertBefore(categorySelect, category);
    title.parentElement.insertBefore(presetSelect, title);
    title.parentElement.appendChild(other);
    categorySelect.addEventListener('change', () => {
      const key = categorySelect.value;
      category.value = goalLabels[key] || '';
      presetSelect.disabled = !key;
      presetSelect.innerHTML = '<option value="">Choose a goal</option>' + (goalOptions[key] || []).map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
      other.classList.toggle('b3-hidden', key !== 'other');
      title.value = '';
    });
    presetSelect.addEventListener('change', () => { title.value = presetSelect.value === 'Other' ? other.value.trim() : presetSelect.value; });
    other.addEventListener('input', () => { title.value = other.value.trim(); });
    $('#saveGoal')?.addEventListener('click', event => {
      if (!categorySelect.value || !title.value.trim()) {
        event.preventDefault(); event.stopImmediatePropagation();
        toast('Choose a general area and a goal. Use Other when needed.', 'error');
        return;
      }
      window.setTimeout(() => { categorySelect.value = ''; presetSelect.innerHTML = '<option value="">Choose a goal</option>'; presetSelect.disabled = true; other.value = ''; other.classList.add('b3-hidden'); }, 800);
    }, true);
  }

  function openGoalPlanner() {
    navigate('planner');
    window.setTimeout(() => {
      patchPlannerGoalForm();
      $('#meetingForm')?.classList.add('hidden'); $('#actionForm')?.classList.add('hidden'); $('#goalForm')?.classList.remove('hidden');
      $('#b3GoalCategory')?.focus();
    }, 80);
  }

  function setupGoals() {
    patchPlannerGoalForm();
    $('#progressNewGoal')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); openGoalPlanner(); }, true);
  }

  /* ------------------------------------------------------------------
     Tool usage, milestones, Then & Now, story, and Recovery Review
  ------------------------------------------------------------------ */
  async function recordToolUse() {
    const label = $('#groupAToolDetailTitle')?.textContent.trim() || 'Recovery Tool';
    const key = slug(label);
    const result = await upsertOwn('lellee_tool_usage', { tool_key: key, tool_label: label, used_on: localKey() }, 'user_id,tool_key,used_on');
    if (result.error) {
      const rows = readLocal('tool-usage', []);
      if (!rows.some(item => item.tool_key === key && item.used_on === localKey())) rows.push({ tool_key: key, tool_label: label, used_on: localKey() });
      writeLocal('tool-usage', rows);
    }
    const button = $('#groupACompleteTool');
    if (button) { button.textContent = '✓ Tool Saved'; button.disabled = true; window.setTimeout(() => { button.textContent = 'I Used This Tool'; button.disabled = false; }, 1800); }
    await updateProgressMetrics();
    toast('Tool use saved once');
  }

  async function updateProgressMetrics() {
    const tools = await selectOwn('lellee_tool_usage', 'id');
    const reflections = await selectOwn('lellee_progress_reflections', 'id');
    const toolCount = tools.error ? readLocal('tool-usage', []).length : (tools.data || []).length;
    const reviewCount = reflections.error ? readLocal('progress-reflections', []).length : (reflections.data || []).length;
    if ($('#progressToolsUsed')) $('#progressToolsUsed').textContent = String(toolCount);
    if ($('#progressReviews')) $('#progressReviews').textContent = String(reviewCount);
  }

  function recoveryDay() {
    return typeof daysInRecovery === 'function' ? daysInRecovery() : Math.max(1, Number($('[data-recovery-day]')?.textContent) || 1);
  }
  const milestoneDays = [7, 14, 30, 60, 90, 120, 180, 365, 730];
  function nextMilestone(day) { return milestoneDays.find(value => value >= day) || (Math.ceil(day / 365) * 365); }

  async function renderMilestones() {
    const day = recoveryDay();
    const next = nextMilestone(day);
    const remaining = Math.max(0, next - day);
    if ($('#milestoneCurrentDay')) $('#milestoneCurrentDay').textContent = `DAY ${next}`;
    if ($('#milestoneNextTitle')) $('#milestoneNextTitle').textContent = remaining ? `Your Day ${next} milestone` : `Your Day ${next} milestone is here`;
    if ($('#milestoneNextText')) $('#milestoneNextText').textContent = remaining ? `${remaining} day${remaining === 1 ? '' : 's'} until the next review point.` : 'Take a moment to notice what has changed and what still needs care.';
    const timeline = $('#milestoneTimeline');
    if (timeline) timeline.innerHTML = milestoneDays.slice(0, 8).map(value => `<article class="approved-milestone-node ${value < day ? 'reached' : value === next ? 'next' : 'future'}"><div class="approved-milestone-dot">${value}</div><div><small>${value < day ? 'REACHED' : value === next ? 'NEXT' : 'LATER'}</small><h3>Day ${value}</h3><p>${value < day ? 'Available to review' : value === next ? `${remaining} days away` : 'Opens later'}</p></div></article>`).join('');
    const period = `day_${next}`;
    const result = await selectOwn('lellee_progress_reflections', '*', query => query.eq('reflection_type', 'milestone').eq('period_key', period).limit(1));
    const saved = result.data?.[0];
    $$('#milestoneObservations .day2-choice').forEach(button => button.classList.toggle('selected', saved?.selections?.includes(button.textContent.trim())));
    if ($('#milestoneReflection')) $('#milestoneReflection').value = saved?.notes || '';
    if ($('#milestoneStoryOptIn')) $('#milestoneStoryOptIn').checked = !!saved?.story_opt_in;
  }

  async function saveMilestone() {
    const next = nextMilestone(recoveryDay());
    const selections = $$('#milestoneObservations .day2-choice.selected').map(button => button.textContent.trim());
    const row = { reflection_type: 'milestone', period_key: `day_${next}`, selections, notes: $('#milestoneReflection')?.value.trim() || null, story_opt_in: !!$('#milestoneStoryOptIn')?.checked };
    const result = await upsertOwn('lellee_progress_reflections', row, 'user_id,reflection_type,period_key');
    if (result.error) {
      const local = readLocal('progress-reflections', []).filter(item => !(item.reflection_type === row.reflection_type && item.period_key === row.period_key)); local.push(row); writeLocal('progress-reflections', local);
    }
    await updateProgressMetrics(); toast('Milestone review saved');
  }

  function responseText(row) {
    const choices = Array.isArray(row?.selected_choices) ? row.selected_choices : [];
    return choices.length ? choices.join(' • ') : (row?.optional_reflection || 'No written response');
  }

  async function buildThenNow() {
    const key = $('#tnKeyV2')?.value || 'current_feeling';
    let rows = [];
    const client = db();
    if (client && uid()) {
      const result = await client.from('guided_responses').select('response_date,prompt_key,selected_choices,optional_reflection,created_at').eq('user_id', uid()).eq('prompt_key', key).order('response_date', { ascending: true }).limit(200);
      if (!result.error) rows = result.data || [];
    }
    if (key === 'life_areas_needing_care' && rows.length < 2) {
      const monthly = await selectOwn('lellee_progress_reflections', '*', query => query.eq('reflection_type', 'monthly_review').order('created_at', { ascending: true }));
      rows = (monthly.data || []).map(item => ({ response_date: item.created_at, selected_choices: item.selections, optional_reflection: item.notes }));
    }
    state.thenNowRows = rows;
    const host = $('#thenNowResultV2');
    if (!host) return;
    if (rows.length < 2) {
      host.innerHTML = '<div class="b3-empty"><b>Two saved responses are needed for a comparison.</b><br>Continue using Guided Recovery or Monthly Review and return here later.</div>';
      toast('More saved history is needed for this comparison');
      return;
    }
    const first = rows[0], latest = rows[rows.length - 1];
    host.innerHTML = `<article class="b3-comparison-card"><span class="approved-kicker">THEN</span><h3>First saved response</h3><div class="b3-comparison-date">${escapeHtml(formatDate(first.response_date || first.created_at))}</div><blockquote>${escapeHtml(responseText(first))}</blockquote></article><div class="b3-comparison-arrow">→</div><article class="b3-comparison-card"><span class="approved-kicker">NOW</span><h3>Most recent response</h3><div class="b3-comparison-date">${escapeHtml(formatDate(latest.response_date || latest.created_at))}</div><blockquote>${escapeHtml(responseText(latest))}</blockquote></article>`;
  }

  async function saveThenNow() {
    const key = $('#tnKeyV2')?.value || 'current_feeling';
    const selections = $$('#thenNowObservationChoices button.selected').map(button => button.textContent.trim());
    const row = { reflection_type: 'then_now', period_key: `${key}:${monthKey()}`, selections, notes: $('#thenNowReflection')?.value.trim() || null, story_opt_in: !!$('#thenNowStoryOptIn')?.checked };
    const result = await upsertOwn('lellee_progress_reflections', row, 'user_id,reflection_type,period_key');
    if (result.error) { const local = readLocal('progress-reflections', []); local.push(row); writeLocal('progress-reflections', local); }
    await updateProgressMetrics(); toast('Then & Now reflection saved');
  }

  async function storySourceData() {
    const reflections = await selectOwn('lellee_progress_reflections', '*', query => query.order('created_at', { ascending: true }));
    const journal = state.journalEntries.length ? null : await loadJournalWorkspace();
    const approvedJournal = state.journalEntries.filter(entry => state.journalMeta.get(entryRef(entry))?.story_opt_in);
    let guided = [];
    const client = db();
    if (client && uid()) {
      const result = await client.from('guided_responses').select('response_date,prompt_text,selected_choices,optional_reflection').eq('user_id', uid()).eq('allow_recovery_story', true).order('response_date', { ascending: true }).limit(200);
      if (!result.error) guided = result.data || [];
    }
    return { reflections: reflections.data || [], approvedJournal, guided };
  }

  async function buildStoryPreview() {
    const title = $('#storyTitleV2')?.value.trim() || 'My Recovery Story';
    const opening = $('#storyOpeningV2')?.value.trim() || 'A private record of recovery, growth, and what I want to carry forward.';
    const source = await storySourceData();
    const include = { milestones: !!$('#storyMilestonesV2')?.checked, then_now: !!$('#storyThenNowV2')?.checked, goals: !!$('#storyGoalsV2')?.checked, guided: !!$('#storyGuidedV2')?.checked, journal: !!$('#storyJournalV2')?.checked };
    const sections = [];
    if (include.goals && typeof data !== 'undefined' && data.goal) sections.push(`<section class="b3-story-section"><h3>What I am working toward</h3><p>${escapeHtml(data.goal)}</p></section>`);
    if (include.milestones) {
      const rows = source.reflections.filter(item => item.reflection_type === 'milestone' && item.story_opt_in);
      if (rows.length) sections.push(`<section class="b3-story-section"><h3>Milestone reflections</h3><ul>${rows.map(item => `<li><b>${escapeHtml(item.period_key.replace('_', ' '))}</b> — ${escapeHtml([...(item.selections || []), item.notes].filter(Boolean).join(' • '))}</li>`).join('')}</ul></section>`);
    }
    if (include.then_now) {
      const rows = source.reflections.filter(item => item.reflection_type === 'then_now' && item.story_opt_in);
      if (rows.length) sections.push(`<section class="b3-story-section"><h3>What I noticed over time</h3><ul>${rows.map(item => `<li>${escapeHtml([...(item.selections || []), item.notes].filter(Boolean).join(' • '))}</li>`).join('')}</ul></section>`);
    }
    if (include.guided && source.guided.length) sections.push(`<section class="b3-story-section"><h3>Guided reflections I approved</h3><ul>${source.guided.map(item => `<li><b>${escapeHtml(formatDate(item.response_date))}</b> — ${escapeHtml(responseText(item))}</li>`).join('')}</ul></section>`);
    if (include.journal && source.approvedJournal.length) sections.push(`<section class="b3-story-section"><h3>Selected journal material</h3>${source.approvedJournal.map(entry => `<p><b>${escapeHtml(entryTitle(entry))}</b><br>${escapeHtml(entryContent(entry)).replace(/\n/g, '<br>')}</p>`).join('')}</section>`);
    if (!sections.length) sections.push('<section class="b3-story-section"><h3>Your story is beginning</h3><p>Add milestone reflections, approved comparisons, goals, or deliberately selected journal material when you are ready.</p></section>');
    const host = $('#storyPreviewV2');
    host.innerHTML = `<article class="approved-story-paper"><div class="story-cover"><span>PRIVATE RECOVERY RECORD</span><h1>${escapeHtml(title)}</h1><small>${escapeHtml($('#storyEditionV2')?.selectedOptions?.[0]?.textContent || 'Recovery Story')}</small></div><section class="b3-story-section"><h3>Opening</h3><p>${escapeHtml(opening).replace(/\n/g, '<br>')}</p></section>${sections.join('')}<div class="b3-story-actions"><button class="approved-small-action" type="button" id="b3PrintStory">Print / Save as PDF</button></div></article>`;
    state.storySnapshot = { title, opening, include, section_count: sections.length, built_at: new Date().toISOString() };
    toast('Story preview built');
  }

  async function saveStoryDraft() {
    const edition = $('#storyEditionV2')?.value || 'two_year';
    const row = { edition, title: $('#storyTitleV2')?.value.trim() || 'My Recovery Story', opening_message: $('#storyOpeningV2')?.value.trim() || null, include_options: { milestones: !!$('#storyMilestonesV2')?.checked, then_now: !!$('#storyThenNowV2')?.checked, goals: !!$('#storyGoalsV2')?.checked, guided: !!$('#storyGuidedV2')?.checked, journal: !!$('#storyJournalV2')?.checked }, preview_snapshot: state.storySnapshot || {} };
    const result = await upsertOwn('lellee_story_drafts', row, 'user_id,edition');
    if (result.error) writeLocal(`story-draft:${edition}`, row);
    toast('Private story draft saved');
  }

  function frequency(values) {
    const counts = new Map();
    values.filter(Boolean).forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }

  async function buildRecoveryReview() {
    const period = Number($('#recoveryReviewPeriod')?.value || 30);
    const since = new Date(); since.setDate(since.getDate() - period); const sinceKey = `${since.getFullYear()}-${String(since.getMonth()+1).padStart(2,'0')}-${String(since.getDate()).padStart(2,'0')}`;
    let guided = [], journals = [], tools = [], reflections = [];
    const client = db();
    if (client && uid()) {
      const [g, j] = await Promise.all([
        client.from('guided_responses').select('response_date,prompt_key,selected_choices,optional_reflection').eq('user_id', uid()).gte('response_date', sinceKey).order('response_date', { ascending: false }).limit(500),
        client.from('journal_entries').select('id,created_at').eq('user_id', uid()).gte('created_at', since.toISOString()).limit(500)
      ]);
      if (!g.error) guided = g.data || [];
      if (!j.error) journals = j.data || [];
    }
    const t = await selectOwn('lellee_tool_usage', '*', query => query.gte('used_on', sinceKey).order('used_on', { ascending: false })); tools = t.data || [];
    const r = await selectOwn('lellee_progress_reflections', '*', query => query.gte('created_at', since.toISOString()).order('created_at', { ascending: false })); reflections = r.data || [];
    const activeDays = new Set([...guided.map(item => item.response_date), ...tools.map(item => item.used_on), ...journals.map(item => String(item.created_at).slice(0, 10)), ...reflections.map(item => String(item.created_at).slice(0, 10))]);
    const helped = frequency(guided.filter(item => item.prompt_key === 'evening_what_helped').flatMap(item => item.selected_choices || []));
    const care = frequency(reflections.filter(item => ['weekly_review','monthly_review'].includes(item.reflection_type)).flatMap(item => item.selections || []));
    const toolFreq = frequency(tools.map(item => item.tool_label || item.tool_key));
    $('#reviewActiveDays').textContent = String(activeDays.size);
    $('#reviewHeadline').textContent = activeDays.size ? `You returned to Lellee on ${activeDays.size} day${activeDays.size === 1 ? '' : 's'}.` : 'Your recovery history is ready when you are.';
    $('#reviewLead').textContent = `This summary uses only activity you deliberately saved during the last ${period} days.`;
    $('#reviewTopSupport').textContent = helped[0]?.[0] || 'Still learning';
    $('#reviewTopSupportText').textContent = helped[0] ? `This appeared ${helped[0][1]} time${helped[0][1] === 1 ? '' : 's'} in saved guided reflections.` : 'Continue saving guided reflections to notice what helps.';
    $('#reviewTopChallenge').textContent = care[0]?.[0] || 'Still learning';
    $('#reviewTopChallengeText').textContent = care[0] ? 'This appeared most often in your saved reviews.' : 'Weekly and Monthly Reviews can help identify what deserves care.';
    $('#reviewTopTool').textContent = toolFreq[0]?.[0] || 'No tools logged yet';
    $('#reviewTopToolText').textContent = toolFreq[0] ? `Used on ${toolFreq[0][1]} saved day${toolFreq[0][1] === 1 ? '' : 's'}.` : 'Use “I Used This Tool” when a tool was helpful.';
    $('#reviewConsistencyTitle').textContent = activeDays.size >= Math.max(4, Math.round(period * .35)) ? 'A steady rhythm is forming' : activeDays.size ? 'A beginning rhythm' : 'Beginning';
    $('#reviewConsistencyText').textContent = activeDays.size ? 'Consistency is shown as a pattern, not a grade.' : 'There is no minimum activity requirement.';
    $('#reviewConnectionTitle').textContent = 'Your support remains yours to choose';
    $('#reviewConnectionText').textContent = 'This review does not read private support contacts, coaching-message bodies, or journal text.';
    $('#reviewCarryTitle').textContent = helped[0]?.[0] ? `Protect: ${helped[0][0]}` : 'Choose what deserves protection';
    $('#reviewCarryText').textContent = helped[0] ? 'Consider keeping this support active during the next review period.' : 'A future review can suggest a carry-forward theme from your own saved activity.';
    const evidence = [
      ['Guided Recovery', `${guided.length} saved responses`],
      ['Journal', `${journals.length} saved entries counted; text was not read`],
      ['Tools', `${tools.length} distinct saved tool-use days`],
      ['Reviews', `${reflections.length} saved reviews or reflections`]
    ];
    $('#reviewEvidenceCount').textContent = `${guided.length + journals.length + tools.length + reflections.length} saved items`;
    $('#reviewEvidenceList').innerHTML = evidence.map(([label, detail]) => `<div class="b3-evidence-row"><small>${escapeHtml(label)}</small><div><b>${escapeHtml(detail)}</b><span>Included only as permitted by the review’s privacy rules.</span></div></div>`).join('');
    state.recoveryReviewSnapshot = { period, active_days: activeDays.size, top_support: helped[0]?.[0] || null, top_challenge: care[0]?.[0] || null, top_tool: toolFreq[0]?.[0] || null, evidence };
    toast('Recovery Review built');
  }

  async function saveRecoveryReview() {
    if (!state.recoveryReviewSnapshot) await buildRecoveryReview();
    const period = state.recoveryReviewSnapshot?.period || Number($('#recoveryReviewPeriod')?.value || 30);
    const row = { reflection_type: 'recovery_review', period_key: `${period}:${monthKey()}`, selections: [state.recoveryReviewSnapshot?.top_support, state.recoveryReviewSnapshot?.top_challenge, state.recoveryReviewSnapshot?.top_tool].filter(Boolean), notes: JSON.stringify(state.recoveryReviewSnapshot || {}), story_opt_in: !!$('#reviewStoryOptIn')?.checked };
    const result = await upsertOwn('lellee_progress_reflections', row, 'user_id,reflection_type,period_key');
    if (result.error) { const local = readLocal('progress-reflections', []); local.push(row); writeLocal('progress-reflections', local); }
    await updateProgressMetrics(); toast('Recovery Review saved');
  }

  function setupProgressAndStory() {
    $('#groupACompleteTool')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); recordToolUse(); }, true);
    $$('#milestoneObservations .day2-choice').forEach(button => button.addEventListener('click', event => { event.preventDefault(); button.classList.toggle('selected'); }, true));
    $('#saveMilestoneReviewV2')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); saveMilestone(); }, true);
    $$('#thenNowObservationChoices button').forEach(button => button.addEventListener('click', event => { event.preventDefault(); button.classList.toggle('selected'); }, true));
    $('#buildThenNowV2')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); buildThenNow(); }, true);
    $('#saveThenNowReflection')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); saveThenNow(); }, true);
    $('#buildStoryPreviewV2')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); buildStoryPreview(); }, true);
    $('#saveStoryDraftV2')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); saveStoryDraft(); }, true);
    $('#buildRecoveryReview')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); buildRecoveryReview(); }, true);
    $('#saveRecoveryReview')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); saveRecoveryReview(); }, true);
    $('#printRecoveryReview')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); window.print(); }, true);
    $('.plus-review-preview')?.addEventListener('click', () => navigate('recovery-review'));
    document.addEventListener('click', event => { if (event.target.closest('#b3PrintStory')) window.print(); }, true);
  }

  function wireForYouRhythm() {
    const host = $('#forYouRhythm');
    if (!host) return;
    [...host.children].forEach(card => {
      if (card.dataset.b3RhythmReady === 'true') return;
      const text = card.textContent.toLowerCase();
      const page = text.includes('progress') ? 'progress-hub' : text.includes('reminder') ? 'inbox' : text.includes('today') ? 'today' : null;
      if (!page) return;
      card.dataset.b3RhythmReady = 'true';
      card.dataset.b3RhythmPage = page;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.style.cursor = 'pointer';
      const open = () => navigate(page);
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
  }

  /* ------------------------------------------------------------------
     Shared activation, prototype cleanup and hydration
  ------------------------------------------------------------------ */
  function cleanPrototypeCopy() {
    const host = $('#toolBody');
    if (!host) return;
    const paragraph = [...host.querySelectorAll('p')].find(item => item.textContent.includes('This V1 front end demonstrates'));
    if (paragraph) {
      paragraph.className = 'b3-support-closing';
      paragraph.textContent = 'Use one step at a time. You can close this support flow and return whenever you need.';
    }
  }

  function pageActivated(page) {
    if (page === 'journal') loadJournalWorkspace();
    if (page === 'journal-companion') { renderJournalCompanionAccess(); if (!$('#page-journal-companion .b3-companion-lock')) loadJournalWorkspace(); }
    if (page === 'learn' || page === 'learning-detail') fetchLearningProgress();
    if (page === 'recovery-paths-v2') fetchSelectedPaths();
    if (page === 'expert-guided-practices') renderExpertPractices();
    if (page === 'for-you') wireForYouRhythm();
    if (page === 'progress') { updateProgressMetrics(); window.setTimeout(updateProgressMetrics, 600); }
    if (page === 'milestones') { renderMilestones(); window.setTimeout(renderMilestones, 500); }
    if (page === 'story') loadJournalWorkspace();
  }

  function observePages() {
    const content = $('.content');
    if (!content) return;
    new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type !== 'attributes') continue;
        const target = mutation.target;
        if (target.classList.contains('page') && target.classList.contains('active')) pageActivated(target.id.replace(/^page-/, ''));
      }
    }).observe(content, { subtree: true, attributes: true, attributeFilter: ['class'] });
    const toolBody = $('#toolBody');
    if (toolBody) new MutationObserver(cleanPrototypeCopy).observe(toolBody, { subtree: true, childList: true });
  }

  async function hydrate() {
    if (!uid()) return;
    state.hydrated = true;
    await Promise.all([fetchLearningProgress(), fetchSelectedPaths(), updateProgressMetrics()]);
    const active = $('.page.active')?.id.replace(/^page-/, '');
    if (active) pageActivated(active);
  }

  function waitForMember() {
    if (uid()) { hydrate(); return; }
    const overlay = $('#authOverlay');
    if (overlay) new MutationObserver(() => { if (uid() && overlay.classList.contains('hidden')) hydrate(); }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
    let tries = 0;
    const timer = window.setInterval(() => { tries += 1; if (uid()) { clearInterval(timer); hydrate(); } else if (tries > 80) clearInterval(timer); }, 250);
  }

  function initialize() {
    setupJournal();
    setupLearningAndPaths();
    setupSearch();
    setupGoals();
    setupProgressAndStory();
    observePages();
    renderExpertPractices();
    cleanPrototypeCopy();
    wireForYouRhythm();
    const forYouHost = $('#forYouRhythm');
    if (forYouHost) new MutationObserver(wireForYouRhythm).observe(forYouHost, { childList: true, subtree: true });
    document.addEventListener('click', event => {
      const pageLink = event.target.closest('[data-page]');
      if (!pageLink?.dataset.page) return;
      if (pageLink.closest('.b3-companion-banner,.b3-companion-lock,#page-expert-guided-practices,#pathDetailPanel')) {
        event.preventDefault(); event.stopImmediatePropagation(); navigate(pageLink.dataset.page);
      }
    }, true);
    waitForMember();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
