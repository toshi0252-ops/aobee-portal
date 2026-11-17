/* Story continuation, revisitable regions and visible travelling companions. */
var TempleJourney=(()=>{
 const names=['','ほしの村・星かげの森','深緑の森・根の中継塔','星を映さぬ港','記録の島','星の神殿'];
 const chapters=()=>[null,null,TempleChapter2,TempleChapter3,TempleChapter4,TempleChapter5];
 let pending=false,mapOpen=false,trail=[],trailArea='',lastMove=0,from=[];
 function completed(){if(TempleChapter5.getState().completed)return 5;for(let n=4;n>=2;n--)if(chapters()[n].getState().reported)return n;return chapter1Story.reportSeen?1:0}
 function region(){const m=area.match(/^ch([2-5])_/);return m?Number(m[1]):1}
 function sideQuests(){refreshQuests();return questDefinitions.filter(q=>questBook.view(q.id).state!=='claimed').length}
 function closeClear(){for(const id of ['chapterClear','chapter2Clear','chapter3Clear','chapter4Clear'])$(id).hidden=true;chapterClearOpen=false;clearStick();syncEdgeControls()}
 function continueStory(){
  const done=completed(),next=done+1;
  if(done<1||done>=5||chapters()[next].getState().started||$('start').style.display!=='none'||mapOpen||$('dialog').style.display==='block')return;
  if(!saveGame(true)){toast('保存できませんでした。探索に戻り、セーブを再試行してください');return}
  closeClear();playMenuOpen=false;$('act').focus();chapters()[next].start();
 }
 function schedule(){if(pending)return;pending=true;setTimeout(()=>{pending=false;continueStory()},0)}
 const oldSay=say;say=function(lines,fn,still=null){
  const before=completed();return oldSay(lines,()=>{if(fn)fn();if(completed()>before)schedule()},still);
 };
 // A cleared legacy save continues after the normal Continue button has restored it.
 const oldContinue=$('continue').onclick;if(oldContinue)$('continue').onclick=function(...args){const r=oldContinue.apply(this,args);schedule();return r};

 function openMap(){
  if(!s101CanInteract()||$('start').style.display!=='none')return;
  clearStick();templeAttack=null;mapOpen=true;chapterClearOpen=true;
  $('journeyMapSummary').textContent='本編は会話の続きで次の地域へ進みます。以前の地域へ戻っても、物語と依頼の進行は残ります。';
  const unlocked=Math.min(5,completed()+1),current=region(),remaining=sideQuests();
  const errands=['','村と森の未解決の依頼：'+remaining+'件',TempleChapter2.getState().leafHelped?'苗木への水やり：完了':'苗木への水やり：あとから続けられます',TempleChapter3.getState().toolsReturned?'工具箱の返却：完了':'工具箱の返却：あとから続けられます',TempleChapter4.getState().clockFixed?'島の時計の修理：完了':'島の時計の修理：あとから続けられます',''];
  for(let n=1;n<=5;n++){
   const b=$('journeyRegion'+n);b.hidden=n>unlocked;
   b.textContent=names[n]+(n===current?'　〈現在地〉':'')+'\n'+(n===5?'最終章':'第'+n+'章')+'・'+(n<=completed()?'本編クリア済み':'本編の目的地')+(errands[n]?'\n'+errands[n]:'');
  }
  $('journeyMap').hidden=false;syncEdgeControls();$('journeyMapClose').focus();
 }
 function closeMap(){mapOpen=false;$('journeyMap').hidden=true;chapterClearOpen=false;clearStick();syncEdgeControls();$('act').focus()}
 function visit(n){
  if(n>Math.min(5,completed()+1))return;closeMap();playMenuOpen=false;
  if(n===1){area='village';player.x=12;player.y=13;player.dir='up';templeMove=null;templeAttack=null;objective('村と森を再訪中。残った依頼は続けられます。旅の地図から目的地へ戻れます');saveGame(true)}else chapters()[n].start();
  resetParty();
 }
 document.body.insertAdjacentHTML('beforeend','<button id="travelMapButton" type="button" hidden>旅の地図</button><div id="journeyMap" hidden role="dialog" aria-modal="true" aria-labelledby="journeyMapTitle"><section><h2 id="journeyMapTitle">旅の地図</h2><p id="journeyMapSummary"></p>'+names.slice(1).map((_,i)=>'<button id="journeyRegion'+(i+1)+'" type="button"></button>').join('')+'<button id="journeyMapClose" type="button">探索に戻る</button></section></div>');
 $('travelMapButton').onclick=openMap;$('journeyMapClose').onclick=closeMap;
 for(let n=1;n<=5;n++)$('journeyRegion'+n).onclick=()=>visit(n);
 document.addEventListener('keydown',e=>{if(!mapOpen)return;if(e.key==='Escape'){e.preventDefault();closeMap()}if(e.key==='Tab'){e.preventDefault();const buttons=[1,2,3,4,5].map(n=>$('journeyRegion'+n)).filter(b=>!b.hidden).concat($('journeyMapClose'));const i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus()}});

 // Chapter-one errands remain available after clearing the main story.
 const oldAction=action;action=function(){
  if(mapOpen)return;
  if(s101CanInteract()&&area==='village'&&chapter1Story.reportSeen){
   const forest=TempleChapter2.getState();
   if((facingNpc('elder')&&questBook.view('S104').state!=='claimed'&&!(forest.recovery&&!forest.reported))||(facingNpc('toto')&&questBook.view('S102').state!=='claimed')){finishStoryAction();return}
  }
  if(s101CanInteract()&&area==='ch3_port'&&TempleChapter3.getState().reported&&s103Facing(5,13)){TempleChapter4.start();return}
  if(s101CanInteract()&&area==='ch4_chart'&&TempleChapter4.getState().reported&&s103Facing(12,5)){TempleChapter5.start();return}
  oldAction();
 };
 const oldWall=wall;wall=function(x,y){
  if(chapter1Story.reportSeen&&area==='forest'&&x===12&&y>=2&&y<=5)return false;
  if(TempleChapter2.getState().reported&&area==='village'&&y===9&&x>=20&&x<=22)return false;
  return oldWall(x,y);
 };
 function resetParty(){
  trailArea=area;const head={x:player.x,y:player.y,dir:player.dir},[dx,dy]={up:[0,1],down:[0,-1],left:[1,0],right:[-1,0]}[player.dir];
  const points=[head];let x=head.x,y=head.y;
  for(let i=0;i<2;i++){
   const choices=[[x+dx,y+dy],[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>!wall(a,b)&&!points.some(p=>p.x===a&&p.y===b));
   if(choices.length)[x,y]=choices[0];points.push({x,y,dir:player.dir});
  }
  trail=points.reverse();from=[trail[trail.length-2],trail[trail.length-3]];lastMove=0;
 }
 function party(){
  if(!/^ch[2-5]_/.test(area)||!chapter1Story.reportSeen)return [];
  if(trailArea!==area||!trail.length||Math.abs(trail[trail.length-1].x-player.x)+Math.abs(trail[trail.length-1].y-player.y)>1)resetParty();
  const t=lastMove?Math.min(1,(performance.now()-lastMove)/130):1;
  const result=['mio','warubee'].map((who,i)=>{const to=trail[Math.max(0,trail.length-2-i)],a=from[i]||to;return {who,x:a.x+(to.x-a.x)*t,y:a.y+(to.y-a.y)*t,moving:t<1,bob:t<1?Math.sin(t*Math.PI)*2:0}});
  const state=TempleChapter2.getState();
  if(area==='ch2_canopy'&&!state.canopy)Object.assign(result[1],{x:18,y:11,bob:0});
  if(area==='ch2_tower_gate'&&state.trust&&!state.rescued)Object.assign(result[1],{x:12,y:7,bob:0});
  if(area==='ch5_festival'){Object.assign(result[0],{x:6,y:10,bob:0});Object.assign(result[1],{x:7,y:10,bob:0})}
  return result;
 }
 const oldMove=move;move=function(dx,dy){
  if(mapOpen)return;
  if(trailArea!==area)resetParty();const old={area,x:player.x,y:player.y};const before=party();oldMove(dx,dy);
  if(area==='forest'&&chapter1Story.reportSeen&&player.x===12&&player.y===2){TempleChapter2.start()}
  if(area==='village'&&TempleChapter2.getState().reported&&player.x===22&&player.y===9){TempleChapter3.start()}
  if(area!==old.area){resetParty();return}
  if(player.x!==old.x||player.y!==old.y){from=before.map(p=>({x:p.x,y:p.y}));trail.push({x:player.x,y:player.y,dir:player.dir});trail=trail.slice(-8);lastMove=performance.now()}
 };
 const oldRestore=restoreGame;restoreGame=function(...args){const r=oldRestore(...args);resetParty();return r};
 function drawParty(g,front){
  if($('start').style.display!=='none')return;const hero=templePose();
  g.save();g.setTransform(1,0,0,1,0,-Math.max(0,Math.min(180,hero.y*40-250)));
  for(const actor of party().sort((a,b)=>a.y-b.y))if((actor.y>hero.y)===front){
   const x=actor.x*40+20,y=actor.y*40+34-actor.bob;g.fillStyle='#102b3d66';g.beginPath();g.ellipse(x,y+2,18,5,0,0,7);g.fill();TemplePresentation.follower(g,actor.who,x,y);
  }
  g.restore();
 }
 const oldHero=TemplePresentation.hero;TemplePresentation.hero=function(g,...args){drawParty(g,false);oldHero(g,...args);drawParty(g,true)};
 const oldFinish=TemplePresentation.finish;TemplePresentation.finish=function(){oldFinish();$('travelMapButton').hidden=$('start').style.display!=='none'||$('dialog').style.display==='block'||chapterClearOpen||templeGearOpen||questJournalOpen;};
 const oldDetails=TempleVisuals.details;TempleVisuals.details=function(g,place){
  oldDetails(g,place);
  if(place==='forest'&&chapter1Story.reportSeen)TemplePresentation.label(g,'深緑の森へ ↑',500,92,{always:true});
  if(place==='village'&&TempleChapter2.getState().reported)TemplePresentation.label(g,'港へ →',870,370,{always:true});
  if(place==='ch3_port'&&TempleChapter3.getState().reported){g.fillStyle='#a18b67';g.fillRect(165,515,75,20);TemplePresentation.label(g,'島行きの船を調べる',220,500,{targetY:540})}
  if(place==='ch4_chart'&&TempleChapter4.getState().reported)TemplePresentation.label(g,'星図から神殿へ進む',500,110,{always:true});
 };
 return {continueStory,openMap,closeMap,visit,party,resetParty,completed};
})();
