Lellee stable navigation / no-jump repair — 2026-08-29

Purpose
- Stop the stronger visible page jumping reported after the prior main-thread repair.
- Keep the repaired vertical/side menu routing intact.
- Do not change the approved landing logo artwork, size lock, or landing-page visual design.

What changed
1. Removed forced window.scrollTo(0,0) from both the early fail-safe router and the primary router.
2. Added overflow-anchor:none to the app/page containers so browser scroll anchoring cannot move the viewport while Lellee updates dynamic content.
3. Preserved the single delegated data-page navigation handler and the bounded MutationObserver repair from the prior build.
4. Updated the service-worker/reset cache version so this repair is not masked by stale browser code.

Deployment
Upload every file in this ZIP to the repository root and replace matching files. Wait for Vercel to show Ready. Then open /reset-lellee-cache.html once.
