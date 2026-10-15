(() => {
  'use strict';
  const menu=document.getElementById('menuScreen'),art=menu.querySelector('.titleArtWrap'),logo=art.querySelector('.htmlGameLogo');
  const stages=art.querySelector('.stagePick'),options=art.querySelector('.menuBtns'),start=document.getElementById('menuStart');
  logo.setAttribute('role','heading');logo.setAttribute('aria-level','1');logo.querySelector('strong').textContent='ピコピコフィッシング';
  art.querySelector('img').src='../assets/previews/fishing.webp';
  menu.append(logo,art,stages,start,options);
  menu.classList.add('fishing-menu');
  const controls=document.querySelector('.controls'),hint=document.querySelector('.hint'),left=document.getElementById('left'),right=document.getElementById('right');
  left.setAttribute('aria-label','左へ移動・左でいなす');right.setAttribute('aria-label','右へ移動・右でいなす');
  let outcome='',lastCue='';
  const previousEnd=end,previousReset=resetAim,previousStart=startGame;
  end=function(ok,...args){previousEnd(ok,...args);outcome=ok?'':'failed';};
  resetAim=function(...args){outcome='';previousReset(...args);};
  startGame=function(...args){outcome='';previousStart(...args);};
  start.addEventListener('click',()=>{outcome='';});
  // Each cast owns its flight and delayed bite callbacks; resetting invalidates them.
  let recallPressed=false;
  cast.addEventListener('pointerdown',()=>{recallPressed=state==='cast';},true);
  cast.addEventListener('pointercancel',()=>{recallPressed=false;});
  cast.addEventListener('click',event=>{
    const recall=event.detail===0||recallPressed;recallPressed=false;
    if(!recall||state!=='cast')return;
    resetAim();msg.textContent='回収したよ。もう一度、狙って投げよう！';
  });
  let waitingCast=-1,waitingMs=0,previousFrame=performance.now();
  function renderCue(){
    const now=performance.now(),elapsed=Math.max(0,Math.min(100,now-previousFrame));previousFrame=now;
    if(state==='cast'){
      if(waitingCast!==fishingCastId){waitingCast=fishingCastId;waitingMs=0;}
      if(!document.hidden)waitingMs+=elapsed;
      if(waitingMs>=25000){resetAim();msg.textContent='食いつかなかったので回収したよ。場所を変えてみよう！';}
    }else{waitingCast=-1;waitingMs=0;}
    const cue=window.AobeeFishingCue({state,charging,charge,phase:fishPhase,reeling,mode:localStorage.getItem('aobeeControlMode')||'classic',outcome});
    const key=JSON.stringify(cue);
    if(cast.textContent!==cue.button)cast.textContent=cue.button;
    if(key!==lastCue){
      lastCue=key;cast.disabled=cue.disabled;cast.dataset.action=cue.kind;
      hint.textContent=cue.hint;controls.dataset.action=cue.kind;
      left.classList.toggle('suggested',cue.direction==='left');right.classList.toggle('suggested',cue.direction==='right');
    }
    requestAnimationFrame(renderCue);
  }
  renderCue();
})();
