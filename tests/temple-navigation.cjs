const assert=require('node:assert/strict');
const {boot}=require('./temple-chapter1-flow.cjs');
const g=boot();g.run("$('begin').onclick()");g.flush();
g.run('openQuestJournal()');
assert.match(g.el('templeLocation').textContent,/ほしの村/);
assert.equal(g.el('templeCurrentGoal').textContent,'今の目的：'+g.el('objective').textContent);
assert.match(g.el('templeRoute').textContent,/北に長老/);
g.run('closeQuestJournal()');
// Navigation must describe each persisted area without unlocking paths or changing progress.
for(const place of g.run('Object.keys(templePlaces)')){
 g.run(`area=${JSON.stringify(place)}`);
 const before=g.run('JSON.stringify(snapshot())');
 const route=g.run('templeRouteHint()');assert.ok(route.length>15,place);
 g.run('openQuestJournal()');assert.match(g.el('templeLocation').textContent,/現在地：/);
 assert.equal(g.el('templeRoute').textContent,route);
 assert.equal(g.run('JSON.stringify(snapshot())'),before,place+' guidance preserves progress');
 g.run('closeQuestJournal()');assert.equal(g.run('questJournalOpen'),false);
}
g.run("area='ch3_port'");assert.match(g.run('templeRouteHint()'),/船の救助後/);
g.run("area='ch5_court'");assert.match(g.run('templeRouteHint()'),/まず北側の星守/);
console.log('PASS location, objective, all area guides, chapter locks and unchanged save progress');
