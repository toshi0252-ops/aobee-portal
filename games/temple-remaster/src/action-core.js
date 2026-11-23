/* Experimental portable 2D action primitives; no game or DOM dependencies. */
(function(root){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const length=(x,y)=>Math.hypot(x,y);
  function unit(x,y){const n=length(x,y);return n?{x:x/n,y:y/n}:{x:0,y:0};}
  function move(body,dx,dy,blocked){
    for(const [x,y] of [[dx,0],[0,dy]])if(!blocked(body.x+x,body.y+y,body.r)){body.x+=x;body.y+=y;}
  }
  function sector(origin,target,face,range,halfAngle){
    const dx=target.x-origin.x,dy=target.y-origin.y,d=length(dx,dy);
    if(d>range+target.r)return false;
    if(d<=target.r)return true;
    return (dx*face.x+dy*face.y)/d>=Math.cos(halfAngle);
  }
  function circleRect(x,y,r,b){return length(x-clamp(x,b.x,b.x+b.w),y-clamp(y,b.y,b.y+b.h))<r;}
  root.AobeeActionCore={clamp,length,unit,move,sector,circleRect};
})(globalThis);
