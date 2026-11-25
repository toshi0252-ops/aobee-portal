const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('games/temple-remaster/remaster.html', 'utf8');
const recovery = fs.readFileSync('games/temple-remaster/original-assets/temple-recovery.js', 'utf8');
const extract = (start, end) => html.slice(html.indexOf(start), html.indexOf(end, html.indexOf(start)));
const state = new Map();
const nodes = new Map();
const $ = id => {
  if (!nodes.has(id)) nodes.set(id, { hidden: true, style: { display: 'none' } });
  return nodes.get(id);
};
let steps = 0, draws = 0, cancellations = 0;
const ctx = vm.createContext({
  $, document: {hidden:false}, innerWidth:1100, innerHeight:650,
  s101CanInteract:()=>true, playMenuOpen:false, chapterClearOpen:false, landscapeBlocked:false,
  savedHealthLimit:()=>3, clearStick(){}, templeAttack:null,
  TempleCombat:{cancelInput(){cancellations++;}},
  simulationStep(){steps++;}, draw(){draws++;}, requestAnimationFrame(){},
  localStorage:{setItem:(k,v)=>state.set(k,v),getItem:k=>state.get(k)??null},
  SAVE_KEY:'auto', pendingDialogues:[], toast(){},
});
vm.runInContext(extract('function freshForestEnemies()', '\nfunction objective'), ctx);
vm.runInContext(extract('function validSave(d)', '\nfunction readSave'), ctx);
vm.runInContext(extract('function saveGame(silent', '\nfunction templeCameraX'), ctx);
vm.runInContext(extract('let simulationTime=0', 'function begin()'), ctx);
const current = {version:2,area:'forest',player:{x:12,y:14,hp:3,dir:'up'},stars:2,enemy:ctx.freshForestEnemies()};
ctx.snapshot=()=>current;
assert.equal(current.enemy.length,5);
assert.equal(ctx.validSave(current),true,'new forest with HP3 shield mobs is valid');
assert.equal(ctx.validSave({...current,enemy:[{x:5,y:5,hp:2}]}),true,'legacy enemies remain valid');
assert.equal(ctx.validSave({...current,enemy:[{x:5,y:5,hp:4,kind:'shield'}]}),false);
assert.equal(ctx.saveGame(true),true);
assert.equal(JSON.parse(state.get('auto')).enemy.length,5);
ctx.snapshot=()=>({...current,player:{...current.player,hp:0}});
assert.equal(ctx.saveGame(true),false,'invalid transient state cannot overwrite auto-save');
assert.equal(JSON.parse(state.get('auto')).player.hp,3);
ctx.snapshot=()=>current;
const bank={slots:[null,null,null]};
Object.assign(ctx,{BANK:'bank',canSave:()=>true,migrate:()=>bank,entry:data=>({data}),renderSlots(){},status(){}});
vm.runInContext(recovery.match(/function saveSlot\(index\)\{[^\n]+/)[0],ctx);
assert.equal(ctx.saveSlot(2),true);
assert.equal(JSON.parse(state.get('bank')).slots[2].data.enemy.length,5);
ctx.loop(0);ctx.loop(35);
const before=steps;
ctx.playMenuOpen=true;ctx.loop(100);ctx.loop(5000);
assert.equal(steps,before,'menu freezes all simulation ticks');
assert.equal(cancellations,1);
ctx.playMenuOpen=false;ctx.loop(6000);
assert.equal(steps,before,'no catch-up damage on resume');
ctx.loop(6035);assert.ok(steps>before);
const resumed=steps;
for(const id of ['journeyMap','chroniclePanel','recoveryPanel','endingReel']){
  $(id).hidden=false;ctx.loop(7000);ctx.loop(8000);assert.equal(steps,resumed,id+' freezes simulation');
  $(id).hidden=true;ctx.loop(9000);
}
ctx.chapterClearOpen=true;ctx.loop(10000);assert.equal(steps,resumed);
ctx.chapterClearOpen=false;ctx.loop(11000);
ctx.s101CanInteract=()=>false;ctx.loop(12000);ctx.loop(13000);
assert.equal(steps,resumed,'equipment, journal and dialogue gate freezes simulation');
ctx.s101CanInteract=()=>true;ctx.loop(14000);assert.equal(steps,resumed);
assert.ok(draws>steps,'draw loop continues while paused');
// The old public game must retain its separate slots and auto-save.
const legacy={...current,enemy:[{x:5,y:5,hp:2}]};
state.set('aobee_temple_manual_slots_v1',JSON.stringify({version:1,slots:[null,{data:legacy},null]}));
state.set('aobee_star_temple_ch1_v029',JSON.stringify(legacy));
const legacyBank=state.get('aobee_temple_manual_slots_v1');
const legacyAuto=state.get('aobee_star_temple_ch1_v029');
Object.assign(ctx,{BANK:'aobee_temple_remaster_manual_slots_v1',readSave:()=>null});
vm.runInContext(recovery.match(/function readBank\(\)\{[^\n]+/)[0],ctx);
vm.runInContext(recovery.match(/function migrate\(\)\{[^\n]+/)[0],ctx);
let migrated=ctx.migrate();
assert.equal(migrated.slots[1].data.enemy[0].hp,2);
assert.equal(state.get('aobee_temple_manual_slots_v1'),legacyBank);
assert.equal(state.get('aobee_star_temple_ch1_v029'),legacyAuto);
assert.equal(JSON.parse(state.get('auto')).enemy[0].hp,2);
assert.equal(ctx.migrate().slots[1].data.enemy[0].hp,2);
// Developer controls are absent from normal UI and require seven title taps.
for (const id of ['recoveryDebug','recoveryTitleDebug','recoveryDebugTab'])
  assert.ok(recovery.includes('id="'+id+'" type="button" hidden'));
assert.ok(recovery.includes("if(tab==='debug'&&!debugEnabled)return false"));
assert.ok(recovery.includes('async function jump(id){if(!debugEnabled)return false'));
let click, now=100, opens=0;
const debugNodes=new Map();
const debug$=id=>{
  if(!debugNodes.has(id))debugNodes.set(id,{hidden:true,style:{display:'block'},querySelector:()=>({addEventListener:(_event,fn)=>click=fn})});
  return debugNodes.get(id);
};
const hiddenCtx=vm.createContext({$:debug$,Date:{now:()=>now},toast(){},open(){opens++;}});
vm.runInContext('let debugEnabled=false,debugTaps=0,debugStarted=0;'+recovery.match(/const debugTitle=[^\n]+/)[0],hiddenCtx);
for(let i=0;i<6;i++){now+=100;click();}
assert.equal(opens,0);
assert.equal(debug$('recoveryDebug').hidden,true);
now+=100;click();
assert.equal(opens,1);
assert.equal(debug$('recoveryDebug').hidden,false);
for(let i=0;i<7;i++){now+=100;click();}
assert.equal(debug$('recoveryDebug').hidden,true);
for(let i=0;i<6;i++){now+=100;click();}
now+=6000;click();
assert.equal(debug$('recoveryDebug').hidden,true,'slow taps do not unlock');
console.log('v43: new/legacy saves, manual slot, invalid-state protection, modal freeze, safe resume OK');
