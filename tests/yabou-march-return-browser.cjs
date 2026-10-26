const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});
 try {
 const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[390,844],[844,390],[1440,900]])for(const scenario of ['S01','S07']){
  await page.setViewportSize({width,height});await page.goto(process.env.YABOU_URL||'file:///'+path.resolve('games/yabou/index.html').replaceAll('\\','/'),{waitUntil:'domcontentloaded'});await page.locator('#newCampaign').waitFor({state:'visible'});
  const map=YabouMaps.forScenario(scenario),from=scenario==='S01'?'C06':'C13',to=scenario==='S01'?'C01':'C06';
  let state=Yabou.createInitialState(map,'F01',77,scenario);
  Object.assign(state.castles.find(c=>c.id===from),{troops:650,food:150,gold:1000});
  const actors=state.officers.filter(o=>o.status==='active'&&o.factionId==='F01'&&o.locationCastleId===from);
  state=Yabou.queueCommand(state,{type:'recruit',factionId:'F01',castleId:from,officerId:actors[0].id},YABOU_RULES);
  const order={type:'march',factionId:'F01',castleId:from,targetCastleId:to,units:[{officerId:actors[1].id,type:'infantry',troops:500}],food:100,declareWar:true};
  state=YabouMilitary.queue(state,order,map,YABOU_RULES);
  await page.locator('#importFile').setInputFiles({name:'cancel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});await page.locator('#acceptImport').tap();
  const storage=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.getByRole('button',{name:'軍事',exact:true}).tap();await page.locator('#marchFrom').selectOption(from);await page.locator('[data-cancel-march]').tap();
  assert.equal(await page.locator('#marchFrom').inputValue(),from,'cancellation must retain the chosen departure castle');
  await page.locator('[data-march-to="'+to+'"]').tap();
  assert.equal(await page.locator('[data-march-officer="'+actors[0].id+'"]').isDisabled(),true);
  assert.equal(await page.locator('[data-march-officer="'+actors[1].id+'"]').isChecked(),true);
  assert.equal(await page.locator('#marchFood').inputValue(),'100');assert.equal(await page.locator('#marchConfirm').isEnabled(),true);
  await page.locator('#backMilitary').tap();assert.equal(await page.locator('#marchFrom').inputValue(),from,'return from formation must retain departure');
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),storage);
  await page.locator('#closeModal').tap();await page.locator('#saveMenu').tap();await page.locator('[data-save="1"]').tap();await page.locator('#confirmSave').tap();
  assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),'aobee-yabou-domestic-auto-1'+(map.mapId?'-'+map.mapId:'')),{...state,militaryCommands:[]});
  await page.getByRole('button',{name:'軍事',exact:true}).tap();await page.locator('#marchFrom').selectOption(from);await page.locator('[data-march-to="'+to+'"]').tap();await page.locator('#marchConfirm').tap();await page.locator('#queueMarch').tap();
  await page.locator('#next').tap();await page.locator('#commitMonth').tap();
  assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),'aobee-yabou-domestic-auto'+(map.mapId?'-'+map.mapId:'')),Yabou.advanceMonth(state,map,YABOU_RULES));
  console.log(scenario,width,'cancel/return departure, released actor, reserved food, exact save and requeued month OK');
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
