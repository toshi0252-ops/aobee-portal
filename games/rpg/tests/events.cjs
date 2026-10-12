global.AobeeStory=require('../src/story.js');
const assert=require('node:assert/strict');
require('../src/events.js');
const events=globalThis.AobeeEvents,save=require('../src/save.js'),maps=require('../src/maps.js');
let lines=0;
const app={state:save.createState(),data:require('../src/data.js'),dialogue:{start:(content,done)=>{lines++;if(done)done();}},audio:{effect:()=>{},mood:()=>{}},ui:{toast:()=>{},hud:()=>{}},map(){return maps.maps[this.state.mapId]},syncVisual(){},cancelPath(){},input:{reset(){}}};
events.intro(app);assert.equal(app.state.events.luminaIntro,true);events.intro(app);assert.equal(lines,1,'intro once');
events.interact(app,{id:'village-herb',type:'chest'});events.interact(app,{id:'village-herb',type:'chest'});
assert.equal(app.state.inventory.herb,2);assert.deepEqual(app.state.chests,['village-herb']);
const snapshot=save.migrate(app.state);app.state=snapshot;events.intro(app);assert.equal(lines,3,'restored intro does not repeat');
for(const door of maps.maps['hoshi-village'].doors){events.transition(app,door);assert.equal(app.state.mapId,door.to);assert.ok(app.state.events[door.event]);assert.ok(maps.walkable(app.map(),app.state.position.x,app.state.position.y));const back=app.map().doors[0];events.transition(app,back);assert.equal(app.state.mapId,'hoshi-village');}
console.log('PASS: intro once after restore, chest reward once, both house entry/exit events');
