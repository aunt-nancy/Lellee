# Worker scheduling checkpoint — October 29, 2026

## Active configuration

- Primary trigger: Supabase Cron job `lellee-agent-worker-five-minute`, `*/5 * * * *` (UTC).
- Target: existing `dynamic-function`, using the existing dedicated worker secret from Vault.
- Request: `{"mode":"run","limit":3}`; HTTP timeout: 300 seconds.
- GitHub Actions: `.github/workflows/lellee-agent-worker.yml` is manual `workflow_dispatch` only.
- Worker implementation, task eligibility, enabled settings, queue claiming and human review were not modified.
- No new scheduling provider was added.

## Verification

At 22:10 UTC the native scheduled job started on time, its HTTP call returned 200,
and the worker claimed the single authorized verification task. The external model
call reported that its API account had no credits remaining. The existing worker
correctly marked the task `blocked` with `external_api_credits_required`.
The task retains `human_review_required=true`; no output was created.

Test task: `9c02d84a-8037-47fb-bc75-3c57cf2e3dda`.
Source reference: `supabase-cron-cutover-2026-10-29`.

The schedule reaching an eligible task is verified. Successful model generation
and a generated output arriving at pending review remain unverified until credits
are restored through an authorized account action. Do not automatically requeue
this test or other blocked tasks.

A read-only follow-up is scheduled for October 30, 2026 around 15:10 Pacific
to examine 24-hour cadence, function responses, errors and queue age.
The additional admin heartbeat badge was not deployed; use the existing native
Cron execution history and function invocation logs for verification.

## Operational checks

```sql
select j.jobname,j.schedule,j.active,d.start_time,d.end_time,d.status
from cron.job j
left join cron.job_run_details d on d.jobid=j.jobid
where j.jobname='lellee-agent-worker-five-minute'
order by d.start_time desc limit 300;
```

Cron success confirms that SQL submitted the HTTP request. Inspect function
invocation logs and HTTP response bodies to confirm worker success. HTTP 200
and top-level `ok:true` can still contain individual failed or blocked task
results. Do not expose Vault values, HTTP request headers or private task content.
Flag gaps longer than 15 minutes for investigation.

## Manual fallback / rollback

Before using GitHub's manual worker run as a replacement, pause the native job
through a trusted administrator to prevent parallel scheduling:

```sql
select cron.alter_job(jobid := jobid, active := false)
from cron.job where jobname='lellee-agent-worker-five-minute';
```

Use GitHub Actions' Run workflow button on the default branch. It retains the
same credentials, request limit and human-review behavior. Re-enable the native
job after diagnosing the problem. Do not re-enable GitHub's cron while native
scheduling is active.
