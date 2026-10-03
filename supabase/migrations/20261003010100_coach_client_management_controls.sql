create or replace function public.update_my_coach_client_relationship(
  p_relationship_id uuid,
  p_service_package_id uuid default null,
  p_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  r public.coach_client_relationships%rowtype;
  next_status text;
begin
  if uid is null then
    raise exception 'Sign in required';
  end if;

  select * into r
  from public.coach_client_relationships
  where id=p_relationship_id
  for update;

  if r.id is null then
    raise exception 'Client relationship not found';
  end if;

  if not public.is_coach_business_member(r.business_id) then
    raise exception 'Coach business access required';
  end if;

  if p_service_package_id is not null and not exists(
    select 1
    from public.coach_service_packages s
    where s.id=p_service_package_id
      and s.business_id=r.business_id
      and s.program_id=r.program_id
      and s.active=true
  ) then
    raise exception 'Service package must be active and belong to this client program';
  end if;

  next_status := coalesce(p_status,r.status);
  if next_status not in ('active','paused','ended') then
    raise exception 'Invalid relationship status';
  end if;

  if r.status='ended' and next_status<>'ended' then
    raise exception 'An ended coaching relationship requires a new invitation and client consent';
  end if;

  update public.coach_client_relationships
  set service_package_id=p_service_package_id,
      status=next_status,
      ended_at=case when next_status='ended' then coalesce(ended_at,now()) else null end
  where id=r.id;

  if next_status='ended' then
    update public.coach_group_members
    set status='removed'
    where relationship_id=r.id and status='active';
  end if;

  return jsonb_build_object(
    'relationship_id',r.id,
    'service_package_id',p_service_package_id,
    'status',next_status,
    'ended',next_status='ended'
  );
end;
$$;

revoke all on function public.update_my_coach_client_relationship(uuid,uuid,text) from public, anon;
grant execute on function public.update_my_coach_client_relationship(uuid,uuid,text) to authenticated, service_role;
