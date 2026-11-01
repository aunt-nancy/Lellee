# Authorized launch corrections — October 30, 2026

Leslie authorized only the launch corrections discussed for Lellee and Lellee
Coaching. All other approvals remain locked. Existing approved decisions do not
require approval again. This checkpoint adds no release, commercial, curriculum,
content-publication, payment, marketplace or account authorization.

## Changes in this review branch

- Retain the existing PR #60 independent-coach service gate and evidence-field
  protections. Onboarding, training and draft preparation remain accessible.
- Replace the defective schedule SELECT predicate. Group membership authorizes
  only events for that group and practice. Keep the existing write policy and
  coach access unchanged; preserve the client's own appointments.
- Remove the duplicate consumer skip link with a nonexistent target. Add one
  keyboard skip link and focusable main landmark to the authenticated Coaching
  workspace. Respect reduced-motion preferences for its smooth scrolling.
- Label the public dashboard's figures and activities as sample data.
- Clarify that monthly ethics reminders remain informational while independent
  service authorization separately requires current verified onboarding evidence.
- Record a baseline and test the scope and protected files with
  `APPROVAL_LOCK_2026-10-30.json` and `approval-lock.mjs`.

## Locked decisions

Preserve approved pricing and entitlements, artwork, logo dimensions, colors,
layouts, navigation, consumer/coaching separation, grouped legal acknowledgment,
privacy consent, program names and portfolio, roadmap, Recovery content and
onboarding behavior. Preserve the three-or-more care-recipient requirement and
the future staff/learning-coaching lane. Do not change course requirements,
approve coaches, publish draft content, or enable marketplace/payments as part of
a technical correction. The older approval ledger remains historical; newer
explicit user instructions take precedence.

The protected baseline is current main `e215c80fdfe3d61d913829e417a2f589b09eabc7`.
The branch incorporates that main's worker scheduler commits without changing
them. PR #13 is not merged or replayed. The correction check fingerprints 35
protected files and rejects unrelated changed paths; it also compares consumer
and public coaching markup against the exact permitted edits.

## Reconciled implementation evidence

The consumer `index.html`, `coach-auth.js` and `coaching/index-runtime.js` point to
`hkrrxscyhtxmbvxevfkw`. That database is the canonical source for these UI and
independent-coaching findings. The separately named Lellee project,
`vnfjszmhmcxkxegzvivg`, has other infrastructure and is not interchangeable.
Do not migrate either project or replace frontend configuration to make counts
agree.

Read-only checks on October 30 found five database-active programs in the runtime
project: Recovery, Caregiving, Reentry, Housing Stability and Independent Living.
The other 16 database program records are planned. This does not revise the
approved eight-program initial portfolio or establish public release readiness.
Recovery has 742 published `journey_content` records; the other programs have
zero rows in that table. `program_content_items` is empty in the runtime project.
Content in the separately named project cannot be reported as deployed here.

The previously reported anonymous video-write issue is already corrected in
`vnfjszmhmcxkxegzvivg`: `anon` has SELECT only, INSERT/UPDATE/DELETE policies
require `is_lellee_admin()`, and new rows default to unapproved. No video rows or
approvals are altered in this branch. This verification closes only that narrow
write finding, not the project's complete security review.

The runtime project still has zero independent coach businesses and zero client
relationships. All seven professional courses remain draft, with no distinct
orientation course or resolved onboarding-certificate mapping. No requirements
version, certificate approval or backfill is seeded. Existing ethics and
extra-course requirements are not silently removed or newly approved.

## Verification and remaining release conditions

The existing 140 migration/RPC checks pass in isolated PGlite with synthetic
actors and reduced captured schema. Twelve additional schedule privacy tests
first reproduce the original leak, then verify two clients/two groups, unrelated
and anonymous users, separate practices, inactive membership, mismatched IDs,
preserved coach access and unchanged write policy. These are SQL/RLS checks with
simulated JWT/roles; they are not real Supabase Auth tests.

Browser evidence is recorded separately in `correction-browser-results.json`.
Mocked browser tests do not establish real authenticated operation, Safari/device
acceptance, deployment parity, payment readiness or full accessibility compliance.

Before production: reconcile the existing approved curriculum's exact evidence
mapping; complete canonical PostgreSQL 17/Supabase Auth, coach/client/admin,
consent/revocation, accessibility and device acceptance; review schema/permission
drift and rollback; then follow the existing separate production-approval hold.
Broader content parity remains unfinished and is not solved by changing status
flags. Payments and marketplace remain off. No production writes, account
creation, notifications, approval backfills, release flags or deployment occurred.

Supabase changelog and current RLS documentation were checked October 30. The
relevant new policy uses ordinary PostgreSQL RLS, no extensions or custom
operators, and does not alter transport or authentication configuration.

## Reproduce local checks

From `tools/coach-authorization-tests`:

```sh
npm ci --ignore-scripts
npm run test:sql
npm run test:privacy
node approval-lock.mjs
```

For rollback, validate the prior schema in isolated staging and retain the
original captured policy for comparison. Do not restore its known privacy leak
in production as a routine rollback. Keep the marketplace/payments disabled and
stop rollout if the migration or authenticated acceptance fails.
