create or replace function public.update_my_coach_credential(
  p_claim_id uuid,
  p_label text,
  p_credential_type text,
  p_issuer text default null,
  p_credential_number_masked text default null,
  p_issued_on date default null,
  p_expires_on date default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  c public.professional_credential_claims%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into c from public.professional_credential_claims where id=p_claim_id for update;
  if c.id is null then raise exception 'Credential claim not found'; end if;
  if c.user_id<>uid or c.business_id is null or not public.is_coach_business_member(c.business_id) then
    raise exception 'Credential claim access required';
  end if;
  if c.verification_status='revoked' then
    raise exception 'Revoked credential claims cannot be edited. Add a new claim instead.';
  end if;
  if char_length(trim(coalesce(p_label,'')))<2 then raise exception 'Credential label is required'; end if;
  update public.professional_credential_claims
  set label=trim(p_label),credential_type=p_credential_type,
      issuer=nullif(trim(coalesce(p_issuer,'')),''),
      credential_number_masked=nullif(trim(coalesce(p_credential_number_masked,'')),''),
      issued_on=p_issued_on,expires_on=p_expires_on,
      verification_status='self_reported',verified_by=null,verified_at=null,
      public_display_approved=false,updated_at=now()
  where id=c.id;
  insert into public.credential_verification_events(
    credential_claim_id,verification_status,method,note,verified_by
  ) values(c.id,'self_reported','coach_edit','Credential owner edited the claim; prior verification state was cleared.',null);
  return jsonb_build_object('claim_id',c.id,'verification_status','self_reported','review_required',true);
end;
$$;
revoke all on function public.update_my_coach_credential(uuid,text,text,text,text,date,date) from public,anon;
grant execute on function public.update_my_coach_credential(uuid,text,text,text,text,date,date) to authenticated,service_role;

create or replace function public.update_my_training_record(
  p_record_id uuid,
  p_title text,
  p_hours numeric default null,
  p_status text default null,
  p_completed_at timestamptz default null,
  p_expires_on date default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  tr public.training_records%rowtype;
  next_status text;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into tr from public.training_records where id=p_record_id for update;
  if tr.id is null then raise exception 'Training record not found'; end if;
  if tr.user_id<>uid then raise exception 'Training record access required'; end if;
  if tr.professional_course_id is not null or tr.professional_enrollment_id is not null then
    raise exception 'Course-generated training records are managed by Professional Training and cannot be manually edited';
  end if;
  if tr.verified then raise exception 'Verified training records cannot be manually edited'; end if;
  if char_length(trim(coalesce(p_title,'')))<2 then raise exception 'Training title is required'; end if;
  if p_hours is not null and p_hours<0 then raise exception 'Training hours cannot be negative'; end if;
  next_status:=coalesce(p_status,tr.status);
  if next_status not in ('assigned','in_progress','completed','expired') then raise exception 'Invalid training status'; end if;
  if next_status='completed' and p_completed_at is null then raise exception 'Completed training requires a completion date'; end if;
  update public.training_records
  set title=trim(p_title),hours=p_hours,status=next_status,
      completed_at=case when next_status='completed' then p_completed_at else null end,
      expires_on=p_expires_on
  where id=tr.id;
  return jsonb_build_object('record_id',tr.id,'status',next_status);
end;
$$;
revoke all on function public.update_my_training_record(uuid,text,numeric,text,timestamptz,date) from public,anon;
grant execute on function public.update_my_training_record(uuid,text,numeric,text,timestamptz,date) to authenticated,service_role;

create or replace function public.update_my_coach_intake_form(
  p_form_id uuid,
  p_title text,
  p_description text default null,
  p_questions text[] default array[]::text[],
  p_action text default 'publish'
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  f public.form_definitions%rowtype;
  next_version integer;
  vid uuid;
  q text;
  n integer:=0;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into f from public.form_definitions where id=p_form_id and form_type='intake' for update;
  if f.id is null then raise exception 'Intake form not found'; end if;
  if f.business_id is null or not public.is_coach_business_member(f.business_id) then raise exception 'Coach business access required'; end if;
  if p_action not in ('publish','retire') then raise exception 'Invalid intake form action'; end if;
  if p_action='retire' then
    update public.form_definitions set status='retired',updated_at=now() where id=f.id;
    update public.form_versions set status='retired'
    where form_id=f.id and version_number=f.current_version and status='published';
    return jsonb_build_object('form_id',f.id,'status','retired','version',f.current_version);
  end if;
  if char_length(trim(coalesce(p_title,'')))<2 then raise exception 'Form title is required'; end if;
  if p_questions is null or cardinality(p_questions)=0 then raise exception 'At least one intake question is required'; end if;
  next_version:=f.current_version+1;
  update public.form_versions set status='retired'
  where form_id=f.id and version_number=f.current_version and status='published';
  insert into public.form_versions(form_id,version_number,status,instructions,created_by,published_at)
  values(f.id,next_version,'published','Complete this intake form and choose what you want to share with your coach.',uid,now())
  returning id into vid;
  foreach q in array p_questions loop
    if nullif(trim(q),'') is not null then
      n:=n+1;
      insert into public.form_questions(form_version_id,question_key,prompt,question_type,required,display_order,sensitive)
      values(vid,'q'||n::text,trim(q),'long_text',false,n*10,false);
    end if;
  end loop;
  if n=0 then raise exception 'At least one non-empty intake question is required'; end if;
  update public.form_definitions
  set title=trim(p_title),description=nullif(trim(coalesce(p_description,'')),''),
      current_version=next_version,status='published',updated_at=now()
  where id=f.id;
  return jsonb_build_object('form_id',f.id,'status','published','version',next_version);
end;
$$;
revoke all on function public.update_my_coach_intake_form(uuid,text,text,text[],text) from public,anon;
grant execute on function public.update_my_coach_intake_form(uuid,text,text,text[],text) to authenticated,service_role;

create or replace function public.assign_coach_intake_form(
  p_form_id uuid,
  p_client_user_id uuid,
  p_due_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
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
$$;
revoke all on function public.assign_coach_intake_form(uuid,uuid,timestamptz) from public,anon;
grant execute on function public.assign_coach_intake_form(uuid,uuid,timestamptz) to authenticated,service_role;
