const assert = require('node:assert/strict');
const {createState, save, load} = require('../src/save.js');
const records = new Map();
const storage = {getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value)};
assert.equal(load(storage, 1), null);
for (let slot=1;slot<=3;slot++) {
  const state=createState(); state.position.x=slot; state.events.luminaIntro=true;
  state.choices.sunsetPromise='remember'; state.chests=['village-01'];
  state.inventory.herb=2; state.settings.controls='tap';
  save(storage,slot,state); assert.deepEqual(load(storage,slot).state,state);
}
assert.equal(load(storage,1).state.position.x,1);
assert.throws(()=>load(storage,4));
records.set('aobee-rpg:slot:2','broken');
assert.throws(()=>load(storage,2)); assert.equal(records.get('aobee-rpg:slot:2'),'broken');
const future=createState(); future.version=99; assert.throws(()=>save(storage,1,future));
assert.equal(load(storage,1).state.version,3);
console.log('PASS: 3 slots, complete round trip, isolation, invalid slot, corruption preservation, future version rejection');
