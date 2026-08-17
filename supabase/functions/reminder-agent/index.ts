import { jsonResponse, withAgentGuard } from "../_shared/agent-auth.ts";

function cleanText(value: unknown, max = 240) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanIso(value: unknown) {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

Deno.serve(async (request) => {
  const method = request.method.toUpperCase();

  if (!["GET", "POST", "PATCH"].includes(method)) {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const capability =
    method === "GET"
      ? "reminders.read"
      : method === "POST"
      ? "reminders.create"
      : "reminders.update";

  return withAgentGuard(request, {
    agentKey: "reminders",
    capability,
    consentRequired: true,
    handler: async ({ userId, userClient }) => {
      if (method === "GET") {
        const { data, error } = await userClient
          .from("reminders")
          .select("id,title,remind_at,status,source_type,created_at,updated_at")
          .eq("user_id", userId)
          .order("remind_at", { ascending: true });

        if (error) {
          console.error("Reminder read failed", error);
          return jsonResponse({ error: "Reminders unavailable" }, 500);
        }

        return jsonResponse({ ok: true, reminders: data || [] });
      }

      const body = await request.json().catch(() => ({}));

      if (method === "POST") {
        const title = cleanText(body.title, 160);
        const remindAt = cleanIso(body.remindAt);

        if (!title || !remindAt) {
          return jsonResponse({ error: "Title and valid reminder time required" }, 400);
        }

        const { data, error } = await userClient
          .from("reminders")
          .insert({
            user_id: userId,
            title,
            remind_at: remindAt,
            status: "scheduled",
            source_type: "user_approved_agent"
          })
          .select("id,title,remind_at,status,source_type")
          .single();

        if (error) {
          console.error("Reminder create failed", error);
          return jsonResponse({ error: "Reminder could not be created" }, 500);
        }

        return jsonResponse({ ok: true, reminder: data }, 201);
      }

      const id = cleanText(body.id, 80);
      if (!id) return jsonResponse({ error: "Reminder id required" }, 400);

      const patch: Record<string, unknown> = {};
      if ("title" in body) patch.title = cleanText(body.title, 160);
      if ("remindAt" in body) {
        const remindAt = cleanIso(body.remindAt);
        if (!remindAt) return jsonResponse({ error: "Invalid reminder time" }, 400);
        patch.remind_at = remindAt;
      }
      if ("status" in body) {
        const allowed = new Set(["scheduled", "completed", "cancelled"]);
        const status = cleanText(body.status, 30).toLowerCase();
        if (!allowed.has(status)) {
          return jsonResponse({ error: "Invalid reminder status" }, 400);
        }
        patch.status = status;
      }

      const { data, error } = await userClient
        .from("reminders")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .select("id,title,remind_at,status,source_type")
        .maybeSingle();

      if (error) {
        console.error("Reminder update failed", error);
        return jsonResponse({ error: "Reminder could not be updated" }, 500);
      }

      if (!data) return jsonResponse({ error: "Reminder not found" }, 404);

      return jsonResponse({ ok: true, reminder: data });
    }
  });
});