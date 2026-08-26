LELLEE — DYNAMIC WORKER + PILOT PROGRAM START
August 25, 2026

WHY THIS PACKAGE EXISTS
The current Lellee Supabase project has the restored Program/Agent database
foundation, but it does not have the dynamic-worker Edge Function or Cron job.

DO THIS IN ORDER
1. Run 01_INSTALL_AGENT_WORKER_SQL.sql in Supabase SQL Editor.
2. Create a new Supabase Edge Function named exactly:
      dynamic-worker
   Paste dynamic-worker/index.ts into it and deploy.
3. Add Edge Function secrets (do not share secret values in ChatGPT):
      OPENAI_API_KEY
      LELLEE_AGENT_WORKER_SECRET
      LELLEE_AGENT_MODEL   (optional; recommended gpt-5.6-luna)
4. Test the Edge Function in HEALTH mode using:
      {"mode":"health"}
   Header:
      x-lellee-agent-worker-secret: [your LELLEE_AGENT_WORKER_SECRET]
5. When health returns ok=true, run:
      02_ENABLE_SEVEN_PILOTS_AND_QUEUE_WORK.sql
6. Run:
      03_ENABLE_SAFE_AGENT_EXECUTION.sql
7. Test the Edge Function RUN mode once:
      {"mode":"run","limit":1}
8. Verify the first task reaches needs_review by running:
      04_VERIFY_FIRST_AGENT_RUN.sql
9. THEN create the recurring Supabase Cron job. Do not create Cron before
   the one-task manual test succeeds.

WHAT STAYS OFF
- public multi-program launch
- billing/subscriptions
- autonomous email/SMS/direct messages
- autonomous publishing
- payments/refunds/payouts
- account/permission changes
- journal/private-message/safety-activity access
- secret access
- clinical diagnosis/decision making

OPENAI API NOTE
ChatGPT subscriptions and OpenAI API billing are separate. The Edge Function
needs an OpenAI API key stored only in Supabase Edge Function Secrets.
