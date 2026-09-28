import Stripe from 'npm:stripe@^22'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = (Deno.env.get('SITE_URL') || 'https://lellee.com').replace(/\/$/,'')

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error:'method_not_allowed' }, { status:405 })

  const auth = req.headers.get('Authorization') || ''
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } }
  })
  const { data:{ user }, error:userError } = await userClient.auth.getUser()
  if (userError || !user) return Response.json({ error:'unauthorized' }, { status:401 })

  const { plan = 'monthly' } = await req.json().catch(()=>({}))
  if (!['monthly','annual'].includes(plan)) {
    return Response.json({ error:'invalid_plan' }, { status:400 })
  }

  const priceId = plan === 'annual'
    ? Deno.env.get('STRIPE_PRICE_PLUS_ANNUAL')
    : Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY')
  if (!priceId) return Response.json({ error:'stripe_price_not_configured' }, { status:500 })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data:membership } = await admin.from('user_entitlements')
    .select('*').eq('user_id',user.id).in('entitlement_key',['plus','premium'])
    .in('status',['active','trialing']).limit(1).maybeSingle()

  if (membership && ['active','trialing'].includes(membership.status)) {
    return Response.json({ error:'already_subscribed', manage_billing:true }, { status:409 })
  }

  let customerId = membership?.stripe_customer_id || null
  if (!customerId) {
    const { data:customerEntitlement } = await admin.from('user_entitlements')
      .select('stripe_customer_id').eq('user_id',user.id)
      .not('stripe_customer_id','is',null).limit(1).maybeSingle()
    customerId = customerEntitlement?.stripe_customer_id || null
  }
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { lellee_user_id:user.id }
    })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    mode:'subscription',
    customer:customerId,
    line_items:[{ price:priceId, quantity:1 }],
    allow_promotion_codes:true,
    client_reference_id:user.id,
    success_url:`${SITE_URL}/app?page=plus&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:`${SITE_URL}/app?page=plus&checkout=cancelled`,
    metadata:{ user_id:user.id, plan, lellee_offer_key:`plus_${plan}`, lellee_entitlement:'plus' },
    subscription_data:{ metadata:{ user_id:user.id, plan, lellee_offer_key:`plus_${plan}`, lellee_entitlement:'plus' } }
  })

  await admin.from('plus_checkout_requests').insert({
    user_id:user.id,
    requested_plan:plan,
    status:'checkout_created',
    provider_checkout_id:session.id,
    return_url:`${SITE_URL}/app?page=plus`
  })

  return Response.json({ url:session.url })
})
