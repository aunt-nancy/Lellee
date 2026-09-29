-- Final pre-launch function hardening. Trigger functions are invoked by Postgres;
-- browser roles never need to call them directly.
revoke execute on function public.lellee_validate_organization_automation_v1() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.update_updated_at() from public, anon, authenticated;
revoke execute on function public.validate_automation_rule() from public, anon, authenticated;
revoke execute on function public.validate_coach_automation_rule() from public, anon, authenticated;

create table if not exists public.coach_certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.coach_businesses(id) on delete cascade,
  credential_claim_id uuid references public.professional_credential_claims(id) on delete set null,
  training_record_id uuid references public.training_records(id) on delete set null,
  title text not null,
  issuer text not null default 'Lellee',
  issued_on date not null default current_date,
  expires_on date,
  status text not null default 'active' check (status in ('active','expired','revoked')),
  scope_note text not null default 'Lellee completion certificate. This is not a professional license, clinical credential, or authorization to provide medical care.',
  review_note text,
  issued_by uuid not null references auth.users(id),
  revoked_by uuid references auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (credential_claim_id is not null or training_record_id is not null),
  check (expires_on is null or expires_on >= issued_on)
);

create unique index if not exists coach_certificates_claim_unique
  on public.coach_certificates(credential_claim_id)
  where credential_claim_id is not null;

create unique index if not exists coach_certificates_training_unique
  on public.coach_certificates(training_record_id)
  where training_record_id is not null;

create index if not exists coach_certificates_user_idx
  on public.coach_certificates(user_id, created_at desc);

create index if not exists coach_certificates_business_idx
  on public.coach_certificates(business_id, created_at desc);

alter table public.coach_certificates enable row level security;

drop policy if exists coach_certificates_read on public.coach_certificates;
create policy coach_certificates_read
  on public.coach_certificates
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_coach_business_member(business_id)
    or public.is_lellee_admin()
  );

drop trigger if exists coach_certificates_set_updated_at on public.coach_certificates;
create trigger coach_certificates_set_updated_at
before update on public.coach_certificates
for each row execute function public.set_updated_at();

revoke all on table public.coach_certificates from anon;
revoke insert, update, delete on table public.coach_certificates from authenticated;
grant select on table public.coach_certificates to authenticated;
grant all on table public.coach_certificates to service_role;

create or replace function public.request_coach_credential_review(p_claim_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  claim public.professional_credential_claims%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select * into claim
  from public.professional_credential_claims
  where id = p_claim_id;

  if claim.id is null then raise exception 'Credential claim not found'; end if;
  if claim.user_id <> uid or claim.business_id is null or not public.is_coach_business_member(claim.business_id) then
    raise exception 'Credential claim access required';
  end if;
  if claim.verification_status = 'verified' then return true; end if;
  if claim.verification_status not in ('self_reported','unable_to_verify','pending') then
    raise exception 'This credential cannot be submitted for review';
  end if;

  update public.professional_credential_claims
  set verification_status = 'pending',
      verified_by = null,
      verified_at = null,
      public_display_approved = false,
      updated_at = now()
  where id = p_claim_id;

  insert into public.credential_verification_events(
    credential_claim_id, verification_status, method, note, verified_by
  ) values (
    p_claim_id, 'pending', 'coach_request', 'Submitted by the credential owner for human review.', null
  );

  return true;
end;
$$;

revoke all on function public.request_coach_credential_review(uuid) from public, anon;
grant execute on function public.request_coach_credential_review(uuid) to authenticated;

create or replace function public.admin_review_training_record(p_training_record_id uuid, p_verified boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  if p_verified and not exists(
    select 1 from public.training_records
    where id = p_training_record_id and status = 'completed' and completed_at is not null
  ) then
    raise exception 'Only completed training can be verified';
  end if;

  update public.training_records
  set verified = p_verified
  where id = p_training_record_id;

  if not found then raise exception 'Training record not found'; end if;
  return true;
end;
$$;

revoke all on function public.admin_review_training_record(uuid, boolean) from public, anon;
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
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  claim public.professional_credential_claims%rowtype;
  training public.training_records%rowtype;
  target_user uuid;
  target_business uuid;
  certificate_title text;
  certificate_id uuid;
  certificate_code text;
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  if (p_credential_claim_id is null) = (p_training_record_id is null) then
    raise exception 'Choose exactly one verified credential claim or training record';
  end if;

  if p_credential_claim_id is not null then
    select * into claim from public.professional_credential_claims where id = p_credential_claim_id;
    if claim.id is null then raise exception 'Credential claim not found'; end if;
    if claim.verification_status <> 'verified' then raise exception 'Credential claim must be verified first'; end if;
    if claim.business_id is null then raise exception 'Credential claim is not attached to a coaching business'; end if;
    target_user := claim.user_id;
    target_business := claim.business_id;
    certificate_title := coalesce(nullif(trim(p_title),''), claim.label);
  else
    select * into training from public.training_records where id = p_training_record_id;
    if training.id is null then raise exception 'Training record not found'; end if;
    if training.status <> 'completed' or not training.verified then
      raise exception 'Training must be completed and verified first';
    end if;
    select m.business_id into target_business
    from public.coach_business_members m
    where m.user_id = training.user_id and m.status = 'active'
    order by case when m.role = 'owner' then 0 else 1 end, m.created_at
    limit 1;
    if target_business is null then raise exception 'Training owner has no active coaching business'; end if;
    target_user := training.user_id;
    certificate_title := coalesce(nullif(trim(p_title),''), training.title);
  end if;

  certificate_code := 'LEL-' || to_char(current_date,'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));

  if p_credential_claim_id is not null then
    insert into public.coach_certificates(
      certificate_number, user_id, business_id, credential_claim_id,
      title, expires_on, review_note, issued_by
    ) values (
      certificate_code, target_user, target_business, p_credential_claim_id,
      certificate_title, p_expires_on, nullif(trim(coalesce(p_note,'')),''), uid
    )
    on conflict (credential_claim_id) where credential_claim_id is not null
    do update set
      title = excluded.title,
      expires_on = excluded.expires_on,
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
      title, expires_on, review_note, issued_by
    ) values (
      certificate_code, target_user, target_business, p_training_record_id,
      certificate_title, p_expires_on, nullif(trim(coalesce(p_note,'')),''), uid
    )
    on conflict (training_record_id) where training_record_id is not null
    do update set
      title = excluded.title,
      expires_on = excluded.expires_on,
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

revoke all on function public.admin_issue_coach_certificate(uuid, uuid, text, date, text) from public, anon;
grant execute on function public.admin_issue_coach_certificate(uuid, uuid, text, date, text) to authenticated;

create or replace function public.admin_revoke_coach_certificate(p_certificate_id uuid, p_note text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;

  update public.coach_certificates
  set status = 'revoked',
      review_note = coalesce(nullif(trim(coalesce(p_note,'')),''), review_note),
      revoked_by = auth.uid(),
      revoked_at = now(),
      updated_at = now()
  where id = p_certificate_id;

  if not found then raise exception 'Certificate not found'; end if;
  return true;
end;
$$;

revoke all on function public.admin_revoke_coach_certificate(uuid, text) from public, anon;
grant execute on function public.admin_revoke_coach_certificate(uuid, text) to authenticated;

create or replace function public.get_my_coach_certification_context()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  bid uuid;
  business_status text;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select m.business_id into bid
  from public.coach_business_members m
  where m.user_id = uid and m.status = 'active'
  order by case when m.role = 'owner' then 0 when m.role = 'admin' then 1 else 2 end, m.created_at
  limit 1;

  if bid is null then
    select id into bid from public.coach_businesses where owner_user_id = uid limit 1;
  end if;
  if bid is null then return jsonb_build_object('has_business',false); end if;

  if not public.is_coach_business_member(bid)
     and not exists(select 1 from public.coach_businesses where id = bid and owner_user_id = uid)
     and not public.is_lellee_admin() then
    raise exception 'Coach business access required';
  end if;

  select status into business_status from public.coach_businesses where id = bid;

  return jsonb_build_object(
    'has_business', true,
    'business_id', bid,
    'business_status', business_status,
    'summary', jsonb_build_object(
      'credentials', (select count(*) from public.professional_credential_claims where business_id = bid),
      'pending', (select count(*) from public.professional_credential_claims where business_id = bid and verification_status = 'pending'),
      'verified', (select count(*) from public.professional_credential_claims where business_id = bid and verification_status = 'verified'),
      'training', (select count(*) from public.training_records tr where exists(
        select 1 from public.coach_business_members bm where bm.business_id = bid and bm.user_id = tr.user_id and bm.status = 'active'
      )),
      'completed_training', (select count(*) from public.training_records tr where tr.status = 'completed' and exists(
        select 1 from public.coach_business_members bm where bm.business_id = bid and bm.user_id = tr.user_id and bm.status = 'active'
      )),
      'certificates', (select count(*) from public.coach_certificates where business_id = bid and status = 'active')
    ),
    'readiness', jsonb_build_object(
      'business_approved', business_status = 'approved',
      'credential_submitted', exists(select 1 from public.professional_credential_claims where business_id = bid and verification_status in ('pending','verified')),
      'credential_verified', exists(select 1 from public.professional_credential_claims where business_id = bid and verification_status = 'verified'),
      'training_recorded', exists(select 1 from public.training_records tr where tr.status = 'completed' and exists(
        select 1 from public.coach_business_members bm where bm.business_id = bid and bm.user_id = tr.user_id and bm.status = 'active'
      )),
      'certificate_issued', exists(select 1 from public.coach_certificates where business_id = bid and status = 'active')
    ),
    'credentials', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'label', c.label, 'credential_type', c.credential_type, 'issuer', c.issuer,
        'credential_number_masked', c.credential_number_masked, 'issued_on', c.issued_on,
        'expires_on', c.expires_on, 'verification_status', c.verification_status,
        'verified_at', c.verified_at, 'public_display_approved', c.public_display_approved
      ) order by c.created_at desc)
      from public.professional_credential_claims c where c.business_id = bid
    ), '[]'::jsonb),
    'training', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tr.id, 'title', tr.title, 'hours', tr.hours, 'status', tr.status,
        'completed_at', tr.completed_at, 'expires_on', tr.expires_on, 'verified', tr.verified
      ) order by tr.created_at desc)
      from public.training_records tr
      where exists(
        select 1 from public.coach_business_members bm
        where bm.business_id = bid and bm.user_id = tr.user_id and bm.status = 'active'
      )
    ), '[]'::jsonb),
    'certificates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'certificate_number', x.certificate_number, 'title', x.title,
        'issuer', x.issuer, 'issued_on', x.issued_on, 'expires_on', x.expires_on,
        'status', case when x.status = 'active' and x.expires_on is not null and x.expires_on < current_date then 'expired' else x.status end,
        'scope_note', x.scope_note, 'review_note', x.review_note
      ) order by x.issued_on desc, x.created_at desc)
      from public.coach_certificates x where x.business_id = bid
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_my_coach_certification_context() from public, anon;
grant execute on function public.get_my_coach_certification_context() to authenticated;

create or replace function public.get_admin_coach_certification_context()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;

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
        'owner_label', coalesce(b.public_name, b.business_name, nullif(split_part(u.email,'@',1),''), 'Coach'),
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
        'owner_label', coalesce(b.public_name, b.business_name, nullif(split_part(u.email,'@',1),''), 'Coach'),
        'title', tr.title, 'hours', tr.hours, 'status', tr.status,
        'completed_at', tr.completed_at, 'expires_on', tr.expires_on, 'verified', tr.verified,
        'certificate_id', cert.id, 'certificate_number', cert.certificate_number
      ) order by tr.created_at desc)
      from public.training_records tr
      left join lateral (
        select m.business_id from public.coach_business_members m
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
        'owner_label', coalesce(b.public_name, b.business_name, nullif(split_part(u.email,'@',1),''), 'Coach'),
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
        'requires_expiration', t.requires_expiration, 'verification_method', t.verification_method, 'status', t.status
      ) order by t.label)
      from public.credential_types t
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_admin_coach_certification_context() from public, anon;
grant execute on function public.get_admin_coach_certification_context() to authenticated;
