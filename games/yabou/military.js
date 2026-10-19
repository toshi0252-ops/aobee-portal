(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),D=()=>root.YabouDiplomacy,B=()=>root.YabouBattle;
const aliveFaction=(s,id)=>s.castles.some(c=>c.ownerFactionId===id);
function init(s){s.militaryCommands=[];s.wars={};s.battleHistory=[];s.ending=null;return s;}
const atWar=(s,a,b)=>!!s.wars[D().pair(a,b)]?.active;
const usedOfficers=s=>s.militaryCommands.flatMap(q=>q.units.map(u=>u.officerId));
const count=(s,id)=>s.militaryCommands.filter(q=>q.castleId===id).length;
const food=(s,id)=>s.militaryCommands.filter(q=>q.castleId===id).reduce((a,q)=>a+q.food,0);
function can(s,q,m,r){
 if(s.ending)return 'この戦記は終了しています';
 if(!q||q.type!=='march')return '未対応の軍事命令です';
 const source=s.castles.find(c=>c.id===q.castleId),target=s.castles.find(c=>c.id===q.targetCastleId);
 if(!source||!target||source.ownerFactionId!==q.factionId)return '出発城の所属が一致しません';
 if(!m.roads.some(e=>(e.fromCastleId===source.id&&e.toCastleId===target.id)||(e.toCastleId===source.id&&e.fromCastleId===target.id)))return '街道で隣接する城のみ進軍できます';
 if(count(s,source.id))return 'この城は今月の進軍を予約済みです';
 if([...s.commands,...s.diplomacyCommands].filter(x=>x.castleId===source.id).length>=2)return '出発城の命令枠が不足しています';
 if(!Array.isArray(q.units)||q.units.length<1||q.units.length>3||new Set(q.units.map(u=>u.officerId)).size!==q.units.length)return '1〜3部隊・武将の重複なしで編成してください';
 for(const u of q.units){const o=s.officers.find(o=>o.id===u.officerId);if(!o||o.status!=='active'||o.factionId!==q.factionId||o.locationCastleId!==source.id)return '出陣武将の配置が不正です';if(usedOfficers(s).includes(o.id)||[...s.commands,...s.diplomacyCommands].some(x=>x.officerId===o.id))return '出陣武将は任務予約済みです';if(!Object.hasOwn(B().RULES.types,u.type)||!Number.isInteger(u.troops)||u.troops<100||u.troops>3000||u.troops%100!==0)return '1部隊100〜3000兵・100兵単位で指定してください';}
 const troops=q.units.reduce((a,u)=>a+u.troops,0);if(source.troops-troops<100)return '出発城には守備兵100以上を残してください';
 const reserved=s.commands.filter(x=>x.castleId===source.id).reduce((a,x)=>a+(root.Yabou.commandRule(x,r).cost.food||0),0),required=q.units.reduce((a,u)=>a+Math.ceil(u.troops/100)*12,0);
 if(!Number.isSafeInteger(q.food)||q.food<required||q.food>source.food-reserved)return '12ラウンド分の兵糧が必要です（内政予約分は使用不可）';
 if(target.ownerFactionId!==q.factionId){if(D().truce(s,q.factionId,target.ownerFactionId))return '停戦中の勢力は攻撃できません';if(D().active(s,q.factionId,target.ownerFactionId))return '同盟中の勢力は攻撃できません';if(s.diplomacyCommands.some(x=>x.factionId===q.factionId&&x.targetFactionId===target.ownerFactionId))return '同じ相手への外交と出陣は同月に予約できません';if(!atWar(s,q.factionId,target.ownerFactionId)&&q.declareWar!==true)return '未交戦の相手には宣戦の確認が必要です';}
 return null;
}
function queue(s,q,m,r){const error=can(s,q,m,r);if(error)throw new Error(error);const n=clone(s);n.militaryCommands.push(clone(q));return n;}
function validate(s,m,r){
 if(!Array.isArray(s.militaryCommands)||!s.wars||typeof s.wars!=='object'||Array.isArray(s.wars)||!Array.isArray(s.battleHistory)||!(s.ending===null||['defeat','victory'].includes(s.ending?.type)))throw new Error('軍事データが不正です');
 for(const [key,w]of Object.entries(s.wars))if(!s.factions.some(f=>f.id===w.a)||!s.factions.some(f=>f.id===w.b)||w.a===w.b||key!==D().pair(w.a,w.b)||typeof w.active!=='boolean'||!Number.isInteger(w.sinceTurn)||w.sinceTurn<1||w.sinceTurn>=s.turn||(w.active&&(!aliveFaction(s,w.a)||!aliveFaction(s,w.b)||D().active(s,w.a,w.b)||D().truce(s,w.a,w.b))))throw new Error('戦争状態が不正です');
 const trial=clone(s);trial.militaryCommands=[];for(const q of s.militaryCommands){if(q.factionId!==s.playerFactionId)throw new Error('他家の軍事命令です');const error=can(trial,q,m,r);if(error)throw new Error(error);trial.militaryCommands.push(q);}
 if(s.ending&&(!Number.isInteger(s.ending.turn)||s.ending.turn<1||s.ending.turn>=s.turn||(s.ending.type==='defeat'&&aliveFaction(s,s.playerFactionId))||(s.ending.type==='victory'&&!s.castles.every(c=>c.ownerFactionId===s.playerFactionId))))throw new Error('勝敗状態が不正です');
 if(new Set(s.battleHistory.map(h=>h.id)).size!==s.battleHistory.length)throw new Error('合戦履歴IDが重複しています');
 for(const h of s.battleHistory)if(typeof h.id!=='string'||!m.castles.some(c=>c.id===h.castleId)||!s.factions.some(f=>f.id===h.attacker)||!s.factions.some(f=>f.id===h.defender)||!['attack','defend'].includes(h.winner)||typeof h.reason!=='string'||!Array.isArray(h.log)||h.log.some(x=>typeof x!=='string')||!Number.isInteger(h.rounds)||h.rounds<0||h.rounds>12||['attackLosses','defendLosses','surrendered'].some(k=>!Number.isSafeInteger(h[k])||h[k]<0))throw new Error('合戦履歴が不正です');
}
function planAI(s,m,r){
 if(s.turn<4)return;
 for(const f of [...s.factions].sort((a,b)=>a.id.localeCompare(b.id))){if(f.id===s.playerFactionId||!aliveFaction(s,f.id))continue;
  const candidates=[];
  for(const c of s.castles.filter(c=>c.ownerFactionId===f.id))for(const edge of m.roads){const tid=edge.fromCastleId===c.id?edge.toCastleId:edge.toCastleId===c.id?edge.fromCastleId:null;if(!tid)continue;const t=s.castles.find(x=>x.id===tid);if(t.ownerFactionId===f.id||D().active(s,f.id,t.ownerFactionId))continue;
   const region=B().TERRAIN_RULES[B().castleTerrain(t.id)],terrainFactor=s.castleTerrainRules?1+region.bonus:1,reserve=c.id===f.capitalCastleId?400:300,available=Math.min(3000,Math.floor((c.troops-reserve)/100)*100);if(available<Math.max(300,t.troops*terrainFactor*1.25)||c.food<Math.ceil(available/100)*18+Math.ceil(reserve/100)*3)continue;
   const officers=s.officers.filter(o=>o.factionId===f.id&&o.locationCastleId===c.id&&o.status==='active').sort((a,b)=>b.stats.leadership-a.stats.leadership||a.id.localeCompare(b.id));
   for(const o of officers){const q={type:'march',castleId:c.id,targetCastleId:t.id,factionId:f.id,units:[{officerId:o.id,type:f.trait==='military'?'cavalry':f.trait==='commerce'?'gun':'infantry',troops:available}],food:Math.ceil(available/100)*12,declareWar:true};if(!can(s,q,m,r)){candidates.push({q,score:available/Math.max(100,t.troops*terrainFactor)*100-t.defense,reason:'優勢兵力・遠征兵糧1.5倍・本城守備を確保'+(s.castleTerrainRules&&region.bonus?'・'+region.name+'の地形防御＋'+Math.round(region.bonus*100)+'%を考慮':'')});break;}}
  }
  candidates.sort((a,b)=>b.score-a.score||a.q.targetCastleId.localeCompare(b.q.targetCastleId));if(candidates[0]){const x=candidates[0];s.militaryCommands.push(x.q);s.aiLog.push({turn:s.turn,factionId:f.id,castleId:x.q.castleId,candidates:candidates.slice(0,3).map(c=>({type:'march',score:c.score})),chosen:'march',reason:x.reason,targetCastleId:x.q.targetCastleId});}
 }
}
function launch(s){
 const armies=[];for(const q of s.militaryCommands){const c=s.castles.find(c=>c.id===q.castleId),t=s.castles.find(c=>c.id===q.targetCastleId);c.troops-=q.units.reduce((a,u)=>a+u.troops,0);c.food-=q.food;
 const units=q.units.map(u=>{const o=s.officers.find(o=>o.id===u.officerId);o.status='marching';o.locationCastleId=null;return{...clone(u),name:o.name,stats:clone(o.stats),initialMorale:70+(s.factions.find(f=>f.id===q.factionId).trait==='military'?5:0)};});
 if(t.ownerFactionId!==q.factionId){const p=D().pair(q.factionId,t.ownerFactionId);if(!s.wars[p]?.active)s.wars[p]={a:q.factionId,b:t.ownerFactionId,sinceTurn:s.turn,active:true};s.diplomacy[p].relation=Math.max(-100,s.diplomacy[p].relation-35);s.offers=s.offers.filter(o=>D().pair(o.from,o.to)!==p);}
 armies.push({...clone(q),units,targetFactionId:t.ownerFactionId});
 }s.militaryCommands=[];return armies.sort((a,b)=>a.targetCastleId.localeCompare(b.targetCastleId)||a.factionId.localeCompare(b.factionId)||a.castleId.localeCompare(b.castleId));
}
function safeCastle(s,f,preferred){return s.castles.find(c=>c.id===preferred&&c.ownerFactionId===f)||s.castles.filter(c=>c.ownerFactionId===f).sort((a,b)=>b.defense-a.defense||a.id.localeCompare(b.id))[0];}
function returnArmy(s,army,units,remainingFood,preferred){const home=safeCastle(s,army.factionId,preferred);if(home){home.troops+=units.reduce((a,u)=>a+u.troops,0);home.food+=remainingFood;}for(const u of units){const o=s.officers.find(o=>o.id===u.officerId);if(home){o.status='active';o.locationCastleId=home.id;delete o.captorFactionId;}else{o.status='prisoner';o.locationCastleId=army.targetCastleId;o.captorFactionId=s.castles.find(c=>c.id===army.targetCastleId).ownerFactionId;}}}
function nextBattle(tx,random){
 while(tx.armies.length){const army=tx.armies.shift(),s=tx.state,t=s.castles.find(c=>c.id===army.targetCastleId);if(t.ownerFactionId===army.factionId){returnArmy(s,army,army.units,army.food,t.id);tx.report.military.push({castleId:t.id,result:'友軍を移送',factionId:army.factionId});continue;}
 if(D().active(s,army.factionId,t.ownerFactionId)||t.ownerFactionId!==army.targetFactionId){returnArmy(s,army,army.units,army.food,army.castleId);tx.report.military.push({castleId:t.id,result:'同盟または所有勢力の変化で進軍中止',factionId:army.factionId});continue;}
 const defenders=s.officers.filter(o=>o.status==='active'&&o.locationCastleId===t.id&&o.factionId===t.ownerFactionId).sort((a,b)=>b.stats.leadership-a.stats.leadership||a.id.localeCompare(b.id)).slice(0,3),count=Math.max(1,defenders.length),total=Math.min(t.troops,count*3000);let left=total;
 const units=[];for(let i=0;i<count&&left>0;i++){const troops=Math.min(3000,Math.ceil(left/(count-i))),o=defenders[i];units.push({officerId:o?.id||null,name:o?.name||t.name+'守備隊',type:i===1?'bow':'infantry',troops,stats:clone(o?.stats||{leadership:40,intellect:40}),initialMorale:70});left-=troops;}
 const battleId='battle-'+s.turn+'-'+tx.report.battles.length,insider=root.YabouInsiders?.battle(s,army,t,units,tx.report,battleId);
 tx.current={army,reserve:t.troops-total,defender:t.ownerFactionId,battle:B().create({id:battleId,attacker:army.factionId,defender:t.ownerFactionId,attackUnits:army.units,defendUnits:units,attackFood:army.food,defendFood:t.food,defense:t.defense,...(s.castleTerrainRules?{castleTerrain:B().castleTerrain(t.id)}:{}),seed:Math.floor(random(s)*4294967295)||1})};t.troops=0;t.food=0;
 if(insider)tx.current.battle.log.push(insider);return tx.current.battle;
 }tx.current=null;return null;
}
function settle(tx,battle){
 const s=tx.state,before=clone(s),current=tx.current;if(!current||!battle.result||battle.id!==current.battle.id)throw new Error('合戦結果が一致しません');const {army,defender,reserve}=current,t=s.castles.find(c=>c.id===army.targetCastleId),attack=battle.units.filter(u=>u.side==='attack'),defend=battle.units.filter(u=>u.side==='defend');
 if(battle.result.winner==='attack'){
  t.ownerFactionId=army.factionId;t.troops=0;t.food=0;returnArmy(s,army,attack.filter(B().alive),battle.food.attack,t.id);returnArmy(s,army,attack.filter(u=>!B().alive(u)),0,army.castleId);
  const home=safeCastle(s,defender);if(home){home.troops+=reserve+defend.reduce((a,u)=>a+u.troops,0);home.food+=battle.food.defend;}
  for(const o of s.officers.filter(o=>o.factionId===defender&&o.status==='active'&&o.locationCastleId===t.id)){if(home)o.locationCastleId=home.id;else{o.status='prisoner';o.captorFactionId=army.factionId;o.locationCastleId=t.id;}}
 }else{t.troops=reserve+defend.reduce((a,u)=>a+u.troops,0);t.food=battle.food.defend;returnArmy(s,army,attack,battle.food.attack,army.castleId);}
 const record={id:battle.id,turn:s.turn,castleId:t.id,attacker:army.factionId,defender,winner:battle.result.winner,reason:battle.result.reason,rounds:battle.round-1,log:clone(battle.log),attackLosses:attack.reduce((a,u)=>a+u.initial-u.troops,0),defendLosses:defend.reduce((a,u)=>a+u.initial-u.troops,0),surrendered:!safeCastle(s,defender)&&battle.result.winner==='attack'?reserve+defend.reduce((a,u)=>a+u.troops,0):0};record.participants={attack:[...new Set(attack.map(u=>u.officerId).filter(Boolean))],defend:[...new Set(defend.map(u=>u.officerId).filter(Boolean))]};root.YabouBiography?.battle(s,record);root.YabouRelationships?.battle(s,record);root.YabouChains?.battle(s,record);root.YabouBiography?.changes(before,s,'battle:'+record.id);s.battleHistory.push(record);tx.report.battles.push(record);root.YabouDialogue?.battleResult(s,record,battle);tx.current=null;
}
function reconcile(s){
 for(const f of s.factions){const home=safeCastle(s,f.id,f.capitalCastleId);f.capitalCastleId=home?.id||null;}
 for(const o of s.officers){if(o.status==='marching'){const home=safeCastle(s,o.factionId);if(home){o.status='active';o.locationCastleId=home.id;}else{o.status='ronin';o.factionId=null;o.locationCastleId=null;}}
  if(o.status==='active'&&!s.castles.some(c=>c.id===o.locationCastleId&&c.ownerFactionId===o.factionId)){const home=safeCastle(s,o.factionId);if(home)o.locationCastleId=home.id;else{o.status='ronin';o.factionId=null;o.locationCastleId=null;}}
  if(o.status==='prisoner'){const prison=s.castles.find(c=>c.id===o.locationCastleId);if(!prison||prison.ownerFactionId!==o.captorFactionId){o.status='ronin';o.locationCastleId=null;o.factionId=null;delete o.captorFactionId;}}
 }
 for(const w of Object.values(s.wars))if(!aliveFaction(s,w.a)||!aliveFaction(s,w.b))w.active=false;
 for(const f of s.factions)if(!aliveFaction(s,f.id))for(const other of s.factions)if(f.id!==other.id)s.diplomacy[D().pair(f.id,other.id)].allianceUntil=0;
 s.offers=s.offers.filter(o=>aliveFaction(s,o.from)&&aliveFaction(s,o.to));
 if(!aliveFaction(s,s.playerFactionId))s.ending={type:'defeat',turn:s.turn};else if(s.castles.every(c=>c.ownerFactionId===s.playerFactionId))s.ending={type:'victory',turn:s.turn};
 s.battleHistory=s.battleHistory.slice(-120);
}
function release(s,id){const n=clone(s),o=n.officers.find(o=>o.id===id);if(!o||o.status!=='prisoner'||o.captorFactionId!==s.playerFactionId)throw new Error('自家の捕虜ではありません');const home=safeCastle(n,o.factionId);o.status=home?'active':'ronin';o.locationCastleId=home?.id||null;if(!home)o.factionId=null;delete o.captorFactionId;root.YabouBiography?.changes(s,n,'release:'+n.turn+':'+id);root.YabouCamps?.refresh(n);return n;}
function migrate(s){s=D().migrate(s);if(s.buildContract==='diplomacy-prototype-2'){s=clone(s);init(s);s.buildContract='battle-prototype-3';}return s;}
function validateRecord(h,m,factions=m.factions){if(!h||typeof h.id!=='string'||!m.castles.some(c=>c.id===h.castleId)||!factions.some(f=>f.id===h.attacker)||!factions.some(f=>f.id===h.defender)||!['attack','defend'].includes(h.winner)||typeof h.reason!=='string'||!Array.isArray(h.log)||h.log.some(x=>typeof x!=='string')||!Number.isInteger(h.rounds)||h.rounds<0||h.rounds>12||['attackLosses','defendLosses','surrendered'].some(k=>!Number.isSafeInteger(h[k])||h[k]<0))throw new Error('合戦報告が不正です');}
root.YabouMilitary={validateRecord,init,atWar,aliveFaction,usedOfficers,count,food,can,queue,validate,planAI,launch,nextBattle,settle,reconcile,release,migrate};
})(globalThis);
