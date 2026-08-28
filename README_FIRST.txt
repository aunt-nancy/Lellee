LELLEE — ORGANIZATION OPERATIONS COMPLETION
Date: 2026-08-27

THIS IS THE NEXT ORGANIZATION SPRINT.

PREREQUISITE
The Organization Front Door + Live Dashboard V3 SQL must have succeeded.

OPTIONAL FIRST CHECK
00_Organization_Operations_PRECHECK_READ_ONLY.sql

RUN / UPLOAD ORDER

1. SUPABASE SQL EDITOR
Run as ONE complete script:
01_Lellee_Organization_Operations_Completion_2026-08-27.sql

If V3 is missing, this script stops clearly before installing the operations layer.

2. GITHUB ROOT
This package is cumulative. Upload / replace:
- index.html
- landing.html
- organizations.html
- organizations.css
- organizations.js
- organization-entry-router.js
- organization-dashboard-live.js
- organization-dashboard-live.css

Upload new:
- organization-operations-completion.js
- organization-operations-completion.css

3. OPTIONAL READ-ONLY CHECK
02_Organization_Operations_READ_ONLY_VERIFY.sql

WHAT BECOMES FUNCTIONAL

ORGANIZATION ANALYTICS
- licensed seats
- assigned / active sponsored users
- activation rate
- licensed programs
- cohorts
- aggregate milestone count when that table is available
- per-program utilization
- small-group outcome suppression below 5 active participants

LICENSING & REVENUE PREPARATION
- configured license values
- quote list
- organization can request a quote
- a quote request does NOT set or approve price
- organization billing remains OFF

OUTREACH
- sponsored-user outreach list
- in-app organization announcement drafts
- a separate HUMAN click is required to send an announcement
- announcement delivery is inside Lellee only
- no email / SMS / DM sending
- operational follow-ups and history

AUTOMATION
- sponsored invitation -> internal follow-up only
- cohort start -> internal follow-up or announcement DRAFT
- automation never auto-sends an announcement
- no journal, message-body, safety, crisis, diagnosis, relapse-detail or treatment-note inputs
- no emergency dispatch

INTEGRATIONS
- staged roster/cohort/aggregate-report/resources/configuration jobs
- import/export job records only
- no transfer is executed automatically
- prepared feeds/SSO/API counts can be viewed
- external API, webhooks and SSO remain OFF
- no raw credentials are requested from the organization UI

FORMS
- operational acknowledgments
- aggregate surveys
- operational intake
- assign forms to active sponsored users
- organization sees assignment/completion status
- this package does NOT expose private consumer journal/message/safety content or unrelated private form answers

QUICK START
- live setup checklist:
  profile
  approval
  team
  license request
  active license
  sponsored participant
  cohort
  form
  staged integration job

COMPATIBILITY
This package NEVER drops, creates, or replaces:
public.is_organization_member(uuid)

All new mutating RPCs use unique Lellee versioned names.

PROTECTED STATES
organization_payments_enabled = false
organization_individual_private_data_access = false
public_multi_program_launch_enabled = false
external_api_access_enabled = false
webhook_delivery_enabled = false
sso_enabled = false
automatic_third_party_data_delivery_enabled = false

RECOVERY
No Recovery tables, content, curriculum, renderer, pricing, or public launch state are changed.
