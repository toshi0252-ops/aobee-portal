const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url='file:///'+path.resolve('games/aobee_city_dev.html').replaceAll('\\','/');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 fs.mkdirSync('verification/city',{recursive:true});
 const errors=[],report={viewports:[]};
 try{
 for(const [width,height]of [[320,568],[390,844],[568,320],[844,390],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true});const page=await context.newPage();
  page.on('dialog',d=>d.accept());page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
  await page.goto(url);await page.waitForFunction(()=>document.querySelector('#titleScreen').classList.contains('art-ready'));
  const geometry=await page.evaluate(()=>{
   const a=$('titleArtwork').getBoundingClientRect(),m=$('titleMenu').getBoundingClientRect();
   return {overlap:a.left<m.right&&a.right>m.left&&a.top<m.bottom&&a.bottom>m.top,menuVisible:m.left>=0&&m.top>=0&&m.right<=innerWidth&&m.bottom<=innerHeight,scroll:document.documentElement.scrollWidth>innerWidth};
  });
  assert(!geometry.overlap);assert(geometry.menuVisible);assert(!geometry.scroll);
  await page.screenshot({path:`verification/city/title-${width}x${height}.png`});
  await page.getByRole('button',{name:'シナリオモード',exact:true}).tap();
  for(const key of ['growth','recovery','green','traffic','tourism','rebuild','metro']){
   await page.evaluate(key=>selectScenario(key),key);
   await page.waitForFunction(()=>!$('scenarioIllustration').hidden&&$('scenarioIllustration').naturalWidth>0);
   assert.equal(await page.locator('#scenarioPreview').isVisible(),false);
  }
  await page.screenshot({path:`verification/city/scenario-${width}x${height}.png`});
  await page.getByRole('button',{name:'戻る',exact:true}).tap();
  await page.getByRole('button',{name:'資金無制限モード',exact:true}).tap();await page.getByRole('button',{name:'停止',exact:true}).tap();
  await page.evaluate(()=>{s=28;ox=oy=0});
  const c=await page.locator('#c').boundingBox();
  // A real touchscreen tap builds a road and a drag pans without building.
  const before=await page.evaluate(()=>grid[0].t);await page.touchscreen.tap(c.x+14,c.y+14);
  assert.equal(await page.evaluate(()=>grid[0].t),'road');
  await page.getByRole('button',{name:'基本',exact:true}).tap();await page.locator('#tools button').filter({hasText:/^移動$/}).tap();
  await page.getByRole('button',{name:'音設定',exact:true}).tap();
  await page.locator('#audioDialog [data-bgm]').tap();
  await page.waitForFunction(()=>audio?.state==='running'&&musicOn);
  const sound=await page.evaluate(()=>{sfx('build');return {state:audio.state,musicOn,volume,soundOn}});
  assert.equal(sound.state,'running');assert(sound.musicOn);
  await page.locator('#volumeSlider').fill('35');await page.locator('#volumeSlider').dispatchEvent('input');
  await page.locator('#soundCheck').uncheck();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('aobeeAudio'))),{sound:false,volume:.35});
  await page.locator('#audioDialog').getByRole('button',{name:'閉じる',exact:true}).tap();
  await page.screenshot({path:`verification/city/game-${width}x${height}.png`});
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:c.x+40,y:c.y+40}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:c.x+70,y:c.y+60}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.deepEqual(await page.evaluate(()=>[ox,oy,down,pointer]),[30,20,false,null]);
  report.viewports.push({width,height,...geometry,touchBuild:true,touchPan:true,audio:sound,previousTile:before});
  await context.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync('verification/city/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
