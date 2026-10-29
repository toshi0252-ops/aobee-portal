const assert=require('node:assert/strict');require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
const E=Yabou,U=YabouChains,W=YabouMilitary,R=YABOU_RULES,id='CH12';
function fixture(scenario,outcome,seed=77,terrain=false,mode='normal'){
 const map=YabouMaps.forScenario(scenario),from=scenario==='S01'?'C06':'C01',target='C04';let state=E.createInitialState(map,'F01',seed,scenario,{castleTerrain:terrain});state.events.pending=null;
 for(const oid of U.byId[id].officerIds)state.officers.find(o=>o.id===oid).locationCastleId=from;
 Object.assign(state.castles.find(c=>c.id===from),{troops:4000,food:4000});Object.assign(state.castles.find(c=>c.id===target),{troops:outcome==='victory'?400:6000,food:4000,defense:outcome==='victory'?0:50});
 if(mode!=='before-first'){state=E.requestChain(state,id,map,R);state=E.chooseChain(state,state.personnel.chains.pending.uid,'A',map,R).state;assert.match(U.blocked(state,id),/合戦/);}
 const actors=U.byId[id].officerIds.slice(0,mode==='one-officer'?1:2),units=actors.map(officerId=>({officerId,type:outcome==='victory'?'cavalry':'infantry',troops:outcome==='victory'?1500:100}));
 state=W.queue(state,{type:'march',factionId:'F01',castleId:from,targetCastleId:target,units,food:units.reduce((n,u)=>n+u.troops/100*12,0),declareWar:true},map,R);
 return {map,state,from,target};
}
let count=0;
for(const scenario of ['S01','S07'])for(const outcome of ['victory','defeat'])for(const seed of [1,7,77,123])for(const terrain of [false,true]){
 const {map,state}=fixture(scenario,outcome,seed,terrain),original=JSON.stringify(state),result=E.advanceMonth(state,map,R),track=result.personnel.chains.tracks[id],record=result.battleHistory.find(h=>h.participants.attack.includes('G003')&&h.participants.attack.includes('N019'));
 assert.equal(JSON.stringify(state),original);assert(record);assert.equal(record.winner==='attack'?'victory':'defeat',outcome);assert.deepEqual(track.battleMemory,{id:record.id,turn:record.turn,castleId:record.castleId,result:outcome});assert.equal(track.cofightTurn,record.turn);assert(result.reports.at(-1).personnel.some(x=>x.text.includes('共闘条件を達成')));for(const oid of U.byId[id].officerIds)assert(result.biography.officers[oid].entries.some(x=>x.key===record.id+':story:'+id));
 assert(U.text(result,{id,stage:1}).includes(U.byId[id].acts[1].battleResponses[outcome]));assert(U.text(result,{id,stage:1}).includes(result.castles.find(c=>c.id===record.castleId).name));assert(!U.text(result,{id,stage:1}).includes(String.fromCharCode(92)+'n'));
 assert(!U.text(result,{id,stage:0}).includes('共闘の記録'));assert.deepEqual(E.loadSave(E.serializeSave(result,map,R),map,R),result);
 for(const change of [x=>x.battleMemory.result=outcome==='victory'?'defeat':'victory',x=>x.battleMemory.turn++,x=>x.battleMemory.castleId='C01',x=>x.battleMemory.result='unknown',x=>delete x.battleMemory]){const bad=E.clone(result);change(bad.personnel.chains.tracks[id]);assert.throws(()=>E.loadSave(JSON.stringify(bad),map,R));}
 const archived=E.clone(result);archived.battleHistory=[];assert.deepEqual(E.loadSave(E.serializeSave(archived,map,R),map,R),archived);assert(U.text(archived,{id,stage:1}).includes(U.byId[id].acts[1].battleResponses[outcome]));
 const remembered=JSON.stringify(track.battleMemory);U.battle(result,{...record,id:'later-battle',turn:result.turn,winner:outcome==='victory'?'defend':'attack'});assert.equal(JSON.stringify(track.battleMemory),remembered);
 count++;
}
for(const scenario of ['S01','S07'])for(const mode of ['one-officer','before-first']){
 const {map,state}=fixture(scenario,'victory',77,false,mode),result=E.advanceMonth(state,map,R);assert.equal(result.personnel.chains.tracks[id]?.cofightTurn||0,0);assert.equal(result.personnel.chains.tracks[id]?.battleMemory,undefined);count++;
}
for(const scenario of ['S01','S07']){
 const {state}=fixture(scenario,'victory');U.battle(state,{id:'foreign-battle',turn:1,castleId:'C04',attacker:'F02',defender:'F03',winner:'attack',participants:{attack:['G003','N019'],defend:[]}});assert.equal(state.personnel.chains.tracks[id].cofightTurn,0);count++;
}

for(const scenario of ['S01','S07'])for(const outcome of ['victory','defeat']){
 const {map,state,from}=fixture(scenario,'victory');state.militaryCommands=[];const other=state.castles.find(c=>c.ownerFactionId==='F01'&&c.id!==from).id;
 for(const o of state.officers)if(o.status==='active'&&o.factionId==='F01'&&o.locationCastleId===from&&!U.byId[id].officerIds.includes(o.id))o.locationCastleId=other;
 Object.assign(state.castles.find(c=>c.id===from),{troops:outcome==='victory'?6000:100,food:4000,defense:0});Object.assign(state.castles.find(c=>c.id==='C04'),{troops:4000,food:4000});
 const enemy=state.officers.find(o=>o.status==='active'&&o.factionId==='F02'&&o.locationCastleId==='C04'),troops=outcome==='victory'?100:3000;
 const queued=W.queue(state,{type:'march',factionId:'F02',castleId:'C04',targetCastleId:from,units:[{officerId:enemy.id,type:'cavalry',troops}],food:troops/100*12,declareWar:true},map,R);
 const tx={state:queued,armies:W.launch(queued),current:null,report:{turn:1,year:1,month:1,entries:[],commands:[],military:[],battles:[],personnel:[]}};const battle=E.nextBattle(tx);assert(U.byId[id].officerIds.every(oid=>battle.units.some(u=>u.officerId===oid&&u.side==='defend')));const resolved=YabouBattle.auto(battle);assert.equal(resolved.result.winner==='defend'?'victory':'defeat',outcome);W.settle(tx,resolved);assert.equal(E.nextBattle(tx),null);const result=E.finishMonth(tx,map,R);assert.equal(result.personnel.chains.tracks[id].battleMemory.result,outcome);assert.equal(result.personnel.chains.tracks[id].battleMemory.castleId,from);assert.deepEqual(E.loadSave(E.serializeSave(result,map,R),map,R),result);count++;
}
console.log('PASS campaign story:',count,'cases, real two-officer battles/victory and defeat/both maps/terrain, pre-chapter and one-officer/foreign exclusion, memory persistence/corrupt rejection/archived history/first-battle immutability');
module.exports={fixture};
