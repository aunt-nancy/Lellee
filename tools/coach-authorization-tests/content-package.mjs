import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { testDatabase, resultName } from './test-database.mjs';
import { contentPackage, validatePackage, stageContent } from './stage-content.mjs';

const here = new URL('./', import.meta.url);
const db = await testDatabase();
const results = [];
const id = n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
async function test(name, fn) {
  try { await fn(); results.push({name,passed:true}); }
  catch(error) { results.push({name,passed:false,error:error.message}); }
}
async function actor(uid,role='authenticated') {
  await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id(uid),role})]);
  await db.exec(`set role ${role}`);
}
try {
  await test('Seven packs and 210 unpublished, source-linked, participant-selected activities validate', async()=>validatePackage());
  await db.exec(readFileSync(new URL('fixture-schema.sql',here),'utf8'));
  await db.exec(readFileSync(new URL('fixture-content.sql',here),'utf8'));
  await db.exec("alter table public.programs add column status text not null default 'planned'; create table public.journey_content(id uuid primary key,program_id uuid,title text,published boolean)");
  for (const [i,slug] of contentPackage.approved_portfolio.entries()) await db.query('insert into public.programs(id,slug,name,status) values($1,$2,$2,$3)',[id(i+101),slug,['recovery','caregiving','reentry','housing-stability','independent-living'].includes(slug)?'active':'planned']);
  await db.query('insert into public.journey_content values($1,$2,$3,true)',[id(901),id(101),'Existing Recovery sentinel']);
  await db.exec(`insert into auth.users(id,email) values('${id(1)}','reviewer@example.test'),('${id(2)}','member@example.test'); insert into private.test_admins values('${id(1)}')`);
  const beforePrograms=(await db.query('select * from public.programs order by slug')).rows;
  const beforeRecovery=(await db.query('select * from public.journey_content')).rows;
  await test('Staging requires an explicit isolated-session marker and makes no partial write', async()=>{
    await assert.rejects(()=>stageContent(db));
    assert.equal((await db.query('select count(*)::int n from public.program_content_items')).rows[0].n,0);
  });
  await db.exec("select set_config('lellee.isolated_content_review','enabled',false)");
  const first=contentPackage.packs[0].items[0];
  const pid=(await db.query('select id from public.programs where slug=$1',[contentPackage.packs[0].slug])).rows[0].id;
  await db.query("insert into public.program_content_items(program_id,content_key,content_type,title,body_text,status) values($1,$2,'guided_action','Existing published sentinel','Keep the approved record unchanged','published')",[pid,first.content_key]);
  await test('Stage the package without overwriting an existing published item',async()=>{
    assert.deepEqual(await stageContent(db),{inserted:209,skipped:1,published:0});
    const row=(await db.query('select title,body_text,status from public.program_content_items where content_key=$1',[first.content_key])).rows[0];
    assert.deepEqual(row,{title:'Existing published sentinel',body_text:'Keep the approved record unchanged',status:'published'});
  });
  await test('Repeated staging is idempotent',async()=>assert.deepEqual(await stageContent(db),{inserted:0,skipped:210,published:0}));
  await test('All seven programs have 30 items, with valid program-scoped stage links',async()=>{
    assert.deepEqual((await db.query('select p.slug,count(*)::int n from public.program_content_items i join public.programs p on p.id=i.program_id group by p.slug order by p.slug')).rows.map(r=>r.n),Array(7).fill(30));
    assert.equal((await db.query('select count(*)::int n from public.program_content_items i join public.program_journey_stages s on s.id=i.stage_id where i.program_id<>s.program_id')).rows[0].n,0);
  });
  await test('New records contain no fabricated review, publication or author approval',async()=>{
    assert.equal((await db.query("select count(*)::int n from public.program_content_items where status='draft' and (reviewed_by is not null or reviewed_at is not null or published_at is not null or created_by is not null)")).rows[0].n,0);
  });
  await test('All new drafts retain source references and lower-energy alternatives in review metadata',async()=>{
    const rows=(await db.query("select editor_notes from public.program_content_items where status='draft'")).rows;
    assert.equal(rows.length,209);
    for(const row of rows){const n=JSON.parse(row.editor_notes);assert.ok(n.source_refs.length&&n.low_energy_action&&n.review_status==='not_reviewed');}
  });
  await test('Program activation states and published Recovery content remain unchanged',async()=>{
    assert.deepEqual((await db.query('select * from public.programs order by slug')).rows,beforePrograms);
    assert.deepEqual((await db.query('select * from public.journey_content')).rows,beforeRecovery);
  });
  await test('Ordinary signed-in users cannot read any staged draft',async()=>{
    await actor(2); const rows=(await db.query('select status from public.program_content_items')).rows;
    assert.deepEqual(rows,[{status:'published'}]); await db.exec('reset role');
  });
  await test('Anonymous users cannot read staged drafts or stages',async()=>{
    await actor(2,'anon');
    assert.equal((await db.query('select count(*)::int n from public.program_content_items')).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from public.program_journey_stages')).rows[0].n,0);
    await db.exec('reset role');
  });
  await test('Verified fixture administrator can review all 210 items',async()=>{
    await actor(1); assert.equal((await db.query('select count(*)::int n from public.program_content_items')).rows[0].n,210); await db.exec('reset role');
  });
  await test('Unknown program prevents all writes and leaves existing records intact',async()=>{
    const bad=structuredClone(contentPackage);bad.packs[0].slug='unknown';bad.approved_portfolio[2]='unknown';
    await assert.rejects(()=>stageContent(db,bad));
    assert.equal((await db.query('select count(*)::int n from public.program_content_items')).rows[0].n,210);
  });
} catch(error) { results.push({name:'Fixture setup',passed:false,error:error.message}); }
finally {await db.close();}
const summary={scope:'Original draft content plus actual captured Content Studio columns, constraints and RLS; synthetic records only',passed:results.filter(r=>r.passed).length,total:results.length,results};
writeFileSync(new URL(resultName('content-results.json'),here),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
if(summary.passed!==summary.total)process.exitCode=1;
