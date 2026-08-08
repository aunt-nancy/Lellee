LELLEE — BIG BACKGROUND PUSH BUILD

Adds true background Web Push architecture:
- push subscription storage
- browser/PWA subscription UI
- service worker push event handling
- Supabase Edge Function to send due reminders
- Supabase Cron scheduling template
- VAPID key pair generated for this project build

IMPORTANT:
1. Run 08_background_push.sql in Supabase SQL Editor.
2. Insert the VAPID public key into app_public_settings:
   insert into public.app_public_settings(key,value)
   values ('vapid_public_key','BDgpDvc6TBzD4okAwP5T1H7upiXUDnQSutSlHka04hd-UukuWApfmL18yzCAjerE1XTzK1ruLQwk3F1WJr480UE')
   on conflict (key) do update set value=excluded.value;
3. In Supabase Edge Function secrets, set:
   VAPID_PUBLIC_KEY=BDgpDvc6TBzD4okAwP5T1H7upiXUDnQSutSlHka04hd-UukuWApfmL18yzCAjerE1XTzK1ruLQwk3F1WJr480UE
   VAPID_PRIVATE_KEY=<from VAPID_KEYS_PRIVATE_DO_NOT_UPLOAD.txt>
   VAPID_SUBJECT=mailto:YOUR_REAL_ADMIN_EMAIL
4. Deploy supabase/functions/send-push-reminders/index.ts as Edge Function send-push-reminders.
5. Schedule the function with Supabase Cron using 09_schedule_push_cron.sql after replacing placeholders.
6. Upload all web/PWA files to GitHub and commit.

DO NOT upload VAPID_KEYS_PRIVATE_DO_NOT_UPLOAD.txt to GitHub.
The private key belongs only in Supabase Edge Function secrets.
