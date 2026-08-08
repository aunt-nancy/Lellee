-- LELLEE PRE-LAUNCH DATABASE VERIFICATION
select 'journey_content' as check_name, count(*)::text as result from public.journey_content
union all select 'published_recovery_tools',count(*)::text from public.recovery_tools where published=true
union all select 'published_learning',count(*)::text from public.content_items where published=true
union all select 'app_version',coalesce(max(value),'missing') from public.app_public_settings where key='app_version';

select schemaname,tablename,rowsecurity
from pg_tables
where schemaname='public'
  and tablename in(
    'guided_responses','journal_entries','support_contacts','privacy_preferences',
    'recovery_date_history','account_deletion_requests','notification_preferences',
    'reminders','push_subscriptions','tool_use_log','personalization_preferences'
  )
order by tablename;
