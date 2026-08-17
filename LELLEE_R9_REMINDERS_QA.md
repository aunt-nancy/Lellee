# Lellee R9 — Reminder Agent Activation QA

## Active after R9
- Resources: search only
- Housing: search only
- Reminders: user-approved read/create/update

## Still OFF
- Coaching Agent

## Reminder checks
- [ ] User can read only their own reminders.
- [ ] User can create only their own reminders.
- [ ] User can update only their own reminders.
- [ ] Another user's reminder ID cannot be read or changed.
- [ ] Reminder content does not come from private journal entries.
- [ ] Reminder Agent cannot read coaching messages.
- [ ] Reminder Agent cannot read payment or clinical data.
- [ ] Sensitive reminder access requires user consent.
- [ ] All reminder-agent actions are audited.
- [ ] Kill switch disables Reminder Agent immediately.
- [ ] Browser/public assets contain no service-role secret.

## Promotion rule
Do not activate Coaching until every R9 check passes.
