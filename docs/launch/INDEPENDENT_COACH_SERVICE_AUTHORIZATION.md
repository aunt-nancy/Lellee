# Independent-coach service authorization

Review branch only. No production migration, account approval, record backfill,
marketplace activation, payment activation, or deployment is authorized here.

## Behavior

Account and dashboard access remain separate from permission to deliver services.
Signup, business profile edits, self-reported evidence, draft services, forming
groups, and private availability preparation remain accessible. The Coaching
workspace shows service approval separately; inability to load approval never
becomes permission to activate a service. The database is authoritative even if
the UI is stale, modified, or bypassed.

A private authorization is scoped to `(business_id, coach_user_id, program_id)`.
It requires an active permitted membership, approved business and program, an
active reviewed requirements version, verified orientation and certification
training, and a current administrator-issued onboarding certificate. Linked
enrollments, where present, must also remain completed and verified. Evidence,
authorization and certificate expiry/revocation are checked from the database
on every service write. A certificate is valid through its stated expiry date
in America/Los_Angeles. Approval in editable user metadata or an old JWT is
never consulted. An acting coach cannot borrow an approved owner's authority.

No requirements version is seeded. The existing catalog has no resolved
independent orientation/course mapping. The course IDs and requirement version
must be reviewed before release; the implementation fails closed until then.
This change does not silently adopt or remove the legacy publication gate's
ethics/entrepreneurship/three-core/specialty formula. That gate remains an
additional publication check until its product requirements are reconciled.

## Enforcement

BEFORE triggers enforce the gate for direct Data API DML and writes inside
existing SECURITY DEFINER RPCs. Guards cover invitations, relationship activation,
consultation conversion, active services/groups, individual/group scheduling,
confirmation/completion, coach messages, assignments/recipients, intake
assignments, coaching notes and public activation. Public coach cards filter
current eligibility and include only authorized program scopes.

Existing ownership, client consent, payment and privacy restrictions are not
replaced. The new service gate is not a full audit of those existing controls.
Read permissions and retained historical client records are not globally
redesigned; this change principally gates service writes and public discovery.
The separate schedule SELECT-policy correlation defect identified in the review
requires its own privacy regression and correction before release.

Training and credential review-field guards execute as INVOKER. Direct browser
writes cannot assert verification or forge system course links. Existing
authorized review/course functions run as trusted database owners and remain
responsible for their own admin/learner checks. Do not convert these review-field
triggers to SECURITY DEFINER: that would make `current_user` an unsafe caller test.
New privileged helper functions are private, use an empty search path and have
no PUBLIC/anon/authenticated/service_role EXECUTE grant. The two narrow public
RPCs have explicit authenticated-only grants and authenticated/admin checks.

Cancellation, termination, client privacy preference changes and client completion
of already-assigned work remain possible without reactivating coaching. A
cancellation cannot carry an unrelated reschedule, and a coach cannot forge
client acceptance through the termination exception.

## Acceptance compatibility repair

The existing conversion/acceptance RPCs use `pending_client_acceptance` and
`declined`, but the live relationship constraint allowed only active/paused/ended.
The migration expands the constraint vocabulary without updating any rows.
The existing authenticated invitation acceptance function now explicitly records
accepted client status and timestamps. Qualification is rechecked when that
acceptance writes the relationship. No invitation email is sent by these tests.
The browser regression also uncovered local click-target constants shadowing
the New Service/Group/Lead functions. Renaming those targets preserves the
functions and makes draft preparation usable.

## Separation from future employee coaching

Only independent `coach_*` tables and coach-scoped form assignments are guarded.
No `lellee_staff_coaches`, `lellee_training_*`, employee privilege or learning
coaching flow is activated or changed. Employee training does not supply an
independent authorization automatically. Dual-role accounts still need an
independent, program-specific approval for independent practice work.

## Validation

Run from `tools/coach-authorization-tests`:

```sh
npm ci
npm run test:sql
npx playwright install chromium --only-shell
npm run test:ui
```

The SQL suite runs the actual migration, gate functions and current RPC bodies
in an isolated PGlite PostgreSQL engine with synthetic accounts and role/JWT
simulation. `fixture-schema.sql` was derived from the read-only canonical catalog
on October 28-29, 2026 and includes captured RLS policies and RPC bodies. It is a
reduced schema, not a production backup: unrelated constraints, notifications,
auth infrastructure and billing integrations are not recreated. Admin identity
and payment-readiness helpers are isolated test substitutes. Tests cannot
connect to a live backend and roll back actor operations.

The browser suite uses the real HTML and scripts with all Auth/API/network calls
intercepted. It covers new, approved, expired, revoked and unavailable-backend
states, draft-service behavior, and desktop/mobile status visibility. It is not
real Supabase Auth, live checkout or actual-device Safari acceptance. Optional
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and `PLAYWRIGHT_CHROMIUM_ARGS` allow an
existing isolated Chromium installation.

October 29 validation: 140/140 database checks and 5/5 Chromium scenarios passed.
The five browser scenarios also exercise desktop and narrow-mobile layout.
Review `results.json` and `ui-results.json` for exact executed results. The
canonical hosted backend is PostgreSQL 17; the local engine version is recorded
in the result file. Passing local tests does not authorize a production rollout.

## Required before production approval

1. Resolve and approve the independent orientation/certification course mapping
   and the legacy extra-course formula. Publish/review the required learning
   content through its existing controls. Do not grant automatic approvals.
2. Run the migration against a complete isolated canonical PostgreSQL 17 schema;
   run Supabase security advisors and inspect all changed ACLs/policies/triggers.
3. Complete real coach/client/admin Auth, onboarding, consent, scheduling,
   cancellation and privacy tests. Verify staff/dual-role separation and real
   desktop/iPhone behavior. No live payments or public marketplace are needed.
4. Recheck canonical schema drift, current flags and affected-record counts.
   Review the exact migration and permission diff plus a record-by-record plan
   if independent coaches have appeared since the zero-record review.
5. Obtain separate approval for production migration, requirements configuration
   and any existing-record treatment. Keep marketplace and payment flags off.

If rollout is stopped, restore the previously reviewed schema in staging first.
Do not “roll back” by deleting live authorizations, clearing reviewer evidence,
or disabling the guards in production without separate approval. Retain approval
history for any records created after a future authorized release.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[database function security](https://supabase.com/docs/guides/database/functions),
[PGlite](https://pglite.dev/docs/). Supabase changelog reviewed October 29, 2026;
the PostgreSQL 15.19/17.11 notes concern extensions/operators, not this migration's
ordinary tables, PL/pgSQL triggers and role checks.
