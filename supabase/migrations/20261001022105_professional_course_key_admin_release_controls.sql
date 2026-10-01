begin;

create or replace function private.professional_evidence_review_guard()
returns trigger
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
begin
  if new.review_type='source'
     and new.status='approved'
     and exists(
       select 1
       from public.professional_training_evidence_requirements er
       where er.course_id=new.course_id
     )
     and exists(
       select 1
       from public.professional_training_evidence_requirements er
       where er.course_id=new.course_id
         and er.status not in ('internal_review','approved')
     ) then
    raise exception 'All automated evidence builds must reach human-review readiness before source approval';
  end if;
  return new;
end;
$$;
revoke all on function private.professional_evidence_review_guard()
from public,anon,authenticated;

drop trigger if exists trg_professional_evidence_review_guard
on public.professional_course_reviews;
create trigger trg_professional_evidence_review_guard
before update of status
on public.professional_course_reviews
for each row
execute function private.professional_evidence_review_guard();

create or replace function private.professional_source_review_evidence_sync()
returns trigger
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
begin
  if new.review_type<>'source'
     or new.status is not distinct from old.status then
    return new;
  end if;

  if new.status='approved' then
    update public.professional_training_evidence_requirements
    set status='approved',updated_at=now()
    where course_id=new.course_id
      and status='internal_review';

    update public.professional_journey_training_links
    set build_status=case
      when exists(
        select 1 from public.professional_training_evidence_requirements er
        where er.course_id=new.course_id and er.status<>'approved'
      ) then build_status
      else 'ready_for_human_review'
    end,
    updated_at=now()
    where course_id=new.course_id;

  elsif new.status='revisions_required' then
    update public.professional_training_evidence_requirements
    set status='revisions_required',updated_at=now()
    where course_id=new.course_id
      and status in ('internal_review','approved');

  elsif new.status='internal_review' then
    update public.professional_training_evidence_requirements
    set status='internal_review',updated_at=now()
    where course_id=new.course_id
      and status='approved';
  end if;

  return new;
end;
$$;
revoke all on function private.professional_source_review_evidence_sync()
from public,anon,authenticated;

drop trigger if exists trg_professional_source_review_evidence_sync
on public.professional_course_reviews;
create trigger trg_professional_source_review_evidence_sync
after update of status
on public.professional_course_reviews
for each row
execute function private.professional_source_review_evidence_sync();

create or replace function private.professional_evidence_invalidates_reviews()
returns trigger
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
begin
  if new.status='internal_review'
     and (
       old.status is distinct from new.status
       or old.applied_output_id is distinct from new.applied_output_id
     ) then

    update public.professional_course_reviews
    set status='internal_review',
        reviewed_at=null,
        updated_at=now()
    where course_id=new.course_id
      and review_type in ('source','curriculum','assessment')
      and status<>'internal_review';

    update public.professional_courses
    set status='draft',
        curriculum_review_status='internal_review',
        assessment_review_status='internal_review',
        checkout_enabled=false,
        updated_at=now()
    where id=new.course_id;
  end if;

  return new;
end;
$$;
revoke all on function private.professional_evidence_invalidates_reviews()
from public,anon,authenticated;

drop trigger if exists trg_professional_evidence_invalidates_reviews
on public.professional_training_evidence_requirements;
create trigger trg_professional_evidence_invalidates_reviews
after update of status,applied_output_id
on public.professional_training_evidence_requirements
for each row
execute function private.professional_evidence_invalidates_reviews();

create or replace function private.professional_course_release_issues(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  c public.professional_courses%rowtype;
  issues jsonb := '[]'::jsonb;
  n integer;
begin
  select * into c from public.professional_courses where id=p_course_id;
  if c.id is null then return jsonb_build_array('course_not_found'); end if;

  select count(*) into n
  from (values ('source'),('curriculum'),('assessment'),('scope'),('capstone')) req(review_type)
  where not exists (
    select 1 from public.professional_course_reviews r
    where r.course_id=c.id
      and r.review_type=req.review_type
      and r.status='approved'
  );
  if n>0 then
    issues:=issues||jsonb_build_array('review_domains_not_all_approved');
  end if;

  if c.curriculum_review_status<>'approved' then
    issues:=issues||jsonb_build_array('curriculum_review_not_approved');
  end if;

  if c.assessment_review_status<>'approved' then
    issues:=issues||jsonb_build_array('assessment_review_not_approved');
  end if;

  if exists(
    select 1
    from public.professional_training_evidence_requirements er
    where er.course_id=c.id
      and er.status<>'approved'
  ) then
    issues:=issues||jsonb_build_array('evidence_requirements_not_approved');
  end if;

  select count(*) into n
  from public.professional_course_modules
  where course_id=c.id and required=true;
  if n<c.minimum_module_count then
    issues:=issues||jsonb_build_array('insufficient_required_modules');
  end if;

  if exists(
    select 1
    from public.professional_course_modules
    where course_id=c.id
      and required=true
      and review_status<>'approved'
  ) then
    issues:=issues||jsonb_build_array('modules_not_all_approved');
  end if;

  if exists(
    select 1
    from public.professional_course_modules
    where course_id=c.id
      and required=true
      and module_type<>'capstone'
      and (
        jsonb_array_length(source_refs)=0
        or char_length(coalesce(trim(content_md),''))<800
      )
  ) then
    issues:=issues||jsonb_build_array('instructional_content_or_sources_incomplete');
  end if;

  if exists(
    select 1
    from public.professional_course_modules m
    where m.course_id=c.id
      and m.required=true
      and m.module_type<>'capstone'
      and (
        select count(*)
        from public.professional_assessment_items a
        where a.module_id=m.id
          and a.active=true
          and a.review_status='approved'
      ) < c.minimum_questions_per_module
  ) then
    issues:=issues||jsonb_build_array('approved_question_bank_below_minimum');
  end if;

  select count(*) into n
  from public.professional_assessment_items a
  join public.professional_course_modules m on m.id=a.module_id
  where m.course_id=c.id
    and a.active=true
    and a.review_status='approved'
    and a.item_type='scenario';
  if n<c.minimum_scenario_items then
    issues:=issues||jsonb_build_array('approved_scenario_count_below_minimum');
  end if;

  if c.capstone_required and not exists(
    select 1
    from public.professional_course_modules m
    where m.course_id=c.id
      and m.required=true
      and m.module_type='capstone'
      and m.requires_human_review=true
      and m.review_status='approved'
      and jsonb_typeof(m.review_rubric)='object'
      and coalesce((m.review_rubric->>'pass_score')::integer,0)>=80
      and jsonb_array_length(coalesce(m.review_rubric->'criteria','[]'::jsonb))>=5
  ) then
    issues:=issues||jsonb_build_array('approved_human_capstone_rubric_missing');
  end if;

  return issues;
end;
$$;
revoke all on function private.professional_course_release_issues(uuid)
from public,anon;
grant execute on function private.professional_course_release_issues(uuid)
to authenticated,service_role;

revoke all on function public.admin_publish_professional_course(text)
from public,anon,authenticated;
revoke all on function private.admin_publish_professional_course(text)
from public,anon,authenticated;

revoke all on function public.admin_enable_professional_course_checkout(text)
from public,anon,authenticated;
revoke all on function private.admin_enable_professional_course_checkout(text)
from public,anon,authenticated;

create or replace function private.admin_publish_professional_course_v2(
  p_course_key text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  c public.professional_courses%rowtype;
  issues jsonb;
begin
  if not private.is_professional_key_admin(uid) then
    raise exception 'Key administrator access required';
  end if;

  select * into c
  from public.professional_courses
  where course_key=p_course_key
  for update;

  if c.id is null then raise exception 'Course not found'; end if;

  if trim(coalesce(p_confirmation,'')) <> 'PUBLISH '||c.course_key then
    raise exception 'Confirmation text must exactly match PUBLISH %',c.course_key;
  end if;

  if c.status='published' then
    return jsonb_build_object(
      'course_key',c.course_key,
      'published',true,
      'checkout_enabled',c.checkout_enabled,
      'already_published',true
    );
  end if;

  issues:=private.professional_course_release_issues(c.id);
  if jsonb_array_length(issues)>0 then
    raise exception 'Course release blocked: %',issues::text;
  end if;

  update public.professional_courses
  set status='published',
      checkout_enabled=false,
      updated_at=now()
  where id=c.id;

  perform public.sync_professional_training_enrollment(e.user_id,e.entitlement_key)
  from public.user_entitlements e
  where e.entitlement_key=c.entitlement_key
    and e.status in ('active','trialing');

  update public.professional_journey_training_links
  set build_status='published',updated_at=now()
  where course_id=c.id;

  insert into public.admin_audit_log(
    actor_user_id,entity_type,entity_id,action,
    changed_fields,action_label,workspace
  )
  values(
    uid,'professional_course',c.id::text,'publish_course',
    array['status','checkout_enabled'],
    'Published professional course with checkout remaining disabled',
    'professional_training'
  );

  return jsonb_build_object(
    'course_key',c.course_key,
    'published',true,
    'checkout_enabled',false
  );
end;
$$;
revoke all on function private.admin_publish_professional_course_v2(text,text)
from public,anon;
grant execute on function private.admin_publish_professional_course_v2(text,text)
to authenticated;

create or replace function public.admin_publish_professional_course_v2(
  p_course_key text,
  p_confirmation text
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$
  select private.admin_publish_professional_course_v2(
    p_course_key,p_confirmation
  )
$$;
revoke all on function public.admin_publish_professional_course_v2(text,text)
from public,anon;
grant execute on function public.admin_publish_professional_course_v2(text,text)
to authenticated;

create or replace function private.admin_set_professional_course_checkout_v2(
  p_course_key text,
  p_enabled boolean,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  c public.professional_courses%rowtype;
  issues jsonb;
  payment_url text;
  expected text;
begin
  if not private.is_professional_key_admin(uid) then
    raise exception 'Key administrator access required';
  end if;

  select * into c
  from public.professional_courses
  where course_key=p_course_key
  for update;

  if c.id is null then raise exception 'Course not found'; end if;

  expected:=case
    when p_enabled then 'ENABLE CHECKOUT '||c.course_key
    else 'DISABLE CHECKOUT '||c.course_key
  end;

  if trim(coalesce(p_confirmation,''))<>expected then
    raise exception 'Confirmation text must exactly match %',expected;
  end if;

  if p_enabled then
    if c.status<>'published' then
      raise exception 'Course must be published before checkout can be enabled';
    end if;

    issues:=private.professional_course_release_issues(c.id);
    if jsonb_array_length(issues)>0 then
      raise exception 'Course checkout blocked: %',issues::text;
    end if;

    select value into payment_url
    from public.app_public_settings
    where key=c.payment_setting_key;

    if payment_url is null
       or payment_url !~ '^https://buy\.stripe\.com/' then
      raise exception 'Approved Stripe Payment Link is not configured';
    end if;
  end if;

  update public.professional_courses
  set checkout_enabled=p_enabled,
      updated_at=now()
  where id=c.id;

  insert into public.admin_audit_log(
    actor_user_id,entity_type,entity_id,action,
    changed_fields,action_label,workspace
  )
  values(
    uid,'professional_course',c.id::text,
    case when p_enabled then 'enable_course_checkout'
         else 'disable_course_checkout' end,
    array['checkout_enabled'],
    case when p_enabled
      then 'Enabled professional course checkout'
      else 'Disabled professional course checkout'
    end,
    'professional_training'
  );

  return jsonb_build_object(
    'course_key',c.course_key,
    'checkout_enabled',p_enabled
  );
end;
$$;
revoke all on function private.admin_set_professional_course_checkout_v2(text,boolean,text)
from public,anon;
grant execute on function private.admin_set_professional_course_checkout_v2(text,boolean,text)
to authenticated;

create or replace function public.admin_set_professional_course_checkout_v2(
  p_course_key text,
  p_enabled boolean,
  p_confirmation text
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$
  select private.admin_set_professional_course_checkout_v2(
    p_course_key,p_enabled,p_confirmation
  )
$$;
revoke all on function public.admin_set_professional_course_checkout_v2(text,boolean,text)
from public,anon;
grant execute on function public.admin_set_professional_course_checkout_v2(text,boolean,text)
to authenticated;

create or replace function private.get_admin_professional_release_controls()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  return jsonb_build_object(
    'is_key_administrator',private.is_professional_key_admin(uid),
    'courses',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'course_key',c.course_key,
          'status',c.status,
          'checkout_enabled',c.checkout_enabled,
          'issues',private.professional_course_release_issues(c.id),
          'publish_ready',
            c.status<>'published'
            and jsonb_array_length(private.professional_course_release_issues(c.id))=0,
          'payment_link_configured',
            exists(
              select 1
              from public.app_public_settings aps
              where aps.key=c.payment_setting_key
                and aps.value ~ '^https://buy\.stripe\.com/'
            ),
          'checkout_ready',
            c.status='published'
            and not c.checkout_enabled
            and jsonb_array_length(private.professional_course_release_issues(c.id))=0
            and exists(
              select 1
              from public.app_public_settings aps
              where aps.key=c.payment_setting_key
                and aps.value ~ '^https://buy\.stripe\.com/'
            ),
          'auto_generated',
            exists(
              select 1
              from public.professional_journey_training_links l
              where l.course_id=c.id and l.auto_generated=true
            ),
          'evidence_total',
            (
              select count(*)
              from public.professional_training_evidence_requirements er
              where er.course_id=c.id
            ),
          'evidence_approved',
            (
              select count(*)
              from public.professional_training_evidence_requirements er
              where er.course_id=c.id and er.status='approved'
            )
        )
        order by case when c.category='foundation' then 0 else 1 end,c.title
      )
      from public.professional_courses c
    ),'[]'::jsonb)
  );
end;
$$;
revoke all on function private.get_admin_professional_release_controls()
from public,anon;
grant execute on function private.get_admin_professional_release_controls()
to authenticated;

create or replace function public.get_admin_professional_release_controls()
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$
  select private.get_admin_professional_release_controls()
$$;
revoke all on function public.get_admin_professional_release_controls()
from public,anon;
grant execute on function public.get_admin_professional_release_controls()
to authenticated;

commit;