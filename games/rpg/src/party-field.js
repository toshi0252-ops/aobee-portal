(function(root){
'use strict';
const names={leafy:'リーフィ',gardo:'ガルド',mira:'ミラ',warbee:'わるびー',lumina:'ルミナ'};
function roster(s){const e=s.events,all=[];if(s.characters.leafy)all.push('leafy');if(e.gardoGuest)all.push('gardo');if(e.miraGuest)all.push('mira');if(e.warbeeJoined)all.push('warbee');if(e.luminaCompanion)all.push('lumina');return [...new Set([...(s.party||[]).filter(id=>all.includes(id)),...all])];}
function resolve(s,m){const travelling=new Set(roster(s)),npcs=[],objects=[...m.objects];for(const n of m.npcs){if(travelling.has(n.sprite)){const label=n.sprite==='leafy'?m.id==='deer-hollow'?'鹿のそばで仲間と話す':m.id==='memory-spring'?'泉で仲間と記憶を確かめる':'歌の聞こえた木陰':n.sprite==='gardo'?'工房の作業台を確かめる':n.sprite==='mira'?'研究机を仲間と確かめる':n.sprite==='warbee'?'仲間と約束の場所を振り返る':'広場で仲間と話す';if(!objects.some(o=>o.id===n.id))objects.push({id:n.id,type:'partyspot',x:n.x,y:n.y,label,passable:true});}else npcs.push(n);}return {...m,npcs,objects};}
function createTrail(){let mapId=null,last=null,history=[],signature=null,stateRef=null;
 function reset(){mapId=null;last=null;history=[];signature=null;stateRef=null;}
 function poses(s,map,visual={}){const ids=roster(s),p=s.position,sig=ids.join(),vx=visual.x??p.x,vy=visual.y??p.y,sample={x:Math.round(vx),y:Math.round(vy)};if(stateRef!==s||mapId!==map.id||signature!==sig||last&&Math.abs(sample.x-last.x)+Math.abs(sample.y-last.y)>1){stateRef=s;mapId=map.id;last=null;history=[];signature=sig;}if(Math.abs(vx-sample.x)<.01&&Math.abs(vy-sample.y)<.01&&(!last||last.x!==sample.x||last.y!==sample.y)){history.unshift(sample);history=history.slice(0,32);last={...sample};}
  const used=new Set([p.x+','+p.y,sample.x+','+sample.y]),doors=new Set([...(map.doors||[]),...map.objects.filter(o=>o.type==='gate')].map(d=>d.x+','+d.y)),safe=q=>Math.abs(q.x-vx)+Math.abs(q.y-vy)>=.95&&q.x>0&&q.y>0&&q.x<map.w-1&&q.y<map.h-1&&!map.blocked.has(q.x+','+q.y)&&!map.npcs.some(n=>!n.passable&&n.x===q.x&&n.y===q.y)&&!doors.has(q.x+','+q.y);
  const [dx,dy]=({up:[0,1],down:[0,-1],left:[1,0],right:[-1,0]})[p.direction]||[0,1],dirs=[[dx,dy],[dy,-dx],[-dy,dx],[-dx,-dy]],candidates=history.slice(1).concat([1,2,3].map(n=>({x:p.x+dx*n,y:p.y+dy*n}))),queue=[{x:p.x,y:p.y,d:0}],seen=new Set([p.x+','+p.y]);for(let i=0;i<queue.length;i++){const q=queue[i];if(q.d>=3)continue;for(const [ax,ay]of dirs){const v={x:q.x+ax,y:q.y+ay,d:q.d+1},key=v.x+','+v.y;if(!seen.has(key)&&safe(v)){seen.add(key);queue.push(v);candidates.push(v);}}}
  const placed=[{x:vx,y:vy},{...p}];return ids.flatMap(id=>{const q=candidates.find(q=>safe(q)&&!used.has(q.x+','+q.y)&&!placed.some(v=>Math.abs(q.x-v.x)<.85&&Math.abs(q.y-v.y)<1.75));if(!q)return[];used.add(q.x+','+q.y);placed.push(q);return[{id:'party-'+id,member:id,sprite:id,name:names[id],x:q.x,y:q.y,passable:true,moving:!!visual.moving,direction:p.direction}];});
 }
 return{poses,reset};
}
const api={names,roster,resolve,createTrail};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AobeePartyField=api;
})(globalThis);
