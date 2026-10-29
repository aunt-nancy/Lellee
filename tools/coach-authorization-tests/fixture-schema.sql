-- Reduced catalog-derived fixture schema. No real account or client records.
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema private; create schema extensions;
create table auth.users(id uuid primary key,email text);
create table public.programs(id uuid primary key,slug text,name text);
create table public.admin_audit_log(actor_user_id uuid,entity_type text,entity_id text,action text,changed_fields text[],action_label text);
create table public.app_public_settings(key text primary key,value text);
create table public.coach_leads(id uuid default gen_random_uuid(),business_id uuid,email text,status text,updated_at timestamptz);
create table public.crm_followups(id uuid default gen_random_uuid(),owner_user_id uuid,workspace_type text,business_id uuid,related_user_id uuid,consultation_request_id uuid,title text,note text,due_at timestamptz,status text);
create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
create table private.test_admins(user_id uuid primary key);
create function public.is_lellee_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from private.test_admins where user_id=auth.uid())$$;
create table public.coach_assignment_recipients("assignment_id" uuid,"relationship_id" uuid,"group_id" uuid,"completed_at" timestamp with time zone,"id" uuid default gen_random_uuid(),"origin_group_id" uuid,primary key (id),unique(assignment_id,relationship_id));
create table public.coach_assignments("id" uuid default gen_random_uuid(),"business_id" uuid,"coach_user_id" uuid,"program_id" uuid,"title" text,"instructions" text,"due_at" timestamp with time zone,"status" text default 'active'::text,"created_at" timestamp with time zone default now(),primary key (id));
create table public.coach_business_members("business_id" uuid,"user_id" uuid,"role" text default 'coach'::text,"status" text default 'active'::text,"created_at" timestamp with time zone default now(),unique(business_id,user_id));
create table public.coach_business_programs("business_id" uuid,"program_id" uuid,"status" text default 'pending'::text);
create table public.coach_businesses("id" uuid default gen_random_uuid(),"owner_user_id" uuid,"business_name" text,"public_name" text,"primary_program_id" uuid,"business_model" text default 'solo'::text,"target_audience" text,"bio" text,"credentials_disclosure" text,"status" text default 'draft'::text,"public_profile_enabled" boolean default false,"submitted_at" timestamp with time zone,"approved_at" timestamp with time zone,"approved_by" uuid,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),"marketplace_visible" boolean default false,"marketplace_headline" text,"marketplace_reviewed_at" timestamp with time zone,"review_note" text,"reviewed_at" timestamp with time zone,"legal_business_name" text,"business_entity_type" text,"business_tax_classification" text,"business_country" text default 'US'::text,"tax_id_type" text,"tax_id_last4" text,"tax_id_token" text,"tax_id_attested" boolean default false,"tax_id_attested_at" timestamp with time zone,"business_address_line1" text,"business_address_line2" text,"business_city" text,"business_state" text,"business_postal_code" text,"pricing_disclosure_accepted" boolean default false,"pricing_disclosure_accepted_at" timestamp with time zone,"default_pricing_mode" text default 'coach_sets_base_customer_pays_fees'::text,primary key (id));
create table public.coach_certificates("id" uuid default gen_random_uuid(),"certificate_number" text,"user_id" uuid,"business_id" uuid,"credential_claim_id" uuid,"training_record_id" uuid,"title" text,"issuer" text default 'Lellee'::text,"issued_on" date default CURRENT_DATE,"expires_on" date,"status" text default 'active'::text,"scope_note" text default 'Lellee completion certificate. This is not a professional license, clinical credential, or authorization to provide medical care.'::text,"review_note" text,"issued_by" uuid,"revoked_by" uuid,"revoked_at" timestamp with time zone,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),"template_key" text,"template_version" integer,"render_snapshot" jsonb default '{}'::jsonb,"replaces_certificate_id" uuid,"replaced_by_certificate_id" uuid,"reissue_reason" text,"reissued_at" timestamp with time zone,primary key (id));
create table public.coach_client_notes("id" uuid default gen_random_uuid(),"business_id" uuid,"relationship_id" uuid,"author_user_id" uuid,"note_type" text default 'general'::text,"body" text,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),primary key (id));
create table public.coach_client_relationships("id" uuid default gen_random_uuid(),"business_id" uuid,"coach_user_id" uuid,"client_user_id" uuid,"program_id" uuid,"service_package_id" uuid,"status" text default 'active'::text,"client_consented_at" timestamp with time zone,"started_at" timestamp with time zone default now(),"ended_at" timestamp with time zone,"client_acceptance_status" text default 'pending_client_acceptance'::text,"client_acceptance_requested_at" timestamp with time zone default now(),"client_accepted_at" timestamp with time zone,"client_declined_at" timestamp with time zone,"client_decline_reason" text,"privacy_acknowledged_at" timestamp with time zone,"pricing_acknowledged_at" timestamp with time zone,"data_sharing_scope" jsonb default '{}'::jsonb,primary key (id),unique(business_id,client_user_id,program_id),constraint coach_client_relationships_status_check check(status in ('active','paused','ended')));
create table public.coach_consultation_requests("id" uuid default gen_random_uuid(),"business_id" uuid,"user_id" uuid,"program_id" uuid,"service_package_id" uuid,"note" text,"status" text default 'new'::text,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),primary key (id));
create table public.coach_group_announcements("id" uuid default gen_random_uuid(),"group_id" uuid,"sender_user_id" uuid,"title" text,"body" text,"created_at" timestamp with time zone default now(),primary key (id));
create table public.coach_group_members("group_id" uuid,"relationship_id" uuid,"joined_at" timestamp with time zone default now(),"status" text default 'active'::text);
create table public.coach_group_schedule("id" uuid default gen_random_uuid(),"group_id" uuid,"session_number" integer,"title" text,"scheduled_start" timestamp with time zone,"duration_minutes" integer default 60,"topic" text,"created_at" timestamp with time zone default now(),primary key (id));
create table public.coach_groups("id" uuid default gen_random_uuid(),"business_id" uuid,"program_id" uuid,"service_package_id" uuid,"name" text,"description" text,"capacity" integer default 8,"status" text default 'active'::text,"start_date" date,"end_date" date,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),"group_price" numeric,"public_enrollment_open" boolean default false,"waitlist_enabled" boolean default true,primary key (id));
create table public.coach_invitations("id" uuid default gen_random_uuid(),"business_id" uuid,"program_id" uuid,"invited_email" text,"token_hash" text,"status" text default 'pending'::text,"expires_at" timestamp with time zone default (now() + '14 days'::interval),"accepted_by" uuid,"accepted_at" timestamp with time zone,"created_at" timestamp with time zone default now(),primary key (id));
create table public.coach_messages("id" uuid default gen_random_uuid(),"business_id" uuid,"relationship_id" uuid,"group_id" uuid,"sender_user_id" uuid,"body" text,"created_at" timestamp with time zone default now(),"read_at" timestamp with time zone,primary key (id));
create table public.coach_profile_programs("profile_id" uuid,"program_id" uuid,"specialty_label" text,"primary_specialty" boolean default false,"display_order" integer default 100);
create table public.coach_public_badges("id" uuid default gen_random_uuid(),"profile_id" uuid,"badge_key" text,"badge_label" text,"verification_source" text,"status" text default 'pending'::text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_at" timestamp with time zone default now(),primary key (id));
create table public.coach_public_profiles("id" uuid default gen_random_uuid(),"business_id" uuid,"coach_user_id" uuid,"public_name" text,"headline" text,"bio" text,"photo_url" text,"languages" text[] default '{}'::text[],"coaching_approaches" text[] default '{}'::text[],"credential_summary" text,"credential_review_status" text default 'not_reviewed'::text,"accepting_status" text default 'accepting'::text,"profile_status" text default 'draft'::text,"public_visible" boolean default false,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),primary key (id));
create table public.coach_schedule_events("id" uuid default gen_random_uuid(),"business_id" uuid,"created_by" uuid,"relationship_id" uuid,"group_id" uuid,"consultation_request_id" uuid,"title" text,"session_scope" text default 'one_to_one'::text,"scheduled_start" timestamp with time zone,"duration_minutes" integer default 50,"timezone" text default 'America/Los_Angeles'::text,"meeting_location" text,"meeting_url" text,"status" text default 'scheduled'::text,"reminder_24h_sent_at" timestamp with time zone,"reminder_1h_sent_at" timestamp with time zone,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),"operational_note" text,"service_package_id" uuid,"payment_checkout_request_id" uuid,"payment_status" text default 'not_required'::text,"pricing_quote_snapshot" jsonb default '{}'::jsonb,"customer_total_amount" numeric default 0,"cancellation_status" text default 'none'::text,"cancellation_policy_snapshot" jsonb default '{}'::jsonb,"cancelled_at" timestamp with time zone,"cancellation_reason" text,"confirmed_at" timestamp with time zone,"completed_at" timestamp with time zone,"no_show_at" timestamp with time zone,"refund_status" text default 'none'::text,"refund_review_requested_at" timestamp with time zone,"refund_review_reason" text,"status_control_note" text,primary key (id));
create table public.coach_service_packages("id" uuid default gen_random_uuid(),"business_id" uuid,"program_id" uuid,"name" text,"description" text,"service_type" text,"billing_model" text default 'monthly'::text,"price_amount" numeric,"sessions_included" integer,"group_capacity" integer,"individual_touchpoints" integer,"active" boolean default true,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),"coach_controls_price" boolean default true,"customer_pays_processing_fees" boolean default true,"customer_pays_lellee_platform_fee" boolean default true,"pricing_disclosure_accepted" boolean default false,"pricing_disclosure_accepted_at" timestamp with time zone,"price_quote_snapshot" jsonb default '{}'::jsonb,"pricing_frequency_key" text,"weekly_base_price_amount" numeric,"computed_price_locked" boolean default false,"price_explanation" jsonb default '{}'::jsonb,"listed_coach_price_amount" numeric,"coach_discount_amount" numeric default 0,"coach_price_after_discount" numeric,"pricing_quote" jsonb default '{}'::jsonb,"coach_price_adjustment_amount" numeric default 0,"coach_price_adjustment_type" text default 'none'::text,"processing_fee_basis_amount" numeric,"coach_price_after_adjustment" numeric,"coach_adjustment_amount" numeric default 0,primary key (id));
create table public.coach_sessions("id" uuid default gen_random_uuid(),"business_id" uuid,"coach_user_id" uuid,"relationship_id" uuid,"group_id" uuid,"scheduled_start" timestamp with time zone,"duration_minutes" integer default 50,"session_type" text default 'coaching'::text,"status" text default 'scheduled'::text,"operational_note" text,"created_at" timestamp with time zone default now(),primary key (id));
create table public.form_assignments("id" uuid default gen_random_uuid(),"form_id" uuid,"form_version_id" uuid,"user_id" uuid,"assigned_by" uuid,"assigned_scope" text default 'program'::text,"business_id" uuid,"organization_id" uuid,"program_id" uuid,"due_at" timestamp with time zone,"status" text default 'assigned'::text,"created_at" timestamp with time zone default now(),"completed_at" timestamp with time zone,primary key (id));
create table public.form_definitions("id" uuid default gen_random_uuid(),"program_id" uuid,"organization_id" uuid,"business_id" uuid,"title" text,"description" text,"form_type" text,"privacy_mode" text default 'private_user'::text,"status" text default 'draft'::text,"current_version" integer default 1,"sensitive" boolean default false,"created_by" uuid,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),primary key (id));
create table public.form_questions("id" uuid default gen_random_uuid(),"form_version_id" uuid,"question_key" text,"prompt" text,"question_type" text,"required" boolean default false,"options" jsonb default '[]'::jsonb,"display_order" integer default 100,"sensitive" boolean default false,primary key (id));
create table public.form_versions("id" uuid default gen_random_uuid(),"form_id" uuid,"version_number" integer,"status" text default 'draft'::text,"instructions" text,"consent_text" text,"created_by" uuid,"created_at" timestamp with time zone default now(),"published_at" timestamp with time zone,primary key (id));
create table public.professional_courses("id" uuid default gen_random_uuid(),"course_key" text,"title" text,"category" text,"description" text,"audience" text default 'professional'::text,"price_cents" integer,"billing_mode" text default 'one_time'::text,"entitlement_key" text,"payment_setting_key" text,"estimated_hours" numeric,"minimum_module_count" integer default 6,"minimum_questions_per_module" integer default 8,"minimum_scenario_items" integer default 4,"module_pass_score" integer default 80,"final_exam_pass_score" integer default 80,"capstone_required" boolean default true,"capstone_review_required" boolean default true,"status" text default 'draft'::text,"curriculum_review_status" text default 'draft'::text,"assessment_review_status" text default 'draft'::text,"checkout_enabled" boolean default false,"certificate_title" text,"certificate_scope_note" text default 'Lellee course-completion certificate. This is not a professional license, clinical credential, legal credential, or independent authorization to practice.'::text,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),primary key (id));
create table public.professional_credential_claims("id" uuid default gen_random_uuid(),"user_id" uuid,"business_id" uuid,"organization_id" uuid,"label" text,"credential_type" text,"issuer" text,"credential_number_masked" text,"issued_on" date,"expires_on" date,"verification_status" text default 'self_reported'::text,"verified_by" uuid,"verified_at" timestamp with time zone,"public_display_approved" boolean default false,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),primary key (id));
create table public.professional_enrollments("id" uuid default gen_random_uuid(),"user_id" uuid,"course_id" uuid,"entitlement_key" text,"status" text default 'active'::text,"started_at" timestamp with time zone default now(),"completed_at" timestamp with time zone,"verified_at" timestamp with time zone,"verified_by" uuid,"final_score" numeric,"training_record_id" uuid,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),primary key (id));
create table public.training_records("id" uuid default gen_random_uuid(),"user_id" uuid,"training_id" uuid,"title" text,"hours" numeric,"status" text default 'in_progress'::text,"completed_at" timestamp with time zone,"expires_on" date,"verified" boolean default false,"created_at" timestamp with time zone default now(),"professional_course_id" uuid,"professional_enrollment_id" uuid,primary key (id));
CREATE OR REPLACE FUNCTION public.is_coach_business_member(p_business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS(
    SELECT 1
    FROM public.coach_business_members m
    WHERE m.business_id=p_business_id
      AND m.user_id=auth.uid()
      AND m.status='active'
  )
$function$;
CREATE OR REPLACE FUNCTION public.is_coach_relationship_participant(p_relationship_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS(
    SELECT 1
    FROM public.coach_client_relationships r
    WHERE r.id=p_relationship_id
      AND (r.client_user_id=auth.uid() OR public.is_coach_business_member(r.business_id))
  )
$function$;
CREATE OR REPLACE FUNCTION public.create_coach_invite(p_business_id uuid, p_program_id uuid, p_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  caller uuid:=auth.uid();
  raw_token text;
  hash_token text;
  clean_email text:=lower(btrim(coalesce(p_email,'')));
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION USING errcode='42501',message='Authentication required';
  END IF;
  IF length(clean_email)=0 OR length(clean_email)>320 OR position('@' in clean_email)<=1 THEN
    RAISE EXCEPTION USING errcode='22023',message='A valid invitation email is required';
  END IF;
  IF NOT EXISTS(
    SELECT 1
    FROM public.coach_business_members m
    JOIN public.coach_businesses b ON b.id=m.business_id
    WHERE m.business_id=p_business_id
      AND m.user_id=caller
      AND m.status='active'
      AND m.role IN ('owner','admin','coach')
      AND b.status='approved'
  ) THEN
    RAISE EXCEPTION USING errcode='42501',message='Approved coach business access required';
  END IF;
  IF NOT EXISTS(
    SELECT 1
    FROM public.coach_business_programs bp
    WHERE bp.business_id=p_business_id
      AND bp.program_id=p_program_id
      AND bp.status='approved'
  ) THEN
    RAISE EXCEPTION USING errcode='42501',message='That program is not approved for this coaching business';
  END IF;

  raw_token:=encode(extensions.gen_random_bytes(24),'hex');
  hash_token:=encode(extensions.digest(raw_token,'sha256'),'hex');
  INSERT INTO public.coach_invitations(business_id,program_id,invited_email,token_hash,status,expires_at)
  VALUES(p_business_id,p_program_id,clean_email,hash_token,'pending',statement_timestamp()+interval '14 days');
  RETURN raw_token;
END
$function$;
CREATE OR REPLACE FUNCTION public.accept_coach_invite(p_token text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'auth', 'extensions'
AS $function$
declare
  inv public.coach_invitations%rowtype;
  rel_id uuid;
  coach_id uuid;
  caller_email text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select email into caller_email from auth.users where id=auth.uid();
  select * into inv
  from public.coach_invitations
  where token_hash=encode(digest(p_token,'sha256'),'hex')
    and status='pending' and expires_at>now()
  limit 1 for update;
  if inv.id is null then raise exception 'Invitation is invalid or expired'; end if;
  if lower(coalesce(caller_email,''))<>lower(inv.invited_email) then raise exception 'Sign in with the email address that was invited'; end if;
  select user_id into coach_id
  from public.coach_business_members
  where business_id=inv.business_id and role in('owner','coach') and status='active'
  order by case when role='owner' then 0 else 1 end
  limit 1;
  if coach_id is null then raise exception 'No active coach is available for this invitation'; end if;
  insert into public.coach_client_relationships(
    business_id,coach_user_id,client_user_id,program_id,client_consented_at
  )
  values(inv.business_id,coach_id,auth.uid(),inv.program_id,now())
  on conflict(business_id,client_user_id,program_id)
  do update set status='active',coach_user_id=excluded.coach_user_id,client_consented_at=now(),ended_at=null
  returning id into rel_id;
  update public.coach_invitations
  set status='accepted',accepted_by=auth.uid(),accepted_at=now()
  where id=inv.id;
  update public.coach_leads
  set status='converted',updated_at=now()
  where business_id=inv.business_id and email is not null
    and lower(email)=lower(inv.invited_email)
    and status in ('new','contacted','consultation','invited');
  return rel_id;
end;
$function$;
CREATE OR REPLACE FUNCTION public.create_my_coach_schedule_event(p_relationship_id uuid, p_scheduled_start timestamp with time zone, p_duration_minutes integer DEFAULT 50, p_title text DEFAULT 'Coaching Session'::text, p_meeting_location text DEFAULT NULL::text, p_meeting_url text DEFAULT NULL::text, p_operational_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'auth'
AS $function$
declare
  uid uuid:=auth.uid();
  r public.coach_client_relationships%rowtype;
  readiness jsonb;
  payment_required boolean:=false;
  payment_ready boolean:=false;
  accepted boolean:=false;
  quote jsonb:='{}'::jsonb;
  policy jsonb:='{}'::jsonb;
  event_id uuid;
  checkout jsonb:='{}'::jsonb;
  pay_status text:='not_required';
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if p_scheduled_start is null then raise exception 'Scheduled start is required'; end if;
  if coalesce(p_duration_minutes,0) < 15 then raise exception 'Session duration must be at least 15 minutes'; end if;

  select * into r
  from public.coach_client_relationships
  where id=p_relationship_id;

  if r.id is null then raise exception 'Coaching relationship not found'; end if;
  if not public.is_coach_business_member(r.business_id) then
    raise exception 'Coach business access required';
  end if;
  if r.status<>'active' or r.client_acceptance_status<>'accepted' then
    raise exception 'Client must accept the coaching relationship before a coaching session is scheduled';
  end if;

  readiness:=public.get_my_coach_relationship_payment_readiness(r.id);
  payment_required:=coalesce((readiness->>'payment_required')::boolean,false);
  payment_ready:=coalesce((readiness->>'payment_ready')::boolean,false);
  accepted:=coalesce((readiness->>'client_accepted')::boolean,false);
  quote:=coalesce(readiness->'pricing_quote','{}'::jsonb);
  policy:=coalesce(readiness->'policy','{}'::jsonb);

  if not accepted then
    raise exception 'Client acceptance is required before scheduling';
  end if;

  pay_status:=case
    when not payment_required then 'not_required'
    when payment_ready then 'paid'
    when coalesce((policy->>'payments_enabled')::boolean,false) then 'pending_payment'
    else 'not_enabled'
  end;

  insert into public.coach_schedule_events(
    business_id, created_by, relationship_id, service_package_id, title, session_scope,
    scheduled_start, duration_minutes, timezone, meeting_location, meeting_url,
    status, operational_note, payment_status, pricing_quote_snapshot,
    customer_total_amount, cancellation_policy_snapshot
  ) values (
    r.business_id, uid, r.id, r.service_package_id, coalesce(nullif(p_title,''),'Coaching Session'), 'one_to_one',
    p_scheduled_start, coalesce(p_duration_minutes,50), 'America/Los_Angeles', p_meeting_location, p_meeting_url,
    'scheduled', p_operational_note, pay_status, quote,
    coalesce((readiness->>'customer_total_amount')::numeric,0), policy
  ) returning id into event_id;

  if payment_required and not payment_ready then
    checkout:=public.create_my_coach_checkout_request(r.id,event_id);
    pay_status:=coalesce(checkout->>'status',pay_status);
    update public.coach_schedule_events
    set payment_status=pay_status,
        payment_checkout_request_id=(checkout->>'checkout_request_id')::uuid,
        updated_at=now()
    where id=event_id;
  end if;

  return jsonb_build_object(
    'created',true,
    'event_id',event_id,
    'relationship_id',r.id,
    'payment_status',pay_status,
    'paid_session_ready',accepted and (not payment_required or payment_ready),
    'payment_required',payment_required,
    'readiness',readiness,
    'checkout',checkout,
    'privacy_note','Private Lellee data is not shared through scheduling.'
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.update_my_coach_client_relationship(p_relationship_id uuid, p_service_package_id uuid DEFAULT NULL::uuid, p_status text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  uid uuid := auth.uid();
  r public.coach_client_relationships%rowtype;
  next_status text;
begin
  if uid is null then
    raise exception 'Sign in required';
  end if;

  select * into r
  from public.coach_client_relationships
  where id=p_relationship_id
  for update;

  if r.id is null then
    raise exception 'Client relationship not found';
  end if;

  if not public.is_coach_business_member(r.business_id) then
    raise exception 'Coach business access required';
  end if;

  if p_service_package_id is not null and not exists(
    select 1
    from public.coach_service_packages s
    where s.id=p_service_package_id
      and s.business_id=r.business_id
      and s.program_id=r.program_id
      and s.active=true
  ) then
    raise exception 'Service package must be active and belong to this client program';
  end if;

  next_status := coalesce(p_status,r.status);
  if next_status not in ('active','paused','ended') then
    raise exception 'Invalid relationship status';
  end if;

  if r.status='ended' and next_status<>'ended' then
    raise exception 'An ended coaching relationship requires a new invitation and client consent';
  end if;

  update public.coach_client_relationships
  set service_package_id=p_service_package_id,
      status=next_status,
      ended_at=case when next_status='ended' then coalesce(ended_at,now()) else null end
  where id=r.id;

  if next_status='ended' then
    update public.coach_group_members
    set status='removed'
    where relationship_id=r.id and status='active';
  end if;

  return jsonb_build_object(
    'relationship_id',r.id,
    'service_package_id',p_service_package_id,
    'status',next_status,
    'ended',next_status='ended'
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.convert_my_coach_consultation_to_client(p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'auth'
AS $function$
declare
  uid uuid:=auth.uid();
  req public.coach_consultation_requests%rowtype;
  rel public.coach_client_relationships%rowtype;
  coach_id uuid;
  service_name text;
  quote jsonb;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select * into req
  from public.coach_consultation_requests
  where id=p_request_id
  for update;

  if req.id is null then raise exception 'Consultation request not found'; end if;
  if not public.is_coach_business_member(req.business_id) then raise exception 'Coach business access required'; end if;
  if req.status in ('closed','declined') then raise exception 'Closed or declined requests cannot be converted'; end if;

  if req.service_package_id is not null and not exists(
    select 1 from public.coach_service_packages s
    where s.id=req.service_package_id and s.business_id=req.business_id and s.active=true
  ) then
    raise exception 'Selected service is no longer active for this coaching business';
  end if;

  select bm.user_id into coach_id
  from public.coach_business_members bm
  where bm.business_id=req.business_id and bm.status='active' and bm.role in ('owner','admin','coach')
  order by case bm.role when 'owner' then 0 when 'admin' then 1 else 2 end, bm.created_at
  limit 1;
  coach_id:=coalesce(coach_id,uid);

  insert into public.coach_client_relationships(
    business_id,coach_user_id,client_user_id,program_id,service_package_id,status,
    client_consented_at,started_at,client_acceptance_status,client_acceptance_requested_at,data_sharing_scope
  ) values (
    req.business_id,coach_id,req.user_id,req.program_id,req.service_package_id,'pending_client_acceptance',
    null,null,'pending_client_acceptance',now(),'{}'::jsonb
  )
  on conflict (business_id,client_user_id,program_id)
  do update set
    service_package_id=coalesce(excluded.service_package_id,public.coach_client_relationships.service_package_id),
    status=case when public.coach_client_relationships.status in ('active','paused') then public.coach_client_relationships.status else 'pending_client_acceptance' end,
    client_acceptance_status=case when public.coach_client_relationships.status in ('active','paused') then public.coach_client_relationships.client_acceptance_status else 'pending_client_acceptance' end,
    client_acceptance_requested_at=case when public.coach_client_relationships.status in ('active','paused') then public.coach_client_relationships.client_acceptance_requested_at else now() end,
    ended_at=null
  returning * into rel;

  update public.coach_consultation_requests
  set status=case when rel.status='active' then 'converted' else 'pending_client_acceptance' end,
      updated_at=now()
  where id=req.id;

  if req.service_package_id is not null then
    select s.name, coalesce(s.pricing_quote,s.price_quote_snapshot,'{}'::jsonb)
    into service_name, quote
    from public.coach_service_packages s
    where s.id=req.service_package_id;
  end if;

  insert into public.coach_messages(business_id,relationship_id,sender_user_id,body)
  values (
    req.business_id,
    rel.id,
    uid,
    'Your coach is ready to start. Please review and accept the coaching relationship in Lellee before coaching begins. Your private journal, check-ins, support contacts, and recovery history are not shared automatically.'
  );

  insert into public.crm_followups(
    owner_user_id,workspace_type,business_id,related_user_id,consultation_request_id,title,note,due_at,status
  ) values (
    uid,'coach',req.business_id,req.user_id,req.id,
    'Wait for client acceptance',
    case when service_name is not null then 'Client acceptance pending for: '||service_name else 'Client acceptance pending.' end,
    now()+interval '3 days','open'
  );

  return jsonb_build_object(
    'converted',rel.status='active',
    'pending_client_acceptance',rel.status='pending_client_acceptance',
    'relationship_id',rel.id,
    'business_id',rel.business_id,
    'client_user_id',rel.client_user_id,
    'program_id',rel.program_id,
    'service_package_id',rel.service_package_id,
    'service_name',service_name,
    'pricing_quote',coalesce(quote,'{}'::jsonb),
    'privacy_note','Private Lellee journal, check-ins, support contacts, and recovery history are not shared automatically.'
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.create_my_coach_assignment(p_program_id uuid, p_title text, p_instructions text DEFAULT NULL::text, p_due_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_relationship_id uuid DEFAULT NULL::uuid, p_group_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  uid uuid := auth.uid();
  bid uuid;
  assignment_id uuid;
  recipient_count integer:=0;
  rel public.coach_client_relationships%rowtype;
  grp public.coach_groups%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if (p_relationship_id is null) = (p_group_id is null) then raise exception 'Choose exactly one assignment target'; end if;
  if char_length(trim(coalesce(p_title,'')))<2 then raise exception 'Assignment title is required'; end if;
  select b.id into bid
  from public.coach_businesses b
  where b.owner_user_id=uid or exists(
    select 1 from public.coach_business_members m
    where m.business_id=b.id and m.user_id=uid and m.status='active'
  )
  order by case when b.owner_user_id=uid then 0 else 1 end,b.created_at
  limit 1;
  if bid is null or not public.is_coach_business_member(bid) then raise exception 'Coach business access required'; end if;
  if p_relationship_id is not null then
    select * into rel from public.coach_client_relationships where id=p_relationship_id and business_id=bid;
    if rel.id is null then raise exception 'Client relationship not found'; end if;
    if rel.status<>'active' or rel.ended_at is not null then raise exception 'Client relationship must be active'; end if;
    if rel.program_id<>p_program_id then raise exception 'Assignment program must match the client program'; end if;
  else
    select * into grp from public.coach_groups where id=p_group_id and business_id=bid;
    if grp.id is null then raise exception 'Coaching group not found'; end if;
    if grp.status not in ('forming','active') then raise exception 'Group must be forming or active'; end if;
    if grp.program_id<>p_program_id then raise exception 'Assignment program must match the group program'; end if;
  end if;
  insert into public.coach_assignments(business_id,coach_user_id,program_id,title,instructions,due_at,status)
  values(bid,uid,p_program_id,trim(p_title),nullif(trim(coalesce(p_instructions,'')),''),p_due_at,'active')
  returning id into assignment_id;
  if p_relationship_id is not null then
    insert into public.coach_assignment_recipients(assignment_id,relationship_id,group_id,origin_group_id)
    values(assignment_id,p_relationship_id,null,null);
    recipient_count:=1;
  else
    insert into public.coach_assignment_recipients(assignment_id,relationship_id,group_id,origin_group_id)
    select assignment_id,gm.relationship_id,null,p_group_id
    from public.coach_group_members gm
    join public.coach_client_relationships r on r.id=gm.relationship_id
    where gm.group_id=p_group_id and gm.status='active' and r.status='active' and r.ended_at is null
    on conflict do nothing;
    get diagnostics recipient_count = row_count;
    if recipient_count=0 then
      delete from public.coach_assignments where id=assignment_id;
      raise exception 'Group has no active client members to receive this assignment';
    end if;
  end if;
  return jsonb_build_object('assignment_id',assignment_id,'recipient_count',recipient_count,'target_type',case when p_relationship_id is not null then 'client' else 'group' end,'target_id',coalesce(p_relationship_id,p_group_id));
end;
$function$;
CREATE OR REPLACE FUNCTION public.assign_coach_intake_form(p_form_id uuid, p_client_user_id uuid, p_due_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  f public.form_definitions%rowtype;
  aid uuid;
  vid uuid;
begin
  select * into f from public.form_definitions
  where id=p_form_id and form_type='intake' and status='published';
  if f.id is null then raise exception 'Published intake form not found'; end if;
  if not public.is_coach_business_member(f.business_id) then raise exception 'Coach business access required'; end if;
  if not exists(
    select 1 from public.coach_client_relationships
    where business_id=f.business_id and client_user_id=p_client_user_id
      and status='active' and ended_at is null
  ) then raise exception 'Client is not in an active coaching relationship'; end if;
  select id into vid from public.form_versions
  where form_id=f.id and version_number=f.current_version and status='published'
  limit 1;
  if vid is null then raise exception 'Published form version not found'; end if;
  insert into public.form_assignments(
    form_id,form_version_id,user_id,assigned_by,assigned_scope,business_id,program_id,due_at,status
  )
  values(f.id,vid,p_client_user_id,auth.uid(),'coach',f.business_id,f.program_id,p_due_at,'assigned')
  returning id into aid;
  return aid;
end;
$function$;
CREATE OR REPLACE FUNCTION public.update_my_coach_schedule_event(p_event_id uuid, p_title text, p_session_scope text, p_scheduled_start timestamp with time zone, p_duration_minutes integer, p_meeting_location text DEFAULT NULL::text, p_meeting_url text DEFAULT NULL::text, p_operational_note text DEFAULT NULL::text, p_status text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  uid uuid:=auth.uid();
  e public.coach_schedule_events%rowtype;
  next_status text;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select * into e
  from public.coach_schedule_events
  where id=p_event_id
  for update;

  if e.id is null then raise exception 'Schedule event not found'; end if;
  if not public.is_coach_business_member(e.business_id) then
    raise exception 'Coach business access required';
  end if;
  if e.created_by<>uid and not public.is_lellee_admin() then
    raise exception 'Only the event creator can edit this schedule event';
  end if;

  if char_length(trim(coalesce(p_title,'')))<2 then
    raise exception 'Session title is required';
  end if;
  if p_session_scope not in ('consultation','one_to_one','group','admin') then
    raise exception 'Invalid session scope';
  end if;
  if p_duration_minutes<10 or p_duration_minutes>240 then
    raise exception 'Duration must be between 10 and 240 minutes';
  end if;

  next_status:=coalesce(p_status,e.status);
  if next_status not in ('scheduled','confirmed','completed','cancelled','no_show') then
    raise exception 'Invalid schedule status';
  end if;

  update public.coach_schedule_events
  set title=trim(p_title),
      session_scope=p_session_scope,
      scheduled_start=p_scheduled_start,
      duration_minutes=p_duration_minutes,
      meeting_location=nullif(trim(coalesce(p_meeting_location,'')),''),
      meeting_url=nullif(trim(coalesce(p_meeting_url,'')),''),
      operational_note=nullif(trim(coalesce(p_operational_note,'')),''),
      status=next_status,
      updated_at=now()
  where id=e.id;

  return jsonb_build_object('event_id',e.id,'status',next_status);
end;
$function$;
CREATE OR REPLACE FUNCTION public.update_my_coach_paid_session_status(p_event_id uuid, p_status text, p_note text DEFAULT NULL::text, p_cancellation_reason text DEFAULT NULL::text, p_refund_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'auth'
AS $function$
declare
  uid uuid := auth.uid();
  e public.coach_schedule_events%rowtype;
  policy jsonb;
  cancel_window int;
  hours_until numeric;
  next_cancel_status text;
  next_refund_status text;
begin
  if uid is null then
    raise exception 'Sign in required';
  end if;

  p_status := lower(trim(coalesce(p_status,'')));
  if p_status not in ('scheduled','confirmed','completed','cancelled','no_show','refund_review') then
    raise exception 'Invalid session status';
  end if;

  select * into e
  from public.coach_schedule_events
  where id=p_event_id
  for update;

  if e.id is null then
    raise exception 'Session not found';
  end if;

  if not public.is_coach_business_member(e.business_id) then
    raise exception 'Coach business access required';
  end if;

  if e.relationship_id is not null and not exists(
    select 1
    from public.coach_client_relationships r
    where r.id=e.relationship_id
      and r.status='active'
      and r.client_acceptance_status='accepted'
  ) then
    raise exception 'Client must accept the coaching relationship before session status can be advanced';
  end if;

  policy := public.get_my_coach_payment_policy();
  cancel_window := coalesce((policy->>'cancellation_window_hours')::int,24);
  hours_until := extract(epoch from (e.scheduled_start-now()))/3600.0;

  next_cancel_status := e.cancellation_status;
  next_refund_status := e.refund_status;

  if p_status='cancelled' then
    next_cancel_status := case when hours_until >= cancel_window then 'cancelled_within_policy' else 'late_cancel_review' end;
    if e.payment_status in ('paid','manual_paid','checkout_completed') then
      next_refund_status := 'review_pending';
    end if;
  elsif p_status='refund_review' then
    next_cancel_status := case when e.cancellation_status='none' then 'refund_review' else e.cancellation_status end;
    next_refund_status := 'review_pending';
  elsif p_status='completed' then
    next_cancel_status := 'none';
    next_refund_status := case when e.refund_status='review_pending' then e.refund_status else 'none' end;
  elsif p_status in ('scheduled','confirmed') then
    next_cancel_status := case when e.cancellation_status in ('cancelled_within_policy','late_cancel_review','refund_review') then e.cancellation_status else 'none' end;
  elsif p_status='no_show' then
    next_cancel_status := 'no_show_review';
    if e.payment_status in ('paid','manual_paid','checkout_completed') then
      next_refund_status := 'review_pending';
    end if;
  end if;

  update public.coach_schedule_events
  set status=p_status,
      confirmed_at=case when p_status='confirmed' then coalesce(confirmed_at,now()) else confirmed_at end,
      completed_at=case when p_status='completed' then coalesce(completed_at,now()) else completed_at end,
      no_show_at=case when p_status='no_show' then coalesce(no_show_at,now()) else no_show_at end,
      cancelled_at=case when p_status='cancelled' then coalesce(cancelled_at,now()) else cancelled_at end,
      cancellation_reason=case when p_status='cancelled' then p_cancellation_reason else cancellation_reason end,
      cancellation_status=next_cancel_status,
      refund_status=next_refund_status,
      refund_review_requested_at=case when next_refund_status='review_pending' then coalesce(refund_review_requested_at,now()) else refund_review_requested_at end,
      refund_review_reason=case when next_refund_status='review_pending' then coalesce(p_refund_reason,p_cancellation_reason,refund_review_reason) else refund_review_reason end,
      status_control_note=coalesce(p_note,status_control_note),
      updated_at=now()
  where id=e.id
  returning * into e;

  return jsonb_build_object(
    'updated',true,
    'event_id',e.id,
    'status',e.status,
    'payment_status',e.payment_status,
    'cancellation_status',e.cancellation_status,
    'refund_status',e.refund_status,
    'customer_total_amount',e.customer_total_amount,
    'policy',policy,
    'message',case
      when e.status='cancelled' then 'Session cancelled. Refund/cancellation handling is review-only while payment collection is off.'
      when e.status='refund_review' then 'Session placed into refund review. No money movement occurs from this status.'
      when e.status='completed' then 'Session marked completed.'
      when e.status='no_show' then 'Session marked no-show and held for review.'
      when e.status='confirmed' then 'Session confirmed.'
      else 'Session status updated.' end
  );
end;
$function$;
create function public.get_my_coach_relationship_payment_readiness(uuid) returns jsonb language sql as $$select '{"payment_required":false,"payment_ready":true,"client_accepted":true,"customer_total_amount":0}'::jsonb$$;
create function public.get_my_coach_payment_policy() returns jsonb language sql as $$select '{"payments_enabled":false,"cancellation_window_hours":24}'::jsonb$$;
grant usage on schema public,auth to authenticated,anon,service_role;
grant execute on all functions in schema public,auth to authenticated,anon,service_role;
grant all on all tables in schema public to authenticated,service_role;
alter table public.coach_assignment_recipients enable row level security;
alter table public.coach_assignments enable row level security;
alter table public.coach_business_members enable row level security;
alter table public.coach_business_programs enable row level security;
alter table public.coach_businesses enable row level security;
alter table public.coach_certificates enable row level security;
alter table public.coach_client_notes enable row level security;
alter table public.coach_client_relationships enable row level security;
alter table public.coach_consultation_requests enable row level security;
alter table public.coach_group_announcements enable row level security;
alter table public.coach_group_members enable row level security;
alter table public.coach_group_schedule enable row level security;
alter table public.coach_groups enable row level security;
alter table public.coach_invitations enable row level security;
alter table public.coach_messages enable row level security;
alter table public.coach_profile_programs enable row level security;
alter table public.coach_public_badges enable row level security;
alter table public.coach_public_profiles enable row level security;
alter table public.coach_schedule_events enable row level security;
alter table public.coach_service_packages enable row level security;
alter table public.coach_sessions enable row level security;
alter table public.form_assignments enable row level security;
alter table public.form_definitions enable row level security;
alter table public.form_questions enable row level security;
alter table public.form_versions enable row level security;
alter table public.professional_courses enable row level security;
alter table public.professional_credential_claims enable row level security;
alter table public.professional_enrollments enable row level security;
alter table public.training_records enable row level security;
create policy "coach_assignment_recipients_read" on public.coach_assignment_recipients for SELECT to authenticated using (((relationship_id IS NOT NULL) AND is_coach_relationship_participant(relationship_id)));
create policy "coach_assignments_business" on public.coach_assignments for ALL to authenticated using (is_coach_business_member(business_id)) with check (is_coach_business_member(business_id));
create policy "coach_members_business" on public.coach_business_members for SELECT to authenticated using (((user_id = auth.uid()) OR is_coach_business_member(business_id)));
create policy "coach_programs_business" on public.coach_business_programs for SELECT to authenticated using (is_coach_business_member(business_id));
create policy "coach_business_admin_all" on public.coach_businesses for ALL to authenticated using (is_lellee_admin()) with check (is_lellee_admin());
create policy "coach_business_admin_manage" on public.coach_businesses for ALL to authenticated using (is_lellee_admin()) with check (is_lellee_admin());
create policy "coach_business_member_read" on public.coach_businesses for SELECT to authenticated using (is_coach_business_member(id));
create policy "coach_business_owner_readwrite" on public.coach_businesses for ALL to authenticated using ((owner_user_id = auth.uid())) with check ((owner_user_id = auth.uid()));
create policy "coach_business_public_market_read" on public.coach_businesses for SELECT to authenticated using (((status = 'approved'::text) AND (marketplace_visible = true)));
create policy "coach_certificates_read" on public.coach_certificates for SELECT to authenticated using (((user_id = auth.uid()) OR is_coach_business_member(business_id) OR is_lellee_admin()));
create policy "coach_client_notes_business_insert" on public.coach_client_notes for INSERT to authenticated with check (((author_user_id = ( SELECT auth.uid() AS uid)) AND (is_coach_business_member(business_id) OR (EXISTS ( SELECT 1
   FROM coach_businesses b
  WHERE ((b.id = coach_client_notes.business_id) AND (b.owner_user_id = ( SELECT auth.uid() AS uid)))))) AND (EXISTS ( SELECT 1
   FROM coach_client_relationships r
  WHERE ((r.id = coach_client_notes.relationship_id) AND (r.business_id = coach_client_notes.business_id))))));
create policy "coach_client_notes_business_read" on public.coach_client_notes for SELECT to authenticated using (((is_coach_business_member(business_id) OR (EXISTS ( SELECT 1
   FROM coach_businesses b
  WHERE ((b.id = coach_client_notes.business_id) AND (b.owner_user_id = ( SELECT auth.uid() AS uid)))))) AND (EXISTS ( SELECT 1
   FROM coach_client_relationships r
  WHERE ((r.id = coach_client_notes.relationship_id) AND (r.business_id = coach_client_notes.business_id))))));
create policy "coach_relationship_participants" on public.coach_client_relationships for SELECT to authenticated using (((client_user_id = auth.uid()) OR is_coach_business_member(business_id)));
create policy "consultation_coach_update" on public.coach_consultation_requests for UPDATE to authenticated using (is_coach_business_member(business_id)) with check (is_coach_business_member(business_id));
create policy "consultation_user_insert" on public.coach_consultation_requests for INSERT to authenticated with check ((user_id = auth.uid()));
create policy "consultation_user_read" on public.coach_consultation_requests for SELECT to authenticated using (((user_id = auth.uid()) OR is_coach_business_member(business_id)));
create policy "group_announcement_coach_write" on public.coach_group_announcements for INSERT to authenticated with check (((sender_user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM coach_groups g
  WHERE ((g.id = coach_group_announcements.group_id) AND is_coach_business_member(g.business_id))))));
create policy "group_announcement_participants" on public.coach_group_announcements for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM coach_groups g
  WHERE ((g.id = coach_group_announcements.group_id) AND (is_coach_business_member(g.business_id) OR (EXISTS ( SELECT 1
           FROM (coach_group_members gm
             JOIN coach_client_relationships r ON ((r.id = gm.relationship_id)))
          WHERE ((gm.group_id = g.id) AND (r.client_user_id = auth.uid()) AND (gm.status = 'active'::text)))))))));
create policy "coach_group_members_participants" on public.coach_group_members for SELECT to authenticated using (is_coach_relationship_participant(relationship_id));
create policy "group_schedule_coach_write" on public.coach_group_schedule for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM coach_groups g
  WHERE ((g.id = coach_group_schedule.group_id) AND is_coach_business_member(g.business_id))))) with check ((EXISTS ( SELECT 1
   FROM coach_groups g
  WHERE ((g.id = coach_group_schedule.group_id) AND is_coach_business_member(g.business_id)))));
create policy "group_schedule_participants" on public.coach_group_schedule for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM coach_groups g
  WHERE ((g.id = coach_group_schedule.group_id) AND (is_coach_business_member(g.business_id) OR (EXISTS ( SELECT 1
           FROM (coach_group_members gm
             JOIN coach_client_relationships r ON ((r.id = gm.relationship_id)))
          WHERE ((gm.group_id = g.id) AND (r.client_user_id = auth.uid()) AND (gm.status = 'active'::text)))))))));
create policy "coach_groups_business" on public.coach_groups for ALL to authenticated using (is_coach_business_member(business_id)) with check (is_coach_business_member(business_id));
create policy "coach_groups_public_market_read" on public.coach_groups for SELECT to authenticated using (((status = ANY (ARRAY['forming'::text, 'active'::text])) AND (EXISTS ( SELECT 1
   FROM coach_businesses b
  WHERE ((b.id = coach_groups.business_id) AND (b.status = 'approved'::text) AND (b.marketplace_visible = true))))));
create policy "coach_invites_business" on public.coach_invitations for SELECT to authenticated using (is_coach_business_member(business_id));
create policy "coach_messages_insert_participants" on public.coach_messages for INSERT to authenticated with check (((sender_user_id = auth.uid()) AND (((relationship_id IS NOT NULL) AND is_coach_relationship_participant(relationship_id)) OR ((group_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM coach_groups g
  WHERE ((g.id = coach_messages.group_id) AND is_coach_business_member(g.business_id))))))));
create policy "coach_messages_participants" on public.coach_messages for SELECT to authenticated using ((((relationship_id IS NOT NULL) AND is_coach_relationship_participant(relationship_id)) OR ((group_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM coach_groups g
  WHERE ((g.id = coach_messages.group_id) AND is_coach_business_member(g.business_id)))))));
create policy "coach_profile_programs_member" on public.coach_profile_programs for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM coach_public_profiles cp
  WHERE ((cp.id = coach_profile_programs.profile_id) AND is_coach_business_member(cp.business_id))))) with check ((EXISTS ( SELECT 1
   FROM coach_public_profiles cp
  WHERE ((cp.id = coach_profile_programs.profile_id) AND is_coach_business_member(cp.business_id)))));
create policy "coach_badges_admin_write" on public.coach_public_badges for ALL to authenticated using (is_lellee_admin()) with check (is_lellee_admin());
create policy "coach_badges_member_read" on public.coach_public_badges for SELECT to authenticated using (((EXISTS ( SELECT 1
   FROM coach_public_profiles cp
  WHERE ((cp.id = coach_public_badges.profile_id) AND is_coach_business_member(cp.business_id)))) OR is_lellee_admin()));
create policy "coach_public_profiles_admin" on public.coach_public_profiles for ALL to authenticated using (is_lellee_admin()) with check (is_lellee_admin());
create policy "coach_public_profiles_coach_insert" on public.coach_public_profiles for INSERT to authenticated with check (((coach_user_id = auth.uid()) AND is_coach_business_member(business_id)));
create policy "coach_public_profiles_coach_update" on public.coach_public_profiles for UPDATE to authenticated using (((coach_user_id = auth.uid()) AND is_coach_business_member(business_id))) with check (((coach_user_id = auth.uid()) AND is_coach_business_member(business_id)));
create policy "coach_public_profiles_member_select" on public.coach_public_profiles for SELECT to authenticated using (is_coach_business_member(business_id));
create policy "coach_schedule_business_or_client" on public.coach_schedule_events for SELECT to authenticated using ((is_coach_business_member(business_id) OR (EXISTS ( SELECT 1
   FROM coach_client_relationships r
  WHERE ((r.id = coach_schedule_events.relationship_id) AND (r.client_user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (coach_group_members gm
     JOIN coach_client_relationships r ON ((r.id = gm.relationship_id)))
  WHERE ((gm.group_id = gm.group_id) AND (gm.status = 'active'::text) AND (r.client_user_id = auth.uid()))))));
create policy "coach_schedule_business_write" on public.coach_schedule_events for ALL to authenticated using (is_coach_business_member(business_id)) with check (is_coach_business_member(business_id));
create policy "coach_services_business" on public.coach_service_packages for ALL to authenticated using (is_coach_business_member(business_id)) with check (is_coach_business_member(business_id));
create policy "coach_services_public_market_read" on public.coach_service_packages for SELECT to authenticated using (((active = true) AND (EXISTS ( SELECT 1
   FROM coach_businesses b
  WHERE ((b.id = coach_service_packages.business_id) AND (b.status = 'approved'::text) AND (b.marketplace_visible = true))))));
create policy "coach_sessions_business" on public.coach_sessions for ALL to authenticated using (is_coach_business_member(business_id)) with check (is_coach_business_member(business_id));
create policy "professional_courses_admin_delete" on public.professional_courses for DELETE to authenticated using (is_lellee_admin());
create policy "professional_courses_admin_insert" on public.professional_courses for INSERT to authenticated with check (is_lellee_admin());
create policy "professional_courses_admin_update" on public.professional_courses for UPDATE to authenticated using (is_lellee_admin()) with check (is_lellee_admin());
create policy "professional_courses_read" on public.professional_courses for SELECT to authenticated using (((status = 'published'::text) OR is_lellee_admin()));
create policy "credential_claims_owner_insert" on public.professional_credential_claims for INSERT to authenticated with check ((user_id = auth.uid()));
create policy "credential_claims_owner_or_admin" on public.professional_credential_claims for SELECT to authenticated using (((user_id = auth.uid()) OR is_lellee_admin()));
create policy "professional_enrollments_admin_delete" on public.professional_enrollments for DELETE to authenticated using (is_lellee_admin());
create policy "professional_enrollments_admin_insert" on public.professional_enrollments for INSERT to authenticated with check (is_lellee_admin());
create policy "professional_enrollments_admin_update" on public.professional_enrollments for UPDATE to authenticated using (is_lellee_admin()) with check (is_lellee_admin());
create policy "professional_enrollments_read" on public.professional_enrollments for SELECT to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_lellee_admin()));
create policy "training_records_own" on public.training_records for SELECT to authenticated using (((user_id = auth.uid()) OR is_lellee_admin()));
create policy "training_records_owner_insert" on public.training_records for INSERT to authenticated with check ((user_id = ( SELECT auth.uid() AS uid)));
CREATE OR REPLACE FUNCTION public.accept_my_coach_relationship(p_relationship_id uuid, p_accept boolean DEFAULT true, p_data_sharing_scope jsonb DEFAULT '{}'::jsonb, p_decline_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'auth'
AS $function$
declare
  uid uuid:=auth.uid();
  r public.coach_client_relationships%rowtype;
  bname text;
  svc_name text;
  quote jsonb;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select * into r
  from public.coach_client_relationships
  where id=p_relationship_id
  for update;

  if r.id is null then raise exception 'Coaching relationship not found'; end if;
  if r.client_user_id<>uid then raise exception 'Only the client can accept or decline this coaching relationship'; end if;

  select coalesce(b.public_name,b.business_name), s.name, coalesce(s.pricing_quote,s.price_quote_snapshot,'{}'::jsonb)
  into bname, svc_name, quote
  from public.coach_businesses b
  left join public.coach_service_packages s on s.id=r.service_package_id
  where b.id=r.business_id;

  if p_accept is true then
    update public.coach_client_relationships
    set status='active',
        client_acceptance_status='accepted',
        client_consented_at=now(),
        client_accepted_at=now(),
        privacy_acknowledged_at=now(),
        pricing_acknowledged_at=case when r.service_package_id is not null then now() else pricing_acknowledged_at end,
        data_sharing_scope=coalesce(p_data_sharing_scope,'{}'::jsonb),
        ended_at=null
    where id=r.id
    returning * into r;

    insert into public.coach_messages(business_id,relationship_id,sender_user_id,body)
    values (
      r.business_id,r.id,uid,
      'I accepted the coaching relationship. My private Lellee journal, check-ins, support contacts, and recovery history are not shared automatically. I will choose what to share.'
    );
  else
    update public.coach_client_relationships
    set status='declined',
        client_acceptance_status='declined',
        client_declined_at=now(),
        client_decline_reason=nullif(trim(coalesce(p_decline_reason,'')),''),
        ended_at=now()
    where id=r.id
    returning * into r;

    insert into public.coach_messages(business_id,relationship_id,sender_user_id,body)
    values (r.business_id,r.id,uid,'I declined the coaching relationship request.');
  end if;

  return jsonb_build_object(
    'relationship_id',r.id,
    'accepted',p_accept is true,
    'status',r.status,
    'client_acceptance_status',r.client_acceptance_status,
    'business_name',bname,
    'service_name',svc_name,
    'pricing_quote',coalesce(quote,'{}'::jsonb),
    'privacy_note','Private Lellee journal, check-ins, support contacts, and recovery history are not shared automatically.'
  );
end;
$function$;
