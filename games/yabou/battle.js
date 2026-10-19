(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const RULES={version:'v03-provisional-1',width:8,height:6,roundLimit:12,damage:.055,types:{infantry:{name:'足軽',move:2,range:1,speed:2},bow:{name:'弓',move:2,range:3,speed:2},cavalry:{name:'騎馬',move:3,range:1,speed:3},gun:{name:'鉄砲',move:1,range:3,speed:1}}};
const CASTLE_TERRAIN={C01:'plain',C02:'forest',C03:'mountain',C04:'forest',C05:'forest',C06:'plain',C07:'mountain',C08:'mountain',C09:'plain',C10:'plain',C11:'forest',C12:'mountain'};
const TERRAIN_RULES={plain:{name:'平原',bonus:0},forest:{name:'森林',bonus:.1},mountain:{name:'山岳',bonus:.2}};
const castleTerrain=id=>CASTLE_TERRAIN[id]||'plain';
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),alive=u=>u.troops>0&&u.morale>0&&!u.retreated;
function random(b){let x=b.rngState;x^=x<<13;x^=x>>>17;x^=x<<5;b.rngState=x>>>0;return b.rngState/4294967296;}
function create({id,attacker,defender,attackUnits,defendUnits,attackFood,defendFood,defense=40,seed=1,castleTerrain:region}){
 const b={id,attacker,defender,round:1,rngState:(seed>>>0)||1,weather:'晴',food:{attack:attackFood,defend:defendFood},defense,units:[],terrain:[],log:[],result:null,rulesVersion:RULES.version};b.weather=random(b)<.25?'雨':'晴';if(region!==undefined){if(!TERRAIN_RULES[region])throw Error('城地形が不正です');b.castleTerrain=region;b.rulesVersion='v18-terrain-1';b.log.push('城地形：'+TERRAIN_RULES[region].name+'／守備側の地形防御＋'+Math.round(TERRAIN_RULES[region].bonus*100)+'%（盤面の地形防御とは高い方を適用）');}
 for(let y=0;y<6;y++)for(let x=0;x<8;x++)b.terrain.push(x===7&&y===3?'castle':x===4&&y!==2?'river':(x===2||x===5)&&y%3===1?'forest':(x===3&&y===0)||(x===6&&y===5)?'mountain':'plain');
 for(const [side,units]of [['attack',attackUnits],['defend',defendUnits]])units.forEach((u,i)=>b.units.push({...clone(u),id:side+'-'+i,side,x:side==='attack'?0:7,y:[3,1,5][i],initial:u.troops,morale:u.initialMorale||70,retreated:false,defending:false,ambush:false,confused:false,bands:0}));
 if(!b.units.some(u=>u.side==='defend'))b.result={winner:'attack',reason:'守備隊なし'};return b;
}
function terrain(b,u){return b.terrain[u.y*8+u.x];}
function reachable(b,u){
 const points=[{x:u.x,y:u.y,cost:0}],best=new Map([[u.x+':'+u.y,0]]),budget=Math.max(1,RULES.types[u.type].move-(b.weather==='雨'&&u.type==='cavalry'?1:0));
 for(let i=0;i<points.length;i++){const p=points[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy;if(x<0||x>7||y<0||y>5||b.units.some(v=>alive(v)&&v.id!==u.id&&v.x===x&&v.y===y))continue;const t=b.terrain[y*8+x],cost=p.cost+(t==='mountain'||t==='river'||(t==='forest'&&u.type==='cavalry')?2:1),key=x+':'+y;if(cost<=budget&&(!best.has(key)||cost<best.get(key))){best.set(key,cost);points.push({x,y,cost});}}}
 return [...best].map(([key,cost])=>{const[x,y]=key.split(':').map(Number);return{x,y,cost};});
}
function legal(b,u,q){
 if(!u||!alive(u)||!q)return '部隊が行動できません';
 if(['guard','retreat'].includes(q.type))return null;
 if(q.type==='ambush')return terrain(b,u)==='forest'?null:'伏兵は森でのみ使用できます';
 if(q.type==='move')return reachable(b,u).some(p=>p.x===q.x&&p.y===q.y)?null:'移動範囲外または他部隊がいます';
 const target=b.units.find(v=>v.id===q.targetId&&v.side!==u.side&&alive(v));if(!target)return '敵部隊を選んでください';
 if(!['attack','charge','confuse'].includes(q.type))return '未対応の戦術命令です';
 const range=q.type==='charge'?1:q.type==='confuse'?2:RULES.types[u.type].range;
 return distance(u,target)<=range?null:'射程外です';
}
function predict(b,u,v,mult=1){
 let factor=1;if(u.type==='cavalry'&&v.type==='bow')factor=1.2;if(u.type==='bow'&&v.type==='gun')factor=1.15;if(u.type==='gun'&&v.type==='cavalry')factor=1.2;
 const t=terrain(b,v);if(t==='mountain')factor/=1.25;if(t==='castle')factor/=1.5;if(t==='river')factor/=.75;if(t==='forest'&&RULES.types[u.type].range>1)factor*=.8;
 if(b.castleTerrain&&v.side==='defend'){const tile=t==='mountain'||t==='forest'&&RULES.types[u.type].range>1?1.25:t==='castle'?1.5:1;factor*=tile/Math.max(tile,1+TERRAIN_RULES[b.castleTerrain].bonus);}
 if(b.weather==='雨'&&u.type==='gun')factor*=.65;if(v.defending)factor*=.7;if(u.starving)factor*=.8;
 const base=u.troops*RULES.damage*(.75+u.stats.leadership/200)*factor*mult;return{min:Math.min(v.troops,Math.max(1,Math.round(base*.9))),max:Math.min(v.troops,Math.max(1,Math.round(base*1.1)))};
}
function hit(b,u,v,mult=1){const p=predict(b,u,v,mult),damage=Math.min(v.troops,Math.max(1,Math.round(p.min+(p.max-p.min)*random(b))));v.troops-=damage;const bands=Math.floor((v.initial-v.troops)/v.initial*10);v.morale=Math.max(0,v.morale-Math.max(0,bands-v.bands)*8);v.bands=bands;b.log.push(`${u.name} → ${v.name}：${damage}損耗（${({plain:'平地',forest:'森',mountain:'山',river:'川',castle:'城'})[terrain(b,v)]}${v.defending?'・守備':''}）`);}
function finish(b){
 const a=b.units.filter(u=>u.side==='attack'),d=b.units.filter(u=>u.side==='defend');
 if(!a.some(alive)||!alive(a[0]))b.result={winner:'defend',reason:!alive(a[0])?'攻城軍の総大将が離脱':'攻城軍が戦闘継続不能'};
 else if(!d.some(alive)||!alive(d[0]))b.result={winner:'attack',reason:'守備軍の総大将が離脱'};
 else if(b.round>12){const attacking=a.filter(alive).reduce((sum,u)=>sum+u.troops,0),defending=d.filter(alive).reduce((sum,u)=>sum+u.troops,0),atCastle=a.some(u=>alive(u)&&terrain(b,u)==='castle');b.result={winner:atCastle&&attacking>=defending*(1+b.defense/100)?'attack':'defend',reason:atCastle?'12ラウンド攻城判定（兵数・城防）':'12ラウンド以内に城を制圧できず'};}
 if(b.result)b.log.push((b.result.winner==='attack'?'攻城軍':'守備軍')+'勝利：'+b.result.reason);
}
function aiOrders(b,side){
 const orders={};for(const u of b.units.filter(u=>u.side===side&&alive(u))){const enemies=b.units.filter(v=>v.side!==side&&alive(v)).sort((a,c)=>distance(u,a)-distance(u,c)||a.troops-c.troops||a.id.localeCompare(c.id));
 if(!enemies.length){orders[u.id]={type:'guard'};continue;}
 if(u.morale<=15){orders[u.id]={type:'retreat'};continue;}
 const target=enemies.find(v=>!legal(b,u,{type:'attack',targetId:v.id}));if(target){orders[u.id]={type:u.type==='cavalry'&&u.morale>40?'charge':'attack',targetId:target.id};continue;}
 const positions=reachable(b,u).filter(p=>p.x!==u.x||p.y!==u.y).sort((a,c)=>distance(a,enemies[0])-distance(c,enemies[0])||(side==='defend'?c.x-a.x:a.x-c.x)||a.y-c.y);orders[u.id]=positions.length?{type:'move',x:positions[0].x,y:positions[0].y}:{type:'guard'};
 }return orders;
}
function advance(b,orders){
 if(b.result)throw new Error('この合戦は終了しています');
 for(const u of b.units.filter(alive)){const error=legal(b,u,orders[u.id]);if(error)throw new Error(u.name+'：'+error);}
 const n=clone(b);n.log.push(`第${n.round}ラウンド / ${n.weather}`);
 for(const side of ['attack','defend'])for(const u of n.units.filter(u=>u.side===side&&alive(u))){const use=Math.ceil(u.troops/100);u.starving=n.food[side]<use;n.food[side]=Math.max(0,n.food[side]-use);if(u.starving){u.morale=Math.max(0,u.morale-15);n.log.push(u.name+'：兵糧不足、士気−15');}u.defending=orders[u.id]?.type==='guard';if(orders[u.id]?.type!=='ambush')u.ambush=false;}
 const sorted=[...n.units].sort((a,c)=>RULES.types[c.type].speed-RULES.types[a.type].speed||c.stats.leadership-a.stats.leadership||String(a.officerId||a.id).localeCompare(String(c.officerId||c.id))||a.id.localeCompare(c.id));
 for(const u of sorted){if(!alive(u))continue;const q=orders[u.id];if(u.confused){u.confused=false;n.log.push(u.name+'：混乱で命令を実行できず');continue;}
  if(q.type==='retreat'){u.retreated=true;n.log.push(u.name+'：撤退');if(u.id.endsWith('-0'))for(const v of n.units.filter(v=>v.side===u.side))v.morale=Math.max(0,v.morale-25);}
  if(q.type==='ambush'){u.ambush=true;n.log.push(u.name+'：森に伏せる');}
  if(q.type==='move'){if(legal(n,u,q)){n.log.push(u.name+'：進路が塞がれ移動中止');continue;}u.x=q.x;u.y=q.y;for(const v of n.units.filter(v=>v.side!==u.side&&v.ambush&&alive(v)&&distance(v,u)===1)){hit(n,v,u,1.4);v.ambush=false;}}
  if(['attack','charge','confuse'].includes(q.type)){const v=n.units.find(v=>v.id===q.targetId);if(legal(n,u,q)){n.log.push(u.name+'：標的が移動・離脱したため命令不成立');continue;}if(q.type==='confuse'){const chance=Math.max(15,Math.min(65,40+(u.stats.intellect-v.stats.intellect)*.5));if(random(n)*100<chance){v.confused=true;n.log.push(u.name+'：'+v.name+'を混乱させた');}else n.log.push(u.name+'：攪乱失敗');}else{hit(n,u,v,q.type==='charge'?1.2:1);if(q.type==='charge')u.morale=Math.max(0,u.morale-5);}}
 }
 n.round++;finish(n);return n;
}
function auto(b){let n=b;while(!n.result)n=advance(n,{...aiOrders(n,'attack'),...aiOrders(n,'defend')});return n;}
root.YabouBattle={RULES,TERRAIN_RULES,castleTerrain,create,alive,distance,terrain,reachable,legal,predict,aiOrders,advance,auto};
})(globalThis);
