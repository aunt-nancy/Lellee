// Curriculum contract subset, never a publication/signoff or production connection.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const base='supabase/migrations/';
const inputs=['20260930000703_professional_training_foundation.sql',
 '20260930002844_coaching_foundations_content_draft.sql',
 '20260930002947_coaching_foundations_assessments_a.sql',
 '20260930003019_coaching_foundations_assessments_b.sql',
 '20260930015723_professional_assessment_choice_randomization.sql'];
const db=new PGlite();
const results=[];
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const check=async(name,fn)=>{await fn();results.push({name,status:'passed'});};
try{
 await db.exec(`create schema auth; create schema private;
 create table auth.users(id uuid primary key);
 create table public.training_records(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.user',true),'')::uuid $$;`);
 const foundation=read(base+inputs[0]);
 for(const name of ['professional_courses','professional_course_modules','professional_assessment_items','professional_enrollments','professional_module_progress','professional_assessment_attempts']){
  const ddl=foundation.match(new RegExp(`create table if not exists public\\.${name} \\([\\s\\S]*?\\n\\);`));
  assert.ok(ddl,`Missing original DDL: ${name}`);await db.exec(ddl[0]);
 }
 await db.query('insert into auth.users(id) values($1),($2)',[id(1),id(2)]);
 await db.query(`insert into public.professional_courses(id,course_key,title,category,price_cents,entitlement_key,payment_setting_key,estimated_hours,certificate_title)
 values($1,'coaching_foundations','Synthetic contract fixture','foundation',0,'fixture','fixture',12,'Fixture only')`,[id(10)]);
 const keys=['scope_role_boundaries','ethics_privacy_consent','trauma_cultural_responsiveness','communication_skills','goals_accountability','documentation_shared_progress','risk_referral_escalation','foundations_capstone'];
 for(const [i,key] of keys.entries())await db.query(`insert into public.professional_course_modules(id,course_id,module_key,sequence,title,module_type)
 values($1,$2,$3,$4,$3,$5)`,[id(20+i),id(10),key,i+1,i===7?'capstone':'instruction']);
 for(const file of inputs.slice(1,4))await db.exec(read(base+file));
 const runtime=read(base+inputs[4]);
 for(const name of ['get_my_professional_module','submit_my_professional_assessment']){
  const fn=runtime.match(new RegExp(`create or replace function private\\.${name}\\([\\s\\S]*?\\n\\$\\$;`));
  assert.ok(fn);await db.exec(fn[0]);
 }
 const counts=(await db.query(`select count(*)::int as total,count(*) filter(where item_type='scenario')::int as scenarios from public.professional_assessment_items`)).rows[0];
 await check('Original draft bank contains 56 items and 23 scenarios',async()=>assert.deepEqual(counts,{total:56,scenarios:23}));
 await check('Anonymous actor is rejected',async()=>assert.rejects(()=>db.query('select private.get_my_professional_module($1)',[id(20)]),/Sign in required/));
 await db.query("select set_config('test.user',$1,false)",[id(1)]);
 await db.query(`insert into public.professional_enrollments(id,user_id,course_id,entitlement_key) values($1,$2,$3,'fixture')`,[id(11),id(1),id(10)]);
 await check('Unpublished course blocks an enrolled learner',async()=>assert.rejects(()=>db.query('select private.get_my_professional_module($1)',[id(20)]),/Active enrollment required/));
 // Synthetic publication/evidence exists only inside this transient in-memory DB.
 await db.exec("update public.professional_courses set status='published'; update public.professional_course_modules set review_status='approved'; update public.professional_assessment_items set review_status='approved';");
 await db.query(`insert into public.professional_module_progress(enrollment_id,module_id,status) select $1,id,case when sequence=1 then 'available' else 'locked' end from public.professional_course_modules`,[id(11)]);
 const get=async n=>(await db.query('select private.get_my_professional_module($1) as result',[id(n)])).rows[0].result;
 const submit=async(n,answers)=>(await db.query('select private.submit_my_professional_assessment($1,$2::jsonb,$3) as result',[id(n),JSON.stringify(answers),'Synthetic reflection for isolated contract testing.'])).rows[0].result;
 const first=await get(20);
 await check('Learner payload omits answer keys and rationales',async()=>{
  for(const item of first.assessment)assert.deepEqual(Object.keys(item).sort(),['choices','id','item_order','item_type','prompt']);
 });
 const originals=(await db.query('select id,choices,correct_answer from public.professional_assessment_items where module_id=$1 order by item_order',[id(20)])).rows;
 await check('Displayed choices preserve original text and use existing server shuffle',async()=>{
  let changed=false;
  for(const item of first.assessment){const raw=originals.find(x=>x.id===item.id);assert.deepEqual([...item.choices].sort(),[...raw.choices].sort());changed ||= JSON.stringify(item.choices)!==JSON.stringify(raw.choices);}
  assert.ok(changed);
  assert.deepEqual((await get(20)).assessment,first.assessment);
 });
 await check('All wrong answer texts score zero',async()=>{
  const answers=Object.fromEntries(originals.map(x=>[x.id,x.choices[(x.correct_answer.index+1)%4]]));
  const result=await submit(20,answers);assert.equal(result.score,0);assert.equal(result.passed,false);
 });
 await check('Answer-index objects do not accidentally pass the text contract',async()=>{
  const result=await submit(20,Object.fromEntries(originals.map(x=>[x.id,x.correct_answer])));assert.equal(result.score,0);assert.equal(result.passed,false);
 });
 await check('Missing answer is rejected without an attempt row',async()=>{
  const before=(await db.query('select count(*) as n from public.professional_assessment_attempts')).rows[0].n;
  await assert.rejects(()=>submit(20,{}),/Every assessment item/);
  assert.equal((await db.query('select count(*) as n from public.professional_assessment_attempts')).rows[0].n,before);
 });
 await check('Locked next module is inaccessible',async()=>assert.rejects(()=>get(21),/locked/));
 for(let i=0;i<7;i++)await check(`Correct displayed answer texts pass ${keys[i]} and unlock next module`,async()=>{
  const learner=await get(20+i);
  const rows=(await db.query('select id,choices,correct_answer from public.professional_assessment_items where module_id=$1',[id(20+i)])).rows;
  const answers=Object.fromEntries(rows.map(x=>{
   const text=x.choices[x.correct_answer.index];assert.ok(learner.assessment.find(y=>y.id===x.id).choices.includes(text));return [x.id,text];
  }));
  const result=await submit(20+i,answers);assert.equal(result.score,100);assert.equal(result.passed,true);assert.equal(result.next_module_id,id(21+i));
 });
 await check('Capstone remains unpassed by quiz progression',async()=>{
  const cap=await get(27);assert.equal(cap.progress.status,'available');assert.deepEqual(cap.assessment,[]);
  await assert.rejects(()=>submit(27,{}),/Assessable module not found/);
 });
 await check('Unenrolled actor cannot read another learner module',async()=>{
  await db.query("select set_config('test.user',$1,false)",[id(2)]);await assert.rejects(()=>get(20),/Active enrollment/);
 });
 const output={status:'passed',count:results.length,engine:(await db.query('select version() as v')).rows[0].v,
  scope:'In-memory PostgreSQL with original table DDL, 56 authored items and current repository learner/grading functions; no hosted Auth, full frontend, RLS or production writes.',
  source_sha256:Object.fromEntries(inputs.map(p=>[base+p,createHash('sha256').update(read(base+p)).digest('hex')])),results};
 writeFileSync(new URL('foundations-contract-results.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify({status:output.status,count:output.count,scope:output.scope}));
}finally{await db.close();}
