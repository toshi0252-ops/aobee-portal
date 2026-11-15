const assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./temple-chapter1-flow.cjs'),{route}=require('./temple-chapter2-flow.cjs');
function resume(g){g.run('saveGame(true)');const key=g.run('SAVE_KEY');const h=boot({key,value:g.storage.get(key)});h.run('restoreGame(readSave())');assert.deepEqual(JSON.parse(h.run('JSON.stringify(TempleChapter2.getState())')),JSON.parse(g.run('JSON.stringify(TempleChapter2.getState())')));assert.equal(h.run('area'),g.run('area'));return h;}
function complete(trust,recovery){let g=route(['water','cave','canopy'],true),{run,walk,act,flush}=g;
 // A legacy opening save at the old door must not be stranded north of the new gap.
 const d=run('snapshot()');d.player={...d.player,x:12,y:6};const legacy=boot({key:run('SAVE_KEY'),value:JSON.stringify(d)});legacy.run('restoreGame(readSave())');assert.equal(legacy.run('player.y'),14);
 walk(trust==='trust'?8:16,11);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().trust'),trust);
 walk(17,10);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().rescued'),true);
 walk(12,6);run("player.dir='up'");act();assert.equal(run('area'),'ch2_tower1');
 for(let f=1;f<=3;f++){
  walk(12,10);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().floors.length'),f-1);
  const panels=f===1?[[6,12,1]]:f===2?[[6,12,1],[17,12,3]]:[[6,12,3]];
  for(const [x,y,n]of panels){walk(x,y);run("player.dir='up'");for(let i=0;i<n;i++)act();}
  walk(12,10);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().floors.length'),f);
  g=resume(g);({run,walk,act,flush}=g);run('draw()');walk(12,2);assert.equal(run('area'),'ch2_tower'+(f+1));walk(12,15);assert.equal(run('area'),'ch2_tower'+f);walk(12,2);assert.equal(run('area'),'ch2_tower'+(f+1));
 }
 function ticksUntil(cycle){for(let n=0;n<400;n++){if(run('TempleChapter2.getBattleState().cycle')===cycle)return;run('simulationStep(1000)');}throw Error('cycle not reached '+cycle);}
 // Damage and retry reset the encounter, preserve the solved tower, and do not repeat scenes.
 walk(12,6);run('player.hp=1');ticksUntil('warning');for(let n=0;n<100&&run('player.hp')===1;n++)run('simulationStep(1000)');assert.equal(run('TempleChapter2.getState().bossStage'),1);assert.equal(run('player.hp'),3);assert.equal(run('player.y'),14);assert.equal(run('TempleChapter2.getState().floors.length'),3);
 // Phase 1: attack while closed is rejected, then wait outside the telegraph.
 walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().bossStage'),1);
 walk(3,12);ticksUntil('open');walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().bossStage'),2);
 // Phase 2: vulnerability alone does not bypass the shielding switch.
 walk(3,12);ticksUntil('open');walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().bossStage'),2);
 walk(6,12);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().redirected'),true);
 // Restore in mid-encounter retains stage and switch while restarting the safe clock.
 g=resume(g);({run,walk,act,flush}=g);assert.equal(run('TempleChapter2.getState().bossStage'),2);walk(3,12);ticksUntil('open');walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().bossStage'),3);
 walk(3,14);ticksUntil('open');walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().stopped'),false);
 walk(7,11);act();assert.equal(run('TempleChapter2.getState().held'),true);
 walk(3,14);while(run('TempleChapter2.getBattleState().cycle')==='open')run('simulationStep(1000)');ticksUntil('open');walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().stopped'),true);
 run('draw()');fs.writeFileSync('/tmp/temple-ch2-tower-stopped.png',g.canvas.toBuffer('image/png'));
 walk(recovery==='rapid'?8:16,11);run("player.dir='up'");act();assert.equal(run('area'),'village');assert.equal(run('TempleChapter2.getState().recovery'),recovery);
 walk(10,7);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().reported'),true);assert.equal(run('chapterClearOpen'),true);assert.equal(g.el('chapter2Clear').hidden,false);
 const xy=run('player.x+","+player.y');run('move(1,0)');assert.equal(run('player.x+","+player.y'),xy);
 run("$('chapter2Explore').onclick()");assert.equal(run('chapterClearOpen'),false);g=resume(g);({run,walk,act,flush}=g);assert.match(g.el('objective').textContent,/第2章クリア/);assert.equal(run('chapter1Story.reportSeen'),true);
 run("$('chapter2Record').onclick()");assert.equal(g.el('chapter2Clear').hidden,false);run("$('chapter2Explore').onclick();TempleChapter2.start()");flush();assert.equal(run('area'),'ch2_hub');
}
complete('trust','rapid');complete('ask','gentle');
console.log('PASS chapter 2 complete: both trust/recovery branches, legacy gate save, rescue, 4 floors, wrong/correct beams, checkpoint per floor, boss shielding/cooperation, defeat/retry, mid-boss reload, village ending, clear modal/record/free exploration');
