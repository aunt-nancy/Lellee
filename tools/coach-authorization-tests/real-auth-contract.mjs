import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Client } from 'pg';

assert.equal(process.env.LELLEE_ISOLATED_AUTH_TEST,'yes');
const statusFile=resolve(process.env.LELLEE_SUPABASE_TEST_STATUS_FILE||'');
assert.ok(process.env.RUNNER_TEMP&&statusFile.startsWith(resolve(process.env.RUNNER_TEMP)+'/'));
const status=JSON.parse(readFileSync(statusFile,'utf8'));
const api=new URL(status.API_URL);const dbUrl=new URL(status.DB_URL);
for(const url of [api,dbUrl])assert.ok(['127.0.0.1','localhost'].includes(url.hostname),'Only fresh local test services are permitted');
const db=new Client({connectionString:status.DB_URL});await db.connect();
assert.equal((await db.query('select marker from private.isolated_auth_fixture')).rows[0]?.marker,'lellee-synthetic-auth-contract');
const anon=status.ANON_KEY;assert.ok(anon);
const results=[];const users={};const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const q=n=>`'${id(n)}'`;
async function http(path,token,body,method='POST'){
 const r=await fetch(new URL(path,api),{method,headers:{apikey:anon,Authorization:`Bearer ${token||anon}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await r.json().catch(()=>null);return {ok:r.ok,status:r.status,data};
}
const rpc=(name,user,args={})=>http('/rest/v1/rpc/'+name,user?.token,args);
async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message});console.error('FAIL',name,e.message);}}
function allowed(r){assert.ok(r.ok,`Expected allowed request; received HTTP ${r.status}`);return r.data;}
function denied(r){assert.ok([401,403].includes(r.status),`Expected authorization denial; received HTTP ${r.status}`);}
async function counts(){return (await db.query('select (select count(*)::int from public.coach_service_packages) offers,(select count(*)::int from public.coach_schedule_events) events,(select count(*)::int from public.coach_invitations) invites')).rows[0];}
async function approve(){
 await db.query('update public.coach_certificates set status=$1,revoked_at=null,expires_on=null',['active']);
 const r=await rpc('admin_review_independent_coach_authorization',users.admin,{p_business_id:id(21),p_coach_user_id:users.coach.id,p_program_id:id(11),p_requirements_version:'fixture-only',p_orientation_training_record_id:id(41),p_onboarding_certificate_id:id(51),p_status:'approved'});
 allowed(r);
}
try{
 for(const role of ['coach','admin','clientA','clientB','secondCoach']){
  const password=randomBytes(20).toString('hex');const email=`${role.toLowerCase()}@example.test`;
  const r=await http('/auth/v1/signup',null,{email,password});
  assert.ok(r.ok&&r.data?.user?.id&&r.data?.access_token,'Local signup must produce a real session without external confirmation mail');
  users[role]={id:r.data.user.id,token:r.data.access_token,email,password};
  assert.match(users[role].id,/^[0-9a-f-]{36}$/i);
 }
 await test('Real Supabase signup and password sign-in produce a server-validated coach session',async()=>{
  const login=await http('/auth/v1/token?grant_type=password',null,{email:users.coach.email,password:users.coach.password});
  assert.ok(login.ok&&login.data?.access_token);users.coach.token=login.data.access_token;
  assert.equal(allowed(await http('/auth/v1/user',users.coach.token,undefined,'GET')).id,users.coach.id);
 });
 await db.query('insert into private.test_admins values($1)',[users.admin.id]);
 await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:users.admin.id,role:'authenticated'})]);
 await db.query(`insert into public.programs(id,slug,name) values(${q(11)},'fixture-program','Fixture Program'),(${q(12)},'other','Other');
  insert into public.coach_businesses(id,owner_user_id,business_name,public_name,primary_program_id,status) values(${q(21)},'${users.coach.id}','Fixture','Fixture',${q(11)},'approved');
  insert into public.coach_business_members(business_id,user_id,role,status) values(${q(21)},'${users.coach.id}','owner','active'),(${q(21)},'${users.secondCoach.id}','coach','active');
  insert into public.coach_business_programs(business_id,program_id,status) values(${q(21)},${q(11)},'approved'),(${q(21)},${q(12)},'approved');
  insert into public.professional_courses(id,course_key,title,status) values(${q(31)},'fixture_orientation','Synthetic orientation','published'),(${q(32)},'fixture_certification','Synthetic certification','published');
  insert into public.training_records(id,user_id,title,status,completed_at,verified,professional_course_id) values(${q(41)},'${users.coach.id}','Synthetic orientation','completed',now(),true,${q(31)}),(${q(42)},'${users.coach.id}','Synthetic certification','completed',now(),true,${q(32)});
  insert into public.coach_certificates(id,user_id,business_id,training_record_id,title,status,issued_by,issued_on) values(${q(51)},'${users.coach.id}',${q(21)},${q(42)},'Synthetic certification','active','${users.admin.id}',current_date);
  insert into private.independent_coach_requirement_versions(version,orientation_course_id,certification_course_id,active,approved_by,approved_at) values('fixture-only',${q(31)},${q(32)},true,'${users.admin.id}',now());`);
 await approve();
 await db.query(`insert into public.coach_client_relationships(id,business_id,coach_user_id,client_user_id,program_id,status,client_acceptance_status) values(${q(61)},${q(21)},'${users.coach.id}','${users.clientA.id}',${q(11)},'active','accepted')`);
 for(const state of ['new','pending','approved','expired','revoked']){
  await approve();
  if(state==='new')await db.query('delete from private.independent_coach_authorizations');
  if(state==='pending')await db.query("update private.independent_coach_authorizations set status='pending'");
  if(state==='expired')await db.query('update public.coach_certificates set expires_on=current_date-1');
  if(state==='revoked')await db.query("update public.coach_certificates set status='revoked',revoked_at=now()");
  await test(`${state}: real authenticated onboarding status remains available`,async()=>assert.equal(allowed(await rpc('get_my_independent_coach_service_authorization',users.coach)).onboarding_access,true));
  await test(`${state}: real REST draft preparation remains available`,async()=>allowed(await http('/rest/v1/coach_service_packages',users.coach.token,{business_id:id(21),program_id:id(11),name:'Fixture draft',active:false})));
  await test(`${state}: real REST active offer and scheduling RPC enforce current qualification`,async()=>{
   const before=await counts();
   const offer=await http('/rest/v1/coach_service_packages',users.coach.token,{business_id:id(21),program_id:id(11),name:'Fixture active',active:true});
   const schedule=await rpc('create_my_coach_schedule_event',users.coach,{p_relationship_id:id(61),p_scheduled_start:new Date(Date.now()+86400000).toISOString()});
   if(state==='approved'){allowed(offer);allowed(schedule);}else{denied(offer);denied(schedule);assert.deepEqual(await counts(),before);}
  });
 }
 await approve();
 await test('Second coach cannot borrow owner approval through real RPC',async()=>denied(await rpc('create_my_coach_schedule_event',users.secondCoach,{p_relationship_id:id(61),p_scheduled_start:new Date(Date.now()+86400000).toISOString()})));
 await test('Real REST request cannot forge verified training',async()=>denied(await http('/rest/v1/training_records',users.coach.token,{user_id:users.coach.id,title:'Forged',status:'completed',verified:true})));
 await test('Non-admin cannot issue their own authorization through real RPC',async()=>denied(await rpc('admin_review_independent_coach_authorization',users.coach,{p_business_id:id(21),p_coach_user_id:users.coach.id,p_program_id:id(11),p_requirements_version:'fixture-only',p_orientation_training_record_id:id(41),p_onboarding_certificate_id:id(51),p_status:'approved'})));
 let token;
 await test('Invitation and client acceptance use real signed-in identities and record explicit acceptance',async()=>{
  token=allowed(await rpc('create_coach_invite',users.coach,{p_business_id:id(21),p_program_id:id(11),p_email:users.clientB.email}));
  allowed(await rpc('accept_coach_invite',users.clientB,{p_token:token}));
  const row=(await db.query('select status,client_acceptance_status from public.coach_client_relationships where client_user_id=$1',[users.clientB.id])).rows[0];
  assert.deepEqual(row,{status:'active',client_acceptance_status:'accepted'});
 });
 await test('Real REST schedule reads remain isolated across two groups and clients',async()=>{
  const second=(await db.query('select id from public.coach_client_relationships where client_user_id=$1',[users.clientB.id])).rows[0].id;
  await db.query(`insert into public.coach_groups(id,business_id,program_id,name,status) values(${q(71)},${q(21)},${q(11)},'A','forming'),(${q(72)},${q(21)},${q(11)},'B','forming');
    insert into public.coach_group_members(group_id,relationship_id,status) values(${q(71)},${q(61)},'active'),(${q(72)},'${second}','active');
    insert into public.coach_schedule_events(business_id,created_by,group_id,title,scheduled_start,session_scope) values(${q(21)},'${users.coach.id}',${q(71)},'Group A',now(),'group'),(${q(21)},'${users.coach.id}',${q(72)},'Group B',now(),'group');
    insert into public.coach_schedule_events(business_id,created_by,relationship_id,title,scheduled_start) values(${q(21)},'${users.coach.id}','${second}','B private',now());`);
  const rows=allowed(await http('/rest/v1/coach_schedule_events?select=title',users.clientA.token,undefined,'GET'));
  assert.ok(rows.some(r=>r.title==='Group A'));assert.ok(!rows.some(r=>['Group B','B private'].includes(r.title)));
 });
 await test('Revocation denies the next real request with the unchanged access token',async()=>{
  await db.query("update private.independent_coach_authorizations set status='revoked',revoked_at=now()");
  denied(await rpc('create_my_coach_schedule_event',users.coach,{p_relationship_id:id(61),p_scheduled_start:new Date(Date.now()+86400000).toISOString()}));
 });
 await test('Editable Auth metadata and a fresh real token cannot grant services',async()=>{
  allowed(await http('/auth/v1/user',users.coach.token,{data:{coach_approved:true,orientation_complete:true}},'PUT'));
  const login=await http('/auth/v1/token?grant_type=password',null,{email:users.coach.email,password:users.coach.password});
  assert.ok(login.ok&&login.data?.access_token);
  denied(await http('/rest/v1/coach_service_packages',login.data.access_token,{business_id:id(21),program_id:id(11),name:'Forged approval',active:true}));
 });
 await test('Anonymous RPC cannot inspect onboarding authorization',async()=>denied(await rpc('get_my_independent_coach_service_authorization',null)));
}catch(e){results.push({name:'Real Auth fixture setup',passed:false,error:e.message});console.error('SETUP FAILED',e.message);}
finally{await db.end();}
const summary={scope:'Real isolated Supabase Auth tokens and PostgREST requests; reduced captured application schema; synthetic business/course/evidence and isolated payment/admin helpers; not full production acceptance',passed:results.filter(r=>r.passed).length,total:results.length,results};
writeFileSync(new URL('real-auth-results.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
if(summary.passed!==summary.total)process.exitCode=1;
