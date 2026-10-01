begin;

create or replace function private.get_admin_professional_training_evidence_center()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare uid uuid:=auth.uid();
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  return jsonb_build_object(
    'courses',coalesce((
      select jsonb_agg(jsonb_build_object(
        'course_key',c.course_key,
        'title',c.title,
        'evidence_total',(
          select count(*) from public.professional_training_evidence_requirements er
          where er.course_id=c.id
        ),
        'evidence_approved',(
          select count(*) from public.professional_training_evidence_requirements er
          where er.course_id=c.id and er.status='approved'
        ),
        'evidence_internal_review',(
          select count(*) from public.professional_training_evidence_requirements er
          where er.course_id=c.id and er.status='internal_review'
        ),
        'modules',coalesce((
          select jsonb_agg(jsonb_build_object(
            'module_id',m.id,
            'sequence',m.sequence,
            'title',m.title,
            'review_status',m.review_status,
            'evidence_status',er.status,
            'source_count',jsonb_array_length(m.source_refs),
            'content_characters',char_length(coalesce(m.content_md,'')),
            'assessment_items',(
              select count(*) from public.professional_assessment_items ai
              where ai.module_id=m.id and ai.active=true
            ),
            'scenario_items',(
              select count(*) from public.professional_assessment_items ai
              where ai.module_id=m.id and ai.active=true and ai.item_type='scenario'
            ),
            'mixed_evidence_note',er.mixed_evidence_note,
            'claim_strength_note',er.claim_strength_note,
            'source_audit',er.source_audit,
            'agent_task_status',t.status,
            'agent_last_error',(
              select r.error_code
              from public.agent_runs r
              where r.task_id=t.id
              order by r.started_at desc
              limit 1
            )
          ) order by m.sequence)
          from public.professional_training_evidence_requirements er
          join public.professional_course_modules m on m.id=er.module_id
          left join public.agent_tasks t on t.id=er.agent_task_id
          where er.course_id=c.id
        ),'[]'::jsonb)
      ) order by c.title)
      from public.professional_courses c
      where exists(
        select 1 from public.professional_training_evidence_requirements er
        where er.course_id=c.id
      )
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function private.get_admin_professional_training_evidence_center()
from public,anon;
grant execute on function private.get_admin_professional_training_evidence_center()
to authenticated;

create or replace function public.get_admin_professional_training_evidence_center()
returns jsonb
language sql
stable
security invoker
set search_path=public,private,pg_catalog
as $$
  select private.get_admin_professional_training_evidence_center()
$$;

revoke all on function public.get_admin_professional_training_evidence_center()
from public,anon;
grant execute on function public.get_admin_professional_training_evidence_center()
to authenticated;

create or replace function private.get_admin_professional_training_evidence_module(
  p_module_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  m public.professional_course_modules%rowtype;
  er public.professional_training_evidence_requirements%rowtype;
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  select * into m
  from public.professional_course_modules
  where id=p_module_id;

  if m.id is null then raise exception 'Module not found'; end if;

  select * into er
  from public.professional_training_evidence_requirements
  where module_id=m.id;

  if er.id is null then raise exception 'Evidence record not found'; end if;

  return jsonb_build_object(
    'module',jsonb_build_object(
      'id',m.id,
      'sequence',m.sequence,
      'title',m.title,
      'summary',m.summary,
      'review_status',m.review_status,
      'content_md',m.content_md,
      'learning_objectives',m.learning_objectives,
      'practice_requirements',m.practice_requirements,
      'source_refs',m.source_refs
    ),
    'evidence',jsonb_build_object(
      'status',er.status,
      'minimum_sources',er.minimum_sources,
      'minimum_authoritative_or_systematic',er.minimum_authoritative_or_systematic,
      'recent_source_years',er.recent_source_years,
      'require_mixed_or_negative_findings',er.require_mixed_or_negative_findings,
      'require_scope_boundary_source',er.require_scope_boundary_source,
      'require_claim_strength_match',er.require_claim_strength_match,
      'mixed_evidence_note',er.mixed_evidence_note,
      'claim_strength_note',er.claim_strength_note,
      'source_audit',er.source_audit,
      'reviewer_note',er.reviewer_note
    ),
    'assessment_items',coalesce((
      select jsonb_agg(jsonb_build_object(
        'item_order',ai.item_order,
        'item_type',ai.item_type,
        'prompt',ai.prompt,
        'choices',ai.choices,
        'correct_answer_index',(ai.correct_answer->>'index')::integer,
        'correct_answer_text',ai.choices->>((ai.correct_answer->>'index')::integer),
        'rationale',ai.rationale,
        'source_note',ai.source_note,
        'review_status',ai.review_status
      ) order by ai.item_order)
      from public.professional_assessment_items ai
      where ai.module_id=m.id and ai.active=true
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function private.get_admin_professional_training_evidence_module(uuid)
from public,anon;
grant execute on function private.get_admin_professional_training_evidence_module(uuid)
to authenticated;

create or replace function public.get_admin_professional_training_evidence_module(
  p_module_id uuid
)
returns jsonb
language sql
stable
security invoker
set search_path=public,private,pg_catalog
as $$
  select private.get_admin_professional_training_evidence_module(p_module_id)
$$;

revoke all on function public.get_admin_professional_training_evidence_module(uuid)
from public,anon;
grant execute on function public.get_admin_professional_training_evidence_module(uuid)
to authenticated;

commit;