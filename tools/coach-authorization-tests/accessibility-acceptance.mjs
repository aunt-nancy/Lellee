import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url),read=path=>readFileSync(new URL(path,root),'utf8');
const runtime=read('accessibility-acceptance.js'),styles=read('accessibility-acceptance.css'),pilot=read('pilot-runtime.js'),page=read('index.html');
const results=[];function check(name,fn){fn();results.push({name,status:'passed'})}
check('Approved index markup remains unchanged',()=>assert.ok(page.includes('id="authOverlay"')&&page.includes('id="lelleeMain" tabindex="-1"')));
check('Auth overlay is promoted to a named modal dialog',()=>{for(const text of ["setAttribute('role','dialog')","setAttribute('aria-modal','true')","setAttribute('aria-labelledby','authTitle')","setAttribute('aria-describedby','authMsg')"])assert.ok(runtime.includes(text),text)});
check('Modal opening moves focus and blocks the background',()=>{for(const text of ["shell.inert=blocked","setAttribute('aria-hidden','true')","q('#authEmail')?.focus()","returnFocus=document.activeElement"])assert.ok(runtime.includes(text),text)});
check('Modal focus is trapped and restored',()=>{for(const text of ["event.key!=='Tab'","event.preventDefault();last.focus()","event.preventDefault();first.focus()","target?.focus()"] )assert.ok(runtime.includes(text),text)});
check('Auth fields receive programmatic labels and live feedback',()=>{assert.ok(runtime.includes('labels[0].htmlFor=email.id'));assert.ok(runtime.includes('labels[1].htmlFor=password.id'));assert.ok(runtime.includes("setAttribute('aria-live','polite')"))});
check('Small guest and legal targets meet the 24 CSS pixel floor',()=>{assert.match(styles,/min-height:24px/);assert.match(styles,/min-height:44px/)});
check('Accessibility correction loads without editing the locked page',()=>{assert.ok(pilot.includes('/accessibility-acceptance.js'));assert.ok(pilot.includes('/accessibility-acceptance.css'));assert.ok(!page.includes('/accessibility-acceptance.js'))});
const result={status:'passed',count:results.length,scope:'Static accessibility correction contract for modal semantics, focus containment, labels, live feedback and minimum target sizing. Physical iPhone/Safari and real assistive-technology acceptance remain manual.',results};
writeFileSync(new URL('accessibility-acceptance-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,count:result.count,scope:result.scope}));
