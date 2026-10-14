drop policy if exists coach_client_notes_business_read on public.coach_client_notes;
create policy coach_client_notes_business_read
on public.coach_client_notes
for select
to authenticated
using (
  (
    public.is_coach_business_member(business_id)
    or exists (
      select 1 from public.coach_businesses b
      where b.id=coach_client_notes.business_id
        and b.owner_user_id=(select auth.uid())
    )
  )
  and exists (
    select 1
    from public.coach_client_relationships r
    where r.id = relationship_id
      and r.business_id = coach_client_notes.business_id
  )
);

drop policy if exists coach_client_notes_business_insert on public.coach_client_notes;
create policy coach_client_notes_business_insert
on public.coach_client_notes
for insert
to authenticated
with check (
  author_user_id = (select auth.uid())
  and (
    public.is_coach_business_member(business_id)
    or exists (
      select 1 from public.coach_businesses b
      where b.id=coach_client_notes.business_id
        and b.owner_user_id=(select auth.uid())
    )
  )
  and exists (
    select 1
    from public.coach_client_relationships r
    where r.id = relationship_id
      and r.business_id = coach_client_notes.business_id
  )
);

create or replace function private.coach_go_live_readiness(p_business_id uuid, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_catalog, auth
as $$
declare
  business_approved boolean := false;
  orientation_complete boolean := false;
  ethics_complete boolean := false;
  entrepreneur_complete boolean := false;
  core_completed integer := 0;
  specialty_completed integer := 0;
  ready boolean := false;
begin
  if p_business_id is null or p_user_id is null then
    return jsonb_build_object(
      'ready',false,
      'business_approved',false,
      'orientation_complete',false,
      'ethics_complete',false,
      'entrepreneur_complete',false,
      'core_completed',0,
      'core_required',3,
      'specialty_completed',0,
      'specialty_required',1,
      'required_count',8,
      'completed_count',0
    );
  end if;

  select exists(
    select 1 from public.coach_businesses b
    where b.id=p_business_id and b.status='approved'
  ) into business_approved;

  select (
    exists(
      select 1
      from public.training_records tr
      left join public.professional_courses pc on pc.id=tr.professional_course_id
      where tr.user_id=p_user_id and tr.status='completed' and tr.verified=true
        and (
          lower(coalesce(pc.course_key,'')) in ('lellee_orientation','coach_orientation','coaching_orientation')
          or lower(tr.title) like 'lellee orientation%'
        )
    )
    or exists(
      select 1 from public.professional_enrollments pe
      join public.professional_courses pc on pc.id=pe.course_id
      where pe.user_id=p_user_id and pe.status='completed' and pe.verified_at is not null
        and lower(pc.course_key) in ('lellee_orientation','coach_orientation','coaching_orientation')
    )
  ) into orientation_complete;

  select (
    exists(
      select 1
      from public.training_records tr
      left join public.professional_courses pc on pc.id=tr.professional_course_id
      where tr.user_id=p_user_id and tr.status='completed' and tr.verified=true
        and (
          lower(coalesce(pc.course_key,'')) in ('lellee_ethics','coach_ethics','coaching_ethics')
          or lower(tr.title) like 'lellee ethics%'
          or lower(tr.title) like 'ethics & professional conduct%'
        )
    )
    or exists(
      select 1 from public.professional_enrollments pe
      join public.professional_courses pc on pc.id=pe.course_id
      where pe.user_id=p_user_id and pe.status='completed' and pe.verified_at is not null
        and lower(pc.course_key) in ('lellee_ethics','coach_ethics','coaching_ethics')
    )
  ) into ethics_complete;

  select (
    exists(
      select 1
      from public.training_records tr
      left join public.professional_courses pc on pc.id=tr.professional_course_id
      where tr.user_id=p_user_id and tr.status='completed' and tr.verified=true
        and (
          lower(coalesce(pc.course_key,'')) in ('lellee_entrepreneurship','coach_entrepreneurship','entrepreneurship_for_coaches')
          or lower(tr.title) like 'lellee entrepreneur%'
          or lower(tr.title) like 'becoming an entrepreneur%'
        )
    )
    or exists(
      select 1 from public.professional_enrollments pe
      join public.professional_courses pc on pc.id=pe.course_id
      where pe.user_id=p_user_id and pe.status='completed' and pe.verified_at is not null
        and lower(pc.course_key) in ('lellee_entrepreneurship','coach_entrepreneurship','entrepreneurship_for_coaches')
    )
  ) into entrepreneur_complete;

  select count(*) into core_completed
  from (
    select distinct pc.id::text as completion_key
    from public.professional_enrollments pe
    join public.professional_courses pc on pc.id=pe.course_id
    where pe.user_id=p_user_id
      and pe.status='completed'
      and pe.verified_at is not null
      and pc.category='foundation'
      and pc.course_key not in (
        'lellee_orientation','coach_orientation','coaching_orientation',
        'lellee_ethics','coach_ethics','coaching_ethics',
        'lellee_entrepreneurship','coach_entrepreneurship','entrepreneurship_for_coaches'
      )
    union
    select 'manual:'||tr.id::text
    from public.training_records tr
    where tr.user_id=p_user_id
      and tr.status='completed'
      and tr.verified=true
      and tr.professional_course_id is null
      and tr.professional_enrollment_id is null
      and lower(tr.title) like 'lellee core coaching%'
  ) q;

  select count(distinct pc.id) into specialty_completed
  from public.professional_enrollments pe
  join public.professional_courses pc on pc.id=pe.course_id
  where pe.user_id=p_user_id
    and pe.status='completed'
    and pe.verified_at is not null
    and pc.category='specialty';

  ready := business_approved
    and orientation_complete
    and ethics_complete
    and entrepreneur_complete
    and core_completed >= 3
    and specialty_completed >= 1;

  return jsonb_build_object(
    'ready',ready,
    'business_approved',business_approved,
    'orientation_complete',orientation_complete,
    'ethics_complete',ethics_complete,
    'entrepreneur_complete',entrepreneur_complete,
    'core_completed',core_completed,
    'core_required',3,
    'specialty_completed',specialty_completed,
    'specialty_required',1,
    'required_count',8,
    'completed_count',
      (case when business_approved then 1 else 0 end)
      + (case when orientation_complete then 1 else 0 end)
      + (case when ethics_complete then 1 else 0 end)
      + (case when entrepreneur_complete then 1 else 0 end)
      + least(core_completed,3)
      + least(specialty_completed,1),
    'note','Public Coaching activation remains locked until business approval, Lellee Orientation, Ethics, Entrepreneurship, three core coaching courses, and at least one specialty are complete and verified.'
  );
end;
$$;

revoke all on function private.coach_go_live_readiness(uuid,uuid) from public, anon, authenticated;
