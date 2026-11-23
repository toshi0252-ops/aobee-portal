"use strict";
/* あおびー大戦 序盤縦切り: 画面遷移と入力の glue */
const E = window.SRPGEngine;
let DATA = null, run = null, st = null, stageIdx = 0;
let sel = null; // {unit, mode, preMove, weaponIdx, hoshiCmd}
let busy = false;
const settings = { anim: localStorage.getItem("aobee-taisen-anim") !== "off" };
const $ = id => document.getElementById(id);
/* 素材マップ: 会話顔グラと戦闘シーンのユニット絵（プレビュー単一ファイル版では __IMG のデータURIを優先） */
window.FACE_MAP = { aobee: "faces/aobee.jpg", warubee: "faces/warubee.jpg", galdo: "faces/galdo.jpg", marmi: "faces/marmi.jpg", poco: "faces/poco.jpg", minori: "faces/minori.jpg", mio: "faces/mio.jpg", ganzou: "chars/ganzou.jpg", seira: "chars/seira.jpg", mist: "chars/mist.jpg", tia: "chars/tia.jpg", rocco: "chars/rocco.jpg", granz: "chars/granz.jpg" };
window.UNIT_ART = { gearstar: "units/gearstar.png", galdon: "units/gardon.png", ovenmarmi: "units/oven-marmi.png", pocodash: "units/poco-dash.png", moomoo: "units/minori-unit.png", hoshifune: "units/mio-unit.png", cog: "units/sabi-cog.png", bannin: "units/bannin-cog.png", karakuri: "units/karakuri-boss.png" };
window.assetUrl = p => (window.__IMG && window.__IMG[p]) || ("assets/" + p);
window.TILE_ART = { ".": "tiles/plain.jpg", P: "tiles/path.jpg", G: "tiles/gear.jpg", F: "tiles/forest.jpg", V: "tiles/village.jpg", R: "tiles/river.jpg", W: "tiles/water.jpg", L: "tiles/lamp.jpg", X: "tiles/block.jpg" };
/* マップ駒専用アイコン（顔・上半身を大きく切り出した視認性重視版） */
window.UNIT_ICON = { gearstar: "icons/gearstar.png", galdon: "icons/gardon.png", ovenmarmi: "icons/oven-marmi.png", pocodash: "icons/poco-dash.png", moomoo: "icons/minori-unit.png", hoshifune: "icons/mio-unit.png", cog: "icons/sabi-cog.png", bannin: "icons/bannin-cog.png", karakuri: "icons/karakuri-boss.png" };
const panel = new Panel($("panel"));
const grid = new GridMap($("grid"), onTapCell);

async function boot() {
  const [pilots, units, stages, parts] = await Promise.all([
    fetch("data/pilots.json").then(r => r.json()),
    fetch("data/units.json").then(r => r.json()),
    fetch("data/stages.json").then(r => r.json()),
    fetch("data/parts.json").then(r => r.json())
  ]);
  DATA = { pilots, units, stages, parts };
  refreshTitle();
}
function refreshTitle() {
  if (!$("title-art")) {
    const img = document.createElement("img");
    img.id = "title-art"; img.alt = "";
    img.src = assetUrl("events/opening.jpg");
    img.style.cssText = "width:100%;max-width:560px;border-radius:12px;display:block;margin:0 auto 10px";
    const ts = $("title-screen"); ts.insertBefore(img, ts.firstChild);
  }
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
$("btn-panel").addEventListener("click", () => document.body.classList.toggle("panel-hidden"));
$("btn-title").addEventListener("click", () => {
  if (run) E.saveRun(localStorage, run);
  $("app").classList.add("hidden"); $("title-screen").classList.remove("hidden"); refreshTitle();
});
$("btn-phase").addEventListener("click", () => { if (!busy && st && !st.result) enemyTurn(); });

function isLandscape() { return window.innerWidth > window.innerHeight; }
function setOrientation() { document.body.classList.toggle("landscape", isLandscape()); }
window.addEventListener("resize", setOrientation);

/* イベント一枚絵を全画面で見せて、タップで進む */
let artShown = false;
function showEventArt(path, caption) {
  return new Promise(res => {
    const ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;background:#020617;z-index:70;display:flex;align-items:center;justify-content:center;cursor:pointer";
    ov.innerHTML = "<img src='" + assetUrl(path) + "' alt='' style='max-width:100%;max-height:100%;object-fit:contain'><div style='position:absolute;left:0;right:0;bottom:0;padding:26px 14px 10px;background:linear-gradient(transparent,rgba(2,6,23,.88));color:#e2e8f0'><div style='font-weight:700'>" + caption + "</div><div style='text-align:right;color:#94a3b8;font-size:11px'>タップで進む ▼</div></div>";
    ov.addEventListener("click", () => { document.body.removeChild(ov); res(); });
    document.body.appendChild(ov);
  });
}

async function startStage(idx) {
  stageIdx = idx; sel = null;
  st = E.startStage(DATA, run, idx);
  $("title-screen").classList.add("hidden"); $("app").classList.remove("hidden");
  setOrientation();
  E.saveRun(localStorage, run);
  render();
  if (idx === 0 && !artShown) { artShown = true; await showEventArt("events/opening.jpg", "第1面「" + st.stage.title + "」 ― 祭りの朝"); }
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
  maybeAutoEnemyPhase();
}
/* 全味方が行動済みなら、少し間を置いて自動で敵フェイズへ */
let autoPhasePending = false;
async function maybeAutoEnemyPhase() {
  if (autoPhasePending || busy || !st || st.result || st.phase !== "player") return;
  const allies = st.units.filter(u => u.side === "ally" && u.hp > 0);
  if (!allies.length || !allies.every(u => u.acted)) return;
  autoPhasePending = true;
  await new Promise(r => setTimeout(r, 550));
  autoPhasePending = false;
  if (!busy && st && !st.result && st.phase === "player") await enemyTurn();
}
async function doPlayerAttack() {
  busy = true;
  const u = sel.unit, d = sel.target;
  const events = E.resolveCombat(st, u, d, sel.weaponIdx, Math.random);
  const useScene = isLandscape() && settings.anim;
  if (useScene) await BattleView.playScene(u, d, events, sel.forecast);
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
  E.saveRun(localStorage, run); /* 育成・コインは行動ごとに自動セーブ（面の途中経過は除く） */
  await maybeAutoEnemyPhase();
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
  E.saveRun(localStorage, run); /* ターン境界でも自動セーブ */
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
    if (stageIdx + 1 < DATA.stages.stages.length) items.push({
      label: "次の面へ", cls: "primary", onClick: async () => {
        if (st.stage.after) await showDialog(st.stage.after); // 面間の物語
        openIntermission(stageIdx + 1);                        // 整備・改造・買い物
      }
    });
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

/* ===== インターミッション画面 ===== */
const MOD_LABEL = { hp: "HP", armor: "装甲", en: "EN", hit: "命中", power: "武器威力" };
let imNext = 0, imPilot = null;
function imPilots() {
  const seen = [];
  for (let i = 0; i <= imNext && i < DATA.stages.stages.length; i++)
    for (const a of DATA.stages.stages[i].allies) if (!seen.includes(a.pilot)) seen.push(a.pilot);
  return Object.keys(DATA.pilots.pilots).filter(pid => seen.includes(pid));
}
function openIntermission(nextIdx) {
  imNext = nextIdx;
  const list = imPilots();
  if (!imPilot || !list.includes(imPilot)) imPilot = list[0];
  renderIntermission();
  $("intermission").classList.remove("hidden");
}
function closeIntermission() { $("intermission").classList.add("hidden"); }
function stageMarks(lv) { return "■".repeat(lv) + "□".repeat(E.MOD_MAX - lv); }
function renderIntermission() {
  const pid = imPilot, p = DATA.pilots.pilots[pid], u = DATA.units.units[p.unit], g = run.pilots[pid];
  const b = E.calcBonuses(DATA, run, p.unit);
  const mods = run.mods[p.unit] || {};
  const stock = run.partStock || {};
  const face = window.FACE_MAP[pid];
  let h = "<div class='im-inner'>";
  h += "<div class='im-head'><h2>インターミッション</h2><div class='im-funds'>歯車コイン: " + run.funds + "</div></div><div class='stat' style='color:#94a3b8'>セーブは自動です（改造・購入・習得のたびに保存されます）。ボタンはありません。</div>";
  h += "<div class='im-topbtns'><button data-act='go' class='primary'>出撃（第" + DATA.stages.stages[imNext].id + "面「" + DATA.stages.stages[imNext].title + "」へ）</button><button data-act='title'>タイトルへ</button></div>";
  // ユニット選択タブ
  h += "<div class='im-tabs'>";
  for (const tp of imPilots()) {
    const tPilot = DATA.pilots.pilots[tp];
    const tFace = window.FACE_MAP[tp];
    h += "<button class='im-tab" + (tp === pid ? " active" : "") + "' data-act='tab' data-pilot='" + tp + "'>" +
      (tFace ? "<img src='" + assetUrl(tFace) + "' alt=''>" : "") + tPilot.name + "／" + DATA.units.units[tPilot.unit].name + "</button>";
  }
  h += "</div>";
  // 選択中ユニット概要
  h += "<div class='im-unit'>" + (face ? "<img class='im-face' src='" + assetUrl(face) + "' alt=''>" : "") +
    "<div><h3>" + p.name + "／" + u.name + " Lv" + g.level + "（EXP " + g.exp + "/100）</h3>" +
    "<div class='stat'>HP " + (u.hp + g.hp + b.hp) + " ／ EN " + (u.en + b.en) + " ／ 装甲 " + (u.armor + b.armor) +
    " ／ 命中 " + (p.aim + g.aim + b.hit) + " ／ 移動 " + (u.move + b.move) + " ／ 撃墜数 " + g.kills + "</div></div></div>";
  // 改造
  h += "<div class='im-sec'><h3>改造（最大" + E.MOD_MAX + "段階）</h3><table>";
  for (const t of E.MOD_TRACKS) {
    const lv = mods[t] || 0, maxed = lv >= E.MOD_MAX, cost = maxed ? null : E.modCost(t, lv);
    h += "<tr><td>" + MOD_LABEL[t] + "（+" + E.MOD_PER[t] + "/段階）</td><td class='im-marks'>" + stageMarks(lv) + "</td><td>" +
      (maxed ? "MAX" : cost + "コイン") + "</td><td>" +
      (maxed ? "" : "<button data-act='mod' data-track='" + t + "'" + (run.funds < cost ? " disabled" : "") + ">改造</button>") + "</td></tr>";
  }
  h += "</table></div>";
  // 強化パーツ: 装備枠
  h += "<div class='im-sec'><h3>強化パーツ（2枠）</h3><table>";
  for (let s = 0; s < 2; s++) {
    const cur = (run.parts[p.unit] || [])[s];
    const m = cur ? DATA.parts.parts[cur] : null;
    h += "<tr><td>枠" + (s + 1) + "</td><td>" + (m ? m.name + "（" + m.desc + "）" : "（空）") + "</td><td>" +
      (cur ? "<button data-act='unequip' data-slot='" + s + "'>外す</button>" : "") + "</td></tr>";
  }
  h += "</table>";
  // 在庫から装備
  const stocked = Object.keys(DATA.parts.parts).filter(id => (stock[id] || 0) > 0);
  if (stocked.length) {
    h += "<div class='stat'>在庫から装備:</div><table>";
    for (const id of stocked) {
      const m = DATA.parts.parts[id];
      h += "<tr><td>" + m.name + "（" + m.desc + "）×" + stock[id] + "</td><td><button data-act='equip' data-slot='0' data-part='" + id + "'>枠1に装備</button></td><td><button data-act='equip' data-slot='1' data-part='" + id + "'>枠2に装備</button></td></tr>";
    }
    h += "</table>";
  }
  h += "</div>";
  // ショップ
  h += "<div class='im-sec'><h3>パーツショップ</h3><table>";
  for (const id of Object.keys(DATA.parts.parts)) {
    const m = DATA.parts.parts[id];
    h += "<tr><td>" + m.name + "</td><td>" + m.desc + "</td><td>" + m.cost + "コイン</td><td>在庫 " + (stock[id] || 0) + "</td><td><button data-act='buy' data-part='" + id + "'" + (run.funds < m.cost ? " disabled" : "") + ">購入</button></td></tr>";
  }
  h += "</table></div>";
  // ほし習得
  const learned = run.hoshiLearned[pid] || [];
  h += "<div class='im-sec'><h3>ほしコマンド習得（" + p.name + "）</h3><table>";
  for (const cid of Object.keys(DATA.pilots.hoshiCommands)) {
    const m = DATA.pilots.hoshiCommands[cid];
    if (learned.includes(cid)) h += "<tr><td>" + m.name + "</td><td>SP" + m.sp + "</td><td>" + m.desc + "</td><td>習得済み</td></tr>";
    else h += "<tr><td>" + m.name + "</td><td>SP" + m.sp + "</td><td>" + m.desc + "</td><td>" + E.HOSHI_COST + "コイン</td><td><button data-act='learn' data-cmd='" + cid + "'" + (run.funds < E.HOSHI_COST ? " disabled" : "") + ">習得</button></td></tr>";
  }
  h += "</table></div>";
  h += "<div class='im-topbtns'><button data-act='go' class='primary'>出撃（第" + DATA.stages.stages[imNext].id + "面へ）</button><button data-act='title'>タイトルへ</button></div>";
  h += "</div>";
  const el = $("intermission");
  el.innerHTML = h;
  el.querySelectorAll("button[data-act]").forEach(btn => btn.addEventListener("click", () => imAction(btn.dataset)));
}
function imAction(d) {
  const uid = DATA.pilots.pilots[imPilot].unit;
  if (d.act === "go") { closeIntermission(); startStage(imNext); return; }
  if (d.act === "title") { closeIntermission(); $("btn-title").click(); return; }
  if (d.act === "tab") imPilot = d.pilot;
  else if (d.act === "mod") E.buyMod(run, uid, d.track);
  else if (d.act === "buy") E.buyPart(run, DATA, d.part);
  else if (d.act === "equip") E.equipPart(run, uid, Number(d.slot), d.part);
  else if (d.act === "unequip") E.unequipPart(run, uid, Number(d.slot));
  else if (d.act === "learn") E.learnHoshi(run, imPilot, d.cmd, DATA);
  E.saveRun(localStorage, run);
  renderIntermission();
}
boot();
