-- REVIEW ONLY: do not apply to production without separate rollout approval.
-- No requirements, approvals, or backfills are seeded by this migration.
begin;

create table private.independent_coach_requirement_versions (
  version text primary key check (length(btrim(version)) between 1 and 120),
  orientation_course_id uuid not null references public.professional_courses(id),
  certification_course_id uuid not null references public.professional_courses(id),
  active boolean not null default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  check (not active or (approved_by is not null and approved_at is not null))
);
create table private.independent_coach_authorizations (
  business_id uuid not null references public.coach_businesses(id),
  coach_user_id uuid not null references auth.users(id),
  program_id uuid not null references public.programs(id),
  requirements_version text not null references private.independent_coach_requirement_versions(version),
  orientation_training_record_id uuid references public.training_records(id),
  onboarding_certificate_id uuid references public.coach_certificates(id),
  status text not null default 'pending' check (status in ('pending','approved','revoked')),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  expires_on date,
  revoked_at timestamptz,
  review_note text check (length(review_note)<=4000),
  updated_at timestamptz not null default now(),
  primary key (business_id,coach_user_id,program_id),
  check (status<>'approved' or (approved_by is not null and approved_at is not null
    and orientation_training_record_id is not null and onboarding_certificate_id is not null
    and revoked_at is null))
);
create index independent_coach_authorizations_coach_idx
  on private.independent_coach_authorizations(coach_user_id,business_id);
alter table private.independent_coach_requirement_versions enable row level security;
alter table private.independent_coach_authorizations enable row level security;
revoke all on private.independent_coach_requirement_versions,
  private.independent_coach_authorizations from public,anon,authenticated,service_role;

-- Read current database evidence rather than JWT approval claims or editable metadata.
create function private.independent_coach_is_authorized(bid uuid, coach_id uuid, pid uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists (
  select 1
  from private.independent_coach_authorizations a
  join private.independent_coach_requirement_versions v on v.version=a.requirements_version and v.active
  join public.coach_businesses b on b.id=a.business_id and b.status='approved'
  join public.coach_business_members bm on bm.business_id=b.id and bm.user_id=a.coach_user_id
    and bm.status='active' and bm.role in ('owner','admin','coach')
  join public.coach_business_programs bp on bp.business_id=b.id and bp.program_id=a.program_id and bp.status='approved'
  join public.training_records orientation on orientation.id=a.orientation_training_record_id
    and orientation.user_id=a.coach_user_id and orientation.professional_course_id=v.orientation_course_id
  join public.professional_courses oc on oc.id=v.orientation_course_id and oc.status='published'
  join public.coach_certificates cert on cert.id=a.onboarding_certificate_id
    and cert.user_id=a.coach_user_id and cert.business_id=a.business_id
  join public.training_records training on training.id=cert.training_record_id
    and training.user_id=a.coach_user_id and training.professional_course_id=v.certification_course_id
  join public.professional_courses cc on cc.id=v.certification_course_id and cc.status='published'
  where a.business_id=bid and a.coach_user_id=coach_id and a.program_id=pid
    and a.status='approved' and a.revoked_at is null
    and a.approved_by is not null and a.approved_at<=statement_timestamp()
    and v.approved_by is not null and v.approved_at<=statement_timestamp()
    and (a.expires_on is null or a.expires_on >= (statement_timestamp() at time zone 'America/Los_Angeles')::date)
    and orientation.status='completed' and orientation.verified=true
    and orientation.completed_at is not null and orientation.completed_at<=statement_timestamp()
    and (orientation.expires_on is null or orientation.expires_on >= (statement_timestamp() at time zone 'America/Los_Angeles')::date)
    and training.status='completed' and training.verified=true
    and training.completed_at is not null and training.completed_at<=statement_timestamp()
    and (training.expires_on is null or training.expires_on >= (statement_timestamp() at time zone 'America/Los_Angeles')::date)
    and cert.status='active' and cert.revoked_at is null and cert.issued_by is not null
    -- Existing certificate issuance uses database current_date, not the LA date.
    and cert.issued_on <= current_date and cert.created_at<=statement_timestamp()
    and (cert.expires_on is null or cert.expires_on >= (statement_timestamp() at time zone 'America/Los_Angeles')::date)
    and not exists (
      select 1 from public.training_records evidence
      where evidence.id in (orientation.id,training.id) and evidence.professional_enrollment_id is not null
        and not exists (select 1 from public.professional_enrollments pe
          where pe.id=evidence.professional_enrollment_id and pe.user_id=a.coach_user_id
            and pe.course_id=evidence.professional_course_id and pe.status='completed'
            and pe.verified_by is not null and pe.verified_at<=statement_timestamp())
    )
 );
$$;
revoke all on function private.independent_coach_is_authorized(uuid,uuid,uuid) from public,anon,authenticated,service_role;

create function private.require_independent_coach_service(bid uuid, coach_id uuid, pid uuid)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null and coalesce(auth.jwt()->>'role','')<>'service_role' then
   raise exception using errcode='42501',message='Sign in required';
 end if;
 if not private.independent_coach_is_authorized(bid,coach_id,pid) then
   raise exception using errcode='42501',message='Independent coaching services require current verified orientation and onboarding certification';
 end if;
 -- Approval of another coach/owner does not authorize an acting unapproved coach.
 if auth.uid() is distinct from coach_id and exists (
   select 1 from public.coach_business_members m where m.business_id=bid and m.user_id=auth.uid() and m.status='active'
 ) and not private.independent_coach_is_authorized(bid,auth.uid(),pid) then
   raise exception using errcode='42501',message='The acting coach also requires service authorization';
 end if;
end;
$$;
revoke all on function private.require_independent_coach_service(uuid,uuid,uuid) from public,anon,authenticated,service_role;

-- An invoker trigger can distinguish direct client DML from already-authorized
-- SECURITY DEFINER review/course functions (whose current_user is postgres).
-- Never use current_user inside a SECURITY DEFINER trigger for this decision.
create function private.guard_independent_coach_review_fields()
returns trigger language plpgsql security invoker set search_path=''
as $$
declare j jsonb:=to_jsonb(new);
begin
 if current_user in ('postgres','service_role','supabase_admin') then return new; end if;
 if tg_table_name='training_records' then
   if coalesce((j->>'verified')::boolean,false) or j->>'professional_course_id' is not null
      or j->>'professional_enrollment_id' is not null or j->>'training_id' is not null then
     raise exception using errcode='42501',message='Training verification and course linkage are reviewer controlled';
   end if;
 elsif j->>'verification_status' not in ('self_reported','pending')
    or j->>'verified_by' is not null or j->>'verified_at' is not null
    or coalesce((j->>'public_display_approved')::boolean,false) then
   raise exception using errcode='42501',message='Credential verification is reviewer controlled';
 end if;
 if tg_op='UPDATE' and (to_jsonb(old)->>'user_id') is distinct from (j->>'user_id') then
   raise exception using errcode='42501',message='Evidence ownership cannot be reassigned';
 end if;
 return new;
end;
$$;
revoke all on function private.guard_independent_coach_review_fields() from public,anon,authenticated,service_role;
create trigger independent_coach_training_review_fields before insert or update on public.training_records
 for each row execute function private.guard_independent_coach_review_fields();
create trigger independent_coach_credential_review_fields before insert or update on public.professional_credential_claims
 for each row execute function private.guard_independent_coach_review_fields();

create function public.admin_review_independent_coach_authorization(
 p_business_id uuid,p_coach_user_id uuid,p_program_id uuid,p_requirements_version text,
 p_orientation_training_record_id uuid,p_onboarding_certificate_id uuid,p_status text,
 p_expires_on date default null,p_note text default null)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or not public.is_lellee_admin() then
   raise exception using errcode='42501',message='Administrator access required';
 end if;
 if p_status is null or p_status not in ('pending','approved','revoked') then
   raise exception using errcode='22023',message='Invalid authorization status';
 end if;
 insert into private.independent_coach_authorizations as a
   (business_id,coach_user_id,program_id,requirements_version,orientation_training_record_id,
    onboarding_certificate_id,status,approved_by,approved_at,expires_on,revoked_at,review_note)
 values (p_business_id,p_coach_user_id,p_program_id,p_requirements_version,p_orientation_training_record_id,
   p_onboarding_certificate_id,p_status,case when p_status='approved' then auth.uid() end,
   case when p_status='approved' then statement_timestamp() end,p_expires_on,
   case when p_status='revoked' then statement_timestamp() end,p_note)
 on conflict (business_id,coach_user_id,program_id) do update set
   requirements_version=excluded.requirements_version,orientation_training_record_id=excluded.orientation_training_record_id,
   onboarding_certificate_id=excluded.onboarding_certificate_id,status=excluded.status,
   approved_by=excluded.approved_by,approved_at=excluded.approved_at,expires_on=excluded.expires_on,
   revoked_at=excluded.revoked_at,review_note=excluded.review_note,updated_at=statement_timestamp();
 if p_status='approved' and not private.independent_coach_is_authorized(p_business_id,p_coach_user_id,p_program_id) then
   raise exception using errcode='42501',message='Required orientation and certification evidence is not current or requirements are not configured';
 end if;
 insert into public.admin_audit_log(actor_user_id,entity_type,entity_id,action,changed_fields,action_label)
 values(auth.uid(),'independent_coach_authorization',p_business_id::text||'/'||p_coach_user_id::text||'/'||p_program_id::text,
   'review',array['status','requirements_version','orientation_training_record_id','onboarding_certificate_id'],
   'Independent service authorization: '||p_status);
 return true;
end;
$$;
revoke all on function public.admin_review_independent_coach_authorization(uuid,uuid,uuid,text,uuid,uuid,text,date,text) from public,anon,authenticated,service_role;
grant execute on function public.admin_review_independent_coach_authorization(uuid,uuid,uuid,text,uuid,uuid,text,date,text) to authenticated;

create function public.get_my_independent_coach_service_authorization()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception using errcode='42501',message='Sign in required'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
   'business_id',bp.business_id,'program_id',bp.program_id,
   'authorized',private.independent_coach_is_authorized(bp.business_id,auth.uid(),bp.program_id),
   'status',case when a.status='revoked' or a.revoked_at is not null or cert.status='revoked' or cert.revoked_at is not null then 'revoked'
     when a.status='approved' and (cert.status='expired'
       or a.expires_on < (statement_timestamp() at time zone 'America/Los_Angeles')::date
       or cert.expires_on < (statement_timestamp() at time zone 'America/Los_Angeles')::date
       or orientation.expires_on < (statement_timestamp() at time zone 'America/Los_Angeles')::date
       or training.expires_on < (statement_timestamp() at time zone 'America/Los_Angeles')::date) then 'expired'
     when a.status='approved' and not private.independent_coach_is_authorized(bp.business_id,auth.uid(),bp.program_id) then 'approval_attention'
     else coalesce(a.status,'new') end,
   'requirements_configured',exists(select 1 from private.independent_coach_requirement_versions v where v.active),
   'expires_on',a.expires_on
 ) order by bp.business_id,bp.program_id),'[]'::jsonb) into result
 from public.coach_business_members m
 join public.coach_business_programs bp on bp.business_id=m.business_id
 left join private.independent_coach_authorizations a on a.business_id=bp.business_id
   and a.program_id=bp.program_id and a.coach_user_id=auth.uid()
 left join public.coach_certificates cert on cert.id=a.onboarding_certificate_id
 left join public.training_records orientation on orientation.id=a.orientation_training_record_id
 left join public.training_records training on training.id=cert.training_record_id
 where m.user_id=auth.uid() and m.status='active';
 return jsonb_build_object('lane','independent','programs',result,
   'onboarding_access',true,'note','Client services require current verified orientation, onboarding certification and business approval.');
end;
$$;
revoke all on function public.get_my_independent_coach_service_authorization() from public,anon,authenticated,service_role;
grant execute on function public.get_my_independent_coach_service_authorization() to authenticated;

-- BEFORE triggers cover direct Data API writes AND SECURITY DEFINER RPC writes.
-- They do not replace ownership, client acceptance, payment or consent rules.
create function private.guard_independent_coach_service_write()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
 j jsonb:=to_jsonb(new); oldj jsonb;
 bid uuid; pid uuid; coach_id uuid; rid uuid; gid uuid;
 r public.coach_client_relationships%rowtype;
 g public.coach_groups%rowtype;
 f public.form_definitions%rowtype;
 assignment public.coach_assignments%rowtype;
 safe_keys text[];
begin
 if tg_op='UPDATE' then oldj:=to_jsonb(old); end if;
 bid:=(j->>'business_id')::uuid;
 pid:=(j->>'program_id')::uuid;
 rid:=(j->>'relationship_id')::uuid;
 gid:=(j->>'group_id')::uuid;
 coach_id:=(j->>'coach_user_id')::uuid;

 if tg_table_name='coach_businesses' then
   if not (coalesce((j->>'marketplace_visible')::boolean,false) or coalesce((j->>'public_profile_enabled')::boolean,false)) then return new; end if;
   if tg_op='UPDATE' and new.marketplace_visible is not distinct from old.marketplace_visible
      and new.public_profile_enabled is not distinct from old.public_profile_enabled
      and new.primary_program_id is not distinct from old.primary_program_id
      and new.owner_user_id is not distinct from old.owner_user_id then return new; end if;
   bid:=new.id;pid:=new.primary_program_id;coach_id:=new.owner_user_id;
 elsif tg_table_name='coach_public_profiles' then
   if not coalesce((j->>'public_visible')::boolean,false) then return new; end if;
   if tg_op='UPDATE' and new.public_visible is not distinct from old.public_visible
      and new.business_id is not distinct from old.business_id
      and new.coach_user_id is not distinct from old.coach_user_id then return new; end if;
   select bp.program_id into pid from public.coach_business_programs bp
     where bp.business_id=bid and private.independent_coach_is_authorized(bid,coach_id,bp.program_id) order by bp.program_id limit 1;
 elsif tg_table_name='coach_service_packages' then
   if not coalesce((j->>'active')::boolean,false) then return new; end if;
 elsif tg_table_name='coach_groups' then
   if j->>'status' not in ('active') and not coalesce((j->>'public_enrollment_open')::boolean,false) then return new; end if;
 elsif tg_table_name='coach_invitations' then
   if tg_op='UPDATE' and j->>'status' in ('revoked','expired','cancelled')
     and (j-array['status'])=(oldj-array['status']) then return new; end if;
 elsif tg_table_name='coach_consultation_requests' then
   if tg_op='UPDATE' and j->>'status' in ('closed','declined')
     and (j-array['status','updated_at'])=(oldj-array['status','updated_at']) then return new; end if;
 elsif tg_table_name='coach_client_relationships' then
   bid:=new.business_id;pid:=new.program_id;coach_id:=new.coach_user_id;
   safe_keys:=array['status','ended_at'];
   if auth.uid()=new.client_user_id and new.status='declined' and new.client_acceptance_status='declined' then
     safe_keys:=safe_keys||array['client_acceptance_status','client_declined_at','client_decline_reason'];
   end if;
   if j->>'service_package_id' is null then safe_keys:=array_append(safe_keys,'service_package_id'); end if;
   if tg_op='UPDATE' and j->>'status' in ('paused','ended','declined')
     and (j-safe_keys)=(oldj-safe_keys) then return new; end if;
   -- Client privacy preference changes do not activate a relationship. Revocation
   -- must remain available when a coach loses qualification.
   if tg_op='UPDATE' and auth.uid()=new.client_user_id
     and (j-array['data_sharing_scope'])=(oldj-array['data_sharing_scope']) then return new; end if;
   if new.status='active' and new.client_acceptance_status<>'accepted' then
     raise exception using errcode='42501',message='Client acceptance is required before service activation';
   end if;
 elsif tg_table_name in ('coach_schedule_events','coach_sessions') then
   if tg_table_name='coach_schedule_events' and j->>'session_scope'='admin'
      and rid is null and gid is null and j->>'consultation_request_id' is null then return new; end if;
   safe_keys:=array['status','cancelled_at','cancellation_reason','cancellation_status','refund_status',
     'refund_review_requested_at','refund_review_reason','updated_at','status_control_note'];
   if tg_op='UPDATE' and j->>'status' in ('cancelled','refund_review')
      and (j-safe_keys)=(oldj-safe_keys) then return new; end if;
   if coach_id is null then coach_id:=(j->>'created_by')::uuid; end if;
   if tg_op='INSERT' and (j->>'created_by') is not null and auth.uid() is not null
      and (j->>'created_by')::uuid<>auth.uid() and not public.is_lellee_admin() then
     raise exception using errcode='42501',message='Session creator must match the acting coach';
   end if;
 elsif tg_table_name='coach_messages' then
   if rid is not null then
     select * into r from public.coach_client_relationships where id=rid;
     if auth.uid()=r.client_user_id and (j->>'sender_user_id')::uuid=auth.uid()
        and bid=r.business_id and gid is null then return new; end if;
   end if;
   -- Read receipts are not new coaching content.
   if tg_op='UPDATE' and (j-array['read_at'])=(oldj-array['read_at']) then return new; end if;
 elsif tg_table_name='coach_group_members' then
   if tg_op='UPDATE' and j->>'status'='removed' and (j-array['status'])=(oldj-array['status']) then return new; end if;
 elsif tg_table_name='coach_assignment_recipients' then
   select * into assignment from public.coach_assignments where id=(j->>'assignment_id')::uuid;
   bid:=assignment.business_id;pid:=assignment.program_id;coach_id:=assignment.coach_user_id;
   if tg_op='UPDATE' and (j-array['completed_at'])=(oldj-array['completed_at']) then
     select * into r from public.coach_client_relationships where id=rid;
     if auth.uid()=r.client_user_id then return new; end if;
   end if;
 elsif tg_table_name='form_assignments' then
   select * into f from public.form_definitions where id=(j->>'form_id')::uuid;
   if f.business_id is null and bid is null then return new; end if;
   if bid is distinct from f.business_id or pid is distinct from f.program_id then
     raise exception using errcode='42501',message='Coach intake scope mismatch';
   end if;
   select * into r from public.coach_client_relationships where business_id=bid and program_id=pid
     and client_user_id=(j->>'user_id')::uuid and status='active' and ended_at is null;
   rid:=r.id;
   if rid is null then raise exception using errcode='42501',message='Accepted client relationship required'; end if;
   if tg_op='UPDATE' and auth.uid()=(j->>'user_id')::uuid
     and (j-array['completed_at','status'])=(oldj-array['completed_at','status']) then return new; end if;
 end if;

 if rid is not null then
   select * into r from public.coach_client_relationships where id=rid;
   if r.id is null or (bid is not null and bid is distinct from r.business_id)
      or (pid is not null and pid is distinct from r.program_id) then
     raise exception using errcode='42501',message='Coaching relationship scope mismatch';
   end if;
   bid:=r.business_id;pid:=r.program_id;
   coach_id:=coalesce(coach_id,r.coach_user_id);
   perform private.require_independent_coach_service(bid,r.coach_user_id,pid);
   if tg_table_name not in ('coach_messages') and (r.status<>'active' or r.client_acceptance_status<>'accepted' or r.ended_at is not null) then
     raise exception using errcode='42501',message='Accepted client relationship required';
   end if;
 end if;
 if gid is not null then
   select * into g from public.coach_groups where id=gid;
   if g.id is null or (bid is not null and bid is distinct from g.business_id)
      or (pid is not null and pid is distinct from g.program_id) then
     raise exception using errcode='42501',message='Coaching group scope mismatch';
   end if;
   bid:=g.business_id;pid:=g.program_id;
 end if;
 if tg_table_name='coach_schedule_events' and j->>'consultation_request_id' is not null then
   select cr.program_id into pid from public.coach_consultation_requests cr
     where cr.id=(j->>'consultation_request_id')::uuid and cr.business_id=bid;
 end if;
 if coach_id is null then
   select m.user_id into coach_id from public.coach_business_members m
     where m.business_id=bid and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin','coach');
   if coach_id is null then select owner_user_id into coach_id from public.coach_businesses where id=bid; end if;
 end if;
 perform private.require_independent_coach_service(bid,coach_id,pid);
 return new;
end;
$$;
revoke all on function private.guard_independent_coach_service_write() from public,anon,authenticated,service_role;

do $$
declare tbl text;
begin
 foreach tbl in array array['coach_businesses','coach_public_profiles','coach_service_packages','coach_groups',
   'coach_invitations','coach_consultation_requests','coach_client_relationships','coach_schedule_events',
   'coach_sessions','coach_messages','coach_group_members','coach_group_schedule','coach_group_announcements',
   'coach_assignments','coach_assignment_recipients','coach_client_notes','form_assignments']
 loop
   execute format('create trigger independent_coach_service_gate before insert or update on public.%I for each row execute function private.guard_independent_coach_service_write()',tbl);
 end loop;
end;
$$;

-- Align the existing acceptance RPC vocabulary without changing any record.
alter table public.coach_client_relationships drop constraint coach_client_relationships_status_check;
alter table public.coach_client_relationships add constraint coach_client_relationships_status_check
 check (status in ('active','paused','ended','pending_client_acceptance','declined'));

-- Keep public listing eligibility current after expiry or revocation.
CREATE OR REPLACE FUNCTION public.get_public_coach_cards(p_program_slug text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
select case
  when not coalesce((select value='true' from public.app_public_settings where key='coach_public_marketplace_enabled'),false)
    then '[]'::jsonb
  else coalesce((
    select jsonb_agg(jsonb_build_object(
      'profile_id',cp.id,
      'public_name',cp.public_name,
      'headline',cp.headline,
      'bio',cp.bio,
      'photo_url',cp.photo_url,
      'languages',cp.languages,
      'coaching_approaches',cp.coaching_approaches,
      'credential_summary',cp.credential_summary,
      'credential_review_status',cp.credential_review_status,
      'accepting_status',cp.accepting_status,
      'business_name',b.public_name,
      'programs',coalesce((
        select jsonb_agg(jsonb_build_object(
          'slug',p.slug,'name',p.name,'specialty_label',cpp.specialty_label,
          'primary',cpp.primary_specialty
        ) order by cpp.primary_specialty desc,cpp.display_order,p.name)
        from public.coach_profile_programs cpp
        join public.programs p on p.id=cpp.program_id
        where cpp.profile_id=cp.id and private.independent_coach_is_authorized(cp.business_id,cp.coach_user_id,cpp.program_id)
      ),'[]'::jsonb),
      'badges',coalesce((
        select jsonb_agg(jsonb_build_object('key',cb.badge_key,'label',cb.badge_label) order by cb.badge_label)
        from public.coach_public_badges cb
        where cb.profile_id=cp.id and cb.status='approved'
      ),'[]'::jsonb)
    ) order by cp.public_name)
    from public.coach_public_profiles cp
    join public.coach_businesses b on b.id=cp.business_id
    where cp.profile_status='approved'
      and cp.public_visible=true
      and b.status='approved'
      and b.public_profile_enabled=true
      and b.marketplace_visible=true
      and exists(select 1 from public.coach_profile_programs scope where scope.profile_id=cp.id and private.independent_coach_is_authorized(cp.business_id,cp.coach_user_id,scope.program_id))
      and (p_program_slug is null or exists(
        select 1 from public.coach_profile_programs cpp
        join public.programs p on p.id=cpp.program_id
        where cpp.profile_id=cp.id and p.slug=p_program_slug and private.independent_coach_is_authorized(cp.business_id,cp.coach_user_id,cpp.program_id)
      ))
  ),'[]'::jsonb)
end;
$function$;
-- Invitation acceptance is explicit acceptance by the authenticated invited client.
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
    business_id,coach_user_id,client_user_id,program_id,client_consented_at,client_acceptance_status,client_accepted_at
  )
  values(inv.business_id,coach_id,auth.uid(),inv.program_id,now(),'accepted',now())
  on conflict(business_id,client_user_id,program_id)
  do update set status='active',coach_user_id=excluded.coach_user_id,client_consented_at=now(),ended_at=null,client_acceptance_status='accepted',client_accepted_at=now()
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
commit;
