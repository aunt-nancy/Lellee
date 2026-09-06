# Lellee security checkpoint — September 6, 2026

## Scope and status

Database permission hardening is applied to Supabase project `vnfjszmhmcxkxegzvivg`.
The anonymous SECURITY DEFINER execution gate passes. The complete security and launch checkpoints remain open.
This record summarizes direct catalog queries, inspected function definitions, SQL role-simulation tests, and Supabase Security Advisor results from this session; it is not an independent penetration test.
No frontend HTML, JavaScript, CSS, logo assets, pricing, Auth URL settings, or Stripe configuration was changed in this security branch.

## What was corrected

The initial migration revoked direct EXECUTE from `anon`, but 74 functions still inherited EXECUTE through `PUBLIC`. The original finding was 75 anonymously callable public-schema SECURITY DEFINER functions; the initial revocation closed only one.
The follow-up migration removes both PUBLIC and anon execution, verifies preservation of authenticated/service grants, and fails transactionally if an anonymous RLS-policy dependency or unexpected grant/body change is detected.
The internal `enqueue_automation_event(text,uuid,text,uuid,text,jsonb)` helper was inspected separately. It accepts arbitrary subject/scope IDs and lacks caller authorization. No direct frontend or other public-function callers were found in the audited source/catalog. Authenticated EXECUTE was therefore removed from that helper as well; trusted service/owner execution remains.
Both `update_updated_at()` and `set_updated_at()` only assign NEW.updated_at = now(). Their search paths were fixed to pg_catalog without changing their bodies.
The six inspected Admin mutation RPCs already enforce `is_lellee_admin()` before their operations. An execution-grant warning alone does not establish that an ordinary caller can perform an Admin action.

Applied migrations:
- `revoke_anon_security_definer_20260906` — initial direct-grant removal.
- `close_inherited_function_grants_20260906` — inherited-grant correction and reviewed internal-helper/utility hardening.

Source files:
- `supabase/migrations/20260906_revoke_anon_security_definer.sql`
- `supabase/migrations/20260906110000_close_inherited_function_grants.sql`
- `supabase/tests/launch_security_role_isolation.sql`

## Verified production postflight

Catalog verification: 2026-09-06T10:45:13.453878Z.

| Check | Result |
| --- | --- |
| Public-schema SECURITY DEFINER functions inspected by catalog query | 78 |
| Anonymously executable after both migrations | 0 |
| Authenticated execution grants | 75; only the reviewed internal enqueuer intentionally lost signed-in access in the follow-up |
| Service-role execution grants | 78 |
| Existing real users after checks | 1 |
| Existing Admin-role rows | 1 |
| Persistent paid-entitlement rows | 0 |
| Both timestamp utility functions | search_path=pg_catalog |

The aggregate fingerprint of all 78 SECURITY DEFINER definitions was unchanged before/after: `00c35c3a972612fc1f12e716276637e7`. This confirms unchanged function implementations for that set, not a full database backup.

## Executed two-user database tests

Test completion: 2026-09-06T10:46:35.285205Z. **18 grouped results passed.**
The test generated two temporary random fixture identities, assigned one a synthetic Premium entitlement and the other Plus, and actually switched PostgreSQL to the authenticated role with distinct simulated JWT subject claims.
It asserted current_user and auth.uid() before testing to avoid accidentally testing as the privileged database owner.

For each fixture:
- `user_entitlements`, `user_privacy_mode`, `program_enrollments`, and `user_program_state` each returned exactly one own row and zero rows belonging to anyone else.
- The ordinary-user Admin check returned false.
- Premium implied Plus access; Plus did not imply Premium; neither implied Journal Companion or Coach.
- Five direct Admin-role/paid-access write attempts were denied.
- Six Admin mutation RPCs rejected the caller with `Admin access required`: pilot enroll/remove, coach-business review, credential review, organization review, and organization-license review.

Additional checks:
- The existing active Admin still passed the canonical server-side check and could read only its own role-table row.
- Five representative anonymous RPC calls were denied at the permission boundary, including an Admin function, invite acceptance, entitlement check, and queue helper.
- The entire fixture subtransaction was deliberately rolled back. Real user count remained 1 before/after; paid-entitlement count remained 0 before/after. No fixture users, fixture enrollments, or paid access were retained. No passwords, emails, or actual charges were created.

**Limit:** these were PostgreSQL role/JWT-claim simulations, not real Supabase Auth token or browser sessions. Coverage is limited to the four populated tables and named checks; it does not certify all private tables, storage, all signed-in RPCs, all Admin page actions, or all billing lifecycle states.

To rerun, use the checked-in SQL test as the trusted database owner only after reviewing its fixtures/triggers against the target database. It requires the existing platform tables, an active Admin, and the separate current-entitlements foundation already present in the audited production database. Do not run it automatically against an incomplete fresh schema.

## Fresh Security Advisor verification

Advisor observation time: 2026-09-06T10:48:26.629Z.
No anonymous SECURITY DEFINER execution warnings or mutable function-search-path warnings remain.
Remaining items include:
- Authenticated SECURITY DEFINER notices: review actual internal authorization and trigger usage; do not revoke legitimate signed-in RPC access merely to remove notices. The six named Admin guards passed negative tests, but the remaining callers still need review.
- `credential_types`: RLS enabled with no policy; determine the intended read scope before granting anything.
- `pg_net`: extension in public schema; review dependencies and supported relocation before modifying.
- Leaked-password protection disabled: owner Auth configuration remains deferred.

## Deferred and unresolved launch items

Stripe connection/payment activation and the password-reset Site URL/redirect configuration are explicitly deferred by the user.
Real sign-in/password recovery, two independent authenticated browser sessions, broader private-table/storage isolation, Admin UI functional verification, desktop/iPhone acceptance tests, and final launch sign-off remain open.
Further entitlement work must validate expiration/cancellation and coaching prerequisites before any billing activation. The current tier-inheritance tests do not cover those cases.
The billing foundation has been applied to the database but is still tracked on a separate billing branch. Migration-history reconciliation and full runtime Supabase-project routing are not certified by this checkpoint; do not blindly replay the repository's historical migrations.

## Official references and remediation guidance

- [PostgreSQL REVOKE and inherited PUBLIC privileges](https://www.postgresql.org/docs/current/sql-revoke.html)
- [Supabase database function permissions](https://supabase.com/docs/guides/database/functions)
- [Authenticated SECURITY DEFINER review](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [RLS enabled without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- [Extension in public schema](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
- [Password-security settings](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
