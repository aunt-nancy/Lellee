LELLEE BUILD 2 — RECOVERY SHELL, NAVIGATION & READABILITY
===========================================================

PURPOSE
-------
Build 2 reorganizes the Recovery interface without changing the working
recovery records, journal data, meetings, goals, reviews, or Supabase tables.

FILES TO UPLOAD TO GITHUB
--------------------------
1. recovery.html                 (replace the existing file)
2. build-2-shell.css             (new)
3. build-2-shell.js              (new)
4. lellee-sidebar-logo.png       (new transparent light-on-dark approved artwork)

NO SQL IS REQUIRED FOR BUILD 2.

WHAT THIS BUILD ADDS
--------------------
- Accordion navigation grouped as:
  Daily
  Grow & Learn
  Connect
  Reflect & Track
  Find Support
  Account
- For You near the top and Lellee Plus near the bottom.
- Duplicate Community navigation removed from the visible menu.
- One expanded category at a time.
- Active category and page preserved.
- Current page restored after refresh when possible.
- Mobile navigation drawer using the same accordion.
- Larger, more readable interior text and controls.
- Transparent light-on-dark Lellee sidebar logo using the approved artwork.
- Speech-to-text controls on eligible free-text fields when the browser supports it.
- A working Expert-Guided Practices shell that Build 3 will populate fully.

DEPLOYMENT WORKFLOW
-------------------
1. Extract the ZIP.
2. In the Lellee GitHub repository choose Add file > Upload files.
3. Upload all four production files listed above.
4. Commit directly to main.
5. Wait for Vercel to show Ready / Production.
6. Confirm only that the deployment completed and the site loads.

Per the approved workflow, detailed quality checks are deferred until all six
builds have been completed and deployed.
