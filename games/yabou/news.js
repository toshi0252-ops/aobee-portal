(function(root){
'use strict';
const LIMIT=600,PAGE_SIZE=20,labels={battle:'合戦',personnel:'登用・移籍',diplomacy:'外交',unrest:'内紛',independence:'独立',rumor:'噂'};
// Derive public news from committed records. Reading never writes saves or draws RNG.
function collect(s){const items=new Map(),f=id=>s.factions.find(f=>f.id===id)?.name||id,c=id=>s.castles.find(c=>c.id===id)?.name||id,cutoff=Math.max(1,s.turn-120);
 const add=x=>{if(x.turn>=cutoff&&x.turn<=s.turn&&!items.has(x.id))items.set(x.id,x);};
 const confirmed=(id,turn,kind,factionIds,castleId,title,text,source)=>add({id,turn,kind,factionIds,castleId,title,text,source,certainty:'confirmed'});
 const battle=h=>confirmed('battle:'+h.id,h.turn,'battle',[h.attacker,h.defender],h.castleId,c(h.castleId)+'の合戦',f(h.attacker)+'が'+f(h.defender)+'と交戦。'+f(h.winner==='attack'?h.attacker:h.defender)+'が勝利。'+h.reason,'合戦記録');
 for(const r of s.reports){for(const h of r.battles||[])battle(h);
  for(const x of r.personnel||[])if(x.text.includes('を登用した。'))confirmed('hire:'+JSON.stringify([r.turn,x.factionId,x.castleId,x.text]),r.turn,'personnel',[x.factionId],x.castleId,f(x.factionId)+'が家臣を登用',x.text,'月次人材報告');
  for(const q of r.diplomacy||[]){let result;if(q.type==='alliance'&&['12か月の同盟成立','他の交渉で同盟成立済み'].includes(q.result))result='同盟成立';else if(q.type==='truce'&&q.result==='6か月の停戦成立')result='停戦成立';else if(q.type==='trade'&&q.result.startsWith('交易成立：'))result='交易成立';else if(q.type==='aid'&&q.result.startsWith('援軍到着：'))result='援軍到着';else if(q.type==='surrender'&&q.result.startsWith('降伏成立：'))result='降伏成立';if(result)confirmed('diplomacy:'+JSON.stringify([r.turn,q.type,[q.factionId,q.targetFactionId].sort()]),r.turn,'diplomacy',[q.factionId,q.targetFactionId],q.castleId,f(q.factionId)+'・'+f(q.targetFactionId)+'：'+result,q.result,'外交結果');}
 }
 for(const h of s.battleHistory)battle(h);
 for(const h of s.personnel.allegiance.log)if(h.kind==='poach')confirmed('poach:'+JSON.stringify([h.turn,h.officerId,h.fromFactionId,h.toFactionId]),h.turn,'personnel',[h.fromFactionId,h.toFactionId],h.castleId,f(h.toFactionId)+'へ武将が移籍',h.text,'仕官記録');
 for(const h of s.personnel.unrest.history)if(h.result==='incident')confirmed('unrest:'+h.id,h.resolvedTurn,'unrest',[h.factionId],h.castleId,f(h.factionId)+'の'+c(h.castleId)+'で内紛',h.text,'内紛の確定記録');
 for(const h of s.personnel.independence.foundings)confirmed('independence:'+h.factionId,h.turn,'independence',[h.parentFactionId,h.factionId],h.castleId,f(h.factionId)+'が旗揚げ',c(h.castleId)+'で'+f(h.parentFactionId)+'から独立。旗揚げ時は旧主と交戦、他家とは未同盟。現在の関係は外交画面で確認できます。','旗揚げ記録');
 // GE18 never identifies a real faction, and is never promoted to a confirmed incident.
 for(const p of [...s.events.history,...(s.events.pending?[s.events.pending]:[])])if(p.id==='GE18')add({id:'rumor:'+p.uid,turn:Number(p.uid.split(':')[1]),kind:'rumor',factionIds:[],castleId:null,title:'他家の内紛という噂',text:'他家で意見の対立が起きているとの噂。発生した勢力・城・影響は確認されていません。実際の内紛の確報とは別の情報です。',source:'届いた噂',certainty:'rumor'});
 return [...items.values()].sort((a,b)=>b.turn-a.turn||a.id.localeCompare(b.id)).slice(0,LIMIT);
}
function view(s,options={}){const months=[3,12,120].includes(Number(options.months))?Number(options.months):12,kind=Object.hasOwn(labels,options.kind)?options.kind:'all',certainty=['confirmed','rumor'].includes(options.certainty)?options.certainty:'all',factionId=s.factions.some(f=>f.id===options.factionId)?options.factionId:'all';const rows=collect(s).filter(x=>x.turn>=s.turn-months&&(kind==='all'||x.kind===kind)&&(certainty==='all'||x.certainty===certainty)&&(factionId==='all'||x.factionIds.includes(factionId))),pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE)),page=Math.max(0,Math.min(pages-1,Number.isSafeInteger(options.page)?options.page:0));return {rows:rows.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),total:rows.length,pages,page,confirmed:rows.filter(x=>x.certainty==='confirmed').length,rumors:rows.filter(x=>x.certainty==='rumor').length};}
function treaties(s){const result=[];for(let i=0;i<s.factions.length;i++)for(let j=i+1;j<s.factions.length;j++){const a=s.factions[i],b=s.factions[j],d=s.diplomacy[[a.id,b.id].sort().join(':')];if(!s.castles.some(c=>c.ownerFactionId===a.id)||!s.castles.some(c=>c.ownerFactionId===b.id))continue;for(const [kind,until]of [['同盟',d.allianceUntil],['停戦',d.truceUntil||0]])if(until>s.turn)result.push({a:a.id,b:b.id,kind,remaining:until-s.turn});}return result;}
root.YabouNews={LIMIT,PAGE_SIZE,labels,collect,view,treaties};if(typeof module!=='undefined')module.exports=root.YabouNews;
})(globalThis);
