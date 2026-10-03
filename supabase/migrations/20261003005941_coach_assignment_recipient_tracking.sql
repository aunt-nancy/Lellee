alter table public.coach_assignment_recipients
  add column if not exists origin_group_id uuid references public.coach_groups(id) on delete set null;

create index if not exists coach_assignment_recipients_origin_group_idx
  on public.coach_assignment_recipients(origin_group_id)
  where origin_group_id is not null;

create unique index if not exists coach_assignment_recipient_relationship_uidx
  on public.coach_assignment_recipients(assignment_id,relationship_id)
  where relationship_id is not null;

create or replace function public.create_my_coach_assignment(
  p_program_id uuid,
  p_title text,
  p_instructions text default null,
  p_due_at timestamptz default null,
  p_relationship_id uuid default null,
  p_group_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  bid uuid;
  assignment_id uuid;
  recipient_count integer:=0;
  rel public.coach_client_relationships%rowtype;
  grp public.coach_groups%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if (p_relationship_id is null) = (p_group_id is null) then raise exception 'Choose exactly one assignment target'; end if;
  if char_length(trim(coalesce(p_title,'')))<2 then raise exception 'Assignment title is required'; end if;
  select b.id into bid
  from public.coach_businesses b
  where b.owner_user_id=uid or exists(
    select 1 from public.coach_business_members m
    where m.business_id=b.id and m.user_id=uid and m.status='active'
  )
  order by case when b.owner_user_id=uid then 0 else 1 end,b.created_at
  limit 1;
  if bid is null or not public.is_coach_business_member(bid) then raise exception 'Coach business access required'; end if;
  if p_relationship_id is not null then
    select * into rel from public.coach_client_relationships where id=p_relationship_id and business_id=bid;
    if rel.id is null then raise exception 'Client relationship not found'; end if;
    if rel.status<>'active' or rel.ended_at is not null then raise exception 'Client relationship must be active'; end if;
    if rel.program_id<>p_program_id then raise exception 'Assignment program must match the client program'; end if;
  else
    select * into grp from public.coach_groups where id=p_group_id and business_id=bid;
    if grp.id is null then raise exception 'Coaching group not found'; end if;
    if grp.status not in ('forming','active') then raise exception 'Group must be forming or active'; end if;
    if grp.program_id<>p_program_id then raise exception 'Assignment program must match the group program'; end if;
  end if;
  insert into public.coach_assignments(business_id,coach_user_id,program_id,title,instructions,due_at,status)
  values(bid,uid,p_program_id,trim(p_title),nullif(trim(coalesce(p_instructions,'')),''),p_due_at,'active')
  returning id into assignment_id;
  if p_relationship_id is not null then
    insert into public.coach_assignment_recipients(assignment_id,relationship_id,group_id,origin_group_id)
    values(assignment_id,p_relationship_id,null,null);
    recipient_count:=1;
  else
    insert into public.coach_assignment_recipients(assignment_id,relationship_id,group_id,origin_group_id)
    select assignment_id,gm.relationship_id,null,p_group_id
    from public.coach_group_members gm
    join public.coach_client_relationships r on r.id=gm.relationship_id
    where gm.group_id=p_group_id and gm.status='active' and r.status='active' and r.ended_at is null
    on conflict do nothing;
    get diagnostics recipient_count = row_count;
    if recipient_count=0 then
      delete from public.coach_assignments where id=assignment_id;
      raise exception 'Group has no active client members to receive this assignment';
    end if;
  end if;
  return jsonb_build_object('assignment_id',assignment_id,'recipient_count',recipient_count,'target_type',case when p_relationship_id is not null then 'client' else 'group' end,'target_id',coalesce(p_relationship_id,p_group_id));
end;
$$;
revoke all on function public.create_my_coach_assignment(uuid,text,text,timestamptz,uuid,uuid) from public, anon;
grant execute on function public.create_my_coach_assignment(uuid,text,text,timestamptz,uuid,uuid) to authenticated, service_role;

create or replace function public.update_my_coach_assignment(
  p_assignment_id uuid,
  p_title text,
  p_instructions text default null,
  p_due_at timestamptz default null,
  p_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  a public.coach_assignments%rowtype;
  next_status text;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into a from public.coach_assignments where id=p_assignment_id for update;
  if a.id is null then raise exception 'Assignment not found'; end if;
  if not public.is_coach_business_member(a.business_id) then raise exception 'Coach business access required'; end if;
  if char_length(trim(coalesce(p_title,'')))<2 then raise exception 'Assignment title is required'; end if;
  next_status:=coalesce(p_status,a.status);
  if next_status not in ('draft','active','closed') then raise exception 'Invalid assignment status'; end if;
  update public.coach_assignments
  set title=trim(p_title),instructions=nullif(trim(coalesce(p_instructions,'')),''),due_at=p_due_at,status=next_status
  where id=a.id;
  return jsonb_build_object('assignment_id',a.id,'status',next_status);
end;
$$;
revoke all on function public.update_my_coach_assignment(uuid,text,text,timestamptz,text) from public, anon;
grant execute on function public.update_my_coach_assignment(uuid,text,text,timestamptz,text) to authenticated, service_role;

create or replace function public.complete_my_coach_assignment_recipient(p_recipient_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  rec public.coach_assignment_recipients%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select ar.* into rec
  from public.coach_assignment_recipients ar
  join public.coach_client_relationships r on r.id=ar.relationship_id
  where ar.id=p_recipient_id and ar.relationship_id is not null and r.client_user_id=uid
  for update;
  if rec.id is null then raise exception 'Assignment recipient not found'; end if;
  update public.coach_assignment_recipients set completed_at=coalesce(completed_at,now()) where id=rec.id;
  return jsonb_build_object('recipient_id',rec.id,'completed_at',(select completed_at from public.coach_assignment_recipients where id=rec.id));
end;
$$;
revoke all on function public.complete_my_coach_assignment_recipient(uuid) from public, anon;
grant execute on function public.complete_my_coach_assignment_recipient(uuid) to authenticated, service_role;
