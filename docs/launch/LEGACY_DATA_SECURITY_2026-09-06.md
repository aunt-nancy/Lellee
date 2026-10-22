# Lellee legacy-data security checkpoint — September 6, 2026

## Status and scope

The legacy private-record migration is applied to Supabase project `vnfjszmhmcxkxegzvivg`.
Three reviewed tables are now bound to stable account IDs and restricted by row ownership: `placements`, `user_progress`, and `user_subscriptions`.
The complete security review and launch sign-off remain open. This is a bounded database-security checkpoint, not an independent penetration test or a completed browser launch test.
No HTML, JavaScript, CSS, logo, approved pricing, Stripe connection, or Auth URL configuration changed in this checkpoint.

## Confirmed finding

Before correction, the three legacy tables had broad client privileges and unconditional PUBLIC policies.
A count-only query executed as the actual PostgreSQL `anon` role could see all six existing `placements` rows. The row contents were not displayed or exported during this audit.
This establishes that the database access path was permitted before the correction. It does NOT establish whether an outside person accessed the records; historical access-log review has not been completed.
`user_progress` and `user_subscriptions` each contained zero persistent rows at the time of the audit, but their broad permissions still required correction.
The earlier four-table isolation test did not include these legacy tables; its pass result did not certify them.

## Applied correction

Migration name: `bind_legacy_private_records_20260906`.
Supabase migration-history version: `20260906135925`.
Repository SQL: `supabase/migrations/20260906140000_bind_legacy_private_records.sql`.

The atomic migration:
- Added a non-null `user_id` foreign key and owner index to each of the three tables.
- Bound existing records only to unambiguous, confirmed accounts; it aborts instead of guessing an unmatched owner.
- Replaced the unconditional policies with authenticated, own-account access rules.
- Removed PUBLIC/anonymous table access and verified there were no remaining anonymous column privileges.
- Kept signed-in access to legacy subscriptions read-only. Trusted backend code, not a browser, controls subscription changes.
- Restricted editable placement/progress columns so a client cannot reassign ownership or issue a certificate.
- Added an INSERT-only compatibility trigger for older callers that supply `user_email` without `user_id`. It resolves a confirmed account, rejects a mismatched ID, and leaves RLS to enforce the caller's ownership.
- Preserved every pre-existing column/value. The placement timestamp trigger was disabled only inside the migration's locked transaction for backfill, then re-enabled before completion.

No legacy row was deleted and no paid entitlement was granted.
Owner binding is persistent: later email changes or reuse do not transfer previously bound records to another account.
Existing browser upsert payloads that try to update protected identity/certificate columns must be reviewed; those writes now correctly fail rather than weakening the policy for compatibility.

## Production postflight

Catalog postflight: `2026-09-06T14:00:01.241041Z`.
Final individual service-grant/role checks: `2026-09-06T14:05:59.505087Z`.

| Check | Result |
| --- | --- |
| Original placement records | 6 retained; all 6 bound to account IDs |
| Original placement columns and timestamps | Fingerprint unchanged |
| Persistent user progress rows | 0 |
| Persistent legacy subscription rows | 0 |
| Persistent paid entitlement rows | 0 |
| Real Auth users after tests | 1 |
| Anonymous read/write access to the 3 reviewed tables | Denied |
| Anonymous public-schema SECURITY DEFINER execution | 0 functions |
| Service-role SELECT / INSERT / UPDATE / DELETE | Each verified separately on all 3 tables |
| `anon` and `authenticated` roles | Neither superuser nor BYPASSRLS |

The original-column placement fingerprint before/after migration was `5bdcb7b693939525440a9d9822e00d81`.
This is a preservation check, not a backup export or evidence about historical access.

## Executed tests

Test completion: `2026-09-06T14:02:04.945866Z`.
Source: `supabase/tests/launch_legacy_record_isolation.sql`.
**21 grouped checks passed.** Tests used two temporary confirmed identities and one temporary unconfirmed identity, generated inside a deliberately rolled-back subtransaction.
The test actually switched PostgreSQL roles and set distinct simulated JWT subject claims; it checked the ordinary-user role/identity before exercising access.

For both ordinary identities:
- Each of the three populated fixture tables returned exactly one own row and zero other-user rows.
- Legacy email-only placement insertion bound to the correct account; own deletion and own placement/progress edits worked.
- Cross-user updates/deletion affected zero rows.
- Twelve forged-owner, ownership-change, certificate, and subscription write attempts were denied for each identity.

Additional checks:
- Fixture email change/reuse did not transfer record access between account IDs.
- An unconfirmed fixture account could not bind a new legacy record.
- The existing owner retained access to all six original placements and could not see the other users' fixture records.
- Anonymous SELECT failed on all three tables; five representative anonymous writes were denied.
- Fixture users and fixture records were rolled back. Existing placement data fingerprint and all checked persistent counts were unchanged afterward.
No password, recovery email, live Auth token, payment, or lasting test account was generated.

## Limits and remaining work

These are database-role/JWT-claim simulations, not real Supabase Auth sessions. An independent anonymous HTTP HEAD check was attempted on the three REST endpoints with the active publishable key, but the execution environment returned ConnectionError without an HTTP response. That attempt is unverified, not a passed or failed access-control test, and is not evidence the website is unavailable to visitors.
Storage catalog review found zero buckets, zero objects, and no storage policies. There was therefore no populated file-storage path to certify. Upload/storage functionality remains unverified.
Remaining signed-in authorization, sharing/revocation, public-content write controls, runtime Supabase-project consistency, and other private-table paths still need review before security sign-off.
Real Admin page functionality, real sign-in, independent browser-session isolation, and desktop/iPhone acceptance remain open.
Stripe connection and payment activation, and the password-reset Site URL/redirect configuration, remain explicitly deferred by the user. Do not request them again during this database pass.
Keep the current entitlement foundation's expiration, cancellation, and coaching-prerequisite tests open; the earlier tier-inheritance test did not cover those lifecycle cases.

## Carry-forward notes

Repository: `aunt-nancy/Lellee`; current security work is tracked in PR #11 on `security/revoke-anon-secdef-20260906`.
The separate `billing/current-entitlements-20260905` branch contains the already-applied entitlement foundation; do not imply its presence on main or replay historical migrations blindly.
The approved design, colors, logo proportions, pricing, and broad Lellee support positioning remain locked. Recovery is not the primary platform identity.
Other-device pairing remains out of this launch checklist.
Finish each bounded test with evidence; do not substitute a green Vercel deployment for functional or security verification.

## Technical references

- Supabase row grants and row-level policies: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase column-level privileges: https://supabase.com/docs/guides/database/postgres/column-level-security
- Supabase backend versus publishable key access: https://supabase.com/docs/guides/database/secure-data
