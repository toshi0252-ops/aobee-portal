const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});
 try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [width,height,scenario,from,to,food] of [[390,844,'S01','C06','C01',500],[844,390,'S07','C13','C06',500],[1440,900,'S01','C06','C01',105]]){
   const map=YabouMaps.forScenario(scenario),s=Yabou.createInitialState(map,'F01',77,scenario),city=id=>s.castles.find(c=>c.id===id);
   Object.assign(city(from),{food,gold:1000,troops:1000});Object.assign(city(to),{food:0,troops:1000});
   for(const c of s.castles.filter(c=>c.ownerFactionId==='F01'&&![from,to].includes(c.id)))c.gold=0;
   await page.setViewportSize({width,height});await page.goto(process.env.YABOU_URL||pathToFileURL(path.resolve('games/yabou/index.html')).href);
   await page.locator('#importFile').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(s))});
   await page.locator('#acceptImport').tap();await page.locator('#castleListOpen').tap();await page.locator('#supplyOverview').tap();
   const rows=page.locator('.supplyOverviewScreen .orderEntry');
   assert.equal(await rows.first().locator('h3').innerText(),city(to).name);
   assert.match(await rows.first().innerText(),/不足 10/);
   const route=rows.first().locator('[data-supply-route]');
   assert(await page.locator('#dialogContent').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
   if(food===105){assert.equal(await route.count(),0);continue;}
   assert.match(await route.innerText(),/100/);await route.tap();
   assert.equal(await page.locator('#supplyTarget').inputValue(),to);
   assert.equal(await page.locator('#supplyAmount').inputValue(),'100');
   await page.locator('#supplyBack').tap();await route.tap();await page.locator('#queueSupply').tap();
   assert.equal(await page.locator('.supplyOverviewScreen .supplyRisk').count(),0);
   assert.match(await rows.filter({has:page.getByRole('heading',{name:city(to).name,exact:true})}).innerText(),/残り 90/);
   await page.locator('#supplyOverviewBack').tap();assert.equal(await page.locator('#supplyOverview').isVisible(),true);
   console.log('PASS logistics',width,height,scenario);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
