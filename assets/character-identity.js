(() => {
 'use strict';
 if(window.AobeeIdentity)return;
 const base=new URL('.',document.currentScript.src),atlas=new Image();
 const api={atlas,ready:null,urls:null};window.AobeeIdentity=api;
 const loaded=new Promise((resolve,reject)=>{atlas.onload=resolve;atlas.onerror=reject});
 atlas.src=new URL('characters/aobee-atlas-v1.png',base).href;
 const poses={front:0,back:1,left:2,right:3,cheer:4,catch:5,runLeft:6,runRight:7};
 const signature=src=>src.length+':'+src.slice(0,90)+':'+src.slice(-90);
 api.ready=Promise.all([loaded,fetch(new URL('characters/manifest-v1.json',base)).then(r=>{if(!r.ok)throw Error('Character manifest');return r.json()})]).then(([,manifest])=>{
  const cw=atlas.naturalWidth/4,ch=atlas.naturalHeight/2,urls={};
  for(const [name,index]of Object.entries(poses)){
   const c=document.createElement('canvas');c.width=384;c.height=384;
   c.getContext('2d').drawImage(atlas,(index%4)*cw,Math.floor(index/4)*ch,cw,ch,0,0,384,384);
   urls[name]=c.toDataURL('image/png');
  }
  api.urls=urls;
  function install(win){
   let doc;try{doc=win.document;if(!doc?.documentElement||doc.documentElement.dataset.aobeeIdentity==='1')return}catch{return}
   doc.documentElement.dataset.aobeeIdentity='1';
   const cache=new WeakMap(),proto=win.CanvasRenderingContext2D?.prototype;
   if(proto){const draw=proto.drawImage;proto.drawImage=function(image,...args){
    if(image===atlas)return draw.call(this,image,...args);
    let record=cache.get(image),src=image?.currentSrc||image?.src||'';
    if(!record||record.src!==src){const pose=/\/aobee-walk-v1\.png(?:\?|$)/.test(src)?'rpg':manifest[signature(src)];record={src,pose};cache.set(image,record)}
    let pose=record.pose;if(!pose)return draw.call(this,image,...args);
    if(pose==='rpg'){const row=args.length===8?Math.min(3,Math.floor(args[1]/image.naturalHeight*4)):0;pose=['front','left','right','back'][row]}
    const dest=args.length===8?args.slice(4):args.length===4?args:args.length===2?[...args,image.naturalWidth,image.naturalHeight]:null;
    if(!dest)return draw.call(this,image,...args);
    const [x,y,w,h]=dest,index=poses[pose]??0,size=Math.min(w,h);
    return draw.call(this,atlas,(index%4)*cw,Math.floor(index/4)*ch,cw,ch,x+(w-size)/2,y+h-size,size,size);
   }}
   function updateImage(img){
    const src=img.currentSrc||img.src||'',label=(img.id+' '+img.className+' '+img.alt).toLowerCase();
    const pose=/\/assets\/aobee\.png(?:\?|$)/.test(src)?(label.includes('hero')?'cheer':'front'):manifest[signature(src)];
    if(pose&&urls[pose]&&img.src!==urls[pose])img.src=urls[pose];
   }
   function attachFrame(frame){
    if(frame.dataset.aobeeIdentityBound)return;frame.dataset.aobeeIdentityBound='1';
    const attach=()=>{try{install(frame.contentWindow)}catch{}};
    frame.addEventListener('load',attach);attach();
    const src=frame.getAttribute('src')||'';
    if(src.startsWith('data:text/html;base64,')&&!frame.hasAttribute('srcdoc')){
     const decoded=decodeURIComponent(Array.from(atob(src.split(',')[1]),c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
     frame.srcdoc=decoded;
    }
   }
   function scan(node){if(node.nodeType!==1)return;if(node.matches('img'))updateImage(node);if(node.matches('iframe'))attachFrame(node);for(const img of node.querySelectorAll('img'))updateImage(img);for(const frame of node.querySelectorAll('iframe'))attachFrame(frame)}
   scan(doc.documentElement);
   new win.MutationObserver(records=>{for(const r of records){if(r.type==='attributes'&&r.target.tagName==='IMG')updateImage(r.target);for(const n of r.addedNodes)scan(n)}}).observe(doc.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
   const style=doc.createElement('style');
   style.textContent=Object.entries({down:'front',up:'back',left:'left',right:'right'}).map(([direction,pose])=>`.cell.player[data-face="${direction}"],.cell.player.pushing[data-face="${direction}"]{background-image:url("${urls[pose]}")!important}`).join('\n')+`html .clearMascot{background-image:url("${urls.cheer}")!important}html .mascot{background-image:url("${urls.front}")!important}#aobee:not(img),#titleAobee:not(img){background-image:url("${urls.front}")!important;background-size:contain!important;background-position:center bottom!important;background-repeat:no-repeat!important}#aobee:not(img)>*,#titleAobee:not(img)>*{visibility:hidden!important}`;
   doc.head.append(style);
   const banner=doc.querySelector('.hero.hero-brand');if(banner){banner.style.setProperty('background-image','linear-gradient(110deg,#e8faff,#c5eaff)','important');banner.innerHTML='<img alt="あおびー" style="height:100%;width:64px;object-fit:contain"><strong style="color:#07529c;font:900 15px system-ui">AOBEE MIX POWER</strong>';banner.querySelector('img').src=urls.front;banner.style.setProperty('display','flex','important')}
   win.dispatchEvent(new win.CustomEvent('aobee-identity-ready',{detail:{urls,atlas}}));
  }
  install(window);return api;
 }).catch(error=>{console.warn('Aobee character identity could not load; original graphics remain.',error);return null});
})();
