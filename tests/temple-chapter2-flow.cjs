const assert=require('node:assert/strict'),fs=require('node:fs');
const {boot,completeChapter1}=require('./temple-chapter1-flow.cjs');
function seed(){return completeChapter1();}
function resume(g){g.run('saveGame(true)');const key=g.run('SAVE_KEY');const h=boot({key,value:g.storage.get(key)});h.run('restoreGame(readSave())');assert.equal(h.run('area'),g.run('area'));assert.deepEqual(JSON.parse(h.run('JSON.stringify(TempleChapter2.getState())')),JSON.parse(g.run('JSON.stringify(TempleChapter2.getState())')));return h;}
const locked=boot();locked.run('TempleChapter2.start()');assert.equal(locked.run('area'),'village');
function route(order,stopAtTower=false,help=true){let g=seed();let {run,walk,act,flush}=g;
 // Start from the actual menu state; chapter button must work before bubbling closes it.
 if(order[0]==='water'){
  run('showChapterClear()');assert.equal(g.el('chapterNext').hidden,false);
  run("$('chapterNext').onclick()");assert.equal(run('chapterClearOpen'),false);flush();
 }else{run("playMenuOpen=true;$('chapter2Start').onclick()");flush();run('playMenuOpen=false');}
 assert.equal(run('area'),'ch2_gate');
 // Leaving before opening the barrier must not skip the puzzle on return.
 walk(12,15);assert.equal(run('area'),'village');run('TempleChapter2.start()');flush();assert.equal(run('area'),'ch2_gate');
 walk(12,9);run("player.dir='up'");act();
 walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().windSolved'),false);
 walk(17,10);run("player.dir='up'");act();walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().windSolved'),true);
 walk(12,3);assert.equal(run('area'),'ch2_hub');
 walk(12,3);run('move(0,-1)');flush();assert.equal(run('area'),'ch2_hub');assert.equal(run('player.y'),3);
 for(const id of order){
  walk(...({water:[2,9],canopy:[21,9],cave:[6,2]}[id]));assert.equal(run('area'),'ch2_'+id);
  if(id==='water'){
   assert.equal(run('wall(8,9)'),true);walk(8,12);run("player.dir='up'");act();assert.equal(run('wall(8,9)'),false);if(help){walk(18,13);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().leafHelped'),true);}walk(17,7);run("player.dir='up'");act();
  }else if(id==='canopy'){
   assert.equal(run('wall(12,8)'),true);walk(7,11);act();assert.equal(run('wall(12,8)'),false);walk(17,6);run("player.dir='up'");act();
  }else{
   assert.equal(run('wall(12,6)'),true);walk(5,8);run("player.dir='up'");act();assert.equal(run('TempleChapter2.getState().echo'),false);walk(12,8);run("player.dir='up'");act();assert.equal(run('wall(12,7)'),false);walk(12,4);run("player.dir='up'");act();
  }
  // Repeat reading does not grant duplicate records.
  const count=run('TempleChapter2.getState().records.length');act();assert.equal(run('TempleChapter2.getState().records.length'),count);
  g=resume(g);({run,walk,act,flush}=g);run('draw()');fs.writeFileSync('/tmp/temple-ch2-'+id+'.png',g.canvas.toBuffer('image/png'));
  walk(12,15);assert.equal(run('area'),'ch2_hub');
 }
 assert.equal(run('TempleChapter2.getState().records.length'),3);walk(12,2);assert.equal(run('area'),'ch2_tower_gate');assert.equal(run('TempleChapter2.getState().towerReached'),true);if(stopAtTower)return g;
 run("$('questJournal').onclick()");assert.match(g.el('questJournalList').textContent,/中継塔の入口に到達/);run('closeQuestJournal()');resume(g);
 walk(12,15);walk(12,15);assert.equal(run('area'),'ch2_gate');walk(12,15);assert.equal(run('area'),'village');assert.equal(run('chapter1Story.reportSeen'),true);assert.equal(run('chapterFinished'),true);
}
if(require.main===module){route(['water','canopy','cave']);route(['cave','water','canopy']);}else module.exports={route};
console.log('PASS chapter 2 opening: chapter-1 lock, menu start, early return, wind puzzle, tower lock, all three routes in two orders, bridge/seedling, cooperative platform, echo passage, duplicate prevention, save/reload per route, tower arrival/journal, return to village');
