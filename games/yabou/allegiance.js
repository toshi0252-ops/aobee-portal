(function(root){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=(s,id)=>{let n=(s.seed^Math.imul(s.turn,2654435761))>>>0;for(const c of id)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n%100;};
function init(s){if(s.personnel&&!Object.hasOwn(s.personnel,'allegiance'))s.personnel.allegiance={version:1,records:{},attempts:{},log:[]};return s;}
function border(s,a,b){return (root.YabouMaps?.resolve(s)||root.YABOU_DATA).roads.some(r=>{const x=s.castles.find(c=>c.id===r.fromCastleId).ownerFactionId,y=s.castles.find(c=>c.id===r.toCastleId).ownerFactionId;return x===a&&y===b||x===b&&y===a;});}
function record(s,o){const v=s.personnel.allegiance.records;let r=v[o.id];if(!r||r.factionId!==o.factionId){const old=r;r=v[o.id]={factionId:o.factionId,lowMonths:0,lastRewardTurn:0,lastTransferTurn:old?.lastTransferTurn||0,warningTurn:0,warningLoyalty:0};}return r;}
function reward(s,id){const o=s.officers.find(o=>o.id===id),r=record(s,o);r.lastRewardTurn=s.turn;r.lowMonths=0;r.warningTurn=0;r.warningLoyalty=0;}
function joined(s,id){const o=s.officers.find(o=>o.id===id),r=record(s,o);r.lastTransferTurn=s.turn;r.lowMonths=0;r.warningTurn=0;r.warningLoyalty=0;}
function cooldown(s,id){const r=s.personnel.allegiance.records[id];return r?.lastTransferTurn?Math.max(0,3-(s.turn-r.lastTransferTurn)):0;}
function canPoach(s,q){
 const t=s.officers.find(o=>o.id===q.targetId);
 if(![100,250,500].includes(q.offer))return '待遇金は100・250・500金から選んでください';
 if(!t||t.status!=='active'||t.role==='大名'||t.factionId===q.factionId||t.factionId!==q.targetFactionId)return '他家の現役家臣を選んでください（大名・捕虜・浪人は対象外）';
 if(t.loyalty>=60)return '忠誠60以上の家臣は引き抜きに応じません';
 if(!border(s,q.factionId,t.factionId))return '隣接する勢力の家臣だけが交渉対象です';
 if(root.YabouDiplomacy.active(s,q.factionId,t.factionId))return '同盟中の勢力からは引き抜けません';
 if(cooldown(s,t.id))return '仕官先を変えた直後です。あと'+cooldown(s,t.id)+'か月待ってください';
 const previous=s.personnel.allegiance.attempts[q.factionId+':'+t.id];if(previous&&s.turn-previous.turn<3)return '再交渉はあと'+(3-(s.turn-previous.turn))+'か月後です';
 if(s.commands.some(x=>x.type==='poach'&&x.targetId===t.id))return 'この家臣への交渉は予約済みです';
 return null;
}
function chance(s,q){const a=s.officers.find(o=>o.id===q.officerId),t=s.officers.find(o=>o.id===q.targetId);if(!a||!t)return 0;const r=s.personnel.allegiance.records[t.id],recent=r?.factionId===t.factionId&&r.lastRewardTurn>0&&s.turn-r.lastRewardTurn<=2;return Math.round(clamp(25+a.stats.charisma*.25+a.stats.politics*.1+q.offer/25+(40-t.loyalty)*.5+((t.ambition??50)-50)*.2-((t.duty??50)-50)*.3+root.YabouLoyalty.bond(s,a.id,t.id)*.15-(recent?20:0),5,75));}
function log(s,report,o,from,to,kind,castleId,text){s.personnel.allegiance.log.push({turn:s.turn,officerId:o.id,fromFactionId:from,toFactionId:to,kind,castleId,text});const entry={turn:s.turn,factionId:from,castleId,text};s.personnel.log.push(entry);(report.personnel??=[]).push(entry);if(to&&to!==from){const other={...entry,factionId:to};s.personnel.log.push(other);report.personnel.push(other);}}
function resolve(s,report){
 const jobs=s.commands.filter(q=>q.type==='poach');
 for(const q of jobs){const a=s.officers.find(o=>o.id===q.officerId),t=s.officers.find(o=>o.id===q.targetId),home=s.castles.find(c=>c.id===q.castleId),from=q.targetFactionId;
  const invalid=!a||a.status!=='active'||a.factionId!==q.factionId||a.locationCastleId!==q.castleId||home.ownerFactionId!==q.factionId;
  const view={...s,commands:s.commands.filter(x=>x!==q)},reason=invalid?'担当者または出発城の状況が変わった':canPoach(view,q);
  const key=q.factionId+':'+q.targetId,old=s.personnel.allegiance.attempts[key];s.personnel.allegiance.attempts[key]={turn:s.turn,count:(old?.count||0)+1};
  if(reason){log(s,report,t,q.factionId,null,'failed',q.castleId,t.name+'への引き抜きは不成立。'+reason+'。待遇金は消費した。');continue;}
  const rate=chance(s,q);
  if(hash(s,q.factionId+':'+t.id+':poach')>=rate){log(s,report,t,q.factionId,null,'failed',q.castleId,t.name+'は引き抜きを断った。待遇金は消費し、3か月後から再交渉できる。');continue;}
  const ruler=s.officers.find(o=>o.role==='大名'&&o.factionId===from&&o.status==='active');if(ruler)root.YabouLoyalty.addBond(s,ruler.id,t.id,-10);
  s.diplomacy[root.YabouDiplomacy.pair(from,q.factionId)].relation=Math.max(-100,s.diplomacy[root.YabouDiplomacy.pair(from,q.factionId)].relation-10);t.factionId=q.factionId;t.locationCastleId=q.castleId;t.loyalty=Math.min(75,60+Math.floor(q.offer/50));root.YabouLoyalty.addBond(s,a.id,t.id,5);const r=record(s,t);r.lastTransferTurn=s.turn;
  log(s,report,t,from,q.factionId,'poach',q.castleId,t.name+'が引き抜きに応じて仕官した。兵・城・備蓄は移さず、忠誠は'+t.loyalty+'。');
 }
}
function risk(s,o){const r=s.personnel.allegiance.records[o.id];if(!r||r.factionId!==o.factionId||o.status!=='active'||o.role==='大名'||o.loyalty>=40||r.lowMonths<3||!r.warningTurn||r.warningTurn>=s.turn||o.loyalty>r.warningLoyalty||r.lastRewardTurn>0&&s.turn-r.lastRewardTurn<=2||cooldown(s,o.id)||((o.duty??50)>=80&&o.loyalty>=20))return 0;return Math.round(clamp((40-o.loyalty)*.6+((o.ambition??50)-50)*.25-((o.duty??50)-50)*.3+r.lowMonths*2,5,45));}
function month(s,report){
 for(const o of s.officers){if(o.status!=='active'||o.role==='大名'){const old=s.personnel.allegiance.records[o.id];if(old){old.lowMonths=0;old.warningTurn=0;old.warningLoyalty=0;}continue;}const r=record(s,o);if(o.loyalty>=40){r.lowMonths=0;r.warningTurn=0;r.warningLoyalty=0;continue;}r.lowMonths=Math.min(120,r.lowMonths+1);
  const rate=risk(s,o);
  if(rate&&hash(s,o.id+':departure')<rate){const from=o.factionId,castle=o.locationCastleId;o.status='ronin';o.factionId=null;o.locationCastleId=null;o.loyalty=50;const known=s.personnel.known[from]??=[];if(!known.includes(o.id))known.push(o.id);const next=record(s,o);next.lastTransferTurn=s.turn;log(s,report,o,from,null,'departure',castle,o.name+'が出奔した。兵や城は持ち出していない。3か月後から、発見済みの浪人として再登用を交渉できる。');continue;}
  if(r.lowMonths>=2&&!r.warningTurn){r.warningTurn=s.turn;r.warningLoyalty=o.loyalty;log(s,report,o,o.factionId,null,'warning',o.locationCastleId,o.name+'の不満が続いている。褒賞などで忠誠を改善しなければ、来月以降に出奔するおそれがある。');}
 }
 s.personnel.allegiance.log=s.personnel.allegiance.log.slice(-200);s.personnel.log=s.personnel.log.slice(-200);
}
function validate(s){const v=s.personnel?.allegiance,fail=()=>{throw Error('引き抜き・離反の保存情報が不正です');},obj=x=>x&&typeof x==='object'&&!Array.isArray(x),ids=new Set(s.officers.map(o=>o.id)),fs=new Set(s.factions.map(f=>f.id)),turn=n=>Number.isSafeInteger(n)&&n>=0&&n<=s.turn;
 if(!obj(v)||v.version!==1||!obj(v.records)||!obj(v.attempts)||!Array.isArray(v.log)||v.log.length>200)fail();
 for(const [id,r]of Object.entries(v.records))if(!ids.has(id)||!obj(r)||r.factionId!==null&&!fs.has(r.factionId)||!Number.isInteger(r.lowMonths)||r.lowMonths<0||r.lowMonths>120||!turn(r.lastRewardTurn)||!turn(r.lastTransferTurn)||!turn(r.warningTurn)||!Number.isInteger(r.warningLoyalty)||r.warningLoyalty<0||r.warningLoyalty>100)fail();
 for(const [key,a]of Object.entries(v.attempts)){const [f,id]=key.split(':');if(key!==f+':'+id||!fs.has(f)||!ids.has(id)||!obj(a)||!turn(a.turn)||a.turn<1||!Number.isSafeInteger(a.count)||a.count<1||a.count>s.turn)fail();}
 for(const h of v.log)if(!obj(h)||!turn(h.turn)||h.turn<1||!ids.has(h.officerId)||!fs.has(h.fromFactionId)||h.toFactionId!==null&&!fs.has(h.toFactionId)||!['failed','poach','warning','departure'].includes(h.kind)||!s.castles.some(c=>c.id===h.castleId)||typeof h.text!=='string'||h.text.length>300)fail();
}
root.YabouAllegiance={init,border,reward,joined,cooldown,canPoach,chance,resolve,risk,month,validate};if(typeof module!=='undefined'&&module.exports)module.exports=root.YabouAllegiance;
})(globalThis);
