(function(root){
'use strict';
const L=()=>root.YabouLoyalty;
const pair=(a,b)=>[a,b].sort().join(':');
const tagNames={friend:'友情',mentor:'師弟',kin:'血縁',rival:'ライバル',enemy:'仇敵',trust:'信頼'};
// Inferred tags never overwrite explicit relationships established by a story.
const inferred=value=>value>=40?['friend']:value<=-70?['enemy']:value<=-40?['rival']:[];
function tags(s,a,b){const record=s.personnel.loyalty.bonds[pair(a,b)];return [...new Set([...(record?.tags||[]),...inferred(record?.value||0)])];}
function label(n){return n>=70?'深い親交':n>=40?'友好':n>=15?'好意':n<=-70?'敵意':n<=-40?'対立':n<=-15?'不和':'中立';}
function init(s){if(!Object.hasOwn(s.personnel,'relationships'))s.personnel.relationships={version:1,lastMonth:0,battleIds:[],log:[]};return s;}
function change(s,a,b,delta,kind,castleId,source){
 if(a===b)return;init(s);const before=L().bond(s,a,b);L().addBond(s,a,b,delta);const after=L().bond(s,a,b);if(before===after)return;
 const entry={turn:s.turn,a,b,delta:after-before,before,after,kind,castleId};s.personnel.relationships.log.push(entry);s.personnel.relationships.log=s.personnel.relationships.log.slice(-120);
 const oldTag=inferred(before)[0],newTag=inferred(after)[0];if(newTag&&newTag!==oldTag){for(const [id,other]of [[a,b],[b,a]])root.YabouBiography?.add(s,id,'relationship:'+source+':'+pair(a,b)+':'+newTag,'event',s.officers.find(o=>o.id===other).name+'との関係が「'+tagNames[newTag]+'」となる（関係 '+after+'）。');}
}
function month(s,report){
 init(s);const v=s.personnel.relationships;if(v.lastMonth>=s.turn)return;v.lastMonth=s.turn;if(s.month%3)return;
 const groups=new Map();for(const o of s.officers)if(o.status==='active'&&o.factionId){const c=s.castles.find(c=>c.id===o.locationCastleId&&c.ownerFactionId===o.factionId);if(c){if(!groups.has(c.id))groups.set(c.id,[]);groups.get(c.id).push(o);}}
 for(const [castleId,os]of groups){if(os.length<2)continue;os.sort((a,b)=>a.id.localeCompare(b.id));const used=new Set(),start=Math.floor(s.turn/3)%os.length;let changed=0;
  // At most three neighbouring pairs per castle, rather than all officer pairs.
  for(let i=0;i<Math.min(3,os.length);i++){const a=os[(start+i)%os.length],b=os[(start+i+1)%os.length],key=pair(a.id,b.id);if(used.has(key))continue;used.add(key);const distance=Math.abs((a.affinity??50)-(b.affinity??50)),delta=distance<=30?1:distance>=60?-1:0;
   if(delta){const before=L().bond(s,a.id,b.id);change(s,a.id,b.id,delta,'resident',castleId,'resident:'+s.turn);if(L().bond(s,a.id,b.id)!==before)changed++;}
  }
  if(changed&&os[0].factionId===s.playerFactionId)(report.personnel??=[]).push({turn:s.turn,factionId:os[0].factionId,castleId,text:s.castles.find(c=>c.id===castleId).name+'の家臣交流：'+changed+'組の関係が変化。人材の「武将の関係」で確認できます。'});
 }
}
function battle(s,h){
 init(s);const v=s.personnel.relationships;if(v.battleIds.includes(h.id))return;
 // Only actual participants on the same side gain a shared-battle bond.
 for(const ids of Object.values(h.participants||{})){const officers=[...new Set(ids)].filter(id=>s.officers.some(o=>o.id===id)).slice(0,3);for(let i=0;i<officers.length;i++)for(let j=i+1;j<officers.length;j++)change(s,officers[i],officers[j],3,'cofight',h.castleId,h.id);}
 v.battleIds.push(h.id);v.battleIds=v.battleIds.slice(-120);
}
function validate(s){
 const v=s.personnel.relationships,fail=()=>{throw Error('武将関係の保存情報が不正です');},ids=new Set(s.officers.map(o=>o.id));
 if(!v||v.version!==1||!Number.isSafeInteger(v.lastMonth)||v.lastMonth<0||v.lastMonth>=s.turn||!Array.isArray(v.battleIds)||v.battleIds.length>120||new Set(v.battleIds).size!==v.battleIds.length||v.battleIds.some(id=>{if(typeof id!=='string'||id.length>100)return true;const m=/^battle-(\d+)-(\d+)$/.exec(id);return !m||!Number.isSafeInteger(+m[1])||+m[1]<1||+m[1]>s.turn||!Number.isSafeInteger(+m[2]);})||!Array.isArray(v.log)||v.log.length>120)fail();
 let turn=0;for(const x of v.log){if(!x||!ids.has(x.a)||!ids.has(x.b)||x.a===x.b||!['resident','cofight','drama'].includes(x.kind)||!s.castles.some(c=>c.id===x.castleId)||!Number.isSafeInteger(x.turn)||x.turn<1||x.turn>s.turn||x.turn<turn||![x.before,x.after].every(n=>Number.isInteger(n)&&n>=-100&&n<=100)||!Number.isInteger(x.delta)||!x.delta||(x.kind==='resident'?Math.abs(x.delta)>1:x.kind==='drama'?Math.abs(x.delta)>6:x.delta<1||x.delta>3)||x.after-x.before!==x.delta)fail();turn=x.turn;}
}
root.YabouRelationships={tagNames,tags,label,init,change,month,battle,validate};if(typeof module!=='undefined')module.exports=root.YabouRelationships;
})(globalThis);
