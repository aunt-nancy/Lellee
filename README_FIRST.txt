LELLEE — APPROVED LANDING LOGO EXACT SIZE RESTORE — 2026-08-28

Recovered source-of-truth sizing from the previously approved landing CSS.

LOCKED HEADER LOGO VALUES
- Desktop: 260px x 72px
- Mid-size (<=1120px): 220px x 72px
- Mobile (<=560px): 185px x 64px
- Image transform: NONE
- object-fit: contain

CAUSE OF OVERSIZE
The prior lock incorrectly added transform: scale(1.9) on top of the correct-sized container.
That transform has been removed and explicitly blocked with transform:none!important.

UPLOAD TO GITHUB ROOT AND REPLACE:
1. landing.html
2. service-worker.js
3. reset-lellee-cache.html

No Supabase SQL is required.
After Vercel is Ready, open /reset-lellee-cache.html once.
