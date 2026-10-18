const assert=require('node:assert/strict');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
const E=Yabou,X=YabouEvents,M=YABOU_DATA,R=YABOU_RULES,W=YabouMilitary;
const fresh=()=>E.createInitialState(M,'F01',77);
function fixture(id){
 if(['SE04','SE05'].includes(id))return E.createInitialState(M,'F01',77,id==='SE04'?'S04':'S05');
 const s=fresh();s.events={version:1,pending:null,history:[],flags:{},followups:[],hireBonuses:{}};s.turn=13;s.month=1;s.year=2;
 s.castles.find(c=>c.id==='C02').ownerFactionId='F01';W.reconcile(s);
 for(const id of ['N001','N003','N006','N009','N012','N019','N021','N024'])Object.assign(s.officers.find(o=>o.id===id),{factionId:'F01',status:'active',locationCastleId:'C01',loyalty:55});
 s.personnel.known.F01=['N002','N005','N028'];s.officers.find(o=>o.id==='G002').loyalty=55;
 const c=s.castles[0];c.gold=10000;c.food=10000;c.troops=3000;c.publicOrder=70;
 s.events.pending={uid:id+':13:C01',id,turn:13,castleId:'C01',officerIds:['G002','N013'],rulerId:'G001',discoverId:'N025'};
 s.events.flags[id]={lastOffered:13,resolvedCount:0};if(['GE01','GE02','EV01'].includes(id)){s.turn=id==='EV01'?1:10;s.month=s.turn;s.year=1;s.events.pending.turn=s.turn;s.events.pending.uid=id+':'+s.turn+':C01';s.events.flags[id].lastOffered=s.turn;}E.validateState(s,M,R);return s;
}
assert.equal(X.defs.filter(d=>d.id.startsWith('GE')).length,20);assert.equal(X.defs.filter(d=>d.id.startsWith('UE')).length,10);
let cases=0;
for(const def of X.defs){
 for(const choice of ['A','B']){
  const s=fixture(def.id),uid=s.events.pending.uid,before=JSON.stringify(s);
  assert.equal(X.canChoose(s,uid,choice),null,def.id+choice);
  const out=E.chooseEvent(s,uid,choice,M,R);assert.equal(JSON.stringify(s),before);
  assert.equal(out.state.events.pending,null);assert.equal(out.state.events.history.length,1);assert.equal(out.state.events.flags[def.id].resolvedCount,1);
  assert.throws(()=>E.chooseEvent(out.state,uid,choice,M,R));
  let next=E.advanceMonth(out.state,M,R);next=E.advanceMonth(next,M,R);
  const h=next.events.history.find(h=>h.uid===uid);assert(h.followup,def.id+' followup');assert.equal(h.followupTurn,s.turn+2);
  assert.deepEqual(E.loadSave(E.serializeSave(next,M,R),M,R),next);cases++;
 }
}
let s=fixture('GE04');s.castles[0].gold=100;
s=E.queueCommand(s,{type:'cultivate',castleId:'C01',officerId:'G001',factionId:'F01'},R);
assert(X.canChoose(s,s.events.pending.uid,'A').includes('不足'));assert.equal(s.castles[0].gold,100);
const troops=fixture('GE05');troops.castles[0].troops=300;
const reserved=W.queue(troops,{type:'march',castleId:'C01',targetCastleId:'C06',factionId:'F01',units:[{officerId:'G001',type:'infantry',troops:200}],food:24},M,R);
assert(X.canChoose(reserved,reserved.events.pending.uid,'B').includes('不足'));
const empty=fixture('GE04');empty.castles[0].gold=0;assert(X.canChoose(empty,empty.events.pending.uid,'A'));
const skipped=E.dismissEvent(empty,empty.events.pending.uid,M,R);assert.equal(skipped.castles[0].gold,0);assert.equal(skipped.events.followups.length,0);assert.throws(()=>E.dismissEvent(skipped,empty.events.pending.uid,M,R));
const expired=E.advanceMonth(empty,M,R);assert.equal(expired.events.history.find(h=>h.id==='GE04').choiceId,'SKIP');
const mel=E.chooseEvent(fixture('GE19'),'GE19:13:C01','B',M,R).state;assert(mel.personnel.known.F01.includes('N029'));assert.equal(mel.officers.find(o=>o.id==='N029').status,'ronin');
const zeno=E.chooseEvent(fixture('UE10'),'UE10:13:C01','A',M,R).state;assert(zeno.personnel.known.F01.includes('N030'));assert.equal(zeno.officers.find(o=>o.id==='N030').factionId,null);assert.equal(E.canIssueCommand(zeno,{type:'hire',castleId:'C01',officerId:'G001',factionId:'F01',targetId:'N030',offer:100},R),null);
const kon=E.chooseEvent(fixture('UE01'),'UE01:13:C01','A',M,R).state;assert.equal(X.hireBonus(kon,'F01','N002'),10);
assert.equal(X.hireBonus(kon,'F02','N002'),0);
const legacy=fresh();delete legacy.events;const legacyText=JSON.stringify(legacy),migrated=E.loadSave(legacyText,M,R);assert.equal(JSON.stringify(legacy),legacyText);assert.deepEqual(migrated.officers,legacy.officers);assert.equal(migrated.events.pending,null);
const sample=E.chooseEvent(fixture('GE04'),'GE04:13:C01','A',M,R).state;
for(const corrupt of [s=>s.events.version=9,s=>s.events.history.push(s.events.history[0]),s=>s.events.followups[0].dueTurn=s.turn,s=>s.events.hireBonuses['F01:missing']=10,s=>s.events.flags.unknown={lastOffered:1,resolvedCount:0},s=>s.events.history[0].text='x'.repeat(1600),s=>s.events.pending={id:'unknown'},s=>s.events=null]){const bad=E.clone(sample);corrupt(bad);assert.throws(()=>E.loadSave(JSON.stringify(bad),M,R));}
// Defend the long-run event fixture so offer-frequency checks run for 100 months.
let long=fresh(),offered=0,previousRng;for(const c of long.castles.filter(c=>c.ownerFactionId===long.playerFactionId)){c.troops=100000;c.food=100000;}
for(let i=0;i<100&&!long.ending;i++){
 if(long.events.pending){offered++;const p=long.events.pending;const choice=X.options(long).find(c=>!X.canChoose(long,p.uid,c.id));if(choice){previousRng=long.rngState;long=E.chooseEvent(long,p.uid,choice.id,M,R).state;assert.equal(long.rngState,previousRng);}else long=E.dismissEvent(long,p.uid,M,R);}
 const restored=E.loadSave(E.serializeSave(long,M,R),M,R);long=E.advanceMonth(long,M,R);assert.deepEqual(long,E.advanceMonth(restored,M,R));
 assert.equal(new Set(long.officers.map(o=>o.id)).size,54);assert(long.events.history.length<=120);assert(long.events.followups.length<=20);
}
assert(offered>10);assert(long.turn===101||long.ending);
const harvest=long.reports.find(r=>r.year===1&&r.month===9);assert.equal(harvest.entries.find(e=>e.castleId==='C01').harvest,320);assert(harvest.events.some(e=>e.id==='EV05'));
console.log('PASS events: '+cases+' choice branches; followups; no double rewards; reserved gold/troops; skip/expire; special discovery; hire bonus; migration/corrupt saves; '+(long.turn-1)+' deterministic months / '+offered+' offers; harvest once; 54 IDs');
