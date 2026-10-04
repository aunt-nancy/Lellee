-- Production-safe learner runtime.
-- Resolves entitlement keys through commerce_entitlements because production
-- user_entitlements stores entitlement_id rather than a duplicated text key.

begin;

create or replace function public.get_my_professional_training_context()
returns jsonb
language sql
stable
security definer
set search_path=public,pg_catalog
as $$
with me as (
  select auth.uid() as uid
), courses as (
  select c.*,
    exists(
      select 1 from public.user_entitlements ue
      join public.commerce_entitlements ce on ce.id=ue.entitlement_id, me
      where ue.user_id=me.uid and ce.entitlement_key=c.entitlement_key
        and ue.status in ('active','trialing')
    ) as entitled
  from public.professional_courses c
  where c.status='published'
), enroll as (
  select e.* from public.professional_enrollments e, me where e.user_id=me.uid
)
select jsonb_build_object(
  'authenticated',(select uid is not null from me),
  'courses',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',c.id,'course_key',c.course_key,'title',c.title,'category',c.category,
      'description',c.description,'price_cents',c.price_cents,'estimated_hours',c.estimated_hours,
      'module_pass_score',c.module_pass_score,'capstone_required',c.capstone_required,
      'checkout_enabled',c.checkout_enabled,'entitled',c.entitled,
      'enrollment',case when e.id is null then null else jsonb_build_object(
        'id',e.id,'status',e.status,'started_at',e.started_at,'completed_at',e.completed_at,
        'verified_at',e.verified_at,'final_score',e.final_score,'training_record_id',e.training_record_id
      ) end,
      'progress',case when e.id is null then '[]'::jsonb else coalesce((
        select jsonb_agg(jsonb_build_object(
          'module_id',m.id,'module_key',m.module_key,'sequence',m.sequence,'title',m.title,
          'module_type',m.module_type,'estimated_minutes',m.estimated_minutes,
          'status',p.status,'best_score',p.best_score,'attempts',p.attempts,
          'reviewer_status',p.reviewer_status,'completed_at',p.completed_at
        ) order by m.sequence)
        from public.professional_course_modules m
        left join public.professional_module_progress p
          on p.module_id=m.id and p.enrollment_id=e.id
        where m.course_id=c.id and m.required=true
      ),'[]'::jsonb) end
    ) order by case when c.category='foundation' then 0 else 1 end,c.title)
    from courses c
    left join enroll e on e.course_id=c.id
  ),'[]'::jsonb)
);
$$;
revoke all on function public.get_my_professional_training_context() from public,anon;
grant execute on function public.get_my_professional_training_context() to authenticated;

create or replace function public.get_my_professional_module(p_module_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid := auth.uid();
  m public.professional_course_modules%rowtype;
  e public.professional_enrollments%rowtype;
  p public.professional_module_progress%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select * into m from public.professional_course_modules where id=p_module_id and required=true;
  if m.id is null then raise exception 'Module not found'; end if;

  select e0.* into e
  from public.professional_enrollments e0
  join public.professional_courses c on c.id=e0.course_id
  where e0.user_id=uid and e0.course_id=m.course_id
    and e0.status in ('active','completed') and c.status='published'
  limit 1;
  if e.id is null then raise exception 'Active enrollment required'; end if;

  select * into p from public.professional_module_progress
  where enrollment_id=e.id and module_id=m.id;
  if p.id is null or p.status='locked' then raise exception 'Module is locked'; end if;

  return jsonb_build_object(
    'module',jsonb_build_object(
      'id',m.id,'module_key',m.module_key,'sequence',m.sequence,'title',m.title,'summary',m.summary,
      'module_type',m.module_type,'estimated_minutes',m.estimated_minutes,
      'learning_objectives',m.learning_objectives,'practice_requirements',m.practice_requirements,
      'content_md',m.content_md,'minimum_score',m.minimum_score,
      'requires_reflection',m.requires_reflection,'requires_assignment',m.requires_assignment,
      'requires_human_review',m.requires_human_review
    ),
    'progress',jsonb_build_object(
      'status',p.status,'best_score',p.best_score,'attempts',p.attempts,
      'reviewer_status',p.reviewer_status,'completed_at',p.completed_at
    ),
    'assessment',case when m.module_type='capstone' then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'item_order',a.item_order,'item_type',a.item_type,
        'prompt',a.prompt,'choices',a.choices
      ) order by a.item_order)
      from public.professional_assessment_items a
      where a.module_id=m.id and a.active=true and a.review_status='approved'
    ),'[]'::jsonb) end
  );
end;
$$;
revoke all on function public.get_my_professional_module(uuid) from public,anon;
grant execute on function public.get_my_professional_module(uuid) to authenticated;

create or replace function public.start_my_professional_module(p_module_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid := auth.uid();
  m public.professional_course_modules%rowtype;
  e public.professional_enrollments%rowtype;
  p public.professional_module_progress%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into m from public.professional_course_modules where id=p_module_id and required=true;
  if m.id is null then raise exception 'Module not found'; end if;

  select e0.* into e
  from public.professional_enrollments e0
  join public.professional_courses c on c.id=e0.course_id
  where e0.user_id=uid and e0.course_id=m.course_id and e0.status='active' and c.status='published'
  limit 1;
  if e.id is null then raise exception 'Active enrollment required'; end if;

  select * into p from public.professional_module_progress
  where enrollment_id=e.id and module_id=m.id for update;
  if p.id is null or p.status='locked' then raise exception 'Module is locked'; end if;

  if p.status='available' then
    update public.professional_module_progress
    set status='in_progress',updated_at=now()
    where id=p.id;
  end if;

  return jsonb_build_object('module_id',m.id,'status',
    (select status from public.professional_module_progress where id=p.id));
end;
$$;
revoke all on function public.start_my_professional_module(uuid) from public,anon;
grant execute on function public.start_my_professional_module(uuid) to authenticated;

create or replace function public.submit_my_professional_assessment(
  p_module_id uuid,
  p_answers jsonb,
  p_reflection text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid := auth.uid();
  m public.professional_course_modules%rowtype;
  e public.professional_enrollments%rowtype;
  p public.professional_module_progress%rowtype;
  a record;
  total_count integer := 0;
  correct_count integer := 0;
  score numeric(6,2);
  passed boolean;
  next_module uuid;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if p_answers is null or jsonb_typeof(p_answers)<>'object' then raise exception 'Answers are required'; end if;

  select * into m from public.professional_course_modules where id=p_module_id and required=true;
  if m.id is null or m.module_type='capstone' then raise exception 'Assessable module not found'; end if;
  if m.review_status<>'approved' then raise exception 'Module is not approved for learner use'; end if;
  if m.requires_reflection and char_length(trim(coalesce(p_reflection,'')))<20 then
    raise exception 'Reflection is required';
  end if;

  select e0.* into e
  from public.professional_enrollments e0
  join public.professional_courses c on c.id=e0.course_id
  where e0.user_id=uid and e0.course_id=m.course_id and e0.status='active' and c.status='published'
  limit 1;
  if e.id is null then raise exception 'Active enrollment required'; end if;

  select * into p from public.professional_module_progress
  where enrollment_id=e.id and module_id=m.id for update;
  if p.id is null or p.status not in ('available','in_progress') then raise exception 'Module is not available for assessment'; end if;

  for a in
    select id,correct_answer
    from public.professional_assessment_items
    where module_id=m.id and active=true and review_status='approved'
    order by item_order
  loop
    total_count := total_count + 1;
    if not (p_answers ? a.id::text) then raise exception 'Every assessment item must be answered'; end if;
    if p_answers -> a.id::text = a.correct_answer then correct_count := correct_count + 1; end if;
  end loop;

  if total_count < 5 then raise exception 'Approved assessment bank is incomplete'; end if;
  score := round((correct_count::numeric * 100.0 / total_count::numeric),2);
  passed := score >= m.minimum_score;

  insert into public.professional_assessment_attempts(enrollment_id,module_id,score,passed,answers)
  values(e.id,m.id,score,passed,p_answers);

  update public.professional_module_progress
  set status=case when passed then 'passed' else 'in_progress' end,
      best_score=greatest(coalesce(best_score,0),score),
      attempts=attempts+1,
      reflection_text=coalesce(nullif(trim(coalesce(p_reflection,'')),''),reflection_text),
      completed_at=case when passed then now() else completed_at end,
      updated_at=now()
  where id=p.id;

  if passed then
    select m2.id into next_module
    from public.professional_course_modules m2
    where m2.course_id=m.course_id and m2.required=true and m2.sequence>m.sequence
    order by m2.sequence limit 1;

    if next_module is not null then
      update public.professional_module_progress
      set status=case when status='locked' then 'available' else status end,updated_at=now()
      where enrollment_id=e.id and module_id=next_module;
    end if;
  end if;

  return jsonb_build_object(
    'module_id',m.id,'score',score,'passed',passed,'required_score',m.minimum_score,
    'correct',correct_count,'total',total_count,'next_module_id',case when passed then next_module else null end
  );
end;
$$;
revoke all on function public.submit_my_professional_assessment(uuid,jsonb,text) from public,anon;
grant execute on function public.submit_my_professional_assessment(uuid,jsonb,text) to authenticated;

create or replace function public.submit_my_professional_capstone(
  p_module_id uuid,
  p_response jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid := auth.uid();
  m public.professional_course_modules%rowtype;
  e public.professional_enrollments%rowtype;
  p public.professional_module_progress%rowtype;
  attempt_no integer;
  submission_id uuid;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if p_response is null or char_length(p_response::text)<300 then
    raise exception 'Capstone response is incomplete';
  end if;

  select * into m from public.professional_course_modules
  where id=p_module_id and required=true and module_type='capstone';
  if m.id is null then raise exception 'Capstone not found'; end if;
  if m.review_status<>'approved' then raise exception 'Capstone is not approved for learner use'; end if;

  select e0.* into e
  from public.professional_enrollments e0
  join public.professional_courses c on c.id=e0.course_id
  where e0.user_id=uid and e0.course_id=m.course_id and e0.status='active' and c.status='published'
  limit 1;
  if e.id is null then raise exception 'Active enrollment required'; end if;

  if exists(
    select 1
    from public.professional_course_modules prior
    left join public.professional_module_progress pp
      on pp.module_id=prior.id and pp.enrollment_id=e.id
    where prior.course_id=m.course_id and prior.required=true and prior.sequence<m.sequence
      and coalesce(pp.status,'locked')<>'passed'
  ) then raise exception 'Complete all prior required modules first'; end if;

  select * into p from public.professional_module_progress
  where enrollment_id=e.id and module_id=m.id for update;
  if p.id is null or p.status not in ('available','in_progress','needs_review') then raise exception 'Capstone is not available'; end if;

  select coalesce(max(attempt_number),0)+1 into attempt_no
  from public.professional_capstone_submissions where enrollment_id=e.id;

  insert into public.professional_capstone_submissions(
    enrollment_id,attempt_number,response,status,submitted_at
  ) values(e.id,attempt_no,p_response,'submitted',now())
  returning id into submission_id;

  update public.professional_module_progress
  set status='needs_review',reviewer_status='pending',updated_at=now()
  where id=p.id;

  return jsonb_build_object('submission_id',submission_id,'status','submitted','human_review_required',true);
end;
$$;
revoke all on function public.submit_my_professional_capstone(uuid,jsonb) from public,anon;
grant execute on function public.submit_my_professional_capstone(uuid,jsonb) to authenticated;

commit;