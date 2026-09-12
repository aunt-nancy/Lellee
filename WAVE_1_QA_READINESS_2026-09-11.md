# Lellee Wave 1 — Internal QA Readiness Checkpoint

Date: 2026-09-11  
Scope: Caregiving, Returning Home / Reentry, Housing Stability, Building Independence  
Environment: active app Supabase project `hkrrxscyhtxmbvxevfkw`  
Public release status: **NOT LIVE — all four remain `planned`**

## Current beta scope — COACHING ONLY

The product-owner decision for the current Wave 1 beta is coaching only.

Included:
- goal setting and next-step planning;
- routines, organization, and accountability;
- self-directed priorities;
- Calendar/Reminders, Document Vault, Trusted People, and Goals/Progress as personal-organization tools.

Not included:
- diagnosis, treatment, or clinical care;
- individualized legal advice;
- housing placement or case management;
- broad program-specific resource-navigation services;
- emergency assessment or emergency services.

Crisis boundary for U.S. users:
- emotional distress/crisis -> call or text **988** or use `988lifeline.org`;
- immediate danger or medical emergency -> call **911** or go to the nearest emergency room.

Durable scope record: `WAVE_1_COACHING_ONLY_SCOPE_2026-09-11.md`.

## Runtime implementation

- Shared Program Pack runtime remains admin-only/internal.
- Current Wave 1 runtime: `wave1-program-runtime.js` version `2026-09-11-wave1-coaching-qa3`.
- Current onboarding runtime: `wave1-onboarding-runtime.js` version `2026-09-11-wave1-onboarding-coaching-qa2`.
- Wave 1 program copy, Today, Tools, Setup, I Need Help, Resources, and Progress have been narrowed to the coaching-only boundary.
- `I Need Help` presents coaching support plus the 988/911 external crisis boundary.
- Program-specific Resources explicitly states that broader resource navigation is not offered in the current beta.
- Shared personal-organization tools remain connected: Document Vault, Calendar/Reminders, Trusted People, and program-scoped Goals/Progress.
- Onboarding answers save to private `journey_account_intakes` and do not enroll the user or change the primary program.
- Cross-program sharing remains OFF by default.
- Updated runtime cache keys are deployed through `pwa-runtime.js`.

## Backend scope enforcement

PASS for the current coaching-only boundary:
- public settings identify `current_service_scope = coaching_only`;
- clinical guidance is disabled;
- legal guidance is disabled;
- program-specific resource navigation is disabled;
- prior program-specific Wave 1 safety routes are archived;
- each program has one draft `coaching_support` route and one draft `crisis_support` route;
- current crisis route sends U.S. users to 988, with 911/ER language for immediate danger or medical emergency;
- safety profiles are standard-review working records for the narrow coaching-only scope;
- beta readiness now treats safety and resources as ready only within this limited scope.

## Privacy / data-isolation verification

PASS at policy level:
- `journey_account_intakes` — own-row select/insert/update/delete;
- `program_goals` — own-row ALL policy;
- `program_progress_checkins` — own-row ALL policy;
- `user_saved_resources` — own-row ALL policy;
- `resource_referrals` — own-row ALL policy;
- `program_enrollments` — own-row SELECT;
- `user_program_state` — own-row SELECT;
- Trusted People recipient access remains limited to active, accepted relationships and specific allowed scopes;
- private Journal/private messages are not exposed by the current coaching scope;
- cross-program sharing remains OFF by default.

## Historical authenticated QA

Before the final coaching-only narrowing, authenticated admin E2E completed with:
- **53 passed**
- **0 failed**
- **4 Wave 1 programs found**

Authenticated iPhone / interactive Program Pack QA also passed, including Setup, Today, Journey, Tools, I Need Help, Resources, Progress, and return navigation.

These remain useful regression baselines. Because the runtime copy and onboarding were subsequently narrowed to coaching only, the final current release gate is the dedicated coaching accessibility QA described below.

## Specialist-review disposition

The earlier clinical/legal specialist-review packet is retained for audit history but is **superseded for the current coaching-only beta** because those services are not being offered.

No clinician/attorney/housing specialist sign-off is required merely to launch this narrow coaching product. If Lellee later adds clinical care, individualized legal guidance, housing placement, case management, or broad resource-navigation services, the appropriate specialist review must be reintroduced before those features are activated.

The current meaningful human gate is accessibility/usability QA for the coaching experience.

## Controlled beta state

Four invite-only controlled-beta cohorts exist, each with target size 10. All remain `planning`; no tester is active.

Current database readiness for all four programs:
- content_ready: true
- safety_ready: true
- resources_ready: true
- accessibility_ready: **false**
- privacy_ready: true
- support_ready: true
- qa_ready: true
- cohort status: `planning`
- cohort access gate: **false**

Therefore no current cohort can grant tester access.

## Current QA disposition

| Program | Coaching Runtime | Coaching Onboarding | Shared Tools | Privacy/RLS | Historical E2E | iPhone / Interactive | Safety Boundary | Resource Boundary | Accessibility | Beta-ready |
|---|---|---|---|---|---|---|---|---|---|---|
| Caregiving | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PENDING | NO |
| Reentry | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PENDING | NO |
| Housing Stability | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PENDING | NO |
| Building Independence | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PENDING | NO |

## Remaining release gate

Run `wave1-accessibility-qa.html` while authenticated as a Lellee administrator.

The gate requires:
1. automated WCAG A/AA scan with **0 serious/critical findings** across the current coaching Program Pack views and coaching setup;
2. manual keyboard/focus check;
3. manual text-enlargement/zoom check;
4. manual screen-reader label check;
5. confirmation that the 988/911 crisis information is understandable without relying on color.

Only after those checks pass should `accessibility_ready` be marked true. Even then, cohorts remain `planning` until deliberately advanced; no tester access or public activation occurs automatically.

Printable blueprint remains deferred until the end of the full process, per approved instruction.