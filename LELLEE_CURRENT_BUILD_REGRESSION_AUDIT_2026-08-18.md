# Lellee Current Build Regression Audit

**Audit date:** 2026-08-18  
**Base package inspected:** `LELLEE_AUTH_STABILITY_MASTER_LOGO_LOCK.zip`  
**Known later patch lineage considered:** Public Master Brand Logo Patch → Approved Public Visual Restore → Header/Hero Alignment Fix.

> No corrective code is included in this audit. This report identifies what the one consolidated correction must address.

## Findings

| Severity | Area | Status | Canonical requirement | What the audit found | Consolidated action |
|---|---|---|---|---|---|
| **CRITICAL** | Master /app shell | **FAIL** | The package must contain every local file its Vercel routes reference. | `vercel.json` routes `/app` to `/home.html`, but the full package is missing: home.html, master-app.js, master-app.css. | Restore the approved master shell (`home.html`, `master-app.js`, `master-app.css`) into the single consolidated release, then version it with the current auth/branding rules. |
| **CRITICAL** | Version consistency | **FAIL** | Do not mix new HTML with leftover older repository JS/CSS. | Because `/home.html` and master-app assets are missing from the replacement package, Vercel/GitHub can continue serving older repository copies while Recovery uses newer files. | Ship one complete replacement set and remove dependency on leftover repository files. |
| **CRITICAL** | Authentication ownership | **FAIL** | One coherent login experience; returning Recovery should not encounter two independent auth boots. | Recovery has its optimized auth owner, while the older master shell still contains its own `signInWithPassword`, `getSession`, and blocking `Promise.all(loadProfile/loadTopics/loadEnrollments)` flow. | Unify the master shell with the current authenticated session contract; do not make the master shell re-authenticate or block on its own boot. |
| **HIGH** | Login performance | **PARTIAL PASS** | Recovery auth should enter the shell immediately and hydrate secondary data in background. | Current Recovery file has one `signInWithPassword`, one `getSession`, no `onAuthStateChange`, and background hydration behavior. The stale master shell can still block on three loads. | Preserve Recovery fast-auth behavior and bring the master shell onto the same session contract. |
| **CRITICAL** | Returning-user onboarding | **FAIL** | Completed onboarding/interview must not restart for an existing Recovery profile. | Current Recovery contains both `onboardingOverlay` (1) and `finalOnboardingOverlay` (1); it calls FinalOnboarding.check 60ms after shell entry. | Resolve existing profile/onboarding state before deciding to open onboarding, and skip all intro/interview overlays for a configured returning user. |
| **HIGH** | Navigation efficiency | **FAIL** | Returning Recovery path should be sign in -> last Recovery page or Today; My Journeys is optional. | Live behavior reported by user required Welcome -> View My Journeys -> Continue Recovery, and first attempt restarted interview. | Make Recovery the direct continuation for an enrolled returning Recovery user; keep Home/My Journeys accessible but not mandatory. |
| **MEDIUM** | Start Your Journey route | **KNOWN / TABLED** | Start Your Journey should begin the interview once and then proceed into the selected journey. | User reported Start Your Journey returned to the landing page. | Keep tabled until the consolidated correction, then fix routing after the approval ledger is applied. |
| **HIGH** | Public branding | **PARTIAL / NEEDS LIVE VERIFY** | Public pages use master Lellee artwork; Recovery-specific dark mark stays inside Recovery. | The full master-logo build over-applied a Recovery-specific asset; later Public Visual Restore corrected public `index.html`/`landing.html` to approved public artwork. | Consolidate the corrected public asset split into the final release rather than relying on layered patches. |
| **HIGH** | Public header logo | **NEEDS LIVE VERIFY** | Logo must be prominent and tagline legible but contained fully inside header. | Earlier exact proportional CSS used transform scaling and later bled into the hero; latest alignment patch removed transform bleed but has not been explicitly user-approved in live view. | Use real container sizing, no overflow bleed, and verify visually at desktop/tablet/mobile before release. |
| **HIGH** | Public hero / Journey alignment | **NEEDS LIVE VERIFY** | Hero card and Your Lellee Journey tile align cleanly in the approved hierarchy. | User reported live misalignment after prior proportional restore. Latest alignment CSS is distributed but not user-confirmed. | Verify and lock final top/bottom alignment after applying the canonical visual hierarchy. |
| **MEDIUM** | Home cache policy | **FAIL** | Master app shell should not be held stale after replacement. | Current `vercel.json` does not include a specific `/home.html` no-cache/no-store header: False. | Add explicit no-cache/no-store for `/home.html` and `/app` in the consolidated deploy. |
| **PASS** | Pricing | **PASS** | Use only latest pricing. | Current full package contains all latest price markers: {'$5.99': True, '$59.99': True, '$14.99': True, '$149': True, '$4.99': True, '$49.99': True, '$19.99': True}; stale $3.99/$39.99 scan: none. | Preserve exact pricing; do not reintroduce old Stripe sandbox amounts. |
| **PASS** | Coaching account count privacy | **PASS IN RECOVERY BUILD** | Account/client count hidden by default with On/Off switch. | `recovery.html` includes the Show account count control and Off-by-default wording; latest visibility implementation was designed to start hidden per session. | Preserve; verify in production coach dashboard. |
| **PASS** | Agent security files | **PASS IN PACKAGE** | R3–R13 access control, permissions, consent, user control center, and admin operations remain present. | Required latest agent control files present: {'lellee-agent-access-control.js': True, 'lellee-agent-permissions.js': True, 'lellee-agent-control-center.js': True, 'lellee-admin-agent-operations.js': True, 'lellee-coaching-message-consent.js': True}. | Preserve and verify production DB/functions/kill switches separately. |
| **MEDIUM** | Growth-agent implementation | **PENDING** | Latest architecture names Viral, Social, Marketing/Growth, Prospecting, Analytics/Optimization distinctly. | The architecture is approved, but not every named growth role has been verified as a distinct production agent in the current package/database. | During consolidated correction, preserve existing agent security and verify which named roles are actually instantiated before claiming them live. |
| **MEDIUM** | Stripe production | **DEFERRED** | Paid plans may only be treated live after production Stripe/webhook/entitlement verification. | Pricing/checkout code exists, but prior QA/cutover gates require final production verification. | Run Stripe production gate after UI/auth regression correction; do not infer readiness from UI alone. |
| **MEDIUM** | AI crawler edge enforcement | **DEFERRED** | AI crawler blocking must be enforced at edge/WAF, not robots alone. | Architecture and documentation are present; actual production edge configuration has not been verified in this audit. | Verify Cloudflare/WAF/edge controls at go-live gate. |
| **MEDIUM** | Legal / regulatory launch gate | **DEFERRED** | Qualified legal/privacy/clinical review remains a production gate. | Build includes legal/privacy/safety notices, but that does not certify compliance. | Complete review before public production launch. |

## Highest-priority regressions

1. **The full replacement package is missing the master `/app` shell files while Vercel still routes `/app` to `home.html`.**
2. **The deployed architecture can therefore mix the new Recovery build with the older master-app shell.**
3. **That older shell has its own login/session boot and waits on multiple data loads, while Recovery has a separate optimized auth owner.**
4. **Recovery still contains two onboarding systems, and onboarding is checked before background profile hydration finishes.**
5. **The returning-user journey is too long and can restart the interview.**
6. **Public logo/hero corrections were layered as separate patches, so the final consolidated build needs one authoritative public CSS/logo state rather than a patch stack.**

## What is already clean in the current full package

- Latest pricing markers are present; no `$3.99` / `$39.99` strings were found in the full package scan.
- Recovery itself has one password sign-in call, one session lookup, and no external `onAuthStateChange` listener.
- Latest agent access-control / permissions / coaching-consent / user-control / admin-control files are present.
- Coaching account-count privacy control exists in Recovery and is designed to start hidden.

## Do not fix piecemeal

The next code release should be one consolidated build created from this ledger, with a full regression pass before deployment.
