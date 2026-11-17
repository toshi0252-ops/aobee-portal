const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
// Build representative pre-report checkpoints from the existing complete game-flow tests.
const originalWrite=fs.writeFileSync,originalLog=console.log;
fs.writeFileSync=(p,...a)=>originalWrite(typeof p==='string'&&p.startsWith('/tmp/')?path.join(require('os').tmpdir(),p.slice(5)):p,...a);
console.log=()=>{};
const {completeChapter1}=require('./temple-chapter1-flow.cjs'),{complete}=require('./temple-chapter2-tower.cjs'),{play}=require('./temple-chapter3-flow.cjs'),{finish}=require('./temple-chapter4-flow.cjs');
const games=[completeChapter1(),complete('trust','gentle',false),play(false),finish(false,'share')];
const fixtures=games.map((g,i)=>{const s=JSON.parse(g.run('JSON.stringify(snapshot())'));s.area=i<2?'village':i===2?'ch3_port':'ch4_chart';s.player={...s.player,x:i<3?10:12,y:i<2?7:i===2?8:6,dir:'up'};if(i===0){s.chapter1Story.reportSeen=false;s.chapter1Story.mode='won';s.chapterFinished=false;s.phase=4}else s['chapter'+(i+1)].reported=false;return s});
const legacy=JSON.parse(games[0].run('JSON.stringify(snapshot())')),saveKey=games[0].run('SAVE_KEY');
console.log=originalLog;fs.writeFileSync=originalWrite;
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),out=process.env.TEMPLE_SCREENSHOTS||path.join(require('os').tmpdir(),'temple-journey');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=process.env.TEMPLE_URL||'http://127.0.0.1:8787/games/aobee_star_temple_portal.html';
  async function restore(s){await page.goto(url);await page.waitForFunction(()=>typeof TempleJourney==='object'&&TemplePresentation.assetsReady());await page.locator('#begin').click();await page.evaluate(s=>{while($('dialog').style.display==='block')nextLine();restoreGame(s)},s)}
  async function readUntil(expected){for(let n=0;n<65;n++){if(await page.evaluate(()=>area)===expected&&!(await page.locator('#dialogNext').isVisible()))return;if(await page.locator('#dialogNext').isVisible())await page.locator('#dialogNext').click();else await page.waitForTimeout(20)}throw Error('Did not continue into '+expected)}
  const destinations=['ch2_gate','ch3_port','ch4_landing','ch5_court'];
  for(let i=0;i<4;i++){
   await restore(fixtures[i]);await page.locator('#act').click();await readUntil(destinations[i]);
   assert.equal(await page.evaluate(()=>chapterClearOpen),false,'no chapter-selection stop after report '+(i+1));
   assert(await page.evaluate(n=>[null,null,TempleChapter2,TempleChapter3,TempleChapter4,TempleChapter5][n].getState().started,i+2));
   await page.screenshot({animations:'disabled',path:path.join(out,'automatic-'+(i+1)+'-to-'+(i+2)+'.png')});
   if(i===3){
    const positions=await page.evaluate(()=>{const a=area;area='ch5_festival';const p=TempleJourney.party();area=a;return p.map(({who,x,y})=>({who,x,y}))});
    assert.deepEqual(positions,[{who:'mio',x:6,y:10},{who:'warubee',x:7,y:10}]);
   }
   if(i===0){
    const starting=await page.evaluate(()=>TempleJourney.party());assert.equal(starting.length,1);assert.deepEqual(starting.map(x=>x.who),['mio']);
    await page.evaluate(()=>move(0,-1));await page.waitForFunction(()=>TempleJourney.party()[0].y===14);
    assert(await page.evaluate(()=>TempleJourney.party().every(p=>!wall(p.x,p.y)&&(p.x!==player.x||p.y!==player.y))));
    await page.screenshot({animations:'disabled',path:path.join(out,'party-following.png')});
    await page.locator('#travelMapButton').click();assert(await page.locator('#journeyMap').isVisible());assert.match(await page.locator('#journeyRegion1').textContent(),/未解決の依頼/);
    await page.screenshot({animations:'disabled',path:path.join(out,'travel-map.png')});
    await page.locator('#journeyRegion1').click();assert.equal(await page.evaluate(()=>area),'village');
    // Returning really allows an unfinished chapter-one errand, rather than only a generic post-clear line.
    await page.evaluate(()=>{player.x=10;player.y=7;player.dir='up'});await page.locator('#act').click();assert.match(await page.locator('#line').textContent(),/地図/);
    await page.evaluate(()=>{while($('dialog').style.display==='block')nextLine()});await page.locator('#travelMapButton').click();await page.locator('#journeyRegion2').click();await readUntil('ch2_gate');
    assert.equal(await page.evaluate(()=>chapter1Story.reportSeen),true);
   }
  }
  // Previously cleared regions also connect through named roads and a boarding point.
  await restore(fixtures[0]);await page.evaluate(()=>{chapter1Story.reportSeen=true;area='forest';player.x=12;player.y=3;player.dir='up';move(0,-1)});await readUntil('ch2_gate');
  const portDone=JSON.parse(JSON.stringify(fixtures[2]));portDone.chapter3.reported=true;
  await restore(portDone);await page.evaluate(()=>{area='village';player.x=21;player.y=9;move(1,0)});assert.equal(await page.evaluate(()=>area),'ch3_port');
  await page.evaluate(()=>{player.x=5;player.y=14;player.dir='up'});await page.locator('#act').click();await readUntil('ch4_landing');
  const islandDone=JSON.parse(JSON.stringify(fixtures[3]));islandDone.chapter4.reported=true;
  await restore(islandDone);await page.locator('#act').click();await readUntil('ch5_court');
  await page.setViewportSize({width:667,height:375});await page.locator('#travelMapButton').click();
  await page.locator('#journeyRegion5').scrollIntoViewIfNeeded?.();
  await page.locator('#journeyMapClose').click();assert.equal(await page.locator('#journeyMap').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'act');
  // Continuing a legacy cleared save needs no hidden menu button either.
  await page.goto(url);await page.evaluate(({saveKey,legacy})=>localStorage.setItem(saveKey,JSON.stringify(legacy)),{saveKey,legacy});await page.reload();await page.locator('#continue').click();await page.locator('#recoverySlots button').filter({hasText:'自動セーブから再開'}).click();await readUntil('ch2_gate');
  // A failed save does not silently send the player away from the clear record.
  await restore(fixtures[0]);await page.evaluate(()=>{localStorage.setItem=()=>{throw Error('storage full')}});await page.locator('#act').click();await page.evaluate(()=>{while($('dialog').style.display==='block')nextLine()});await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>area),'village');assert(await page.locator('#chapterClear').isVisible());assert.match(await page.locator('#chapterClearSaveStatus').textContent(),/保存できません/);
  assert.deepEqual(errors,[]);
  console.log('PASS real report dialogue -> next region for 1->2->3->4->5, no chapter-selection stop, map return and unfinished errand, visible path followers, legacy continue, save-failure guard; screenshots: '+out);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
