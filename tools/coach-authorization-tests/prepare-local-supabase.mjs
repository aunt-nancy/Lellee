import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const target=resolve(process.argv[2]||'');
assert.ok(process.env.RUNNER_TEMP && target.startsWith(resolve(process.env.RUNNER_TEMP)+'/'));
const dir=join(target,'supabase');
const migrations=readdirSync(join(dir,'migrations')).filter(x=>x.endsWith('.sql'));
assert.equal(migrations.length,1,'Use one fresh CLI-created fixture migration');
let fixture=readFileSync(new URL('fixture-schema.sql',import.meta.url),'utf8');
// Preserve real Supabase roles, Auth tables/functions and their permissions.
fixture=fixture.split('\n').filter(line=>
 !line.startsWith('create role anon;') && !line.startsWith('create schema auth;') &&
 !line.startsWith('create table auth.users(') && !line.startsWith('create function auth.uid()') &&
 !line.startsWith('create function auth.jwt()')
).join('\n').replace('grant execute on all functions in schema public,auth','grant execute on all functions in schema public');
assert.ok(!fixture.includes('create table auth.users'));
const header="create schema if not exists private; create schema if not exists extensions; create extension if not exists pgcrypto with schema extensions;\n";
const migration=header+fixture+'\n'+readFileSync(new URL('fixture-public-cards.sql',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../../supabase/migrations/20261029193037_independent_coach_service_authorization.sql',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../../supabase/migrations/20261030161649_isolate_coaching_group_schedule_reads.sql',import.meta.url),'utf8')+"\ncreate table private.isolated_auth_fixture(marker text); insert into private.isolated_auth_fixture values('lellee-synthetic-auth-contract');\n";
writeFileSync(join(dir,'migrations',migrations[0]),migration);
const path=join(dir,'config.toml');let config=readFileSync(path,'utf8');
config=config.replace(/(\[auth\.email\][\s\S]*?)(?=\n\[|$)/,section=>section.replace(/^enable_confirmations\s*=\s*true\s*$/m,'enable_confirmations = false'));
assert.ok(config.includes('[auth.email]'));
writeFileSync(path,config);
console.log('Prepared isolated local Supabase fixture; existing Auth definitions preserved');
