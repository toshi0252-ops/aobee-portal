/* Regional art and restoration. All marks are visual; shared collision/save state is untouched. */
var TempleRegionalScenery=(()=>{
 const themes={
  village:{base:'#89976d',path:'#bca47c',light:'#ffd27d',dark:'#737e61',symbol:'sun'},
  forest:{base:'#47745c',path:'#79936c',light:'#b9f0a6',dark:'#355b49',symbol:'leaf'},
  port:{base:'#517986',path:'#a18b69',light:'#9ae7fc',dark:'#365968',symbol:'wave'},
  island:{base:'#74758c',path:'#a39bb1',light:'#e3b7fa',dark:'#54536d',symbol:'book'}
 };
 const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 const line=(g,x,y,X,Y,c,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(X,Y);g.stroke()};
 const ellipse=(g,x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill()};
 const rhythm=(n)=>((Math.imul(n+49,2654435761)>>>0)%997)/997;
 function chapterFlags(){
  return {
   village:chapter1Story.reportSeen,
   forest:!!TempleChapter2.getState().recovery,
   port:TempleChapter3.getState().stopped,
   island:TempleChapter4.getState().reported,
   network:TempleChapter5.getState().networkBalanced,
   gates:TempleChapter5.getState().gates
  };
 }
 function key(a){
  if(a==='village'||a==='ch5_festival'||a==='field_meadow')return 'village';
  if(a==='forest'||a.startsWith('ch2_')||a.startsWith('field_ch2')||a==='field_deep')return 'forest';
  if(a.startsWith('ch3_')||a.startsWith('field_ch3')||a==='field_river'||a==='field_falls')return 'port';
  if(a.startsWith('ch4_')||a.startsWith('field_ch4'))return 'island';
  if(a.startsWith('ch5_')&&themes[a.slice(4)])return a.slice(4);
  return null;
 }
 function gate(a){return /^ch5_(village|forest|port|island)$/.test(a);}
 function emblem(g,x,y,r,k,c){
  g.save();g.translate(x,y);g.scale(r/24,r/24);g.strokeStyle=c;g.fillStyle=c;g.lineWidth=3;
  if(k==='village'){g.beginPath();g.arc(0,0,9,0,7);g.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;line(g,Math.cos(a)*13,Math.sin(a)*13,Math.cos(a)*21,Math.sin(a)*21,c,3);}}
  if(k==='forest'){g.beginPath();g.moveTo(-15,18);g.quadraticCurveTo(-22,-16,19,-20);g.quadraticCurveTo(23,13,-15,18);g.stroke();line(g,-18,21,13,-13,c,3);line(g,-5,7,-12,-4,c,2);line(g,4,-2,15,1,c,2);}
  if(k==='port'){for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(-22,i*10);g.quadraticCurveTo(-11,i*10-11,0,i*10);g.quadraticCurveTo(11,i*10+11,22,i*10);g.stroke();}}
  if(k==='island'){g.strokeRect(-19,-14,16,28);g.strokeRect(3,-14,16,28);line(g,0,-17,0,17,c,3);for(let i=-7;i<=7;i+=7){line(g,-15,i,-7,i,c,2);line(g,7,i,15,i,c,2);}}
  g.restore();
 }
 function lamp(g,x,y,c,on=true){
  ellipse(g,x,y+2,13,5,'#10253366');rect(g,x-2,y-26,4,26,'#615f55');rect(g,x-8,y-35,16,12,'#354a51');
  rect(g,x-5,y-33,10,8,on?c:'#606d79');rect(g,x-10,y-38,20,3,'#baa88c');
  if(on){const glow=g.createRadialGradient(x,y-29,2,x,y-29,28);glow.addColorStop(0,c+'65');glow.addColorStop(1,c+'00');g.fillStyle=glow;g.fillRect(x-28,y-57,56,56);}
 }
 function flower(g,x,y,c){rect(g,x,y,2,6,'#4f8056');rect(g,x-2,y-2,6,3,c);rect(g,x,y-4,2,7,c);rect(g,x,y-1,2,2,'#fff1ac');}
 function restoredFloor(g,a,k,flags){
  const on=flags[k],theme=themes[k];
  if(gate(a)){
   const connected=flags.gates.includes(k);
   for(let y=1;y<17;y++)for(let x=1;x<23;x++){
    const central=x>=10&&x<=14,walk=y>=9&&y<=13;
    let kind=k==='village'?'grass':k==='forest'?'forest':k==='port'?(central||walk?'harbor':'stone'):'island';
    let base=central||walk?theme.path:theme.base;if(k==='island'&&central)kind='temple';
    if(connected&&((x+y)%3===0))base=theme.base;
    TempleVisuals.pixelGround(g,x*40,y*40,base,kind,(x*7+y*13)%16);
   }
   const c=connected?theme.light:theme.dark;
   for(const r of [56,70,112]){g.strokeStyle=c+'99';g.lineWidth=2;g.beginPath();g.ellipse(500,300,r,r*.68,0,0,7);g.stroke();}
   emblem(g,500,356,34,k,c);
   for(const x of [100,180,820,900])for(const y of [180,300,500,580])emblem(g,x,y,12,k,c+'77');
   line(g,500,340,500,640,c+'88',4);return;
  }
  if(!on)return;
  if(a==='village'){
   for(const [x,y] of [[8,7],[15,7],[8,10],[15,10],[11,14],[12,14]])emblem(g,x*40+20,y*40+20,13,k,theme.light+'aa');
   for(let i=0;i<38;i++){const x=70+rhythm(i)*820,y=90+rhythm(i+73)*540;const tx=Math.floor(x/40),ty=Math.floor(y/40);if(ty>=6&&ty<=10&&tx>=8&&tx<=15||tx===11||tx===12)continue;flower(g,x,y,i%2?'#e5adc4':'#f7df8e');}
  }else if(a==='forest'||a==='ch2_hub'||a==='ch2_gate'){
   for(let i=0;i<60;i++){const x=60+rhythm(i+11)*840,y=100+rhythm(i+108)*520;flower(g,x,y,i%3?'#cbdb84':'#f2c4b0');}
  }else if(a==='ch4_settlement'||a==='ch4_landing'){
   for(let i=0;i<12;i++){const x=220+i*57,y=575+(i%2)*12;emblem(g,x,y,13,k,theme.light+'aa');}
  }
 }
 function routePier(g){
  /* The travel tile is (2,9); a boardwalk must visibly reach it from the shore. */
  const y=9*40+20;
  rect(g,40,y-29,185,58,'#21445188');rect(g,42,y-24,182,48,'#957755');
  for(let x=42;x<224;x+=18){rect(g,x,y-23,16,46,'#b79b73');rect(g,x+2,y-21,12,2,'#d3bd93');rect(g,x+15,y-23,2,46,'#6c5546');}
  for(const yy of [y-27,y+25]){rect(g,42,yy,182,3,'#e0c59d');for(let x=52;x<225;x+=44)rect(g,x,yy-4,5,10,'#665849');}
  g.strokeStyle='#fff0aa';g.lineWidth=3;g.strokeRect(82,y-17,36,34);g.fillStyle='#fff0aa';g.beginPath();g.moveTo(90,y);g.lineTo(109,y-10);g.lineTo(109,y+10);g.closePath();g.fill();
  TemplePresentation.label(g,'西：防波堤へ',130,y-37,{targetY:y,always:true});
 }
 function regionalDetails(g,a,k,f){
  const t=themes[k],on=f[k];
  if(gate(a)){
   const connected=f.gates.includes(k);
   for(const [x,y] of [[82,260],[878,260],[82,540],[878,540]]){
    if(k==='forest'){TempleVisuals.tree(g,x,y,.9);if(connected)flower(g,x+20,y+10,t.light);}
    else if(k==='port'){rect(g,x-17,y-32,34,32,'#2e5266');rect(g,x-13,y-29,26,25,'#6c9eaa');for(let i=0;i<3;i++)line(g,x-10,y-24+i*7,x+10,y-24+i*7,'#afd6cb');lamp(g,x,y,t.light,connected);}
    else if(k==='village'){rect(g,x-21,y-14,42,14,'#685747');for(let i=0;i<5;i++)flower(g,x-14+i*7,y-17,connected?t.light:'#bca588');lamp(g,x,y-19,t.light,connected);}
    else{rect(g,x-21,y-42,42,42,'#44445b');rect(g,x-17,y-38,34,34,'#9286a0');for(let i=0;i<3;i++)line(g,x-14,y-31+i*8,x+14,y-31+i*8,'#4d465f',2);emblem(g,x,y-23,14,k,connected?t.light:'#c4b3ca');}
   }
   if(connected){for(let i=0;i<12;i++){const x=250+rhythm(i)*480,y=175+rhythm(i+25)*150;ellipse(g,x,y,2,2,t.light+'aa');}}
   return;
  }
  if(a==='ch3_port'){routePier(g);if(on||TempleChapter3.getState().boatRescued){
    const x=105,y=475;ellipse(g,x,y+13,53,13,'#133e5199');
    g.fillStyle='#ae8054';g.beginPath();g.moveTo(x-52,y);g.lineTo(x+52,y);g.lineTo(x+34,y+20);g.lineTo(x-32,y+20);g.closePath();g.fill();
    line(g,x,y,x,y-68,'#dbc999',4);g.fillStyle='#e8dabb';g.beginPath();g.moveTo(x+3,y-66);g.lineTo(x+3,y-7);g.lineTo(x+42,y-7);g.closePath();g.fill();
    for(let i=0;i<5;i++)line(g,54+i*16,y+28,65+i*16,y+28,'#bee7df88');
   }}
  if(!on)return;
  const points=a==='village'?[[300,280],[660,280],[320,430],[640,430],[450,570],[550,570]]:a==='ch2_hub'?[[100,260],[860,260],[180,580],[780,580]]:a==='ch3_port'?[[230,300],[230,540],[530,580],[790,570]]:a==='ch4_settlement'?[[120,285],[840,285],[120,550],[840,550]]:[];
  for(const [x,y]of points)lamp(g,x,y,t.light,true);
  if(a==='ch4_settlement'){
   for(const x of [220,720]){line(g,x-40,250,x+40,250,'#a9a2ce',2);for(let i=0;i<4;i++){const xx=x-30+i*20;rect(g,xx,251,12,15,['#e6c5ff','#b9d6ef','#ebceaf','#c6dcba'][i]);}}
  }
  if(a==='ch2_hub'||a==='forest')for(let i=0;i<20;i++){const x=55+rhythm(i)*850,y=85+rhythm(i+29)*535;ellipse(g,x,y,2,2,'#d3f4a888');}
 }
 function templeNetwork(g,a,f){
  if(!['ch5_court','ch5_core'].includes(a))return;
  const points=a==='ch5_court'?[[100,380],[260,100],[740,100],[860,380]]:[[260,260],[700,260],[260,460],[700,460]];
  for(const [i,k]of Object.keys(themes).entries()){
   const [x,y]=points[i],on=f.gates.includes(k),color=on?themes[k].light:'#526777';
   line(g,x,y,500,350,color+'55',12);line(g,x,y,500,350,color+'aa',3);emblem(g,x,y+25,15,k,color+'aa');
  }
  if(f.network){for(const r of [44,68,103]){g.strokeStyle='#ffeabbaa';g.lineWidth=3;g.beginPath();g.ellipse(500,350,r,r*.7,0,0,7);g.stroke();}}
 }
 const baseGround=TempleVisuals.ground;TempleVisuals.ground=function(g,a,rows){if(!gate(a))baseGround(g,a,rows);const k=key(a);if(!k&&!['ch5_court','ch5_core'].includes(a))return;g.save();const f=chapterFlags();if(k)restoredFloor(g,a,k,f);else templeNetwork(g,a,f);g.restore();};
 function passage(g,x,y,name,open=true){
  const cx=x*40+20,cy=y*40+20;
  rect(g,cx-19,cy-17,38,34,open?'#b6ad7a':'#455464');
  g.strokeStyle=open?'#fff0a6':'#788a9b';g.lineWidth=2;g.strokeRect(cx-16,cy-14,32,28);
  for(let i=0;i<3;i++)line(g,cx-11,cy-7+i*7,cx+11,cy-7+i*7,open?'#f8e4a6':'#536b7a',2);
  TemplePresentation.label(g,name,cx,cy+39,{targetY:cy,always:true});
 }
 function routeDetails(g,a){
  if(a==='ch2_hub'){passage(g,6,2,'反響の洞窟');passage(g,12,2,'中継塔',TempleChapter2.getState().records.length>=3);}
  if(a==='ch3_port'&&TempleChapter3.getState().reported){
   const x=220,y=540;rect(g,170,y-18,70,36,'#9d805a');for(let i=0;i<4;i++)line(g,174,y-13+i*8,236,y-13+i*8,'#e1c69d',2);
   g.fillStyle='#b88c56';g.beginPath();g.moveTo(x-75,y-20);g.lineTo(x-25,y-20);g.lineTo(x-31,y+18);g.lineTo(x-68,y+18);g.closePath();g.fill();line(g,x-50,y-18,x-50,y-56,'#d8c7a5',3);g.fillStyle='#e8d7b0';g.beginPath();g.moveTo(x-46,y-55);g.lineTo(x-46,y-20);g.lineTo(x-27,y-20);g.closePath();g.fill();
   TemplePresentation.label(g,'島行きの船：調べる',x,y-33,{targetY:y,always:true});
  }
  if(a==='ch4_settlement')passage(g,12,2,'星見台',!!TempleChapter4.getState().disclosure);
 }
 const baseDetails=TempleVisuals.details;TempleVisuals.details=function(g,a){baseDetails(g,a);const k=key(a);if(!k)return;g.save();regionalDetails(g,a,k,chapterFlags());routeDetails(g,a);g.restore();};
 function field(g,a,m){
  const k=key(a);if(!k)return;const f=chapterFlags();if(!f[k])return;const c=themes[k].light;
  g.save();for(let y=2;y<16;y++)for(let x=2;x<22;x++){
   if(!['.','='].includes(m.rows[y]?.[x])||(x*17+y*29)%13!==0)continue;
   if(k==='forest'||k==='village')flower(g,x*40+8,y*40+30,c);else emblem(g,x*40+20,y*40+20,8,k,c+'77');
  }g.restore();
 }
 const baseAtmosphere=TempleVisuals.atmosphere;TempleVisuals.atmosphere=function(g,a){baseAtmosphere(g,a);const k=key(a);if(!k)return;const f=chapterFlags(),on=gate(a)?f.gates.includes(k):f[k];if(!on)return;g.save();g.setTransform(1,0,0,1,0,0);const grad=g.createLinearGradient(0,0,960,540);grad.addColorStop(0,themes[k].light+'23');grad.addColorStop(.55,themes[k].light+'00');grad.addColorStop(1,themes[k].light+'14');g.fillStyle=grad;g.fillRect(0,0,960,540);g.restore();};
 return {field,key,gate,chapterFlags};
})();
