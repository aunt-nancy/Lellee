(() => {
  'use strict';

  const client = typeof sb !== 'undefined' ? sb : null;
  const ACCOUNT_CATEGORY_KEY = 'lellee:last-nav-category:v2';
  const PAGE_KEY = 'lellee:last-page:v2';
  const B5_PAGES = new Set(['professional-hub','training-center','staff-coach-workspace','business-builder','social-agent']);
  const platforms = ['facebook','instagram','threads','linkedin','tiktok','x','youtube'];
  const state = {
    user: null,
    professional: null,
    staffApplication: null,
    staffCoach: null,
    staffPublic: null,
    business: null,
    businessPlan: null,
    catalog: [],
    modules: [],
    enrollments: [],
    installments: [],
    progress: [],
    privileges: [],
    assignments: [],
    sessions: [],
    groups: [],
    qa: [],
    supervision: [],
    socialConnections: [],
    socialContent: [],
    selectedCourse: null,
    trainingFilter: 'all',
    buildReady: true,
    lastError: ''
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const titleCase = value => String(value || '').replaceAll('_',' ').replace(/\b\w/g, char => char.toUpperCase());
  const money = cents => cents == null ? 'Pending' : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents || 0)/100);
  const dateText = value => value ? new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'}).format(new Date(value)) : '—';

  function message(target, text, type = '') {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    el.textContent = text || '';
    if (type) el.dataset.type = type; else delete el.dataset.type;
  }

  function toast(text, type = '') {
    const existing = $('#globalToast');
    if (existing) {
      existing.textContent = text;
      existing.dataset.type = type;
      existing.classList.remove('hidden');
      clearTimeout(toast.timer);
      toast.timer = setTimeout(() => existing.classList.add('hidden'), 3200);
      return;
    }
    const node = document.createElement('div');
    node.className = 'prod-toast';
    node.dataset.type = type;
    node.textContent = text;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  }

  function navigate(page) {
    const target = document.getElementById(`page-${page}`);
    if (!target) return false;
    if (typeof showPage === 'function') showPage(page);
    else {
      $$('.page').forEach(item => item.classList.remove('active'));
      target.classList.add('active');
      window.scrollTo({top:0,behavior:'auto'});
    }
    localStorage.setItem(PAGE_KEY, page);
    localStorage.setItem(ACCOUNT_CATEGORY_KEY, 'account');
    ensureAccountOpen();
    if (page === 'training-center') renderTraining();
    if (page === 'professional-hub') renderProfessionalHub();
    if (page === 'staff-coach-workspace') renderStaffWorkspace();
    if (page === 'business-builder') renderBusinessBuilder();
    if (page === 'social-agent') renderSocialAgent();
    return true;
  }

  function ensureAccountOpen() {
    const account = $('.nav-category[data-category="account"]');
    if (!account) return;
    $$('.nav-category').forEach(group => {
      const open = group === account;
      group.classList.toggle('open', open);
      group.querySelector('.nav-category-toggle')?.setAttribute('aria-expanded', String(open));
    });
  }

  function installPages() {
    const content = $('.content');
    if (!content || $('#page-professional-hub')) return;
    content.insertAdjacentHTML('beforeend', `
      <section class="page" id="page-professional-hub">
        <div class="b5-page">
          <div class="b5-page-head">
            <div><span class="b5-kicker">PROFESSIONAL HUB</span><h2>Two distinct ways to use Lellee professionally.</h2><p>A Lellee Coach is a W-2 employee of Lellee. An independent professional works for themselves and may use separate Lellee business and training tools.</p></div>
            <div class="b5-actions"><button class="b5-secondary" data-b5-page="training-center">Training Center</button></div>
          </div>
          <div class="b5-clarity-note"><b>Titles stay clear:</b> completing independent training does not make someone a “Lellee Coach.” That title is reserved for W-2 Lellee employees who pass learning and role-privilege gates.</div>
          <div class="b5-role-banner" id="b5RoleBanner"></div>
          <div class="b5-metric-grid" id="b5ProfessionalMetrics"></div>
          <div class="b5-section">
            <div class="b5-section-head"><div><span class="b5-kicker">TRAINING & READINESS</span><h3>Your current learning position</h3><p>Payment access and learning progress are separate gates for independent learners. Staff training has no payment gate.</p></div><button class="b5-link" data-b5-page="training-center">Open Training</button></div>
            <div id="b5TrainingSnapshot"></div>
          </div>
        </div>
      </section>

      <section class="page" id="page-training-center">
        <div class="b5-page">
          <div class="b5-page-head">
            <div><span class="b5-kicker">TRAINING CENTER</span><h2>Learn in stages—not by racing through content.</h2><p>Independent bundles use a 40% down-payment gate plus sequential learning gates. W-2 Lellee Coaches receive required training from Lellee and advance through competency and privilege gates.</p></div>
            <div class="b5-actions"><button class="b5-link" data-b5-page="professional-hub">← Professional Hub</button></div>
          </div>
          <div class="b5-training-controls" id="b5TrainingFilters">
            <button class="active" data-b5-training-filter="all">All</button>
            <button data-b5-training-filter="independent">Independent</button>
            <button data-b5-training-filter="staff">W-2 Staff</button>
            <button data-b5-training-filter="specialty">Specialties</button>
            <button data-b5-training-filter="business">Business</button>
          </div>
          <div class="b5-course-grid" id="b5CourseGrid"></div>
          <div id="b5TrainingDetail"></div>
        </div>
      </section>

      <section class="page" id="page-staff-coach-workspace">
        <div class="b5-page">
          <div class="b5-page-head">
            <div><span class="b5-kicker">LELLEE COACH WORKFORCE</span><h2>W-2 training, supervision and authorized privileges.</h2><p>Applying does not create employment. Lellee must hire and activate a staff record before employee training or member assignments become available.</p></div>
            <div class="b5-actions"><button class="b5-link" data-b5-page="professional-hub">← Professional Hub</button></div>
          </div>
          <div id="b5StaffWorkspace"></div>
        </div>
      </section>

      <section class="page" id="page-business-builder">
        <div class="b5-page">
          <div class="b5-page-head">
            <div><span class="b5-kicker">INDEPENDENT BUSINESS BUILDER</span><h2>Build your own business—powered by Lellee tools.</h2><p>You work for yourself, not for Lellee. The Business Builder helps you define an ethical offer, capacity, referrals and one manageable next action.</p></div>
            <div class="b5-actions"><button class="b5-secondary" data-b5-page="social-agent">Social Media Agent</button><button class="b5-link" data-b5-page="professional-hub">← Professional Hub</button></div>
          </div>
          <div id="b5BusinessBuilder"></div>
        </div>
      </section>

      <section class="page" id="page-social-agent">
        <div class="b5-page">
          <div class="b5-page-head">
            <div><span class="b5-kicker">SOCIAL MEDIA AGENT</span><h2>Create once. Adapt responsibly for each platform.</h2><p>Build platform-specific drafts and an approval workflow. Actual account authorization and publishing remain off until OAuth and platform integrations are completed.</p></div>
            <div class="b5-actions"><button class="b5-link" data-b5-page="business-builder">← Business Builder</button></div>
          </div>
          <div id="b5SocialAgent"></div>
        </div>
      </section>`);
  }

  function installNav() {
    const accountInner = $('.nav-category[data-category="account"] .nav-category-items-inner');
    if (!accountInner || $('.b5-professional-nav')) return false;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-item b5-professional-nav';
    button.dataset.page = 'professional-hub';
    button.innerHTML = '<span class="nav-icon">◈</span>Professional Hub';
    button.addEventListener('click', event => {
      event.preventDefault();
      navigate('professional-hub');
    });
    accountInner.insertBefore(button, accountInner.querySelector('[data-page="plus"]') || accountInner.firstChild);
    return true;
  }

  function configureLegacyCoachPages() {
    const businessPage = $('#page-coach-business');
    if (businessPage) {
      const kicker = $('.approved-kicker', businessPage);
      const heading = $('.approved-inner-head h2', businessPage);
      const paragraph = $('.approved-inner-head p', businessPage);
      if (kicker) kicker.textContent = 'INDEPENDENT PROFESSIONAL BUSINESS';
      if (heading) heading.textContent = 'Run your own coaching or support business with Lellee tools.';
      if (paragraph) paragraph.textContent = 'Independent professionals work for themselves. They are not W-2 Lellee Coaches and must use accurate credentials and scope descriptions.';
    }

    const dashboard = $('#page-coach-dashboard');
    if (dashboard) {
      const kicker = $('.approved-kicker', dashboard);
      const heading = $('.approved-inner-head h2', dashboard);
      const paragraph = $('.approved-inner-head p', dashboard);
      if (kicker) kicker.textContent = 'INDEPENDENT BUSINESS DASHBOARD';
      if (heading && heading.id !== 'coachDashboardBusinessName') heading.textContent = 'My Independent Business';
      if (paragraph) paragraph.textContent = 'Manage your own clients, groups, services and communication. This is separate from W-2 Lellee Coach employment.';
      const head = $('.approved-inner-head', dashboard);
      if (head && !$('#b5LegacyBusinessButtons')) {
        const actions = document.createElement('div');
        actions.id = 'b5LegacyBusinessButtons';
        actions.className = 'b5-actions';
        actions.innerHTML = '<button class="b5-secondary" data-b5-page="business-builder">Business Builder</button><button class="b5-secondary" data-b5-page="social-agent">Social Agent</button><button class="b5-secondary" data-b5-page="training-center">Training</button>';
        head.appendChild(actions);
      }
    }

    const oldNav = $('#coachNavItem');
    if (oldNav) oldNav.innerHTML = '<span class="nav-icon">◎</span>Independent Business';

    const coachesPage = $('#page-coaches');
    if (coachesPage) {
      const kicker = $('.approved-kicker', coachesPage);
      const heading = $('.approved-inner-head h2', coachesPage);
      const paragraph = $('.approved-inner-head p', coachesPage);
      if (kicker) kicker.textContent = 'LELLEE COACHES · W-2 EMPLOYEES';
      if (heading) heading.textContent = 'Human coaching from people who work for Lellee.';
      if (paragraph) paragraph.textContent = 'The consumer Lellee Coach add-on connects eligible Premium members with trained W-2 Lellee employees. Independent professionals are a separate business category.';
      if (!$('#b5ConsumerCoachPanel')) {
        const panel = document.createElement('div');
        panel.id = 'b5ConsumerCoachPanel';
        panel.className = 'b5-consumer-coach-panel';
        panel.innerHTML = '<span class="b5-kicker">LELLEE COACH ADD-ON</span><h3>Accountability and structured human support</h3><p>Lellee Coaches are W-2 employees trained and supervised by Lellee. The add-on is $49.99/month in addition to Lellee Premium at $14.99/month. Additional 15-minute sessions are $19.99. Billing remains off until the launch gate is approved.</p><div class="b5-actions"><button class="b5-primary" data-page="plus">View Membership</button><button class="b5-secondary" data-b5-page="professional-hub">Professional information</button></div>';
        $('.approved-inner', coachesPage)?.appendChild(panel);
      }
    }
  }

  async function queryMany(table, configure) {
    if (!client) return [];
    try {
      let query = client.from(table).select('*');
      if (configure) query = configure(query);
      const result = await query;
      if (result.error) throw result.error;
      return result.data || [];
    } catch (error) {
      if (/does not exist|schema cache|relation/i.test(error.message || '')) state.buildReady = false;
      state.lastError = error.message || String(error);
      console.warn(`[Build 5] ${table}:`, error.message || error);
      return [];
    }
  }

  async function queryOne(table, configure) {
    const rows = await queryMany(table, query => {
      const q = configure ? configure(query) : query;
      return q.limit(1);
    });
    return rows[0] || null;
  }

  async function refreshState() {
    if (!client) {
      state.buildReady = false;
      state.lastError = 'Supabase client unavailable';
      renderAll();
      return;
    }
    const {data:{session}} = await client.auth.getSession();
    state.user = session?.user || null;
    if (!state.user) {
      renderAll();
      return;
    }
    const uid = state.user.id;
    const [professional,application,staffCoach,staffPublic,business,businessPlan,catalog,modules,enrollments,privileges,assignments,sessions,groups,qa,supervision,socialConnections,socialContent] = await Promise.all([
      queryOne('lellee_professional_profiles', q => q.eq('user_id',uid)),
      queryOne('lellee_staff_coach_applications', q => q.eq('user_id',uid)),
      queryOne('lellee_staff_coaches', q => q.eq('user_id',uid)),
      queryOne('lellee_staff_coach_public_profiles', q => q.eq('user_id',uid)),
      queryOne('lellee_independent_businesses', q => q.eq('user_id',uid)),
      queryOne('lellee_business_builder_plans', q => q.eq('user_id',uid)),
      queryMany('lellee_training_catalog', q => q.eq('active',true).order('sequence')),
      queryMany('lellee_training_modules', q => q.eq('active',true).order('course_key').order('sequence')),
      queryMany('lellee_training_enrollments', q => q.eq('user_id',uid).order('created_at',{ascending:false})),
      queryMany('lellee_coach_privileges', q => q.eq('coach_user_id',uid).order('privilege_key')),
      queryMany('lellee_member_coach_assignments', q => q.eq('coach_user_id',uid).order('created_at',{ascending:false})),
      queryMany('lellee_coach_sessions', q => q.eq('coach_user_id',uid).order('scheduled_at',{ascending:true})),
      queryMany('lellee_staff_coach_groups', q => q.eq('coach_user_id',uid).order('created_at',{ascending:false})),
      queryMany('lellee_coach_qa_metrics', q => q.eq('coach_user_id',uid).order('period_end',{ascending:false})),
      queryMany('lellee_coach_supervision_records', q => q.eq('coach_user_id',uid).order('supervision_date',{ascending:false})),
      queryMany('lellee_social_connections', q => q.eq('user_id',uid).order('platform')),
      queryMany('lellee_social_content', q => q.eq('user_id',uid).order('created_at',{ascending:false}).limit(50))
    ]);
    state.professional = professional;
    state.staffApplication = application;
    state.staffCoach = staffCoach;
    state.staffPublic = staffPublic;
    state.business = business;
    state.businessPlan = businessPlan;
    state.catalog = catalog;
    state.modules = modules;
    state.enrollments = enrollments;
    state.privileges = privileges;
    state.assignments = assignments;
    state.sessions = sessions;
    state.groups = groups;
    state.qa = qa;
    state.supervision = supervision;
    state.socialConnections = socialConnections;
    state.socialContent = socialContent;

    const enrollmentIds = enrollments.map(item => item.id);
    state.installments = enrollmentIds.length ? await queryMany('lellee_training_installments', q => q.in('enrollment_id',enrollmentIds).order('installment_number')) : [];
    state.progress = enrollmentIds.length ? await queryMany('lellee_training_progress', q => q.in('enrollment_id',enrollmentIds)) : [];
    renderAll();
  }

  function renderAll() {
    renderProfessionalHub();
    renderTraining();
    renderStaffWorkspace();
    renderBusinessBuilder();
    renderSocialAgent();
  }

  function signedOutCard() {
    return '<div class="b5-empty">Sign in to view professional training, W-2 Lellee Coach information, or independent business tools.</div>';
  }

  function buildMissingCard() {
    return `<div class="b5-empty"><b>Build 5 database setup is not available yet.</b><br>Run <code>BUILD_5_COACH_BUSINESS_TRAINING.sql</code> in Supabase, then refresh. ${state.lastError ? `<br><small>${escapeHtml(state.lastError)}</small>` : ''}</div>`;
  }

  function renderProfessionalHub() {
    const roles = $('#b5RoleBanner');
    if (!roles) return;
    if (!state.user) {
      roles.innerHTML = signedOutCard();
      $('#b5ProfessionalMetrics').innerHTML = '';
      $('#b5TrainingSnapshot').innerHTML = '';
      return;
    }
    if (!state.buildReady && !state.catalog.length) {
      roles.innerHTML = buildMissingCard();
      return;
    }

    const staffStatus = state.staffCoach ? `${titleCase(state.staffCoach.employment_status)} · ${titleCase(state.staffCoach.training_stage)}` : state.staffApplication ? titleCase(state.staffApplication.status) : 'Not started';
    const businessStatus = state.business ? `${titleCase(state.business.business_stage)} · ${titleCase(state.business.profile_status)}` : 'Not started';
    roles.innerHTML = `
      <article class="b5-role-card staff">
        <div class="b5-role-icon">W-2</div><span class="b5-status ${state.staffCoach?.employment_status === 'active' ? 'active' : 'pending'}">${escapeHtml(staffStatus)}</span>
        <h3>Lellee Coach Workforce</h3><p>Lellee Coaches work for Lellee as W-2 employees. Required training is provided by Lellee, and coaching privileges open only after competency and supervisor authorization.</p>
        <ul><li>Paid required employee training</li><li>Supervision and QA support</li><li>Limited-to-full privilege progression</li></ul>
        <div class="b5-actions"><button class="b5-primary" data-b5-page="staff-coach-workspace">${state.staffCoach ? 'Open Coach Workspace' : state.staffApplication ? 'View Application' : 'Explore W-2 Role'}</button></div>
      </article>
      <article class="b5-role-card independent">
        <div class="b5-role-icon">YOU</div><span class="b5-status ${state.business ? 'active' : 'draft'}">${escapeHtml(businessStatus)}</span>
        <h3>Independent Professional Business</h3><p>You work for yourself and may use Lellee training, Business Builder and Social Media Agent tools. You are not presented to consumers as a Lellee Coach.</p>
        <ul><li>Your own business identity</li><li>Payment gate + learning gate</li><li>Referral code and marketing workflow</li></ul>
        <div class="b5-actions"><button class="b5-primary" data-b5-page="business-builder">${state.business ? 'Open Business Builder' : 'Start My Business Profile'}</button></div>
      </article>`;

    const passed = state.progress.filter(item => item.status === 'passed').length;
    const activeEnrollments = state.enrollments.filter(item => ['active','pending_payment'].includes(item.status)).length;
    const activePrivileges = state.privileges.filter(item => item.status === 'active').length;
    $('#b5ProfessionalMetrics').innerHTML = `
      <div class="b5-metric"><b>${activeEnrollments}</b><small>training enrollments</small></div>
      <div class="b5-metric"><b>${passed}</b><small>modules passed</small></div>
      <div class="b5-metric"><b>${activePrivileges}</b><small>active staff privileges</small></div>
      <div class="b5-metric"><b>${state.business ? '1' : '0'}</b><small>independent business profile</small></div>`;

    const recent = state.enrollments.slice(0,4);
    $('#b5TrainingSnapshot').innerHTML = recent.length ? `<div class="b5-work-list">${recent.map(enrollment => {
      const course = state.catalog.find(item => item.course_key === enrollment.course_key);
      const modules = state.progress.filter(item => item.enrollment_id === enrollment.id);
      const done = modules.filter(item => item.status === 'passed').length;
      return `<div class="b5-work-row"><span>▧</span><div><h3>${escapeHtml(course?.display_name || enrollment.course_key)}</h3><p>${done} of ${modules.length || state.modules.filter(item => item.course_key === enrollment.course_key).length} modules passed · ${Number(enrollment.current_unlock_percent || 0)}% financially available</p></div><div class="b5-actions"><span class="b5-status ${enrollment.status}">${escapeHtml(titleCase(enrollment.status))}</span><button class="b5-link" data-b5-course="${escapeHtml(enrollment.course_key)}">Open</button></div></div>`;
    }).join('')}</div>` : '<div class="b5-empty">No training has been started. Explore Coaching is free and can help you decide what fits.</div>';
  }

  function courseVisible(course) {
    if (state.trainingFilter === 'specialty') return course.category === 'specialty';
    if (state.trainingFilter === 'business') return course.category === 'business';
    if (state.trainingFilter === 'staff') return ['staff','both'].includes(course.audience);
    if (state.trainingFilter === 'independent') return ['independent','both'].includes(course.audience);
    return true;
  }

  function enrollmentFor(courseKey) { return state.enrollments.find(item => item.course_key === courseKey); }
  function modulesFor(courseKey) { return state.modules.filter(item => item.course_key === courseKey).sort((a,b) => a.sequence-b.sequence); }
  function progressFor(enrollmentId,moduleId) { return state.progress.find(item => item.enrollment_id === enrollmentId && item.module_id === moduleId); }

  function renderTraining() {
    const grid = $('#b5CourseGrid');
    if (!grid) return;
    if (!state.user) { grid.innerHTML = signedOutCard(); $('#b5TrainingDetail').innerHTML=''; return; }
    if (!state.buildReady && !state.catalog.length) { grid.innerHTML = buildMissingCard(); return; }

    $$('#b5TrainingFilters button').forEach(button => button.classList.toggle('active', button.dataset.b5TrainingFilter === state.trainingFilter));
    const courses = state.catalog.filter(courseVisible);
    grid.innerHTML = courses.map(course => {
      const enrollment = enrollmentFor(course.course_key);
      const staffSponsored = state.staffCoach && ['staff','both'].includes(course.audience);
      const price = staffSponsored ? 'Lellee-sponsored' : course.price_cents === 0 ? 'Free' : money(course.price_cents);
      const audience = course.audience === 'staff' ? 'W-2 staff' : course.audience === 'both' ? 'Staff / independent' : 'Independent';
      return `<article class="b5-course-card ${course.is_bundle ? 'featured' : ''}">
        <div class="b5-course-top"><span class="b5-status ${course.category}">${escapeHtml(titleCase(course.category))}</span>${enrollment ? `<span class="b5-status ${enrollment.status}">${escapeHtml(titleCase(enrollment.status))}</span>` : ''}</div>
        <h3>${escapeHtml(course.display_name)}</h3><div class="b5-price">${escapeHtml(price)}${course.price_cents > 0 && !staffSponsored ? '<small> one-time</small>' : ''}</div>
        <p>${escapeHtml(course.description || '')}</p>
        <dl class="b5-course-meta"><dt>For</dt><dd>${escapeHtml(audience)}</dd><dt>Estimated</dt><dd>${course.estimated_hours || '—'} hours</dd><dt>Access</dt><dd>${course.is_bundle ? '40% down + 3–4 months' : course.price_cents > 0 && !staffSponsored ? 'Paid in full' : 'No payment gate'}</dd></dl>
        <div class="b5-actions"><button class="b5-primary" data-b5-course="${escapeHtml(course.course_key)}">${enrollment ? 'Open Training' : 'View Course'}</button></div>
      </article>`;
    }).join('') || '<div class="b5-empty">No courses match this filter.</div>';

    if (state.selectedCourse) renderCourseDetail(state.selectedCourse);
    else $('#b5TrainingDetail').innerHTML = '';
  }

  function renderCourseDetail(courseKey) {
    state.selectedCourse = courseKey;
    const target = $('#b5TrainingDetail');
    const course = state.catalog.find(item => item.course_key === courseKey);
    if (!target || !course) return;
    const enrollment = enrollmentFor(courseKey);
    const staffSponsored = state.staffCoach && ['staff','both'].includes(course.audience);
    if (!enrollment) {
      const allowed = course.audience !== 'staff' || !!state.staffCoach;
      target.innerHTML = `<div class="b5-enrollment-panel">
        <div class="b5-section-head"><div><span class="b5-kicker">ENROLLMENT</span><h3>${escapeHtml(course.display_name)}</h3><p>${course.is_bundle ? 'A 40% down payment unlocks only the first 40% of topics. Later content requires later payments and completed learning gates.' : staffSponsored || course.price_cents === 0 ? 'No financial gate applies. Learning still opens sequentially.' : 'This individual course is paid in full before the learning sequence opens.'}</p></div><span class="b5-price">${staffSponsored ? 'Lellee-sponsored' : course.price_cents === 0 ? 'Free' : money(course.price_cents)}</span></div>
        ${course.is_bundle ? '<label style="display:grid;gap:5px;max-width:260px;font-size:.72rem;font-weight:800">Payment period<select id="b5PlanMonths" style="padding:9px;border:1px solid #ddd6e0;border-radius:8px"><option value="3">40% down + 3 months</option><option value="4">40% down + 4 months</option></select></label>' : ''}
        <div class="b5-actions" style="margin-top:12px"><button class="b5-primary" id="b5RequestEnrollment" ${allowed ? '' : 'disabled'}>${course.price_cents === 0 || staffSponsored ? 'Start Training' : 'Create Access Plan'}</button><button class="b5-link" id="b5CloseCourse">Close</button></div>
        <div class="b5-message" id="b5EnrollmentMsg">${!allowed ? 'This course requires an activated W-2 Lellee Coach employee profile.' : course.price_cents > 0 && !staffSponsored ? 'Training billing is not activated in Build 5. This creates the 40%/installment structure without collecting money.' : ''}</div>
      </div>`;
      $('#b5RequestEnrollment')?.addEventListener('click', () => requestEnrollment(course));
      $('#b5CloseCourse')?.addEventListener('click', () => { state.selectedCourse=null; target.innerHTML=''; });
      return;
    }

    const installments = state.installments.filter(item => item.enrollment_id === enrollment.id).sort((a,b)=>a.installment_number-b.installment_number);
    const modules = modulesFor(courseKey);
    const done = state.progress.filter(item => item.enrollment_id === enrollment.id && item.status === 'passed').length;
    target.innerHTML = `<div class="b5-enrollment-panel">
      <div class="b5-section-head"><div><span class="b5-kicker">YOUR ENROLLMENT</span><h3>${escapeHtml(course.display_name)}</h3><p>${done} of ${modules.length} required modules passed. Payment access and learning completion are tracked separately.</p></div><div class="b5-actions"><span class="b5-status ${enrollment.status}">${escapeHtml(titleCase(enrollment.status))}</span><button class="b5-link" id="b5CloseCourse">Close</button></div></div>
      <div class="b5-metric-grid">
        <div class="b5-metric"><b>${Number(enrollment.current_unlock_percent || 0)}%</b><small>curriculum financially available</small></div>
        <div class="b5-metric"><b>${done}</b><small>modules passed</small></div>
        <div class="b5-metric"><b>${money(enrollment.paid_cents)}</b><small>recorded paid</small></div>
        <div class="b5-metric"><b>${enrollment.learner_type === 'staff' ? 'W-2' : titleCase(enrollment.payment_status)}</b><small>${enrollment.learner_type === 'staff' ? 'employee training' : 'payment status'}</small></div>
      </div>
      ${installments.length ? `<div class="b5-payment-grid">${installments.map(item => `<div class="b5-installment"><span class="b5-status ${item.status}">${escapeHtml(titleCase(item.status))}</span><b>${item.installment_number === 0 ? '40% down payment' : `Installment ${item.installment_number}`}</b><small>${money(item.amount_cents)} · unlocks through ${Number(item.unlock_percent_after)}%</small><small>Due ${escapeHtml(dateText(item.due_at))}</small></div>`).join('')}</div>` : ''}
      <div class="b5-module-list">${modules.map(module => {
        const progress = progressFor(enrollment.id,module.id) || {status:'locked'};
        return `<div class="b5-module-row ${progress.status}"><span class="b5-module-number">${module.sequence}</span><div><h3>${escapeHtml(module.title)}</h3><p>${escapeHtml(module.summary || '')} · ${Number(module.curriculum_percent)}% of curriculum</p></div><div class="b5-actions"><span class="b5-status ${progress.status}">${escapeHtml(titleCase(progress.status))}</span><button class="b5-link" data-b5-module="${module.id}" ${progress.status === 'locked' ? 'disabled' : ''}>Open</button></div></div>`;
      }).join('')}</div>
      <div id="b5ModuleDetail"></div>
    </div>`;
    $('#b5CloseCourse')?.addEventListener('click', () => { state.selectedCourse=null; target.innerHTML=''; });
  }

  async function requestEnrollment(course) {
    const button = $('#b5RequestEnrollment');
    const plan = Number($('#b5PlanMonths')?.value || 0);
    if (!client || !state.user) return;
    button.disabled = true;
    message('#b5EnrollmentMsg','Creating your access and learning plan…');
    const {data,error} = await client.rpc('lellee_request_training_enrollment',{p_course_key:course.course_key,p_plan_months:plan});
    button.disabled = false;
    if (error) { message('#b5EnrollmentMsg',error.message,'error'); return; }
    message('#b5EnrollmentMsg',data?.billing_active === false && course.price_cents > 0 ? 'Access plan created. Billing remains off until the launch integration is completed.' : 'Training started.','success');
    await refreshState();
    state.selectedCourse = course.course_key;
    renderTraining();
  }

  async function openModule(moduleId) {
    const module = state.modules.find(item => item.id === moduleId);
    const enrollment = state.enrollments.find(item => item.course_key === module?.course_key);
    const target = $('#b5ModuleDetail');
    if (!module || !enrollment || !target) return;
    let progress = progressFor(enrollment.id,module.id);
    if (progress?.status === 'available') {
      const {error} = await client.rpc('lellee_start_training_module',{p_module_id:module.id});
      if (error) { toast(error.message,'error'); return; }
      await refreshState();
      state.selectedCourse = module.course_key;
      renderTraining();
      progress = progressFor(enrollment.id,module.id);
    }
    const content = module.learning_content || {};
    const assessment = module.assessment || {};
    target.innerHTML = `<div class="b5-module-detail">
      <span class="b5-kicker">MODULE ${module.sequence}</span><h3>${escapeHtml(module.title)}</h3><p>${escapeHtml(module.summary || '')}</p>
      ${Array.isArray(content.objectives) ? `<h4>Learning objectives</h4><ul>${content.objectives.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
      ${content.practice ? `<h4>Practice</h4><p>${escapeHtml(content.practice)}</p>` : ''}
      <div class="b5-assessment"><h4>${escapeHtml(assessment.question || 'Knowledge check')}</h4>
      ${(assessment.choices || []).map((choice,index) => `<label><input type="radio" name="b5Assessment" value="${index}"><span>${escapeHtml(choice)}</span></label>`).join('')}
      <textarea id="b5ModuleReflection" placeholder="What will you carry into practice? (optional)"></textarea>
      <div class="b5-actions" style="margin-top:10px"><button class="b5-primary" id="b5CompleteModule" ${progress?.status === 'passed' ? 'disabled' : ''}>${progress?.status === 'passed' ? 'Passed' : 'Submit Knowledge Check'}</button><button class="b5-link" id="b5CloseModule">Close</button></div><div class="b5-message" id="b5ModuleMsg"></div></div>
    </div>`;
    $('#b5CompleteModule')?.addEventListener('click', () => completeModule(module));
    $('#b5CloseModule')?.addEventListener('click', () => { target.innerHTML=''; });
  }

  async function completeModule(module) {
    const selected = $('input[name="b5Assessment"]:checked');
    if (!selected) { message('#b5ModuleMsg','Choose an answer before submitting.','error'); return; }
    const assessment = module.assessment || {};
    const score = Number(selected.value) === Number(assessment.correctIndex) ? 100 : 0;
    const reflection = $('#b5ModuleReflection')?.value || '';
    const button = $('#b5CompleteModule');
    button.disabled = true;
    const {data,error} = await client.rpc('lellee_complete_training_module',{p_module_id:module.id,p_score:score,p_reflection:reflection});
    button.disabled = false;
    if (error) { message('#b5ModuleMsg',error.message,'error'); return; }
    message('#b5ModuleMsg',data?.passed ? 'Module passed. The next module opens only when its payment and learning gates are satisfied.' : `Not yet passed. Review the material and try again. Required score: ${data?.required_score || 80}%.`,data?.passed?'success':'error');
    await refreshState();
    state.selectedCourse = module.course_key;
    renderTraining();
  }

  function renderStaffWorkspace() {
    const target = $('#b5StaffWorkspace');
    if (!target) return;
    if (!state.user) { target.innerHTML = signedOutCard(); return; }
    if (!state.buildReady && !state.catalog.length) { target.innerHTML = buildMissingCard(); return; }

    if (!state.staffCoach) {
      if (state.staffApplication) {
        target.innerHTML = `<div class="b5-w2-banner"><div><span class="b5-kicker">APPLICATION STATUS</span><h3>${escapeHtml(titleCase(state.staffApplication.status))}</h3><p>Your interest was recorded on ${escapeHtml(dateText(state.staffApplication.submitted_at || state.staffApplication.updated_at))}. This does not create employment or coaching privileges. Lellee must complete review, hiring and staff activation.</p></div><span class="b5-status ${state.staffApplication.status}">${escapeHtml(titleCase(state.staffApplication.status))}</span></div>
        <div class="b5-section"><h3>What happens next</h3><div class="b5-work-list"><div class="b5-work-row"><span>1</span><div><h3>Application review</h3><p>Lellee reviews experience, availability, role fit and pathway needs.</p></div></div><div class="b5-work-row"><span>2</span><div><h3>Employment process</h3><p>Interview, eligibility, hiring documents and W-2 activation occur outside this self-service page.</p></div></div><div class="b5-work-row"><span>3</span><div><h3>Paid employee training</h3><p>Learning gates begin after Lellee activates the staff record.</p></div></div></div></div>`;
        return;
      }
      target.innerHTML = `<div class="b5-w2-banner"><div><span class="b5-kicker">W-2 LELLEE COACH</span><h3>Explore employment—not an independent marketplace listing.</h3><p>A Lellee Coach works for Lellee, completes paid required employee training, receives supervision, and gains privileges progressively.</p></div><span class="b5-status pending">Not applied</span></div>
      <div class="b5-section"><div class="b5-section-head"><div><h3>Express interest in a W-2 role</h3><p>This form records interest only. It does not promise employment.</p></div></div>
        <div class="b5-form-grid">
          <label class="b5-wide">Relevant experience<textarea id="b5StaffExperience" maxlength="1800" placeholder="Describe relevant work, lived experience, training, community service or support experience."></textarea></label>
          <label>Availability<select id="b5StaffAvailability"><option value="Part-time weekdays">Part-time weekdays</option><option value="Part-time evenings/weekends">Part-time evenings/weekends</option><option value="Full-time">Full-time</option><option value="Flexible">Flexible</option></select></label>
          <label>Preferred language<select id="b5StaffLanguage"><option value="en">English</option><option value="es">Spanish</option><option value="en,es">English and Spanish</option></select></label>
          <label>Primary pathway<select id="b5StaffPathway"><option value="recovery">Recovery</option><option value="reentry">Reentry</option><option value="housing">Housing Stability</option><option value="caregiving">Caregiving</option><option value="workforce">Workforce</option><option value="grief">Grief</option><option value="family">Family Support</option><option value="independent_living">Independent Living</option></select></label>
          <label class="b5-wide b5-check"><input id="b5StaffW2Ack" type="checkbox"><span>I understand that “Lellee Coach” is a W-2 employee role. Completing a course or submitting this form does not make me a Lellee Coach.</span></label>
        </div><div class="b5-actions"><button class="b5-primary" id="b5SubmitStaffInterest">Submit Interest</button></div><div class="b5-message" id="b5StaffMsg"></div>
      </div>`;
      $('#b5SubmitStaffInterest')?.addEventListener('click', submitStaffInterest);
      return;
    }

    const latestQa = state.qa[0];
    const activeAssignments = state.assignments.filter(item => item.status === 'active');
    const upcomingSessions = state.sessions.filter(item => item.status === 'scheduled' && new Date(item.scheduled_at) >= new Date()).slice(0,8);
    const qaRecommendation = !latestQa ? 'Continue required training and supervised practice. QA trends will appear after enough coaching activity exists.' : Number(latestQa.documentation_on_time_percent || 100) < 90 ? 'Prioritize timely documentation and review workflow expectations with your supervisor.' : latestQa.qa_flags > 0 ? 'Review flagged items with your supervisor before expanding caseload or privileges.' : 'Current recorded indicators are stable. Continue supervision and quality routines.';
    target.innerHTML = `<div class="b5-w2-banner"><div><span class="b5-kicker">EMPLOYMENT</span><h3>${escapeHtml(state.staffPublic?.display_name || state.professional?.public_name || 'Lellee Coach')}</h3><p>W-2 employee · ${escapeHtml(titleCase(state.staffCoach.employment_status))} · Training stage: ${escapeHtml(titleCase(state.staffCoach.training_stage))}</p></div><span class="b5-status ${state.staffCoach.employment_status}">W-2 ${escapeHtml(titleCase(state.staffCoach.employment_status))}</span></div>
      <div class="b5-metric-grid"><div class="b5-metric"><b>${activeAssignments.length}</b><small>active member assignments</small></div><div class="b5-metric"><b>${state.groups.filter(item=>item.status==='active').length}</b><small>active groups</small></div><div class="b5-metric"><b>${state.privileges.filter(item=>item.status==='active').length}</b><small>active privileges</small></div><div class="b5-metric"><b>${upcomingSessions.length}</b><small>upcoming sessions</small></div></div>
      <div class="b5-role-banner">
        <div class="b5-section" style="margin-top:0"><div class="b5-section-head"><div><span class="b5-kicker">PRIVILEGES</span><h3>Authorized work</h3><p>Course completion creates eligibility. A supervisor activates the privilege.</p></div><button class="b5-link" data-b5-page="training-center">Training</button></div><div class="b5-work-list">${state.privileges.length ? state.privileges.map(item => `<div class="b5-work-row"><span>✓</span><div><h3>${escapeHtml(titleCase(item.privilege_key))}</h3><p>${item.status === 'eligible' ? 'Learning gate passed; supervisor authorization still required.' : item.status === 'active' ? 'Authorized for current role.' : 'Not currently authorized.'}</p></div><span class="b5-status ${item.status}">${escapeHtml(titleCase(item.status))}</span></div>`).join('') : '<div class="b5-empty">No privileges recorded yet. Begin with orientation.</div>'}</div></div>
        <div class="b5-qa-card"><span class="b5-kicker">QA & PRODUCTIVITY AGENT</span><h3>Support quality without reducing people to a score.</h3><p>The agent summarizes caseload, documentation, attendance, feedback and supervisor review. It should prompt support and supervision—not automatic punishment.</p><div class="b5-qa-recommendation"><b>Current next action:</b> ${escapeHtml(qaRecommendation)}</div></div>
      </div>
      <div class="b5-section"><div class="b5-section-head"><div><span class="b5-kicker">ASSIGNMENTS</span><h3>Current member caseload</h3><p>Only explicitly assigned members appear here. Private journals remain outside coach access unless deliberately shared.</p></div></div><div class="b5-work-list">${activeAssignments.length ? activeAssignments.map(item => `<div class="b5-work-row"><span>◎</span><div><h3>${escapeHtml(titleCase(item.pathway_key))} member</h3><p>${escapeHtml(titleCase(item.coaching_format))} · started ${escapeHtml(dateText(item.starts_at))}</p></div><span class="b5-status active">Active</span></div>`).join('') : '<div class="b5-empty">No active member assignments.</div>'}</div></div>
      <div class="b5-section"><div class="b5-section-head"><div><span class="b5-kicker">SUPERVISION</span><h3>Recent supervision</h3></div></div><div class="b5-work-list">${state.supervision.length ? state.supervision.slice(0,6).map(item => `<div class="b5-work-row"><span>◇</span><div><h3>${escapeHtml(titleCase(item.supervision_type))}</h3><p>${escapeHtml(item.coach_visible_summary || item.action_items || 'Supervision record')} · ${escapeHtml(dateText(item.supervision_date))}</p></div><span class="b5-status ${item.status}">${escapeHtml(titleCase(item.status))}</span></div>`).join('') : '<div class="b5-empty">No supervision records are available yet.</div>'}</div></div>`;
  }

  async function submitStaffInterest() {
    const experience = $('#b5StaffExperience')?.value.trim() || '';
    const availability = $('#b5StaffAvailability')?.value || '';
    const languages = ($('#b5StaffLanguage')?.value || 'en').split(',');
    const pathways = [$('#b5StaffPathway')?.value || 'recovery'];
    const acknowledgement = !!$('#b5StaffW2Ack')?.checked;
    if (!acknowledgement) { message('#b5StaffMsg','Please acknowledge the W-2 role distinction.','error'); return; }
    const button = $('#b5SubmitStaffInterest'); button.disabled = true;
    const {error} = await client.rpc('lellee_submit_staff_coach_interest',{p_experience:experience,p_availability:availability,p_languages:languages,p_pathways:pathways,p_acknowledgement_w2:acknowledgement});
    button.disabled = false;
    if (error) { message('#b5StaffMsg',error.message,'error'); return; }
    message('#b5StaffMsg','Your W-2 role interest was recorded.','success');
    await refreshState();
  }

  function nextBusinessAction(plan) {
    if (!plan?.niche_key) return 'Choose one primary population or service area to keep the first offer clear.';
    if (!plan?.target_audience) return 'Describe the person you most want to help in one plain-language sentence.';
    if (!plan?.primary_offer) return 'Choose a first service format: individual, group, hybrid or workshop.';
    if (!plan?.pricing_model) return 'Set one transparent pricing model and check it against your realistic capacity.';
    if (!(plan.referral_channels || []).length) return 'Choose two referral channels and complete one outreach action.';
    if (plan.business_stage === 'explore') return 'Complete Explore Coaching before presenting yourself as trained.';
    if (plan.business_stage === 'foundation') return 'Complete Foundations and prepare a simple intake and scheduling workflow.';
    if (plan.business_stage === 'launch') return 'Publish one approved offer and follow up with your first referral partners.';
    return 'Review inquiries, conversion, workload and client outcomes before expanding capacity.';
  }

  function renderBusinessBuilder() {
    const target = $('#b5BusinessBuilder');
    if (!target) return;
    if (!state.user) { target.innerHTML = signedOutCard(); return; }
    if (!state.buildReady && !state.catalog.length) { target.innerHTML = buildMissingCard(); return; }

    if (!state.business) {
      target.innerHTML = `<div class="b5-clarity-note"><b>Independent means independent.</b> You own your business and work for yourself. Lellee training completion does not create W-2 employment, licensure, certification by a government body, or the title “Lellee Coach.”</div>
      <div class="b5-section"><div class="b5-section-head"><div><h3>Start an independent business profile</h3><p>This also opens the free Explore Coaching course and creates a private referral code. Referral compensation remains off.</p></div></div>
        <div class="b5-form-grid"><label>Business name<input id="b5StartBusinessName" maxlength="100" placeholder="Example: New Day Support Coaching"></label><label>Public professional name<input id="b5StartPublicName" maxlength="80" placeholder="Name people will see"></label></div>
        <div class="b5-actions"><button class="b5-primary" id="b5StartBusiness">Start Business Profile</button></div><div class="b5-message" id="b5BusinessMsg"></div>
      </div>`;
      $('#b5StartBusiness')?.addEventListener('click', startBusiness);
      return;
    }

    const plan = state.businessPlan || {};
    const referralChannels = plan.referral_channels || [];
    const next = plan.next_action || nextBusinessAction(plan);
    target.innerHTML = `<div class="b5-business-hero"><div><span class="b5-kicker">${escapeHtml(titleCase(state.business.business_stage))}</span><h3>${escapeHtml(state.business.business_name)}</h3><p>${escapeHtml(state.business.public_name)} · Independent professional · Marketplace ${escapeHtml(titleCase(state.business.marketplace_status))}</p></div><div class="b5-referral"><small>REFERRAL CODE</small><b>${escapeHtml(state.business.referral_code || 'Pending')}</b><button class="b5-link" id="b5CopyReferral">Copy</button></div></div>
      <div class="b5-next-action"><span class="b5-kicker">BUSINESS BUILDER AGENT</span><h3>Your next manageable business action</h3><p id="b5BusinessNextDisplay">${escapeHtml(next)}</p></div>
      <div class="b5-section"><div class="b5-section-head"><div><h3>Business plan</h3><p>Build one clear offer before adding more complexity.</p></div><button class="b5-link" data-page="coach-dashboard">Open legacy business dashboard</button></div>
        <div class="b5-form-grid">
          <label>Stage<select id="b5BusinessStage"><option value="explore">Explore</option><option value="foundation">Foundation</option><option value="launch">Launch</option><option value="grow">Grow</option></select></label>
          <label>Primary niche<select id="b5BusinessNiche"><option value="">Choose one</option><option value="recovery">Recovery</option><option value="reentry">Reentry</option><option value="housing">Housing Stability</option><option value="caregiving">Caregiving</option><option value="grief">Grief</option><option value="workforce">Workforce</option><option value="family">Family Support</option><option value="independent_living">Independent Living</option><option value="other">Other</option></select></label>
          <label class="b5-wide">Who do you help?<input id="b5TargetAudience" maxlength="300" value="${escapeHtml(plan.target_audience || state.business.audience_summary || '')}" placeholder="Describe the people you want to support"></label>
          <label>Primary offer<select id="b5PrimaryOffer"><option value="">Choose one</option><option value="individual">Individual coaching</option><option value="group">Group coaching</option><option value="hybrid">Hybrid program</option><option value="workshop">Workshop / education</option><option value="other">Other</option></select></label>
          <label>Pricing model<select id="b5PricingModel"><option value="">Choose one</option><option value="session">Per session</option><option value="monthly">Monthly package</option><option value="program">Fixed program</option><option value="group_seat">Per group seat</option><option value="sliding_scale">Sliding scale</option><option value="other">Other</option></select></label>
          <label class="b5-wide">About your work<textarea id="b5BusinessBio" maxlength="1200" placeholder="Describe your approach without overstating credentials.">${escapeHtml(state.business.bio || '')}</textarea></label>
          <label class="b5-wide">Credentials and scope disclosure<textarea id="b5CredentialDisclosure" maxlength="900" placeholder="List accurate training/credentials and what you do not provide.">${escapeHtml(state.business.credential_disclosure || '')}</textarea></label>
          <div class="b5-wide"><span style="display:block;font-size:.7rem;font-weight:800;margin-bottom:6px">Referral channels</span><div class="b5-channel-grid">${['community organizations','treatment/providers','faith communities','social media','past contacts','events','professional network'].map(channel => `<label><input type="checkbox" data-b5-channel="${escapeHtml(channel)}" ${referralChannels.includes(channel) ? 'checked' : ''}>${escapeHtml(titleCase(channel))}</label>`).join('')}</div></div>
        </div>
        <div class="b5-actions" style="margin-top:12px"><button class="b5-primary" id="b5SaveBusinessPlan">Save Plan</button><button class="b5-secondary" data-b5-page="training-center">Open Training</button><button class="b5-secondary" data-b5-page="social-agent">Open Social Agent</button></div><div class="b5-message" id="b5BusinessMsg"></div>
      </div>`;
    $('#b5BusinessStage').value = plan.business_stage || state.business.business_stage || 'explore';
    $('#b5BusinessNiche').value = plan.niche_key || state.business.niche_keys?.[0] || '';
    $('#b5PrimaryOffer').value = plan.primary_offer || '';
    $('#b5PricingModel').value = plan.pricing_model || '';
    $('#b5SaveBusinessPlan')?.addEventListener('click', saveBusinessPlan);
    $('#b5CopyReferral')?.addEventListener('click', async () => { await navigator.clipboard?.writeText(state.business.referral_code || ''); toast('Referral code copied'); });
  }

  async function startBusiness() {
    const businessName = $('#b5StartBusinessName')?.value.trim();
    const publicName = $('#b5StartPublicName')?.value.trim();
    if (!businessName || !publicName) { message('#b5BusinessMsg','Enter both names.','error'); return; }
    const button = $('#b5StartBusiness'); button.disabled = true;
    const {error} = await client.rpc('lellee_start_independent_business',{p_business_name:businessName,p_public_name:publicName});
    button.disabled = false;
    if (error) { message('#b5BusinessMsg',error.message,'error'); return; }
    message('#b5BusinessMsg','Independent business profile created.','success');
    await refreshState();
  }

  async function saveBusinessPlan() {
    const channels = $$('[data-b5-channel]:checked').map(item => item.dataset.b5Channel);
    const payload = {
      business_stage: $('#b5BusinessStage')?.value || 'explore',
      niche_key: $('#b5BusinessNiche')?.value || '',
      target_audience: $('#b5TargetAudience')?.value.trim() || '',
      primary_offer: $('#b5PrimaryOffer')?.value || '',
      pricing_model: $('#b5PricingModel')?.value || '',
      referral_channels: channels,
      completed_steps: [],
      next_action: ''
    };
    payload.next_action = nextBusinessAction(payload);
    const businessPayload = {
      business_name: state.business.business_name,
      public_name: state.business.public_name,
      business_stage: payload.business_stage,
      niche_keys: payload.niche_key ? [payload.niche_key] : [],
      audience_summary: payload.target_audience,
      bio: $('#b5BusinessBio')?.value.trim() || '',
      credential_disclosure: $('#b5CredentialDisclosure')?.value.trim() || ''
    };
    const button = $('#b5SaveBusinessPlan'); button.disabled = true;
    const [planResult,businessResult] = await Promise.all([
      client.rpc('lellee_save_business_builder_plan',{p_payload:payload}),
      client.rpc('lellee_update_independent_business_profile',{p_payload:businessPayload})
    ]);
    button.disabled = false;
    const error = planResult.error || businessResult.error;
    if (error) { message('#b5BusinessMsg',error.message,'error'); return; }
    message('#b5BusinessMsg','Business plan saved.','success');
    await refreshState();
  }

  function platformDraft(platform, brief, audience, cta, tone, language) {
    const base = brief.trim();
    const audienceText = audience ? ` For ${audience.trim()}.` : '';
    const action = cta ? ` ${cta.trim()}` : '';
    const disclaimer = ' Educational support only; not emergency, medical, or licensed treatment.';
    const es = language === 'es';
    if (es) {
      const intro = `Apoyo práctico: ${base}${audienceText}`;
      if (platform === 'x' || platform === 'threads') return `${intro}${action}`.slice(0,270);
      if (platform === 'tiktok' || platform === 'youtube') return `Guion breve\n1. Empieza con: “${base}”\n2. Comparte un paso útil y claro.\n3. Invita a la persona a ${cta || 'conocer más'}.\n4. Cierre: apoyo educativo, no atención de emergencia.`;
      return `${intro}\n\nUn paso pequeño puede ayudar a avanzar sin tener que resolver todo hoy.${action}\n\n${disclaimer}`;
    }
    if (platform === 'linkedin') return `${base}\n\n${audienceText.trim()} A useful support approach starts with clear scope, practical next steps, and respect for the person’s choices.${action}\n\n${disclaimer}`;
    if (platform === 'instagram') return `${base}\n\nOne manageable step. Clear support. No pressure to solve everything today.${audienceText}${action}\n\n#Support #Coaching #Lellee`;
    if (platform === 'facebook') return `${base}${audienceText}\n\nWhat is one useful next step someone could take today?${action}\n\n${disclaimer}`;
    if (platform === 'x' || platform === 'threads') return `${base}${audienceText}${action}`.slice(0,270);
    if (platform === 'tiktok' || platform === 'youtube') return `Short video script\nHook: “${base}”\nPoint 1: Name the challenge in plain language.\nPoint 2: Offer one practical step.\nPoint 3: Encourage appropriate support or referral.\nCTA: ${cta || 'Learn more'}\nOn-screen note: Educational support; not emergency or medical treatment.`;
    return `${base}${audienceText}${action}`;
  }

  function renderSocialAgent() {
    const target = $('#b5SocialAgent');
    if (!target) return;
    if (!state.user) { target.innerHTML = signedOutCard(); return; }
    if (!state.business) { target.innerHTML = '<div class="b5-empty">Start an independent business profile before using the Social Media Agent. <button class="b5-link" data-b5-page="business-builder">Open Business Builder</button></div>'; return; }
    const connectionMap = new Map(state.socialConnections.map(item => [item.platform,item]));
    target.innerHTML = `<div class="b5-social-warning"><b>Human approval is the default.</b> The agent may draft platform-specific content, but health claims, safety information, testimonials and sensitive material require review. Private Lellee journals, messages, contacts and member data are never source material. Actual posting remains off in Build 5.</div>
      <div class="b5-section"><div class="b5-section-head"><div><span class="b5-kicker">PLATFORMS</span><h3>Connection readiness</h3><p>Request a connection now; OAuth and publishing activation arrive in the integration build.</p></div></div><div class="b5-platform-grid">${platforms.map(platform => {
        const connection = connectionMap.get(platform);
        return `<article class="b5-platform-card"><span class="b5-status ${connection?.connection_status || 'draft'}">${escapeHtml(titleCase(connection?.connection_status || 'not connected'))}</span><h3>${escapeHtml(titleCase(platform))}</h3><p>Human review · auto-post off</p><button class="b5-link" data-b5-connect="${platform}">${connection ? 'Refresh request' : 'Request connection'}</button></article>`;
      }).join('')}</div></div>
      <div class="b5-section"><div class="b5-section-head"><div><span class="b5-kicker">CAMPAIGN BUILDER</span><h3>One message, adapted by platform</h3><p>The output is a draft—not professional, legal or clinical approval.</p></div></div>
        <div class="b5-form-grid">
          <label>Campaign name<input id="b5CampaignName" maxlength="120" placeholder="Example: Recovery support introduction"></label>
          <label>Language<select id="b5CampaignLanguage"><option value="en">English</option><option value="es">Spanish</option></select></label>
          <label class="b5-wide">Core message<textarea id="b5CampaignBrief" maxlength="1400" placeholder="What should people understand?"></textarea></label>
          <label>Audience<input id="b5CampaignAudience" maxlength="240" placeholder="Who is this for?"></label>
          <label>Call to action<input id="b5CampaignCta" maxlength="180" placeholder="Example: Explore a free introductory session"></label>
          <label>Tone<select id="b5CampaignTone"><option value="warm">Warm</option><option value="professional">Professional</option><option value="educational">Educational</option><option value="encouraging">Encouraging</option></select></label>
          <div class="b5-wide"><span style="display:block;font-size:.7rem;font-weight:800;margin-bottom:6px">Create drafts for</span><div class="b5-channel-grid">${platforms.map(platform => `<label><input type="checkbox" data-b5-platform-choice="${platform}" ${['facebook','instagram','linkedin'].includes(platform)?'checked':''}>${escapeHtml(titleCase(platform))}</label>`).join('')}</div></div>
        </div><div class="b5-actions" style="margin-top:12px"><button class="b5-primary" id="b5GenerateSocial">Generate & Save Drafts</button></div><div class="b5-message" id="b5SocialMsg"></div>
      </div>
      <div class="b5-section"><div class="b5-section-head"><div><span class="b5-kicker">DRAFT LIBRARY</span><h3>Review before approval</h3></div></div><div class="b5-draft-list">${state.socialContent.length ? state.socialContent.map(item => `<article class="b5-draft-card"><div class="b5-draft-head"><h3>${escapeHtml(item.campaign_name)} · ${escapeHtml(titleCase(item.platform))}</h3><span class="b5-status ${item.approval_status}">${escapeHtml(titleCase(item.approval_status))}</span></div><pre>${escapeHtml(item.content_text)}</pre><div class="b5-actions"><button class="b5-secondary" data-b5-draft-status="needs_review" data-b5-draft-id="${item.id}">Needs Review</button><button class="b5-primary" data-b5-draft-status="approved" data-b5-draft-id="${item.id}">Approve Draft</button></div></article>`).join('') : '<div class="b5-empty">No social drafts yet.</div>'}</div></div>`;
    $('#b5GenerateSocial')?.addEventListener('click', generateSocialDrafts);
  }

  async function requestSocialConnection(platform) {
    const {error} = await client.rpc('lellee_request_social_connection',{p_platform:platform,p_account_label:state.business.business_name});
    if (error) { toast(error.message,'error'); return; }
    toast(`${titleCase(platform)} connection request saved. OAuth is not active yet.`);
    await refreshState();
  }

  async function generateSocialDrafts() {
    const campaign = $('#b5CampaignName')?.value.trim();
    const brief = $('#b5CampaignBrief')?.value.trim();
    const audience = $('#b5CampaignAudience')?.value.trim() || '';
    const cta = $('#b5CampaignCta')?.value.trim() || '';
    const tone = $('#b5CampaignTone')?.value || 'warm';
    const language = $('#b5CampaignLanguage')?.value || 'en';
    const selected = $$('[data-b5-platform-choice]:checked').map(item => item.dataset.b5PlatformChoice);
    if (!campaign || !brief || !selected.length) { message('#b5SocialMsg','Enter a campaign, core message, and at least one platform.','error'); return; }
    const button = $('#b5GenerateSocial'); button.disabled = true;
    message('#b5SocialMsg','Creating platform-specific drafts…');
    for (const platform of selected) {
      const content = platformDraft(platform,brief,audience,cta,tone,language);
      const type = ['tiktok','youtube'].includes(platform) ? 'script' : platform === 'instagram' ? 'caption' : 'post';
      const {error} = await client.rpc('lellee_create_social_draft',{p_campaign_name:campaign,p_source_brief:brief,p_platform:platform,p_content_type:type,p_language_code:language,p_content_text:content});
      if (error) { button.disabled=false; message('#b5SocialMsg',error.message,'error'); return; }
    }
    button.disabled = false;
    message('#b5SocialMsg','Drafts saved. Review each one before approval.','success');
    await refreshState();
  }

  async function updateDraftStatus(id,status) {
    const {error} = await client.rpc('lellee_update_social_draft_status',{p_content_id:id,p_status:status});
    if (error) { toast(error.message,'error'); return; }
    toast(`Draft marked ${titleCase(status)}. Publishing remains off.`);
    await refreshState();
  }

  function bindEvents() {
    document.addEventListener('click', event => {
      const pageButton = event.target.closest('[data-b5-page]');
      if (pageButton) { event.preventDefault(); navigate(pageButton.dataset.b5Page); return; }
      const insertedLegacyPage = event.target.closest('.b5-page [data-page], #b5ConsumerCoachPanel [data-page]');
      if (insertedLegacyPage) { event.preventDefault(); navigate(insertedLegacyPage.dataset.page); return; }
      const courseButton = event.target.closest('[data-b5-course]');
      if (courseButton) { event.preventDefault(); navigate('training-center'); state.selectedCourse=courseButton.dataset.b5Course; renderTraining(); document.getElementById('b5TrainingDetail')?.scrollIntoView({behavior:'smooth'}); return; }
      const moduleButton = event.target.closest('[data-b5-module]');
      if (moduleButton && !moduleButton.disabled) { event.preventDefault(); openModule(moduleButton.dataset.b5Module); return; }
      const filter = event.target.closest('[data-b5-training-filter]');
      if (filter) { state.trainingFilter=filter.dataset.b5TrainingFilter; state.selectedCourse=null; renderTraining(); return; }
      const connect = event.target.closest('[data-b5-connect]');
      if (connect) { requestSocialConnection(connect.dataset.b5Connect); return; }
      const draft = event.target.closest('[data-b5-draft-status]');
      if (draft) { updateDraftStatus(draft.dataset.b5DraftId,draft.dataset.b5DraftStatus); return; }
    });

    const content = $('.content');
    if (content) new MutationObserver(() => {
      const active = $('.page.active');
      const page = active?.id?.replace('page-','');
      if (B5_PAGES.has(page)) {
        localStorage.setItem(PAGE_KEY,page);
        localStorage.setItem(ACCOUNT_CATEGORY_KEY,'account');
        ensureAccountOpen();
      }
    }).observe(content,{subtree:true,attributes:true,attributeFilter:['class']});
  }

  async function initialize() {
    installPages();
    configureLegacyCoachPages();
    bindEvents();
    let attempts=0;
    const navTimer=setInterval(() => { if (installNav() || ++attempts>30) clearInterval(navTimer); },100);
    await refreshState();
    client?.auth.onAuthStateChange((_event,session) => {
      if (session?.user?.id !== state.user?.id || !session?.user) setTimeout(refreshState,40);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
