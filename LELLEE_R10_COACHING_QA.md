# Lellee R10 — Coaching Agent Limited Activation QA

## Active after R10
- Resources: search only
- Housing: search only
- Reminders: user-approved reminders
- Coaching: scheduling + explicitly shared goals only

## Still OFF
- Coaching private/shared message access

## Required Coaching checks
- [ ] Coaching requires explicit user consent.
- [ ] Scheduling reads only the signed-in user's appointments.
- [ ] Scheduling writes only the signed-in user's appointments.
- [ ] Another user's appointment ID cannot be read or changed.
- [ ] Coaching sees only goals marked `shared_with_coach=true`.
- [ ] Unshared goals remain invisible.
- [ ] Journal entries remain invisible.
- [ ] Private coaching messages remain inaccessible.
- [ ] Clinical/substance-use/mental-health history remains inaccessible unless separately and explicitly shared in a future feature.
- [ ] Payment details and government IDs remain inaccessible.
- [ ] Allowed and denied coaching-agent actions are audited.
- [ ] Kill switch disables Coaching Agent immediately.
- [ ] Browser/public assets contain no service-role secret.

## Promotion rule
Do not enable `coaching.shared_messages` until all R10 checks pass and the product adds an explicit user-facing message-sharing consent control.
