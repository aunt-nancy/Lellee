LELLEE — FINAL AGENT OPERATIONS BUILD
Date: 2026-08-27
Build 1 of the final 3 consolidated Lellee builds.

THIS PACKAGE CONSOLIDATES THE AGENT WORK SO YOU DO NOT HAVE TO RUN THE OLD:
- Growth Agents / Trend + Social package
- Agent Roster Completion package
- 17-Agent First Missions package
again.

PREREQUISITE
The original Agent Operations foundation (original 8 agents) must exist.

OPTIONAL PRECHECK
00_Final_Agent_Operations_PRECHECK_READ_ONLY.sql

RUN / UPLOAD ORDER

1. SUPABASE SQL EDITOR
Run as ONE complete script:
01_Lellee_Final_Agent_Operations_2026-08-27.sql

2. GITHUB ROOT
Upload / replace:
- index.html
- agent-command-center.js
- agent-command-center.css

3. SUPABASE EDGE FUNCTIONS — dynamic-worker
Replace the existing dynamic-worker index.ts contents with:
dynamic-worker-index.ts
Then deploy the existing dynamic-worker function.

No secret values are contained in this package.
Keep the existing OpenAI key and worker secret in Supabase.

4. OPTIONAL VERIFY
02_Final_Agent_Operations_READ_ONLY_VERIFY.sql

WHAT THIS FINALIZES

17 ACTIVE SPECIALISTS
1. Operations Copilot
2. Content QA
3. Provider Research
4. Prospect Research
5. Support Triage
6. Release QA
7. Program Builder Assistant
8. Knowledge Assistant
9. Trend & Demand Intelligence
10. Social Media Growth
11. Growth & Marketing
12. Coach Business Growth
13. Revenue Intelligence
14. Resource Freshness
15. Accessibility QA
16. Customer Success
17. Coach Quality

FOUR TEAMS
- Growth & Revenue
- Build & Quality
- Operations & Success
- Research & Resources

FIRST MISSIONS
The 17 mission templates are installed.
For safety, SQL Editor does not invent a requester identity.
When an Admin opens Agent Workbench, click:
Queue Missing Missions
The signed-in admin becomes requester/reviewer for only the missions not already queued.

HUMAN REVIEW FIX
The old browser flow could record a review and then fail to update agent_outputs
because direct output mutation is admin-only under RLS.

This package fixes that with:
lellee_review_agent_output_v1(...)

Review + output status + task status are handled atomically through a controlled
SECURITY DEFINER RPC.

APPROVED HANDOFFS
Approved outputs can be handed off to:
- internal reference
- staff follow-up
- growth
- research
- content
- release
- coach operations
- organization operations
- support

A handoff is an INTERNAL HUMAN ACTION RECORD.
It does not automatically publish, email, DM, charge, change settings or modify
another production system.

WORKER UPDATE
The existing worker already executes all active agent roles through the model.
This package extends PUBLIC WEB RESEARCH to:
- provider_research
- prospect_research
- trend_intelligence
- resource_freshness

Other roles still use model execution with supplied/approved context but do not
automatically invoke web research.

COMMAND CENTER
The UI now uses one RLS-safe command-center RPC rather than relying on direct
output mutation.
It shows:
- 17-agent roster status
- worker / model / public research status
- four team workloads
- tasks and latest outputs
- confidence
- sources
- human review actions
- approved internal handoffs
- missing first-mission queue button for Admin

PROTECTED SETTINGS REMAIN
- Human review REQUIRED
- Autonomous outreach OFF
- Autonomous publishing OFF
- Autonomous financial actions OFF
- Permission changes OFF
- Sensitive participant-data access OFF
- Journal access OFF
- Private-message access OFF
- Safety-activity access OFF
- Secret access OFF
- Clinical decisions OFF
- Public multi-program launch OFF

THIS DOES NOT CHANGE
Recovery curriculum/rendering
Coach payments
Organization payments
Public coach marketplace
Public multi-program release
