-- Run as trusted database owner after reviewing fixture triggers. No persistent fixtures.
-- Simulates PostgreSQL roles/JWT claims; does not create real Auth sessions or test browsers.
-- Executed successfully 2026-09-06T17:41:51Z: 30 grouped results passed.
do $qa$
declare
 original_role text:=current_user; owners uuid[]:=array[gen_random_uuid(),gen_random_uuid()];
 supporters uuid[]:=array[gen_random_uuid(),gen_random_uuid()]; outsider uuid:=gen_random_uuid(); admin_id uuid;
 rels uuid[]; tasks uuid[]; apps uuid[]; checks uuid[]; contacts uuid[]; accepts timestamptz[];
 i int; j int; who uuid; rid uuid; xid uuid; prog uuid; badprog uuid; n int; othern int; expected_checks int;
 stamp timestamptz; t text; stmt text; scenario text; denied boolean; response boolean; d jsonb; report jsonb:='[]';
 before_counts jsonb; after_counts jsonb; ph text; sh text; ph_after text; sh_after text;
begin
 select user_id into admin_id from public.admin_user_roles where role='admin' and active order by created_at limit 1;
 select id into prog from public.programs where slug='recovery';
 select id into badprog from public.programs where slug<>'recovery' order by id limit 1;
 if admin_id is null or prog is null or badprog is null then raise exception 'Required QA baseline missing'; end if;
 select jsonb_build_object('users',(select count(*) from auth.users),'paid',(select count(*) from public.user_entitlements),
   'relationships',(select count(*) from public.trusted_circle_relationships),'shares',(select count(*) from public.trusted_circle_shares),
   'tasks',(select count(*) from public.trusted_circle_shared_tasks),'appointments',(select count(*) from public.trusted_circle_shared_appointments),
   'checkins',(select count(*) from public.trusted_circle_checkins),'contacts',(select count(*) from public.trusted_circle_emergency_contacts)) into before_counts;
 if (before_counts->>'relationships')::int<>0 or (before_counts->>'shares')::int<>0 or (before_counts->>'tasks')::int<>0
   or (before_counts->>'appointments')::int<>0 or (before_counts->>'checkins')::int<>0 or (before_counts->>'contacts')::int<>0 then
   raise exception 'Fixture harness requires reviewed empty Circle data tables'; end if;
 select md5(coalesce(string_agg(to_jsonb(x)::text,'' order by id),'')) into ph from public.placements x;
 select md5(coalesce(string_agg(to_jsonb(x)::text,'' order by program_id),'')) into sh from public.program_collaboration_settings x;
 begin
  insert into auth.users(id,email,aud,role,email_confirmed_at)
    select x,'circle-content-qa-'||x||'@example.invalid','authenticated','authenticated',now()
    from unnest(owners||supporters||array[outsider]) x;
  for i in 1..2 loop
    who:=owners[i]; perform set_config('request.jwt.claim.sub',who::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
    if current_user<>'authenticated' or auth.uid() is distinct from who or public.is_lellee_admin() then raise exception 'Owner identity assertion'; end if;
    rid:=public.invite_trusted_circle_member('circle-content-qa-'||supporters[i]||'@example.invalid','friend'); rels[i]:=rid;
    d:=public.get_my_trusted_circle_summary(); if jsonb_array_length(d->'people')<>1 or (d#>>'{summary,active_shares}')::int<>0 then raise exception 'Pending owner summary'; end if;
    execute format('set local role %I',original_role);
    who:=supporters[i]; perform set_config('request.jwt.claim.sub',who::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
    d:=public.get_my_supporter_dashboard(); if jsonb_array_length(d->'invitations')<>1 or (d#>>'{summary,tasks}')::int<>0 then raise exception 'Pending supporter summary'; end if;
    response:=public.accept_trusted_circle_invitation(rid); if not response then raise exception 'Accept failed'; end if;
    execute format('set local role %I',original_role); select accepted_at into stamp from public.trusted_circle_relationships where id=rid; accepts[i]:=stamp;
    report:=report||jsonb_build_array(jsonb_build_object('test','Pair '||i||': owner and supporter invitation summaries plus verified acceptance','pass',true));
    who:=owners[i]; perform set_config('request.jwt.claim.sub',who::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
    insert into public.trusted_circle_shared_tasks(owner_user_id,relationship_id,title,status,due_on) values(who,rid,'QA content task '||i,'open',current_date+1) returning id into xid; tasks[i]:=xid;
    insert into public.trusted_circle_shared_appointments(owner_user_id,relationship_id,title,starts_at) values(who,rid,'QA content appointment '||i,now()+interval '1 day') returning id into xid; apps[i]:=xid;
    insert into public.trusted_circle_checkins(owner_user_id,relationship_id,title,status) values(who,rid,'QA content request '||i,'requested') returning id into xid; checks[i]:=xid;
    insert into public.trusted_circle_emergency_contacts(user_id,label,phone_masked) values(who,'QA private contact '||i,'QA private phone') returning id into xid; contacts[i]:=xid;
    update public.trusted_circle_shared_tasks set note='Owner edit' where id=tasks[i]; get diagnostics n=row_count; if n<>1 then raise exception 'Own task edit'; end if;
    update public.trusted_circle_emergency_contacts set priority_order=1 where id=contacts[i]; get diagnostics n=row_count; if n<>1 then raise exception 'Own contact edit'; end if;
    d:=public.get_my_trusted_circle_summary();
    if jsonb_array_length(d->'tasks')<>1 or jsonb_array_length(d->'appointments')<>1 or jsonb_array_length(d->'checkins')<>1 or jsonb_array_length(d->'emergency_contacts')<>1 then raise exception 'Owner populated summary'; end if;
    report:=report||jsonb_build_array(jsonb_build_object('test','Owner '||i||': four record types, allowed edits and populated summary','pass',true));
    foreach stmt in array array[
      format('update public.trusted_circle_shared_tasks set owner_user_id=%L where id=%L',supporters[i],tasks[i]),
      format('update public.trusted_circle_shared_tasks set created_at=now() where id=%L',tasks[i]),
      format('update public.trusted_circle_shared_appointments set program_id=%L where id=%L',prog,apps[i]),
      format('update public.trusted_circle_checkins set relationship_id=%L where id=%L',rid,checks[i]),
      format('update public.trusted_circle_checkins set completed_at=now() where id=%L',checks[i]),
      format('update public.trusted_circle_emergency_contacts set user_id=%L where id=%L',supporters[i],contacts[i]),
      format('update public.trusted_circle_emergency_contacts set automatic_contact_allowed=true where id=%L',contacts[i]),
      'update public.trusted_circle_guardrails set enabled=false'
    ] loop
      denied:=false; begin execute stmt; exception when insufficient_privilege then denied:=true; end;
      if not denied then raise exception 'Protected write allowed: %',stmt; end if;
    end loop;
    update public.program_collaboration_settings set collaboration_enabled=true; get diagnostics n=row_count; if n<>0 then raise exception 'Non-Admin changed program settings'; end if;
    report:=report||jsonb_build_array(jsonb_build_object('test','Owner '||i||': eight protected writes and Admin-only settings changes denied','pass',true));
    execute format('set local role %I',original_role);
    who:=supporters[i]; perform set_config('request.jwt.claim.sub',who::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
    if current_user<>'authenticated' or auth.uid() is distinct from who then raise exception 'Supporter identity assertion'; end if;
    d:=public.get_my_supporter_dashboard();
    if (d#>>'{summary,tasks}')::int<>0 or (d#>>'{summary,appointments}')::int<>0 or (d#>>'{summary,checkins}')::int<>1 or d?'emergency_contacts' then raise exception 'Pre-grant visibility incorrect'; end if;
    select count(*) into n from public.trusted_circle_emergency_contacts; if n<>0 then raise exception 'Emergency contact disclosure'; end if;
    report:=report||jsonb_build_array(jsonb_build_object('test','Supporter '||i||': tasks/appointments require grants; explicit check-in request only; contacts hidden','pass',true));
    execute format('set local role %I',original_role);
    who:=owners[i]; perform set_config('request.jwt.claim.sub',who::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
    insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key) values(who,rid,'shared_tasks'),(who,rid,'shared_appointments');
    execute format('set local role %I',original_role);
  end loop;
  for i in 1..2 loop
    who:=supporters[i]; perform set_config('request.jwt.claim.sub',who::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
    foreach t in array array['trusted_circle_shared_tasks','trusted_circle_shared_appointments','trusted_circle_checkins'] loop
      execute format('select count(*) filter(where owner_user_id=$1),count(*) filter(where owner_user_id<>$1) from public.%I',t) into n,othern using owners[i];
      if n<>1 or othern<>0 then raise exception 'Recipient isolation on %',t; end if;
    end loop;
    d:=public.get_my_supporter_dashboard(); if jsonb_array_length(d->'tasks')<>1 or jsonb_array_length(d->'appointments')<>1 or jsonb_array_length(d->'checkins')<>1 then raise exception 'Populated supporter summary'; end if;
    update public.trusted_circle_shared_tasks set title='Forged' where id=tasks[i]; get diagnostics n=row_count; if n<>0 then raise exception 'Supporter rewrote owner content'; end if;
    delete from public.trusted_circle_checkins where id=checks[i]; get diagnostics n=row_count; if n<>0 then raise exception 'Supporter deleted owner request'; end if;
    denied:=false; begin perform public.get_collaboration_operations_summary(); exception when sqlstate 'P0001' then if sqlerrm='Admin access required' then denied:=true; else raise; end if; end;
    if not denied then raise exception 'Ordinary access to Admin summary'; end if;
    report:=report||jsonb_build_array(jsonb_build_object('test','Supporter '||i||': scoped content and summary, direct mutations/Admin summary denied','pass',true));
    execute format('set local role %I',original_role);
    who:=owners[i]; perform set_config('request.jwt.claim.sub',who::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
    denied:=false; begin insert into public.trusted_circle_shared_tasks(owner_user_id,relationship_id,title) values(who,rels[3-i],'Forged relationship'); exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'Forged recipient allowed'; end if;
    denied:=false; begin insert into public.trusted_circle_emergency_contacts(user_id,relationship_id,label) values(who,rels[3-i],'Forged contact'); exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'Forged emergency relationship'; end if;
    update public.trusted_circle_shared_appointments set title='Other edit' where id=apps[3-i]; get diagnostics n=row_count; if n<>0 then raise exception 'Cross-owner appointment edit'; end if;
    report:=report||jsonb_build_array(jsonb_build_object('test','Owner '||i||': forged recipient/contact and cross-owner edit denied','pass',true));
    execute format('set local role %I',original_role);
  end loop;
  foreach scenario in array array['future_grant','expired_grant','revoked_grant','paused_grant','wrong_program_grant','paused_scope','paused_role','paused_relationship','ended_relationship','newer_consent','cancelled_records'] loop
    update public.trusted_circle_shares set status='active',revoked_at=null,starts_at=statement_timestamp()-interval '1 minute',expires_at=null,program_id=null where relationship_id=rels[1];
    update public.trusted_circle_relationships set status='active',revoked_at=null,accepted_at=accepts[1] where id=rels[1];
    update public.trusted_circle_roles set status='active' where role_key='friend';
    update public.trusted_circle_share_scopes set status='active' where scope_key in('shared_tasks','shared_appointments');
    update public.trusted_circle_shared_tasks set status='open' where id=tasks[1];
    update public.trusted_circle_shared_appointments set status='scheduled' where id=apps[1];
    update public.trusted_circle_checkins set status='requested' where id=checks[1];
    expected_checks:=1;
    case scenario
      when 'future_grant' then update public.trusted_circle_shares set starts_at=now()+interval '1 day',expires_at=now()+interval '2 days' where relationship_id=rels[1];
      when 'expired_grant' then update public.trusted_circle_shares set starts_at=now()-interval '2 days',expires_at=now()-interval '1 day' where relationship_id=rels[1];
      when 'revoked_grant' then update public.trusted_circle_shares set status='revoked',revoked_at=now() where relationship_id=rels[1];
      when 'paused_grant' then update public.trusted_circle_shares set status='paused' where relationship_id=rels[1];
      when 'wrong_program_grant' then update public.trusted_circle_shares set program_id=prog where relationship_id=rels[1];
      when 'paused_scope' then update public.trusted_circle_share_scopes set status='paused' where scope_key in('shared_tasks','shared_appointments');
      when 'paused_role' then update public.trusted_circle_roles set status='paused' where role_key='friend'; expected_checks:=0;
      when 'paused_relationship' then update public.trusted_circle_relationships set status='paused' where id=rels[1]; expected_checks:=0;
      when 'ended_relationship' then update public.trusted_circle_relationships set status='ended',revoked_at=now() where id=rels[1]; expected_checks:=0;
      when 'newer_consent' then update public.trusted_circle_relationships set accepted_at=clock_timestamp()+interval '1 second' where id=rels[1]; expected_checks:=0;
      when 'cancelled_records' then
        update public.trusted_circle_shared_tasks set status='cancelled' where id=tasks[1];
        update public.trusted_circle_shared_appointments set status='cancelled' where id=apps[1];
        update public.trusted_circle_checkins set status='cancelled' where id=checks[1]; expected_checks:=0;
    end case;
    who:=supporters[1]; perform set_config('request.jwt.claim.sub',who::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
    d:=public.get_my_supporter_dashboard();
    if (d#>>'{summary,tasks}')::int<>0 or (d#>>'{summary,appointments}')::int<>0 or (d#>>'{summary,checkins}')::int<>expected_checks
       or jsonb_array_length(d->'tasks')<>0 or jsonb_array_length(d->'appointments')<>0 then raise exception 'Content/summary lifecycle regression %',scenario; end if;
    response:=public.respond_trusted_circle_item('task',tasks[1],'completed'); if response then raise exception 'Revoked task response allowed %',scenario; end if;
    if expected_checks=0 then response:=public.respond_trusted_circle_item('checkin',checks[1],'acknowledged'); if response then raise exception 'Inactive checkin response allowed'; end if; end if;
    report:=report||jsonb_build_array(jsonb_build_object('test','Content reads, dashboard counts and response deny: '||scenario,'pass',true));
    execute format('set local role %I',original_role);
  end loop;
  update public.trusted_circle_shares set status='active',revoked_at=null,starts_at=statement_timestamp()-interval '1 minute',expires_at=null,program_id=null where relationship_id=rels[1];
  update public.trusted_circle_relationships set status='active',revoked_at=null,accepted_at=accepts[1] where id=rels[1];
  update public.trusted_circle_roles set status='active' where role_key='friend';
  update public.trusted_circle_share_scopes set status='active' where scope_key in('shared_tasks','shared_appointments');
  update public.trusted_circle_shared_tasks set status='open',assigned_to='owner' where id=tasks[1];
  update public.trusted_circle_shared_appointments set status='scheduled' where id=apps[1];
  update public.trusted_circle_checkins set status='requested' where id=checks[1];
  who:=supporters[1]; perform set_config('request.jwt.claim.sub',who::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
  response:=public.respond_trusted_circle_item('task',tasks[1],'completed'); if response then raise exception 'Owner-assigned task response allowed'; end if;
  denied:=false; begin perform public.respond_trusted_circle_item('appointment',apps[1],'completed'); exception when invalid_parameter_value then denied:=true; end; if not denied then raise exception 'Invalid response type'; end if;
  execute format('set local role %I',original_role); update public.trusted_circle_shared_tasks set assigned_to='shared' where id=tasks[1];
  execute 'set local role authenticated';
  response:=public.respond_trusted_circle_item('task',tasks[1],'in_progress'); if not response then raise exception 'Allowed task response failed'; end if;
  response:=public.respond_trusted_circle_item('task',tasks[1],'completed'); if not response then raise exception 'Allowed task completion failed'; end if;
  response:=public.respond_trusted_circle_item('task',tasks[1],'completed'); if response then raise exception 'Completed task response replay'; end if;
  response:=public.respond_trusted_circle_item('checkin',checks[1],'acknowledged','Synthetic answer'); if not response then raise exception 'Allowed checkin response failed'; end if;
  report:=report||jsonb_build_array(jsonb_build_object('test','Allowed supporter task/check-in responses; assignment restriction, invalid type and completion replay denied','pass',true));
  execute format('set local role %I',original_role);
  update public.trusted_circle_relationships set program_id=prog where id=rels[2];
  who:=owners[2]; perform set_config('request.jwt.claim.sub',who::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
  insert into public.trusted_circle_shared_tasks(owner_user_id,relationship_id,title) values(who,rels[2],'QA program task') returning id into xid;
  select count(*) into n from public.trusted_circle_shared_tasks where id=xid and program_id=prog; if n<>1 then raise exception 'Program compatibility failed'; end if;
  denied:=false; begin insert into public.trusted_circle_shared_tasks(owner_user_id,relationship_id,program_id,title) values(who,rels[2],badprog,'Wrong program'); exception when insufficient_privilege then denied:=true; end; if not denied then raise exception 'Wrong program accepted'; end if;
  insert into public.trusted_circle_shares(owner_user_id,relationship_id,program_id,scope_key) values(who,rels[2],prog,'shared_tasks');
  execute format('set local role %I',original_role);
  who:=supporters[2]; perform set_config('request.jwt.claim.sub',who::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
  select count(*) into n from public.trusted_circle_shared_tasks where id=xid; if n<>1 then raise exception 'Valid program grant unreadable'; end if;
  execute format('set local role %I',original_role); update public.program_collaboration_settings set collaboration_enabled=false where program_id=prog;
  execute 'set local role authenticated'; select count(*) into n from public.trusted_circle_shared_tasks where id=xid; if n<>0 then raise exception 'Disabled program access'; end if;
  execute format('set local role %I',original_role); update public.program_collaboration_settings set collaboration_enabled=true where program_id=prog;
  report:=report||jsonb_build_array(jsonb_build_object('test','Program adoption, exact grant match, wrong-program rejection and program-disable enforcement','pass',true));
  who:=owners[1]; perform set_config('request.jwt.claim.sub',who::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
  response:=public.respond_trusted_circle_relationship(rels[1],'pause'); if not response then raise exception 'Pause failed'; end if;
  rid:=public.invite_trusted_circle_member('circle-content-qa-'||supporters[1]||'@example.invalid','friend'); if rid<>rels[1] then raise exception 'Reinvite mismatch'; end if;
  execute format('set local role %I',original_role);
  who:=supporters[1]; perform set_config('request.jwt.claim.sub',who::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
  response:=public.accept_trusted_circle_invitation(rid); if not response then raise exception 'Fresh accept failed'; end if;
  d:=public.get_my_supporter_dashboard(); if jsonb_array_length(d->'tasks')<>0 or jsonb_array_length(d->'appointments')<>0 or jsonb_array_length(d->'checkins')<>0 then raise exception 'Old content revived'; end if;
  execute format('set local role %I',original_role);
  who:=owners[1]; perform set_config('request.jwt.claim.sub',who::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
  insert into public.trusted_circle_shared_tasks(owner_user_id,relationship_id,title) values(who,rid,'QA newly selected task') returning id into xid;
  insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key) values(who,rid,'shared_tasks');
  execute format('set local role %I',original_role);
  who:=supporters[1]; perform set_config('request.jwt.claim.sub',who::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
  d:=public.get_my_supporter_dashboard(); if jsonb_array_length(d->'tasks')<>1 or (d#>>'{tasks,0,id}')::uuid<>xid or jsonb_array_length(d->'checkins')<>0 then raise exception 'Fresh selection response'; end if;
  report:=report||jsonb_build_array(jsonb_build_object('test','Renewed acceptance keeps old content hidden; fresh explicit task and grant work','pass',true));
  execute format('set local role %I',original_role);
  who:=owners[1]; perform set_config('request.jwt.claim.sub',who::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
  response:=public.revoke_trusted_circle_relationship(rid); if not response then raise exception 'Revoke failed'; end if;
  d:=public.get_my_trusted_circle_summary(); if jsonb_array_length(d->'tasks')<>2 or jsonb_array_length(d->'emergency_contacts')<>1 then raise exception 'Owner lost own history'; end if;
  delete from public.trusted_circle_shared_tasks where id=xid; get diagnostics n=row_count; if n<>1 then raise exception 'Owner delete after revocation'; end if;
  execute format('set local role %I',original_role);
  who:=supporters[1]; perform set_config('request.jwt.claim.sub',who::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
  d:=public.get_my_supporter_dashboard(); if (d#>>'{summary,people}')::int<>0 or (d#>>'{summary,tasks}')::int<>0 or (d#>>'{summary,checkins}')::int<>0 then raise exception 'Revoked supporter dashboard'; end if;
  report:=report||jsonb_build_array(jsonb_build_object('test','Relationship revocation removes content; owner history and deletion retained','pass',true));
  execute format('set local role %I',original_role);
  foreach who in array array[outsider,admin_id] loop
    perform set_config('request.jwt.claim.sub',who::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true); execute 'set local role authenticated';
    foreach t in array array['trusted_circle_shared_tasks','trusted_circle_shared_appointments','trusted_circle_checkins','trusted_circle_emergency_contacts'] loop
      execute format('select count(*) from public.%I',t) into n; if n<>0 then raise exception 'Outsider/Admin automatic content access %',t; end if;
    end loop;
    d:=public.get_my_trusted_circle_summary(); if jsonb_array_length(d->'tasks')<>0 or jsonb_array_length(d->'emergency_contacts')<>0 then raise exception 'Unrelated owner summary'; end if;
    response:=public.respond_trusted_circle_item('task',tasks[2],'completed'); if response then raise exception 'Unrelated response'; end if;
    if who=admin_id then
      d:=public.get_collaboration_operations_summary(); if jsonb_array_length(d->'guardrails')<>9 or d::text like '%QA content%' or d::text like '%QA private%' then raise exception 'Admin summary shape/content boundary'; end if;
    end if;
    report:=report||jsonb_build_array(jsonb_build_object('test',case when who=admin_id then 'Admin metadata summary works without automatic content/contact access' else 'Unrelated user has no content, contact or response access' end,'pass',true));
    execute format('set local role %I',original_role);
  end loop;
  perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated"}',true); execute 'set local role authenticated';
  denied:=false; begin perform public.get_my_trusted_circle_summary(); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Missing subject accepted'; end if;
  execute format('set local role %I',original_role); perform set_config('request.jwt.claims','{"role":"anon"}',true); execute 'set local role anon';
  foreach t in array array['trusted_circle_shared_tasks','trusted_circle_shared_appointments','trusted_circle_checkins','trusted_circle_emergency_contacts','program_collaboration_settings','trusted_circle_guardrails'] loop
    denied:=false; begin execute format('select count(*) from public.%I',t); exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'Anonymous table access %',t; end if;
  end loop;
  foreach stmt in array array['select public.get_my_trusted_circle_summary()','select public.get_my_supporter_dashboard()',
    'select public.get_collaboration_operations_summary()','select public.respond_trusted_circle_item(''task'',null::uuid,''completed'')'] loop
    denied:=false; begin execute stmt; exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'Anonymous RPC access'; end if;
  end loop;
  report:=report||jsonb_build_array(jsonb_build_object('test','Missing subject and ten anonymous table/RPC operations denied','pass',true));
  execute format('set local role %I',original_role);
  raise exception using errcode='ZX001',message='ROLLBACK_CIRCLE_CONTENT_FIXTURES';
 exception when sqlstate 'ZX001' then null;
 end;
 select jsonb_build_object('users',(select count(*) from auth.users),'paid',(select count(*) from public.user_entitlements),
   'relationships',(select count(*) from public.trusted_circle_relationships),'shares',(select count(*) from public.trusted_circle_shares),
   'tasks',(select count(*) from public.trusted_circle_shared_tasks),'appointments',(select count(*) from public.trusted_circle_shared_appointments),
   'checkins',(select count(*) from public.trusted_circle_checkins),'contacts',(select count(*) from public.trusted_circle_emergency_contacts)) into after_counts;
 select md5(coalesce(string_agg(to_jsonb(x)::text,'' order by id),'')) into ph_after from public.placements x;
 select md5(coalesce(string_agg(to_jsonb(x)::text,'' order by program_id),'')) into sh_after from public.program_collaboration_settings x;
 if before_counts is distinct from after_counts or ph is distinct from ph_after or sh is distinct from sh_after
   or exists(select 1 from auth.users where id=any(owners||supporters||array[outsider])) then raise exception 'Fixture rollback/data preservation failed'; end if;
 perform set_config('lellee.circle_content_report',jsonb_build_object('checked_at',clock_timestamp(),
   'mode','PostgreSQL roles/simulated JWT claims, not live Auth/browser sessions','results',report,'groups_passed',jsonb_array_length(report),
   'before',before_counts,'after',after_counts,'fixtures_rolled_back',true,'placements_and_program_settings_unchanged',true)::text,true);
end $qa$;
select current_setting('lellee.circle_content_report')::jsonb as circle_content_report;
