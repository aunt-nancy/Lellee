LELLEE — LIVE COACH DASHBOARD V2
Date: 2026-08-27

WHY V2
The prior Live Coach Dashboard bridge stopped because public.profiles does not
exist in the current Supabase database.

That table is NOT required for the coach dashboard to function.

V2 removes that hard dependency. Client/sender display labels now safely fall
back to the signed-in account email local-part (for example, "alex" from
alex@example.com) or a short generic client label.

RUN THIS CORRECTED FILE IN SUPABASE SQL EDITOR:
01_Coach_Dashboard_Live_Bridge_V2_2026-08-27.sql

Run it as ONE complete script.

IMPORTANT
Do NOT rerun the failed V1 SQL first. The failed V1 transaction stopped before
installation, so use V2 directly.

AFTER THE SQL SUCCEEDS
Upload / replace these GitHub-root files:
- index.html
- coach-dashboard-live.js
- coach-dashboard-live.css

UNCHANGED
- Coach Business Foundation is still required.
- Human approval is still required for coaching businesses.
- Coach payments remain OFF.
- Public coach marketplace remains OFF.
- Public multi-program launch remains OFF.
- Recovery is unchanged.
- Agent autonomy settings are unchanged.
- No journal, safety/crisis, diagnosis, or private recovery-history data is
  added to the coach dashboard.

OPTIONAL
02_Coach_Dashboard_Live_READ_ONLY_VERIFY.sql
