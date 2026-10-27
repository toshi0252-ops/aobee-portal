const assert=require('node:assert/strict');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
const E=Yabou,W=YabouMilitary,D=YabouDiplomacy,R=YABOU_RULES;
let checks=0;
for(const scenario of ['S01','S07'])for(const food of [149,150,151])for(const sameOfficer of [false,true]){
 const map=YabouMaps.forScenario(scenario),from=scenario==='S01'?'C06':'C13',to=scenario==='S01'?'C01':'C06';
 const initial=E.createInitialState(map,'F01',77,scenario);Object.assign(initial.castles.find(c=>c.id===from),{troops:650,food,gold:1000});
 const actors=initial.officers.filter(o=>o.status==='active'&&o.factionId==='F01'&&o.locationCastleId===from);
 const recruit={type:'recruit',factionId:'F01',castleId:from,officerId:actors[0].id};
 const march={type:'march',factionId:'F01',castleId:from,targetCastleId:to,units:[{officerId:actors[sameOfficer?0:1].id,type:'infantry',troops:500}],food:100,declareWar:true};
 const base=JSON.stringify(initial),states=[];
 for(const militaryFirst of [false,true]){
  const first=militaryFirst?W.queue(initial,march,map,R):E.queueCommand(initial,recruit,R),snapshot=JSON.stringify(first);
  const reason=militaryFirst?E.canIssueCommand(first,recruit,R):W.can(first,march,map,R);
  const allowed=!sameOfficer&&food>=150;
  assert.equal(reason===null,allowed,JSON.stringify({scenario,food,sameOfficer,militaryFirst,reason}));
  if(!allowed){assert.throws(()=>militaryFirst?E.queueCommand(first,recruit,R):W.queue(first,march,map,R));assert.equal(JSON.stringify(first),snapshot);}
  else{
   const queued=militaryFirst?E.queueCommand(first,recruit,R):W.queue(first,march,map,R);
   assert.equal(queued.castles.find(c=>c.id===from).food,food,'reservations must not spend resources early');
   const loaded=E.loadSave(E.serializeSave(queued,map,R),map,R);assert.deepEqual(loaded,queued);
   states.push(queued);
  }
  const cancelled={...first,[militaryFirst?'militaryCommands':'commands']:[]};
  assert.deepEqual(cancelled,initial,'cancellation releases only the reservation');
  assert.equal(militaryFirst?E.canIssueCommand(cancelled,recruit,R):W.can(cancelled,march,map,R),null,'cancellation releases resource and actor');
  assert.equal(JSON.stringify(initial),base);checks++;
 }
 if(states.length){assert.deepEqual(states[0],states[1]);assert.deepEqual(E.advanceMonth(states[0],map,R),E.advanceMonth(states[1],map,R));}
}
// A third distinct officer isolates command-slot limits from actor reuse.
for(const scenario of ['S01','S07'])for(const order of [['domestic','diplomacy','military'],['domestic','military','diplomacy'],['diplomacy','domestic','military'],['diplomacy','military','domestic'],['military','domestic','diplomacy'],['military','diplomacy','domestic']]){
 const map=YabouMaps.forScenario(scenario),from='C01',to='C06';let state=E.createInitialState(map,'F01',77,scenario);
 Object.assign(state.castles.find(c=>c.id===from),{troops:1000,food:1000,gold:1000});
 const actors=state.officers.filter(o=>o.status==='active'&&o.factionId==='F01');for(const actor of actors.slice(0,3))actor.locationCastleId=from;
 const q={domestic:{type:'cultivate',factionId:'F01',castleId:from,officerId:actors[0].id},diplomacy:{type:'goodwill',factionId:'F01',castleId:from,officerId:actors[1].id,targetFactionId:'F02'},military:{type:'march',factionId:'F01',castleId:from,targetCastleId:to,units:[{officerId:actors[2].id,type:'infantry',troops:100}],food:12,declareWar:true}};
 const can=kind=>kind==='domestic'?E.canIssueCommand(state,q[kind],R):kind==='diplomacy'?D.can(state,q[kind],R):W.can(state,q[kind],map,R);
 const queue=kind=>kind==='domestic'?E.queueCommand(state,q[kind],R):kind==='diplomacy'?D.queue(state,q[kind],R):W.queue(state,q[kind],map,R);
 for(const kind of order.slice(0,2)){assert.equal(can(kind),null);state=queue(kind);}
 const snapshot=JSON.stringify(state);assert.match(can(order[2]),/命令枠/);assert.throws(()=>queue(order[2]));assert.equal(JSON.stringify(state),snapshot);
 const field={domestic:'commands',diplomacy:'diplomacyCommands',military:'militaryCommands'}[order[0]];state={...state,[field]:[]};assert.equal(can(order[2]),null);queue(order[2]);checks++;
}
console.log('PASS',checks,'reservation order cases: food boundaries, actor exclusivity, all three command-slot permutations, cancellation, exact load and next-month equivalence');
