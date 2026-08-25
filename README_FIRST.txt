LELLEE BUILD 6 — PUBLIC PREVIEW RESTORE
August 24, 2026

WHY THIS FILE
The live index.html had been replaced by an older simplified release candidate.
This root index.html restores the full approved Build 6 master while preserving
the current public-preview constraints.

RESTORED FROM BUILD 6
- Full Resources finder
- Search resources field
- Recovery Path dropdown
- Access dropdown
- Full resource type filters including Housing and Employment
- Later Build 6 sections and scripts
- Approved Build 6 interface/behavior

PUBLIC PREVIEW PRESERVED
- No forced account login for browsing
- Account creation disabled
- Subscription signup disabled
- same-page-refresh.js remains active
- Existing beta sign-in logic is sign-in-only if used

DO NOT CHANGE / DO NOT UPLOAD
- Do not replace landing.html
- Do not replace vercel.json
- Do not replace same-page-refresh.js

MANUAL DEPLOY
1. In GitHub, open the Lellee repository root.
2. Upload/replace ONLY index.html from this package.
3. Commit directly to main.
4. Wait for Vercel deployment to show Ready.
5. Open a fresh InPrivate window.
6. Confirm www.lellee.com opens the landing page.
7. Explore Lellee -> Resources.
8. Confirm Search, Recovery Path dropdown, Access dropdown, and type filters are back.
9. Open Journal and refresh; it should remain on Journal.
10. Verify account creation and subscriptions are still unavailable.

ROLLBACK
Revert only the GitHub commit that replaced index.html.
