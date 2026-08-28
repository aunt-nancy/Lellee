LELLEE — FINAL GITHUB DEPLOYMENT PACKAGE
Date: 2026-08-27

STATUS
- Final consolidated Build 1 of 3: Agent Operations — complete
- Final consolidated Build 2 of 3: Coach Operations — complete
- Final consolidated Build 3 of 3: Organization + Workspaces — complete
- This package is the final GitHub/Vercel deployment batch.

IMPORTANT
Upload the CONTENTS of this folder to the ROOT of the exact GitHub repository connected to www.lellee.com.
Replace files with the exact same filenames. Do not allow GitHub/browser uploads to create names such as index(1).html or vercel(1).json.

UPLOAD / REPLACE ALL FILES IN THIS PACKAGE.

PUBLIC ROOT ROUTING
- Keep index.html. It is the cumulative authenticated Lellee Today application.
- / redirects to /landing.html through vercel.json.
- /app rewrites to /index.html.
- Do not rename index.html to landing.html.

WHAT THIS DEPLOYMENT CARRIES FORWARD
- Final 17-agent Command Center UI
- Final Coach professional entry, live dashboard and operations UI
- Final Organization front door, live dashboard and operations UI
- Unified Personal / Coach / Organization / Admin workspace switcher
- Existing approved Recovery experience and pricing in the cumulative index
- Corrected public landing-page routing

AFTER GITHUB UPLOAD
1. Open Vercel and wait for the matching deployment to show Ready.
2. Open https://www.lellee.com/reset-lellee-cache.html ONCE.
3. Then test https://www.lellee.com/
   EXPECTED: public Lellee landing page.
4. Test https://www.lellee.com/app
   EXPECTED: authenticated Today application (or sign-in flow if signed out).
5. Test Coach professional entry and Coach Dashboard.
6. Test Organization entry and Organization Dashboard.
7. Test workspace selector near Sign Out.
8. Test Admin / Agent Command Center.
9. Test mobile navigation and Sign Out.

DO NOT TURN ON DURING THIS DEPLOYMENT
- public multi-program launch
- coach payments/payouts
- organization payments
- public coach marketplace
- autonomous agent outreach/publishing/financial actions

SUPABASE SQL
No additional SQL migration is required by this GitHub deployment package if Final Builds 1, 2 and 3 were already successfully run.

SUPABASE DYNAMIC-WORKER
The Build 1 dynamic-worker update is not duplicated here. If it was already deployed during Build 1, leave it alone.
