-- AFTER deploying the send-push-reminders Edge Function and setting secrets,
-- schedule it from Supabase Cron / pg_cron.

-- Replace YOUR_PROJECT_REF and YOUR_PUBLISHABLE_KEY below.
-- Prefer storing these values in Supabase Vault before scheduling.

select vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co',
  'lellee_project_url'
);

select vault.create_secret(
  'YOUR_PUBLISHABLE_KEY',
  'lellee_publishable_key'
);

select cron.schedule(
  'lellee-send-push-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='lellee_project_url')
           || '/functions/v1/send-push-reminders',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey',(select decrypted_secret from vault.decrypted_secrets where name='lellee_publishable_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
