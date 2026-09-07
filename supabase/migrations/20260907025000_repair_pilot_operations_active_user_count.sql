-- Repair Pilot Operations summary after pilot enrollment consolidation.
-- The legacy public.program_pilot_enrollments relation is not part of the
-- canonical hkrr production schema. Active pilot participation is represented
-- by public.pilot_cohort_members.

create or replace function public.get_pilot_operations_summary()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_lellee_admin() then raise exception 'Admin access required'; end if;

  return jsonb_build_object(
    'summary',jsonb_build_object(
      'cohorts',(select count(*) from public.pilot_cohorts where status not in('completed','cancelled')),
      'users',(select count(distinct user_id) from public.pilot_cohort_members where status='active'),
      'feedback',(select count(*) from public.support_requests where request_type='pilot'),
      'issues',(select count(*) from public.pilot_issues where status not in('resolved','closed'))
    ),
    'cohorts',coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',c.name,'program_name',p.name,'status',c.status,
        'member_count',(select count(*) from public.pilot_cohort_members m where m.cohort_id=c.id and m.status='active'),
        'readiness_status',coalesce((
          select case when pr.content_ready and pr.safety_ready and pr.resources_ready and pr.accessibility_ready and pr.privacy_ready and pr.support_ready and pr.qa_ready then 'ready' else 'review' end
          from public.pilot_readiness_reviews pr where pr.cohort_id=c.id order by created_at desc limit 1
        ),'not reviewed')
      ) order by c.created_at desc)
      from public.pilot_cohorts c join public.programs p on p.id=c.program_id
    ),'[]'::jsonb),
    'feedback',coalesce((
      select jsonb_agg(jsonb_build_object(
        'subject',s.subject,'status',s.status,'priority',s.priority,
        'program_name',null
      ) order by s.created_at desc)
      from public.support_requests s
      where s.request_type='pilot'
    ),'[]'::jsonb),
    'issues',coalesce((
      select jsonb_agg(jsonb_build_object(
        'title',i.title,'severity',i.severity,'status',i.status,'program_name',p.name
      ) order by i.created_at desc)
      from public.pilot_issues i left join public.programs p on p.id=i.program_id
    ),'[]'::jsonb),
    'readiness',coalesce((
      select jsonb_agg(jsonb_build_object(
        'program_name',p.name,
        'status',case when r.content_ready and r.safety_ready and r.resources_ready and r.accessibility_ready and r.privacy_ready and r.support_ready and r.qa_ready then 'ready' else 'review' end,
        'detail',coalesce(r.recommendation,'Readiness review recorded.')
      ) order by r.created_at desc)
      from public.pilot_readiness_reviews r join public.programs p on p.id=r.program_id
    ),'[]'::jsonb)
  );
end $function$;

grant execute on function public.get_pilot_operations_summary() to authenticated;
revoke execute on function public.get_pilot_operations_summary() from anon;
