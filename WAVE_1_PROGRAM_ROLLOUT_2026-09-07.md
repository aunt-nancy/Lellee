# Lellee Wave 1 Program Rollout

Status: CONSOLIDATED ARCHITECTURE APPROVED — IMPLEMENTATION / QA IN PROGRESS
Started: 2026-09-07
Consolidated approval locked: 2026-09-09

## Programs

1. Caregiving — reusable Program Pack template; blueprint and consolidated architecture approved.
2. Returning Home / Reentry — Wave 1 program structure and consolidated architecture approved.
3. Finding Stability / Housing Stability — Wave 1 program structure and consolidated architecture approved.
4. Building Independence — Wave 1 program structure and consolidated architecture approved.

## Standard pipeline

Research -> Opportunity Gap -> Blueprint -> Program Pack Build -> Safety/Privacy -> Resources -> Internal QA -> Beta -> Corrections -> Approved -> Live -> Continuous Monitoring

## Shared launch rules

- One shared Lellee engine with configurable Program Packs; do not create duplicated apps for each program.
- Do not activate a program publicly until its individual launch gates pass.
- A passing Wave 1 program may launch without waiting for another Wave 1 program that remains blocked.
- Cross-program private sharing remains off by default.
- Reuse Lellee shared systems where appropriate: Today, Journal, Calendar, Reminders, Document Vault, Resources, Trusted People, Progress, Support, account/session infrastructure.
- Evidence & Practices Agent serves every program using program-specific approved source maps and evidence rules.
- Evidence review dates, evidence scoring, superseded guidance, and internal approval history remain behind the scenes.
- Higher-risk clinical, safety-sensitive, legal-sensitive, abuse-related, or materially conflicting guidance requires human review before publication.
- No agent may diagnose, prescribe treatment, make emergency-disposition decisions, or expose unrelated private program data.
- Substantive post-launch content/evidence/resource changes retain an audit history.

## Consolidated Wave 1 approvals — APPROVED ALL

### 1. Program model
One shared Lellee engine with four configurable Program Packs; no duplicated apps.

### 2. Today
Show roughly 1–3 meaningful priorities first; additional tasks remain behind progressive disclosure.

### 3. Progress
Descriptive progress only. No caregiver score, reentry score, housing score, independence score, grades, or judgmental streak requirements.

### 4. Evidence
The Evidence & Practices Agent continuously researches all programs, prioritizes authoritative sources, and maintains evidence/review dates internally. Users may open Sources when appropriate.

### 5. Human review
Clinical, safety-sensitive, legal-sensitive, abuse-related, or materially conflicting guidance requires human review before publication.

### 6. Resources
Resources Agent finds and verifies services; Housing Agent handles housing searches; Reminder Agent handles approved follow-up. Resource results should become actionable next steps rather than link dumps.

### 7. Privacy
Private by default. Cross-program sharing OFF. Journals and private messages are excluded unless explicitly shared.

### 8. Trusted people
Use purpose-specific sharing: single task, category, person/care profile, time-limited access, or narrowly defined ongoing role rather than blanket account access.

### 9. Help routing
I Need Help identifies the problem first and routes appropriately. It is not automatically treated as a crisis.

### 10. Safety
Genuine immediate-danger situations leave the ordinary productivity workflow and enter the appropriate safety/emergency pathway.

### 11. Caregiving differentiator
Reduce caregiver mental load: what matters now, what can wait, and what can someone else do?

### 12. Reentry differentiator
Practical sequencing and stability without surveillance or scoring.

### 13. Housing differentiator
Housing + documents + benefits + deadlines + resources + follow-through, rather than listings alone.

### 14. Independence differentiator
Self-direction and interdependence. Assistance can support independence; independence does not mean doing everything without help.

### 15. Beta
Small controlled beta. Programs remain pilot/internal until their individual gates pass.

### 16. Launch gate
Evidence, content, resources, privacy, safety, accessibility/mobile, data isolation, QA, and required human review must pass individually.

### 17. Parallel release
A passing program may launch without waiting for another Wave 1 program that remains blocked.

### 18. Continuous improvement
Evidence, resource verification, and analytics continue after launch; substantive changes retain an audit history.

## Caregiving template

### Purpose
Help people manage practical, emotional, and organizational demands of caring for another person while preserving their own stability and well-being.

### Onboarding
Short setup covering who the user cares for, support provided, hardest current challenges, caregiving frequency, available help, optional care needs, first priority, reminders, trusted-person involvement, and optional local-resource location.

### Journey structure
Nonlinear/adaptive stages:
1. Get Oriented
2. Get Organized
3. Build Support
4. Find a Rhythm
5. Adjust to Change
6. Sustain Yourself

Stages are not performance levels. A user can move between them when circumstances change.

### Today
Keep the screen limited to a small set of useful actions:
- brief check-in
- 1-3 highest-priority items
- one care task
- one caregiver-focused task
- coming up
- share the load
- quick tools
- resources when needed

### Tools
Care Profiles, Care Plan, Medication Organizer, Appointments, Prepare for Appointment, Care Calendar, Care Team, Share the Load, Document Vault, Resource Finder, Respite & Break Planner, Emergency Information, Care Transition, Caregiver Plan, Expense & Benefits Organizer, and a Care Binder view.

### Immediate support
Persistent caregiver-specific I Need Help flow for overwhelm, exhaustion/breaks, inadequate help, loss of helper, sudden care changes, resource needs, concern about the care recipient, or concern about self.

### Evidence-guided learning
Evidence & Practices Agent discovers, compares, scores, and prepares guidance updates. Higher-risk changes require human review. Consumer-facing guidance stays simple; internal review dates remain hidden. Sources may be available when useful.

### Resources
Resources Agent should identify the need first and return a small set of strong matches with practical next steps. Housing needs can hand off to the Housing Agent. Resource results can connect to reminders, documents, follow-up tasks, and trusted helpers.

### Progress
No caregiver score, grade, streak requirement, or judgment. Progress is descriptive: organization, support, respite, appointments, tasks, resources, caregiver needs, and transition management. Difficult periods are treated as changed circumstances, not failure.

### Opportunity gaps to prioritize
- reduce caregiver mental load
- intelligent Today prioritization
- adaptation when circumstances change
- caregiver-centered planning
- resource-to-action follow-through
- cross-program journeys
- purpose-based granular sharing
- continuously maintained evidence

## Returning Home / Reentry working structure — APPROVED

Flexible stages:
1. Coming Home
2. Get Stable
3. Rebuild Routine
4. Move Forward
5. Reconnect
6. Build the Next Chapter

Core tools: My Return Plan, Essential Documents, Requirements & Appointments, Housing, Benefits, Transportation, Employment/Education, Support Network, Next Steps.

Primary opportunity: practical sequencing and coordinated stability without scoring or surveillance.

## Finding Stability / Housing Stability working structure — APPROVED

Flexible stages:
1. What's Urgent?
2. Understand My Situation
3. Find Options
4. Get Ready
5. Get Stable
6. Stay Stable

Core tools: Housing Situation, Deadline Tracker, Housing Search, Application Organizer, Document Vault, Benefits/Rent Assistance, Housing Counselor/Legal Resources, Move Plan, Stay Stable Plan.

Primary opportunity: resource-to-action follow-through rather than listings alone.

## Building Independence working structure — APPROVED

Flexible stages:
1. What I Want
2. Daily Life
3. Getting Around & Access
4. Money & Responsibilities
5. Work, School & Community
6. My Support, My Choice

Core tools: My Independence Goals, Daily-Life Systems, Transportation, Accessibility/Assistive Technology, Benefits, Money & Household Organization, Work/School, Self-Advocacy, Support Plan, Emergency Preparedness.

Primary opportunity: self-direction, advocacy, accessibility, and chosen support rather than routine prompts alone.

## Immediate execution work

- Map the approved shared Program Pack into the current Lellee Program Builder and runtime.
- Implement/verify Wave 1 program-specific onboarding, Today, tools, I Need Help routing, evidence/source rules, resources, privacy, and safety configurations.
- Run internal QA for all four programs side-by-side.
- Produce a readiness matrix showing Implemented / QA Passed / Correction Needed / Beta Ready / Blocked.
- Keep all four non-public until individual launch gates pass.

Printable blueprint: create only after the process is complete and approved.