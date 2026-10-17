(function(root){
'use strict';
const labels={military:'武断派',civil:'文治派',independent:'独立派',neutral:'無所属',none:'対象外'},types=['military','civil','independent'];
const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
function context(s){
 const recent=new Map(),get=id=>{if(!recent.has(id))recent.set(id,{military:0,civil:0});return recent.get(id);};
 for(const r of s.reports.filter(r=>s.turn-r.turn<=6))for(const q of r.commands){if(['recruit','fortify'].includes(q.type))get(q.officerId).military+=3;if(['cultivate','commerce'].includes(q.type))get(q.officerId).civil+=3;}
 for(const h of s.battleHistory.filter(h=>s.turn-h.turn<=6))for(const ids of Object.values(h.participants||{}))for(const id of new Set(ids))get(id).military+=3;
 for(const h of s.personnel.drama.history.filter(h=>s.turn-h.turn<=6&&h.choiceId!=='SKIP'))for(const id of h.officerIds){if(['training','strategy'].includes(h.kind))get(id).military+=2;if(['friendship','letter'].includes(h.kind))get(id).civil+=2;}
 for(const h of s.personnel.chains.history.filter(h=>s.turn-h.turn<=6&&h.choiceId!=='SKIP')){const d=root.YabouChains.byId[h.id],c=d.acts[h.stage].choices[h.choiceId==='A'?0:1];for(const id of d.officerIds){if(c.defense)get(id).military+=2;if(c.publicOrder)get(id).civil+=2;}}
 const officers=new Map(s.officers.map(o=>[o.id,o])),social=new Map();
 // Existing bonds only: do not compare every officer with every other officer.
 for(const [key,b]of Object.entries(s.personnel.loyalty.bonds)){if(b.value<15)continue;const [a,c]=key.split(':'),x=officers.get(a),y=officers.get(c);if(!x||!y||x.status!=='active'||y.status!=='active'||!x.factionId||x.factionId!==y.factionId||x.locationCastleId!==y.locationCastleId)continue;
  for(const [o,peer]of [[x,y],[y,x]]){const r=s.personnel.camps?.records[peer.id];if(r?.factionId!==peer.factionId||!types.includes(r.camp))continue;if(!social.has(o.id))social.set(o.id,{military:0,civil:0,independent:0});social.get(o.id)[r.camp]+=Math.min(3,Math.max(1,Math.floor(b.value/20)));}
 }return {recent,social};
}
function assess(s,o,ctx,previous){
 const base={factionId:o.factionId,castleId:o.locationCastleId,status:o.status,loyalty:o.loyalty,camp:'none',scores:{military:0,civil:0,independent:0},sinceTurn:s.turn,reasons:[]};
 if(o.status!=='active'||o.role==='大名'){base.reasons=[o.role==='大名'?'主君は家臣の派閥の対象外':o.status==='prisoner'?'捕虜のため派閥活動を休止':'浪人のため派閥活動の対象外'];return base;}
 const recent=ctx.recent.get(o.id)||{military:0,civil:0},social=ctx.social.get(o.id)||{},military=Math.round((o.stats.leadership*.6+o.stats.valor*.4)*.65),civil=Math.round((o.stats.politics*.65+o.stats.intellect*.35)*.65),independent=Math.round((o.ambition??50)*.35+(100-o.loyalty)*.55+(100-(o.duty??50))*.15);
 base.scores={military:clamp(military+Math.min(12,recent.military)+Math.min(6,social.military||0)),civil:clamp(civil+Math.min(12,recent.civil)+Math.min(6,social.civil||0)),independent:clamp(independent+Math.min(6,social.independent||0))};
 const ranked=[...types].sort((a,b)=>base.scores[b]-base.scores[a]||types.indexOf(a)-types.indexOf(b)),best=ranked[0];base.camp=base.scores[best]>=50?best:'neutral';
 if(previous?.factionId===o.factionId&&types.includes(previous.camp)&&base.scores[previous.camp]>=45&&base.scores[best]-base.scores[previous.camp]<8)base.camp=previous.camp;
 if(previous?.factionId===o.factionId&&previous.camp===base.camp)base.sinceTurn=previous.sinceTurn;
 base.reasons=['統率・武勇から武断 '+military,'政治・知略から文治 '+civil,'野心・忠誠・義理から独立 '+independent];if(recent.military||recent.civil)base.reasons.push('直近6か月の任務・共闘・便り：武断 +'+Math.min(12,recent.military)+' / 文治 +'+Math.min(12,recent.civil));if(Object.values(social).some(n=>n>0))base.reasons.push('同じ城の親しい家臣：武断 +'+Math.min(6,social.military||0)+' / 文治 +'+Math.min(6,social.civil||0)+' / 独立 +'+Math.min(6,social.independent||0));if(base.camp!==best&&base.camp!=='neutral')base.reasons.push('差が8未満のため現在の傾向を維持');return base;
}
function init(s){if(!Object.hasOwn(s.personnel,'camps')){const ctx=context(s);s.personnel.camps={version:1,lastTurn:s.turn,records:Object.fromEntries(s.officers.map(o=>[o.id,assess(s,o,ctx,null)])),log:[]};}return s;}
function refresh(s,report){init(s);const v=s.personnel.camps,ctx=context(s),next={},changes=[];
 for(const o of s.officers){const old=v.records[o.id],n=assess(s,o,ctx,old);next[o.id]=n;if(old&&(old.camp!==n.camp||old.factionId!==n.factionId)){const h={turn:s.turn,officerId:o.id,from:old.camp,to:n.camp,fromFactionId:old.factionId,toFactionId:n.factionId};v.log.push(h);changes.push(h);if(old.camp!==n.camp&&n.factionId===s.playerFactionId&&n.camp!=='none')root.YabouBiography.add(s,o.id,'camp:'+s.turn+':'+o.id+':'+n.camp,'event',labels[n.camp]+'の傾向が表れる（所属国は変わらない）。');}}
 v.records=next;v.lastTurn=s.turn;v.log=v.log.slice(-120);const own=changes.filter(h=>h.fromFactionId===s.playerFactionId||h.toFactionId===s.playerFactionId);if(report&&own.length)(report.personnel??=[]).push({turn:s.turn-1,factionId:s.playerFactionId,castleId:s.castles.find(c=>c.ownerFactionId===s.playerFactionId)?.id||own.map(h=>s.officers.find(o=>o.id===h.officerId)?.locationCastleId).find(Boolean)||s.castles[0].id,text:'家臣の派閥傾向が'+own.length+'人で変化。人材の「派閥と国中の関係」で確認できます。'});return s;
}
function view(s,id,ctx=context(s)){const o=s.officers.find(o=>o.id===id),r=s.personnel.camps.records[id];return r&&r.factionId===o.factionId&&r.castleId===o.locationCastleId&&r.status===o.status&&r.loyalty===o.loyalty?r:assess(s,o,ctx,r);}
function summary(s,factionId){const ctx=context(s),members=s.officers.filter(o=>o.factionId===factionId&&o.status==='active'&&o.role!=='大名'),records=new Map(members.map(o=>[o.id,view(s,o.id,ctx)])),groups=Object.fromEntries([...types,'neutral'].map(camp=>[camp,{camp,members:members.filter(o=>records.get(o.id).camp===camp),leaderId:null,cohesion:null,links:0}]));let tension=0,conflicts=0;
 for(const g of Object.values(groups))if(g.camp!=='neutral'&&g.members.length>=2)g.leaderId=[...g.members].sort((a,b)=>(b.stats.charisma+(g.camp==='civil'?b.stats.politics:b.stats.leadership))-(a.stats.charisma+(g.camp==='civil'?a.stats.politics:a.stats.leadership))||a.id.localeCompare(b.id))[0].id;
 const sums={military:0,civil:0,independent:0,neutral:0};for(const [key,b]of Object.entries(s.personnel.loyalty.bonds)){const [a,c]=key.split(':'),x=records.get(a),y=records.get(c);if(!x||!y)continue;if(x.camp===y.camp){groups[x.camp].links++;sums[x.camp]+=b.value;}else if(types.includes(x.camp)&&types.includes(y.camp)&&b.value<=-40){tension+=-b.value;conflicts++;}}
 for(const g of Object.values(groups))if(g.links)g.cohesion=Math.round(sums[g.camp]/g.links);return {groups:Object.values(groups),records,tension:conflicts?Math.round(tension/conflicts):0,conflicts};
}
function weight(s,p){const o=s.officers.find(o=>o.id===p.officerIds[0]),r=s.personnel.camps?.records[o?.id];if(!r||r.factionId!==o.factionId||r.status!=='active')return 1;return ({military:['training','strategy','duel'],civil:['friendship','letter','recommend'],independent:['secret','appeal','argument']})[r.camp]?.includes(p.kind)?3:1;}
function validate(s){const v=s.personnel.camps,fail=()=>{throw Error('国内派閥の保存情報が不正です');},turn=n=>Number.isSafeInteger(n)&&n>=1&&n<=s.turn,fs=new Set(s.factions.map(f=>f.id)),cs=new Set(s.castles.map(c=>c.id)),ids=new Set(s.officers.map(o=>o.id));if(!v||v.version!==1||!turn(v.lastTurn)||!v.records||Object.keys(v.records).length!==ids.size||!Array.isArray(v.log)||v.log.length>120)fail();
 for(const id of ids){const r=v.records[id];if(!r||!Object.hasOwn(labels,r.camp)||r.factionId!==null&&!fs.has(r.factionId)||r.castleId!==null&&!cs.has(r.castleId)||!['active','prisoner','ronin'].includes(r.status)||!Number.isInteger(r.loyalty)||r.loyalty<0||r.loyalty>100||!turn(r.sinceTurn)||r.sinceTurn>v.lastTurn||!r.scores||Object.keys(r.scores).length!==3||types.some(t=>!Number.isInteger(r.scores[t])||r.scores[t]<0||r.scores[t]>100)||!Array.isArray(r.reasons)||r.reasons.length<1||r.reasons.length>6||r.reasons.some(t=>typeof t!=='string'||t.length>180))fail();if(r.status!=='active'&&r.camp!=='none'||r.status==='ronin'&&(r.factionId!==null||r.castleId!==null)||r.status!=='ronin'&&(r.factionId===null||r.castleId===null)||r.camp==='none'&&types.some(k=>r.scores[k]!==0)||types.includes(r.camp)&&r.scores[r.camp]<45||r.camp==='neutral'&&types.some(k=>r.scores[k]>=50))fail();}
 let previous=0;for(const h of v.log){if(!h||!turn(h.turn)||h.turn<previous||!ids.has(h.officerId)||!Object.hasOwn(labels,h.from)||!Object.hasOwn(labels,h.to)||h.fromFactionId!==null&&!fs.has(h.fromFactionId)||h.toFactionId!==null&&!fs.has(h.toFactionId))fail();previous=h.turn;}
}
root.YabouCamps={labels,types,init,refresh,view,summary,weight,validate};if(typeof module!=='undefined')module.exports=root.YabouCamps;
})(globalThis);
