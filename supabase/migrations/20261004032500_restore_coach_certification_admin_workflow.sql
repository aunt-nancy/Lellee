-- Restore the administrator half of the coaching credential and certificate
-- workflow. The coach-facing request/context functions are already live.

create index if not exists credential_verification_events_claim_created_idx
  on public.credential_verification_events (credential_claim_id, created_at desc);

create index if not exists credential_verification_events_reviewer_created_idx
  on public.credential_verification_events (verified_by, created_at desc)
  where verified_by is not null;

-- Browser roles need only the operations used by the coach interface. All
-- review decisions and certificate mutations go through the guarded RPCs below.
revoke all on table public.professional_credential_claims from anon;
revoke all on table public.training_records from anon;
revoke all on table public.credential_verification_events from anon;
revoke all on table public.coach_certificates from anon;

revoke update, delete on table public.professional_credential_claims from authenticated;
revoke update, delete on table public.training_records from authenticated;
revoke insert, update, delete on table public.credential_verification_events from authenticated;
revoke insert, update, delete on table public.coach_certificates from authenticated;

grant select, insert on table public.professional_credential_claims to authenticated;
grant select, insert on table public.training_records to authenticated;
grant select on table public.credential_verification_events to authenticated;
grant select on table public.coach_certificates to authenticated;

create or replace function public.admin_review_coach_credential(
  p_claim_id uuid,
  p_status text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  claim public.professional_credential_claims%rowtype;
  clean_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  if p_status not in ('verified', 'unable_to_verify') then
    raise exception 'Review status must be verified or unable_to_verify';
  end if;

  select * into claim
  from public.professional_credential_claims
  where id = p_claim_id
  for update;

  if claim.id is null then raise exception 'Credential claim not found'; end if;
  if claim.business_id is null then raise exception 'Credential claim is not attached to a coaching business'; end if;
  if claim.verification_status not in ('self_reported', 'pending', 'verified', 'unable_to_verify') then
    raise exception 'Credential claim is not reviewable in its current state';
  end if;
  if p_status = 'verified' and claim.expires_on is not null and claim.expires_on < current_date then
    raise exception 'An expired credential cannot be verified';
  end if;
  if p_status = 'unable_to_verify' and clean_note is null then
    raise exception 'A review note is required when a claim cannot be verified';
  end if;

  update public.professional_credential_claims
  set verification_status = p_status,
      verified_by = uid,
      verified_at = now(),
      public_display_approved = (p_status = 'verified'),
      updated_at = now()
  where id = p_claim_id;

  insert into public.credential_verification_events(
    credential_claim_id, verification_status, method, note, verified_by
  ) values (
    p_claim_id, p_status, 'admin_manual_review', clean_note, uid
  );

  return true;
end;
$$;

revoke all on function public.admin_review_coach_credential(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_review_coach_credential(uuid, text, text) to authenticated;

create or replace function public.admin_review_training_record(
  p_training_record_id uuid,
  p_verified boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  training public.training_records%rowtype;
begin
  if auth.uid() is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  select * into training
  from public.training_records
  where id = p_training_record_id
  for update;

  if training.id is null then raise exception 'Training record not found'; end if;
  if p_verified and (training.status <> 'completed' or training.completed_at is null) then
    raise exception 'Only completed training can be verified';
  end if;
  if p_verified and training.expires_on is not null and training.expires_on < current_date then
    raise exception 'Expired training cannot be verified';
  end if;

  update public.training_records
  set verified = p_verified
  where id = p_training_record_id;

  return true;
end;
$$;

revoke all on function public.admin_review_training_record(uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_review_training_record(uuid, boolean) to authenticated;

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
      certificate_title, p_expires_on, certificate_scope,
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
      certificate_title, p_expires_on, certificate_scope,
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

create or replace function public.admin_revoke_coach_certificate(
  p_certificate_id uuid,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;
  if clean_note is null then raise exception 'A revocation reason is required'; end if;

  update public.coach_certificates
  set status = 'revoked',
      review_note = clean_note,
      revoked_by = auth.uid(),
      revoked_at = now(),
      updated_at = now()
  where id = p_certificate_id and status <> 'revoked';

  if not found then raise exception 'Active certificate not found'; end if;
  return true;
end;
$$;

revoke all on function public.admin_revoke_coach_certificate(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_revoke_coach_certificate(uuid, text) to authenticated;

create or replace function public.get_admin_coach_certification_context()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  return jsonb_build_object(
    'summary', jsonb_build_object(
      'claims', (select count(*) from public.professional_credential_claims where business_id is not null),
      'pending', (select count(*) from public.professional_credential_claims where business_id is not null and verification_status = 'pending'),
      'verified', (select count(*) from public.professional_credential_claims where business_id is not null and verification_status = 'verified'),
      'training', (select count(*) from public.training_records),
      'certificates', (select count(*) from public.coach_certificates where status = 'active'),
      'expiring', (select count(*) from public.coach_certificates where status = 'active' and expires_on between current_date and current_date + 60)
    ),
    'claims', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'user_id', c.user_id, 'business_id', c.business_id,
        'owner_label', coalesce(b.public_name, b.business_name, nullif(split_part(u.email, '@', 1), ''), 'Coach'),
        'business_name', coalesce(b.public_name, b.business_name),
        'label', c.label, 'credential_type', c.credential_type, 'issuer', c.issuer,
        'issued_on', c.issued_on, 'expires_on', c.expires_on,
        'verification_status', c.verification_status, 'verified_at', c.verified_at,
        'certificate_id', cert.id, 'certificate_number', cert.certificate_number
      ) order by case c.verification_status when 'pending' then 0 when 'self_reported' then 1 else 2 end, c.created_at desc)
      from public.professional_credential_claims c
      left join public.coach_businesses b on b.id = c.business_id
      left join auth.users u on u.id = c.user_id
      left join public.coach_certificates cert on cert.credential_claim_id = c.id
      where c.business_id is not null
    ), '[]'::jsonb),
    'training', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tr.id, 'user_id', tr.user_id, 'business_id', bm.business_id,
        'owner_label', coalesce(b.public_name, b.business_name, nullif(split_part(u.email, '@', 1), ''), 'Coach'),
        'title', tr.title, 'hours', tr.hours, 'status', tr.status,
        'completed_at', tr.completed_at, 'expires_on', tr.expires_on, 'verified', tr.verified,
        'certificate_id', cert.id, 'certificate_number', cert.certificate_number
      ) order by tr.created_at desc)
      from public.training_records tr
      left join lateral (
        select m.business_id
        from public.coach_business_members m
        where m.user_id = tr.user_id and m.status = 'active'
        order by case when m.role = 'owner' then 0 else 1 end, m.created_at
        limit 1
      ) bm on true
      left join public.coach_businesses b on b.id = bm.business_id
      left join auth.users u on u.id = tr.user_id
      left join public.coach_certificates cert on cert.training_record_id = tr.id
    ), '[]'::jsonb),
    'certificates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'certificate_number', x.certificate_number, 'title', x.title,
        'owner_label', coalesce(b.public_name, b.business_name, nullif(split_part(u.email, '@', 1), ''), 'Coach'),
        'business_name', coalesce(b.public_name, b.business_name),
        'issued_on', x.issued_on, 'expires_on', x.expires_on, 'status', x.status,
        'scope_note', x.scope_note, 'review_note', x.review_note
      ) order by x.created_at desc)
      from public.coach_certificates x
      join public.coach_businesses b on b.id = x.business_id
      left join auth.users u on u.id = x.user_id
    ), '[]'::jsonb),
    'types', coalesce((
      select jsonb_agg(jsonb_build_object(
        'credential_key', t.credential_key, 'label', t.label, 'description', t.description,
        'requires_expiration', t.requires_expiration, 'verification_method', t.verification_method,
        'status', t.status
      ) order by t.label)
      from public.credential_types t
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_admin_coach_certification_context() from public, anon, authenticated;
grant execute on function public.get_admin_coach_certification_context() to authenticated;
