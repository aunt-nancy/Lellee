LELLEE — LIVE COACH DASHBOARD
Date: 2026-08-27

RUN / UPLOAD IN THIS ORDER

1. SUPABASE SQL EDITOR
Run:
01_Coach_Dashboard_Live_Bridge_2026-08-27.sql

This requires the Coach Business Foundation Restore to have succeeded first.

2. GITHUB ROOT
Upload / replace:
- index.html
- coach-dashboard-live.js
- coach-dashboard-live.css

3. OPTIONAL READ-ONLY CHECK
02_Coach_Dashboard_Live_READ_ONLY_VERIFY.sql

WHAT THIS MAKES FUNCTIONAL
COACH BUSINESS SETUP
- loads program choices
- loads existing business information
- submits/resubmits a coaching business for HUMAN review
- approved-business edits return to pending review
- stores professional-scope/privacy attestations

COACH DASHBOARD
- live client count
- live group count and open seats
- unread coaching messages
- clients tab
- groups tab
- services/pricing tab
- messages tab
- assignments tab
- leads tab
- Refresh

COACH ACTIONS
- create service/package definitions
- create groups
- add business leads
- create assignments for a client or group
- send client/group coaching messages
- create client invitation links

CLIENT INVITATION
The coach gets a private /app?coach_invite=... link.
The invited person must sign in with the invited email.
The app accepts the invitation and opens My Coaching.

ADMIN REVIEW
The existing Admin · Coaching page becomes functional for:
- pending count
- approved count
- human review of business name, audience, bio, scope/credentials
- Approve
- Return to Review
- Pause
- Reject / Changes
No business is auto-approved.

PRIVACY
The dashboard bridge returns coach-business operating data only.
It does NOT return:
- journals
- private recovery check-ins
- safety/crisis activity
- diagnoses
- support contacts
- full private recovery history

STILL OFF
- coach payment collection
- public coach marketplace
- public multi-program launch
- autonomous agent actions

The included index.html preserves the prior:
- larger logo
- logout fix
- Agent Command Center
- professional coach-entry routing
