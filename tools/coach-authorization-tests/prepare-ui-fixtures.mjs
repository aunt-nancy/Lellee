import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Serve only from an isolated local preview. Never package qa/ for deployment.
// Reuse the existing browser suite's fake Auth/backend; no live accounts/writes.
const output = process.argv[2];
assert.ok(output, 'Pass an absolute non-production fixture output directory');
assert.equal(resolve(output), output);
const suite = readFileSync(new URL('ui.mjs', import.meta.url), 'utf8');
let body = suite.split(' await page.addInitScript(({scenario})=>{')[1]?.split(' },{scenario});')[0];
assert.ok(body, 'Expected browser fixture boundary changed');
const write = 'window.fixtureWrites.push({table,row});';
assert.ok(body.includes(write));
body = body.replace(write, `${write}
      let feedback=document.getElementById('fixtureWriteResult');
      if(!feedback){feedback=document.createElement('output');feedback.id='fixtureWriteResult';feedback.setAttribute('role','status');document.body.append(feedback);}
      feedback.textContent=JSON.stringify({table,active:row.active,name:row.name});`);
const html = readFileSync(new URL('../../coaching/index.html', import.meta.url), 'utf8');
mkdirSync(output, { recursive: true });
for (const scenario of ['new', 'approved', 'expired', 'revoked', 'backend_failure']) {
  const setup = `<script>(({scenario})=>{${body}})(${JSON.stringify({ scenario })});</script>`;
  writeFileSync(resolve(output, `${scenario}.html`), html.replace('<script>var sb=', `${setup}<script>var sb=`));
}
console.log('Prepared five isolated mocked-Auth browser fixtures');
