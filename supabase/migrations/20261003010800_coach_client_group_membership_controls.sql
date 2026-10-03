create or replace function public.set_my_coach_client_group_membership(
  p_relationship_id uuid,
  p_group_id uuid,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  r public.coach_client_relationships%rowtype;
  g public.coach_groups%rowtype;
  active_members integer;
  existing_status text;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select * into r
  from public.coach_client_relationships
  where id=p_relationship_id
  for update;
  if r.id is null then raise exception 'Client relationship not found'; end if;
  if not public.is_coach_business_member(r.business_id) then
    raise exception 'Coach business access required';
  end if;

  select * into g
  from public.coach_groups
  where id=p_group_id
  for update;
  if g.id is null then raise exception 'Coaching group not found'; end if;
  if g.business_id<>r.business_id then raise exception 'Group belongs to a different coaching business'; end if;
  if g.program_id<>r.program_id then raise exception 'Group must match the client program'; end if;

  select status into existing_status
  from public.coach_group_members
  where group_id=g.id and relationship_id=r.id;

  if p_active then
    if r.status<>'active' or r.ended_at is not null then
      raise exception 'Client relationship must be active before adding to a group';
    end if;
    if g.status not in ('forming','active') then
      raise exception 'Group is not open for active membership';
    end if;

    if existing_status is distinct from 'active' then
      select count(*) into active_members
      from public.coach_group_members
      where group_id=g.id and status='active';
      if active_members>=g.capacity then
        raise exception 'Group has reached its configured capacity';
      end if;
    end if;

    insert into public.coach_group_members(group_id,relationship_id,status)
    values(g.id,r.id,'active')
    on conflict(group_id,relationship_id) do update
      set status='active',joined_at=case
        when public.coach_group_members.status='active' then public.coach_group_members.joined_at
        else now() end;
  else
    update public.coach_group_members
    set status='removed'
    where group_id=g.id and relationship_id=r.id;
  end if;

  return jsonb_build_object(
    'relationship_id',r.id,
    'group_id',g.id,
    'status',case when p_active then 'active' else 'removed' end
  );
end;
$$;

revoke all on function public.set_my_coach_client_group_membership(uuid,uuid,boolean) from public, anon;
grant execute on function public.set_my_coach_client_group_membership(uuid,uuid,boolean) to authenticated, service_role;
