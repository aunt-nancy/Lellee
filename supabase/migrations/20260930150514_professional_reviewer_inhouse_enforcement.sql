begin;

revoke execute on function public.admin_record_professional_review_signoff(text,text,text,text,text,text,text,text,text,boolean) from authenticated;
revoke execute on function private.admin_record_professional_review_signoff(text,text,text,text,text,text,text,text,text,boolean) from authenticated;

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
  missing_domain boolean := false;
  has_revisions boolean := false;
  result_status text;
begin
  select * into req
  from public.professional_course_review_requirements
  where course_id=p_course_id and review_type=p_review_type;

  if req.course_id is null then raise exception 'Review requirement not configured'; end if;

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
      select count(distinct reviewer_id)
      into approved_count
      from latest
      where decision='approved'
        and attestation=true
        and char_length(trim(reviewer_qualification))>=10;
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

    update public.professional_assessment_items a
    set review_status=case when result_status='approved' then 'approved' else 'internal_review' end,
        updated_at=now()
    from public.professional_course_modules m
    where a.module_id=m.id and m.course_id=p_course_id;
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

commit;