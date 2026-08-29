LELLEE — MAIN-THREAD FREEZE + MENU RESPONSE REPAIR
Date: August 28, 2026

CONFIRMED ROOT CAUSE
A body-wide MutationObserver used for the coach account-count privacy toggle changed its own label text inside the observer callback. That label replacement created another child-list mutation, which called the observer again. The cycle could continue without stopping, lock the browser's main thread, trigger “This page isn't responding,” and make the vertical/sidebar menus appear dead.

WHAT THIS BUILD CHANGES
- Replaces the self-triggering observer with a targeted, idempotent observer that reacts only to coach-dashboard content insertions.
- Prevents the observer from reacting to its own status-label update.
- Gives navigation one active owner after startup, while preserving the early fail-safe handler if the main app script ever stops before navigation initializes.
- Removes duplicate menu routing and immediate smooth-scroll work on each menu click.
- Retains safe localStorage/sessionStorage handling and hidden-overlay pointer protection.
- Bumps the service-worker version and expands the one-time cache reset to clear both current and historical Lellee session keys.

DESIGN LOCK PRESERVED
The approved landing logo asset, dimensions, transform, alignment, background treatment, and logo-related CSS were not changed.

UPLOAD THESE FILES TO THE GITHUB ROOT
1. index.html
2. landing.html
3. service-worker.js
4. reset-lellee-cache.html

No Supabase SQL is required.

AFTER VERCEL FINISHES DEPLOYING
Open https://www.lellee.com/reset-lellee-cache.html once. It will clear the old service worker/cache and return to the landing page. Then test the left sidebar, vertical menu, mobile menu, Caregiving preview, and Settings page.
