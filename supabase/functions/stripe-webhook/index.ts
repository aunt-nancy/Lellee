import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

type Offer = { entitlement: string; interval: "monthly" | "annual" | "one_time"; price: string };

const OFFERS: Record<string, Offer> = {
  plus_monthly: { entitlement: "plus", interval: "monthly", price: "price_1UKkL6DpLc9a3tUuZyLbJOEH" },
  plus_annual: { entitlement: "plus", interval: "annual", price: "price_1UKkL5DpLc9a3tUu4cM6QJTy" },
  premium_monthly: { entitlement: "premium", interval: "monthly", price: "price_1UKkL7DpLc9a3tUuMg0wvgXy" },
  premium_annual: { entitlement: "premium", interval: "annual", price: "price_1UKkOQDpLc9a3tUu4oO2bU0y" },
  journal_companion_monthly: { entitlement: "journal_companion", interval: "monthly", price: "price_1UKkOPDpLc9a3tUutSwZPky7" },
  coach_addon_monthly: { entitlement: "coach", interval: "monthly", price: "price_1UKkL9DpLc9a3tUuoo3NE0HO" },
  coach_checkin: { entitlement: "coach_checkin", interval: "one_time", price: "price_1UKkL8DpLc9a3tUuVkHtcSRq" },
  coaching_foundations: { entitlement: "coaching_foundations", interval: "one_time", price: "price_1UKkaxDpLc9a3tUuT6Gsqfz7" },
  specialty_recovery: { entitlement: "specialty_recovery", interval: "one_time", price: "price_1UKkaxDpLc9a3tUuXJOj4OsM" },
  specialty_reentry: { entitlement: "specialty_reentry", interval: "one_time", price: "price_1UKkayDpLc9a3tUuHgN88yMz" },
  specialty_housing_stability: { entitlement: "specialty_housing_stability", interval: "one_time", price: "price_1UKkazDpLc9a3tUuzl2jCKGU" },
  specialty_caregiving: { entitlement: "specialty_caregiving", interval: "one_time", price: "price_1UKkb0DpLc9a3tUu7SEYfTi4" },
  specialty_grief_life_after_loss: { entitlement: "specialty_grief_life_after_loss", interval: "one_time", price: "price_1UKkb0DpLc9a3tUuyY6kOiyu" },
  specialty_workforce_new_beginnings: { entitlement: "specialty_workforce_new_beginnings", interval: "one_time", price: "price_1UKkb2DpLc9a3tUu5SmrBofJ" },
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function verifySignature(payload: string, header: string, secret: string) {
  const values = header.split(",").map((part) => part.trim());
  const timestamp = values.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = values.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)));
  return signatures.some((candidate) => constantTimeEqual(digest, candidate));
}

function stripeId(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
  return null;
}

function subscriptionStatus(status: string) {
  if (["active", "trialing", "past_due", "paused"].includes(status)) return status;
  if (status === "canceled") return "cancelled";
  return "expired";
}

async function upsertCheckoutEntitlement(session: Record<string, any>) {
  const userId = session.client_reference_id;
  const offerKey = session.metadata?.lellee_offer_key;
  const offer = OFFERS[offerKey];
  if (!uuidPattern.test(String(userId || "")) || !offer) throw new Error("missing_checkout_identity");
  if (!["paid", "no_payment_required"].includes(String(session.payment_status || ""))) return;

  const { error } = await admin.from("user_entitlements").upsert({
    user_id: userId,
    entitlement_key: offer.entitlement,
    status: "active",
    source: "stripe",
    billing_interval: offer.interval,
    stripe_customer_id: stripeId(session.customer),
    stripe_subscription_id: stripeId(session.subscription),
    stripe_price_id: offer.price,
    current_period_end: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,entitlement_key" });
  if (error) throw error;
}

async function syncSubscription(subscription: Record<string, any>) {
  const subscriptionId = stripeId(subscription.id);
  if (!subscriptionId) return;
  const item = subscription.items?.data?.[0];
  const periodEnd = subscription.current_period_end ?? item?.current_period_end;
  const { error } = await admin.from("user_entitlements").update({
    status: subscriptionStatus(String(subscription.status || "")),
    stripe_customer_id: stripeId(subscription.customer),
    stripe_price_id: stripeId(item?.price),
    current_period_end: periodEnd ? new Date(Number(periodEnd) * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subscriptionId);
  if (error) throw error;
}

function invoiceSubscriptionId(invoice: Record<string, any>) {
  return stripeId(invoice.subscription) || stripeId(invoice.parent?.subscription_details?.subscription);
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  const { data: secret, error: secretError } = await admin.rpc("get_stripe_webhook_signing_secret");
  if (secretError || !secret) return new Response("webhook_secret_unavailable", { status: 503 });
  if (!await verifySignature(payload, signature, String(secret))) return new Response("bad_signature", { status: 400 });

  let event: Record<string, any>;
  try { event = JSON.parse(payload); } catch { return new Response("bad_payload", { status: 400 }); }
  if (!event.livemode) return new Response("live_events_only", { status: 400 });

  const object = event.data?.object || {};
  const { data: existing } = await admin.from("stripe_webhook_events")
    .select("processing_status").eq("stripe_event_id", event.id).maybeSingle();
  if (existing?.processing_status === "processed" || existing?.processing_status === "ignored") {
    return Response.json({ received: true, duplicate: true });
  }

  await admin.from("stripe_webhook_events").upsert({
    stripe_event_id: event.id,
    event_type: event.type,
    livemode: true,
    object_id: typeof object.id === "string" ? object.id : null,
    processing_status: "processing",
    received_at: new Date().toISOString(),
    last_error: null,
  }, { onConflict: "stripe_event_id" });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await upsertCheckoutEntitlement(object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(object);
        break;
      case "invoice.paid":
      case "invoice.payment_failed": {
        const subscriptionId = invoiceSubscriptionId(object);
        if (subscriptionId) {
          const status = event.type === "invoice.paid" ? "active" : "past_due";
          const { error } = await admin.from("user_entitlements")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subscriptionId);
          if (error) throw error;
        }
        break;
      }
      case "checkout.session.async_payment_failed":
        break;
      default:
        await admin.from("stripe_webhook_events").update({
          processing_status: "ignored", processed_at: new Date().toISOString(),
        }).eq("stripe_event_id", event.id);
        return Response.json({ received: true, ignored: true });
    }

    await admin.from("stripe_webhook_events").update({
      processing_status: "processed", processed_at: new Date().toISOString(), last_error: null,
    }).eq("stripe_event_id", event.id);
    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "processing_failed";
    await admin.from("stripe_webhook_events").update({
      processing_status: "failed", processed_at: new Date().toISOString(), last_error: message,
    }).eq("stripe_event_id", event.id);
    return new Response("processing_failed", { status: 500 });
  }
});
