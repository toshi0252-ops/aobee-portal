/* Action combat: attacks are separate from interaction; story outcomes remain unchanged. */
var TempleCombat=(()=>{
 const weapons={sword:{name:'剣',damage:1,reach:1,width:1,cooldown:190,break:1},spear:{name:'槍',damage:2,reach:3,width:0,cooldown:340,break:1},hammer:{name:'ハンマー',damage:3,reach:1,width:1,cooldown:570,break:3}};
 const armors={travel:{name:'旅装',distance:3,cost:20,shield:0,recharge:0},leaf:{name:'守り手の胴衣',distance:2,cost:24,shield:1,recharge:8000},iron:{name:'星鉄の鎧',distance:1,cost:30,shield:2,recharge:12000}};
 const seeds={ch2_hub:[[9,11,'rush'],[18,6,'archer']],ch2_water:[[19,11,'archer']],ch3_shore:[[15,9,'shield'],[19,12,'archer']],ch4_storage:[[9,13,'shield']],ch5_court:[[15,12,'rush'],[9,8,'archer']]};
 let armor='travel',shards=0,levels={},bossLife={},mobs={},clock=0,energy=100,guardUntil=0,guardAt=-Infinity,dodgeUntil=0,lastDodge=-Infinity,lastAttack=-Infinity,lastHurt=-Infinity,combo=0,shield=0,rechargeAt=0;
 let previousArea='';let armorPools={};let lastWeapon='';let hitStop=0;let effects=[],projectiles=[],actorStates=new WeakMap(),audio=null,sound=true;
 const beforeAction=action;
 const active=()=>s101CanInteract()&&!playMenuOpen&&!landscapeBlocked&&!document.hidden&&innerWidth>=innerHeight;
 const direction=()=>({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[player.dir];
 const level=key=>levels[key]||0;
 function boss(){
  if(area==='ruins'&&ruinKey&&ruinBossHP>0)return {id:'guardian',name:'遺跡の守護機械',x:ruinBossX,y:ruinBossY,max:20,remaining:ruinBossHP/5,open:!!bossWarnAt};
  if(area==='seal'&&['cooperate','battle'].includes(chapter1Story.mode))return {id:'shadow',name:'星喰いの影',x:12,y:4,max:28,remaining:chapter1Story.bossHP/9,open:sealCycle==='open'};
  if(!['ch2_tower4','ch3_beacon','ch4_scribe','ch5_core'].includes(area))return null;
  const c2=TempleChapter2.getState(),c3=TempleChapter3.getState(),c4=TempleChapter4.getState(),c5=TempleChapter5.getState();
  if(area==='ch2_tower4'&&!c2.stopped)return {id:'root',name:'根の番人',x:12,y:5,max:32,remaining:(4-c2.bossStage)/3,open:TempleChapter2.getBattleState().cycle==='open',help:c2.redirected||c2.held,api:TempleChapter2};
  if(area==='ch3_beacon'&&!c3.stopped)return {id:'tide',name:'潮の番人',x:12,y:5,max:28,remaining:1,open:TempleChapter3.getBattleState().cycle==='open',help:c3.valves.some(Boolean),api:TempleChapter3};
  if(area==='ch4_scribe'&&!c4.scribeStopped)return {id:'scribe',name:'忘却の書記',x:12,y:5,max:32,remaining:1-c4.protected/4,open:TempleChapter4.getBattleState().cycle==='open',help:c4.backup,api:TempleChapter4};
  if(area==='ch5_core'&&!c5.networkBalanced)return {id:'core',name:'星の番人',x:12,y:5,max:44,remaining:c5.stage===1?1:c5.stage===2?.7:.3,open:TempleChapter5.getBattleState().cycle==='open',help:c5.relays.some(Boolean),api:TempleChapter5};
  return null;
 }
 function life(b){if(bossLife[b.id])return {...bossLife[b.id],hp:Math.min(bossLife[b.id].hp,Math.max(1,Math.ceil(b.max*b.remaining)))};return {hp:Math.max(1,Math.ceil(b.max*b.remaining)),stagger:0,until:0}}
 function finishAt(x,y,fn){const position={x:player.x,y:player.y,dir:player.dir};player.x=x;player.y=y;player.dir='up';try{return fn()}finally{Object.assign(player,position);templeMove=null}}
 function tone(kind){if(!sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio??=new AC();audio.resume();const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;o.type=kind==='hammer'?'triangle':'sine';o.frequency.setValueAtTime(kind==='parry'?850:kind==='hammer'?125:kind==='hit'?420:260,now);o.frequency.exponentialRampToValueAtTime(kind==='parry'?1200:80,now+.1);g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.001,now+.13);o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+.14)}catch{}}
 function fx(x,y,text,color='#ffe3a0'){effects.push({x,y,text,color,at:clock});effects=effects.slice(-28)}
 function award(amount,x,y){shards+=amount;fx(x,y,'星片 +'+amount,'#a8ffda');syncEquipment()}
 function actors(){return area==='forest'?enemy:(mobs[area]||[])}
 function stateFor(e,index){let state=actorStates.get(e);if(!state){const kind=['rush','shield','archer'].includes(e.kind)?e.kind:['rush','shield'][index%2];e.kind=kind;state={phase:'idle',due:clock+500,dir:[0,1],kind};actorStates.set(e,state)}return state}
 function occupied(x,y,except){return actors().some(e=>e!==except&&e.hp>0&&e.x===x&&e.y===y)}
 function hits(x,y){const [dx,dy]=direction(),w=weapons[templeWeapon],forward=(x-player.x)*dx+(y-player.y)*dy,side=(x-player.x)*-dy+(y-player.y)*dx;if(forward<1||forward>w.reach||Math.abs(side)>w.width)return false;for(let n=1;n<forward;n++)if(wall(player.x+dx*n,player.y+dy*n))return false;return true}
 function defeat(b){
  award(6,b.x,b.y);fx(b.x,b.y,'回路停止！','#a3ffde');player.hp=Math.min(maxHealth(),player.hp+1);updateHud();
  if(b.id==='guardian'){ruinBossHP=0;say([['守護機械','……おまえの光は、誰かを照らす光なのだな。'],['語り','守護機械は動きを止め、奥の封印が解けた。']],()=>objective('北の祭壇を調べよう'));}
  else if(b.id==='shadow'){chapter1Story.bossHP=1;sealCycle='open';sealHitAt=-Infinity;finishAt(12,5,()=>beforeAction());}
  else b.api.completeCombat();
 }
 function attack(){
  if(!active()||area==='village'||area==='ch5_festival')return false;
  const w=weapons[templeWeapon];if(clock-lastAttack<w.cooldown)return false;
  const b=boss();
  if(b?.id==='shadow'&&chapter1Story.mode==='cooperate'){beginSealBattle();toast('わるびーが補助回路を保持！ 攻撃で影を追い払おう');}
  if(b?.id==='core'&&!TempleChapter5.getState().battleStarted){TempleChapter5.startCombat();return false;}
  combo=templeWeapon==='sword'&&lastWeapon==='sword'&&clock-lastAttack<850?combo%3+1:1;lastAttack=clock;lastWeapon=templeWeapon;guardUntil=0;templeAttack={time:performance.now(),weapon:templeWeapon,area};tone(templeWeapon);
  let hit=false;const damage=w.damage+level(templeWeapon)+(templeWeapon==='sword'&&combo===3?2:0);
  for(const e of [...actors()])if(e.hp>0&&hits(e.x,e.y)){
   const a=stateFor(e,actors().indexOf(e)),[dx,dy]=direction(),front=(player.x-e.x)*a.dir[0]+(player.y-e.y)*a.dir[1]>0;
   if(a.kind==='shield'&&a.phase!=='stunned'&&front&&templeWeapon!=='hammer'&&combo!==3){fx(e.x,e.y,'盾！ 横へ回り込もう','#b8cfe7');tone('hit');hit=true;continue;}
   e.hp-=damage;a.phase='stunned';a.due=clock+(templeWeapon==='hammer'?1000:420);fx(e.x,e.y,'−'+damage+(combo===3?' 連撃！':''));tone('hit');hit=true;
   for(let n=0;n<(templeWeapon==='hammer'?2:1);n++){const x=e.x+dx,y=e.y+dy;if(wall(x,y)||occupied(x,y,e)||(x===player.x&&y===player.y))break;e.x=x;e.y=y}
   if(e.hp<=0){const list=actors();list.splice(list.indexOf(e),1);award(2,e.x,e.y)}
  }
  if(b&&hits(b.x,b.y)){
   const state=life(b);bossLife[b.id]=state;state.stagger+=w.break;
   if(state.stagger>=3&&clock>=(state.resistUntil||0)){state.stagger=0;state.until=clock+1100;state.resistUntil=clock+3500;fx(b.x,b.y,'体勢を崩した！','#a6f9ff');}
   const exposed=b.open||state.until>clock;const amount=damage+(exposed?damage:0)+(b.help?1:0);state.hp=Math.max(0,state.hp-amount);fx(b.x,b.y,'−'+amount+(exposed?' 弱点！':''));tone('hit');hit=true;
   if(state.hp===0)defeat(b);else{const phase=state.hp>b.max*2/3?1:state.hp>b.max/3?2:3;if(b.id==='guardian')ruinBossHP=Math.max(1,Math.ceil(5*state.hp/b.max));if(b.id==='shadow')chapter1Story.bossHP=Math.max(1,Math.ceil(9*state.hp/b.max));b.api?.combatPhase?.(phase);}
  }
  if(hit){hitStop=55;saveGame(true)}return hit;
 }
 function dodge(){
  if(!active()||clock-lastDodge<550)return false;const a=armors[armor],cost=Math.max(12,a.cost-level(armor)*4);if(energy<cost){toast('回避の息を整えよう');return false}
  const [dx,dy]=direction(),origin={x:player.x,y:player.y};energy-=cost;lastDodge=clock;dodgeUntil=clock+380+level(armor)*50;guardUntil=0;
  for(let n=0;n<a.distance;n++){const x=player.x,y=player.y;if(occupied(x+dx,y+dy))break;move(dx,dy);if(area!==dodgeArea||!active()||(player.x===x&&player.y===y))break;}
  if(area===dodgeArea)templeMove={x:origin.x,y:origin.y,tx:player.x,ty:player.y,area,time:performance.now()};fx(origin.x,origin.y,'回避','#b8e8ff');tone('sword');return true;
 }
 let dodgeArea='';function evade(){dodgeArea=area;return dodge()}
 function guard(){if(!active()||energy<12)return false;energy-=12;guardAt=clock;guardUntil=clock+1000;fx(player.x,player.y,'ガード','#a8e4ff');return true}
 function hurt(amount=1,source=null){
  if(!active()||dodgeUntil>clock||clock-lastHurt<800)return false;
  if(guardUntil>clock){lastHurt=clock;if(clock-guardAt<=200){fx(player.x,player.y,'弾いた！','#a0ffff');tone('parry');const b=boss();if(b){const state=life(b);bossLife[b.id]=state;state.until=clock+1800}for(const e of actors())if(Math.abs(e.x-player.x)+Math.abs(e.y-player.y)<=4){const state=stateFor(e,actors().indexOf(e));state.phase='stunned';state.due=clock+1300;}}else fx(player.x,player.y,'防いだ','#addbff');guardUntil=0;return false;}
  if(shield>0){shield--;lastHurt=clock;rechargeAt=clock+Math.max(4000,armors[armor].recharge-level(armor)*1800);fx(player.x,player.y,'鎧が防いだ','#d7e9ff');return false;}
  lastHurt=clock;player.hp-=amount;fx(player.x,player.y,'−'+amount,'#ff9d91');tone('hit');updateHud();return true;
 }
 function strike(e,a){
  const tiles=a.kind==='rush'?3:1,[dx,dy]=a.dir;
  for(let n=0;n<tiles;n++){const x=e.x+dx,y=e.y+dy;if(x===player.x&&y===player.y){hurt(1,e);break}if(wall(x,y)||occupied(x,y,e))break;e.x=x;e.y=y}
 }
 function tickActors(){
  if(seeds[area]&&!Object.hasOwn(mobs,area))mobs[area]=seeds[area].filter(([x,y])=>!wall(x,y)).map(([x,y,kind])=>({x,y,kind,hp:kind==='shield'?4:3}));
  for(const [index,e]of actors().entries()){
   const a=stateFor(e,index),distance=Math.abs(e.x-player.x)+Math.abs(e.y-player.y);if(distance>7||clock<a.due)continue;
   if(a.phase==='windup'){if(a.kind==='archer')projectiles.push({x:e.x,y:e.y,dx:a.dir[0],dy:a.dir[1],due:clock+150,remaining:7});else strike(e,a);a.phase='recover';a.due=clock+900;continue;}
   if(a.phase==='stunned'||a.phase==='recover'){a.phase='idle';a.due=clock+180;continue;}
   const dx=player.x-e.x,dy=player.y-e.y;a.dir=Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)||1];
   if(distance<=(a.kind==='archer'?6:a.kind==='rush'?3:1)){a.phase='windup';a.due=clock+(a.kind==='archer'?800:650);continue;}
   const [mx,my]=a.dir,x=e.x+mx,y=e.y+my;if(!wall(x,y)&&!occupied(x,y,e)&&!(x===player.x&&y===player.y)){e.x=x;e.y=y}a.due=clock+600;
  }
  for(const shot of projectiles){if(clock<shot.due)continue;shot.x+=shot.dx;shot.y+=shot.dy;shot.due=clock+160;shot.remaining--;if(shot.x===player.x&&shot.y===player.y){hurt(1,shot);shot.remaining=0}if(wall(shot.x,shot.y))shot.remaining=0}projectiles=projectiles.filter(p=>p.remaining>0);
  if(player.hp<=0){player.hp=maxHealth();player.x=12;player.y=14;templeMove=null;projectiles=[];lastHurt=clock;updateHud();toast('入口で回復。倒した敵と装備強化は残っています');saveGame(true)}
 }
 function resetRuntime(){previousArea=area;clock=0;energy=100;guardUntil=dodgeUntil=0;lastDodge=lastAttack=lastHurt=-Infinity;combo=0;lastWeapon='';armorPools={};shield=armors[armor].shield;rechargeAt=0;hitStop=0;effects=[];projectiles=[];actorStates=new WeakMap();}
 const oldStep=simulationStep;simulationStep=function(t){if(hitStop>0&&active()){hitStop-=1000/60;clock+=1000/60;return}oldStep(t);if(!active())return;if(previousArea!==area){previousArea=area;projectiles=[];effects=[];actorStates=new WeakMap()}clock+=1000/60;energy=Math.min(100,energy+1000/60*.025);if(armors[armor].shield&&shield<armors[armor].shield&&clock>=rechargeAt){shield++;rechargeAt=clock+Math.max(4000,armors[armor].recharge-level(armor)*1800)}tickActors();effects=effects.filter(f=>clock-f.at<650)};
 const oldMove=move;move=function(dx,dy){if(occupied(player.x+dx,player.y+dy)){player.dir=dx<0?'left':dx>0?'right':dy<0?'up':'down';return}const before=area;oldMove(dx,dy);if(area!==before){projectiles=[];effects=[];actorStates=new WeakMap()}};
 const oldSnapshot=snapshot;snapshot=function(){return {...oldSnapshot(),combat:{version:1,armor,shards,levels:{...levels},bossLife:JSON.parse(JSON.stringify(bossLife)),mobs:JSON.parse(JSON.stringify(mobs)),sound}}};
 const oldRestore=restoreGame;restoreGame=function(data){const result=oldRestore(data);if(result===false)return false;const s=data.combat||{};armor=Object.hasOwn(armors,s.armor)?s.armor:'travel';shards=Number.isInteger(s.shards)&&s.shards>=0?Math.min(9999,s.shards):0;levels={};for(const key of [...Object.keys(weapons),...Object.keys(armors)])levels[key]=[0,1,2].includes(s.levels?.[key])?s.levels[key]:0;bossLife={};for(const [id,max]of Object.entries({guardian:20,shadow:28,root:32,tide:28,scribe:32,core:44})){const value=s.bossLife?.[id];if(value&&Number.isInteger(value.hp)&&value.hp>=0&&value.hp<=max)bossLife[id]={hp:value.hp,stagger:0,until:0}}mobs={};for(const place of Object.keys(seeds))if(Array.isArray(s.mobs?.[place]))mobs[place]=s.mobs[place].filter(e=>e&&Number.isInteger(e.x)&&Number.isInteger(e.y)&&e.x>0&&e.x<23&&e.y>0&&e.y<17&&['rush','archer','shield'].includes(e.kind)&&Number.isInteger(e.hp)&&e.hp>0&&e.hp<=4).map(e=>({x:e.x,y:e.y,kind:e.kind,hp:e.hp}));sound=s.sound!==false;resetRuntime();syncEquipment();if(boss())objective('');return result};
 function upgrade(key){if(!Object.hasOwn(weapons,key)&&!Object.hasOwn(armors,key))return false;const cost=(level(key)+1)*4;if(level(key)>=2||shards<cost){$('combatGearStatus').textContent=level(key)>=2?'この装備は最大まで強化済み':'星片が'+cost+'必要です。敵を倒して集めよう';return false}shards-=cost;levels[key]=level(key)+1;syncEquipment();saveGame(true);return true}
 function equipArmor(key){if(!Object.hasOwn(armors,key)||key===armor)return;armorPools[armor]={shield,rechargeAt};armor=key;const pool=armorPools[key];shield=pool&&clock<pool.rechargeAt?pool.shield:armors[key].shield;rechargeAt=pool?.rechargeAt||clock+armors[key].recharge;syncEquipment();saveGame(true)}
 function syncEquipment(){if(!$('combatGearStatus'))return;$('combatGearStatus').textContent='星片 '+shards+' ／ 武器：'+weapons[templeWeapon].name+' +'+level(templeWeapon)+' ／ 防具：'+armors[armor].name+' +'+level(armor);for(const key of Object.keys(weapons))$('equip-'+key).textContent=weapons[key].name+' +'+level(key)+' · '+({sword:'素早い3連撃・3撃目が強打',spear:'3マス先を貫く・一撃が重い',hammer:'盾を砕く・大きく吹き飛ばす'})[key];for(const key of Object.keys(armors))$('armor-'+key).setAttribute('aria-pressed',String(key===armor));$('combatUpgradeWeapon').textContent='武器を強化 '+(level(templeWeapon)>=2?'（最大）':'星片'+((level(templeWeapon)+1)*4));$('combatUpgradeArmor').textContent='防具を強化 '+(level(armor)>=2?'（最大）':'星片'+((level(armor)+1)*4));$('combatSound').textContent='効果音：'+(sound?'入':'切');}
 function cycleWeapon(){const keys=Object.keys(weapons);templeWeapon=keys[(keys.indexOf(templeWeapon)+1)%3];templeAttack=null;updateEquipment();syncEquipment();toast(weapons[templeWeapon].name+'に持ち替えた');saveGame(true)}
 document.body.insertAdjacentHTML('beforeend',`<div id="combatControls" hidden><button id="combatAttack" type="button" aria-label="武器で攻撃">攻撃 <small>J</small></button><button id="combatDodge" type="button">回避 <small>K</small></button><button id="combatGuard" type="button">ガード <small>L</small></button><button id="combatWeapon" type="button" aria-label="武器を持ち替える">持替 <small>Q</small></button><div id="combatEnergy" aria-label="回避の余力"><i></i></div></div><div id="combatBoss" hidden><b id="combatBossName"></b><div><i id="combatBossLife"></i></div><small>攻撃で削る・崩したら連撃！ 回避／ガードで反撃</small></div><style>#combatControls[hidden],#combatBoss[hidden]{display:none!important}#combatControls button{position:fixed;z-index:24;border:1px solid #ead39a;border-radius:50%;background:linear-gradient(#bb9560,#705135);color:#fff8dc;font-weight:bold;font-size:17px;touch-action:manipulation;min-width:52px;min-height:48px}#combatControls small{display:block;font-size:10px;opacity:.75}#combatAttack{right:18px;bottom:14px;width:90px;height:90px}#combatDodge{right:122px;bottom:14px;width:64px;height:64px}#combatGuard{right:122px;bottom:85px;width:64px;height:54px}#combatWeapon{right:198px;bottom:14px;width:58px;height:54px}body.playing #act{bottom:112px;right:18px;width:80px;height:48px;min-height:44px;border-radius:12px;font-size:14px}#combatEnergy{position:fixed;right:126px;bottom:155px;width:56px;height:5px;background:#0d223b;border:1px solid #bbdcdf;z-index:23}#combatEnergy i{display:block;height:100%;background:#9fe7c8}#combatBoss{position:fixed;top:55px;left:50%;transform:translateX(-50%);width:min(300px,48vw);z-index:15;background:#112b3deb;padding:5px 9px;border-radius:8px;color:#ffe3ac;text-align:center;font-size:14px;pointer-events:none}#combatBoss>div{height:7px;background:#4d3341;margin:4px 0}#combatBossLife{display:block;height:100%;background:linear-gradient(90deg,#ff9c6a,#ffe28a)}#combatBoss small{font-size:11px;display:block}#equipmentPanel section{max-height:90dvh;overflow:auto;touch-action:pan-y}#equipmentPanel button{min-height:44px}#combatGearStatus{color:#ffe3a0}body:not(.playing) #combatControls{display:none!important}@media(max-height:400px){#combatBoss{top:53px;font-size:12px}#combatBoss small{font-size:10px}#combatControls button{font-size:15px}}</style>`);
 $('equipmentPanel').querySelector('section').insertAdjacentHTML('beforeend','<h3>防具と強化</h3><p>旅装：3マス回避 ／ 胴衣：一撃を自動防御 ／ 星鉄：二撃を自動防御・回避は短い。防御は時間で回復します。</p><button id="armor-travel" type="button">旅装 · 回避重視</button><button id="armor-leaf" type="button">守り手の胴衣 · バランス</button><button id="armor-iron" type="button">星鉄の鎧 · 防御重視</button><p id="combatGearStatus"></p><button id="combatUpgradeWeapon" type="button">武器を強化</button><button id="combatUpgradeArmor" type="button">防具を強化</button><button id="combatSound" type="button">効果音：入</button>');
 $('equipmentTitle').textContent='武器・防具・強化';$('equipmentPanel').querySelector('p').textContent='J：攻撃　K：向いている方向へ回避　L：ガード（直前なら弾く）　Q：武器持替。スマホは右の専用ボタン。ボスは待たずに攻撃でき、ギミックは有利にする手段です。';
 $('combatAttack').onclick=attack;$('combatDodge').onclick=evade;$('combatGuard').onclick=guard;$('combatWeapon').onclick=cycleWeapon;for(const key of Object.keys(armors))$('armor-'+key).onclick=()=>equipArmor(key);$('combatUpgradeWeapon').onclick=()=>upgrade(templeWeapon);$('combatUpgradeArmor').onclick=()=>upgrade(armor);$('combatSound').onclick=()=>{sound=!sound;syncEquipment();saveGame(true)};
 const previousEquipment=$('equipment').onclick;$('equipment').onclick=()=>{syncEquipment();previousEquipment()};for(const key of Object.keys(weapons)){const previous=$('equip-'+key).onclick;$('equip-'+key).onclick=()=>{previous();syncEquipment()}}
 document.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(!['j','k','l','q'].includes(key)||!active())return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)({j:attack,k:evade,l:guard,q:cycleWeapon})[key]()},{capture:true});
 const priorObjective=objective;objective=function(text){const b=boss();priorObjective(b?b.name+'：予兆を回避し、攻撃で削る。ガードやギミックから反撃！':text)};
 const priorLabel=TemplePresentation.label;TemplePresentation.label=function(g,text,...args){if(/防御中：|攻撃できる！|停止できる！|光の放出を待とう|西の協力台で合図/.test(text)&&boss())return;priorLabel(g,text,...args)};
 const oldDraw=draw;draw=function(){oldDraw();const g=ctx;if($('start').style.display!=='none')return;g.save();g.setTransform(1,0,0,1,-templeCameraX(),-Math.max(0,Math.min(180,templePose().y*40-250)));for(const [index,e]of actors().entries()){const a=actorStates.get(e),kind=a?.kind||e.kind||['rush','shield'][index%2],x=e.x*40+20,y=e.y*40+34;if(area!=='forest')TemplePresentation.prop(g,11,x,y,48,56);g.strokeStyle=kind==='shield'?'#bfd6ee':kind==='archer'?'#bcf5e9':'#ffb9a1';g.lineWidth=4;g.beginPath();g.arc(x,y-24,20,0,Math.PI*2);g.stroke();if(kind==='shield'){g.fillStyle='#c8dded';g.fillRect(x-8,y-18,16,20)}if(kind==='archer'){g.strokeStyle='#8fffe2';g.beginPath();g.arc(x,y-22,24,-1.2,1.2);g.stroke()}if(a?.phase==='windup'){g.fillStyle='#ff806b70';const [dx,dy]=a.dir;for(let n=1;n<=(kind==='archer'?6:kind==='rush'?3:1);n++)g.fillRect((e.x+dx*n)*40+2,(e.y+dy*n)*40+2,36,36)}if(a?.phase==='stunned'){g.fillStyle='#a9faff';g.fillRect(x-15,y-58,30,4)}}for(const p of projectiles){g.fillStyle='#ffcf7a';g.beginPath();g.arc(p.x*40+20,p.y*40+20,8,0,7);g.fill()}for(const f of effects){const age=(clock-f.at)/650;g.globalAlpha=1-age;g.fillStyle=f.color;g.beginPath();g.arc(f.x*40+20,f.y*40+15,12+age*30,0,7);g.strokeStyle=f.color;g.lineWidth=3;g.stroke();g.font='bold 20px sans-serif';g.textAlign='center';g.fillText(f.text,f.x*40+20,f.y*40-20-age*28)}g.globalAlpha=1;if(dodgeUntil>clock||guardUntil>clock||shield>0){g.strokeStyle=dodgeUntil>clock?'#c4ffff':'#b9daff';g.lineWidth=3;g.beginPath();g.ellipse(player.x*40+20,player.y*40+12,30,37,0,0,7);g.stroke()}g.restore()};
 const oldFinish=TemplePresentation.finish;TemplePresentation.finish=function(){oldFinish();const usable=active();$('combatControls').hidden=!usable||area==='village'||area==='ch5_festival';const b=boss();$('combatBoss').hidden=!usable||!b;if(b){const current=life(b);$('combatBossName').textContent=b.name+' '+current.hp+'/'+b.max;$('combatBossLife').style.width=(100*current.hp/b.max)+'%'}$('combatEnergy').querySelector('i').style.width=energy+'%';if(usable){$('act').innerHTML='調べる';$('act').setAttribute('aria-label','調べる')}};
 $('equipmentPanel').querySelector('section').appendChild($('equipmentClose'));
 syncEquipment();
 function rangedHit(x,y,power,seen){let hit=false;for(const e of [...actors()])if(e.x===x&&e.y===y&&!seen.has(e)){seen.add(e);const a=stateFor(e,actors().indexOf(e));a.phase='stunned';a.due=clock+1000+power*300;e.hp-=1+Math.floor(power/2);fx(e.x,e.y,'風で足止め！','#a3ffff');if(e.hp<=0){actors().splice(actors().indexOf(e),1);award(2,e.x,e.y)}hit=true;}const b=boss();if(b&&b.x===x&&b.y===y&&!seen.has('boss:'+b.id)){seen.add('boss:'+b.id);if(b.id==='core'&&!TempleChapter5.getState().battleStarted)return hit;if(b.id==='shadow'&&chapter1Story.mode==='cooperate')beginSealBattle();const state=life(b);bossLife[b.id]=state;state.hp=Math.max(0,state.hp-1-power);state.until=Math.max(state.until,clock+450);fx(x,y,'風の一撃 −'+(1+power),'#a3ffff');if(state.hp===0)defeat(b);else{const phase=state.hp>b.max*2/3?1:state.hp>b.max/3?2:3;if(b.id==='guardian')ruinBossHP=Math.max(1,Math.ceil(5*state.hp/b.max));if(b.id==='shadow')chapter1Story.bossHP=Math.max(1,Math.ceil(9*state.hp/b.max));b.api?.combatPhase?.(phase);}hit=true;}if(hit){tone('hit');saveGame(true)}return hit;}
 function spendShards(cost){if(!Number.isInteger(cost)||cost<0||shards<cost)return false;shards-=cost;syncEquipment();return true}
 return {rangedHit,spendShards,stunned:()=>{const b=boss();return !!b&&life(b).until>clock},attack,dodge:evade,guard,hurt,upgrade,equipArmor,finishAt,boss,getState:()=>({armor,shards,levels:{...levels},energy,shield,combo,projectiles:projectiles.map(p=>({...p})),enemies:actors().map(e=>({...e,phase:actorStates.get(e)?.phase})),bossLife:JSON.parse(JSON.stringify(bossLife))})};
})();
