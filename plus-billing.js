
(()=>{
'use strict';
const q=s=>document.querySelector(s);
const toast=(m,err=false)=>{
  const t=q('#globalToast');
  if(t){t.textContent=m;t.classList.remove('hidden');if(err)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2600)}
  else if(window.showSync)showSync(m);
};
function replaceButton(id,handler){
  const old=q('#'+id);if(!old)return null;
  const fresh=old.cloneNode(true);
  old.replaceWith(fresh);
  fresh.addEventListener('click',handler);
  return fresh;
}
async function invoke(name,body={}){
  const {data,error}=await sb.functions.invoke(name,{body});
  if(error)throw error;
  if(data?.error)throw new Error(data.error);
  return data;
}
async function startCheckout(){
  if(!currentUser)return toast('Please sign in first.',true);
  const plan=q('#plusPlanChoice')?.value||'monthly';
  const btn=q('#startPlusMembership');
  if(btn){btn.disabled=true;btn.textContent='Opening secure checkout…'}
  try{
    const data=await invoke('create-plus-checkout',{plan});
    if(!data?.url)throw new Error('Checkout URL was not returned.');
    location.assign(data.url);
  }catch(e){
    toast(e?.message||'Could not open checkout.',true);
    if(btn){btn.disabled=false;btn.textContent='Start Lellee Plus'}
  }
}
async function manageBilling(){
  if(!currentUser)return toast('Please sign in first.',true);
  const btn=q('#managePlusBilling');
  if(btn){btn.disabled=true;btn.textContent='Opening billing…'}
  try{
    const data=await invoke('create-billing-portal',{});
    if(!data?.url)throw new Error('Billing portal URL was not returned.');
    location.assign(data.url);
  }catch(e){
    toast(e?.message||'Could not open billing management.',true);
    if(btn){btn.disabled=false;btn.textContent='Manage Billing'}
  }
}
async function refreshMembershipUI(){
  if(!currentUser)return;
  try{
    const {data:r}=await sb.from('user_memberships').select('*').eq('user_id',currentUser.id).maybeSingle();
    const active=r?.tier==='plus'&&['active','trialing'].includes(r?.status);
    q('#managePlusBilling')?.classList.toggle('hidden',!r?.provider_customer_id);
    const start=q('#startPlusMembership');
    if(start){
      start.classList.toggle('hidden',active);
      start.disabled=false;
      start.textContent='Start Lellee Plus';
    }
    if(active){
      q('#plusStatusBand')?.classList.add('active');
      if(q('#plusStatusTitle'))q('#plusStatusTitle').textContent='Lellee Plus active';
      if(q('#plusStatusBadge'))q('#plusStatusBadge').textContent='PLUS';
      if(q('#plusStatusText'))q('#plusStatusText').textContent=r.current_period_end
        ? `Your Plus access is active through ${new Date(r.current_period_end).toLocaleDateString()}.`
        : 'Your Plus features are active.';
    }
  }catch(e){}
}
function checkoutReturn(){
  const u=new URL(location.href),state=u.searchParams.get('checkout'),box=q('#plusCheckoutBanner');
  if(!box||!state)return;
  box.classList.remove('hidden','success','cancelled','error');
  if(state==='success'){
    box.classList.add('success');
    box.textContent='Payment completed. Lellee is confirming your Plus membership from Stripe. This normally updates within moments.';
    let tries=0;
    const timer=setInterval(async()=>{
      tries++;await refreshMembershipUI();
      const {data:r}=await sb.from('user_memberships').select('tier,status').eq('user_id',currentUser.id).maybeSingle();
      if(r?.tier==='plus'&&['active','trialing'].includes(r.status)){
        clearInterval(timer);box.textContent='Lellee Plus is active ✓';
      }else if(tries>=10)clearInterval(timer);
    },1500);
  }else if(state==='cancelled'){
    box.classList.add('cancelled');
    box.textContent='Checkout was cancelled. Your free Lellee account is unchanged.';
  }
  u.searchParams.delete('checkout');u.searchParams.delete('session_id');
  history.replaceState({},'',u.pathname+(u.searchParams.toString()?`?${u.searchParams}`:'')+u.hash);
}
replaceButton('startPlusMembership',startCheckout);
replaceButton('managePlusBilling',manageBilling);
let attempts=0;
const wait=setInterval(()=>{
  attempts++;
  if(currentUser){clearInterval(wait);refreshMembershipUI();checkoutReturn()}
  else if(attempts>30)clearInterval(wait);
},200);
})();
