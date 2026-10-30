import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { testDatabase, resultName } from './test-database.mjs';

// Captured canonical policies, synthetic users only; never connects to Supabase.
const here = new URL('./', import.meta.url);
const db = await testDatabase();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const q = n => `'${id(n)}'`;
const results = [];
async function test(name, fn) {
  try { await fn(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}
async function visible(user, role = 'authenticated') {
  await db.exec('begin');
  try {
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: id(user), role })]);
    await db.exec(`set local role ${role}`);
    return (await db.query('select title from public.coach_schedule_events order by title')).rows.map(r => r.title);
  } finally { await db.exec('rollback'); }
}
const migration = '../../supabase/migrations/20261030161649_isolate_coaching_group_schedule_reads.sql';
try {
  await db.exec(readFileSync(new URL('fixture-schema.sql', here), 'utf8'));
  await db.exec(`
    insert into auth.users(id,email) values
      (${q(1)},'coach-a@example.test'),(${q(2)},'client-a@example.test'),
      (${q(3)},'client-b@example.test'),(${q(4)},'unrelated@example.test'),
      (${q(5)},'coach-b@example.test');
    insert into public.programs(id,slug,name) values(${q(11)},'fixture','Fixture');
    insert into public.coach_businesses(id,owner_user_id,business_name,status) values
      (${q(21)},${q(1)},'Practice A','approved'),(${q(22)},${q(5)},'Practice B','approved');
    insert into public.coach_business_members(business_id,user_id,role,status) values
      (${q(21)},${q(1)},'owner','active'),(${q(22)},${q(5)},'owner','active');
    insert into public.coach_client_relationships(id,business_id,coach_user_id,client_user_id,program_id,status) values
      (${q(61)},${q(21)},${q(1)},${q(2)},${q(11)},'active'),
      (${q(62)},${q(21)},${q(1)},${q(3)},${q(11)},'active'),
      (${q(63)},${q(22)},${q(5)},${q(3)},${q(11)},'active');
    insert into public.coach_groups(id,business_id,program_id,name,status) values
      (${q(71)},${q(21)},${q(11)},'Group A','active'),
      (${q(72)},${q(21)},${q(11)},'Group B','active'),
      (${q(73)},${q(22)},${q(11)},'Other practice','active');
    insert into public.coach_group_members(group_id,relationship_id,status) values
      (${q(71)},${q(61)},'active'),(${q(72)},${q(62)},'active'),(${q(73)},${q(63)},'active');
    insert into public.coach_schedule_events(id,business_id,relationship_id,group_id,title,session_scope) values
      (${q(101)},${q(21)},${q(61)},null,'A private','one_to_one'),
      (${q(102)},${q(21)},${q(62)},null,'B private','one_to_one'),
      (${q(103)},${q(21)},null,${q(71)},'Group A','group'),
      (${q(104)},${q(21)},null,${q(72)},'Group B','group'),
      (${q(105)},${q(22)},null,${q(73)},'Other practice','group'),
      (${q(106)},${q(21)},null,null,'Internal','admin');
  `);
  await test('Reproduces original defect: one group member sees unrelated private sessions', async () => {
    assert.ok((await visible(2)).includes('B private'));
  });
  const writeBefore = (await db.query("select * from pg_policies where tablename='coach_schedule_events' and cmd='ALL'")).rows;
  await db.exec(readFileSync(new URL(migration, here), 'utf8'));
  await test('Client A sees only own private session and Group A', async () => {
    assert.deepEqual(await visible(2), ['A private', 'Group A']);
  });
  await test('Client B sees own session and its two groups, not Client A or internal events', async () => {
    assert.deepEqual(await visible(3), ['B private', 'Group B', 'Other practice']);
  });
  await test('Unrelated signed-in user sees no schedule rows', async () => {
    assert.deepEqual(await visible(4), []);
  });
  await test('Practice A coach retains Practice A schedule access only', async () => {
    assert.deepEqual(await visible(1), ['A private', 'B private', 'Group A', 'Group B', 'Internal']);
  });
  await test('Practice B coach retains only Practice B access', async () => {
    assert.deepEqual(await visible(5), ['Other practice']);
  });
  await db.exec(`update public.coach_group_members set status='inactive' where relationship_id=${q(61)}`);
  await test('Inactive group membership removes group access and preserves own appointment', async () => {
    assert.deepEqual(await visible(2), ['A private']);
  });
  await db.exec(`update public.coach_group_members set status='active' where relationship_id=${q(61)};
    insert into public.coach_schedule_events(business_id,relationship_id,group_id,title) values
      (${q(22)},${q(61)},null,'Mismatched relationship'),
      (${q(22)},null,${q(71)},'Mismatched group');`);
  await test('Mismatched business IDs do not expose schedule rows to the client', async () => {
    assert.deepEqual(await visible(2), ['A private', 'Group A']);
  });
  await db.exec(`insert into public.coach_group_members(group_id,relationship_id,status) values(${q(73)},${q(61)},'active')`);
  await test('Cross-practice membership cannot borrow another practice relationship', async () => {
    assert.deepEqual(await visible(2), ['A private', 'Group A']);
  });
  await test('Anonymous role has no schedule access', async () => {
    await assert.rejects(() => visible(2, 'anon'), error => error.code === '42501');
  });
  await test('Schedule write policy remains unchanged', async () => {
    assert.deepEqual((await db.query("select * from pg_policies where tablename='coach_schedule_events' and cmd='ALL'")).rows, writeBefore);
  });
  await test('Policy migration creates no extra permissive read policy', async () => {
    assert.equal((await db.query("select count(*)::int n from pg_policies where tablename='coach_schedule_events' and cmd='SELECT'")).rows[0].n, 1);
  });
} catch (error) {
  results.push({ name: 'Fixture setup', passed: false, error: error.message });
} finally { await db.close(); }
const summary = { scope: 'Actual SELECT policy; reduced captured schema; synthetic actors and JWT/role simulation; no live Auth', passed: results.filter(r => r.passed).length, total: results.length, results };
writeFileSync(new URL(resultName('schedule-results.json'), here), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary));
if (summary.passed !== summary.total) process.exitCode = 1;
