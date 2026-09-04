(() => {
  'use strict';
  const VERSION='2026-09-03-system-consolidated-r1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  const client=()=>{
    const bridged=window.LelleeAuthContext?.client;
    if(bridged?.auth)return bridged;
    try{if(typeof sb!=='undefined'&&sb?.auth)return sb}catch{}
    return window.sb||null;
  };

  const user=async()=>{
    try{
      const bridged=window.LelleeAuthContext?.getCurrentUser?.();
      if(bridged?.id)return bridged;
    }catch{}
    const c=client();
    if(!c?.auth)return null;
    try{const {data}=await c.auth.getUser();return data?.user||null}catch{return null}
  };

  const timeout=(promise,ms=7000,label='Request')=>Promise.race([
    promise,
    new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label} timed out. Please try again.`)),ms))
  ]);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const slug=v=>String(v||'').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';

  function toast(text,type='info'){
    if(typeof window.showToast==='function'){try{return window.showToast(text,type)}catch{}}
    let el=$('#b7RepairToast');
    if(!el){el=document.createElement('div');el.id='b7RepairToast';el.className='prod-toast';document.body.appendChild(el)}
    el.textContent=text;el.dataset.type=type==='error'?'error':'';el.classList.remove('hidden');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add('hidden'),3500);
  }

  function navigate(page){
    const router=window.showPage||window.LelleeNavigatePage;
    if(typeof router!=='function')return false;
    router(page);
    return true;
  }

  async function saveLearning(status,button){
    if(button?.dataset.busy==='1')return;
    if(button){button.dataset.busy='1';button.disabled=true;button.textContent='Saving…'}
    const title=$('#learningDetailTitle')?.textContent.trim()||'Lesson';
    const key=slug(title);const now=new Date().toISOString();
    try{
      const u=await user(),c=client();
      if(c&&u){
        const row={user_id:u.id,item_key:key,item_type:($('#learningDetailType')?.textContent||'lesson').toLowerCase(),title,status,saved_at:now,completed_at:status==='completed'?now:null};
        const {error}=await timeout(c.from('lellee_learning_progress').upsert(row,{onConflict:'user_id,item_key'}),7000,'Learning save');
        if(error)throw error;
      }else{
        const k='lellee:b7-learning';
        const rows=JSON.parse(localStorage.getItem(k)||'[]').filter(x=>x.item_key!==key);
        rows.push({item_key:key,title,status,saved_at:now,completed_at:status==='completed'?now:null});
        localStorage.setItem(k,JSON.stringify(rows));
      }
      if(button){button.textContent=status==='completed'?'✓ Completed':'Saved for Later';button.classList.toggle('b3-complete',status==='completed')}
      $$('.approved-learning-card').forEach(card=>{
        if(slug(card.querySelector('h3')?.textContent)!==key)return;
        card.classList.toggle('b3-completed',status==='completed');
        let pill=card.querySelector('.b3-learning-card-status');
        if(!pill){pill=document.createElement('span');pill.className='b3-learning-card-status b3-status-pill';card.querySelector('.approved-learning-actions')?.before(pill)}
        pill.textContent=status==='completed'?'✓ Completed':'Saved for later';
      });
      toast(status==='completed'?'Lesson completed':'Saved for later');
    }catch(err){
      console.error('Lellee learning save:',err);toast(err.message||'Could not save the lesson.','error');
      if(button)button.textContent=status==='completed'?'Mark Complete':'Save for Later';
    }finally{if(button){button.dataset.busy='0';button.disabled=false}}
  }

  const themePrompts={current_feeling:'How I was feeling',evening_what_helped:'What helped me',life_areas_needing_care:'Areas needing care'};
  const summarizeGuided=row=>{
    const choices=Array.isArray(row.selected_choices)?row.selected_choices.filter(Boolean):[];
    return [choices.join(', '),row.optional_reflection].filter(Boolean).join(' — ')||'No written detail saved.';
  };

  async function buildThenNowSafe(){
    const host=$('#thenNowResultV2');if(!host)return;
    host.innerHTML='<div class="b7-safe-state">Building your comparison…</div>';
    const key=$('#tnKeyV2')?.value||'current_feeling';
    try{
      const u=await user(),c=client();if(!c||!u)throw new Error('Sign in to build a comparison.');
      const {data,error}=await timeout(
        c.from('guided_responses').select('response_date,prompt_key,selected_choices,optional_reflection').eq('user_id',u.id).eq('prompt_key',key).order('response_date',{ascending:true}).limit(200),
        7000,'Then & Now'
      );
      if(error)throw error;const rows=data||[];
      if(rows.length<2){host.innerHTML='<div class="b7-safe-state">You need at least two saved responses to this theme before Lellee can compare them.</div>';return}
      const first=rows[0],last=rows[rows.length-1];
      host.innerHTML=`<article class="b7-then-card"><small>THEN · ${esc(first.response_date)}</small><h3>${esc(themePrompts[key]||'Earlier response')}</h3><p>${esc(summarizeGuided(first))}</p></article><div class="b7-arrow">→</div><article class="b7-then-card"><small>NOW · ${esc(last.response_date)}</small><h3>${esc(themePrompts[key]||'Most recent response')}</h3><p>${esc(summarizeGuided(last))}</p></article>`;
      host.classList.add('b7-rendered');toast('Comparison built');
    }catch(err){console.error('Lellee Then & Now:',err);host.innerHTML=`<div class="b7-safe-state error">${esc(err.message||'The comparison could not be loaded.')}</div>`}
  }

  async function buildStorySafe(){
    const host=$('#storyPreviewV2');if(!host)return;
    host.innerHTML='<div class="b7-safe-state">Building your private preview…</div>';
    try{
      const title=$('#storyTitleV2')?.value.trim()||'My Recovery Story';
      const opening=$('#storyOpeningV2')?.value.trim()||'This story is built from the parts of recovery I chose to preserve.';
      const edition=$('#storyEditionV2')?.selectedOptions?.[0]?.textContent||'Recovery Story';
      const sections=[];
      if($('#storyMilestonesV2')?.checked)sections.push('<section><h3>Milestones</h3><p>Your saved milestone reflections can appear here when available.</p></section>');
      if($('#storyThenNowV2')?.checked)sections.push('<section><h3>Then & Now</h3><p>Your approved comparison reflections can show changes in your own words.</p></section>');
      if($('#storyGoalsV2')?.checked)sections.push('<section><h3>Goals</h3><p>Your recovery goals can help show what you were working toward.</p></section>');
      if($('#storyGuidedV2')?.checked)sections.push('<section><h3>Approved Guided Reflections</h3><p>Only guided material you previously allowed for Recovery Story use is eligible.</p></section>');
      if($('#storyJournalV2')?.checked)sections.push('<section><h3>Selected Journal Material</h3><p>Journal text remains excluded unless you deliberately select it for your story.</p></section>');
      host.innerHTML=`<article class="approved-story-paper"><div class="story-cover"><span>PRIVATE RECOVERY RECORD</span><h1>${esc(title)}</h1><small>${esc(edition)}</small></div><section><h3>Opening</h3><p>${esc(opening).replace(/\n/g,'<br>')}</p></section>${sections.join('')}<div class="story-print-actions"><button class="approved-small-action" type="button" id="b7PrintStory">Print / Save as PDF</button></div></article>`;
      host.classList.add('b7-rendered');toast('Story preview built');
    }catch(err){console.error('Lellee story preview:',err);host.innerHTML=`<div class="b7-safe-state error">${esc(err.message||'The story preview could not be built.')}</div>`}
  }

  const relationshipLabels={friend:'Friend',family_member:'Family Member',sponsor:'Sponsor',lellee_coach:'Lellee Coach',counselor_therapist:'Counselor / Therapist',peer_support:'Peer Support',case_manager:'Case Manager',faith_spiritual:'Faith / Spiritual Support',other:'Support person'};
  async function loadSupportSafe(){
    const host=$('#supportPeopleList');if(!host)return;
    host.innerHTML='<div class="b7-safe-state">Loading your support people…</div>';
    try{
      const u=await user(),c=client();if(!c||!u)throw new Error('Sign in to view your support network.');
      const {data,error}=await timeout(c.from('lellee_support_people').select('*').eq('user_id',u.id).eq('active',true).order('is_primary',{ascending:false}).order('created_at'),6500,'Support network');
      if(error)throw error;const rows=data||[];
      if(!rows.length){host.innerHTML='<div class="b7-safe-state">No support people saved yet.</div>';return}
      host.innerHTML=rows.map(r=>`<div class="approved-list-row"><span>♡</span><div><b>${esc(r.name)}</b><small>${esc(r.relationship==='other'?(r.relationship_other||'Support person'):(relationshipLabels[r.relationship]||'Support person'))}${r.is_primary?' · Primary':''}</small></div><div class="b4-row-actions">${r.phone?`<a class="approved-link" href="tel:${esc(r.phone)}">Call</a>`:''}</div></div>`).join('');
    }catch(err){console.error('Lellee support network:',err);host.innerHTML=`<div class="b7-safe-state error">${esc(err.message||'Support people could not be loaded.')}</div>`}
  }

  async function saveLanguageSafe(button){
    if(button?.dataset.busy==='1')return;
    const lang=$('#b6Language')?.value||'en';
    const zone=$('#b6Timezone')?.value||Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Los_Angeles';
    const row={language_code:lang,locale_code:lang==='es'?'es-US':'en-US',timezone:zone,text_scale:Number($('#b6TextScale')?.value||1),reduced_motion:!!$('#b6ReducedMotion')?.checked,speech_to_text_enabled:$('#b6Voice')?.checked!==false,interface_translation_enabled:$('#b6InterfaceTranslation')?.checked!==false,user_content_translation_enabled:!!$('#b6UserTranslation')?.checked,updated_at:new Date().toISOString()};
    if(button){button.dataset.busy='1';button.disabled=true}
    try{
      const u=await user(),c=client();
      if(c&&u){const {error}=await timeout(c.from('lellee_platform_preferences').upsert({...row,user_id:u.id},{onConflict:'user_id'}),6500,'Language save');if(error)throw error}
      localStorage.setItem('lellee:platform-preferences:v6',JSON.stringify(row));
      const msg=$('#b6PreferenceMsg');if(msg){msg.textContent=lang==='es'?'Idioma y accesibilidad guardados.':'Language & Accessibility saved.';msg.className='b6-message success'}
      toast(lang==='es'?'Preferencias guardadas':'Preferences saved');
    }catch(err){console.error('Language save:',err);toast(err.message||'Could not save preferences.','error')}
    finally{if(button){button.dataset.busy='0';button.disabled=false}}
  }

  function intercept(event){
    const target=event.target instanceof Element?event.target:null;if(!target)return;
    const complete=target.closest('#markLearningComplete');
    if(complete){event.preventDefault();event.stopImmediatePropagation();saveLearning('completed',complete);return}
    const save=target.closest('#saveLearningItem');
    if(save){event.preventDefault();event.stopImmediatePropagation();saveLearning('saved',save);return}
    if(target.closest('#buildThenNowV2')){event.preventDefault();event.stopImmediatePropagation();buildThenNowSafe();return}
    if(target.closest('#buildStoryPreviewV2')){event.preventDefault();event.stopImmediatePropagation();buildStorySafe();return}
    if(target.closest('#b7PrintStory')){event.preventDefault();event.stopImmediatePropagation();window.print();return}
    const review=target.closest('.plus-review-preview');
    if(review){event.preventDefault();event.stopImmediatePropagation();navigate('recovery-review');setTimeout(()=>$('#buildRecoveryReview')?.focus(),40);return}
    const support=target.closest('[data-page="support-network"]');
    if(support){event.preventDefault();event.stopImmediatePropagation();navigate('support-network');setTimeout(loadSupportSafe,0);return}
    const lang=target.closest('#b6SavePreferences');
    if(lang){event.preventDefault();event.stopImmediatePropagation();saveLanguageSafe(lang);}
  }

  function init(){
    document.addEventListener('click',intercept,true);
    document.addEventListener('lellee:pagechange',event=>{
      if(event.detail?.page==='support-network')loadSupportSafe();
    });
    console.info(`Lellee targeted compatibility repair ${VERSION} loaded`);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
