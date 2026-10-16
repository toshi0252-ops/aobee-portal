(function(root){
'use strict';
const rewards={100:5,250:10,500:18};
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const pair=(a,b)=>[a,b].sort().join(':');
const label=n=>n>=80?'忠臣':n>=60?'安定':n>=40?'不満':n>=20?'危険':'深刻';
function init(s){
 if(s.personnel&&!Object.hasOwn(s.personnel,'loyalty'))s.personnel.loyalty={version:1,bonds:{}};
 return s;
}
function bond(s,a,b){return a===b?0:s.personnel.loyalty.bonds[pair(a,b)]?.value||0;}
function addBond(s,a,b,delta){
 if(a===b)return;
 const bonds=s.personnel.loyalty.bonds,key=pair(a,b),previous=bonds[key];
 bonds[key]={value:clamp((previous?.value||0)+delta,-100,100),tags:previous?.tags||[],lastTurn:s.turn};
}
function canReward(s,q){
 if(!Object.hasOwn(rewards,q.offer))return '褒賞は100・250・500金から選んでください';
 if(!Number.isInteger(q.offer))return '褒賞額が不正です';
 const t=s.officers.find(o=>o.id===q.targetId);
 if(!t||t.status!=='active'||t.factionId!==q.factionId||t.locationCastleId!==q.castleId)return 'この城の自家の家臣を選んでください';
 if(t.role==='大名'||t.id===q.officerId)return '大名や担当武将本人への褒賞は予約できません';
 if(t.loyalty>=100)return '忠誠はすでに上限です';
 if(s.commands.some(x=>x.type==='reward'&&x.targetId===t.id))return 'この家臣の褒賞は予約済みです';
 return null;
}
function reward(s,q){
 const t=s.officers.find(o=>o.id===q.targetId),before=t.loyalty;
 t.loyalty=clamp(t.loyalty+rewards[q.offer],0,100);addBond(s,q.officerId,t.id,3);
 return t.name+'へ'+q.offer+'金の褒賞。忠誠 '+before+'→'+t.loyalty+'（'+label(t.loyalty)+'）、担当者との関係 +3。';
}
function month(s,report){
 for(const o of s.officers){
  if(o.status!=='active'||o.role==='大名')continue;
  const c=s.castles.find(c=>c.id===o.locationCastleId&&c.ownerFactionId===o.factionId);
  if(!c)continue;
  const shortage=report.entries.find(x=>x.castleId===c.id)?.shortage||0;
  let delta=0;const reasons=[];
  if(shortage){delta-=(o.duty??50)>=80?2:3;reasons.push('兵糧不足');}
  if(c.publicOrder<40){delta--;reasons.push('民心低下');}
  if(!delta&&s.month%3===0&&c.publicOrder>=70){delta=1;reasons.push('領内の安定');}
  const before=o.loyalty;o.loyalty=clamp(before+delta,0,100);
  if(o.loyalty===before)continue;
  const entry={turn:s.turn,factionId:o.factionId,castleId:c.id,text:o.name+'：忠誠 '+before+'→'+o.loyalty+'（'+label(o.loyalty)+' / '+reasons.join('・')+'）。'};
  s.personnel.log.push(entry);(report.personnel??=[]).push(entry);
 }
 s.personnel.log=s.personnel.log.slice(-200);
}
function validate(s){
 const v=s.personnel?.loyalty,fail=()=>{throw Error('忠誠・関係の保存情報が不正です');};
 if(!v||v.version!==1||!v.bonds||typeof v.bonds!=='object'||Array.isArray(v.bonds))fail();
 const ids=new Set(s.officers.map(o=>o.id)),tags=['friend','mentor','kin','rival','enemy','trust'];
 if(Object.keys(v.bonds).length>ids.size*(ids.size-1)/2)fail();
 for(const [key,b]of Object.entries(v.bonds)){
  const [a,c]=key.split(':');
  if(!ids.has(a)||!ids.has(c)||a===c||key!==pair(a,c)||!b||!Number.isInteger(b.value)||b.value< -100||b.value>100||!Array.isArray(b.tags)||new Set(b.tags).size!==b.tags.length||b.tags.some(t=>!tags.includes(t))||!Number.isInteger(b.lastTurn)||b.lastTurn<1||b.lastTurn>=s.turn)fail();
 }
}
root.YabouLoyalty={rewards,label,init,bond,addBond,canReward,reward,month,validate};
if(typeof module!=='undefined'&&module.exports)module.exports=root.YabouLoyalty;
})(globalThis);
