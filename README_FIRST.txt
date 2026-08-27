LELLEE ROOT + LANDING DESIGN RESTORE — 2026-08-27

UPLOAD ALL FIVE FILES TO THE ROOT OF THE SAME GITHUB REPOSITORY CONNECTED TO WWW.LELLEE.COM:

1. landing.html
2. master-landing.css
3. master-landing.js
4. service-worker.js
5. vercel.json

Replace the existing files with these exact filenames.

WHAT THIS FIXES
- lellee.com / www.lellee.com opens the public landing page, not Today.
- /app opens the authenticated application/index.html.
- Removes the broad catch-all route that could send public URLs to Today.
- Clears stale service-worker caches and prevents the app shell from replacing the landing page.
- Restores the matching approved landing HTML/CSS design pair.
- landing.html includes its own CSS and JS, so a missing/mismatched asset cannot leave it unstyled.
- Shows the top six topics in published demand order as colorful tiles.
- Shows remaining topics as compact links/buttons.
- Keeps the broken public survey overlay bypassed; Start Your Journey currently opens /app.

AFTER VERCEL SAYS READY
1. Open https://www.lellee.com/landing.html once. This installs the corrected service worker.
2. Then open https://www.lellee.com/ in a new tab.
3. The root must show the landing page. Today must appear only at /app after login.
