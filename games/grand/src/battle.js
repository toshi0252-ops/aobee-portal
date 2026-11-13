'use strict';
/* 戦闘: コマンド式。こうげき / 歯車チャージ（溜めて大ダメージ+歯車はずし）/ ほし草（回復）
ボスは3ターンごとに歯車を付け替えて弱点（通常/歯車）が入れ替わる。強がりゲージで踏みとどまり。 */
const Battle = (() => {
const ui = document.getElementById('battle-ui');
const logEl = document.getElementById('battle-log');
const statusEl = document.getElementById('battle-status');
const cmdsEl = document.getElementById('battle-cmds');
const enemyArea = document.getElementById('enemy-area');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

let B = null; // battle state

function log(text) { logEl.textContent = text;}
async function logSeq(lines, per = 950) {
for (const t of lines) { log(t); await wait(per);}
}
function renderStatus() {
const s = B.state;
statusEl.innerHTML =
`あおびー Lv1<br>HP ${Math.max(0, s.hp)}/${s.maxHp}<div class="bar hp"><div style="width:${Math.max(0, s.hp) / s.maxHp * 100}%"></div></div>` +
`強がり<div class="bar guts"><div style="width:${s.guts}%"></div></div>` +
(B.charged? '<span style="color:#ffd94d;font-weight:700">⚙ 歯車チャージ完了！</span>': '');
document.getElementById('herb-count').textContent = s.herbs;
}
function renderEnemy() {
enemyArea.innerHTML = '';
B.enemies.forEach((e, i) => {
const d = document.createElement('div');
d.className = 'enemy'; d.id = 'enemy-' + i;
d.style.left = (50 + (i - (B.enemies.length - 1) / 2) * 34) + '%';
d.style.top = '6%';
if (e.kind === 'boss') {
const wrap = document.createElement('div');
wrap.style.display = 'flex'; wrap.style.justifyContent = 'center'; wrap.style.alignItems = 'flex-end'; wrap.style.gap = '2px';
const img = document.createElement('img');
img.src = 'assets/warubee-front-v1.png'; img.alt = 'わるびー'; img.style.height = '128px';
img.onerror = () => { img.style.display = 'none';};
const c = document.createElement('canvas'); c.width = 110; c.height = 110;
Engine.drawKarakuri(c.getContext('2d'), 55, 62, 105);
wrap.appendChild(c); wrap.appendChild(img);
d.appendChild(wrap);
} else {
const c = document.createElement('canvas'); c.width = 120; c.height = 120;
Engine.drawCog(c.getContext('2d'), 60, 60, 115);
d.appendChild(c);
}
const nm = document.createElement('div'); nm.className = 'ename';
nm.textContent = e.name + (e.kind === 'boss'? `（弱点：${e.weakMode === 'gear'? '歯車スキル': '通常こうげき'}）`: '');
const hp = document.createElement('div'); hp.className = 'ehp';
const fill = document.createElement('div'); fill.style.width = (Math.max(0, e.hp) / e.maxHp * 100) + '%';
hp.appendChild(fill); d.appendChild(nm); d.appendChild(hp);
d._fill = fill; d._nm = nm;
enemyArea.appendChild(d);
e._el = d;
});
}
function refreshEnemyHP() {
B.enemies.forEach(e => {
if (e._el) {
e._el._fill.style.width = (Math.max(0, e.hp) / e.maxHp * 100) + '%';
if (e.kind === 'boss') e._el._nm.textContent = e.name + `（弱点：${e.weakMode === 'gear'? '歯車スキル': '通常こうげき'}）`;
if (e.hp <= 0) e._el.style.opacity = '0.25';
}
});
}
function setCmds(on) {
cmdsEl.classList.toggle('hidden',!on);
[...cmdsEl.querySelectorAll('button')].forEach(b => {
b.disabled =!on || (b.dataset.cmd === 'herb' && B.state.herbs <= 0);
});
}

async function start(cfg) {
return new Promise(async (resolve) => {
const state = cfg.state;
B = {
state, cfg, charged: false, round: 0, busy: true, midDone: false,
enemies: cfg.enemies.map(e => ({...e, hp: e.maxHp, weakMode: e.weakMode || 'normal'}))
};
ui.classList.remove('hidden');
document.getElementById('hud').classList.add('hidden');
renderEnemy(); renderStatus(); setCmds(false);
Engine.Snd.gear();
await logSeq([cfg.intro || `${B.enemies[0].name} が あらわれた！`], 900);
if (cfg.tutorial) {
await logSeq([
'コマンドは3つだけ。まず「こうげき」で様子を見よう。',
'「歯車チャージ」は1ターン溜めて、次の「こうげき」が大ダメージ＋歯車はずしになる。',
'ピンチのときは「ほし草」。HPが20回復する。……さあ、やってみよう！'
], 1250);
}
if (cfg.firstStrike === 'enemy') {
log('わるびーの先手！　からくり人形の腕がうなった！');
await wait(900);
await enemyAttack(B.enemies[0]);
if (await checkLose(resolve)) return;
} else if (cfg.firstStrike === 'player') {
log('わるびーが様子を見ている……先手が取れる！');
await wait(800);
}
B.busy = false;
setCmds(true); renderStatus();
B._resolve = resolve;
});
}

async function checkLose(resolve) {
if (B.state.hp > 0) return false;
if (B.state.guts >= 100) {
B.state.hp = 1; B.state.guts = 0; B.state.stats.gutsSaves++;
Engine.Snd.win();
log('強がりゲージ全開！　あおびーは歯を食いしばって踏みとどまった！（HP1）');
await wait(1300); renderStatus();
return false;
}
B.state.hp = 0; renderStatus();
await logSeq(['あおびーは たおれた……'], 1100);
end('lose', resolve || B._resolve);
return true;
}
function end(result, resolve) {
ui.classList.add('hidden');
document.getElementById('hud').classList.remove('hidden');
const r = resolve || (B && B._resolve);
B = null;
if (r) r(result);
}

async function enemyAttack(e) {
const s = B.state;
const dmg = rnd(Math.max(1, e.atk - 2), e.atk + 2);
s.hp -= dmg; s.guts = Math.min(100, s.guts + 34);
Engine.Snd.hurt();
log(`${e.name} のこうげき！　あおびーに ${dmg} のダメージ！`);
renderStatus();
await wait(950);
}

async function enemyTurn(resolve) {
for (const e of B.enemies) {
if (e.hp <= 0 ||!B) continue;
await enemyAttack(e);
if (await checkLose(resolve)) return false;
}
if (!B) return false;
// ボス: 3ターンごとに歯車付け替え（弱点切替）
const boss = B.enemies.find(e => e.kind === 'boss');
if (boss && boss.hp > 0) {
B.round++;
if (B.round % 3 === 0) {
boss.weakMode = boss.weakMode === 'gear'? 'normal': 'gear';
Engine.Snd.gear();
log(`わるびーが歯車を付け替えた！　弱点が「${boss.weakMode === 'gear'? '歯車スキル': '通常こうげき'}」に変わった！`);
refreshEnemyHP();
await wait(1150);
}
// HP半分イベント
if (!B.midDone && boss.hp <= boss.maxHp / 2 && B.cfg.onMid) {
B.midDone = true;
setCmds(false);
await B.cfg.onMid();
renderStatus();
}
}
return true;
}

async function playerCmd(cmd) {
if (!B || B.busy) return;
const s = B.state, resolve = B._resolve;
B.busy = true; setCmds(false);
const target = B.enemies.find(e => e.hp > 0);
if (cmd === 'charge') {
if (B.charged) { log('もう歯車は溜まっている！　「こうげき」で放とう。'); B.busy = false; setCmds(true); return;}
B.charged = true; Engine.Snd.gear();
log('あおびーは歯車を巻き上げた……次のこうげきが強くなる！');
renderStatus(); await wait(950);
} else if (cmd === 'herb') {
if (s.herbs <= 0) { B.busy = false; setCmds(true); return;}
s.herbs--; const heal = Math.min(20, s.maxHp - s.hp); s.hp += heal;
Engine.Snd.pickup();
log(`ほし草を使った。HPが ${heal} 回復！`);
renderStatus(); await wait(950);
} else { // attack
const type = B.charged? 'gear': 'normal';
let dmg = B.charged? rnd(16, 22): rnd(7, 10);
let note = '';
if (target.kind === 'boss') {
if (target.weakMode === type) { dmg = Math.round(dmg * 1.8); note = '　弱点を突いた！';}
else dmg = Math.round(dmg * 0.9);
}
if (B.charged) note += '　歯車が1つ外れた！';
B.charged = false;
target.hp -= dmg;
Engine.Snd.hit();
if (target._el) { target._el.classList.remove('hit'); void target._el.offsetWidth; target._el.classList.add('hit');}
log(`あおびーの${type === 'gear'? '歯車アタック': 'こうげき'}！　${target.name} に ${dmg} のダメージ！${note}`);
refreshEnemyHP(); renderStatus();
await wait(1000);
if (B.enemies.every(e => e.hp <= 0)) {
Engine.Snd.win();
log(`${target.name} を たおした！`);
await wait(1100);
end('win', resolve);
return;
}
}
const cont = await enemyTurn(resolve);
if (!B) return;
if (cont) { B.busy = false; setCmds(true); renderStatus();}
}

cmdsEl.addEventListener('click', (e) => {
const b = e.target.closest('button');
if (b &&!b.disabled) playerCmd(b.dataset.cmd);
});
window.addEventListener('keydown', (e) => {
if (!B || B.busy ||!B._resolve) return;
if (e.key === '1') playerCmd('attack');
if (e.key === '2') playerCmd('charge');
if (e.key === '3') playerCmd('herb');
});

return { start, get active() { return!!B;}};
})();
if (typeof module!== 'undefined' && module.exports) module.exports = Battle;
