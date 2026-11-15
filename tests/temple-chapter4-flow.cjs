const assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./temple-chapter1-flow.cjs'),{play}=require('./temple-chapter3-flow.cjs');
function resume(g){g.run('saveGame(true)');const key=g.run('SAVE_KEY');const h=boot({key,value:g.storage.get(key)});h.run('restoreGame(readSave())');assert.equal(h.run('area'),g.run('area'));assert.deepEqual(JSON.parse(h.run('JSON.stringify(TempleChapter4.getState())')),JSON.parse(g.run('JSON.stringify(TempleChapter4.getState())')));return h;}
const locked=boot();locked.run('TempleChapter4.start()');assert.equal(locked.run('area'),'village');
function finish(help,choice){let g=play(help),{run,walk,act,flush}=g;
 assert.equal(run('TempleChapter4.getState().started'),false);assert.equal(g.el('chapter4Start').hidden,false);
 run("playMenuOpen=true;$('chapter4Start').onclick()");flush();run('playMenuOpen=false');assert.equal(run('area'),'ch4_landing');assert.equal(run('wall(12,2)'),true);
 if(help){walk(17,7);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().cogFound'),true);}
 walk(6,10);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().survey'),true);g=resume(g);({run,walk,act,flush}=g);
 walk(12,2);assert.equal(run('area'),'ch4_settlement');assert.equal(run('wall(6,2)'),true);assert.equal(run('wall(18,2)'),true);
 walk(10,8);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().archiveOpen'),true);
 if(help){walk(6,11);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().clockFixed'),true);}
 walk(17,11);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().nameConfirmed'),false);
 walk(6,2);assert.equal(run('area'),'ch4_archive');walk(18,12);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().sequence'),0);
 for(const x of [5,12,19]){walk(x,6);run("player.dir='up'");act();}assert.equal(run('TempleChapter4.getState().read.length'),3);
 const hp=run('player.hp');walk(6,12);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().sequence'),0);assert.equal(run('player.hp'),hp);
 for(const x of [18,6]){walk(x,12);run("player.dir='up'");act();}assert.equal(run('TempleChapter4.getState().sequence'),2);g=resume(g);({run,walk,act,flush}=g);
 walk(12,12);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().sorted'),true);act();assert.equal(run('TempleChapter4.getState().sequence'),3);
 walk(12,15);assert.equal(run('area'),'ch4_settlement');
 if(help){walk(17,11);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().nameConfirmed'),true);}
 walk(12,3);walk(18,2);assert.equal(run('area'),'ch4_storage');
 walk(12,10);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().lightHeld'),false);
 walk(17,12);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().lightHeld'),false);
 walk(6,12);run("player.dir='up'");act();walk(12,10);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().lightHeld'),true);g=resume(g);({run,walk,act,flush}=g);
 walk(12,2);assert.equal(run('area'),'ch4_scribe');
 function until(c){for(let n=0;n<500;n++){if(run('TempleChapter4.getBattleState().cycle')===c)return;run('simulationStep(1000)');}throw Error('cycle missing '+c);}
 // The hazard can defeat the player but does not erase the collected history or release the light.
 walk(6,7);run('player.hp=1');until('warning');for(let n=0;n<100&&run('player.hp')===1;n++)run('simulationStep(1000)');assert.equal(run('player.hp'),3);assert.equal(run('player.y'),14);assert.equal(run('TempleChapter4.getState().read.length'),3);assert.equal(run('TempleChapter4.getState().lightHeld'),true);
 walk(18,7);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().protected'),0);
 walk(17,12);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().read.length'),3);assert.equal(run('TempleChapter4.getState().backup'),false);walk(6,12);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().backup'),true);
 walk(12,12);until('open');walk(6,7);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().protected'),0);assert.equal(run('TempleChapter4.getState().backup'),true);
 for(const [i,x]of [18,6,12].entries()){
  walk(12,12);until('open');walk(x,7);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().protected'),i+1);g=resume(g);({run,walk,act,flush}=g);
 }
 assert.equal(run('TempleChapter4.getState().scribeStopped'),true);run('draw()');fs.writeFileSync('/tmp/temple-ch4-scribe.png',g.canvas.toBuffer('image/png'));
 walk(12,15);assert.equal(run('area'),'ch4_storage');walk(12,15);assert.equal(run('area'),'ch4_settlement');
 if(!help){walk(8,12);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().disclosure'),'');walk(17,11);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().nameConfirmed'),true);}
 walk(10,8);run("player.dir='up'");act();walk(choice==='share'?8:16,12);run("player.dir='up'");act();assert.equal(run('area'),'ch4_chart');assert.equal(run('TempleChapter4.getState().disclosure'),choice);
 g=resume(g);({run,walk,act,flush}=g);walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter4.getState().reported'),true);assert.equal(run('chapterClearOpen'),true);assert.equal(g.el('chapter4Clear').hidden,false);
 const xy=run('player.x+","+player.y');run('move(1,0);simulationStep(10000)');assert.equal(run('player.x+","+player.y'),xy);run("$('chapter4Explore').onclick()");
 g=resume(g);({run,walk,act,flush}=g);assert.match(g.el('objective').textContent,/第4章クリア/);run("$('questJournal').onclick()");assert.match(g.el('questJournalList').textContent,/✓ 神殿への星図/);run("closeQuestJournal();$('chapter4Record').onclick()");assert.equal(g.el('chapter4Clear').hidden,false);run("$('chapter4Explore').onclick()");
 walk(12,15);walk(12,15);walk(12,15);assert.equal(run('area'),'ch3_port');g=resume(g);({run,walk,act,flush}=g);assert.match(g.el('objective').textContent,/第4章クリア/);run('TempleChapter4.start()');flush();assert.equal(run('area'),'ch4_settlement');assert.equal(run('TempleChapter3.getState().reported'),true);assert.equal(run('TempleChapter2.getState().reported'),true);assert.equal(run('chapter1Story.reportSeen'),true);
 return g;
}
if(require.main===module){finish(true,'share');finish(false,'owners');}else module.exports={finish};
console.log('PASS chapter 4: chapter lock, island survey, archive access, read and chronology, partial checkpoint, optional clock, name confirmation, safe light retention, deletion refusal, guardian defeat/retry and ordered evidence protection, both disclosure choices, ending, clear record/journal, island/port return, prior chapters preserved');
