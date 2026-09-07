-- Canonical hkrr Lellee: restore approved Coach Operations backend paths.
-- Covers Analytics, Revenue, Scheduler/CRM, Credentials/Training and Intake Forms.
-- Coach Automation remains explicitly OFF because no approved automation engine schema exists.
-- No pricing, Stripe, journal, logo, layout, or Auth configuration changes.

do $check$
begin
  if not exists(
    select 1 from public.platform_environment_baseline
    where environment_key='supabase_project_ref' and expected_value='hkrrxscyhtxmbvxevfkw'
  ) then raise exception 'Wrong Lellee runtime project'; end if;
  if to_regprocedure('public.get_my_coach_dashboard_context()') is null then
    raise exception 'Coach Dashboard core restoration must run first';
  end if;
end $check$;

insert into public.app_public_settings(key,value,updated_at)
values('coach_automation_enabled','false',clock_timestamp())
on conflict(key) do update set value='false',updated_at=excluded.updated_at;

-- Current Coach Operations UI creates the signed-in coach's own training record.
drop policy if exists training_records_owner_insert on public.training_records;
create policy training_records_owner_insert on public.training_records
  for insert to authenticated
  with check(user_id=(select auth.uid()));
grant insert on table public.training_records to authenticated;

-- Safe operational CRM history only: no journal/diagnosis/crisis content is sourced here.
drop policy if exists crm_history_coach_insert on public.crm_contact_history;
create policy crm_history_coach_insert on public.crm_contact_history
  for insert to authenticated
  with check(
    workspace_type='coach'
    and business_id is not null
    and actor_user_id=(select auth.uid())
    and public.is_coach_business_member(business_id)
  );
grant insert on table public.crm_contact_history to authenticated;

create or replace function public.create_coach_intake_form(
  p_business_id uuid,
  p_program_id uuid,
  p_title text,
  p_description text default null,
  p_questions text[] default array[]::text[]
)
returns uuid language plpgsql security definer set search_path=''
as $fn$
declare
  caller uuid:=auth.uid();
  v_form_id uuid;
  v_version_id uuid;
  q text;
  ord integer:=0;
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;
  if not exists(
    select 1 from public.coach_business_members bm
    join public.coach_businesses b on b.id=bm.business_id and b.status='approved'
    where bm.business_id=p_business_id and bm.user_id=caller and bm.status='active'
      and bm.role in('owner','admin','coach')
  ) then
    raise exception using errcode='42501',message='Approved coaching business access required';
  end if;
  if not exists(
    select 1 from public.coach_business_programs bp
    join public.programs p on p.id=bp.program_id and p.status='active'
    where bp.business_id=p_business_id and bp.program_id=p_program_id and bp.status='approved'
  ) then
    raise exception using errcode='42501',message='That program is not approved for this coaching business';
  end if;
  if length(btrim(coalesce(p_title,''))) not between 2 and 200
     or length(coalesce(p_description,''))>2000 then
    raise exception using errcode='22023',message='Intake form title or description is invalid';
  end if;
  if coalesce(array_length(p_questions,1),0) not between 1 and 25 then
    raise exception using errcode='22023',message='Add between 1 and 25 intake questions';
  end if;

  insert into public.form_definitions(
    program_id,business_id,title,description,form_type,privacy_mode,status,current_version,sensitive,created_by
  ) values(
    p_program_id,p_business_id,btrim(p_title),nullif(btrim(p_description),''),
    'intake','shared_with_assignee','published',1,false,caller
  ) returning id into v_form_id;

  insert into public.form_versions(form_id,version_number,status,created_by,published_at)
  values(v_form_id,1,'published',caller,clock_timestamp()) returning id into v_version_id;

  foreach q in array p_questions loop
    ord:=ord+1;
    q:=btrim(coalesce(q,''));
    if length(q) not between 1 and 1000 then
      raise exception using errcode='22023',message='Each intake question must be 1 to 1000 characters';
    end if;
    insert into public.form_questions(
      form_version_id,question_key,prompt,question_type,required,options,display_order,sensitive
    ) values(v_version_id,'q_'||ord,q,'long_text',false,'[]'::jsonb,ord*10,false);
  end loop;

  return v_form_id;
end $fn$;

create or replace function public.assign_coach_intake_form(
  p_form_id uuid,
  p_client_user_id uuid,
  p_due_at timestamptz default null
)
returns uuid language plpgsql security definer set search_path=''
as $fn$
declare
  caller uuid:=auth.uid();
  f public.form_definitions%rowtype;
  v_version_id uuid;
  v_assignment_id uuid;
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;
  select * into f from public.form_definitions
  where id=p_form_id and form_type='intake' and status='published' for update;
  if not found or f.business_id is null then
    raise exception using errcode='22023',message='Intake form is not available';
  end if;
  if not exists(
    select 1 from public.coach_business_members bm
    join public.coach_businesses b on b.id=bm.business_id and b.status='approved'
    where bm.business_id=f.business_id and bm.user_id=caller and bm.status='active'
      and bm.role in('owner','admin','coach')
  ) then
    raise exception using errcode='42501',message='Approved coaching business access required';
  end if;
  if not exists(
    select 1 from public.coach_client_relationships r
    where r.business_id=f.business_id and r.client_user_id=p_client_user_id and r.status='active'
      and (f.program_id is null or r.program_id=f.program_id)
  ) then
    raise exception using errcode='42501',message='Select an active client in this coaching program';
  end if;
  select v.id into v_version_id from public.form_versions v
  where v.form_id=f.id and v.status='published'
  order by v.version_number desc limit 1;
  if v_version_id is null then raise exception 'Published intake form version is missing'; end if;
  if p_due_at is not null and p_due_at<=statement_timestamp() then
    raise exception using errcode='22023',message='Due date must be in the future';
  end if;

  insert into public.form_assignments(
    form_id,form_version_id,user_id,assigned_by,assigned_scope,business_id,program_id,due_at,status
  ) values(
    f.id,v_version_id,p_client_user_id,caller,'coach',f.business_id,f.program_id,p_due_at,'assigned'
  ) returning id into v_assignment_id;
  return v_assignment_id;
end $fn$;

create or replace function public.get_my_coach_operations_context()
returns jsonb language plpgsql stable security definer set search_path=''
as $fn$
declare
  caller uuid:=auth.uid();
  v_bid uuid;
  v_name text;
  v_status text;
  v_analytics jsonb;
  v_revenue jsonb;
  v_scheduler jsonb;
  v_credentials jsonb;
  v_quickstart jsonb;
  v_payments boolean:=false;
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;

  select b.id,coalesce(b.public_name,b.business_name),b.status
    into v_bid,v_name,v_status
  from public.coach_business_members bm
  join public.coach_businesses b on b.id=bm.business_id
  where bm.user_id=caller and bm.status='active'
  order by (b.owner_user_id=caller) desc,b.created_at
  limit 1;

  if v_bid is null then
    return jsonb_build_object(
      'has_business',false,'business_id',null,'business_name',null,
      'analytics',jsonb_build_object('summary',jsonb_build_object(),'services','[]'::jsonb,'groups','[]'::jsonb),
      'revenue',jsonb_build_object('summary',jsonb_build_object(),'services','[]'::jsonb,'groups','[]'::jsonb,
        'payout_status',jsonb_build_object('enabled',false,'label','Coach payment collection and payouts are not activated.')),
      'scheduler',jsonb_build_object('summary',jsonb_build_object(),'schedule','[]'::jsonb,'availability','[]'::jsonb,
        'consultations','[]'::jsonb,'followups','[]'::jsonb,'history','[]'::jsonb),
      'automation',jsonb_build_object('enabled',false,'summary',jsonb_build_object('active_rules',0,'followups_due',0,'tasks_created',0,'recent_runs',0),
        'rules','[]'::jsonb,'runs','[]'::jsonb,'message','Coach Automation is not enabled in the current release.'),
      'credentials',jsonb_build_object('summary',jsonb_build_object(),'credentials','[]'::jsonb,'training','[]'::jsonb,'intake_forms','[]'::jsonb),
      'quickstart',jsonb_build_object('steps','[]'::jsonb)
    );
  end if;

  select coalesce((select s.value='true' from public.app_public_settings s where s.key='coach_payments_enabled'),false)
    into v_payments;

  v_analytics:=jsonb_build_object(
    'summary',jsonb_build_object(
      'leads',(select count(*) from public.coach_leads l where l.business_id=v_bid),
      'lead_converted',(select count(*) from public.coach_leads l where l.business_id=v_bid and l.status='converted'),
      'clients',(select count(*) from public.coach_client_relationships r where r.business_id=v_bid and r.status='active'),
      'new_clients',(select count(*) from public.coach_client_relationships r where r.business_id=v_bid and r.status='active' and r.started_at>=statement_timestamp()-interval '30 days'),
      'groups',(select count(*) from public.coach_groups g where g.business_id=v_bid and g.status in('forming','active')),
      'open_seats',(select coalesce(sum(greatest(0,g.capacity-coalesce((select count(*) from public.coach_group_members gm where gm.group_id=g.id and gm.status='active'),0))),0) from public.coach_groups g where g.business_id=v_bid and g.status in('forming','active')),
      'consultations',(select count(*) from public.coach_consultation_requests c where c.business_id=v_bid),
      'consult_converted',(select count(*) from public.coach_consultation_requests c where c.business_id=v_bid and c.status='converted')
    ),
    'services',coalesce((select jsonb_agg(jsonb_build_object(
      'id',s.id,'name',s.name,'service_type',s.service_type,
      'active_clients',(select count(*) from public.coach_client_relationships r where r.service_package_id=s.id and r.status='active'),
      'active_groups',(select count(*) from public.coach_groups g where g.service_package_id=s.id and g.status in('forming','active'))
    ) order by s.created_at) from public.coach_service_packages s where s.business_id=v_bid and s.active),'[]'::jsonb),
    'groups',coalesce((select jsonb_agg(jsonb_build_object(
      'id',g.id,'name',g.name,'members',coalesce(m.members,0),'capacity',g.capacity,
      'open_seats',greatest(0,g.capacity-coalesce(m.members,0))
    ) order by g.created_at) from public.coach_groups g
      left join lateral(select count(*)::int members from public.coach_group_members gm where gm.group_id=g.id and gm.status='active') m on true
      where g.business_id=v_bid and g.status in('forming','active')),'[]'::jsonb)
  );

  v_revenue:=jsonb_build_object(
    'summary',jsonb_build_object(
      'services',(select count(*) from public.coach_service_packages s where s.business_id=v_bid and s.active),
      'clients',(select count(*) from public.coach_client_relationships r where r.business_id=v_bid and r.status='active'),
      'groups',(select count(*) from public.coach_groups g where g.business_id=v_bid and g.status in('forming','active')),
      'projected_gross',(select coalesce(sum(coalesce(g.group_price,0)*coalesce(m.members,0)),0) from public.coach_groups g
        left join lateral(select count(*)::numeric members from public.coach_group_members gm where gm.group_id=g.id and gm.status='active') m on true
        where g.business_id=v_bid and g.status in('forming','active'))
    ),
    'services',coalesce((select jsonb_agg(jsonb_build_object(
      'id',s.id,'name',s.name,'service_type',s.service_type,'billing_model',s.billing_model,'price_amount',s.price_amount,
      'sessions_included',s.sessions_included,'group_capacity',s.group_capacity,'individual_touchpoints',s.individual_touchpoints
    ) order by s.created_at) from public.coach_service_packages s where s.business_id=v_bid and s.active),'[]'::jsonb),
    'groups',coalesce((select jsonb_agg(jsonb_build_object(
      'id',g.id,'name',g.name,'members',coalesce(m.members,0),'capacity',g.capacity,'group_price',g.group_price,
      'projected_value',coalesce(g.group_price,0)*coalesce(m.members,0)
    ) order by g.created_at) from public.coach_groups g
      left join lateral(select count(*)::numeric members from public.coach_group_members gm where gm.group_id=g.id and gm.status='active') m on true
      where g.business_id=v_bid and g.status in('forming','active')),'[]'::jsonb),
    'payout_status',jsonb_build_object('enabled',v_payments,
      'label',case when v_payments then 'Coach payment operations are enabled.' else 'Coach payment collection and payouts are not activated.' end)
  );

  v_scheduler:=jsonb_build_object(
    'summary',jsonb_build_object(
      'open_consultations',(select count(*) from public.coach_consultation_requests c where c.business_id=v_bid and c.status in('new','contacted','scheduled')),
      'upcoming_sessions',(select count(*) from public.coach_schedule_events e where e.business_id=v_bid and e.status in('scheduled','confirmed') and e.scheduled_start>=statement_timestamp()),
      'followups_due',(select count(*) from public.crm_followups f where f.business_id=v_bid and f.workspace_type='coach' and f.status='open' and (f.due_at is null or f.due_at<=statement_timestamp()+interval '7 days')),
      'open_slots',(select count(*) from public.coach_availability_rules a where a.business_id=v_bid and a.active)
    ),
    'schedule',coalesce((select jsonb_agg(jsonb_build_object(
      'id',e.id,'title',e.title,'scheduled_start',e.scheduled_start,'duration_minutes',e.duration_minutes,
      'session_scope',e.session_scope,'status',e.status,'meeting_location',e.meeting_location
    ) order by e.scheduled_start) from public.coach_schedule_events e
      where e.business_id=v_bid and e.status in('scheduled','confirmed') and e.scheduled_start>=statement_timestamp()),'[]'::jsonb),
    'availability',coalesce((select jsonb_agg(jsonb_build_object(
      'id',a.id,'day_of_week',a.day_of_week,'start_time',a.start_time::text,'end_time',a.end_time::text,
      'timezone',a.timezone,'active',a.active
    ) order by a.day_of_week,a.start_time) from public.coach_availability_rules a where a.business_id=v_bid),'[]'::jsonb),
    'consultations',coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'client_label',coalesce(p.display_name,'Lellee user'),'note',c.note,'status',c.status,'created_at',c.created_at
    ) order by c.created_at desc) from public.coach_consultation_requests c
      left join public.profiles p on p.id=c.user_id where c.business_id=v_bid and c.status<>'closed'),'[]'::jsonb),
    'followups',coalesce((select jsonb_agg(jsonb_build_object(
      'id',f.id,'title',f.title,'related_label',coalesce(p.display_name,''),'note',f.note,'due_at',f.due_at,'status',f.status
    ) order by f.due_at nulls last,f.created_at) from public.crm_followups f
      left join public.profiles p on p.id=f.related_user_id
      where f.business_id=v_bid and f.workspace_type='coach' and f.status in('open','completed')),'[]'::jsonb),
    'history',coalesce((select jsonb_agg(jsonb_build_object(
      'id',h.id,'event_label',h.event_label,'event_type',h.event_type,'created_at',h.created_at
    ) order by h.created_at desc) from (select * from public.crm_contact_history where business_id=v_bid and workspace_type='coach' order by created_at desc limit 50) h),'[]'::jsonb)
  );

  v_credentials:=jsonb_build_object(
    'summary',jsonb_build_object(
      'credentials',(select count(*) from public.professional_credential_claims c where c.business_id=v_bid),
      'verified',(select count(*) from public.professional_credential_claims c where c.business_id=v_bid and c.verification_status='verified'),
      'training',(select count(*) from public.training_records t where exists(select 1 from public.coach_business_members bm where bm.business_id=v_bid and bm.user_id=t.user_id and bm.status='active')),
      'intake_forms',(select count(*) from public.form_definitions f where f.business_id=v_bid and f.form_type='intake' and f.status<>'retired')
    ),
    'credentials',coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'label',c.label,'credential_type',c.credential_type,'issuer',c.issuer,
      'verification_status',c.verification_status,'expires_on',c.expires_on
    ) order by c.created_at desc) from public.professional_credential_claims c where c.business_id=v_bid),'[]'::jsonb),
    'training',coalesce((select jsonb_agg(jsonb_build_object(
      'id',t.id,'title',t.title,'hours',t.hours,'status',t.status,'completed_at',t.completed_at,'expires_on',t.expires_on,'verified',t.verified
    ) order by t.created_at desc) from public.training_records t
      where exists(select 1 from public.coach_business_members bm where bm.business_id=v_bid and bm.user_id=t.user_id and bm.status='active')),'[]'::jsonb),
    'intake_forms',coalesce((select jsonb_agg(jsonb_build_object(
      'id',f.id,'title',f.title,'description',f.description,'status',f.status,'program_id',f.program_id,
      'assignment_count',(select count(*) from public.form_assignments a where a.form_id=f.id)
    ) order by f.created_at desc) from public.form_definitions f where f.business_id=v_bid and f.form_type='intake' and f.status<>'retired'),'[]'::jsonb)
  );

  v_quickstart:=jsonb_build_object('steps',jsonb_build_array(
    jsonb_build_object('label','Complete business profile','complete',v_name is not null,'page','coach-business'),
    jsonb_build_object('label','Submit for review','complete',v_status<>'draft','page','coach-business'),
    jsonb_build_object('label','Add a service','complete',exists(select 1 from public.coach_service_packages s where s.business_id=v_bid and s.active),'page','coach-dashboard'),
    jsonb_build_object('label','Set availability','complete',exists(select 1 from public.coach_availability_rules a where a.business_id=v_bid and a.active),'page','coach-scheduler'),
    jsonb_build_object('label','Add credentials or training','complete',exists(select 1 from public.professional_credential_claims c where c.business_id=v_bid) or exists(select 1 from public.training_records t where t.user_id=caller),'page','coach-credentials')
  ));

  return jsonb_build_object(
    'has_business',true,'business_id',v_bid,'business_name',v_name,
    'analytics',v_analytics,'revenue',v_revenue,'scheduler',v_scheduler,
    'automation',jsonb_build_object(
      'enabled',false,
      'summary',jsonb_build_object('active_rules',0,'followups_due',(v_scheduler->'summary'->>'followups_due')::int,'tasks_created',0,'recent_runs',0),
      'rules','[]'::jsonb,'runs','[]'::jsonb,
      'message','Coach Automation is not enabled in the current release.'
    ),
    'credentials',v_credentials,'quickstart',v_quickstart
  );
end $fn$;

revoke all on function public.create_coach_intake_form(uuid,uuid,text,text,text[]),
  public.assign_coach_intake_form(uuid,uuid,timestamptz),
  public.get_my_coach_operations_context() from public,anon,authenticated;
grant execute on function public.create_coach_intake_form(uuid,uuid,text,text,text[]),
  public.assign_coach_intake_form(uuid,uuid,timestamptz),
  public.get_my_coach_operations_context() to authenticated,service_role;

do $verify$
declare sig text;
begin
  foreach sig in array array[
    'public.create_coach_intake_form(uuid,uuid,text,text,text[])',
    'public.assign_coach_intake_form(uuid,uuid,timestamptz)',
    'public.get_my_coach_operations_context()'
  ] loop
    if has_function_privilege('anon',sig,'EXECUTE') then raise exception 'Anonymous Coach Operations RPC remains: %',sig; end if;
    if not has_function_privilege('authenticated',sig,'EXECUTE') then raise exception 'Authenticated Coach Operations RPC missing: %',sig; end if;
  end loop;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='training_records' and policyname='training_records_owner_insert') then
    raise exception 'Training record owner insert policy is missing';
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='crm_contact_history' and policyname='crm_history_coach_insert') then
    raise exception 'Coach CRM history insert policy is missing';
  end if;
  if not exists(select 1 from public.app_public_settings where key='coach_automation_enabled' and value='false') then
    raise exception 'Coach Automation must remain explicitly off';
  end if;
end $verify$;
