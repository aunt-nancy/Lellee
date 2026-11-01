-- Keep the Coaching-only shell reproducible on a fresh database.
-- The function already exists in production; this records its canonical definition.

begin;

create or replace function public.get_my_coach_dashboard_context()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog','auth'
as $$
declare
  uid uuid:=auth.uid();
  bid uuid;
  member_role text;
  result jsonb;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select m.business_id,m.role into bid,member_role
  from public.coach_business_members m
  where m.user_id=uid and m.status='active'
  order by case when m.role='owner' then 0 when m.role='admin' then 1 else 2 end,m.created_at
  limit 1;

  if bid is null then
    select b.id,'owner' into bid,member_role
    from public.coach_businesses b where b.owner_user_id=uid limit 1;
  end if;

  result:=jsonb_build_object(
    'has_business',bid is not null,
    'member_role',member_role,
    'programs',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',p.id,'slug',p.slug,'name',p.name,'status',p.status
      ) order by p.display_order,p.name)
      from public.programs p where p.status in('active','pilot','planned')
    ),'[]'::jsonb)
  );

  if bid is null then
    return result || jsonb_build_object(
      'business',null,
      'metrics',jsonb_build_object('clients',0,'groups',0,'open_seats',0,'unread_messages',0),
      'clients','[]'::jsonb,'groups','[]'::jsonb,'services','[]'::jsonb,
      'leads','[]'::jsonb,'messages','[]'::jsonb,'assignments','[]'::jsonb
    );
  end if;

  if not public.is_coach_business_member(bid)
     and not exists(select 1 from public.coach_businesses where id=bid and owner_user_id=uid) then
    raise exception 'Coach business access required';
  end if;

  return result || jsonb_build_object(
    'business',(
      select jsonb_build_object(
        'id',b.id,'business_name',b.business_name,'public_name',b.public_name,
        'primary_program_id',b.primary_program_id,'business_model',b.business_model,
        'target_audience',b.target_audience,'bio',b.bio,
        'credentials_disclosure',b.credentials_disclosure,'status',b.status,
        'review_note',b.review_note,'submitted_at',b.submitted_at,
        'reviewed_at',b.reviewed_at,'approved_at',b.approved_at,
        'marketplace_visible',b.marketplace_visible
      ) from public.coach_businesses b where b.id=bid
    ),
    'metrics',jsonb_build_object(
      'clients',(select count(*) from public.coach_client_relationships where business_id=bid and status='active'),
      'groups',(select count(*) from public.coach_groups where business_id=bid and status in('forming','active')),
      'open_seats',coalesce((
        select sum(greatest(0,g.capacity-coalesce(x.members,0)))
        from public.coach_groups g
        left join lateral(
          select count(*) members from public.coach_group_members gm
          where gm.group_id=g.id and gm.status='active'
        ) x on true
        where g.business_id=bid and g.status in('forming','active')
      ),0),
      'unread_messages',(select count(*) from public.coach_messages m
        where m.business_id=bid and m.sender_user_id<>uid and m.read_at is null)
    ),
    'clients',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'client_user_id',r.client_user_id,
        'client_name',coalesce(nullif(split_part(u.email,'@',1),''),'Client '||left(r.client_user_id::text,8)),
        'client_email',u.email,'program_id',r.program_id,'program_name',pr.name,
        'service_package_id',r.service_package_id,'service_name',sp.name,
        'status',r.status,'started_at',r.started_at
      ) order by r.started_at desc)
      from public.coach_client_relationships r
      left join auth.users u on u.id=r.client_user_id
      left join public.programs pr on pr.id=r.program_id
      left join public.coach_service_packages sp on sp.id=r.service_package_id
      where r.business_id=bid
    ),'[]'::jsonb),
    'groups',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',g.id,'name',g.name,'description',g.description,
        'program_id',g.program_id,'program_name',pr.name,
        'service_package_id',g.service_package_id,'capacity',g.capacity,
        'members',coalesce(x.members,0),'status',g.status,
        'start_date',g.start_date,'end_date',g.end_date,'group_price',g.group_price,
        'public_enrollment_open',g.public_enrollment_open,'waitlist_enabled',g.waitlist_enabled
      ) order by coalesce(g.start_date,current_date),g.name)
      from public.coach_groups g
      left join public.programs pr on pr.id=g.program_id
      left join lateral(
        select count(*) members from public.coach_group_members gm
        where gm.group_id=g.id and gm.status='active'
      ) x on true
      where g.business_id=bid
    ),'[]'::jsonb),
    'services',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,'program_id',s.program_id,'program_name',pr.name,
        'name',s.name,'description',s.description,'service_type',s.service_type,
        'billing_model',s.billing_model,'price_amount',s.price_amount,
        'sessions_included',s.sessions_included,'group_capacity',s.group_capacity,
        'individual_touchpoints',s.individual_touchpoints,'active',s.active
      ) order by s.active desc,s.name)
      from public.coach_service_packages s
      left join public.programs pr on pr.id=s.program_id
      where s.business_id=bid
    ),'[]'::jsonb),
    'leads',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',l.id,'name',l.name,'email',l.email,'phone',l.phone,
        'source',l.source,'status',l.status,'notes',l.notes,
        'interested_service_id',l.interested_service_id,'created_at',l.created_at
      ) order by l.created_at desc)
      from public.coach_leads l where l.business_id=bid
    ),'[]'::jsonb),
    'messages',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',m.id,'relationship_id',m.relationship_id,'group_id',m.group_id,
        'sender_user_id',m.sender_user_id,
        'sender_label',case when m.sender_user_id=uid then 'You' else coalesce(
          (select nullif(split_part(u2.email,'@',1),'') from auth.users u2 where u2.id=m.sender_user_id),
          'Participant') end,
        'body',m.body,'created_at',m.created_at,'read_at',m.read_at
      ) order by m.created_at desc)
      from (
        select * from public.coach_messages
        where business_id=bid order by created_at desc limit 100
      ) m
    ),'[]'::jsonb),
    'assignments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'program_id',a.program_id,'program_name',pr.name,
        'title',a.title,'instructions',a.instructions,'due_at',a.due_at,
        'status',a.status,'created_at',a.created_at,
        'recipient_count',(select count(*) from public.coach_assignment_recipients ar where ar.assignment_id=a.id)
      ) order by a.created_at desc)
      from public.coach_assignments a
      left join public.programs pr on pr.id=a.program_id
      where a.business_id=bid
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_my_coach_dashboard_context() from public,anon;
grant execute on function public.get_my_coach_dashboard_context() to authenticated,service_role;

commit;
