create or replace function public.update_my_coach_group(
  p_group_id uuid,
  p_name text,
  p_description text default null,
  p_service_package_id uuid default null,
  p_capacity integer default null,
  p_status text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_group_price numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  g public.coach_groups%rowtype;
  next_capacity integer;
  next_status text;
  active_members integer;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select * into g
  from public.coach_groups
  where id=p_group_id
  for update;

  if g.id is null then raise exception 'Coaching group not found'; end if;
  if not public.is_coach_business_member(g.business_id) then
    raise exception 'Coach business access required';
  end if;

  if char_length(trim(coalesce(p_name,'')))<2 then
    raise exception 'Group name is required';
  end if;

  next_capacity := coalesce(p_capacity,g.capacity);
  if next_capacity<2 or next_capacity>50 then
    raise exception 'Group capacity must be between 2 and 50';
  end if;

  select count(*) into active_members
  from public.coach_group_members
  where group_id=g.id and status='active';

  if next_capacity<active_members then
    raise exception 'Group capacity cannot be lower than the current active member count of %',active_members;
  end if;

  next_status := coalesce(p_status,g.status);
  if next_status not in ('forming','active','completed','paused','archived') then
    raise exception 'Invalid group status';
  end if;

  if p_service_package_id is not null and not exists(
    select 1
    from public.coach_service_packages s
    where s.id=p_service_package_id
      and s.business_id=g.business_id
      and s.program_id=g.program_id
      and s.active=true
  ) then
    raise exception 'Service package must be active and belong to this group program';
  end if;

  update public.coach_groups
  set name=trim(p_name),
      description=nullif(trim(coalesce(p_description,'')),''),
      service_package_id=p_service_package_id,
      capacity=next_capacity,
      status=next_status,
      start_date=p_start_date,
      end_date=p_end_date,
      group_price=p_group_price,
      updated_at=now()
  where id=g.id;

  return jsonb_build_object(
    'group_id',g.id,
    'status',next_status,
    'capacity',next_capacity,
    'active_members',active_members
  );
end;
$$;

revoke all on function public.update_my_coach_group(uuid,text,text,uuid,integer,text,date,date,numeric) from public, anon;
grant execute on function public.update_my_coach_group(uuid,text,text,uuid,integer,text,date,date,numeric) to authenticated, service_role;
