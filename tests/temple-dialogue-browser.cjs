const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url=process.env.TEMPLE_URL||'file:///'+path.resolve('games/aobee_star_temple_portal.html').replaceAll('\\','/');
  for(const [width,height] of [[844,390],[667,375],[960,540],[1440,900]]){
   await page.setViewportSize({width,height});await page.goto(url);
   assert.equal(await page.locator('#dialog').isVisible(),false,'no empty dialogue at title');
   await page.locator('#begin').click();
   await page.evaluate(()=>{while($('dialog').style.display==='block')nextLine();say([['語り','村と森と港と島へ、約束を届けよう。'.repeat(90)],['あおびー','みんなで次の旅へ。']]);});
   assert.equal(await page.locator('#act').getAttribute('aria-label'),'会話を次へ進める');
   const geometry=await page.evaluate(()=>({line:$('line').clientHeight,scroll:$('line').scrollHeight,next:$('dialogNext').getBoundingClientRect().toJSON()}));
   assert(geometry.scroll>geometry.line&&geometry.line>20,'long text has a scrollable body');
   assert(geometry.next.height>=44&&geometry.next.bottom<=height&&geometry.next.top>=0,'next stays visible');
   const line=page.locator('#line'),before=await line.textContent(),box=await line.boundingBox();
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,300);
   await page.waitForFunction(()=>document.getElementById('line').scrollTop>0);
   assert.equal(await line.textContent(),before,'scroll does not advance');
   await page.mouse.move(box.x+20,box.y+box.height-10);await page.mouse.down();await page.mouse.move(box.x+20,box.y+10,{steps:8});await page.mouse.up();
   assert.equal(await line.textContent(),before,'drag does not advance');
   await page.locator('#dialogNext').click();
   assert.equal(await line.textContent(),'みんなで次の旅へ。');
   assert.equal(await line.evaluate(el=>el.scrollTop),0);
   assert.equal(await page.locator('#dialogNext').textContent(),'読み終える ✓');
   await page.locator('#dialogNext').press('Enter');
   assert.equal(await page.locator('#dialog').isVisible(),false);
   assert.equal(await page.locator('#act').getAttribute('aria-label'),'調べる・攻撃');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS dialogue at 4 sizes: title hidden, long text scroll, fixed next, drag suppression, single advance, scroll reset, keyboard finish, action label, no JS errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
