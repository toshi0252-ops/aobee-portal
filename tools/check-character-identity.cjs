const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const manifest=JSON.parse(fs.readFileSync('assets/characters/manifest-v1.json','utf8'));
const calls=[];
class Context {drawImage(...args){calls.push(args)}}
class Image {constructor(){this.naturalWidth=1774;this.naturalHeight=887}set src(value){this._src=value;queueMicrotask(()=>this.onload?.())}get src(){return this._src}}
const root={dataset:{},nodeType:1,matches:()=>false,querySelectorAll:()=>[]};
const document={currentScript:{src:'https://example.test/assets/character-identity.js'},documentElement:root,head:{append(){}},querySelector:()=>null,createElement:tag=>tag==='canvas'?{getContext:()=>new Context(),toDataURL:()=> 'data:image/png;base64,new'}:{}};
const window={document,CanvasRenderingContext2D:Context,MutationObserver:class {observe(){}},CustomEvent:class {},dispatchEvent(){}};
vm.runInNewContext(fs.readFileSync('assets/character-identity.js','utf8'),{window,document,Image,URL,fetch:async()=>({ok:true,json:async()=>manifest}),console,atob});
window.AobeeIdentity.ready.then(()=>{
 const ctx=new Context();calls.length=0;
 const ordinary={src:'https://example.test/scenery.png',naturalWidth:100,naturalHeight:80};ctx.drawImage(ordinary,1,2,30,40);assert.equal(calls.at(-1)[0],ordinary);
 const atlas=window.AobeeIdentity.atlas;ctx.drawImage(atlas,1,2);assert.equal(calls.at(-1)[0],atlas);
 const rpg={src:'https://example.test/games/rpg/assets/aobee-walk-v1.png',naturalWidth:192,naturalHeight:256};
 for(const [row,col]of [[0,0],[1,2],[2,3],[3,1]]){ctx.drawImage(rpg,0,row*64,48,64,10,20,48,64);const call=calls.at(-1);assert.equal(call[0],atlas);assert.equal(call[1],col*443.5);assert.deepEqual(call.slice(5),[10,36,48,48])}
 assert.ok(Object.keys(manifest).length>=30);
 console.log('PASS: scenery unchanged, atlas unchanged, four RPG directions and original destination bounds preserved.');
}).catch(error=>{console.error(error);process.exitCode=1});
