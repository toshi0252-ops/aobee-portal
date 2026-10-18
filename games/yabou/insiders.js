(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function init(s){if(!Object.hasOwn(s.personnel,'insiders'))s.personnel.insiders={version:1,pledges:[],history:[]};return s;}
function reason(s,p){const t=s.officers.find(o=>o.id===p.targetId),c=s.castles.find(c=>c.id===p.targetCastleId),D=root.YabouDiplomacy,A=root.YabouAllegiance;
 if(!t||t.status!=='active'||t.role==='大名'||t.factionId!==p.targetFactionId||t.locationCastleId!==p.targetCastleId||c.ownerFactionId!==p.targetFactionId)return '対象の所属・配置が変わった';
 if(t.loyalty>=60)return '対象の忠誠が60以上へ回復した';
 const r=s.personnel.allegiance.records[t.id];if(r?.factionId===t.factionId&&r.lastRewardTurn>p.startTurn)return '約束の後に褒賞を受けた';
 if(!root.YabouMilitary.aliveFaction(s,p.factionId)||!A.border(s,p.factionId,p.targetFactionId)||D.active(s,p.factionId,p.targetFactionId)||D.truce(s,p.factionId,p.targetFactionId))return '国境・同盟・停戦の状況が変わった';
 return null;
}
function threatened(s,f,c){return s.personnel.insiders.pledges.some(p=>p.targetFactionId===f&&p.targetCastleId===c&&p.expiresTurn>s.turn&&!reason(s,p));}
function add(s,q){const p={id:q.id,factionId:q.factionId,targetFactionId:q.targetFactionId,targetCastleId:q.targetCastleId,targetId:q.targetId,startTurn:s.turn,expiresTurn:s.turn+4};s.personnel.insiders.pledges.push(p);const t=s.officers.find(o=>o.id===p.targetId),text=t.name+'との内応の約束が成立。次の3か月以内に本人が対象城の守備へ参加すれば、その部隊の士気を一度だけ15下げる。所属・兵・城は今は変わらない。';root.YabouBiography.add(s,t.id,p.id+':pledge','event',text);return text;}
function finish(s,p,result,text,report,battleId=null){s.personnel.insiders.pledges=s.personnel.insiders.pledges.filter(x=>x.id!==p.id);const v=s.personnel.insiders;v.history.push({...clone(p),resolvedTurn:s.turn,result,battleId,text});v.history=v.history.slice(-120);for(const factionId of [p.factionId,p.targetFactionId]){const entry={turn:s.turn,factionId,castleId:p.targetCastleId,text};s.personnel.log.push(entry);if(report)(report.personnel??=[]).push(entry);}s.personnel.log=s.personnel.log.slice(-200);root.YabouBiography.add(s,p.targetId,p.id+':'+result,'event',text);}
function counter(s,q,report){for(const p of [...s.personnel.insiders.pledges].filter(p=>p.targetFactionId===q.factionId&&p.targetCastleId===q.castleId))finish(s,p,'blocked','城内の内通の疑いに対処し、内応の約束を破棄させた。合戦への影響なし。',report);}
function month(s,report){for(const p of [...s.personnel.insiders.pledges]){const why=reason(s,p);if(why)finish(s,p,'cancelled','内応の約束を解消：'+why+'。合戦への影響なし。',report);else if(p.expiresTurn<=s.turn+1)finish(s,p,'expired','内応の約束は3か月の期限を終えた。合戦への影響なし。',report);}}
function battle(s,army,city,units,report,battleId){
 const choices=s.personnel.insiders.pledges.filter(p=>p.factionId===army.factionId&&p.targetFactionId===city.ownerFactionId&&p.targetCastleId===city.id&&p.startTurn<s.turn&&p.expiresTurn>s.turn&&units.some(u=>u.officerId===p.targetId)).sort((a,b)=>a.startTurn-b.startTurn||a.id.localeCompare(b.id));
 for(const p of choices){const why=reason(s,p);if(why){finish(s,p,'cancelled','内応の約束を解消：'+why+'。合戦への影響なし。',report);continue;}const unit=units.find(u=>u.officerId===p.targetId),before=unit.initialMorale;unit.initialMorale=Math.max(20,before-15);const text=unit.name+'が内応し、守備隊の指揮が乱れた。対象部隊の士気 '+before+'→'+unit.initialMorale+'。兵・所属の移動なし（この合戦で一度限り）。';finish(s,p,'used',text,report,battleId);return text;}return null;
}
function validate(s){const v=s.personnel.insiders,fail=()=>{throw Error('内応の保存情報が不正です');},fs=new Set(s.factions.map(f=>f.id)),cs=new Set(s.castles.map(c=>c.id)),ids=new Set(s.officers.map(o=>o.id)),turn=n=>Number.isSafeInteger(n)&&n>0&&n<=s.turn;
 if(!v||v.version!==1||!Array.isArray(v.pledges)||v.pledges.length>54||!Array.isArray(v.history)||v.history.length>120)fail();
 const valid=p=>p&&typeof p.id==='string'&&/^scheme:\d+:[FR]\d{2}:C\d{2}$/.test(p.id)&&Number(p.id.split(':')[1])>0&&Number(p.id.split(':')[1])<p.startTurn&&p.id.split(':')[2]===p.factionId&&p.id.split(':')[3]===p.targetCastleId&&fs.has(p.factionId)&&fs.has(p.targetFactionId)&&p.factionId!==p.targetFactionId&&cs.has(p.targetCastleId)&&ids.has(p.targetId)&&turn(p.startTurn)&&Number.isSafeInteger(p.expiresTurn)&&p.expiresTurn===p.startTurn+4;
 if(new Set([...v.pledges,...v.history].map(p=>p.id)).size!==v.pledges.length+v.history.length||new Set(v.pledges.map(p=>p.targetId)).size!==v.pledges.length)fail();
 for(const p of v.pledges)if(!valid(p)||p.expiresTurn<=s.turn)fail();let last=0;for(const p of v.history){if(!valid(p)||!turn(p.resolvedTurn)||p.resolvedTurn<p.startTurn||p.resolvedTurn<last||!['blocked','cancelled','expired','used'].includes(p.result)||typeof p.text!=='string'||p.text.length>300||(p.result==='used'?typeof p.battleId!=='string'||!p.battleId.startsWith('battle-'):p.battleId!==null))fail();last=p.resolvedTurn;}
}
root.YabouInsiders={init,reason,threatened,add,counter,month,battle,validate};if(typeof module!=='undefined')module.exports=root.YabouInsiders;
})(globalThis);
