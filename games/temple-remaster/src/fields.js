/* Optional connected Chapter 1 exploration fields, sharing the original renderer and save pipeline. */
var TempleFields=(()=>{
 const F={field_meadow:'風そよぐ草原',field_river:'星映しの川辺',field_deep:'迷いの森・深部',field_cave:'月明かりの隠し洞窟',field_falls:'星雫の滝と高台'};
 Object.assign(templePlaces,F);
 const mk=(trees,rocks,water,paths)=>{const rows=Array.from({length:18},(_,y)=>Array.from({length:24},(_,x)=>x===0||x===23||y===0||y===17?'#':'.'));for(const [x,y]of paths)rows[y][x]='=';for(const [x,y]of trees)rows[y][x]='t';for(const [x,y]of rocks)rows[y][x]='r';for(const [x,y]of water)rows[y][x]='w';return rows;};
 const range=(n,fn)=>Array.from({length:n},(_,i)=>fn(i));
 const line=(x,y,X,Y)=>range(Math.max(Math.abs(X-x),Math.abs(Y-y))+1,i=>[x+Math.sign(X-x)*i,y+Math.sign(Y-y)*i]);
 const data={
 field_meadow:{theme:'village',rows:mk([[3,3],[5,4],[18,4],[21,3],[3,14],[20,14]],[[8,5],[15,12]],[],[...line(12,3,12,16),...line(12,8,22,8)]),exits:[{x:12,y:16,to:'village',spawn:[21,12],name:'ほしの村へ'},{x:22,y:8,to:'field_river',spawn:[2,8],name:'川辺へ'}],chest:[5,3],grass:[[5,7],[6,7],[7,7],[6,8],[15,5],[16,5],[17,5],[18,5],[4,12],[5,12],[6,12],[17,13],[18,13]],pots:[[8,12],[16,4]],desc:'草を刈ると回復や星片が見つかる。東は川辺。'},
 field_river:{theme:'village',rows:mk([[3,4],[5,13],[20,4],[21,13]],[[4,3],[18,12]],range(16,i=>i+1).filter(y=>y!==8&&y!==9).flatMap(y=>[[11,y],[12,y],[13,y]]),[...line(1,8,22,8),...line(11,9,13,9)]),exits:[{x:1,y:8,to:'field_meadow',spawn:[21,8],name:'草原へ'}],chest:[20,3],grass:[[4,5],[5,6],[7,12],[8,12],[16,6],[17,6],[18,6],[17,14]],pots:[[19,5],[20,5]],desc:'木の橋を渡ると対岸の宝箱へ。川には入れない。'},
 field_deep:{theme:'forest',rows:mk([[3,4],[5,4],[7,4],[3,8],[4,8],[8,8],[9,8],[15,3],[16,3],[15,4],[17,8],[18,8],[20,10],[3,14],[5,14],[17,14],[21,14]],[[7,10],[13,6],[14,6],[15,6],[16,10]],[],[...line(12,3,12,16),...line(12,5,20,5)]),exits:[{x:12,y:16,to:'forest',spawn:[2,10],name:'星かげの森へ'},{x:20,y:4,to:'field_cave',spawn:[12,15],name:'隠し洞窟へ',secret:true}],chest:[4,3],grass:[[5,6],[6,6],[12,12],[14,12],[18,12],[19,12],[18,5],[20,5]],pots:[[4,6],[21,6]],desc:'森の北東、色の違う草を剣で刈ると隠し洞窟が見つかる。'},
 field_cave:{theme:'ruins',rows:mk([],[[4,4],[5,4],[6,4],[7,4],[8,4],[15,4],[16,4],[17,4],[18,4],[19,4],[5,10],[6,10],[7,10],[8,10],[15,10],[16,10],[17,10],[18,10]],[],[...line(12,2,12,16),...line(3,7,20,7)]),exits:[{x:12,y:16,to:'field_deep',spawn:[19,4],name:'森の深部へ'}],chest:[12,3],grass:[],pots:[[3,6],[4,6],[5,6],[19,6],[20,6],[21,6],[9,13],[15,13]],desc:'壺を壊して星片を集めよう。奥には旅人の宝箱。'}
 };
 // The upper bank is separated from the valley by a continuous cliff; only the stairs are passable.
 data.field_falls={theme:'forest',rows:mk([[3,3],[5,5],[21,3],[19,5],[3,12],[20,13],[16,14]],[[4,10],[18,10],[17,4]],[],[...line(7,8,7,16),...line(7,3,19,3)]),exits:[{x:7,y:16,to:'field_river',spawn:[21,2],name:'川辺へ'}],chest:[19,2],grass:[],pots:[[5,4],[20,4],[5,11]],desc:'西の階段を登り、滝の上の高台にある宝箱を探そう。'};
 const falls=data.field_falls.rows;
 for(let x=1;x<23;x++)falls[7][x]='c';
 for(const x of [7,8])falls[7][x]='s';
 for(let y=1;y<=6;y++)for(const x of [12,13])falls[y][x]='w';
 for(const x of [12,13])falls[7][x]='f';
 for(let y=8;y<=12;y++)for(let x=10;x<=15;x++)if((y-10)**2+((x-12.5)/1.6)**2<7)falls[y][x]='w';
 // A second bridge crosses the headwaters above the falls.
 for(const x of [12,13])falls[3][x]='=';
 data.field_river.rows[1][21]='=';
 data.field_river.exits.push({x:21,y:1,to:'field_falls',spawn:[7,15],name:'星雫の滝へ'});
 data.field_river.desc+=' 北東から滝へ。';
 // An optional cross-country route connects the two previously separate branches.
 const chapterFields=[
  {id:'field_ch2_grove',name:'古樹の段丘',parent:'ch2_hub',theme:'forest',stairs:[5,6],trees:[[3,3],[8,4],[15,3],[21,4],[3,11],[10,13],[21,13]],rocks:[[10,5],[16,12]],puzzle:{title:'根の三水晶',mode:'slash',points:[[4,12],[7,3],[17,4]],hint:'根に宿る水晶を剣で灯そう。',symbols:['◆','◆','◆'],prize:10}},
  {id:'field_ch3_cove',name:'潮風の断崖',parent:'ch3_port',theme:'harbor',stairs:[18,19],trees:[[4,4],[21,3]],rocks:[[7,5],[9,12],[15,13]],water:[[3,10],[4,10],[3,11],[4,11],[3,12],[4,12],[5,12],[4,13]],puzzle:{title:'潮の三灯',mode:'step',points:[[9,14],[19,9],[8,4]],hint:'三つの潮灯の床を踏んで点灯しよう。',symbols:['●','●','●'],prize:12}},
  {id:'field_ch4_terrace',name:'記憶の石段',parent:'ch4_settlement',theme:'island',stairs:[8,9],trees:[[3,4],[21,4],[4,13]],rocks:[[6,5],[15,4],[19,12],[6,12]],puzzle:{title:'記憶の碑',mode:'order',points:[[5,14],[9,4],[17,4]],hint:'碑を「月→星→太陽」の順に調べよう。',symbols:['☾','★','☀'],prize:14}},
  {id:'field_ch5_garden',name:'天星の空中庭園',parent:'ch5_court',theme:'temple',stairs:[11,12],trees:[[4,4],[20,4],[5,12],[19,12]],rocks:[[7,5],[17,5],[8,12],[16,12]],puzzle:{title:'四方の星灯',mode:'slash',points:[[4,11],[19,11],[5,3],[18,3]],hint:'四方の星灯を剣で灯し、庭園の宝箱を開こう。',symbols:['◆','◆','◆','◆'],prize:16}}
 ];
 for(const c of chapterFields){
  F[c.id]=c.name;templePlaces[c.id]=c.name;
  const rows=mk(c.trees,c.rocks,c.water||[],[...line(12,14,12,16),...line(c.stairs[0],3,c.stairs[0],6),...line(8,3,19,3)]);
  for(let x=1;x<23;x++)rows[7][x]='c';
  for(const x of c.stairs)rows[7][x]='s';
  data[c.id]={theme:c.theme,rows,exits:[{x:12,y:16,to:c.parent,spawn:[21,13],name:'元の地域へ'}],chest:[19,2],grass:[],pots:[[2,14],[21,14]],desc:'階段で高台へ。'+c.puzzle.hint,chapterField:true};
 }
 // A connected dungeon: branch out from the central hall, recover a key and
 // a tool, then return to unlock the north vault.
 const dungeonRooms={
  field_dungeon_hall:{name:'月影遺跡・大広間',rows:mk([],[[7,5],[17,5],[7,11],[17,11]],[],[...line(12,3,12,16),...line(1,8,22,8)]),exits:[{x:12,y:16,to:'field_cave',spawn:[20,12],name:'洞窟へ'},{x:1,y:8,to:'field_dungeon_key',spawn:[21,8],name:'西の鍵の間'},{x:22,y:8,to:'field_dungeon_tool',spawn:[2,8],name:'東の道具の間'},{x:12,y:2,to:'field_dungeon_vault',spawn:[12,15],name:'北の宝物庫',lock:true}],chest:[3,3],pots:[[3,12],[20,12]],desc:'西の鍵と東の水晶で北の扉が開く。'},
  field_dungeon_key:{name:'月影遺跡・鍵の間',rows:mk([],[[5,7],[6,7],[7,7],[15,7],[16,7],[17,7]],[],[...line(12,2,12,15),...line(12,8,22,8)]),exits:[{x:22,y:8,to:'field_dungeon_hall',spawn:[2,8],name:'大広間へ'}],chest:[12,3],pots:[[3,12],[20,12]],desc:'三つの床紋を踏んで鍵の宝箱を開こう。',lockedChest:true},
  field_dungeon_tool:{name:'月影遺跡・水晶の間',rows:mk([],[[5,12],[6,12]],range(16,i=>i+1).flatMap(y=>[[13,y],[14,y],[15,y]]),[...line(1,8,12,8),...line(6,4,6,8)]),exits:[{x:1,y:8,to:'field_dungeon_hall',spawn:[21,8],name:'大広間へ'}],chest:[6,4],pots:[[3,4],[3,13]],desc:'小箱で風のブーメランを手に入れ、水路の対岸の水晶へ投げよう。'},
  field_dungeon_vault:{name:'月影遺跡・宝物庫',rows:mk([],[[6,5],[17,5],[6,10],[17,10]],[],[...line(12,2,12,16),...line(5,8,19,8)]),exits:[{x:12,y:16,to:'field_dungeon_hall',spawn:[12,3],name:'大広間へ'}],chest:[12,3],pots:[[3,12],[20,12]],desc:'奥の宝箱に月影遺跡の宝が眠る。'}
 };
 for(const [id,r]of Object.entries(dungeonRooms)){F[id]=r.name;templePlaces[id]=r.name;data[id]={...r,theme:'ruins',grass:[]};}
 const labyrinths=[
  {chapter:2,name:'根守の迷宮',parent:'field_ch2_grove',color:['#405e4d','#496d54','#53775b'],mode:'slash',points:[[4,5],[19,5],[8,13]],prize:8},
  {chapter:3,name:'潮鐘の地下水路',parent:'field_ch3_cove',color:['#35576a','#42697a','#4a7584'],mode:'step',points:[[4,4],[19,4],[9,13]],prize:9},
  {chapter:4,name:'忘却の書庫',parent:'field_ch4_terrace',color:['#55516d','#625d79','#716b87'],mode:'order',points:[[4,4],[19,4],[9,13]],prize:10},
  {chapter:5,name:'星核の回廊',parent:'field_ch5_garden',color:['#536177','#68788e','#74849a'],mode:'slash',points:[[4,4],[19,4],[8,13],[17,13]],prize:12}
 ];
 const roles=['hall','key','tool','vault'];
 const dungeonIds=c=>Object.fromEntries(roles.map(role=>[role,'field_ch'+c+'_dungeon_'+role]));
 const dungeonMeta={};
 for(const role of roles)dungeonMeta['field_dungeon_'+role]={role,chapter:1,name:'月影遺跡',ids:Object.fromEntries(roles.map(r=>[r,'field_dungeon_'+r])),flag:'dungeon:waterCrystal',color:['#3d4b60','#46556a','#465467']};
 for(const d of labyrinths){
  const ids=dungeonIds(d.chapter),flag='dungeon:chapter'+d.chapter+':crystal';
  for(const role of roles){
   const r=dungeonRooms['field_dungeon_'+role],id=ids[role];
   const exits=r.exits.map(e=>({...e,to:e.to==='field_cave'?d.parent:e.to.replace('field_dungeon_','field_ch'+d.chapter+'_dungeon_'),spawn:e.to==='field_cave'?[21,12]:[...e.spawn],name:e.to==='field_cave'?'高台へ戻る':e.name}));
   const name=d.name+'・'+({hall:'大広間',key:'鍵の間',tool:'水晶の間',vault:'宝物庫'})[role];
   F[id]=name;templePlaces[id]=name;data[id]={...r,name,rows:r.rows.map(row=>[...row]),exits,theme:'ruins',grass:[],desc:role==='key'?'鍵の間の仕掛けを解いて宝箱を開こう。':role==='vault'?'守護者を倒して宝箱を開こう。':r.desc};
   // Different room layouts share the same door and reward logic.
   const rows=data[id].rows;
   if(role==='key'){
    const gaps={2:[5,6],3:[17,18],4:[10,11],5:[5,6,18,19]}[d.chapter];
    for(let x=1;x<23;x++)rows[7][x]=gaps.includes(x)?'s':d.chapter===3?'w':'c';
   }
   if(role==='hall'){
    const pillars={2:[[4,4],[19,4],[4,12],[19,12]],3:[[5,4],[6,4],[17,12],[18,12]],4:[[8,4],[16,4],[8,12],[16,12]],5:[[4,5],[5,5],[18,5],[19,5]]}[d.chapter];
    for(const [x,y]of pillars)rows[y][x]='r';
   }
   if(role==='vault'){
    const obstacles={2:[[5,7],[6,7],[18,7],[19,7]],3:[[4,8],[5,8],[19,8],[20,8]],4:[[8,8],[16,8],[8,13],[16,13]],5:[[4,4],[19,4],[10,11],[14,11]]}[d.chapter];
    for(const [x,y]of obstacles)rows[y][x]='r';
   }
   dungeonMeta[id]={...d,role,ids,flag};
  }
  data[d.parent].exits.push({x:22,y:12,to:ids.hall,spawn:[12,15],name:d.name+'へ'});
  data[d.parent].desc+=' 東に'+d.name+'の入口。';
 }
 data.field_cave.exits.push({x:22,y:12,to:'field_dungeon_hall',spawn:[12,15],name:'月影遺跡へ'});
 // Rewards from completed vaults are also permanent traversal tools.
 // Older saves which already opened a vault automatically own its tool.
 const toolDefs=[
  {chapter:1,name:'星砕きの槌',parent:'field_meadow',gate:[2,2],returnAt:[3,2],id:'field_cache_hammer',room:'ひび割れ岩の小祠',label:'ひび割れ岩',color:'#d8aa76',hint:'星砕きの槌で岩を砕く',effect:'岩が砕け、地下の入口が現れた！',rocks:[[6,5],[7,5],[8,5],[15,10],[16,10]],mode:'step',points:[[6,12],[18,6]]},
  {chapter:2,name:'根渡りの杖',parent:'field_deep',gate:[22,2],returnAt:[22,3],id:'field_cache_root',room:'根の橋の聖域',label:'途切れた根の橋',color:'#94cf80',hint:'根渡りの杖で橋を伸ばす',effect:'根が伸びて橋になった！',rocks:[[4,7],[5,7],[17,7],[18,7]],mode:'slash',points:[[5,5],[18,11]]},
  {chapter:3,name:'潮歩きの靴',parent:'field_river',gate:[19,1],returnAt:[18,1],id:'field_cache_tide',room:'潮の隠れ浜',label:'浅瀬',color:'#83d2e0',hint:'潮歩きの靴で渡る',effect:'浅瀬を渡れるようになった！',rocks:[[6,4],[17,4],[7,12],[16,12]],mode:'step',points:[[5,6],[19,12]]},
  {chapter:4,name:'記憶の鏡',parent:'field_cave',gate:[2,3],returnAt:[2,4],id:'field_cache_mirror',room:'鏡の記憶殿',label:'不思議な石壁',color:'#cdb4ec',hint:'記憶の鏡で隠し道を映す',effect:'鏡に映った階段が姿を現した！',rocks:[[6,7],[7,7],[17,7],[18,7]],mode:'order',points:[[4,5],[19,5],[10,12]]},
  {chapter:5,name:'星渡りの羽',parent:'field_falls',gate:[21,2],returnAt:[21,1],id:'field_cache_star',room:'天空の星庭',label:'浮遊する星門',color:'#f5d780',hint:'星渡りの羽で星門を開く',effect:'星門がつながった！',rocks:[[5,5],[18,5],[7,10],[16,10]],mode:'slash',points:[[5,12],[18,12],[12,7]]}
 ];
 for(const t of toolDefs){
  F[t.id]=t.room;templePlaces[t.id]=t.room;
  const rows=mk([],t.rocks,[],[...line(12,3,12,16),...line(5,8,19,8)]);
  data[t.id]={theme:'ruins',rows,exits:[{x:12,y:16,to:t.parent,spawn:t.returnAt,name:'元の場所へ'}],chest:[12,3],grass:[],pots:[[3,12],[20,12]],desc:t.room+'の紋を起動すると宝箱が開く。',lockedChest:true,toolRoom:true};
  data[t.parent].rows[t.gate[1]][t.gate[0]]='=';
  data[t.parent].exits.push({x:t.gate[0],y:t.gate[1],to:t.id,spawn:[12,15],name:t.room+'へ',tool:t.chapter});
  data[t.parent].desc+=' '+t.label+'には'+t.name+'が必要。';
 }
 data.field_cave.desc+=' 東に月影遺跡の入口。';
 data.field_river.rows[16][21]='=';
 data.field_river.exits.push({x:21,y:16,to:'field_deep',spawn:[2,2],name:'森の深部へ'});
 data.field_deep.rows[1][2]='=';
 data.field_deep.exits.push({x:2,y:1,to:'field_river',spawn:[21,15],name:'川辺へ'});
 data.field_river.desc+=' 南東の道は森へ通じる。';
 data.field_deep.desc+=' 北西の道から川辺に戻れる。';
 // Hand-shaped clusters: dense meadows, riverbank reeds and forest undergrowth.
 const patches={
  field_meadow:[[5,7,4,3],[17,5,4,3],[5,12,4,3],[17,12,4,3],[11,4,3,2],[21,10,2,3]],
  field_river:[[5,5,4,3],[8,13,3,3],[16,5,3,3],[17,13,4,3],[3,11,2,3]],
  field_deep:[[5,6,3,2],[10,11,3,3],[18,12,4,3],[19,5,3,2],[7,14,3,2]],
  field_falls:[[4,4,3,2],[17,4,4,2],[4,13,3,3],[19,12,3,3]]
 };
 for(const c of chapterFields)patches[c.id]=[[4,4,2,2],[17,4,3,2],[4,13,3,2],[20,12,2,2]];
 const hash=(x,y)=>(x*127+y*311+x*y*17)%101;
 for(const [id,clusters] of Object.entries(patches)){
  const m=data[id],known=new Set(m.grass.map(p=>p.join(',')));
  for(const [cx,cy,rx,ry] of clusters)for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){
   const k=x+','+y;
   if(m.rows[y]?.[x]!=='.'||known.has(k)||m.chest.join(',')===k||m.pots.some(p=>p.join(',')===k)||m.exits.some(e=>e.x===x&&e.y===y))continue;
   if(((x-cx)/rx)**2+((y-cy)/ry)**2>1.07||(x*13+y*19+x*y)%11===0)continue;
   known.add(k);m.grass.push([x,y]);
  }
 }
 const clippings=[];
 const pickupFX=[];
 // Shared exploration props on the original story maps. Coordinates are deliberately
 // away from the central routes, exits, NPCs, story pickups and puzzle terminals.
 const commonLayouts={
  village:{grass:[[3,8,1,1],[20,8,1,1],[3,13,1,1],[20,13,1,1]],pots:[[3,15],[21,15]]},
  ch5_festival:{grass:[[3,13,1,1],[20,13,1,1]],pots:[[3,15],[21,15]]},
  forest:{grass:[[2,12],[3,12],[2,13],[6,14],[7,14],[7,15],[20,14],[21,14],[21,15],[20,6],[21,6],[21,7]],pots:[[3,15],[20,15]]},
  ruins:{pots:[[2,3],[3,3],[21,3],[22,3],[2,14],[22,14]]},annex:{pots:[[2,3],[3,3],[21,3],[22,3],[2,14],[22,14]]},
  ch2_gate:{grass:[[3,7,2,1],[20,12,2,2],[3,13,2,2]]},ch2_hub:{grass:[[3,4,2,2],[20,4,2,2],[4,14,2,2],[20,14,2,2]]},
  ch2_water:{grass:[[3,12,2,2],[21,3,1,2],[4,4,2,2]],pots:[[21,13],[2,14]]},
  ch2_canopy:{grass:[[3,3,2,1],[21,3,1,2],[3,13,2,2],[21,14,1,1]]},
  ch2_cave:{pots:[[2,3],[3,3],[21,3],[2,13],[3,14],[21,14]]},
  ch2_tower_gate:{grass:[[3,11,2,2],[21,12,1,2]]},
  ch2_tower1:{pots:[[2,3],[21,3],[2,14],[21,14]]},ch2_tower2:{pots:[[2,3],[21,3],[2,14],[21,14]]},ch2_tower3:{pots:[[2,3],[21,3],[2,14],[21,14]]},
  ch3_port:{pots:[[6,3],[7,3],[21,4],[21,14],[4,15]],grass:[[20,14,1,1]]},
  ch3_shore:{grass:[[3,3,1,1],[20,14,2,1],[2,12,1,2]],pots:[[21,3],[2,15]]},
  ch3_observatory:{pots:[[2,3],[21,3],[2,14],[21,14]]},ch3_lighthouse:{pots:[[2,3],[21,3],[2,14],[21,14]]},
  ch4_landing:{grass:[[7,3,2,1],[21,12,1,2],[7,14,2,1]],pots:[[21,3],[6,14]]},
  ch4_settlement:{grass:[[3,3,1,1],[21,3,1,1],[3,14,1,1]],pots:[[21,14],[5,15]]},
  ch4_archive:{pots:[[2,3],[22,3],[2,14],[22,14]]},ch4_storage:{pots:[[2,3],[21,3],[2,14],[21,14]]},ch4_chart:{pots:[[2,3],[21,3],[2,14],[21,14]]},
  ch5_court:{grass:[[3,3,1,1],[21,3,1,1],[3,14,1,1],[21,14,1,1]],pots:[[5,14],[19,14]]},
  ch5_village:{grass:[[3,3,1,1],[21,14,1,1]],pots:[[3,14],[21,3]]},
  ch5_forest:{grass:[[3,3,2,1],[21,3,1,1],[3,14,2,1],[21,14,1,1]]},
  ch5_port:{pots:[[2,3],[21,3],[2,14],[21,14]]},ch5_island:{pots:[[2,3],[21,3],[2,14],[21,14]],grass:[[4,3,1,1],[20,14,1,1]]}
 };
 const common={};
 for(const [id,layout] of Object.entries(commonLayouts)){
  const grass=new Map(),pots=layout.pots||[];
  for(const [x,y,rx=0,ry=0] of layout.grass||[])for(let a=x-rx;a<=x+rx;a++)for(let b=y-ry;b<=y+ry;b++)if(a>=2&&a<=21&&b>=3&&b<=15&&!pots.some(([px,py])=>px===a&&py===b))grass.set(a+','+b,[a,b]);
  common[id]={grass:[...grass.values()],pots};
 }
 // Optional challenges are independent of the main story and existing treasure.
 const puzzles={
  field_meadow:{title:'三つの星碑',mode:'order',points:[[7,3],[14,6],[19,11]],hint:'夜の始まりを照らすもの、夜空の小さな光、朝を告げるもの。',symbols:['☾','★','☀'],prize:8},
  field_river:{title:'川辺の水晶',mode:'slash',points:[[7,4],[17,4],[18,14]],hint:'川の両岸にある3つの水晶を剣で光らせよう。',symbols:['◆','◆','◆'],prize:10},
  field_cave:{title:'月の足跡',mode:'step',points:[[9,8],[12,11],[15,8]],hint:'洞窟にある3つの床スイッチを踏んでみよう。',symbols:['●','●','●'],prize:12}
 };
 for(const c of chapterFields)puzzles[c.id]=c.puzzle;
 puzzles.field_dungeon_key={title:'鍵の床紋',mode:'step',points:[[5,4],[18,4],[8,13]],hint:'三つの床紋を踏もう。',symbols:['●','●','●'],prize:5};
 for(const d of labyrinths)puzzles[dungeonIds(d.chapter).key]={title:d.name+'の鍵',mode:d.mode,points:d.points,hint:d.mode==='order'?'月→星→太陽の順に碑を調べよう。':d.mode==='step'?'床紋をすべて踏もう。':'水晶をすべて剣で灯そう。',symbols:d.mode==='order'?['☾','★','☀']:d.points.map(()=>d.mode==='step'?'●':'◆'),prize:d.prize};
 for(const t of toolDefs)puzzles[t.id]={title:t.room+'の星紋',mode:t.mode,points:t.points,hint:t.mode==='order'?'月→星→太陽の順に調べよう。':t.mode==='step'?'床紋をすべて踏もう。':'水晶を剣で起動しよう。',symbols:t.mode==='order'?['☾','★','☀']:t.points.map(()=>t.mode==='step'?'●':'◆'),prize:10+t.chapter*2};
 // Keep saved point indexes, but make the coastal floor puzzle a sequence.
 Object.assign(puzzles.field_ch3_cove,{sequence:true,symbols:['月','潮','灯'],hint:'月が海を引き、潮が満ち、それから帰りの船を灯りで導く。'});
 puzzles.field_ch4_terrace.hint='夜を照らす大きな光、夜空の小さな光、朝を照らす光。古い順に碑を調べよう。';
 const puzzleMistakes=new Map();let lastPlate='';
 for(const [id,p] of Object.entries(puzzles)){
  const m=data[id];m.grass=m.grass.filter(([x,y])=>!p.points.some(([a,b])=>a===x&&b===y));
  m.desc+=' '+p.hint;
 }
 const entries={village:{x:22,y:12,to:'field_meadow',spawn:[12,15],name:'東：草原へ'},forest:{x:1,y:10,to:'field_deep',spawn:[12,15],name:'西：森の深部へ'}};
 for(const c of chapterFields)entries[c.parent]={x:22,y:13,to:c.id,spawn:[12,15],name:c.name+'へ'};
 let state={broken:[],taken:[],chests:[],goal:''};
 const here=()=>Object.hasOwn(data,area),key=(area,x,y)=>area+':'+x+','+y,broken=(x,y)=>state.broken.includes(key(area,x,y)),taken=(x,y)=>state.taken.includes(key(area,x,y));
 const current=()=>data[area],secretOpen=()=>state.broken.includes(key('field_deep',20,5));
 // Physical challenges share the same save state as the field puzzles.
 const trials={
  field_cache_hammer:{kind:'rock',name:'重石の祭壇',hint:'岩を北へ押して金色の床に載せよう。中央の石碑でリセット。',start:[10,13],target:[10,10],reset:[12,14]},
  field_cache_root:{kind:'pit',name:'根の架け橋',hint:'黒い穴に注意。南岸の根を調べ、架け橋を渡ろう。',lever:[12,9]},
  field_cache_tide:{kind:'ferry',name:'潮の渡し台',hint:'南北の船着き場で調べると、足場に乗って渡れる。',south:[12,10],north:[12,6]},
  field_cache_mirror:{kind:'mirror',name:'反射の回廊',hint:'右の反射鏡をブーメランで起動してから左の石碑を調べよう。',crystal:[17,8],terminal:[5,8]},
  field_cache_star:{kind:'combo',name:'三道具の星門',hint:'根渡りの杖・潮歩きの靴・記憶の鏡で三つの星紋を起動。',nodes:[{at:[5,8],tool:2},{at:[19,8],tool:3},{at:[12,11],tool:4}]}
 };
 for(const [id,t]of Object.entries(trials))data[id].desc+=' '+t.hint;
 // Pit and ferry occupy real terrain; existing story maps are untouched.
 for(let x=8;x<=16;x++)data.field_cache_root.rows[8][x]='p';
 for(let y=7;y<=9;y++)for(let x=1;x<23;x++)data.field_cache_tide.rows[y][x]='w';
 const trial=()=>trials[area],trialKey=(id,k)=>'trial:'+id+':'+k,trialHas=(k,id=area)=>state.broken.includes(trialKey(id,k));
 const trialDone=()=>!trial()||trialHas('done');
 function trialMark(k){if(!trialHas(k))state.broken.push(trialKey(area,k));}
 function finishTrial(){if(trialHas('done'))return;trialMark('done');toast(trial().name+'を解いた！');if(typeof TempleCinematic==='object')TempleCinematic.celebrate(trial().name);saveGame(true);}
 function rockPos(){const t=trial(),v=state.broken.find(k=>k.startsWith(trialKey(area,'rock:')));return v?v.split(':').at(-1).split(',').map(Number):t.start;}
 let ferryRide=null,ferryY=10;
 function trialWall(x,y){const t=trial();if(!t)return false;if(t.kind==='rock'){const [a,b]=rockPos();return x===a&&y===b;}return !!ferryRide&&ferryRide.area===area;}
 function trialAction(){const t=trial();if(!t)return false;if(ferryRide&&ferryRide.area===area)return true;
  const near=([x,y])=>Math.hypot(player.x-x,player.y-y)<=1.1;
  if(t.kind==='rock'){
   const [dx,dy]=({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[player.dir]||[0,-1],x=player.x+dx,y=player.y+dy,[a,b]=rockPos();
   if(x===a&&y===b){if(trialDone()){toast('重石は固定された');return true;}const nx=a+dx,ny=b+dy;if(nx<8||nx>14||ny<9||ny>14||blocked(nx,ny)||nx===t.reset[0]&&ny===t.reset[1]){toast('これ以上押せない');return true;}state.broken=state.broken.filter(k=>!k.startsWith(trialKey(area,'rock:')));trialMark('rock:'+nx+','+ny);if(nx===t.target[0]&&ny===t.target[1])finishTrial();else{toast('岩を押した');saveGame(true);}return true;}
   if(x===t.reset[0]&&y===t.reset[1]){if(!trialDone()){state.broken=state.broken.filter(k=>!k.startsWith(trialKey(area,'rock:')));toast('岩を元の位置に戻した');saveGame(true);}return true;}
  }
  if(t.kind==='pit'&&near(t.lever)){if(!trialHas('bridge')){if(!hasTool(2)){toast('根渡りの杖が必要');return true;}trialMark('bridge');toast('根の橋が伸びた！');saveGame(true);}else toast('橋を渡って北へ');return true;}
  if(t.kind==='ferry'&&(near(t.south)||near(t.north))){const from=near(t.south)?t.south:t.north,to=from===t.south?t.north:t.south;player.x=from[0];player.y=from[1];ferryY=from[1];ferryRide={area,from:from[1],to:to[1],time:0};templeMove=templeAttack=null;clearStick();return true;}
  if(t.kind==='mirror'&&near(t.terminal)){if(!trialHas('reflect'))toast('先に右の鏡をブーメランで起動');else if(!trialDone())finishTrial();else toast('反射回路は安定している');return true;}
  if(t.kind==='combo'){const i=t.nodes.findIndex(n=>near(n.at));if(i>=0){if(!hasTool(t.nodes[i].tool)){toast(toolDefs[t.nodes[i].tool-1].name+'が必要');return true;}trialMark('node'+i);if(t.nodes.every((_,n)=>trialHas('node'+n)))finishTrial();else{toast('星紋が光った');saveGame(true);}return true;}}
  return false;
 }
 function trialStep(){if(ferryRide&&ferryRide.area!==area)ferryRide=null;const t=trial();if(!t||!usable())return;
  if(t.kind==='pit'&&current().rows[player.y]?.[player.x]==='p'){if(player.x===12&&trialHas('bridge'))finishTrial();else{player.x=12;player.y=10;templeMove=null;clearStick();TempleJourney.resetParty();TempleCombat.hurt(1);toast('穴に落ちた！ 南岸に戻った');saveGame(true);}}
  if(ferryRide&&ferryRide.area===area){ferryRide.time+=1000/60;const f=ferryRide,p=Math.min(1,f.time/1500);ferryY=f.from+(f.to-f.from)*p;player.x=12;player.y=Math.round(ferryY);templeMove=null;if(p>=1){ferryRide=null;TempleJourney.resetParty();finishTrial();saveGame(true);}}
 }
 const dungeon=()=>dungeonMeta[area],dungeonReady=()=>!!dungeon()&&state.chests.includes(dungeon().ids.key)&&state.broken.includes(dungeon().flag);
 const bossDefs={
  1:{name:'月影の石騎士',max:18,color:'#b1b9d1',mode:'timed',hint:'赤い円から離れ、攻撃後の隙を狙う',points:[]},
  2:{name:'古樹の根守',max:24,color:'#8cb86c',mode:'slash',hint:'左右の根水晶を剣で灯して鎧を解除',points:[[5,8],[19,8]]},
  3:{name:'潮鐘の水蛇',max:28,color:'#63c7dc',mode:'step',hint:'二つの排水床を踏み、横波を避ける',points:[[4,12],[19,12]]},
  4:{name:'忘却の鏡守',max:32,color:'#bb9de2',mode:'wind',hint:'右の鏡をブーメランで起動して反射を止める',points:[[18,12]]},
  5:{name:'天星の守護機竜',max:38,color:'#f3cb73',mode:'step',hint:'四方の星床を踏んで防壁を解除',points:[[5,6],[19,6],[5,13],[19,13]]}
 };
 const bossFlag=(d,i)=>'vaultboss:'+d.chapter+':'+i;
 let bossRun={area:'',time:0,phase:'wait',cycle:0,target:[12,8]};
 function bossConfig(){const d=dungeon();if(d?.role!=='vault'||state.chests.includes(area)||state.broken.includes(bossFlag(d,'done')))return null;return {d,c:bossDefs[d.chapter]};}
 function bossLit(d,i){return state.broken.includes(bossFlag(d,i));}
 function bossReady(d,c){return c.points.length>0&&c.points.every((_,i)=>bossLit(d,i));}
 function markBossNode(i){const b=bossConfig();if(!b||bossLit(b.d,i))return false;state.broken.push(bossFlag(b.d,i));toast(b.c.points.every((_,n)=>bossLit(b.d,n))?'防壁が解除された！':'守護紋が光った');saveGame(true);return true;}
 function vaultBoss(){const b=bossConfig();if(!b||typeof TempleCombat!=='object'||TempleCombat.remaining()>0)return null;const {d,c}=b;return {id:'vault'+d.chapter,name:c.name,max:c.max,remaining:1,x:12,y:6,strict:true,open:c.mode==='timed'?bossRun.phase==='recover':bossReady(d,c),hint:c.hint,api:{completeCombat(){state.broken.push(bossFlag(d,'done'));toast(c.name+'を撃破！ 宝箱が開いた');saveGame(true);}}};}
 function bossDanger(c,x,y){const [tx,ty]=bossRun.target;if(c.mode==='timed')return Math.hypot(x-12,y-6)<=3;const n=bossRun.cycle;if(c.mode==='slash')return Math.abs(x-tx)<=1;if(c.mode==='wind')return Math.abs(x-tx)<=1||Math.abs(y-ty)<=1;if(c.mode==='step'&&c.max===28)return Math.abs(y-ty)<=1;return (x<12)===(tx<12)&&(y<9)===(ty<9);}
 function bossTick(){const b=vaultBoss();if(!b||!usable()){if(bossRun.area!==area)bossRun={area:'',time:0,phase:'wait',cycle:0,target:[12,8]};return;}
  const info=bossConfig(),{d,c}=info;if(bossRun.area!==area)bossRun={area,time:0,phase:'wait',cycle:0,target:[12,8]};
  if(c.mode==='step')for(let i=0;i<c.points.length;i++){const [x,y]=c.points[i];if(player.x===x&&player.y===y)markBossNode(i);}
  bossRun.time+=1000/60;
  if(bossRun.phase==='wait'&&bossRun.time>=1400){bossRun.phase='warning';bossRun.time=0;bossRun.target=[player.x,player.y];}
  else if(bossRun.phase==='warning'&&bossRun.time>=850){if(bossDanger(c,player.x,player.y))TempleCombat.hurt(1);bossRun.phase='recover';bossRun.time=0;}
  else if(bossRun.phase==='recover'&&bossRun.time>=1800){bossRun.phase='wait';bossRun.time=0;bossRun.cycle++;}
 }
 function bossSweep(test){const b=bossConfig();if(!b||!vaultBoss()||b.c.mode!=='slash')return false;let hit=false;for(let i=0;i<b.c.points.length;i++){const [x,y]=b.c.points[i];if(test({x,y}))hit=markBossNode(i)||hit;}return hit;}
 const vaultId=n=>n===1?'field_dungeon_vault':'field_ch'+n+'_dungeon_vault';
 const hasTool=n=>state.chests.includes(vaultId(n));
 const toolFlag=n=>'toolgate:'+n;
 const exitAvailable=e=>(!e.secret||secretOpen())&&(!e.lock||dungeonReady())&&(!e.tool||hasTool(e.tool)&&state.broken.includes(toolFlag(e.tool)));
 function toolAction(){const e=current().exits.find(e=>e.tool&&!exitAvailable(e)&&Math.hypot(player.x-e.x,player.y-e.y)<=1.5);if(!e)return false;const t=toolDefs[e.tool-1];if(!hasTool(e.tool)){toast(t.hint+'には第'+t.chapter+'章の遺跡の宝が必要');return true;}state.broken.push(toolFlag(e.tool));toast(t.effect);saveGame(true);return true;}
 function airPassage(x,y){return dungeon()?.role==='tool'&&y===8&&x>=13&&x<=15;}
 function boomerangHit(x,y){const t=trial();if(t?.kind==='mirror'&&x===t.crystal[0]&&y===t.crystal[1]&&!trialHas('reflect')){trialMark('reflect');toast('鏡が光った！ 左の石碑へ');saveGame(true);return true;}const b=bossConfig();if(b?.c.mode==='wind'&&vaultBoss()&&b.c.points[0][0]===x&&b.c.points[0][1]===y)return markBossNode(0);const d=dungeon();if(d?.role!=='tool'||x!==17||y!==8||state.broken.includes(d.flag))return false;state.broken.push(d.flag);toast('対岸の水晶が灯った！ 大広間の北の扉へ');saveGame(true);return true;}
 function dungeonAction(){
  const d=dungeon();if(!d)return false;
  if(d.role==='tool'&&Math.hypot(player.x-6,player.y-4)<=1.5){
   if(!state.chests.includes(area)){state.chests.push(area);showLoot('風のブーメラン');TempleCombat.grantShards(5);saveGame(true);}
   if(!TempleAdventure.getState().boomerang)TempleAdventure.acquire();else toast('風のブーメランを水路の対岸へ投げよう');return true;
  }
  if(d.role==='hall'&&!dungeonReady()&&Math.hypot(player.x-12,player.y-2)<=1.5){toast((state.chests.includes(d.ids.key)?'鍵あり':'西の鍵が必要')+' ／ '+(state.broken.includes(d.flag)?'水晶点灯済':'東の水晶が必要'));return true;}
  return false;
 }
 function props(){if(here()){const m=current(),valid=([x,y])=>['.','=','s'].includes(m.rows[y]?.[x])&&!m.exits.some(e=>e.x===x&&e.y===y)&&!(m.chest[0]===x&&m.chest[1]===y);return {grass:m.grass.filter(p=>valid(p)&&!m.pots.some(q=>q[0]===p[0]&&q[1]===p[1])),pots:m.pots.filter(valid)};}const m=common[area];if(!m)return null;return {grass:m.grass.filter(([x,y])=>!wall(x,y)),pots:m.pots.filter(([x,y])=>!wall(x,y))};}
 const puzzleKey=(id,i)=>'puzzle:'+id+':'+i;
 const lit=(id,i)=>state.broken.includes(puzzleKey(id,i));
 const solved=id=>lit(id,'done');
 const blockStart=[[10,13],[14,13]],blockTargets=[[10,11],[14,11]],blockReset=[12,14],blockPrefix='block:cave:';
 data.field_cave.desc+=' 石箱の前で調べると押せる。2つの金色の床へ運ぼう。中央の石碑でやり直せる。';
 const blockDone=()=>state.broken.includes(blockPrefix+'done');
 function blockPositions(){return blockStart.map((p,i)=>{const k=state.broken.find(k=>k.startsWith(blockPrefix+i+':'));if(!k)return p;const a=k.split(':').at(-1).split(',').map(Number);return a.length===2&&a.every(Number.isInteger)?a:p;});}
 const blockAt=(x,y)=>area==='field_cave'&&blockPositions().some(([a,b])=>a===x&&b===y);
 function blockAction(){if(area!=='field_cave')return false;
  const d=({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[player.dir]||[0,-1],x=player.x+d[0],y=player.y+d[1],positions=blockPositions(),i=positions.findIndex(([a,b])=>a===x&&b===y);
  if(i>=0){if(blockDone()){toast('石箱の封印は解けている');return true;}const nx=x+d[0],ny=y+d[1];if(nx<9||nx>15||ny<10||ny>14||blocked(nx,ny)||current().exits.some(e=>e.x===nx&&e.y===ny)||puzzles.field_cave.points.some(([a,b])=>a===nx&&b===ny)||blockReset[0]===nx&&blockReset[1]===ny){toast('これ以上押せない');return true;}
   state.broken=state.broken.filter(k=>!k.startsWith(blockPrefix+i+':'));state.broken.push(blockPrefix+i+':'+nx+','+ny);
   if(blockTargets.every(([a,b])=>blockPositions().some(([c,d])=>a===c&&b===d))){state.broken.push(blockPrefix+'done');TempleCombat.grantShards(15);toast('石箱の封印解除！ 星片15個');}else toast('石箱を押した');saveGame(true);return true;}
  if(x===blockReset[0]&&y===blockReset[1]){if(!blockDone()){state.broken=state.broken.filter(k=>!k.startsWith(blockPrefix));toast('石箱を元の位置に戻した');saveGame(true);}else toast('封印解除済み');return true;}return false;
 }
 function light(i){const p=puzzles[area];if(!p||solved(area)||lit(area,i))return false;
  if((p.mode==='order'||p.sequence)&&p.points.slice(0,i).some((_,n)=>!lit(area,n))){
   const misses=(puzzleMistakes.get(area)||0)+1;puzzleMistakes.set(area,misses);
   state.broken=state.broken.filter(k=>!k.startsWith('puzzle:'+area+':'));toast('順番が違う。'+(misses>=2?'ヒント：'+p.symbols.join(' → '):p.hint));saveGame(true);return true;
  }
  state.broken.push(puzzleKey(area,i));
  if(p.points.every((_,n)=>lit(area,n))){state.broken.push(puzzleKey(area,'done'));puzzleMistakes.delete(area);TempleCombat.grantShards(p.prize);toast(p.title+' 完成！ 星片'+p.prize+'個');if(typeof TempleCinematic==='object')TempleCinematic.celebrate(p.title,'仕掛けを解いた！',p.points[i]);}
  else toast(p.title+'：'+p.points.filter((_,n)=>lit(area,n)).length+'/'+p.points.length);
  saveGame(true);return true;
 }
 function puzzleSlash(test,seen){const p=puzzles[area];if(p?.mode!=='slash'||solved(area))return false;let hit=false;for(let n=0;n<p.points.length;n++){const [x,y]=p.points[n],k=puzzleKey(area,n);if(!seen.has(k)&&test({x,y})&&!lit(area,n)){seen.add(k);hit=light(n)||hit;}}return hit;}
 function puzzleAction(){const p=puzzles[area];if(p?.mode!=='order')return false;const n=p.points.findIndex(([x,y])=>Math.hypot(player.x-x,player.y-y)<=1.5);if(n<0)return false;if(solved(area))toast('星碑の光が輝いている');else if(!light(n))toast(p.hint);return true;}
 function puzzleStep(){const p=puzzles[area],plate=area+':'+player.x+','+player.y;if(!usable()||p?.mode!=='step'||solved(area)){lastPlate='';return;}if(plate===lastPlate)return;lastPlate=plate;const n=p.points.findIndex(([x,y])=>x===player.x&&y===player.y);if(n>=0)light(n);}
 const usable=()=>s101CanInteract()&&!playMenuOpen&&!landscapeBlocked&&!chapterClearOpen&&!document.hidden;
 function enter(to,spawn){const before=area;if(!here()&&data[to])state.goal=$('objective').textContent;area=to;[player.x,player.y]=spawn;player.dir='up';templeMove=templeAttack=null;clearStick();if(here())objective(current().desc);else objective(state.goal||'冒険を続けよう');TempleJourney.resetParty();toast(templePlaces[to]);saveGame(true);}
 function blocked(x,y){const m=current();if(!Number.isInteger(x)||!Number.isInteger(y)||!m.rows[y]?.[x]||'#trwcf'.includes(m.rows[y][x]))return true;if(m.exits.some(e=>e.x===x&&e.y===y&&!exitAvailable(e)))return true;if(trialWall(x,y)||blockAt(x,y))return true;if(m.chest[0]===x&&m.chest[1]===y)return true;if(m.pots.some(p=>p[0]===x&&p[1]===y)&&!broken(x,y))return true;return area==='field_deep'&&x===20&&y===4&&!secretOpen();}
 const oldWall=wall;wall=function(x,y){return here()?blocked(x,y):oldWall(x,y)};
 const oldMove=move;move=function(dx,dy){if(!here()){const from=area;oldMove(dx,dy);const ex=entries[area];if(usable()&&from===area&&ex&&(player.x===ex.x&&player.y===ex.y||from==="forest"&&dx<0&&player.x<=2&&Math.abs(player.y-ex.y)<=1))enter(ex.to,ex.spawn);return;}if(!usable()||ferryRide&&ferryRide.area===area)return;player.dir=dx<0?'left':dx>0?'right':dy<0?'up':'down';const x=player.x+dx,y=player.y+dy;if(blocked(x,y))return;player.x=x;player.y=y;const ex=current().exits.find(e=>e.x===x&&e.y===y&&exitAvailable(e));if(ex){enter(ex.to,ex.spawn);return;}TempleJourney.recordFieldStep?.();trialStep();saveGame(true);};
 function reward(x,y,kind){const h=hash(x,y);if(kind==='grass')return h<2?'heart':h<18?'shard':null;if((area==='ruins'&&x===2&&y===14)||(area==='forest'&&x===20&&y===15))return 'heart';return h<6?'heart':'shard';}
 function sweep(test,seen){const m=props();if(!m)return false;let hit=false;for(const [kind,list]of [['grass',m.grass],['pot',m.pots]])for(const [x,y]of list){const id=key(area,x,y);if(broken(x,y)||seen.has(id)||!test({x,y}))continue;seen.add(id);state.broken.push(id);hit=true;for(let i=0;i<(kind==='grass'?9:12);i++)clippings.push({area,x:x*40+20,y:y*40+20,vx:Math.cos(i*2.4)*(.025+i*.006),vy:Math.sin(i*2.4)*(.025+i*.006),time:performance.now(),i,kind});if(area==='field_deep'&&x===20&&y===5){toast('草の奥から、隠し洞窟の入口が現れた！');objective('北東の隠し洞窟へ進めるようになった');}else if(kind==='pot')toast('壺を壊した！');}if(hit)saveGame(true);return hit;}
 function collect(){const m=props();if(!m||!usable())return;const p=typeof TempleFreeMove==='object'?TempleFreeMove.position():player;for(const [kind,list]of [['grass',m.grass],['pot',m.pots]])for(const [x,y]of list){if(!broken(x,y)||taken(x,y)||Math.hypot(p.x-x,p.y-y)>.95)continue;const r=reward(x,y,kind);if(!r||r==='heart'&&player.hp>=maxHealth())continue;state.taken.push(key(area,x,y));pickupFX.push({area,x:x*40+20,y:y*40+20,time:performance.now(),r});if(r==='heart'){player.hp=Math.min(maxHealth(),player.hp+1);updateHud();toast('ハートを回収！');}else TempleCombat.grantShards(1);saveGame(true);}}
 const prevAction=action;action=function(){if(!here()||!usable()){prevAction();return;}const [x,y]=current().chest;if(Math.hypot(player.x-x,player.y-y)<=1.5){if(!state.chests.includes(area)&&!trialDone()){toast(trial().hint);return;}if((current().chapterField||current().lockedChest)&&!solved(area)){toast('高台の仕掛けを解くと開く');return;}if(dungeon()?.role==='vault'&&(TempleCombat.remaining()>0||vaultBoss())){toast('守護者を全て倒すと開く');return;}if(state.chests.includes(area)){toast('宝箱は回収済み');return;}state.chests.push(area);showLoot(dungeon()?.role==='vault'?toolDefs[dungeon().chapter-1].name+' 入手！':'宝箱発見！');const reward=dungeon()?.role==='vault'?25:current().chapterField?15:area==='field_cave'||current().lockedChest?12:5;TempleCombat.grantShards(reward);toast(dungeon()?.role==='vault'?(toolDefs[dungeon().chapter-1].name+'を入手！ 星片'+reward+'個'):'宝箱を開いた！ 星片'+reward+'個');saveGame(true);return;}const ex=current().exits.find(e=>Math.hypot(player.x-e.x,player.y-e.y)<=1.5&&exitAvailable(e));if(ex){enter(ex.to,ex.spawn);return;}toast(current().desc);};
 const fieldAction=action;action=function(){if(area==="forest"&&usable()&&entries[area]&&(!(typeof TempleInteraction==='object'&&TempleInteraction.current())||TempleInteraction.match(entries[area].x,entries[area].y))&&Math.hypot(player.x-entries[area].x,player.y-entries[area].y)<=1.5){const e=entries[area];enter(e.to,e.spawn);return;}if(here()&&usable()&&(trialAction()||toolAction()||dungeonAction()||blockAction()||puzzleAction()))return;fieldAction();};
 const prevStep=simulationStep;simulationStep=function(t){prevStep(t);collect();puzzleStep();bossTick();trialStep();};
 const prevSnapshot=snapshot;snapshot=function(){return {...prevSnapshot(),fields:{broken:[...state.broken],taken:[...state.taken],chests:[...state.chests],goal:state.goal}}};
 const prevRestore=restoreGame;restoreGame=function(d){if(!validSave(d))return false;bossRun={area:"",time:0,phase:"wait",cycle:0,target:[12,8]};lootFx=null;pickupFX.length=0;clippings.length=0;ferryRide=null;ferryY=10;const s=d?.fields||{};state={broken:Array.isArray(s.broken)?s.broken.filter(v=>typeof v==='string'):[],taken:Array.isArray(s.taken)?s.taken.filter(v=>typeof v==='string'):[],chests:Array.isArray(s.chests)?s.chests.filter(v=>Object.hasOwn(F,v)):[],goal:typeof s.goal==='string'?s.goal:''};puzzleMistakes.clear();lastPlate='';const r=prevRestore(d);if(here())objective(current().desc);return r;};
 const prevHint=templeRouteHint;templeRouteHint=function(){return here()?current().desc:area==='village'?prevHint()+' 東の道から草原へ。':area==='forest'?prevHint()+' 西の小道から森の深部へ。':entries[area]?prevHint()+' 東の道から'+F[entries[area].to]+'へ。':prevHint();};
 const prevJournal=openQuestJournal;openQuestJournal=function(){prevJournal();if(questJournalOpen)$('questJournalList').textContent='【寄り道・星の野原】\n'+Object.entries(F).map(([id,name])=>(state.chests.includes(id)?'✓ ':'・')+name+' 宝箱').join('\n')+'\n\n'+$('questJournalList').textContent;};
 const fieldJournal=openQuestJournal;openQuestJournal=function(){fieldJournal();if(questJournalOpen)$('questJournalList').textContent='【フィールドの謎】\n'+Object.entries(puzzles).map(([id,p])=>(solved(id)?'✓ ':'・')+p.title+' '+p.points.filter((_,i)=>lit(id,i)).length+'/'+p.points.length).join('\n')+'\n'+(blockDone()?'✓ ':'・')+'洞窟の石箱\n\n'+$('questJournalList').textContent;};
 const puzzleJournal=openQuestJournal;openQuestJournal=function(){puzzleJournal();if(questJournalOpen)$('questJournalList').textContent='【探索道具】\n'+toolDefs.map(t=>(hasTool(t.chapter)?'✓ ':'・')+t.name+'：'+templePlaces[t.parent]+'の'+t.label+(state.chests.includes(t.id)?'（探索済み）':'')).join('\n')+'\n\n【地形の試練】\n'+Object.entries(trials).map(([id,t])=>(trialHas('done',id)?'✓ ':'・')+t.name).join('\n')+'\n\n'+$('questJournalList').textContent;};
 function center(x,y){return [x*40+20,y*40+20];}
 function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
 function oval(g,x,y,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();}
 let lootFx=null;
 function showLoot(text){lootFx={area,text,time:performance.now(),xy:[...current().chest]};}
 function drawChest(g,cx,cy,open){oval(g,cx,cy+16,24,8,'#17272d77');rect(g,cx-22,cy-5,44,25,'#573e36');rect(g,cx-19,cy-2,38,18,'#9f623b');rect(g,cx-19,cy+13,38,4,'#694337');
  if(open){rect(g,cx-22,cy-20,44,14,'#75503c');rect(g,cx-19,cy-17,38,8,'#d6a372');rect(g,cx-17,cy-7,34,7,'#342929');}
  else{rect(g,cx-22,cy-17,44,15,'#674735');rect(g,cx-19,cy-19,38,5,'#c48b5d');rect(g,cx-19,cy-14,38,8,'#bf7948');}
  for(const dx of [-16,12]){rect(g,cx+dx,cy-14,4,30,'#a17c4d');rect(g,cx+dx,cy-14,2,28,'#e1bf73');}
  rect(g,cx-5,cy-5,10,11,'#e9c884');rect(g,cx-2,cy-2,4,5,'#694a30');
  for(const dx of [-19,18]){rect(g,cx+dx,cy-4,2,18,'#e3be79');rect(g,cx+dx,cy+12,3,3,'#8e673f');}
  if(!open){const a=.35+.3*Math.sin(performance.now()/340);g.save();g.globalAlpha=a;rect(g,cx-1,cy-25,2,10,'#fff4be');rect(g,cx-5,cy-21,10,2,'#fff4be');g.restore();}
 }
 function drawLoot(g){const f=lootFx;if(!f||f.area!==area)return;const age=performance.now()-f.time;if(age>2200){lootFx=null;return;}const [cx,cy]=center(...f.xy),p=age/2200,alpha=Math.min(1,(1-p)*4);g.save();g.globalAlpha=alpha;
  const glow=g.createRadialGradient(cx,cy-16,2,cx,cy-16,74);glow.addColorStop(0,'#ffe9a4aa');glow.addColorStop(1,'#ffdb7600');g.fillStyle=glow;g.fillRect(cx-74,cy-90,148,148);
  for(let i=0;i<16;i++){const a=i*2.399+age*.002,r=10+Math.min(65,age*.045)+(i%3)*5,xx=cx+Math.cos(a)*r,yy=cy-18+Math.sin(a)*r*.65;rect(g,xx-2,yy-6,4,12,i%2?'#fff1b8':'#e9bc59');rect(g,xx-6,yy-2,12,4,'#fff1b8');}
  const yy=cy-34-Math.min(35,age*.06);g.fillStyle='#ffdd81';g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?9:19;const x=cx+Math.cos(a)*r,y=yy+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();g.restore();TemplePresentation.label(g,f.text,cx,yy-26,{targetY:yy,always:true});
 }
 function drawAmbient(g,m){const t=performance.now(),dark=m.theme==='ruins'||area.includes('dungeon');g.save();
  for(let i=0;i<24;i++){const x=60+(i*137)%840+Math.sin(t/1100+i)*12,y=65+(i*83)%590+Math.cos(t/900+i)*8,alpha=.2+.4*(.5+.5*Math.sin(t/500+i*1.7));g.globalAlpha=alpha;rect(g,x,y,2,2,dark?'#8ed7ec':'#f9e5ac');if(i%5===0){rect(g,x-2,y,6,1,dark?'#a7dcf7':'#fff1be');rect(g,x,y-2,1,6,dark?'#a7dcf7':'#fff1be');}}
  g.restore();
 }
 function drawToolGate(g,e,x,y){const t=toolDefs[e.tool-1],owned=hasTool(e.tool);oval(g,x,y+10,19,8,'#243d4377');
  if(e.tool===1){rect(g,x-17,y-18,34,32,'#907d6d');rect(g,x-13,y-14,26,24,'#b1a18a');g.strokeStyle='#55483f';g.lineWidth=3;g.beginPath();g.moveTo(x-7,y-14);g.lineTo(x+2,y-3);g.lineTo(x-4,y+3);g.lineTo(x+9,y+12);g.stroke();}
  else if(e.tool===2){for(let i=0;i<4;i++)rect(g,x-18,y-15+i*9,36,5,i%2?'#697d4a':'#9aab66');rect(g,x-3,y-18,6,36,'#254538');}
  else if(e.tool===3){rect(g,x-19,y-18,38,36,'#3b879c');for(let i=0;i<3;i++)oval(g,x-12+i*12,y+(i%2)*5-5,5,3,'#9edce1');}
  else if(e.tool===4){rect(g,x-17,y-21,34,38,'#655a79');rect(g,x-12,y-15,24,28,'#9287ad');rect(g,x-9,y-13,3,22,'#cbc4db');}
  else{oval(g,x,y-4,17,22,'#4d597c');oval(g,x,y-4,11,17,'#8f8cbe');}
  if(owned)oval(g,x,y-21,6,6,t.color);TemplePresentation.label(g,owned?t.hint:t.label+'（'+t.name+'）',x,y-30,{targetY:y,always:true});
 }
 function drawTrial(g){const t=trial();if(!t)return;
  if(t.kind==='rock'){const [tx,ty]=center(...t.target),[x,y]=center(...rockPos()),[rx,ry]=center(...t.reset);rect(g,tx-18,ty-18,36,36,'#9d9159');rect(g,tx-13,ty-13,26,26,'#e4cb81');oval(g,x,y+10,18,7,'#18304480');rect(g,x-17,y-20,34,32,trialDone()?'#a6b882':'#788897');rect(g,x-13,y-16,26,19,'#b2c4c8');rect(g,x-8,y-11,16,12,'#7e939c');TempleVisuals.terminal(g,rx,ry,false);TemplePresentation.label(g,'岩を押す',x,y-28,{targetY:y,always:true});TemplePresentation.label(g,'リセット',rx,ry-28,{targetY:ry,always:true});}
  if(t.kind==='pit'){for(let x=8;x<=16;x++){const px=x*40,py=8*40;rect(g,px,py,40,40,'#111d2c');rect(g,px+3,py+3,34,7,'#334251');rect(g,px+5,py+33,30,5,'#293948');}if(trialHas('bridge')){const [x,y]=center(12,8);rect(g,x-19,y-19,38,38,'#765c43');for(let i=0;i<5;i++)rect(g,x-17,y-17+i*7,34,5,'#b6b477');}const [x,y]=center(...t.lever);TempleVisuals.terminal(g,x,y,trialHas('bridge'));TemplePresentation.label(g,'根の架け橋',x,y+29,{targetY:y,always:true});}
  if(t.kind==='ferry'){for(const [x,y]of [t.south,t.north]){const [cx,cy]=center(x,y);rect(g,cx-18,cy-18,36,36,'#9a815e');TemplePresentation.label(g,'渡し台を呼ぶ',cx,cy-28,{targetY:cy,always:true});}const cx=500,cy=ferryY*40+20;oval(g,cx,cy+12,20,7,'#123c5188');rect(g,cx-18,cy-16,36,32,'#a78c61');for(let i=0;i<4;i++)rect(g,cx-15,cy-13+i*8,30,5,'#e0c28d');}
  if(t.kind==='mirror'){for(const [pos,on,label]of [[t.crystal,trialHas('reflect'),'ブーメランで起動'],[t.terminal,trialDone(),'鏡の受光台']]){const [x,y]=center(...pos);TempleVisuals.terminal(g,x,y,on);TemplePresentation.label(g,label,x,y-30,{targetY:y,always:true});}if(trialHas('reflect')){g.strokeStyle='#ddc7f5';g.lineWidth=3;g.beginPath();g.moveTo(700,340);g.lineTo(220,340);g.stroke();}}
  if(t.kind==='combo')for(let i=0;i<t.nodes.length;i++){const n=t.nodes[i],[x,y]=center(...n.at);TempleVisuals.terminal(g,x,y,trialHas('node'+i));TemplePresentation.label(g,toolDefs[n.tool-1].name,x,y-29,{targetY:y,always:true});}
  TemplePresentation.label(g,t.name+(trialDone()?'：解決済み':'：攻略中'),480,48,{always:true});
 }
 function drawDungeon(g){
  if(dungeon()?.role==='tool'){const [cx,cy]=center(17,8);TempleVisuals.terminal(g,cx,cy,state.broken.includes(dungeon().flag));TemplePresentation.label(g,state.broken.includes(dungeon().flag)?'水晶点灯済':'風のブーメランで灯す',cx,cy-40,{targetY:cy,always:true});const [ax,ay]=center(12,8);rect(g,ax-17,ay-17,34,34,'#d0b478');TemplePresentation.label(g,'ここから東へ投げる',ax,ay+40,{targetY:ay,always:true});}
  if(dungeon()?.role==='hall'){TemplePresentation.label(g,dungeon().name+'：鍵 '+(state.chests.includes(dungeon().ids.key)?'✓':'－')+'　水晶 '+(state.broken.includes(dungeon().flag)?'✓':'－'),480,48,{always:true});}
 }
 function drawVaultBoss(g){const b=vaultBoss();if(!b)return;const {d,c}=bossConfig();
  if(bossRun.phase==='warning')for(let y=1;y<17;y++)for(let x=1;x<23;x++)if(bossDanger(c,x,y))rect(g,x*40+2,y*40+2,36,36,'#d75d5570');
  for(let i=0;i<c.points.length;i++){const [x,y]=c.points[i],[cx,cy]=center(x,y),on=bossLit(d,i);if(c.mode==='step'){rect(g,cx-17,cy-17,34,34,'#495465');rect(g,cx-13,cy-13,26,26,on?'#f5d777':'#8192a1');}else TempleVisuals.terminal(g,cx,cy,on);TemplePresentation.label(g,on?'起動済み':c.mode==='step'?'踏む':c.mode==='slash'?'剣で灯す':'ブーメラン',cx,cy-27,{targetY:cy,always:true});}
  const [cx,cy]=center(b.x,b.y),pulse=Math.sin(performance.now()/160)*3;
  oval(g,cx,cy+22,43,15,'#17233566');oval(g,cx,cy+22,35,11,'#17233588');g.save();g.translate(cx,cy);
  g.strokeStyle=b.open?'#ffe49a':'#8cd5e2';g.globalAlpha=.48;g.lineWidth=2;g.beginPath();g.ellipse(0,24,43+pulse,13+pulse*.25,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;
  if(d.chapter===3){for(let i=0;i<5;i++)oval(g,-30+i*15,Math.sin(i*1.3)*13,17,14,c.color);}
  else if(d.chapter===2){for(let i=0;i<6;i++){const a=i*Math.PI/3;oval(g,Math.cos(a)*25,Math.sin(a)*22,14,10,c.color);}}
  else if(d.chapter===4){rect(g,-23,-29,46,58,'#45395b');rect(g,-18,-24,36,48,c.color);}
  else if(d.chapter===5){g.fillStyle=c.color;g.beginPath();g.moveTo(-4,-25);g.lineTo(-42,-7);g.lineTo(-20,18);g.lineTo(0,8);g.lineTo(20,18);g.lineTo(42,-7);g.lineTo(4,-25);g.fill();}
  else{rect(g,-23,-28,46,52,'#627183');rect(g,-17,-23,34,44,c.color);rect(g,-31,-7,12,28,'#9a835c');rect(g,20,-7,12,28,'#9a835c');}
  oval(g,0,0,19+pulse,21,b.open?'#ffe5a0':'#273d52');oval(g,-7,-5,4,4,b.open?'#fff7bb':'#f0c56e');oval(g,7,-5,4,4,b.open?'#fff7bb':'#f0c56e');g.restore();
  TemplePresentation.label(g,b.open?'弱点露出！':c.hint,cx,cy-42,{targetY:cy,always:true});
 }
 function drawBlocks(g){if(area!=='field_cave')return;const pos=blockPositions();
  for(const [x,y] of blockTargets){const [cx,cy]=center(x,y),on=pos.some(([a,b])=>a===x&&b===y);rect(g,cx-18,cy-18,36,36,'#433c32');rect(g,cx-15,cy-15,30,30,on?'#d9c35f':'#88774a');rect(g,cx-11,cy-11,22,22,on?'#ffea9d':'#c1a35c');}
  const [rx,ry]=center(...blockReset);rect(g,rx-12,ry-23,24,29,'#536579');rect(g,rx-9,ry-20,18,18,'#9aaab7');g.save();g.font='bold 16px serif';g.textAlign='center';g.fillStyle='#243b4f';g.fillText('↺',rx,ry-5);g.restore();
  if(Math.hypot(player.x-blockReset[0],player.y-blockReset[1])<2)TemplePresentation.label(g,'やり直す',rx,ry-30,{targetY:ry,always:true});
  for(const [x,y] of pos){const [cx,cy]=center(x,y);oval(g,cx,cy+14,19,7,'#1d263d99');rect(g,cx-18,cy-19,36,33,'#384653');rect(g,cx-16,cy-21,32,27,blockDone()?'#9fa76b':'#788e9e');rect(g,cx-13,cy-18,26,21,'#b7c4c9');rect(g,cx-10,cy-15,20,15,'#687d8a');rect(g,cx-5,cy-10,10,10,'#d5dfd8');rect(g,cx-16,cy+6,32,5,'#4c6374');if(Math.hypot(player.x-x,player.y-y)<1.6)TemplePresentation.label(g,blockDone()?'解除済':'調べる：押す',cx,cy-30,{targetY:cy,always:true});}
 }
 function terrain(g,m){
  const cave=area==='field_cave'||!!dungeon()||m.toolRoom,highland=area==='field_falls'||m.chapterField,forest=area==='field_deep'||m.theme==='forest',river=area==='field_river',now=performance.now();
  for(let y=0;y<18;y++)for(let x=0;x<24;x++){
   const ch=m.rows[y][x],px=x*40,py=y*40,h=hash(x,y);
   if(ch==='c'){rect(g,px,py,40,40,'#5d5141');rect(g,px,py,40,7,'#92b66a');rect(g,px,py+7,40,6,'#b5a17a');for(let i=0;i<4;i++){const xx=px+2+i*10;rect(g,xx,py+14,8,21,i%2?'#7b6951':'#8e795c');rect(g,xx,py+14,2,18,'#b5a182');}rect(g,px,py+35,40,5,'#3d4230');continue;}
   if(ch==='s'){rect(g,px,py,40,40,'#746850');for(let i=0;i<5;i++){rect(g,px+3,py+i*8,34,6,'#d4bd8d');rect(g,px+3,py+i*8+6,34,2,'#9a805e');}rect(g,px,py,3,40,'#a08760');rect(g,px+37,py,3,40,'#a08760');continue;}
   if(ch==='f'){rect(g,px,py,40,40,'#498fa2');for(let i=0;i<7;i++){const xx=px+2+i*6,yy=py+((now*.09+i*11)%40);rect(g,xx,py,4,40,i%2?'#9bdce0':'#6ab8cb');rect(g,xx,yy,3,Math.min(12,py+40-yy),'#e6fafa');}oval(g,px+20,py+37,20,5,'#cdf4ec');continue;}
   if(ch==='#'){rect(g,px,py,40,40,cave?'#263344':'#294b37');rect(g,px+2,py+1,36,12,cave?'#647486':'#688957');for(let j=0;j<2;j++){const xx=px+2+j*19;rect(g,xx,py+15,17,22,cave?'#3e4b5b':'#3e6146');rect(g,xx+1,py+16,15,3,cave?'#7b8994':'#789765');}continue;}
   if(ch==='w'){const wet=(a,b)=>['w','f'].includes(m.rows[b]?.[a]);TempleVisuals.waterTile(g,px,py,now,{left:!wet(x-1,y),right:!wet(x+1,y),top:!wet(x,y-1),bottom:!wet(x,y+1)});continue;}
   if(ch==='='){const bridge=river&&x>=11&&x<=13&&[8,9].includes(y)||area==='field_falls'&&[12,13].includes(x)&&y===3;if(!bridge&&!cave){TempleVisuals.pixelGround(g,px,py,['#b4a477','#baa97d','#b3a171'][h%3],'path',h%16);const edge=(a,b)=>m.rows[b]?.[a]!=='=';if(edge(x-1,y))for(let i=0;i<5;i++)rect(g,px,py+i*8,2+(h+i*3)%5,8,'#8b9b5b');if(edge(x+1,y))for(let i=0;i<5;i++){const w=2+(h+i*5)%5;rect(g,px+40-w,py+i*8,w,8,'#8b9b5b');}if(edge(x,y-1))rect(g,px,py,40,2,'#8b9b5b');if(edge(x,y+1))rect(g,px,py+38,40,2,'#8b9b5b');continue;}rect(g,px,py,40,40,bridge?'#8a6847':cave?'#6a7882':'#b1a16d');for(let j=0;j<4;j++){rect(g,px+2,py+j*10+1,36,7,bridge?(j%2?'#a78356':'#b08b5d'):cave?'#85929a':'#c7b886');if(bridge)rect(g,px+5,py+j*10+4,2,2,'#483f31');}if(bridge){rect(g,px,py,40,4,'#d6b07e');rect(g,px,py+36,40,4,'#d6b07e');}continue;}
   TempleVisuals.pixelGround(g,px,py,cave?(dungeon()?.color||['#3d4b60','#46556a','#465467'])[h%3]:m.theme==='harbor'?(y<7?['#c2b68e','#c9bd96','#b5a984']:['#8ca9a2','#849e97','#91aaa0'])[h%3]:m.theme==='island'?(y<7?['#9b9eb3','#a7abbf','#9298ae']:['#727e94','#7b8799','#808a9d'])[h%3]:m.theme==='temple'?(y<7?['#d1c9ac','#c9c2a8','#c2bb9f']:['#78939a','#849fa6','#8ba4a8'])[h%3]:highland&&y<7?['#88a85b','#8cb061','#93b56a'][h%3]:forest?['#355e43','#3a6649','#3e694b'][h%3]:['#72934c','#769c50','#80a45a'][h%3],cave?'stone':m.theme==='harbor'?(y<7?'sand':'harbor'):m.theme==='island'?'island':m.theme==='temple'?'temple':forest?'forest':'grass',h%16);
   if(ch==='r'){oval(g,px+20,py+30,20,9,'#203b3e77');g.fillStyle=cave?'#8494a7':'#89998c';g.beginPath();g.moveTo(px+3,py+27);g.lineTo(px+9,py+9);g.lineTo(px+25,py+4);g.lineTo(px+36,py+15);g.lineTo(px+37,py+29);g.lineTo(px+21,py+35);g.fill();rect(g,px+11,py+11,14,4,'#b8c4b5');rect(g,px+27,py+18,7,12,cave?'#526377':'#596e5e');}
  }
  if(area==='field_falls'){for(let i=0;i<13;i++){const t=(now*.025+i*19)%80;oval(g,520+Math.sin(i*2.4)*36*(t/80),319+t*.30,4+t*.10,2+t*.045,'#dcfafa55');}TemplePresentation.label(g,'高台への階段',320,265,{targetY:300,always:true});} if(m.chapterField){const stair=chapterFields.find(c=>c.id===area).stairs[0];TemplePresentation.label(g,'高台への階段',stair*40+40,265,{targetY:300,always:true});}
  if(cave){for(const [x,y] of [[3,3],[20,3],[3,12],[20,12]]){const [cx,cy]=center(x,y);const glow=g.createRadialGradient(cx,cy,2,cx,cy,50);glow.addColorStop(0,'#74dfff55');glow.addColorStop(1,'#74dfff00');g.fillStyle=glow;g.fillRect(cx-50,cy-50,100,100);rect(g,cx-3,cy-13,6,22,'#78bccc');rect(g,cx-1,cy-16,2,12,'#c4f4ff');}}
 }
 function drawPuzzles(g){const p=puzzles[area];if(!p)return;
  const progress=p.points.filter((_,n)=>lit(area,n)).length;
  TemplePresentation.label(g,p.title+'　'+progress+'/'+p.points.length+(solved(area)?'・解決済':''),480,115,{always:true});
  if((p.mode==='order'||p.sequence)&&progress>0){g.save();g.strokeStyle='#f9df8055';g.lineWidth=3;g.beginPath();for(let i=0;i<progress;i++){const [x,y]=center(...p.points[i]);i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();g.restore();}
  for(let i=0;i<p.points.length;i++){
   const [x,y]=p.points[i],[cx,cy]=center(x,y),on=lit(area,i);
   oval(g,cx,cy+12,18,7,'#1c343c88');
   if(p.mode==='step'){rect(g,cx-16,cy-13,32,29,on?'#c4aa56':'#6f8490');rect(g,cx-12,cy-9,24,21,on?'#ffeeb0':'#405765');}
   else {rect(g,cx-13,cy-10,26,24,'#535e63');rect(g,cx-11,cy-26,22,30,on?'#d6bd6a':'#82949c');rect(g,cx-8,cy-23,16,23,on?'#fae9a2':'#414f59');}
   if(on){oval(g,cx,cy-5,18+2*Math.sin(performance.now()/180),14,'#ffed8e44');}
   g.save();g.textAlign='center';g.textBaseline='middle';g.font='bold 20px serif';g.fillStyle=on?'#fff9d5':p.mode==='slash'?'#85dafa':'#ded9c5';g.fillText(p.symbols[i],cx,cy-4);g.restore();
   if(Math.hypot(player.x-x,player.y-y)<2.6)TemplePresentation.label(g,on?'点灯済':p.mode==='order'?'調べる':p.mode==='slash'?'剣で打つ':'踏む',cx,cy-32,{targetY:cy,always:true});
  }
 }
 function blades(g,x,y,cut){const [cx,cy]=center(x,y),h=hash(x,y);
  oval(g,cx,cy+10,19,8,cut?'#385c403b':'#284d37a0');
  if(cut){for(let i=0;i<5;i++)rect(g,cx-15+i*7,cy+7+(i%2)*3,4,3,'#809d58');return;}
  const sway=Math.sin(performance.now()/550+x*.7+y*.9)*2.8;
  for(let i=0;i<13;i++){const dx=(i*17+h)%34-17,dy=(i*11+h)%10-3,height=17+(i*7+h)%14,lean=(dx*.34)+sway,xx=cx+dx,yy=cy+dy+12;
   g.fillStyle=['#255b36','#38743d','#659a45','#91bd5c'][i%4];g.beginPath();g.moveTo(xx-3,yy);g.lineTo(xx+lean*.35-2,yy-height*.48);g.lineTo(xx+lean,yy-height);g.lineTo(xx+lean*.35+3,yy-height*.45);g.lineTo(xx+4,yy);g.fill();rect(g,xx+lean*.35,yy-height*.48,1,Math.max(3,height*.32),'#b5d482');}
  if(h%4===0)for(const [dx,dy] of [[-8,-9],[8,-13]]){rect(g,cx+dx-3+sway,cy+dy-2,6,4,h%2?'#f1cf79':'#e9b6d9');rect(g,cx+dx+sway,cy+dy-3,2,6,'#fff0b5');}
 }
 function drawClippings(g){const now=performance.now();for(let i=clippings.length-1;i>=0;i--){const p=clippings[i],t=now-p.time;if(t>480){clippings.splice(i,1);continue;}if(p.area!==area)continue;g.save();g.globalAlpha=1-t/480;g.translate(p.x+p.vx*t,p.y+p.vy*t-18*Math.sin(t/480*Math.PI));g.rotate(p.i+t*.012);rect(g,-2,-4,4,8,p.kind==='pot'?(p.i%2?'#dbab73':'#986343'):(p.i%2?'#b3d475':'#3d8448'));g.restore();}for(let i=pickupFX.length-1;i>=0;i--){const p=pickupFX[i],t=now-p.time;if(t>650){pickupFX.splice(i,1);continue;}if(p.area!==area)continue;g.save();g.globalAlpha=1-t/650;g.strokeStyle=p.r==='heart'?'#ff9bb9':'#ffe7a1';g.lineWidth=2;g.beginPath();g.ellipse(p.x,p.y-8,6+t*.04,4+t*.025,0,0,Math.PI*2);g.stroke();g.restore();}}
 function drawExit(g,e){const [x,y]=center(e.x,e.y);if(e.secret&&!secretOpen()){oval(g,x,y,19,17,'#263e32');return;}if(e.tool&&!exitAvailable(e)){drawToolGate(g,e,x,y);return;}if(e.lock&&!exitAvailable(e)){rect(g,x-17,y-22,34,38,'#7b654e');rect(g,x-11,y-17,22,28,'#55483d');TemplePresentation.label(g,'鍵と水晶が必要',x,y-28,{targetY:y,always:true});return;}rect(g,x-18,y-15,36,30,'#d4c7a56b');g.strokeStyle='#f5e29b';g.lineWidth=3;g.strokeRect(x-15,y-12,30,24);TemplePresentation.label(g,e.name,x,y-25,{targetY:y,always:true});}
 function drawObject(g,x,y,kind){const [cx,cy]=center(x,y),cut=broken(x,y);if(!cut){if(kind==='grass'){for(let i=0;i<7;i++){g.strokeStyle=(i%2?'#a2bf68':'#5a8e48');g.lineWidth=4;g.beginPath();g.moveTo(cx+i*4-12,cy+10);g.lineTo(cx+i*5-15,cy-12-(i%3)*3);g.stroke();}if(area==='field_deep'&&x===20&&y===5)oval(g,cx,cy-5,7,7,'#ffe79d');}else{oval(g,cx,cy+12,15,5,'#132d3b77');oval(g,cx,cy,13,17,'#87523d');oval(g,cx-2,cy-2,10,15,'#bd8254');oval(g,cx-5,cy-2,3,10,'#e2ae73');rect(g,cx-11,cy+3,22,2,'#744b38');rect(g,cx-10,cy+6,20,2,'#d9a271');oval(g,cx,cy-12,11,4,'#e8b77d');oval(g,cx,cy-12,7,2.5,'#75472d');}return;}if(kind==='pot'){rect(g,cx-10,cy+9,6,3,'#b4774d');rect(g,cx+6,cy+7,5,4,'#d6a176');}if(taken(x,y))return;const r=reward(x,y,kind);if(r==='heart'){oval(g,cx-5,cy-3,7,7,'#ff8ba8');oval(g,cx+5,cy-3,7,7,'#ff8ba8');g.fillStyle='#ff8ba8';g.beginPath();g.moveTo(cx-12,cy);g.lineTo(cx,cy+12);g.lineTo(cx+12,cy);g.fill();}else if(r==='shard'){g.fillStyle='#ffe199';g.beginPath();g.moveTo(cx,cy-9);g.lineTo(cx+7,cy);g.lineTo(cx,cy+9);g.lineTo(cx-7,cy);g.fill();}}
 function drawTrees(g,m,pose,front){for(let y=1;y<17;y++)for(let x=1;x<23;x++)if(m.rows[y][x]==='t'&&((y*40+42>pose.y*40+34)===front))TempleVisuals.tree(g,x*40+20,y*40+22,.85+(hash(x,y)%4)*.055);}
 function frame(g){const m=current(),pose=templePose();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);TemplePresentation.begin();g.save();g.translate(-templeCameraX(),-Math.max(0,Math.min(180,pose.y*40-250)));terrain(g,m);if(typeof TempleRegionalScenery==='object')TempleRegionalScenery.field(g,area,m);drawTrees(g,m,pose,false);
 for(const e of m.exits)drawExit(g,e);const objects=props();for(const [x,y]of objects.grass){const cut=broken(x,y);blades(g,x,y,cut);if(cut)drawObject(g,x,y,'grass');else if(area==='field_deep'&&x===20&&y===5){const [cx,cy]=center(x,y);oval(g,cx,cy-5,7,7,'#ffe79d');}}for(const [x,y]of objects.pots)drawObject(g,x,y,'pot');const [cx,cy]=center(...m.chest);drawChest(g,cx,cy,state.chests.includes(area));drawPuzzles(g);drawBlocks(g);drawTrial(g);drawDungeon(g);drawVaultBoss(g);drawClippings(g);drawLoot(g);drawAmbient(g,m);
 const hx=pose.x*40+20,hy=pose.y*40+34;oval(g,hx,hy,18,5,'#102c2c66');TemplePresentation.hero(g,pic,pose.stride>.45&&['left','right'].includes(player.dir)?(player.dir==='left'?6:7):(({down:0,up:1,left:2,right:3})[player.dir]||0),hx,hy);if(pose.attack!==null&&templeWeapon!=='sword'&&typeof heldWeapon==='function')heldWeapon(hx-20,hy-34,pose);drawTrees(g,m,pose,true);g.restore();TempleVisuals.atmosphere(g,({forest:'forest',village:'village',harbor:'ch3_port',island:'ch4_landing',temple:'ch5_court',grass:'village'})[m.theme]||area);$('templeLocation').textContent='現在地：'+F[area];TemplePresentation.finish();}
 const prevDraw=draw;draw=function(){if(here()){frame(ctx);return;}prevDraw();const e=entries[area];if(e&&$('start').style.display==='none'){const g=ctx;g.save();g.setTransform(1,0,0,1,-templeCameraX(),-Math.max(0,Math.min(180,templePose().y*40-250)));drawExit(g,e);g.restore();}};
 const originalDetails=TempleVisuals.details;
 TempleVisuals.details=function(g,id){originalDetails(g,id);if(id!==area||here()||!common[id])return;const m=props();for(const [x,y]of m.grass){const cut=broken(x,y);blades(g,x,y,cut);if(cut)drawObject(g,x,y,'grass');}for(const [x,y]of m.pots)drawObject(g,x,y,'pot');drawClippings(g);};
 return {here,hasTool,vaultBoss,airPassage,boomerangHit,commonAreas:()=>Object.keys(common),sweep(test,seen,weapon='sword'){const a=sweep(test,seen);if(weapon!=='sword')return a;const b=puzzleSlash(test,seen),c=bossSweep(test);return a||b||c;}};
})();

