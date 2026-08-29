LELLEE — CAREGIVING INTERACTION + PAGE STABILITY FIX
August 28, 2026

UPLOAD TO THE GITHUB ROOT
1. index.html
2. service-worker.js
3. reset-lellee-cache.html

NO SUPABASE SQL REQUIRED.
DO NOT replace landing.html for this patch. The approved landing-page logo asset and sizing are intentionally untouched.

WHAT THIS FIXES
- Removes the self-triggering body-wide MutationObserver that could make the page jump/freeze.
- Removes duplicate app navigation activation that could make one click fire twice and jump the page.
- Uses one navigation path with a dependency-free fallback.
- Removes smooth-scroll animation from app page changes.
- Makes all four program-preview cards real buttons.
- Caregiving card behavior:
  * Caregiver check-in: explains that an account is required to use/save the private feature.
  * Organize the load: explains that an account is required to save a personal caregiving plan.
  * Boundaries & backup: opens a public preview and explains that an account is only needed to save personal choices.
  * Find caregiver resources: opens a public/shared Caregiving resource preview without requiring an account.
- Keeps non-Recovery shared resources program-neutral instead of dropping a Caregiving visitor into Recovery resources.

AFTER VERCEL IS READY
1. Close all open Lellee tabs.
2. Open https://www.lellee.com/reset-lellee-cache.html once.
3. Return to the landing page and select Caregiving.
4. Click each of the four Caregiving cards once. Each must respond.
5. Confirm the page no longer repeatedly jumps.
