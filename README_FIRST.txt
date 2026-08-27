LELLEE — ALL-SEVEN RUNTIME POLISH / INTEGRATION SPRINT
Date: 2026-08-27

This package does NOT replace recovery(6).html or rewrite the Recovery experience.
The existing full app already loads /pilot-runtime.js and /pilot-runtime.css.

UPLOAD TO THE GITHUB ROOT, REPLACING ONLY:
- pilot-runtime.js
- pilot-runtime.css

DO NOT replace index.html/recovery(6).html in this sprint.

WHAT THIS PACKAGE DOES
- Uses the existing My Lellee Programs page and Program Home runtime.
- Shows Recovery plus every explicit internal pilot enrollment.
- Keeps Recovery on its existing legacy Today renderer.
- Renders each non-Recovery program from existing program metadata, modules, stages and content.
- Adds a polished shared visual runtime rather than seven separate hard-coded sites.
- Saves pilot Today responses only to pilot_daily_responses for the signed-in user.
- Does not auto-advance stages, create streak pressure, score users, publish content, change launch settings, or expose programs publicly.
- Family Recovery uses the database-approved six-stage architecture already installed; the frontend does not redefine it.

OPTIONAL READ-ONLY CHECK
Run Lellee_All_Seven_Runtime_READ_ONLY_VERIFY_2026-08-27.sql in Supabase after deployment.
Expected protected values:
- recovery_legacy_renderer_enabled = true
- content_engine_v2_consumer_enabled = false
- public_multi_program_launch_enabled = false
