do $check$
begin
  if not exists(select 1 from public.platform_environment_baseline where environment_key='supabase_project_ref' and expected_value='hkrrxscyhtxmbvxevfkw') then
    raise exception 'Wrong Lellee runtime project';
  end if;
end $check$;

alter table public.coach_businesses add column if not exists review_note text;
alter table public.coach_businesses add column if not exists reviewed_at timestamptz;

drop policy if exists coach_business_admin_all on public.coach_businesses;
create policy coach_business_admin_all on public.coach_businesses
  for all to authenticated
  using (public.is_lellee_admin())
  with check (public.is_lellee_admin());

create or replace function public.get_my_coach_dashboard_context()
returns jsonb
language plpgsql
security definer
set search_path=''
as $fn$
declare
  caller uuid:=auth.uid();
  bid uuid;
  business_json jsonb;
  programs_json jsonb:='[]'::jsonb;
  clients_json jsonb:='[]'::jsonb;
  groups_json jsonb:='[]'::jsonb;
  services_json jsonb:='[]'::jsonb;
  messages_json jsonb:='[]'::jsonb;
  assignments_json jsonb:='[]'::jsonb;
  leads_json jsonb:='[]'::jsonb;
  metrics_json jsonb:='{}'::jsonb;
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'slug',p.slug,'name',p.name,'status',p.status) order by p.display_order,p.name),'[]'::jsonb)
    into programs_json
  from public.programs p
  where coalesce((p.coaching_config->>'available')::boolean,false)=true;

  select m.business_id into bid
  from public.coach_business_members m
  join public.coach_businesses b on b.id=m.business_id
  where m.user_id=caller and m.status='active'
  order by case m.role when 'owner' then 0 when 'admin' then 1 else 2 end,m.created_at
  limit 1;
  if bid is null then
    select b.id into bid from public.coach_businesses b where b.owner_user_id=caller order by b.created_at limit 1;
  end if;

  if bid is null then
    return jsonb_build_object(
      'has_business',false,'business',null,'programs',programs_json,
      'metrics',jsonb_build_object('clients',0,'groups',0,'open_seats',0,'unread_messages',0),
      'clients','[]'::jsonb,'groups','[]'::jsonb,'services','[]'::jsonb,'messages','[]'::jsonb,'assignments','[]'::jsonb,'leads','[]'::jsonb
    );
  end if;

  if not public.is_coach_business_member(bid) and not public.is_lellee_admin() then
    raise exception using errcode='42501',message='Coach business access required';
  end if;

  select jsonb_build_object(
    'id',b.id,'owner_user_id',b.owner_user_id,'business_name',b.business_name,'public_name',b.public_name,
    'primary_program_id',b.primary_program_id,'business_model',b.business_model,'target_audience',b.target_audience,
    'bio',b.bio,'credentials_disclosure',b.credentials_disclosure,'status',b.status,
    'public_profile_enabled',b.public_profile_enabled,'submitted_at',b.submitted_at,'approved_at',b.approved_at,
    'marketplace_visible',b.marketplace_visible,'review_note',b.review_note,'reviewed_at',b.reviewed_at
  ) into business_json from public.coach_businesses b where b.id=bid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'client_user_id',r.client_user_id,'client_name',coalesce(p.display_name,'Client'),'client_email',u.email,
    'program_name',pr.name,'status',r.status,'started_at',r.started_at,'service_name',sp.name
  ) order by r.started_at desc),'[]'::jsonb)
  into clients_json
  from public.coach_client_relationships r
  left join public.profiles p on p.id=r.client_user_id
  left join auth.users u on u.id=r.client_user_id
  left join public.programs pr on pr.id=r.program_id
  left join public.coach_service_packages sp on sp.id=r.service_package_id
  where r.business_id=bid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',g.id,'name',g.name,'program_name',pr.name,'status',g.status,'capacity',g.capacity,'start_date',g.start_date,
    'group_price',g.group_price,'members',coalesce(mc.members,0)
  ) order by g.created_at desc),'[]'::jsonb)
  into groups_json
  from public.coach_groups g
  left join public.programs pr on pr.id=g.program_id
  left join lateral (select count(*)::int members from public.coach_group_members gm where gm.group_id=g.id and gm.status='active') mc on true
  where g.business_id=bid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',s.id,'name',s.name,'description',s.description,'program_name',pr.name,'active',s.active,
    'service_type',s.service_type,'billing_model',s.billing_model,'price_amount',s.price_amount,
    'sessions_included',s.sessions_included,'group_capacity',s.group_capacity,'individual_touchpoints',s.individual_touchpoints
  ) order by s.created_at desc),'[]'::jsonb)
  into services_json
  from public.coach_service_packages s left join public.programs pr on pr.id=s.program_id where s.business_id=bid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,'relationship_id',m.relationship_id,'group_id',m.group_id,'sender_user_id',m.sender_user_id,
    'sender_label',coalesce(p.display_name,'Participant'),'body',m.body,'read_at',m.read_at,'created_at',m.created_at
  ) order by m.created_at desc),'[]'::jsonb)
  into messages_json
  from (select * from public.coach_messages where business_id=bid order by created_at desc limit 50) m left join public.profiles p on p.id=m.sender_user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,'title',a.title,'instructions',a.instructions,'program_name',pr.name,'status',a.status,'due_at',a.due_at,
    'recipient_count',(select count(*) from public.coach_assignment_recipients ar where ar.assignment_id=a.id)
  ) order by a.created_at desc),'[]'::jsonb)
  into assignments_json
  from public.coach_assignments a left join public.programs pr on pr.id=a.program_id where a.business_id=bid;

  select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'name',l.name,'email',l.email,'phone',l.phone,'source',l.source,'status',l.status,'notes',l.notes) order by l.created_at desc),'[]'::jsonb)
  into leads_json from public.coach_leads l where l.business_id=bid;

  select jsonb_build_object(
    'clients',(select count(*) from public.coach_client_relationships r where r.business_id=bid and r.status='active'),
    'groups',(select count(*) from public.coach_groups g where g.business_id=bid and g.status in('forming','active')),
    'open_seats',coalesce((select sum(greatest(0,g.capacity-coalesce(mc.members,0))) from public.coach_groups g left join lateral (select count(*)::int members from public.coach_group_members gm where gm.group_id=g.id and gm.status='active') mc on true where g.business_id=bid and g.status in('forming','active')),0),
    'unread_messages',(select count(*) from public.coach_messages m where m.business_id=bid and m.sender_user_id<>caller and m.read_at is null)
  ) into metrics_json;

  return jsonb_build_object('has_business',true,'business',business_json,'programs',programs_json,'metrics',metrics_json,'clients',clients_json,'groups',groups_json,'services',services_json,'messages',messages_json,'assignments',assignments_json,'leads',leads_json);
end $fn$;

create or replace function public.submit_my_coach_business(p_business_name text,p_public_name text,p_primary_program_id uuid,p_business_model text,p_target_audience text default null,p_bio text default null,p_credentials_disclosure text default null)
returns uuid language plpgsql security definer set search_path=''
as $fn$
declare caller uuid:=auth.uid(); bid uuid;
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;
  if nullif(btrim(p_business_name),'') is null or nullif(btrim(p_public_name),'') is null then raise exception using errcode='22023',message='Business name and public name are required'; end if;
  if p_business_model not in('solo','group_practice','community') then raise exception using errcode='22023',message='Invalid business model'; end if;
  if not exists(select 1 from public.programs p where p.id=p_primary_program_id and coalesce((p.coaching_config->>'available')::boolean,false)=true) then raise exception using errcode='22023',message='That coaching program is not available'; end if;
  select id into bid from public.coach_businesses where owner_user_id=caller for update;
  if bid is null then
    insert into public.coach_businesses(owner_user_id,business_name,public_name,primary_program_id,business_model,target_audience,bio,credentials_disclosure,status,submitted_at,marketplace_visible,public_profile_enabled)
    values(caller,btrim(p_business_name),btrim(p_public_name),p_primary_program_id,p_business_model,nullif(btrim(p_target_audience),''),nullif(btrim(p_bio),''),nullif(btrim(p_credentials_disclosure),''),'pending_review',clock_timestamp(),false,false)
    returning id into bid;
  else
    update public.coach_businesses set business_name=btrim(p_business_name),public_name=btrim(p_public_name),primary_program_id=p_primary_program_id,business_model=p_business_model,target_audience=nullif(btrim(p_target_audience),''),bio=nullif(btrim(p_bio),''),credentials_disclosure=nullif(btrim(p_credentials_disclosure),''),status='pending_review',submitted_at=clock_timestamp(),review_note=null,reviewed_at=null,approved_at=null,approved_by=null,marketplace_visible=false,public_profile_enabled=false,updated_at=clock_timestamp() where id=bid;
  end if;
  insert into public.coach_business_members(business_id,user_id,role,status) values(bid,caller,'owner','active') on conflict(business_id,user_id) do update set role='owner',status='active';
  insert into public.coach_business_programs(business_id,program_id,status) values(bid,p_primary_program_id,'pending') on conflict(business_id,program_id) do update set status='pending';
  return bid;
end $fn$;

create or replace function public.mark_my_coach_messages_read(p_business_id uuid)
returns integer language plpgsql security definer set search_path=''
as $fn$
declare caller uuid:=auth.uid(); n integer:=0;
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;
  if not public.is_coach_business_member(p_business_id) and not public.is_lellee_admin() then raise exception using errcode='42501',message='Coach business access required'; end if;
  update public.coach_messages set read_at=clock_timestamp() where business_id=p_business_id and sender_user_id<>caller and read_at is null;
  get diagnostics n=row_count;
  return n;
end $fn$;

create or replace function public.admin_review_coach_business(p_business_id uuid,p_decision text,p_review_note text default null)
returns boolean language plpgsql security definer set search_path=''
as $fn$
declare caller uuid:=auth.uid(); prg uuid;
begin
  if caller is null or not public.is_lellee_admin() then raise exception using errcode='42501',message='Administrator access required'; end if;
  if p_decision not in('approved','pending_review','paused','rejected') then raise exception using errcode='22023',message='Invalid review decision'; end if;
  if p_decision='rejected' and nullif(btrim(p_review_note),'') is null then raise exception using errcode='22023',message='A review note is required when changes are requested'; end if;
  select primary_program_id into prg from public.coach_businesses where id=p_business_id for update;
  if prg is null then return false; end if;
  update public.coach_businesses set status=p_decision,review_note=nullif(btrim(p_review_note),''),reviewed_at=clock_timestamp(),approved_at=case when p_decision='approved' then clock_timestamp() else null end,approved_by=case when p_decision='approved' then caller else null end,marketplace_visible=case when p_decision='approved' then marketplace_visible else false end,public_profile_enabled=case when p_decision='approved' then public_profile_enabled else false end,updated_at=clock_timestamp() where id=p_business_id;
  insert into public.coach_business_programs(business_id,program_id,status) values(p_business_id,prg,case when p_decision='approved' then 'approved' when p_decision='paused' then 'paused' else 'pending' end) on conflict(business_id,program_id) do update set status=excluded.status;
  return true;
end $fn$;

revoke all on function public.get_my_coach_dashboard_context(),public.submit_my_coach_business(text,text,uuid,text,text,text,text),public.mark_my_coach_messages_read(uuid),public.admin_review_coach_business(uuid,text,text) from public,anon,authenticated;
grant execute on function public.get_my_coach_dashboard_context(),public.submit_my_coach_business(text,text,uuid,text,text,text,text),public.mark_my_coach_messages_read(uuid),public.admin_review_coach_business(uuid,text,text) to authenticated,service_role;
