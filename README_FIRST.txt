LELLEE — RECOVERY PUBLIC STABILITY FIX — 2026-08-28

WHY THIS FIX EXISTS
Recovery was the last public support path still opening the full authenticated application shell while the visitor was only browsing. That shell loads many feature/admin/operations scripts after first paint, so the visible page could shift or jump even though the earlier menu loop was fixed.

WHAT CHANGED
- Public Recovery now opens a lightweight recovery-preview.html, using the same stability approach already proven for the non-Recovery public previews.
- Recovery still opens at Recovery > Today.
- Today, Your Journey, Learn, Tools, Resources and Meetings are browseable without an account.
- Personal actions such as Check-In, Journal, saved Progress, saved Meetings and saved support lists explain that an account is required.
- Account actions go to the full /app only when the visitor chooses Sign in/Create account.
- Old /app?browse=1&recommended=recovery links are redirected to recovery-preview.html before the heavy app starts.
- No async feature/admin scripts are loaded on recovery-preview.html, eliminating the source of unsolicited public-page jumping.
- No MutationObserver, polling timer, automatic scroll, Supabase dependency or browser-storage dependency is used on the Recovery public preview.

UPLOAD/REPLACE ONLY THESE 5 FILES IN THE GITHUB ROOT
1. index.html
2. landing.html
3. recovery-preview.html   (NEW)
4. service-worker.js
5. reset-lellee-cache.html

NO SUPABASE SQL.

LOGO PROTECTION
The approved landing/public logo remains /lellee-approved-logo-final.jpg with the locked responsive sizing. No transform scaling was added.
