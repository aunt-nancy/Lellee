# Lellee R13 — Deployment Order

1. Apply `20260816_r13_admin_agent_operations.sql`.
2. Bootstrap the first admin operator using a trusted server/service-role process.
3. Deploy `admin-agent-operations`.
4. Set server-side environment secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LELLEE_INTERNAL_CRON_SECRET`
5. Deploy `agent-security-alerts`.
6. Schedule the alert detector server-side at a reasonable interval.
7. Verify non-admin users receive 403.
8. Test the global emergency stop.
9. Test per-agent and per-capability controls.
10. Verify admin changes appear in `agent_admin_action_audit`.
11. Verify abnormal denial activity creates alerts.
12. Keep all admin endpoints out of public navigation for non-admin users.

Do not put any admin or service-role secret in `recovery.html`, public JavaScript,
Vercel `NEXT_PUBLIC_*` variables, or a public repository.
