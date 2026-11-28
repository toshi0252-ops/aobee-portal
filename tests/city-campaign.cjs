const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const page=await browser.newPage(); page.on('dialog',d=>d.accept());
 await page.goto('file:///'+path.resolve('games/aobee_city_dev.html').replaceAll('\\','/'));
 const results=[];
 for(const key of (process.env.CITY_SCENARIOS||'growth,recovery,green,traffic,tourism,rebuild,metro').split(',')){
 const result=await page.evaluate(({key,initialSeed})=>{
  let seed=initialSeed;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  if($('ending').open)$('ending').close();
  newCity(scenarioMeta[key][0]);titleOpen=false;$('titleScreen').hidden=true;speed=1;
  const purchases=[],choices=[],logs=[];
  const place=(x,y,k)=>{const i=y*N+x;if(grid[i].t===k)return true;if(!['grass','tree'].includes(grid[i].t))return false;if((unlocks[k]||0)>pop||cash<defs[k][1]+300)return false;tool=k;const old=cash;buildBatch([i]);if(cash<old)purchases.push([month,x,y,k]);return grid[i].t===k;};
  const line=(x1,y1,x2,y2,k='road')=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)place(x,y,k)};
  const district=(y)=>{
   line(0,1,0,y+4);line(0,1,49,1);line(0,y+1,49,y+1);line(0,y+3,49,y+3);
   for(let x=2;x<=48;x++){
    const industrial=x>=37;
    for(const yy of [y,y+2]){
     let k=industrial?(x%3===0?'c':'i'):'r';
     if(!industrial&&x%8===2)k=yy===y?'water':'park';
     if(!industrial&&x%8===4)k=yy===y?'park':'school';
     if(!industrial&&x%8===6)k=yy===y?'fire':'park';
     if(!industrial&&x%8===0)k=yy===y?'park':'hospital';
     if(k==='r'||k==='c'||k==='i'||k==='water'&&cash>2500||cash>4500&&pop>150)place(x,yy,k);
    }
   }
  };
  // Infrastructure and zone construction is paid for through the same build API as play.
  for(let step=0;step<scenarios[key].limit&&!won&&mode===key;step++){
   if(pendingPolicy){const b=[...$('policyChoices').children].find(b=>!b.disabled);choices.push([month,pendingPolicy.key,b.textContent]);b.click();}
   recalc();analyze();
   line(1,1,49,1);if(key==='traffic')line(1,1,1,16); if(key==='rebuild')line(12,8,16,8); if(key==='recovery'){line(1,5,2,5);line(3,5,3,7);line(4,5,19,5);line(3,7,19,7);for(let x=4;x<20;x++){place(x,6,x>15?'i':'r');place(x,8,x>15?'c':'r');}if(month<20){speed=1;tick();continue;}}
   if(need>cap*.75||cap===0){for(let y=2;y<58&&(need>cap*.75||cap===0);y+=2){line(49,1,49,y+1);if(place(50,y,'plant'))recalc();}}
   if(key==='traffic'||key==='rebuild'){
    for(let x of [5,9,13,17,21,25,29]){place(x,6,'road');place(x,5,x%3===0?'school':'park');place(x,10,'road');place(x,11,x%3===0?'hospital':'park');}
    if(pop>=500){place(2,11,'road');place(30,11,'road');place(2,12,'station');place(30,12,'station');line(3,12,29,12,'rail');}
   }
   // Add one new neighbourhood as the current one fills, keeping reserve funds.
   const target=key==='metro'?11000:key==='tourism'?3200:key==='green'?1700:key==='rebuild'?1200:key==='traffic'?1200:650;
   if(key==='traffic'){line(2,3,35,3);for(let x=31;x<=35;x++){place(x,4,'r');place(x,2,'water');}line(2,6,29,6);for(let x=2;x<29;x++){if(x%4===0)place(x,4,'c');else {place(x,4,'r');place(x,3,'road');} if(x%8===0)place(x,2,'water');if(x%4===0){place(x,2,'road');place(x,0,'water');}}} else for(let y=key==='metro'?10:16;y<=58;y+=6){district(y);if(pop>=target||cash<6000||grid.filter(a=>a.t==='r').length*30>target*1.3)break;}
   // Tourism attractions need actual road-connected jobs to receive visitors.
   if(key==='tourism')line(1,14,12,14);if(key==='tourism')for(const [x,k] of [[5,'leisure'],[7,'aquarium'],[9,'golf'],[11,'museum']]){place(x,14,'road');place(x,13,k);}
   recalc();analyze();
   if(happy<90&&key!=='recovery')$('tax').value='5';else if(key==='recovery')$('tax').value='9';
   speed=1;tick();
   if(key==='traffic'&&month===6){let before=goalStreak;save();if(!load()||goalStreak!==before)throw Error('Traffic streak was lost on reload');}
   if(month%12===0||won)logs.push({month,pop,cash:Math.round(cash),net,happy,debt,traffic:resMetric('traffic'),pollution:resMetric('pollution'),tourism,streak:goalStreak});
  }
  if(pendingPolicy){choices.push([month,pendingPolicy.key]);[...$('policyChoices').children].find(b=>!b.disabled).click();}
  return {key,won,month,mode,pop,happy,cash:Math.round(cash),debt,net,streak:goalStreak,rail:railConnected(),traffic:resMetric('traffic'),pollution:resMetric('pollution'),tourism,policies:choices,logs,purchases:purchases.length,debug:{cap,need,zones:grid.reduce((out,a)=>{let k=a.t+a.l;out[k]=(out[k]||0)+1;return out},{})}};
 },{key,initialSeed:Number(process.env.CITY_SEED)||20261128});
 if(!result.won)throw Error('Campaign failed: '+JSON.stringify(result));
 fs.mkdirSync('verification/city',{recursive:true});
 if(key==='traffic'||key==='metro')fs.writeFileSync('verification/city/'+key+'.save.json',await page.evaluate(()=>JSON.stringify(snapshot())));
 results.push(result);console.log(JSON.stringify(result));
 }
 fs.mkdirSync('verification/city',{recursive:true});fs.writeFileSync('verification/city/campaign'+(process.env.CITY_SEED?'-'+process.env.CITY_SEED:'')+'.json',JSON.stringify(results,null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
