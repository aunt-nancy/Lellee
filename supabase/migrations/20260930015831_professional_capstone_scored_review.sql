begin;

alter table public.professional_capstone_submissions
  add column if not exists review_score numeric(6,2)
    check (review_score is null or (review_score between 0 and 100)),
  add column if not exists rubric_scores jsonb not null default '{}'::jsonb,
  add column if not exists critical_failure boolean not null default false,
  add column if not exists critical_failure_note text;

create or replace function private.admin_review_professional_capstone(
  p_submission_id uuid,
  p_status text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  s public.professional_capstone_submissions%rowtype;
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  if p_status='approved' then
    raise exception 'Use scored capstone review for approval';
  end if;
  if p_status<>'revisions_required' then raise exception 'Invalid review status'; end if;

  select * into s from public.professional_capstone_submissions where id=p_submission_id for update;
  if s.id is null then raise exception 'Submission not found'; end if;

  update public.professional_capstone_submissions
  set status='revisions_required',
      reviewer_id=auth.uid(),
      reviewer_notes=nullif(trim(coalesce(p_notes,'')),''),
      reviewed_at=now(),
      updated_at=now()
  where id=s.id;

  update public.professional_module_progress p
  set status='needs_review',
      reviewer_status='revisions_required',
      reviewed_by=auth.uid(),
      reviewed_at=now(),
      updated_at=now()
  from public.professional_course_modules m
  where p.enrollment_id=s.enrollment_id
    and p.module_id=m.id
    and m.course_id=(select course_id from public.professional_enrollments where id=s.enrollment_id)
    and m.module_type='capstone';

  return jsonb_build_object('submission_id',s.id,'status','revisions_required');
end;
$$;

create or replace function private.admin_score_professional_capstone(
  p_submission_id uuid,
  p_rubric_scores jsonb,
  p_critical_failure boolean default false,
  p_critical_failure_note text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  s public.professional_capstone_submissions%rowtype;
  eid uuid;
  mid uuid;
  rubric jsonb;
  criterion jsonb;
  key text;
  max_points numeric;
  awarded numeric;
  total numeric := 0;
  pass_score numeric;
  status_out text;
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  if p_rubric_scores is null or jsonb_typeof(p_rubric_scores)<>'object' then
    raise exception 'Rubric scores are required';
  end if;

  select * into s from public.professional_capstone_submissions where id=p_submission_id for update;
  if s.id is null then raise exception 'Submission not found'; end if;

  select e.id,m.id,m.review_rubric
  into eid,mid,rubric
  from public.professional_enrollments e
  join public.professional_course_modules m on m.course_id=e.course_id and m.module_type='capstone' and m.required=true
  where e.id=s.enrollment_id
  order by m.sequence desc limit 1;

  if mid is null then raise exception 'Capstone module not found'; end if;
  if jsonb_typeof(rubric)<>'object' or jsonb_array_length(coalesce(rubric->'criteria','[]'::jsonb))<5 then
    raise exception 'Capstone rubric is not configured';
  end if;

  for criterion in select value from jsonb_array_elements(rubric->'criteria')
  loop
    key := criterion->>'key';
    max_points := (criterion->>'points')::numeric;
    if not (p_rubric_scores ? key) then raise exception 'Missing rubric score for %',key; end if;
    awarded := (p_rubric_scores->>key)::numeric;
    if awarded<0 or awarded>max_points then
      raise exception 'Rubric score for % must be between 0 and %',key,max_points;
    end if;
    total := total + awarded;
  end loop;

  pass_score := coalesce((rubric->>'pass_score')::numeric,80);
  status_out := case when p_critical_failure or total<pass_score then 'revisions_required' else 'approved' end;

  update public.professional_capstone_submissions
  set status=status_out,
      reviewer_id=auth.uid(),
      reviewer_notes=nullif(trim(coalesce(p_notes,'')),''),
      review_score=total,
      rubric_scores=p_rubric_scores,
      critical_failure=coalesce(p_critical_failure,false),
      critical_failure_note=case when p_critical_failure then nullif(trim(coalesce(p_critical_failure_note,'')),'') else null end,
      reviewed_at=now(),
      updated_at=now()
  where id=s.id;

  update public.professional_module_progress
  set status=case when status_out='approved' then 'passed' else 'needs_review' end,
      reviewer_status=case when status_out='approved' then 'approved' else 'revisions_required' end,
      reviewed_by=auth.uid(),
      reviewed_at=now(),
      completed_at=case when status_out='approved' then now() else completed_at end,
      updated_at=now()
  where enrollment_id=eid and module_id=mid;

  return jsonb_build_object(
    'submission_id',s.id,
    'status',status_out,
    'score',total,
    'pass_score',pass_score,
    'critical_failure',coalesce(p_critical_failure,false)
  );
end;
$$;
revoke all on function private.admin_score_professional_capstone(uuid,jsonb,boolean,text,text) from public,anon;
grant execute on function private.admin_score_professional_capstone(uuid,jsonb,boolean,text,text) to authenticated;

create or replace function public.admin_score_professional_capstone(
  p_submission_id uuid,
  p_rubric_scores jsonb,
  p_critical_failure boolean default false,
  p_critical_failure_note text default null,
  p_notes text default null
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$
  select private.admin_score_professional_capstone(
    p_submission_id,p_rubric_scores,p_critical_failure,p_critical_failure_note,p_notes
  )
$$;
revoke all on function public.admin_score_professional_capstone(uuid,jsonb,boolean,text,text) from public,anon;
grant execute on function public.admin_score_professional_capstone(uuid,jsonb,boolean,text,text) to authenticated;

update public.professional_course_reviews
set findings=findings||jsonb_build_object(
  'scored_capstone_review_required',true,
  'capstone_pass_score',80,
  'critical_failure_override',true
),
updated_at=now()
where review_type='capstone';

commit;