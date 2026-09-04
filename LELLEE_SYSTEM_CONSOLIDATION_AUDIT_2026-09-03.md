# Lellee System Consolidation Audit — 2026-09-03

## Purpose
This is the as-built ownership record for the Lellee `/app` runtime consolidation. It replaces piecemeal repair as the governing architecture for navigation, page state, branding, auth/session, startup behavior, observers, service workers, caching, and late repair code.

The visual design, palette, logo artwork, proportions, approved sizing, pricing, content model, safety rules, and privacy rules were not redesigned.

**Production frozen before consolidation:** `eec8e0bf06659bad437ce284e583c3962ad31944`

## Executive finding
The persistent dashboard flicker and white/blue logo alternation were architectural, not one isolated CSS bug. The active `/app` shell loads a large legacy feature stack followed by Build 2–6 and several repair/hotfix layers. Multiple layers could react to the same startup/navigation event.

The highest-impact conflicts were:

1. Build 2 changed the sidebar logo after initial paint from `lellee-approved-logo-final.jpg` to the separate physical file `lellee-approved-logo-locked.png`.
2. Build 2 could navigate by clicking an existing control and then directly activating the page again 25 ms later.
3. Build 2 and the late consolidated repair each had their own direct `.page.active` activator and forced scroll-to-top behavior.
4. The late consolidated repair reran DOM repair after every click and injected additional content into Today after initial render.
5. PWA runtime registered the compatibility worker `/sw.js` and automatically reloaded the app on `controllerchange`.
6. Dozens of feature modules wrap `showPage()` to load page-specific data, producing a long legacy hook chain around the original core router.
7. Historical logo lock metadata still named the old blue PNG as the approved runtime asset.
8. The previously edited `same-page-refresh.js` is not referenced by the active `index.html`; therefore that earlier repair could not be the primary production fix.

## Canonical ownership model after consolidation

| Subsystem | Canonical owner | Allowed dependents | Enforced rule |
|---|---|---|---|
| Page activation | Core `index.html` router plus final guarded boundary in `lellee-pricing-update.js` | Legacy feature hooks | One public, non-reentrant navigation entry. Feature hooks may load data but may not perform a second shell activation. |
| Page state / hash | Final guarded runtime boundary | Read-only feature listeners | One active page is mirrored to the URL hash. One bounded deep-link restore only; no repeated startup restore loop. |
| Sidebar/category state | `build-2-shell.js` | `lellee:pagechange` and click notifications | Sidebar builds once; no `.content` page-state MutationObserver and no delayed second activation. |
| Logo / branding | `lellee-approved-logo-transparent.svg` using the approved source artwork | Legacy logo URLs are aliases only | No JavaScript may request the old blue PNG. Legacy JPG/PNG URLs redirect to the canonical transparent asset. |
| Auth/session | Core `index.html` Supabase client + `window.LelleeAuthContext` | Feature modules may read the bridge | `/app` has one session/login owner. `auth.html` is a separate entry surface only. Dormant `master-app.js/home.html` must not return to the active `/app` route. |
| Startup | Core app boot + bounded feature initialization | Hidden/page-specific data loaders | No late Today promo injection; no every-click repair sweep; no worker-controlled automatic page restart. |
| Page-change signaling | Final guarded runtime emits `lellee:pagechange` | Build 2 and consolidated modules subscribe | New code uses this signal. Legacy Build 3/5/6 page-class observers remain compatibility **readers only** and are not activation owners. |
| Component observers | Individual component modules | Their own component DOM only | Allowed when they respond to scoped component changes. They must not own page activation. |
| Service worker | `/service-worker.js` | `/sw.js` compatibility bridge only | Current runtime registers `/service-worker.js` directly; no automatic `controllerchange` reload. |
| Cache/routing | `vercel.json` + network-first/no-store worker | None | App HTML, worker entry points, canonical logo and unstable runtime files revalidate. Legacy logo aliases use redirects, not rewrites. |
| Late repair layer | Targeted delegated feature fixes only | Canonical router/session | No direct shell activator, no forced scroll, no Today injection, no navigation-button cloning, no whole-app repair sweep. |
| Regression prevention | `.github/workflows/lellee-runtime-ownership-guard.yml` | Future PRs/pushes | Syntax and ownership checks must pass before runtime changes are accepted. |

## Navigation inventory
The repository contains many modules that redefine/wrap `showPage()` or bundle such wrappers. Most are loaded by the current `/app` shell. They are classified as **legacy page-load hooks**, not page-activation owners:

`lellee-v1.js`, `search-coverage.js`, `supply-chain.js`, `welcome-router.js`, `platform-integrity.js`, `staff-operations.js`, `universal-search.js`, `product-discovery.js`, `legal-privacy-safety.js`, `agent-operations.js`, `commerce-ops.js`, `lellee-plus.js`, `trusted-circle.js`, `trust-support.js`, `inbox-reminders.js`, `plus-features.js`, `community-peer.js`, `executive-intelligence.js`, `onboarding-help.js`, `program-builder.js`, `progress-core.js`, `scheduling-crm.js`, `security-continuity.js`, `release-reliability.js`, `paths-resources.js`, `analytics-insights.js`, `content-studio.js`, `admin-operations.js`, `coach-marketplace.js`, `automation-workflows.js`, `integrations-interop.js`, `forms-credentials.js`, `program-coach-core.js`, `platform-integration.js`, `resource-navigation.js`, `connections-progress.js`, `safety-privacy-core.js`, `partner-provider-network.js`, `organization-licensing.js`, and `personalization-experience.js`.

The final guarded runtime captures this legacy chain once, calls it once per navigation so page-specific data hooks still work, prevents re-entry from creating a second simultaneous activation, then emits the canonical page-change event.

Scripts loaded after the final boundary were checked for router redefinition. The late coach/organization/agent entry modules request navigation through existing page controls or the current global router; they do not replace the canonical `showPage` boundary.

## Direct activation conflicts and disposition

### `build-2-shell.js` — neutralized
Previously:
- requested `lellee-approved-logo-locked.png` after initial paint;
- had its own direct `activatePage()`;
- forced `window.scrollTo({top:0})`;
- clicked an existing page control and then activated the page again after 25 ms;
- watched `.content` class changes for page state;
- watched auth-overlay class changes for page restoration.

Now:
- uses the single canonical transparent logo source;
- delegates navigation to the canonical router;
- has no forced scroll;
- has no delayed second page activation;
- has no `.content` page-state observer or auth-overlay page-restoration observer;
- updates sidebar/category state from the canonical page-change signal and user navigation events.

### `consolidated-repair.js` — reduced to targeted feature compatibility
Previously:
- contained a second direct page activator and forced scroll;
- cloned navigation controls;
- injected a professional promo into Today after initial render;
- performed settings/nav cleanup after load;
- ran a repair sweep after every click.

Now:
- no direct shell activation;
- no forced scroll;
- no Today injection;
- no navigation-button cloning;
- no every-click repair sweep;
- retains only delegated handlers for specific learning, Then & Now, story, recovery review, support-network and language actions.

### `lellee-final-repair.js` — retained as compatibility code
It contains an emergency direct-activation fallback in its own helper, but in the current live `/app` path the core/global router exists before it loads. The final guarded boundary is installed after it. Therefore that fallback is classified as dormant compatibility code, not normal navigation ownership.

### Build 5 / Build 6 / `pilot-runtime.js` — fallback-only direct activation
These contain direct DOM activation only when `showPage` is absent. In the active `/app` shell `showPage` is present; their direct fallback is not the normal execution path.

### `master-app.js` — dormant legacy shell
It contains a separate master-shell router/auth sequence, but current Vercel routing maps `/app` to `index.html`, not `home.html`. It must not be reintroduced into the active route without a new architecture review.

## Observer inventory

### Canonical page-state signal
The final guarded runtime emits `lellee:pagechange` once after a completed navigation. Build 2 and the consolidated compatibility layer now use that signal.

### Legacy read-only page observers
Build 3/5/6 still contain class observers that detect when one of their pages becomes active so they can render/load that feature. They do **not** own the active-page class in normal operation and are classified as read-only compatibility listeners. The runtime ownership guard prevents the known shell-level competing behaviors from returning.

### Component-scoped observers retained
Examples include voice-input enhancement, tool-body cleanup, For You rhythm wiring, translation/component insertion, and the privacy-first coach account-count visibility observer. These respond to their own component DOM and are not page-activation owners.

### `same-page-refresh.js`
It is present in the repository but is not referenced by the active `index.html`. It is dormant and has no production runtime ownership.

## Auth/session inventory

### Canonical `/app` owner
`index.html` owns:
- the Supabase client;
- `currentUser` and guest state;
- session lookup;
- the in-app sign-in form;
- sign-out;
- the `window.LelleeAuthContext` bridge.

Feature modules may read `LelleeAuthContext`. Fallback `getUser()`/`getSession()` reads in older modules are compatibility reads and are not a second login UI owner.

### Separate entry/dormant paths
- `auth.html` is allowed as a standalone account-entry surface that hands off to `/app`.
- `master-app.js/home.html` are older master-shell files and are not the current `/app` target.

## Startup inventory
Many legacy feature modules independently wait for `currentUser` and hydrate their own hidden/page-specific data. The current consolidation does not delete all feature hydration; it prevents those modules from becoming shell-navigation/logo/reload owners.

The visible shell-level startup conflicts removed in this build are:
- runtime blue-logo swap;
- delayed second activation;
- forced scroll navigation;
- late Today-page promo insertion;
- whole-app repair sweep after clicks;
- service-worker automatic controller-change reload.

## Logo/branding root cause and final rule
The live shell initially requested `lellee-approved-logo-final.jpg`, then old Build 2 changed the same element to `lellee-approved-logo-locked.png`. They are different physical files, which produced the visible white/blue alternation.

Final rule:
1. Canonical runtime asset: `lellee-approved-logo-transparent.svg`.
2. Approved source artwork: `lellee-approved-logo-original.jpg`.
3. Build 2 and final runtime normalize the sidebar to the canonical asset only.
4. `/lellee-approved-logo-final.jpg` and `/lellee-approved-logo-locked.png` are HTTP redirect aliases to the canonical asset.
5. `LELLEE_MASTER_LOGO_LOCK.json` now names the canonical transparent asset and prohibits JavaScript from assigning the legacy aliases.
6. Artwork, colors, proportions, sizing and placement remain locked; only the white-background treatment is transparent for dark-shell use.

## Service worker and cache consolidation

### Canonical worker
`/service-worker.js` is network-first/no-store for same-origin requests, clears historical caches during activation and claims clients. Version is `lellee-system-consolidation-2026-09-03-v1`.

### Compatibility worker
`/sw.js` remains only as a bridge for clients that registered it in earlier releases.

### PWA runtime
Now registers `/service-worker.js` directly. A controller change updates status but does not reload the page. Reload occurs only when the person explicitly chooses the Update App action.

### Vercel routing/cache
`vercel.json` now:
- keeps `/app` and `/app/:path*` rewritten to `/index.html`;
- uses redirects, not rewrites, for both legacy logo aliases;
- applies no-cache/no-store revalidation to `index.html`, `landing.html`, both worker entry points, the canonical logo, and the consolidated runtime files.

## Automated regression guard
`.github/workflows/lellee-runtime-ownership-guard.yml` runs JavaScript syntax checks and ownership assertions. It fails if future changes reintroduce any of the following:
- Build 2 legacy blue-logo assignment;
- Build 2 forced scrolling;
- Build 2 auth-overlay page-restoration observer;
- late-repair forced scrolling;
- late Today promo injection;
- old every-click repair sweep;
- PWA registration of `/sw.js` as the current worker;
- PWA automatic reload on controller change;
- missing canonical runtime boundary;
- stale approved pricing;
- incorrect consolidated worker version/network policy;
- logo rewrites instead of redirects;
- missing `/app -> /index.html` rewrite;
- master logo metadata pointing away from the canonical transparent asset/source artwork.

## Validation performed before production merge
- Frozen production backup created: `backup/main-before-system-consolidation-20260903`.
- Consolidation isolated on `consolidation/system-runtime-20260903`.
- No `index.html` rewrite in the consolidation diff.
- No CSS/design/palette file changed.
- Runtime ownership guard run #1: **success**.
- Runtime ownership guard run #2 including canonical logo metadata: **success**.
- Vercel deployment on the guarded consolidation head: **success**.
- Connected Vercel deployment-detail API did not expose this Git-connected project/deployment by ID even though the GitHub Vercel integration reported successful deployments. Therefore source/configuration, GitHub Actions syntax/ownership checks and GitHub’s Vercel deployment status are the automated pre-merge gates available in this environment.

## Production acceptance rule
The controlled consolidation is acceptable for merge only when:
1. the final compare remains limited to the audited runtime/configuration/documentation files;
2. the final branch head is Vercel-successful;
3. the runtime ownership guard is successful for the last runtime-affecting commit;
4. production merge is followed by a Vercel-success check and a new checkpoint branch.
