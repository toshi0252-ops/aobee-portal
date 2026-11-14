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
`あおびー Lv${s.level || 1}<br>HP ${Math.max(0, s.hp)}/${s.maxHp}<div class="bar hp"><div style="width:${Math.max(0, s.hp) / s.maxHp * 100}%"></div></div>` +
`強がり<div class="bar guts"><div style="width:${s.guts}%"></div></div>` +
(B.charged? '<span style="color:#ffd94d;font-weight:700">⚙ 歯車チャージ完了！</span>': '');
document.getElementById('herb-count').textContent = s.herbs;
// ログ帯の下端をステータス窓の実高さに合わせて動的に逃がす（窓の高さはLv表示やチャージ表示で変わり、固定値だとヒント等の文章が窓と重なるため）
logEl.style.bottom = (statusEl.offsetHeight + 20) + 'px';
const ab = cmdButtons().find(b => b.dataset && b.dataset.cmd === 'attack');
const lbl = ab && ab.children ? [...ab.children].find(c => c.className === 'cmd-label') : null;
if (lbl) lbl.textContent = B.charged ? '歯車アタック！' : 'こうげき';
}
/* 敵イラスト素材（高さpx・影幅px）。読込失敗時はコード描画にフォールバック */
const ENEMY_ART = {
cog: { src: 'assets/chars/enemy-cog.png', h: 150, shadow: 110 },
millCog: { src: 'assets/chars/enemy-guardian.png', h: 190, shadow: 130 },
karakuri: { src: 'assets/chars/enemy-karakuri.png', h: 210, shadow: 120 },
kuwa: { src: 'assets/chars/enemy-kuwa.png', h: 150, shadow: 110 },
moguru: { src: 'assets/chars/enemy-moguru.png', h: 215, shadow: 160 }
};
function cogFallback(art) {
const c = document.createElement('canvas'); c.width = art.h; c.height = art.h;
Engine.drawCog(c.getContext('2d'), art.h / 2, art.h / 2, art.h * 0.92);
return c;
}
function karakuriFallback() {
const c = document.createElement('canvas'); c.width = 170; c.height = 220;
Engine.drawKarakuri(c.getContext('2d'), 85, 112, 195);
return c;
}
function enemyVisual(e) {
const visual = document.createElement('div'); visual.className = 'enemy-visual';
const bob = document.createElement('div'); bob.className = 'enemy-bob';
let shadowW;
if (e.kind === 'boss') {
// からくり人形（イラスト）の隣にわるびー公式絵を並べ、2体に見せる（HPは単一のまま）
bob.style.display = 'flex'; bob.style.alignItems = 'flex-end'; bob.style.gap = '4px';
const art = ENEMY_ART.karakuri;
const kimg = document.createElement('img');
kimg.src = art.src; kimg.alt = 'からくり人形'; kimg.style.height = '100%';
kimg.onerror = () => { kimg.replaceWith(karakuriFallback()); };
const wimg = document.createElement('img');
wimg.src = 'assets/warubee-front-v1.png'; wimg.alt = 'わるびー'; wimg.style.height = '82%';
wimg.onerror = () => { wimg.style.display = 'none'; };
bob.appendChild(kimg); bob.appendChild(wimg);
shadowW = 250;
} else {
const art = ENEMY_ART[e.id] || ENEMY_ART.cog;
const img = document.createElement('img');
img.src = art.src; img.alt = e.name; img.style.height = '100%';
img.onerror = () => { img.replaceWith(cogFallback(art)); };
bob.appendChild(img);
shadowW = art.shadow;
}
visual.appendChild(bob);
const sh = document.createElement('div'); sh.className = 'enemy-shadow'; sh.style.width = shadowW + 'px';
visual.appendChild(sh);
return visual;
}
function renderEnemy() {
enemyArea.innerHTML = '';
B.enemies.forEach((e, i) => {
const d = document.createElement('div');
d.className = 'enemy'; d.id = 'enemy-' + i;
d.style.left = (50 + (i - (B.enemies.length - 1) / 2) * 34) + '%';
const plate = document.createElement('div'); plate.className = 'eplate';
const nm = document.createElement('div'); nm.className = 'ename';
nm.textContent = e.name + (e.gears? `（歯車 あと${e.gearLeft}）`: (e.kind === 'boss'? `（弱点：${e.weakMode === 'gear'? '歯車スキル': '通常こうげき'}）`: ''));
const hp = document.createElement('div'); hp.className = 'ehp';
const fill = document.createElement('div'); fill.style.width = (e.gears? (e.gearLeft / e.gears * 100): (Math.max(0, e.hp) / e.maxHp * 100)) + '%';
hp.appendChild(fill); plate.appendChild(nm); plate.appendChild(hp);
d.appendChild(plate);
d.appendChild(enemyVisual(e));
d._fill = fill; d._nm = nm;
enemyArea.appendChild(d);
e._el = d;
});
}
function refreshEnemyHP() {
B.enemies.forEach(e => {
if (e._el) {
e._el._fill.style.width = (e.gears? (e.gearLeft / e.gears * 100): (Math.max(0, e.hp) / e.maxHp * 100)) + '%';
if (e.gears) e._el._nm.textContent = e.name + `（歯車 あと${e.gearLeft}）`;
else if (e.kind === 'boss') e._el._nm.textContent = e.name + `（弱点：${e.weakMode === 'gear'? '歯車スキル': '通常こうげき'}）`;
if (e.gears? e.gearLeft <= 0: e.hp <= 0) e._el.style.opacity = '0.25';
}
});
}
let cmdSel = 0;
function cmdButtons() { return [...cmdsEl.querySelectorAll('button')]; }
function paintSel() {
cmdButtons().forEach((b, i) => b.classList.toggle('sel', i === cmdSel && !cmdsEl.classList.contains('hidden')));
}
function setCmds(on) {
cmdsEl.classList.toggle('hidden',!on);
logEl.style.right = on ? '49%' : '2.5%';
cmdButtons().forEach(b => {
b.disabled =!on || (b.dataset.cmd === 'herb' && B.state.herbs <= 0);
});
if (on) {
const btns = cmdButtons();
if (cmdSel >= btns.length) cmdSel = 0;
if (btns[cmdSel] && btns[cmdSel].disabled) { const f = btns.findIndex(b => !b.disabled); if (f >= 0) cmdSel = f; }
}
paintSel();
}

async function start(cfg) {
return new Promise(async (resolve) => {
const state = cfg.state;
B = {
state, cfg, charged: false, round: 0, busy: true, midDone: false,
enemies: cfg.enemies.map(e => ({...e, hp: e.maxHp, weakMode: e.weakMode || 'normal', gearLeft: e.gears || 0}))
};
ui.classList.remove('hidden');
document.getElementById('hud').classList.add('hidden');
Engine.Snd.bgm(cfg.enemies.some(e => e.kind === 'boss' || e.kind === 'moguru') ? 'boss' : 'battle');
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
if (cfg.hint) {
await logSeq(cfg.hint, 1250);
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
/* 勝利時の精算: 雑魚ドロップ（ほし草30%）＋経験値付与＋レベルアップ（最大HP+8/レベル・全回復） */
const EXP_THRESHOLDS = [0, 30, 75, 140, 230]; // 添字+1 = レベル（上限5）
async function settleVictory() {
const s = B.state;
const droppable = B.enemies.some(e => !e.gears && e.kind !== 'boss'); // ボス・歯車制ボスはドロップなし
if (droppable && Math.random() < 0.3) {
s.herbs++;
Engine.Snd.pickup();
log('たおした敵が ほし草を 落とした！（ほし草 +1）');
renderStatus();
await wait(900);
}
const gain = B.enemies.reduce((sum, e) => sum + (e.exp || 0), 0);
if (gain > 0 && typeof s.exp === 'number') {
s.exp += gain;
let lv = 1;
EXP_THRESHOLDS.forEach((t, i) => { if (s.exp >= t) lv = i + 1; });
if (lv > (s.level || 1)) {
s.level = lv;
s.maxHp = 40 + (lv - 1) * 8;
s.hp = s.maxHp;
Engine.Snd.win();
log(`あおびーは レベル${lv} に あがった！`);
renderStatus();
await wait(1300);
}
}
}
function end(result, resolve) {
Engine.Snd.bgm('field');
ui.classList.add('hidden');
document.getElementById('hud').classList.remove('hidden');
const r = resolve || (B && B._resolve);
B = null;
if (r) r(result);
}

async function enemyAttack(e, mult = 1) {
const s = B.state;
// モーぐるマシン: 歯車が外れるほど暴走が激しくなる（攻撃力 +1/個）
const atk = e.gears ? e.atk + (e.gears - e.gearLeft) * 1 : e.atk;
let dmg = rnd(Math.max(1, atk - 2), atk + 2);
if (mult !== 1) dmg = Math.max(1, Math.ceil(dmg * mult)); // 2回目の突進は倍率を掛ける（半分・切り上げ）
s.hp -= dmg; s.guts = Math.min(100, s.guts + 34);
Engine.Snd.hurt();
log(e.gears ? `${e.name} の突進！　あおびーに ${dmg} のダメージ！` : `${e.name} のこうげき！　あおびーに ${dmg} のダメージ！`);
renderStatus();
await wait(950);
}

async function enemyTurn(resolve) {
for (const e of B.enemies) {
if (e.hp <= 0 ||!B) continue;
await enemyAttack(e);
if (await checkLose(resolve)) return false;
// モーぐるマシン: 歯車が残り1つになると暴走が加速し、ときどき2回突進する（2回目は半ダメ）
if (e.gears && e.gearLeft === 1 && B && Math.random() < 0.25) {
log('暴走が加速した！　モーぐるマシンが もう一度突っ込んでくる！');
await wait(850);
await enemyAttack(e, 0.5);
if (await checkLose(resolve)) return false;
}
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
if (target.gears) {
// モーぐるマシン専用ルール: HPではなく「歯車を3つ外すと勝利」。通常攻撃は装甲に弾かれる
if (target._el) { target._el.classList.remove('hit'); void target._el.offsetWidth; target._el.classList.add('hit');}
if (type === 'gear') {
B.charged = false;
target.gearLeft--;
Engine.Snd.gear();
log(`あおびーの歯車アタック！　${target.name} の歯車が1つ外れた！（あと ${target.gearLeft}）`);
refreshEnemyHP(); renderStatus();
await wait(1100);
if (target.gearLeft <= 0) {
Engine.Snd.win();
log(`${target.name} は ぷしゅー…と煙を出して止まった！`);
await wait(1200);
await settleVictory();
end('win', resolve);
return;
}
} else {
Engine.Snd.hit();
log('あおびーのこうげき！　……装甲が硬い！　弾かれてしまった。（歯車チャージを溜めて当てれば、歯車を外せそうだ）');
refreshEnemyHP(); renderStatus();
await wait(1000);
}
} else {
const lvBonus = (s.level || 1) - 1; // レベル攻撃ボーナス: 通常 +(Lv-1)×2 / チャージ +(Lv-1)×3
let dmg = B.charged? rnd(16, 22) + lvBonus * 3: rnd(7, 10) + lvBonus * 2;
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
await settleVictory();
end('win', resolve);
return;
}
} // 通常敵の攻撃処理ここまで
}
const cont = await enemyTurn(resolve);
if (!B) return;
if (cont) { B.busy = false; setCmds(true); renderStatus();}
}

cmdsEl.addEventListener('click', (e) => {
const b = e.target.closest('button');
if (b &&!b.disabled) playerCmd(b.dataset.cmd);
});
function cmdsVisible() { return B && !B.busy && B._resolve && !cmdsEl.classList.contains('hidden'); }
function moveSel(d) {
const btns = cmdButtons();
let n = cmdSel;
for (let k = 0; k < btns.length; k++) { n = (n + d + btns.length) % btns.length; if (!btns[n].disabled) break; }
cmdSel = n; paintSel();
}
function activateSel() {
const b = cmdButtons()[cmdSel];
if (b && !b.disabled) playerCmd(b.dataset.cmd);
}
window.addEventListener('keydown', (e) => {
if (!B || B.busy ||!B._resolve) return;
if (e.key === '1') playerCmd('attack');
if (e.key === '2') playerCmd('charge');
if (e.key === '3') playerCmd('herb');
if (cmdsEl.classList.contains('hidden')) return;
if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 's' || e.key === 'w') {
moveSel((e.key === 'ArrowDown' || e.key === 's') ? 1 : -1); e.preventDefault();
} else if (e.key === 'z' || e.key === 'Enter' || e.key === ' ') {
activateSel(); e.preventDefault();
}
});
/* スマホの仮想コントローラでもコマンド選択できるようにする（十字キー上下＋Aボタン） */
document.querySelectorAll('#dpad .dbtn').forEach(b => {
b.addEventListener('pointerdown', () => {
if (!cmdsVisible()) return;
if (b.dataset.dir === 'down') moveSel(1);
else if (b.dataset.dir === 'up') moveSel(-1);
});
});
const touchA = document.getElementById('btn-a');
if (touchA) touchA.addEventListener('pointerdown', () => { if (cmdsVisible()) activateSel(); });

return { start, get active() { return!!B;}};
})();
if (typeof module!== 'undefined' && module.exports) module.exports = Battle;
