(function(root){
'use strict';
const data=root.YABOU_SCENARIOS||(typeof require==='function'?require('./scenario-data.js'):null),clone=x=>JSON.parse(JSON.stringify(x));
function get(id='S01'){const rows=data.filter(d=>d.id===id);if(rows.length!==1)throw Error('シナリオが存在しないか重複しています');return clone(rows[0]);}
const has=id=>data.some(d=>d.id===id);
function validate(m,d){const fail=()=>{throw Error('シナリオの初期データが不正です');};if(!d||!/^S\d{2}$/.test(d.id)||typeof d.name!=='string'||!d.name.length||typeof d.description!=='string'||d.victory!=='全12城を支配する')fail();
 for(const key of ['factions','castles','officers'])if(!Array.isArray(d[key])||d[key].length!==m[key].length||new Set(d[key].map(x=>x.id)).size!==m[key].length||d[key].some(x=>!m[key].some(y=>y.id===x.id)))fail();
 const fs=new Set(m.factions.map(f=>f.id));if(d.allowedFactions!==undefined&&(!Array.isArray(d.allowedFactions)||!d.allowedFactions.length||new Set(d.allowedFactions).size!==d.allowedFactions.length||d.allowedFactions.some(id=>!fs.has(id))))fail();if(d.initialRelations!==undefined){if(!Array.isArray(d.initialRelations)||new Set(d.initialRelations.map(r=>[r.a,r.b].sort().join(':'))).size!==d.initialRelations.length)fail();for(const r of d.initialRelations)if(!fs.has(r.a)||!fs.has(r.b)||r.a===r.b||!Number.isInteger(r.relation)||r.relation< -100||r.relation>100)fail();}for(const c of d.castles){if(!fs.has(c.ownerFactionId))fail();for(const key of ['farm','commerce','defense','troops','food','gold','publicOrder'])if(!Number.isSafeInteger(c[key])||c[key]<0||(['farm','commerce','defense','publicOrder'].includes(key)&&c[key]>100))fail();}
 for(const f of d.factions)if(!d.castles.some(c=>c.id===f.capitalCastleId&&c.ownerFactionId===f.id))fail();
 for(const o of d.officers)if(!Number.isInteger(o.loyalty)||o.loyalty<0||o.loyalty>100||(o.status==='active'?!fs.has(o.factionId)||!d.castles.some(c=>c.id===o.locationCastleId&&c.ownerFactionId===o.factionId):o.status==='ronin'?o.factionId!==null||o.locationCastleId!==null:true))fail();return d;
}
function apply(s,m,id='S01'){const d=validate(m,get(id));for(const key of ['factions','castles','officers'])for(const row of d[key]){const target=s[key].find(x=>x.id===row.id),fields=key==='factions'?['capitalCastleId']:key==='castles'?['ownerFactionId','farm','commerce','defense','troops','food','gold','publicOrder']:['factionId','locationCastleId','loyalty','status'];for(const field of fields)target[field]=row[field];}return s;}
function playable(id='S01',m=root.YABOU_DATA){return get(id).allowedFactions||m.factions.map(f=>f.id);}
function relations(s,id='S01'){for(const r of get(id).initialRelations||[])s.diplomacy[root.YabouDiplomacy.pair(r.a,r.b)].relation=r.relation;return s;}
function list(){return data.map(d=>({id:d.id,name:d.name,description:d.description,victory:d.victory}));}
root.YabouScenarios={get,has,validate,apply,list,playable,relations};if(typeof module!=='undefined')module.exports=root.YabouScenarios;
})(globalThis);
