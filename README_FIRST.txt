LELLEE — FAIL-SAFE MENU + PAGE RESPONSE REPAIR
Date: August 28, 2026

WHY THIS REPAIR IS NEEDED
The app could stop executing before menu handlers were attached when:
1. old/corrupted browser data could not be parsed,
2. browser storage was blocked or unavailable, or
3. the external Supabase browser library did not load.
When that happened, every menu button looked dead even though the page was visible.

WHAT THIS BUILD DOES
- Installs a menu handler before storage/account initialization.
- Makes localStorage and sessionStorage failures non-blocking.
- Removes unreadable Lellee browser data instead of freezing the page.
- Allows guest browsing/menu navigation if account services are temporarily unavailable.
- Prevents hidden/mobile overlays and decorative landing layers from blocking clicks.
- Preserves the approved landing logo asset and sizing.

UPLOAD THESE FILES TO THE GITHUB ROOT
1. index.html
2. landing.html
3. service-worker.js
4. reset-lellee-cache.html

No Supabase SQL is required.

AFTER VERCEL IS READY
Open https://www.lellee.com/reset-lellee-cache.html once.
Then test the landing header menu and the /app sidebar/mobile navigation.
