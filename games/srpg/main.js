"use strict";
/* あおびー大戦 序盤縦切り: 画面遷移と入力の glue */
const E = window.SRPGEngine;
let DATA = null, run = null, st = null, stageIdx = 0;
let sel = null; // {unit, mode, preMove, weaponIdx, hoshiCmd}
let busy = false;
const settings = { anim: localStorage.getItem("aobee-taisen-anim") !== "off" };
const $ = id => document.getElementById(id);
const panel = new Panel($("panel"));
const grid = new GridMap($("grid"), onTapCell);

async function boot() {
  const [pilots, units, stages] = await Promise.all([
    fetch("data/pilots.json").then(r => r.json()),
    fetch("data/units.json").then(r => r.json()),
    fetch("data/stages.json").then(r => r.json())
  ]);
  DATA = { pilots, units, stages };
  refreshTitle();
}
function refreshTitle() {
  const saved = E.loadRun(localStorage, DATA);
  $("btn-continue").disabled = !saved;
  $("btn-anim").textContent = "戦闘アニメ（横画面）: " + (settings.anim ? "ON" : "OFF");
  const ss = $("stage-select");
  if (saved && saved.cleared > 0) {
    ss.classList.remove("hidden"); ss.innerHTML = "";
    const label = document.createElement("div");
    label.style.cssText = "color:#94a3b8;font-size:12px;margin-top:6px";
    label.textContent = "面を選んで始める（育成は引き継ぎます）";
    ss.appendChild(label);
    for (let i = 0; i <= Math.min(saved.cleared, DATA.stages.stages.length - 1); i++) {
      const b = document.createElement("button"); b.className = "sub";
      b.textContent = "第" + (i + 1) + "面 " + DATA.stages.stages[i].title;
      b.style.marginTop = "6px";
      b.addEventListener("click", () => { run = saved; startStage(i); });
      ss.appendChild(b);
    }
  } else ss.classList.add("hidden");
}
$("btn-new").addEventListener("click", () => { run = E.createRun(DATA); startStage(0); });
$("btn-continue").addEventListener("click", () => {
  const saved = E.loadRun(localStorage, DATA);
  if (saved) { run = saved; startStage(Math.min(saved.cleared, DATA.stages.stages.length - 1)); }
});
$("btn-anim").addEventListener("click", () => {
  settings.anim = !settings.anim;
  localStorage.setItem("aobee-taisen-anim", settings.anim ? "on" : "off");
  refreshTitle();
});
$("btn-title").addEventListener("click", () => {
  if (run) E.saveRun(localStorage, run);
  $("app").classList.add("hidden"); $("title-screen").classList.remove("hidden"); refreshTitle();
});
$("btn-phase").addEventListener("click", () => { if (!busy && st && !st.result) enemyTurn(); });

function isLandscape() { return window.innerWidth > window.innerHeight; }
function setOrientation() { document.body.classList.toggle("landscape", isLandscape()); }
window.addEventListener("resize", setOrientation);

async function startStage(idx) {
  stageIdx = idx; sel = null;
  st = E.startStage(DATA, run, idx);
  $("title-screen").classList.add("hidden"); $("app").classList.remove("hidden");
  setOrientation();
  E.saveRun(localStorage, run);
  render();
  if (st.stage.intro) await showDialog(st.stage.intro);
  render();
}
function objectiveText() {
  let t = st.stage.winType === "boss" ? "目的: ボスの撃破" : "目的: 敵の全滅";
  if (st.stage.loseNpc) t += "／動物を守る";
  if (st.stage.turnLimit) t += "／" + st.stage.turnLimit + "ターン以内";
  if (st.stage.fog) t += "／霧: 灯りの近く以外は命中-30";
  if (st.rustStorm) t += "／錆嵐: 敵攻撃+10%";
  return t;
}
function render() {
  if (!st) return;
  $("hd-stage").textContent = "第" + st.stage.id + "面 " + st.stage.title;
  $("hd-turn").textContent = "TURN " + st.turn;
  $("hd-obj").textContent = objectiveText();
  $("hd-funds").textContent = "歯車コイン " + run.funds;
  let moveTiles = [], attackTiles = [];
  if (sel && sel.mode === "select") moveTiles = E.computeMoveRange(st, sel.unit);
  if (sel && sel.mode === "target") attackTiles = targetTiles();
  if (sel && sel.mode === "healTarget") attackTiles = healTargetTiles();
  if (sel && sel.mode === "hoshiTarget") attackTiles = E.living(st, "ally").map(u => ({ x: u.x, y: u.y }));
  grid.setHighlights(moveTiles, attackTiles);
  grid.render(st);
  renderPanel();
}
function targetTiles() {
  const u = sel.unit, w = u.weapons[sel.weaponIdx];
  return E.living(st, "enemy").filter(e => { const d = E.dist(u, e); return d >= w.min && d <= w.max; }).map(e => ({ x: e.x, y: e.y }));
}
function healWeapons(u) { return u.weapons.map((w, i) => ({ w, i })).filter(x => x.w.heal); }
function healTargetTiles() {
  const u = sel.unit, w = u.weapons[sel.weaponIdx];
  return E.living(st, "ally").filter(a => { const d = E.dist(u, a); return d >= w.min && d <= w.max; }).map(a => ({ x: a.x, y: a.y }));
}
function attackWeaponsVsAny(u) {
  return u.weapons.map((w, i) => ({ w, i })).filter(x => !x.w.heal && u.en >= (x.w.en || 0) && u.morale >= (x.w.morale || 0) &&
    E.living(st, "enemy").some(e => { const d = E.dist(u, e); return d >= x.w.min && d <= x.w.max; }));
}
function renderPanel() {
  if (st.result) return renderResultPanel();
  if (!sel) {
    panel.show("<h3>味方フェイズ (TURN " + st.turn + ")</h3><div class='stat'>味方ユニットをタップして選択。移動→武器→予測→攻撃の順に進みます。ほしコマンドはSPを消費します。</div>");
    return;
  }
  const u = sel.unit;
  let html = panel.unitCard(u);
  if (sel.mode === "select") {
    html += "<div class='stat'>青いマスをタップで移動。その場に留まる場合は自分のマスをタップ。</div>";
    panel.show(html);
    addHoshiButtons(u, "select");
    panel.buttons([{ label: "待機する", onClick: () => endUnitAction() }]);
  } else if (sel.mode === "moved") {
    panel.show(html + "<div class='stat'>コマンドを選んでください。</div>");
    const items = [];
    if (attackWeaponsVsAny(u).length) items.push({ label: "攻撃", cls: "primary", onClick: () => { sel.mode = "weapon"; render(); } });
    if (healWeapons(u).length && healTargetTilesFor(u).length) items.push({ label: "回復・修理", onClick: () => { sel.mode = "healWeapon"; render(); } });
    items.push({ label: "移動をキャンセル", onClick: cancelMove });
    items.push({ label: "待機する", onClick: () => endUnitAction() });
    panel.buttons(items);
    addHoshiButtons(u, "moved");
  } else if (sel.mode === "weapon") {
    panel.show(html + "<div class='stat'>武器を選んでください。</div>");
    panel.buttons(attackWeaponsVsAny(u).map(x => ({
      label: x.w.name + " (威力" + x.w.power + " 命中" + x.w.hit + " 射程" + x.w.min + "-" + x.w.max + (x.w.en ? " EN" + x.w.en : "") + ")",
      onClick: () => { sel.weaponIdx = x.i; sel.mode = "target"; render(); }
    })).concat([{ label: "もどる", onClick: () => { sel.mode = "moved"; render(); } }]));
  } else if (sel.mode === "target") {
    panel.show(html + "<div class='stat'>赤いマスの敵をタップすると戦闘予測が出ます。</div>");
    panel.buttons([{ label: "もどる", onClick: () => { sel.mode = "weapon"; render(); } }]);
  } else if (sel.mode === "forecast") {
    const f = sel.forecast, d = sel.target;
    let tbl = "<h3>戦闘予測</h3><table><tr><th></th><th>" + u.name + "</th><th>" + d.name + "</th></tr>" +
      "<tr><td>武器</td><td>" + f.weapon.name + "</td><td>" + (f.counter ? f.counter.weapon.name : "―") + "</td></tr>" +
      "<tr><td>ダメージ</td><td>" + f.dmg + "</td><td>" + (f.counter ? f.counter.dmg : "―") + "</td></tr>" +
      "<tr><td>命中</td><td>" + f.hit + "%</td><td>" + (f.counter ? f.counter.hit + "%" : "―") + "</td></tr></table>" +
      "<div class='stat'>敵の対応: " + ({ counter: "反撃", defend: "防御（ダメージ半減）", evade: "回避（命中-30）" })[f.stance] + " ／ 撃墜で歯車コイン+" + Math.round(d.maxHp / 8) + "</div>";
    panel.show(tbl);
    panel.buttons([
      { label: "たたかう", cls: "primary", onClick: doPlayerAttack },
      { label: "もどる", onClick: () => { sel.mode = "target"; render(); } }
    ]);
  } else if (sel.mode === "healWeapon") {
    panel.show(html + "<div class='stat'>回復・修理の方法を選んでください。</div>");
    panel.buttons(healWeapons(u).map(x => ({
      label: x.w.name + " (回復" + x.w.power + " 射程" + x.w.min + "-" + x.w.max + ")",
      onClick: () => { sel.weaponIdx = x.i; sel.mode = "healTarget"; render(); }
    })).concat([{ label: "もどる", onClick: () => { sel.mode = "moved"; render(); } }]));
  } else if (sel.mode === "healTarget") {
    panel.show(html + "<div class='stat'>赤いマスの味方をタップで回復・修理します。</div>");
    panel.buttons([{ label: "もどる", onClick: () => { sel.mode = "healWeapon"; render(); } }]);
  } else if (sel.mode === "hoshiTarget") {
    panel.show(html + "<div class='stat'>対象の味方をタップしてください。</div>");
    panel.buttons([{ label: "やめる", onClick: () => { sel.mode = sel.prevMode; render(); } }]);
  }
}
function healTargetTilesFor(u) {
  return healWeapons(u).flatMap(x => {
    const w = x.w;
    return E.living(st, "ally").filter(a => { const d = E.dist(u, a); return d >= w.min && d <= w.max; });
  });
}
function addHoshiButtons(u, mode) {
  const cmds = (run.hoshiLearned[u.pilotId] || []).map(id => ({ id, m: DATA.pilots.hoshiCommands[id] })).filter(x => x.m);
  if (!cmds.length) return;
  panel.buttons(cmds.map(x => ({
    label: "ほし: " + x.m.name + " (SP" + x.m.sp + ") " + x.m.desc,
    disabled: u.sp < x.m.sp,
    onClick: () => {
      if (x.id === "ouen" || x.id === "gekirei") { sel.hoshiCmd = x.id; sel.prevMode = mode; sel.mode = "hoshiTarget"; render(); }
      else { E.applyHoshi(st, u, x.id, u); render(); }
    }
  })));
}
function onTapCell(x, y) {
  if (busy || !st || st.result || st.phase !== "player") return;
  const tapped = E.unitAt(st, x, y);
  if (!sel) {
    if (tapped && tapped.side === "ally" && !tapped.acted) {
      sel = { unit: tapped, mode: "select", preMove: { x: tapped.x, y: tapped.y } };
      render();
    } else if (tapped) {
      panel.show(panel.unitCard(tapped) + "<div class='stat'>" + (tapped.side === "enemy" ? "敵ユニット" : tapped.side === "npc" ? "守る対象" : "行動済み") + "</div>");
    }
    return;
  }
  const u = sel.unit;
  if (sel.mode === "select") {
    const tiles = E.computeMoveRange(st, u);
    if (tiles.some(t => t.x === x && t.y === y)) {
      u.x = x; u.y = y; sel.mode = "moved"; render();
    } else if (tapped && tapped.side === "ally" && tapped !== u && !tapped.acted) {
      sel = { unit: tapped, mode: "select", preMove: { x: tapped.x, y: tapped.y } }; render();
    }
    return;
  }
  if (sel.mode === "target") {
    if (tapped && tapped.side === "enemy" && targetTiles().some(t => t.x === x && t.y === y)) {
      sel.target = tapped; sel.forecast = E.forecast(st, u, tapped, sel.weaponIdx); sel.mode = "forecast"; render();
    }
    return;
  }
  if (sel.mode === "healTarget") {
    if (tapped && tapped.side === "ally" && healTargetTiles().some(t => t.x === x && t.y === y)) doHeal(tapped);
    return;
  }
  if (sel.mode === "hoshiTarget") {
    if (tapped && tapped.side === "ally") {
      E.applyHoshi(st, u, sel.hoshiCmd, tapped);
      sel.mode = sel.prevMode; render();
    }
    return;
  }
}
function cancelMove() {
  sel.unit.x = sel.preMove.x; sel.unit.y = sel.preMove.y;
  sel.mode = "select"; render();
}
function endUnitAction() {
  sel.unit.acted = true; sel = null; render(); checkEnd();
}
async function doPlayerAttack() {
  busy = true;
  const u = sel.unit, d = sel.target;
  const events = E.resolveCombat(st, u, d, sel.weaponIdx, Math.random);
  const useScene = isLandscape() && settings.anim;
  if (useScene) await BattleView.playScene(u, d, events);
  else await BattleView.playSimplified($("grid"), st, events);
  sel = null; u.acted = true; busy = false;
  render();
  await afterAction();
}
async function doHeal(target) {
  busy = true;
  const u = sel.unit;
  const events = E.healAction(st, u, target, sel.weaponIdx, Math.random);
  await BattleView.playSimplified($("grid"), st, events);
  sel = null; u.acted = true; busy = false;
  render();
  await afterAction();
}
async function afterAction() {
  if (st.pendingDialog) { const d = st.pendingDialog; st.pendingDialog = null; await showDialog(d); }
  checkEnd(); render();
}
function checkEnd() { /* 結果は renderResultPanel が st.result を見て表示する */ }
async function enemyTurn() {
  busy = true; sel = null;
  st.phase = "enemy"; render();
  const events = E.enemyPhase(st, Math.random);
  await BattleView.playSimplified($("grid"), st, events);
  if (st.pendingDialog) { const d = st.pendingDialog; st.pendingDialog = null; await showDialog(d); }
  if (!st.result) {
    E.npcPhase(st, Math.random);
    E.startPlayerPhase(st);
    if (st.pendingDialog) { const d = st.pendingDialog; st.pendingDialog = null; render(); await showDialog(d); }
  }
  busy = false;
  render();
  if (st.result) await handleResult();
}
function renderResultPanel() {
  if (st.result === "win") {
    run.cleared = Math.max(run.cleared, stageIdx + 1);
    E.saveRun(localStorage, run);
    panel.show("<h3>面クリア！</h3><div class='stat'>" + st.turn + "ターンでクリア" +
      (st.medal ? " ／ ほし勲章 獲得！" : "（ほし勲章は" + st.stage.medalTurns + "ターン以内）") +
      "<br>歯車コイン: " + run.funds + "</div>");
    const items = [];
    if (stageIdx + 1 < DATA.stages.stages.length) items.push({ label: "次の面へ", cls: "primary", onClick: () => startStage(stageIdx + 1) });
    items.push({ label: "タイトルへ", onClick: () => $("btn-title").click() });
    panel.buttons(items);
    if (!st._clearShown) { st._clearShown = true; if (st.stage.clear) showDialog(st.stage.clear); }
  } else {
    E.saveRun(localStorage, run);
    panel.show("<h3>敗北…</h3><div class='stat'>" + (st.loseReason || "") + "<br>獲得した経験値と歯車コインは引き継がれます。育成して再挑戦できます。</div>");
    panel.buttons([
      { label: "リトライ（育成引継ぎ）", cls: "primary", onClick: () => startStage(stageIdx) },
      { label: "タイトルへ", onClick: () => $("btn-title").click() }
    ]);
  }
}
async function handleResult() { render(); }
boot();
