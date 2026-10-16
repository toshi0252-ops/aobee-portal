const assert=require('node:assert/strict');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
const E=Yabou,L=YabouLoyalty,M=YABOU_DATA,R=YABOU_RULES,D=YabouDiplomacy,W=YabouMilitary;
const fresh=()=>E.createInitialState(M,'F01',77);
const q={type:'reward',castleId:'C01',factionId:'F01',officerId:'G001',targetId:'G002',offer:250};
assert.deepEqual([100,80,79,60,59,40,39,20,19,0].map(E.loyaltyLabel),['忠臣','忠臣','安定','安定','不満','不満','危険','危険','深刻','深刻']);

let s=fresh();const original=JSON.stringify(s),pending=E.queueCommand(s,q,R);
assert.equal(JSON.stringify(s),original);assert.equal(pending.castles[0].gold,500);assert.equal(pending.officers.find(o=>o.id==='G002').loyalty,80);
assert(E.canIssueCommand(pending,{...q,officerId:'N013'},R));
assert(E.canIssueCommand(pending,{type:'cultivate',castleId:'C01',officerId:'G001',factionId:'F01'},R));
for(const offer of [0,50,101,250.5,'250',-1])assert(E.canIssueCommand(s,{...q,offer},R));
for(const targetId of ['G001','G005','N001','missing'])assert(E.canIssueCommand(s,{...q,targetId},R));
const full=E.clone(s);full.officers.find(o=>o.id==='G002').loyalty=100;assert(E.canIssueCommand(full,q,R));
const prisoner=E.clone(s);Object.assign(prisoner.officers.find(o=>o.id==='G002'),{status:'prisoner',captorFactionId:'F02'});assert(E.canIssueCommand(prisoner,q,R));

const reserved=E.queueCommand(s,{...q,offer:500},R);
assert(D.can(reserved,{type:'goodwill',castleId:'C01',officerId:'N013',factionId:'F01',targetFactionId:'F03'},R)?.includes('不足'));
assert(E.canIssueCommand(reserved,{type:'commerce',castleId:'C01',officerId:'N013',factionId:'F01'},R)?.includes('不足'));
const shared=E.queueCommand(pending,{type:'cultivate',castleId:'C01',officerId:'N013',factionId:'F01'},R);
assert(E.canIssueCommand(shared,{type:'fortify',castleId:'C01',officerId:'N019',factionId:'F01'},R)?.includes('命令枠'));
assert.equal(W.can(pending,{type:'march',castleId:'C01',targetCastleId:'C06',factionId:'F01',units:[{officerId:'N013',type:'infantry',troops:100}],food:12},M,R),null);

const restored=E.loadSave(E.serializeSave(pending,M,R),M,R),next=E.advanceMonth(pending,M,R);
assert.deepEqual(next,E.advanceMonth(restored,M,R));
assert.equal(next.officers.find(o=>o.id==='G002').loyalty,90);
assert.equal(E.bond(next,'G001','G002'),3);assert.equal(E.bond(next,'G002','G001'),3);
assert.equal(next.castles[0].gold,310);assert.equal(next.personnel.log.filter(x=>x.text.includes('金の褒賞')).length,1);
assert(next.reports[0].personnel.some(x=>x.text.includes('80→90')));
const after=E.advanceMonth(next,M,R);assert.equal(after.personnel.log.filter(x=>x.text.includes('金の褒賞')).length,1);assert.equal(E.bond(after,'G001','G002'),3);
const cancelled={...pending,commands:[]};assert.deepEqual(E.advanceMonth(cancelled,M,R),E.advanceMonth(s,M,R));
const capped=E.clone(s);capped.officers.find(o=>o.id==='G002').loyalty=99;assert.equal(E.advanceMonth(E.queueCommand(capped,q,R),M,R).officers.find(o=>o.id==='G002').loyalty,100);

const poor=fresh();poor.castles[0].food=0;poor.castles[0].publicOrder=35;
const poorNext=E.advanceMonth(poor,M,R);assert.equal(poorNext.officers.find(o=>o.id==='G002').loyalty,76);assert.equal(poorNext.officers.find(o=>o.id==='G001').loyalty,100);
const zero=E.clone(poor);zero.officers.find(o=>o.id==='G002').loyalty=1;assert.equal(E.advanceMonth(zero,M,R).officers.find(o=>o.id==='G002').loyalty,0);
const dutiful=fresh(),veteran=dutiful.officers.find(o=>o.id==='N016');assert.equal(veteran.duty,80);dutiful.castles.find(c=>c.id===veteran.locationCastleId).food=0;
assert.equal(E.advanceMonth(dutiful,M,R).officers.find(o=>o.id===veteran.id).loyalty,78);
const stable=fresh();stable.turn=3;stable.month=3;stable.officers.find(o=>o.id==='G002').loyalty=79;
assert.equal(E.advanceMonth(stable,M,R).officers.find(o=>o.id==='G002').loyalty,80);

const old=E.clone(pending);delete old.personnel.loyalty;const oldText=JSON.stringify(old),migrated=E.loadSave(oldText,M,R);
assert.equal(JSON.stringify(old),oldText);assert.deepEqual(migrated.officers,old.officers);assert.deepEqual(migrated.commands,old.commands);assert.deepEqual(migrated.personnel.loyalty,{version:1,bonds:{}});
assert.deepEqual(E.advanceMonth(migrated,M,R),next);
for(const change of [x=>x.personnel.loyalty=null,x=>x.personnel.loyalty.version=99,x=>x.personnel.loyalty.bonds['G001:G002'].value=101,x=>x.personnel.loyalty.bonds['G001:G002'].tags=['unknown'],x=>x.personnel.loyalty.bonds['G001:G002'].lastTurn=x.turn,x=>{x.personnel.loyalty.bonds['G002:G001']=x.personnel.loyalty.bonds['G001:G002'];},x=>x.personnel.loyalty.bonds['G001:missing']={value:0,tags:[],lastTurn:1}]){const bad=E.clone(next);change(bad);assert.throws(()=>E.loadSave(JSON.stringify(bad),M,R));}
const bounded=fresh();L.addBond(bounded,'G001','G002',-500);assert.equal(E.bond(bounded,'G001','G002'),-100);L.addBond(bounded,'G002','G001',500);assert.equal(E.bond(bounded,'G001','G002'),100);assert.equal(Object.keys(bounded.personnel.loyalty.bonds).length,1);
let long=next;for(let i=1;i<100&&!long.ending;i++){const roundTrip=E.loadSave(E.serializeSave(long,M,R),M,R);long=E.advanceMonth(long,M,R);assert.deepEqual(long,E.advanceMonth(roundTrip,M,R));}
assert.equal(long.turn,101);assert.equal(new Set(long.officers.map(o=>o.id)).size,54);assert(long.personnel.log.length<=200);assert(long.officers.every(o=>o.loyalty>=0&&o.loyalty<=100));
console.log('PASS v1.2b: five loyalty bands; reward bounds/costs/tasks/cancel/once; scarcity/stability; symmetric bounded bonds; v1.2a migration; invalid saves; 100 deterministic months; 54 IDs; bounded log');
