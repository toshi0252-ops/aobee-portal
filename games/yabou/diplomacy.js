(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),pair=(a,b)=>[a,b].sort().join(':');
const COST=50;
const W=()=>root.YabouMilitary;
function init(s){s.diplomacy={};for(let i=0;i<s.factions.length;i++)for(let j=i+1;j<s.factions.length;j++)s.diplomacy[pair(s.factions[i].id,s.factions[j].id)]={relation:0,allianceUntil:0};s.diplomacyCommands=[];s.offers=[];return s;}
function active(s,a,b){return s.diplomacy[pair(a,b)].allianceUntil>s.turn;}
function allies(s,a){return s.factions.filter(f=>f.id!==a&&active(s,a,f.id)).length;}
function reserved(s,id){return s.diplomacyCommands.filter(q=>q.castleId===id&&q.type==='goodwill').length*COST;}
function can(s,q,rules){
 if(s.ending)return 'この戦記は終了しています';
 if(!q||!['goodwill','alliance'].includes(q.type))return '未対応の外交命令です';
 if(q.factionId===q.targetFactionId||!s.factions.some(f=>f.id===q.targetFactionId))return '交渉先が不正です';
 if(!W().aliveFaction(s,q.targetFactionId)||W().atWar(s,q.factionId,q.targetFactionId))return '交戦中または滅亡した相手とはこの交渉を行えません';
 if(s.militaryCommands.some(x=>x.factionId===q.factionId&&s.castles.find(c=>c.id===x.targetCastleId)?.ownerFactionId===q.targetFactionId))return '出陣相手への外交は同月に予約できません';
 const o=s.officers.find(o=>o.id===q.officerId),c=s.castles.find(c=>c.id===q.castleId);
 if(!o||!c||o.status!=='active'||o.factionId!==q.factionId||c.ownerFactionId!==q.factionId||o.locationCastleId!==c.id)return '使者の所属・配置が不正です';
 if(W().usedOfficers(s).includes(q.officerId)||[...s.commands,...s.diplomacyCommands].some(x=>x.officerId===q.officerId))return '使者は今月の任務を予約済みです';
 if([...s.commands,...s.diplomacyCommands].filter(x=>x.castleId===c.id).length+W().count(s,c.id)>=2)return '出発城の命令枠が不足しています';
 if(s.diplomacyCommands.some(x=>x.factionId===q.factionId&&x.targetFactionId===q.targetFactionId))return '同じ相手への外交は月1回です';
 if(q.type==='goodwill'){const domestic=s.commands.filter(x=>x.castleId===c.id).reduce((a,x)=>a+rules.commands[x.type].cost.gold,0);if(c.gold-domestic-reserved(s,c.id)<COST)return '贈物の金50が不足しています';if(s.diplomacy[pair(q.factionId,q.targetFactionId)].relation>=100)return '関係はすでに上限です';}
 if(q.type==='alliance'){if(active(s,q.factionId,q.targetFactionId))return 'すでに同盟中です';if(s.diplomacy[pair(q.factionId,q.targetFactionId)].relation<30)return '同盟交渉には関係30以上が必要です';if(allies(s,q.factionId)>=2||allies(s,q.targetFactionId)>=2)return '同盟は各家2勢力までです';}
 return null;
}
function queue(s,q,rules){const error=can(s,q,rules);if(error)throw new Error(error);const n=clone(s);n.diplomacyCommands.push(clone(q));return n;}
function chance(s,q){const actor=s.officers.find(o=>o.id===q.officerId),target=s.officers.find(o=>o.factionId===q.targetFactionId&&o.role==='大名');return Math.max(20,Math.min(85,45+(actor.stats.intellect-target.stats.intellect)*.2+s.diplomacy[pair(q.factionId,q.targetFactionId)].relation*.25));}
function validate(s,m,rules){
 if(!s.diplomacy||typeof s.diplomacy!=='object'||Array.isArray(s.diplomacy)||Object.keys(s.diplomacy).length!==15||!Array.isArray(s.diplomacyCommands)||!Array.isArray(s.offers))throw new Error('外交データが不正です');
 for(let i=0;i<s.factions.length;i++)for(let j=i+1;j<s.factions.length;j++){const d=s.diplomacy[pair(s.factions[i].id,s.factions[j].id)];if(!d||!Number.isInteger(d.relation)||d.relation< -100||d.relation>100||!Number.isInteger(d.allianceUntil)||d.allianceUntil<0)throw new Error('関係・条約期限が不正です');}
 if(s.factions.some(f=>allies(s,f.id)>2))throw new Error('同盟数が上限を超えています');
 if(new Set(s.offers.map(o=>o.id)).size!==s.offers.length)throw new Error('提案IDが重複しています');
 for(const o of s.offers)if(!m.factions.some(f=>f.id===o.from)||o.to!==s.playerFactionId||o.from===o.to||!Number.isInteger(o.expiresTurn)||typeof o.id!=='string')throw new Error('外交提案が不正です');
 const trial=clone(s);trial.diplomacyCommands=[];for(const q of s.diplomacyCommands){if(q.factionId!==s.playerFactionId)throw new Error('他家の外交命令です');const error=can(trial,q,rules);if(error)throw new Error(error);trial.diplomacyCommands.push(q);}
}
function planAI(s,m,rules){
 s.offers=s.offers.filter(o=>o.expiresTurn>=s.turn);
 for(const f of [...s.factions].sort((a,b)=>a.id.localeCompare(b.id))){if(f.id===s.playerFactionId||!W().aliveFaction(s,f.id))continue;
  const neighbors=new Set();for(const r of m.roads){const a=s.castles.find(c=>c.id===r.fromCastleId).ownerFactionId,b=s.castles.find(c=>c.id===r.toCastleId).ownerFactionId;if(a===f.id&&b!==f.id)neighbors.add(b);if(b===f.id&&a!==f.id)neighbors.add(a);}
  const targets=[...neighbors].filter(id=>!active(s,f.id,id)).sort((a,b)=>s.diplomacy[pair(f.id,b)].relation-s.diplomacy[pair(f.id,a)].relation||a.localeCompare(b));
  const officers=s.officers.filter(o=>o.factionId===f.id&&o.status==='active').sort((a,b)=>b.stats.intellect-a.stats.intellect||a.id.localeCompare(b.id));let done=false;
  for(const id of targets){if(done)break;for(const o of officers){const relation=s.diplomacy[pair(f.id,id)].relation,type=relation>=30?'alliance':'goodwill',q={type,factionId:f.id,targetFactionId:id,officerId:o.id,castleId:o.locationCastleId};if(can(s,q,rules))continue;const c=s.castles.find(c=>c.id===o.locationCastleId);if(type==='goodwill'&&(c.food<Math.ceil(c.troops/100)*3||c.gold<200))continue;if(type==='alliance'&&id===s.playerFactionId&&s.offers.some(x=>x.from===f.id))continue;s.diplomacyCommands.push(q);s.aiLog.push({turn:s.turn,factionId:f.id,castleId:c.id,candidates:[],chosen:'diplomacy',reason:type==='alliance'?'隣国との同盟で国境を安定':'備蓄と金を残し隣国との関係を改善',targetFactionId:id});done=true;break;}}
 }
}
function resolve(s,random){
 const logs=[];for(const q of s.diplomacyCommands){const d=s.diplomacy[pair(q.factionId,q.targetFactionId)];let result;
  const source=s.castles.find(c=>c.id===q.castleId),actor=s.officers.find(o=>o.id===q.officerId);if(!W().aliveFaction(s,q.targetFactionId)||W().atWar(s,q.factionId,q.targetFactionId)||source.ownerFactionId!==q.factionId||actor.status!=='active'||source.gold<(q.type==='goodwill'?COST:0)){logs.push({...q,result:'戦況または所属の変化で交渉中止',relation:d.relation});continue;}
  if(q.type==='goodwill'){s.castles.find(c=>c.id===q.castleId).gold-=COST;d.relation=Math.min(100,d.relation+10);result='贈物で関係+10';}
  else if(active(s,q.factionId,q.targetFactionId))result='他の交渉で同盟成立済み';
  else if(allies(s,q.factionId)>=2||allies(s,q.targetFactionId)>=2)result='交渉時に同盟上限へ到達';
  else if(q.targetFactionId===s.playerFactionId){if(!s.offers.some(o=>o.from===q.factionId))s.offers.push({id:`offer-${s.turn}-${q.factionId}`,from:q.factionId,to:s.playerFactionId,expiresTurn:s.turn+2});result='同盟提案を送付（返答待ち）';}
  else if(random(s)*100<chance(s,q)){d.allianceUntil=s.turn+13;result='12か月の同盟成立';}else result='同盟交渉は不成立';
  logs.push({...q,result,relation:d.relation});
 }s.diplomacyCommands=[];return logs;
}
function respond(s,id,accept){const n=clone(s),o=n.offers.find(o=>o.id===id);if(!o||o.expiresTurn<n.turn)throw new Error('提案の期限が切れています');if(accept){if(W().atWar(n,o.from,o.to)||!W().aliveFaction(n,o.from))throw new Error('戦況の変化により提案は無効です');if(allies(n,o.from)>=2||allies(n,o.to)>=2)throw new Error('同盟数の上限に達しています');n.diplomacy[pair(o.from,o.to)].allianceUntil=n.turn+12;}n.offers=n.offers.filter(x=>x.id!==id);return n;}
function migrate(s){if(s.buildContract==='domestic-prototype-1'){s=clone(s);init(s);s.buildContract='diplomacy-prototype-2';}return s;}
root.YabouDiplomacy={pair,init,active,allies,reserved,can,queue,chance,validate,planAI,resolve,respond,migrate};
})(globalThis);
