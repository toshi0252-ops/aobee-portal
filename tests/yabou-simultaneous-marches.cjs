const assert=require('node:assert/strict');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
const E=Yabou,W=YabouMilitary,B=YabouBattle,R=YABOU_RULES;
let checks=0;
for(const scenario of ['S01','S07'])for(const mode of ['fallback','no-home','new-foothold'])for(const terrain of [false,true])for(const seed of [1,7,77,123]){
 const map=YabouMaps.forScenario(scenario),source='C06',target=scenario==='S01'?'C09':'C13',enemySource=scenario==='S01'?'C04':'C05';
 let s=E.createInitialState(map,'F01',seed,scenario,{castleTerrain:terrain});
 if(mode!=='fallback')for(const c of s.castles)if(c.ownerFactionId==='F01'&&c.id!==source)c.ownerFactionId='F03';
 s.castles.find(c=>c.id===target).ownerFactionId='F06';W.reconcile(s);
 Object.assign(s.castles.find(c=>c.id===source),{troops:600,food:1000,defense:0});
 Object.assign(s.castles.find(c=>c.id===enemySource),{troops:3000,food:1000});
 Object.assign(s.castles.find(c=>c.id===target),{troops:mode==='new-foothold'?0:3000,food:1000,defense:0});
 const actor=s.officers.find(o=>o.status==='active'&&o.factionId==='F01'&&o.locationCastleId===source),enemy=s.officers.find(o=>o.status==='active'&&o.factionId==='F02'&&o.locationCastleId===enemySource);
 // Explicit legal armies isolate return logic from the AI's campaign choices.
 s=W.queue(s,{type:'march',factionId:'F01',castleId:source,targetCastleId:target,units:[{officerId:actor.id,type:'cavalry',troops:500}],food:60,declareWar:true},map,R);
 s=W.queue(s,{type:'march',factionId:'F02',castleId:enemySource,targetCastleId:source,units:[{officerId:enemy.id,type:'cavalry',troops:2500}],food:300,declareWar:true},map,R);
 const tx={state:s,armies:W.launch(s),current:null,report:{turn:s.turn,year:s.year,month:s.month,entries:[],commands:[],military:[],battles:[],personnel:[]}};
 let battle=E.nextBattle(tx);assert.equal(tx.current.army.targetCastleId,source);battle=B.auto(battle);assert.equal(battle.result.winner,'attack');W.settle(tx,battle);assert.equal(s.castles.find(c=>c.id===source).ownerFactionId,'F02');
 battle=E.nextBattle(tx);assert.equal(tx.current.army.targetCastleId,target);
 if(mode==='new-foothold'){battle=B.auto(battle);assert.equal(battle.result.winner,'attack');}
 else{const orders={...B.aiOrders(battle,'defend')};for(const u of battle.units.filter(u=>u.side==='attack'))orders[u.id]={type:'retreat'};battle=B.advance(battle,orders);assert.equal(battle.result.winner,'defend');}
 W.settle(tx,battle);assert.equal(E.nextBattle(tx),null);const result=E.finishMonth(tx,map,R),returned=result.officers.find(o=>o.id===actor.id);
 assert.equal(result.officers.length,54);assert.equal(new Set(result.officers.map(o=>o.id)).size,54);assert(result.castles.every(c=>c.troops>=0&&c.food>=0));
 if(mode==='fallback'){assert.equal(returned.status,'active');assert.equal(returned.locationCastleId,'C01');assert.equal(result.ending,null);}
 if(mode==='no-home'){assert.equal(returned.status,'prisoner');assert.equal(returned.locationCastleId,target);assert.equal(returned.captorFactionId,'F06');assert.equal(result.ending.type,'defeat');assert.throws(()=>E.advanceMonth(result,map,R));}
 if(mode==='new-foothold'){assert.equal(returned.status,'active');assert.equal(returned.locationCastleId,target);assert.equal(result.factions.find(f=>f.id==='F01').capitalCastleId,target);assert.equal(result.ending,null);}
 assert(!result.officers.some(o=>o.status==='marching'));
 assert.equal(W.atWar(result,'F01','F02'),mode!=='no-home');
 assert.equal(W.atWar(result,'F01','F06'),mode!=='no-home');
 assert.deepEqual(E.loadSave(E.serializeSave(result,map,R),map,R),result);
 checks++;
}

for(const scenario of ['S01','S07'])for(const terrain of [false,true])for(const seed of [1,7,77,123]){
 const map=YabouMaps.forScenario(scenario),from=scenario==='S01'?'C06':'C01',target='C04';let s=E.createInitialState(map,'F01',seed,scenario,{castleTerrain:terrain});
 for(const id of [from,'C07'])Object.assign(s.castles.find(c=>c.id===id),{troops:3000,food:1000});s.castles.find(c=>c.id===target).troops=400;
 const actors=[];
 for(const [factionId,castleId]of [['F01',from],['F03','C07']]){
  const actor=s.officers.find(o=>o.status==='active'&&o.factionId===factionId&&o.locationCastleId===castleId);actors.push(actor.id);
  s=W.queue(s,{type:'march',factionId,castleId,targetCastleId:target,units:[{officerId:actor.id,type:'cavalry',troops:2500}],food:300,declareWar:true},map,R);
 }
 const tx={state:s,armies:W.launch(s),current:null,report:{turn:s.turn,year:s.year,month:s.month,entries:[],commands:[],military:[],battles:[],personnel:[]}};
 let battle=E.nextBattle(tx);assert.equal(battle.attacker,'F01');battle=B.auto(battle);assert.equal(battle.result.winner,'attack');W.settle(tx,battle);
 assert.equal(E.nextBattle(tx),null,'second army must abort after third-party ownership change');
 const result=E.finishMonth(tx,map,R),returned=result.officers.find(o=>o.id===actors[1]);
 assert.equal(result.castles.find(c=>c.id===target).ownerFactionId,'F01');assert.equal(returned.status,'active');assert.equal(returned.locationCastleId,'C07');
 assert.equal(result.castles.find(c=>c.id==='C07').troops,3000,'cancelled army returns all soldiers');
 assert.equal(result.castles.find(c=>c.id==='C07').food,970,'cancelled army returns food before monthly maintenance');
 assert.equal(W.atWar(result,'F01','F03'),false);assert(result.reports.at(-1).military.some(x=>x.result.includes('所有勢力')));assert.equal(result.battleHistory.length,1);
 assert.equal(result.officers.length,54);assert.deepEqual(E.loadSave(E.serializeSave(result,map,R),map,R),result);checks++;
}
console.log('PASS',checks,'simultaneous march cases: lost origin/alternate home/no home/new capital, converging attackers/third-party cancellation/full returns/no accidental war, both maps and terrain modes, exact save reload');
