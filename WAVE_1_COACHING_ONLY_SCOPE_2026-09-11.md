# Lellee Wave 1 — Coaching-Only Beta Scope

Date: 2026-09-11  
Scope: Caregiving, Returning Home / Reentry, Housing Stability, Building Independence  
Status: CURRENT BETA SCOPE — LOCKED

## Product-owner decision

For the current Wave 1 beta, Lellee offers **coaching only**.

Coaching may support:
- goals and next-step planning;
- routines and organization;
- accountability;
- self-directed priorities;
- breaking larger tasks into manageable steps;
- use of Lellee personal-organization tools such as Calendar/Reminders, Document Vault, Trusted People, and Goals/Progress.

## Not offered in the current beta

The current Wave 1 beta does not provide:
- diagnosis or treatment;
- medical or clinical care;
- individualized legal advice;
- housing placement;
- case management;
- broad program-specific resource-navigation services;
- emergency assessment or emergency services.

Those areas may be considered in a later product phase. Appropriate specialist, legal, clinical, privacy, accessibility, or other review must be reintroduced before any such expanded service is activated.

## Crisis boundary

For users in the United States:
- emotional distress or crisis: **call or text 988** or use `988lifeline.org`;
- immediate danger or a medical emergency: **call 911 or go to the nearest emergency room**.

Lellee does not make an emergency-disposition decision. It provides the external crisis/emergency referral boundary above.

## Runtime and database enforcement

The current implementation now reflects this scope:
- Wave 1 runtime copy and tools are coaching/organization focused;
- onboarding questions are coaching focused;
- program-specific clinical/legal/housing-resource navigation is not offered in the current beta;
- prior Wave 1 program-specific safety routes are archived;
- each Wave 1 program keeps only a current `coaching_support` route and a `crisis_support` route as draft working routes;
- public settings disable clinical guidance, legal guidance, and program-specific resource navigation;
- beta readiness marks safety/resources ready only under this narrow coaching-only boundary;
- accessibility remains the outstanding release gate.

## Privacy boundary

Cross-program sharing remains OFF by default. Private Journal and private messages are not opened by this coaching scope. Trusted-person sharing remains purpose-specific and revocable.

## Historical specialist packet

`WAVE_1_SPECIALIST_REVIEW_PACKET_2026-09-11.md` is retained for audit history but is **superseded for the current coaching-only beta**. It becomes relevant again only if Lellee expands into the services that packet was designed to review.

## Beta status

All four programs remain `planned`; all controlled-beta cohorts remain `planning`; no tester has been activated and no program has been made public. Accessibility QA must pass before any cohort is deliberately advanced.