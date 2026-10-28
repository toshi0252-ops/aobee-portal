const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
const E=Yabou,W=YabouMilitary,B=YabouBattle,R=YABOU_RULES;
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});
 try{
 const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height]of [[390,844],[844,390],[1440,900]])for(const scenario of ['S01','S07'])for(const retreat of [false,true]){
  const map=YabouMaps.forScenario(scenario),from=scenario==='S01'?'C06':'C01',target='C04';let initial=E.createInitialState(map,'F01',123,scenario);
  Object.assign(initial.castles.find(c=>c.id===from),{troops:1000,food:1000});initial.castles.find(c=>c.id===target).troops=3000;
  const actors=initial.officers.filter(o=>o.status==='active'&&o.factionId==='F01'&&o.locationCastleId===from);
  const units=actors.slice(0,2).map(o=>({officerId:o.id,type:'infantry',troops:100}));
  initial=W.queue(initial,{type:'march',factionId:'F01',castleId:from,targetCastleId:target,units,food:24,declareWar:true},map,R);
  const tx=E.beginMonth(initial,map,R);let battle=E.nextBattle(tx);assert(battle);
  if(retreat){const orders={...B.aiOrders(battle,'defend')};for(const unit of battle.units.filter(u=>u.side==='attack'))orders[unit.id]={type:unit.officerId===actors[0].id?'retreat':'guard'};battle=B.advance(battle,orders);}else battle=B.auto(battle);
  assert.equal(battle.result.winner,'defend');W.settle(tx,battle);while((battle=E.nextBattle(tx)))W.settle(tx,B.auto(battle));const expected=E.finishMonth(tx,map,R);E.validateState(expected,map,R);
  await page.setViewportSize({width,height});await page.goto(process.env.YABOU_URL||'file:///'+path.resolve('games/yabou/index.html').replaceAll('\\','/'),{waitUntil:'domcontentloaded'});await page.locator('#newCampaign').waitFor({state:'visible'});
  await page.locator('#importFile').setInputFiles({name:'retreat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(initial))});await page.locator('#acceptImport').tap();
  const suffix=map.mapId?'-'+map.mapId:'',auto='aobee-yabou-domestic-auto'+suffix,pre='aobee-yabou-domestic-auto-before-battle'+suffix;
  const oldAuto=await page.evaluate(k=>localStorage.getItem(k),auto),oldFill=await page.locator('[data-territory="'+target+'"]').getAttribute('fill');
  await page.locator('#next').tap();await page.locator('#commitMonth').tap();await page.locator('#autoBattle').waitFor({state:'visible'});
  assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),pre),initial);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#modal').evaluate(n=>n.open),true,'Escape must not discard the transaction');
  await page.locator('#autoBattle').tap();await page.locator('#cancelDelegate').tap();assert.equal(await page.locator('#autoBattle').isVisible(),true);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),auto),oldAuto,'unfinished battle must not replace month autosave');
  if(retreat){await page.locator('#battleAction').selectOption('retreat');await page.locator('#setTactic').tap();await page.locator('#roundCommit').tap();}else{await page.locator('#autoBattle').tap();await page.locator('#confirmDelegate').tap();}
  await page.locator('#battleDone').tap();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),auto),expected);await page.locator('#closeModal').tap();
  assert.equal(await page.locator('[data-territory="'+target+'"]').getAttribute('data-owner'),'F02');assert.equal(await page.locator('[data-territory="'+target+'"]').getAttribute('fill'),oldFill);
  for(const actor of actors.slice(0,2)){const current=expected.officers.find(o=>o.id===actor.id);assert.equal(current.status,'active');assert.equal(current.locationCastleId,from);}
  assert.equal(expected.officers.length,54);assert.equal(new Set(expected.officers.map(o=>o.id)).size,54);assert(expected.castles.every(c=>c.food>=0&&c.troops>=0));
  await page.locator('#castleListOpen').tap();await page.locator('[data-list-castle="'+from+'"]').tap();assert((await page.locator('.castleStaffSummary').innerText()).includes('未予約 '+actors.length+'人'));
  await page.locator('#saveMenu').tap();await page.locator('#restore').tap();await page.locator('#confirmLoad').tap();assert.equal(await page.locator('[data-territory="'+target+'"]').getAttribute('data-owner'),'F02');
  await page.locator('#saveMenu').tap();await page.locator('[data-save="1"]').tap();await page.locator('#confirmSave').tap();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),'aobee-yabou-domestic-auto-1'+suffix),expected);
  await page.locator('#saveMenu').tap();await page.locator('#beforeBattle').tap();await page.locator('#confirmLoad').tap();
  await page.locator('#saveMenu').tap();await page.locator('[data-save="2"]').tap();await page.locator('#confirmSave').tap();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),'aobee-yabou-domestic-auto-2'+suffix),initial);
  console.log(scenario,width,retreat?'commander retreat with second unit':'delegated defeat','return/unchanged territory/transaction guard/exact autosave/month and prebattle recovery OK');
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
