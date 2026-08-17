import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "../_shared/agent-auth.ts";

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function bearerToken(request: Request): string {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return auth.slice(7).trim();
}

function cleanKey(value: unknown, max = 100) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function requireAdmin(request: Request) {
  const url = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const token = bearerToken(request);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const userId = userData?.user?.id || null;

  if (userError || !userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const { data: isAdmin, error: adminError } = await adminClient.rpc("is_agent_admin", {
    p_user_id: userId
  });

  if (adminError || isAdmin !== true) {
    throw new Response("Forbidden", { status: 403 });
  }

  return { userId, adminClient };
}

async function auditAdminAction(
  adminClient: ReturnType<typeof createClient>,
  adminUserId: string,
  action: string,
  targetAgent: string | null,
  targetCapability: string | null,
  oldValue: unknown,
  newValue: unknown
) {
  await adminClient.from("agent_admin_action_audit").insert({
    admin_user_id: adminUserId,
    action,
    target_agent: targetAgent,
    target_capability: targetCapability,
    old_value: oldValue ?? null,
    new_value: newValue ?? null
  });
}

Deno.serve(async (request) => {
  try {
    const { userId, adminClient } = await requireAdmin(request);

    if (request.method === "GET") {
      const [
        registryRes,
        grantsRes,
        globalRes,
        auditsRes,
        alertsRes
      ] = await Promise.all([
        adminClient.from("agent_registry")
          .select("agent_key,display_name,is_enabled,updated_at")
          .order("agent_key"),
        adminClient.from("agent_capability_grants")
          .select("agent_key,capability,is_allowed")
          .order("agent_key")
          .order("capability"),
        adminClient.from("agent_global_controls")
          .select("control_key,bool_value,updated_at")
          .order("control_key"),
        adminClient.from("agent_access_audit")
          .select("user_id,agent_key,capability,outcome,created_at")
          .order("created_at", { ascending: false })
          .limit(100),
        adminClient.from("agent_security_alerts")
          .select("id,severity,alert_type,agent_key,summary,status,created_at")
          .order("created_at", { ascending: false })
          .limit(100)
      ]);

      const error =
        registryRes.error || grantsRes.error || globalRes.error ||
        auditsRes.error || alertsRes.error;

      if (error) {
        console.error("Admin agent operations read failed", error);
        return jsonResponse({ error: "Agent operations unavailable" }, 500);
      }

      return jsonResponse({
        ok: true,
        registry: registryRes.data || [],
        capabilities: grantsRes.data || [],
        globalControls: globalRes.data || [],
        recentActivity: auditsRes.data || [],
        alerts: alertsRes.data || []
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await request.json().catch(() => ({}));
    const action = cleanKey(body.action, 60);
    const agentKey = cleanKey(body.agentKey, 60);
    const capability = cleanKey(body.capability, 120);

    if (action === "set_global_stop") {
      const enabled = body.enabled === true;

      const { data: before } = await adminClient
        .from("agent_global_controls")
        .select("bool_value")
        .eq("control_key", "emergency_stop")
        .maybeSingle();

      const { error } = await adminClient
        .from("agent_global_controls")
        .update({
          bool_value: enabled,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq("control_key", "emergency_stop");

      if (error) return jsonResponse({ error: "Global stop could not be changed" }, 500);

      await auditAdminAction(
        adminClient, userId, action, null, null,
        { enabled: before?.bool_value ?? false },
        { enabled }
      );

      return jsonResponse({ ok: true, emergencyStop: enabled });
    }

    if (action === "set_agent_enabled") {
      if (!agentKey) return jsonResponse({ error: "agentKey required" }, 400);
      const enabled = body.enabled === true;

      const { data: before } = await adminClient
        .from("agent_registry")
        .select("is_enabled")
        .eq("agent_key", agentKey)
        .maybeSingle();

      const { error } = await adminClient
        .from("agent_registry")
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq("agent_key", agentKey);

      if (error) return jsonResponse({ error: "Agent could not be changed" }, 500);

      await auditAdminAction(
        adminClient, userId, action, agentKey, null,
        { enabled: before?.is_enabled ?? false },
        { enabled }
      );

      return jsonResponse({ ok: true, agentKey, enabled });
    }

    if (action === "set_capability") {
      if (!agentKey || !capability) {
        return jsonResponse({ error: "agentKey and capability required" }, 400);
      }

      const enabled = body.enabled === true;

      const { data: before } = await adminClient
        .from("agent_capability_grants")
        .select("is_allowed")
        .eq("agent_key", agentKey)
        .eq("capability", capability)
        .maybeSingle();

      const { error } = await adminClient
        .from("agent_capability_grants")
        .update({ is_allowed: enabled })
        .eq("agent_key", agentKey)
        .eq("capability", capability);

      if (error) return jsonResponse({ error: "Capability could not be changed" }, 500);

      await auditAdminAction(
        adminClient, userId, action, agentKey, capability,
        { enabled: before?.is_allowed ?? false },
        { enabled }
      );

      return jsonResponse({ ok: true, agentKey, capability, enabled });
    }

    if (action === "acknowledge_alert" || action === "resolve_alert") {
      const alertId = Number(body.alertId);
      if (!Number.isFinite(alertId)) {
        return jsonResponse({ error: "alertId required" }, 400);
      }

      const patch = action === "acknowledge_alert"
        ? { status: "acknowledged", acknowledged_at: new Date().toISOString() }
        : { status: "resolved", resolved_at: new Date().toISOString() };

      const { error } = await adminClient
        .from("agent_security_alerts")
        .update(patch)
        .eq("id", alertId);

      if (error) return jsonResponse({ error: "Alert could not be updated" }, 500);

      await auditAdminAction(
        adminClient, userId, action, null, null,
        { alert_id: alertId },
        patch
      );

      return jsonResponse({ ok: true, alertId, status: patch.status });
    }

    return jsonResponse({ error: "Unsupported action" }, 400);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Admin agent operations error", error);
    return jsonResponse({ error: "Request could not be completed" }, 500);
  }
});