# Lellee R7 — Controlled Activation QA

## Activate first
Resources Agent — `resources.search` only.

## Keep OFF
- Resources save/preferences writes
- Housing Agent
- Reminder Agent
- Coaching Agent

## Required checks
- [ ] Resources Agent returns only approved search/location context.
- [ ] No journal data is returned.
- [ ] No coaching-private data is returned.
- [ ] No payment/clinical/substance-use data is returned.
- [ ] No writes occur.
- [ ] Every request is audited.
- [ ] Another user's records remain inaccessible.
- [ ] Disabled capabilities return 403.
- [ ] Kill-switch SQL disables the agent immediately.
- [ ] Browser assets contain no service-role secret.

## Promotion rule
Only after every box passes should Housing Agent be considered for activation.
