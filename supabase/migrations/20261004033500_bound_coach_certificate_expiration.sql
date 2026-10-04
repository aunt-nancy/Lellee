-- A Lellee record may use an earlier administrator-selected expiration, but it
-- must never remain active beyond the evidence that supports it.

create or replace function public.admin_issue_coach_certificate(
  p_credential_claim_id uuid default null,
  p_training_record_id uuid default null,
  p_title text default null,
  p_expires_on date default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  claim public.professional_credential_claims%rowtype;
  training public.training_records%rowtype;
  target_user uuid;
  target_business uuid;
  certificate_title text;
  certificate_scope text;
  certificate_id uuid;
  certificate_code text;
  effective_expires_on date;
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;
  if (p_credential_claim_id is null) = (p_training_record_id is null) then
    raise exception 'Choose exactly one verified credential claim or training record';
  end if;
  if p_expires_on is not null and p_expires_on < current_date then
    raise exception 'Certificate expiration cannot be before its issue date';
  end if;

  if p_credential_claim_id is not null then
    select * into claim
    from public.professional_credential_claims
    where id = p_credential_claim_id
    for update;

    if claim.id is null then raise exception 'Credential claim not found'; end if;
    if claim.verification_status <> 'verified' or not claim.public_display_approved then
      raise exception 'Credential claim must complete administrator verification first';
    end if;
    if claim.expires_on is not null and claim.expires_on < current_date then
      raise exception 'An expired credential cannot support an active certificate';
    end if;
    if claim.business_id is null then raise exception 'Credential claim is not attached to a coaching business'; end if;

    effective_expires_on := coalesce(p_expires_on, claim.expires_on);
    if claim.expires_on is not null and effective_expires_on > claim.expires_on then
      raise exception 'Verification record cannot outlive the underlying credential';
    end if;
    target_user := claim.user_id;
    target_business := claim.business_id;
    certificate_title := coalesce(nullif(trim(p_title), ''), claim.label);
    certificate_scope := 'Lellee verification record for an administrator-reviewed credential claim. This record does not replace the underlying issuer credential or create a professional license, clinical credential, or authorization to provide medical care.';
  else
    select * into training
    from public.training_records
    where id = p_training_record_id
    for update;

    if training.id is null then raise exception 'Training record not found'; end if;
    if training.status <> 'completed' or not training.verified then
      raise exception 'Training must be completed and administrator-verified first';
    end if;
    if training.expires_on is not null and training.expires_on < current_date then
      raise exception 'Expired training cannot support an active certificate';
    end if;

    effective_expires_on := coalesce(p_expires_on, training.expires_on);
    if training.expires_on is not null and effective_expires_on > training.expires_on then
      raise exception 'Certificate cannot outlive the supporting training';
    end if;

    select m.business_id into target_business
    from public.coach_business_members m
    where m.user_id = training.user_id and m.status = 'active'
    order by case when m.role = 'owner' then 0 else 1 end, m.created_at
    limit 1;

    if target_business is null then raise exception 'Training owner has no active coaching business'; end if;
    target_user := training.user_id;
    certificate_title := coalesce(nullif(trim(p_title), ''), training.title);
    certificate_scope := case
      when training.professional_course_id is not null or training.training_id is not null
        then 'Lellee completion certificate for administrator-verified training. This is not a professional license, clinical credential, or authorization to provide medical care.'
      else 'Lellee verification record for an administrator-reviewed training claim. This is not a professional license, clinical credential, or authorization to provide medical care.'
    end;
  end if;

  certificate_code := 'LEL-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  if p_credential_claim_id is not null then
    insert into public.coach_certificates(
      certificate_number, user_id, business_id, credential_claim_id,
      title, expires_on, scope_note, review_note, issued_by
    ) values (
      certificate_code, target_user, target_business, p_credential_claim_id,
      certificate_title, effective_expires_on, certificate_scope,
      nullif(trim(coalesce(p_note, '')), ''), uid
    )
    on conflict (credential_claim_id) where credential_claim_id is not null
    do update set
      title = excluded.title,
      expires_on = excluded.expires_on,
      scope_note = excluded.scope_note,
      review_note = excluded.review_note,
      status = 'active',
      issued_by = excluded.issued_by,
      issued_on = current_date,
      revoked_by = null,
      revoked_at = null,
      updated_at = now()
    returning id into certificate_id;
  else
    insert into public.coach_certificates(
      certificate_number, user_id, business_id, training_record_id,
      title, expires_on, scope_note, review_note, issued_by
    ) values (
      certificate_code, target_user, target_business, p_training_record_id,
      certificate_title, effective_expires_on, certificate_scope,
      nullif(trim(coalesce(p_note, '')), ''), uid
    )
    on conflict (training_record_id) where training_record_id is not null
    do update set
      title = excluded.title,
      expires_on = excluded.expires_on,
      scope_note = excluded.scope_note,
      review_note = excluded.review_note,
      status = 'active',
      issued_by = excluded.issued_by,
      issued_on = current_date,
      revoked_by = null,
      revoked_at = null,
      updated_at = now()
    returning id into certificate_id;
  end if;

  return certificate_id;
end;
$$;

revoke all on function public.admin_issue_coach_certificate(uuid, uuid, text, date, text) from public, anon, authenticated;
grant execute on function public.admin_issue_coach_certificate(uuid, uuid, text, date, text) to authenticated;
