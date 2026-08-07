LELLEE — DAY 2 SUPABASE-CONNECTED UPDATE

Deploy this folder to replace the current Vercel build.

NEW:
- Guided Day 2 interface
- Soft interaction styling
- Preview button on Today
- ?day=2 can open Day 2 for testing
- Day 2 responses save to public.guided_responses
- Stable prompt keys support Then & Now comparisons
- allow_recovery_story defaults to false

TEST:
1. Sign in.
2. Click Preview Guided Day 2 on Today, or open the deployed URL with ?day=2.
3. Make selections and save.
4. Supabase -> Table Editor -> guided_responses should show 7 rows for that user/date.
