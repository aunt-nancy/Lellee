-- Primary worker trigger. GitHub workflow_dispatch remains the manual fallback.
-- Reuses existing Vault credentials and the existing worker's authorization,
-- eligibility, limit=3, credit-block handling and human-review requirements.
-- Named scheduling is idempotent: applying this updates the existing named job.
select cron.schedule(
  'lellee-agent-worker-five-minute',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := (select rtrim(decrypted_secret,'/') from vault.decrypted_secrets
            where name='project_url') || '/functions/v1/dynamic-function',
    body := '{"mode":"run","limit":3}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-lellee-agent-worker-secret',
      (select decrypted_secret from vault.decrypted_secrets
       where name='lellee_agent_worker_secret')),
    timeout_milliseconds := 300000
  ) as request_id;
  $job$
);
