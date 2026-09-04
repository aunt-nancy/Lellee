#!/usr/bin/env node
/**
 * LELLEE — CREATE QA USER + ADMIN LOGIN
 * Date: 2026-08-29
 *
 * PURPOSE
 * - Creates or resets one ordinary Lellee QA login.
 * - Creates or resets one Lellee Admin QA login.
 * - Ensures the ordinary user has NO admin role.
 * - Grants the admin account role='admin' in public.admin_user_roles.
 *
 * SECURITY
 * - Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as environment variables.
 * - Requires LELLEE_QA_USER_PASSWORD and LELLEE_QA_ADMIN_PASSWORD as environment variables.
 * - The service_role key and QA passwords are NEVER written into this file.
 * - Change both temporary passwords after testing, or delete the QA accounts.
 *
 * REQUIREMENTS
 * - Node.js 18+ (uses built-in fetch).
 * - public.admin_user_roles must already exist. If it does not, run the approved
 *   Lellee ADMIN_OPERATIONS_CORRECTED.sql migration first.
 */

const USER = {
  email: 'qa.user.082926@lellee.com',
  password: process.env.LELLEE_QA_USER_PASSWORD || '',
  displayName: 'Lellee QA User',
};

const ADMIN = {
  email: 'qa.admin.082926@lellee.com',
  password: process.env.LELLEE_QA_ADMIN_PASSWORD || '',
  displayName: 'Lellee QA Admin',
};

const SITE_URL = (process.env.LELLEE_SITE_URL || 'https://www.lellee.com').replace(/\/$/, '');
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.DRY_RUN || '');

function requireEnv() {
  if (DRY_RUN) return;
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SERVICE_ROLE) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!USER.password) missing.push('LELLEE_QA_USER_PASSWORD');
  if (!ADMIN.password) missing.push('LELLEE_QA_ADMIN_PASSWORD');
  if (missing.length) {
    console.error(`\nSTOP: Missing ${missing.join(', ')}.`);
    console.error('Set them only in your local terminal/session, then run this script again.');
    process.exit(1);
  }
}

function headers(extra = {}) {
  return {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function api(path, { method = 'GET', body, extraHeaders = {} } = {}) {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: headers(extraHeaders),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data);
    throw new Error(`${method} ${path} -> ${res.status}: ${detail}`);
  }
  return data;
}

async function findAuthUser(email) {
  const wanted = email.toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const result = await api(`/auth/v1/admin/users?page=${page}&per_page=${perPage}`);
    const users = Array.isArray(result) ? result : (result?.users || []);
    const found = users.find(u => String(u.email || '').toLowerCase() === wanted);
    if (found) return found;
    if (users.length < perPage) return null;
  }
  throw new Error(`Could not finish searching Auth users for ${email}.`);
}

async function createOrResetUser(account) {
  let existing = await findAuthUser(account.email);
  if (!existing) {
    console.log(`Creating ${account.email} ...`);
    try {
      existing = await api('/auth/v1/admin/users', {
        method: 'POST',
        body: {
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: { display_name: account.displayName, lellee_qa_account: true },
        },
      });
    } catch (err) {
      existing = await findAuthUser(account.email);
      if (!existing) throw err;
    }
  }

  console.log(`Setting temporary password from environment for ${account.email} ...`);
  const updated = await api(`/auth/v1/admin/users/${encodeURIComponent(existing.id)}`, {
    method: 'PUT',
    body: {
      password: account.password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        display_name: account.displayName,
        lellee_qa_account: true,
      },
    },
  });
  return updated || existing;
}

async function removeAdminRole(userId) {
  await api(`/rest/v1/admin_user_roles?user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    extraHeaders: { Prefer: 'return=minimal' },
  });
}

async function grantAdminRole(userId) {
  await api('/rest/v1/admin_user_roles?on_conflict=user_id', {
    method: 'POST',
    body: [{ user_id: userId, role: 'admin', active: true }],
    extraHeaders: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
}

async function verifyAdminRole(userId) {
  const rows = await api(`/rest/v1/admin_user_roles?user_id=eq.${encodeURIComponent(userId)}&select=user_id,role,active`);
  return Array.isArray(rows) ? rows[0] : null;
}

async function bestEffortDisplayName(user) {
  try {
    await api('/rest/v1/profiles?on_conflict=id', {
      method: 'POST',
      body: [{ id: user.id, display_name: user.user_metadata?.display_name || '' }],
      extraHeaders: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
  } catch (err) {
    console.warn(`Profile note: ${err.message}`);
    console.warn('This does not stop authentication. The normal Lellee signup/profile trigger may already manage the profile row.');
  }
}

function printCredentials() {
  const loginUrl = `${SITE_URL}/app?auth=signin`;
  console.log('\n============================================================');
  console.log('LELLEE QA LOGIN DETAILS');
  console.log('============================================================');
  console.log(`STANDARD USER LOGIN: ${loginUrl}`);
  console.log(`Email:    ${USER.email}`);
  console.log('Password: supplied through LELLEE_QA_USER_PASSWORD');
  console.log('');
  console.log(`ADMIN LOGIN:         ${loginUrl}`);
  console.log(`Email:    ${ADMIN.email}`);
  console.log('Password: supplied through LELLEE_QA_ADMIN_PASSWORD');
  console.log('After Admin signs in, the role-protected Admin item should appear in Lellee navigation.');
  console.log('============================================================\n');
}

async function main() {
  requireEnv();

  if (DRY_RUN) {
    console.log('DRY RUN: No Supabase changes will be made.');
    printCredentials();
    return;
  }

  console.log('\nLellee login provisioning started.');
  const normalUser = await createOrResetUser(USER);
  const adminUser = await createOrResetUser(ADMIN);

  await bestEffortDisplayName(normalUser);
  await bestEffortDisplayName(adminUser);

  console.log('Removing any admin role from the ordinary QA user ...');
  await removeAdminRole(normalUser.id);

  console.log('Granting Lellee Admin role to the admin QA user ...');
  try {
    await grantAdminRole(adminUser.id);
  } catch (err) {
    console.error('\nADMIN ROLE SETUP FAILED.');
    console.error(err.message);
    console.error('\nIf public.admin_user_roles does not exist, run the approved ADMIN_OPERATIONS_CORRECTED.sql migration first, then rerun this script.');
    process.exit(1);
  }

  const role = await verifyAdminRole(adminUser.id);
  if (!role || role.role !== 'admin' || role.active !== true) {
    throw new Error('Admin role verification failed after upsert.');
  }

  console.log('SUCCESS: ordinary QA user is non-admin.');
  console.log('SUCCESS: admin QA user has active admin role.');
  printCredentials();
  console.log('SECURITY: Change the temporary passwords after testing or delete these QA accounts.');
  console.log('SECURITY: Never put the service_role key or QA passwords in index.html, landing.html, GitHub, or Vercel client-side variables.\n');
}

main().catch(err => {
  console.error('\nSETUP FAILED:');
  console.error(err?.stack || err);
  process.exit(1);
});
