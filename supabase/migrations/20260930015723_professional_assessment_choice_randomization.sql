begin;

create or replace function private.get_my_professional_module(p_module_id uuid)
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
        'id',a.id,
        'item_order',a.item_order,
        'item_type',a.item_type,
        'prompt',a.prompt,
        'choices',(
          select jsonb_agg(x.choice order by md5(uid::text||a.id::text||x.choice))
          from jsonb_array_elements_text(a.choices) x(choice)
        )
      ) order by a.item_order)
      from public.professional_assessment_items a
      where a.module_id=m.id and a.active=true and a.review_status='approved'
    ),'[]'::jsonb) end
  );
end;
$$;

create or replace function private.submit_my_professional_assessment(
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
  correct_text text;
  submitted_text text;
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
    select id,choices,correct_answer
    from public.professional_assessment_items
    where module_id=m.id and active=true and review_status='approved'
    order by item_order
  loop
    total_count := total_count + 1;
    if not (p_answers ? a.id::text) then raise exception 'Every assessment item must be answered'; end if;

    correct_text := a.choices ->> ((a.correct_answer->>'index')::integer);
    submitted_text := p_answers ->> a.id::text;

    if submitted_text is null then raise exception 'Every assessment item must be answered'; end if;
    if submitted_text = correct_text then correct_count := correct_count + 1; end if;
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

update public.professional_course_reviews
set findings = findings || jsonb_build_object(
  'answer_position_bias_found',true,
  'stored_answer_index_1_count_before_runtime_shuffle',233,
  'runtime_choice_randomization_added',true,
  'scoring_compares_selected_choice_text_server_side',true
),
updated_at=now()
where review_type='assessment';

commit;