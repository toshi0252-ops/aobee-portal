/* Character and interaction presentation. Does not change collision or saved state. */
var TemplePresentation=(()=>{
 const villagers=new Image(),props=new Image();villagers.src='../assets/temple-npc-atlas.webp';props.src='../assets/temple-props-atlas.webp';
 const forestArt=new Image(),warubee=new Image();forestArt.src='../assets/temple-forest-guardian.webp';warubee.src='../assets/characters/warubee-race-rear-v1.png';
 let candidates=[],labels=[],safeTop=83;
 function scale(){return Math.min(innerWidth/960,innerHeight/540)}
 function font(px=14){return Math.max(18,Math.ceil(px/scale()))}
 function ready(img){return img.complete&&img.naturalWidth>0}
 function art(g,img,index,rows,x,bottom,w,h){if(!ready(img))return false;const cw=img.naturalWidth/4,ch=img.naturalHeight/rows;g.save();g.imageSmoothingEnabled=true;g.drawImage(img,index%4*cw,Math.floor(index/4)*ch,cw,ch,x-w/2,bottom-h,w,h);g.restore();return true}
 function prop(g,index,x,bottom,w=64,h=70){return art(g,props,index,3,x,bottom,w,h)}
 function forest(g,index,x,bottom,w,h){if(!ready(forestArt))return false;const cw=forestArt.naturalWidth/3;g.save();g.imageSmoothingEnabled=true;g.drawImage(forestArt,index*cw,0,cw,forestArt.naturalHeight,x-w/2,bottom-h,w,h);g.restore();return true}
 function companion(g,x,bottom){if(!ready(warubee))return;g.save();g.imageSmoothingEnabled=true;g.drawImage(warubee,x-33,bottom-76,66,76);g.restore()}
 function hero(g,img,index,x,bottom){
  if(!ready(img))return;const cw=img.naturalWidth/4,ch=img.naturalHeight/2;
  g.save();g.imageSmoothingEnabled=true;g.drawImage(img,index%4*cw,Math.floor(index/4)*ch,cw,ch,x-35,bottom-70,70,70);g.restore();
 }
 function npcIndex(name){return /長老|星守/.test(name)?0:/タネ婆/.test(name)?1:/トト|見習い/.test(name)?2:/ミオ/.test(name)?3:/記録守/.test(name)?5:/森の守り手/.test(name)?6:/子/.test(name)?7:4}
 function npc(g,x,y,name){
  g.save();g.fillStyle='#0b203a66';g.beginPath();g.ellipse(x,y+5,20,6,0,0,7);g.fill();
  const drawn=art(g,villagers,npcIndex(name),2,x,y+6,66,78);
  if(!drawn){g.fillStyle='#839cad';g.fillRect(x-11,y-28,22,27);g.fillStyle='#ebd1ab';g.beginPath();g.arc(x,y-39,11,0,7);g.fill()}
  g.restore();label(g,name,x,y-83,{targetY:y});
 }
 function begin(){candidates=[];labels=[];safeTop=Math.max(83,(($('hud').getBoundingClientRect().bottom||45)+8)/scale())}
 function label(g,text,x,y,options={}){
  const pose=templePose(),px=pose.x*40+20,py=pose.y*40+20,ty=options.targetY??y;
  const distance=Math.hypot(x-px,ty-py),edge=(y>=620||y<=120||x<=130||x>=830),route=edge&&/へ|戻|←|→|北|南|東|西|図書塔|貯蔵庫|結界|神殿|洞窟/.test(text);
  if(distance<145&&!route)candidates.push({text,distance});
  if(distance>160&&!route&&!options.always)return;
  const m=g.getTransform(),sy=y+m.f;if(sy<safeTop||sy>525)return;
  g.save();const size=font(options.size||14);g.font='700 '+size+'px sans-serif';g.textAlign='center';
  const width=Math.min(600,g.measureText(text).width+20),height=size+12;
  const cx=Math.max(width/2+12,Math.min(948-width/2,x)),top=y-size-7;
  // Keep nameplates and adjacent mechanism labels apart on short screens.
  const screenBox={x:cx-width/2,y:top+m.f,w:width,h:height};
  if(labels.some(b=>screenBox.x<b.x+b.w&&screenBox.x+width>b.x&&screenBox.y<b.y+b.h&&screenBox.y+height>b.y)&&!options.always){g.restore();return}
  labels.push(screenBox);g.fillStyle='#082438f2';g.fillRect(cx-width/2,top,width,height);g.strokeStyle='#d3bf8177';g.lineWidth=1;g.strokeRect(cx-width/2+.5,top+.5,width-1,height-1);g.fillStyle='#fff1cb';g.fillText(text,cx,y);g.restore();
 }
 function finish(){
  const panel=document.getElementById('nearbyTarget');if(!panel)return;
  const top=Math.max(57,($('hud').getBoundingClientRect().bottom||45)+6);panel.style.top=top+'px';$('toast').style.top=top+'px';
  candidates.sort((a,b)=>a.distance-b.distance);const best=candidates.find(c=>!/同行|段階|残り|第\d章/.test(c.text));
  const show=best&&$('start').style.display==='none'&&$('dialog').style.display!=='block'&&$('toast').style.display!=='block'&&!playMenuOpen&&!questJournalOpen&&!templeGearOpen;
  panel.hidden=!show;if(show)panel.textContent='近く：'+best.text;
 }
 TempleVisuals.person=(g,x,y,name)=>npc(g,x,y+18,name);
 return {prop,forest,companion,hero,npc,label,begin,finish,font,assetsReady:()=>ready(villagers)&&ready(props)&&ready(forestArt)};
})();
