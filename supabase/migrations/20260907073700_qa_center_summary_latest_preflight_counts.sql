-- LELLEE QA CENTER — latest platform preflight counts
-- Align QA Center summary cards with the latest Run Platform Checks result.

create or replace function public.get_qa_center_summary()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  latest jsonb := '[]'::jsonb;
  latest_passed int := 0;
  latest_failed int := 0;
  latest_critical int := 0;
begin
  if not public.is_lellee_admin() then raise exception 'Admin access required'; end if;

  select coalesce(results,'[]'::jsonb), coalesce(passed,0), coalesce(failed,0), coalesce(critical_failed,0)
    into latest, latest_passed, latest_failed, latest_critical
  from public.platform_preflight_runs
  order by created_at desc
  limit 1;

  return jsonb_build_object(
    'summary', jsonb_build_object(
      'suites',(select count(*) from public.qa_suites where active=true),
      'passing',coalesce(latest_passed,0),
      'failing',coalesce(latest_failed,0),
      'critical',coalesce(latest_critical,0)
    ),
    'platform_checks',latest,
    'suites',coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',s.name,'category',s.category,
        'test_count',(select count(*) from public.qa_tests t where t.suite_id=s.id and t.active=true),
        'status',coalesce((
          select case
            when count(*) filter(where r.status='fail')>0 then 'fail'
            when count(*) filter(where r.status='pass')>0 then 'pass'
            else 'not_run'
          end
          from public.qa_tests t
          left join lateral (
            select status from public.qa_test_results qr where qr.test_id=t.id order by created_at desc limit 1
          ) r on true
          where t.suite_id=s.id
        ),'not_run')
      ) order by s.name)
      from public.qa_suites s where s.active=true
    ),'[]'::jsonb),
    'results',coalesce((
      select jsonb_agg(jsonb_build_object(
        'test_name',t.name,'suite_name',s.name,'status',r.status,'created_at',r.created_at
      ) order by r.created_at desc)
      from (select * from public.qa_test_results order by created_at desc limit 50) r
      join public.qa_tests t on t.id=r.test_id
      join public.qa_suites s on s.id=t.suite_id
    ),'[]'::jsonb)
  );
end
$function$;
