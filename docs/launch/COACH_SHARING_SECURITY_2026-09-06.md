# Lellee coaching-sharing security checkpoint - September 6, 2026

## Scope and applied status

Two targeted migrations are applied in Supabase project `vnfjszmhmcxkxegzvivg`.
This pass repairs selected coaching snapshots and the Trust Center database response. It does not certify the entire coaching system or website.
No HTML, JavaScript, CSS, logo, palette, pricing, Stripe connection, Auth URL configuration, or other-device pairing changed.
Source tracking remains PR #11, `security/revoke-anon-secdef-20260906`; database application and GitHub merging are separate operations.
The prior `COACH_PRIVACY_GUARDRAILS.md` rule remains: clients explicitly select what to share; a coaching relationship does not itself grant direct access to private journals, check-ins, contacts, or full history. This migration grants no access to those private tables.

## Reproduced defects, before repair

At `2026-09-06T15:46:26.139315Z`, rollback-only synthetic database-role tests confirmed:
- A revoked coaching snapshot remained visible to the coach: 1 matching synthetic row.
- A snapshot remained visible after its coaching relationship ended: 1 matching synthetic row.
- An unrelated client could attach a snapshot to another client's relationship by supplying mismatched IDs.
No persistent coaching shares or coaching relationships existed before these tests. Only synthetic test contents were used, and all fixtures rolled back. These findings are not evidence of historical access to real shared records.
At `2026-09-06T15:49:55.836231Z`, a read-only authenticated-role test reproduced a separate Trust Center failure: SQLSTATE `42703`, `column "created_at" does not exist`. No account record contents were returned in the diagnostic.

## Applied corrections

`enforce_coach_share_revocation_20260906`, database history version `20260906154902`:
- Replaced the two permissive coaching-share policies with five operation-specific ownership/recipient policies.
- Recipient reads now require an unrevoked snapshot, matching relationship/client/program, active relationship without an end timestamp, and active membership in the relationship's coaching business.
- The snapshot must not predate the relationship start or current consent timestamp. Renewed consent does not automatically reactivate older snapshots; a new explicitly shared snapshot is accepted.
- New client shares must belong to the caller's own current relationship and program.
- The owner retains access to their own revoked/inactive-relationship history and can delete their own shares.
- Ordinary clients may edit only the permitted content fields of a currently shareable snapshot. They cannot change ownership, recipient relationship, program, creation timestamp, or revocation state.
- Existing owner-checked `revoke_my_shared_item(uuid)` remains the revocation path, including after a relationship ends. No new privileged RPC was added.
- Anonymous table privileges were removed; trusted service-role privileges were verified individually.

The existing active coaching-business-member recipient scope is preserved, not silently replaced with an assigned-coach-only model. Business membership administration requires its own authorization review.
Revocation denies subsequent database reads by recipients. It does not erase a copy someone previously downloaded or viewed; real browser-cache/session behavior remains untested.

`fix_trust_consent_timestamp_20260906`, database history version `20260906155037`:
- Replaced only the exact broken `user_consents` timestamp fragment in `get_my_trust_center()`.
- Reads `recorded_at` while preserving the `created_at` JSON response key expected by existing UI code.
- Function privileges were checked unchanged; both fixture clients could subsequently load their own Trust Center sharing response.

## Executed regression tests

Completed at `2026-09-06T15:52:26.431894Z`: **24 grouped checks passed**.
Source: `supabase/tests/launch_coach_share_revocation.sql`.
The script created six temporary synthetic identities (two clients, two business-owner coaches, one active colleague, one unrelated user), two synthetic businesses and relationships, and selected snapshots. The existing Admin was also checked without granting new privileges.
The test switched PostgreSQL to `authenticated` and `anon` roles and set distinct simulated JWT subject claims. It asserted role/identity before the ordinary-client and coach test groups.

| Test category | Passing groups |
| --- | ---: |
| Two clients: own-only reads, Trust Center, allowed edits/inserts/deletes, nine protected writes each, cross-user mutations | 10 |
| Two coaches and active colleague: correct business scope, read-only client snapshots | 3 |
| Unrelated user and platform Admin receive no automatic client-share access; Admin check preserved | 1 |
| Paused/ended/contradictory end-timestamp relationship states | 3 |
| Renewed consent hides older snapshots but permits a newly selected snapshot | 1 |
| Paused/removed/invited colleague membership | 3 |
| Owner revocation hides snapshot from both recipients and active Trust Center list; client undo denied | 1 |
| Owner can revoke/delete after relationship ends | 1 |
| Five anonymous table/RPC operations denied | 1 |
| Total | 24 |

All fixtures deliberately rolled back, including synthetic memberships and business-program rows.
Before/after counts were unchanged: 1 real Auth user; 0 coaching businesses, memberships, relationships, or shares; 0 paid entitlements.
The six original placement records remained, with their data fingerprint unchanged during tests.
No passwords, recovery emails, actual Auth tokens, paid memberships, or charges were created.

## Postflight and advisor

At `2026-09-06T15:54:30.989502Z`, the catalog confirmed 5 share policies, no anonymous share access, no client recipient/revocation-column updates, authenticated-only revocation RPC access, and 0 anonymously executable public-schema SECURITY DEFINER functions.
The corrected Trust Center function definition MD5 was `444bda72eea350929a85a5db6a782ab0`.
A fresh Security Advisor result at `2026-09-06T15:54:40.200Z` still had no anonymous SECURITY DEFINER or mutable-search-path warning. Existing signed-in function notices, `credential_types` policy absence, `pg_net` extension location, and disabled leaked-password protection remain review/configuration items; this is not an all-clear advisory report.

## Remaining work and carry-forward

These are PostgreSQL role/JWT-claim simulations, not real Supabase Auth-token sessions, browser tests, or an independent penetration test. Current client payload shape was exercised at SQL level, not through a real web request.
Trusted Circle relationship creation/acceptance, identity changes, share expiration, and revocation require a separate repair/test pass. Its current policies were inventoried but not changed here.
Coach business-membership management, messages/group participants, invitation lifecycle, and remaining signed-in RPCs still need review. Do not claim those are secured by this selected-snapshot repair.
Public-content write permissions and runtime Supabase-project consistency remain open from earlier findings. No storage buckets existed in the previous inventory; upload functionality remains unverified.
Real Admin UI actions, independent authenticated browser-session isolation, desktop/iPhone acceptance, migration-history reconciliation, and final launch sign-off remain open.
Stripe connection/payment activation and the password-reset Site URL/redirect are explicitly deferred by the user; do not request them during this database pass.
The approved design, colors, logo proportions, prices, and broad Lellee support positioning remain locked. Recovery is not the primary platform identity.
Use the checked-in migrations/tests and this checkpoint to continue; do not blindly replay historical migrations or equate Vercel build success with functional/privacy verification.

## Primary technical references

- Supabase RLS and per-operation access tests: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase column privileges: https://supabase.com/docs/guides/database/postgres/column-level-security
- Signed-in SECURITY DEFINER review: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- RLS without policies: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Extension placement: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
- Password security configuration: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
