(function(){
  'use strict';

  // Canonical Lellee consumer pricing approved for this branch.
  const LELLEE_PRICES = Object.freeze({
    free: { monthly: 0 },
    plus: { monthly: 5.99, annual: 59.99 },
    premium: { monthly: 14.99, annual: 149.00 },
    journalCompanion: { monthly: 4.99 },
    coachAddon: { monthly: 49.99, requires: 'premium' },
    extraCoach15: { each: 19.99, minutes: 15 }
  });
  window.LELLEE_PRICES = LELLEE_PRICES;

  const money = n => '$' + Number(n).toFixed(2);
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function setText(sel, value){ const el=$(sel); if(el && el.textContent!==value) el.textContent=value; }

  function fixPlus(){
    setText('#plusPriceMonthly', money(LELLEE_PRICES.plus.monthly));
    const pricePill=$('#plusPriceMonthly')?.nextElementSibling;
    if(pricePill && pricePill.tagName==='SMALL') pricePill.textContent='/month';
    setText('#plusComparePrice', money(LELLEE_PRICES.plus.monthly));

    const choice=$('#plusPlanChoice');
    if(choice){
      const monthly=choice.querySelector('option[value="monthly"]');
      const annual=choice.querySelector('option[value="annual"]');
      if(monthly) monthly.textContent='Monthly — $5.99/month';
      if(annual) annual.textContent='Annual — $59.99/year';
    }

    const m=$('#adminPlusMonthly'), a=$('#adminPlusAnnual');
    if(m && (!m.value || String(m.value) !== '5.99')) m.value='5.99';
    if(a && (!a.value || String(a.value) !== '59.99')) a.value='59.99';

    const pm=$('#adminPremiumMonthly'), pa=$('#adminPremiumAnnual');
    if(pm && (!pm.value || String(pm.value)==='0')) pm.value='14.99';
    if(pa && (!pa.value || String(pa.value)==='0')) pa.value='149';

    const premiumChoice=$('#premiumPlanChoice');
    if(premiumChoice){
      const monthly=premiumChoice.querySelector('option[value="monthly"]');
      const annual=premiumChoice.querySelector('option[value="annual"]');
      if(monthly) monthly.textContent='Monthly — $14.99/month';
      if(annual) annual.textContent='Annual — $149/year';
    }
  }

  function replacePriceInNode(node, amount, period){
    if(!node) return;
    const candidates=node.querySelectorAll('b,h3,strong,span,small,p,div');
    for(const el of candidates){
      const t=(el.textContent||'').trim();
      if(/^\$\d+(?:\.\d{1,2})?(?:\s*\/\s*(?:mo|month|yr|year))?$/i.test(t) || /price pending|^TBD$/i.test(t)){
        const next=money(amount)+(period ? '/'+period : '');
        if(el.textContent!==next) el.textContent=next;
        return;
      }
    }
  }

  function fixNamedPlanCards(){
    // Restrict replacements to elements whose own card clearly names the product.
    const cards=$$('article,.commerce-plan-card,.plus-compare-card,.final-checkout-card,.pricing-card,.plan-card,.access-card');
    for(const card of cards){
      const text=(card.textContent||'').replace(/\s+/g,' ').trim();
      if(/LELLEE\s+PLUS/i.test(text)) replacePriceInNode(card, LELLEE_PRICES.plus.monthly, 'mo');
      if(/LELLEE\s+PREMIUM/i.test(text)){
        if(/annual|year/i.test(text)) replacePriceInNode(card, LELLEE_PRICES.premium.annual, 'year');
        else replacePriceInNode(card, LELLEE_PRICES.premium.monthly, 'mo');
      }
      if(/JOURNAL\s+COMPANION/i.test(text)) replacePriceInNode(card, LELLEE_PRICES.journalCompanion.monthly, 'month');
      if(/(?:LELLEE\s+COACH|ADD\s+A\s+COACH|COACH\s+ADD[- ]?ON)/i.test(text)) replacePriceInNode(card, LELLEE_PRICES.coachAddon.monthly, 'month');
      if(/15[- ]?MINUTE|15\s+MIN/i.test(text) && /COACH/i.test(text)) replacePriceInNode(card, LELLEE_PRICES.extraCoach15.each, 'session');
    }
  }

  function fixLiteralOldPlusPrices(){
    // Only rewrite stale Plus values when the surrounding element explicitly says Plus.
    const all=$$('body *');
    for(const el of all){
      if(el.children.length) continue;
      const t=(el.textContent||'').trim();
      if(!['$5.99','$59.99','TBD','unapproved','unapproved'].includes(t)) continue;
      const ctx=el.closest('article,.commerce-plan-card,.plus-compare-card,.pricing-card,.plan-card,section,div');
      if(ctx && /LELLEE\s+PLUS|PLUS\s+MEMBERSHIP|FREE\s+VS\s+PLUS/i.test((ctx.textContent||''))){
        if(t==='$59.99') el.textContent='$59.99';
        else el.textContent='$5.99';
      }
    }
  }

  function addPricingNote(){
    const plusPage=$('#page-plus .approved-inner');
    if(!plusPage || $('#lelleeCanonicalPricingNote')) return;
    const note=document.createElement('div');
    note.id='lelleeCanonicalPricingNote';
    note.className='plus-boundary-note';
    note.innerHTML='<b>Current Lellee pricing:</b> Plus $5.99/month or $59.99/year · Premium $14.99/month or $149/year · Journal Companion $4.99/month · Lellee Coach add-on $49.99/month with Premium · Additional 15-minute coaching sessions $19.99 each.';
    plusPage.appendChild(note);
  }

  function applyPricing(){
    fixPlus();
    fixNamedPlanCards();
    fixLiteralOldPlusPrices();
    addPricingNote();
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return; scheduled=true;
    requestAnimationFrame(()=>{ scheduled=false; applyPricing(); });
  }

  document.addEventListener('DOMContentLoaded', applyPricing, {once:true});
  window.addEventListener('load', applyPricing, {once:true});
  const mo=new MutationObserver(schedule);
  mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  setTimeout(applyPricing,250);
  setTimeout(applyPricing,1000);
})();
