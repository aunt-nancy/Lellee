let currentUser=null,activeBrowseProgram='caregiving';
const data={city:'',state:''};
const labels={caregiving:'Caregiving',reentry:'Returning Home',recovery:'Recovery','independent-living':'Building Independence'};
let fixtureMode='normal',fixtureWrites=0;
const saved={saved_resources:new Set(),user_saved_resources:new Set()};
function programPreviewConfig(slug){return {label:labels[slug]||slug}}
function showAuthOverlay(){document.querySelector('#fixtureAuth').classList.remove('hidden')}
function showPage(){document.querySelector('#page-resources').classList.add('active')}
const sb={
 async rpc(name,args){
  if(name!=='get_public_program_resources')throw Error('Unexpected fixture RPC');
  const slug=args.p_program_slug,mode=fixtureMode;
  if(mode==='slow-caregiving'&&slug==='caregiving')await new Promise(r=>setTimeout(r,1800));
  if(mode==='error')return {error:{message:'Synthetic directory failure'}};
  const common={id:'00000000-0000-0000-0000-000000000011',source:slug==='recovery'?'local':'service',resource_type:slug==='caregiving'?'caregiving':slug==='recovery'?'meeting':'community',category_label:slug==='recovery'?null:labels[slug],name:'Test '+slug+' support',description:'Synthetic public directory record.',city:'',state:'',website_url:'https://example.com/',phone:null,cost_level:'free',virtual_available:true,sponsored:false,pathways:slug==='recovery'?['12_step']:[]};
  const unsafe={...common,id:'00000000-0000-0000-0000-000000000012',name:'Test blocked unsafe link',website_url:'javascript:alert(1)',phone:'bad:phone'};
  const sponsored={...common,id:'00000000-0000-0000-0000-000000000013',name:'Test sponsored listing',sponsored:true,sponsor_label:'Sponsored'};
  return {data:{program:{id:slug,slug,name:labels[slug]},resources:mode==='empty'?[]:[common,unsafe,sponsored]},error:null};
 },
 from(table){
  let action='select',payload=null,resource=null;
  const query={select(){return query},eq(key,value){if(key==='resource_id')resource=value;return query},order(){return query},maybeSingle(){return query},single(){return query},delete(){action='delete';return query},insert(value){action='insert';payload=value;return query},then(resolve,reject){
   let result;
   if(action!=='select'){
    if(!currentUser)throw Error('Guest write attempted');
    if(fixtureMode==='save-error')result={error:{message:'Synthetic save failure'}};
    else{if(action==='insert')saved[table].add(payload.resource_id);else saved[table].delete(resource);fixtureWrites++;document.querySelector('#fixtureWrites').textContent='Synthetic writes: '+fixtureWrites;result={error:null};}
   }else if(table==='user_program_state')result={data:{active_program_id:activeBrowseProgram},error:null};
   else if(table==='programs')result={data:{slug:activeBrowseProgram},error:null};
   else if(table==='saved_resources'||table==='user_saved_resources')result=fixtureMode==='saved-read-error'?{error:{message:'Synthetic saved read failure'}}:{data:[...saved[table]].map(resource_id=>({resource_id})),error:null};
   else result={data:null,error:null};
   return Promise.resolve(result).then(resolve,reject);
  }};return query;
 }
};
document.querySelector('#fixtureProgram').addEventListener('change',e=>{activeBrowseProgram=e.target.value;showPage('resources')});
document.querySelector('#fixtureMode').addEventListener('change',e=>{fixtureMode=e.target.value;showPage('resources')});
document.querySelector('#fixtureSigned').addEventListener('change',e=>{currentUser=e.target.checked?{id:'synthetic-user'}:null;showPage('resources')});
document.querySelector('#fixtureAuthClose').addEventListener('click',()=>document.querySelector('#fixtureAuth').classList.add('hidden'));
