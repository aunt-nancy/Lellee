LELLEE PAGE RESPONSE + MENU FAILSAFE — 2026-08-28

PURPOSE
Restore responsive landing and app menus even when the Supabase CDN, browser storage, or optional feature modules are slow or unavailable.

UPLOAD TO THE GITHUB ROOT — replace these exact files:
1. index.html
2. landing.html
3. service-worker.js
4. reset-lellee-cache.html

NO SUPABASE SQL.

FIXES
- App navigation is bound by a dependency-free failsafe before Supabase or optional modules initialize.
- Supabase now loads without blocking the page.
- If Supabase is unavailable, Lellee remains usable in guest browse mode instead of crashing.
- Browser-storage failures no longer stop the app JavaScript.
- Optional feature scripts are ordered deferred downloads instead of sequential parser-blocking requests.
- Hidden overlays cannot intercept clicks.
- Landing menu links retain native hash navigation and remain clickable without Supabase.
- Existing program-selection context and browse-first behavior are preserved.

PROTECTED
- Approved landing logo asset and exact approved sizing are unchanged.

AFTER VERCEL SHOWS READY
1. Close every open Lellee tab.
2. Open https://www.lellee.com/reset-lellee-cache.html once.
3. Test the landing header menus.
4. Open /app?browse=1 and test Today, My Recovery, Tools and Journal.
