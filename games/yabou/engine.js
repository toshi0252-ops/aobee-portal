(function(root){
'use strict';
const CONTRACT='diplomacy-prototype-2';
const D=root.YabouDiplomacy;
const clone=x=>JSON.parse(JSON.stringify(x));
const types=['cultivate','commerce','fortify','recruit'];
const labels={cultivate:'開墾',commerce:'商業振興',fortify:'城防整備',recruit:'徴兵'};
const fail=m=>{throw new Error(m)};
function validateMaster(m){
 const errors=[];
 for(const [k,n] of Object.entries({factions:6,castles:12,roads:16,officers:24,events:8})){
  if(!Array.isArray(m[k])||m[k].length!==n) errors.push(k+'件数');
  else if(new Set(m[k].map(x=>x.id)).size!==n)errors.push(k+'ID重複');
 }
 if(errors.length)return errors;
 const cs=new Set(m.castles.map(c=>c.id)),fs=new Set(m.factions.map(f=>f.id)),edges=new Set();
 for(const c of m.castles){if(!fs.has(c.ownerFactionId))errors.push('城所属'); if(![c.x,c.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1000))errors.push('座標');}
 for(const f of m.factions)if(!m.castles.some(c=>c.id===f.capitalCastleId&&c.ownerFactionId===f.id))errors.push('首都');
 for(const o of m.officers)if(!fs.has(o.factionId)||Object.values(o.stats).some(v=>!Number.isInteger(v)||v<0||v>100))errors.push('武将');
 for(const r of m.roads){const e=[r.fromCastleId,r.toCastleId].sort().join(':'); if(!cs.has(r.fromCastleId)||!cs.has(r.toCastleId)||r.fromCastleId===r.toCastleId||edges.has(e))errors.push('街道'); edges.add(e);}
 const seen=new Set([m.castles[0].id]);let size;
 do{size=seen.size;for(const r of m.roads){if(seen.has(r.fromCastleId))seen.add(r.toCastleId);if(seen.has(r.toCastleId))seen.add(r.fromCastleId);}}while(seen.size!==size);
 if(seen.size!==12)errors.push('非連結');return errors;
}
function createInitialState(m,factionId,seed=12345){
 const errors=validateMaster(m);if(errors.length)fail(errors.join('・'));
 if(!m.factions.some(f=>f.id===factionId))fail('勢力が存在しません');
 const s={schemaVersion:'1.2.0',buildContract:CONTRACT,scenarioId:'S01',year:1,month:1,turn:1,seed:seed>>>0,rngState:(seed>>>0)||1,playerFactionId:factionId,factions:clone(m.factions),castles:clone(m.castles),officers:clone(m.officers),commands:[],reports:[],aiLog:[],eventFlags:{},annualReports:[]};
 for(const f of s.factions){const os=s.officers.filter(o=>o.factionId===f.id);const second=s.castles.find(c=>c.ownerFactionId===f.id&&c.id!==f.capitalCastleId);os.forEach((o,i)=>{o.locationCastleId=i<2?f.capitalCastleId:second.id;o.loyalty=o.role==='大名'?100:80;o.status='active';});}
 return D.init(s);
}
function random(s){let x=s.rngState;x^=x<<13;x^=x>>>17;x^=x<<5;s.rngState=x>>>0;return s.rngState/4294967296;}
function canIssueCommand(s,q,rules){
 if(!q||!types.includes(q.type))return '未対応の命令です';
 const c=s.castles.find(c=>c.id===q.castleId),o=s.officers.find(o=>o.id===q.officerId);
 if(!c||!o)return '城または武将が存在しません';
 if(c.ownerFactionId!==q.factionId||o.factionId!==q.factionId||o.locationCastleId!==c.id||o.status!=='active')return '所属・配置が一致しません';
 if([...s.commands,...s.diplomacyCommands].some(x=>x.officerId===o.id))return '担当武将は今月の任務を予約済みです';
 const pending=s.commands.filter(x=>x.castleId===c.id);
 if(pending.length+s.diplomacyCommands.filter(x=>x.castleId===c.id).length>=2)return 'この城の命令枠は使用済みです';
 if(pending.some(x=>x.type===q.type))return '同じ施策は城ごとに月1回です';
 const rule=rules.commands[q.type];
 for(const k of Object.keys(rule.delta)){if(rule.delta[k]>0&&rule.cap&&c[k]>=rule.cap)return 'すでに上限です';}
 for(const [k,cost]of Object.entries(rule.cost)){const reserved=pending.reduce((a,x)=>a+(rules.commands[x.type].cost[k]||0),0);if(c[k]-reserved-(k==='gold'?D.reserved(s,c.id):0)<cost)return (k==='gold'?'金':'兵糧')+'が不足しています';}
 return null;
}
function queueCommand(s,q,rules){const error=canIssueCommand(s,q,rules);if(error)fail(error);const n=clone(s);n.commands.push(clone(q));return n;}
function validateState(s,m,rules){
 if(!s||s.schemaVersion!=='1.2.0'||s.buildContract!==CONTRACT)fail('このセーブの版には対応していません');
 if(s.scenarioId!=='S01'||!Number.isInteger(s.turn)||s.turn<1||s.year!==Math.floor((s.turn-1)/12)+1||s.month!==(s.turn-1)%12+1)fail('年月が不正です');
 for(const k of ['seed','rngState'])if(!Number.isInteger(s[k])||s[k]<0||s[k]>4294967295||(k==='rngState'&&s[k]===0))fail('乱数状態が不正です');
 for(const k of ['factions','castles','officers']){if(!Array.isArray(s[k])||s[k].length!==m[k].length||new Set(s[k].map(x=>x.id)).size!==m[k].length||s[k].some(x=>!m[k].some(y=>y.id===x.id)))fail('ID参照が不正です');}
 const fs=s.factions.map(f=>f.id);if(!fs.includes(s.playerFactionId))fail('操作勢力が不正です');
 for(const f of s.factions)if(!s.castles.some(c=>c.id===f.capitalCastleId&&c.ownerFactionId===f.id)||f.trait!==m.factions.find(x=>x.id===f.id).trait)fail('勢力情報が不正です');
 for(const c of s.castles){if(!fs.includes(c.ownerFactionId))fail('城所属が不正です');for(const k of ['gold','food','troops','farm','commerce','defense','publicOrder'])if(!Number.isSafeInteger(c[k])||c[k]<0||(['farm','commerce','defense','publicOrder'].includes(k)&&c[k]>100))fail('資源が不正です');const original=m.castles.find(x=>x.id===c.id);if(c.x!==original.x||c.y!==original.y)fail('座標が不正です');}
 for(const o of s.officers){if(!fs.includes(o.factionId)||!s.castles.some(c=>c.id===o.locationCastleId&&c.ownerFactionId===o.factionId)||o.status!=='active'||!Number.isInteger(o.loyalty)||o.loyalty<0||o.loyalty>100)fail('武将配置が不正です');if(JSON.stringify(o.stats)!==JSON.stringify(m.officers.find(x=>x.id===o.id).stats))fail('能力値が不正です');}
 for(const k of ['commands','reports','annualReports','aiLog'])if(!Array.isArray(s[k]))fail('履歴が不正です');
 for(const report of [...s.reports,...s.annualReports.flatMap(a=>{if(!Number.isInteger(a.year)||a.year<1||!Array.isArray(a.reports)||a.reports.length!==12)fail('年次報告が不正です');return a.reports;})]){
 if(!Number.isInteger(report.turn)||report.turn<1||report.turn>=s.turn||report.year!==Math.floor((report.turn-1)/12)+1||report.month!==(report.turn-1)%12+1||!Array.isArray(report.entries)||report.entries.length!==12||new Set(report.entries.map(x=>x.castleId)).size!==12||!Array.isArray(report.commands))fail('月末報告が不正です');
 for(const x of report.entries)if(!m.castles.some(c=>c.id===x.castleId)||!fs.includes(x.factionId)||['income','use','shortage','harvest'].some(k=>!Number.isSafeInteger(x[k])||x[k]<0))fail('収支履歴が不正です');
 if(report.diplomacy!==undefined&&(!Array.isArray(report.diplomacy)||report.diplomacy.some(q=>!fs.includes(q.factionId)||!fs.includes(q.targetFactionId)||typeof q.result!=='string')))fail('外交履歴が不正です');
 for(const q of report.commands)if(!types.includes(q.type)||!m.castles.some(c=>c.id===q.castleId)||!m.officers.some(o=>o.id===q.officerId)||!fs.includes(q.factionId))fail('命令履歴が不正です');
 }
 for(const x of s.aiLog)if(!Number.isInteger(x.turn)||!fs.includes(x.factionId)||!m.castles.some(c=>c.id===x.castleId)||!Array.isArray(x.candidates)||x.candidates.some(c=>typeof c.type!=='string'||!Number.isFinite(c.score))||typeof x.reason!=='string')fail('AI履歴が不正です');
 if(!s.eventFlags||typeof s.eventFlags!=='object'||Array.isArray(s.eventFlags))fail('イベント履歴が不正です');
 D.validate(s,m,rules);
 const trial=clone(s);trial.commands=[];for(const q of s.commands){if(q.factionId!==s.playerFactionId)fail('他勢力の命令です');const e=canIssueCommand(trial,q,rules);if(e)fail(e);trial.commands.push(q);}
 return true;
}
function planAI(s,rules){
 for(const f of [...s.factions].sort((a,b)=>a.id.localeCompare(b.id))){if(f.id===s.playerFactionId)continue;
  for(const c of s.castles.filter(c=>c.ownerFactionId===f.id).sort((a,b)=>a.id.localeCompare(b.id))){
   for(const o of s.officers.filter(o=>o.locationCastleId===c.id).sort((a,b)=>b.stats.politics-a.stats.politics||a.id.localeCompare(b.id))){
    const candidates=types.map(type=>{let score=0,reason='';
     if(type==='cultivate'){score=45-c.farm*.3+(c.food/Math.max(1,Math.ceil(c.troops/100))<3?100:0)+(f.trait==='agriculture'?15:0);reason='備蓄と秋収穫を確保';}
     if(type==='commerce'){score=55-c.commerce*.35+(f.trait==='commerce'?15:0);reason='継続収入を増やす';}
     if(type==='fortify'){score=18-c.defense*.1;reason='城防を整備';}
     if(type==='recruit'){score=c.troops<1400&&c.food>250&&c.publicOrder>=55?20+(f.trait==='military'?10:0): -100;reason='備蓄の範囲で兵力を確保';}
     return {type,score,reason,q:{type,castleId:c.id,officerId:o.id,factionId:f.id}};
    }).filter(x=>x.score>0&&!canIssueCommand(s,x.q,rules)).sort((a,b)=>b.score-a.score||a.type.localeCompare(b.type));
    if(!candidates.length)continue;const top=candidates.filter(x=>x.score===candidates[0].score);const chosen=top[Math.floor(random(s)*top.length)];s.commands.push(chosen.q);s.aiLog.push({turn:s.turn,factionId:f.id,castleId:c.id,candidates:candidates.slice(0,3).map(x=>({type:x.type,score:x.score})),chosen:chosen.type,reason:chosen.reason});
   }
  }
 }
}
function advanceMonth(state,m,rules){
 validateState(state,m,rules);const s=clone(state);D.planAI(s,m,rules);planAI(s,rules);const report={turn:s.turn,year:s.year,month:s.month,entries:[],commands:clone(s.commands)};
 for(const q of s.commands){const c=s.castles.find(c=>c.id===q.castleId),r=rules.commands[q.type];for(const [k,v]of Object.entries(r.cost))c[k]-=v;for(const[k,v]of Object.entries(r.delta)){c[k]+=v;if(r.cap&&v>0)c[k]=Math.min(r.cap,c[k]);if(r.floor&&k in r.floor)c[k]=Math.max(r.floor[k],c[k]);}}
 for(const c of s.castles){const f=s.factions.find(f=>f.id===c.ownerFactionId);const use=Math.ceil(c.troops/100),shortage=Math.max(0,use-c.food);c.food=Math.max(0,c.food-use);const income=Math.floor(c.commerce*1.5*(f.trait==='commerce'?1.1:1));c.gold+=income;const harvest=s.month===9?Math.floor(c.farm*8*(f.trait==='agriculture'?1.1:1)):0;c.food+=harvest;report.entries.push({castleId:c.id,factionId:c.ownerFactionId,income,use,shortage,harvest});}
 report.diplomacy=D.resolve(s,random);s.reports.push(report);if(s.month===12)s.annualReports.push({year:s.year,reports:clone(s.reports.slice(-12))});
 s.commands=[];s.turn++;s.month=(s.turn-1)%12+1;s.year=Math.floor((s.turn-1)/12)+1;s.aiLog=s.aiLog.slice(-1000);s.reports=s.reports.slice(-120);s.annualReports=s.annualReports.slice(-10);validateState(s,m,rules);return s;
}
root.Yabou={labels,types,clone,validateMaster,createInitialState,canIssueCommand,queueCommand,advanceMonth,validateState,serializeSave:(s,m,r)=>{validateState(s,m,r);return JSON.stringify(s)},loadSave:(t,m,r)=>{const s=D.migrate(JSON.parse(t));validateState(s,m,r);return s}};
})(globalThis);
