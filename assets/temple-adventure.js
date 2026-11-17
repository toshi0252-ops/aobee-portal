/* Discoveries that expand both combat and exploration. */
var TempleAdventure=(()=>{
 const pieces=[
  {id:'forest-path',chapter:1,area:'forest',x:4,y:12,title:'木の根に守られたかけら'},
  {id:'forest-wind',chapter:1,area:'forest',x:21,y:8,title:'風車の小箱',requires:'forestWind'},
  {id:'mural-cache',chapter:1,area:'annex',x:20,y:12,title:'壁画の裏の小箱'},
  {id:'ruin-garden',chapter:1,area:'ruins',x:4,y:5,title:'遺跡の小さな庭',hint:'星の鍵で遺跡の奥を開こう',ready:()=>ruinKey},
  {id:'water-ledge',chapter:2,area:'ch2_water',x:20,y:5,title:'水路の対岸の小箱',requires:'waterBridge'},
  {id:'canopy-cache',chapter:2,area:'ch2_canopy',x:4,y:5,title:'樹冠の枝に残るかけら'},
  {id:'cave-cache',chapter:2,area:'ch2_cave',x:20,y:4,title:'反響の奥のかけら'},
  {id:'tower-cache',chapter:2,area:'ch2_tower2',x:20,y:4,title:'塔の見張り棚'},
  {id:'port-thanks',chapter:3,area:'ch3_port',x:4,y:12,title:'帰還船からのお礼',hint:'防波堤で帰れない船を助けよう',ready:()=>TempleChapter3.getState().boatRescued},
  {id:'crane-cache',chapter:3,area:'ch3_shore',x:20,y:5,title:'海鳥の見張る吊り荷',requires:'harborCrane'},
  {id:'sea-record',chapter:3,area:'ch3_observatory',x:4,y:4,title:'海底観測棚'},
  {id:'beacon-cache',chapter:3,area:'ch3_lighthouse',x:20,y:4,title:'灯台の古い補修箱'},
  {id:'clock-thanks',chapter:4,area:'ch4_settlement',x:4,y:12,title:'時計職人の置き土産',hint:'集落の時計を修理しよう',ready:()=>TempleChapter4.getState().clockFixed},
  {id:'archive-wind',chapter:4,area:'ch4_archive',x:20,y:12,title:'二つの風見栞の小箱',requires:'archivePair'},
  {id:'safe-storage',chapter:4,area:'ch4_storage',x:4,y:4,title:'光の保全庫',hint:'冷却して、光を保全回路へ保持しよう',ready:()=>TempleChapter4.getState().lightHeld},
  {id:'chart-cache',chapter:4,area:'ch4_chart',x:20,y:12,title:'星見台の小箱'},
  ...['village','forest','port','island'].map((key,index)=>({id:'gate-'+key,chapter:5,area:'ch5_'+key,x:20,y:12,title:['村','森','港','島'][index]+'から届いたかけら',hint:'この地域の星門を接続しよう',ready:()=>TempleChapter5.getState().gates.includes(key)}))
 ];
 const switches=[
  {id:'forestWind',area:'forest',x:21,y:10,name:'風の祠の風車'},
  {id:'waterBridge',area:'ch2_water',x:19,y:7,name:'対岸の跳ね橋レバー'},
  {id:'harborCrane',area:'ch3_shore',x:20,y:10,name:'港の荷揚げ風車'},
  {id:'archiveNear',area:'ch4_archive',x:20,y:9,name:'手前の風見栞'},
  {id:'archiveFar',area:'ch4_archive',x:20,y:6,name:'奥の風見栞'}
 ];
 const allowedPieces=new Set(pieces.map(p=>p.id)),allowedFlags=new Set(['forestWind','waterBridge','harborCrane','archivePair']);
 let state={hearts:[],boomerang:false,level:0,flags:[]},flight=null,clock=0,pickupPending=new Set();
 const usable=()=>s101CanInteract()&&!playMenuOpen&&!landscapeBlocked&&!document.hidden&&innerWidth>=innerHeight;
 const hasFlag=id=>state.flags.includes(id);
 const ready=p=>(!p.requires||hasFlag(p.requires))&&(!p.ready||p.ready());
 const nearby=(x,y)=>s103Facing(x,y)||(player.x===x&&player.y===y);
 const own=p=>state.hearts.includes(p.id);
 function healthLimit(data){const ids=Array.isArray(data?.adventure?.hearts)?[...new Set(data.adventure.hearts.filter(id=>allowedPieces.has(id)))]:[];return 3+Math.floor(ids.length/4)}
 function maxHealth(){return 3+Math.floor(state.hearts.length/4)}
 function notify(){updateHud();$('adventureInventory').textContent='最大HP '+maxHealth()+' ／ ハートのかけら '+(state.hearts.length%4)+'/4（合計'+state.hearts.length+'/20） ／ '+(state.boomerang?'風のブーメラン +'+state.level+'・射程'+(5+state.level)+'マス':'風のブーメラン：未発見');$('adventureThrow').textContent='投げる';$('adventureUpgrade').textContent=state.boomerang?(state.level>=2?'ブーメラン強化済み +2':'ブーメラン強化：星片'+((state.level+1)*4)):'ブーメラン強化（未入手）';$('adventureUpgrade').disabled=!state.boomerang||state.level>=2;}
 function acquire(){if(state.boomerang)return;say([['古い旅日記','風の祠へ。投げた道具が帰ってくるように、旅人も帰れる道を残すこと。'],['あおびー','月みたいな形の投げ輪だ。握るところに、風の印がある！'],['案内','風のブーメランを見つけた！ Bキーか「投げる」で投げます。敵の足止め、離れたかけらの回収、風車の操作ができます。'],['あおびー','森の東の風車で試してみよう。祠の小箱も開きそうだ。']],()=>{state.boomerang=true;notify();saveGame(true);toast('風のブーメランを入手！ 森の東・風車へ');});}
 function collectHeart(p){if(own(p)||pickupPending.has(p.id)||!ready(p))return;pickupPending.add(p.id);const before=maxHealth();say([...(p.id==='port-thanks'?[['帰還船の手紙','帰り道の灯りを、ありがとう。船のお守りを旅に役立ててください。']]:p.id==='clock-thanks'?[['時計のそばの手紙','針が進み始めた日に。直してくれた旅人へ、小さなお守りを贈ります。']]:[]),['あおびー',p.title+'に、ハートのかけらがあった！'],['案内',(state.hearts.length+1)%4===0?'かけらが4つそろった！ 最大HPが1つ増えます。':'ハートのかけら '+((state.hearts.length+1)%4)+'/4。4つ集めると最大HPが増えます。']],()=>{state.hearts.push(p.id);pickupPending.delete(p.id);if(maxHealth()>before)player.hp=maxHealth();else player.hp=Math.min(maxHealth(),player.hp+1);notify();saveGame(true);});}
 function setFlag(id){if(hasFlag(id))return;state.flags.push(id);notify();saveGame(true);}
 function activate(sw){
  if(sw.id.startsWith('archive')){if(!flight)return;flight.switches.add(sw.id);if(flight.switches.has('archiveNear')&&flight.switches.has('archiveFar')&&!hasFlag('archivePair')){setFlag('archivePair');say([['古い記録','二つの風見栞を、ひとつの風で結んだ旅人へ。忘れられた小箱を開く。'],['あおびー','一投で二つを回したら、机の下が開いた！']]);}return;}
  if(hasFlag(sw.id))return;setFlag(sw.id);
  const lines={forestWind:[['語り','風車が回り、蔦に隠れた祠の小箱が姿を現した。'],['あおびー','届いた！ 今度は小箱を調べてみよう。']],waterBridge:[['語り','対岸のレバーが回り、東の水路に細い跳ね橋が下りた。'],['あおびー','歩ける道ができた。奥に光る小箱がある！']],harborCrane:[['語り','風車につながった荷揚げ機が動き、海鳥が見守る荷箱を足場へ下ろした。'],['あおびー','船の人が残した、予備の道具箱みたいだ。']]};say(lines[sw.id]);
 }
 function pickupCandidates(x,y){if(!flight)return;const add=(type,id,extra={})=>{const key=type+':'+id;if(!flight.cargo.some(c=>c.key===key))flight.cargo.push({key,type,id,...extra})};for(const p of pieces)if(p.area===area&&p.x===x&&p.y===y&&ready(p)&&!own(p))add('heart',p.id);if(area==='forest')for(const [i,[sx,sy]]of [[4,3],[19,4],[18,13]].entries())if(x===sx&&y===sy&&!taken.has('s'+i))add('star','s'+i,{x,y});const q=questBook.view('S104');if(q.state==='active')for(const p of s104Pieces)if(p.area===area&&p.x===x&&p.y===y&&!q.progress.includes(p.id))add('map',p.id);}
 function deliver(cargo){for(const item of cargo){if(item.type==='heart'){const p=pieces.find(p=>p.id===item.id);collectHeart(p)}if(item.type==='star'&&!taken.has(item.id))TempleCombat.finishAt(item.x,item.y,()=>checkStars());if(item.type==='map'&&!questBook.view('S104').progress.includes(item.id)){questBook.record('S104',item.id);toast('ブーメランで地図片を回収した');saveGame(true)}}}
 function throwBoomerang(){if(!usable())return false;if(!state.boomerang){toast('森の南西の小箱から、風のブーメランを探そう');return false}if(flight){flight.returning=true;return false}const [dx,dy]=({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[player.dir];flight={area,x:player.x,y:player.y,fromX:player.x,fromY:player.y,dx,dy,steps:0,returning:false,due:clock+110,at:clock,seen:new Set(),switches:new Set(),cargo:[]};return true;}
 function airPassage(x,y){return area==='ch2_water'&&x===19&&[8,9].includes(y)}
 function tick(){if(!flight)return;if(flight.area!==area){flight=null;return}if(clock<flight.due)return;const f=flight;f.fromX=f.x;f.fromY=f.y;f.at=clock;f.due=clock+110;if(f.returning){const dx=player.x-f.x,dy=player.y-f.y;if(Math.abs(dx)+Math.abs(dy)===0){flight=null;deliver(f.cargo);return}if(Math.abs(dx)>=Math.abs(dy))f.x+=Math.sign(dx);else f.y+=Math.sign(dy);}else{const x=f.x+f.dx,y=f.y+f.dy;if(x<=0||x>=23||y<=0||y>=17||(wall(x,y)&&!airPassage(x,y)&&!switches.some(s=>s.area===area&&s.x===x&&s.y===y))){f.returning=true;return}f.x=x;f.y=y;f.steps++;if(f.steps>=5+state.level)f.returning=true;}
  TempleCombat.rangedHit(f.x,f.y,state.level,f.seen);pickupCandidates(f.x,f.y);for(const sw of switches)if(sw.area===area&&sw.x===f.x&&sw.y===f.y)activate(sw);
 }
 function collision(place,x,y){if(place==='ch2_water'&&x===19&&y===9&&hasFlag('waterBridge'))return false;return null}
 const oldWall=wall;wall=function(x,y){const extra=collision(area,x,y);return extra===null?oldWall(x,y):extra};
 const oldAction=action;action=function(){if(usable()){
  if(area==='forest'&&phase>=2&&nearby(9,13)){if(!state.boomerang)acquire();else say([['古い旅日記','森では風車、森の奥では対岸のレバー、港では荷揚げの風。島の二つの風見栞は、ひとつの投げ輪で結ぶこと。']]);return}
  const p=pieces.find(p=>p.area===area&&nearby(p.x,p.y)&&!own(p));if(p){if(ready(p))collectHeart(p);else say([['小箱の銘文',p.requires==='archivePair'?'二つの風見栞を、一投で回すべし。手前から奥へ、風を通そう。':p.requires==='waterBridge'?'対岸のレバーに風を届け、東の跳ね橋を下ろすべし。':p.requires==='harborCrane'?'荷揚げ風車に風を届け、吊り荷を下ろすべし。':p.requires?'祠の風車に風を届けるべし。':p.hint||'この地域の星門をつなぐと、小箱を開けられそうだ。']]);return}
  const sw=switches.find(s=>s.area===area&&nearby(s.x,s.y));if(sw){say([['案内',sw.name+'。風のブーメランを当てると回せます。'+(sw.id.startsWith('archive')?'手前と奥の二つを、一投で回しましょう。':'')]]);return}
 }oldAction()};
 const oldSnapshot=snapshot;snapshot=function(){return {...oldSnapshot(),adventure:{version:1,hearts:[...state.hearts],boomerang:state.boomerang,level:state.level,flags:[...state.flags]}}};
 const oldRestore=restoreGame;restoreGame=function(data){if(!validSave(data))return false;const d=data.adventure||{};state={hearts:Array.isArray(d.hearts)?[...new Set(d.hearts.filter(id=>allowedPieces.has(id)))]:[],boomerang:d.boomerang===true,level:[0,1,2].includes(d.level)?d.level:0,flags:Array.isArray(d.flags)?[...new Set(d.flags.filter(id=>allowedFlags.has(id)))]:[]};if(!state.boomerang)state.level=0;flight=null;clock=0;pickupPending.clear();const result=oldRestore(data);notify();return result};
 const oldStep=simulationStep;simulationStep=function(t){oldStep(t);if(!usable())return;clock+=1000/60;tick()};
 const oldMove=move;move=function(dx,dy){const from=area;oldMove(dx,dy);if(area!==from)flight=null};
 function upgrade(){if(!state.boomerang||state.level>=2)return false;const cost=(state.level+1)*4;if(!TempleCombat.spendShards(cost)){toast('強化には星片'+cost+'が必要です');return false}state.level++;notify();saveGame(true);toast('ブーメランを強化！ 射程と足止めが伸びた');return true;}
 const oldJournal=openQuestJournal;openQuestJournal=function(){oldJournal();if(!questJournalOpen)return;$('questJournalList').textContent='【旅の発見】\n最大HP '+maxHealth()+' / 8　ハートのかけら '+state.hearts.length+'/20\n'+[1,2,3,4,5].map(ch=>'第'+ch+'章：'+pieces.filter(p=>p.chapter===ch&&own(p)).length+'/4').join('\n')+'\n'+(state.boomerang?'✓ 風のブーメラン +'+state.level:'・森の南西、古い旅人の小箱を調べよう')+'\n'+[['forestWind','森の風の祠'],['waterBridge','水路の跳ね橋'],['harborCrane','港の吊り荷'],['archivePair','図書塔の二つの風見栞']].map(([id,title])=>(hasFlag(id)?'✓ ':'・')+title).join('\n')+'\n残りの発見：\n'+pieces.filter(p=>!own(p)).map(p=>'第'+p.chapter+'章 '+(templePlaces[p.area]||p.area)+'：'+p.title+(p.hint?'（'+p.hint+'）':'')).join('\n')+'\n\n'+$('questJournalList').textContent};
 document.body.insertAdjacentHTML('beforeend','<button id="adventureThrow" type="button" hidden aria-label="ブーメランを投げる・呼び戻す">投げる</button><style>#adventureThrow[hidden]{display:none!important}#adventureThrow{position:fixed;z-index:24;right:198px;bottom:78px;min-width:58px;min-height:56px;border:1px solid #d7e7ad;border-radius:16px;background:linear-gradient(#4f8d89,#25545b);color:#ffedb2;font-weight:bold;font-size:14px;touch-action:manipulation}#adventureInventory{color:#ffe6b1;line-height:1.7}#statusVitals{font-size:12px}#hud:has(#objective[hidden]) #statusVitals{font-size:14px}</style>');
 $('equipmentPanel').querySelector('section').insertAdjacentHTML('beforeend','<h3>旅の発見</h3><p id="adventureInventory"></p><p>かけら4つで最大HPが1増えます。ブーメランは風車・敵・離れたアイテムへ。もう一度押すと呼び戻せます。</p><button id="adventureUpgrade" type="button">ブーメラン強化（未入手）</button>');$('equipmentPanel').querySelector('section').appendChild($('equipmentClose'));
 $('adventureThrow').onclick=throwBoomerang;$('adventureUpgrade').onclick=upgrade;
 document.addEventListener('keydown',event=>{if(event.key.toLowerCase()!=='b'||!usable())return;event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)throwBoomerang()},{capture:true});
 const oldFinish=TemplePresentation.finish;TemplePresentation.finish=function(){oldFinish();$('adventureThrow').hidden=!usable()||!state.boomerang};
 function heartArt(g,x,y){g.save();g.translate(x,y);g.fillStyle='#ffb6c6';g.strokeStyle='#fff1d4';g.lineWidth=2;g.beginPath();g.moveTo(0,12);g.bezierCurveTo(-27,-3,-18,-22,0,-10);g.bezierCurveTo(18,-22,27,-3,0,12);g.fill();g.stroke();g.strokeStyle='#c8537a';g.beginPath();g.moveTo(0,-9);g.lineTo(0,11);g.moveTo(-13,-1);g.lineTo(13,-1);g.stroke();g.restore()}
 const oldDraw=draw;draw=function(){oldDraw();if($('start').style.display!=='none')return;const g=ctx;g.save();g.setTransform(1,0,0,1,-templeCameraX(),-Math.max(0,Math.min(180,templePose().y*40-250)));
  if(area==='forest'&&phase>=2){TemplePresentation.prop(g,state.boomerang?9:8,380,556,65,58);TemplePresentation.label(g,state.boomerang?'旅人の小箱・発見済み':'古い旅人の小箱',380,484,{targetY:540});}
  for(const p of pieces)if(p.area===area&&!own(p)&&!flight?.cargo.some(c=>c.type==='heart'&&c.id===p.id)){const x=p.x*40+20,y=p.y*40+20;if(!ready(p)){TemplePresentation.prop(g,8,x,y+20,50,46);TemplePresentation.label(g,p.requires?'封じられた小箱':'お礼の小箱',x,y-30,{targetY:y});}else{g.fillStyle='#ff91be22';g.beginPath();g.arc(x,y,28,0,7);g.fill();heartArt(g,x,y);TemplePresentation.label(g,'ハートのかけら',x,y-30,{targetY:y});}}
  for(const sw of switches)if(sw.area===area){const done=hasFlag(sw.id)||hasFlag('archivePair')&&sw.id.startsWith('archive')||flight?.switches.has(sw.id),x=sw.x*40+20,y=sw.y*40+20;g.strokeStyle='#bda17c';g.lineWidth=5;g.beginPath();g.moveTo(x,y+26);g.lineTo(x,y-10);g.stroke();g.save();g.translate(x,y-9);g.rotate(done?clock/350:Math.PI/4);for(let n=0;n<4;n++){g.rotate(Math.PI/2);g.fillStyle=done?'#dcebaa':'#8ac9cb';g.beginPath();g.moveTo(0,0);g.lineTo(8,-27);g.lineTo(19,-15);g.closePath();g.fill()}g.restore();TemplePresentation.label(g,sw.name+(done?'・作動済み':''),x,y-50,{targetY:y});}
  if(area==='ch3_shore'){const x=820;g.strokeStyle='#b59c72';g.lineWidth=6;g.beginPath();g.moveTo(x+35,175);g.lineTo(x+35,90);g.lineTo(x-15,90);g.stroke();g.strokeStyle='#d8cdab';g.lineWidth=2;g.beginPath();g.moveTo(x,90);g.lineTo(x,hasFlag('harborCrane')?200:165);g.stroke();g.strokeStyle='#f5f5dc';g.lineWidth=3;for(const [bx,by]of [[770,135],[845,120]]){g.beginPath();g.moveTo(bx-12,by);g.quadraticCurveTo(bx-5,by-10,bx,by);g.quadraticCurveTo(bx+5,by-10,bx+12,by);g.stroke();}}
  if(area==='ch2_water'&&hasFlag('waterBridge')){g.fillStyle='#c7a779';g.fillRect(19*40,9*40,40,40);g.strokeStyle='#6e5a45';g.lineWidth=2;for(let n=0;n<5;n++){g.beginPath();g.moveTo(19*40,9*40+n*8);g.lineTo(20*40,9*40+n*8);g.stroke()}}
  if(flight&&flight.area===area){const t=Math.min(1,(clock-flight.at)/110),x=(flight.fromX+(flight.x-flight.fromX)*t)*40+20,y=(flight.fromY+(flight.y-flight.fromY)*t)*40+20;g.save();g.translate(x,y);g.rotate(clock/80);g.lineWidth=11;g.lineCap='round';g.strokeStyle='#f4d58e';g.beginPath();g.moveTo(-22,9);g.lineTo(0,-10);g.lineTo(22,9);g.stroke();g.strokeStyle='#77d6d0';g.lineWidth=4;g.beginPath();g.moveTo(-18,7);g.lineTo(0,-8);g.lineTo(18,7);g.stroke();g.restore();}g.restore();TemplePresentation.finish();};
 notify();
 return {maxHealth,healthLimit,collision,throwBoomerang,upgrade,pieces:()=>pieces.map(({ready,...p})=>({...p})),switches:()=>switches.map(s=>({...s})),getState:()=>({...state,hearts:[...state.hearts],flags:[...state.flags],flight:flight?{x:flight.x,y:flight.y,returning:flight.returning,cargo:flight.cargo.map(c=>({...c}))}:null})};
})();
