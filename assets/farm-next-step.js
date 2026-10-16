(()=>{
 'use strict';
 function nextStep({plots,crops,stock,inHouse}){
  if(inHouse)return {text:'畑のお世話をするなら、出口から牧場へ戻ろう。',action:'記録を見る',target:'journalDock40'};
  const planted=Object.values(plots).filter(p=>p.planted);
  if(planted.some(p=>p.stage>=(crops[p.crop]?.days||3)))return {text:'育った作物があるよ。畑の隣で「おまかせ作業」を押して収穫しよう。',action:'道具を見る',target:'chooseTools'};
  if(planted.some(p=>!p.watered))return {text:'水やり待ちの作物があるよ。畑の隣で「おまかせ作業」を押そう。',action:'道具を見る',target:'chooseTools'};
  if(Object.values(stock).some(n=>n>0))return {text:'収穫した作物は「持ち物」で確認できるよ。出荷してお金にしよう。',action:'持ち物を見る',target:'quickbag'};
  if(planted.length)return {text:'今日の水やりは済んだよ。「休む」で翌朝へ。住人との会話も楽しめるよ。',action:'休む',target:'quicknext'};
  return {text:'茶色い畑をタップして隣に立とう。「おまかせ作業」で、耕す→種まき→水やり。',action:'道具を見る',target:'chooseTools'};
 }
 if(typeof module!=='undefined'&&module.exports){module.exports=nextStep;return;}
 const card=document.createElement('section');card.id='farmNextStep';card.setAttribute('aria-label','次にすること');card.innerHTML='<button type="button" id="farmNextClose" aria-label="行動案内を閉じる">閉じる</button><div><strong>次にすること</strong><p></p></div><button type="button" id="farmNextAction"></button><button type="button" id="farmGoals">目標・記録</button>';
 const hud=document.querySelector('.hud40');hud.after(card);let target,dismissed=false;const key='aobee-farm-next-step-hidden';try{dismissed=localStorage.getItem(key)==='1'}catch{}
 const toggle=document.createElement('button');toggle.id='farmNextToggle';toggle.type='button';toggle.textContent='案内';toggle.setAttribute('aria-label','行動案内を表示');toggle.setAttribute('aria-controls',card.id);hud.after(toggle);
 const dismiss=value=>{dismissed=value;try{if(value)localStorage.setItem(key,'1');else localStorage.removeItem(key)}catch{}update();(value?toggle:document.getElementById('farmNextClose')).focus({preventScroll:true});};
 document.getElementById('farmNextClose').onclick=()=>dismiss(true);toggle.onclick=()=>dismiss(false);
 document.getElementById('farmNextAction').onclick=()=>document.getElementById(target)?.click();document.getElementById('farmGoals').onclick=()=>document.getElementById('journalDock40')?.click();
 const update=()=>{card.hidden=titleScreen.open||dismissed;toggle.hidden=titleScreen.open||!dismissed;toggle.setAttribute('aria-expanded',String(!card.hidden));const next=nextStep({plots,crops:CROPS,stock,inHouse:!!c._house});card.querySelector('p').textContent=next.text;target=next.target;document.getElementById('farmNextAction').textContent=next.action;};
 const previous=refreshUI;refreshUI=function(...args){previous(...args);update();};continueButton.addEventListener('click',update);startButton.addEventListener('click',update);new MutationObserver(update).observe(titleScreen,{attributes:true,attributeFilter:['open']});update();
 const style=document.createElement('style');style.textContent='#farmNextStep{position:fixed;top:112px;left:12px;z-index:25;width:min(420px,calc(100vw - 24px));box-shadow:0 4px 18px #34584525;display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:12px 14px;background:#fffaf0;border:1px solid #d9deca;border-radius:16px;color:#345845}#farmNextStep[hidden],#farmNextToggle[hidden]{display:none!important}#farmNextStep{padding-top:54px}#farmNextClose{position:absolute;top:6px;right:6px}#farmNextToggle{position:fixed;top:max(64px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:25;min-width:64px;min-height:44px;padding:7px 10px;border:1px solid #9ead92;border-radius:12px;background:#fffaf0;color:#345845;font-weight:700}#farmNextStep>div{flex:1 1 240px}#farmNextStep strong{font-size:12px}#farmNextStep p{font-size:13px;line-height:1.6;margin:5px 0 0}#farmNextStep button{min-height:44px;padding:8px 12px;border-radius:12px;border:1px solid #9ead92;background:#edf4e4;color:#345845;font-weight:700}';document.head.append(style);
})();
