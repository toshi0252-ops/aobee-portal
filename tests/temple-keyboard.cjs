const assert=require('node:assert/strict');
const {boot}=require('./temple-chapter1-flow.cjs');
const g=boot();g.run("$('begin').onclick()");g.flush();
function key(type,k,extra={}){let prevented=false;g.key(type,{key:k,preventDefault(){prevented=true},...extra});return prevented}
assert(key('keydown','W'));assert.equal(g.run('player.y'),7);
key('keyup','W');assert.equal(g.run('hold'),null);
key('keydown','D');assert.equal(g.run('player.x'),9);
key('keyup','d');assert.equal(g.run('hold'),null);
const x=g.run('player.x');assert.equal(key('keydown','D',{ctrlKey:true}),false);assert.equal(g.run('player.x'),x);
const button={id:'questJournalClose',getClientRects:()=>[{}]};
const target={closest:s=>s==='button,a'?button:null};
assert.equal(key('keydown','Enter',{target}),false);
assert.equal(key('keydown',' ',{target}),false);
assert.equal(g.run("$('dialog').style.display"),'none');
assert.equal(key('keydown','w',{target:{isContentEditable:true}}),false);
assert.equal(g.run('player.y'),7);
// Uppercase Z still performs the normal action, and repeated input is suppressed.
g.run('globalThis.keyActions=0;action=()=>{keyActions++}');
key('keydown','Z');key('keydown','Z',{repeat:true});assert.equal(g.run('keyActions'),1);
button.id='act';key('keydown','Enter',{target});assert.equal(g.run('keyActions'),2);
console.log('Keyboard case, release, shortcuts, editing and native button activation passed');
