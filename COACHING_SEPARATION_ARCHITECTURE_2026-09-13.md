# Lellee Coaching Separation Architecture

Date: 2026-09-13
Status: APPROVED PRODUCT ARCHITECTURE

## Core rule
Coaching is separate from a user's Lellee journeys. Recovery, Caregiving, Returning Home / Reentry, Housing Stability, Building Independence, and future journeys remain self-contained program experiences.

## Consumer journey behavior
- Journeys must not embed coaching as a journey stage, required step, module, or progress requirement.
- A regular Lellee user may see only a simple optional offer to purchase **Live 1-on-1 Coaching**.
- Purchasing coaching does not change, pause, score, or otherwise alter any journey.
- Journey data remains private by default. Coaching receives only items a user intentionally shares.

## My Coaching — paid Lellee coaching customer
Users who purchase Lellee's live individual coaching receive a dedicated **My Coaching** dashboard that is separate from My Journeys.

My Coaching should support:
- assigned Lellee Coach
- private coach messaging
- scheduled sessions and check-ins
- agreed goals and action items
- user-selected shared journey/progress items
- upcoming sessions
- milestone encouragement
- purchase/use of additional paid 15-minute check-ins

My Coaching is a consumer service dashboard. It is not a coach-business workspace.

## Coach Business Dashboard — independent coaching businesses
Independent coaching professionals and businesses use a completely separate **Coach Business Dashboard**.

Coach Business Dashboard should support:
- clients / caseload
- scheduling and CRM
- private coaching messages
- intake/forms
- training and readiness requirements
- credentials and verification status
- business/profile settings
- service/package management
- groups/cohorts when enabled
- leads and operational tools
- business analytics and revenue views where enabled

Independent coach-business tools must not appear inside the consumer My Coaching dashboard.

## Workspace/navigation rule
- **My Coaching** belongs to the consumer/personal workspace.
- **Coach Business Dashboard** belongs to the coach-business workspace.
- Admin retains separate coaching approval, credentialing, training, and safety controls.
- Admin/User View switching does not change permissions; it only changes the interface context.

## Coach readiness
The approved 10 Coach Readiness Requirements apply to people providing coaching, not to ordinary Lellee users and not to journey completion.

1. Complete Lellee Core Coach Training.
2. Complete program-specific training for each journey coached.
3. Pass required training modules/knowledge checks.
4. Complete privacy, boundaries, safety/escalation, and crisis-referral training.
5. Submit applicable credentials, education, training certificates, and/or lived-experience qualifications.
6. Any credential displayed as Verified requires human review.
7. Accept Lellee Coach Code of Conduct and scope-of-practice boundaries.
8. Complete identity/business review where required.
9. Have no unresolved approval or safety blockers.
10. Receive final human coach approval before becoming available to users.

A professional license is not universally required. Lived experience, certifications, training, and education may qualify someone for appropriate non-clinical coaching roles, while professional licenses remain clearly distinguished from non-license credentials.

## Pricing already approved
- Lellee Coach add-on: $49.99/month in addition to Premium.
- Additional 15-minute check-ins: $19.99 each.

## Wave 1 launch implication
Before Wave 1 journeys go Live, their consumer experience must preserve this boundary: journeys are journeys; coaching is optional and separate. Wave 1 does not need to wait for the independent coach-business system to become a journey feature because it is not part of the journey runtime.
