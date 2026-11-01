// Generate an isolated browser fixture using the exact approved resource markup
// and the edited runtime. No network client or production keys are included.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=process.argv[2];
if(!out||!resolve(out).startsWith('/workspace/scratch/')||resolve(out).startsWith(root))throw Error('Use a scratch preview directory outside the checkout');
mkdirSync(out,{recursive:true});
const page=readFileSync(join(root,'index.html'),'utf8');
const start=page.indexOf('<section class="page" id="page-resources">'),end=page.indexOf('<section class="page" id="page-community">',start);
if(start<0||end<0)throw Error('Resource markup boundaries changed');
const body=page.slice(start,end).replace('class="page"','class="page active"');
writeFileSync(join(out,'resource-fixture.js'),readFileSync(new URL('resource-fixture.js',import.meta.url)));
writeFileSync(join(out,'paths-resources.js'),readFileSync(join(root,'paths-resources.js')));
writeFileSync(join(out,'lellee-v1.css'),readFileSync(join(root,'lellee-v1.css')));
writeFileSync(join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Lellee isolated resource fixture</title><link rel="stylesheet" href="lellee-v1.css"><style>body{margin:0;padding:24px;background:#faf8fc;color:#272136;font-family:system-ui}.hidden{display:none!important}.fixture{padding:16px;border:2px solid #70548b;margin-bottom:18px}.fixture label{display:inline-block;margin:8px}.page{display:block}button,select,input{font:inherit}#fixtureAuth{border:2px solid #70548b;padding:16px}.approved-inner{max-width:1100px;margin:auto}</style><div class="fixture"><b>TEST FIXTURE — SYNTHETIC DIRECTORY ONLY</b><p>No live accounts, services or database writes.</p><label>Test program <select id="fixtureProgram"><option value="caregiving">Caregiving</option><option value="reentry">Returning Home</option><option value="recovery">Recovery</option><option value="independent-living">Building Independence</option></select></label><label>Test response <select id="fixtureMode"><option value="normal">Normal</option><option value="empty">Empty directory</option><option value="error">Directory load error</option><option value="save-error">Save error</option><option value="saved-read-error">Saved status error</option><option value="slow-caregiving">Delayed Caregiving response</option></select></label><label><input id="fixtureSigned" type="checkbox"> Signed-in fixture</label><p id="fixtureWrites">Synthetic writes: 0</p></div><div id="fixtureAuth" class="hidden">Sign-in requested. No real sign-in occurs in this fixture.<button id="fixtureAuthClose">Close sign-in notice</button></div><div id="globalToast" class="hidden" role="status"></div>${body}<script src="resource-fixture.js"></script><script src="paths-resources.js"></script></html>`);
console.log('Prepared synthetic resource browser fixture outside checkout');
