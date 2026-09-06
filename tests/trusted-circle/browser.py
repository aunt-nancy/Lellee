"""Isolated Chromium UI tests. No live Supabase requests, Auth sessions or RLS claims.
Run from the repository: python tests/trusted-circle/browser.py
Requires playwright; install its Chromium browser or set BROWSER_EXECUTABLE.
"""
import asyncio, datetime, hashlib, json, os, re
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).parent
EVIDENCE=HERE/'evidence'
OUT=[]

def section(source, page):
    pattern=r'<section\b[^>]*\bid="page-'+re.escape(page)+r'"[^>]*>'
    matches=list(re.finditer(pattern,source))
    assert len(matches)==1, f'Expected exactly one actual {page} section'
    start=matches[0].start(); depth=0
    for tag in re.finditer(r'</?section\b[^>]*>',source[start:]):
        depth += -1 if tag.group().startswith('</') else 1
        if depth==0: return source[start:start+tag.end()]
    raise AssertionError('Unclosed section '+page)

def fixture():
    source=(ROOT/'index.html').read_text(encoding='utf-8')
    parts=[section(source,p) for p in ['trusted-circle','supporter-dashboard','collaboration-ops']]
    parts[0]=parts[0].replace('class="page"','class="page active"',1)
    # Only the verified feature sections are exercised. Global application runtimes
    # are intentionally not executed, and this scaffold is not full-site visual QA.
    css='''*{box-sizing:border-box}body{font:16px system-ui;margin:0;padding:24px;background:#f4f5f8}button,input,select,textarea{font:inherit}button{cursor:pointer}.page{display:none}.page.active{display:block}.hidden{display:none!important}.approved-inner{max-width:900px;margin:auto}.approved-inner-head,.commerce-panel-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}.approved-small-action{background:#5b2fa0;color:white;border:0;border-radius:9px;padding:10px}.approved-link{background:none;border:0;color:#65409a}.commerce-tabs{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}.commerce-tabs button{padding:10px;border:1px solid #e8e9ee;border-radius:8px;background:white}h2{font-size:26px}'''
    return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+(ROOT/'trusted-circle.css').read_text()+'</style><body>'+''.join(parts)+'<section class="page" id="page-today">Other page</section><script>'+(HERE/'mock.js').read_text()+'</script><script>'+(ROOT/'trusted-circle.js').read_text()+'</script></body></html>'

async def run():
 EVIDENCE.mkdir(exist_ok=True)
 async with async_playwright() as p:
  options={'headless':True}
  if os.environ.get('BROWSER_EXECUTABLE'): options['executable_path']=os.environ['BROWSER_EXECUTABLE']
  browser=await p.chromium.launch(**options)
  for width,height in [(1280,900),(390,844)]:
   ctx=await browser.new_context(viewport={'width':width,'height':height},timezone_id='America/Los_Angeles')
   await ctx.route('**/*',lambda route:route.abort())
   page=await ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   async def wait_loaded():
    await page.wait_for_function("document.querySelector('.page.active [data-circle-ui-status]')?.textContent.startsWith('Updated.')")
   async def fresh():
    await page.goto('about:blank');await page.set_content(fixture());await wait_loaded()
   async def tab(t): await page.click('[data-circle-tab="'+t+'"]')
   async def dialog(): await page.locator('#lelleeCircleDialog').wait_for(state='visible')
   async def submit():
    await page.click('#lelleeCircleDialog button[type=submit]');await page.locator('#lelleeCircleDialog').wait_for(state='detached');await wait_loaded()
   async def choose():
    await page.select_option('#circleField-relationship','r-two');await page.select_option('#circleField-program','p-home')
   def passed(name):
    OUT.append({'viewport':f'{width}x{height}','test':name,'pass':True});print(width,name,flush=True)
   await fresh()
   assert await page.locator('#circlePeopleList').inner_text() != ''
   assert await page.locator('#circleNewPermission').count()==1
   assert await page.evaluate('TestCircle.subscriptions')==1
   await page.add_script_tag(content=(ROOT/'trusted-circle.js').read_text())
   assert await page.evaluate('TestCircle.subscriptions')==1
   assert await page.locator('#circleIncomingList').count()==1
   passed('Single installation, one Auth listener and one set of controls')
   await page.click('#circleAddPerson');await dialog()
   assert 'Your account email will be visible' in await page.locator('#lelleeCircleDialog').inner_text()
   assert await page.input_value('#circleField-role')==''
   await page.fill('#circleField-email','invited@example.invalid');await page.select_option('#circleField-role','family')
   await page.check('#lelleeCircleDialog input[name=confirm]');await submit()
   assert await page.evaluate("TestCircle.log.some(x=>x.name==='invite_trusted_circle_member'&&x.args.p_email==='invited@example.invalid'&&x.args.p_role_key==='family')")
   passed('Invitation consent disclosure and exact invitation payload')
   await tab('tasks');await page.click('#circleAddSharedTask');await dialog()
   assert await page.input_value('#circleField-relationship')=='' and await page.input_value('#circleField-program')==''
   await page.click('#lelleeCircleDialog button[type=submit]');assert await page.locator('#lelleeCircleDialog').count()==1
   await choose();assert not await page.locator('#circleField-program option[value=p-off]').count()
   await page.fill('#circleField-title','Second selected person');await page.check('#lelleeCircleDialog input[name=confirm]')
   await page.screenshot(path=str(EVIDENCE/f'dialog-{width}.png'),full_page=True)
   bounds=await page.locator('#lelleeCircleDialog').bounding_box();assert bounds['x']>=0 and bounds['x']+bounds['width']<=width
   await page.evaluate("TestCircle.delay=100;document.querySelector('#lelleeCircleDialog form').requestSubmit();document.querySelector('#lelleeCircleDialog form').requestSubmit()")
   await page.locator('#lelleeCircleDialog').wait_for(state='detached');await wait_loaded()
   writes=await page.evaluate("TestCircle.log.filter(x=>x.table==='trusted_circle_shared_tasks'&&x.op==='insert')")
   assert len(writes)==1 and writes[0]['payload']['relationship_id']=='r-two' and writes[0]['payload']['program_id']=='p-home'
   assert writes[0]['payload']['owner_user_id']=='owner-a'
   passed('Deliberate second person/program, disabled program excluded, duplicate submit blocked, dialog fits')
   await page.evaluate('TestCircle.delay=0');await page.click('#circleNewAppointment');await dialog();await choose()
   await page.fill('#circleField-title','Selected meeting');await page.fill('#circleField-due','2026-09-10T11:30');await page.fill('#circleField-location','Front desk')
   await page.check('#lelleeCircleDialog input[name=confirm]');await submit()
   assert await page.evaluate("TestCircle.log.some(x=>x.table==='trusted_circle_shared_appointments'&&x.op==='insert'&&x.payload.starts_at==='2026-09-10T18:30:00.000Z')")
   passed('Appointment payload and local-time UTC conversion')
   await tab('checkins');await page.click('#circleRequestCheckin');await dialog();await choose();await page.fill('#circleField-title','Practical request only');await page.check('#lelleeCircleDialog input[name=confirm]');await submit()
   assert await page.evaluate("TestCircle.log.some(x=>x.table==='trusted_circle_checkins'&&x.op==='insert'&&x.payload.relationship_id==='r-two')")
   passed('Practical request uses selected recipient, not private daily-checkin table')
   await tab('emergency');await page.click('#circleAddEmergency');await dialog();await page.fill('#circleField-label','Owner-only emergency record');await submit()
   assert await page.evaluate("TestCircle.log.some(x=>x.table==='trusted_circle_emergency_contacts'&&x.op==='insert'&&x.payload.user_id==='owner-a'&&!('automatic_contact_allowed' in x.payload))")
   passed('Owner-only contact payload; no automatic-contact field')
   await tab('sharing');await page.click('#circleNewPermission');await dialog();await choose();await page.select_option('#circleField-scope','shared_tasks')
   assert await page.locator('#circleField-scope option').count()==3
   await page.fill('#circleField-expires','2020-01-01T00:00');await page.check('#lelleeCircleDialog input[name=confirm]');await page.click('#lelleeCircleDialog button[type=submit]')
   await page.locator('.circle-ui-error').filter(has_text='end must').wait_for()
   await page.fill('#circleField-expires','');await submit()
   assert await page.evaluate("TestCircle.log.some(x=>x.table==='trusted_circle_shares'&&x.op==='insert'&&x.payload.program_id==='p-home'&&x.payload.relationship_id==='r-two')")
   passed('Implemented sharing categories only; expired window rejected')
   await page.click('[data-circle-action=history]');await dialog()
   await page.select_option('#circleField-grant',index=1);await page.check('#lelleeCircleDialog input[name=confirm]');await submit()
   assert await page.evaluate("TestCircle.log.some(x=>x.table==='trusted_circle_shares'&&x.op==='delete'&&x.filters.some(f=>f[0]==='owner_user_id'&&f[1]==='owner-a'))")
   passed('Permission-history removal uses explicit selection and owner filter')
   await fresh();await page.evaluate("TestCircle.auth('supporter-a');TestCircle.navigate('supporter-dashboard')");await wait_loaded()
   assert await page.locator('#circleIncomingList [data-circle-action=accept]').count()==1
   assert 'Private contact' not in await page.locator('#page-supporter-dashboard').inner_text()
   await page.click('[data-circle-action=accept]');await dialog();await submit()
   assert await page.evaluate("TestCircle.log.some(x=>x.name==='respond_trusted_circle_relationship'&&x.args.p_action==='accept'&&x.args.p_relationship_id==='r-invite')")
   passed('Supporter accept control; no emergency-contact display')
   await page.click('[data-circle-action=respond-task]');await dialog();await submit()
   assert await page.evaluate("TestCircle.log.some(x=>x.name==='respond_trusted_circle_item'&&x.args.p_item_kind==='task'&&x.args.p_item_id==='task-one')")
   await page.click('[data-circle-action=ack-checkin]');await dialog();await submit()
   await page.click('[data-circle-action=respond-checkin]');await dialog();await page.fill('#circleField-response','Done');await submit()
   assert await page.evaluate("TestCircle.log.some(x=>x.name==='respond_trusted_circle_item'&&x.args.p_response==='Done'&&x.args.p_item_kind==='checkin')")
   passed('Task completion and check-in acknowledgment/response exact RPC arguments')
   await fresh();await page.evaluate("TestCircle.tables.trusted_circle_shared_tasks[0].title='<img src=x onerror=window.injected=true>';LelleeCircleUI.refresh()")
   await wait_loaded();await tab('tasks')
   assert await page.locator('#circleTaskList img').count()==0 and not await page.evaluate('Boolean(window.injected)')
   passed('Untrusted content rendered as text rather than executable markup')
   await page.click('#circleAddSharedTask');await dialog();await page.fill('#circleField-title','PRIVATE UNSAVED')
   await page.evaluate('TestCircle.auth(null)')
   assert await page.locator('#lelleeCircleDialog').count()==0 and 'PRIVATE UNSAVED' not in await page.content()
   assert (await page.locator('#circleTaskList').inner_text())==''
   passed('Sign-out clears content, account labels and unsaved dialog')
   await fresh();await page.evaluate('TestCircle.hold=true;void LelleeCircleUI.refresh()')
   await page.wait_for_function('TestCircle.resolvers.length>=3')
   await page.evaluate("TestCircle.auth('outsider');TestCircle.release()")
   await wait_loaded();assert 'supporter-a@example.invalid' not in await page.locator('#circlePeopleList').inner_text()
   assert 'Selected task' not in await page.locator('#circleTaskList').inner_text()
   passed('Delayed former-account responses cannot repaint after account switch')
   await fresh();await page.evaluate('TestCircle.fail=true;LelleeCircleUI.refresh()')
   await page.locator('.page.active [role=alert]').filter(has_text='Simulated connection failure').wait_for()
   assert (await page.locator('#circlePeopleList').inner_text())==''
   passed('Connection errors remove old data and report failure')
   await fresh();await page.evaluate("TestCircle.client.supabaseUrl='https://wrong.supabase.co';TestCircle.log=[];LelleeCircleUI.refresh()")
   await page.locator('.page.active [role=alert]').filter(has_text='not configured').wait_for()
   assert await page.evaluate('TestCircle.log.length')==0
   passed('Wrong Supabase project blocked before requests')
   await fresh();await page.evaluate("TestCircle.navigate('collaboration-ops')")
   await page.locator('.page.active [role=alert]').filter(has_text='Admin access').wait_for()
   assert not await page.evaluate("TestCircle.log.some(x=>x.name==='get_collaboration_operations_summary')")
   await page.evaluate('TestCircle.admin=true;LelleeCircleUI.refresh()');await wait_loaded()
   assert 'No automatic contact' in await page.locator('#collabGuardrailList').inner_text()
   passed('Canonical Admin check gates operations summary')
   await fresh();await page.evaluate("TestCircle.navigate('today');TestCircle.log=[]")
   await page.wait_for_timeout(200);assert await page.evaluate('TestCircle.log.length')==0
   assert (await page.locator('#circlePeopleList').inner_text())==''
   assert not errors,errors
   passed('Other-page navigation clears data; no idle polling or page errors observed')
   await ctx.close()
  await browser.close()
 result={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mode':'Chromium actual feature-section DOM with synthetic Supabase responses, not full-app/live Auth/API/Safari testing','groups_passed':len(OUT),'results':OUT,'source_sha256':{n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in ['index.html','trusted-circle.js','trusted-circle.css']}}
 (EVIDENCE/'browser-results.json').write_text(json.dumps(result,indent=2))
 print(json.dumps({'groups_passed':len(OUT),'all_passed':True}),flush=True)

if __name__=='__main__':asyncio.run(run())
