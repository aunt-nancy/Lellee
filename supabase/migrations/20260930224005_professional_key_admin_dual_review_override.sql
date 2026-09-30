begin;

alter table public.professional_reviewers
  add column if not exists linked_user_id uuid references auth.users(id);

create unique index if not exists professional_reviewers_linked_user_unique_idx
  on public.professional_reviewers(linked_user_id)
  where linked_user_id is not null;

create table if not exists public.professional_review_controls (
  control_key text primary key,
  key_admin_dual_review_enabled boolean not null default false,
  reason text,
  enabled_by uuid references auth.users(id),
  enabled_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.professional_review_controls(control_key,key_admin_dual_review_enabled)
values('global',false)
on conflict(control_key) do nothing;

alter table public.professional_review_controls enable row level security;
revoke all on public.professional_review_controls from anon;
grant select on public.professional_review_controls to authenticated;

drop policy if exists professional_review_controls_admin_read
on public.professional_review_controls;
create policy professional_review_controls_admin_read
on public.professional_review_controls
for select to authenticated
using (public.is_lellee_admin());

create or replace function private.is_professional_key_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path=public,pg_catalog
as $$
  select p_user_id is not null and exists(
    select 1
    from public.admin_user_roles aur
    where aur.user_id=p_user_id
      and aur.active=true
      and aur.role='admin'
  )
$$;
revoke all on function private.is_professional_key_admin(uuid) from public,anon;
grant execute on function private.is_professional_key_admin(uuid) to authenticated;

create or replace function public.is_professional_key_admin()
returns boolean
language sql
stable
security invoker
set search_path=public,private,pg_catalog
as $$ select private.is_professional_key_admin(auth.uid()) $$;
revoke all on function public.is_professional_key_admin() from public,anon;
grant execute on function public.is_professional_key_admin() to authenticated;

create or replace function private.professional_dual_review_override_enabled()
returns boolean
language sql
stable
security definer
set search_path=public,pg_catalog
as $$
  select coalesce((
    select key_admin_dual_review_enabled
    from public.professional_review_controls
    where control_key='global'
  ),false)
$$;
revoke all on function private.professional_dual_review_override_enabled() from public,anon,authenticated;

create or replace function private.admin_link_reviewer_to_current_key_admin(p_reviewer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  r public.professional_reviewers%rowtype;
begin
  if not private.is_professional_key_admin(uid) then
    raise exception 'Key administrator access required';
  end if;

  select * into r
  from public.professional_reviewers
  where id=p_reviewer_id
  for update;

  if r.id is null then raise exception 'Reviewer not found'; end if;
  if r.verification_status<>'verified_in_house' or not r.active then
    raise exception 'Reviewer must be Verified In-House and active before linking';
  end if;

  if exists(
    select 1 from public.professional_reviewers x
    where x.linked_user_id=uid and x.id<>r.id
  ) then
    raise exception 'This key administrator is already linked to another reviewer record';
  end if;

  update public.professional_reviewers
  set linked_user_id=uid,updated_at=now()
  where id=r.id;

  insert into public.admin_audit_log(
    actor_user_id,entity_type,entity_id,action,changed_fields,action_label,workspace
  ) values(
    uid,'professional_reviewer',r.id::text,'link_key_admin',
    array['linked_user_id'],'Linked reviewer record to key administrator','professional_training'
  );

  return jsonb_build_object(
    'reviewer_id',r.id,
    'linked_user_id',uid,
    'key_admin_linked',true
  );
end;
$$;
revoke all on function private.admin_link_reviewer_to_current_key_admin(uuid) from public,anon;
grant execute on function private.admin_link_reviewer_to_current_key_admin(uuid) to authenticated;

create or replace function public.admin_link_reviewer_to_current_key_admin(p_reviewer_id uuid)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_link_reviewer_to_current_key_admin(p_reviewer_id) $$;
revoke all on function public.admin_link_reviewer_to_current_key_admin(uuid) from public,anon;
grant execute on function public.admin_link_reviewer_to_current_key_admin(uuid) to authenticated;

create or replace function private.admin_set_key_admin_dual_review_override(
  p_enabled boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  linked_count integer;
  c record;
begin
  if not private.is_professional_key_admin(uid) then
    raise exception 'Key administrator access required';
  end if;

  if p_enabled and char_length(trim(coalesce(p_reason,'')))<10 then
    raise exception 'A reason of at least 10 characters is required to enable the temporary override';
  end if;

  if p_enabled then
    select count(*) into linked_count
    from public.professional_reviewers r
    where r.linked_user_id=uid
      and r.verification_status='verified_in_house'
      and r.active=true;
    if linked_count<>1 then
      raise exception 'Link one active Verified In-House reviewer record to the key administrator before enabling dual review';
    end if;
  end if;

  update public.professional_review_controls
  set key_admin_dual_review_enabled=p_enabled,
      reason=case when p_enabled then trim(p_reason) else null end,
      enabled_by=case when p_enabled then uid else null end,
      enabled_at=case when p_enabled then now() else null end,
      updated_at=now()
  where control_key='global';

  insert into public.admin_audit_log(
    actor_user_id,entity_type,entity_id,action,changed_fields,action_label,workspace
  ) values(
    uid,'professional_review_control','global',
    case when p_enabled then 'enable_dual_review_override' else 'disable_dual_review_override' end,
    array['key_admin_dual_review_enabled','reason','enabled_by','enabled_at'],
    case when p_enabled
      then 'Enabled temporary key-administrator dual-review override'
      else 'Disabled temporary key-administrator dual-review override'
    end,
    'professional_training'
  );

  for c in
    select pc.id
    from public.professional_courses pc
    join public.professional_course_review_requirements req
      on req.course_id=pc.id and req.review_type='scope'
    group by pc.id
  loop
    perform private.refresh_professional_review_domain(c.id,'scope');

    if not p_enabled and exists(
      select 1 from public.professional_course_reviews pr
      where pr.course_id=c.id
        and pr.review_type='scope'
        and pr.status<>'approved'
    ) then
      update public.professional_courses
      set status='draft',checkout_enabled=false,updated_at=now()
      where id=c.id;
    end if;
  end loop;

  return jsonb_build_object(
    'enabled',p_enabled,
    'reason',case when p_enabled then trim(p_reason) else null end,
    'enabled_by',case when p_enabled then uid else null end
  );
end;
$$;
revoke all on function private.admin_set_key_admin_dual_review_override(boolean,text) from public,anon;
grant execute on function private.admin_set_key_admin_dual_review_override(boolean,text) to authenticated;

create or replace function public.admin_set_key_admin_dual_review_override(
  p_enabled boolean,
  p_reason text default null
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_set_key_admin_dual_review_override(p_enabled,p_reason) $$;
revoke all on function public.admin_set_key_admin_dual_review_override(boolean,text) from public,anon;
grant execute on function public.admin_set_key_admin_dual_review_override(boolean,text) to authenticated;

create or replace function private.admin_assign_professional_reviewer(
  p_assignment_id uuid,
  p_reviewer_id uuid,
  p_due_date date default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  a public.professional_course_review_assignments%rowtype;
  r public.professional_reviewers%rowtype;
  dual_allowed boolean:=false;
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  select * into a
  from public.professional_course_review_assignments
  where id=p_assignment_id
  for update;
  if a.id is null then raise exception 'Review assignment not found'; end if;

  select * into r
  from public.professional_reviewers
  where id=p_reviewer_id;
  if r.id is null then raise exception 'Reviewer not found'; end if;
  if r.verification_status<>'verified_in_house' or not r.active then
    raise exception 'Reviewer must be Verified In-House and active';
  end if;
  if not (a.reviewer_domain=any(r.reviewer_domains)) then
    raise exception 'Reviewer is not verified for domain %',a.reviewer_domain;
  end if;

  dual_allowed :=
    private.professional_dual_review_override_enabled()
    and private.is_professional_key_admin(uid)
    and r.linked_user_id=uid;

  if a.review_type='scope' and exists(
    select 1
    from public.professional_course_review_assignments other
    where other.course_id=a.course_id
      and other.review_type='scope'
      and other.id<>a.id
      and other.reviewer_id=p_reviewer_id
      and other.status in ('assigned','in_review','completed')
  ) and not dual_allowed then
    raise exception 'Scope domains require different reviewers unless the key-administrator dual-review override is enabled';
  end if;

  update public.professional_course_review_assignments
  set reviewer_id=p_reviewer_id,
      status='assigned',
      due_date=p_due_date,
      assignment_notes=nullif(trim(coalesce(p_notes,'')),''),
      assigned_by=uid,
      assigned_at=now(),
      started_at=null,
      completed_at=null,
      updated_at=now()
  where id=a.id;

  return jsonb_build_object(
    'assignment_id',a.id,
    'reviewer_id',p_reviewer_id,
    'reviewer_domain',a.reviewer_domain,
    'status','assigned',
    'dual_review_override_used',dual_allowed
  );
end;
$$;

create or replace function private.refresh_professional_review_domain(p_course_id uuid,p_review_type text)
returns text
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  req public.professional_course_review_requirements%rowtype;
  domain text;
  approved_count integer;
  missing_domain boolean:=false;
  has_revisions boolean:=false;
  result_status text;
  dual_override boolean:=false;
  key_admin_reviewer_id uuid;
begin
  select * into req
  from public.professional_course_review_requirements
  where course_id=p_course_id and review_type=p_review_type;

  if req.course_id is null then raise exception 'Review requirement not configured'; end if;

  dual_override:=private.professional_dual_review_override_enabled();

  if dual_override then
    select r.id into key_admin_reviewer_id
    from public.professional_reviewers r
    join public.admin_user_roles aur
      on aur.user_id=r.linked_user_id
     and aur.active=true
     and aur.role='admin'
    where r.verification_status='verified_in_house'
      and r.active=true
    limit 1;
  end if;

  with latest as (
    select distinct on (s.reviewer_domain)
      s.reviewer_domain,s.reviewer_id,s.reviewer_name,s.reviewer_qualification,
      s.decision,s.attestation,s.reviewed_at
    from public.professional_course_review_signoffs s
    join public.professional_reviewers rv on rv.id=s.reviewer_id
    where s.course_id=p_course_id
      and s.review_type=p_review_type
      and rv.verification_status='verified_in_house'
      and rv.active=true
    order by s.reviewer_domain,s.reviewed_at desc,s.id desc
  )
  select exists(select 1 from latest where decision='revisions_required')
  into has_revisions;

  if has_revisions then
    result_status:='revisions_required';
  else
    if req.distinct_reviewers_required then
      with latest as (
        select distinct on (s.reviewer_domain)
          s.reviewer_domain,s.reviewer_id,s.reviewer_name,s.reviewer_qualification,
          s.decision,s.attestation,s.reviewed_at
        from public.professional_course_review_signoffs s
        join public.professional_reviewers rv on rv.id=s.reviewer_id
        where s.course_id=p_course_id
          and s.review_type=p_review_type
          and rv.verification_status='verified_in_house'
          and rv.active=true
        order by s.reviewer_domain,s.reviewed_at desc,s.id desc
      )
      select case
        when dual_override
         and key_admin_reviewer_id is not null
         and count(*) filter(
           where reviewer_id=key_admin_reviewer_id
             and decision='approved'
             and attestation=true
             and char_length(trim(reviewer_qualification))>=10
         ) >= req.minimum_signoffs
        then req.minimum_signoffs
        else count(distinct reviewer_id) filter(
          where decision='approved'
            and attestation=true
            and char_length(trim(reviewer_qualification))>=10
        )
      end
      into approved_count
      from latest;
    else
      with latest as (
        select distinct on (s.reviewer_domain)
          s.reviewer_domain,s.reviewer_id,s.reviewer_name,s.reviewer_qualification,
          s.decision,s.attestation,s.reviewed_at
        from public.professional_course_review_signoffs s
        join public.professional_reviewers rv on rv.id=s.reviewer_id
        where s.course_id=p_course_id
          and s.review_type=p_review_type
          and rv.verification_status='verified_in_house'
          and rv.active=true
        order by s.reviewer_domain,s.reviewed_at desc,s.id desc
      )
      select count(*)
      into approved_count
      from latest
      where decision='approved'
        and attestation=true
        and char_length(trim(reviewer_qualification))>=10;
    end if;

    if approved_count<req.minimum_signoffs then
      result_status:='internal_review';
    else
      if req.all_domains_required then
        foreach domain in array req.required_domains loop
          if not exists(
            select 1
            from (
              select distinct on (s.reviewer_domain)
                s.reviewer_domain,s.decision,s.attestation,s.reviewer_qualification
              from public.professional_course_review_signoffs s
              join public.professional_reviewers rv on rv.id=s.reviewer_id
              where s.course_id=p_course_id
                and s.review_type=p_review_type
                and rv.verification_status='verified_in_house'
                and rv.active=true
              order by s.reviewer_domain,s.reviewed_at desc,s.id desc
            ) latest
            where latest.reviewer_domain=domain
              and latest.decision='approved'
              and latest.attestation=true
              and char_length(trim(latest.reviewer_qualification))>=10
          ) then missing_domain:=true; end if;
        end loop;
      end if;
      result_status:=case when missing_domain then 'internal_review' else 'approved' end;
    end if;
  end if;

  update public.professional_course_reviews
  set status=result_status,
      reviewed_at=case when result_status='approved' then now() else reviewed_at end,
      updated_at=now()
  where course_id=p_course_id and review_type=p_review_type;

  if p_review_type='assessment' then
    update public.professional_courses
    set assessment_review_status=case when result_status='approved' then 'approved' else 'internal_review' end,
        updated_at=now()
    where id=p_course_id;

    update public.professional_assessment_items ai
    set review_status=case when result_status='approved' then 'approved' else 'internal_review' end,
        updated_at=now()
    from public.professional_course_modules m
    where ai.module_id=m.id and m.course_id=p_course_id;
  end if;

  if p_review_type='curriculum' then
    update public.professional_courses
    set curriculum_review_status=case when result_status='approved' then 'approved' else 'internal_review' end,
        updated_at=now()
    where id=p_course_id;
  end if;

  if result_status='revisions_required' then
    update public.professional_courses
    set status='draft',checkout_enabled=false,updated_at=now()
    where id=p_course_id;
  end if;

  if (
    select count(*) filter(where r.status='approved')=4
    from public.professional_course_reviews r
    where r.course_id=p_course_id
      and r.review_type in ('source','curriculum','scope','capstone')
  ) then
    update public.professional_course_modules
    set review_status='approved',reviewed_at=now(),updated_at=now()
    where course_id=p_course_id;
  else
    update public.professional_course_modules
    set review_status='internal_review',updated_at=now()
    where course_id=p_course_id;
  end if;

  return result_status;
end;
$$;

create or replace function private.get_admin_professional_training_review_center()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  ctl public.professional_review_controls%rowtype;
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;

  select * into ctl
  from public.professional_review_controls
  where control_key='global';

  return jsonb_build_object(
    'summary',jsonb_build_object(
      'courses',(select count(*) from public.professional_courses),
      'modules',(select count(*) from public.professional_course_modules),
      'assessments',(select count(*) from public.professional_assessment_items),
      'enrollments',(select count(*) from public.professional_enrollments),
      'published',(select count(*) from public.professional_courses where status='published'),
      'checkout_enabled',(select count(*) from public.professional_courses where checkout_enabled),
      'reviewers_pending',(select count(*) from public.professional_reviewers where verification_status='pending' and active=true),
      'reviewers_verified',(select count(*) from public.professional_reviewers where verification_status='verified_in_house' and active=true),
      'review_slots',(select count(*) from public.professional_course_review_assignments),
      'review_slots_unassigned',(select count(*) from public.professional_course_review_assignments where status='unassigned'),
      'review_slots_active',(select count(*) from public.professional_course_review_assignments where status in ('assigned','in_review')),
      'review_slots_completed',(select count(*) from public.professional_course_review_assignments where status='completed')
    ),
    'controls',jsonb_build_object(
      'is_key_administrator',private.is_professional_key_admin(uid),
      'dual_review_override_enabled',coalesce(ctl.key_admin_dual_review_enabled,false),
      'dual_review_override_reason',ctl.reason,
      'dual_review_override_enabled_at',ctl.enabled_at,
      'key_admin_reviewer_id',(
        select r.id
        from public.professional_reviewers r
        where r.linked_user_id=uid
          and r.verification_status='verified_in_house'
          and r.active=true
        limit 1
      )
    ),
    'reviewers',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'full_name',r.full_name,'qualification',r.qualification,
        'reviewer_domains',r.reviewer_domains,'organization',r.organization,'evidence_ref',r.evidence_ref,
        'verification_status',r.verification_status,'verification_method',r.verification_method,
        'verification_notes',r.verification_notes,'verified_at',r.verified_at,'active',r.active,
        'linked_user_id',r.linked_user_id,
        'linked_to_current_key_admin',(r.linked_user_id=uid and private.is_professional_key_admin(uid))
      ) order by case r.verification_status when 'pending' then 0 when 'verified_in_house' then 1 else 2 end,r.full_name)
      from public.professional_reviewers r
    ),'[]'::jsonb),
    'courses',coalesce((
      select jsonb_agg(jsonb_build_object(
        'course_key',c.course_key,'title',c.title,'category',c.category,'price_cents',c.price_cents,
        'estimated_hours',c.estimated_hours,'status',c.status,'checkout_enabled',c.checkout_enabled,
        'issues',private.professional_course_release_issues(c.id),
        'modules',(select count(*) from public.professional_course_modules m where m.course_id=c.id),
        'assessments',(select count(*) from public.professional_assessment_items ai join public.professional_course_modules m on m.id=ai.module_id where m.course_id=c.id),
        'scenarios',(select count(*) from public.professional_assessment_items ai join public.professional_course_modules m on m.id=ai.module_id where m.course_id=c.id and ai.item_type='scenario'),
        'assignments',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',a.id,'review_type',a.review_type,'reviewer_domain',a.reviewer_domain,
            'reviewer_id',a.reviewer_id,'reviewer_name',rv.full_name,'status',a.status,
            'due_date',a.due_date,'assignment_notes',a.assignment_notes,
            'assigned_at',a.assigned_at,'started_at',a.started_at,'completed_at',a.completed_at
          ) order by case a.review_type when 'source' then 1 when 'curriculum' then 2 when 'assessment' then 3 when 'scope' then 4 else 5 end,a.reviewer_domain)
          from public.professional_course_review_assignments a
          left join public.professional_reviewers rv on rv.id=a.reviewer_id
          where a.course_id=c.id
        ),'[]'::jsonb),
        'reviews',coalesce((
          select jsonb_agg(jsonb_build_object(
            'review_type',r.review_type,'status',r.status,'findings',r.findings,
            'required_domains',req.required_domains,'minimum_signoffs',req.minimum_signoffs,
            'distinct_reviewers_required',req.distinct_reviewers_required,'instructions',req.instructions,
            'signoffs',coalesce((
              select jsonb_agg(jsonb_build_object(
                'id',s.id,'reviewer_id',s.reviewer_id,'reviewer_name',s.reviewer_name,
                'reviewer_qualification',s.reviewer_qualification,'reviewer_domain',s.reviewer_domain,
                'reviewer_organization',s.reviewer_organization,'reviewer_evidence_ref',s.reviewer_evidence_ref,
                'decision',s.decision,'notes',s.notes,'reviewed_at',s.reviewed_at
              ) order by s.reviewed_at desc)
              from public.professional_course_review_signoffs s
              where s.course_id=c.id and s.review_type=r.review_type
            ),'[]'::jsonb)
          ) order by case r.review_type when 'source' then 1 when 'curriculum' then 2 when 'assessment' then 3 when 'scope' then 4 else 5 end)
          from public.professional_course_reviews r
          join public.professional_course_review_requirements req
            on req.course_id=r.course_id and req.review_type=r.review_type
          where r.course_id=c.id
        ),'[]'::jsonb)
      ) order by case when c.category='foundation' then 0 else 1 end,c.title)
      from public.professional_courses c
    ),'[]'::jsonb),
    'recent_enrollments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',e.id,'course_key',c.course_key,'title',c.title,'user_id',e.user_id,
        'status',e.status,'started_at',e.started_at,'completed_at',e.completed_at,'final_score',e.final_score
      ) order by e.created_at desc)
      from (select * from public.professional_enrollments order by created_at desc limit 100) e
      join public.professional_courses c on c.id=e.course_id
    ),'[]'::jsonb)
  );
end;
$$;

commit;