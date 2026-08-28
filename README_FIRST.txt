LELLEE — FINAL ORGANIZATION + WORKSPACES BUILD
Date: 2026-08-27
Build 3 of the final 3 consolidated Lellee builds.

THIS PACKAGE CONSOLIDATES THE ORGANIZATION / WORKSPACE WORK SO YOU DO NOT HAVE TO RUN THE OLD:
- Organization Front Door + Live Dashboard V3 package
- Organization Operations Completion package
- Unified Workspace Switcher package
again.

SEQUENCE
Final Build 1 (Agent Operations) and Final Build 2 (Coach Operations) should already be complete.

OPTIONAL PRECHECK
00_Final_Organization_Workspaces_PRECHECK_READ_ONLY.sql

RUN / UPLOAD ORDER

1. SUPABASE SQL EDITOR
Run as ONE complete script:
01_Lellee_Final_Organization_Workspaces_2026-08-27.sql

This runs the proven Organization V3 foundation/dashboard migration first and then the
Organization Operations completion migration. The workspace switcher itself requires no
new database migration.

COMPATIBILITY PROTECTION
The SQL NEVER drops, creates, or replaces:
public.is_organization_member(uuid)

It reuses the existing legacy helper exactly as deployed. This preserves the V3 fix for
the earlier PostgreSQL input-parameter-name conflict.

2. GITHUB ROOT
Upload / replace these exact files:
- index.html
- organizations.html
- organizations.css
- organizations.js
- organization-entry-router.js
- organization-dashboard-live.js
- organization-dashboard-live.css
- organization-operations-completion.js
- organization-operations-completion.css
- unified-workspace-switcher.js
- unified-workspace-switcher.css

IMPORTANT PUBLIC-ROOT PROTECTION
This Build 3 package intentionally DOES NOT include:
- landing.html
- vercel.json
- service-worker.js
- reset-lellee-cache.html

Do not replace the current public-root routing files with an older Organization package.
The lellee.com public-root routing repair remains a separate final deployment-validation item.

3. OPTIONAL VERIFY
02_Final_Organization_Workspaces_READ_ONLY_VERIFY.sql

WHAT THIS FINALIZES

ORGANIZATION FRONT DOOR + LIVE DASHBOARD
- organization application/setup
- team/member roles and invitations
- human-reviewed program licensing
- sponsored access invitations
- cohorts
- live organization dashboard context
- V3-safe RPC/function naming

ORGANIZATION OPERATIONS
- aggregate analytics and utilization
- small-group outcome suppression below 5 active participants
- quote/license preparation without activating billing
- sponsored-user operational outreach
- human-click in-app announcements
- operational follow-ups/history
- safe automation rules that create follow-ups/drafts only
- staged integration/data-exchange jobs only
- operational forms and assignment/completion status
- Quick Start organization setup checklist

UNIFIED WORKSPACES
- Personal workspace
- Coach workspace when a coach role is connected
- Organization workspace when an organization role is connected
- Admin workspace when admin access is active
- compact workspace selector near Sign Out
- workspace-specific quick access
- recent non-sensitive page destinations
- populated Account Access role status/entry buttons

DATA BOUNDARIES REMAIN SEPARATE
Switching workspace changes navigation context only. It does not merge Personal, Coach,
Organization or Admin data.

PROTECTED STATES REMAIN
- Organization payments OFF
- Organization individual private-data access OFF
- Public multi-program launch OFF
- External API delivery OFF
- Webhooks OFF
- SSO OFF
- Automatic third-party data delivery OFF
- Agent autonomous actions OFF
- Coach payments/payouts OFF
- Public coach marketplace OFF

RECOVERY / PRICING
This build does not change the Recovery curriculum/renderer or approved consumer pricing.

CUMULATIVE INDEX
The included index.html is the latest cumulative app shell. It carries forward the recent:
- Agent Command Center integration from Build 1
- Coach Dashboard / Coach Operations integration from Build 2
- Organization Dashboard / Organization Operations integration
- Unified Workspace Switcher

AFTER BUILD 3
The three final consolidated builds are complete.
The remaining work is deployment verification and end-to-end live-site QA, including:
- verify Vercel deployment is Ready
- verify public root opens the approved Lellee landing page
- verify /app opens Today
- verify Coach / Organization professional entry routes
- verify workspace switching and role boundaries
- verify admin/agent areas
- verify mobile/navigation/logout
- resolve the deferred lellee.com public-root routing issue without changing index.html
