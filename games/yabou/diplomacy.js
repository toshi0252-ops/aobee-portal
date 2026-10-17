(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),pair=(a,b)=>[a,b].sort().join(':');
const COST=50,labels={goodwill:'贈物',alliance:'同盟交渉',truce:'停戦交渉',trade:'交易',aid:'援軍要請',surrender:'降伏勧告'};
const truce=(s,a,b)=>(s.diplomacy[pair(a,b)].truceUntil||0)>s.turn;
const capital=(s,id)=>s.castles.find(c=>c.id===s.factions.find(f=>f.id===id)?.capitalCastleId&&c.ownerFactionId===id);
const price=q=>['trade','aid'].includes(q.type)?100:q.type==='goodwill'?COST:0;
function signTruce(s,a,b,until){const key=pair(a,b);if(s.wars[key])s.wars[key].active=false;s.diplomacy[key].truceUntil=until;s.offers=s.offers.filter(o=>pair(o.from,o.to)!==key);}
const W=()=>root.YabouMilitary;
function init(s){s.diplomacy={};for(let i=0;i<s.factions.length;i++)for(let j=i+1;j<s.factions.length;j++)s.diplomacy[pair(s.factions[i].id,s.factions[j].id)]={relation:0,allianceUntil:0};s.diplomacyCommands=[];s.offers=[];return s;}
function active(s,a,b){return s.diplomacy[pair(a,b)].allianceUntil>s.turn;}
function allies(s,a){return s.factions.filter(f=>f.id!==a&&active(s,a,f.id)).length;}
function reserved(s,id){return s.diplomacyCommands.filter(q=>q.castleId===id).reduce((n,q)=>n+price(q),0);}

const power=(s,id)=>s.castles.filter(c=>c.ownerFactionId===id).reduce((n,c)=>n+c.troops,0);
function aidReason(s,q){if(!active(s,q.factionId,q.targetFactionId))return '援軍要請には同盟が必要です';const donor=capital(s,q.targetFactionId);if(!donor||donor.troops<900||donor.food<100+Math.ceil(donor.troops/100)*6)return '相手本城の守備兵600と6か月分の兵糧を残せません';return null;}
function surrenderReason(s,q){if(q.targetFactionId===s.playerFactionId)return '自家の降伏はこの勧告では決定しません';if(!W().atWar(s,q.factionId,q.targetFactionId))return '降伏勧告は交戦中の相手が対象です';if(s.castles.filter(c=>c.ownerFactionId===q.targetFactionId).length!==1||s.castles.filter(c=>c.ownerFactionId===q.factionId).length<3)return '相手が最後の一城、自家が3城以上のときに勧告できます';if(power(s,q.factionId)<Math.max(100,power(s,q.targetFactionId))*3)return '自家に相手の3倍以上の兵力が必要です';if(!root.YabouAllegiance.border(s,q.factionId,q.targetFactionId))return '領地が隣接する相手に勧告してください';return null;}
function annex(s,q){const city=capital(s,q.targetFactionId),name=s.factions.find(f=>f.id===q.factionId).name;city.ownerFactionId=q.factionId;
 for(const o of s.officers){if(o.factionId===q.targetFactionId&&o.status==='active'){o.factionId=q.factionId;o.locationCastleId=city.id;if(o.role==='大名')o.role='家臣';o.loyalty=60;root.YabouAllegiance.joined(s,o.id);root.YabouBiography.add(s,o.id,'surrender:'+s.turn+':'+q.targetFactionId+':'+o.id,'event','降伏が成立し、'+name+'の家臣として仕える。');}
 if(o.status==='prisoner'&&o.captorFactionId===q.targetFactionId&&o.locationCastleId===city.id){if(o.factionId===q.factionId){o.status='active';delete o.captorFactionId;}else o.captorFactionId=q.factionId;}}
 W().reconcile(s);
}
function can(s,q,rules){
 if(s.ending)return 'この戦記は終了しています';
 if(!q||!Object.hasOwn(labels,q.type))return '未対応の外交命令です';
 if(q.factionId===q.targetFactionId||!s.factions.some(f=>f.id===q.targetFactionId))return '交渉先が不正です';
 if(!W().aliveFaction(s,q.targetFactionId))return '滅亡した相手とは交渉できません';
 if(['truce','surrender'].includes(q.type)){if(!W().atWar(s,q.factionId,q.targetFactionId))return '交戦中の相手と交渉してください';}else if(W().atWar(s,q.factionId,q.targetFactionId))return '交戦中の相手には停戦交渉が必要です';
 if(s.militaryCommands.some(x=>x.factionId===q.factionId&&s.castles.find(c=>c.id===x.targetCastleId)?.ownerFactionId===q.targetFactionId))return '出陣相手への外交は同月に予約できません';
 const o=s.officers.find(o=>o.id===q.officerId),c=s.castles.find(c=>c.id===q.castleId);
 if(!o||!c||o.status!=='active'||o.factionId!==q.factionId||c.ownerFactionId!==q.factionId||o.locationCastleId!==c.id)return '使者の所属・配置が不正です';
 if(W().usedOfficers(s).includes(q.officerId)||[...s.commands,...s.diplomacyCommands].some(x=>x.officerId===q.officerId))return '使者は今月の任務を予約済みです';
 if([...s.commands,...s.diplomacyCommands].filter(x=>x.castleId===c.id).length+W().count(s,c.id)>=2)return '出発城の命令枠が不足しています';
 if(s.diplomacyCommands.some(x=>x.factionId===q.factionId&&x.targetFactionId===q.targetFactionId))return '同じ相手への外交は月1回です';
 if(price(q)){const domestic=s.commands.filter(x=>x.castleId===c.id).reduce((a,x)=>a+(root.Yabou.commandRule(x,rules).cost.gold||0),0);if(c.gold-domestic-reserved(s,c.id)<price(q))return '予約分を除く金'+price(q)+'が不足しています';if(q.type==='goodwill'&&s.diplomacy[pair(q.factionId,q.targetFactionId)].relation>=100)return '関係はすでに上限です';}
 if(q.type==='alliance'){if(active(s,q.factionId,q.targetFactionId))return 'すでに同盟中です';if(s.diplomacy[pair(q.factionId,q.targetFactionId)].relation<30)return '同盟交渉には関係30以上が必要です';if(allies(s,q.factionId)>=2||allies(s,q.targetFactionId)>=2)return '同盟は各家2勢力までです';}
 if(q.type==='trade'){if(s.diplomacy[pair(q.factionId,q.targetFactionId)].relation<20)return '交易には関係20以上が必要です';if((capital(s,q.targetFactionId)?.food||0)<150)return '相手の本城に交換用の兵糧150がありません';}
 if(q.type==='aid'){const error=aidReason(s,q);if(error)return error;}
 if(q.type==='surrender'){const error=surrenderReason(s,q);if(error)return error;}
 return null;
}
function queue(s,q,rules){const error=can(s,q,rules);if(error)throw new Error(error);const n=clone(s);n.diplomacyCommands.push(clone(q));return n;}
function chance(s,q){if(q.type==='surrender')return Math.max(10,Math.min(75,20+(power(s,q.factionId)/Math.max(100,power(s,q.targetFactionId))-3)*8+s.officers.find(o=>o.id===q.officerId).stats.intellect*.1));if(q.type==='truce'){const power=id=>s.castles.filter(c=>c.ownerFactionId===id).reduce((n,c)=>n+c.troops,0),w=s.wars[pair(q.factionId,q.targetFactionId)];return Math.max(20,Math.min(85,40+(power(q.factionId)/Math.max(100,power(q.targetFactionId))-1)*20+Math.min(20,(s.turn-(w?.sinceTurn||s.turn))*2)));}const actor=s.officers.find(o=>o.id===q.officerId),target=s.officers.find(o=>o.factionId===q.targetFactionId&&o.role==='大名');return Math.max(20,Math.min(85,45+(actor.stats.intellect-target.stats.intellect)*.2+s.diplomacy[pair(q.factionId,q.targetFactionId)].relation*.25));}
function validate(s,m,rules){
 if(!s.diplomacy||typeof s.diplomacy!=='object'||Array.isArray(s.diplomacy)||Object.keys(s.diplomacy).length!==15||!Array.isArray(s.diplomacyCommands)||!Array.isArray(s.offers))throw new Error('外交データが不正です');
 for(let i=0;i<s.factions.length;i++)for(let j=i+1;j<s.factions.length;j++){const d=s.diplomacy[pair(s.factions[i].id,s.factions[j].id)];if(!d||!Number.isInteger(d.relation)||d.relation< -100||d.relation>100||!Number.isInteger(d.allianceUntil)||d.allianceUntil<0)throw new Error('関係・条約期限が不正です');}
 for(const d of Object.values(s.diplomacy))if(d.truceUntil!==undefined&&(!Number.isSafeInteger(d.truceUntil)||d.truceUntil<0))throw new Error('停戦期限が不正です');
 if(s.factions.some(f=>allies(s,f.id)>2))throw new Error('同盟数が上限を超えています');
 if(new Set(s.offers.map(o=>o.id)).size!==s.offers.length)throw new Error('提案IDが重複しています');
 for(const o of s.offers)if(!m.factions.some(f=>f.id===o.from)||o.to!==s.playerFactionId||o.from===o.to||!Number.isInteger(o.expiresTurn)||typeof o.id!=='string'||(o.type!==undefined&&!['alliance','truce'].includes(o.type)))throw new Error('外交提案が不正です');
 const trial=clone(s);trial.diplomacyCommands=[];for(const q of s.diplomacyCommands){if(q.factionId!==s.playerFactionId)throw new Error('他家の外交命令です');const error=can(trial,q,rules);if(error)throw new Error(error);trial.diplomacyCommands.push(q);}
}
function planAI(s,m,rules){
 s.offers=s.offers.filter(o=>o.expiresTurn>=s.turn);
 for(const f of [...s.factions].sort((a,b)=>a.id.localeCompare(b.id))){if(f.id===s.playerFactionId||!W().aliveFaction(s,f.id))continue;
  const neighbors=new Set();for(const r of m.roads){const a=s.castles.find(c=>c.id===r.fromCastleId).ownerFactionId,b=s.castles.find(c=>c.id===r.toCastleId).ownerFactionId;if(a===f.id&&b!==f.id)neighbors.add(b);if(b===f.id&&a!==f.id)neighbors.add(a);}
  const targets=[...neighbors].sort((a,b)=>Number(W().atWar(s,f.id,b))-Number(W().atWar(s,f.id,a))||s.diplomacy[pair(f.id,b)].relation-s.diplomacy[pair(f.id,a)].relation||a.localeCompare(b));
  const officers=s.officers.filter(o=>o.factionId===f.id&&o.status==='active').sort((a,b)=>b.stats.intellect-a.stats.intellect||a.id.localeCompare(b.id));let done=false;
  for(const id of targets){if(done)break;for(const o of officers){const relation=s.diplomacy[pair(f.id,id)].relation,c=s.castles.find(c=>c.id===o.locationCastleId),war=s.wars[pair(f.id,id)],weak=s.castles.filter(c=>c.ownerFactionId===f.id).reduce((n,c)=>n+c.troops,0)<s.castles.filter(c=>c.ownerFactionId===id).reduce((n,c)=>n+c.troops,0),needsFood=c.food<Math.ceil(c.troops/100)*6;let type;if(war?.active){if(id!==s.playerFactionId&&!surrenderReason(s,{factionId:f.id,targetFactionId:id}))type='surrender';else{if(!weak&&s.turn-war.sinceTurn<6)continue;type='truce';}}else if(id!==s.playerFactionId&&active(s,f.id,id)&&c.troops<600&&c.gold>=300&&!aidReason(s,{factionId:f.id,targetFactionId:id}))type='aid';else if(id!==s.playerFactionId&&relation>=20&&needsFood&&c.gold>=400&&(capital(s,id)?.food||0)>=150+Math.ceil((capital(s,id)?.troops||0)/100)*6)type='trade';else if(!active(s,f.id,id))type=relation>=30?'alliance':'goodwill';else continue;const q={type,factionId:f.id,targetFactionId:id,officerId:o.id,castleId:o.locationCastleId};if(can(s,q,rules))continue;if(type==='goodwill'&&(c.food<Math.ceil(c.troops/100)*3||c.gold<200))continue;if(['alliance','truce'].includes(type)&&id===s.playerFactionId&&s.offers.some(x=>x.from===f.id))continue;s.diplomacyCommands.push(q);s.aiLog.push({turn:s.turn,factionId:f.id,castleId:c.id,candidates:[],chosen:'diplomacy',reason:({alliance:'隣国との同盟で国境を安定',goodwill:'備蓄と金を残し隣国との関係を改善',truce:'兵力差または長期戦を考慮して停戦を提案',trade:'金の余裕を使い、余剰兵糧がある隣国と交易',aid:'同盟国の備蓄を残して補充兵を要請',surrender:'最後の一城に兵力差を示し降伏を勧告'})[type],targetFactionId:id});done=true;break;}}
 }
}
function resolve(s,random){
 const logs=[];for(const q of s.diplomacyCommands){const d=s.diplomacy[pair(q.factionId,q.targetFactionId)];let result;
  const source=s.castles.find(c=>c.id===q.castleId),actor=s.officers.find(o=>o.id===q.officerId);if(!W().aliveFaction(s,q.targetFactionId)||(['truce','surrender'].includes(q.type)?!W().atWar(s,q.factionId,q.targetFactionId):W().atWar(s,q.factionId,q.targetFactionId))||source.ownerFactionId!==q.factionId||actor.status!=='active'||actor.factionId!==q.factionId||actor.locationCastleId!==source.id||source.gold<price(q)){logs.push({...q,result:'戦況または所属の変化で交渉中止',relation:d.relation});continue;}
  if(q.type==='goodwill'){s.castles.find(c=>c.id===q.castleId).gold-=COST;d.relation=Math.min(100,d.relation+10);result='贈物で関係+10';}
  else if(q.type==='aid'){const error=aidReason(s,q);if(error)result='援軍要請中止：'+error;else if(random(s)*100<chance(s,q)){const donor=capital(s,q.targetFactionId);source.gold-=100;donor.gold+=100;source.troops+=300;donor.troops-=300;source.food+=100;donor.food-=100;result='援軍到着：補充兵300・兵糧100（支援金100）';}else result='援軍要請は不成立（資源移動なし）';}
  else if(q.type==='surrender'){const error=surrenderReason(s,q);if(error)result='降伏勧告中止：'+error;else if(random(s)*100<chance(s,q)){annex(s,q);result='降伏成立：最後の一城と現役家臣を編入';}else result='降伏勧告は拒否された';}
  else if(q.type==='trade'){const target=capital(s,q.targetFactionId);if(d.relation<20||!target||target.food<150)result='交換用の兵糧または関係の変化で交易中止';else if(random(s)*100<chance(s,q)){source.gold-=100;target.gold+=100;source.food+=150;target.food-=150;result='交易成立：金100と兵糧150を交換';}else result='交易は不成立（交換なし）';}
  else if(q.type==='truce'){if(q.targetFactionId===s.playerFactionId){if(!s.offers.some(o=>o.from===q.factionId))s.offers.push({id:`offer-${s.turn}-${q.factionId}`,type:'truce',from:q.factionId,to:s.playerFactionId,expiresTurn:s.turn+2});result='6か月の停戦提案を送付（返答待ち）';}else if(random(s)*100<chance(s,q)){signTruce(s,q.factionId,q.targetFactionId,s.turn+7);result='6か月の停戦成立';}else result='停戦交渉は不成立';}
  else if(active(s,q.factionId,q.targetFactionId))result='他の交渉で同盟成立済み';
  else if(allies(s,q.factionId)>=2||allies(s,q.targetFactionId)>=2)result='交渉時に同盟上限へ到達';
  else if(q.targetFactionId===s.playerFactionId){if(!s.offers.some(o=>o.from===q.factionId))s.offers.push({id:`offer-${s.turn}-${q.factionId}`,from:q.factionId,to:s.playerFactionId,expiresTurn:s.turn+2});result='同盟提案を送付（返答待ち）';}
  else if(random(s)*100<chance(s,q)){d.allianceUntil=s.turn+13;result='12か月の同盟成立';}else result='同盟交渉は不成立';
  logs.push({...q,result,relation:d.relation});
 }s.diplomacyCommands=[];return logs;
}
function respond(s,id,accept){const n=clone(s),o=n.offers.find(o=>o.id===id);if(!o||o.expiresTurn<n.turn)throw new Error('提案の期限が切れています');if(n.ending)throw new Error('この戦記は終了しています');if(accept){
 if(!W().aliveFaction(n,o.from)||!W().aliveFaction(n,o.to))throw new Error('戦況の変化により提案は無効です');
 if(n.militaryCommands.some(q=>pair(q.factionId,n.castles.find(c=>c.id===q.targetCastleId).ownerFactionId)===pair(o.from,o.to)))throw new Error('相手への出陣予約を取り消してから受諾してください');
 if(n.diplomacyCommands.some(q=>pair(q.factionId,q.targetFactionId)===pair(o.from,o.to)))throw new Error('相手への外交予約を取り消してから受諾してください');
 if(o.type==='truce'){if(!W().atWar(n,o.from,o.to))throw new Error('すでに交戦していません');signTruce(n,o.from,o.to,n.turn+6);}
 else{if(W().atWar(n,o.from,o.to))throw new Error('戦況の変化により提案は無効です');if(allies(n,o.from)>=2||allies(n,o.to)>=2)throw new Error('同盟数の上限に達しています');n.diplomacy[pair(o.from,o.to)].allianceUntil=n.turn+12;}
 }n.offers=n.offers.filter(x=>x.id!==id);return n;}
function migrate(s){if(s.buildContract==='domestic-prototype-1'){s=clone(s);init(s);s.buildContract='diplomacy-prototype-2';}return s;}
root.YabouDiplomacy={pair,init,active,truce,labels,price,aidReason,surrenderReason,allies,reserved,can,queue,chance,validate,planAI,resolve,respond,migrate};
})(globalThis);
