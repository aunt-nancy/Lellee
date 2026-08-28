LELLEE — ORGANIZATION FRONT DOOR + LIVE DASHBOARD
Date: 2026-08-27

THIS OPENS THE NEXT COMMERCIAL/INSTITUTIONAL SIDE OF LELLEE WITHOUT TURNING
ON ORGANIZATION PAYMENTS OR PUBLIC MULTI-PROGRAM LAUNCH.

RUN / UPLOAD IN THIS ORDER

1. SUPABASE SQL EDITOR
Run as ONE complete script:
01_Lellee_Organization_Foundation_Live_Dashboard_2026-08-27.sql

2. GITHUB ROOT
Upload / replace:
- index.html
- landing.html

Upload new:
- organizations.html
- organizations.css
- organizations.js
- organization-entry-router.js
- organization-dashboard-live.js
- organization-dashboard-live.css

3. OPTIONAL READ-ONLY CHECK
02_Lellee_Organization_READ_ONLY_VERIFY.sql

PUBLIC SITE
- Consumer header remains free of organization sales navigation.
- Consumer footer gains a small "For Organizations" path.
- /organizations.html is a separate institutional front door.
- No invented institutional price is published.
- Organization payments stay OFF.

ORGANIZATION SETUP
- nonprofit
- county/city
- community program
- employer
- recovery/treatment organization
- education
- healthcare
- other
- organization submission goes to HUMAN REVIEW
- edits/resubmission return to review

LIVE ORGANIZATION DASHBOARD
- sponsored-seat total
- assigned seats
- active sponsored users
- active program licenses
- licenses tab
- sponsored access tab
- cohorts tab
- aggregate report tab
- team tab

PROGRAM LICENSES
- approved organization requests program + seats
- request does NOT auto-activate
- Lellee admin must activate/deny/pause
- activating a license is a deliberate admin action
- public_multi_program_launch_enabled stays false

SPONSORED ACCESS
- organization generates a private invitation link for an ACTIVE license
- invite is bound to the invited email
- accepted invite enrolls that account in the specifically sponsored program
- organization does NOT get journal/check-in/message/safety/private-history access

TEAM
- admin/program-manager/viewer invitation links
- invited account must match invited email
- owner/admin/program-manager can perform management actions
- viewers are read-only at the dashboard-policy layer

ADMIN · ORGANIZATIONS
- review submitted organizations
- approve / return to review / pause / reject
- activate / deny / pause requested program licenses
- set approved seat count

COHORTS
- create cohorts under active licensed programs
- site/location + funding-source fields
- capacity + dates

PROTECTED SETTINGS
organization_payments_enabled = false
organization_individual_private_data_access = false
public_multi_program_launch_enabled = false

PRESERVED FROM PRIOR SPRINTS
- Recovery unchanged
- larger logo
- logout fix
- Agent Command Center
- professional Coach front door
- Coach live dashboard V2
- Coach operations completion
