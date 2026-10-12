(function(root){
 'use strict';
 let currentMood="morning",context,bgm,se,timer=null,step=0,settings={bgm:.25,se:.5};
 const melody=[72,76,79,76,74,72,67,null,69,72,76,74,72,69,67,null,65,69,72,76,74,72,69,null,67,71,74,79,76,74,72,null];
 function init(){try{if(!context){context=new(window.AudioContext||window.webkitAudioContext)();bgm=context.createGain();se=context.createGain();bgm.connect(context.destination);se.connect(context.destination);apply(settings);}if(context.state==='suspended')context.resume().catch(()=>{});}catch{}}
 function note(midi,t,duration,gain,bus,type='sine'){if(!context)return;const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=440*Math.pow(2,(midi-69)/12);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(bus);o.start(t);o.stop(t+duration+.03);}
 function tick(){if(!context||context.state!=='running'||currentMood==='silence')return;const t=context.currentTime+.04;if(currentMood==='battle'){const notes=[64,67,71,67,62,66,69,66];note(notes[step%8],t,.3,.10,bgm,'triangle');if(step%2===0)note([40,43,38,42][Math.floor(step/4)%4],t,.5,.075,bgm);step++;return;}const n=melody[step%melody.length];if(currentMood==='missing'){if(step%8===0)note(55,t,2.8,.045,bgm);step++;return;}if(n)note(n+(currentMood==='night'?-12:0),t,currentMood==='sunset'?1.4:.75,.12,bgm);if(step%4===0){const bass=[48,45,41,43][Math.floor(step/8)%4];note(bass,t,1.5,.08,bgm);note(bass+7,t,1.5,.04,bgm);}step++;}
 function play(){init();if(!timer){tick();timer=setInterval(tick,450);}}
 function stop(){if(timer){clearInterval(timer);timer=null;}if(context&&context.state==='running')context.suspend().catch(()=>{});}
 function mood(value){currentMood=value==='complete'?'missing':['sunset','night','missing','silence','battle'].includes(value)?value:'morning';apply(settings);}
 function apply(value){settings=value;if(bgm){const gain=value.bgm*(currentMood==='silence'?0:currentMood==='morning'?1:currentMood==='sunset'?.5:.3);bgm.gain.setTargetAtTime(gain,context.currentTime,.8);}if(se)se.gain.value=value.se;}
 function newSong(){init();if(!context)return;const t=context.currentTime;[76,79,76,72,74,72,69,72,76,74,72].forEach((n,i)=>note(n,t+i*.46,i===10?2:1.05,.075,bgm));}
 function song(){init();if(!context)return;const t=context.currentTime;[72,76,74,69].forEach((n,i)=>note(n,t+i*.5,1.1,.065,bgm));}
 function effect(kind='select'){init();if(!context)return;const t=context.currentTime;if(kind==='bird'){[88,92,90].forEach((n,i)=>note(n,t+i*.13,.12,.07,se));return;}note(kind==='chest'?79:76,t,.12,.1,se,'triangle');if(kind==='chest')note(84,t+.1,.3,.1,se,'triangle');}
 root.AobeeAudio={mood,play,stop,apply,effect,song,newSong};
})(globalThis);
