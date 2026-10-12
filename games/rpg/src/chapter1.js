(function(root){
 'use strict';
 const stages=['bird','trail','leafy','battle','cleared','deer','soothe','spring','stones','shrineTrail'];
 stages.push(...(typeof AobeeFinale!=='undefined'?AobeeFinale.stages:[]));const later=stages.slice(5),order=['seed-stone','sprout-stone','flower-stone'];
 function objective(s){if(typeof AobeeFinale!=='undefined'&&AobeeFinale.objective(s))return AobeeFinale.objective(s);return {bird:'小さな羽音を探そう',trail:'揺れる葉を調べ、歌の聞こえる方へ',leafy:'歌の主に声をかけよう',battle:'奥の道で、リーフィとまよいモコに向き合おう',cleared:'戦いのあと、リーフィとひと息つこう',deer:'木陰のくぼ地で、鹿の様子を見よう',soothe:s.events.deerBed?'リーフィに、鹿への子守歌を頼もう':'柔らかい葉を集め、鹿の足もとに敷こう',spring:'記憶の泉を探そう',stones:'泉の言葉をたどり、三つの石碑を灯そう',shrineTrail:'泉の岸辺で、旅の記録を残そう'}[s.events.chapter1Stage]||'第1章 · 消えた星の森へ';}
 function goals(s){if(typeof AobeeFinale!=='undefined'&&AobeeFinale.goals(s))return AobeeFinale.goals(s);const p=s.events.chapter1Stage,id={bird:'lost-bird',trail:'leaf-trace',leafy:'leafy',battle:'moco-trail',cleared:'leafy',deer:'restless-deer',soothe:s.events.deerBed?'leafy':'soft-leaves',spring:'memory-pool',stones:order[s.events.stoneStep||0],shrineTrail:'spring-rest'}[p];return [{name:objective(s),hint:p==='shrineTrail'?'岸辺で休んで、祠へ続く道を確かめよう。':p==='soothe'?'まず鹿が安心できる場所を整えよう。':p==='stones'?'「種は眠り、芽は空へ、花は誰かを待つ」。道案内は次の石碑へのヒントです。':'道案内のあと「話す・調べる」で、ゆっくり確かめよう。',map:['deer','soothe'].includes(p)?'deer-hollow':['spring','stones','shrineTrail'].includes(p)?'memory-spring':'memory-woods',id}];}
 function resolve(s,m){if(typeof AobeeFinale!=='undefined')m=AobeeFinale.resolve(s,m);if(!['memory-woods','deer-hollow','memory-spring'].includes(m.id))return m;const p=s.events.chapter1Stage;return {...m,npcs:m.npcs.filter(n=>n.id!=='leafy'||m.id!=='memory-woods'||['leafy','battle','cleared',...later].includes(p)),objects:m.objects};}
 function enter(a){if(!a.state.events.chapter1Stage)a.state.events.chapter1Stage='bird';a.events.transition(a,{to:'memory-woods',tx:3,ty:13});if(!a.state.events.forestArrival&&!a.state.events.chapter1Complete)a.scenes.play('forest');}
 function interact(a,t){if(t.id==='spring-rest'&&a.state.events.leafyJoined&&(a.state.events.chapter1Stage!=='shrineTrail'||a.state.events.springRestSeen)){a.dialogue.start([['リーフィ','水の音を聞きながら、少し休もう。ここなら、モコたちも近づいてこないよ。']],()=>{AobeeEncounters.recover(a.state);a.ui.toast('HP・MPが全回復。泉では何度でも休めます。');});return true;}if(typeof AobeeFinale!=='undefined'&&AobeeFinale.interact(a,t))return true;const s=a.state,e=s.events,id=t.id,p=e.chapter1Stage,say=(lines,f)=>a.dialogue.start(lines,f),one=(n,text,f)=>say([[n,text]],f);
  if(id==='forest'&&AobeeStory.stage(s)==='complete'){enter(a);return true;}
  if(id==='chapter-entry'){if(AobeeStory.stage(s)==='complete')enter(a);else one('あおびー','村長に話を聞いてから、森の奥へ進もう。');return true;}
  if(!['memory-woods','deer-hollow','memory-spring'].includes(s.mapId))return false;
  if(t.type==='chest'){if(s.chests.includes(id))one('あおびー','箱はもう空っぽだ。');else{s.chests.push(id);s.inventory.herb=(s.inventory.herb||0)+2;a.audio.effect('chest');one('あおびー','木陰の箱に、ほし草が2つ。傷の手当てに使えそうだ。');}return true;}
  const travel=(to,x,y)=>a.events.transition(a,{to,tx:x,ty:y});
  if(id==='return-village'){travel('hoshi-village',24,19);return true;}
  if(id==='back-woods'){travel('memory-woods',18,7);return true;}
  if(id==='back-hollow'){travel('deer-hollow',17,9);return true;}
  if(id==='spring-gate'){if(['spring','stones','shrineTrail'].includes(p)||e.leafyJoined&&later.includes(p))travel('memory-spring',3,12);else one('リーフィ','この子が落ち着くまで、ここにいてあげたい。');return true;}
  if(id==='lost-bird'){if(p==='bird')a.scenes.play('bird');else one('あおびー','あわてなくて大丈夫。君の帰り道も、一緒に探そう。');return true;}
  if(id==='leaf-trace'){if(p==='bird')one('あおびー','羽がひとつ。近くで、かすかな羽音がする。');else if(p==='trail')a.scenes.play('songTrail');else one('あおびー','葉の先に、うすい音の輪が残っている。');return true;}
  if(id==='leafy'){
   if(p==='leafy')a.scenes.play('leafyMeet');else if(p==='cleared')a.scenes.play('forestRest');else if(p==='soothe'&&e.deerBed)a.scenes.play('deerSong');
   else if(p==='soothe')one('リーフィ','葉を集めて、石の上に敷いてあげよう。足が痛いのかもしれない。');
   else if(later.includes(p))say([['リーフィ','ひとりで歩いていたときは、静かな森が怖かった。'],['あおびー','今は、二人ぶんの足音がするね。'],['リーフィ','うん。……泉で、誰かがわたしを呼んでいた気がする。']]);
   else one('リーフィ','道の奥のモコたち、震えているでしょう。あの子たちを追い払いたいんじゃない。少し、眠らせてあげたいの。');return true;
  }
  if(id==='moco-trail'){if(p==='battle'){if(e.mocoApproachSeen)a.battle.start();else a.scenes.play('mocoApproach');}else if(p==='cleared')one('あおびー','モコたちは木陰で眠っている。まずリーフィと、少し休もう。');else if(later.includes(p))travel('deer-hollow',3,9);else one('あおびー','道の奥で、丸い影が震えている。歌の主に、話を聞いてみよう。');return true;}
  if(id==='restless-deer'){if(p==='deer')a.scenes.play('deer');else one('リーフィ',p==='soothe'?'怖がって、石の上から動けなくなっている。柔らかい葉を敷いてあげよう。':'耳が、ゆっくり動いている。もう、わたしたちの足音を怖がっていないね。');return true;}
  if(id==='soft-leaves'){if(p==='soothe'&&!e.deerBed)say([['あおびー','この葉、ふかふかだ。ルミナが小鳥の巣に入れていたのと同じ。'],['リーフィ','そのまま、少しずつ。わたしも隣にいるから。']],()=>a.scenes.play('leafBed'));else one('あおびー',e.deerBed?'鹿の足もとに、柔らかな葉が敷かれている。':'朝露を含んだ葉。踏むと、しっとり沈む。');return true;}
  if(id==='memory-pool'){if(p==='spring')a.scenes.play('springEcho');else one('リーフィ','「種は眠り、芽は空へ、花は誰かを待つ」。泉の声を、忘れないように。');return true;}
  if(order.includes(id)){if(!['stones','shrineTrail'].includes(p)){one('あおびー','古い絵が刻まれている。泉の水面を、先に見てみよう。');return true;}if(p==='shrineTrail'){one('あおびー','石の奥に、小さな灯りが残っている。');return true;}const index=order.indexOf(id),step=e.stoneStep||0;if(index!==step){e.stoneStep=0;one('あおびー','光が、そっと消えた。壊れたわけじゃない。「種」からもう一度、順番を確かめよう。',()=>a.ui.hud());}else{e.stoneStep=step+1;a.audio.effect('chest');if(e.stoneStep===3)a.scenes.play('stonePath');else one('あおびー',step===0?'眠る種に、小さな光がともった。次は、空へ伸びる芽。':'芽の光が、種の光につながった。最後は、誰かを待つ花。',()=>a.ui.hud());}return true;}
  if(id==='spring-rest'){if(p==='shrineTrail')a.scenes.play('springRest');else one('あおびー','苔のやわらかい岸辺。ここなら、少し休めそう。');return true;}
  if(id==='shrine-gate'){one('リーフィ',p==='shrineTrail'?'石碑の光は、祠の方へ続いている。岸辺で休んでから、祠へ続く道を確かめよう。':'奥の霧が、道を隠している。三つの石碑と、関係があるのかな。');return true;}
  if(id==='hollow-trace'){one('あおびー','土に、細いひづめの跡。同じところを何度も回っている。帰り道が見つからなかったんだ。');return true;}
  if(id==='old-ribbon'){say([['あおびー','枝に、色あせたリボンが結んである。'],['リーフィ','……誰かと、この下で雨宿りした。手は温かかった。名前だけが、出てこない。'],['あおびー','名前がなくても、その人はここにいたんだね。']],()=>{e.ribbonMemory=true;});return true;}
  return false;
 }
 const api={stages,order,later,objective,goals,resolve,enter,interact};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AobeeChapter1=api;
})(globalThis);

