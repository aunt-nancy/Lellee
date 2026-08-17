# Lellee R5 — Server-Side Agent Enforcement QA

R5 validates the user session, agent status, capability grant, required user consent, RLS-scoped private-data access, field allowlists, and audit logging.

## Production gate
1. Apply R4 migration if not already applied.
2. Apply R5 migration.
3. Deploy guarded Edge Functions.
4. Confirm RLS on every user-data table each agent touches.
5. Leave agents and capabilities disabled until testing passes.
6. Test cross-account access and confirm it fails.
7. Revoke consent and confirm sensitive capabilities fail immediately.
8. Confirm allowed and denied events appear in `agent_access_audit`.
9. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
