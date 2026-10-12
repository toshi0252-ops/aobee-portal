(function(root){
 'use strict';
 let app,keys=new Set(),vector=null,pointer=null;const knob=document.getElementById('stick-knob'),stick=document.getElementById('stick');
 function reset(){keys.clear();vector=null;pointer=null;knob.style.transform='';}
 function direction(){if(vector)return vector;if(keys.has('ArrowUp')||keys.has('w'))return'up';if(keys.has('ArrowDown')||keys.has('s'))return'down';if(keys.has('ArrowLeft')||keys.has('a'))return'left';if(keys.has('ArrowRight')||keys.has('d'))return'right';return null;}
 function attach(value){app=value;
  window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;if(document.getElementById('panel').open)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
   if(k==='Escape'){e.preventDefault();app.back();return;}
   if(['Enter',' '].includes(k)){if(app.mode!=='title'&&app.mode!=='opening'&&app.mode!=='cinematic'&&app.mode!=='battle'){e.preventDefault();if(!e.repeat)app.interact();}return;}
   if(k==='m'&&['field','cinematic','battle'].includes(app.mode)){e.preventDefault();if(!e.repeat)app.ui.menu();return;}
   if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(k)&&app.mode==='field'){e.preventDefault();keys.add(k);app.cancelPath();}
  });window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',reset);
  document.addEventListener('visibilitychange',()=>{reset();if(document.hidden)app.audio.stop();else if(app.mode!=='title')app.audio.play();});
  function update(e){if(e.pointerId!==pointer)return;const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),scale=len>32?32/len:1;knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;vector=len<10?null:Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
  stick.addEventListener('pointerdown',e=>{if(app.mode!=='field'||pointer!==null)return;e.preventDefault();pointer=e.pointerId;stick.setPointerCapture(e.pointerId);app.cancelPath();update(e);});stick.addEventListener('pointermove',update);
  for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,e=>{if(e.pointerId===pointer)reset();});
  document.getElementById('world').addEventListener('pointerup',e=>{if(app.mode==='field'&&app.state.settings.controls==='tap'&&e.isPrimary)app.tap(app.renderer.tileAt(e.clientX,e.clientY));});
 }
 root.AobeeInput={attach,direction,reset};
})(globalThis);
