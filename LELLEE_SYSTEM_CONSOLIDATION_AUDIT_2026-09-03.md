# Lellee System Consolidation Audit — 2026-09-03

## Purpose
This audit replaces piecemeal runtime repair with a single ownership model for the live `/app` shell. The visual design, palette, logo artwork, proportions, pricing, content model, and privacy rules are not being redesigned.

Production frozen before consolidation: `eec8e0bf06659bad437ce284e583c3962ad31944`.

## Executive finding
The persistent flicker/jumping is architectural. The live app loads a large legacy feature stack followed by Build 2–6 and several repair/hotfix layers. Multiple layers can react to the same navigation/startup event. The most damaging conflicts are direct page activation after the core router, forced scroll-to-top, runtime logo swapping, late DOM repair work on Today, and service-worker controller reloads.

## Canonical ownership model

| Subsystem | Canonical owner | Allowed dependents | Consolidation rule |
|---|---|---|---|
| Page activation/navigation | Core `index.html` router, exposed as `window.LelleeNavigatePage` | Feature page-load hooks | No other runtime may directly toggle `.page.active` during normal operation or force window scroll as part of navigation. |
| Page state / deep-link hash | One late guarded runtime boundary | Feature readers only | One bounded restore; no repeated startup restore loops and no body-wide class observer. |
| Sidebar/category state | `build-2-shell.js` | Core pagechange notification | Build once; update category from pagechange/click only; no `.content` mutation observer. |
| Logo / branding | Approved Lellee artwork via one transparent asset | Legacy URLs redirect to canonical asset | No runtime swap to the old Recovery rectangle; no competing physical-asset rewrite workaround. |
| Auth/session | Core `index.html` Supabase client + `window.LelleeAuthContext` | Feature modules may read bridge | No feature may become a second sign-in/session owner for `/app`; auth.html remains a standalone account-entry page only. |
| Startup | Core app boot + bounded feature initialization | Page-specific lazy loaders | No late Today-page injection; reduce shell-wide polling/repair work. |
| Observers | Component-scoped observers only | Specific dynamic controls | No whole-content/body observer for page state. Page activation uses the canonical pagechange signal. |
| Service worker | `/service-worker.js` | `/sw.js` compatibility bridge only | Current runtime registers canonical worker directly; no automatic `controllerchange` reload. |
| Cache policy | `vercel.json` + network-first worker | None | HTML, worker, legacy logo aliases, and unstable runtime assets must revalidate; legacy logo aliases redirect before filesystem delivery. |
| Late repair layer | Targeted delegated fixes only | Canonical router/session | No every-click repair sweep, no button cloning for navigation, no direct page activation, no Today layout injection. |

## Navigation ownership inventory
The repository contains at least the following files that redefine/wrap `showPage()` or contain bundled `showPage` wrappers. Most are loaded by the live `/app` shell and are therefore treated as feature hooks, not page-activation owners:

`lellee-v1.js`, `search-coverage.js`, `supply-chain.js`, `welcome-router.js`, `pwa-runtime.js`, `platform-integrity.js`, `staff-operations.js`, `universal-search.js`, `product-discovery.js`, `legal-privacy-safety.js`, `agent-operations.js`, `commerce-ops.js`, `lellee-plus.js`, `trusted-circle.js`, `trust-support.js`, `inbox-reminders.js`, `plus-features.js`, `community-peer.js`, `executive-intelligence.js`, `onboarding-help.js`, `program-builder.js`, `progress-core.js`, `scheduling-crm.js`, `security-continuity.js`, `release-reliability.js`, `paths-resources.js`, `analytics-insights.js`, `content-studio.js`, `admin-operations.js`, `coach-marketplace.js`, `automation-workflows.js`, `integrations-interop.js`, `forms-credentials.js`, `program-coach-core.js`, `platform-integration.js`, `resource-navigation.js`, `connections-progress.js`, `safety-privacy-core.js`, `partner-provider-network.js`, `organization-licensing.js`, and `personalization-experience.js`.

These wrappers commonly call the previous router and then load page-specific data. They are not permitted to perform a second page activation. The consolidation boundary guards re-entry and makes the core router the only activation source.

### Direct activation / scroll conflicts
High-impact conflicting owners found in the active stack:
- `build-2-shell.js`: directly toggles `.page.active`, forces `scrollTo(0)`, and previously performed click + delayed second activation.
- `consolidated-repair.js`: has a second direct activator/scroll owner and reruns repair work after every click.
- `lellee-final-repair.js`: has direct-activation fallback if the wrapper chain fails; retained only as a non-scrolling emergency fallback after consolidation.
- `build-5-professional.js`, `build-6-platform.js`, `pilot-runtime.js`: direct activation exists only as fallback when the core router is absent. In the live `/app` path the core router is present; these are classified as non-owning fallbacks.
- `master-app.js`: separate master-shell router; not part of the current `/app -> index.html` runtime and therefore classified as dormant legacy, not a live owner.

## Page-state / observer inventory
- `build-2-shell.js`: `.content` class observer for active-page/category updates; remove in favor of pagechange/click.
- `build-3-guidance.js`: `.content` page-class observer, auth-overlay observer, component observers; page observer should become pagechange-driven in a later module cleanup, while component observers remain scoped.
- `build-5-professional.js`: `.content` observer used only for Build 5 pages; non-critical fallback but monitored.
- `build-6-platform.js`: body child-list translation observer and content page-class observer; translation observer is component behavior, page detection should use canonical pagechange when refactored.
- inline coach account visibility observer: body child-list observer with a narrow mutation predicate; retained because it no longer rewrites its own trigger and is privacy-related.
- `same-page-refresh.js`: now contains a bounded page-only observer but is not referenced by the current `index.html`; classified as dormant and not a production owner.

## Auth/session inventory
### Canonical live owner
`index.html` creates `sb`, `currentUser`, `guestMode`, calls `sb.auth.getSession()` in `initSupabase()`, owns the in-app sign-in form, and publishes:

```js
window.LelleeAuthContext = {
  client: sb,
  getCurrentUser: () => currentUser,
  isGuest: () => guestMode
};
```

### Non-canonical readers / fallbacks
Feature modules that call `getUser()`/`getSession()` only as a fallback must prefer `LelleeAuthContext`. `journal-review-hotfix.js` and `lellee-final-repair.js` currently contain such fallbacks. They do not own the login UI but are recorded for future cleanup.

### Separate/dormant auth paths
- `auth.html`: standalone account-entry page; allowed only as a separate entry surface that hands off to `/app`.
- `master-app.js`/`home.html`: older master shell with independent auth logic; not loaded by current `/app` and must not be reintroduced into the active route.

## Startup inventory
A repository scan found many independent `setInterval` loops waiting for `currentUser`, including modules in `lellee-v1.js`, `welcome-router.js`, `inbox-reminders.js`, `progress-core.js`, `program-coach-core.js`, `platform-integration.js`, `organization-licensing.js`, `legal-privacy-safety.js`, and Build 6. Most load hidden-page data after auth. They are retained as compatibility readers in this controlled consolidation, but they are not permitted to change the active page or Today layout.

The high-impact visible startup changes are being removed now:
- Build 2 runtime logo swap.
- Build 2 delayed second activation + forced scroll.
- Consolidated repair Today-page promo injection.
- Consolidated repair every-click DOM repair sweep.
- PWA automatic controller-change reload.

## Logo/branding root cause
The live shell initially requests `lellee-approved-logo-final.jpg`, while `build-2-shell.js` later changes the same element to `lellee-approved-logo-locked.png`. Those are two different physical files. Vercel rewrites aimed at physical file names did not eliminate the conflict. This explains the visible white/blue alternation.

Canonical action:
1. Use `lellee-approved-logo-transparent.svg` directly for the sidebar shell. It preserves the approved artwork and masks only the white background.
2. Stop Build 2 from requesting `lellee-approved-logo-locked.png`.
3. Replace legacy logo rewrites with HTTP redirects to the canonical transparent asset so the browser never receives the old physical asset when a legacy URL is requested.
4. Do not alter logo sizing CSS, palette, artwork, or proportions.

## Service worker / cache inventory
- `/service-worker.js`: network-first/no-store; deletes old caches during activation; canonical worker.
- `/sw.js`: compatibility bridge importing `/service-worker.js`; retain for previously installed clients only.
- `pwa-runtime.js`: currently registers `/sw.js` and automatically reloads on `controllerchange`; change to register `/service-worker.js` directly and do not reload the app automatically.
- `vercel.json`: current legacy-logo behavior uses rewrites; change to redirects and add explicit revalidation headers to the worker/compatibility route and canonical logo.

## Late repair inventory
- `consolidated-repair.js`: currently performs navigation cleanup, targeted feature fixes, a Today-page professional promo injection, body-wide copy changes, and an every-click repair pass. This is a conflicting late owner and will be reduced to targeted delegated feature fixes only.
- `journal-review-hotfix.js`: scoped delegated Journal control; no navigation ownership. Retain.
- `lellee-final-repair.js`: late functional fixes for pricing/billing/language/journal/recovery review. Retain functional fixes but do not treat its fallback direct activator as a normal router.
- `lellee-pricing-update.js`: canonical price corrections, no observer. It will also establish the final guarded navigation boundary after all legacy page hooks have loaded.

## Controlled production acceptance gates
Before production merge:
1. Branch diff contains no design/palette restyle and no `index.html` rewrite.
2. Sidebar has one logo source; legacy logo URLs redirect to it.
3. Build 2 contains no `scrollTo` page activation and no content page-state observer.
4. Consolidated repair contains no Today promo injection, no direct activator, and no every-click repair sweep.
5. PWA runtime contains no automatic controller-change reload and registers `/service-worker.js` directly.
6. Final router boundary is non-reentrant and emits one `lellee:pagechange` signal after a completed navigation.
7. Vercel preview for the exact consolidation head is successful.
8. Compare against frozen production is reviewed before merge.
9. Production merge is followed by a second Vercel status check and a new checkpoint branch.
