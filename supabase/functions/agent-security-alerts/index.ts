import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "../_shared/agent-auth.ts";

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

Deno.serve(async (request) => {
  // Protect this endpoint with a server-side secret/header at deployment time.
  // Do not expose it as a public user endpoint.
  const provided = request.headers.get("X-Lellee-Internal-Secret") || "";
  const expected = env("LELLEE_INTERNAL_CRON_SECRET");

  if (!provided || provided !== expected) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const adminClient = createClient(
    env("SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: denied, error } = await adminClient
    .from("agent_access_audit")
    .select("user_id,agent_key,capability,outcome,created_at")
    .eq("outcome", "denied")
    .gte("created_at", since);

  if (error) {
    console.error("Agent alert scan failed", error);
    return jsonResponse({ error: "Alert scan failed" }, 500);
  }

  const rows = denied || [];
  const alerts: Array<Record<string, unknown>> = [];

  if (rows.length >= 10) {
    alerts.push({
      severity: "warning",
      alert_type: "denial_spike",
      summary: `${rows.length} denied agent requests in 15 minutes`,
      details: { denied_count: rows.length, window_minutes: 15 }
    });
  }

  const byAgent = new Map<string, number>();
  const byUser = new Map<string, number>();

  for (const row of rows) {
    const agent = String(row.agent_key || "unknown");
    byAgent.set(agent, (byAgent.get(agent) || 0) + 1);

    const user = String(row.user_id || "anonymous");
    byUser.set(user, (byUser.get(user) || 0) + 1);
  }

  for (const [agent, count] of byAgent.entries()) {
    if (count >= 8) {
      alerts.push({
        severity: "warning",
        alert_type: "agent_denial_spike",
        agent_key: agent,
        summary: `${count} denied requests for ${agent} in 15 minutes`,
        details: { denied_count: count, window_minutes: 15 }
      });
    }
  }

  for (const [user, count] of byUser.entries()) {
    if (user !== "anonymous" && count >= 5) {
      alerts.push({
        severity: "warning",
        alert_type: "user_denial_spike",
        user_id: user,
        summary: `${count} denied agent requests for one user in 15 minutes`,
        details: { denied_count: count, window_minutes: 15 }
      });
    }
  }

  for (const alert of alerts) {
    await adminClient.from("agent_security_alerts").insert(alert);
  }

  return jsonResponse({ ok: true, alertsCreated: alerts.length });
});