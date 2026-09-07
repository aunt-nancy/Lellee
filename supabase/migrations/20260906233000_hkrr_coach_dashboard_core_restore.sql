-- Canonical hkrr Lellee: restore the current Coach Dashboard backend expected by the UI.
-- Keeps business approval/marketplace review human-controlled while preserving legacy owner submit compatibility.
-- No pricing, Stripe, journal, logo, layout, or Auth configuration changes.

do $check$
begin
  if not exists(
    select 1 from public.platform_environment_baseline
    where environment_key='supabase_project_ref' and expected_value='hkrrxscyhtxmbvxevfkw'
  ) then raise exception 'Wrong Lellee runtime project'; end if;
  if to_regclass('public.coach_businesses') is null
     or to_regclass('public.coach_business_members') is null
     or to_regclass('public.coach_messages') is null then
    raise exception 'Coach foundation is incomplete';
  end if;
end $check$;

alter table public.coach_businesses add column if not exists review_note text;
alter table public.coach_businesses add column if not exists reviewed_at timestamptz;
alter table public.coach_businesses drop constraint if exists coach_business_review_note_length;
alter table public.coach_businesses add constraint coach_business_review_note_length
  check(review_note is null or length(review_note)<=4000);

-- Existing Admin screens read coach_businesses directly. Add an Admin RLS path.
drop policy if exists coach_business_admin_manage on public.coach_businesses;
create policy coach_business_admin_manage on public.coach_businesses
  for all to authenticated
  using(public.is_lellee_admin())
  with check(public.is_lellee_admin());

-- Owners may still use older direct-submit code, but protected review fields cannot be self-approved.
create or replace function public.guard_coach_business_review_boundary()
returns trigger language plpgsql security definer set search_path=''
as $fn$
declare
  caller uuid:=auth.uid();
  admin_ok boolean:=coalesce(public.is_lellee_admin(),false);
  service_ok boolean:=coalesce(auth.jwt()->>'role','')='service_role';
begin
  if admin_ok or service_ok then return new; end if;
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;

  if TG_OP='INSERT' then
    if new.owner_user_id is distinct from caller then
      raise exception using errcode='42501',message='You may create only your own coaching business';
    end if;
    if new.status not in('draft','pending_review') then
      raise exception using errcode='42501',message='Business approval requires Admin review';
    end if;
    if coalesce(new.marketplace_visible,false) or new.approved_at is not null or new.approved_by is not null
       or new.review_note is not null or new.reviewed_at is not null or new.marketplace_reviewed_at is not null then
      raise exception using errcode='42501',message='Review and marketplace fields are Admin controlled';
    end if;
    return new;
  end if;

  if old.owner_user_id is distinct from caller or new.owner_user_id is distinct from old.owner_user_id then
    raise exception using errcode='42501',message='Only the business owner may edit this submission';
  end if;
  if new.status is distinct from old.status and new.status not in('draft','pending_review') then
    raise exception using errcode='42501',message='Business approval requires Admin review';
  end if;
  if new.marketplace_visible is distinct from old.marketplace_visible
     or new.approved_at is distinct from old.approved_at
     or new.approved_by is distinct from old.approved_by
     or new.review_note is distinct from old.review_note
     or new.reviewed_at is distinct from old.reviewed_at
     or new.marketplace_reviewed_at is distinct from old.marketplace_reviewed_at then
    raise exception using errcode='42501',message='Review and marketplace fields are Admin controlled';
  end if;
  return new;
end $fn$;

drop trigger if exists coach_business_review_boundary on public.coach_businesses;
create trigger coach_business_review_boundary
before insert or update on public.coach_businesses
for each row execute function public.guard_coach_business_review_boundary();

create or replace function public.submit_my_coach_business(
  p_business_name text,
  p_public_name text,
  p_primary_program_id uuid,
  p_business_model text,
  p_target_audience text default null,
  p_bio text default null,
  p_credentials_disclosure text default null
)
returns uuid language plpgsql security definer set search_path=''
as $fn$
declare caller uuid:=auth.uid(); bid uuid;
begin
  if caller is null or not exists(select 1 from auth.users u where u.id=caller and u.email_confirmed_at is not null and u.deleted_at is null) then
    raise exception using errcode='42501',message='A verified signed-in account is required';
  end if;
  if length(btrim(coalesce(p_business_name,''))) not between 2 and 160
     or length(btrim(coalesce(p_public_name,''))) not between 2 and 160 then
    raise exception using errcode='22023',message='Business and public names must be 2 to 160 characters';
  end if;
  if p_business_model not in('solo','group_practice','community') then
    raise exception using errcode='22023',message='Invalid coaching business model';
  end if;
  if length(coalesce(p_target_audience,''))>1000 or length(coalesce(p_bio,''))>6000
     or length(coalesce(p_credentials_disclosure,''))>6000 then
    raise exception using errcode='22023',message='One or more coaching profile fields are too long';
  end if;
  if not exists(
    select 1 from public.programs p where p.id=p_primary_program_id and p.status='active'
      and coalesce((p.coaching_config->>'available')::boolean,false)
  ) then
    raise exception using errcode='22023',message='That coaching program is not active for new coach submissions';
  end if;

  insert into public.coach_businesses(
    owner_user_id,business_name,public_name,primary_program_id,business_model,
    target_audience,bio,credentials_disclosure,status,submitted_at,updated_at
  ) values(
    caller,btrim(p_business_name),btrim(p_public_name),p_primary_program_id,p_business_model,
    nullif(btrim(p_target_audience),''),nullif(btrim(p_bio),''),nullif(btrim(p_credentials_disclosure),''),
    'pending_review',clock_timestamp(),clock_timestamp()
  )
  on conflict(owner_user_id) do update set
    business_name=excluded.business_name,
    public_name=excluded.public_name,
    primary_program_id=excluded.primary_program_id,
    business_model=excluded.business_model,
    target_audience=excluded.target_audience,
    bio=excluded.bio,
    credentials_disclosure=excluded.credentials_disclosure,
    status='pending_review',
    submitted_at=clock_timestamp(),
    updated_at=clock_timestamp()
  returning id into bid;

  insert into public.coach_business_members(business_id,user_id,role,status)
  values(bid,caller,'owner','active')
  on conflict(business_id,user_id) do update set role='owner',status='active';

  insert into public.coach_business_programs(business_id,program_id,status)
  values(bid,p_primary_program_id,'pending')
  on conflict(business_id,program_id) do update set status='pending';

  return bid;
end $fn$;

create or replace function public.admin_review_coach_business(
  p_business_id uuid,
  p_decision text,
  p_review_note text default null
)
returns boolean language plpgsql security definer set search_path=''
as $fn$
declare caller uuid:=auth.uid(); program_id uuid;
begin
  if caller is null or not public.is_lellee_admin() then
    raise exception using errcode='42501',message='Admin access required';
  end if;
  if p_decision not in('approved','pending_review','paused','rejected') then
    raise exception using errcode='22023',message='Invalid coach business review decision';
  end if;
  if p_decision='rejected' and length(btrim(coalesce(p_review_note,'')))=0 then
    raise exception using errcode='22023',message='A review note is required when changes are requested';
  end if;
  if length(coalesce(p_review_note,''))>4000 then
    raise exception using errcode='22023',message='Review note is too long';
  end if;

  select primary_program_id into program_id from public.coach_businesses where id=p_business_id for update;
  if program_id is null then return false; end if;

  update public.coach_businesses set
    status=p_decision,
    review_note=nullif(btrim(p_review_note),''),
    reviewed_at=clock_timestamp(),
    approved_at=case when p_decision='approved' then clock_timestamp() else approved_at end,
    approved_by=case when p_decision='approved' then caller else approved_by end,
    marketplace_visible=case when p_decision='approved' then marketplace_visible else false end,
    updated_at=clock_timestamp()
  where id=p_business_id;

  insert into public.coach_business_programs(business_id,program_id,status)
  values(p_business_id,program_id,case when p_decision='approved' then 'approved' when p_decision='paused' then 'paused' else 'pending' end)
  on conflict(business_id,program_id) do update set
    status=excluded.status;
  return true;
end $fn$;

create or replace function public.admin_set_coach_marketplace_visibility(
  p_business_id uuid,p_visible boolean
)
returns boolean language plpgsql security definer set search_path=''
as $fn$
begin
  if auth.uid() is null or not public.is_lellee_admin() then
    raise exception using errcode='42501',message='Admin access required';
  end if;
  if p_visible and not coalesce((select s.value='true' from public.app_public_settings s where s.key='coach_public_marketplace_enabled'),false) then
    raise exception using errcode='42501',message='Global coach marketplace is still off';
  end if;
  update public.coach_businesses set
    marketplace_visible=coalesce(p_visible,false),marketplace_reviewed_at=clock_timestamp(),updated_at=clock_timestamp()
  where id=p_business_id and (not p_visible or status='approved');
  return found;
end $fn$;

create or replace function public.mark_my_coach_messages_read(p_business_id uuid)
returns integer language plpgsql security definer set search_path=''
as $fn$
declare caller uuid:=auth.uid(); changed integer:=0;
begin
  if caller is null or not public.is_coach_business_member(p_business_id) then
    raise exception using errcode='42501',message='Coach business access required';
  end if;
  update public.coach_messages set read_at=coalesce(read_at,clock_timestamp())
  where business_id=p_business_id and sender_user_id<>caller and read_at is null;
  get diagnostics changed=row_count;
  return changed;
end $fn$;

create or replace function public.get_my_coach_dashboard_context()
returns jsonb language plpgsql stable security definer set search_path=''
as $fn$
declare
  caller uuid:=auth.uid(); b public.coach_businesses%rowtype; programs jsonb:='[]'::jsonb;
  clients jsonb:='[]'::jsonb; groups jsonb:='[]'::jsonb; services jsonb:='[]'::jsonb;
  messages jsonb:='[]'::jsonb; assignments jsonb:='[]'::jsonb; leads jsonb:='[]'::jsonb;
  client_count int:=0; group_count int:=0; open_seats int:=0; unread_count int:=0;
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'slug',p.slug,'name',p.name,'status',p.status) order by p.display_order),'[]'::jsonb)
  into programs from public.programs p
  where p.status='active' and coalesce((p.coaching_config->>'available')::boolean,false);

  select cb.* into b from public.coach_businesses cb
  where cb.owner_user_id=caller or exists(
    select 1 from public.coach_business_members bm where bm.business_id=cb.id and bm.user_id=caller and bm.status='active'
  )
  order by (cb.owner_user_id=caller) desc,cb.created_at limit 1;

  if b.id is null then
    return jsonb_build_object('has_business',false,'business',null,'programs',programs,
      'metrics',jsonb_build_object('clients',0,'groups',0,'open_seats',0,'unread_messages',0),
      'clients','[]'::jsonb,'groups','[]'::jsonb,'services','[]'::jsonb,'messages','[]'::jsonb,
      'assignments','[]'::jsonb,'leads','[]'::jsonb);
  end if;

  select count(*) into client_count from public.coach_client_relationships r
    where r.business_id=b.id and r.status='active';
  select count(*),coalesce(sum(greatest(0,g.capacity-coalesce(mc.members,0))),0)
    into group_count,open_seats
  from public.coach_groups g
  left join lateral(select count(*)::int members from public.coach_group_members gm where gm.group_id=g.id and gm.status='active') mc on true
  where g.business_id=b.id and g.status in('forming','active');
  select count(*) into unread_count from public.coach_messages m
    where m.business_id=b.id and m.read_at is null and m.sender_user_id<>caller;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'client_user_id',r.client_user_id,'client_name',coalesce(pf.display_name,'Client'),
    'client_email',u.email,'program_name',pr.name,'status',r.status,'started_at',r.started_at,
    'service_name',sp.name) order by r.started_at desc),'[]'::jsonb)
  into clients
  from public.coach_client_relationships r
  left join public.profiles pf on pf.id=r.client_user_id
  left join auth.users u on u.id=r.client_user_id and u.deleted_at is null
  left join public.programs pr on pr.id=r.program_id
  left join public.coach_service_packages sp on sp.id=r.service_package_id
  where r.business_id=b.id and r.status<>'ended';

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',g.id,'name',g.name,'program_name',p.name,'status',g.status,'start_date',g.start_date,
    'members',coalesce(mc.members,0),'capacity',g.capacity,'group_price',g.group_price) order by g.created_at desc),'[]'::jsonb)
  into groups
  from public.coach_groups g
  left join public.programs p on p.id=g.program_id
  left join lateral(select count(*)::int members from public.coach_group_members gm where gm.group_id=g.id and gm.status='active') mc on true
  where g.business_id=b.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',s.id,'name',s.name,'description',s.description,'program_id',s.program_id,'program_name',p.name,
    'service_type',s.service_type,'billing_model',s.billing_model,'price_amount',s.price_amount,
    'sessions_included',s.sessions_included,'group_capacity',s.group_capacity,
    'individual_touchpoints',s.individual_touchpoints,'active',s.active) order by s.created_at desc),'[]'::jsonb)
  into services from public.coach_service_packages s left join public.programs p on p.id=s.program_id where s.business_id=b.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',x.id,'relationship_id',x.relationship_id,'group_id',x.group_id,'sender_user_id',x.sender_user_id,
    'sender_label',coalesce(pf.display_name,'Participant'),'body',x.body,'read_at',x.read_at,'created_at',x.created_at)
    order by x.created_at desc),'[]'::jsonb)
  into messages
  from (select * from public.coach_messages where business_id=b.id order by created_at desc limit 50) x
  left join public.profiles pf on pf.id=x.sender_user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,'title',a.title,'instructions',a.instructions,'program_name',p.name,'status',a.status,
    'due_at',a.due_at,'recipient_count',(select count(*) from public.coach_assignment_recipients ar where ar.assignment_id=a.id))
    order by a.created_at desc),'[]'::jsonb)
  into assignments from public.coach_assignments a left join public.programs p on p.id=a.program_id where a.business_id=b.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',l.id,'name',l.name,'email',l.email,'phone',l.phone,'source',l.source,'status',l.status,
    'notes',l.notes,'created_at',l.created_at) order by l.created_at desc),'[]'::jsonb)
  into leads from (select * from public.coach_leads where business_id=b.id order by created_at desc limit 100) l;

  return jsonb_build_object(
    'has_business',true,
    'business',jsonb_build_object(
      'id',b.id,'business_name',b.business_name,'public_name',b.public_name,'primary_program_id',b.primary_program_id,
      'business_model',b.business_model,'target_audience',b.target_audience,'bio',b.bio,
      'credentials_disclosure',b.credentials_disclosure,'status',b.status,'review_note',b.review_note,
      'marketplace_visible',b.marketplace_visible,'submitted_at',b.submitted_at,'reviewed_at',b.reviewed_at,'approved_at',b.approved_at),
    'programs',programs,
    'metrics',jsonb_build_object('clients',client_count,'groups',group_count,'open_seats',open_seats,'unread_messages',unread_count),
    'clients',clients,'groups',groups,'services',services,'messages',messages,'assignments',assignments,'leads',leads
  );
end $fn$;

revoke all on function public.submit_my_coach_business(text,text,uuid,text,text,text,text),
  public.admin_review_coach_business(uuid,text,text),public.admin_set_coach_marketplace_visibility(uuid,boolean),
  public.mark_my_coach_messages_read(uuid),public.get_my_coach_dashboard_context(),
  public.guard_coach_business_review_boundary() from public,anon,authenticated;
grant execute on function public.submit_my_coach_business(text,text,uuid,text,text,text,text),
  public.admin_review_coach_business(uuid,text,text),public.admin_set_coach_marketplace_visibility(uuid,boolean),
  public.mark_my_coach_messages_read(uuid),public.get_my_coach_dashboard_context() to authenticated,service_role;
grant execute on function public.guard_coach_business_review_boundary() to service_role;

do $verify$
declare sig text;
begin
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='coach_businesses' and column_name='review_note')
     or not exists(select 1 from information_schema.columns where table_schema='public' and table_name='coach_businesses' and column_name='reviewed_at') then
    raise exception 'Coach review columns are missing';
  end if;
  foreach sig in array array[
    'public.submit_my_coach_business(text,text,uuid,text,text,text,text)',
    'public.admin_review_coach_business(uuid,text,text)',
    'public.admin_set_coach_marketplace_visibility(uuid,boolean)',
    'public.mark_my_coach_messages_read(uuid)',
    'public.get_my_coach_dashboard_context()'
  ] loop
    if has_function_privilege('anon',sig,'EXECUTE') then raise exception 'Anonymous coach RPC remains: %',sig; end if;
    if not has_function_privilege('authenticated',sig,'EXECUTE') then raise exception 'Authenticated coach RPC missing: %',sig; end if;
  end loop;
  if not exists(select 1 from pg_trigger where tgrelid='public.coach_businesses'::regclass and tgname='coach_business_review_boundary' and not tgisinternal) then
    raise exception 'Coach review guard trigger is missing';
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='coach_businesses' and policyname='coach_business_admin_manage') then
    raise exception 'Coach business Admin policy is missing';
  end if;
end $verify$;
