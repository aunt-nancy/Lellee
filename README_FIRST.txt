LELLEE — BUILD 6 DROPDOWN MENUS FINAL REPAIR
Date: August 28, 2026

PURPOSE
This package keeps the Build 6-era Recovery design and locks in working dropdown/accordion navigation.

DROPDOWN MENUS INCLUDED
1. Daily
   - Today
   - For You
   - My Recovery
2. Grow & Learn
   - Learn
   - Expert-Guided Practices
   - Tools
   - Recovery Paths
3. Connect
   - Meetings
   - Community
4. Reflect & Track
   - Journal
   - Progress
   - Calendar
5. Find Support
   - Resources
   - Inbox
6. Account
   - Workspaces
   - Search
   - Lellee Plus
   - Language & Accessibility
   - Settings
   - Help

HOW THE REPAIR IS PROTECTED
- Each dropdown is a native HTML details/summary control.
- The dropdowns open and close even if optional JavaScript does not run.
- JavaScript adds one-open-at-a-time accordion behavior, active-page highlighting, mobile drawer control, and accessible state syncing.
- No MutationObserver is used.
- No localStorage or sessionStorage is required for navigation.
- No Supabase or external library is required for navigation.
- No animated page-height observer or repeated re-render loop is used.

QA COMPLETED
- All 6 dropdowns opened on desktop.
- All 20 submenu items were present.
- Opening a dropdown closed the previously open dropdown.
- Tools navigation opened the Tools view and retained the correct open category.
- Journal opened the account-required prompt.
- Mobile menu drawer opened, Find Support expanded, and Resources opened.
- Native dropdowns opened and closed with JavaScript disabled.
- No JavaScript console or page errors occurred during the automated desktop/mobile test.

UPLOAD / REPLACE ONLY
1. recovery-preview.html
2. service-worker.js
3. reset-lellee-cache.html

NO SQL.
DO NOT replace landing.html or index.html.
The public landing-page logo files and sizing are untouched.

AFTER VERCEL SHOWS READY
1. Close every open Lellee tab.
2. Open https://www.lellee.com/reset-lellee-cache.html once.
3. Return to the landing page and select Recovery.
4. Test each dropdown category once.
