begin;

alter table public.professional_reviewers
  add column if not exists verification_checklist jsonb not null default '{}'::jsonb;

revoke all on function public.admin_verify_professional_reviewer(uuid,boolean,text)
from public,anon,authenticated;
revoke all on function private.admin_verify_professional_reviewer(uuid,boolean,text)
from public,anon,authenticated;

create or replace function private.admin_verify_professional_reviewer_v2(
  p_reviewer_id uuid,
  p_verified boolean,
  p_checklist jsonb,
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
  checked_domains text[];
  missing_domains text[];
  normalized_checklist jsonb;
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  select * into r
  from public.professional_reviewers
  where id=p_reviewer_id
  for update;

  if r.id is null then raise exception 'Reviewer not found'; end if;

  normalized_checklist:=coalesce(p_checklist,'{}'::jsonb);

  select coalesce(array_agg(value order by value),'{}'::text[])
  into checked_domains
  from jsonb_array_elements_text(
    coalesce(normalized_checklist->'checked_domains','[]'::jsonb)
  );

  select coalesce(array_agg(d order by d),'{}'::text[])
  into missing_domains
  from unnest(r.reviewer_domains) d
  where not (d=any(checked_domains));

  if p_verified then
    if coalesce((normalized_checklist->>'identity_checked')::boolean,false) is not true then
      raise exception 'Identity verification must be completed';
    end if;

    if coalesce((normalized_checklist->>'qualification_checked')::boolean,false) is not true then
      raise exception 'Qualification review must be completed';
    end if;

    if coalesce((normalized_checklist->>'evidence_reviewed')::boolean,false) is not true then
      raise exception 'Supporting evidence review must be completed';
    end if;

    if coalesce((normalized_checklist->>'conflict_independence_checked')::boolean,false) is not true then
      raise exception 'Conflict/independence review must be completed';
    end if;

    if cardinality(r.reviewer_domains)=0 then
      raise exception 'Reviewer must have at least one reviewer domain';
    end if;

    if cardinality(missing_domains)>0 then
      raise exception 'Every declared reviewer domain must be verified. Missing: %',
        array_to_string(missing_domains,', ');
    end if;

    if char_length(trim(coalesce(p_notes,'')))<10 then
      raise exception 'Verification notes of at least 10 characters are required';
    end if;
  else
    if char_length(trim(coalesce(p_notes,'')))<10 then
      raise exception 'A rejection reason of at least 10 characters is required';
    end if;
  end if;

  normalized_checklist:=normalized_checklist||jsonb_build_object(
    'checked_domains',to_jsonb(checked_domains),
    'decision',case when p_verified then 'verified_in_house' else 'rejected' end,
    'verified_by',uid,
    'verified_at',now(),
    'verification_method','manual_in_house'
  );

  update public.professional_reviewers
  set verification_status=case when p_verified then 'verified_in_house' else 'rejected' end,
      verification_method='manual_in_house',
      verification_checklist=normalized_checklist,
      verification_notes=trim(p_notes),
      verified_by=uid,
      verified_at=now(),
      active=case when p_verified then true else false end,
      updated_at=now()
  where id=r.id;

  insert into public.admin_audit_log(
    actor_user_id,entity_type,entity_id,action,
    changed_fields,action_label,workspace
  )
  values(
    uid,'professional_reviewer',r.id::text,
    case when p_verified then 'verify_reviewer_in_house' else 'reject_reviewer_in_house' end,
    array[
      'verification_status',
      'verification_method',
      'verification_checklist',
      'verification_notes',
      'verified_by',
      'verified_at',
      'active'
    ],
    case when p_verified
      then 'Verified professional reviewer in-house using structured checklist'
      else 'Rejected professional reviewer after in-house review'
    end,
    'professional_training'
  );

  return jsonb_build_object(
    'reviewer_id',r.id,
    'verification_status',case when p_verified then 'verified_in_house' else 'rejected' end,
    'verification_method','manual_in_house',
    'checked_domains',checked_domains,
    'checklist_complete',case when p_verified then true else false end
  );
end;
$$;

revoke all on function private.admin_verify_professional_reviewer_v2(uuid,boolean,jsonb,text)
from public,anon;
grant execute on function private.admin_verify_professional_reviewer_v2(uuid,boolean,jsonb,text)
to authenticated;

create or replace function public.admin_verify_professional_reviewer_v2(
  p_reviewer_id uuid,
  p_verified boolean,
  p_checklist jsonb,
  p_notes text default null
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$
  select private.admin_verify_professional_reviewer_v2(
    p_reviewer_id,p_verified,p_checklist,p_notes
  )
$$;

revoke all on function public.admin_verify_professional_reviewer_v2(uuid,boolean,jsonb,text)
from public,anon;
grant execute on function public.admin_verify_professional_reviewer_v2(uuid,boolean,jsonb,text)
to authenticated;

commit;