import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// Real HTML/JavaScript; all network requests are intercepted. No live Auth/API.
const root=fileURLToPath(new URL('../../',import.meta.url));
const browser=await chromium.launch({headless:true,
 executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,
 args:JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS||'[]')});
const results=[];
for(const scenario of ['new','approved','expired','revoked','backend_failure']){
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 page.setDefaultTimeout(8000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({scenario})=>{
  window.fixtureWrites=[];
  const user={id:'00000000-0000-0000-0000-000000000001',email:'fixture@example.test'};
  const business={id:'fixture-business',business_name:'Fixture practice',public_name:'Fixture',status:'approved',primary_program_id:'fixture-program'};
  const context={has_business:true,business,programs:[{id:'fixture-program',name:'Fixture program'}],clients:[],services:[],groups:[],messages:[],assignments:[],leads:[],metrics:{}};
  const client={auth:{
   getSession:async()=>({data:{session:{user}},error:null}),getUser:async()=>({data:{user},error:null}),
   onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
  },rpc:async name=>{
   if(name==='get_my_coach_dashboard_context')return {data:context,error:null};
   if(name==='get_my_independent_coach_service_authorization')return scenario==='backend_failure'
    ? {data:null,error:{message:'Fixture unavailable'}}
    : {data:{programs:[{business_id:business.id,program_id:'fixture-program',authorized:scenario==='approved',status:scenario}]},error:null};
   if(name==='get_my_coach_certification_context')return {data:{has_business:true,readiness:{},summary:{},credentials:[],training:[],certificates:[]},error:null};
   return {data:{},error:null};
  },from:table=>{
   const result={data:[],error:null};
   const proxy=new Proxy({}, {get:(_,key)=>{
    if(key==='then')return (resolve)=>resolve(result);
    if(key==='insert')return row=>{window.fixtureWrites.push({table,row});return Promise.resolve({data:null,error:null});};
    return ()=>proxy;
   }});return proxy;
  }};
  window.supabase={createClient:()=>client};
 },{scenario});
 await page.route('**/*',async route=>{
  const path=new URL(route.request().url()).pathname;
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root)||!existsSync(file))return route.fulfill({status:404,body:''});
  const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'};
  return route.fulfill({status:200,contentType:types[extname(file)]||'application/octet-stream',body:readFileSync(file)});
 });
 try{
  await page.goto('https://fixture.test/coaching/index.html#coach-dashboard');
  await page.waitForFunction(()=>window.LelleeCoachingIndex?.ready===true);
  await page.locator('#coachingServiceAuthorizationNotice').waitFor({state:'visible'});
  await page.waitForFunction(()=>{
   const value=document.querySelector('#coachingServiceAuthorizationNotice')?.textContent;
   return value&&value.length>0&&!value.startsWith('Checking');
  });
  assert.equal(await page.locator('#page-coach-dashboard').evaluate(el=>el.classList.contains('active')),true);
  const notice=await page.locator('#coachingServiceAuthorizationNotice').textContent();
  if(scenario==='approved')assert.match(notice,/approved for 1 program/);
  else if(scenario==='backend_failure')assert.match(notice,/could not be checked/);
  else if(['expired','revoked'].includes(scenario))assert.match(notice,/needs attention/);
  else assert.match(notice,/Onboarding in progress/);
  await page.waitForFunction(()=>!!window.LelleeCoachDashboardLive);
  await page.waitForFunction(()=>document.querySelector('#coachDashboardBusinessName')?.textContent==='Fixture practice');
  await page.locator('[data-coach-tab="services"]').click();
  await page.locator('#coachNewService').click();
  await page.locator('#liveServiceName').fill('Prepared fixture offer');
  await page.locator('#liveServiceProgram').selectOption('fixture-program');
  await page.locator('#coachServiceForm button[type="submit"]').click();
  await page.waitForFunction(()=>window.fixtureWrites.some(w=>w.table==='coach_service_packages'));
  const row=await page.evaluate(()=>window.fixtureWrites.find(w=>w.table==='coach_service_packages').row);
  assert.equal(row.active,scenario==='approved');
  // Desktop and narrow mobile layout both retain readable onboarding status.
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.querySelector('#coachWorkspaceSidebar').getBoundingClientRect().right<=0);
  await page.evaluate(()=>window.scrollTo(0,0));
  assert.equal(await page.locator('#coachingServiceAuthorizationNotice').isVisible(),true);
  const noticeBox=await page.locator('#coachingServiceAuthorizationNotice').boundingBox();
  assert.ok(noticeBox.y>=0&&noticeBox.y+noticeBox.height<=844);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  assert.deepEqual(errors,[]);
  if(scenario==='new'&&process.env.COACH_AUTHORIZATION_VISUAL_QA_PATH)await page.screenshot({path:process.env.COACH_AUTHORIZATION_VISUAL_QA_PATH});
  results.push({scenario,passed:true});
 }catch(e){results.push({scenario,passed:false,error:e.message,errors});console.error('FAIL',scenario,e.message,errors);}
 await page.close();
}
await browser.close();
writeFileSync(new URL('./ui-results.json',import.meta.url),JSON.stringify({scope:'Headless Chromium; real page and scripts; mocked Auth/backend',results},null,2)+'\n');
console.log(JSON.stringify({passed:results.filter(r=>r.passed).length,total:results.length}));
if(results.some(r=>!r.passed))process.exitCode=1;
