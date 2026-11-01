# Authenticated acceptance handoff

Use an explicitly authorized isolated Supabase environment. Do not use either
existing production project as a disposable test database, create real customer
invitations, send external mail, activate payments or reuse production users.
The original October 30 handoff provisioned no paid infrastructure. The November 1
attempt and its confirmed cleanup are recorded below.

## November 1, 2026 — isolated branch attempt and confirmed blocker

Source inspected: PR #60 commit `41fadaedb57cc0d50be427d49d43c0d235804f67`.
The connected Supabase account listed three existing projects and no non-default
branch on the canonical runtime project `hkrrxscyhtxmbvxevfkw`.

A temporary, nonpersistent, schema-only branch was created through the provider's
cost-confirmation flow at a quoted compute rate of $0.01344/hour, plus usage.
Creation time: 2026-11-01 14:14:35 UTC (06:14:35 America/Los_Angeles).
Branch: `lellee-pr60-acceptance-20261101`; branch ID:
`624becc3-e0cf-491d-9cc2-99b8954ad302`; temporary project:
`ffzvdgfkftrissavkfvz`. The creation response explicitly recorded
`with_data: false`.

Provisioning reached `MIGRATIONS_FAILED`. The branch PostgreSQL log at
14:14:51 UTC reported `relation "public.platform_environment_baseline" does not exist`.
The branch had zero public tables and zero applied migration records.
A read-only inspection of the parent's first recorded migration,
`20260906214610_hkrr_trusted_circle_consent_boundary`, confirmed that it immediately
queries that pre-existing table and then uses other existing consent tables.
A separate read-only catalog query confirmed that those two tables exist in
production, which contains 595 public tables. The saved migration chain therefore
does not independently bootstrap the existing application schema. Repeating
branch creation without addressing this baseline would repeat the failure.

The unusable branch was deleted successfully. A subsequent parent branch listing
confirmed that only the default main branch remains. No synthetic accounts,
application data, services or frontend deployment were created; no production
schema, data, migration history or project settings were changed. Actual billed
cost for the short-lived attempt was not retrieved.

**Next prerequisite:** obtain a reviewed schema-only baseline through an authorized
schema-export connection, including application permissions and custom Auth/Storage
objects needed by the app. The current connector provides SQL access but no
schema-dump operation; this execution host has neither an authenticated Supabase
CLI nor a Docker runtime. Do not substitute the reduced test fixture or manually
reconstruct hundreds of tables and declare canonical equivalence. Preserve the
original migration history as evidence; do not repair or squash production history
as an incidental acceptance step.

Load the reviewed baseline into a fresh isolated target, verify its inventory and
permissions against production, then apply only the intended PR deltas and
synthetic catalog/configuration fixtures. Production-specific environment guards
must be explicitly adapted only in the isolated copy. Confirm all frontend and
Auth endpoints target that isolated environment before running the scenarios below.
Full live account-flow acceptance remains blocked, not passed.

Provider references:
- https://supabase.com/docs/guides/deployment/branching/dashboard
  (existing migration history is replayed instead of taking a full schema dump).
- https://supabase.com/docs/reference/cli/supabase-db-pull
  (schema capture requirements and managed-schema customizations).

## Preparation

1. Verify the target is isolated and capture its schema/version, Auth settings and
   project identity. Compare the canonical schema and permission diff to the
   review branch; do not replay all historical repository migrations.
2. Apply the exact reviewed authorization and schedule-privacy migrations there.
   Run security advisors and inspect resulting grants, policies and triggers.
3. Create synthetic administrator, new coach, second coach and two client
   accounts through real Supabase Auth using the environment's test mail route.
   Never send invitations to a real person's address for an acceptance test.
4. Keep public marketplace and payment collection disabled. Use synthetic
   fixture-only orientation/course/certificate evidence clearly separated from
   actual curriculum approval. No fixture approval is transferable to production.
5. Point a dedicated test copy of the frontend to that isolated backend. Confirm
   the resulting network requests do not target either production project.

## Execute and record

For each result, retain test date, environment, exact source commit/migration,
actor role, action, actual result, expected result and side-effect evidence.
Do not retain passwords, tokens, private journals or unredacted Auth traces.

| Scenario | Required result |
|---|---|
| New coach signs up/confirms email/signs in | Setup and training accessible; no client-facing operations |
| Coach submits business and self-reported evidence | Evidence stays unverified; actor cannot self-approve |
| Missing, pending, expired or revoked qualification | Direct REST and RPC writes denied; no partial rows or notifications |
| Qualified coach in an approved program | Only approved program operations allowed; ordinary ownership and consent still checked |
| Approved owner with unapproved second coach | Second coach cannot borrow the owner's service rights |
| Invitation/acceptance/decline | Assigned coach rechecked; client acceptance recorded explicitly; decline does not activate |
| One-to-one session/message/assignment | Correct client relationship and consent; unrelated clients cannot read/write |
| Two clients in two groups | Group A cannot read Group B or another client's private appointment |
| Consent narrowed or revoked | Subsequent access obeys current scope; old browser state/token cannot bypass it |
| Evidence revoked between page load and action | Next sensitive request denied without requiring a fresh token |
| Cancellation/termination | Permitted limited paths remain possible without rescheduling/reactivating services |
| Consumer program activity/save/reload/switch | Correct content and response return; other programs' notes stay separate |
| Failed response load/save or position update | Accurate message, no unknown-response overwrite, no false full-save claim |
| Three care recipients | Separate appointments/instructions/notes and one correct consolidated view, with no record mix-up |
| Staff/independent dual role | Qualification in one lane never grants rights in the other |
| Actual iPhone/Safari and assistive technology | Sign-in, navigation, readable text, keyboard/focus, labels, zoom, reduced motion and core save/reload work |

The isolated Auth/PostgREST contract subset passed 24 checks in run
41126084322, with real tokens and reduced application fixtures. This table
describes complete application acceptance, including frontend and curriculum
workflows; it is not all satisfied by that narrower API contract. Existing user
approvals are not reopened by this test plan. Production approval is requested
only after applicable launch prerequisites are supported by recorded results.
