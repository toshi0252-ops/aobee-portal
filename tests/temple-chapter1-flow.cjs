// Runs the complete shipped scripts with a DOM adapter and real canvas renderer.
// This checks game flow, not browser layout or physical touch events.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,Image}=require('@napi-rs/canvas');
const html=fs.readFileSync('games/aobee_star_temple_portal.html','utf8');
function boot(saved){
 const canvas=createCanvas(960,540),els=new Map(),storage=new Map(saved?[[saved.key,saved.value]]:[]);let now=10000;
 function el(id){if(els.has(id))return els.get(id);const e={id,style:{display:id==='start'?'flex':id==='dialog'?'none':'',setProperty(){}},hidden:false,textContent:'',innerHTML:'',dataset:{},offsetWidth:112,classList:{toggle(){},add(){},remove(){}},getContext:()=>canvas.getContext('2d'),getBoundingClientRect:()=>({left:0,right:960,top:0,width:960,height:540}),addEventListener(){},setAttribute(){},getAttribute(){return null},setPointerCapture(){},hasPointerCapture(){return false},releasePointerCapture(){},focus(){doc.activeElement=e},click(){e.onclick?.()},append(){},appendChild(){},insertAdjacentHTML(){},querySelector(){return el(id+' child')},querySelectorAll(){return []}};els.set(id,e);return e;}
 const listeners={};
 const doc={hidden:false,getElementById:el,querySelector:s=>el(s.startsWith('#')?s.slice(1):s),querySelectorAll:()=>[],createElement:t=>el('new-'+els.size),addEventListener(type,fn){(listeners[type]??=[]).push(fn)},activeElement:null};doc.body=el('body');doc.documentElement=el('html');
 const window={addEventListener(){},visualViewport:null};
 const ctx=vm.createContext({document:doc,window,Image,console,innerWidth:960,innerHeight:540,performance:{now:()=>now},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},MutationObserver:class{observe(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},confirm:()=>true,location:{reload(){}},getComputedStyle:()=>({position:'fixed'}),Date:{now:()=>now}});
 ctx.globalThis=ctx;
 for(const [,attrs,s]of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){const src=attrs.match(/src="([^"]+)"/);const file=src?.[1].split('?')[0];const script=['../assets/temple-visuals.js','../assets/temple-presentation.js','../assets/temple-journey.js','../assets/temple-recovery.js','../assets/temple-combat.js'].includes(file)?fs.readFileSync(file.slice(3),'utf8'):s;vm.runInContext(script,ctx)}
 const run=s=>{const result=vm.runInContext(s,ctx);if(module.exports.observe)module.exports.observe(code=>vm.runInContext(code,ctx));return result};
 function flush(){let n=0;while(run("$('dialog').style.display==='block'")){if(++n>100)throw Error('dialogue loop');run('nextLine()')}now+=1000;}
 function act(){now+=1000;run('action()');flush()}
 function walk(tx,ty){
  let count=0;
  while(run('player.x')!==tx||run('player.y')!==ty){
   if(++count>100)throw Error('path loop to '+tx+','+ty);
   const state=run('({area,x:player.x,y:player.y})');
   const path=run(`(()=>{const target=[${tx},${ty}],q=[[player.x,player.y,[]]],seen=new Set([player.x+','+player.y]);while(q.length){const [x,y,p]=q.shift();if(x===target[0]&&y===target[1])return p;for(const [dx,dy]of [[0,-1],[-1,0],[1,0],[0,1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(seen.has(k)||wall(nx,ny)||(area==='forest'&&enemy.some(e=>e.x===nx&&e.y===ny)))continue;seen.add(k);q.push([nx,ny,[...p,[dx,dy]]]);}}return null})()`);
   assert(path?.length,'No path: '+JSON.stringify(state)+' -> '+tx+','+ty);
   const [dx,dy]=path[0];now+=200;run(`move(${dx},${dy})`);flush();
   if(run('area')!==state.area)return;
  }
 }
 return {run,flush,act,walk,canvas,storage,advance:n=>now+=n,el,key(type,event){doc['on'+type]?.(event);for(const fn of listeners[type]||[])fn(event)}};
}
function checkpoint(g,label){
 g.run('saveGame(true)');const key=g.run('SAVE_KEY'),value=g.storage.get(key);assert(value,label+' checkpoint saved');
 const restored=boot({key,value});restored.run('restoreGame(readSave())');
 for(const name of ['area','phase','mioRescued','ruinKey','ruinBossHP','annexSolved','chapterFinished'])assert.equal(restored.run(name),g.run(name),label+': '+name);
 assert.equal(restored.run('validSave(snapshot())'),true,label+' valid restored save');
}
function completeChapter1(){
const g=boot(),{run,walk,act,flush}=g;
run("$('begin').onclick()");flush();
walk(10,7);run("player.dir='up'");act();assert.equal(run('phase'),1);
walk(5,6);run("player.dir='up'");act();walk(14,6);run("player.dir='up'");act();walk(10,7);run("player.dir='up'");act();assert.equal(run('phase'),2);checkpoint(g,'festival');
walk(12,15);assert.equal(run('area'),'forest');
for(const p of [[7,12],[3,8],[16,11],[5,3]])walk(...p);
assert.equal(run('mioRescued'),true);checkpoint(g,'Mio');
for(const p of [[4,3],[19,4],[18,13]])walk(...p);
assert.equal(run('stars'),3);
walk(11,6);run("player.dir='up'");act();assert.equal(run('gateOpen'),true);
walk(20,2);assert.equal(run('area'),'ruins');
walk(5,10);walk(18,10);walk(3,12);assert.equal(run('area'),'annex');
walk(12,9);run("player.dir='up'");act();
for(const p of [[6,6],[17,6],[12,11]])walk(...p);
assert.equal(run('annexSolved'),true);walk(12,15);assert.equal(run('area'),'ruins');walk(12,9);assert.equal(run('ruinKey'),true);checkpoint(g,'key');
walk(12,4);run("player.dir='up'");for(let i=0;i<5;i++)act();assert.equal(run('ruinBossHP'),0);checkpoint(g,'guardian');
walk(12,2);assert.equal(run('area'),'seal');assert.equal(run('chapter1Story.mode'),'cooperate');
walk(8,11);act();assert.equal(run('chapter1Story.mode'),'battle');
// Save mid battle, restore in a fresh runtime, verify boss state and objective.
run('saveGame(true)');const saved={key:run('SAVE_KEY'),value:g.storage.get(run('SAVE_KEY'))};const resumed=boot(saved);resumed.run('restoreGame(readSave())');assert.equal(resumed.run('chapter1Story.mode'),'battle');assert.match(resumed.el('objective').textContent,/予兆/);
// Exercise defeat/retry using the actual warning/damage transitions.
run("player.hp=1;player.x=12;player.y=4;sealCycle='warning';sealNextAt=1");run('simulationStep(1000)');flush();assert.equal(run('chapter1Story.mode'),'cooperate');assert.equal(run('player.hp'),3);
walk(8,11);act();
// Each stage: wait through real telegraph off the danger tiles, then attack in range.
while(run('chapter1Story.mode')==='battle'){
 walk(5,11);
 let n=0;while(run('sealCycle')!=='open'){if(++n>200)throw Error('no vulnerability window');run('simulationStep(2000)')}
 walk(12,5);run("player.dir='up'");act();
}
assert.equal(run('chapter1Story.mode'),'won');assert.equal(run('chapter1Story.bossHP'),0);checkpoint(g,'shadow');
walk(12,16);assert.equal(run('area'),'forest');assert.equal(run('player.y'),4);
// First step after returning must stay outside the automatic portal trigger.
run('move(0,1)');flush();assert.equal(run('area'),'forest');
walk(12,16);assert.equal(run('area'),'village');walk(10,7);run("player.dir='up'");act();
assert.equal(run('chapterFinished'),true);assert.equal(run('chapter1Story.reportSeen'),true);assert.equal(run('chapterClearOpen'),true);assert.equal(run('phase'),5);
const xy=run('player.x+","+player.y');run('move(1,0);action();simulationStep(100000)');assert.equal(run('player.x+","+player.y'),xy);
run("$('chapterExplore').onclick()");assert.equal(run('chapterClearOpen'),false);run('draw()');
fs.writeFileSync('/tmp/temple-ch1-village.png',g.canvas.toBuffer('image/png'));
run('saveGame(true)');const clearSave={key:run('SAVE_KEY'),value:g.storage.get(run('SAVE_KEY'))};const loaded=boot(clearSave);loaded.run('restoreGame(readSave())');assert.equal(loaded.run('chapterFinished'),true);assert.equal(loaded.run('chapter1Story.mode'),'reported');assert.equal(loaded.run('end'),false);assert.match(loaded.el('objective').textContent,/第1章クリア/);
console.log('PASS full chapter: village -> clues/Mio -> shards/gate -> mural/key -> guardian -> cooperation -> loss/retry -> all boss stages -> forest exit -> report/clear -> free exploration -> save/reload');
// Returning to title preserves the completed save and cannot begin on stale state.
run('showChapterClear()');run("$('chapterTitle').onclick()");assert.equal(run('chapterClearOpen'),false);assert.equal(JSON.parse(g.storage.get(run('SAVE_KEY'))).chapter1Story.mode,'reported');
// Failure to save is visible and does not silently leave the completion dialog.
run("localStorage.setItem=()=>{throw Error('storage full')};showChapterClear()");assert.match(g.el('chapterClearSaveStatus').textContent,/保存できません/);run("$('chapterTitle').onclick()");assert.equal(run('chapterClearOpen'),true);
console.log('PASS clear screen: title save, storage-failure message, keep progress on screen');

// Journal and chapter-record actions remain usable after loading a clear save.
loaded.run("$('questJournal').onclick()");assert.match(loaded.el('questJournalList').textContent,/【第1章の冒険】/);assert.match(loaded.el('questJournalList').textContent,/✓ 村へ帰り/);loaded.run('closeQuestJournal()');
assert.equal(loaded.el('chapterRecord').hidden,false);loaded.run("$('chapterRecord').onclick()");assert.equal(loaded.run('chapterClearOpen'),true);loaded.run("$('chapterExplore').onclick()");assert.equal(loaded.run('chapterClearOpen'),false);
run("area='annex';player.x=12;player.y=9;annexSolved=false;runeOrder=1;draw()");fs.writeFileSync('/tmp/temple-ch1-mural.png',g.canvas.toBuffer('image/png'));
console.log('PASS checkpoints: festival, Mio, key, guardian, shadow; cleared journal and chapter-record reopening');

return loaded;
}

if(require.main===module)completeChapter1();else module.exports={boot,checkpoint,completeChapter1};
