import { jsonResponse } from "../_shared/agent-auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (request) => {
  try {
    const token = bearerToken(request);
    const client = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData?.user?.id) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (request.method === "GET") {
      const { data, error } = await client.rpc("get_my_agent_control_center");
      if (error) {
        console.error("Control center read failed", error);
        return jsonResponse({ error: "Control center unavailable" }, 500);
      }
      return jsonResponse({ ok: true, controlCenter: data });
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const action = typeof body.action === "string" ? body.action : "";
      const agentKey = typeof body.agentKey === "string" ? body.agentKey.slice(0, 40) : "";
      const capability = typeof body.capability === "string" ? body.capability.slice(0, 80) : "";

      if (!agentKey) {
        return jsonResponse({ error: "agentKey required" }, 400);
      }

      if (action === "revoke_capability") {
        if (!capability) {
          return jsonResponse({ error: "capability required" }, 400);
        }
        const { data, error } = await client.rpc("revoke_my_agent_consent", {
          p_agent_key: agentKey,
          p_capability: capability
        });
        if (error) {
          console.error("Capability revoke failed", error);
          return jsonResponse({ error: "Could not revoke capability" }, 500);
        }
        return jsonResponse({ ok: true, revoked: data === true });
      }

      if (action === "revoke_agent") {
        const { data, error } = await client.rpc("revoke_all_my_agent_consents", {
          p_agent_key: agentKey
        });
        if (error) {
          console.error("Agent revoke failed", error);
          return jsonResponse({ error: "Could not revoke agent access" }, 500);
        }
        return jsonResponse({ ok: true, revokedCount: data || 0 });
      }

      return jsonResponse({ error: "Unsupported action" }, 400);
    }

    return jsonResponse({ error: "Method not allowed" }, 405);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Agent control center error", error);
    return jsonResponse({ error: "Request could not be completed" }, 500);
  }
});