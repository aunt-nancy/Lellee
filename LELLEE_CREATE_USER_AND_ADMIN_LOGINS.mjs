#!/usr/bin/env node
/**
 * LELLEE — QA LOGIN PROVISIONING SAFETY GUARD
 *
 * This repository previously contained hardcoded QA credentials.
 * Those credentials are considered compromised and must not be reused.
 *
 * For safety, this checked-in script no longer contains or prints passwords.
 * Provisioning must use environment-provided credentials or a separate local-only
 * script that is never committed to GitHub or deployed to Vercel.
 */

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LELLEE_QA_USER_EMAIL',
  'LELLEE_QA_USER_PASSWORD',
  'LELLEE_QA_ADMIN_EMAIL',
  'LELLEE_QA_ADMIN_PASSWORD'
];

const missing = required.filter(name => !process.env[name]);

if (missing.length) {
  console.error('Lellee QA provisioning is disabled until the required environment variables are supplied locally.');
  console.error(`Missing: ${missing.join(', ')}`);
  console.error('Do not place passwords or the Supabase service-role key in GitHub, Vercel client variables, HTML, or browser JavaScript.');
  process.exit(1);
}

console.error('Safety guard active: the public repository does not perform privileged QA account provisioning.');
console.error('Use an approved local-only provisioning workflow with the environment variables above.');
process.exit(1);
