# Lellee R8 — Housing Agent Activation QA

## Active after R8
- Resources Agent: `resources.search` only
- Housing Agent: `housing.search` only

## Still OFF
- Reminder Agent
- Coaching Agent
- All Resources writes
- All Housing writes

## Required Housing checks
- [ ] Housing can use city/state/ZIP only.
- [ ] Housing can use budget range.
- [ ] Housing can use household size.
- [ ] Housing can use accessibility needs.
- [ ] Housing can use pet needs.
- [ ] Housing cannot read journals.
- [ ] Housing cannot read coaching-private messages.
- [ ] Housing cannot read clinical/substance-use/mental-health history.
- [ ] Housing cannot read payment details or government IDs.
- [ ] Housing performs no writes.
- [ ] Cross-user access fails.
- [ ] Allowed and denied requests are audited.
- [ ] Housing kill switch disables the agent immediately.
- [ ] Browser/public files contain no service-role secret.

## Promotion rule
Do not activate Reminders until every R8 Housing check passes.
