import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const root=new URL('../../',import.meta.url),read=path=>readFileSync(new URL(path,root),'utf8');
const migration=read('supabase/migrations/20261101045940_caregiving_multi_person_coordination.sql');
const dashboardMigration=read('supabase/migrations/20261101045941_restore_coaching_dashboard_context.sql');
const runtime=read('caregiving-coordinator.js'),page=read('pilot-runtime.js');
const db=new PGlite(),results=[];
const id=n=>`40000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
async function check(name,fn){await fn();results.push({name,status:'passed'});}
async function user(uid,fn){await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:uid,role:'authenticated'})]);try{return await fn()}finally{await db.exec('reset role')}}

try{
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create schema auth;create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
 insert into auth.users values('${id(1)}','caregiver-one@example.test'),('${id(2)}','caregiver-two@example.test');`);
 await db.exec(migration);
 await check('Migration creates private recipient and record tables',async()=>{
  const out=await db.query("select tablename,rowsecurity from pg_tables where schemaname='public' and tablename like 'caregiving_%' order by tablename");
  assert.deepEqual(out.rows.map(x=>[x.tablename,x.rowsecurity]),[['caregiving_recipients',true],['caregiving_records',true]]);
 });
 await check('Anonymous access is not granted',async()=>{
  await db.exec('set role anon');try{await assert.rejects(()=>db.query('select * from public.caregiving_recipients'),/permission denied/)}finally{await db.exec('reset role')}
 });
 await check('One caregiver can maintain at least three separate profiles',async()=>user(id(1),async()=>{
  for(const [n,name,relationship] of [[11,'Parent A','Parent'],[12,'Loved One B','Partner'],[13,'Child C','Child']])await db.query('insert into public.caregiving_recipients(id,user_id,display_name,relationship_label) values($1,$2,$3,$4)',[id(n),id(1),name,relationship]);
  assert.equal((await db.query('select count(*)::int n from public.caregiving_recipients')).rows[0].n,3);
 }));
 await check('Appointments, medications, notes, routines and contacts stay attached to their profiles',async()=>user(id(1),async()=>{
  const rows=[
   [21,11,'appointment','Clinic appointment'],[22,11,'medication','Medication pickup'],
   [23,12,'note','Care preference'],[24,12,'routine','Morning routine'],
   [25,13,'contact','School contact'],[26,13,'appointment','School meeting']
  ];
  for(const [n,recipient,type,title] of rows)await db.query('insert into public.caregiving_records(id,user_id,recipient_id,record_type,title,scheduled_for) values($1,$2,$3,$4,$5,$6)',[id(n),id(1),id(recipient),type,title,type==='appointment'?'2026-11-05T18:00:00Z':null]);
  const grouped=await db.query('select recipient_id,record_type,count(*)::int n from public.caregiving_records group by recipient_id,record_type order by recipient_id,record_type');
  assert.equal(grouped.rows.length,6);
 }));
 await check('A consolidated overview can query every owned profile and open item',async()=>user(id(1),async()=>{
  const out=await db.query(`select r.display_name,count(i.id)::int item_count from public.caregiving_recipients r left join public.caregiving_records i on i.recipient_id=r.id and i.user_id=r.user_id and not i.is_complete group by r.id,r.display_name order by r.display_name`);
  assert.deepEqual(out.rows.map(x=>x.item_count),[2,2,2]);
 }));
 await check('A different signed-in user cannot read another caregiver records',async()=>user(id(2),async()=>{
  assert.equal((await db.query('select count(*)::int n from public.caregiving_recipients')).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from public.caregiving_records')).rows[0].n,0);
 }));
 await check('Cross-account record attachment is blocked by RLS and owned foreign key',async()=>user(id(2),async()=>{
  await assert.rejects(()=>db.query('insert into public.caregiving_records(user_id,recipient_id,record_type,title) values($1,$2,$3,$4)',[id(2),id(11),'note','Unauthorized']),/row-level security|foreign key/);
 }));
 await check('Unknown record categories are rejected',async()=>user(id(1),async()=>{
  await assert.rejects(()=>db.query('insert into public.caregiving_records(user_id,recipient_id,record_type,title) values($1,$2,$3,$4)',[id(1),id(11),'diagnosis','Not allowed']),/check constraint/);
 }));
 await check('Recipient deletion cascades only that recipient records',async()=>user(id(1),async()=>{
  await db.query('delete from public.caregiving_recipients where id=$1',[id(11)]);
  assert.equal((await db.query('select count(*)::int n from public.caregiving_records')).rows[0].n,4);
  assert.equal((await db.query('select count(*)::int n from public.caregiving_recipients')).rows[0].n,2);
 }));
 await check('Frontend exposes the six required Caregiving views and no local sensitive-data fallback',async()=>{
  for(const required of ['People you support','Consolidated overview','Appointments','Medications','Notes','Routines','Contacts'])assert.ok(runtime.includes(required),required);
  for(const required of ['caregiving_recipients','caregiving_records','Care Coordination','if(nav&&!visible)nav.remove()'])assert.ok(runtime.includes(required),required);
  assert.ok(!/localStorage\.setItem\([^)]*caregiv/i.test(runtime));
  assert.ok(page.includes('/caregiving-coordinator.js')&&page.includes('/caregiving-coordinator.css'));
 });
 await check('Coaching dashboard RPC is recorded with explicit least-privilege execution',async()=>{
  assert.match(dashboardMigration,/create or replace function public\.get_my_coach_dashboard_context\(\)/i);
  assert.match(dashboardMigration,/revoke all on function public\.get_my_coach_dashboard_context\(\) from public,anon/i);
  assert.match(dashboardMigration,/grant execute on function public\.get_my_coach_dashboard_context\(\) to authenticated,service_role/i);
 });
 await check('Coaching dashboard RPC installs and returns a safe empty workspace for a new coach',async()=>{
  await db.exec(`create table public.programs(id uuid primary key,slug text,name text,status text,display_order integer);
   create table public.coach_business_members(business_id uuid,user_id uuid,role text,status text,created_at timestamptz);
   create table public.coach_businesses(id uuid primary key,owner_user_id uuid);
   create function public.is_coach_business_member(p_business_id uuid) returns boolean language sql stable as $$select false$$;`);
  await db.exec(dashboardMigration);
  await user(id(1),async()=>{
   const context=(await db.query('select public.get_my_coach_dashboard_context() result')).rows[0].result;
   assert.equal(context.has_business,false);assert.deepEqual(context.clients,[]);assert.deepEqual(context.groups,[]);
  });
 });
 const result={status:'passed',count:results.length,scope:'Synthetic PostgreSQL 17-compatible Caregiving data contract, RLS isolation, three-recipient workflow, UI contract and Coaching RPC reproducibility.',results};
 writeFileSync(new URL('caregiving-coordination-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({status:result.status,count:result.count,scope:result.scope}));
}finally{await db.close()}
