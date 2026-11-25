/* Preserve integer quest coordinates while rendering and colliding at fractional positions. */
var TempleFreeMove=(()=>{
 const keys=new Map();let px=0,py=0,ax=null,ay=null,place=null,actor=null,walking=0,phase=0,aim=null,aimDir=null,tap=null,tapTicks=0;
 const speed=5.1,dt=1/60,radius=.23;
 function sync(){px=player.x;py=player.y;ax=player.x;ay=player.y;place=area;actor=player;walking=0;aim=null;aimDir=null;}
 function synced(){return actor===player&&place===area&&ax===player.x&&ay===player.y;}
 function updateKeys(){let x=0,y=0;for(const d of keys.values()){x+=d[0];y+=d[1];}const n=Math.hypot(x,y);if(stickPointer===null)hold=n?[x/n,y/n]:null;}
 function keyDown(k,d){if(!keys.has(k)&&allowed()){tapTicks=tap&&tap[0]===d[0]&&tap[1]===d[1]?Math.min(11,tapTicks+7):7;tap=d;}keys.set(k,d);updateKeys();}
 function keyUp(k){if(keys.delete(k))updateKeys();}
 function clearKeys(){keys.clear();tap=null;tapTicks=0;}
 function allowed(){const modal=['journeyMap','chroniclePanel','recoveryPanel'].some(id=>{const el=document.getElementById?.(id);return el&&!el.hidden;});return !modal&&s101CanInteract()&&!playMenuOpen&&!landscapeBlocked&&!chapterClearOpen&&!document.hidden&&innerWidth>=innerHeight;}
 const basePose=templePose;
 templePose=function(now=performance.now()){const pose=basePose(now);return synced()?{...pose,x:px,y:py,stride:walking?Math.abs(Math.sin(phase)):0}:pose;};
 function advance(axis,delta){
  if(!delta)return false;
  const sign=Math.sign(delta),ix=player.x,iy=player.y;
  let value=(axis===0?px:py)+delta,cell=axis===0?ix:iy;
  const other=axis===0?py:px,otherCell=axis===0?iy:ix;
  const tx=ix+(axis===0?sign:0),ty=iy+(axis===1?sign:0);
  const side=other-otherCell,sideSign=Math.sign(side);
  const corner=Math.abs(side)>.5-radius&&wall(tx+(axis===1?sideSign:0),ty+(axis===0?sideSign:0));
  if((wall(tx,ty)||corner)&&sign*(value-cell)>.5-radius)value=cell+sign*(.5-radius);
  if(sign*(value-cell)>=.5){
   const oldArea=area,oldActor=player;
   move(axis===0?sign:0,axis===1?sign:0);
   if(area!==oldArea||player!==oldActor||player.x!==tx||player.y!==ty){
    if(area!==oldArea||player!==oldActor||player.x!==ix||player.y!==iy){sync();return true;}
    value=cell+sign*(.5-radius);
   }else{ax=player.x;ay=player.y;place=area;actor=player;}
  }
  const before=axis===0?px:py;
  if(axis===0)px=value;else py=value;
  return Math.abs(value-before)>.00001;
 }
 const legacyStep=simulationStep;
 simulationStep=function(t){
  legacyStep(t);
  if(!synced())sync();
  if(typeof TempleCombat==='object'&&TempleCombat.isHitStop?.()){walking=0;return;}
  if(!allowed()){walking=0;tap=null;tapTicks=0;return;}
  const d=hold||(tapTicks>0?tap:null);if(!d){walking=0;return;}
  if(tapTicks>0)--tapTicks;
  const length=Math.hypot(d[0],d[1]);if(!length)return;
  const x=d[0]/length,y=d[1]/length,oldArea=area,oldActor=player;
  // The floating stick carries a magnitude; keyboard movement remains full speed.
  const velocity=speed*Math.min(1,length)*(typeof TempleCollections==='object'?TempleCollections.speedMultiplier():1);
  const didX=advance(0,x*velocity*dt);
  if(area!==oldArea||player!==oldActor||!allowed()){walking=0;return;}
  const didY=advance(1,y*velocity*dt);
  if(area!==oldArea||player!==oldActor||!allowed()){walking=0;return;}
  player.dir=Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down');aim=[x,y];aimDir=player.dir;
  walking=didX||didY;if(walking)phase+=.36;
 };
 const oldRestore=restoreGame;restoreGame=function(...a){const r=oldRestore(...a);sync();return r;};
 // An adjacent villager can be talked to without pixel-perfect facing.
 const oldAction=action;action=function(...a){
  if(allowed()&&area==='village'){
   const npc=villageNpcs.find(n=>Math.abs(n.x-player.x)+Math.abs(n.y-player.y)===1);
   if(npc){player.dir=npc.x>player.x?'right':npc.x<player.x?'left':npc.y>player.y?'down':'up';aim=null;aimDir=null;clearStick();}
  }
  return oldAction(...a);
 };
 return {keyDown,keyUp,clearKeys,position:()=>synced()?{x:px,y:py}:{x:player.x,y:player.y},facing:()=>aim&&aimDir===player.dir?aim:({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[player.dir]};
})();

