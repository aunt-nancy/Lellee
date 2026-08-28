LELLEE — COACH PROFESSIONAL ENTRY INTEGRATION
Date: 2026-08-27

UPLOAD THESE THREE FILES TO GITHUB ROOT:
1. index.html              (replace current app index)
2. coach.html              (replace current professional front door)
3. coach-entry-router.js   (new)

WHAT THIS FIXES
The professional coaching front door previously sent every coach to /app, which
normally opens the consumer app flow. This package makes /coach.html use:

/app?entry=coach

Then the app routes the signed-in professional to:
- Coach Dashboard if they already belong to an APPROVED coaching business.
- Coach Business Setup if they do not yet have a coaching business.
- Coach Business Settings if their business exists but is pending/draft/paused.

The login overlay also says "Coach Log In" when arriving through the professional entry.

DATABASE-AWARE
If the Coach Business Foundation Restore has not actually been installed yet,
the router shows a visible message instead of silently failing.

PRESERVES PRIOR FIXES
The included index.html is based on the latest patched app and preserves:
- larger Lellee app logo
- working logout redirect
- Agent Command Center UI references

OPTIONAL READ-ONLY DATABASE CHECK
Lellee_Coach_Entry_READ_ONLY_VERIFY_2026-08-27.sql

NOT CHANGED
- Recovery
- consumer subscription prices
- public multi-program launch
- coach public marketplace
- coach payments
- agent autonomy/guardrails
