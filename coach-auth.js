(()=>{
'use strict';

const SUPABASE_URL='https://hkrrxscyhtxmbvxevfkw.supabase.co';
const SUPABASE_KEY='sb_publishable_QPwVWU-qNnc3GJb_FoFnlQ_kEHa3dtU';
const page=document.body.dataset.coachAuth||'login';
const $=id=>document.getElementById(id);
const safeReturn=value=>{try{const u=new URL(value||'/app?entry=coach',location.origin);return u.origin===location.origin&&u.pathname.startsWith('/')?u.pathname+u.search+u.hash:'/app?entry=coach'}catch(_){return '/app?entry=coach'}};
const params=new URLSearchParams(location.search);
const returnTarget=safeReturn(params.get('return')||'/app?entry=coach');
let client=null,loading=false,mode=page==='signup'?'signup':'signin',recoveryReady=false;

function setStatus(message,type=''){const el=$('status');if(!el)return;el.textContent=message||'';el.className='status'+(type?' '+type:'')}
function setBusy(v){loading=v;const b=$('submitButton');if(b)b.disabled=v;const f=$('forgotButton');if(f)f.disabled=v}
function friendly(error){
  const raw=(error?.message||'').trim(),m=raw.toLowerCase();
  if(m.includes('invalid login credentials'))return 'That email and password do not match. If you already use Lellee, use the same credentials here.';
  if(m.includes('email not confirmed'))return 'Confirm your email before signing in. Check Inbox and Spam.';
  if(m.includes('user already registered'))return 'This email already has a Lellee account. Use Coach Log In instead of creating another account.';
  if(m.includes('rate limit'))return 'Email sending is temporarily limited. Wait a few minutes and try again.';
  return raw||'The request did not complete. Please try again.';
}
function loadSupabase(){return new Promise((resolve,reject)=>{
  if(window.supabase?.createClient){resolve(window.supabase);return}
  const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.async=true;
  s.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error('Secure sign-in did not initialize.'));
  s.onerror=()=>reject(new Error('Secure sign-in service could not load.'));
  document.head.appendChild(s);
  setTimeout(()=>reject(new Error('Secure sign-in is taking too long to load.')),15000);
})}
function passwordToggle(button){
  const target=$(button.dataset.passwordTarget);if(!target)return;
  const show=target.type==='password';target.type=show?'text':'password';button.textContent=show?'Hide':'Show';
}
function configureLoginMode(next){
  mode=next;
  const emailField=$('emailField'),passField=$('passwordField'),confirmField=$('confirmField'),submit=$('submitButton'),title=$('authTitle'),intro=$('authIntro');
  if(next==='forgot'){
    title.textContent='Reset your Coach Business password';
    intro.textContent='Enter the email connected to your Lellee account and we will send a secure reset link.';
    emailField?.classList.remove('hidden');passField?.classList.add('hidden');confirmField?.classList.add('hidden');
    submit.textContent='Send reset link';
  }else if(next==='reset'){
    title.textContent='Choose a new password';
    intro.textContent='Set a new password for your Lellee identity. It will work for Coach Business and any other Lellee role tied to this account.';
    emailField?.classList.add('hidden');passField?.classList.remove('hidden');confirmField?.classList.remove('hidden');
    submit.textContent='Save new password';
  }else{
    title.textContent='Coach Business Log In';
    intro.textContent='Sign in to manage your independent coaching business, clients, groups, scheduling and operations.';
    emailField?.classList.remove('hidden');passField?.classList.remove('hidden');confirmField?.classList.add('hidden');
    submit.textContent='Log in to Coach Business';
  }
}
async function prepare(){
  try{
    const lib=await loadSupabase();
    client=lib.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const service=$('serviceState');if(service){service.className='service-state ready';service.innerHTML='<span class="dot"></span><span>Secure Coach Business sign-in ready</span>'}
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'){recoveryReady=!!session;if(page==='login')configureLoginMode('reset');return}
      if(event==='SIGNED_IN'&&session&&!loading&&mode!=='reset')location.replace(returnTarget);
    });
    const session=await client.auth.getSession();
    const recoveryLink=params.get('mode')==='reset'||params.get('type')==='recovery'||location.hash.includes('type=recovery');
    if(page==='login'&&recoveryLink){
      recoveryReady=!!session.data?.session;configureLoginMode('reset');
      if(!recoveryReady)setStatus('Open this page from the secure password-reset link sent to your email.','error');
      return;
    }
    if(session.data?.session?.user){location.replace(returnTarget);return}
    if(page==='login'&&params.get('confirmed')==='1')setStatus('Email confirmed. Log in to continue to Coach Business.','success');
  }catch(error){
    const service=$('serviceState');if(service){service.className='service-state error';service.innerHTML='<span class="dot"></span><span>Secure sign-in unavailable</span>'}
    setStatus(error.message,'error');
  }
}

document.querySelectorAll('.show-password').forEach(b=>b.addEventListener('click',()=>passwordToggle(b)));

if(page==='login'){
  configureLoginMode(params.get('mode')==='forgot'?'forgot':'signin');
  $('forgotButton')?.addEventListener('click',()=>{if(!loading){configureLoginMode('forgot');setStatus('')}});
  $('backToLogin')?.addEventListener('click',()=>{if(!loading){configureLoginMode('signin');setStatus('')}});
  $('authForm')?.addEventListener('submit',async e=>{
    e.preventDefault();if(loading||!client)return;
    setBusy(true);setStatus('');
    try{
      if(mode==='forgot'){
        const email=$('email').value.trim();if(!$('email').validity.valid)throw new Error('Enter a valid email address.');
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:'https://lellee.com/coach-login.html?mode=reset'});
        if(error)throw error;
        setStatus('Password-reset email requested. Check Inbox and Spam.','success');
      }else if(mode==='reset'){
        const p=$('password').value,c=$('confirmPassword').value;
        if(p.length<8)throw new Error('Use a password with at least 8 characters.');
        if(p!==c)throw new Error('The two new passwords do not match.');
        if(!recoveryReady){const s=await client.auth.getSession();recoveryReady=!!s.data?.session}
        if(!recoveryReady)throw new Error('Open the secure reset link from your email before choosing a new password.');
        const {error}=await client.auth.updateUser({password:p});if(error)throw error;
        setStatus('Password updated. Opening Coach Business…','success');
        setTimeout(()=>location.replace(returnTarget),350);
      }else{
        const email=$('email').value.trim(),password=$('password').value;
        if(!$('email').validity.valid)throw new Error('Enter a valid email address.');
        if(password.length<8)throw new Error('Enter your password.');
        const result=await client.auth.signInWithPassword({email,password});if(result.error)throw result.error;
        location.replace(returnTarget);
      }
    }catch(error){setStatus(friendly(error),'error')}finally{setBusy(false)}
  });
}else{
  $('authForm')?.addEventListener('submit',async e=>{
    e.preventDefault();if(loading||!client)return;
    setBusy(true);setStatus('');
    try{
      const email=$('email').value.trim(),password=$('password').value,confirm=$('confirmPassword').value;
      if(!$('email').validity.valid)throw new Error('Enter a valid email address.');
      if(password.length<8)throw new Error('Use a password with at least 8 characters.');
      if(password!==confirm)throw new Error('The two passwords do not match.');
      if(!$('agreements').checked)throw new Error('Confirm the Coach Business account terms before continuing.');
      const result=await client.auth.signUp({
        email,password,
        options:{
          emailRedirectTo:'https://lellee.com/coach-login.html?confirmed=1',
          data:{
            lellee_entry:'coach_business',
            lellee_role_intent:'independent_coach',
            lellee_adult_confirmed:true,
            lellee_terms_privacy_reviewed:true,
            lellee_safety_acknowledged:true,
            lellee_account_acknowledged_at:new Date().toISOString()
          }
        }
      });
      if(result.error)throw result.error;
      const identities=result.data?.user?.identities;
      if(Array.isArray(identities)&&identities.length===0){
        setStatus('This email already has a Lellee account. Use Coach Log In with your existing email and password.','error');
        return;
      }
      if(result.data?.session){location.replace(returnTarget);return}
      $('password').value='';$('confirmPassword').value='';
      setStatus('Coach Business account created. Check your email to confirm it, then use Coach Log In.','success');
    }catch(error){setStatus(friendly(error),'error')}finally{setBusy(false)}
  });
}
prepare();
})();