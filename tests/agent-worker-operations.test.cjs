const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync(__dirname+'/../dynamic-worker-index.ts','utf8').replace(/import \{ createClient \} from "npm:@supabase\/supabase-js@2";/,'const createClient = globalThis.createClient;'));
const base={task_id:'t1',agent_id:'a1',agent_key:'trend-demand-intelligence',agent_name:'Trend & Demand Intelligence Agent',agent_type:'trend_intelligence',agent_description:'public research',objective:'Test public evidence.',task_type:'research',external_execution_required:true,title:'test',priority:'normal'};
async function scenario({task={...base},research=true,recurring=false,search=true,sources=3,credit=false,method='POST',secret='test-secret',human=true,queueError=false,globalError=false}={}){
 const writes=[],calls=[],rpcs=[];let handler;
 const settings={agent_worker_enabled:'true',agent_external_execution_enabled:'true',agent_external_research_execution_enabled:String(research),agent_human_review_required:String(human),agent_recurring_missions_enabled:String(recurring)};
 function from(table){let op='read',values,filter={};const b={select(){return b},eq(k,v){filter[k]=v;return b},insert(v){op='insert';values=v;return b},update(v){op='update';values=v;return b},maybeSingle(){return finish()},single(){return finish()},then(a,z){return finish().then(a,z)}};
 async function finish(){if(op==='read')return {data:table==='app_public_settings'?{value:settings[filter.key]}:[],error:null};writes.push({table,op,values,filter});return {data:table==='agent_runs'&&op==='insert'?{id:'r1'}:null,error:null};}return b;}
 const client={from,async rpc(name,args){rpcs.push({name,args});if(name==='lellee_queue_due_agent_missions_v2')return {data:{queued:0},error:queueError?{message:'test queue failure'}:null};return {data:task?[task]:[],error:null};}};
 vm.runInNewContext(source,{createClient:()=>client,Deno:{env:{get:k=>({SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-service',OPENAI_API_KEY:'test-key',LELLEE_AGENT_WORKER_SECRET:'test-secret'}[k])},serve:h=>handler=h},Response,Request,Date,Map,Set,JSON,Number,String,Boolean,Error,fetch:async(url,init)=>{calls.push(JSON.parse(init.body));if(credit)return new Response(JSON.stringify({error:{message:'You have no credits remaining.'}}),{status:429});return new Response(JSON.stringify({id:'resp1',output_text:'A sourced draft for review.',output:[...(search?[{type:'web_search_call',status:'completed'}]:[]),{type:'message',content:[{type:'output_text',text:'A sourced draft for review.',annotations:Array.from({length:sources},(_,i)=>({type:'url_citation',url:'https://example.org/source/'+i,title:'Source '+i}))}]}],usage:{input_tokens:100,output_tokens:50}}));}});
 const res=await handler(new Request('https://worker.invalid',{method,headers:{'content-type':'application/json','x-lellee-agent-worker-secret':secret},...(method==='POST'?{body:JSON.stringify({mode:'run',limit:1})}:{})}));return {status:res.status,body:await res.json(),writes,calls,rpcs};
}
(async()=>{
 let n=0;const check=(name,fn)=>{fn();n++;console.log('PASS '+name)};
 let r=await scenario();check('trend research uses required web search',()=>{assert.equal(r.calls[0].tools[0].type,'web_search');assert.equal(r.calls[0].tool_choice,'required');assert.equal(r.body.results[0].web_search_used,true)});
 check('outputs remain pending review',()=>assert.equal(r.writes.find(w=>w.table==='agent_outputs').values.review_status,'pending'));
 r=await scenario({research:false});check('research disabled blocks without model call',()=>{assert.equal(r.calls.length,0);assert.equal(r.body.results[0].error,'public_research_disabled');assert(!r.writes.some(w=>w.table==='agent_outputs'))});
 r=await scenario({search:false});check('no executed search fails instead of producing offline research',()=>{assert.equal(r.body.results[0].status,'failed');assert(!r.writes.some(w=>w.table==='agent_outputs'))});
 r=await scenario({sources:0});check('source-free research fails',()=>assert.equal(r.body.results[0].status,'failed'));
 r=await scenario({sources:2});check('demand research needs three sources',()=>assert.match(r.body.results[0].error,/three_sources/));
 r=await scenario({task:{...base,agent_key:'content-qa',agent_type:'content_qa',external_execution_required:false},sources:0,search:false});check('supplied content work does not require web',()=>{assert.equal(r.calls[0].tools,undefined);assert.equal(r.body.results[0].status,'needs_review')});
 r=await scenario({task:{...base,agent_key:'operations-copilot',agent_type:'operations',external_execution_required:true}});check('explicit research requirement honored for any specialist',()=>assert.equal(r.body.results[0].web_search_used,true));
 r=await scenario({secret:'wrong'});check('worker secret still required',()=>{assert.equal(r.status,401);assert.equal(r.calls.length,0)});
 r=await scenario({method:'GET'});check('non-POST rejected',()=>assert.equal(r.status,405));
 r=await scenario({human:false});check('review guard remains mandatory',()=>{assert.equal(r.status,409);assert.equal(r.calls.length,0)});
 r=await scenario({recurring:true,task:null});check('recurring drafts queue before claiming tasks',()=>{assert.equal(r.rpcs[0].name,'lellee_queue_due_agent_missions_v2');assert.equal(r.rpcs[0].args.p_dry_run,false);assert.equal(r.body.processed,0)});
 r=await scenario({recurring:false,task:null});check('disabled recurrence never calls scheduler',()=>assert(!r.rpcs.some(x=>x.name==='lellee_queue_due_agent_missions_v2')));
 r=await scenario({recurring:true,queueError:true});check('scheduler failure does not claim or spend',()=>{assert.equal(r.status,500);assert.equal(r.calls.length,0);assert.equal(r.rpcs.length,1)});
 r=await scenario({credit:true});check('credit failure remains blocked without output',()=>{assert.equal(r.body.results[0].status,'blocked');assert.equal(r.body.results[0].error,'external_api_credits_required');assert(!r.writes.some(w=>w.table==='agent_outputs'))});
 console.log(n+' worker behavior tests passed');
})().catch(e=>{console.error(e);process.exit(1)});
