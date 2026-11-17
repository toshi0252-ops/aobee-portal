/* Centered playfield, two-handed controls and contextual utilities. */
var TempleMobile=(()=>{
 function sync(){const touch=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;const enabled=touch&&innerWidth>=innerHeight&&innerWidth<=1100;document.body.dataset.controlLayout=enabled?'balanced':'';document.body.classList.toggle('touchBalanced',enabled);}
 document.body.insertAdjacentHTML('beforeend',`<div id="mobileMoveHint" aria-hidden="true"><i></i><span>移動</span></div><style>
 #mobileMoveHint{display:none}#act[hidden]{display:none!important}body:not(.playing) #act{display:none!important}
 body.touchBalanced{--thumb-safe:max(env(safe-area-inset-left,0px),env(safe-area-inset-right,0px));--thumb-wing:calc(64px + var(--thumb-safe));--play-w:min(calc(var(--vw,100vw) - var(--thumb-wing) - var(--thumb-wing)),calc(var(--vh,100dvh)*16/9));--play-inset:calc((var(--vw,100vw) - var(--play-w))/2)}
 body.playing.touchBalanced #wrap{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:var(--play-w);height:auto;aspect-ratio:16/9;max-height:var(--vh,100dvh)}
 body.touchBalanced #hud{left:calc(var(--play-inset) + 8px);right:calc(var(--play-inset) + 8px);max-width:calc(var(--play-w) - 16px)}
 body.touchBalanced #playMenu{top:max(8px,env(safe-area-inset-top));right:calc(8px + var(--thumb-safe));min-width:44px;width:44px;min-height:44px;padding:0;font-size:11px;letter-spacing:-.3px;border-radius:12px;white-space:nowrap}
 body.touchBalanced #purposeButton,body.touchBalanced #travelMapButton,body.touchBalanced #combatWeapon{display:none!important}
 body.touchBalanced #combatControls button,body.playing.touchBalanced #act,body.touchBalanced #adventureThrow{position:fixed!important;top:auto!important;left:auto!important;right:calc(8px + var(--thumb-safe))!important;width:52px!important;height:52px!important;min-width:44px;min-height:44px;padding:2px;border-radius:50%;box-sizing:border-box;touch-action:none;font-size:14px;background:#254a58db;box-shadow:0 2px 8px #06162366}
 body.touchBalanced #combatControls small{display:none}
 body.touchBalanced #combatControls #combatAttack{bottom:max(16px,env(safe-area-inset-bottom))!important;width:64px!important;height:64px!important;background:linear-gradient(#b89765eb,#715337e6);font-size:18px}
 body.touchBalanced #combatControls #combatDodge{bottom:94px!important}
 body.touchBalanced #adventureThrow{right:calc(80px + var(--thumb-safe))!important;bottom:max(16px,env(safe-area-inset-bottom))!important;background:#286363c9}
 body.playing.touchBalanced #act{bottom:160px!important;font-size:12px;z-index:24;background:#234350bf}
 body.touchBalanced #combatControls #combatGuard{left:calc(8px + var(--thumb-safe))!important;right:auto!important;bottom:94px!important;background:#254a58bf}
 body.touchBalanced .mobileWeaponName{display:block;font-size:10px;line-height:1.2;font-weight:normal}
 body.touchBalanced #combatEnergy{right:calc(10px + var(--thumb-safe));bottom:7px;width:60px;height:3px}
 body.touchBalanced #combatBoss{left:50%;width:min(280px,calc(var(--play-w) - 28px));top:54px}
 body.touchBalanced #nearbyTarget{left:calc(var(--play-inset) + 8px);max-width:calc(var(--play-w) - 24px)}
 body.touchBalanced #toast{left:calc(var(--play-inset) + 12px);right:calc(var(--play-inset) + 12px);width:auto}
 body.touchBalanced #floatZone{left:0!important;top:0!important;width:45vw!important;height:var(--vh,100dvh)!important}
 body.touchBalanced #rightFloatZone{display:none!important}
 body.playing.touchBalanced #mobileMoveHint{display:grid;place-items:center;position:fixed;left:calc(8px + var(--thumb-safe));bottom:max(16px,env(safe-area-inset-bottom));width:64px;height:64px;border:1px solid #bacab57a;border-radius:50%;background:#183c4677;z-index:5;pointer-events:none;box-sizing:border-box}
 #mobileMoveHint i{width:28px;height:28px;border:1px solid #c9d6bf8a;border-radius:50%;background:#91b5aa44}#mobileMoveHint span{position:absolute;bottom:4px;font-size:10px;color:#e4eddc}
 body.touchBalanced #mobileMoveHint[hidden]{display:none!important}
 </style>`);
 document.querySelector('footer').insertAdjacentHTML('beforeend','<button id="mobileMap" type="button">旅の地図</button><button id="mobileGoal" type="button">今の目的</button><button id="mobileWeapon" type="button">武器を持ち替える</button><button id="mobileHelp" type="button">スマホ操作ガイド</button>');
 document.body.appendChild($('act'));
 function closeMenu(){playMenuOpen=false;document.querySelector('footer').classList.remove('open');$('playMenu').setAttribute('aria-expanded','false');clearStick();syncEdgeControls();}
 $('mobileMap').onclick=()=>{closeMenu();TempleJourney.openMap()};$('mobileGoal').onclick=()=>{closeMenu();$('purposeButton').onclick()};$('mobileWeapon').onclick=()=>{closeMenu();$('combatWeapon').onclick()};
 $('mobileHelp').onclick=()=>{closeMenu();say([['スマホ操作','左下のパッド、または画面の左半分を指で滑らせて移動します。右下の大きなボタンが攻撃。回避と投げるは、その隣です。'],['ブーメラン','投げたい方向へ少し動いてから「投げる」をタップ。自動で戻り、もう一度タップすると途中で呼び戻せます。左の「守る」は直前に押すと敵の攻撃を弾けます。'],['使い分け','近くの人や仕掛けは「調べる」。風車や離れたアイテムへブーメランを投げ、敵を足止めしたら攻撃で追撃。地図・目的・武器の持替はメニューにあります。']]);};
 const previous=TemplePresentation.finish;TemplePresentation.finish=function(){sync();previous();const hide=$('start').style.display!=='none'||playMenuOpen||templeGearOpen||questJournalOpen||chapterClearOpen||landscapeBlocked||end;if($('act').hidden!==hide)$('act').hidden=hide;const movingHidden=hide||$('dialog').style.display==='block';if($('mobileMoveHint').hidden!==movingHidden)$('mobileMoveHint').hidden=movingHidden;
 if(document.body.dataset.controlLayout==='balanced'){const label='攻撃<span class="mobileWeaponName">'+currentWeapon().name+'</span>';if($('combatAttack').innerHTML!==label)$('combatAttack').innerHTML=label;if($('combatGuard').textContent!=='守る')$('combatGuard').textContent='守る';}
 else{if(!$('combatAttack').querySelector('small'))$('combatAttack').innerHTML='攻撃 <small>J</small>';if(!$('combatGuard').querySelector('small'))$('combatGuard').innerHTML='ガード <small>L</small>';}};
 for(const id of ['combatAttack','combatDodge','combatGuard','adventureThrow']){const button=$(id);let lastTouch=-Infinity;button.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){lastTouch=performance.now();event.preventDefault();event.stopPropagation();button.onclick?.(event)}});button.addEventListener('click',event=>{if(event.pointerType==='touch'||event.sourceCapabilities?.firesTouchEvents||(event.detail>0&&performance.now()-lastTouch<700)){event.preventDefault();event.stopImmediatePropagation()}},{capture:true});}
 window.addEventListener('resize',sync);sync();return {sync};
})();
