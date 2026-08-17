# Lellee R13 — Admin Agent Operations QA

## Admin authorization
- [ ] Non-admin authenticated user receives 403 from Admin Agent Operations endpoint.
- [ ] Unauthenticated request receives 401.
- [ ] Only active users in `agent_admin_operators` receive access.
- [ ] Ordinary users cannot query admin tables directly.
- [ ] Admin status cannot be granted from browser code.

## Global kill switch
- [ ] Turning emergency stop ON causes every guarded agent request to fail.
- [ ] Turning emergency stop OFF restores only agents/capabilities that were already enabled.
- [ ] Global stop changes are written to `agent_admin_action_audit`.

## Agent/capability controls
- [ ] Admin can disable one agent without affecting others.
- [ ] Admin can block one capability without disabling the full agent.
- [ ] New agents/capabilities default to OFF unless intentionally configured.
- [ ] Every admin change is audited with old/new values.

## Monitoring
- [ ] Recent allowed/denied agent requests appear in admin view.
- [ ] Denial spike creates a security alert.
- [ ] Per-agent denial spike creates a security alert.
- [ ] Per-user denial spike creates a security alert.
- [ ] Alert detector requires `LELLEE_INTERNAL_CRON_SECRET`.
- [ ] Alert endpoint is not exposed as a normal public feature.

## Secrets
- [ ] `SUPABASE_SERVICE_ROLE_KEY` exists only in server-side environment secrets.
- [ ] `LELLEE_INTERNAL_CRON_SECRET` exists only in server-side environment secrets.
- [ ] No service-role secret exists in HTML/JS/public assets.

## Release rule
R13 passes only when admin authorization, emergency-stop behavior, auditing,
and alert generation have all been verified end-to-end.
