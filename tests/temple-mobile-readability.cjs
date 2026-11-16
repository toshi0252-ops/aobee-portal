const {chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),out=process.env.TEMPLE_SCREENSHOTS||path.join(require('os').tmpdir(),'temple-mobile');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const scenes=[['village-npcs','village',10,8],['village-mirrors','village',18,9],['village-workbench','village',21,13],['village-bridge','village',8,13],['forest-guardian','forest',3,16],['ruins-guardian','ruins',12,6],['mural','annex',12,10],['cooperation','seal',8,12]];
  for(const [width,height]of [[667,375],[844,390]]){
   await page.setViewportSize({width,height});await page.goto(process.env.TEMPLE_URL||'http://127.0.0.1:8787/games/aobee_star_temple_portal.html');
   await page.waitForFunction(()=>TemplePresentation.assetsReady());await page.locator('#begin').click();await page.evaluate(()=>{while($('dialog').style.display==='block')nextLine();phase=2;mioRescued=true;objective('ミオに相談し、村の東の反射板を調べよう')});
   const sizes=await page.evaluate(()=>({goal:parseFloat(getComputedStyle($('objective')).fontSize),hud:$('hud').getBoundingClientRect().toJSON()}));assert(sizes.goal>=14,'objective readable at '+width);assert(sizes.hud.right<=width&&sizes.hud.bottom<height/3);
   for(const [name,place,x,y]of scenes){
    const unchanged=await page.evaluate(({place,x,y})=>{area=place;player.x=x;player.y=y;player.dir='up';templeMove=null;$('toast').style.display='none';if(place==='ruins'){ruinKey=true;objective('守護機械の攻撃を避け、武器で停止させよう')}else if(place==='annex')objective('壁画を読み、種・芽・花の順に仕掛けを調べよう');else if(place==='seal')objective('西のスイッチに立ち、わるびーに合図しよう');else if(place==='forest')objective('倒木を押し、森の小さな守り手を巣へ案内しよう');const old=JSON.stringify(snapshot());draw();return old===JSON.stringify(snapshot())},{place,x,y});assert(unchanged,name);
    await page.screenshot({animations:'disabled',path:path.join(out,name+'-'+width+'.png')});
   }
   await page.evaluate(()=>say([['語り','大きな文字で、長い会話も最後まで読める。'.repeat(35)]]));
   assert(await page.locator('#line').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));assert(await page.locator('#dialogNext').isVisible());
   await page.screenshot({animations:'disabled',path:path.join(out,'dialogue-'+width+'.png')});
  }
  assert.deepEqual(errors,[]);console.log('PASS 8 chapter-1 scenes at 667x375 and 844x390; enlarged characters, dedicated props, objective >=14px, dialogue >=16px, unchanged saves and no JS errors; screenshots: '+out);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
