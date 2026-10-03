create or replace function public.update_my_coach_service(
  p_service_id uuid,
  p_name text,
  p_description text default null,
  p_service_type text default null,
  p_billing_model text default null,
  p_price_amount numeric default null,
  p_sessions_included integer default null,
  p_group_capacity integer default null,
  p_individual_touchpoints integer default null,
  p_active boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  s public.coach_service_packages%rowtype;
  next_type text;
  next_billing text;
  next_active boolean;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into s from public.coach_service_packages where id=p_service_id for update;
  if s.id is null then raise exception 'Coaching service not found'; end if;
  if not public.is_coach_business_member(s.business_id) then raise exception 'Coach business access required'; end if;
  if char_length(trim(coalesce(p_name,'')))<2 then raise exception 'Service name is required'; end if;
  next_type:=coalesce(p_service_type,s.service_type);
  if next_type not in ('one_to_one','group','hybrid') then raise exception 'Invalid service type'; end if;
  next_billing:=coalesce(p_billing_model,s.billing_model);
  if next_billing not in ('per_session','monthly','package','free') then raise exception 'Invalid billing model'; end if;
  if p_price_amount is not null and p_price_amount<0 then raise exception 'Price cannot be negative'; end if;
  if p_sessions_included is not null and p_sessions_included<0 then raise exception 'Sessions included cannot be negative'; end if;
  if p_group_capacity is not null and (p_group_capacity<2 or p_group_capacity>50) then raise exception 'Group capacity must be between 2 and 50'; end if;
  if p_individual_touchpoints is not null and p_individual_touchpoints<0 then raise exception 'Individual touchpoints cannot be negative'; end if;
  next_active:=coalesce(p_active,s.active);
  update public.coach_service_packages
  set name=trim(p_name),description=nullif(trim(coalesce(p_description,'')),''),
      service_type=next_type,billing_model=next_billing,
      price_amount=case when next_billing='free' then 0 else p_price_amount end,
      sessions_included=p_sessions_included,group_capacity=p_group_capacity,
      individual_touchpoints=p_individual_touchpoints,active=next_active,updated_at=now()
  where id=s.id;
  return jsonb_build_object('service_id',s.id,'active',next_active,'service_type',next_type,'billing_model',next_billing);
end;
$$;

revoke all on function public.update_my_coach_service(uuid,text,text,text,text,numeric,integer,integer,integer,boolean) from public, anon;
grant execute on function public.update_my_coach_service(uuid,text,text,text,text,numeric,integer,integer,integer,boolean) to authenticated, service_role;

create or replace function public.update_my_coach_lead(
  p_lead_id uuid,
  p_name text default null,
  p_email text default null,
  p_phone text default null,
  p_source text default null,
  p_interested_service_id uuid default null,
  p_status text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog, auth
as $$
declare
  uid uuid := auth.uid();
  l public.coach_leads%rowtype;
  next_status text;
  normalized_email text;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into l from public.coach_leads where id=p_lead_id for update;
  if l.id is null then raise exception 'Lead not found'; end if;
  if not public.is_coach_business_member(l.business_id) then raise exception 'Coach business access required'; end if;
  normalized_email:=nullif(lower(trim(coalesce(p_email,''))),'');
  next_status:=coalesce(p_status,l.status);
  if next_status not in ('new','contacted','consultation','invited','converted','closed') then raise exception 'Invalid lead status'; end if;
  if p_interested_service_id is not null and not exists(
    select 1 from public.coach_service_packages s where s.id=p_interested_service_id and s.business_id=l.business_id
  ) then raise exception 'Interested service belongs to a different coaching business'; end if;
  if next_status='converted' then
    if normalized_email is null then raise exception 'A lead email is required before marking converted'; end if;
    if not exists(
      select 1 from public.coach_client_relationships r
      join auth.users u on u.id=r.client_user_id
      where r.business_id=l.business_id and lower(u.email)=normalized_email and r.status in ('active','paused')
    ) then raise exception 'Lead cannot be marked converted until the client accepts a coaching invitation'; end if;
  end if;
  update public.coach_leads
  set name=nullif(trim(coalesce(p_name,'')),''),
      email=normalized_email,phone=nullif(trim(coalesce(p_phone,'')),''),
      source=nullif(trim(coalesce(p_source,'')),''),
      interested_service_id=p_interested_service_id,status=next_status,
      notes=nullif(trim(coalesce(p_notes,'')),''),
      updated_at=now()
  where id=l.id;
  return jsonb_build_object('lead_id',l.id,'status',next_status);
end;
$$;

revoke all on function public.update_my_coach_lead(uuid,text,text,text,text,uuid,text,text) from public, anon;
grant execute on function public.update_my_coach_lead(uuid,text,text,text,text,uuid,text,text) to authenticated, service_role;

create or replace function public.accept_coach_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog, auth, extensions
as $$
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
$$;

revoke all on function public.accept_coach_invite(text) from public, anon;
grant execute on function public.accept_coach_invite(text) to authenticated, service_role;
