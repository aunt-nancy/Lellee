LELLEE — EXACT RECOVERY SIDEBAR MICRO-FIX — 2026-08-28

THIS IS NOT A REDESIGN.
It starts from the already approved/locked Recovery navigation package and changes only the items the user explicitly requested.

EXACT CHANGES
1. Dark-background sidebar logo: increased by exactly 1 CSS point (1pt = 1.333 CSS px).
   - Same image asset.
   - Same 232px sidebar.
   - Same center alignment.
   - No transform scaling.
2. Vertical dropdown menu: flattened.
   - No raised/open-category card.
   - No category border or filled open-state panel.
   - No outer shadow on the active submenu row.
   - A subtle nested guide line and flat inset active indicator preserve clarity.
3. Public wording cleaned.
   - No visible “Build 6” wording.
   - Visible “Public Preview” and internal build wording removed; customer-facing exploration language used instead.
   - Cache-refresh page uses customer-facing wording.

PROTECTED / UNCHANGED
- Approved six dropdown groups and all submenu offerings.
- Native details/summary dropdown reliability.
- Desktop sidebar width, background, placement, and hierarchy.
- Need Help Now / Get Help Now.
- Approved iPhone/Android bottom navigation: Today | Journey | Explore | Tools | Help.
- Mobile drawer behavior.
- Browse-before-account rules.
- Page-stability architecture.
- Landing page and landing-page logo.

UPLOAD / REPLACE ONLY
1. recovery-preview.html
2. service-worker.js
3. reset-lellee-cache.html

NO SQL.
DO NOT REPLACE landing.html OR index.html.
