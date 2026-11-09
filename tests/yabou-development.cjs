const assert=require('node:assert/strict');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
const E=Yabou,R=YABOU_RULES;
for(const scenario of ['S01','S07']){
 const map=YabouMaps.forScenario(scenario),id=scenario==='S01'?'C06':'C13',city=s=>s.castles.find(c=>c.id===id);
 for(const [type,stat] of Object.entries({cultivate:'farm',commerce:'commerce',fortify:'defense'})){
  const s=E.createInitialState(map,'F01',77,scenario);
  Object.assign(city(s),{gold:3000,troops:1000,food:1000,farm:50,commerce:50,defense:50});
  const [a,b]=s.officers.filter(o=>o.status==='active'&&o.locationCastleId===id);
  const change={type:'development',policy:type,castleId:id,officerId:a.id,factionId:'F01'},improve={...change,type,officerId:b.id};
  delete improve.policy;
  const pending=E.queueCommand(E.queueCommand(s,change,R),improve,R);
  assert.deepEqual(E.loadSave(E.serializeSave(pending,map,R),map,R),pending);
  assert.match(E.canIssueCommand(s,{...change,policy:'toString'},R),/発展方針/);
  const next=E.advanceMonth(pending,map,R);
  assert.equal(city(next)[stat],55);
  assert.equal(city(next).developmentPolicy,type);
  assert.deepEqual(E.loadSave(E.serializeSave(next,map,R),map,R),next);
  assert.equal(E.commandRule(improve,R,city(next)).delta[stat],8);
  assert.equal(E.commandRule({type:type==='commerce'?'cultivate':'commerce'},R,city(next)).delta[type==='commerce'?'farm':'commerce'],3);
  city(next)[stat]=96;
  const reset=E.queueCommand(E.queueCommand(next,improve,R),{...change,policy:'balanced'},R);
  const later=E.advanceMonth(reset,map,R);
  assert.equal(city(later)[stat],100);
  assert.equal(Object.hasOwn(city(later),'developmentPolicy'),false);
  assert.equal(E.commandRule(improve,R,city(later)).delta[stat],5);
 }
}
console.log('PASS development: both maps, all three policies, activation timing, cap, reset, save round trips');
