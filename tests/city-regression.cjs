const {chromium}=require('playwright');const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage();page.on('dialog',d=>d.accept());await page.goto('file:///'+path.resolve('games/aobee_city_dev.html').replaceAll('\\','/'));
 const traffic=JSON.parse(fs.readFileSync('verification/city/traffic.save.json','utf8'));
 const streak=await page.evaluate(d=>{
  localStorage.setItem('aobeeCity01',JSON.stringify(d));load();titleOpen=false;$('titleScreen').hidden=true;won=false;goalStreak=7;save();load();if(goalStreak!==7)throw Error('Streak reload');
  const rail=grid.findIndex(a=>a.t==='rail');grid[rail]={t:'grass',l:0};tick();if(goalStreak!==0||won)throw Error('Broken railway must reset streak');
  grid[rail]={t:'rail',l:0};for(let i=0;i<11;i++){tick();if(won)throw Error('Early traffic victory');}tick();if(!won||goalStreak!==12)throw Error('Twelfth month must win');
  $('ending').close();d.version=8;for(const k of ['goalStreak','history','effects','policyHistory'])delete d[k];d.won=false;localStorage.setItem('aobeeCity01',JSON.stringify(d));if(!load()||goalStreak!==0||effects.length||history.length)throw Error('Legacy save');
  return {reset:true,resume:true,twelfthMonth:true,legacyVersion8:true};
 },traffic);
 const metro=JSON.parse(fs.readFileSync('verification/city/metro.save.json','utf8'));
 const long=await page.evaluate(d=>{
  localStorage.setItem('aobeeCity01',JSON.stringify(d));load();leaveEnding(false);if(won||mode!=='free')throw Error('Free development must allow policies again');titleOpen=false;$('titleScreen').hidden=true;
  let seed=42;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);let choices=0,fires=0,storms=0;
  const start=month;for(let n=0;n<360;n++){if(pendingPolicy){if(pendingPolicy.key==='storm')storms++;let enabled=[...$('policyChoices').children].filter(b=>!b.disabled);enabled[n%enabled.length].click();choices++;}speed=1;tick();if(eventLog.includes('火災'))fires++;if(!Number.isFinite(cash)||!valid(snapshot()))throw Error('Invalid long-running city');}
  return {start,end:month,pop,cash:Math.round(cash),happy,policies:choices,storms,fireEventMonths:fires,disasters:$('disasters').checked,history:history.length,mode};
 },metro);assert(long.policies>20);assert(long.disasters);assert(long.cash>0);assert.equal(long.history,360);
 const policies=await page.evaluate(d=>{
  let count=0;for(const p of policies)for(let choice=0;choice<p.choices.length;choice++){
   localStorage.setItem('aobeeCity01',JSON.stringify(d));load();won=false;month=18;policyHistory=policies.filter(v=>v.key!==p.key).map(v=>v.key); // Select a policy explicitly; run its actual button handler.
   let before=policies.filter(v=>pop>=v.min&&(v.key!=='storm'||$('disasters').checked)&&!policyHistory.slice(-2).includes(v.key));
   const pick=before.indexOf(p),old=Math.random;Math.random=()=> (pick+.1)/before.length;offerPolicy();Math.random=old;
   if(pendingPolicy!==p)throw Error('Policy selection');$('policyChoices').children[choice].click();if(pendingPolicy||!valid(snapshot()))throw Error('Policy state');count++;
  }return count;
 },metro);assert.equal(policies,16);
 const report={streak,long,policyChoices:policies};fs.writeFileSync('verification/city/regression.json',JSON.stringify(report,null,2));console.log(report);
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
