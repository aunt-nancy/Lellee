-- Dashboard/read-model and scoped participant labels for the canonical hkrr Lellee runtime project.
-- Requires the hkrr consent-boundary and selected-content migrations first.

do $check$
begin
  if not exists(select 1 from public.platform_environment_baseline
    where environment_key='supabase_project_ref' and expected_value='hkrrxscyhtxmbvxevfkw') then
    raise exception 'Wrong Lellee runtime project';
  end if;
  if to_regprocedure('public.respond_trusted_circle_relationship(uuid,text)') is null
     or to_regprocedure('public.respond_trusted_circle_item(text,uuid,text,text)') is null then
    raise exception 'Trusted Circle prerequisite repairs must run first';
  end if;
  if to_regprocedure('public.get_my_circle_participants()') is not null then
    raise exception 'Scoped participant lookup already exists; inspect rather than overwrite';
  end if;
end $check$;

create or replace function public.circle_workspace_snapshot(p_supporter boolean)
returns jsonb language plpgsql stable security invoker set search_path=''
as $fn$
declare result jsonb;
begin
  if auth.uid() is null then raise exception using errcode='42501',message='Sign in required'; end if;
  if p_supporter is null then raise exception using errcode='22023',message='Workspace is required'; end if;
  with r as (
    select r.*,ro.label as role_label,ro.status as role_status
    from public.trusted_circle_relationships r
    join public.trusted_circle_roles ro on ro.role_key=r.role_key
    where case when p_supporter then r.supporter_user_id=auth.uid() else r.owner_user_id=auth.uid() end
  ), live as (
    select * from r where status='active' and revoked_at is null and accepted_at is not null
      and invited_by=owner_user_id and role_status='active'
  ), s as (
    select s.*,sc.label as scope_label
    from public.trusted_circle_shares s
    join live r on r.id=s.relationship_id and r.owner_user_id=s.owner_user_id
    join public.trusted_circle_share_scopes sc on sc.scope_key=s.scope_key and sc.status='active'
    where s.status='active' and s.revoked_at is null and s.starts_at<=statement_timestamp()
      and (s.expires_at is null or s.expires_at>statement_timestamp()) and s.created_at>=r.accepted_at
      and (r.program_id is null or r.program_id=s.program_id)
  ), t as (
    select t.* from public.trusted_circle_shared_tasks t
    join r on r.id=t.relationship_id and r.owner_user_id=t.owner_user_id
    where t.status<>'cancelled' and (not p_supporter or t.status<>'completed')
  ), a as (
    select a.* from public.trusted_circle_shared_appointments a
    join r on r.id=a.relationship_id and r.owner_user_id=a.owner_user_id
    where a.status<>'cancelled' and (not p_supporter or a.status='scheduled')
  ), c as (
    select c.* from public.trusted_circle_checkins c
    join r on r.id=c.relationship_id and r.owner_user_id=c.owner_user_id
    where c.status in('requested','acknowledged')
  )
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'members',(select count(*) from r where status in('invited','active','paused')),
      'people',(select count(*) from live),
      'active_shares',(select count(*) from s),'shares',(select count(*) from s),
      'shared_tasks',(select count(*) from t where status<>'completed'),'tasks',(select count(*) from t where status<>'completed'),
      'open_checkins',(select count(*) from c),'checkins',(select count(*) from c),
      'appointments',(select count(*) from a where status='scheduled'),
      'invitations',(select count(*) from r where p_supporter and status='invited' and revoked_at is null
        and invited_by=owner_user_id and role_status='active')
    ),
    'people',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'label','Trusted person','role_label',role_label,'role_key',role_key,'status',status,'program_id',program_id)
      order by invited_at desc) from r where not p_supporter and status in('invited','active','paused')),'[]'::jsonb),
    'relationships',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'person_label','Lellee user','role_label',role_label,'role_key',role_key,
      'status',status,'program_id',program_id) order by accepted_at desc) from live),'[]'::jsonb),
    'invitations',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'person_label','Lellee user','role_label',role_label,'role_key',role_key,
      'status',status,'program_id',program_id) order by invited_at desc)
      from r where p_supporter and status='invited' and revoked_at is null
        and invited_by=owner_user_id and role_status='active'),'[]'::jsonb),
    'shares',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'relationship_id',relationship_id,'scope_label',scope_label,'person_label','Trusted person',
      'status',status,'expires_at',expires_at,'program_id',program_id) order by created_at desc) from s),'[]'::jsonb),
    'tasks',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'relationship_id',relationship_id,'title',title,'status',status,'person_label','Trusted person',
      'due_label',to_char(due_on,'Mon DD'),'assigned_to',assigned_to)
      order by due_on nulls last,created_at desc) from t),'[]'::jsonb),
    'appointments',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'relationship_id',relationship_id,'title',title,'status',status,'starts_at',starts_at,
      'location_label',location_label) order by starts_at) from a),'[]'::jsonb),
    'checkins',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'relationship_id',relationship_id,'title',title,'status',status,'person_label','Trusted person',
      'due_label',to_char(due_at,'Mon DD HH12:MI AM'),'response_label',response_label)
      order by due_at nulls last,created_at desc) from c),'[]'::jsonb)
  ) into result;
  if not p_supporter then
    result:=result||jsonb_build_object('emergency_contacts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'label',label,'relationship_label',relationship_label,'phone_masked',phone_masked,
      'priority_label','Priority '||priority_order) order by priority_order,created_at)
      from public.trusted_circle_emergency_contacts where user_id=auth.uid() and status='active'),'[]'::jsonb));
  end if;
  return result;
end $fn$;

create or replace function public.get_my_trusted_circle_summary()
returns jsonb language sql stable security invoker set search_path=''
as $fn$select public.circle_workspace_snapshot(false)$fn$;
create or replace function public.get_my_supporter_dashboard()
returns jsonb language sql stable security invoker set search_path=''
as $fn$select public.circle_workspace_snapshot(true)$fn$;

create or replace function public.get_collaboration_operations_summary()
returns jsonb language plpgsql stable security invoker set search_path=''
as $fn$
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  return jsonb_build_object(
    'summary',jsonb_build_object(
      'relationships',(select count(*) from public.trusted_circle_relationships
        where status='active' and revoked_at is null and accepted_at is not null),
      'shares',(select count(*) from public.trusted_circle_shares s
        join public.trusted_circle_relationships r on r.id=s.relationship_id
        join public.trusted_circle_roles ro on ro.role_key=r.role_key and ro.status='active'
        join public.trusted_circle_share_scopes sc on sc.scope_key=s.scope_key and sc.status='active'
        where s.owner_user_id=r.owner_user_id and s.status='active' and s.revoked_at is null
          and s.starts_at<=statement_timestamp() and (s.expires_at is null or s.expires_at>statement_timestamp())
          and r.status='active' and r.revoked_at is null and r.accepted_at is not null
          and r.invited_by=r.owner_user_id and s.created_at>=r.accepted_at
          and (r.program_id is null or r.program_id=s.program_id)),
      'expired',(select count(*) from public.trusted_circle_shares
        where status='active' and expires_at<=statement_timestamp()),
      'programs',(select count(*) from public.program_collaboration_settings where collaboration_enabled)
    ),
    'roles',coalesce((select jsonb_agg(jsonb_build_object(
      'label',label,'description',description,'status',status) order by role_key)
      from public.trusted_circle_roles where status<>'retired'),'[]'::jsonb),
    'scopes',coalesce((select jsonb_agg(jsonb_build_object(
      'label',label,'description',description,'sensitive',sensitive) order by scope_key)
      from public.trusted_circle_share_scopes where status='active'),'[]'::jsonb),
    'relationships',coalesce((select jsonb_agg(jsonb_build_object(
      'role_label',x.role_label,'status',x.status,'created_at',x.invited_at,
      'share_count',(select count(*) from public.trusted_circle_shares s
        where s.relationship_id=x.id and s.status='active' and s.revoked_at is null)) order by x.invited_at desc)
      from (select r.id,r.status,r.invited_at,ro.label as role_label
        from public.trusted_circle_relationships r join public.trusted_circle_roles ro on ro.role_key=r.role_key
        order by r.invited_at desc limit 100) x),'[]'::jsonb),
    'programs',coalesce((select jsonb_agg(jsonb_build_object(
      'program_name',p.name,'status',p.status,'collaboration_enabled',coalesce(c.collaboration_enabled,false),
      'enabled_scopes',coalesce(c.shared_tasks_enabled::int,0)+coalesce(c.shared_appointments_enabled::int,0)
        +coalesce(c.selected_goals_enabled::int,0)+coalesce(c.progress_snapshot_enabled::int,0)
        +coalesce(c.document_metadata_enabled::int,0)) order by p.display_order)
      from public.programs p left join public.program_collaboration_settings c on c.program_id=p.id),'[]'::jsonb),
    'guardrails',coalesce((select jsonb_agg(jsonb_build_object(
      'label',label,'detail',detail,'enabled',enabled) order by guardrail_key)
      from public.trusted_circle_guardrails),'[]'::jsonb)
  );
end $fn$;

-- The counterpart account-email label is visible only to a verified party in that current relationship.
create function public.get_my_circle_participants()
returns jsonb language sql stable security definer set search_path=''
as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
    'relationship_id',r.id,'account_email',u.email,
    'owner_view',r.owner_user_id=auth.uid(),'role_key',r.role_key,
    'program_id',r.program_id,'status',r.status
  ) order by r.invited_at desc),'[]'::jsonb)
  from public.trusted_circle_relationships r
  join auth.users caller on caller.id=auth.uid()
    and caller.email_confirmed_at is not null and caller.deleted_at is null
  join auth.users u on u.id=case when r.owner_user_id=auth.uid()
    then r.supporter_user_id else r.owner_user_id end
    and u.email_confirmed_at is not null and u.deleted_at is null
  where (r.owner_user_id=auth.uid() or r.supporter_user_id=auth.uid())
    and r.status in('invited','active','paused') and r.revoked_at is null
    and r.invited_by=r.owner_user_id
$fn$;
comment on function public.get_my_circle_participants() is
  'Counterpart account-email labels only for current Trusted Circle relationships of the verified caller; no arbitrary user lookup.';

revoke all on function public.circle_workspace_snapshot(boolean),
  public.get_my_trusted_circle_summary(),public.get_my_supporter_dashboard(),
  public.get_collaboration_operations_summary(),public.get_my_circle_participants()
  from public,anon,authenticated;
grant execute on function public.circle_workspace_snapshot(boolean),
  public.get_my_trusted_circle_summary(),public.get_my_supporter_dashboard(),
  public.get_collaboration_operations_summary(),public.get_my_circle_participants()
  to authenticated,service_role;

do $verify$
declare sig text;
begin
  foreach sig in array array[
    'public.circle_workspace_snapshot(boolean)','public.get_my_trusted_circle_summary()',
    'public.get_my_supporter_dashboard()','public.get_collaboration_operations_summary()',
    'public.get_my_circle_participants()'
  ] loop
    if has_function_privilege('anon',sig,'EXECUTE') then raise exception 'Anonymous dashboard/label execution remains: %',sig; end if;
    if not has_function_privilege('authenticated',sig,'EXECUTE') then raise exception 'Authenticated dashboard/label execution missing: %',sig; end if;
  end loop;
end $verify$;
