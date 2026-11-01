import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const root=new URL('../../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const db=new PGlite(),results=[];
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
async function check(name,fn){await fn();results.push({name,status:'passed'});}
async function as(role,fn){await db.exec(`set role ${role}`);try{return await fn();}finally{await db.exec('reset role');}}
const directory=async slug=>(await db.query('select public.get_public_program_resources($1) as result',[slug])).rows[0].result;
try{
 // Minimal replica of the captured directory fields and read policies. Private
 // extra columns are intentional sentinels proving the RPC is an allowlist.
 await db.exec(`create role anon;create role authenticated;create role unrelated;
 create table public.programs(id uuid primary key,slug text,name text,status text);
 create table public.resource_categories(category_key text primary key,label text,active boolean);
 create table public.service_resources(id uuid primary key,program_id uuid,category_key text,name text,description text,city text,state text,website_url text,phone text,cost_level text,virtual_available boolean,sponsored boolean,sponsor_label text,verified_at timestamptz,published boolean,email text,last_reviewed_by uuid);
 create table public.local_resources(id uuid primary key,program_id uuid,name text,resource_type text,description text,city text,state text,website_url text,phone text,cost_level text,virtual_available boolean,sponsored boolean,sponsor_label text,verified_at timestamptz,pathways text[],published boolean,address_text text);
 create table public.user_saved_resources(user_id uuid,resource_id uuid,notes text);
 alter table public.programs enable row level security;
 alter table public.resource_categories enable row level security;
 alter table public.service_resources enable row level security;
 alter table public.local_resources enable row level security;
 alter table public.user_saved_resources enable row level security;
 grant select on public.programs,public.resource_categories,public.service_resources,public.local_resources to anon,authenticated;
 create policy programs_read_catalog on public.programs for select to authenticated using(status in('active','pilot','planned','paused'));
 create policy resource_categories_read on public.resource_categories for select to authenticated using(active=true);
 create policy service_resources_read on public.service_resources for select to authenticated using(published=true);
 create policy local_resources_read_published on public.local_resources for select to authenticated using(published=true);
 insert into public.resource_categories values('community','Community',true),('inactive','Inactive',false);`);
 for(const [n,slug,status] of [[1,'recovery','active'],[2,'caregiving','active'],[3,'reentry','active'],[4,'grief','planned'],[5,'retired','retired'],[6,'workforce-reentry','planned'],[7,'family-recovery','planned'],[8,'financial-recovery','planned']])await db.query('insert into public.programs values($1,$2,$2,$3)',[id(n),slug,status]);
 for(const [n,pid,published,category] of [[11,2,true,'community'],[12,3,true,'community'],[13,null,true,'community'],[14,2,false,'community'],[15,2,true,'inactive']])await db.query(`insert into public.service_resources(id,program_id,category_key,name,published,email,last_reviewed_by,sponsored) values($1,$2,$3,$4,$5,'private-sentinel@example.test',$6,false)`,[id(n),pid?id(pid):null,category,`Fixture ${n}`,published,id(999)]);
 for(const [n,pid,published] of [[21,null,true],[22,1,true],[23,2,true],[24,1,false]])await db.query('insert into public.local_resources(id,program_id,name,published,resource_type,pathways,sponsored,address_text) values($1,$2,$3,$4,\'meeting\',array[\'12_step\'],false,\'private extra field\')',[id(n),pid?id(pid):null,`Legacy ${n}`,published]);
 await db.query('insert into public.user_saved_resources values($1,$2,$3)',[id(999),id(11),'private saved note']);
 await db.exec(read('supabase/migrations/20261101040121_public_program_resource_directory.sql'));
 await check('Anonymous guest can read selected Caregiving and explicit shared service resources',async()=>{
  const out=await as('anon',()=>directory('caregiving'));assert.deepEqual(out.resources.map(x=>x.id).sort(),[id(11),id(13)]);assert.equal(out.program.slug,'caregiving');
 });
 await check('Other program resources are excluded',async()=>assert.ok(!(await as('anon',()=>directory('caregiving'))).resources.some(x=>x.id===id(12))));
 await check('Draft and inactive-category resources are excluded',async()=>assert.ok(!(await as('anon',()=>directory('caregiving'))).resources.some(x=>[id(14),id(15)].includes(x.id))));
 await check('Non-Recovery does not receive unscoped legacy Recovery resources',async()=>assert.ok((await directory('caregiving')).resources.every(x=>x.source==='service')));
 await check('Recovery retains published legacy resources and excludes explicit other-program rows',async()=>{
  assert.deepEqual((await directory('recovery')).resources.filter(x=>x.source==='local').map(x=>x.id).sort(),[id(21),id(22)]);
 });
 await check('Private columns and saved notes never appear in anonymous projection',async()=>{
  const text=JSON.stringify(await as('anon',()=>directory('caregiving')));for(const value of ['private-sentinel','last_reviewed_by','private saved note','email'])assert.ok(!text.includes(value));
  assert.ok(!JSON.stringify(await directory('recovery')).includes('private extra field'));
 });
 await check('Anonymous direct directory table reads remain restricted by existing RLS',async()=>{
  assert.equal((await as('anon',()=>db.query('select * from public.service_resources'))).rows.length,0);
  assert.equal((await as('anon',()=>db.query('select * from public.local_resources'))).rows.length,0);
 });
 await check('Anonymous private saved-resource table is not granted',async()=>assert.rejects(()=>as('anon',()=>db.query('select * from public.user_saved_resources')),/permission denied/));
 await check('Anonymous write privilege is not created',async()=>assert.rejects(()=>as('anon',()=>db.query("insert into public.service_resources(id,name) values(gen_random_uuid(),'No')")),/permission denied/));
 await check('Unknown and missing programs fail without a Recovery fallback',async()=>{
  for(const slug of ['unknown','',null])await assert.rejects(()=>as('anon',()=>directory(slug)),/valid support program/);
 });
 await check('Retired programs are not publicly projected',async()=>assert.rejects(()=>directory('retired'),/valid support program/));
 await check('Approved preview aliases resolve to canonical program slugs',async()=>{
  for(const [alias,slug] of [['grief-loss','grief'],['work-new-beginnings','workforce-reentry'],['family-support','family-recovery'],['financial-stability','financial-recovery']])assert.equal((await directory(alias)).program.slug,slug);
 });
 await check('Authenticated projection follows the same publication and program scope',async()=>assert.deepEqual(await as('authenticated',()=>directory('caregiving')),await as('anon',()=>directory('caregiving'))));
 await check('Public default function execution is revoked from unrelated roles',async()=>assert.rejects(()=>as('unrelated',()=>directory('caregiving')),/permission denied/));
 await check('Planned program read does not activate or publish it',async()=>{
  await directory('grief');assert.equal((await db.query('select status from public.programs where slug=\'grief\'')).rows[0].status,'planned');
 });
 await check('Empty published directory has an explicit empty array',async()=>{
  await db.exec('update public.service_resources set published=false');const out=await directory('grief');assert.deepEqual(out.resources,[]);assert.equal(out.program.slug,'grief');
 });
 const result={status:'passed',count:results.length,scope:'New public directory RPC in a minimal captured-schema/RLS fixture; synthetic rows; no live migration or resource publication.',results};
 writeFileSync(new URL('public-resource-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,count:result.count,scope:result.scope}));
}finally{await db.close();}
