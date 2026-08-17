import { jsonResponse, withAgentGuard } from "../_shared/agent-auth.ts";

function cleanId(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

Deno.serve(async (request) => {
  const method = request.method.toUpperCase();
  if (!["POST", "PATCH"].includes(method)) {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return withAgentGuard(request, {
    agentKey: "coaching",
    capability: "coaching.shared_messages",
    consentRequired: true,
    handler: async ({ userId, userClient }) => {
      const body = await request.json().catch(() => ({}));
      const messageId = cleanId(body.messageId);
      const threadId = cleanId(body.threadId);
      const granted = body.granted === true;

      if (!messageId && !threadId) {
        return jsonResponse({ error: "messageId or threadId required" }, 400);
      }

      // Important: this function only manages sharing consent records.
      // Message ownership/visibility must also be checked in the message-read function.
      const filter = messageId
        ? { message_id: messageId, thread_id: null }
        : { message_id: null, thread_id: threadId };

      const payload = {
        user_id: userId,
        ...filter,
        is_granted: granted,
        granted_at: granted ? new Date().toISOString() : null,
        revoked_at: granted ? null : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await userClient
        .from("coaching_agent_message_shares")
        .upsert(payload)
        .select("id,message_id,thread_id,is_granted,granted_at,revoked_at,updated_at")
        .single();

      if (error) {
        console.error("Message-share consent update failed", error);
        return jsonResponse({ error: "Sharing preference could not be updated" }, 500);
      }

      return jsonResponse({
        ok: true,
        sharing: data
      });
    }
  });
});