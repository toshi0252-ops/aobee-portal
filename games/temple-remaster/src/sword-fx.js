/* Game-only sword presentation and synthesized sound. */
window.TempleSwordFX=(()=>{
 let audio=null, particles=[];
 function unlock(){try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
 function sound(type){try{if(!audio||audio.state!=='running')return;const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.type=type==='hit'?'triangle':'sine';osc.frequency.setValueAtTime(type==='hit'?440:720,now);osc.frequency.exponentialRampToValueAtTime(type==='hit'?120:170,now+.09);gain.gain.setValueAtTime(.075,now);gain.gain.exponentialRampToValueAtTime(.001,now+.12);osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+.13);}catch{}}
 function drawSword(g,p,face,t){
   const a=Math.atan2(face.y,face.x),q=Math.max(0,Math.min(1,t)),angle=a-1.50+3*q,handX=p.x+Math.cos(angle)*20,handY=p.y+Math.sin(angle)*20;
   g.save();
   // A short trailing crescent, then the actual hilt and blade.
   if(q>.13){g.strokeStyle='rgba(255,239,166,'+Math.max(0,.8-q*.55)+')';g.lineWidth=9;g.lineCap='round';g.beginPath();g.arc(p.x,p.y,72,Math.max(a-1.5,angle-1.05),angle);g.stroke();g.strokeStyle='#fff8db';g.lineWidth=2;g.stroke();}
   g.translate(handX,handY);g.rotate(angle);
   g.fillStyle='#74b8ee';g.strokeStyle='#15354a';g.lineWidth=2;g.beginPath();g.ellipse(-5,0,11,9,0,0,Math.PI*2);g.fill();g.stroke();
   g.fillStyle='#74512c';g.fillRect(-1,-4,18,8);g.fillStyle='#f0c763';g.fillRect(14,-12,6,24);
   g.fillStyle='#d9f4ff';g.strokeStyle='#446777';g.lineWidth=2;g.beginPath();g.moveTo(20,-6);g.lineTo(55,-6);g.lineTo(68,0);g.lineTo(55,6);g.lineTo(20,6);g.closePath();g.fill();g.stroke();g.strokeStyle='#fff';g.beginPath();g.moveTo(23,-3);g.lineTo(55,-3);g.lineTo(62,0);g.stroke();g.restore();
 }
 function hit(x,y){for(let i=0;i<9;i++){let a=i*Math.PI*2/9;particles.push({x,y,vx:Math.cos(a)*145,vy:Math.sin(a)*145,life:.24});}}
 function update(dt){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);}
 function drawHits(g){g.save();for(const p of particles){g.globalAlpha=p.life/.24;g.strokeStyle='#fff3b0';g.lineWidth=3;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*.045,p.y-p.vy*.045);g.stroke();}g.restore();}
 return {unlock,sound,drawSword,hit,update,drawHits,reset(){particles=[];}};
})();

