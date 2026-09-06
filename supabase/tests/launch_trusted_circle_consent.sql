-- Trusted Circle regression tests: trusted SQL owner only; every fixture is rolled back.
-- Mutation results and subsequent reads are separate SQL statements to avoid expression-order/snapshot ambiguity.
do $qa$
declare
 original_role text:=current_user; a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); d uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); unconfirmed uuid:=gen_random_uuid(); admin_id uuid;
 owners uuid[]; supporters uuid[]; rels uuid[]:='{}'; shares uuid[]:='{}'; accepted_times timestamptz[]:='{}'; programs uuid[];
 actor uuid; rid uuid; sid uuid; scoped_rel uuid:=gen_random_uuid(); i int; n int; other_n int; changed int; accepted_time timestamptz; scenario text; sql_text text; denied boolean; action_ok boolean; replay_ok boolean;
 results jsonb:='[]'; before_counts jsonb; after_counts jsonb; placement_hash text; after_hash text; lookup_hash text;
begin
 owners:=array[a,c]; supporters:=array[b,d];
 select user_id into admin_id from public.admin_user_roles where role='admin' and active limit 1;
 select array_agg(id) into programs from(select id from public.programs order by id limit 2) p;
 if admin_id is null or array_length(programs,1)<>2 then raise exception 'Test requires active Admin and two existing programs'; end if;
 select jsonb_build_object('users',(select count(*) from auth.users),'relationships',(select count(*) from public.trusted_circle_relationships),'shares',(select count(*) from public.trusted_circle_shares),'paid',(select count(*) from public.user_entitlements)) into before_counts;
 select md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' order by id),'')) into placement_hash from public.placements x;
 select md5((select jsonb_agg(to_jsonb(r) order by role_key)::text from public.trusted_circle_roles r)||(select jsonb_agg(to_jsonb(s) order by scope_key)::text from public.trusted_circle_share_scopes s)) into lookup_hash;
 begin
  insert into auth.users(id,email,aud,role,email_confirmed_at)
    select x,'circle-regression-'||x||'@example.invalid','authenticated','authenticated',case when x=unconfirmed then null else now() end from unnest(array[a,b,c,d,outsider,unconfirmed]) x;
  for i in 1..2 loop
   actor:=owners[i]; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true); execute 'set local role authenticated';
   if current_user<>'authenticated' or auth.uid() is distinct from actor then raise exception 'Role simulation failed'; end if;
   rid:=public.invite_trusted_circle_member('circle-regression-'||supporters[i]||'@example.invalid','friend');
   if rid is null or public.invite_trusted_circle_member(upper(' circle-regression-'||supporters[i]||'@example.invalid '),'friend') is distinct from rid then raise exception 'Duplicate invitation handling failed'; end if;
   action_ok:=public.accept_trusted_circle_invitation(rid);
   if action_ok or exists(select 1 from public.trusted_circle_shares where relationship_id=rid) then raise exception 'Owner fabricated acceptance or invitation auto-shared'; end if;
   if not exists(select 1 from public.trusted_circle_relationships where id=rid and owner_user_id=actor and supporter_user_id=supporters[i] and status='invited' and accepted_at is null and invited_by=actor) then raise exception 'Pending invitation invalid'; end if;
   results:=results||jsonb_build_array(jsonb_build_object('test','Owner '||i||': pending invitation, no duplicates, no automatic sharing or owner acceptance','pass',true));
   actor:=supporters[i]; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
   action_ok:=public.accept_trusted_circle_invitation(rid); replay_ok:=public.accept_trusted_circle_invitation(rid);
   if not action_ok or replay_ok then raise exception 'Recipient acceptance failed'; end if;
   select accepted_at into accepted_time from public.trusted_circle_relationships where id=rid;
   accepted_times:=array_append(accepted_times,accepted_time); rels:=array_append(rels,rid);
   results:=results||jsonb_build_array(jsonb_build_object('test','Supporter '||i||': invitation accepted once by invited identity','pass',true));
   actor:=owners[i]; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
   sid:=public.invite_trusted_circle_member('circle-regression-'||supporters[i]||'@example.invalid','friend');
   if sid is distinct from rid or (select accepted_at from public.trusted_circle_relationships where id=rid) is distinct from accepted_time then raise exception 'Active invitation replay reset consent'; end if;
   insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key) values(actor,rid,'shared_tasks') returning id into sid;
   shares:=array_append(shares,sid);
   execute format('set local role %I',original_role);
  end loop;
  foreach actor in array array[a,b,c,d] loop
   i:=case when actor in(a,b) then 1 else 2 end;
   perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true); execute 'set local role authenticated';
   if current_user<>'authenticated' or auth.uid() is distinct from actor or public.is_lellee_admin() then raise exception 'Ordinary identity assertion failed'; end if;
   select count(*) filter(where id=shares[i]),count(*) filter(where id<>shares[i]) into n,other_n from public.trusted_circle_shares;
   if n<>1 or other_n<>0 then raise exception 'Share isolation failed'; end if;
   select count(*) filter(where id=rels[i]),count(*) filter(where id<>rels[i]) into n,other_n from public.trusted_circle_relationships;
   if n<>1 or other_n<>0 then raise exception 'Relationship isolation failed'; end if;
   results:=results||jsonb_build_array(jsonb_build_object('test',case when actor=owners[i] then 'Owner ' else 'Supporter ' end||i||': own relationship and permitted share only','pass',true));
   foreach sql_text in array array[
    format('insert into public.trusted_circle_relationships(owner_user_id,supporter_user_id,role_key,status) values(%L,%L,''family'',''active'')',actor,outsider),
    format('update public.trusted_circle_relationships set owner_user_id=%L where id=%L',outsider,rels[i]),
    format('update public.trusted_circle_relationships set supporter_user_id=%L where id=%L',outsider,rels[i]),
    format('update public.trusted_circle_relationships set status=''active'',accepted_at=now() where id=%L',rels[i]),
    format('delete from public.trusted_circle_relationships where id=%L',rels[i]),
    format('update public.trusted_circle_shares set status=''active'',revoked_at=null where id=%L',shares[i]),
    format('update public.trusted_circle_shares set owner_user_id=%L where id=%L',outsider,shares[i]),
    format('update public.trusted_circle_shares set relationship_id=%L where id=%L',rels[3-i],shares[i]),
    format('update public.trusted_circle_shares set scope_key=''journal_content'',expires_at=null where id=%L',shares[i]),
    'update public.trusted_circle_roles set status=''active'' where role_key=''friend''',
    'update public.trusted_circle_share_scopes set default_allowed=true where scope_key=''journal_content'''
   ] loop
    denied:=false; begin execute sql_text; exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'Protected write permitted: %',sql_text; end if;
   end loop;
   results:=results||jsonb_build_array(jsonb_build_object('test',case when actor=owners[i] then 'Owner ' else 'Supporter ' end||i||': 11 identity, consent and protected metadata writes denied','pass',true));
   execute format('set local role %I',original_role);
  end loop;
  actor:=a; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true); execute 'set local role authenticated';
  foreach sql_text in array array[
   format('insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key) values(%L,%L,''resource_referrals'')',a,rels[2]),
   format('insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key) values(%L,%L,''resource_referrals'')',c,rels[2]),
   format('insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key,created_at) values(%L,%L,''resource_referrals'',now())',a,rels[1]),
   format('insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key,status) values(%L,%L,''resource_referrals'',''active'')',a,rels[1])
  ] loop
   denied:=false; begin execute sql_text; exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Forged share accepted'; end if;
  end loop;
  foreach scenario in array array['journal_content','private_messages','safety_activity','full_history'] loop
   denied:=false; begin insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key) values(a,rels[1],scenario); exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Excluded private scope accepted'; end if;
  end loop;
  if public.revoke_trusted_circle_share(shares[2]) or public.revoke_trusted_circle_relationship(rels[2]) then raise exception 'Cross-owner revocation permitted'; end if;
  delete from public.trusted_circle_shares where id=shares[2]; get diagnostics changed=row_count;
  if changed<>0 then raise exception 'Cross-owner delete permitted'; end if;
  results:=results||jsonb_build_array(jsonb_build_object('test','Forged relationship, owner and timestamp grants rejected; four private scopes blocked; cross-owner revoke/delete denied','pass',true));
  foreach sql_text in array array[
   format('select public.invite_trusted_circle_member(%L,''friend'')','circle-regression-'||a||'@example.invalid'),
   format('select public.invite_trusted_circle_member(%L,''friend'')','circle-regression-'||unconfirmed||'@example.invalid'),
   'select public.invite_trusted_circle_member(null,''friend'')',
   'select public.invite_trusted_circle_member(''nobody@example.invalid'',''invalid-role'')',
   format('select public.respond_trusted_circle_relationship(%L,''invalid-action'')',rels[1])
  ] loop
   denied:=false; begin execute sql_text; exception when invalid_parameter_value then denied:=true; end;
   if not denied then raise exception 'Invalid lifecycle input accepted'; end if;
  end loop;
  results:=results||jsonb_build_array(jsonb_build_object('test','Self/unconfirmed/null/invalid-role invitations and invalid action rejected','pass',true));
  execute format('set local role %I',original_role);
  actor:=b; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true); execute 'set local role authenticated';
  if public.revoke_trusted_circle_share(shares[1]) or public.revoke_trusted_circle_relationship(rels[1]) or public.respond_trusted_circle_relationship(rels[1],'pause') then raise exception 'Supporter performed owner action'; end if;
  foreach actor in array array[a,b] loop
   denied:=false; begin insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key) values(actor,rels[1],'resource_referrals'); exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Supporter granted access'; end if;
  end loop;
  delete from public.trusted_circle_shares where id=shares[1]; get diagnostics changed=row_count; if changed<>0 then raise exception 'Supporter deleted owner share'; end if;
  results:=results||jsonb_build_array(jsonb_build_object('test','Supporter cannot create owner permissions, pause/revoke owner connection, or delete owner shares','pass',true));
  execute format('set local role %I',original_role);
  foreach actor in array array[outsider,admin_id] loop
   perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true); execute 'set local role authenticated';
   foreach scenario in array array['accept','decline','pause','revoke','leave'] loop
    if public.respond_trusted_circle_relationship(rels[1],scenario) then raise exception 'Unrelated identity fabricated consent'; end if;
   end loop;
   if actor=outsider and (exists(select 1 from public.trusted_circle_relationships) or exists(select 1 from public.trusted_circle_shares)) then raise exception 'Unrelated access'; end if;
   if actor=admin_id and (not public.is_lellee_admin() or (select count(*) from public.trusted_circle_shares where id=any(shares))<>2) then raise exception 'Existing Admin metadata read changed'; end if;
   results:=results||jsonb_build_array(jsonb_build_object('test',case when actor=outsider then 'Outsider sees no relationship/shares and cannot act' else 'Admin metadata oversight preserved but no acceptance or owner-action override' end,'pass',true));
   execute format('set local role %I',original_role);
  end loop;
  foreach scenario in array array['future','expired','expiry_boundary','revoked','paused','revocation_stamp','expired_status'] loop
   update public.trusted_circle_shares set status='active',revoked_at=null,starts_at=statement_timestamp()-interval '1 day',expires_at=null where id=shares[1];
   if scenario='future' then update public.trusted_circle_shares set starts_at=statement_timestamp()+interval '1 day' where id=shares[1];
   elsif scenario='expired' then update public.trusted_circle_shares set expires_at=statement_timestamp()-interval '1 second' where id=shares[1];
   elsif scenario='expiry_boundary' then update public.trusted_circle_shares set expires_at=statement_timestamp() where id=shares[1];
   elsif scenario='revocation_stamp' then update public.trusted_circle_shares set revoked_at=clock_timestamp() where id=shares[1];
   else update public.trusted_circle_shares set status=case when scenario='expired_status' then 'expired' else scenario end where id=shares[1]; end if;
   actor:=b; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true); execute 'set local role authenticated';
   if exists(select 1 from public.trusted_circle_shares where id=shares[1]) then raise exception 'Inactive/time-bound share visible: %',scenario; end if;
   results:=results||jsonb_build_array(jsonb_build_object('test','Recipient denied: share '||scenario,'pass',true));
   execute format('set local role %I',original_role);
  end loop;
  update public.trusted_circle_shares set status='active',revoked_at=null,starts_at=statement_timestamp(),expires_at=null where id=shares[1];
  execute 'set local role authenticated'; if not exists(select 1 from public.trusted_circle_shares where id=shares[1]) then raise exception 'Exact start boundary failed'; end if;
  results:=results||jsonb_build_array(jsonb_build_object('test','Exact start boundary and non-expiring explicit share accepted','pass',true)); execute format('set local role %I',original_role);
  foreach scenario in array array['paused','invited','declined','revoked','ended','active_revoked','missing_acceptance','mismatched_inviter','newer_acceptance'] loop
   update public.trusted_circle_relationships set status='active',revoked_at=null,accepted_at=accepted_times[1],invited_by=a where id=rels[1];
   if scenario='active_revoked' then update public.trusted_circle_relationships set revoked_at=clock_timestamp() where id=rels[1];
   elsif scenario='missing_acceptance' then update public.trusted_circle_relationships set accepted_at=null where id=rels[1];
   elsif scenario='mismatched_inviter' then update public.trusted_circle_relationships set invited_by=outsider where id=rels[1];
   elsif scenario='newer_acceptance' then update public.trusted_circle_relationships set accepted_at=clock_timestamp() where id=rels[1];
   else update public.trusted_circle_relationships set status=scenario where id=rels[1]; end if;
   execute 'set local role authenticated'; if exists(select 1 from public.trusted_circle_shares where id=shares[1]) then raise exception 'Invalid relationship share visible: %',scenario; end if;
   results:=results||jsonb_build_array(jsonb_build_object('test','Recipient denied: relationship '||scenario,'pass',true)); execute format('set local role %I',original_role);
  end loop;
  update public.trusted_circle_relationships set status='active',revoked_at=null,accepted_at=accepted_times[1],invited_by=a where id=rels[1];
  foreach scenario in array array['role','scope'] loop
   if scenario='role' then update public.trusted_circle_roles set status='paused' where role_key='friend'; else update public.trusted_circle_share_scopes set status='paused' where scope_key='shared_tasks'; end if;
   execute 'set local role authenticated'; if exists(select 1 from public.trusted_circle_shares where id=shares[1]) then raise exception 'Disabled role/scope visible'; end if;
   results:=results||jsonb_build_array(jsonb_build_object('test','Paused '||scenario||' removes recipient access','pass',true)); execute format('set local role %I',original_role);
   update public.trusted_circle_roles set status='active' where role_key='friend'; update public.trusted_circle_share_scopes set status='active' where scope_key='shared_tasks';
  end loop;
  insert into public.trusted_circle_relationships(id,owner_user_id,supporter_user_id,program_id,role_key,status,invited_by,accepted_at)
   values(scoped_rel,a,b,programs[1],'family','active',a,clock_timestamp());
  actor:=a; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true); execute 'set local role authenticated';
  insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key,program_id) values(a,scoped_rel,'selected_goals',programs[1]);
  foreach actor in array array[programs[2],null::uuid] loop
   denied:=false; begin insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key,program_id) values(a,scoped_rel,'resource_referrals',actor); exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Program-scoped consent broadened'; end if;
  end loop;
  foreach sql_text in array array[
   format('insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key,starts_at,expires_at) values(%L,%L,''resource_referrals'',now(),now())',a,rels[1]),
   format('insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key,starts_at,expires_at) values(%L,%L,''resource_referrals'',now()-interval ''2 days'',now()-interval ''1 day'')',a,rels[1])
  ] loop
   denied:=false; begin execute sql_text; exception when invalid_parameter_value then denied:=true; end;
   if not denied then raise exception 'Invalid time range accepted'; end if;
  end loop;
  results:=results||jsonb_build_array(jsonb_build_object('test','Correct program/selected scope accepted; different/null program and invalid time ranges rejected','pass',true));
  action_ok:=public.respond_trusted_circle_relationship(rels[1],'pause'); if not action_ok then raise exception 'Owner pause failed'; end if;
  actor:=b; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  if exists(select 1 from public.trusted_circle_shares where id=shares[1]) then raise exception 'Paused connection remains readable'; end if;
  actor:=a; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  rid:=public.invite_trusted_circle_member('circle-regression-'||b||'@example.invalid','friend');
  if rid is distinct from rels[1] then raise exception 'Reinvitation lost relationship identity'; end if;
  if exists(select 1 from public.trusted_circle_shares where relationship_id=rels[1] and status<>'revoked') then raise exception 'Old grants not revoked'; end if;
  actor:=b; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  action_ok:=public.accept_trusted_circle_invitation(rels[1]);
  if not action_ok or exists(select 1 from public.trusted_circle_shares where id=shares[1]) then raise exception 'Reacceptance revived old grant'; end if;
  actor:=a; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key) values(a,rels[1],'shared_tasks') returning id into sid;
  actor:=b; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  if not exists(select 1 from public.trusted_circle_shares where id=sid) then raise exception 'Fresh explicit grant failed'; end if;
  results:=results||jsonb_build_array(jsonb_build_object('test','Owner pause, same-ID reinvitation, fresh acceptance and fresh explicit sharing work without reviving old grants','pass',true));
  actor:=a; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  action_ok:=public.revoke_trusted_circle_share(sid); replay_ok:=public.revoke_trusted_circle_share(sid);
  if not action_ok or replay_ok then raise exception 'Single share revocation failed'; end if;
  if not exists(select 1 from public.trusted_circle_shares where id=sid and status='revoked') then raise exception 'Owner history missing'; end if;
  insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key) values(a,rels[1],'shared_appointments');
  action_ok:=public.revoke_trusted_circle_relationship(rels[1]); replay_ok:=public.revoke_trusted_circle_relationship(rels[1]);
  if not action_ok or replay_ok then raise exception 'Relationship revocation failed'; end if;
  if exists(select 1 from public.trusted_circle_shares where relationship_id=rels[1] and status<>'revoked') then raise exception 'Relationship revocation left grants'; end if;
  delete from public.trusted_circle_shares where id=sid; get diagnostics changed=row_count; if changed<>1 then raise exception 'Owner delete failed'; end if;
  actor:=b; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  action_ok:=public.accept_trusted_circle_invitation(rels[1]);
  if action_ok or exists(select 1 from public.trusted_circle_shares where relationship_id=rels[1]) then raise exception 'Revocation bypassed'; end if;
  results:=results||jsonb_build_array(jsonb_build_object('test','Share and relationship revocation effective, replay safe, owner history/deletion retained','pass',true));
  actor:=a; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  perform public.invite_trusted_circle_member('circle-regression-'||b||'@example.invalid','friend');
  actor:=b; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  action_ok:=public.respond_trusted_circle_relationship(rels[1],'decline'); replay_ok:=public.accept_trusted_circle_invitation(rels[1]);
  if not action_ok or replay_ok then raise exception 'Decline failed'; end if;
  actor:=a; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true); perform public.invite_trusted_circle_member('circle-regression-'||b||'@example.invalid','friend');
  actor:=b; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true); action_ok:=public.accept_trusted_circle_invitation(rels[1]); if not action_ok then raise exception 'New acceptance failed'; end if;
  actor:=a; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true); insert into public.trusted_circle_shares(owner_user_id,relationship_id,scope_key) values(a,rels[1],'resource_referrals');
  actor:=b; perform set_config('request.jwt.claim.sub',actor::text,true); perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  action_ok:=public.respond_trusted_circle_relationship(rels[1],'leave'); select count(*) into n from public.trusted_circle_shares where relationship_id=rels[1];
  if not action_ok or n<>0 then raise exception 'Supporter exit failed: returned %, visible %',action_ok,n; end if;
  results:=results||jsonb_build_array(jsonb_build_object('test','Invited supporter can decline; accepted supporter can leave without residual access','pass',true));
  execute format('set local role %I',original_role);
  perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated"}',true); execute 'set local role authenticated';
  denied:=false; begin perform public.accept_trusted_circle_invitation(rels[2]); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Missing subject accepted'; end if;
  results:=results||jsonb_build_array(jsonb_build_object('test','Signed-in role without a subject claim cannot act','pass',true));
  execute format('set local role %I',original_role);
  perform set_config('request.jwt.claims','{"role":"anon"}',true); execute 'set local role anon';
  foreach sql_text in array array[
   'select count(*) from public.trusted_circle_relationships','select count(*) from public.trusted_circle_shares',
   'select count(*) from public.trusted_circle_roles','select count(*) from public.trusted_circle_share_scopes',
   'select public.invite_trusted_circle_member(''nobody@example.invalid'',''friend'')',
   'select public.accept_trusted_circle_invitation(null::uuid)','select public.revoke_trusted_circle_relationship(null::uuid)',
   'select public.revoke_trusted_circle_share(null::uuid)','select public.respond_trusted_circle_relationship(null::uuid,''accept'')'
  ] loop
   denied:=false; begin execute sql_text; exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Anonymous operation permitted: %',sql_text; end if;
  end loop;
  results:=results||jsonb_build_array(jsonb_build_object('test','Nine anonymous table/lifecycle calls denied','pass',true));
  execute format('set local role %I',original_role);
  if (select count(*) from pg_constraint where conname in('trusted_circle_relationships_program_id_fkey','trusted_circle_shares_program_id_fkey') and confdeltype='r')<>2 then raise exception 'Program-deletion boundary missing'; end if;
  results:=results||jsonb_build_array(jsonb_build_object('test','Both program foreign keys restrict deletion rather than broaden consent','pass',true));
  raise exception using errcode='ZX001',message='ROLLBACK_CIRCLE_REGRESSION_FIXTURES';
 exception when sqlstate 'ZX001' then null;
 end;
 select jsonb_build_object('users',(select count(*) from auth.users),'relationships',(select count(*) from public.trusted_circle_relationships),'shares',(select count(*) from public.trusted_circle_shares),'paid',(select count(*) from public.user_entitlements)) into after_counts;
 select md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' order by id),'')) into after_hash from public.placements x;
 if before_counts is distinct from after_counts or placement_hash is distinct from after_hash
    or exists(select 1 from auth.users where id in(a,b,c,d,outsider,unconfirmed))
    or lookup_hash is distinct from md5((select jsonb_agg(to_jsonb(r) order by role_key)::text from public.trusted_circle_roles r)||(select jsonb_agg(to_jsonb(s) order by scope_key)::text from public.trusted_circle_share_scopes s)) then raise exception 'Fixture rollback/data preservation failed'; end if;
 perform set_config('lellee.circle_regression',jsonb_build_object('checked_at',clock_timestamp(),'mode','PostgreSQL roles and simulated JWT claims; not live Auth/browser sessions','groups_passed',jsonb_array_length(results),'results',results,'before',before_counts,'after',after_counts,'fixtures_rolled_back',true,'placements_and_lookup_catalogs_unchanged',true)::text,true);
end $qa$;
select current_setting('lellee.circle_regression')::jsonb as trusted_circle_test_report;
