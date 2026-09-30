begin;

create or replace function private.get_professional_course_review_packet(p_course_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  c public.professional_courses%rowtype;
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  select * into c from public.professional_courses where course_key=p_course_key;
  if c.id is null then raise exception 'Course not found'; end if;

  return jsonb_build_object(
    'generated_at',now(),
    'course',jsonb_build_object(
      'course_key',c.course_key,'title',c.title,'category',c.category,'description',c.description,
      'audience',c.audience,'price_cents',c.price_cents,'billing_mode',c.billing_mode,
      'entitlement_key',c.entitlement_key,'estimated_hours',c.estimated_hours,
      'module_pass_score',c.module_pass_score,'final_exam_pass_score',c.final_exam_pass_score,
      'capstone_required',c.capstone_required,'capstone_review_required',c.capstone_review_required,
      'status',c.status,'curriculum_review_status',c.curriculum_review_status,
      'assessment_review_status',c.assessment_review_status,'checkout_enabled',c.checkout_enabled,
      'certificate_title',c.certificate_title,'certificate_scope_note',c.certificate_scope_note
    ),
    'release_issues',private.professional_course_release_issues(c.id),
    'review_requirements',coalesce((
      select jsonb_agg(jsonb_build_object(
        'review_type',req.review_type,
        'required_domains',req.required_domains,
        'minimum_signoffs',req.minimum_signoffs,
        'distinct_reviewers_required',req.distinct_reviewers_required,
        'instructions',req.instructions,
        'current_status',r.status,
        'current_findings',r.findings,
        'signoffs',coalesce((
          select jsonb_agg(jsonb_build_object(
            'reviewer_name',s.reviewer_name,
            'reviewer_qualification',s.reviewer_qualification,
            'reviewer_domain',s.reviewer_domain,
            'reviewer_organization',s.reviewer_organization,
            'reviewer_evidence_ref',s.reviewer_evidence_ref,
            'decision',s.decision,
            'notes',s.notes,
            'reviewed_at',s.reviewed_at
          ) order by s.reviewed_at desc)
          from public.professional_course_review_signoffs s
          where s.course_id=c.id and s.review_type=req.review_type
        ),'[]'::jsonb)
      ) order by case req.review_type
        when 'source' then 1 when 'curriculum' then 2 when 'assessment' then 3
        when 'scope' then 4 else 5 end)
      from public.professional_course_review_requirements req
      join public.professional_course_reviews r
        on r.course_id=req.course_id and r.review_type=req.review_type
      where req.course_id=c.id
    ),'[]'::jsonb),
    'modules',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',m.id,
        'module_key',m.module_key,
        'sequence',m.sequence,
        'title',m.title,
        'summary',m.summary,
        'module_type',m.module_type,
        'estimated_minutes',m.estimated_minutes,
        'learning_objectives',m.learning_objectives,
        'practice_requirements',m.practice_requirements,
        'source_refs',m.source_refs,
        'content_md',m.content_md,
        'required',m.required,
        'minimum_score',m.minimum_score,
        'requires_reflection',m.requires_reflection,
        'requires_assignment',m.requires_assignment,
        'requires_human_review',m.requires_human_review,
        'review_status',m.review_status,
        'review_rubric',m.review_rubric,
        'assessment_items',case when m.module_type='capstone' then '[]'::jsonb else coalesce((
          select jsonb_agg(jsonb_build_object(
            'item_order',a.item_order,
            'item_type',a.item_type,
            'prompt',a.prompt,
            'choices',a.choices,
            'correct_answer_index',(a.correct_answer->>'index')::integer,
            'correct_answer_text',a.choices->>((a.correct_answer->>'index')::integer),
            'rationale',a.rationale,
            'source_note',a.source_note,
            'review_status',a.review_status
          ) order by a.item_order)
          from public.professional_assessment_items a
          where a.module_id=m.id and a.active=true
        ),'[]'::jsonb) end
      ) order by m.sequence)
      from public.professional_course_modules m
      where m.course_id=c.id and m.required=true
    ),'[]'::jsonb),
    'source_summary',jsonb_build_object(
      'reference_count',(
        select count(*)
        from public.professional_course_modules m
        cross join lateral jsonb_array_elements(m.source_refs) s
        where m.course_id=c.id
      ),
      'unique_urls',(
        select count(distinct s->>'url')
        from public.professional_course_modules m
        cross join lateral jsonb_array_elements(m.source_refs) s
        where m.course_id=c.id
      )
    )
  );
end;
$$;
revoke all on function private.get_professional_course_review_packet(text) from public,anon;
grant execute on function private.get_professional_course_review_packet(text) to authenticated;

create or replace function public.get_professional_course_review_packet(p_course_key text)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.get_professional_course_review_packet(p_course_key) $$;
revoke all on function public.get_professional_course_review_packet(text) from public,anon;
grant execute on function public.get_professional_course_review_packet(text) to authenticated;

commit;