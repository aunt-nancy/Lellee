import { jsonResponse, withAgentGuard } from "../_shared/agent-auth.ts";

Deno.serve(async (request) => {
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return withAgentGuard(request, {
    agentKey: "coaching",
    capability: "coaching.shared_messages",
    consentRequired: true,
    handler: async ({ userId, userClient }) => {
      const url = new URL(request.url);
      const threadId = (url.searchParams.get("threadId") || "").trim().slice(0, 120);

      if (!threadId) {
        return jsonResponse({ error: "threadId required" }, 400);
      }

      const { data: share, error: shareError } = await userClient
        .from("coaching_agent_message_shares")
        .select("is_granted,revoked_at")
        .eq("user_id", userId)
        .eq("thread_id", threadId)
        .maybeSingle();

      if (shareError || !share?.is_granted || share?.revoked_at) {
        return jsonResponse({ error: "Message sharing not granted" }, 403);
      }

      // Assumes coaching_messages includes user_id, thread_id, body, sender_role, created_at.
      // Query is scoped to the signed-in user and the explicitly shared thread.
      const { data, error } = await userClient
        .from("coaching_messages")
        .select("id,thread_id,sender_role,body,created_at")
        .eq("user_id", userId)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Shared coaching message read failed", error);
        return jsonResponse({ error: "Shared messages unavailable" }, 500);
      }

      return jsonResponse({
        ok: true,
        threadId,
        messages: data || []
      });
    }
  });
});