import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { testDatabase, resultName } from './test-database.mjs';

const here=new URL('./',import.meta.url);
const sql=f=>readFileSync(new URL(f,here),'utf8');
const db=await testDatabase();
const engine=(await db.query('select version() as version')).rows[0].version;
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const q=n=>`'${id(n)}'`;
const results=[];
const claims=(uid,role='authenticated')=>JSON.stringify({sub:uid===null?undefined:id(uid),role});
async function actor(uid,fn,role='authenticated'){
  await db.exec('begin');
  try{
    await db.query("select set_config('request.jwt.claims',$1,true)",[claims(uid,role)]);
    await db.exec(`set local role ${role}`);
    const value=await fn();
    await db.exec('rollback');
    return value;
  }catch(e){await db.exec('rollback');throw e;}
}
async function test(name,fn){
  try{await fn();results.push({name,passed:true});}
  catch(e){results.push({name,passed:false,error:e.message,detail:e.detail,where:e.where});console.error('FAIL',name,e.message,e.where||'');}
}
async function denied(name,fn){await test(name,async()=>{await assert.rejects(fn,e=>e.code==='42501');});}
async function state(name){
  await db.exec(`update private.independent_coach_authorizations set status='approved',revoked_at=null,approved_by=${q(3)},approved_at=now(),expires_on=null;
    update public.coach_certificates set status='active',revoked_at=null,expires_on=null;
    update public.training_records set verified=true,status='completed',expires_on=null;`);
  if(name==='new')await db.exec('delete from private.independent_coach_authorizations');
  if(name==='pending')await db.exec("update private.independent_coach_authorizations set status='pending'");
  if(name==='expired')await db.exec("update public.coach_certificates set expires_on=(statement_timestamp() at time zone 'America/Los_Angeles')::date-1");
  if(name==='revoked')await db.exec("update public.coach_certificates set status='revoked',revoked_at=now()");
}
const approveSQL=`select public.admin_review_independent_coach_authorization(${q(21)},${q(1)},${q(11)},'fixture-only',${q(41)},${q(51)},'approved')`;
async function approve(){await db.query("select set_config('request.jwt.claims',$1,false)",[claims(3)]);await db.exec(approveSQL);}

try{
 await db.exec(sql('fixture-schema.sql'));
 await db.exec('create extension pgcrypto with schema extensions');
 await db.exec(sql('fixture-public-cards.sql'));
 await db.exec(sql('../../supabase/migrations/20261029193037_independent_coach_service_authorization.sql'));
 await db.query("select set_config('request.jwt.claims',$1,false)",[claims(3)]);
 await db.exec(`
 insert into auth.users(id,email) values(${q(1)},'coach@example.test'),(${q(2)},'client@example.test'),(${q(3)},'admin@example.test'),(${q(4)},'second@example.test'),(${q(6)},'second-client@example.test');
 insert into private.test_admins values(${q(3)});
 insert into public.programs(id,slug,name) values(${q(11)},'fixture-program','Fixture Program'),(${q(12)},'other','Other');
 insert into public.coach_businesses(id,owner_user_id,business_name,public_name,primary_program_id,status) values(${q(21)},${q(1)},'Fixture','Fixture',${q(11)},'approved');
 insert into public.coach_business_members(business_id,user_id,role,status) values(${q(21)},${q(1)},'owner','active'),(${q(21)},${q(4)},'coach','active');
 insert into public.coach_business_programs(business_id,program_id,status) values(${q(21)},${q(11)},'approved'),(${q(21)},${q(12)},'approved');
 insert into public.professional_courses(id,course_key,title,status) values(${q(31)},'fixture_orientation','Synthetic orientation','published'),(${q(32)},'fixture_certification','Synthetic certification','published'),(${q(33)},'unrelated','Unrelated','published');
 insert into public.training_records(id,user_id,title,status,completed_at,verified,professional_course_id) values(${q(41)},${q(1)},'Synthetic orientation','completed',now(),true,${q(31)}),(${q(42)},${q(1)},'Synthetic certification','completed',now(),true,${q(32)});
 insert into public.coach_certificates(id,user_id,business_id,training_record_id,title,status,issued_by,issued_on) values(${q(51)},${q(1)},${q(21)},${q(42)},'Synthetic certification','active',${q(3)},(statement_timestamp() at time zone 'America/Los_Angeles')::date);
 insert into private.independent_coach_requirement_versions(version,orientation_course_id,certification_course_id,active,approved_by,approved_at) values('fixture-only',${q(31)},${q(32)},true,${q(3)},now());
 `);
 await approve();
 await db.exec(`
 insert into public.coach_client_relationships(id,business_id,coach_user_id,client_user_id,program_id,status,client_acceptance_status) values(${q(61)},${q(21)},${q(1)},${q(2)},${q(11)},'active','accepted'),(${q(62)},${q(21)},${q(1)},${q(6)},${q(11)},'pending_client_acceptance','pending_client_acceptance');
 insert into public.coach_groups(id,business_id,program_id,name,status) values(${q(71)},${q(21)},${q(11)},'Fixture group','forming');
 insert into public.coach_consultation_requests(id,business_id,user_id,program_id,status) values(${q(91)},${q(21)},${q(6)},${q(11)},'new');
 insert into public.form_definitions(id,business_id,program_id,form_type,title,status,current_version) values(${q(81)},${q(21)},${q(11)},'intake','Fixture intake','published',1);
 insert into public.form_versions(id,form_id,version_number,status) values(${q(82)},${q(81)},1,'published');
 insert into public.coach_schedule_events(id,business_id,created_by,relationship_id,title,scheduled_start,status) values(${q(101)},${q(21)},${q(1)},${q(61)},'Existing fixture',now()+interval '2 days','scheduled');
 insert into public.app_public_settings(key,value) values('coach_public_marketplace_enabled','true');
 insert into public.coach_public_profiles(id,business_id,coach_user_id,public_name,profile_status,public_visible) values(${q(111)},${q(21)},${q(1)},'Fixture','approved',true);
 insert into public.coach_profile_programs(profile_id,program_id) values(${q(111)},${q(11)});
 update public.coach_businesses set marketplace_visible=true,public_profile_enabled=true;
 `);
 const operations={
  'RPC invitation':`select public.create_coach_invite(${q(21)},${q(11)},'invited@example.test')`,
  'RPC scheduling':`select public.create_my_coach_schedule_event(${q(61)},now()+interval '2 days')`,
  'direct scheduling':`insert into public.coach_schedule_events(business_id,created_by,relationship_id,title,scheduled_start) values(${q(21)},${q(1)},${q(61)},'Fixture',now())`,
  'direct active offer':`insert into public.coach_service_packages(business_id,program_id,name,active) values(${q(21)},${q(11)},'Fixture',true)`,
  'direct coach message':`insert into public.coach_messages(business_id,relationship_id,sender_user_id,body) values(${q(21)},${q(61)},${q(1)},'Fixture coaching message')`,
  'RPC assignment':`select public.create_my_coach_assignment(${q(11)},'Fixture assignment',null,null,${q(61)},null)`,
  'RPC intake':`select public.assign_coach_intake_form(${q(81)},${q(2)})`,
  'RPC consultation conversion':`select public.convert_my_coach_consultation_to_client(${q(91)})`,
  'RPC session confirmation':`select public.update_my_coach_paid_session_status(${q(101)},'confirmed')`,
  'RPC session completion':`select public.update_my_coach_paid_session_status(${q(101)},'completed')`,
  'direct group session':`insert into public.coach_group_schedule(group_id,title,scheduled_start) values(${q(71)},'Group coaching',now())`,
  'direct group activation':`update public.coach_groups set status='active' where id=${q(71)}`,
  'direct group message':`insert into public.coach_messages(business_id,group_id,sender_user_id,body) values(${q(21)},${q(71)},${q(1)},'Group message')`,
  'direct group announcement':`insert into public.coach_group_announcements(group_id,sender_user_id,title,body) values(${q(71)},${q(1)},'Group notice','Coaching content')`,
  'direct coaching note':`insert into public.coach_client_notes(business_id,relationship_id,author_user_id,body) values(${q(21)},${q(61)},${q(1)},'Coaching note')`,
  'direct legacy session':`insert into public.coach_sessions(business_id,coach_user_id,relationship_id,scheduled_start) values(${q(21)},${q(1)},${q(61)},now())`,
 };
 for(const credentialState of ['new','pending','approved','expired','revoked']){
  await state('approved');
  await approve();
  await state(credentialState);
  for(const [operation,query] of Object.entries(operations)){
   const fn=()=>actor(1,()=>db.exec(query));
   if(credentialState==='approved')await test(`${credentialState}: ${operation}`,fn);
   else await denied(`${credentialState}: ${operation}`,fn);
  }
  await test(`${credentialState}: onboarding status remains available`,()=>actor(1,async()=>{
   const r=await db.query('select public.get_my_independent_coach_service_authorization() as status');assert.equal(r.rows[0].status.onboarding_access,true);
   assert.equal(r.rows[0].status.programs.find(p=>p.program_id===id(11)).status,credentialState);
  }));
  const accept=()=>actor(6,()=>db.exec(`select public.accept_my_coach_relationship(${q(62)},true)`));
  if(credentialState==='approved')await test('Approved: client acceptance',accept);
  else await denied(`${credentialState}: client acceptance cannot activate an unqualified coach`,accept);
  await test(`${credentialState}: draft service preparation`,()=>actor(1,()=>db.exec(`insert into public.coach_service_packages(business_id,program_id,name,active) values(${q(21)},${q(11)},'Draft',false)`)));
  await test(`${credentialState}: practice profile remains editable`,()=>actor(1,()=>db.exec(`update public.coach_businesses set business_name='Updated fixture' where id=${q(21)}`)));
  await test(`${credentialState}: self-reported training submission`,()=>actor(1,()=>db.exec(`insert into public.training_records(user_id,title,status,verified) values(${q(1)},'Training evidence','completed',false)`)));
  await test(`${credentialState}: client privacy revocation remains available`,()=>actor(2,()=>db.exec(`update public.coach_client_relationships set data_sharing_scope='{}' where id=${q(61)}`)));
  await test(`${credentialState}: cancellation remains available`,()=>actor(1,()=>db.exec(`select public.update_my_coach_paid_session_status(${q(101)},'cancelled')`)));
  await test(`${credentialState}: relationship termination remains available`,()=>actor(1,()=>db.exec(`select public.update_my_coach_client_relationship(${q(61)},null,'ended')`)));
 }
 await state('approved');await approve();
 await denied('Direct verified training is rejected',()=>actor(1,()=>db.exec(`insert into public.training_records(user_id,title,verified) values(${q(1)},'Forged',true)`)));
 await denied('Direct forged course linkage is rejected',()=>actor(1,()=>db.exec(`insert into public.training_records(user_id,title,verified,professional_course_id) values(${q(1)},'Forged',false,${q(31)})`)));
 await denied('Direct verified credential is rejected',()=>actor(1,()=>db.exec(`insert into public.professional_credential_claims(user_id,label,verification_status) values(${q(1)},'Forged','verified')`)));
 await denied('Coaches cannot approve their own authorization',()=>actor(1,()=>db.exec(approveSQL)));
 await denied('Unapproved second coach cannot borrow owner approval',()=>actor(4,()=>db.exec(operations['RPC scheduling'])));
 await denied('Other program cannot borrow approval',()=>actor(1,()=>db.exec(`insert into public.coach_service_packages(business_id,program_id,name,active) values(${q(21)},${q(12)},'Wrong program',true)`)));
 await denied('Anonymous caller cannot inspect authorization',()=>actor(null,()=>db.exec('select public.get_my_independent_coach_service_authorization()'),'anon'));
 await denied('Private predicate is not executable by coaches',()=>actor(1,()=>db.exec(`select private.independent_coach_is_authorized(${q(21)},${q(1)},${q(11)})`)));
 await test('Explicit client acceptance activates the qualified relationship',()=>actor(6,()=>db.exec(`select public.accept_my_coach_relationship(${q(62)},true)`)));
 await test('Actual invitation token acceptance records client acceptance',()=>actor(1,async()=>{
  const token=(await db.query(`select public.create_coach_invite(${q(21)},${q(11)},'second-client@example.test') as token`)).rows[0].token;
  await db.query("select set_config('request.jwt.claims',$1,true)",[claims(6)]);
  await db.query('select public.accept_coach_invite($1)',[token]);
  const row=(await db.query(`select status,client_acceptance_status from public.coach_client_relationships where id=${q(62)}`)).rows[0];
  assert.equal(row.status,'active');assert.equal(row.client_acceptance_status,'accepted');
 }));
 await test('Valid certificate is accepted on its expiry date',async()=>{
  await db.exec("update public.coach_certificates set expires_on=(statement_timestamp() at time zone 'America/Los_Angeles')::date");
  await actor(1,()=>db.exec(operations['RPC scheduling']));
 });
 await db.exec("update public.coach_certificates set expires_on=null; update public.training_records set expires_on=(statement_timestamp() at time zone 'America/Los_Angeles')::date-1 where id="+q(41));
 await denied('Expired orientation is enforced on the next request',()=>actor(1,()=>db.exec(operations['RPC scheduling'])));
 await db.exec('update public.training_records set expires_on=null');
 await db.exec('update private.independent_coach_requirement_versions set active=false');
 await denied('Unconfigured requirements fail closed',()=>actor(1,()=>db.exec(operations['RPC scheduling'])));
 await db.exec('update private.independent_coach_requirement_versions set active=true');
 await db.exec(`update public.training_records set professional_course_id=${q(33)} where id=${q(42)}`);
 await denied('Unrelated course certificate does not qualify',()=>actor(1,()=>db.exec(operations['RPC scheduling'])));
 await db.exec(`update public.training_records set professional_course_id=${q(32)} where id=${q(42)}`);
 await test('Public listings are filtered after revocation',async()=>{
  assert.equal((await db.query('select jsonb_array_length(public.get_public_coach_cards()) as n')).rows[0].n,1);
  await db.exec("update private.independent_coach_authorizations set status='revoked',revoked_at=now()");
  assert.equal((await db.query('select jsonb_array_length(public.get_public_coach_cards()) as n')).rows[0].n,0);
 });
 await denied('Revocation is effective without refreshing JWT',()=>actor(1,()=>db.exec(operations['RPC scheduling'])));
 await denied('Editable approval metadata cannot bypass the gate',()=>actor(1,async()=>{
   await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:id(1),role:'authenticated',user_metadata:{coach_approved:true,orientation_complete:true}})]);
   await db.exec(operations['RPC scheduling']);
 }));
 await denied('Cancellation cannot smuggle a reschedule',()=>actor(1,()=>db.exec(`update public.coach_schedule_events set status='cancelled',scheduled_start=now() where id=${q(101)}`)));
 await test('Direct pausing cannot forge client acceptance',()=>actor(1,async()=>{
   const result=await db.query(`update public.coach_client_relationships set status='paused',client_acceptance_status='accepted' where id=${q(62)} returning id`);
   assert.equal(result.rows.length,0);
 }));
 await test('Future employee tables receive no gate triggers',async()=>{
  const r=await db.query("select count(*)::integer as n from pg_trigger t join pg_class c on c.oid=t.tgrelid where t.tgname='independent_coach_service_gate' and c.relname like 'lellee_%'");assert.equal(r.rows[0].n,0);
 });
}catch(e){console.error('SETUP FAILED',e.message,e.where||'');results.push({name:'Fixture setup',passed:false,error:e.message});}
finally{await db.close();}
const summary={engine,scope:'Actual migration and guards with reduced catalog-derived schema; real RPC bodies; synthetic accounts; payment/admin helpers isolated',passed:results.filter(r=>r.passed).length,total:results.length,results};
writeFileSync(fileURLToPath(new URL('./'+resultName('results.json'),here)),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({passed:summary.passed,total:summary.total}));
if(summary.passed!==summary.total)process.exitCode=1;
