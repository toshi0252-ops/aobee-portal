const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});
 try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [width,height,scenario,id,policy,stat] of [[390,844,'S01','C06','cultivate','farm'],[844,390,'S07','C13','fortify','defense'],[1440,900,'S01','C06','commerce','commerce']]){
   const map=YabouMaps.forScenario(scenario),s=Yabou.createInitialState(map,'F01',77,scenario);
   Object.assign(s.castles.find(c=>c.id===id),{farm:50,commerce:50,defense:50,gold:1000,food:1000,troops:1000});
   await page.setViewportSize({width,height});
   await page.goto(process.env.YABOU_URL||pathToFileURL(path.resolve('games/yabou/index.html')).href);
   await page.locator('#importFile').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(s))});
   await page.locator('#acceptImport').tap();
   await page.locator('#castleListOpen').tap();await page.locator('[data-list-castle="'+id+'"]').tap();
   const open=page.locator('#castleDevelopment'),button=page.locator('#queueDevelopment');
   await open.tap();assert.equal(await button.isDisabled(),true);
   await page.locator('#developmentPolicy').selectOption(policy);
   assert.match(await page.locator('#developmentEffects').innerText(),/\+8/);
   const close=await page.locator('#closeModal').boundingBox();assert(close.y+close.height<=height);
   assert(await page.locator('#dialogContent').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
   const actor=await page.locator('#developmentOfficer').inputValue();
   await button.tap();assert.match(await open.innerText(),/均衡/);
   await page.locator('#castleOrders').tap();assert.match(await page.locator('[data-order-kind="commands"]').innerText(),/発展方針の変更.*重視/);
   await page.locator('[data-order-cancel]').tap();await page.locator('#closeModal').tap();
   await open.tap();await page.locator('#developmentPolicy').selectOption(policy);await button.tap();
   await page.locator('#next').tap();await page.locator('#commitMonth').tap();
   assert.match(await page.locator('#dialogContent').innerText(),/発展方針の変更.*重視/);
   const key='aobee-yabou-domestic-auto'+(map.mapId?'-'+map.mapId:'');
   const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
   assert.equal(saved.castles.find(c=>c.id===id).developmentPolicy,policy);
   assert.deepEqual(saved,Yabou.advanceMonth(Yabou.queueCommand(s,{type:'development',castleId:id,factionId:'F01',officerId:actor,policy},YABOU_RULES),map,YABOU_RULES));
   await page.locator('#closeModal').tap();
   await page.locator('[data-command="'+policy+'"]').tap();assert.match(await page.locator('#dialogContent .notice').innerText(),/\+8/);
   console.log('PASS',width,height,scenario,stat);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
