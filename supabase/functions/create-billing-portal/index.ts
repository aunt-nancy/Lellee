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
    global:{ headers:{ Authorization:auth } }
  })
  const { data:{ user }, error } = await userClient.auth.getUser()
  if (error || !user) return Response.json({ error:'unauthorized' }, { status:401 })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data:membership } = await admin.from('user_memberships')
    .select('provider_customer_id').eq('user_id',user.id).maybeSingle()

  if (!membership?.provider_customer_id) {
    return Response.json({ error:'no_billing_customer' }, { status:404 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer:membership.provider_customer_id,
    return_url:`${SITE_URL}/app?page=plus`
  })

  return Response.json({ url:session.url })
})
