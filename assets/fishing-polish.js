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
  cast.addEventListener('pointerdown',event=>{if(!cast.disabled)cast.setPointerCapture?.(event.pointerId)});
  function renderCue(){
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
