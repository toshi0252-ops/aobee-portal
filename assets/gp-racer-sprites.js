(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.GPRacerSprites=factory(()=>document.createElement('canvas'));})(typeof globalThis!=='undefined'?globalThis:this,function(makeCanvas){
 'use strict';
 const cache=new WeakMap();
 return {draw(ctx,image,x,y,w,h,tint){
  let sprite=image;
  if(tint){
   let colors=cache.get(image);if(!colors){colors=new Map();cache.set(image,colors);}
   sprite=colors.get(tint);
   if(!sprite){
    sprite=makeCanvas();sprite.width=image.naturalWidth||image.width;sprite.height=image.naturalHeight||image.height;
    const isolated=sprite.getContext('2d');isolated.drawImage(image,0,0);
    isolated.globalCompositeOperation='source-atop';isolated.fillStyle=tint;isolated.fillRect(0,0,sprite.width,sprite.height);
    colors.set(tint,sprite);
   }
  }
  ctx.save();ctx.globalCompositeOperation='source-over';ctx.drawImage(sprite,x,y,w,h);ctx.restore();
 }};
});
