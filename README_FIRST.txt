LELLEE — BIG BUILD B: PRODUCTION & LAUNCH
Version 1.0.0-rc1

This combines the final three major builds:

4. DATABASE + ACCOUNT CONSOLIDATION
- Resolves the user_consents schema conflict by keeping consent history separate from current privacy preferences
- Correct support_contacts field handling
- Recovery-date history
- Data export
- Account-deletion request workflow
- Notification/reminder tables
- Push-subscription compatibility
- RLS hardening

5. QA + MOBILE + PWA
- Hardened service worker
- Offline app shell
- Install prompt wiring
- notification/deep-link routing
- accessibility skip link / visible focus
- release-candidate QA checklist
- diagnostics wiring

6. LAUNCH BUILD
- public landing page
- privacy / terms drafts for qualified review
- safety page
- preview and launch Vercel configurations
- pre-launch verification SQL
- Lellee.com cutover checklist
- secure replacement Edge Function for the postponed push-hardening/test step

INSTALL NOW
1. Run 17_GROUP_B_Production_Consolidation.sql in Supabase SQL Editor.
2. Run 18_PRELAUNCH_VERIFY.sql and review the results.
3. Upload the application/PWA files to GitHub and commit.
4. Keep the included vercel.json while testing. Do NOT switch to vercel.LAUNCH.json yet.
5. Use QA_RELEASE_CANDIDATE.txt.

PUSH TEST
The push end-to-end test remains postponed as requested. The secure replacement Edge Function and PUSH_HARDENING_LATER.txt are included for the final pre-launch push session.

DO NOT UPLOAD
- VAPID private key
- Supabase service-role key
- CRON_SECRET
No secret value is included in this package.
