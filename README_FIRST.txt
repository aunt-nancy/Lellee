LELLEE — RECOVERY VERTICAL MENU RESTORE — 2026-08-28

PURPOSE
Restores the established dark, grouped Lellee Recovery vertical navigation after the lightweight Recovery preview regressed to a flat white sidebar.

UPLOAD / REPLACE ONLY
1. recovery-preview.html
2. service-worker.js
3. reset-lellee-cache.html

NO SUPABASE SQL.

PRESERVED
- Lightweight Recovery public-preview architecture and page-stability fix
- Current white content background and approved Recovery color palette
- Public browsing before account creation
- Private-feature account prompts
- Existing Recovery content and routes
- Landing-page logo asset and locked landing-page sizing (landing.html is not included or changed)

RESTORED SIDEBAR
- Dark navy Lellee sidebar
- Grouped Daily / Grow & Learn / Connect / Reflect & Track / Find Support / Account navigation
- Bright purple active item
- Need Help Now card linked to /safety.html
- Mobile drawer behavior
- No MutationObserver and no additional global navigation handler
