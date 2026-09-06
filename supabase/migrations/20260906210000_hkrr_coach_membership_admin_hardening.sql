-- Canonical hkrr Lellee runtime: coaching membership + staff/training administration hardening.
-- Source-only checkpoint until reviewed/applied through an approved migration path.

DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_environment_baseline
    WHERE environment_key='supabase_project_ref'
      AND expected_value='hkrrxscyhtxmbvxevfkw'
  ) THEN
    RAISE EXCEPTION 'Wrong Lellee runtime project';
  END IF;
  IF to_regclass('public.coach_business_members') IS NULL
     OR to_regclass('public.coach_client_relationships') IS NULL
     OR to_regclass('public.lellee_staff_coaches') IS NULL
     OR to_regclass('public.lellee_training_enrollments') IS NULL THEN
    RAISE EXCEPTION 'Required coaching/training foundation is incomplete';
  END IF;
END $check$;

-- Read helpers used by RLS. They remain side-effect free and use fixed object qualification.
CREATE OR REPLACE FUNCTION public.is_coach_business_member(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=''
AS $fn$
  SELECT auth.uid() IS NOT NULL AND EXISTS(
    SELECT 1
    FROM public.coach_business_members m
    WHERE m.business_id=p_business_id
      AND m.user_id=auth.uid()
      AND m.status='active'
  )
$fn$;

CREATE OR REPLACE FUNCTION public.is_coach_relationship_participant(p_relationship_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=''
AS $fn$
  SELECT auth.uid() IS NOT NULL AND EXISTS(
    SELECT 1
    FROM public.coach_client_relationships r
    WHERE r.id=p_relationship_id
      AND (r.client_user_id=auth.uid() OR public.is_coach_business_member(r.business_id))
  )
$fn$;

-- Build 5 helpers are also used inside RLS policies. Anonymous evaluation must safely return false.
CREATE OR REPLACE FUNCTION public.lellee_build5_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=''
AS $fn$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') IN ('admin','owner','service_role')
$fn$;

CREATE OR REPLACE FUNCTION public.lellee_build5_is_supervisor_of(p_coach_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=''
AS $fn$
  SELECT public.lellee_build5_is_admin()
      OR (auth.uid() IS NOT NULL AND EXISTS(
        SELECT 1 FROM public.lellee_staff_coaches c
        WHERE c.user_id=p_coach_user_id
          AND c.supervisor_user_id=auth.uid()
      ))
$fn$;

-- Coach-client invitations: require an authenticated active member, an approved business,
-- and an approved program assignment for that business.
CREATE OR REPLACE FUNCTION public.create_coach_invite(
  p_business_id uuid,
  p_program_id uuid,
  p_email text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $fn$
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
$fn$;

CREATE OR REPLACE FUNCTION public.accept_coach_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $fn$
DECLARE
  caller uuid:=auth.uid();
  inv public.coach_invitations%rowtype;
  rel_id uuid;
  coach_id uuid;
  caller_email text;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION USING errcode='42501',message='Authentication required';
  END IF;
  IF p_token IS NULL OR length(p_token)<16 OR length(p_token)>256 THEN
    RAISE EXCEPTION USING errcode='22023',message='Invitation is invalid or expired';
  END IF;

  SELECT lower(btrim(u.email)) INTO caller_email
  FROM auth.users u
  WHERE u.id=caller
    AND u.email_confirmed_at IS NOT NULL
    AND u.deleted_at IS NULL;
  IF caller_email IS NULL THEN
    RAISE EXCEPTION USING errcode='42501',message='A verified account is required';
  END IF;

  SELECT * INTO inv
  FROM public.coach_invitations i
  WHERE i.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
    AND i.status='pending'
    AND i.expires_at>statement_timestamp()
  FOR UPDATE;

  IF inv.id IS NULL THEN
    RAISE EXCEPTION USING errcode='22023',message='Invitation is invalid or expired';
  END IF;
  IF caller_email<>lower(btrim(inv.invited_email)) THEN
    RAISE EXCEPTION USING errcode='42501',message='Sign in with the email address that was invited';
  END IF;
  IF NOT EXISTS(
    SELECT 1 FROM public.coach_businesses b
    WHERE b.id=inv.business_id AND b.status='approved'
  ) OR NOT EXISTS(
    SELECT 1 FROM public.coach_business_programs bp
    WHERE bp.business_id=inv.business_id
      AND bp.program_id=inv.program_id
      AND bp.status='approved'
  ) THEN
    RAISE EXCEPTION USING errcode='42501',message='This coaching invitation is no longer active';
  END IF;

  SELECT m.user_id INTO coach_id
  FROM public.coach_business_members m
  WHERE m.business_id=inv.business_id
    AND m.role IN ('owner','coach')
    AND m.status='active'
  ORDER BY (m.role='owner') DESC,m.created_at
  LIMIT 1;
  IF coach_id IS NULL THEN
    RAISE EXCEPTION USING errcode='42501',message='No active coach is available for this invitation';
  END IF;

  INSERT INTO public.coach_client_relationships(
    business_id,coach_user_id,client_user_id,program_id,status,client_consented_at,started_at,ended_at
  ) VALUES(
    inv.business_id,coach_id,caller,inv.program_id,'active',statement_timestamp(),statement_timestamp(),NULL
  )
  ON CONFLICT(business_id,client_user_id,program_id) DO UPDATE SET
    coach_user_id=excluded.coach_user_id,
    status='active',
    client_consented_at=excluded.client_consented_at,
    started_at=excluded.started_at,
    ended_at=NULL
  RETURNING id INTO rel_id;

  UPDATE public.coach_invitations
  SET status='accepted',accepted_by=caller,accepted_at=statement_timestamp()
  WHERE id=inv.id;
  RETURN rel_id;
END
$fn$;

-- Admin/service activation must never treat a missing identity as authorization.
CREATE OR REPLACE FUNCTION public.lellee_admin_activate_staff_coach(
  p_user_id uuid,
  p_employee_id text,
  p_supervisor_user_id uuid DEFAULT NULL,
  p_display_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $fn$
DECLARE v_training jsonb;
BEGIN
  IF coalesce(auth.jwt()->>'role','')<>'service_role'
     AND (auth.uid() IS NULL OR NOT public.lellee_build5_is_admin()) THEN
    RAISE EXCEPTION USING errcode='42501',message='Admin/service authorization required';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=p_user_id AND u.deleted_at IS NULL) THEN
    RAISE EXCEPTION USING errcode='22023',message='Target account does not exist';
  END IF;

  INSERT INTO public.lellee_professional_profiles(user_id,professional_type,public_name,status)
  VALUES(p_user_id,'w2_coach',coalesce(nullif(btrim(p_display_name),''),'Lellee Coach'),'training')
  ON CONFLICT(user_id) DO UPDATE SET professional_type='w2_coach',public_name=excluded.public_name,status='training',updated_at=now();

  INSERT INTO public.lellee_staff_coaches(user_id,employee_id,employment_status,training_stage,supervisor_user_id)
  VALUES(p_user_id,nullif(btrim(p_employee_id),''),'training','orientation',p_supervisor_user_id)
  ON CONFLICT(user_id) DO UPDATE SET employee_id=excluded.employee_id,employment_status='training',supervisor_user_id=excluded.supervisor_user_id,updated_at=now();

  INSERT INTO public.lellee_staff_coach_public_profiles(user_id,display_name)
  VALUES(p_user_id,coalesce(nullif(btrim(p_display_name),''),'Lellee Coach'))
  ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,updated_at=now();

  UPDATE public.lellee_staff_coach_applications SET status='hired',updated_at=now() WHERE user_id=p_user_id;

  INSERT INTO public.lellee_training_enrollments(
    user_id,course_key,learner_type,status,payment_status,total_cents,paid_percent,current_unlock_percent,started_at
  ) VALUES(p_user_id,'staff_orientation','staff','active','not_required',0,100,100,now())
  ON CONFLICT(user_id,course_key) DO UPDATE SET
    status='active',payment_status='not_required',paid_percent=100,current_unlock_percent=100,
    started_at=coalesce(public.lellee_training_enrollments.started_at,now()),updated_at=now()
  RETURNING jsonb_build_object('enrollment_id',id,'status',status) INTO v_training;

  PERFORM public.lellee_build5_refresh_training_access((v_training->>'enrollment_id')::uuid);
  RETURN jsonb_build_object('activated',true,'user_id',p_user_id,'employment_class','w2','training',v_training);
END
$fn$;

-- Payment/installment administration: authenticated Admin or explicit service-role JWT only.
CREATE OR REPLACE FUNCTION public.lellee_record_training_installment(
  p_enrollment_id uuid,
  p_installment_number integer,
  p_external_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $fn$
DECLARE
  v_installment public.lellee_training_installments%rowtype;
  v_paid integer;
  v_total integer;
  v_percent numeric;
BEGIN
  IF coalesce(auth.jwt()->>'role','')<>'service_role'
     AND (auth.uid() IS NULL OR NOT public.lellee_build5_is_admin()) THEN
    RAISE EXCEPTION USING errcode='42501',message='Admin/service authorization required';
  END IF;

  UPDATE public.lellee_training_installments
     SET status='paid',paid_at=now(),external_reference=p_external_reference,updated_at=now()
   WHERE enrollment_id=p_enrollment_id
     AND installment_number=p_installment_number
     AND status<>'paid'
   RETURNING * INTO v_installment;

  IF v_installment.id IS NULL THEN
    SELECT * INTO v_installment
    FROM public.lellee_training_installments
    WHERE enrollment_id=p_enrollment_id AND installment_number=p_installment_number;
  END IF;
  IF v_installment.id IS NULL THEN RAISE EXCEPTION 'Installment not found'; END IF;

  SELECT coalesce(sum(amount_cents),0) INTO v_paid
  FROM public.lellee_training_installments
  WHERE enrollment_id=p_enrollment_id AND status='paid';
  SELECT total_cents INTO v_total
  FROM public.lellee_training_enrollments WHERE id=p_enrollment_id;
  IF v_total IS NULL THEN RAISE EXCEPTION 'Enrollment not found'; END IF;

  v_percent:=CASE WHEN v_total=0 THEN 100 ELSE least(100,round((v_paid::numeric/v_total::numeric)*100,2)) END;
  UPDATE public.lellee_training_enrollments SET
    paid_cents=v_paid,
    paid_percent=v_percent,
    current_unlock_percent=greatest(current_unlock_percent,v_installment.unlock_percent_after),
    payment_status=CASE WHEN v_paid>=v_total THEN 'paid' ELSE 'partial' END,
    status='active',started_at=coalesce(started_at,now()),updated_at=now()
  WHERE id=p_enrollment_id;

  PERFORM public.lellee_build5_refresh_training_access(p_enrollment_id);
  RETURN jsonb_build_object('paid_cents',v_paid,'paid_percent',v_percent,'unlock_percent',v_installment.unlock_percent_after);
END
$fn$;

-- Match table grants to the already read-only RLS model. Mutations remain through reviewed functions/service_role.
REVOKE ALL ON TABLE
  public.coach_business_members,
  public.coach_client_relationships,
  public.coach_invitations,
  public.lellee_professional_profiles,
  public.lellee_staff_coaches,
  public.lellee_staff_coach_applications,
  public.lellee_training_enrollments,
  public.lellee_training_installments,
  public.lellee_training_progress,
  public.lellee_coach_privileges,
  public.lellee_release_checks
FROM public,anon,authenticated;

GRANT SELECT ON TABLE
  public.coach_business_members,
  public.coach_client_relationships,
  public.coach_invitations,
  public.lellee_professional_profiles,
  public.lellee_staff_coaches,
  public.lellee_staff_coach_applications,
  public.lellee_training_enrollments,
  public.lellee_training_installments,
  public.lellee_training_progress,
  public.lellee_coach_privileges,
  public.lellee_release_checks
TO authenticated;

-- Approved public coach cards may still be read through their dedicated public-profile table/policy.
REVOKE ALL ON TABLE public.lellee_staff_coach_public_profiles FROM public,anon,authenticated;
GRANT SELECT ON TABLE public.lellee_staff_coach_public_profiles TO anon,authenticated;

GRANT ALL PRIVILEGES ON TABLE
  public.coach_business_members,
  public.coach_client_relationships,
  public.coach_invitations,
  public.lellee_professional_profiles,
  public.lellee_staff_coaches,
  public.lellee_staff_coach_public_profiles,
  public.lellee_staff_coach_applications,
  public.lellee_training_enrollments,
  public.lellee_training_installments,
  public.lellee_training_progress,
  public.lellee_coach_privileges,
  public.lellee_release_checks
TO service_role;

-- Remove anonymous execution from private/member/admin RPCs. Public discovery RPCs are intentionally not changed here.
REVOKE ALL ON FUNCTION public.create_coach_invite(uuid,uuid,text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.accept_coach_invite(text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.is_coach_business_member(uuid) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.is_coach_relationship_participant(uuid) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lellee_admin_activate_staff_coach(uuid,text,uuid,text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lellee_set_coach_privilege(uuid,text,text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lellee_submit_staff_coach_interest(text,text,text[],text[],boolean) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lellee_build5_refresh_training_access(uuid) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lellee_record_training_installment(uuid,integer,text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lellee_request_training_enrollment(text,integer) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lellee_start_training_module(uuid) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lellee_complete_training_module(uuid,numeric,text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lellee_refresh_release_checks() FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.handle_new_coach_business_owner() FROM public,anon,authenticated;

GRANT EXECUTE ON FUNCTION public.create_coach_invite(uuid,uuid,text),public.accept_coach_invite(text),
  public.is_coach_business_member(uuid),public.is_coach_relationship_participant(uuid),
  public.lellee_admin_activate_staff_coach(uuid,text,uuid,text),public.lellee_set_coach_privilege(uuid,text,text),
  public.lellee_submit_staff_coach_interest(text,text,text[],text[],boolean),
  public.lellee_build5_refresh_training_access(uuid),public.lellee_record_training_installment(uuid,integer,text),
  public.lellee_request_training_enrollment(text,integer),public.lellee_start_training_module(uuid),
  public.lellee_complete_training_module(uuid,numeric,text),public.lellee_refresh_release_checks()
TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_coach_business_owner() TO service_role;

-- RLS policies on public approved coach profiles evaluate these two side-effect-free helpers for all roles.
REVOKE ALL ON FUNCTION public.lellee_build5_is_admin(),public.lellee_build5_is_supervisor_of(uuid) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lellee_build5_is_admin(),public.lellee_build5_is_supervisor_of(uuid)
TO anon,authenticated,service_role;

DO $verify$
DECLARE sig text; tbl text;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'public.create_coach_invite(uuid,uuid,text)',
    'public.accept_coach_invite(text)',
    'public.lellee_admin_activate_staff_coach(uuid,text,uuid,text)',
    'public.lellee_set_coach_privilege(uuid,text,text)',
    'public.lellee_submit_staff_coach_interest(text,text,text[],text[],boolean)',
    'public.lellee_build5_refresh_training_access(uuid)',
    'public.lellee_record_training_installment(uuid,integer,text)',
    'public.lellee_request_training_enrollment(text,integer)',
    'public.lellee_start_training_module(uuid)',
    'public.lellee_complete_training_module(uuid,numeric,text)',
    'public.lellee_refresh_release_checks()'
  ] LOOP
    IF has_function_privilege('anon',sig,'EXECUTE') THEN
      RAISE EXCEPTION 'Anonymous private/admin function execution remains: %',sig;
    END IF;
  END LOOP;

  FOREACH tbl IN ARRAY ARRAY[
    'public.coach_business_members','public.coach_client_relationships','public.coach_invitations',
    'public.lellee_professional_profiles','public.lellee_staff_coaches','public.lellee_staff_coach_applications',
    'public.lellee_training_enrollments','public.lellee_training_installments','public.lellee_training_progress',
    'public.lellee_coach_privileges','public.lellee_release_checks'
  ] LOOP
    IF has_table_privilege('anon',tbl,'INSERT') OR has_table_privilege('anon',tbl,'UPDATE')
       OR has_table_privilege('anon',tbl,'DELETE') OR has_table_privilege('anon',tbl,'TRUNCATE') THEN
      RAISE EXCEPTION 'Anonymous write privilege remains on %',tbl;
    END IF;
    IF has_table_privilege('authenticated',tbl,'INSERT') OR has_table_privilege('authenticated',tbl,'UPDATE')
       OR has_table_privilege('authenticated',tbl,'DELETE') OR has_table_privilege('authenticated',tbl,'TRUNCATE') THEN
      RAISE EXCEPTION 'Direct authenticated write privilege remains on %',tbl;
    END IF;
  END LOOP;

  IF NOT has_table_privilege('anon','public.lellee_staff_coach_public_profiles','SELECT') THEN
    RAISE EXCEPTION 'Approved public staff-coach profile read path was lost';
  END IF;
END $verify$;
