-- Executed 2026-09-06T14:02:04.945866Z: 21 grouped checks passed.
-- Run only as trusted database owner after reviewing fixture triggers.
-- Rollback-only database-role tests. No email, password, token or charge is generated.
do $qa$
declare
  owner_role text := current_user;
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); unconfirmed uuid := gen_random_uuid();
  who uuid; other_user uuid; existing_owner uuid;
  who_email text; other_email text; a_email text; b_email text;
  t text; statement text; label text; own_count bigint; other_count bigint; affected bigint;
  before_users bigint; before_placements bigint; before_progress bigint; before_subs bigint;
  before_entitlements bigint; before_hash text; after_hash text; denied boolean;
  bound_id uuid; temporary_id text; original_owner_count bigint;
  results jsonb := '[]'::jsonb;
begin
  select count(*) into before_users from auth.users;
  select count(*) into before_placements from public.placements;
  select count(*) into before_progress from public.user_progress;
  select count(*) into before_subs from public.user_subscriptions;
  select count(*) into before_entitlements from public.user_entitlements;
  select md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' order by id),'')) into before_hash from public.placements x;
  select user_id,count(*) into existing_owner,original_owner_count from public.placements group by user_id order by count(*) desc limit 1;
  a_email := 'lellee-legacy-qa-'||a::text||'@example.invalid';
  b_email := 'lellee-legacy-qa-'||b::text||'@example.invalid';
  begin
    insert into auth.users(id,email,aud,role,email_confirmed_at)
    values(a,a_email,'authenticated','authenticated',now()),(b,b_email,'authenticated','authenticated',now()),
          (unconfirmed,'lellee-legacy-qa-'||unconfirmed::text||'@example.invalid','authenticated','authenticated',null);
    insert into public.placements(id,user_email,data)
    values('qa-'||a::text,a_email,'{"synthetic":true}'::jsonb),('qa-'||b::text,b_email,'{"synthetic":true}'::jsonb);
    insert into public.user_progress(user_email,reflection_responses)
    values(a_email,'{"synthetic":true}'::jsonb),(b_email,'{"synthetic":true}'::jsonb);
    insert into public.user_subscriptions(user_email,tier,active) values(a_email,'premium',true),(b_email,'basic',true);

    foreach who in array array[a,b] loop
      label:=case when who=a then 'A' else 'B' end;
      other_user:=case when who=a then b else a end;
      who_email:=case when who=a then a_email else b_email end;
      other_email:=case when who=a then b_email else a_email end;
      perform set_config('request.jwt.claim.sub',who::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated','email',who_email)::text,true);
      execute 'set local role authenticated';
      if current_user<>'authenticated' or auth.uid() is distinct from who or public.is_lellee_admin() then
        raise exception 'Invalid ordinary-user test context';
      end if;
      foreach t in array array['placements','user_progress','user_subscriptions'] loop
        execute format('select count(*) filter(where user_id=$1),count(*) filter(where user_id<>$1) from public.%I',t)
          into own_count,other_count using who;
        if own_count<>1 or other_count<>0 then raise exception 'Legacy isolation failed for % on %',label,t; end if;
        results:=results||jsonb_build_array(jsonb_build_object('test',label||': '||t||' own-only read','own_rows',own_count,'other_rows',other_count,'pass',true));
      end loop;
      temporary_id:='qa-write-'||who::text;
      insert into public.placements(id,user_email,data) values(temporary_id,who_email,'{"synthetic":true}'::jsonb) returning user_id into bound_id;
      if bound_id is distinct from who then raise exception 'Insert compatibility owner binding failed'; end if;
      delete from public.placements where id=temporary_id;
      get diagnostics affected = row_count;
      if affected<>1 then raise exception 'Own placement delete failed'; end if;
      results:=results||jsonb_build_array(jsonb_build_object('test',label||': legacy email-only insertion binds owner; own deletion works','pass',true));
      update public.placements set data='{"synthetic":"updated"}'::jsonb where user_id=who;
      get diagnostics affected = row_count;
      if affected<>1 then raise exception 'Own placement edit failed'; end if;
      update public.user_progress set reflection_responses='{"synthetic":"updated"}'::jsonb where user_id=who;
      get diagnostics affected = row_count;
      if affected<>1 then raise exception 'Own progress edit failed'; end if;
      results:=results||jsonb_build_array(jsonb_build_object('test',label||': own placement and progress edits work','pass',true));
      update public.placements set data='{"synthetic":"forbidden"}'::jsonb where user_id=other_user;
      get diagnostics affected = row_count;
      if affected<>0 then raise exception 'Cross-user placement edit succeeded'; end if;
      update public.user_progress set assignment_response='forbidden synthetic edit' where user_id=other_user;
      get diagnostics affected = row_count;
      if affected<>0 then raise exception 'Cross-user progress edit succeeded'; end if;
      delete from public.placements where user_id=other_user;
      get diagnostics affected = row_count;
      if affected<>0 then raise exception 'Cross-user delete succeeded'; end if;
      results:=results||jsonb_build_array(jsonb_build_object('test',label||': cross-user updates and deletion affect zero rows','pass',true));
      foreach statement in array array[
        format('insert into public.placements(id,user_email,data) values(%L,%L,''{}''::jsonb)','qa-forged-'||who::text,other_email),
        format('insert into public.placements(id,user_id,user_email,data) values(%L,%L::uuid,%L,''{}''::jsonb)','qa-forged-id-'||who::text,other_user,who_email),
        format('insert into public.user_progress(user_email) values(%L)',other_email),
        format('update public.placements set user_id=%L::uuid where user_id=auth.uid()',other_user),
        format('update public.placements set user_email=%L where user_id=auth.uid()',other_email),
        format('update public.user_progress set user_id=%L::uuid where user_id=auth.uid()',other_user),
        format('update public.user_progress set user_email=%L where user_id=auth.uid()',other_email),
        'update public.user_progress set certificate_issued=true,certificate_issued_at=now() where user_id=auth.uid()',
        format('insert into public.user_progress(user_email,certificate_issued) values(%L,true)',who_email),
        format('insert into public.user_subscriptions(user_email,tier,active) values(%L,''premium'',true)',who_email),
        'update public.user_subscriptions set tier=''premium'',active=true where user_id=auth.uid()',
        'delete from public.user_subscriptions where user_id=auth.uid()'
      ] loop
        denied:=false;
        begin execute statement; exception when insufficient_privilege then denied:=true; end;
        if not denied then raise exception 'Expected privileged or forged legacy write was not denied'; end if;
      end loop;
      results:=results||jsonb_build_array(jsonb_build_object('test',label||': 12 forged-owner, ownership-change, certificate, and subscription write attempts denied','pass',true));
      execute format('set local role %I',owner_role);
    end loop;

    -- Reassign ONLY the fixture email addresses; stable UUID ownership must not move.
    update auth.users set email='new-'||a_email where id=a;
    update auth.users set email=a_email where id=b;
    foreach who in array array[a,b] loop
      perform set_config('request.jwt.claim.sub',who::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated','email',case when who=a then 'new-'||a_email else a_email end)::text,true);
      execute 'set local role authenticated';
      foreach t in array array['placements','user_progress','user_subscriptions'] loop
        execute format('select count(*) filter(where user_id=$1),count(*) filter(where user_id<>$1) from public.%I',t)
          into own_count,other_count using who;
        if own_count<>1 or other_count<>0 then raise exception 'Email reassignment changed UUID record ownership'; end if;
      end loop;
      execute format('set local role %I',owner_role);
    end loop;
    results:=results||jsonb_build_array(jsonb_build_object('test','Email change/reuse cannot transfer previously bound records between users','pass',true));

    perform set_config('request.jwt.claim.sub',unconfirmed::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',unconfirmed,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    denied:=false;
    begin
      insert into public.placements(id,user_email,data) values('qa-unconfirmed-'||unconfirmed::text,'lellee-legacy-qa-'||unconfirmed::text||'@example.invalid','{}'::jsonb);
    exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'Unconfirmed ownership binding succeeded'; end if;
    execute format('set local role %I',owner_role);
    results:=results||jsonb_build_array(jsonb_build_object('test','Unconfirmed account cannot bind a legacy record','pass',true));

    if existing_owner is not null then
      perform set_config('request.jwt.claim.sub',existing_owner::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',existing_owner,'role','authenticated')::text,true);
      execute 'set local role authenticated';
      select count(*) filter(where user_id=existing_owner),count(*) filter(where user_id<>existing_owner) into own_count,other_count from public.placements;
      if own_count<>original_owner_count or other_count<>0 then raise exception 'Existing record owner lost access or gained fixture access'; end if;
      execute format('set local role %I',owner_role);
      results:=results||jsonb_build_array(jsonb_build_object('test','Existing owner retains original placements and sees no other-user fixtures','own_rows',own_count,'other_rows',other_count,'pass',true));
    end if;

    perform set_config('request.jwt.claim.sub','',true);
    perform set_config('request.jwt.claims','{"role":"anon"}',true);
    execute 'set local role anon';
    if current_user<>'anon' or auth.uid() is not null then raise exception 'Invalid anonymous context'; end if;
    foreach t in array array['placements','user_progress','user_subscriptions'] loop
      denied:=false;
      begin execute format('select count(*) from public.%I',t); exception when insufficient_privilege then denied:=true; end;
      if not denied then raise exception 'Anonymous SELECT not denied on %',t; end if;
      results:=results||jsonb_build_array(jsonb_build_object('test','Anonymous read denied on '||t,'pass',true));
    end loop;
    foreach statement in array array[
      format('insert into public.placements(id,user_email,data) values(%L,%L,''{}''::jsonb)','qa-anon-'||a::text,a_email),
      'update public.placements set data=''{}''::jsonb where false',
      'delete from public.placements where false',
      format('insert into public.user_progress(user_email) values(%L)',a_email),
      format('insert into public.user_subscriptions(user_email,tier) values(%L,''premium'')',a_email)
    ] loop
      denied:=false;
      begin execute statement; exception when insufficient_privilege then denied:=true; end;
      if not denied then raise exception 'Anonymous legacy write not denied'; end if;
    end loop;
    execute format('set local role %I',owner_role);
    results:=results||jsonb_build_array(jsonb_build_object('test','Five anonymous write attempts denied','pass',true));
    raise exception using errcode='ZX002',message='ROLLBACK_LEGACY_QA_FIXTURES';
  exception when sqlstate 'ZX002' then null; end;

  select md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' order by id),'')) into after_hash from public.placements x;
  if before_hash is distinct from after_hash or (select count(*) from auth.users)<>before_users
     or (select count(*) from public.placements)<>before_placements or (select count(*) from public.user_progress)<>before_progress
     or (select count(*) from public.user_subscriptions)<>before_subs or (select count(*) from public.user_entitlements)<>before_entitlements
     or exists(select 1 from auth.users where id in(a,b,unconfirmed)) then
    raise exception 'Fixture rollback or production record preservation failed';
  end if;
  perform set_config('lellee.qa_legacy_report',jsonb_build_object('checked_at',now(),'test_mode','PostgreSQL roles and simulated JWT claims, not Auth/browser sessions','groups_passed',jsonb_array_length(results),'results',results,'fixtures_rolled_back',true,'original_placement_records_unchanged',true,'users_after',(select count(*) from auth.users),'placements_after',(select count(*) from public.placements),'progress_after',(select count(*) from public.user_progress),'subscriptions_after',(select count(*) from public.user_subscriptions),'paid_entitlements_after',(select count(*) from public.user_entitlements))::text,true);
end $qa$;
select current_setting('lellee.qa_legacy_report')::jsonb as legacy_security_test_report;
