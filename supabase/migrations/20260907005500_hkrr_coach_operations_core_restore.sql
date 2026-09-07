do $check$
begin
  if not exists(
    select 1 from public.platform_environment_baseline
    where environment_key='supabase_project_ref'
      and expected_value='hkrrxscyhtxmbvxevfkw'
  ) then
    raise exception 'Wrong Lellee runtime project';
  end if;
end $check$;

create or replace function public.get_my_coach_operations_context()
returns jsonb
language plpgsql
security definer
set search_path=''
as $fn$
declare
  caller uuid:=auth.uid();
  bid uuid;
  bname text;
  analytics_json jsonb;
  revenue_json jsonb;
  scheduler_json jsonb;
  credentials_json jsonb;
  automation_json jsonb;
  payments_enabled boolean:=false;
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;

  select m.business_id,b.business_name
    into bid,bname
  from public.coach_business_members m
  join public.coach_businesses b on b.id=m.business_id
  where m.user_id=caller and m.status='active'
  order by case m.role when 'owner' then 0 when 'admin' then 1 else 2 end,m.created_at
  limit 1;

  if bid is null then
    return jsonb_build_object(
      'has_business',false,
      'business_id',null,
      'business_name',null,
      'analytics',jsonb_build_object('summary',jsonb_build_object()),
      'revenue',jsonb_build_object('summary',jsonb_build_object(),'payout_status',jsonb_build_object('enabled',false,'label','Coach payment collection and payouts are not activated.')),
      'scheduler',jsonb_build_object('summary',jsonb_build_object(),'schedule','[]'::jsonb,'availability','[]'::jsonb,'consultations','[]'::jsonb,'followups','[]'::jsonb,'history','[]'::jsonb),
      'automation',jsonb_build_object('enabled',false,'message','Coach Automation is not enabled in the current release.','summary',jsonb_build_object('active_rules',0,'followups_due',0,'tasks_created',0,'recent_runs',0),'rules','[]'::jsonb,'runs','[]'::jsonb),
      'credentials',jsonb_build_object('summary',jsonb_build_object(),'credentials','[]'::jsonb,'training','[]'::jsonb,'intake_forms','[]'::jsonb)
    );
  end if;

  select coalesce((select value='true' from public.app_public_settings where key='coach_payments_enabled'),false)
    into payments_enabled;

  select jsonb_build_object(
    'summary',jsonb_build_object(
      'leads',(select count(*) from public.coach_leads where business_id=bid),
      'lead_converted',(select count(*) from public.coach_leads where business_id=bid and status='converted'),
      'clients',(select count(*) from public.coach_client_relationships where business_id=bid and status='active'),
      'new_clients',(select count(*) from public.coach_client_relationships where business_id=bid and status='active' and started_at>=now()-interval '30 days'),
      'groups',(select count(*) from public.coach_groups where business_id=bid and status in('forming','active')),
      'open_seats',coalesce((select sum(greatest(0,g.capacity-coalesce((select count(*) from public.coach_group_members gm where gm.group_id=g.id and gm.status='active'),0))) from public.coach_groups g where g.business_id=bid and g.status in('forming','active')),0),
      'consultations',(select count(*) from public.coach_consultation_requests where business_id=bid),
      'consult_converted',(select count(*) from public.coach_consultation_requests where business_id=bid and status='converted')
    ),
    'services',coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',s.name,'service_type',s.service_type,
        'active_clients',(select count(*) from public.coach_client_relationships r where r.service_package_id=s.id and r.status='active'),
        'active_groups',(select count(*) from public.coach_groups g where g.service_package_id=s.id and g.status in('forming','active'))
      ) order by s.created_at)
      from public.coach_service_packages s where s.business_id=bid and s.active=true
    ),'[]'::jsonb),
    'groups',coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',g.name,
        'members',(select count(*) from public.coach_group_members gm where gm.group_id=g.id and gm.status='active'),
        'capacity',g.capacity,
        'open_seats',greatest(0,g.capacity-(select count(*) from public.coach_group_members gm where gm.group_id=g.id and gm.status='active'))
      ) order by g.created_at)
      from public.coach_groups g where g.business_id=bid and g.status in('forming','active')
    ),'[]'::jsonb)
  ) into analytics_json;

  select jsonb_build_object(
    'summary',jsonb_build_object(
      'services',(select count(*) from public.coach_service_packages where business_id=bid and active=true),
      'clients',(select count(*) from public.coach_client_relationships where business_id=bid and status='active'),
      'groups',(select count(*) from public.coach_groups where business_id=bid and status in('forming','active')),
      'projected_gross',coalesce((
        select sum(coalesce(g.group_price,0)*(select count(*) from public.coach_group_members gm where gm.group_id=g.id and gm.status='active'))
        from public.coach_groups g where g.business_id=bid and g.status in('forming','active')
      ),0)
    ),
    'services',coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',s.name,'service_type',s.service_type,'billing_model',s.billing_model,'price_amount',s.price_amount,
        'sessions_included',s.sessions_included,'group_capacity',s.group_capacity,'individual_touchpoints',s.individual_touchpoints
      ) order by s.created_at)
      from public.coach_service_packages s where s.business_id=bid and s.active=true
    ),'[]'::jsonb),
    'groups',coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',g.name,
        'members',(select count(*) from public.coach_group_members gm where gm.group_id=g.id and gm.status='active'),
        'capacity',g.capacity,'group_price',g.group_price,
        'projected_value',coalesce(g.group_price,0)*(select count(*) from public.coach_group_members gm where gm.group_id=g.id and gm.status='active')
      ) order by g.created_at)
      from public.coach_groups g where g.business_id=bid and g.status in('forming','active')
    ),'[]'::jsonb),
    'payout_status',jsonb_build_object(
      'enabled',payments_enabled,
      'label',case when payments_enabled then 'Coach payment operations are enabled.' else 'Coach payment collection and payouts are not activated.' end
    )
  ) into revenue_json;

  select jsonb_build_object(
    'summary',jsonb_build_object(
      'open_consultations',(select count(*) from public.coach_consultation_requests where business_id=bid and status in('new','contacted','scheduled')),
      'upcoming_sessions',(select count(*) from public.coach_schedule_events where business_id=bid and status in('scheduled','confirmed') and scheduled_start>=now()),
      'followups_due',(select count(*) from public.crm_followups where business_id=bid and workspace_type='coach' and status='open' and (due_at is null or due_at<=now()+interval '7 days')),
      'open_slots',(select count(*) from public.coach_availability_rules where business_id=bid and active=true)
    ),
    'schedule',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',e.id,'title',e.title,'session_scope',e.session_scope,'scheduled_start',e.scheduled_start,
        'duration_minutes',e.duration_minutes,'status',e.status,'meeting_location',e.meeting_location
      ) order by e.scheduled_start)
      from public.coach_schedule_events e where e.business_id=bid and e.status in('scheduled','confirmed') and e.scheduled_start>=now()
    ),'[]'::jsonb),
    'availability',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'day_of_week',a.day_of_week,'start_time',a.start_time::text,'end_time',a.end_time::text,'timezone',a.timezone,'active',a.active
      ) order by a.day_of_week,a.start_time)
      from public.coach_availability_rules a where a.business_id=bid
    ),'[]'::jsonb),
    'consultations',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',c.id,'client_label',coalesce(p.display_name,'Consultation request'),'note',c.note,'status',c.status,'created_at',c.created_at
      ) order by c.created_at desc)
      from public.coach_consultation_requests c left join public.profiles p on p.id=c.user_id
      where c.business_id=bid and c.status<>'closed'
    ),'[]'::jsonb),
    'followups',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',f.id,'title',f.title,'related_label',coalesce(p.display_name,''),'note',f.note,'due_at',f.due_at,'status',f.status
      ) order by f.due_at nulls last,f.created_at)
      from public.crm_followups f left join public.profiles p on p.id=f.related_user_id
      where f.business_id=bid and f.workspace_type='coach' and f.status='open'
    ),'[]'::jsonb),
    'history',coalesce((
      select jsonb_agg(jsonb_build_object('id',h.id,'event_label',h.event_label,'event_type',h.event_type,'created_at',h.created_at) order by h.created_at desc)
      from (select * from public.crm_contact_history where business_id=bid and workspace_type='coach' order by created_at desc limit 40) h
    ),'[]'::jsonb)
  ) into scheduler_json;

  automation_json:=jsonb_build_object(
    'enabled',false,
    'message','Coach Automation is not enabled in the current release.',
    'summary',jsonb_build_object(
      'active_rules',0,
      'followups_due',(select count(*) from public.crm_followups where business_id=bid and workspace_type='coach' and status='open' and (due_at is null or due_at<=now()+interval '7 days')),
      'tasks_created',0,
      'recent_runs',0
    ),
    'rules','[]'::jsonb,'runs','[]'::jsonb
  );

  select jsonb_build_object(
    'summary',jsonb_build_object(
      'credentials',(select count(*) from public.professional_credential_claims where business_id=bid),
      'verified',(select count(*) from public.professional_credential_claims where business_id=bid and verification_status='verified'),
      'training',(select count(*) from public.training_records tr where exists(select 1 from public.coach_business_members bm where bm.business_id=bid and bm.user_id=tr.user_id and bm.status='active')),
      'intake_forms',(select count(*) from public.form_definitions where business_id=bid and form_type='intake' and status<>'retired')
    ),
    'credentials',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',c.id,'label',c.label,'credential_type',c.credential_type,'issuer',c.issuer,'verification_status',c.verification_status,'expires_on',c.expires_on
      ) order by c.created_at desc)
      from public.professional_credential_claims c where c.business_id=bid
    ),'[]'::jsonb),
    'training',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',tr.id,'title',tr.title,'status',tr.status,'hours',tr.hours,'completed_at',tr.completed_at,'verified',tr.verified
      ) order by tr.created_at desc)
      from public.training_records tr
      where exists(select 1 from public.coach_business_members bm where bm.business_id=bid and bm.user_id=tr.user_id and bm.status='active')
    ),'[]'::jsonb),
    'intake_forms',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',f.id,'title',f.title,'description',f.description,'status',f.status,
        'assignment_count',(select count(*) from public.form_assignments a where a.form_id=f.id)
      ) order by f.created_at desc)
      from public.form_definitions f where f.business_id=bid and f.form_type='intake'
    ),'[]'::jsonb)
  ) into credentials_json;

  return jsonb_build_object(
    'has_business',true,
    'business_id',bid,
    'business_name',bname,
    'analytics',analytics_json,
    'revenue',revenue_json,
    'scheduler',scheduler_json,
    'automation',automation_json,
    'credentials',credentials_json
  );
end $fn$;

create or replace function public.create_coach_intake_form(
  p_business_id uuid,
  p_program_id uuid,
  p_title text,
  p_description text,
  p_questions text[]
)
returns uuid
language plpgsql
security definer
set search_path=''
as $fn$
declare
  caller uuid:=auth.uid();
  fid uuid;
  vid uuid;
  q text;
  i integer:=0;
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;
  if not public.is_coach_business_member(p_business_id) then raise exception using errcode='42501',message='Coach business access required'; end if;
  if p_title is null or length(btrim(p_title))<2 or length(p_title)>160 then raise exception using errcode='22023',message='Form title must be 2-160 characters'; end if;
  if p_program_id is null or not exists(select 1 from public.programs where id=p_program_id and coalesce((coaching_config->>'available')::boolean,false)=true) then
    raise exception using errcode='22023',message='A coaching-enabled program is required';
  end if;
  if p_questions is null or cardinality(p_questions)<1 or cardinality(p_questions)>40 then
    raise exception using errcode='22023',message='Add between 1 and 40 intake questions';
  end if;

  insert into public.form_definitions(program_id,business_id,title,description,form_type,privacy_mode,status,current_version,sensitive,created_by)
  values(p_program_id,p_business_id,btrim(p_title),nullif(btrim(coalesce(p_description,'')),''),'intake','private_user','published',1,false,caller)
  returning id into fid;

  insert into public.form_versions(form_id,version_number,status,created_by,published_at)
  values(fid,1,'published',caller,clock_timestamp()) returning id into vid;

  foreach q in array p_questions loop
    q:=btrim(coalesce(q,''));
    if q<>'' then
      i:=i+1;
      if length(q)>1000 then raise exception using errcode='22023',message='An intake question is too long'; end if;
      insert into public.form_questions(form_version_id,question_key,prompt,question_type,required,options,display_order,sensitive)
      values(vid,'q_'||i::text,q,'long_text',false,'[]'::jsonb,i*10,false);
    end if;
  end loop;
  if i=0 then raise exception using errcode='22023',message='At least one intake question is required'; end if;
  return fid;
end $fn$;

create or replace function public.assign_coach_intake_form(
  p_form_id uuid,
  p_client_user_id uuid,
  p_due_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path=''
as $fn$
declare
  caller uuid:=auth.uid();
  f public.form_definitions%rowtype;
  rel public.coach_client_relationships%rowtype;
  vid uuid;
  aid uuid;
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;
  select * into f from public.form_definitions where id=p_form_id and form_type='intake' and status='published';
  if not found or f.business_id is null or not public.is_coach_business_member(f.business_id) then
    raise exception using errcode='42501',message='Coach intake form not found';
  end if;
  select * into rel from public.coach_client_relationships
    where business_id=f.business_id and client_user_id=p_client_user_id and status='active'
      and (f.program_id is null or program_id=f.program_id)
    order by started_at desc limit 1;
  if not found then raise exception using errcode='42501',message='An active coaching relationship is required'; end if;
  select id into vid from public.form_versions where form_id=f.id and status='published' order by version_number desc limit 1;
  if vid is null then raise exception 'Published form version is missing'; end if;
  select id into aid from public.form_assignments
    where form_id=f.id and user_id=p_client_user_id and assigned_scope='coach' and status in('assigned','in_progress')
    order by created_at desc limit 1;
  if aid is not null then return aid; end if;
  insert into public.form_assignments(form_id,form_version_id,user_id,assigned_by,assigned_scope,business_id,program_id,due_at,status)
  values(f.id,vid,p_client_user_id,caller,'coach',f.business_id,rel.program_id,p_due_at,'assigned')
  returning id into aid;
  return aid;
end $fn$;

revoke all on function public.get_my_coach_operations_context() from public,anon,authenticated;
revoke all on function public.create_coach_intake_form(uuid,uuid,text,text,text[]) from public,anon,authenticated;
revoke all on function public.assign_coach_intake_form(uuid,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.get_my_coach_operations_context(),
  public.create_coach_intake_form(uuid,uuid,text,text,text[]),
  public.assign_coach_intake_form(uuid,uuid,timestamptz)
  to authenticated,service_role;

do $verify$
begin
  if to_regprocedure('public.get_my_coach_operations_context()') is null
     or to_regprocedure('public.create_coach_intake_form(uuid,uuid,text,text,text[])') is null
     or to_regprocedure('public.assign_coach_intake_form(uuid,uuid,timestamp with time zone)') is null then
    raise exception 'Coach Operations RPC restore incomplete';
  end if;
  if has_function_privilege('anon','public.get_my_coach_operations_context()','EXECUTE')
     or has_function_privilege('anon','public.create_coach_intake_form(uuid,uuid,text,text,text[])','EXECUTE')
     or has_function_privilege('anon','public.assign_coach_intake_form(uuid,uuid,timestamp with time zone)','EXECUTE') then
    raise exception 'Anonymous Coach Operations RPC execution remains';
  end if;
end $verify$;
