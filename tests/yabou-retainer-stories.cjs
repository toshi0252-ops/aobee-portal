const assert=require('node:assert/strict');require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
const E=Yabou,U=YabouChains,R=YABOU_RULES,ids=U.defs.filter(d=>d.manual).map(d=>d.id);let cases=0;
for(const scenario of ['S01','S07'])for(const id of ids)for(const choice of ['A','B']){
 const map=YabouMaps.forScenario(scenario),d=U.byId[id];let s=E.createInitialState(map,'F01',77,scenario);s.events.pending=null;s.personnel.drama.pending=null;
 for(const oid of d.officerIds){const o=s.officers.find(o=>o.id===oid);Object.assign(o,{status:'active',factionId:'F01',locationCastleId:'C01'});YabouAllegiance.joined(s,oid);}
 const baseline={castles:E.clone(s.castles),officers:s.officers.map(o=>[o.id,o.status,o.factionId,o.stats])},rng=s.rngState;
 assert.equal(Object.keys(s.personnel.chains.tracks).length,5,'old states do not acquire extra tracks just by loading');
 for(let stage=0;stage<4;stage++){
  const turn=1+stage*6;s.turn=turn;s.month=(turn-1)%12+1;s.year=Math.floor((turn-1)/12)+1;
  if(d.battleContext&&stage===d.battleStage){assert.match(U.canRequest(s,id),/合戦/);const t=s.personnel.chains.tracks[id];t.cofightTurn=s.turn;t.battleMemory={id:'fixture-cofight',turn:s.turn,castleId:'C04',result:'victory'};}assert.equal(U.canRequest(s,id),null);const original=JSON.stringify(s),n=E.requestChain(s,id,map,R);assert.equal(JSON.stringify(s),original);assert.equal(n.personnel.chains.pending.id,id);assert(U.canRequest(n,id));assert.throws(()=>E.requestChain(n,id,map,R));
  s=E.loadSave(E.serializeSave(n,map,R),map,R);const pending=s.personnel.chains.pending;if(stage&&d.acts[stage].responses)assert(U.text(s,pending).includes(d.acts[stage].responses[choice]));s=E.chooseChain(s,pending.uid,choice,map,R).state;
  assert.equal(s.personnel.chains.tracks[id].stage,stage+1);assert.throws(()=>E.chooseChain(s,pending.uid,choice,map,R));
  assert.deepEqual(s.castles,baseline.castles);assert.deepEqual(s.officers.map(o=>[o.id,o.status,o.factionId,o.stats]),baseline.officers);assert.equal(s.rngState,rng);
  assert.deepEqual(E.loadSave(E.serializeSave(s,map,R),map,R),s);for(const oid of d.officerIds)assert(s.biography.officers[oid].entries.some(e=>e.key===pending.uid+':chain'));
  cases++;
 }
 assert.equal(U.canRequest(s,id),'完結');const pair=d.officerIds.slice().sort().join(':');assert(s.personnel.loyalty.bonds[pair].tags.includes(choice==='A'?'trust':'rival'));
}
for(const scenario of ['S01','S07']){
 const map=YabouMaps.forScenario(scenario);let s=E.createInitialState(map,'F01',77,scenario);const before=JSON.stringify(s);U.track(s,'CH06');U.canRequest(s,'CH06');assert.equal(JSON.stringify(s),before);
 if(s.events.pending){assert.match(U.canRequest(s,'CH06'),/出来事/);s=E.dismissEvent(s,s.events.pending.uid,map,R);}
 const started=E.requestChain(s,'CH06',map,R),p=started.personnel.chains.pending,skipped=E.dismissChain(started,p.uid,map,R);assert.equal(skipped.personnel.chains.tracks.CH06.stage,0);assert.deepEqual(skipped.castles,s.castles);assert(U.canRequest(skipped,'CH06'));
 const moved=E.clone(started);moved.officers.find(o=>o.id==='G003').locationCastleId='C01';assert(U.canChoose(moved,p.uid,'A'));assert.throws(()=>E.chooseChain(moved,p.uid,'A',map,R));
 const corrupted=E.clone(started);delete corrupted.personnel.chains.tracks.CH01;assert.throws(()=>E.loadSave(JSON.stringify(corrupted),map,R));
 const unknown=E.clone(started);unknown.personnel.chains.tracks.CH99=U.track(s,'CH06');assert.throws(()=>E.loadSave(JSON.stringify(unknown),map,R));
}
console.log('PASS new retainer stories:',cases,'requested chapters; all seven stories/both endings/2 maps, old five-track saves unchanged, lazy progress, pending reload, duplicate blocking, pause/skip/priority, biography, no resource/stat/RNG changes');
