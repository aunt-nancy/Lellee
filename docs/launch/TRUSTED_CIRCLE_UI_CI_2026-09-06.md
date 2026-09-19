# Trusted Circle UI - CI follow-up, September 6, 2026

## Current status

Frontend implementation is saved in draft PR #12, `repair/trusted-circle-ui-20260906`; it has not been merged into main or released as the production interface. The scoped participant-label database migration is applied separately (version 20260906182544). No owner action is required for this checkpoint.
This note supplements `TRUSTED_CIRCLE_UI_2026-09-06.md`: that report describes the earlier local fixture execution. A subsequent GitHub CI execution is now verified below.

## GitHub CI verified

Tested commit: `5b64296b34380827bc1ee8d4f304d39cce838a1e`.
- Runtime Ownership Guard: run 34052886686, completed success.
- Lellee Circle UI Regression: run 34052886697, job 101539528351, completed success, including syntax, browser tests and evidence upload.
- `tests/trusted-circle/browser.py` extracts the actual owner, supporter and collaboration-operations sections from the repository index.html. It runs those sections with synthetic Supabase responses, not the complete app runtime.
- Browser evidence recorded `2026-09-06T18:49:01.804138Z`: **34 grouped passing runs, 17 categories at 1280x900 and 390x844**. These replace no real signed-in test. Do not add the earlier 34 local repeats to claim 68 distinct tested categories.
- Categories cover invitation consent/payloads, deliberate recipient/program selection, duplicate submissions, appointments/time conversion, practical requests, owner-only contact payload, sharing/history, supporter responses, safe text rendering, sign-out cleanup, delayed responses/account switches, visible request failures, wrong-project refusal, Admin gating and navigation cleanup.

The repository now includes `.github/workflows/lellee-circle-ui.yml`, `tests/trusted-circle/browser.py`, and `tests/trusted-circle/mock.js` to repeat this isolated CI check. Its HTML scaffold deliberately does not execute the rest of the site's JavaScript or prove full-site layout stability.
Artifact 9995087416, `lellee-circle-ui-evidence`, was downloaded and inspected; SHA-256 `f1f6c03c2a22243f3bf42cad1f3a66b2996220ba22dfff515ba64277a805d2ff` matched GitHub's artifact digest. It contains browser-results.json, desktop/phone-sized dialog screenshots and static-integration.json.

## Split environments independently confirmed

The CI static evidence confirms:
- index.html references ONLY the old Supabase origin `https://hkrrxscyhtxmbvxevfkw.supabase.co`.
- auth.html references the verified production origin `https://vnfjszmhmcxkxegzvivg.supabase.co`.
- The new Circle module checks for the verified production origin before requests.
This corroborates the earlier source read of the actual app createClient block. A successful isolated UI test or deployment build does not fix this integration blocker. Keep PR #12 draft until the main shared account client and schema dependencies are corrected and independently signed-in workflows pass.

## Code/data preservation

Artifact SHA-256 values match the locally tested/uploaded JS and CSS:
- trusted-circle.js: `50ee7b169736f769a8d16d8d5c6add396dfb636274e60b201a71394e31703c3e`.
- trusted-circle.css: `d88da6ce61f4a3df1e82b9c2e27cd9a00a05bd742b24cd830695bfa716a2001d`.
The original 2120-byte Circle CSS is unchanged as a prefix; scoped form/control rules are appended. No homepage/sidebar/logo artwork, global router, service worker or price file changed.
The 13 separately executed participant-label database groups passed at 18:33:13 UTC, with all synthetic accounts/relationships rolled back, one real user remaining and six original placement records unchanged. CI used no real accounts or database writes. No password, recovery email, paid membership or charge was created.

## Limits and next work

These are actual Chromium UI executions with mocked data, plus separate PostgreSQL role simulations. They are not real Supabase Auth-token sessions, full-app integration, Safari/device testing, concurrency/load testing or complete accessibility/security sign-off. Accept/Decline/Pause/Revoke/Leave controls are implemented, but not every button/lifecycle combination was separately browser-tested; the earlier database lifecycle tests remain separate evidence.
Next checkpoint: reconcile the main-app account connection and required schema, then run real authenticated integration using independent sessions before frontend release. PR #11 and database/source-history reconciliation remain necessary; do not blindly replay historical migrations.
Stripe/payment activation and password-reset Site URL/redirect remain deferred until the end. No other-device pairing. Preserve the approved layout, palette, logos, prices and broad Lellee positioning; Recovery is not the primary platform identity.
