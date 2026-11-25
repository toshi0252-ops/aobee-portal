/* Non-blocking presentation. Never changes progression or controls. */
var TempleCinematic=(()=>{
 let lastArea=null,lastBoss=null,notice=null,changedAt=-Infinity,burst=null;
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clock=()=>performance.now();
 function celebrate(main,sub='仕掛けを解いた！',point=[player.x,player.y]){
  const now=clock();notice={main,sub,at:now,duration:1950,color:'#ffe494'};
  burst={area,at:now,x:point[0]*40+20,y:point[1]*40+20};
 }
 function sparkle(g,now){
  if(!burst||burst.area!==area||now-burst.at>1250||reduced)return;
  const t=(now-burst.at)/1250,x=burst.x-templeCameraX(),y=burst.y-Math.max(0,Math.min(180,templePose().y*40-250));
  g.save();g.globalAlpha=1-t;g.strokeStyle='#ffedaa';g.lineWidth=3;g.beginPath();g.arc(x,y,12+t*82,0,7);g.stroke();
  for(let i=0;i<16;i++){const a=i*Math.PI/8+t*.8,r=20+t*85,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.65;g.fillStyle=i%2?'#fff5c2':'#efbc68';g.fillRect(px-2,py-5,4,10);g.fillRect(px-5,py-2,10,4);}
  g.restore();
 }
 function title(g,main,sub,t,duration,color){
  const alpha=Math.max(0,Math.min(1,t/160,(duration-t)/420));
  if(!alpha)return;
  g.save();g.globalAlpha=alpha;g.translate(W/2,95+(reduced?0:Math.max(0,1-t/250)*-8));
  const width=Math.min(W-40,Math.max(284,main.length*25+110));
  const bg=g.createLinearGradient(-width/2,0,width/2,0);
  bg.addColorStop(0,'#18293800');bg.addColorStop(.18,'#182938ed');bg.addColorStop(.82,'#182938ed');bg.addColorStop(1,'#18293800');
  g.fillStyle=bg;g.fillRect(-width/2,-39,width,78);
  g.strokeStyle=color;g.lineWidth=1.5;for(const y of [-39,39]){g.beginPath();g.moveTo(-width*.36,y);g.lineTo(width*.36,y);g.stroke();}
  g.textAlign='center';g.textBaseline='middle';g.fillStyle=color;g.font='bold 12px sans-serif';g.fillText(sub,0,-18);
  g.fillStyle='#fff6db';g.font='bold 25px sans-serif';g.fillText(main,0,9,width-40);g.restore();
 }
 const previous=draw;
 draw=function(){
  previous();
  if($('start').style.display!=='none'){lastArea=null;lastBoss=null;notice=null;burst=null;return;}
  const now=clock(),moved=area!==lastArea;
  if(moved){lastArea=area;lastBoss=null;changedAt=now;notice={main:templePlaces[area]||'新しいエリア',sub:'星の神殿　・　探索',at:now,duration:1750,color:'#d8d8a3'};}
  const b=typeof TempleCombat==='object'?TempleCombat.boss():null;
  if(b&&b.id!==lastBoss){notice={main:b.name||'守護者',sub:'守護者 出現',at:now,duration:2250,color:'#f4bc83'};}
  if(!b&&lastBoss&&!moved){notice={main:'守護者撃破',sub:'星の光が道を照らす',at:now,duration:2100,color:'#f9dc91'};}
  lastBoss=b?b.id:null;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  const fade=Math.max(0,1-(now-changedAt)/340);
  if(fade&&!reduced){ctx.fillStyle='rgba(17,28,41,'+(fade*.42)+')';ctx.fillRect(0,0,W,H);}
  sparkle(ctx,now);
  if(notice&&now-notice.at<notice.duration&&$('dialog').style.display!=='block')title(ctx,notice.main,notice.sub,now-notice.at,notice.duration,notice.color);
  ctx.restore();
 };
 return {celebrate};
})();
