create table if not exists public.coach_client_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.coach_businesses(id) on delete cascade,
  relationship_id uuid not null references public.coach_client_relationships(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  note_type text not null default 'general'
    check (note_type in ('general','progress','session','goal','follow_up')),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.coach_client_notes is
  'Coach-only operational coaching notes. Not clinical records. Clients do not receive direct table access.';

create index if not exists coach_client_notes_relationship_created_idx
  on public.coach_client_notes (relationship_id, created_at desc);
create index if not exists coach_client_notes_business_idx
  on public.coach_client_notes (business_id);

alter table public.coach_client_notes enable row level security;

revoke all on table public.coach_client_notes from public, anon, authenticated;
grant select, insert on table public.coach_client_notes to authenticated;
grant all on table public.coach_client_notes to service_role;

drop policy if exists coach_client_notes_business_read on public.coach_client_notes;
create policy coach_client_notes_business_read
on public.coach_client_notes
for select
to authenticated
using (
  public.is_coach_business_member(business_id)
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
  and public.is_coach_business_member(business_id)
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
      'specialty_required',1
    );
  end if;

  select exists(
    select 1 from public.coach_businesses b
    where b.id=p_business_id and b.status='approved'
  ) into business_approved;

  select exists(
    select 1
    from public.training_records tr
    left join public.professional_courses pc on pc.id=tr.professional_course_id
    left join public.professional_enrollments pe on pe.id=tr.professional_enrollment_id
    where tr.user_id=p_user_id
      and tr.status='completed'
      and tr.verified=true
      and (
        lower(coalesce(pc.course_key,'')) in ('lellee_orientation','coach_orientation','coaching_orientation')
        or lower(tr.title) like 'lellee orientation%'
      )
  ) into orientation_complete;

  select exists(
    select 1
    from public.training_records tr
    left join public.professional_courses pc on pc.id=tr.professional_course_id
    where tr.user_id=p_user_id
      and tr.status='completed'
      and tr.verified=true
      and (
        lower(coalesce(pc.course_key,'')) in ('lellee_ethics','coach_ethics','coaching_ethics')
        or lower(tr.title) like 'lellee ethics%'
        or lower(tr.title) like 'ethics & professional conduct%'
      )
  ) into ethics_complete;

  select exists(
    select 1
    from public.training_records tr
    left join public.professional_courses pc on pc.id=tr.professional_course_id
    where tr.user_id=p_user_id
      and tr.status='completed'
      and tr.verified=true
      and (
        lower(coalesce(pc.course_key,'')) in ('lellee_entrepreneurship','coach_entrepreneurship','entrepreneurship_for_coaches')
        or lower(tr.title) like 'lellee entrepreneur%'
        or lower(tr.title) like 'becoming an entrepreneur%'
      )
  ) into entrepreneur_complete;

  select count(*) into core_completed
  from (
    select distinct pc.id
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
    select distinct tr.id
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
    'required_count',7,
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

create or replace function public.get_my_coach_go_live_readiness()
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_catalog, auth
as $$
declare
  uid uuid := auth.uid();
  bid uuid;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select m.business_id into bid
  from public.coach_business_members m
  where m.user_id=uid and m.status='active'
  order by case when m.role='owner' then 0 when m.role='admin' then 1 else 2 end,m.created_at
  limit 1;

  if bid is null then
    select b.id into bid
    from public.coach_businesses b
    where b.owner_user_id=uid
    limit 1;
  end if;

  if bid is null then
    return private.coach_go_live_readiness(null,uid);
  end if;

  if not public.is_coach_business_member(bid)
     and not exists(select 1 from public.coach_businesses b where b.id=bid and b.owner_user_id=uid) then
    raise exception 'Coach business access required';
  end if;

  return private.coach_go_live_readiness(bid,uid);
end;
$$;

revoke all on function public.get_my_coach_go_live_readiness() from public, anon;
grant execute on function public.get_my_coach_go_live_readiness() to authenticated, service_role;

create or replace function public.admin_set_coach_marketplace_visibility(p_business_id uuid, p_visible boolean)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_catalog, auth
as $$
declare
  coach_uid uuid;
  readiness jsonb;
begin
  if auth.uid() is null or not public.is_lellee_admin() then
    raise exception using errcode='42501',message='Admin access required';
  end if;

  if p_visible and not coalesce(
    (select s.value='true' from public.app_public_settings s where s.key='coach_public_marketplace_enabled'),
    false
  ) then
    raise exception using errcode='42501',message='Global coach marketplace is still off';
  end if;

  if p_visible then
    select b.owner_user_id into coach_uid
    from public.coach_businesses b
    where b.id=p_business_id;

    readiness := private.coach_go_live_readiness(p_business_id,coach_uid);
    if coalesce((readiness->>'ready')::boolean,false) is not true then
      raise exception using errcode='42501',message='Coach cannot go live until all required Lellee training and business-readiness requirements are complete';
    end if;
  end if;

  update public.coach_businesses
  set marketplace_visible=coalesce(p_visible,false),
      marketplace_reviewed_at=clock_timestamp(),
      updated_at=clock_timestamp()
  where id=p_business_id
    and (not p_visible or status='approved');

  return found;
end;
$$;

revoke all on function public.admin_set_coach_marketplace_visibility(uuid,boolean) from public, anon;
grant execute on function public.admin_set_coach_marketplace_visibility(uuid,boolean) to authenticated, service_role;

create or replace function public.review_coach_public_profile(
  p_profile_id uuid,
  p_profile_status text,
  p_credential_review_status text default null,
  p_make_public boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_catalog, auth
as $$
declare
  profile_business_id uuid;
  profile_coach_user_id uuid;
  readiness jsonb;
begin
  if not public.has_credential_review_access() then
    raise exception 'Credential/profile review access required';
  end if;
  if p_profile_status not in('approved','paused','rejected','pending_review') then
    raise exception 'Invalid review status';
  end if;
  if p_credential_review_status is not null
     and p_credential_review_status not in('not_reviewed','pending','verified','partially_verified','rejected') then
    raise exception 'Invalid credential review status';
  end if;
  if p_make_public and p_profile_status<>'approved' then
    raise exception 'Only an approved profile may be made public';
  end if;

  if p_make_public then
    select business_id,coach_user_id
    into profile_business_id,profile_coach_user_id
    from public.coach_public_profiles
    where id=p_profile_id;

    readiness := private.coach_go_live_readiness(profile_business_id,profile_coach_user_id);
    if coalesce((readiness->>'ready')::boolean,false) is not true then
      raise exception 'Coach cannot go live until all required Lellee training and business-readiness requirements are complete';
    end if;
  end if;

  update public.coach_public_profiles
  set profile_status=p_profile_status,
      credential_review_status=coalesce(p_credential_review_status,credential_review_status),
      public_visible=case when p_profile_status='approved' then p_make_public else false end,
      reviewed_by=auth.uid(),
      reviewed_at=now(),
      updated_at=now()
  where id=p_profile_id;

  return found;
end;
$$;

revoke all on function public.review_coach_public_profile(uuid,text,text,boolean) from public, anon;
grant execute on function public.review_coach_public_profile(uuid,text,text,boolean) to authenticated, service_role;
