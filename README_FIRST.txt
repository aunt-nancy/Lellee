LELLEE PUBLIC PROGRAM PREVIEW + PAGE STABILITY FIX — 2026-08-28

WHY THIS BUILD EXISTS
The non-Recovery public preview was still running inside the very large Recovery application shell. That shell loads many older feature scripts, which can continue changing layout/navigation after the Caregiving preview appears. This is the most likely source of the continued visible page jumping.

THIS FIX CHANGES THE ARCHITECTURE INSTEAD OF ADDING ANOTHER PATCH ON TOP:
1. Non-Recovery public browsing now uses a small standalone program-preview.html page.
2. Recovery still uses /app and the existing Recovery application.
3. Old /app?recommended=caregiving-style public links immediately redirect to the stable preview before the large app starts.
4. The Caregiving cards act directly:
   - Caregiver Check-In -> clearly says account required and offers Create account / Sign in / Keep browsing.
   - Organize the Load -> clearly says account required and offers Create account / Sign in / Keep browsing.
   - Boundaries & Backup -> opens a public preview without requiring an account.
   - Find Caregiver Resources -> goes directly to a real Caregiving resource section without an extra dialog.
5. Caregiving resource links are actual browseable public starting points: 211, Family Caregiver Alliance, Eldercare Locator, and Caregiver Action Network.
6. The standalone preview has no Supabase dependency, no browser-storage dependency, no MutationObserver, no legacy Recovery feature bundles, and no service-worker registration script. That removes the main sources of public-preview layout churn.

UPLOAD/REPLACE IN THE GITHUB ROOT:
- index.html
- landing.html
- program-preview.html  (NEW)
- service-worker.js
- reset-lellee-cache.html

NO SUPABASE SQL.

LOGO PROTECTION
The approved public logo asset remains /lellee-approved-logo-final.jpg with no transform scaling. landing.html's logo markup/sizing was not changed. program-preview.html uses the same approved asset and the same 260x72 / 220px / 185x64 sizing pattern.

TEST AFTER VERCEL IS READY
1. Close all Lellee tabs.
2. Open https://www.lellee.com/reset-lellee-cache.html once.
3. Open the landing page and click Caregiving.
4. Confirm the Caregiving page stays still.
5. Click Find Caregiver Resources. It should move directly to the Caregiving resources section and show working resource links.
6. Click Caregiver Check-In. It should clearly tell the visitor an account is required and provide account/browse choices.
