# Lellee Trusted Circle security checkpoint - September 6, 2026

## Applied status and scope

Applied to production Supabase project `vnfjszmhmcxkxegzvivg`: `trusted_circle_consent_boundary_20260906`, migration-history version `20260906170528`.
Source: `supabase/migrations/20260906180000_trusted_circle_consent_boundary.sql`.
Repeatable tests: `supabase/tests/launch_trusted_circle_consent.sql`.
GitHub tracking: PR #11, branch `security/revoke-anon-secdef-20260906`. Applying the database migration is separate from merging this PR; the PR remains open at this checkpoint.

This is a bounded database consent/permission repair, NOT certification that the complete Trusted Circle feature, site security, or launch is finished.
No frontend HTML, JavaScript, CSS, logo, palette, pricing, Stripe setup, Auth URL settings, or device pairing was changed.
No private journal, message, safety, full-history or other content-table grants were added.

## Source of truth and reproduced findings

The approved-build artifact `TRUSTED_CIRCLE_FAMILY_CAREGIVER_DELEGATED_ACCESS_SUPER.sql` was retrieved from the user's Library and read in full (572 source lines). Its invitation/acceptance function contracts, owner revoke control, time-limited sharing, program scopes, and exclusion of private journal/messages/safety/full history guided this repair. Its old permissive policies were not replayed.
The live repository's `trusted-circle.js` calls invitation, relationship-revocation and summary functions. The production foundation had only four Trusted Circle tables and the share-revocation function, not the complete SUPER build.

At `2026-09-06T17:00:35.633817Z`, rollback-only synthetic PostgreSQL role/JWT-claim tests reproduced all five findings:
- A future-dated share was visible to its supporter: 1 synthetic row.
- An expired share was visible: 1 synthetic row.
- A revoked share was visible: 1 synthetic row.
- A supporter could replace the relationship's owner: 1 synthetic row updated.
- A supporter could fabricate an active connection to another owner: 1 synthetic row inserted.

There were zero persistent Trusted Circle relationships or shares. Findings demonstrate defects with synthetic data, not historical access to real Trusted Circle records. All baseline fixtures rolled back.

## Corrections

### Invitation, acceptance and identity

Restored the previously missing `invite_trusted_circle_member(text,text)`, `accept_trusted_circle_invitation(uuid)`, and `revoke_trusted_circle_relationship(uuid)` entry points with caller checks. The invite function creates an invitation record; it does not send email or automatically share content.
The owner and invited supporter must have verified accounts. The owner cannot accept on the supporter's behalf. Active role validation and self-invite rejection are enforced.
Duplicate account-level invites return the existing pending/active relationship without resetting accepted consent. A partial unique index protects the NULL-program case. The invite path serializes matching invitations with a transaction advisory lock.

`respond_trusted_circle_relationship(uuid,text)` enforces an explicit state/actor matrix:
- Invited supporter: accept or decline a pending invitation.
- Owner: pause an active relationship or revoke a pending/active/paused relationship.
- Accepted supporter: leave an active/paused relationship.
- Unrelated user, including an Admin not party to the relationship: no consent/owner-action override.

These operations lock the relationship row. The existing named accept/revoke functions are SECURITY INVOKER wrappers around the checked state function. All six touched/added functions have fixed empty search paths and explicit privileges.
Direct browser relationship insertion, deletion and updates are denied. A supporter cannot replace the owner, recipient, role or consent timestamps, or set their own connection active.

### Sharing, time and revocation

A new permission record must match the relationship owner, accepted active relationship, and applicable program. An INSERT-only trigger locks the relationship, validates the share, and stamps server creation time. Browsers cannot update existing consent/permission records or supply protected creation/revocation state.
Recipient reads require an active, unrevoked share whose start time has arrived and whose expiration has not arrived. They also require the matching owner/supporter/program, an active role/scope, an accepted active unrevoked relationship, and a share created after its current acceptance.
The owner retains their own permission history and can remove their own grants. The existing Admin read-only oversight of relationship and permission METADATA is preserved; it does not convey access to private content or the ability to fabricate another person's acceptance.

Pausing the relationship hides permission records from the supporter. Re-inviting a paused/ended/revoked/declined relationship clears the old acceptance and revokes prior permission records; renewed acceptance alone never restores old grants. A fresh explicit owner grant is needed.
Relationship revocation, supporter decline/exit, and re-invitation also invalidate paused/expired grants rather than only rows marked active. Individual share revocation handles non-revoked owner grants, including paused/expired rows. Repeated revocation does not grant or restore anything.

Allowed permission categories remain selected tasks, appointments, goals, milestones, progress snapshots, referrals and document metadata. Attempts to grant raw `journal_content`, `private_messages`, `safety_activity` or `full_history` through Trusted Circle are rejected. No underlying selected-content access path is certified by these metadata tests.
Program foreign keys now RESTRICT deletion rather than setting program IDs to NULL, preventing a program-specific permission from silently becoming unscoped. No program was deleted during the test.

Anonymous access and browser UPDATE/TRUNCATE privileges were removed from all four existing Trusted Circle tables, including the role/scope lookup catalogs. Trusted service CRUD grants were checked separately per operation.

## Executed tests and evidence

Full corrected regression completed at `2026-09-06T17:10:53.847368Z`: **43 grouped checks passed**.
Tests created six temporary identities (two owners, two supporters, an outsider and an unconfirmed account), used the existing Admin for a read-only authorization check, and switched to actual PostgreSQL authenticated/anon roles with simulated JWT claims. Ordinary role/identity assertions guarded the main access tests.

| Test category | Passing groups |
| --- | ---: |
| Two owner/supporter invitation and acceptance paths | 4 |
| Four identities: isolated reads and 11 protected-write denials each | 8 |
| Forged shares/private scopes, invalid input, supporter limitations | 3 |
| Outsider isolation and preserved Admin metadata oversight | 2 |
| Seven invalid share-time/status cases plus exact start boundary | 8 |
| Nine invalid/inactive relationship or consent cases | 9 |
| Paused role and paused scope | 2 |
| Valid program scope; wrong/null program and invalid time range rejection | 1 |
| Re-invitation, revocation/history, decline/leave lifecycle flows | 3 |
| Missing subject claim and nine anonymous calls | 2 |
| Program foreign-key deletion behavior checked structurally | 1 |
| Total | 43 |

Test development note: an initial full harness failed an exit assertion because it combined a mutating function and a read inside the same SQL expression. A separate-statement exit smoke test passed. The checked-in corrected harness separates lifecycle mutation results from subsequent reads and then passed all 43 groups. No database permission was weakened to satisfy that test. Failed and successful test transactions retained no fixtures.

Before/after counts were identical: 1 real Auth user; 0 Trusted Circle relationships; 0 Trusted Circle permission records; 0 paid entitlements. All six original placement records and the role/scope lookup values had unchanged fingerprints after the tests. No password, recovery email, live Auth token, payment or lasting account was created.

Catalog postflight at `2026-09-06T17:13:16.666485Z` confirmed:
- Zero anonymously executable public-schema SECURITY DEFINER functions.
- All four Trusted Circle tables have RLS; no anonymous table/column access, no signed-in UPDATE or TRUNCATE.
- Five client lifecycle entry points are signed-in callable; anonymous calls are denied.
- The share-validation trigger function is not directly executable by ordinary signed-in users.
- The three restored original lifecycle function names exist; program-delete RESTRICT constraints are present.

## Remaining functionality - next checkpoint

The following expected production components are still MISSING, confirmed by catalog postflight (NULL `to_regclass`/`to_regprocedure` results):
- `get_my_trusted_circle_summary()`, `get_my_supporter_dashboard()`, `get_collaboration_operations_summary()`.
- `trusted_circle_shared_tasks`, `trusted_circle_shared_appointments`, `trusted_circle_checkins`, `trusted_circle_emergency_contacts`.
- `program_collaboration_settings`, `trusted_circle_guardrails`.

Next work should restore these approved feature components with per-operation ownership and consent checks, not blindly replay the old SUPER-build policies. The approved interface also needs its invitation acceptance/decline and sharing controls connected and tested. Existing layout, logo, colors and public positioning remain locked.
These missing dependencies are functional launch blockers for the full Trusted Circle page; this repair must not be described as a working end-to-end Trusted Circle launch.

## Limits and launch carry-forward

These were database-role simulations, not real Supabase Auth tokens, HTTP/browser sessions, or independent penetration testing. Concurrent-client stress tests, browser cache behavior, invitation notification delivery, abuse/rate limits and real end-user acceptance remain unverified. Revocation blocks later database reads; it cannot erase a copy already viewed/downloaded.
A fresh Security Advisor scan was not used as an all-clear here. Prior signed-in-function notices and the remaining credential_types, pg_net and password-security configuration findings remain review items. Catalog-level anonymous access was explicitly rechecked.

Other outstanding launch work remains: coaching business-member administration, messaging/group permissions and other signed-in RPCs; public-content write controls; full runtime Supabase-project consistency; storage/uploads; entitlement expiration/cancellation/coaching prerequisites; real Admin actions, independent browser-session isolation and desktop/iPhone acceptance.
The billing entitlement foundation was applied on its separate branch; do not imply its presence on main or automatically replay historical migration files. PR #11 records applied security changes; source merging and production database migration history still need reconciliation.
Stripe connection/payment activation and the password-reset Site URL/redirect remain expressly deferred until the end. Other-device pairing is not required. Recovery is not the primary platform identity.

This long launch thread now has source-controlled handoff notes for each security checkpoint. Use these records on the next continuation so completed repairs, limitations, approved design and deferred owner actions are carried forward without restarting the audit.

## Primary technical references

- [Supabase database functions and privileges](https://supabase.com/docs/guides/database/functions)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL row-security policy semantics and concurrent access](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
