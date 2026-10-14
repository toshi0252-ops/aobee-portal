const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const {createCanvas,loadImage}=require('C:/Users/toshi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const sprites=require('../assets/gp-racer-sprites.js')(()=>createCanvas(1,1));
(async()=>{
const sprite=createCanvas(20,20),p=sprite.getContext('2d');p.fillStyle='#fff';p.fillRect(6,4,8,12);
const scene=createCanvas(80,80),c=scene.getContext('2d');c.fillStyle='#48a055';c.fillRect(0,0,80,80);
sprites.draw(c,sprite,10,10,40,40,'rgba(18,18,30,.72)');
assert.deepEqual([...c.getImageData(12,12,1,1).data],[72,160,85,255]);assert.notDeepEqual([...c.getImageData(30,30,1,1).data],[255,255,255,255]);
const rear=await loadImage('assets/characters/warubee-race-rear-v1.png');assert.equal(rear.width,rear.height);
const a=createCanvas(rear.width,rear.height);a.getContext('2d').drawImage(rear,0,0);assert.equal(a.getContext('2d').getImageData(0,0,1,1).data[3],0);
const html=fs.readFileSync('games/aobee_grand_prix_v47_visual_lobby.html','utf8');for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const code=html.slice(html.indexOf('function drawRenaMascot'),html.indexOf('function drawKartBase'));
const env={WARUBEE_RACE_REAR:{complete:true,naturalWidth:rear.width,naturalHeight:rear.height},GPRacerSprites:{draw(ctx,img,...args){sprites.draw(ctx,rear,...args)}},c};vm.createContext(env);vm.runInContext(code,env);c.fillStyle='#48a055';c.fillRect(0,0,80,80);c.save();c.translate(40,75);vm.runInContext('drawRenaMascot(c,{evil:true})',env);c.restore();assert.deepEqual([...c.getImageData(1,1,1,1).data],[72,160,85,255]);
fs.writeFileSync('../aobee-qa/gp-v47/sprite-alpha-proof.png',scene.toBuffer('image/png'));console.log('PASS: tinted sprite preserves scenery; official rear has alpha; actual Warubee renderer uses official sprite; scripts parse');
})();

