import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

export async function testDatabase() {
  const local = process.env.LELLEE_LOCAL_PG_TEST_URL;
  if (!local) return new PGlite({ extensions: { pgcrypto } });
  const url = new URL(local);
  assert.equal(url.hostname, '127.0.0.1', 'Fixture connections must remain local');
  assert.match(url.pathname, /^\/lellee_fixture_(sql|privacy|content)$/);
  const { Client } = await import('pg');
  const client = new Client({ connectionString: local });
  await client.connect();
  return { query: (...args) => client.query(...args), exec: sql => client.query(sql), close: () => client.end() };
}

export function resultName(name) {
  return process.env.LELLEE_LOCAL_PG_TEST_URL ? `native17-${name}` : name;
}
