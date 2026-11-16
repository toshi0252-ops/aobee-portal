const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const out=process.env.TEMPLE_SCREENSHOTS||path.join(require('os').tmpdir(),'temple-visuals');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url=process.env.TEMPLE_URL||'http://127.0.0.1:8787/games/aobee_star_temple_portal.html';
  await page.goto(url);await page.waitForFunction(()=>TempleVisuals.assetsReady());
  await page.locator('#begin').click();await page.evaluate(()=>{while($('dialog').style.display==='block')nextLine()});
  const examples=['village','forest','annex','ch2_hub','ch2_tower4','ch3_port','ch3_shore','ch4_settlement','ch4_chart','ch5_court','ch5_core','ch5_festival'];
  const places=await page.evaluate(()=>Object.keys(templePlaces));
  for(const place of places){
   const unchanged=await page.evaluate(place=>{area=place;player.x=12;player.y=10;templeMove=null;const before=JSON.stringify(snapshot());draw();return before===JSON.stringify(snapshot())},place);
   assert(unchanged,place+': drawing must not mutate progress');
   if(examples.includes(place))await page.screenshot({animations:'disabled',path:path.join(out,place+'.png')});
  }
  for(const [key,file]of [['harborRescue','ch3-harbor-rescue'],['templeChart','ch4-temple-chart'],['lightRestored','ch5-light-restored'],['grandFestival','ch5-grand-festival']]){
   await page.evaluate(key=>say([['語り','旅の先で、みんなの光がつながっていく。']],null,key),key);
   await page.waitForFunction(()=>{const p=document.getElementById('eventStillImage');return p.complete&&p.naturalWidth>0});
   await page.locator('#eventStillImage').evaluate(img=>img.decode());
   assert((await page.locator('#eventStillImage').getAttribute('src')).endsWith(file+'.webp'));
   assert(await page.locator('#eventStill').isVisible());
   await page.screenshot({animations:'disabled',path:path.join(out,file+'.png')});
   await page.locator('#dialogNext').click();assert.equal(await page.locator('#eventStill').isVisible(),false);
  }
  // New art follows the existing image-error fallback and never blocks the dialogue.
  await page.route('**/temple-events/ch4-temple-chart.webp',r=>r.abort());
  await page.evaluate(()=>{const img=$('eventStillImage');img.removeAttribute('src');say([['語り','画像がなくても会話を続けられる。']],null,'templeChart')});
  await page.waitForFunction(()=>document.getElementById('eventStill').hidden);
  assert(await page.locator('#dialogNext').isVisible());await page.locator('#dialogNext').click();
  assert.deepEqual(errors,[]);
  // A fresh page with failed scenery loading still renders the code fallback.
  const fallback=await browser.newPage();await fallback.route('**/temple-scenery-atlas.webp',r=>r.abort());
  await fallback.goto(url);await fallback.locator('#begin').click();await fallback.evaluate(()=>{while($('dialog').style.display==='block')nextLine();area='ch5_court';draw()});
  assert.equal(await fallback.evaluate(()=>TempleVisuals.assetsReady()),false);
  console.log('PASS '+places.length+' area renders, unchanged progress, 4 dedicated illustrations and close behavior, missing-art dialogue and scenery fallbacks; 12 area screenshots: '+out);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
