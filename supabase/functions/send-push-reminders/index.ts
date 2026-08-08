import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')!

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get('x-lellee-cron-secret') !== CRON_SECRET) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('id,user_id,title,message,reminder_type')
    .eq('status','pending')
    .lte('due_at', now)
    .limit(100)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  let sent = 0
  for (const reminder of reminders || []) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id,endpoint,p256dh,auth')
      .eq('user_id', reminder.user_id)
      .eq('enabled', true)

    const payload = JSON.stringify({
      title: reminder.title,
      body: reminder.message || 'You have a recovery reminder.',
      page: reminder.reminder_type === 'meeting' ? 'planner' :
            reminder.reminder_type === 'milestone' ? 'milestones' : 'today',
      reminder_id: reminder.id,
      tag: 'lellee-' + reminder.id
    })

    let success = false
    for (const sub of subs || []) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload)
        success = true
        sent++
      } catch (e) {
        const status = e?.statusCode || e?.status
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').update({ enabled:false }).eq('id', sub.id)
        }
      }
    }

    if (success) {
      await supabase.from('reminders')
        .update({ status:'delivered', delivered_at:new Date().toISOString() })
        .eq('id', reminder.id)
    }
  }

  return Response.json({ checked: reminders?.length || 0, sent })
})
