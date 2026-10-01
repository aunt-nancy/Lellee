begin;

create or replace function private.admin_set_professional_course_checkout_v2(
  p_course_key text,
  p_enabled boolean,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  c public.professional_courses%rowtype;
  issues jsonb;
  payment_url text;
  expected text;
begin
  if not private.is_professional_key_admin(uid) then
    raise exception 'Key administrator access required';
  end if;

  select * into c
  from public.professional_courses
  where course_key=p_course_key
  for update;

  if c.id is null then raise exception 'Course not found'; end if;

  expected:=case
    when p_enabled then 'ENABLE CHECKOUT '||c.course_key
    else 'DISABLE CHECKOUT '||c.course_key
  end;

  if trim(coalesce(p_confirmation,''))<>expected then
    raise exception 'Confirmation text must exactly match %',expected;
  end if;

  if p_enabled then
    if c.status<>'published' then
      raise exception 'Course must be published before checkout can be enabled';
    end if;

    issues:=private.professional_course_release_issues(c.id);
    if jsonb_array_length(issues)>0 then
      raise exception 'Course checkout blocked: %',issues::text;
    end if;

    select value into payment_url
    from public.app_public_settings
    where key=c.payment_setting_key;

    if payment_url is null
       or payment_url !~ '^https://buy\.stripe\.com/' then
      raise exception 'Approved Stripe Payment Link is not configured';
    end if;
  end if;

  update public.professional_courses
  set checkout_enabled=p_enabled,
      updated_at=now()
  where id=c.id;

  update public.professional_course_payment_setup
  set setup_status=case when p_enabled then 'active' else 'disabled' end,
      updated_at=now()
  where course_id=c.id;

  insert into public.admin_audit_log(
    actor_user_id,entity_type,entity_id,action,
    changed_fields,action_label,workspace
  )
  values(
    uid,'professional_course',c.id::text,
    case when p_enabled then 'enable_course_checkout'
         else 'disable_course_checkout' end,
    array['checkout_enabled'],
    case when p_enabled
      then 'Enabled professional course checkout'
      else 'Disabled professional course checkout'
    end,
    'professional_training'
  );

  return jsonb_build_object(
    'course_key',c.course_key,
    'checkout_enabled',p_enabled,
    'stripe_setup_status',case when p_enabled then 'active' else 'disabled' end
  );
end;
$$;

commit;