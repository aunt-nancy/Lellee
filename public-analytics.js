(()=>{
"use strict";
const cfg=window.LELLEE_PUBLIC_ANALYTICS||{};
if(!cfg.enabled || !/^G-[A-Z0-9]+$/i.test(cfg.measurementId||"")) return;

// Public SEO pages only. Do not load this file in /app.
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
window.gtag=gtag;

// Default to denied until a future approved consent experience explicitly grants it.
gtag("consent","default",{
  analytics_storage:"denied",
  ad_storage:"denied",
  ad_user_data:"denied",
  ad_personalization:"denied"
});

const s=document.createElement("script");
s.async=true;
s.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(cfg.measurementId);
document.head.appendChild(s);
s.onload=()=>{
  gtag("js",new Date());
  gtag("config",cfg.measurementId,{send_page_view:false,allow_google_signals:false});
};
})();
