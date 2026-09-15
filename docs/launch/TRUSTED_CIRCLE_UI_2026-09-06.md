# Lellee Trusted Circle interface checkpoint - September 6, 2026

## Status: implemented in a review branch, NOT merged into production

Branch: `repair/trusted-circle-ui-20260906`, based on main `e280cc9c4cd4b970fbcaac7c73504c0154c2041a`.
The branch contains a replacement `trusted-circle.js`, appended scoped controls in `trusted-circle.css`, and a participant-label migration. Main and the live frontend were not changed by this pass.
The lookup migration alone IS applied in Supabase project `vnfjszmhmcxkxegzvivg`: `circle_participant_labels_20260906`, migration-history version `20260906182544`.
Its required consent/content/dashboard database prerequisites were already applied and are tracked separately in security PR #11. This frontend branch does not contain those prerequisite migration files; reconcile source history before release, not by blindly replaying historical migrations.

## Concrete release blocker found

A direct read of main `index.html`, source lines 7390-7480, confirmed that the core app still creates its single Supabase client using project `hkrrxscyhtxmbvxevfkw`, not the verified production project `vnfjszmhmcxkxegzvivg`.
The same block exposes that client as `window.LelleeAuthContext.client` and still attempts profile operations; the expected `profiles` table is absent from the verified production inventory.
This is not a problem that can be solved by declaring the new Circle controls live. The new module intentionally refuses a wrong-project client before making Circle API requests. It does NOT create another competing client, change the Auth URL settings, or silently bypass this mismatch.
Do not merge this frontend change as launch-ready until the shared main-app client and its dependencies are reconciled and real signed-in integration tests pass.

## Implemented interface behavior

- Existing Trusted Circle, Supporter and Collaboration Ops section IDs/classes and existing site layout are reused. No index.html, navigation-owner runtime, logo asset, service worker, price or global palette was modified.
- One module instance and one Auth listener; canonical `lellee:pagechange` events rather than replacing `showPage`.
- Incoming invitations display Accept/Decline; accepted supporters can leave. Owners can pause/revoke relationships.
- Invitation UI states that the inviter's account email is visible to the recipient. These are in-app invitation records, not sent email notifications.
- Person and program are deliberate required choices, not an automatic first relationship or Recovery default. Disabled program options are omitted. General practical support is a separately labeled explicit choice for unscoped relationships.
- Owner-selected tasks, appointments and practical check-in requests use the restored table contracts. Practical requests do not read private daily_checkins, journals or safety information.
- Only the two fully implemented permission categories, selected tasks and selected appointments, are offered. Start/end windows, explicit consent and revocation are connected. Other advanced sharing categories are not falsely presented as complete.
- Existing grant records are not silently upserted or reactivated. Permission history requires an explicit selection/removal before replacement.
- Supporter task completion and check-in acknowledgment/replies call the narrow response RPC. Emergency contact records remain owner-only and never enable automatic contact.
- Native dialog forms, visible request errors, duplicate-submit suppression and text-node rendering of returned content.
- Data and unsaved dialogs are cleared on sign-out, account changes, navigating out, page hiding and unload. Request nonce/account checks prevent delayed former-account responses from repainting. No polling, automatic navigation, forced scrolling or new Supabase client.

## Participant lookup applied and tested

`get_my_circle_participants()` is a no-argument, fixed-search-path SECURITY DEFINER function. It returns counterpart account-email labels only for the verified caller's current own/incoming invited/active/paused unrevoked relationships with the correct inviter. There is no arbitrary user-ID/email query parameter and no unrelated Admin override. PUBLIC/anon execute are revoked; authenticated and service execution are explicit.
At `2026-09-06T18:33:13.626526Z`, 13 grouped PostgreSQL role/JWT-claim simulations passed:
- Four participants receive only the matching counterpart label.
- Outsider, unconfirmed account and unrelated Admin receive no directory.
- Active and paused labels are available; revoked, ended and declined labels disappear.
- Mismatched inviter and unconfirmed counterpart are hidden.
- Missing subject gets no labels; anonymous function execution is denied.
All six synthetic identities and relationships were rolled back. One real user remained and all six placement records had an unchanged data fingerprint. No real Auth token, password, recovery email, paid entitlement or charge was generated.
A test-harness CASE-expression syntax error was corrected before the passing execution; no production permission was weakened for the test.

## Executed offline browser verification

Final portable-harness rerun completed at `2026-09-06T18:46:38.326375Z`: **34 passing grouped runs = 17 categories at each of 1280x900 and 390x844**.
This used real local Chromium with a section-shaped HTML fixture and synthetic Supabase responses. It did NOT navigate the live deployment, use real Supabase Auth sessions/API tokens, exercise real HTTP integration, or run Safari/an actual iPhone. Database authorization and browser behavior were tested separately, not as an end-to-end authenticated flow.

Categories: single installation/listener; invitation disclosure/payload; required second-person/program selection plus duplicate submits; appointment timezone conversion; practical-request payload; private contact payload; implemented permission categories and invalid expiry; explicit grant-history removal; supporter acceptance; response RPC arguments; untrusted text rendering; sign-out cleanup; held response after account switch; visible connection errors/old-data removal; wrong-project guard; canonical Admin check; unrelated-page cleanup/no polling/page errors.
Both JavaScript syntax checks passed. Desktop and phone-sized dialog screenshots were inspected for fit. This does not certify full-site responsive layout or accessibility.
The portable test driver, synthetic fixture/mocks, exact JS/CSS, JSON results and screenshots are included in the conversation verification ZIP. These offline test files are not claimed to be GitHub Actions tests; CI status must be checked separately.

## Source fingerprints

| File | Git blob SHA | Bytes |
| --- | --- | ---: |
| trusted-circle.js | 2e62775e4e0c3270848296dd0c2e2dcad992194a | 27586 |
| trusted-circle.css | 4525debce8c3b715121408a345294eff5d6595c8 | 4717 |
| Original trusted-circle.css prefix | 92c6d91e969388c5b1ee5ea085dcdd9037b4492e | 2120 |

Uploaded blob hashes match the locally tested source. The original CSS remains an exact byte-for-byte prefix; 21 scoped CSS lines were appended. Code commits: `f70c88e1ae811e413228991e4248a4cfee4525ea` and `60b2587c169bd300da5a0133987d2d656c57bf8c`.

## Next checkpoint / carry-forward

Next: reconcile the main-app Supabase client and dependency inventory with the production environment, without introducing a second client or undoing the canonical navigation/logo stability repairs. Then verify the integrated Circle page with independent real signed-in sessions and desktop/iPhone acceptance before merging/production sign-off.
Current draft/review status must remain distinct from deployed frontend status. PR #11 and migration-history reconciliation remain open. Existing backend security tests do not certify the remaining coaching-membership, messaging, other signed-in RPC, uploads/storage or entitlement-lifecycle work.
Stripe connection/payment activation and password-reset Site URL/redirect remain explicitly deferred to the end. Other-device pairing is not needed. Approved prices, logo, palette, layout and broad Lellee support positioning remain locked; Recovery is not the platform's primary identity.

## Technical references

- Supabase Auth event handling: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
- Supabase database functions: https://supabase.com/docs/guides/database/functions
- MDN native dialog: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
