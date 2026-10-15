const assert=require('node:assert/strict');require('./data.js');require('./diplomacy.js');require('./battle.js');require('./military.js');require('./engine.js');
const E=Yabou,M=YABOU_DATA,R=YABOU_RULES;
assert.deepEqual(E.validateMaster(M),[]);let runs=0,months=0,battles=0,ended=0;
for(const f of M.factions)for(let seed=1;seed<=100;seed++){
 let s=E.createInitialState(M,f.id,seed),restored;
 for(let i=0;i<12&&!s.ending;i++){
  const commands=s.castles.filter(c=>c.ownerFactionId===f.id).flatMap(c=>E.types.map(type=>({type,castleId:c.id,officerId:s.officers.find(o=>o.locationCastleId===c.id&&o.factionId===f.id&&o.status==='active')?.id,factionId:f.id})));
  for(const q of commands){if(!E.canIssueCommand(s,q,R))s=E.queueCommand(s,q,R);}
  if(i===5)restored=E.loadSave(E.serializeSave(s,M,R),M,R);
  if(i>=5){if(i>5){restored={...restored,commands:E.clone(s.commands)};}restored=E.advanceMonth(restored,M,R);}
  s=E.advanceMonth(s,M,R);months++;if(i>=5)assert.deepEqual(s,restored);
 }
 if(s.ending){ended++;assert.equal(s.ending.type,'defeat');}else{assert.equal(s.turn,13);assert.equal(s.month,1);assert.equal(s.year,2);assert.equal(s.annualReports.length,1);}battles+=s.battleHistory.length;assert(s.aiLog.length>0);runs++;
}
let s=E.createInitialState(M,'F01',77);const q={type:'cultivate',castleId:'C01',officerId:'G001',factionId:'F01'};
const before=JSON.stringify(s);const pending=E.queueCommand(s,q,R);assert.equal(JSON.stringify(s),before);assert.throws(()=>E.queueCommand(pending,{...q,type:'commerce'},R));
const poor=E.clone(s);poor.castles[0].gold=0;assert.throws(()=>E.queueCommand(poor,q,R));assert.equal(poor.castles[0].gold,0);
for(let i=0;i<9;i++)s=E.advanceMonth(s,M,R);assert.equal(s.reports.find(r=>r.month===9).entries.find(x=>x.castleId==='C01').harvest,320,'harvest exactly once');assert.equal(s.reports.filter(r=>r.entries[0].harvest>0).length,1);
for(const bad of [x=>x.schemaVersion='99',x=>x.castles[0].gold=-1,x=>x.officers[0].locationCastleId='C04',x=>x.rngState=0,x=>x.month=99,x=>x.factions[0].capitalCastleId='C04']){const x=E.clone(s);bad(x);assert.throws(()=>E.loadSave(JSON.stringify(x),M,R));}
for(let i=9;i<100&&!s.ending;i++)s=E.advanceMonth(s,M,R);assert(s.turn===101||s.ending);
console.log(JSON.stringify({pass:true,campaigns:runs,months,battles,ended,longRunMonths:s.turn-1,checks:['six factions','100 seeds','checkpoint equality','command rollback','harvest once','invalid saves','100 months']}));
