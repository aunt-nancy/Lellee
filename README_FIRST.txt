LELLEE — PROGRAM SELECTION ROUTING FIX
Date: August 28, 2026

PURPOSE
Fixes the bug where selecting Caregiving, Reentry, Housing Stability, or another Lellee support program opened Recovery > Today.

WHAT CHANGES
- The selected public support path is preserved from the landing page into /app.
- Recovery still opens Recovery > Today.
- Non-Recovery selections open a program-specific browse/preview page instead of Recovery > Today.
- The preview clearly remains in the selected program context.
- Recovery-only navigation is hidden while browsing another support path.
- Browsing does not require an account.
- Sign-in remains required only for private saved/personalized features.
- This does NOT publicly activate the unfinished multi-program journeys or change Supabase launch gates.

UPLOAD TO GITHUB ROOT
1. index.html
2. service-worker.js
3. reset-lellee-cache.html

Replace the existing files with these exact names. No Supabase SQL is required.
After Vercel is Ready, open /reset-lellee-cache.html once, then select a non-Recovery program from the landing page and confirm the selected program opens.
