const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});try{
 const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height]of [[390,844],[844,390],[1440,900]])for(const scenario of ['S01','S07'])for(const id of ['CH09','CH10','CH11'])for(const prior of ['A','B']){
  const map=YabouMaps.forScenario(scenario),story=YabouChains.byId[id],player=map.officers.find(o=>o.id===story.officerIds[0]).factionId;
  let initial=Yabou.createInitialState(map,player,77,scenario);initial.events.pending=null;initial.turn=13;initial.year=2;initial.month=1;
  const capital=initial.factions.find(f=>f.id===player).capitalCastleId;for(const oid of story.officerIds)initial.officers.find(o=>o.id===oid).locationCastleId=capital;
  initial.personnel.chains.tracks.CH06={stage:1,choices:['B'],resolvedTurns:[1],dueTurn:4,lastOffered:1,cofightTurn:0};
  initial.personnel.chains.tracks[id]={stage:1,choices:[prior],resolvedTurns:[7],dueTurn:10,lastOffered:7,cofightTurn:0};initial.personnel.chains.lastOffered=7;
  Yabou.validateState(initial,map,YABOU_RULES);
  await page.setViewportSize({width,height});await page.goto(process.env.YABOU_URL||'file:///'+path.resolve('games/yabou/index.html').replaceAll('\\','/'),{waitUntil:'domcontentloaded'});await page.locator('#newCampaign').waitFor({state:'visible'});
  await page.locator('#importFile').setInputFiles({name:'v110a-progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(initial))});await page.locator('#acceptImport').tap();
  const open=async()=>{await page.locator('[data-tab="人材"]').tap();await page.locator('#retainerStories').tap();};await open();
  assert((await page.locator('.chainRoster > summary').innerText()).includes('11組'));assert((await page.locator('.chainRoster article').first().innerText()).includes('雪解けを待つ約束'));
  await page.locator('[data-request-story="'+id+'"]').tap();const reaction=story.acts[1].responses[prior],other=story.acts[1].responses[prior==='A'?'B':'A'];
  assert((await page.locator('.chainText').first().innerText()).includes(reaction));assert(!(await page.locator('.chainText').first().innerText()).includes(other));
  const body=await page.locator('#dialogContent').boundingBox(),close=await page.locator('#closeModal').boundingBox();assert(body.y+body.height<=close.y+1);assert(close.y+close.height<=height);assert(await page.locator('.chainScreen').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
  if(scenario==='S01'&&id==='CH09'&&prior==='A')await page.screenshot({path:require('node:os').tmpdir()+'/yabou-stories-v110b-'+width+'.png'});
  let expected=Yabou.requestChain(initial,id,map,YABOU_RULES);await page.locator('[data-chain-choice="B"]').tap();expected=Yabou.chooseChain(expected,expected.personnel.chains.pending.uid,'B',map,YABOU_RULES).state;
  const suffix=map.mapId?'-'+map.mapId:'',key='aobee-yabou-domestic-auto'+suffix;assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),expected);assert.deepEqual(expected.personnel.chains.tracks.CH06,initial.personnel.chains.tracks.CH06);
  assert((await page.locator('.chainScreen').innerText()).includes(reaction),'history must replay the reaction to the actual earlier choice');if(!await page.locator('.chainRoster').evaluate(n=>n.open))await page.locator('.chainRoster > summary').tap();await page.locator('[data-read-story="'+id+':1"] > summary').tap();assert((await page.locator('[data-read-story="'+id+':1"]').innerText()).includes(reaction));if(scenario==='S01'&&id==='CH09'&&prior==='A'&&width===390){await page.locator('[data-read-story="'+id+':1"]').scrollIntoViewIfNeeded();await page.screenshot({path:require('node:os').tmpdir()+'/yabou-stories-archive-v110b.png'});}await page.locator('[data-read-story="CH06:0"] > summary').tap();assert((await page.locator('[data-read-story="CH06:0"]').innerText()).includes(YabouChains.byId.CH06.acts[0].text.split('\n')[0]));
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#newCampaign').waitFor({state:'visible'});await page.locator(scenario==='S07'?'#continueExpanded':'#continue').tap();await open();assert((await page.locator('.chainScreen').innerText()).includes(reaction));
  await page.locator('#closeModal').tap();await page.locator('#saveMenu').tap();await page.locator('[data-save="1"]').tap();await page.locator('#confirmSave').tap();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),'aobee-yabou-domestic-auto-1'+suffix),expected);
  console.log(scenario,width,id,player,prior,'native faction/choice-specific reaction/earlier story preserved/exact save/replay/reload OK');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
