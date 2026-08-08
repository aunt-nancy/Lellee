import Stripe from 'npm:stripe@^22'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
const cryptoProvider = Stripe.createSubtleCryptoProvider()
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const monthlyPrice = Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY')
const annualPrice = Deno.env.get('STRIPE_PRICE_PLUS_ANNUAL')

function membershipStatus(status:string) {
  switch(status) {
    case 'trialing': return 'trialing'
    case 'active': return 'active'
    case 'past_due': return 'past_due'
    case 'canceled': return 'cancelled'
    case 'unpaid': return 'unpaid'
    case 'incomplete': return 'incomplete'
    case 'incomplete_expired': return 'expired'
    case 'paused': return 'paused'
    default: return 'free'
  }
}
async function findUserId(customerId:string, metadataUserId?:string|null) {
  if (metadataUserId) return metadataUserId
  const { data:r } = await admin.from('user_memberships')
    .select('user_id').eq('provider_customer_id',customerId).maybeSingle()
  return r?.user_id || null
}
async function syncSubscription(sub:any) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
  if (!customerId) return
  const userId = await findUserId(customerId, sub.metadata?.user_id)
  if (!userId) return

  const priceId = sub.items?.data?.[0]?.price?.id || null
  const billingPeriod = priceId === annualPrice ? 'annual'
    : priceId === monthlyPrice ? 'monthly' : null
  const status = membershipStatus(sub.status)
  const hasAccess = ['active','trialing'].includes(status)

  await admin.from('user_memberships').upsert({
    user_id:userId,
    tier:hasAccess ? 'plus' : 'free',
    status,
    billing_period:billingPeriod,
    provider:'stripe',
    provider_customer_id:customerId,
    provider_subscription_id:sub.id,
    current_period_start:sub.current_period_start ? new Date(sub.current_period_start*1000).toISOString() : null,
    current_period_end:sub.current_period_end ? new Date(sub.current_period_end*1000).toISOString() : null,
    cancel_at_period_end:!!sub.cancel_at_period_end
  }, { onConflict:'user_id' })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method_not_allowed',{status:405})

  const signature = req.headers.get('stripe-signature') || ''
  const body = await req.text()
  let event:Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature, webhookSecret, undefined, cryptoProvider
    )
  } catch {
    return new Response('bad_signature',{status:400})
  }

  const { data:seen } = await admin.from('stripe_webhook_events')
    .select('event_id,processing_status').eq('event_id',event.id).maybeSingle()
  if (seen?.processing_status === 'processed') {
    return Response.json({ received:true, duplicate:true })
  }

  await admin.from('stripe_webhook_events').upsert({
    event_id:event.id,
    event_type:event.type,
    livemode:event.livemode,
    processing_status:'received'
  }, { onConflict:'event_id' })

  try {
    switch(event.type) {
      case 'checkout.session.completed': {
        const session:any = event.data.object
        const userId = session.client_reference_id || session.metadata?.user_id
        if (userId && session.customer) {
          await admin.from('user_memberships').upsert({
            user_id:userId,
            provider:'stripe',
            provider_customer_id:typeof session.customer === 'string' ? session.customer : session.customer.id
          }, { onConflict:'user_id' })
          await admin.from('plus_checkout_requests').update({
            status:'completed',
            completed_at:new Date().toISOString()
          }).eq('provider_checkout_id',session.id)
        }
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof session.subscription === 'string'
              ? session.subscription : session.subscription.id
          )
          await syncSubscription(sub)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as any)
        break

      case 'invoice.payment_failed': {
        const invoice:any = event.data.object
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (customerId) {
          const userId = await findUserId(customerId)
          if (userId) {
            await admin.from('user_memberships').update({
              tier:'free', status:'past_due'
            }).eq('user_id',userId)
          }
        }
        break
      }

      default:
        await admin.from('stripe_webhook_events').update({
          processing_status:'ignored',
          processed_at:new Date().toISOString()
        }).eq('event_id',event.id)
        return Response.json({ received:true, ignored:true })
    }

    await admin.from('stripe_webhook_events').update({
      processing_status:'processed',
      processed_at:new Date().toISOString()
    }).eq('event_id',event.id)

    return Response.json({ received:true })
  } catch (e) {
    await admin.from('stripe_webhook_events').update({
      processing_status:'failed',
      error_message:e instanceof Error ? e.message : String(e),
      processed_at:new Date().toISOString()
    }).eq('event_id',event.id)
    return Response.json({ error:'processing_failed' }, { status:500 })
  }
})
