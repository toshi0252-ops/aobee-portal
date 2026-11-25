/* Optional, persistent exploration collectibles. Never required for story progression. */
var TempleCollections=(()=>{
 const catalog=[
  ['village',3,10,'村の灯火','広場の西、木陰'],
  ['field_meadow',6,11,'草原の風','南西の草地'],
  ['field_river',18,3,'川面の月','川の北東'],
  ['field_dungeon_vault',20,4,'月影の騎士','宝物庫の守護者を倒した後',1],
  ['field_ch2_grove',18,3,'古樹の芽','段丘の北東'],
  ['field_ch2_dungeon_hall',3,5,'深緑の根','大広間の北西'],
  ['field_ch2_dungeon_key',20,10,'森の小鳥','鍵の間の南東'],
  ['field_ch2_dungeon_vault',20,4,'根守の記憶','宝物庫の守護者を倒した後',2],
  ['field_ch3_cove',7,3,'潮風の貝','断崖の北西'],
  ['field_ch3_dungeon_hall',20,10,'潮鐘の響き','大広間の南東'],
  ['field_ch3_dungeon_key',3,5,'海底の真珠','鍵の間の北西'],
  ['field_ch3_dungeon_vault',18,3,'海蛇の鱗','宝物庫の守護者を倒した後',3],
  ['field_ch4_terrace',18,3,'記憶の羽根','石段を登った北東'],
  ['field_ch4_dungeon_hall',6,11,'書庫の栞','大広間の南西'],
  ['field_ch4_dungeon_key',20,4,'古い星図','鍵の間の北東'],
  ['field_ch4_dungeon_vault',7,3,'鏡守の欠片','宝物庫の守護者を倒した後',4],
  ['field_ch5_garden',18,3,'天星の花','空中庭園の北東'],
  ['field_ch5_dungeon_hall',3,5,'星門の光','大広間の北西'],
  ['field_ch5_dungeon_key',20,10,'星核の歯車','鍵の間の南東'],
  ['field_ch5_dungeon_vault',16,3,'守護機竜の星','宝物庫の守護者を倒した後',5]
 ].map(([place,x,y,name,hint,gate],i)=>({id:i+1,chapter:Math.floor(i/4)+1,place,x,y,name,hint,gate}));
 const milestones={5:8,10:12,15:16,20:25};
 const colors=['#efcd80','#a8dc80','#8dd9e8','#d5b1ef','#ffe98a'];
 let found=new Set(),effect=null;
 const count=()=>found.size;
 const visible=p=>!found.has(p.id)&&(!p.gate||TempleFields.hasTool(p.gate));
 const usable=()=>s101CanInteract()&&!playMenuOpen&&!landscapeBlocked&&!chapterClearOpen&&!document.hidden&&innerWidth>=innerHeight;
 function collect(){
  if(!usable())return false;
  const pos=typeof TempleFreeMove==='object'?TempleFreeMove.position():player;
  const p=catalog.find(p=>p.place===area&&visible(p)&&Math.hypot(pos.x-p.x,pos.y-p.y)<=.72);
  if(!p)return false;
  found.add(p.id);effect={at:performance.now(),place:area,x:p.x,y:p.y};
  const setComplete=catalog.filter(m=>m.chapter===p.chapter).every(m=>found.has(m.id));
  const reward=(milestones[count()]||0)+(setComplete?6:0);
  if(reward)TempleCombat.grantShards(reward);
  toast('星巡りメダル「'+p.name+'」 '+count()+'/20'+(setComplete?' ／ 第'+p.chapter+'章のコレクション完成！':'')+(reward?' ／ 星片+'+reward:'')+(count()===20?' ／ 星巡りの徽章：移動速度+10%！':''));
  saveGame(true);return true;
 }
 const oldStep=simulationStep;simulationStep=function(...a){oldStep(...a);collect();};
 const oldSnapshot=snapshot;snapshot=function(){return {...oldSnapshot(),collections:{version:1,found:[...found]}};};
 const oldRestore=restoreGame;restoreGame=function(d){if(!validSave(d))return false;const r=oldRestore(d);if(r===false)return false;found=new Set(Array.isArray(d.collections?.found)?d.collections.found.filter(n=>Number.isInteger(n)&&n>=1&&n<=catalog.length):[]);effect=null;return r;};
 function medal(g,p,t){
  const x=p.x*40+20,y=p.y*40+20,bob=Math.sin(t/230+p.id)*3,cy=y-10+bob,c=colors[p.chapter-1];
  g.save();g.fillStyle='#172e3b88';g.beginPath();g.ellipse(x,y+8,13,4,0,0,2*Math.PI);g.fill();
  g.fillStyle=c+'38';g.beginPath();g.arc(x,cy,18,0,2*Math.PI);g.fill();
  g.fillStyle='#72552c';g.beginPath();g.arc(x,cy+2,11,0,2*Math.PI);g.fill();g.fillStyle='#f6d489';g.beginPath();g.arc(x,cy,10,0,2*Math.PI);g.fill();
  g.fillStyle=c;g.beginPath();g.arc(x,cy,7.4,0,2*Math.PI);g.fill();
  g.fillStyle='#fff6cf';g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?2.7:6.1;i?g.lineTo(x+Math.cos(a)*r,cy+Math.sin(a)*r):g.moveTo(x+Math.cos(a)*r,cy+Math.sin(a)*r);}g.closePath();g.fill();
  g.globalAlpha=.5+.45*Math.sin(t/180+p.id);g.fillRect(x+12,cy-11,2,8);g.fillRect(x+9,cy-8,8,2);g.restore();
 }
 const oldDraw=draw;draw=function(){oldDraw();if($('start').style.display!=='none')return;const t=performance.now(),g=ctx;g.save();g.setTransform(1,0,0,1,-templeCameraX(),-Math.max(0,Math.min(180,templePose().y*40-250)));
  for(const p of catalog)if(p.place===area&&visible(p))medal(g,p,t);
  if(effect?.place===area&&t-effect.at<800){const age=t-effect.at;g.globalAlpha=1-age/800;g.strokeStyle='#ffe5a0';g.lineWidth=2;g.beginPath();g.ellipse(effect.x*40+20,effect.y*40+20,12+age*.04,8+age*.02,0,0,2*Math.PI);g.stroke();}
  g.restore();
 };
 function journal(){
  const blocks=[];for(let n=1;n<=5;n++){const group=catalog.filter(p=>p.chapter===n);blocks.push('第'+n+'章 '+group.filter(p=>found.has(p.id)).length+'/4\n'+group.map(p=>(found.has(p.id)?'✓ ':'◇ ')+p.name+' — '+(templePlaces[p.place]||p.place)+'／'+p.hint).join('\n'));}
  return '【星巡りメダル '+count()+'/20】\nフィールドを歩いて回収。各章4枚で星片6個、5・10・15・20枚で追加報酬、全20枚で星巡りの徽章（移動速度+10%）。\n'+blocks.join('\n\n')+'\n\n';
 }
 const oldJournal=openQuestJournal;openQuestJournal=function(){oldJournal();if(questJournalOpen)$('questJournalList').textContent=journal()+$('questJournalList').textContent;};
 $('questJournal').onclick=openQuestJournal;
 return {count,speedMultiplier:()=>count()===catalog.length?1.1:1,catalog:()=>catalog.map(p=>({...p}))};
})();
