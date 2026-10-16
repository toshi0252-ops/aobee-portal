(function(root){
'use strict';
const CONTRACT='battle-prototype-3';
const W=root.YabouMilitary,B=root.YabouBattle;
const D=root.YabouDiplomacy;
const L=root.YabouLoyalty||(typeof require==='function'?require('./loyalty.js'):null);
const X=root.YabouEvents||(typeof require==='function'?require('./events.js'):null);
const A=root.YabouAllegiance||(typeof require==='function'?require('./allegiance.js'):null);
const H=root.YabouBiography||(typeof require==='function'?require('./biography.js'):null);
const clone=x=>JSON.parse(JSON.stringify(x));
const types=['cultivate','commerce','fortify','recruit','search','hire','reward','poach'];
const labels={cultivate:'開墾',commerce:'商業振興',fortify:'城防整備',recruit:'徴兵',search:'武将探索',hire:'登用交渉',reward:'家臣への褒賞',poach:'他家の引き抜き'};
const fail=m=>{throw new Error(m)};
function validateMaster(m){
 const errors=[];
 for(const [k,n] of Object.entries({factions:6,castles:12,roads:16,officers:54,events:8})){
  if(!Array.isArray(m[k])||m[k].length!==n) errors.push(k+'件数');
  else if(new Set(m[k].map(x=>x.id)).size!==n)errors.push(k+'ID重複');
 }
 if(errors.length)return errors;
 const cs=new Set(m.castles.map(c=>c.id)),fs=new Set(m.factions.map(f=>f.id)),edges=new Set();
 for(const c of m.castles){if(!fs.has(c.ownerFactionId))errors.push('城所属'); if(![c.x,c.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1000))errors.push('座標');}
 for(const f of m.factions)if(!m.castles.some(c=>c.id===f.capitalCastleId&&c.ownerFactionId===f.id))errors.push('首都');
 for(const o of m.officers)if((o.factionId!==null&&!fs.has(o.factionId))||Object.values(o.stats).some(v=>!Number.isInteger(v)||v<0||v>100))errors.push('武将');
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
 for(const o of s.officers.filter(o=>o.id.startsWith('N'))){if(o.factionId){o.locationCastleId=s.factions.find(f=>f.id===o.factionId).capitalCastleId;o.status='active';o.loyalty=80;}else{o.locationCastleId=null;o.status='ronin';o.loyalty=50;}}s.personnel={known:{},attempts:{},log:[]};return H.init(W.init(D.init(A.init(L.init(X.start(s))))));
}
function random(s){let x=s.rngState;x^=x<<13;x^=x>>>17;x^=x<<5;s.rngState=x>>>0;return s.rngState/4294967296;}
function canIssueCommand(s,q,rules){
 if(s.ending)return 'この戦記は終了しています';
 if(!q||!types.includes(q.type))return '未対応の命令です';
 const c=s.castles.find(c=>c.id===q.castleId),o=s.officers.find(o=>o.id===q.officerId);
 if(!c||!o)return '城または武将が存在しません';
 if(c.ownerFactionId!==q.factionId||o.factionId!==q.factionId||o.locationCastleId!==c.id||o.status!=='active')return '所属・配置が一致しません';
 if(q.type==='search'&&(!['careful','normal','large'].includes(q.mode)))return '探索規模が不正です';
 if(q.type==='hire'){const t=s.officers.find(t=>t.id===q.targetId);if(!t||t.status!=='ronin'||!s.personnel?.known[q.factionId]?.includes(t.id))return '発見済みの浪人を選んでください';if(s.commands.some(x=>x.type==='hire'&&x.targetId===t.id))return '交渉予約済みです';if(!Number.isInteger(q.offer)||q.offer<0||q.offer>300)return '待遇金は0〜300です';}
 if(q.type==='poach'){const error=A.canPoach(s,q);if(error)return error;}
 if(q.type==='hire'&&A.cooldown(s,q.targetId))return '仕官先を変えた直後です。あと'+A.cooldown(s,q.targetId)+'か月待ってください';
 if(q.type==='reward'){const error=L.canReward(s,q);if(error)return error;}
 if(W.usedOfficers(s).includes(o.id)||[...s.commands,...s.diplomacyCommands].some(x=>x.officerId===o.id))return '担当武将は今月の任務を予約済みです';
 const pending=s.commands.filter(x=>x.castleId===c.id);
 if(pending.length+s.diplomacyCommands.filter(x=>x.castleId===c.id).length+W.count(s,c.id)>=2)return 'この城の命令枠は使用済みです';
 if(pending.some(x=>x.type===q.type))return '同じ施策は城ごとに月1回です';
 const rule=commandRule(q,rules);
 for(const k of Object.keys(rule.delta)){if(rule.delta[k]>0&&rule.cap&&c[k]>=rule.cap)return 'すでに上限です';}
 for(const [k,cost]of Object.entries(rule.cost)){const reserved=pending.reduce((a,x)=>a+(commandRule(x,rules).cost[k]||0),0);if(c[k]-reserved-(k==='gold'?D.reserved(s,c.id):k==='food'?W.food(s,c.id):0)<cost)return (k==='gold'?'金':'兵糧')+'が不足しています';}
 return null;
}
function commandRule(q,rules){return q.type==='search'?{cost:{gold:{careful:100,normal:250,large:500}[q.mode]},delta:{}}:['hire','reward','poach'].includes(q.type)?{cost:{gold:q.offer},delta:{}}:rules.commands[q.type];}
function queueCommand(s,q,rules){const error=canIssueCommand(s,q,rules);if(error)fail(error);const n=clone(s);n.commands.push(clone(q));return n;}
function validateState(s,m,rules){
 H.validate(s);
 if(!s||s.schemaVersion!=='1.2.0'||s.buildContract!==CONTRACT)fail('このセーブの版には対応していません');
 if(s.scenarioId!=='S01'||!Number.isInteger(s.turn)||s.turn<1||s.year!==Math.floor((s.turn-1)/12)+1||s.month!==(s.turn-1)%12+1)fail('年月が不正です');
 for(const k of ['seed','rngState'])if(!Number.isInteger(s[k])||s[k]<0||s[k]>4294967295||(k==='rngState'&&s[k]===0))fail('乱数状態が不正です');
 for(const k of ['factions','castles','officers']){if(!Array.isArray(s[k])||s[k].length!==m[k].length||new Set(s[k].map(x=>x.id)).size!==m[k].length||s[k].some(x=>!m[k].some(y=>y.id===x.id)))fail('ID参照が不正です');}
 const fs=s.factions.map(f=>f.id);if(!fs.includes(s.playerFactionId))fail('操作勢力が不正です');
 for(const f of s.factions)if((W.aliveFaction(s,f.id)?!s.castles.some(c=>c.id===f.capitalCastleId&&c.ownerFactionId===f.id):f.capitalCastleId!==null)||f.trait!==m.factions.find(x=>x.id===f.id).trait)fail('勢力情報が不正です');
 for(const c of s.castles){if(!fs.includes(c.ownerFactionId))fail('城所属が不正です');for(const k of ['gold','food','troops','farm','commerce','defense','publicOrder'])if(!Number.isSafeInteger(c[k])||c[k]<0||(['farm','commerce','defense','publicOrder'].includes(k)&&c[k]>100))fail('資源が不正です');const original=m.castles.find(x=>x.id===c.id);if(c.x!==original.x||c.y!==original.y)fail('座標が不正です');}
 for(const o of s.officers){
 const valid=o.status==='active'?fs.includes(o.factionId)&&s.castles.some(c=>c.id===o.locationCastleId&&c.ownerFactionId===o.factionId):o.status==='prisoner'?fs.includes(o.factionId)&&fs.includes(o.captorFactionId)&&s.castles.some(c=>c.id===o.locationCastleId&&c.ownerFactionId===o.captorFactionId):o.status==='ronin'?o.factionId===null&&o.locationCastleId===null:false;
 if(!valid||!Number.isInteger(o.loyalty)||o.loyalty<0||o.loyalty>100)fail('武将配置が不正です');if(JSON.stringify(o.stats)!==JSON.stringify(m.officers.find(x=>x.id===o.id).stats))fail('能力値が不正です');}
 for(const k of ['commands','reports','annualReports','aiLog'])if(!Array.isArray(s[k]))fail('履歴が不正です');
 for(const report of [...s.reports,...s.annualReports.flatMap(a=>{if(!Number.isInteger(a.year)||a.year<1||!Array.isArray(a.reports)||a.reports.length!==12)fail('年次報告が不正です');return a.reports;})]){
 if(!Number.isInteger(report.turn)||report.turn<1||report.turn>=s.turn||report.year!==Math.floor((report.turn-1)/12)+1||report.month!==(report.turn-1)%12+1||!Array.isArray(report.entries)||report.entries.length!==12||new Set(report.entries.map(x=>x.castleId)).size!==12||!Array.isArray(report.commands))fail('月末報告が不正です');
 for(const x of report.entries)if(!m.castles.some(c=>c.id===x.castleId)||!fs.includes(x.factionId)||['income','use','shortage','harvest'].some(k=>!Number.isSafeInteger(x[k])||x[k]<0))fail('収支履歴が不正です');
 if(report.events!==undefined)X.validateReport(report.events,s);
 if(report.diplomacy!==undefined&&(!Array.isArray(report.diplomacy)||report.diplomacy.some(q=>!fs.includes(q.factionId)||!fs.includes(q.targetFactionId)||typeof q.result!=='string')))fail('外交履歴が不正です');
 if(report.battles!==undefined){if(!Array.isArray(report.battles))fail('合戦報告が不正です');for(const h of report.battles)W.validateRecord(h,m);}
 if(report.military!==undefined&&(!Array.isArray(report.military)||report.military.some(h=>!m.castles.some(c=>c.id===h.castleId)||!fs.includes(h.factionId)||typeof h.result!=='string')))fail('進軍報告が不正です');
 for(const q of report.commands)if(!types.includes(q.type)||!m.castles.some(c=>c.id===q.castleId)||!m.officers.some(o=>o.id===q.officerId)||!fs.includes(q.factionId))fail('命令履歴が不正です');
 }
 for(const x of s.aiLog)if(!Number.isInteger(x.turn)||!fs.includes(x.factionId)||!m.castles.some(c=>c.id===x.castleId)||!Array.isArray(x.candidates)||x.candidates.some(c=>typeof c.type!=='string'||!Number.isFinite(c.score))||typeof x.reason!=='string')fail('AI履歴が不正です');
 if(!s.eventFlags||typeof s.eventFlags!=='object'||Array.isArray(s.eventFlags))fail('イベント履歴が不正です');
 if(!s.personnel||!s.personnel.known||!s.personnel.attempts||!Array.isArray(s.personnel.log)||s.personnel.log.length>200)fail('人材情報が不正です');
 if(typeof s.personnel.known!=='object'||Array.isArray(s.personnel.known)||typeof s.personnel.attempts!=='object'||Array.isArray(s.personnel.attempts))fail('人材情報が不正です');
 for(const [key,value] of Object.entries(s.personnel.attempts)){const [f,id]=key.split(':');if(key!==f+':'+id||!fs.includes(f)||!s.officers.some(o=>o.id===id)||!Number.isSafeInteger(value)||value<1)fail('交渉履歴が不正です');}
 for(const x of s.personnel.log)if(!x||!Number.isInteger(x.turn)||x.turn<1||x.turn>=s.turn||!fs.includes(x.factionId)||!s.castles.some(c=>c.id===x.castleId)||typeof x.text!=='string'||x.text.length>300)fail('人材報告が不正です');
 for(const o of s.officers.filter(o=>o.id.startsWith('N')))for(const k of ['placement','regionCastleId','duty','ambition','affinity','concealment'])if(o[k]!==m.officers.find(t=>t.id===o.id)[k])fail('人材設定が不正です');
 for(const [f,ids] of Object.entries(s.personnel.known))if(!fs.includes(f)||!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!s.officers.some(o=>o.id===id)))fail('発見情報が不正です');
 A.validate(s);X.validate(s);L.validate(s);D.validate(s,m,rules);W.validate(s,m,rules);
 const trial=clone(s);trial.commands=[];for(const q of s.commands){if(q.factionId!==s.playerFactionId)fail('他勢力の命令です');const e=canIssueCommand(trial,q,rules);if(e)fail(e);trial.commands.push(q);}
 return true;
}
function planAI(s,rules){
 for(const f of [...s.factions].sort((a,b)=>a.id.localeCompare(b.id))){if(f.id===s.playerFactionId||!W.aliveFaction(s,f.id))continue;
  for(const c of s.castles.filter(c=>c.ownerFactionId===f.id).sort((a,b)=>a.id.localeCompare(b.id))){
   for(const o of s.officers.filter(o=>o.locationCastleId===c.id&&o.status==='active'&&o.factionId===f.id).sort((a,b)=>b.stats.politics-a.stats.politics||a.id.localeCompare(b.id))){
    const candidates=types.filter(t=>!['search','hire','reward','poach'].includes(t)).map(type=>{let score=0,reason='';
     if(type==='cultivate'){score=45-c.farm*.3+(c.food/Math.max(1,Math.ceil(c.troops/100))<3?100:0)+(f.trait==='agriculture'?15:0);reason='備蓄と秋収穫を確保';}
     if(type==='commerce'){score=55-c.commerce*.35+(f.trait==='commerce'?15:0);reason='継続収入を増やす';}
     if(type==='fortify'){score=18-c.defense*.1;reason='城防を整備';}
     if(type==='recruit'){score=c.troops<2200&&c.food>250&&c.publicOrder>=55?20+(f.trait==='military'?35:Object.values(s.wars).some(w=>w.active&&(w.a===f.id||w.b===f.id))?20:0): -100;reason='備蓄の範囲で兵力を確保';}
     return {type,score,reason,q:{type,castleId:c.id,officerId:o.id,factionId:f.id}};
    }).filter(x=>x.score>0&&!canIssueCommand(s,x.q,rules)).sort((a,b)=>b.score-a.score||a.type.localeCompare(b.type));
    if(!candidates.length)continue;const top=candidates.filter(x=>x.score===candidates[0].score);const chosen=top[Math.floor(random(s)*top.length)];s.commands.push(chosen.q);s.aiLog.push({turn:s.turn,factionId:f.id,castleId:c.id,candidates:candidates.slice(0,3).map(x=>({type:x.type,score:x.score})),chosen:chosen.type,reason:chosen.reason});
   }
  }
 }
}
function beginMonth(state,m,rules){
 validateState(state,m,rules);if(state.ending)fail('この戦記は終了しています');const s=clone(state);W.planAI(s,m,rules);D.planAI(s,m,rules);planAI(s,rules);
 const report={turn:s.turn,year:s.year,month:s.month,entries:[],commands:clone(s.commands),military:[],battles:[]};
 for(const q of s.commands){const c=s.castles.find(c=>c.id===q.castleId),r=commandRule(q,rules);for(const [k,v]of Object.entries(r.cost))c[k]-=v;for(const[k,v]of Object.entries(r.delta)){c[k]+=v;if(r.cap&&v>0)c[k]=Math.min(r.cap,c[k]);if(r.floor&&k in r.floor)c[k]=Math.max(r.floor[k],c[k]);}}
 resolvePersonnel(s,report);H.changes(state,s,'personnel:'+s.turn);return {state:s,report,armies:W.launch(s),current:null};
}
function nextBattle(tx){return W.nextBattle(tx,random);}
function finishMonth(tx,m,rules){
 if(tx.armies.length||tx.current)fail('未解決の合戦があります');const s=clone(tx.state),report=clone(tx.report);W.reconcile(s);
 for(const c of s.castles){const f=s.factions.find(f=>f.id===c.ownerFactionId);const use=Math.ceil(c.troops/100),shortage=Math.max(0,use-c.food);c.food=Math.max(0,c.food-use);const income=Math.floor(c.commerce*1.5*(f.trait==='commerce'?1.1:1));c.gold+=income;const harvest=s.month===9?Math.floor(c.farm*8*(f.trait==='agriculture'?1.1:1)):0;c.food+=harvest;report.entries.push({castleId:c.id,factionId:c.ownerFactionId,income,use,shortage,harvest});}
 report.diplomacy=D.resolve(s,random);L.month(s,report);A.resolve(s,report);A.month(s,report);X.month(s,report);H.changes(tx.state,s,'month:'+s.turn);s.reports.push(report);if(s.month===12)s.annualReports.push({year:s.year,reports:clone(s.reports.slice(-12))});
 s.commands=[];s.turn++;H.followups(tx.state,s);s.month=(s.turn-1)%12+1;s.year=Math.floor((s.turn-1)/12)+1;s.aiLog=s.aiLog.slice(-1000);s.reports=s.reports.slice(-120);s.annualReports=s.annualReports.slice(-10);validateState(s,m,rules);return s;
}
function advanceMonth(state,m,rules){const tx=beginMonth(state,m,rules);let b;while((b=nextBattle(tx)))W.settle(tx,B.auto(b));return finishMonth(tx,m,rules);}
function resolvePersonnel(s,report){
 const p=s.personnel;report.personnel=[];
 for(const q of s.commands.filter(q=>['search','hire','reward'].includes(q.type))){const o=s.officers.find(x=>x.id===q.officerId);let text;
 if(q.type==='reward'){text=L.reward(s,q);A.reward(s,q.targetId);}
 else if(q.type==='search'){const candidates=s.officers.filter(t=>t.status==='ronin'&&t.placement!=='locked'&&(!t.regionCastleId||t.regionCastleId===q.castleId||t.placement==='wanderer')&&!(p.known[q.factionId]||[]).includes(t.id));const t=candidates[Math.floor(random(s)*candidates.length)];const rate=t?Math.max(5,Math.min(90,35+(o.stats.intellect-50)*.3+({careful:-15,normal:0,large:20}[q.mode])-(t.concealment||0))):0;if(t&&random(s)*100<rate){(p.known[q.factionId]??=[]).push(t.id);text=t.name+'を発見。登用は別の月に交渉できます。';}else text='探索したが人材は見つからなかった。';
 }else{const t=s.officers.find(x=>x.id===q.targetId),key=q.factionId+':'+q.targetId;const past=p.attempts[key]||0;p.attempts[key]=past+1;if(t.status!=='ronin'){text='交渉相手はすでに仕官している。';}else{const rate=Math.max(5,Math.min(90,25+o.stats.charisma*.25+o.stats.politics*.15+q.offer/15+X.hireBonus(s,q.factionId,t.id)-(t.duty||50)*.15+(t.ambition||50)*.05-Math.abs((o.affinity||50)-(t.affinity||50))*.15));if(random(s)*100<rate){t.status='active';t.factionId=q.factionId;t.locationCastleId=q.castleId;t.loyalty=70;A.joined(s,t.id);L.addBond(s,o.id,t.id,5);text=t.name+'を登用した。';}else text=t.name+'は登用を断った。再交渉できます。';if(past)text+='（再交渉）';}}
 const entry={turn:s.turn,factionId:q.factionId,castleId:q.castleId,text};p.log.push(entry);report.personnel.push(entry);
 }p.log=p.log.slice(-200);
}
function migratePersonnel(s,m){if(s.personnel)return L.init(s);for(const o of m.officers.filter(o=>o.id.startsWith('N')))if(!s.officers.some(x=>x.id===o.id)){s.officers.push({...clone(o),factionId:null,status:'ronin',locationCastleId:null,loyalty:50});}s.personnel={known:{},attempts:{},log:[]};return L.init(s);}
root.Yabou={labels,types,clone,dismissEvent:(s,uid,m,r)=>{validateState(s,m,r);const n=X.dismiss(s,uid);validateState(n,m,r);return n;},chooseEvent:(s,uid,id,m,r)=>{validateState(s,m,r);const result=X.choose(s,uid,id);H.changes(s,result.state,'event:'+uid);H.event(result.state,s.events.pending,X.byId[s.events.pending.id].title+'：'+result.text);validateState(result.state,m,r);return result;},commandRule,loyaltyLabel:L.label,bond:L.bond,validateMaster,createInitialState,canIssueCommand,queueCommand,advanceMonth,beginMonth,nextBattle,finishMonth,validateState,serializeSave:(s,m,r)=>{validateState(s,m,r);return JSON.stringify(s)},loadSave:(t,m,r)=>{const s=H.init(A.init(X.init(migratePersonnel(W.migrate(JSON.parse(t)),m))));validateState(s,m,r);return s}};
})(globalThis);
