LELLEE MENU + NAVIGATION REPAIR — 2026-08-28

PURPOSE
Fix menu/navigation controls without changing the approved landing-page logo.

UPLOAD TO GITHUB ROOT — replace these exact files:
1. index.html
2. landing.html
3. service-worker.js
4. reset-lellee-cache.html

NO SUPABASE SQL.

REPAIRS
- Landing top navigation section links now explicitly scroll to their correct sections.
- Landing mobile menu closes after a menu selection.
- Start Your Journey opens the Lellee journey survey again instead of being hijacked directly into /app.
- App sidebar/bottom-menu buttons use delegated click handling so dynamic menu controls continue to work.
- Mobile hamburger now opens the navigation drawer instead of incorrectly acting like a Settings button.
- Escape closes the mobile drawer.
- Program-selection query context remains preserved.

PROTECTED / UNCHANGED
- Landing logo asset remains /lellee-approved-logo-final.jpg?v=20260814-1
- Landing desktop logo frame remains 260px x 72px, no transform.
- <=1120px remains 220px wide.
- <=560px remains 185px x 64px.
- No unrelated visual redesign.

AFTER VERCEL = READY
Open https://www.lellee.com/reset-lellee-cache.html once, then test the landing navigation and app/sidebar menus.
