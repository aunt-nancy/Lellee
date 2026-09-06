-- Canonical hkrr follow-up: fix PL/pgSQL name ambiguity in coach business review RPC.
-- No policy, UI, pricing, billing, or Auth changes.

create or replace function public.admin_review_coach_business(
  p_business_id uuid,
  p_decision text,
  p_review_note text default null
)
returns boolean language plpgsql security definer set search_path=''
as $fn$
declare caller uuid:=auth.uid(); v_program_id uuid;
begin
  if caller is null or not public.is_lellee_admin() then
    raise exception using errcode='42501',message='Admin access required';
  end if;
  if p_decision not in('approved','pending_review','paused','rejected') then
    raise exception using errcode='22023',message='Invalid coach business review decision';
  end if;
  if p_decision='rejected' and length(btrim(coalesce(p_review_note,'')))=0 then
    raise exception using errcode='22023',message='A review note is required when changes are requested';
  end if;
  if length(coalesce(p_review_note,''))>4000 then
    raise exception using errcode='22023',message='Review note is too long';
  end if;

  select cb.primary_program_id into v_program_id
  from public.coach_businesses cb
  where cb.id=p_business_id
  for update;
  if v_program_id is null then return false; end if;

  update public.coach_businesses set
    status=p_decision,
    review_note=nullif(btrim(p_review_note),''),
    reviewed_at=clock_timestamp(),
    approved_at=case when p_decision='approved' then clock_timestamp() else approved_at end,
    approved_by=case when p_decision='approved' then caller else approved_by end,
    marketplace_visible=case when p_decision='approved' then marketplace_visible else false end,
    updated_at=clock_timestamp()
  where id=p_business_id;

  insert into public.coach_business_programs(business_id,program_id,status)
  values(p_business_id,v_program_id,
    case when p_decision='approved' then 'approved'
         when p_decision='paused' then 'paused'
         else 'pending' end)
  on conflict(business_id,program_id) do update set status=excluded.status;
  return true;
end $fn$;

revoke all on function public.admin_review_coach_business(uuid,text,text) from public,anon,authenticated;
grant execute on function public.admin_review_coach_business(uuid,text,text) to authenticated,service_role;

do $verify$
begin
  if has_function_privilege('anon','public.admin_review_coach_business(uuid,text,text)','EXECUTE') then
    raise exception 'Anonymous coach review RPC execution remains';
  end if;
  if not has_function_privilege('authenticated','public.admin_review_coach_business(uuid,text,text)','EXECUTE') then
    raise exception 'Authenticated coach review RPC execution missing';
  end if;
end $verify$;
