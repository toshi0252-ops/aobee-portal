const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
const E=Yabou,R=YABOU_RULES,W=YabouMilitary;
function fixture(scenario){
 const map=YabouMaps.forScenario(scenario),from=scenario==='S01'?'C06':'C13',to=scenario==='S01'?'C01':'C06';
 const state=E.createInitialState(map,'F01',77,scenario),city=(s,id)=>s.castles.find(c=>c.id===id);
 Object.assign(city(state,from),{food:550,gold:1000,troops:1000});Object.assign(city(state,to),{food:10,troops:1000});
 const actors=id=>state.officers.filter(o=>o.status==='active'&&o.locationCastleId===id);
 return {map,state,city,actors,q:{type:'supply',castleId:from,targetCastleId:to,factionId:'F01',officerId:actors(from)[0].id,amount:500}};
}
for(const scenario of ['S01','S07']){
 const {map,state,city,actors,q}=fixture(scenario),from=q.castleId,to=q.targetCastleId;
 for(const bad of [{amount:200},{amount:'500'},{targetCastleId:from},{targetCastleId:'C04'},{targetCastleId:'missing'}])assert(E.canIssueCommand(state,{...q,...bad},R));
 for(const amount of E.supplyAmounts){
  const original={...q,amount},queued=E.queueCommand(state,original,R);
  assert.deepEqual(E.loadSave(E.serializeSave(queued,map,R),map,R),queued);
  const reverse={...original,castleId:to,targetCastleId:from,officerId:actors(to)[0].id,amount:100};
  assert.match(E.canIssueCommand(queued,reverse,R),/兵糧が不足/);
  const result=E.advanceMonth(queued,map,R);
  assert.equal(city(result,from).food,540-amount);
  assert.equal(city(result,to).food,amount);
  assert.equal(city(result,from).gold,970+Math.floor(city(state,from).commerce*1.5));
  assert.equal(result.officers.find(o=>o.id===q.officerId).locationCastleId,from);
  assert.deepEqual(E.loadSave(E.serializeSave(result,map,R),map,R),result);
 }
 const march={type:'march',castleId:from,targetCastleId:to,factionId:'F01',units:[{type:'infantry',troops:500,officerId:actors(from)[1].id}],food:60,declareWar:false};
 assert(W.can(E.queueCommand(state,q,R),march,map,R));
 assert.match(E.canIssueCommand(W.queue(state,march,map,R),q,R),/兵糧が不足/);
}
console.log('PASS both maps: amounts, adjacency, reservations in both orders, no same-month forwarding, exact delivery and save');
async function browserTest(){
 const {chromium}=require('playwright'),browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});
 try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [width,height,scenario,amount] of [[390,844,'S01',100],[844,390,'S07',300],[1440,900,'S07',500]]){
   const {map,state,q,city}=fixture(scenario);
   await page.setViewportSize({width,height});await page.goto(process.env.YABOU_URL||pathToFileURL(path.resolve('games/yabou/index.html')).href);
   await page.locator('#importFile').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
   await page.locator('#acceptImport').tap();await page.locator('#castleListOpen').tap();
   await page.locator('[data-list-castle="'+q.castleId+'"]').tap();const open=page.locator('#castleSupply');
   const reserve=async()=>{
    await open.tap();await page.locator('#supplyTarget').selectOption(q.targetCastleId);await page.locator('#supplyAmount').selectOption(String(amount));
    const close=await page.locator('#closeModal').boundingBox();assert(close.y+close.height<=height);
    assert(await page.locator('#dialogContent').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
    q.officerId=await page.locator('#supplyOfficer').inputValue();q.amount=amount;
    await page.locator('#queueSupply').tap();
   };
   await reserve();await page.locator('#castleOrders').tap();
   assert.match(await page.locator('[data-order-kind="commands"]').innerText(),new RegExp('兵糧輸送.*'+amount));
   await page.locator('[data-order-cancel]').tap();await page.locator('#closeModal').tap();await reserve();
   await page.locator('#next').tap();
   const notice='兵糧輸送（'+amount+'） → '+city(state,q.targetCastleId).name;
   assert((await page.locator('#dialogContent').innerText()).includes(notice));
   await page.locator('#commitMonth').tap();assert((await page.locator('#dialogContent').innerText()).includes(notice));
   const key='aobee-yabou-domestic-auto'+(map.mapId?'-'+map.mapId:'');
   assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),E.advanceMonth(E.queueCommand(state,q,R),map,R));
   console.log('PASS browser',width,height,scenario,amount);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
if(process.env.YABOU_BROWSER==='1')browserTest().catch(e=>{console.error(e);process.exitCode=1});
