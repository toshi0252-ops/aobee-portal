const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});
 try{
 const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height]of [[390,844],[844,390],[1440,900]])for(const scenario of ['S01','S07'])for(const finalCastle of [false,true]){
  const map=YabouMaps.forScenario(scenario),from=scenario==='S01'?'C06':'C01',target='C04';let initial=Yabou.createInitialState(map,'F01',123,scenario);
  if(finalCastle){for(const c of initial.castles)if(c.ownerFactionId==='F02'&&c.id!==target)c.ownerFactionId='F03';YabouMilitary.reconcile(initial);}
  Object.assign(initial.castles.find(c=>c.id===from),{troops:3000,food:1000});initial.castles.find(c=>c.id===target).troops=400;
  const actor=initial.officers.find(o=>o.status==='active'&&o.factionId==='F01'&&o.locationCastleId===from);
  initial=YabouMilitary.queue(initial,{type:'march',factionId:'F01',castleId:from,targetCastleId:target,units:[{officerId:actor.id,type:'cavalry',troops:2500}],food:300,declareWar:true},map,YABOU_RULES);
  const expected=Yabou.advanceMonth(initial,map,YABOU_RULES);assert.equal(expected.castles.find(c=>c.id===target).ownerFactionId,'F01');Yabou.validateState(expected,map,YABOU_RULES);
  await page.setViewportSize({width,height});await page.goto(process.env.YABOU_URL||'file:///'+path.resolve('games/yabou/index.html').replaceAll('\\','/'),{waitUntil:'domcontentloaded'});await page.locator('#newCampaign').waitFor({state:'visible'});
  await page.locator('#importFile').setInputFiles({name:'conquest.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(initial))});await page.locator('#acceptImport').tap();
  const territory=page.locator('[data-territory="'+target+'"]'),castle=page.locator('[data-castle="'+target+'"]');
  assert.equal(await territory.getAttribute('data-owner'),'F02');const oldFill=await territory.getAttribute('fill'),oldLabel=await castle.getAttribute('aria-label');
  await page.locator('#next').tap();await page.locator('#commitMonth').tap();await page.locator('#autoBattle').tap();await page.locator('#confirmDelegate').tap();await page.locator('#battleDone').tap();
  const suffix=map.mapId?'-'+map.mapId:'',auto='aobee-yabou-domestic-auto'+suffix,manual='aobee-yabou-domestic-auto-1'+suffix;
  assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),auto),expected);
  await page.locator('#closeModal').tap();
  const check=async()=>{
   assert.equal(await territory.getAttribute('data-owner'),'F01');assert.notEqual(await territory.getAttribute('fill'),oldFill);
   assert.notEqual(await castle.getAttribute('aria-label'),oldLabel);assert((await castle.getAttribute('aria-label')).includes(expected.factions.find(f=>f.id==='F01').name));
   assert((await castle.getAttribute('style')).includes(await territory.getAttribute('fill')));
   const legend=await page.locator('.territoryLegend').innerText(),enemy=expected.factions.find(f=>f.id==='F02');assert.equal(legend.includes(enemy.name),!finalCastle);
   await page.locator('#castleListOpen').tap();await page.locator('[data-list-castle="'+target+'"]').tap();
   assert((await page.locator('#side .owner').innerText()).includes(expected.factions.find(f=>f.id==='F01').name));
   const active=expected.officers.filter(o=>o.status==='active'&&o.locationCastleId===target&&o.factionId==='F01').length,prisoners=expected.officers.filter(o=>o.status==='prisoner'&&o.locationCastleId===target&&o.captorFactionId==='F01').length;
   const staff=await page.locator('.castleStaffSummary').innerText();assert(staff.includes('現役武将 '+active+'人'));if(prisoners)assert(staff.includes('捕虜 '+prisoners+'人'));
  };
  await check();assert.equal(expected.officers.length,54);assert.equal(new Set(expected.officers.map(o=>o.id)).size,54);
  const defender=expected.factions.find(f=>f.id==='F02');if(finalCastle){assert.equal(defender.capitalCastleId,null);assert(expected.officers.some(o=>o.status==='prisoner'&&o.factionId==='F02'));}else{assert(defender.capitalCastleId&&defender.capitalCastleId!==target);assert(expected.officers.filter(o=>o.factionId==='F02'&&o.status==='active').every(o=>expected.castles.some(c=>c.id===o.locationCastleId&&c.ownerFactionId==='F02')));}
  await page.locator('#saveMenu').tap();await page.locator('[data-save="1"]').tap();await page.locator('#confirmSave').tap();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),manual),expected);
  await page.locator('#saveMenu').tap();await page.locator('[data-load="1"]').tap();await page.locator('#confirmLoad').tap();await check();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),manual),expected);
  console.log(scenario,width,finalCastle?'last castle/prisoners':'capital relocation','real delegated battle/recolor/ownership/staff/exact autosave/manual reload OK');
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
