LELLEE — BIG NOTIFICATIONS / REMINDERS BUILD

THIS IS ONE CONSOLIDATED BUILD, NOT AN INCREMENTAL PATCH.

ADDS
- Notification Center
- daily recovery reminder
- saved-meeting reminders
- weekly reflection reminder
- milestone / anniversary reminders
- quiet hours
- browser / phone notification permission
- test notification
- snooze / complete / dismiss controls
- in-app reminder center
- PWA notification-click routing
- Supabase preference storage
- Supabase reminder storage
- automatic reminder generation from saved meetings and recovery date
- service worker notification click support
- current approved design preserved

DEPLOYMENT
1. Run 05_notifications_reminders.sql in Supabase SQL Editor once.
2. Upload ALL web files in this folder to GitHub:
   index.html
   service-worker.js
   manifest.webmanifest
   icon-192.png
   icon-512.png
   vercel.json
3. Commit. Vercel auto-deploys.

IMPORTANT LIMITATION
This build can deliver notifications reliably while the PWA/site is active.
True background push notifications when the app is fully closed require a
server-side Web Push service/VAPID subscription system. The database and
preference architecture here is ready for that later production service.
