/* Chapter 1 adaptation based on original chapter flow and checkpoint coordinates.
   Map geometry is a remaster layout, not a byte-for-byte copy. */
window.TempleChapter=(()=>{
 const pos=(x,y)=>({x:x*40+20,y:y*31+15});
 const border=[{x:0,y:0,w:960,h:22},{x:0,y:518,w:960,h:22},{x:0,y:0,w:22,h:540},{x:938,y:0,w:22,h:540}];
 const village={title:'星灯りの村',start:pos(10,7),walls:[...border,{x:80,y:75,w:110,h:78},{x:690,y:75,w:125,h:82},{x:100,y:330,w:120,h:85},{x:740,y:330,w:120,h:85}],enemies:[],objects:[
 {...pos(10,6),id:'elder',name:'長老',kind:'npc'}, {...pos(5,5),id:'west',name:'村人',kind:'npc'}, {...pos(14,5),id:'east',name:'村人',kind:'npc'}, {...pos(12,15),id:'forest',name:'森への道',kind:'exit'}]};
 const forest={title:'星灯りの森',start:pos(12,14),walls:[...border,{x:80,y:100,w:100,h:50},{x:660,y:210,w:100,h:60},{x:300,y:225,w:110,h:50}],enemies:[pos(5,5),pos(18,10)],objects:[
 {...pos(7,12),id:'ribbon',name:'リボン',kind:'clue'}, {...pos(3,8),id:'tracks',name:'足あと',kind:'clue'}, {...pos(16,11),id:'charm',name:'お守り',kind:'clue'}, {...pos(5,3),id:'mio',name:'ミオ',kind:'npc'}, {...pos(4,3),id:'s0',name:'星のかけら',kind:'star'}, {...pos(19,4),id:'s1',name:'星のかけら',kind:'star'}, {...pos(18,13),id:'s2',name:'星のかけら',kind:'star'}, {...pos(11,5),id:'gate',name:'石門',kind:'gate'}, {...pos(20,2),id:'ruins',name:'地下遺跡',kind:'exit'}]};
 let area='village',flags=new Set();
 function reset(){area='village';flags=new Set();}
 function map(){return area==='village'?village:forest;}
 const count=(ids)=>ids.filter(id=>flags.has(id)).length,clues=()=>count(['ribbon','tracks','charm']),stars=()=>count(['s0','s1','s2']);
 function goal(){if(area==='village')return !flags.has('elder')?'長老と話そう':count(['west','east'])<2?'村人と話そう '+count(['west','east'])+'/2':!flags.has('festival')?'長老に報告しよう':'南の森へ向かおう';return clues()<3?'ミオの手がかり '+clues()+'/3':!flags.has('mio')?'ミオを見つけよう':stars()<3?'星のかけら '+stars()+'/3':!flags.has('gate')?'石門を調べよう':'地下遺跡へ進もう';}
 function visible(o){if(o.kind==='clue'||o.kind==='star')return !flags.has(o.id)&&(o.kind!=='star'||flags.has('mio'));return true;}
 function nearest(p){return map().objects.filter(visible).filter(o=>Math.hypot(p.x-o.x,p.y-o.y)<57).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0];}
 function interact(o){if(!o)return {message:'近くの人や仕掛けを調べよう。'};switch(o.id){
 case 'elder':if(!flags.has('elder')){flags.add('elder');return {message:'長老：星祭りの支度を手伝ってくれないか。村のみんなに話を聞いておくれ。'};}if(count(['west','east'])===2){flags.add('festival');return {message:'長老：ありがとう。ミオが森から戻らない。様子を見てきておくれ。'};}return {message:'長老：西と東の村人に声をかけておくれ。'};
 case 'west':case 'east':if(!flags.has('elder'))return {message:'まずは長老に会ってね。'};flags.add(o.id);return {message:o.id==='west'?'村人：祭りの飾りは準備できたよ。':'村人：森の方で何か気になる音がしたよ。'};
 case 'forest':if(!flags.has('festival'))return {message:'出発前に長老へ報告しよう。'};area='forest';return {transition:true,message:'森へ。ミオの手がかりを探そう。'};
 case 'ribbon':case 'tracks':case 'charm':flags.add(o.id);return {message:o.name+'を見つけた！'};
 case 'mio':if(clues()<3)return {message:'ミオの手がかりを三つ探そう。'};flags.add('mio');return {message:'ミオ：来てくれたんだ！ 石門を開くには星のかけらが三つ必要だよ。'};
 case 's0':case 's1':case 's2':flags.add(o.id);return {message:'星のかけらを手に入れた！'};
 case 'gate':if(stars()<3)return {message:'星のかけらが三つ必要だ。'};flags.add('gate');return {message:'石門が開いた！ 北東の地下遺跡へ。'};
 case 'ruins':return flags.has('gate')?{complete:true,message:'地下遺跡に到着！ 次の移植段階で探索できるようになる。'}:{message:'石門を開けよう。'};
 }}
 return {reset,map,goal,visible,nearest,interact,get area(){return area}};
})();

