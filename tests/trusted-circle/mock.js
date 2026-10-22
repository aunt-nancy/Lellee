/* TEST ONLY: synthetic responses, no real tokens, users, API calls or payments. */
(() => {
 const clone=x=>JSON.parse(JSON.stringify(x));
 const T=window.TestCircle={user:'owner-a',log:[],subscriptions:0,delay:0,fail:false,hold:false,resolvers:[],admin:false};
 const relations=[{id:'r-one',owner:'owner-a',supporter:'supporter-a',status:'active'},
  {id:'r-two',owner:'owner-a',supporter:'supporter-b',status:'active'},
  {id:'r-invite',owner:'owner-b',supporter:'supporter-a',status:'invited'}];
 const tables={trusted_circle_shared_tasks:[{id:'task-one',owner_user_id:'owner-a',relationship_id:'r-one',title:'Selected task',status:'open',assigned_to:'shared'},
 {id:'task-two',owner_user_id:'owner-a',relationship_id:'r-two',title:'Other recipient task',status:'open',assigned_to:'shared'}],
 trusted_circle_checkins:[{id:'check-one',owner_user_id:'owner-a',relationship_id:'r-one',title:'Practical request',status:'requested'}],
 trusted_circle_shared_appointments:[{id:'appt-one',owner_user_id:'owner-a',relationship_id:'r-one',title:'Chosen appointment',status:'scheduled',starts_at:'2026-09-10T18:00:00Z'}],
 trusted_circle_emergency_contacts:[{id:'contact-one',user_id:'owner-a',label:'Private contact',phone_masked:'555-0100'}],
 trusted_circle_shares:[],program_collaboration_settings:[
 {program_id:'p-care',collaboration_enabled:true,family_roles_enabled:true,professional_support_roles_enabled:true,shared_tasks_enabled:true,shared_appointments_enabled:true,programs:{id:'p-care',name:'Caregiving'}},
 {program_id:'p-home',collaboration_enabled:true,family_roles_enabled:true,professional_support_roles_enabled:true,shared_tasks_enabled:true,shared_appointments_enabled:true,programs:{id:'p-home',name:'Finding Stability'}},
 {program_id:'p-off',collaboration_enabled:false,family_roles_enabled:true,shared_tasks_enabled:true,programs:{id:'p-off',name:'Disabled Program'}}]};
 T.tables=tables;T.relations=relations;
 const related=user=>relations.filter(r=>r.owner===user||r.supporter===user);
 function summary(supporter,user){
  const r=relations.filter(x=>supporter?x.supporter===user:x.owner===user);
  const ids=r.filter(x=>x.status==='active').map(x=>x.id);
  const owned=table=>clone(tables[table].filter(x=>supporter?(ids.includes(x.relationship_id)&&x.status!=='cancelled'):x.owner_user_id===user));
  return {summary:{members:r.length,people:ids.length,tasks:1,shared_tasks:2,checkins:1,open_checkins:1,shares:0,active_shares:0},
  people:r.map(x=>({...x,role_key:'friend',role_label:'Friend',program_id:null})),relationships:r.filter(x=>x.status==='active').map(x=>({...x,role_label:'Friend',program_id:null})),
  invitations:r.filter(x=>x.status==='invited').map(x=>({...x,role_label:'Friend',program_id:null})),shares:owned('trusted_circle_shares'),tasks:owned('trusted_circle_shared_tasks').filter(x=>!supporter||x.status!=='completed'),
  appointments:owned('trusted_circle_shared_appointments'),checkins:owned('trusted_circle_checkins').filter(x=>x.status!=='completed'),
  emergency_contacts:supporter?[]:clone(tables.trusted_circle_emergency_contacts.filter(x=>x.user_id===user))};
 }
 function finish(data){
  const response={data:clone(data),error:T.fail?{message:'Simulated connection failure'}:null};
  if(T.hold)return new Promise(resolve=>T.resolvers.push(()=>resolve(response)));
  return new Promise(resolve=>setTimeout(()=>resolve(response),T.delay));
 }
 const c={supabaseUrl:'https://vnfjszmhmcxkxegzvivg.supabase.co',auth:{onAuthStateChange(cb){T.subscriptions++;T.cb=cb;setTimeout(()=>cb('INITIAL_SESSION',T.user?{user:{id:T.user}}:null),0);return {data:{subscription:{unsubscribe(){T.subscriptions--;}}}};}},
  rpc(name,args){T.log.push({name,args,user:T.user});const user=T.user;let data=null;
    if(name==='is_lellee_admin')data=T.admin;
    else if(name==='get_my_trusted_circle_summary')data=summary(false,user);
    else if(name==='get_my_supporter_dashboard')data=summary(true,user);
    else if(name==='get_my_circle_participants')data=related(user).filter(r=>['invited','active','paused'].includes(r.status)).map(r=>({relationship_id:r.id,owner_view:r.owner===user,account_email:(r.owner===user?r.supporter:r.owner)+'@example.invalid',role_key:'friend',program_id:null,status:r.status}));
    else if(name==='get_collaboration_operations_summary')data={summary:{relationships:2,shares:0,expired:0,programs:2},roles:[],scopes:[],relationships:[],programs:[],guardrails:[{label:'No automatic contact',detail:'Owner-only records',enabled:true}]};
    else if(name==='respond_trusted_circle_relationship'){const r=relations.find(r=>r.id===args.p_relationship_id);if(r){r.status=({accept:'active',decline:'declined',pause:'paused',revoke:'revoked',leave:'ended'})[args.p_action];data=true}else data=false;}
    else if(name==='revoke_trusted_circle_share')data=true;
    else if(name==='respond_trusted_circle_item'){const t=args.p_item_kind==='task'?tables.trusted_circle_shared_tasks:tables.trusted_circle_checkins;const x=t.find(x=>x.id===args.p_item_id);if(x){x.status=args.p_status;x.response_label=args.p_response;data=true}else data=false;}
    else if(name==='invite_trusted_circle_member')data='new-invitation';
    return finish(data);
  },from(table){let op='select',payload=null,filters=[];const b={select(fields){this.fields=fields;return this},eq(k,v){filters.push([k,v]);return this},is(k,v){filters.push([k,v]);return this},insert(v){op='insert';payload=v;return this},update(v){op='update';payload=v;return this},delete(){op='delete';return this},then(resolve,reject){
    T.log.push({table,op,payload:clone(payload),filters:clone(filters),fields:this.fields,user:T.user});let arr=tables[table]||[];let data;
    if(op==='insert'){data=null;if(!T.fail)arr.push({...clone(payload),id:'new-'+T.log.length});}
    else {data=arr.filter(x=>filters.every(([k,v])=>(x[k]??null)===v));if(op==='update'&&!T.fail)data.forEach(x=>Object.assign(x,payload));if(op==='delete'&&!T.fail)tables[table]=arr.filter(x=>!data.includes(x));}
    return finish(data).then(resolve,reject);
  }};return b;}};
 T.client=c;window.LelleeAuthContext={client:c,getCurrentUser:()=>T.user?{id:T.user}:null};
 T.auth=user=>{T.user=user;T.cb?.(user?'SIGNED_IN':'SIGNED_OUT',user?{user:{id:user}}:null);};
 T.navigate=p=>{document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-'+p));document.dispatchEvent(new CustomEvent('lellee:pagechange',{detail:{page:p}}));};
 T.release=()=>{T.hold=false;T.resolvers.splice(0).forEach(f=>f());};
})();
