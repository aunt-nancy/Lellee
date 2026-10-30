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
  'coach-workspace.css', 'coach.html', 'index.html',
  'supabase/migrations/20261029193037_independent_coach_service_authorization.sql',
  'supabase/migrations/20261030161649_isolate_coaching_group_schedule_reads.sql'
]);
const changed = execFileSync('git', ['diff', '--name-only', lock.baseline_commit, '--'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
for (const path of changed) {
  assert.ok(allowed.has(path) || path.startsWith('tools/coach-authorization-tests/') || path.startsWith('docs/launch/'), `Change exceeds correction scope: ${path}`);
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
console.log(JSON.stringify({ protectedFiles: Object.keys(lock.protected_files).length, correctionScope: 'passed', consumerAndPublicCoachingMarkup: 'preserved outside exact corrections' }));
