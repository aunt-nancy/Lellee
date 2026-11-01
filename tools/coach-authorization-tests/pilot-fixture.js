/* Test-only Auth/data substitute. No live API, identity, emails or payments. */
(() => {
  const fixture = window.fixtureContentPackage;
  const user = {id:'fixture-consumer',email:'consumer@example.test'};
  const mode = document.body.dataset.fixtureMode;
  const storageKey='lellee-isolated-pilot-'+mode;
  let saved;
  try { saved=JSON.parse(localStorage.getItem(storageKey)||'{"responses":[],"progress":[]}'); }
  catch { saved={responses:[],progress:[]}; }
  const programs=fixture.packs.map((p,i)=>({id:'program-'+i,slug:p.slug,name:p.name,status:'active',display_order:i+2,terminology:{journey:p.name+' Journey'}}));
  const recovery={id:'recovery',slug:'recovery',name:'Recovery',status:'active',display_order:1};
  const stages=fixture.packs.flatMap((p,i)=>[...p.sections,'Continuity and optional review'].map((name,j)=>({id:`stage-${i}-${j}`,program_id:'program-'+i,stage_key:'section-'+j,name,sequence:j+1,status:'draft'})));
  const items=fixture.packs.flatMap((p,i)=>p.items.map(item=>({...item,id:item.content_key,program_id:'program-'+i,stage_id:stages.find(s=>s.program_id==='program-'+i&&s.name===item.section).id,content_type:'guided_action'})));
  const settings={pilot_program_runtime_enabled:'true',program_switcher_enabled:'true',recovery_legacy_renderer_enabled:'true',content_engine_v2_consumer_enabled:'false',public_multi_program_launch_enabled:'false'};
  function persist(){localStorage.setItem(storageKey,JSON.stringify(saved));}
  function feedback(payload){document.getElementById('fixtureWrite').textContent=JSON.stringify(payload);}
  const client={from(table){
    const filters=[];let single=false;
    const query={select(){return query;},eq(k,v){filters.push(r=>r[k]===v);return query;},in(k,v){filters.push(r=>v.includes(r[k]));return query;},order(){return query;},maybeSingle(){single=true;return query;},
      async upsert(row){
        if(mode==='response-failure'&&table==='pilot_daily_responses')return {data:null,error:{message:'Fixture response save failed'}};
        if(mode==='progress-failure'&&table==='pilot_program_progress')return {data:null,error:{message:'Fixture position save failed'}};
        const list=table==='pilot_daily_responses'?saved.responses:saved.progress;
        const index=list.findIndex(x=>x.user_id===row.user_id&&x.program_id===row.program_id&&(table!=='pilot_daily_responses'||x.content_item_id===row.content_item_id));
        if(index<0)list.push(row);else list[index]=row;
        persist();feedback({table,program_id:row.program_id,content_item_id:row.content_item_id||null,reflection:row.reflection||null});
        return {data:null,error:null};
      },
      then(resolve){
        if(mode==='load-failure'&&table==='pilot_daily_responses')return Promise.resolve({data:null,error:{message:'Fixture load failed'}}).then(resolve);
        let data=({app_public_settings:Object.entries(settings).map(([key,value])=>({key,value})),program_pilot_enrollments:programs.map(p=>({user_id:user.id,program_id:p.id,status:'active'})),programs:[recovery,...programs],pilot_program_progress:saved.progress,program_modules:programs.map(p=>({program_id:p.id,module_key:'journey',label:'Journey',enabled:true,display_order:1})),program_journey_stages:stages,program_content_items:items,pilot_daily_responses:saved.responses})[table]||[];
        data=data.filter(r=>filters.every(f=>f(r)));
        return Promise.resolve({data:single?(data[0]||null):data,error:null}).then(resolve);
      }
    };return query;
  }};
  window.LelleeAuthContext={client,getCurrentUser:()=>user};
  window.showPage=name=>{document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+name));};
  document.getElementById('fixtureHome').addEventListener('click',()=>window.showPage('program-switcher'));
  document.getElementById('fixtureReset').addEventListener('click',()=>{localStorage.removeItem(storageKey);location.reload();});
})();
