-- Review branch only. Canonical independent-coaching database; no data changes.
-- Replace the existing SELECT predicate rather than adding a permissive policy.
begin;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_policy
    where polrelid = 'public.coach_schedule_events'::regclass
      and polname = 'coach_schedule_business_or_client' and polcmd = 'r'
  ) then
    raise exception 'Expected canonical coaching schedule SELECT policy is missing; review schema drift';
  end if;
end;
$$;

alter policy coach_schedule_business_or_client
on public.coach_schedule_events to authenticated
using (
  public.is_coach_business_member(business_id)
  or exists (
    select 1 from public.coach_client_relationships r
    where r.id = coach_schedule_events.relationship_id
      and r.business_id = coach_schedule_events.business_id
      and r.client_user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.coach_group_members gm
    join public.coach_client_relationships r on r.id = gm.relationship_id
    where gm.group_id = coach_schedule_events.group_id
      and gm.status = 'active'
      and r.business_id = coach_schedule_events.business_id
      and r.client_user_id = (select auth.uid())
  )
);

commit;
