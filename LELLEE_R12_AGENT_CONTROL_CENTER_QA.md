# Lellee R12 — Agent Control Center QA

## User-facing requirements
- [ ] Shows Resources, Housing, Reminders, and Coaching agents.
- [ ] Describes what each agent can use in plain language.
- [ ] Shows only the signed-in user's consent records.
- [ ] Shows only the signed-in user's recent agent audit history.
- [ ] User can revoke a consent-gated agent's access.
- [ ] Revoking Coaching also revokes active coaching message/thread shares.
- [ ] User cannot enable global agent capabilities.
- [ ] User cannot access platform-wide agent configuration.
- [ ] Global kill switches remain admin/server controlled.
- [ ] No service-role key exists in browser/public assets.

## Privacy behavior
- [ ] Resources and Housing do not display or request sensitive consent they do not need.
- [ ] Reminders shows consent state without exposing journal or coaching message content.
- [ ] Coaching message sharing remains explicit and off by default.
- [ ] Audit view contains agent/capability/outcome/time only, not sensitive payloads.

## Release rule
R12 passes when all controls are user-scoped and revocation is verified end-to-end.
