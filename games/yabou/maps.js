(function(root){
'use strict';
const base=root.YABOU_DATA||(typeof require==='function'?require('./data.js')&&root.YABOU_DATA:null),scenarios=root.YABOU_SCENARIOS||(typeof require==='function'?require('./scenario-data.js'):null),clone=x=>JSON.parse(JSON.stringify(x));
const expanded=clone(base);expanded.mapId='expanded18-v1';
const initial=clone(scenarios.find(s=>s.id==='S01')),groups=[['C01','C06','C13'],['C04','C05','C14'],['C07','C08','C15'],['C03','C12','C16'],['C02','C11','C17'],['C09','C10','C18']],names=['星見城','影渡城','火守城','雪代城','木立城','金砂城'];
for(let i=0;i<6;i++){const id='C'+(13+i),f='F0'+(i+1);expanded.castles.push({id,name:names[i],ownerFactionId:f,region:'拡張領',x:820,y:100+160*i,farm:30,commerce:30,defense:35,troops:600,food:700,gold:300,publicOrder:70});initial.castles.push({id,ownerFactionId:f,farm:30,commerce:30,defense:35,troops:600,food:700,gold:300,publicOrder:70});}
for(let row=0;row<6;row++)for(let col=0;col<3;col++){const id=groups[row][col],c=expanded.castles.find(c=>c.id===id);c.x=180+320*col;c.y=140+130*row;c.ownerFactionId='F0'+(row+1);}
expanded.roads=[];for(let row=0;row<6;row++)for(let col=0;col<3;col++){if(col<2)expanded.roads.push({fromCastleId:groups[row][col],toCastleId:groups[row][col+1]});if(row<5)expanded.roads.push({fromCastleId:groups[row][col],toCastleId:groups[row+1][col]});}
expanded.roads.forEach((r,i)=>r.id='R'+String(i+1).padStart(2,'0'));
// Distribute existing retainers; no new officer IDs or stats.
for(let i=0;i<6;i++){const family=initial.officers.filter(o=>o.status==='active'&&o.factionId==='F0'+(i+1));family.forEach((o,j)=>{if(j>=4)o.locationCastleId=groups[i][2];});}
initial.id='S07';initial.mapId=expanded.mapId;initial.name='広域群雄 ― 十八の城';initial.description='拡張試遊。六家が3城ずつを治める18城・27街道の新しい全国図。新城の資源と配置は試作バランスです。';initial.victory='全18城を支配する';scenarios.push(initial);
function get(id){if(id===undefined||id==='legacy12')return base;if(id===expanded.mapId)return expanded;throw Error('対応していないマップです');}
function forScenario(id){const s=scenarios.find(s=>s.id===id);if(!s)throw Error('シナリオが存在しません');return get(s.mapId);}
root.YabouMaps={get,forScenario,resolve:s=>get(s.mapId)};if(typeof module!=='undefined')module.exports=root.YabouMaps;
})(globalThis);
