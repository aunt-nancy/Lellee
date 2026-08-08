(()=>{'use strict';
const c=window.LELLEE_ANALYTICS||{};
if(c.publicOnly&&location.pathname.startsWith('/app'))return;
const cleanPath=()=>location.pathname;
if(c.ga4){
 const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(c.ga4);document.head.appendChild(s);
 window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());
 gtag('config',c.ga4,{page_path:cleanPath(),allow_google_signals:false});
}
if(c.clarity){
 (function(w,d,s,i){w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments)};const t=d.createElement(s);t.async=1;t.src='https://www.clarity.ms/tag/'+i;const y=d.getElementsByTagName(s)[0];y.parentNode.insertBefore(t,y)})(window,document,'script',c.clarity);
}
document.addEventListener('click',e=>{
 const a=e.target.closest('a[data-seo-cta]');if(!a)return;
 const label=a.dataset.seoCta||'cta';
 if(c.ga4&&window.gtag)gtag('event','seo_cta_click',{cta_label:label,page_path:cleanPath(),destination:a.getAttribute('href')||''});
 if(c.clarity&&window.clarity)clarity('event','seo_cta_'+label);
});
})();