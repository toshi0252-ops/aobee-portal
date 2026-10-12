(function(root){
 'use strict';
 const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 function make(id,name,w,h,floor){return{id,name,w,h,tiles:Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>(x===0||y===0||x===w-1||y===h-1)?'tree':floor)),blocked:new Set(),objects:[],npcs:[],doors:[]};}
 function rect(map,x,y,w,h,tile,solid=false){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){map.tiles[j][i]=tile;if(solid)map.blocked.add(i+','+j);}}
 const village=make('hoshi-village','ほしの丘',28,23,'grass');
 rect(village,3,10,22,3,'path');rect(village,12,3,3,18,'path');
 rect(village,6,8,3,3,'path');rect(village,20,8,3,3,'path');rect(village,3,16,11,2,'path');rect(village,14,18,11,2,'path');
 rect(village,3,3,6,5,'building',true);rect(village,19,3,6,5,'building',true);
 village.objects.push({id:'lumina-house',type:'house',x:3,y:3,w:6,h:5,label:'ルミナの家',color:'#bd91ae'},
 {id:'elder-house',type:'house',x:19,y:3,w:6,h:5,label:'村長の家',color:'#688ba6'});
 village.doors.push({x:6,y:8,to:'lumina-home',tx:6,ty:9,event:'visitedLuminaHome'},{x:22,y:8,to:'elder-home',tx:6,ty:9,event:'visitedElderHome'});
 rect(village,18,15,7,3,'water',true);rect(village,21,15,2,3,'bridge');
 for(let y=15;y<18;y++)for(let x=21;x<23;x++)village.blocked.delete(x+','+y);
 for(const [x,y]of [[2,3],[10,3],[17,4],[26,4],[2,8],[10,7],[17,7],[26,9],[3,14],[8,14],[10,19],[4,20],[17,20],[25,21],[24,13]]){
  village.tiles[y][x]='tree';village.objects.push({type:'tree',x,y});village.blocked.add(x+','+y);
 }
 village.objects.push({id:'fountain',type:'fountain',x:13,y:7,w:2,h:2,dialogue:'fountain'},
 {id:'sign',type:'sign',x:12,y:15,dialogue:'sign'},{id:'village-herb',type:'chest',x:5,y:16},
 {id:'forest',type:'gate',x:25,y:19,dialogue:'forest',label:'星の森へ'});
 village.npcs.push({id:'lumina',name:'ルミナ',x:14,y:11,sprite:'lumina',dialogue:'lumina'},
 {id:'elder',name:'村長オルド',x:10,y:10,sprite:'elder',dialogue:'elder'},
 {id:'gardener',name:'花守りミナ',x:18,y:12,sprite:'gardener',dialogue:'gardener'});
 function room(id,name,event){const m=make(id,name,13,12,'floor');m.visitedEvent=event;
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(x===0||y===0||x===m.w-1||y===m.h-1)m.tiles[y][x]='wall';
  rect(m,4,5,5,3,'rug');m.doors.push({x:6,y:10,to:'hoshi-village',tx:id==='lumina-home'?6:22,ty:9});return m;}
 const home=room('lumina-home','ルミナの家','visitedLuminaHome');
 home.objects.push({type:'bed',x:2,y:2,w:2,h:3},{type:'table',x:8,y:4,w:2,h:2},
 {id:'diary',type:'book',x:9,y:3,dialogue:'diary'},{type:'shelf',x:7,y:1,w:4,h:1},
 {type:'plant',x:10,y:8},{type:'window',x:4,y:1,w:2,h:1});
 const elder=room('elder-home','村長の家','visitedElderHome');
 elder.objects.push({id:'bookshelf',type:'shelf',x:2,y:1,w:4,h:1,dialogue:'bookshelf'},
 {type:'table',x:4,y:4,w:4,h:2},{type:'bed',x:9,y:2,w:2,h:3},{type:'plant',x:2,y:8},{type:'window',x:7,y:1,w:2,h:1});
 home.objects.find(o=>o.type==='bed').id='rest';home.objects.find(o=>o.type==='table').id='tea-cups';home.objects.find(o=>o.type==='table').label='ふたつのカップ';
 village.objects.push({id:'hill-gate',type:'gate',x:14,y:20,label:'夕焼けの丘へ'});
 const edge=make('forest-edge','星の森・入口',20,16,'grass');rect(edge,2,9,15,3,'path');
 edge.objects.push({id:'return-village',type:'gate',x:2,y:10,label:'村へ'},{id:'pendant',type:'book',x:15,y:6,label:'木の根元の光'});
 edge.npcs.push({id:'lumina',name:'ルミナ',sprite:'lumina',x:8,y:9});
 const hill=make('sunset-hill','夕焼けの丘',20,16,'grass');rect(hill,2,9,15,3,'path');
 rect(hill,9,2,3,10,'path');hill.objects.push({id:'return-village',type:'gate',x:10,y:2,label:'↑ ほしの丘へ'});
 hill.npcs.push({id:'lumina',name:'ルミナ',sprite:'lumina',x:15,y:8});
 for(const m of [edge,hill]){for(let y=2;y<14;y++)for(let x=2;x<18;x++){if(m.tiles[y][x]==='grass'&&(x*7+y*11)%9===0)m.objects.push({type:'plant',x,y});}for(const [x,y]of [[4,3],[7,4],[11,3],[17,3],[17,13],[6,13]]){m.objects.push({type:'tree',x,y});} }
 hill.objects=hill.objects.filter(o=>!(o.type==='plant'&&o.x>=13&&o.x<=16&&o.y>=5&&o.y<=9)&&!(['tree','plant'].includes(o.type)&&o.x>=9&&o.x<=11&&o.y>=2&&o.y<=11));
 const woods=make('memory-woods','消えた星の森・木漏れ日の道',24,20,'grass');rect(woods,2,12,11,3,'path');rect(woods,11,6,3,8,'path');rect(woods,12,6,8,3,'path');rect(woods,16,11,6,3,'water',true);rect(woods,18,11,2,3,'bridge');for(let y=11;y<14;y++)for(let x=18;x<20;x++)woods.blocked.delete(x+','+y);
 woods.objects.push({id:'return-village',type:'gate',x:2,y:13,label:'ほしの丘へ'},{id:'lost-bird',type:'bird',x:7,y:11,label:'小さな羽音'},{id:'leaf-trace',type:'trace',x:10,y:10,label:'揺れる葉'},{id:'moco-trail',type:'gate',x:19,y:7,label:'奥の道を調べる'},{id:'forest-herb',type:'chest',x:5,y:16});woods.npcs.push({id:'leafy',name:'リーフィ',sprite:'leafy',x:15,y:7});
 for(const [x,y]of [[3,4],[5,5],[8,4],[10,3],[14,3],[17,3],[20,4],[21,6],[3,9],[5,8],[8,8],[4,17],[8,17],[11,17],[14,15],[16,17],[21,16]])woods.objects.push({type:'tree',x,y});
 edge.objects.push({id:'chapter-entry',type:'gate',x:17,y:10,label:'森の奥へ'});
 const hollow=make('deer-hollow','星の森・木陰のくぼ地',22,18,'grass');rect(hollow,2,8,18,3,'path');rect(hollow,9,5,4,6,'path');
 hollow.objects.push({id:'back-woods',type:'gate',x:2,y:9,label:'木漏れ日の道へ'},{id:'spring-gate',type:'gate',x:19,y:9,label:'記憶の泉へ'},{id:'restless-deer',type:'deer',x:11,y:6,w:2,h:2,label:'眠れない鹿'},{id:'soft-leaves',type:'trace',x:7,y:12,label:'露を含んだ葉'},{id:'hollow-trace',type:'tracks',x:9,y:6,label:'蹄の跡'});
 hollow.npcs.push({id:'leafy',name:'リーフィ',sprite:'leafy',x:9,y:9});
 for(const [x,y]of [[3,4],[6,3],[9,3],[15,3],[18,4],[4,13],[11,14],[16,14],[19,13]])hollow.objects.push({type:'tree',x,y});
 const spring=make('memory-spring','星の森・記憶の泉',24,21,'grass');rect(spring,2,11,7,3,'path');rect(spring,7,6,3,11,'path');rect(spring,8,14,13,3,'path');rect(spring,16,5,4,11,'path');rect(spring,10,7,6,6,'water',true);
 spring.objects.push({id:'back-hollow',type:'gate',x:2,y:12,label:'くぼ地へ'},{id:'memory-pool',type:'pool',x:9,y:10,label:'記憶の水面'},{id:'seed-stone',type:'stone',x:7,y:7,label:'種',symbol:'seed'},{id:'sprout-stone',type:'stone',x:12,y:15,label:'芽',symbol:'sprout'},{id:'flower-stone',type:'stone',x:18,y:8,label:'花',symbol:'flower'},{id:'old-ribbon',type:'ribbon',x:5,y:6,label:'古いリボン'},{id:'spring-rest',type:'restbank',x:6,y:15,label:'苔の岸辺'},{id:'shrine-gate',type:'gate',x:21,y:15,label:'星の祠へ'},{id:'spring-herb',type:'chest',x:20,y:18});
 spring.npcs.push({id:'leafy',name:'リーフィ',sprite:'leafy',x:8,y:12});
 for(const [x,y]of [[3,3],[6,3],[11,3],[15,3],[20,4],[3,17],[8,18],[16,18],[21,7]])spring.objects.push({type:'tree',x,y});
 const shrine=make('star-shrine','星の祠・記憶の扉',25,22,'grass');rect(shrine,2,13,20,3,'path');rect(shrine,10,4,6,12,'path');rect(shrine,7,4,12,3,'path');
 shrine.objects.push({id:'back-spring',type:'gate',x:2,y:14,label:'記憶の泉へ'},{id:'guardian',type:'guardian',x:12,y:8,w:3,h:3,label:'メモリアビースト'},{id:'seal-device',type:'altar',x:12,y:3,w:2,h:1,label:'星の封印装置'},...[9,12,15].map((x,i)=>({id:'seal-ring-'+i,type:'sealring',x,y:5,label:['左の輪','中央の輪','右の輪'][i],index:i})),{id:'shrine-herb',type:'chest',x:20,y:17});
 shrine.npcs.push({id:'warbee',name:'わるびー',sprite:'warbee',x:7,y:14},{id:'leafy',name:'リーフィ',sprite:'leafy',x:10,y:12});
 for(const [x,y]of [[6,4],[19,4],[6,8],[19,8]])shrine.objects.push({type:'pillar',x,y});
 for(const [x,y]of [[3,3],[21,3],[3,8],[22,9],[5,18],[9,19],[18,19],[22,18]])shrine.objects.push({type:'tree',x,y});
 village.objects.push({type:'questbed',x:17,y:11,passable:true});
 woods.objects.push({id:'seed-woods',type:'gather',kind:'seed',x:6,y:4,label:'草の下の種',passable:true});hollow.objects.push({id:'seed-hollow',type:'gather',kind:'seed',x:5,y:12,label:'木陰の種',passable:true},{id:'nest-twig',type:'gather',kind:'twig',x:16,y:12,label:'落ちた枝',passable:true});spring.objects.push({id:'seed-spring',type:'gather',kind:'seed',x:19,y:17,label:'泉の種',passable:true},{id:'dew-cache',type:'chest',x:20,y:5,label:'根元の小箱',passable:true});
 const c2maps=(typeof module!=='undefined'&&module.exports?require('./chapter2-maps.js'):root.AobeeChapter2Maps).populate(make,rect,village);
 const c3maps=(typeof module!=='undefined'&&module.exports?require('./chapter3-maps.js'):root.AobeeChapter3Maps).populate(make,rect,c2maps['tide-harbor']);
 const maps={...c3maps,...c2maps,'star-shrine':shrine,'deer-hollow':hollow,'memory-spring':spring,'memory-woods':woods,'forest-edge':edge,'sunset-hill':hill,'hoshi-village':village,'lumina-home':home,'elder-home':elder};
 (typeof module!=='undefined'&&module.exports?require('./chapter5.js'):root.AobeeChapter5).populate(make,rect,maps);
 (typeof module!=='undefined'&&module.exports?require('./chapter6.js'):root.AobeeChapter6).populate(make,rect,maps);
 (typeof module!=='undefined'&&module.exports?require('./postgame.js'):root.AobeePostgame).populate(make,rect,maps);
 for(const m of Object.values(maps))for(const o of m.objects){for(let y=o.y;y<o.y+(o.h||1);y++)for(let x=o.x;x<o.x+(o.w||1);x++)if(o.type!=='gate'&&!o.passable)m.blocked.add(x+','+y);}
 function walkable(map,x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>0&&y>0&&x<map.w-1&&y<map.h-1&&!map.blocked.has(x+','+y)&&!map.npcs.some(n=>!n.passable&&n.x===x&&n.y===y);}
 function path(map,from,to){if(!walkable(map,to.x,to.y))return null;const queue=[{x:from.x,y:from.y}],seen=new Map([[from.x+','+from.y,null]]);let index=0;
  while(index<queue.length){const p=queue[index++];if(p.x===to.x&&p.y===to.y){const result=[];let key=p.x+','+p.y;while(seen.get(key)!==null){const [x,y]=key.split(',').map(Number);result.unshift({x,y});key=seen.get(key);}return result;}
   for(const [dx,dy]of Object.values(directions)){const x=p.x+dx,y=p.y+dy,k=x+','+y;if(!seen.has(k)&&walkable(map,x,y)&&(!(map.doors||[]).some(d=>d.x===x&&d.y===y)||(x===to.x&&y===to.y))){seen.set(k,p.x+','+p.y);queue.push({x,y});}}
  }return null;
 }
 function at(map,x,y){return map.npcs.find(n=>n.x===x&&n.y===y)||map.objects.find(o=>o.id&&x>=o.x&&x<o.x+(o.w||1)&&y>=o.y&&y<o.y+(o.h||1));}
 function distance(p,o){const x=Math.max(o.x,Math.min(p.x,o.x+(o.w||1)-1)),y=Math.max(o.y,Math.min(p.y,o.y+(o.h||1)-1));return Math.abs(p.x-x)+Math.abs(p.y-y);}
 function approach(map,p,o){let best=null;for(let y=o.y-1;y<=o.y+(o.h||1);y++)for(let x=o.x-1;x<=o.x+(o.w||1);x++)if(distance({x,y},o)===1){const route=path(map,p,{x,y});if(route&&(!best||route.length<best.length))best=route;}return best;}
 const api={maps,directions,walkable,path,at,distance,approach};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AobeeMaps=api;
})(globalThis);
