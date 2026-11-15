const assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./temple-chapter1-flow.cjs'),{finish}=require('./temple-chapter4-flow.cjs');
function resume(g){g.run('saveGame(true)');const key=g.run('SAVE_KEY');const h=boot({key,value:g.storage.get(key)});h.run('restoreGame(readSave())');assert.equal(h.run('area'),g.run('area'));assert.deepEqual(JSON.parse(h.run('JSON.stringify(TempleChapter5.getState())')),JSON.parse(g.run('JSON.stringify(TempleChapter5.getState())')));return h;}
const locked=boot();locked.run('TempleChapter5.start()');assert.equal(locked.run('area'),'village');
function final(help,gateOrder){let g=finish(help,help?'share':'owners'),{run,walk,act,flush}=g;
 assert.equal(run('TempleChapter5.getState().started'),false);assert.equal(g.el('chapter5Start').hidden,false);
 if(!help){assert.equal(run('TempleChapter2.getState().leafHelped'),false);assert.equal(run('TempleChapter3.getState().toolsReturned'),false);assert.equal(run('TempleChapter4.getState().clockFixed'),false);assert.equal(run("questDefinitions.filter(d=>questBook.view(d.id).state==='claimed').length"),0);}
 run("playMenuOpen=true;$('chapter5Start').onclick()");flush();run('playMenuOpen=false');assert.equal(run('area'),'ch5_court');assert.equal(run('wall(12,2)'),true);assert.equal(run('wall(6,2)'),true);
 walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter5.getState().truth'),true);
 for(const k of gateOrder){
  walk(12,4);walk(...({village:[2,9],forest:[6,2],port:[18,2],island:[21,9]}[k]));assert.equal(run('area'),'ch5_'+k);
  walk(12,8);run("player.dir='up'");act();assert.equal(run("TempleChapter5.getState().gates.includes('"+k+"')"),false);
  if(k==='village'){
   walk(6,12);run("player.dir='up'");act();act();walk(17,12);run("player.dir='up'");act();
  }else if(k==='forest'){
   walk(17,12);run("player.dir='up'");act();walk(12,8);run("player.dir='up'");act();assert.equal(run("TempleChapter5.getState().gates.includes('forest')"),false);walk(6,12);run("player.dir='up'");act();
  }else if(k==='port'){
   walk(6,12);run("player.dir='up'");act();walk(12,8);run("player.dir='up'");act();assert.equal(run("TempleChapter5.getState().gates.includes('port')"),false);assert.equal(run('TempleChapter3.getState().lampSeparated'),true);walk(6,12);run("player.dir='up'");act();
  }else{
   walk(6,12);run("player.dir='up'");act();walk(12,8);run("player.dir='up'");act();assert.equal(run("TempleChapter5.getState().gates.includes('island')"),false);walk(17,12);run("player.dir='up'");act();
  }
  walk(12,8);run("player.dir='up'");act();assert.equal(run("TempleChapter5.getState().gates.includes('"+k+"')"),true);const n=run('TempleChapter5.getState().gates.length');act();assert.equal(run('TempleChapter5.getState().gates.length'),n);g=resume(g);({run,walk,act,flush}=g);walk(12,15);assert.equal(run('area'),'ch5_court');
 }
 assert.equal(run('wall(12,2)'),false);walk(12,4);walk(12,2);assert.equal(run('area'),'ch5_core');walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter5.getState().battleStarted'),true);
 function until(c){for(let n=0;n<500;n++){if(run('TempleChapter5.getBattleState().cycle')===c)return;run('simulationStep(1000)');}throw Error('cycle missing '+c);}
 // Menu/journal time does not advance the final encounter.
 run('playMenuOpen=true');for(let i=0;i<200;i++)run('simulationStep(1000)');assert.equal(run('TempleChapter5.getBattleState().cycle'),'waiting');run('playMenuOpen=false');
 // Failure resets only the encounter; regional connections and truth stay intact.
 walk(6,7);run('player.hp=1');until('warning');for(let i=0;i<100&&run('player.hp')===1;i++)run('simulationStep(1000)');assert.equal(run('player.hp'),3);assert.equal(run('player.y'),14);assert.equal(run('TempleChapter5.getState().gates.length'),4);
 walk(6,7);run("player.dir='up'");act();assert.equal(run('TempleChapter5.getState().relays[0]'),false);
 for(const [x,y]of help?[[6,6],[17,6],[6,11],[17,11]]:[[17,11],[6,11],[17,6],[6,6]]){
  walk(12,14);until('open');walk(x,y+1);run("player.dir='up'");act();g=resume(g);({run,walk,act,flush}=g);
 }
 assert.equal(run('TempleChapter5.getState().stage'),2);
 // Wrong-facing attacks do not damage the circuit. Spear and sword both reach it.
 if(!help)run("templeWeapon='spear'");
 for(let i=0;i<3;i++){
  walk(3,14);until('open');walk(12,help?6:7);run("player.dir='down'");act();assert.equal(run('TempleChapter5.getState().hits'),i);run("player.dir='up'");act();assert.equal(run('TempleChapter5.getState().hits'),i+1);g=resume(g);({run,walk,act,flush}=g);
 }
 assert.equal(run('TempleChapter5.getState().stage'),3);
 walk(3,14);until('open');walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter5.getState().networkBalanced'),false);
 walk(7,11);act();assert.equal(run('TempleChapter5.getState().warubeeHeld'),true);walk(17,12);run("player.dir='up'");act();assert.equal(run('TempleChapter5.getState().mioReady'),true);g=resume(g);({run,walk,act,flush}=g);
 walk(3,14);until('open');walk(12,6);run("player.dir='up'");act();assert.equal(run('TempleChapter5.getState().networkBalanced'),true);assert.equal(run('TempleChapter5.getState().completed'),false);
 walk(12,15);assert.equal(run('area'),'ch5_court');walk(12,15);assert.equal(run('area'),'ch5_festival');walk(10,8);run("player.dir='up'");act();assert.equal(run('TempleChapter5.getState().completed'),true);assert.equal(run('chapterClearOpen'),true);assert.equal(g.el('journeyClear').hidden,false);
 assert.match(g.el('journeySummary').textContent,help?/3\/3/:/0\/3/);const xy=run('player.x+","+player.y');run('move(1,0);action();simulationStep(10000)');assert.equal(run('player.x+","+player.y'),xy);
 run("$('journeyExplore').onclick()");g=resume(g);({run,walk,act,flush}=g);assert.match(g.el('objective').textContent,/全5章/);run('draw()');fs.writeFileSync('/tmp/temple-final-festival.png',g.canvas.toBuffer('image/png'));
 run("$('questJournal').onclick()");assert.match(g.el('questJournalList').textContent,/✓ 全5章の本編クリア/);run("closeQuestJournal();$('journeyRecord').onclick()");assert.equal(g.el('journeyClear').hidden,false);run("$('journeyTitle').onclick()");assert.equal(run('chapterClearOpen'),false);
 // New browser runtime from the final save, with no replay of the ending required.
 g=resume(g);({run,walk,act,flush}=g);assert.equal(run('TempleChapter5.getState().completed'),true);walk(12,15);assert.equal(run('area'),'village');g=resume(g);({run,walk,act,flush}=g);assert.match(g.el('objective').textContent,/全5章/);
 for(const obj of ['TempleChapter2','TempleChapter3','TempleChapter4'])assert.equal(run(obj+'.getState().reported'),true);assert.equal(run('chapter1Story.reportSeen'),true);
 for(const [start,expected]of [['TempleChapter2','ch2_hub'],['TempleChapter3','ch3_port'],['TempleChapter4','ch4_settlement'],['TempleChapter5','ch5_court']]){run(start+'.start()');flush();assert.equal(run('area'),expected);}
 run("$('journeyRecord').onclick();localStorage.setItem=()=>{throw Error('storage full')};$('journeyTitle').onclick()");assert.equal(g.el('journeyClear').hidden,false);assert.match(g.el('journeySaveStatus').textContent,/保存できません/);
}
final(true,['village','forest','port','island']);final(false,['island','port','forest','village']);
console.log('PASS all five chapters from Chapter 1: optional support present/zero, two gate orders, all locks, interlocks, prior saves, final boss all phases, sword/spear ranges, defeat retry, cooperation, load distribution, festival ending, clear record/save failure, postgame regional revisits');
