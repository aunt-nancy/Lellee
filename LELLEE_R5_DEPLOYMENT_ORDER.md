# Lellee R5 — Supabase Deployment Order

1. Run the R4 agent-permissions migration if needed.
2. Run `20260816_r5_agent_server_enforcement.sql`.
3. Configure server-side Edge Function secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy the guarded functions.
5. Keep all agents/capabilities disabled.
6. Test authentication, consent, RLS, cross-user denial, and audit logs.
7. Enable one agent capability at a time.

Never place the service-role key in browser JavaScript, `recovery.html`, a public repository, or a `NEXT_PUBLIC_*` variable.
