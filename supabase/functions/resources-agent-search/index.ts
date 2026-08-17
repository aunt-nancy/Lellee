import { jsonResponse, withAgentGuard } from "../_shared/agent-auth.ts";

const ALLOWED_CATEGORIES = new Set([
  "recovery",
  "housing",
  "employment",
  "education",
  "food",
  "transportation",
  "healthcare",
  "legal",
  "community",
  "benefits"
]);

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return withAgentGuard(request, {
    agentKey: "resources",
    capability: "resources.search",
    consentRequired: false,
    handler: async ({ userId, userClient }) => {
      const body = await request.json().catch(() => ({}));

      const category = typeof body.category === "string"
        ? body.category.toLowerCase().slice(0, 50)
        : "community";

      if (!ALLOWED_CATEGORIES.has(category)) {
        return jsonResponse({ error: "Unsupported resource category" }, 400);
      }

      const query = typeof body.query === "string"
        ? body.query.trim().slice(0, 200)
        : "";

      // Minimal location context only.
      const { data: profile, error: profileError } = await userClient
        .from("profiles")
        .select("city,state,zip_code")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Resources profile lookup failed", profileError);
        return jsonResponse({ error: "Location context unavailable" }, 500);
      }

      // R7 intentionally performs no writes.
      // This endpoint must not query journals, coaching messages,
      // clinical notes, substance-use history, payment data, or IDs.
      return jsonResponse({
        ok: true,
        agent: "resources",
        mode: "search_only",
        category,
        query,
        location: profile || null
      });
    }
  });
});