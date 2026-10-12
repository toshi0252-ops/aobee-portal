(function(root){
 'use strict';
 const app={state:AobeeSave.createState(),mode:'title',data:AobeeData,maps:AobeeMaps,renderer:AobeeRenderer,input:AobeeInput,audio:AobeeAudio,events:AobeeEvents};
 const visual={x:13,y:12,moving:false,target:null};let step=null,route=[],pending=null,last=performance.now(),accumulator=0;
 app.map=()=>AobeeStory.resolve(app.state,app.maps.maps);
 app.syncVisual=()=>{visual.x=app.state.position.x;visual.y=app.state.position.y;visual.moving=false;step=null;};
 app.cancelPath=()=>{route=[];pending=null;visual.target=null;};
 app.freeze=()=>{app.input.reset();app.cancelPath();app.syncVisual();};
 app.near=()=>{const map=app.map(),p=app.state.position,[dx,dy]=app.maps.directions[p.direction];const facing=app.maps.at(map,p.x+dx,p.y+dy);if(facing)return facing;const under=app.maps.at(map,p.x,p.y);if(under?.type==='gate'||under?.passable)return under;return[...map.npcs,...map.objects.filter(o=>o.id&&o.type!=='house')].find(o=>app.maps.distance(p,o)===1)||null;};
 app.interact=()=>{if(app.mode==='cinematic')return app.scenes.advance();if(app.mode==='opening')return app.ui.finishOpening();if(app.mode==='dialogue')return app.dialogue.next();if(app.mode!=='field')return;app.freeze();app.events.interact(app,app.near());};
 app.back=()=>{if(app.mode==='battle')return app.battle.back();if(app.mode==='opening')return app.toTitle();if(app.ui.isOpen())return app.ui.back();if(app.mode==='dialogue')return app.dialogue.next();if(app.mode==='field'||app.mode==='cinematic')app.ui.menu();};
 app.tap=point=>{const map=app.map(),p=app.state.position,target=app.maps.at(map,point.x,point.y);app.cancelPath();app.input.reset();
  if(target){
   if(target.type==='house'){const door=map.doors.find(d=>d.x>=target.x&&d.x<target.x+target.w&&d.y===target.y+target.h);if(door){const found=app.maps.path(map,p,door);if(found){route=found;visual.target=door;}else app.ui.toast('玄関までの道が見つかりません。');}return;}
   if(app.maps.distance(p,target)===1)return app.events.interact(app,target);const found=app.maps.approach(map,p,target);if(found){route=found;pending=target;visual.target=route.at(-1)||null;if(!route.length){pending=null;app.events.interact(app,target);}}else app.ui.toast('そこへは今の場所から歩いて行けません。');}
  else{const found=app.maps.path(map,p,point);if(found){route=found;visual.target=point;}else app.ui.toast('道や草地をタップしてね。');}
 };
 app.guide=goal=>{const m=app.map();if(m.id==='post-record-room'&&goal.map!==m.id){app.tap(m.objects.find(o=>o.id==='ex-record-back'));return;}if(goal.map==='post-record-room'&&m.id==='hoshi-village'){app.tap(m.objects.find(o=>o.id==='ex-record-gate'));return;}if(goal.map==='post-record-room'&&m.id!==goal.map)goal={map:'hoshi-village',id:'ex-record-gate'};if(m.id!==goal.map){const next=AobeeChapter2.nextGate(app.state,m,goal.map);if(next){app.tap(next);return;}}const forestRoute={'memory-woods':{'deer-hollow':'moco-trail','memory-spring':'moco-trail'},'deer-hollow':{'memory-woods':'back-woods','memory-spring':'spring-gate'},'memory-spring':{'memory-woods':'back-hollow','deer-hollow':'back-hollow','star-shrine':'shrine-gate'},'star-shrine':{'memory-spring':'back-spring','memory-woods':'back-spring','deer-hollow':'back-spring'}};if(forestRoute[m.id]?.[goal.map]){app.tap(m.objects.find(o=>o.id===forestRoute[m.id][goal.map]));return;}if(goal.map===m.id){const t=[...m.objects,...m.npcs].find(o=>o.id===goal.id);if(t)app.tap(t);return;}if(m.id!=='hoshi-village'){if(m.id==='star-shrine'){app.tap(m.objects.find(o=>o.id==='back-spring'));return;}if(m.id==='memory-spring'){app.tap(m.objects.find(o=>o.id==='back-hollow'));return;}if(m.id==='deer-hollow'){app.tap(m.objects.find(o=>o.id==='back-woods'));return;}const door=m.doors[0];if(door)app.tap(door);else app.tap(m.objects.find(o=>o.id==='return-village'));return;}app.tap(m.objects.find(o=>o.id===(goal.map==='lumina-home'?'lumina-house':goal.map==='elder-home'?'elder-house':goal.map==='sunset-hill'?'hill-gate':'forest')));};
 app.start=()=>{app.battle.reset();app.scenes.reset();app.state=AobeeSave.createState();app.state.mapId='lumina-home';app.state.position={x:4,y:4,direction:'right'};app.state.settings=app.ui.preferences();app.state.characters.aobee.equipment={ribbon:'gearRibbon'};app.mode='opening';app.cancelPath();app.syncVisual();app.ui.applySettings();app.ui.hud();app.audio.mood('morning');app.audio.play();document.getElementById('opening-begin').focus();};
 app.restore=state=>{app.validateWorld(state);app.battle.reset();app.scenes.reset();app.dialogue.reset();app.state=state;AobeeChapter3Finale.restore(state);app.mode='field';app.cancelPath();app.syncVisual();app.ui.applySettings();app.ui.hud();app.audio.play();app.audio.mood(AobeeStory.worldMood(app.state));if(app.battle.resume())return;if(app.scenes.resume())return;if(!app.state.events.luminaIntro)app.events.intro(app);};
 app.validateWorld=state=>{const map=app.maps.maps[state.mapId]&&AobeeStory.resolve(state,app.maps.maps);if(!map||!app.maps.walkable(map,state.position.x,state.position.y))throw new Error('保存された場所が現在のマップにありません。元データは保持されています。');for(const id of state.party)if(!app.data.characters[id])throw new Error('未対応の仲間が含まれています。');};
 app.toTitle=()=>{app.battle.reset();app.scenes.reset();app.freeze();app.mode='title';app.audio.stop();app.ui.hud();};
 function move(direction,time){const map=app.map(),p=app.state.position,[dx,dy]=app.maps.directions[direction];p.direction=direction;
  if(!app.maps.walkable(map,p.x+dx,p.y+dy))return false;
  const old={x:p.x,y:p.y};p.x+=dx;p.y+=dy;step={from:old,to:{x:p.x,y:p.y},start:time,duration:170};visual.moving=true;return true;
 }
 function update(time){if(app.mode!=='field')return;
  if(step){const q=Math.min(1,(time-step.start)/step.duration);visual.x=step.from.x+(step.to.x-step.from.x)*q;visual.y=step.from.y+(step.to.y-step.from.y)*q;if(q<1)return;step=null;visual.moving=false;
   const door=app.map().doors.find(d=>d.x===app.state.position.x&&d.y===app.state.position.y);if(door){app.events.transition(app,door);return;}
   const encounter=AobeeEncounters.step(app.state,app.map());if(encounter){app.battle.start(encounter);return;}
  }
  const dir=app.input.direction();if(dir){app.cancelPath();move(dir,time);}
  else if(route.length){const next=route.shift(),p=app.state.position;const direction=next.x>p.x?'right':next.x<p.x?'left':next.y>p.y?'down':'up';if(!move(direction,time))app.cancelPath();}
  else if(pending){const target=pending;pending=null;visual.target=null;if(app.maps.distance(app.state.position,target)===1)app.events.interact(app,target);}
  else visual.target=null;
  const near=app.near();document.getElementById('interaction-hint').textContent=near?(near.name||near.label||({chest:'木陰の箱',book:'日記',shelf:'書棚',sign:'案内板',fountain:'星の噴水'}[near.type])||'調べる'):'近くで調べる';
 }
 function frame(time){const delta=Math.min(time-last,100);last=time;accumulator+=delta;if(accumulator>=16){const frameDelta=accumulator;accumulator=0;if(!document.hidden){app.scenes.update(frameDelta);update(time);AobeeChapter3Finale.update(app,frameDelta);const title=app.mode==='title';if(!(app.state.battle&&['battle','panel'].includes(app.mode)))app.renderer.render(title?app.maps.maps['hoshi-village']:app.map(),app.state,title?{x:13,y:12,moving:false,target:null}:visual,time,title,app.scenes.presentation());}}requestAnimationFrame(frame);}
 app.ui=AobeeUI(app);app.dialogue=app.ui.dialogue;app.scenes=AobeeScenes.create(app);app.battle=AobeeBattleUI(app);app.renderer.setup(document.getElementById('world'));app.input.attach(app);app.state.position={x:13,y:12,direction:'down'};app.syncVisual();app.ui.applySettings();app.ui.hud();
 window.addEventListener('resize',()=>app.renderer.resize());app.renderer.ready.then(()=>{app.renderer.portrait(document.getElementById('title-aobee'));}).catch(e=>app.ui.toast(e.message));requestAnimationFrame(frame);
 root.AobeeGame=app;
})(globalThis);
