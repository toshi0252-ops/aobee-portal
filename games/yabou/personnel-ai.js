(function(root){
'use strict';
// Personnel preferences only; existing military/diplomatic traits remain intact.
const profiles={F01:{name:'人材',hire:14,search:12,reward:5},F02:{name:'知略',hire:7,search:10,reward:0},F03:{name:'覇道',hire:8,search:0,reward:3},F04:{name:'外交',hire:6,search:2,reward:8},F05:{name:'堅実',hire:0,search:0,reward:12},F06:{name:'野心',hire:10,search:5,reward:0}};
function candidates(s,f,c,o,rules){
 const profile=profiles[f.id],local=s.officers.filter(t=>t.status==='active'&&t.factionId===f.id&&t.locationCastleId===c.id),war=Object.values(s.wars).some(w=>w.active&&(w.a===f.id||w.b===f.id));
 const used=s.commands.filter(q=>q.castleId===c.id).reduce((n,q)=>n+(root.Yabou.commandRule(q,rules).cost.gold||0),0)+root.YabouDiplomacy.reserved(s,c.id),gold=c.gold-used,reserve=war?200:100;
 const shortage=Math.max(0,4-local.length),out=[],base={castleId:c.id,officerId:o.id,factionId:f.id};
 const add=(type,score,reason,extra)=>out.push({type,score,reason:profile.name+'：'+reason,q:{...base,type,...extra}});
 // Only the faction's own discovery list is consulted. Hidden ronin are not inspected.
 const known=new Set(s.personnel.known[f.id]||[]);
 for(const t of s.officers.filter(t=>known.has(t.id)&&t.status==='ronin')){
  const quality=(t.stats.leadership+t.stats.valor+t.stats.intellect+t.stats.politics+t.stats.charisma)/5,offer=gold-reserve>=250?250:gold-reserve>=100?100:0;
  if(gold<reserve)continue;
  const score=18+shortage*9+quality*.18+o.stats.charisma*.08+profile.hire-(war&&c.food<100?20:0);
  add('hire',score,'発見済みの浪人を交渉し、家臣不足と任務適性を補う',{targetId:t.id,offer});
 }
 // One opportunity per faction every three months. Never seek a particular hidden ID.
 if((s.turn+Number(f.id.slice(1)))%3===0&&local.length<5&&gold>=reserve+100){
  const mode=gold>=reserve+500?'normal':'careful';
  add('search',23+shortage*8+o.stats.intellect*.1+profile.search-(war?10:0),'自領の人材を探索。発見と登用は別の月に実施',{mode});
 }
 for(const t of local.filter(t=>t.role!=='大名'&&t.id!==o.id&&t.loyalty<60)){
  const offer=t.loyalty<40&&gold>=500?500:gold>=250?250:100;
  if(gold<offer)continue;
  add('reward',32+(60-t.loyalty)*1.4+profile.reward+(t.loyalty<40?25:0),'家臣の不満を抑え、離反の危険を下げる',{targetId:t.id,offer});
 }
 return out;
}
root.YabouPersonnelAI={profiles,candidates};if(typeof module!=='undefined')module.exports=root.YabouPersonnelAI;
})(globalThis);
