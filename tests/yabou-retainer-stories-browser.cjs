const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');require('../games/yabou/data.js');require('../games/yabou/diplomacy.js');require('../games/yabou/battle.js');require('../games/yabou/military.js');require('../games/yabou/engine.js');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});try{
 const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height]of [[390,844],[844,390],[1440,900]])for(const scenario of ['S01','S07'])for(const id of YabouChains.defs.filter(d=>d.manual).map(d=>d.id)){
  const map=YabouMaps.forScenario(scenario),story=YabouChains.byId[id];let initial=Yabou.createInitialState(map,'F01',77,scenario);initial.events.pending=null;
  if(id!=='CH06')for(const oid of story.officerIds){Object.assign(initial.officers.find(o=>o.id===oid),{status:'active',factionId:'F01',locationCastleId:'C01'});YabouAllegiance.joined(initial,oid);}
  await page.setViewportSize({width,height});await page.goto(process.env.YABOU_URL||'file:///'+path.resolve('games/yabou/index.html').replaceAll('\\','/'),{waitUntil:'domcontentloaded'});await page.locator('#newCampaign').waitFor({state:'visible'});
  await page.locator('#importFile').setInputFiles({name:'old-five-stories.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(initial))});await page.locator('#acceptImport').tap();
  const open=async()=>{await page.locator('[data-tab="人材"]').tap();await page.locator('#retainerStories').tap();};await open();
  assert((await page.locator('.chainRoster > summary').innerText()).includes(YabouChains.defs.length+'組'));const before=await page.evaluate(()=>JSON.stringify(localStorage));assert.equal(await page.locator('[data-request-story="'+id+'"]').isEnabled(),true);assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),before);
  await page.locator('[data-request-story="'+id+'"]').tap();assert((await page.locator('.retainerStoryCast').innerText()).includes(initial.officers.find(o=>o.id===story.officerIds[0]).name));assert((await page.locator('.chainText').first().innerText()).includes(story.acts[0].text.split('\n')[0]));
  const content=await page.locator('#dialogContent').boundingBox(),close=await page.locator('#closeModal').boundingBox();assert(content.y+content.height<=close.y+1);assert(close.y+close.height<=height);assert(await page.locator('.chainScreen').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
  if(scenario==='S01'&&id==='CH06'){await page.screenshot({path:require('node:os').tmpdir()+'/yabou-retainer-story-'+width+'.png'});}
  let expected=Yabou.requestChain(initial,id,map,YABOU_RULES);const suffix=map.mapId?'-'+map.mapId:'',key='aobee-yabou-domestic-auto'+suffix;assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),expected);
  await page.locator('[data-chain-choice="A"]').tap();expected=Yabou.chooseChain(expected,expected.personnel.chains.pending.uid,'A',map,YABOU_RULES).state;assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),expected);
  assert((await page.locator('.chainScreen').innerText()).includes(story.acts[0].text.split('\n')[0]),'completed scene remains readable');
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#newCampaign').waitFor({state:'visible'});await page.locator(scenario==='S07'?'#continueExpanded':'#continue').tap();await open();
  if(!await page.locator('.chainRoster').evaluate(n=>n.open))await page.locator('.chainRoster > summary').tap();assert((await page.locator('.chainScreen').innerText()).includes('1 / 4幕'));assert((await page.locator('.chainScreen').innerText()).includes(story.acts[0].text.split('\n')[0]));
  if(!await page.locator('.chainRoster').evaluate(n=>n.open))await page.locator('.chainRoster > summary').tap();assert.equal(await page.locator('[data-request-story="'+id+'"]').isEnabled(),false);
  await page.locator('#closeModal').tap();await page.locator('#saveMenu').tap();await page.locator('[data-save="1"]').tap();await page.locator('#confirmSave').tap();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),'aobee-yabou-domestic-auto-1'+suffix),expected);
  console.log(scenario,width,id,'old save/start/read/choice/exact pending and completed save/full scene replay/reload/cooldown OK');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
