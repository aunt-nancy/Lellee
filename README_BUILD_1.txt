LELLEE BUILD 1 — PUBLIC JOURNEY, ROUTING & ACCOUNT CREATION

PURPOSE
This build replaces the overloaded Start Your Journey flow with one broad dropdown,
a short optional explanation, one optional context screen, one recommended starting
point, and account creation only after the user chooses that path.

FILES
- BUILD_1_PUBLIC_JOURNEY.sql — path-specific intake storage, RLS, signup capture, and verification
- index.html — public Lellee homepage and journey/account flow
- landing.html — synchronized public landing copy
- master-landing.css — approved color-block design plus proportional header/card fixes
- master-landing.js — bilingual journey, routing, path intake, account creation, and speech-to-text
- vercel.json — preserves /app and /app/recovery as separate routes

INSTALL ORDER
1. In Supabase SQL Editor, run BUILD_1_PUBLIC_JOURNEY.sql.
2. In the GitHub repository root, upload the other five files together.
3. Keep the existing approved logo asset named lellee-approved-logo-final.jpg.
4. Commit directly to main and wait for the Vercel Production deployment to show Ready.
5. Test in a new InPrivate window.

WHAT CHANGED
- Simplified survey: one dropdown + short optional text
- Removed the unnecessary support-style question
- Optional context card retained
- One primary recommendation and no more than one related path
- Account creation/sign-in appears after the path is chosen
- Path-specific dropdowns collect only pertinent information
- English and Spanish journey/signup flow
- Tap-to-activate speech-to-text; Lellee does not retain audio
- Explicit user choice is required before a path starts
- Recovery remains a separate program at /app/recovery
- Lellee Home remains at /app
- Public root remains at /
- Welcome and Journey cards share a real proportional height
- Header/logo area is enlarged without transform-based scaling

TEST CHECKLIST
1. Open the public root.
2. Confirm the logo stays inside the taller header.
3. Confirm the Welcome card and Your Lellee Journey card end at the same height.
4. Start the journey and select Recovery.
5. Confirm there is no third support-style question.
6. Confirm only one primary starting point is shown.
7. Choose the starting point and confirm the account form appears.
8. Confirm Recovery-specific dropdowns appear.
9. Switch to Español and confirm the journey/account text changes.
10. Create a test account, confirm email if required, and verify /app opens first.
