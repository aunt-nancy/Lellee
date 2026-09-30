begin;

create table if not exists public.professional_reviewers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  qualification text not null,
  reviewer_domains text[] not null default '{}',
  organization text,
  evidence_ref text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified_in_house','rejected','inactive')),
  verification_method text not null default 'manual_in_house'
    check (verification_method='manual_in_house'),
  verification_notes text,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists professional_reviewers_status_idx
  on public.professional_reviewers(verification_status,active);
create index if not exists professional_reviewers_verified_by_idx
  on public.professional_reviewers(verified_by);
create index if not exists professional_reviewers_created_by_idx
  on public.professional_reviewers(created_by);

alter table public.professional_reviewers enable row level security;
revoke all on public.professional_reviewers from anon;
grant select on public.professional_reviewers to authenticated;

drop policy if exists professional_reviewers_admin_read on public.professional_reviewers;
create policy professional_reviewers_admin_read
on public.professional_reviewers
for select to authenticated
using (public.is_lellee_admin());

alter table public.professional_course_review_signoffs
  add column if not exists reviewer_id uuid references public.professional_reviewers(id);

create index if not exists professional_course_review_signoffs_reviewer_idx
  on public.professional_course_review_signoffs(reviewer_id);

create or replace function private.admin_register_professional_reviewer(
  p_full_name text,
  p_qualification text,
  p_reviewer_domains text[],
  p_organization text default null,
  p_evidence_ref text default null
)
returns uuid
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  rid uuid;
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  if char_length(trim(coalesce(p_full_name,'')))<3 then raise exception 'Reviewer name is required'; end if;
  if char_length(trim(coalesce(p_qualification,'')))<10 then raise exception 'Reviewer qualification is required'; end if;
  if p_reviewer_domains is null or cardinality(p_reviewer_domains)=0 then raise exception 'At least one reviewer domain is required'; end if;

  insert into public.professional_reviewers(
    full_name,qualification,reviewer_domains,organization,evidence_ref,
    verification_status,verification_method,active,created_by
  ) values(
    trim(p_full_name),trim(p_qualification),p_reviewer_domains,
    nullif(trim(coalesce(p_organization,'')),''),
    nullif(trim(coalesce(p_evidence_ref,'')),''),
    'pending','manual_in_house',true,uid
  )
  returning id into rid;

  return rid;
end;
$$;
revoke all on function private.admin_register_professional_reviewer(text,text,text[],text,text) from public,anon;
grant execute on function private.admin_register_professional_reviewer(text,text,text[],text,text) to authenticated;

create or replace function public.admin_register_professional_reviewer(
  p_full_name text,
  p_qualification text,
  p_reviewer_domains text[],
  p_organization text default null,
  p_evidence_ref text default null
)
returns uuid
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_register_professional_reviewer(
  p_full_name,p_qualification,p_reviewer_domains,p_organization,p_evidence_ref
) $$;
revoke all on function public.admin_register_professional_reviewer(text,text,text[],text,text) from public,anon;
grant execute on function public.admin_register_professional_reviewer(text,text,text[],text,text) to authenticated;

create or replace function private.admin_verify_professional_reviewer(
  p_reviewer_id uuid,
  p_verified boolean,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  r public.professional_reviewers%rowtype;
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;

  select * into r from public.professional_reviewers where id=p_reviewer_id for update;
  if r.id is null then raise exception 'Reviewer not found'; end if;

  update public.professional_reviewers
  set verification_status=case when p_verified then 'verified_in_house' else 'rejected' end,
      verification_method='manual_in_house',
      verification_notes=nullif(trim(coalesce(p_notes,'')),''),
      verified_by=uid,
      verified_at=now(),
      active=case when p_verified then true else false end,
      updated_at=now()
  where id=r.id;

  return jsonb_build_object(
    'reviewer_id',r.id,
    'verification_status',case when p_verified then 'verified_in_house' else 'rejected' end,
    'verification_method','manual_in_house'
  );
end;
$$;
revoke all on function private.admin_verify_professional_reviewer(uuid,boolean,text) from public,anon;
grant execute on function private.admin_verify_professional_reviewer(uuid,boolean,text) to authenticated;

create or replace function public.admin_verify_professional_reviewer(
  p_reviewer_id uuid,
  p_verified boolean,
  p_notes text default null
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_verify_professional_reviewer(p_reviewer_id,p_verified,p_notes) $$;
revoke all on function public.admin_verify_professional_reviewer(uuid,boolean,text) from public,anon;
grant execute on function public.admin_verify_professional_reviewer(uuid,boolean,text) to authenticated;

create or replace function private.admin_record_verified_professional_review_signoff(
  p_course_key text,
  p_review_type text,
  p_reviewer_id uuid,
  p_decision text,
  p_notes text default null,
  p_attestation boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  c public.professional_courses%rowtype;
  req public.professional_course_review_requirements%rowtype;
  rv public.professional_reviewers%rowtype;
  selected_domain text;
  sid uuid;
  domain_status text;
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  if p_review_type not in ('source','curriculum','assessment','scope','capstone') then raise exception 'Invalid review type'; end if;
  if p_decision not in ('approved','revisions_required') then raise exception 'Invalid decision'; end if;
  if not p_attestation then raise exception 'Reviewer attestation is required'; end if;

  select * into c from public.professional_courses where course_key=p_course_key;
  if c.id is null then raise exception 'Course not found'; end if;

  select * into req from public.professional_course_review_requirements
  where course_id=c.id and review_type=p_review_type;
  if req.course_id is null then raise exception 'Review requirement not configured'; end if;

  select * into rv from public.professional_reviewers where id=p_reviewer_id;
  if rv.id is null then raise exception 'Reviewer not found'; end if;
  if rv.verification_status<>'verified_in_house' or not rv.active then
    raise exception 'Reviewer must be manually verified in-house before signoff';
  end if;

  select d into selected_domain
  from unnest(req.required_domains) d
  where d=any(rv.reviewer_domains)
  order by d
  limit 1;
  if selected_domain is null then
    raise exception 'Reviewer is not verified for a required domain. Required: %',req.required_domains;
  end if;

  if req.distinct_reviewers_required and p_decision='approved' and exists(
    select 1
    from public.professional_course_review_signoffs s
    where s.course_id=c.id and s.review_type=p_review_type
      and s.reviewer_id=p_reviewer_id
      and s.reviewer_domain<>selected_domain
      and s.decision='approved'
  ) then
    raise exception 'This review requires separate reviewers for the required domains';
  end if;

  insert into public.professional_course_review_signoffs(
    course_id,review_type,reviewer_id,reviewer_name,reviewer_qualification,reviewer_domain,
    reviewer_organization,reviewer_evidence_ref,decision,notes,attestation,recorded_by
  ) values(
    c.id,p_review_type,rv.id,rv.full_name,rv.qualification,selected_domain,
    rv.organization,rv.evidence_ref,p_decision,nullif(trim(coalesce(p_notes,'')),''),true,uid
  ) returning id into sid;

  domain_status:=private.refresh_professional_review_domain(c.id,p_review_type);

  return jsonb_build_object(
    'signoff_id',sid,'course_key',c.course_key,'review_type',p_review_type,
    'reviewer_id',rv.id,'reviewer_domain',selected_domain,'review_status',domain_status
  );
end;
$$;
revoke all on function private.admin_record_verified_professional_review_signoff(text,text,uuid,text,text,boolean) from public,anon;
grant execute on function private.admin_record_verified_professional_review_signoff(text,text,uuid,text,text,boolean) to authenticated;

create or replace function public.admin_record_verified_professional_review_signoff(
  p_course_key text,
  p_review_type text,
  p_reviewer_id uuid,
  p_decision text,
  p_notes text default null,
  p_attestation boolean default false
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_record_verified_professional_review_signoff(
  p_course_key,p_review_type,p_reviewer_id,p_decision,p_notes,p_attestation
) $$;
revoke all on function public.admin_record_verified_professional_review_signoff(text,text,uuid,text,text,boolean) from public,anon;
grant execute on function public.admin_record_verified_professional_review_signoff(text,text,uuid,text,text,boolean) to authenticated;

create or replace function private.get_admin_professional_training_review_center()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare uid uuid:=auth.uid();
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;

  return jsonb_build_object(
    'summary',jsonb_build_object(
      'courses',(select count(*) from public.professional_courses),
      'modules',(select count(*) from public.professional_course_modules),
      'assessments',(select count(*) from public.professional_assessment_items),
      'enrollments',(select count(*) from public.professional_enrollments),
      'published',(select count(*) from public.professional_courses where status='published'),
      'checkout_enabled',(select count(*) from public.professional_courses where checkout_enabled),
      'reviewers_pending',(select count(*) from public.professional_reviewers where verification_status='pending' and active=true),
      'reviewers_verified',(select count(*) from public.professional_reviewers where verification_status='verified_in_house' and active=true)
    ),
    'reviewers',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'full_name',r.full_name,'qualification',r.qualification,
        'reviewer_domains',r.reviewer_domains,'organization',r.organization,'evidence_ref',r.evidence_ref,
        'verification_status',r.verification_status,'verification_method',r.verification_method,
        'verification_notes',r.verification_notes,'verified_at',r.verified_at,'active',r.active
      ) order by case r.verification_status when 'pending' then 0 when 'verified_in_house' then 1 else 2 end,r.full_name)
      from public.professional_reviewers r
    ),'[]'::jsonb),
    'courses',coalesce((
      select jsonb_agg(jsonb_build_object(
        'course_key',c.course_key,'title',c.title,'category',c.category,'price_cents',c.price_cents,
        'estimated_hours',c.estimated_hours,'status',c.status,'checkout_enabled',c.checkout_enabled,
        'issues',private.professional_course_release_issues(c.id),
        'modules',(select count(*) from public.professional_course_modules m where m.course_id=c.id),
        'assessments',(select count(*) from public.professional_assessment_items a join public.professional_course_modules m on m.id=a.module_id where m.course_id=c.id),
        'scenarios',(select count(*) from public.professional_assessment_items a join public.professional_course_modules m on m.id=a.module_id where m.course_id=c.id and a.item_type='scenario'),
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