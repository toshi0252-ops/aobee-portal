const assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./temple-chapter1-flow.cjs'),{complete}=require('./temple-chapter2-tower.cjs');
function resume(g){g.run('saveGame(true)');const key=g.run('SAVE_KEY');const h=boot({key,value:g.storage.get(key)});h.run('restoreGame(readSave())');assert.equal(h.run('area'),g.run('area'));assert.deepEqual(JSON.parse(h.run('JSON.stringify(TempleChapter3.getState())')),JSON.parse(g.run('JSON.stringify(TempleChapter3.getState())')));return h;}
const locked=boot();locked.run('TempleChapter3.start()');assert.equal(locked.run('area'),'village');
function play(help){let g=complete(help?'trust':'ask',help?'gentle':'rapid'),{run,walk,act,flush}=g;
 // An old Chapter 2 save has no Chapter 3 progress and offers the new chapter.
 assert.equal(run('TempleChapter3.getState().started'),false);assert.equal(g.el('chapter3Start').hidden,false);
 run("playMenuOpen=true;$('chapter3Start').onclick()");flush();run('playMenuOpen=false');assert.equal(run('area'),'ch3_port');
 assert.equal(run('wall(6,2)'),true);assert.equal(run('wall(18,2)'),true);
 walk(2,9);assert.equal(run('area'),'ch3_shore');walk(5,14);run("player.dir='up'");act();
 // Wrong lamp order resets without HP loss. Tide can be changed without waiting.
 const hp=run('player.hp');walk(9,12);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().beacons'),0);assert.equal(run('player.hp'),hp);
 walk(18,13);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().lowTide'),true);
 if(help){walk(9,7);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().toolsFound'),true);}
 for(const x of [5,9,13]){walk(x,12);run("player.dir='up'");act();}
 assert.equal(run('TempleChapter3.getState().beacons'),3);assert.equal(run('TempleChapter3.getState().boatRescued'),false);
 walk(12,15);walk(12,15);assert.equal(run('area'),'village');g=resume(g);({run,walk,act,flush}=g);assert.match(g.el('objective').textContent,/船を助け/);run('TempleChapter3.start()');flush();walk(2,9);
 g=resume(g);({run,walk,act,flush}=g);walk(18,13);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().boatRescued'),true);assert.equal(run('wall(9,7)'),true);
 run('draw()');fs.writeFileSync('/tmp/temple-ch3-shore.png',g.canvas.toBuffer('image/png'));
 walk(12,15);assert.equal(run('area'),'ch3_port');
 if(help){walk(17,11);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().toolsReturned'),true);act();assert.equal(run('TempleChapter3.getState().toolsReturned'),true);}
 walk(6,2);assert.equal(run('area'),'ch3_observatory');assert.equal(run('wall(13,8)'),true);
 for(const x of [6,17]){walk(x,12);run("player.dir='up'");act();}assert.equal(run('wall(13,8)'),false);
 walk(12,5);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().authRead'),true);
 if(help){walk(5,5);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().photoRead'),true);}
 g=resume(g);({run,walk,act,flush}=g);walk(12,15);assert.equal(run('area'),'ch3_port');walk(12,3);walk(18,2);assert.equal(run('area'),'ch3_lighthouse');
 // Transfer cannot be isolated before navigation has an independent supply.
 walk(17,12);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().transferPrepared'),false);assert.equal(run('TempleChapter3.getState().lampSeparated'),false);
 walk(6,12);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().lampSeparated'),true);
 walk(17,12);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().transferPrepared'),true);g=resume(g);({run,walk,act,flush}=g);
 walk(12,2);assert.equal(run('area'),'ch3_beacon');
 // Walk back once: both the route and lamp supply must remain stable.
 walk(12,15);assert.equal(run('area'),'ch3_lighthouse');walk(12,2);assert.equal(run('area'),'ch3_beacon');
 function until(c){for(let n=0;n<500;n++){if(run('TempleChapter3.getBattleState().cycle')===c)return;run('simulationStep(1000)');}throw Error('cycle missing '+c);}
 walk(6,12);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().valves[0]'),false);
 run('player.hp=1');until('warning');for(let n=0;n<100&&run('player.hp')===1;n++)run('simulationStep(1000)');assert.equal(run('player.hp'),3);assert.equal(run('player.y'),14);assert.equal(run('TempleChapter3.getState().lampSeparated'),true);
 // West and east valves may be fixed in either order, and survive a checkpoint.
 for(const x of help?[6,17]:[17,6]){
  const w=run('TempleChapter3.getBattleState().wave');walk(w===0?20:3,13);until('open');walk(x,12);run("player.dir='up'");act();
  assert.equal(run('TempleChapter3.getState().valves['+(x===6?0:1)+']'),true);
  g=resume(g);({run,walk,act,flush}=g);
 }
 walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().stopped'),false);
 walk(20,13);until('open');walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().stopped'),true);assert.equal(run('TempleChapter3.getState().lampSeparated'),true);
 walk(12,15);walk(12,15);assert.equal(run('area'),'ch3_port');walk(10,8);run("player.dir='up'");act();assert.equal(run('TempleChapter3.getState().reported'),true);assert.equal(run('chapterClearOpen'),true);assert.equal(g.el('chapter3Clear').hidden,false);
 const xy=run('player.x+","+player.y');run('move(1,0);simulationStep(10000)');assert.equal(run('player.x+","+player.y'),xy);
 run("$('chapter3Explore').onclick()");g=resume(g);({run,walk,act,flush}=g);assert.match(g.el('objective').textContent,/第3章クリア/);
 run("$('questJournal').onclick()");assert.match(g.el('questJournalList').textContent,/✓ 第3章クリア/);run("closeQuestJournal();$('chapter3Record').onclick()");assert.equal(g.el('chapter3Clear').hidden,false);run("$('chapter3Explore').onclick()");
 walk(12,15);assert.equal(run('area'),'village');g=resume(g);({run,walk,act,flush}=g);assert.match(g.el('objective').textContent,/第3章クリア/);run('TempleChapter3.start()');flush();assert.equal(run('area'),'ch3_port');assert.equal(run('TempleChapter2.getState().reported'),true);assert.equal(run('chapter1Story.reportSeen'),true);return g;
}
if(require.main===module){play(true);play(false);}else module.exports={play};
console.log('PASS chapter 3 full story: prior-chapter lock, menu departure, wrong lamps, manual tides, low-tide optional tools, high-tide ship rescue, drainage/records, independent navigation supply, transfer interlock, guardian retry and both valve orders, checkpoints, ending/record/journal/free return, earlier chapters preserved');
