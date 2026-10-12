const assert=require('node:assert/strict');
const {maps,path,walkable,approach,distance}=require('../src/maps.js');
const start={x:13,y:12};
for(const original of Object.values(maps)){const map=original.id==='chronoa-bureau'?require('../src/chapter3-finale.js').resolve({events:{c3SecurityDoor:true,EV305:true}},original):original.id==='sea-cave'?require('../src/chapter2.js').resolve({events:{caveLow:true,driftwoodPlaced:true}},original):original;
 const origin=map.id==='hoshi-village'?start:{x:6,y:9};
 assert.ok(walkable(map,origin.x,origin.y),map.name+' spawn');
 for(const door of map.doors){
  const route=path(map,origin,door);assert.ok(route,map.name+' door reachable');assert.ok(route.slice(0,-1).every(p=>!map.doors.some(d=>d.x===p.x&&d.y===p.y)),'automatic route does not enter a different building');
  assert.ok(walkable(maps[door.to],door.tx,door.ty),'destination walkable');
 }
 for(const target of [...map.npcs,...map.objects.filter(o=>o.id&&o.type!=='house')]){
  const route=approach(map,origin,target);assert.ok(route,map.name+' '+target.id+' reachable');
  const end=route.at(-1)||origin;assert.equal(distance(end,target),1);
  let prev=origin;for(const p of route){assert.equal(Math.abs(p.x-prev.x)+Math.abs(p.y-prev.y),1);assert.ok(walkable(map,p.x,p.y));prev=p;}
 }
 assert.equal(path(map,origin,{x:0,y:0}),null,'boundary blocked');
}
assert.equal(walkable(maps['hoshi-village'],18,15),false,'pond blocked');
assert.equal(walkable(maps['hoshi-village'],21,15),true,'bridge walkable');
console.log('PASS: every door, spawn, NPC and inspectable object reachable; route adjacency; pond/bridge collision');
