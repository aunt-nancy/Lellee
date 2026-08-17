# Lellee Agent Permission QA — R4

## Required behavior
- Default deny for every agent.
- Agent enablement is separate from capability grants.
- Housing cannot read journal or coaching private messages.
- Resources cannot read journals or payment details.
- Coaching can only use data explicitly shared with coaching.
- Reminder agent can see reminder/calendar metadata, not journal or coaching message content.
- All agent actions should be auditable.
- No browser-side service-role key.
- Browser helper is UI gating only; server/database authorization is authoritative.

## Production gate
Do not enable an agent until:
1. Its server endpoint checks the agent identity.
2. Its capability is verified server-side.
3. User ownership / consent is verified.
4. The response is field-filtered.
5. An audit event is written.
