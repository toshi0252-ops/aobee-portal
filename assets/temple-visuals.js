/* World-space scenery only. Collision, story and save state remain owned by the game. */
var TempleVisuals=(()=>{
 const patterns=new Map();
 const atlas=new Image();atlas.src='../assets/temple-scenery-atlas.webp';
 function sprite(g,index,cx,bottom,w,h){
  if(!atlas.complete||!atlas.naturalWidth)return false;
  const sw=atlas.naturalWidth/4,sh=atlas.naturalHeight/2;
  g.save();g.imageSmoothingEnabled=true;g.drawImage(atlas,index%4*sw,Math.floor(index/4)*sh,sw,sh,cx-w/2,bottom-h,w,h);g.restore();return true;
 }
 const palettes={grass:['#55775b','#608466','#89a379'],forest:['#254b43','#315c4d','#598873'],stone:['#536974','#627c83','#90aaa9'],harbor:['#526d77','#69858a','#a0b5af'],island:['#505b75','#65738b','#a5afbd'],temple:['#3d596b','#59788a','#a5c2c5'],festival:['#576c68','#76877b','#c5b996']};
 const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 function ellipse(g,x,y,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill()}
 function line(g,x,y,xx,yy,c,w=1){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke()}
 function texture(g,key,x,y,size=40){
  const p=palettes[key],grass=key==='grass'||key==='forest';rect(g,x,y,size,size,p[0]);
  if(grass){for(let i=0;i<13;i++){const xx=x+(i*17+3)%size,yy=y+(i*11+7)%size;rect(g,xx,yy,2,3,i%3?p[1]:p[2]);if(i%3===0)rect(g,xx+2,yy+2,2,1,p[1]);}}
  else{rect(g,x+2,y+2,size-4,17,p[1]);rect(g,x+2,y+22,17,16,p[1]);rect(g,x+22,y+22,16,16,p[1]);line(g,x+4,y+3,x+size-5,y+3,p[2]+'70');line(g,x+4,y+23,x+16,y+23,p[2]+'55');for(let i=0;i<8;i++)rect(g,x+(i*17+5)%36,y+(i*13+8)%36,2,1,p[2]+'35');}
 }
 function tile(g,key,x,y){
  // Cache tiny repeat textures in browsers; the test renderer uses the same drawing operations directly.
  if(typeof OffscreenCanvas==='function'){
   if(!patterns.has(key)){const c=new OffscreenCanvas(40,40);texture(c.getContext('2d'),key,0,0);patterns.set(key,c)}
   g.drawImage(patterns.get(key),x,y);
  }else texture(g,key,x,y);
 }
 function theme(area){return area==='ch5_festival'?'festival':area.startsWith('ch5')?'temple':area.startsWith('ch4')?'island':area.startsWith('ch3')?'harbor':area==='village'?'grass':area==='forest'||area.startsWith('ch2')&&!area.includes('tower')&&area!=='ch2_cave'?'forest':'stone'}
 function ground(g,area,rows){
  g.save();const key=theme(area);
  for(let y=1;y<17;y++)for(let x=1;x<23;x++){
   if(rows&&['#','t','H','d'].includes(rows[y]?.[x]))continue;
   let t=key;
   if(area==='village'&&((x>=8&&x<=15&&y>=6&&y<=10)||(x>=11&&x<=12&&y>=10)||(y===5&&x>=4&&x<=15)||(x===5&&y===6)||(x===14&&y===6)))t='festival';
   if(area==='forest'&&((x>=11&&x<=12&&y>=5)||(y>=11&&y<=12&&x>=3&&x<=18)))t='grass';
   if(rows?.[y]?.[x]==='=')t='stone';tile(g,t,x*40,y*40);
  }
  // Edge masonry has depth without projecting into usable tiles.
  if(!['grass','forest'].includes(key))for(let y=1;y<17;y++){rect(g,40,y*40,5,40,'#162c3c70');rect(g,915,y*40,5,40,'#d6eddd35')}
  if(['ch4_chart','ch5_court','ch5_core'].includes(area)){
   g.strokeStyle='#c9d9ca35';g.lineWidth=2;for(const r of [68,76,140]){g.beginPath();g.ellipse(500,350,r,r*.65,0,0,Math.PI*2);g.stroke()}
   for(let i=0;i<8;i++){const a=i*Math.PI/4;line(g,500+Math.cos(a)*80,350+Math.sin(a)*52,500+Math.cos(a)*136,350+Math.sin(a)*88,'#e8d39b33')}
  }
  if(area==='ch2_hub'){
   for(const [x,y,xx,yy]of [[100,380,860,380],[500,100,500,660],[260,100,500,380]]){line(g,x,y,xx,yy,'#81906d44',44);line(g,x,y,xx,yy,'#a1a57a33',30)}
  }
  g.restore();
 }
 function terminal(g,x,y,on=false){
  if(sprite(g,7,x,y+25,48,58)){
   if(on){g.save();ellipse(g,x,y-12,4,4,'#ffe4a3');g.restore()}return;
  }
  g.save();ellipse(g,x,y+18,25,7,'#0b1e2a70');rect(g,x-18,y+4,36,16,'#253e50');rect(g,x-20,y+17,40,5,'#102b3b');
  rect(g,x-15,y-16,30,30,'#58788b');rect(g,x-12,y-18,24,4,'#c1cdb5');rect(g,x-11,y-10,22,16,'#193e52');
  const c=on?'#ffdf92':'#97bac4';g.fillStyle=c;g.beginPath();g.moveTo(x,y-12);g.lineTo(x+7,y-3);g.lineTo(x,y+6);g.lineTo(x-7,y-3);g.closePath();g.fill();
  line(g,x-16,y+12,x+16,y+12,'#a1ad9b');rect(g,x-14,y+15,4,3,'#dec48a');rect(g,x+10,y+15,4,3,'#dec48a');
  if(on){const light=g.createRadialGradient(x,y-3,1,x,y-3,30);light.addColorStop(0,'#ffdd9c55');light.addColorStop(1,'#ffdd9c00');g.fillStyle=light;g.fillRect(x-30,y-33,60,60)}g.restore();
 }
 function house(g,x,y,w,h,roof='#526a82'){
  const index=roof==='#3f7186'||roof==='#527d86'?4:roof==='#656486'||roof==='#586b85'?5:1;
  if(sprite(g,index,x+w/2,y+h+8,w+22,h+68))return;
  g.save();ellipse(g,x+w/2,y+h+7,w*.56,13,'#10273766');rect(g,x,y,w,h,'#b0a58c');rect(g,x+6,y+12,w-12,h-17,'#d0bea0');
  for(let i=8;i<w;i+=36){rect(g,x+i,y+10,4,h-14,'#6d6056');line(g,x+i+5,y+11,x+i+5,y+h-8,'#ece0b055')}
  rect(g,x-4,y+h-11,w+8,14,'#51636c');line(g,x,y+h-11,x+w,y+h-11,'#a3b1ac',2);
  for(let xx=17;xx<w-20;xx+=48){rect(g,x+xx,y+29,27,29,'#3b4b5b');rect(g,x+xx+3,y+32,21,22,'#e9c67f');rect(g,x+xx+12,y+31,2,24,'#6b6458');rect(g,x+xx+3,y+42,21,2,'#6b6458');rect(g,x+xx-2,y+58,31,5,'#5a6158')}
  g.fillStyle=roof;g.beginPath();g.moveTo(x-12,y+14);g.lineTo(x+w/2,y-35);g.lineTo(x+w+12,y+14);g.closePath();g.fill();
  for(let i=0;i<5;i++){const yy=y-25+i*9,half=(i+1)*w/10;line(g,x+w/2-half,yy,x+w/2+half,yy,'#bfd2ce44',2)}
  line(g,x-12,y+15,x+w+12,y+15,'#d0bd8c',4);g.restore();
 }
 function water(g,x,y,w,h){
  g.save();const grad=g.createLinearGradient(x,y,x,y+h);grad.addColorStop(0,'#173e59');grad.addColorStop(.55,'#276b7d');grad.addColorStop(1,'#3b8b98');g.fillStyle=grad;g.fillRect(x,y,w,h);
  for(let i=0;i<Math.ceil(h/16);i++){const yy=y+8+i*16;for(let k=0;k<Math.ceil(w/64);k++){const xx=x+8+k*64+(i%3)*7;if(xx+26<x+w)line(g,xx,yy,xx+18+(i%3)*4,yy,i%3?'#8ed3d244':'#c4ebd177',1)}}
  line(g,x,y,x+w,y,'#b1c8b9',3);g.restore();
 }
 function column(g,x,y,h=112){
  if(sprite(g,2,x,y+9,Math.max(45,h*.58),h+12))return;
  g.save();ellipse(g,x,y+5,22,8,'#112b3c66');rect(g,x-15,y-h,30,h,'#486777');rect(g,x-12,y-h+5,7,h-9,'#90a8aa');rect(g,x+9,y-h+5,4,h-9,'#263e54');
  for(let yy=y-h+20;yy<y-8;yy+=26)line(g,x-10,yy,x+10,yy,'#b7c6b555');rect(g,x-21,y-h-5,42,11,'#a2b6b0');rect(g,x-22,y-7,44,12,'#758f98');line(g,x-19,y-4,x+19,y-4,'#c5d1b4',2);g.restore();
 }
 function arch(g,x,y,w=120,h=140,on=false){
  if(sprite(g,3,x,y+10,w+46,h+20))return;
  g.save();column(g,x-w/2,y,h-20);column(g,x+w/2,y,h-20);g.strokeStyle='#7a98a4';g.lineWidth=18;g.beginPath();g.arc(x,y-h+w/2,w/2,Math.PI,Math.PI*2);g.stroke();
  g.strokeStyle=on?'#ffe0a2':'#6eafc2';g.lineWidth=3;g.beginPath();g.arc(x,y-h+w/2,w/2-12,Math.PI,Math.PI*2);g.stroke();
  g.fillStyle=on?'#ffe0a2':'#a9c4ca';g.beginPath();g.moveTo(x,y-h-13);g.lineTo(x+9,y-h);g.lineTo(x,y-h+13);g.lineTo(x-9,y-h);g.closePath();g.fill();g.restore();
 }
 function pine(g,x,y,scale=1){g.save();g.translate(x,y);g.scale(scale,scale);ellipse(g,0,16,30,8,'#102d3766');rect(g,-5,-26,10,43,'#655248');for(const [yy,r,c]of [[-20,36,'#173e3a'],[-40,29,'#285b4b'],[-58,20,'#407b5b']]){g.fillStyle=c;g.beginPath();g.moveTo(0,yy-r);g.lineTo(r,yy+15);g.lineTo(-r,yy+15);g.closePath();g.fill();line(g,-r*.5,yy+4,0,yy-r*.6,'#8ab17b55',2)}g.restore()}
 function tree(g,x,y,scale=1){if(!sprite(g,0,x,y+20,84*scale,100*scale))pine(g,x,y,scale)}
 function person(g,x,y,name,color='#8ba5b8'){
  g.save();ellipse(g,x,y+17,15,5,'#152f4266');rect(g,x-8,y+8,6,10,'#3c4055');rect(g,x+3,y+8,6,10,'#3c4055');
  g.fillStyle=color;g.beginPath();g.moveTo(x-8,y-10);g.lineTo(x+8,y-10);g.lineTo(x+13,y+10);g.lineTo(x-13,y+10);g.closePath();g.fill();rect(g,x-2,y-8,4,18,'#dbc69a');ellipse(g,x,y-18,10,11,'#efd3b1');ellipse(g,x,y-25,11,5,'#62566a');rect(g,x-10,y-23,3,12,'#62566a');rect(g,x-4,y-18,2,2,'#39445a');rect(g,x+4,y-18,2,2,'#39445a');
  g.font='600 12px sans-serif';g.textAlign='center';const w=g.measureText(name).width+16;rect(g,x-w/2,y-52,w,21,'#102b3ce8');g.fillStyle='#f6e4b5';g.fillText(name,x,y-37);g.restore();
 }
 function details(g,area){
  g.save();
  if(area==='village'){
   for(const [x,y]of [[294,244],[644,244],[310,411],[630,411]]){const glow=g.createRadialGradient(x,y-34,2,x,y-34,55);glow.addColorStop(0,'#ffdc9244');glow.addColorStop(1,'#ffdc9200');g.fillStyle=glow;g.fillRect(x-55,y-89,110,110)}
   for(const [x,y]of [[85,340],[855,330],[80,520],[860,510]]){tree(g,x,y,.75);sprite(g,6,x,y+43,54,35);}
  }
  if(area==='forest'||area.startsWith('ch2')&&!area.includes('tower')&&area!=='ch2_cave'){
   for(const [x,y]of [[70,170],[885,180],[75,500],[890,540]])tree(g,x,y,.85);
   for(let i=0;i<28;i++){const x=60+(i*137)%830,y=110+(i*83)%510;ellipse(g,x,y,1.5,1.5,i%2?'#b6e6c166':'#f8dd9b88')}
  }
  if(area==='ch3_port'){water(g,40,80,150,560);for(let y=140;y<640;y+=100){rect(g,182,y,16,28,'#7f7762');rect(g,184,y,12,4,'#c5ba91')}}
  if(area==='ch3_shore'){
   const c=TempleChapter3.getState();if(!c.lowTide)water(g,120,200,480,200);
   for(const x of [220,380,540]){column(g,x,458,46);const glow=g.createRadialGradient(x,411,0,x,411,46);glow.addColorStop(0,'#ffe1a333');glow.addColorStop(1,'#ffe1a300');g.fillStyle=glow;g.fillRect(x-46,365,92,92)}
  }
  if(area==='ch4_landing')water(g,40,80,150,560);
  if(area==='ch4_settlement'){column(g,260,400,92);ellipse(g,260,332,17,17,'#d8c9a0');line(g,260,332,260,321,'#4e6073',2);line(g,260,332,270,337,'#4e6073',2)}
  if(area==='ch4_archive'){for(const x of [220,500,780]){rect(g,x-29,154,98,5,'#c1a47b');for(let y=186;y<233;y+=24)rect(g,x-28,y,96,4,'#4f413e')}}
  if(area==='ch2_tower_gate'){arch(g,500,240,150,170,true);for(const x of [375,625])column(g,x,240,150)}
  if(area==='ruins'||area==='annex'||area==='seal'||area.includes('tower')||area.startsWith('ch4_')&&!['ch4_landing','ch4_settlement'].includes(area)||area.startsWith('ch5')&&area!=='ch5_festival'){
   for(const [x,y]of [[70,250],[890,250],[70,550],[890,550]])column(g,x,y,96);
  }
  if(area==='ch4_chart'){arch(g,500,225,160,142,true);for(let i=0;i<4;i++){const x=i%2?740:250,y=i<2?180:350;ellipse(g,x,y+5,25,8,'#182c4355');ellipse(g,x,y,18,18,'#c4c5a0');ellipse(g,x,y,11,11,'#456a82')}}
  if(area==='ch5_court'){
   for(const [i,[x,y]]of [[100,380],[260,100],[740,100],[860,380]].entries())arch(g,x,y+15,70,83,TempleChapter5.getState().gates.includes(['village','forest','port','island'][i]));
   arch(g,500,100,170,105,true);
  }
  if(area==='ch5_festival'){
   for(const x of [100,850]){tree(g,x,520,.9);sprite(g,6,x,565,70,46)}
   for(let i=0;i<12;i++){const x=210+i*48,y=270+Math.sin(i*.6)*12;const glow=g.createRadialGradient(x,y+30,0,x,y+30,30);glow.addColorStop(0,'#ffe4a333');glow.addColorStop(1,'#ffe4a300');g.fillStyle=glow;g.fillRect(x-30,y,60,60);line(g,x,y,x+48,270+Math.sin((i+1)*.6)*12,'#aca17b')}
   for(const [x,y]of [[90,110],[830,92],[170,520],[800,560]])for(let i=0;i<8;i++){const a=i*Math.PI/4;line(g,x+Math.cos(a)*7,y+Math.sin(a)*7,x+Math.cos(a)*25,y+Math.sin(a)*25,['#e3c993','#b7c8d4','#c6a5bb'][i%3],2)}
  }
  if(['ch2_tower4','ch3_beacon','ch4_scribe','ch5_core'].includes(area)){
   sprite(g,7,500,195,116,106);
   const chapter=area==='ch2_tower4'?TempleChapter2:area==='ch3_beacon'?TempleChapter3:area==='ch4_scribe'?TempleChapter4:TempleChapter5;
   const cycle=chapter.getBattleState().cycle,state=chapter.getState(),stopped=state.stopped||state.scribeStopped||state.networkBalanced;
   g.strokeStyle=stopped?'#9bdcab':cycle==='open'?'#ffe3a3':cycle==='warning'?'#edaa97':'#83a5bc';g.lineWidth=3;
   g.beginPath();g.ellipse(500,142,50,54,0,0,Math.PI*2);g.stroke();
  }
  g.restore();
 }
 function atmosphere(g,area){
  g.save();g.setTransform(1,0,0,1,0,0);const key=theme(area),v=g.createLinearGradient(0,0,960,540);v.addColorStop(0,key==='forest'?'#061f362a':'#18335b20');v.addColorStop(.45,'#ffffff00');v.addColorStop(1,'#06162b38');g.fillStyle=v;g.fillRect(0,0,960,540);g.restore();
 }
 return {ground,details,terminal,atmosphere,water,theme,sprite,tree,house,person,assetsReady:()=>atlas.complete&&atlas.naturalWidth>0};
})();
