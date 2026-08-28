LELLEE — PUBLIC LANDING LOGO SOURCE + SIZE RESTORE
Date: August 28, 2026

ROOT CAUSE FOUND
The last two fixes mixed different logo assets with extra CSS overrides.
- The too-small version used /lellee-approved-logo.jpg, whose canvas makes the visible wordmark smaller inside the same header frame.
- The too-large version then added transform: scale(1.9), which overcorrected it.

THIS PACKAGE RESTORES THE ORIGINAL PUBLIC-LANDING COMBINATION
- Header logo asset: /lellee-approved-logo-final.jpg?v=20260814-1
- No added transform / no injected logo-size override
- Existing landing CSS remains the size source:
  Desktop: 260px x 72px
  <=1120px: 220px wide
  <=560px: 185px x 64px

UPLOAD TO GITHUB ROOT AND REPLACE ONLY:
1. landing.html
2. service-worker.js
3. reset-lellee-cache.html

NO SUPABASE SQL.
Do not upload earlier logo-size-lock packages after this one.
After Vercel shows Ready, open /reset-lellee-cache.html once.

LOCK RULE
Future routing, program, content, agent, coach, organization, or layout patches must not inject a .brand/.brand img override into landing.html and must not change the landing logo asset unless explicitly approved.
