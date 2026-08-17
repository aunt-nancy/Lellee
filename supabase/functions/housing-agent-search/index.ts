import { jsonResponse, withAgentGuard } from "../_shared/agent-auth.ts";

function cleanString(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : null;
}

function cleanNumber(value: unknown, min = 0, max = 10000000) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, min), max);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return withAgentGuard(request, {
    agentKey: "housing",
    capability: "housing.search",
    consentRequired: false,
    handler: async ({ userId, userClient }) => {
      const body = await request.json().catch(() => ({}));

      const requestContext = {
        city: cleanString(body.city, 120),
        state: cleanString(body.state, 80),
        zipCode: cleanString(body.zipCode, 20),
        budgetMin: cleanNumber(body.budgetMin, 0, 100000),
        budgetMax: cleanNumber(body.budgetMax, 0, 100000),
        householdSize: cleanNumber(body.householdSize, 1, 25),
        accessibilityNeeds: cleanString(body.accessibilityNeeds, 250),
        petNeeds: cleanString(body.petNeeds, 250)
      };

      const { data: preferences, error } = await userClient
        .from("housing_preferences")
        .select(
          "city,state,zip_code,budget_min,budget_max,household_size,accessibility_needs,pet_needs"
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Housing preferences lookup failed", error);
        return jsonResponse({ error: "Housing preferences unavailable" }, 500);
      }

      // R8 remains read/search only. No writes.
      // Never query journals, coaching messages, clinical notes,
      // substance-use/mental-health history, payment data, or government IDs.
      return jsonResponse({
        ok: true,
        agent: "housing",
        mode: "search_only",
        request: requestContext,
        preferences: preferences || null
      });
    }
  });
});