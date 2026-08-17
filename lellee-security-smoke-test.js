/*
  LELLEE R6 AGENT SECURITY SMOKE TEST
  Run from an authenticated test account against deployed Edge Functions.
  This file contains no credentials.
*/
window.LelleeSecuritySmokeTest = {
  async call(functionUrl, token, options = {}) {
    const res = await fetch(functionUrl, {
      method: options.method || "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: options.method === "GET" ? undefined : JSON.stringify(options.body || {})
    });

    let body = null;
    try { body = await res.json(); } catch (_) {}

    return {
      status: res.status,
      ok: res.ok,
      body
    };
  },

  assertNoForbiddenFields(value) {
    const text = JSON.stringify(value || {}).toLowerCase();
    const forbidden = [
      "journal_entries",
      "private_messages",
      "clinical_notes",
      "payment_details",
      "service_role"
    ];
    return forbidden.filter((key) => text.includes(key));
  }
};