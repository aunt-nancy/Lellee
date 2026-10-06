# Coaching index and routing checkpoint

## User-approved boundary

- Coaching has its own `coaching/index.html`.
- Successful coach login defaults directly to `/coaching/index.html#coach-dashboard`.
- Signup opens that dashboard only when authentication has produced a session; email confirmation is not bypassed.
- Consumer `index.html`, `/app`, Recovery, Today, and consumer routing are outside this change.
- Client personal data is not automatically granted to coaches. Sharing must be user-initiated and relationship-scoped.
- Same-backend authentication is not authorization to read consumer data.

## Change scope

New independent Coaching index and its own runtime. Existing Coaching CSS, logo assets, and feature bundles are reused; no consumer navigation or runtime is loaded. Login/signup HTML changes only version the Coaching auth script. Auth return targets are restricted to this Coaching index. The older `coach-workspace.html` forwards to the Coaching index, not the consumer app.

## Reproduced defect

The prior `coach-workspace.js` account-count MutationObserver observed the content subtree and unconditionally set a descendant label's textContent in its callback. A browser reproduction hit the test cap of 1,000 self-triggered callbacks without any external changes. The new runtime uses explicit count-toggle updates and does not install that observer. Removing the disclosure panel or changing only the CDN loader had not addressed this defect.

## Local validation

16 headless Chromium DOM tests passed, 0 failed. Authentication/backend responses, feature bundles, and navigation were simulated; browser network navigation is blocked in the local test environment. These are not real-account end-to-end tests.

Covered: signed-in default dashboard; dashboard for accounts without a practice; signed-out redirect; invalid session; backend failure; responsive count toggle and page navigation; legacy /app returns rejected; public-home returns rejected; external returns rejected; consumer hashes and normalized traversal rejected; signup with session; signup pending confirmation; 12-second stalled-session error.

## Not certified by these tests

Actual customer login over the network, every legacy Coaching feature, payment activation, database sharing/revocation policies, and live desktop/mobile acceptance remain separate checks. No database authorization, grant, RLS, payment, or marketplace flag changes were made here. Do not report a successful deployment as proof that those checks passed.

## Source checkpoint

Pre-change main: 2d317901e0c48bb982279e8fbced97ffd862988b.
Consumer index must remain byte-for-byte unchanged.
