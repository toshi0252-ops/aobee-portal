/* One target for the prompt, focus marker and story action. Never moves the actor. */
var TempleInteraction=(()=>{
 const tables={
  village:[[10,6,'長老','話す','npc'],[5,5,'タネ婆','話す','npc'],[14,5,'トト','話す','npc']],
  ch2_gate:[[12,8,'観測メモ','読む'],[17,9,'道標','回す'],[12,5,'北の結界','調べる']],
  ch2_hub:[[15,9,'森の守り手','話す']],
  ch2_water:[[8,11,'流木','押す','exact'],[17,6,'水辺の記録','読む'],[18,12,'苗木','調べる']],
  ch2_canopy:[[7,11,'西の操作台','合図','stand'],[17,5,'樹冠の記録','読む']],
  ch2_cave:[[5,7,'西の壁','調べる'],[12,7,'中央の壁','調べる'],[19,7,'東の壁','調べる'],[12,3,'洞窟の記録','読む']],
  ch2_tower_gate:[[8,10,'信じる石碑','選ぶ'],[16,10,'理由を聞く石碑','選ぶ'],[17,9,'安全装置','操作'],[12,5,'塔の扉','開く']],
  ch2_tower1:[[6,11,'反射板','回す'],[12,9,'受光器','確認']],
  ch2_tower2:[[6,11,'西の反射板','回す'],[17,11,'東の反射板','回す'],[12,9,'受光器','確認']],
  ch2_tower3:[[6,11,'反射板','回す'],[12,9,'受光器','確認']],
  ch3_port:[[10,7,'灯台守','話す'],[17,10,'船大工見習い','話す'],[6,10,'港の案内','読む']],
  ch3_shore:[[18,12,'潮待ち標識','切替'],[5,13,'防波堤のメモ','読む'],[5,11,'西の灯り','点灯'],[9,11,'中央の灯り','点灯'],[13,11,'東の灯り','点灯']],
  ch3_observatory:[[6,11,'西の排水弁','固定'],[17,11,'東の排水弁','固定'],[12,4,'転送記録','読む'],[5,4,'古い写真','読む']],
  ch3_lighthouse:[[6,11,'航路灯の端末','接続'],[17,11,'転送端末','隔離']],
  ch3_beacon:[[6,11,'西の水門','固定'],[17,11,'東の水門','固定'],[12,5,'停止端末','操作']],
  ch4_landing:[[6,9,'入り江の碑文','読む'],[17,6,'歯車','拾う']],
  ch4_settlement:[[10,7,'記録守','話す'],[17,10,'名札の子','話す'],[6,10,'島の時計','調べる'],[8,11,'共有の石碑','選ぶ'],[16,11,'持ち主の石碑','選ぶ']],
  ch4_archive:[[5,5,'島の封鎖','読む'],[12,5,'最近の転送変更','読む'],[19,5,'昔の逆流事故','読む'],[6,11,'西の証拠台','写す'],[12,11,'中央の証拠台','写す'],[18,11,'東の証拠台','写す']],
  ch4_storage:[[6,11,'冷却弁','固定'],[17,11,'警告記録','読む'],[12,9,'保全台','操作']],
  ch4_scribe:[[6,11,'複製端末','操作'],[17,11,'忘却の書記','話す'],[6,6,'西の記録','保護'],[12,6,'中央の記録','保護'],[18,6,'東の記録','保護']],
  ch4_chart:[[12,5,'観測端末','照合']],
  ch5_court:[[12,5,'星核の記録','調べる'],[6,11,'神殿の記録','読む']],
  ch5_village:[[6,11,'暮らしの配分','調整'],[17,11,'祭りの配分','調整'],[12,7,'地域端末','確認']],
  ch5_forest:[[6,11,'森の光','確保'],[17,11,'反射板','回す'],[12,7,'地域端末','確認']],
  ch5_port:[[6,11,'分配方式','切替'],[17,11,'灯台守','話す'],[12,7,'地域端末','確認']],
  ch5_island:[[6,11,'本人の同意','確認'],[17,11,'記録の出典','確認'],[12,7,'地域端末','確認']],
  ch5_festival:[[10,7,'長老','話す'],[17,10,'最後の星守','話す'],[6,10,'ミオとわるびー','話す']]
 };
 let selected=null;
 const match=(x,y)=>selected!==null&&selected.x===x&&selected.y===y;
 const usable=()=>s101CanInteract()&&!playMenuOpen&&!landscapeBlocked&&!document.hidden&&innerWidth>=innerHeight;
 function targets(){
  const out=(tables[area]||[]).map(([x,y,name,verb,kind])=>({x,y,name,verb,kind,priority:0}));
  const add=(x,y,name,verb='調べる',kind='normal',priority=0,r=1.55)=>out.push({x,y,name,verb,kind,priority,r});
  if(area==='village'){
   for(const [x,y,name] of [[9,11,'案内板'],[12,8,'星のモニュメント'],[7,4,'タネ婆の家'],[17,4,'トトの家']])add(x,y,name,'調べる','exact',2);
   if(mioRescued){add(17,6,'観測台のミオ','話す');add(16,6,'観測台');s103Panels.forEach((p,i)=>add(p.x,p.y,'反射板 '+(i+1),'回す'));}
   if(s102Ready()){add(8,12,'村人','話す');const q=questBook.view('S102');if(!q.progress.includes('tracks')&&q.state!=='claimed')add(13,9,'足跡');add(6,12,'低木');}
   if(phase>=2&&!questBook.view('S104').progress.includes('store'))add(19,12,'地図片','拾う','normal',0,1.4);
   add(20,12,'地図の作業机','復元','desk',1,2.7);
  }
  if(area==='forest'&&phase>=2){
   add(11,5,'森の石門','調べる','exact');
   if(!chestOpen)add(16,8,'森の宝箱','開く','exact',1);
   add(2,6,'工房への道','進む','normal',2);
   if(!questBook.view('S104').progress.includes('forest'))add(21,14,'地図片','拾う');
   const p=s105Position();add(p[0],p[1],'森の守り手','話す');if(!s105LogMoved())add(4,15,'倒木','動かす');
   add(9,13,'旅人の小箱','開く','normal',2);
  }
  if(area==='ruins')add(20,12,'地図の宝箱','調べる','normal',0,1.8);
  if(area==='annex')add(12,8,'中央の壁画','読む','normal',0,1.4);
  if(area==='seal'&&chapter1Story.mode==='cooperate')add(8,11,'協力台','合図','stand');
  if(area==='ch3_shore'&&TempleChapter3.getState().lowTide)add(9,6,'工具箱','拾う');
  if(area==='ch3_port'&&TempleChapter3.getState().reported)add(5,13,'島行きの船','出発');
  if(area==='ch2_tower4'){
   const s=TempleChapter2.getState();
   if(s.stopped){add(8,10,'急速復旧','選ぶ');add(16,10,'根をいたわる復旧','選ぶ');}
   else if(s.bossStage===2)add(6,11,'光路端末','切替');
   else if(s.bossStage===3){add(7,11,'協力台','合図','stand');add(12,5,'停止端末','操作');}
  }
  if(area==='ch5_core'){
   const s=TempleChapter5.getState();
   if(!s.networkBalanced){
    if(!s.battleStarted)add(12,5,'星核端末','操作');
    else if(s.stage===1)for(const [x,y] of [[6,6],[17,6],[6,11],[17,11]])add(x,y,'地域端末','同期');
    else if(s.stage===3){add(7,11,'協力台','合図','stand');add(17,11,'観測端末','確認');add(12,5,'星核端末','復旧');}
   }
  }
  for(const camp of TempleChronicle.camps())if(camp.area===area)add(camp.x,camp.y,camp.name,'休む','normal',2,1.45);
  const adv=TempleAdventure.getState();
  for(const p of TempleAdventure.pieces())if(p.area===area&&!adv.hearts.includes(p.id))add(p.x,p.y,p.requires?'封じられた小箱':p.title,'調べる','normal',2,1.45);
  for(const s of TempleAdventure.switches())if(s.area===area)add(s.x,s.y,s.name,'調べる','normal',2,1.45);
  return out;
 }
 function choose(){
  const p=TempleFreeMove.position(),d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[player.dir];
  return targets().map(t=>{const distance=Math.min(Math.hypot(p.x-t.x,p.y-t.y),Math.hypot(player.x-t.x,player.y-t.y)),front=player.x+d[0]===t.x&&player.y+d[1]===t.y;
   const eligible=t.kind==='stand'?player.x===t.x&&player.y===t.y:t.kind==='exact'?front:t.kind==='desk'?s104DeskNear():distance<=(t.r||1.55);
   return {...t,eligible,score:distance-(front?.65:0)+t.priority*.9};
  }).filter(t=>t.eligible).sort((a,b)=>a.score-b.score)[0]||null;
 }
 const oldFacing=s103Facing;s103Facing=function(x,y){return selected?match(x,y):oldFacing(x,y)};
 const oldNpc=facingNpc;facingNpc=function(id){return selected?area==='village'&&villageNpcs.some(n=>n.id===id&&match(n.x,n.y)):oldNpc(id)};
 const oldReach=s104Reach;s104Reach=function(x,y,r){return selected?match(x,y):oldReach(x,y,r)};
 const oldDesk=s104DeskNear;s104DeskNear=function(){return selected?selected.kind==='desk':oldDesk()};
 const oldNear=s104Near;s104Near=function(x,y){return selected?match(x,y):oldNear(x,y)};
 const oldAction=action;action=function(...args){if(!usable())return oldAction(...args);selected=choose();try{return oldAction(...args)}finally{selected=null}};
 const oldDraw=draw;draw=function(...args){
  oldDraw(...args);
  if(!usable())return;
  const t=choose(),panel=$('nearbyTarget'),button=$('act');
  if(!t){button.title='調べる';if(tables[area]||['forest','ruins','seal'].includes(area))panel.hidden=true;return}
  const text=t.name+'：'+t.verb;
  if($('toast').style.display!=='block'){panel.hidden=false;panel.textContent=text;}
  button.textContent=t.verb;button.setAttribute('aria-label',text);button.title=text;
  const x=t.x*40+20-templeCameraX(),y=t.y*40+20-Math.max(0,Math.min(180,templePose().y*40-250));
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.strokeStyle='#fff0a4';ctx.shadowColor='#f9cb58';ctx.shadowBlur=8;ctx.lineWidth=3;
  for(const sx of [-1,1])for(const sy of [-1,1]){ctx.beginPath();ctx.moveTo(x+sx*13,y+sy*23);ctx.lineTo(x+sx*23,y+sy*23);ctx.lineTo(x+sx*23,y+sy*13);ctx.stroke()}
  ctx.restore();
 };
 return {current:()=>selected,match,choose};
})();
