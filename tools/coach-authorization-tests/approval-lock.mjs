import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const lock = JSON.parse(readFileSync(new URL('../../docs/launch/APPROVAL_LOCK_2026-10-30.json', import.meta.url)));
for (const [path, expected] of Object.entries(lock.protected_files)) {
  assert.equal(createHash('sha256').update(readFileSync(new URL(path, `file://${root}`))).digest('hex'), expected, `Locked approval changed: ${path}`);
}
const allowed = new Set([
  'coach-dashboard-live.js', 'coaching/index-runtime.js', 'coaching/index.html',
  'coach-workspace.css', 'coach.html', 'index.html', 'pilot-runtime.js',
  'paths-resources.js', 'lellee-v1.js',
  '.github/workflows/lellee-launch-verification.yml',
  'supabase/migrations/20261029193037_independent_coach_service_authorization.sql',
  'supabase/migrations/20261030161649_isolate_coaching_group_schedule_reads.sql',
  'supabase/migrations/20261101040121_public_program_resource_directory.sql'
]);
const changed = execFileSync('git', ['diff', '--name-only', lock.baseline_commit, '--'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
for (const path of changed) {
  assert.ok(allowed.has(path) || path.startsWith('tools/coach-authorization-tests/') || path.startsWith('docs/launch/') || path.startsWith('content/launch-2026-10-30/'), `Change exceeds correction scope: ${path}`);
}
// Consumer markup is locked except removal of the duplicate broken skip link.
const original = execFileSync('git', ['show', `${lock.baseline_commit}:index.html`], { cwd: root, encoding: 'utf8' });
assert.equal(readFileSync(new URL('../../index.html', import.meta.url), 'utf8'), original.replace('<a class="skip-link" href="#mainContent">Skip to main content</a>', ''));
// Public coaching copy is locked except the disclosure on its sample preview.
const coachOriginal = execFileSync('git', ['show', `${lock.baseline_commit}:coach.html`], { cwd: root, encoding: 'utf8' });
const disclosed = coachOriginal
  .replace('aria-label="Coach dashboard preview"', 'aria-label="Coach dashboard preview" aria-describedby="coachPreviewDisclosure"')
  .replace('<span>COACH DASHBOARD</span>', '<span>COACH DASHBOARD · SAMPLE DATA</span>')
  .replace('        <div class="metric-row">', '        <p id="coachPreviewDisclosure" class="chart-note">Illustrative preview. All figures and activities shown are sample data.</p>\n        <div class="metric-row">');
assert.equal(readFileSync(new URL('../../coach.html', import.meta.url), 'utf8'), disclosed);
// October 31 resource correction: only replace the bundled directory module.
// The other feature modules in this large bundle remain byte-for-byte approved.
const bundleOriginal=execFileSync('git',['show',`${lock.baseline_commit}:lellee-v1.js`],{cwd:root,encoding:'utf8'});
const bundle=readFileSync(new URL('../../lellee-v1.js',import.meta.url),'utf8');
const begin='/* ===== paths-resources.js ===== */',end='/* ===== lellee-plus.js ===== */';
const parts=value=>{const a=value.indexOf(begin),b=value.indexOf(end,a);assert.ok(a>=0&&b>a);return [value.slice(0,a),value.slice(a+begin.length,b).trim(),value.slice(b)];};
const oldParts=parts(bundleOriginal),newParts=parts(bundle);
assert.equal(newParts[0],oldParts[0]);assert.equal(newParts[2],oldParts[2]);
assert.equal(newParts[1],readFileSync(new URL('../../paths-resources.js',import.meta.url),'utf8').trim());
const pathOriginal=execFileSync('git',['show',`${lock.baseline_commit}:paths-resources.js`],{cwd:root,encoding:'utf8'});
const pathEdited=readFileSync(new URL('../../paths-resources.js',import.meta.url),'utf8');
const recoveryPreferences=value=>value.slice(value.indexOf('function dbApproachToKey'),value.indexOf('async function loadResources'));
assert.equal(recoveryPreferences(pathEdited),recoveryPreferences(pathOriginal),'Recovery preference/learning content changed');
console.log(JSON.stringify({ protectedFiles: Object.keys(lock.protected_files).length, correctionScope: 'passed', consumerAndPublicCoachingMarkup: 'preserved outside exact corrections' }));
