const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});
 try{
 const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[390,844],[844,390],[1440,900]])for(const scenario of ['S01','S07'])for(const reserved of [false,true]){
  await page.setViewportSize({width,height});await page.goto(process.env.YABOU_URL||'file:///'+path.resolve('games/yabou/index.html').replaceAll('\\','/'),{waitUntil:'domcontentloaded'});await page.locator('#newCampaign').waitFor({state:'visible'});
  const map=YabouMaps.forScenario(scenario),from=scenario==='S01'?'C06':'C13',to=scenario==='S01'?'C01':'C06';
  let state=Yabou.createInitialState(map,'F01',77,scenario);Object.assign(state.castles.find(c=>c.id===from),{troops:1000,food:reserved?150:100,gold:1000});
  const actors=state.officers.filter(o=>o.status==='active'&&o.factionId==='F01'&&o.locationCastleId===from);
  if(reserved)state=Yabou.queueCommand(state,{type:'recruit',factionId:'F01',castleId:from,officerId:actors[0].id},YABOU_RULES);
  await page.locator('#importFile').setInputFiles({name:'feedback.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});await page.locator('#acceptImport').tap();
  const storage=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.getByRole('button',{name:'軍事',exact:true}).tap();await page.locator('#marchFrom').selectOption(from);await page.locator('[data-march-to="'+to+'"]').tap();
  const active=reserved?actors[1]:actors[0];await page.locator('[data-unit-troops="'+active.id+'"]').fill('500');
  if(!reserved)await page.locator('[data-march-officer="'+actors[1].id+'"]').check();
  const required=reserved?60:72;
  for(const [input,fragment]of [[required-1,'不足'],[101,'超え'],[1.5,'整数'],[-1,'整数'],[required,null],[100,null]]){
   await page.locator('#marchFood').fill(String(input));const message=await page.locator('#marchError').innerText();
   assert.equal(await page.locator('#marchConfirm').isEnabled(),fragment===null);
   if(fragment){assert(message.includes(fragment),message);if(fragment==='不足'){assert(message.includes('必要'+required));assert(message.includes('使用可能100'));}if(fragment==='超え'){assert(message.includes('使用可能100'));assert(message.includes('入力101'));}}
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),storage);
  if(scenario==='S07'&&width===390&&reserved){await page.locator('#marchFood').fill('101');await page.locator('#marchError').scrollIntoViewIfNeeded();await page.screenshot({path:require('node:os').tmpdir()+'/yabou-food-feedback.png'});await page.locator('#marchFood').fill('100');}
  await page.locator('#marchConfirm').tap();await page.locator('#queueMarch').tap();
  const units=reserved?[{officerId:active.id,type:'infantry',troops:500}]:[{officerId:actors[0].id,type:'infantry',troops:500},{officerId:actors[1].id,type:'infantry',troops:100}];
  const expected=YabouMilitary.queue(state,{type:'march',factionId:'F01',castleId:from,targetCastleId:to,units,food:100,declareWar:true},map,YABOU_RULES);
  await page.locator('#saveMenu').tap();await page.locator('[data-save="1"]').tap();await page.locator('#confirmSave').tap();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),'aobee-yabou-domestic-auto-1'+(map.mapId?'-'+map.mapId:'')),expected);
  console.log(scenario,width,reserved?'reserved food':'two units','shortage/excess/integer/boundaries/exact queue save OK');
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
