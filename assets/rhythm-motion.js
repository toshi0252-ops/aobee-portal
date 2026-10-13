(()=>{
 'use strict';
 const identity=window.AobeeIdentity;if(!identity)return;
 identity.ready.then(api=>{if(!api)return;const installed=new WeakSet();
 function attach(doc){if(!doc||installed.has(doc))return;installed.add(doc);
 const actor=doc.getElementById('aobee');if(!actor)return;
 const style=doc.createElement('style');style.textContent='#aobee:not(img).catch,#aobee:not(img).hit{background-image:url("'+api.urls.catch+'")!important}#aobee:not(img).ready{background-image:url("'+api.urls.cheer+'")!important}#aobee.rhythmReach{animation:rhythmReach .3s ease-out!important;transform-origin:50% 100%}@keyframes rhythmReach{50%{transform:translateX(-50%) translateY(-12px) rotate(-7deg)}}';doc.head.append(style);
 const refresh=()=>{if(actor.tagName==='IMG'){const pose=actor.classList.contains('catch')?'catch':actor.classList.contains('ready')?'cheer':'front';if(actor.src!==api.urls[pose])actor.src=api.urls[pose];}};
 new doc.defaultView.MutationObserver(refresh).observe(actor,{attributes:true,attributeFilter:['class']});refresh();
 if(doc.title.includes('寿司')){let timer;const button=doc.getElementById('tap');button?.addEventListener('pointerdown',()=>{clearTimeout(timer);actor.classList.remove('rhythmReach');void actor.offsetWidth;actor.classList.add('rhythmReach');timer=setTimeout(()=>actor.classList.remove('rhythmReach'),300)});}
 }
 attach(document);for(const frame of document.querySelectorAll('iframe')){if(frame.dataset.aobeePreserveAnimation==='1')continue;const load=()=>{try{attach(frame.contentDocument)}catch(e){}};frame.addEventListener('load',load);load();}
 });
})();
