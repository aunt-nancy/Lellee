-- Executed successfully on Lellee project vnfjszmhmcxkxegzvivg at
-- 2026-09-06T10:46:35Z: 18 result groups passed; fixtures rolled back.
-- Run as the trusted database owner. This simulates Postgres roles/JWT claims;
-- it does NOT replace real Auth token verification or browser-session tests.
-- All fixture users and paid-access rows are rolled back, including on failure.

do $qa$
declare
  v_original_role text := current_user;
  v_a uuid := gen_random_uuid();
  v_b uuid := gen_random_uuid();
  v_user uuid;
  v_admin uuid;
  v_label text;
  v_table text;
  v_sql text;
  v_own integer;
  v_other integer;
  v_denied boolean;
  v_results jsonb := '[]'::jsonb;
  v_users_before bigint;
  v_entitlements_before bigint;
begin
  select count(*) into v_users_before from auth.users;
  select count(*) into v_entitlements_before from public.user_entitlements;
  select user_id into v_admin from public.admin_user_roles where role='admin' and active order by created_at limit 1;
  if v_admin is null then raise exception 'QA requires an existing active Admin'; end if;

  begin
    insert into auth.users(id,email,aud,role)
    values(v_a,'lellee-security-qa-'||v_a::text||'@example.invalid','authenticated','authenticated'),
          (v_b,'lellee-security-qa-'||v_b::text||'@example.invalid','authenticated','authenticated');
    insert into public.user_entitlements(user_id,entitlement_key,status,source,current_period_end)
    values(v_a,'premium','active','promotion',now()+interval '1 day'),
          (v_b,'plus','active','promotion',now()+interval '1 day');

    foreach v_user in array array[v_a,v_b]
    loop
      v_label := case when v_user=v_a then 'User A' else 'User B' end;
      perform set_config('request.jwt.claim.sub',v_user::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',v_user,'role','authenticated')::text,true);
      execute 'set local role authenticated';
      if current_user<>'authenticated' or auth.uid() is distinct from v_user then
        raise exception 'QA role/identity simulation failed';
      end if;
      if public.is_lellee_admin() then raise exception 'Ordinary user unexpectedly has Admin access'; end if;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test',v_label||': ordinary user is not Admin','pass',true));

      foreach v_table in array array['user_entitlements','user_privacy_mode','program_enrollments','user_program_state']
      loop
        execute format('select count(*) filter(where user_id=$1),count(*) filter(where user_id<>$1) from public.%I',v_table)
          into v_own,v_other using v_user;
        if v_own<>1 or v_other<>0 then
          raise exception 'RLS failure for % on %: own %, other %',v_label,v_table,v_own,v_other;
        end if;
        v_results := v_results || jsonb_build_array(jsonb_build_object('test',v_label||': '||v_table||' self-only read','own_rows',v_own,'other_rows',v_other,'pass',true));
      end loop;

      if not public.has_lellee_entitlement('free') or not public.has_lellee_entitlement('plus')
        or public.has_lellee_entitlement('premium') is distinct from (v_user=v_a)
        or public.has_lellee_entitlement('journal_companion') or public.has_lellee_entitlement('coach') then
        raise exception 'Tier/add-on mapping failed for %',v_label;
      end if;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test',v_label||': tier inheritance and independent add-ons','pass',true));

      foreach v_sql in array array[
        'insert into public.admin_user_roles(user_id,role,active) values(auth.uid(),''admin'',true)',
        'update public.admin_user_roles set active=true where user_id=auth.uid()',
        'insert into public.user_entitlements(user_id,entitlement_key,status,source) values(auth.uid(),''coach'',''active'',''admin'')',
        'update public.user_entitlements set entitlement_key=''coach'' where user_id=auth.uid()',
        'delete from public.user_entitlements where user_id=auth.uid()'
      ] loop
        v_denied:=false;
        begin execute v_sql; exception when insufficient_privilege then v_denied:=true; end;
        if not v_denied then raise exception 'Privileged client write was not denied: %',v_sql; end if;
      end loop;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test',v_label||': five privileged client writes denied','pass',true));

      foreach v_sql in array array[
        'select public.admin_enroll_user_in_pilot(''qa@example.invalid'',null::uuid)',
        'select public.admin_remove_pilot_enrollment(null::uuid)',
        'select public.admin_review_coach_business(null::uuid,''approved'',null::text)',
        'select public.admin_review_coach_credential(null::uuid,''verified'',null::text)',
        'select public.lellee_admin_review_organization_v3(null::uuid,''approved'',null::text)',
        'select public.lellee_admin_review_organization_v3_license(null::uuid,''active'',null::integer,null::text,null::text)'
      ] loop
        v_denied:=false;
        begin
          execute v_sql;
        exception when sqlstate 'P0001' then
          if sqlerrm='Admin access required' then v_denied:=true; else raise; end if;
        end;
        if not v_denied then raise exception 'Admin mutation guard failed: %',v_sql; end if;
      end loop;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test',v_label||': six Admin RPCs deny non-Admin caller','pass',true));
      execute format('set local role %I',v_original_role);
    end loop;

    perform set_config('request.jwt.claim.sub',v_admin::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    if not public.is_lellee_admin() then raise exception 'Existing Admin authorization failed'; end if;
    select count(*) filter(where user_id=v_admin),count(*) filter(where user_id<>v_admin) into v_own,v_other from public.admin_user_roles;
    if v_own<>1 or v_other<>0 then raise exception 'Admin role-row isolation failed'; end if;
    v_results:=v_results||jsonb_build_array(jsonb_build_object('test','Existing Admin accepted; role table self-only','pass',true));
    execute format('set local role %I',v_original_role);

    perform set_config('request.jwt.claim.sub','',true);
    perform set_config('request.jwt.claims','{"role":"anon"}',true);
    execute 'set local role anon';
    foreach v_sql in array array[
      'select public.is_lellee_admin()',
      'select public.has_lellee_entitlement(''premium'')',
      'select public.admin_remove_pilot_enrollment(null::uuid)',
      'select public.accept_coach_invite(''invalid-qa-token'')',
      'select public.enqueue_automation_event(''onboarding_step_due'',null::uuid,null::text,null::uuid,null::text,''{}''::jsonb)'
    ] loop
      v_denied:=false;
      begin execute v_sql; exception when insufficient_privilege then v_denied:=true; end;
      if not v_denied then raise exception 'Anonymous RPC call was not denied: %',v_sql; end if;
    end loop;
    v_results:=v_results||jsonb_build_array(jsonb_build_object('test','Five representative anonymous RPC calls denied','pass',true));
    execute format('set local role %I',v_original_role);

    raise exception using errcode='ZX001',message='ROLLBACK_QA_FIXTURES';
  exception when sqlstate 'ZX001' then
    null;
  end;

  if exists(select 1 from auth.users where id in(v_a,v_b))
    or exists(select 1 from public.user_entitlements where user_id in(v_a,v_b))
    or (select count(*) from auth.users)<>v_users_before
    or (select count(*) from public.user_entitlements)<>v_entitlements_before then
    raise exception 'QA fixture rollback assertion failed';
  end if;
  perform set_config('lellee.qa_security_report',jsonb_build_object(
    'checked_at',now(),'test_mode','PostgreSQL role and JWT-claim simulation; not browser sessions',
    'results',v_results,'result_groups_passed',jsonb_array_length(v_results),
    'fixtures_rolled_back',true,'users_before',v_users_before,
    'users_after',(select count(*) from auth.users),
    'paid_entitlements_before',v_entitlements_before,
    'paid_entitlements_after',(select count(*) from public.user_entitlements)
  )::text,true);
end
$qa$;
select current_setting('lellee.qa_security_report')::jsonb as security_test_report;
