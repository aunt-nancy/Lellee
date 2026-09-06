-- Passed 24 grouped checks on 2026-09-06T15:52:26Z in project vnfjszmhmcxkxegzvivg.
-- Run as trusted database owner only after reviewing fixture-trigger behavior.
-- The audited coaching tables were empty; this is not a fresh-schema bootstrap.
-- Rollback-only coaching sharing regression test. No passwords, emails or live tokens.
do $qa$
declare
  v_role text:=current_user;
  u uuid[]:=array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  b uuid[]:=array[gen_random_uuid(),gen_random_uuid()];
  r uuid[]:=array[gen_random_uuid(),gen_random_uuid()];
  s uuid[]:=array[gen_random_uuid(),gen_random_uuid()];
  p uuid[];
  v_admin uuid; v_user uuid; v_tmp uuid; i int; j int; n int; m int;
  v_sql text; v_state text; v_denied boolean; v_context jsonb;
  results jsonb:='[]'; counts_before jsonb; counts_after jsonb; placement_hash text;
begin
  select array_agg(id order by id) into p from (select id from public.programs order by id limit 2) z;
  if array_length(p,1)<>2 then raise exception 'Two existing programs required'; end if;
  select user_id into v_admin from public.admin_user_roles where role='admin' and active order by created_at limit 1;
  if v_admin is null then raise exception 'Existing Admin required'; end if;
  select jsonb_build_object('users',(select count(*) from auth.users),'businesses',(select count(*) from public.coach_businesses),
    'relationships',(select count(*) from public.coach_client_relationships),'shares',(select count(*) from public.coach_shared_items),
    'members',(select count(*) from public.coach_business_members),'paid',(select count(*) from public.user_entitlements)) into counts_before;
  select md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' order by id),'')) into placement_hash from public.placements x;
  begin
    insert into auth.users(id,email,aud,role)
      select x,'share-qa-'||x::text||'@example.invalid','authenticated','authenticated' from unnest(u) x;
    for i in 1..2 loop
      insert into public.coach_businesses(id,owner_user_id,business_name,public_name,primary_program_id)
        values(b[i],u[i+2],'Synthetic QA','Synthetic QA',p[i]);
      insert into public.coach_client_relationships(id,business_id,coach_user_id,client_user_id,program_id,started_at,client_consented_at)
        values(r[i],b[i],u[i+2],u[i],p[i],now()-interval '3 days',now()-interval '3 days');
      insert into public.coach_shared_items(id,relationship_id,client_user_id,program_id,share_type,shared_content,shared_at)
        values(s[i],r[i],u[i],p[i],'custom','Synthetic QA only',now()-interval '1 day');
    end loop;
    insert into public.coach_business_members(business_id,user_id,role,status) values(b[1],u[5],'coach','active');

    for i in 1..2 loop
      j:=3-i;
      perform set_config('request.jwt.claim.sub',u[i]::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',u[i],'role','authenticated')::text,true);
      execute 'set local role authenticated';
      if current_user<>'authenticated' or auth.uid() is distinct from u[i] or public.is_lellee_admin() then raise exception 'Ordinary-role simulation failed'; end if;
      select count(*) filter(where client_user_id=u[i]),count(*) filter(where client_user_id<>u[i]) into n,m from public.coach_shared_items;
      if n<>1 or m<>0 then raise exception 'Client % own-only read failed',i; end if;
      results:=results||jsonb_build_array(jsonb_build_object('test','Client '||i||': own-only read','pass',true));
      v_context:=public.get_my_trust_center();
      if jsonb_array_length(v_context->'sharing')<>1 or v_context->'sharing'->0->>'id'<>s[i]::text
         or jsonb_typeof(v_context->'consents')<>'array' then raise exception 'Trust Center isolation/response failed'; end if;
      results:=results||jsonb_build_array(jsonb_build_object('test','Client '||i||': Trust Center RPC succeeds with own sharing only','pass',true));
      insert into public.coach_shared_items(relationship_id,client_user_id,program_id,share_type,title,shared_content,source_reference)
        values(r[i],u[i],p[i],'progress_summary','QA clone','Synthetic snapshot','qa') returning id into v_tmp;
      update public.coach_shared_items set title='QA edited' where id=v_tmp;
      get diagnostics n=row_count; if n<>1 then raise exception 'Own edit failed'; end if;
      delete from public.coach_shared_items where id=v_tmp;
      get diagnostics n=row_count; if n<>1 then raise exception 'Own delete failed'; end if;
      results:=results||jsonb_build_array(jsonb_build_object('test','Client '||i||': existing insert payload, owner edit and delete work','pass',true));
      foreach v_sql in array array[
        format('update public.coach_shared_items set relationship_id=%L where id=%L',r[j],s[i]),
        format('update public.coach_shared_items set client_user_id=%L where id=%L',u[j],s[i]),
        format('update public.coach_shared_items set program_id=%L where id=%L',p[j],s[i]),
        format('update public.coach_shared_items set revoked_at=null where id=%L',s[i]),
        format('update public.coach_shared_items set shared_at=now() where id=%L',s[i]),
        format('update public.coach_shared_items set id=%L where id=%L',gen_random_uuid(),s[i]),
        format('insert into public.coach_shared_items(relationship_id,client_user_id,program_id,share_type) values(%L,%L,%L,''custom'')',r[j],u[i],p[j]),
        format('insert into public.coach_shared_items(relationship_id,client_user_id,program_id,share_type) values(%L,%L,%L,''custom'')',r[i],u[i],p[j]),
        format('insert into public.coach_shared_items(relationship_id,client_user_id,program_id,share_type) values(%L,%L,%L,''custom'')',r[j],u[j],p[j])
      ] loop
        v_denied:=false;
        begin execute v_sql; exception when insufficient_privilege then v_denied:=true; end;
        if not v_denied then raise exception 'Protected write was allowed'; end if;
      end loop;
      results:=results||jsonb_build_array(jsonb_build_object('test','Client '||i||': nine forged-scope/protected-column writes denied','pass',true));
      update public.coach_shared_items set title='Not allowed' where id=s[j]; get diagnostics n=row_count;
      delete from public.coach_shared_items where id=s[j]; get diagnostics m=row_count;
      if n<>0 or m<>0 or public.revoke_my_shared_item(s[j]) then raise exception 'Cross-user mutation allowed'; end if;
      results:=results||jsonb_build_array(jsonb_build_object('test','Client '||i||': cross-user edit/delete/revoke denied','pass',true));
      execute format('set local role %I',v_role);
    end loop;

    for i in 3..5 loop
      j:=case when i=4 then 2 else 1 end;
      perform set_config('request.jwt.claim.sub',u[i]::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',u[i],'role','authenticated')::text,true);
      execute 'set local role authenticated';
      if current_user<>'authenticated' or auth.uid() is distinct from u[i] then raise exception 'Coach-role simulation failed'; end if;
      select count(*) filter(where id=s[j]),count(*) filter(where id<>s[j]) into n,m from public.coach_shared_items;
      if n<>1 or m<>0 then raise exception 'Recipient % business-scope visibility failed',i; end if;
      update public.coach_shared_items set title='Not allowed' where id=s[j]; get diagnostics n=row_count;
      delete from public.coach_shared_items where id=s[j]; get diagnostics m=row_count;
      if n<>0 or m<>0 or public.revoke_my_shared_item(s[j]) then raise exception 'Recipient mutated client share'; end if;
      results:=results||jsonb_build_array(jsonb_build_object('test','Recipient '||i||': active business access only; no client-share mutation','pass',true));
      execute format('set local role %I',v_role);
    end loop;

    foreach v_user in array array[u[6],v_admin] loop
      perform set_config('request.jwt.claim.sub',v_user::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',v_user,'role','authenticated')::text,true);
      execute 'set local role authenticated';
      select count(*) into n from public.coach_shared_items;
      if n<>0 then raise exception 'Unrelated user or Admin bypassed explicit sharing'; end if;
      if v_user=v_admin and not public.is_lellee_admin() then raise exception 'Existing Admin check regressed'; end if;
      execute format('set local role %I',v_role);
    end loop;
    results:=results||jsonb_build_array(jsonb_build_object('test','Unrelated user and platform Admin do not gain client shares','pass',true));

    foreach v_state in array array['paused','ended','active_with_end_timestamp'] loop
      update public.coach_client_relationships set status=case when v_state='active_with_end_timestamp' then 'active' else v_state end,
        ended_at=case when v_state='paused' then null else now() end where id=r[2];
      perform set_config('request.jwt.claim.sub',u[4]::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',u[4],'role','authenticated')::text,true);
      execute 'set local role authenticated'; select count(*) into n from public.coach_shared_items where id=s[2];
      if n<>0 then raise exception 'Inactive relationship still readable by coach'; end if;
      execute format('set local role %I',v_role);
      perform set_config('request.jwt.claim.sub',u[2]::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',u[2],'role','authenticated')::text,true);
      execute 'set local role authenticated'; select count(*) into n from public.coach_shared_items where id=s[2];
      if n<>1 then raise exception 'Owner lost inactive relationship history'; end if;
      v_denied:=false;
      begin
        insert into public.coach_shared_items(relationship_id,client_user_id,program_id,share_type) values(r[2],u[2],p[2],'custom');
      exception when insufficient_privilege then v_denied:=true; end;
      if not v_denied then raise exception 'New inactive-relationship share allowed'; end if;
      execute format('set local role %I',v_role);
      results:=results||jsonb_build_array(jsonb_build_object('test',v_state||': recipient read/new sharing denied; owner history retained','pass',true));
    end loop;
    update public.coach_client_relationships set status='active',ended_at=null,client_consented_at=now() where id=r[2];
    perform set_config('request.jwt.claim.sub',u[2]::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',u[2],'role','authenticated')::text,true);
    execute 'set local role authenticated';
    insert into public.coach_shared_items(relationship_id,client_user_id,program_id,share_type) values(r[2],u[2],p[2],'custom') returning id into v_tmp;
    execute format('set local role %I',v_role);
    perform set_config('request.jwt.claim.sub',u[4]::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',u[4],'role','authenticated')::text,true);
    execute 'set local role authenticated';
    select count(*) filter(where id=s[2]),count(*) filter(where id=v_tmp) into n,m from public.coach_shared_items;
    if n<>0 or m<>1 then raise exception 'Renewed consent should require a new share'; end if;
    execute format('set local role %I',v_role);
    delete from public.coach_shared_items where id=v_tmp;
    results:=results||jsonb_build_array(jsonb_build_object('test','Renewed consent does not revive old snapshots; newly shared snapshot works','pass',true));

    foreach v_state in array array['paused','removed','invited'] loop
      update public.coach_business_members set status=v_state where business_id=b[1] and user_id=u[5];
      perform set_config('request.jwt.claim.sub',u[5]::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',u[5],'role','authenticated')::text,true);
      execute 'set local role authenticated'; select count(*) into n from public.coach_shared_items where id=s[1];
      if n<>0 then raise exception 'Inactive membership still readable'; end if;
      execute format('set local role %I',v_role);
      results:=results||jsonb_build_array(jsonb_build_object('test','Membership '||v_state||': recipient read denied','pass',true));
    end loop;
    update public.coach_business_members set status='active' where business_id=b[1] and user_id=u[5];

    perform set_config('request.jwt.claim.sub',u[1]::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',u[1],'role','authenticated')::text,true);
    execute 'set local role authenticated';
    if not public.revoke_my_shared_item(s[1]) or public.revoke_my_shared_item(s[1]) then raise exception 'Owner revoke/idempotency failed'; end if;
    select count(*) into n from public.coach_shared_items where id=s[1] and revoked_at is not null;
    if n<>1 then raise exception 'Owner lost revoked copy'; end if;
    update public.coach_shared_items set title='Not allowed' where id=s[1]; get diagnostics n=row_count;
    if n<>0 then raise exception 'Revoked snapshot editable'; end if;
    v_denied:=false;
    begin update public.coach_shared_items set revoked_at=null where id=s[1]; exception when insufficient_privilege then v_denied:=true; end;
    if not v_denied then raise exception 'Client unrevocation allowed'; end if;
    v_context:=public.get_my_trust_center();
    if jsonb_array_length(v_context->'sharing')<>0 then raise exception 'Revoked share remains in active Trust Center list'; end if;
    execute format('set local role %I',v_role);
    foreach v_user in array array[u[3],u[5]] loop
      perform set_config('request.jwt.claim.sub',v_user::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',v_user,'role','authenticated')::text,true);
      execute 'set local role authenticated'; select count(*) into n from public.coach_shared_items where id=s[1];
      if n<>0 then raise exception 'Revoked snapshot still visible'; end if;
      execute format('set local role %I',v_role);
    end loop;
    results:=results||jsonb_build_array(jsonb_build_object('test','Owner revocation removes both recipient reads and active Trust Center listing; no client undo','pass',true));
    update public.coach_client_relationships set status='ended',ended_at=now() where id=r[2];
    perform set_config('request.jwt.claim.sub',u[2]::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',u[2],'role','authenticated')::text,true);
    execute 'set local role authenticated';
    if not public.revoke_my_shared_item(s[2]) then raise exception 'Owner cannot revoke after relationship ended'; end if;
    delete from public.coach_shared_items where id=s[2]; get diagnostics n=row_count;
    if n<>1 then raise exception 'Owner cannot delete revoked share'; end if;
    execute format('set local role %I',v_role);
    results:=results||jsonb_build_array(jsonb_build_object('test','Owner can revoke and delete own snapshot after relationship ends','pass',true));

    perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"anon"}',true);
    execute 'set local role anon';
    foreach v_sql in array array[
      'select count(*) from public.coach_shared_items',
      'update public.coach_shared_items set title=''Not allowed''',
      'delete from public.coach_shared_items',
      'insert into public.coach_shared_items(share_type) values(''custom'')',
      'select public.revoke_my_shared_item(null::uuid)'
    ] loop
      v_denied:=false; begin execute v_sql; exception when insufficient_privilege then v_denied:=true; end;
      if not v_denied then raise exception 'Anonymous operation allowed'; end if;
    end loop;
    execute format('set local role %I',v_role);
    results:=results||jsonb_build_array(jsonb_build_object('test','Five anonymous table/RPC operations denied','pass',true));
    raise exception using errcode='ZX001',message='ROLLBACK_SHARING_FIXTURES';
  exception when sqlstate 'ZX001' then null;
  end;
  select jsonb_build_object('users',(select count(*) from auth.users),'businesses',(select count(*) from public.coach_businesses),
    'relationships',(select count(*) from public.coach_client_relationships),'shares',(select count(*) from public.coach_shared_items),
    'members',(select count(*) from public.coach_business_members),'paid',(select count(*) from public.user_entitlements)) into counts_after;
  if counts_before is distinct from counts_after or exists(select 1 from auth.users where id=any(u)) then raise exception 'Fixture rollback failed'; end if;
  if (select md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' order by id),'')) from public.placements x) is distinct from placement_hash then raise exception 'Original placement data changed'; end if;
  perform set_config('lellee.coach_share_report',jsonb_build_object('checked_at',now(),'test_mode','PostgreSQL role and simulated JWT claims; not Auth/browser sessions',
    'results',results,'groups_passed',jsonb_array_length(results),'fixtures_rolled_back',true,'before',counts_before,'after',counts_after,'original_placements_unchanged',true)::text,true);
end
$qa$;
select current_setting('lellee.coach_share_report')::jsonb as coaching_sharing_test_report;
