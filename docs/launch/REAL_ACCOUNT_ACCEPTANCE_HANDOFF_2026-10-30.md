# Authenticated acceptance handoff

Use an explicitly authorized isolated Supabase environment. Do not use either
existing production project as a disposable test database, create real customer
invitations, send external mail, activate payments or reuse production users.
No new paid infrastructure was provisioned by this work.

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
