-- LELLEE WAVE 1 — CONTROLLED BETA ACCESS GATE
-- Backend gate only. Does not invite users, activate cohorts, publish programs, or expose public access.

create or replace function public.get_my_wave1_beta_access()
returns table(program_id uuid, program_slug text, cohort_id uuid, cohort_name text, cohort_status text, member_status text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id,
         p.slug,
         c.id,
         c.name,
         c.status,
         m.status
  from public.pilot_cohort_members m
  join public.pilot_cohorts c on c.id = m.cohort_id
  join public.programs p on p.id = c.program_id
  join lateral (
    select r.*
    from public.pilot_readiness_reviews r
    where r.program_id = p.id
      and (r.cohort_id = c.id or r.cohort_id is null)
    order by (r.cohort_id = c.id) desc, r.created_at desc
    limit 1
  ) rr on true
  where m.user_id = auth.uid()
    and m.status = 'active'
    and c.status = 'active'
    and rr.content_ready
    and rr.safety_ready
    and rr.resources_ready
    and rr.accessibility_ready
    and rr.privacy_ready
    and rr.support_ready
    and rr.qa_ready;
$$;

revoke all on function public.get_my_wave1_beta_access() from public;
grant execute on function public.get_my_wave1_beta_access() to authenticated;

create or replace function public.wave1_beta_cohort_ready(p_cohort_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select r.content_ready
       and r.safety_ready
       and r.resources_ready
       and r.accessibility_ready
       and r.privacy_ready
       and r.support_ready
       and r.qa_ready
    from public.pilot_cohorts c
    join lateral (
      select rr.*
      from public.pilot_readiness_reviews rr
      where rr.program_id = c.program_id
        and (rr.cohort_id = c.id or rr.cohort_id is null)
      order by (rr.cohort_id = c.id) desc, rr.created_at desc
      limit 1
    ) r on true
    where c.id = p_cohort_id
  ), false);
$$;

revoke all on function public.wave1_beta_cohort_ready(uuid) from public;
grant execute on function public.wave1_beta_cohort_ready(uuid) to authenticated;

comment on function public.get_my_wave1_beta_access() is 'Returns only active Wave 1 controlled-beta memberships whose cohort is active and whose latest readiness review has every required gate marked ready.';
comment on function public.wave1_beta_cohort_ready(uuid) is 'Read-only readiness check for a controlled-beta cohort; does not activate, invite, enroll, or publish anything.';
