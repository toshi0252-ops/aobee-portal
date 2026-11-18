const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=require('./temple-chapter1-flow.cjs'),originalBoot=base.boot,write=fs.writeFileSync,log=console.log,instances=[];
fs.writeFileSync=(p,...args)=>write(typeof p==='string'&&p.startsWith('/tmp/')?path.join(require('os').tmpdir(),p.slice(5)):p,...args);
base.boot=(saved)=>{const g=originalBoot(saved);instances.push(g);return g};console.log=()=>{};
require('./temple-chapter5-flow.cjs');
console.log=log;base.boot=originalBoot;
const last=instances.at(-1),done=JSON.parse(last.run('JSON.stringify(snapshot())'));assert.equal(done.chapter5.completed,true);
const key=last.run('SAVE_KEY');
function load(data){const g=originalBoot({key,value:JSON.stringify(data)});assert.notEqual(g.run('restoreGame(readSave())'),false);return g}
for(const place of last.run("Object.keys(templePlaces).filter(p=>!p.startsWith('side_'))")){
 const data=structuredClone(done);data.area=place;data.player={...data.player,x:12,y:14};data.objective='未クリア時の古い案内：スイッチで合図しよう';
 const g=load(data),goal=g.el('objective').textContent;
 assert.match(goal,/クリア|済み|安定|復旧/,place+': completed guidance');assert.doesNotMatch(goal,/合図しよう|攻撃しよう|止めよう|星の鍵を取ろう|石板を踏もう/,place+': no obsolete task');
 const chapter=/^ch([2-4])_/.exec(place);if(chapter)assert.match(goal,new RegExp('第'+chapter[1]+'章クリア'),place+': another chapter must not overwrite this region');
 const before=g.run('JSON.stringify(snapshot())');g.run('draw()');assert.equal(g.run('JSON.stringify(snapshot())'),before,place+': rendering does not change progress');
}
// First chapter's operator leaves the switch after the encounter, and the old NPC collision is removed.
for(const [mode,expected]of [['cooperate',1],['battle',1],['won',0],['reported',0]]){
 const data=structuredClone(done);data.area='seal';data.chapter1Story={mode,bossHP:expected?9:0,reportSeen:mode==='reported'};data.chapterFinished=mode==='reported';
 const g=load(data);g.run('globalThis.operatorDraws=0;TemplePresentation.companion=()=>operatorDraws++;draw()');assert.equal(g.run('operatorDraws'),expected,mode);assert.equal(g.run('wall(16,11)'),!!expected,mode+': operator collision');
}
// Joining is committed only after the explicit introduction/acceptance finishes.
const intro=base.completeChapter1();intro.run('TempleChapter2.start()');assert.equal(intro.run('TempleChapter2.getState().mioJoined'),false);assert(intro.run("dialog.some(line=>line[1].includes('一緒に行って'))"));intro.flush();
assert.equal(intro.run('TempleChapter2.getState().mioJoined'),true);assert.equal(intro.run('TempleChapter2.getState().warubeeJoined'),false);assert.equal(intro.run('TempleJourney.party().length'),1);
intro.run("area='ch2_canopy';player.x=7;player.y=11;action()");assert.equal(intro.run('TempleChapter2.getState().canopy'),false);intro.flush();assert.equal(intro.run('TempleChapter2.getState().canopy'),true);assert.equal(intro.run('TempleJourney.party().some(p=>p.who===\"warubee\")'),false);
intro.act();assert.equal(intro.run('TempleChapter2.getState().canopy'),true,'completed bridge cannot be reset');
intro.run("area='ch2_tower_gate';player.x=8;player.y=11;player.dir='up'");intro.act();intro.run("player.x=17;player.y=10;player.dir='up';action()");assert.equal(intro.run('TempleChapter2.getState().warubeeJoined'),false);assert.equal(intro.run('TempleChapter2.getState().rescued'),false);
assert(intro.run("dialog.some(line=>line[1].includes('一緒に行っていい'))"));intro.flush();assert.equal(intro.run('TempleChapter2.getState().warubeeJoined'),true);assert.equal(intro.run('TempleChapter2.getState().rescued'),true);assert.equal(intro.run('TempleJourney.party().length'),2);
const joined=JSON.parse(intro.run('JSON.stringify(snapshot())'));assert.equal(load(joined).run('TempleChapter2.getState().warubeeJoined'),true);
// Already connected gates cannot be reconfigured while other gates remain to be solved.
const gates=structuredClone(done);gates.area='ch5_forest';gates.chapter5.completed=false;gates.chapter5.networkBalanced=false;gates.player={...gates.player,x:17,y:12,dir:'up'};
const locked=load(gates),before=locked.run('JSON.stringify(TempleChapter5.getState())');locked.act();assert.equal(locked.run('JSON.stringify(TempleChapter5.getState())'),before);assert.match(locked.el('objective').textContent,/接続済み/);
console.log('PASS all 33 cleared/reloaded regions, own-chapter guidance, no obsolete instructions, released first-chapter operator/collision, explicit Mio/Warubee introductions, join timing/save, fixed bridge and connected gates');
fs.writeFileSync=write;module.exports={done,key};
