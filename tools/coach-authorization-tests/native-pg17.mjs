import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, unlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { Client } from 'pg';
import { initdb, postgres } from '@embedded-postgres/linux-x64';

// New ephemeral native PostgreSQL 17 cluster. No live URL, data or auth secrets.
assert.equal(process.platform, 'linux');
assert.equal(process.arch, 'x64');
assert.notEqual(process.getuid(), 0, 'Native PostgreSQL tests require an existing non-root runner; no system users are created');
const root = mkdtempSync(join(tmpdir(), 'lellee-pg17-'));
const data = join(root, 'data');
const password = randomBytes(30).toString('hex');
const pwfile = join(root, 'fixture-password');
const portServer = createServer();
await new Promise(resolve => portServer.listen(0, '127.0.0.1', resolve));
const port = portServer.address().port;
await new Promise(resolve => portServer.close(resolve));
writeFileSync(pwfile, password, { mode: 0o600 });
const actor = {};
const cwd = fileURLToPath(new URL('./', import.meta.url));
let server;
function command(binary, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd, ...options });
    let error = '';
    child.stderr?.on('data', b => { error += b.toString(); });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Fixture command exited ${code}: ${error.slice(-1600)}`)));
  });
}
try {
  await command(initdb, ['-D', data, '-U', 'postgres', '--auth=scram-sha-256', `--pwfile=${pwfile}`, '--no-locale', '--encoding=UTF8'], actor);
  unlinkSync(pwfile);
  server = spawn(postgres, ['-D', data, '-h', '127.0.0.1', '-p', String(port), '-k', root], actor);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Local PostgreSQL startup timed out')), 20000);
    server.stderr.on('data', bytes => {
      if (bytes.toString().includes('database system is ready to accept connections')) { clearTimeout(timer); resolve(); }
    });
    server.once('error', e => { clearTimeout(timer); reject(e); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Local PostgreSQL exited ${code}`)); });
  });
  const admin = new Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', password });
  await admin.connect();
  const version = (await admin.query('select version()')).rows[0].version;
  assert.match(version, /^PostgreSQL 17\./);
  console.log(version);
  for (const [name, script] of [['sql', 'run.mjs'], ['privacy', 'schedule-privacy.mjs'], ['content', 'content-package.mjs']]) {
    await admin.query(`create database lellee_fixture_${name}`);
    const local = `postgresql://postgres:${password}@127.0.0.1:${port}/lellee_fixture_${name}`;
    await command(process.execPath, [script], { env: { ...process.env, LELLEE_LOCAL_PG_TEST_URL: local }, stdio: ['ignore', 'inherit', 'pipe'] });
    await admin.query(`drop database lellee_fixture_${name}`);
    await admin.query('drop role anon, authenticated, service_role');
  }
  await admin.end();
} finally {
  if (server && server.exitCode === null) {
    const exit = new Promise(resolve => server.once('exit', resolve));
    server.kill('SIGTERM');
    await exit;
  }
  rmSync(root, { recursive: true, force: true });
}
