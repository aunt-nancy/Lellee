# Lellee Final Consolidated Release

This package supersedes the R1–R13 incremental ZIP files as the current working branch.

## Approved pricing
- Lellee Free: $0
- Lellee Plus: $5.99/month or $59.99/year
- Lellee Premium: $14.99/month or $149/year
- Journal Companion: $4.99/month
- Lellee Coach add-on: $49.99/month, with Lellee Premium
- Additional coaching: $19.99 per 15-minute session

## Agent/security state
- External AI crawler restrictions included.
- Lellee agents use authenticated internal permissions.
- Resources Agent: search-only.
- Housing Agent: search-only.
- Reminder Agent: user-approved reminders only.
- Coaching Agent: scheduling + explicitly shared goals.
- Coaching message access: explicit message/thread sharing only.
- User Agent Control Center included.
- Admin Agent Operations Dashboard included.
- Global emergency stop included.
- Audit logging and abnormal-activity alert scaffolding included.
- Service-role credentials must remain server-side only.

## Production note
Database migrations, Edge Functions, secrets, scheduled alert checks, and edge/WAF controls
must be deployed in the production environment for those protections to operate live.
