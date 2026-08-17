import { jsonResponse, withAgentGuard } from "../_shared/agent-auth.ts";

function cleanText(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanIso(value: unknown) {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

Deno.serve(async (request) => {
  const method = request.method.toUpperCase();

  if (!["GET","POST","PATCH"].includes(method)) {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return withAgentGuard(request, {
    agentKey: "coaching",
    capability: "coaching.schedule",
    consentRequired: true,
    handler: async ({ userId, userClient }) => {
      if (method === "GET") {
        const { data, error } = await userClient
          .from("coaching_appointments")
          .select("id,coach_id,start_at,duration_minutes,status,created_at,updated_at")
          .eq("user_id", userId)
          .order("start_at", { ascending: true });

        if (error) {
          console.error("Coaching schedule read failed", error);
          return jsonResponse({ error: "Coaching schedule unavailable" }, 500);
        }

        return jsonResponse({ ok: true, appointments: data || [] });
      }

      const body = await request.json().catch(() => ({}));

      if (method === "POST") {
        const coachId = cleanText(body.coachId, 80);
        const startAt = cleanIso(body.startAt);
        const duration = Number(body.durationMinutes);

        if (!coachId || !startAt || !Number.isFinite(duration) || duration < 15 || duration > 120) {
          return jsonResponse({ error: "Valid coach, start time, and duration required" }, 400);
        }

        const { data, error } = await userClient
          .from("coaching_appointments")
          .insert({
            user_id: userId,
            coach_id: coachId,
            start_at: startAt,
            duration_minutes: duration,
            status: "requested"
          })
          .select("id,coach_id,start_at,duration_minutes,status")
          .single();

        if (error) {
          console.error("Coaching appointment create failed", error);
          return jsonResponse({ error: "Appointment could not be requested" }, 500);
        }

        return jsonResponse({ ok: true, appointment: data }, 201);
      }

      const id = cleanText(body.id, 80);
      if (!id) return jsonResponse({ error: "Appointment id required" }, 400);

      const patch: Record<string, unknown> = {};
      if ("startAt" in body) {
        const startAt = cleanIso(body.startAt);
        if (!startAt) return jsonResponse({ error: "Invalid start time" }, 400);
        patch.start_at = startAt;
      }
      if ("status" in body) {
        const allowed = new Set(["requested","confirmed","cancelled","completed"]);
        const status = cleanText(body.status, 30).toLowerCase();
        if (!allowed.has(status)) return jsonResponse({ error: "Invalid status" }, 400);
        patch.status = status;
      }

      const { data, error } = await userClient
        .from("coaching_appointments")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .select("id,coach_id,start_at,duration_minutes,status")
        .maybeSingle();

      if (error) {
        console.error("Coaching appointment update failed", error);
        return jsonResponse({ error: "Appointment could not be updated" }, 500);
      }

      if (!data) return jsonResponse({ error: "Appointment not found" }, 404);

      return jsonResponse({ ok: true, appointment: data });
    }
  });
});