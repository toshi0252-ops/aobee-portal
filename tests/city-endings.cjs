const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});page.on('dialog',d=>d.accept());
 const url='file:///'+path.resolve('games/aobee_city_dev.html').replaceAll('\\','/');await page.goto(url);
 for(const key of ['growth','recovery','green','traffic','tourism','rebuild','metro']){
  await page.evaluate(key=>{if($('ending').open)$('ending').close();newCity(scenarioMeta[key][0]);titleOpen=false;$('titleScreen').hidden=true;showEnding(scenarios[key]);},key);
  await page.waitForFunction(()=>!$('endingIllustration').hidden&&$('endingIllustration').naturalWidth>0);
  await page.screenshot({path:'verification/city/ending-'+key+'.png'});
  const last=key==='metro'?3:2;for(let step=1;step<=last;step++){await page.getByRole('button',{name:'次へ',exact:true}).tap();assert.equal(await page.evaluate(()=>endingStep),step);}
  if(key==='metro'){
   await page.waitForFunction(()=>$('endingIllustration').src.endsWith('aobee_city_grand.webp')&&!$('endingIllustration').hidden);
   assert.equal(await page.locator('#endingName').textContent(),'七つの街、七つの夢');await page.screenshot({path:'verification/city/ending-grand.png'});
  }
  await page.getByRole('button',{name:'自由開発へ',exact:true}).tap();assert.equal(await page.evaluate(()=>won),false);
 }
 await page.reload();await page.getByRole('button',{name:'シナリオモード',exact:true}).tap();
 await page.locator('#scenarioCards button').last().tap();await page.locator('#scenarioIllustration').scrollIntoViewIfNeeded();
 await page.screenshot({path:'verification/city/scenario-art-mobile.png'});
 await page.getByRole('button',{name:'このシナリオを開始',exact:true}).tap();assert.equal(await page.evaluate(()=>mode),'metro');assert.equal(await page.locator('#titleScreen').isVisible(),false);
 await page.route('**/art/aobee_city_*.webp',r=>r.abort());await page.route('**/aobee_city_title.webp',r=>r.abort());await page.reload();
 await page.waitForFunction(()=>$('titleArtwork').complete);assert.equal(await page.locator('#skyline').isVisible(),true);
 await page.getByRole('button',{name:'シナリオモード',exact:true}).tap();await page.waitForFunction(()=>$('scenarioIllustration').complete);
 assert.equal(await page.locator('#scenarioPreview').isVisible(),true);assert.equal(await page.locator('#scenarioIllustration').isVisible(),false);
 console.log('PASS: 7 scene endings, grand finale, free development, scenario start, image failure fallbacks');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
