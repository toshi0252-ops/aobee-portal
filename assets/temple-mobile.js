/* Touch controls occupy their own strip, never the playfield. */
var TempleMobile=(()=>{
 function sync(){const touch=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;const enabled=touch&&innerWidth>=innerHeight&&innerWidth<=1100;document.body.dataset.controlLayout=enabled?'rail':'';document.body.classList.toggle('touchRail',enabled);}
 document.body.insertAdjacentHTML('beforeend',`<div id="mobileControlRail" aria-hidden="true"></div><style>
 #mobileControlRail{display:none}#act[hidden]{display:none!important}body:not(.playing) #act{display:none!important}
 body.touchRail{--touch-safe:env(safe-area-inset-right,0px);--touch-rail:calc(152px + var(--touch-safe));--touch-row:calc((var(--vh,100dvh) - 62px)/5)}
 body.playing.touchRail #mobileControlRail{display:block;position:fixed;right:0;top:0;bottom:0;width:var(--touch-rail);z-index:5;background:linear-gradient(110deg,#143341,#081d2b);border-left:1px solid #b9ae7a66;box-sizing:border-box;pointer-events:none}
 body.playing.touchRail #wrap{position:fixed;left:0;top:50%;transform:translateY(-50%);width:min(calc(var(--vw,100vw) - var(--touch-rail)),calc(var(--vh,100dvh)*16/9));height:auto;aspect-ratio:16/9;max-height:var(--vh,100dvh)}
 body.touchRail #hud{right:calc(var(--touch-rail) + 8px);max-width:calc(var(--vw,100vw) - var(--touch-rail) - 16px)}
 body.touchRail #playMenu,body.touchRail #purposeButton,body.touchRail #travelMapButton{top:max(4px,env(safe-area-inset-top));bottom:auto;left:auto;min-width:44px;width:44px;min-height:44px;padding:0;font-size:12px;border-radius:8px}
 body.touchRail #playMenu{font-size:11px;letter-spacing:-.3px;white-space:nowrap;right:calc(6px + var(--touch-safe))}body.touchRail #purposeButton{right:calc(54px + var(--touch-safe))}body.touchRail #travelMapButton{right:calc(102px + var(--touch-safe))}
 body.touchRail #combatControls button,body.playing.touchRail #act,body.touchRail #adventureThrow{position:fixed!important;bottom:auto!important;right:calc(8px + var(--touch-safe))!important;left:auto!important;width:136px!important;min-width:44px;min-height:44px;height:clamp(44px,calc(var(--touch-row) - 6px),64px)!important;padding:3px 5px;border-radius:12px;font-size:16px;box-sizing:border-box}
 body.touchRail #combatControls small{display:none}
 body.touchRail #combatWeapon{top:54px!important}
 body.touchRail #adventureThrow{top:calc(54px + var(--touch-row))!important}
 body.touchRail #combatControls #combatGuard,body.touchRail #combatControls #combatDodge{top:calc(54px + var(--touch-row) + var(--touch-row))!important;width:64px!important;font-size:14px}
 body.touchRail #combatControls #combatDodge{right:calc(80px + var(--touch-safe))!important}
 body.playing.touchRail #act{top:calc(54px + var(--touch-row) + var(--touch-row) + var(--touch-row))!important;z-index:24}
 body.touchRail #combatAttack{top:calc(54px + var(--touch-row) + var(--touch-row) + var(--touch-row) + var(--touch-row))!important;font-size:18px}
 body.touchRail #combatEnergy{right:calc(12px + var(--touch-safe));bottom:5px;width:128px;height:4px}
 body.touchRail #combatBoss{left:calc((var(--vw,100vw) - var(--touch-rail))/2);width:min(280px,calc(var(--vw,100vw) - var(--touch-rail) - 28px));top:54px}
 body.touchRail #nearbyTarget{max-width:calc(var(--vw,100vw) - var(--touch-rail) - 24px)}
 body.touchRail #toast{left:12px;right:calc(var(--touch-rail) + 12px);width:auto}
 body.touchRail #floatZone{left:0!important;top:0!important;width:calc(var(--vw,100vw) - var(--touch-rail))!important;height:var(--vh,100dvh)!important}
 body.touchRail #rightFloatZone{display:none!important}
 </style>`);
 document.querySelector('footer').insertAdjacentHTML('beforeend','<button id="mobileHelp" type="button">スマホ操作ガイド</button>');
 document.body.appendChild($('act'));
 $('mobileHelp').onclick=()=>{playMenuOpen=false;clearStick();syncEdgeControls();say([['スマホ操作','左のプレイ画面を、行きたい方向へ指で滑らせると移動します。右側は操作専用です。'],['ブーメラン','入手後、投げたい方向へ少し動いてから「投げる」をタップ。自動で戻り、もう一度タップすると途中で呼び戻せます。'],['使い分け','風車やレバーへ投げると仕掛けが動きます。離れたアイテムは持ち帰って回収。敵を足止めしたら「攻撃」で追撃できます。']]);};
 const previous=TemplePresentation.finish;TemplePresentation.finish=function(){sync();previous();const hide=$('start').style.display!=='none'||playMenuOpen||templeGearOpen||questJournalOpen||chapterClearOpen||landscapeBlocked||end;if($('act').hidden!==hide)$('act').hidden=hide;if(document.body.dataset.controlLayout==='rail'){if($('travelMapButton').textContent!=='地図')$('travelMapButton').textContent='地図';const name='持替：'+currentWeapon().name;if($('combatWeapon').textContent!==name)$('combatWeapon').textContent=name;}else{if($('travelMapButton').textContent!=='旅の地図')$('travelMapButton').textContent='旅の地図';if(!$('combatWeapon').querySelector('small'))$('combatWeapon').innerHTML='持替 <small>Q</small>';}};
 window.addEventListener('resize',sync);sync();
 return {sync};
})();
