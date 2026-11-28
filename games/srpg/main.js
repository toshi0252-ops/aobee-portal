"use strict";
/* あおびー大戦 序盤縦切り: 画面遷移と入力の glue */
const E = window.SRPGEngine;
let DATA = null, run = null, st = null, stageIdx = 0;
let sel = null; // {unit, mode, preMove, weaponIdx, hoshiCmd}
let busy = false;
const settings = { anim: localStorage.getItem("aobee-taisen-anim") !== "off", sound: localStorage.getItem("aobee-taisen-sound") !== "off" };
window.SRPG_SFX_ON = settings.sound; // battle.js の効果音（爆発音）の ON/OFF
const $ = id => document.getElementById(id);
/* 中断セーブ（面の途中の戦況）の保存キー。run のセーブ（E.saveRun）とは別に持つ */
const BKEY = "aobee-srpg-battle-v1";
function saveAll() {
  if (run) E.saveRun(localStorage, run);
  if (st && !st.result) {
    try { localStorage.setItem(BKEY, JSON.stringify(E.serializeState(st))); } catch (e) { /* 保存失敗時は中断セーブなしで続行 */ }
  } else if (st) {
    localStorage.removeItem(BKEY); // 勝敗が確定した戦況は再開対象にしない
  }
}
function loadBattleSave() {
  if (!DATA) return null;
  try {
    const raw = localStorage.getItem(BKEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") return null;
    if (!Number.isInteger(s.stageIdx) || s.stageIdx < 0 || s.stageIdx >= DATA.stages.stages.length) return null;
    if (!Array.isArray(s.units) || !s.units.length) return null;
    if (!Number.isInteger(s.turn) || s.turn < 1) return null;
    return s;
  } catch (e) { return null; } // 壊れた保存内容では再開ボタンを出さない
}
/* 素材マップ: 会話顔グラと戦闘シーンのユニット絵（プレビュー単一ファイル版では __IMG のデータURIを優先） */
window.FACE_MAP = { aobee: "faces/aobee.jpg", warubee: "faces/warubee.jpg", galdo: "faces/galdo.jpg", marmi: "faces/marmi.jpg", poco: "faces/poco.jpg", minori: "faces/minori.jpg", mio: "faces/mio.jpg", teru: "faces/teru.jpg", hayate: "faces/hayate.jpg", tia: "faces/tia.jpg", seira: "faces/seira.jpg", rocco: "faces/rocco.jpg", mist: "faces/mist.jpg", ganzou: "chars/ganzou.jpg", granz: "chars/granz.jpg" };
window.UNIT_ART = { gearstar: "units/gearstar.png", galdon: "units/gardon.png", ovenmarmi: "units/oven-marmi.png", pocodash: "units/poco-dash.png", moomoo: "units/minori-unit.png", hoshifune: "units/mio-unit.png", telcarry: "units/teru-carry.png", hayatespin: "units/hayate-spin.png", tialaster: "units/tia-luster.png", seirabrig: "units/seira-brig.png", rocco: "units/rocco-works.png", roccoworks_ally: "units/rocco-works.png", mistral: "units/mistral.png", warugear: "units/warugia-custom.png", warugear_ally: "units/warugia-custom.png", cog: "units/sabi-cog.png", bannin: "units/bannin-cog.png", karakuri: "units/karakuri-boss.png", karakurishin: "units/karakuri-boss.png" , banninkai: "units/banninkai.png", bousouboss: "units/bousouboss.png", cogair: "units/cogair.png", cogsea: "units/cogsea.png", fogdevice: "units/fogdevice.png", fortress: "units/fortress.png", fuusha: "units/fuusha.png", ganzou: "units/ganzou.png", kaizokuboss: "units/kaizokuboss.png", kuutei: "units/kuutei.png", kuuteiboss: "units/kuuteiboss.png", kuzokuboss: "units/kuzokuboss.png", lastgear: "units/lastgear.png", sabicore: "units/sabicore.png", sajou: "units/sajou.png", sajouboss: "units/sajouboss.png", shuei: "units/shuei.png", shueiboss: "units/shueiboss.png", sniper: "units/sniper.png", toride: "units/toride.png", toubatsuboss: "units/toubatsuboss.png", yuragi: "units/yuragi.png", yuragiboss: "units/yuragiboss.png", sniperboss: "units/sniperboss.png", tsuigekiboss: "units/tsuigekiboss.png"};
window.assetUrl = p => (window.__IMG && window.__IMG[p]) || ("assets/" + p);
window.TILE_ART = { ".": "tiles/plain.jpg", P: "tiles/path.jpg", G: "tiles/gear.jpg", F: "tiles/forest.jpg", V: "tiles/village.jpg", R: "tiles/river.jpg", W: "tiles/water.jpg", L: "tiles/lamp.jpg", D: "tiles/block.jpg", X: "tiles/block.jpg" };
/* マップ駒専用アイコン（顔・上半身を大きく切り出した視認性重視版） */
window.UNIT_ICON = { gearstar: "icons/gearstar.png", galdon: "icons/gardon.png", ovenmarmi: "icons/oven-marmi.png", pocodash: "icons/poco-dash.png", moomoo: "icons/minori-unit.png", hoshifune: "icons/mio-unit.png", telcarry: "icons/teru-carry.png", hayatespin: "icons/hayate-spin.png", tialaster: "icons/tia-luster.png", seirabrig: "icons/seira-brig.png", rocco: "icons/rocco-works.png", roccoworks_ally: "icons/rocco-works.png", mistral: "icons/mistral.png", warugear: "icons/warugia-custom.png", warugear_ally: "icons/warugia-custom.png", cog: "icons/sabi-cog.png", bannin: "icons/bannin-cog.png", karakuri: "icons/karakuri-boss.png", karakurishin: "icons/karakuri-boss.png" , banninkai: "icons/banninkai.png", bousouboss: "icons/bousouboss.png", cogair: "icons/cogair.png", cogsea: "icons/cogsea.png", fogdevice: "icons/fogdevice.png", fortress: "icons/fortress.png", fuusha: "icons/fuusha.png", ganzou: "icons/ganzou.png", kaizokuboss: "icons/kaizokuboss.png", kuutei: "icons/kuutei.png", kuuteiboss: "icons/kuuteiboss.png", kuzokuboss: "icons/kuzokuboss.png", lastgear: "icons/lastgear.png", sabicore: "icons/sabicore.png", sajou: "icons/sajou.png", sajouboss: "icons/sajouboss.png", shuei: "icons/shuei.png", shueiboss: "icons/shueiboss.png", sniper: "icons/sniper.png", toride: "icons/toride.png", toubatsuboss: "icons/toubatsuboss.png", yuragi: "icons/yuragi.png", yuragiboss: "icons/yuragiboss.png", animal: "icons/animal.png", citizen: "icons/citizen.png", ship: "icons/ship.png", mistworker: "faces/mist.jpg", sniperboss: "icons/sniperboss.png", tsuigekiboss: "icons/tsuigekiboss.png"};
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
function fmtDate(ts) {
  const d = new Date(ts);
  const p = n => String(n).padStart(2, "0");
  return (d.getMonth() + 1) + "/" + d.getDate() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
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
  const bs = loadBattleSave();
  const rb = $("btn-resume");
  if (bs && saved) {
    rb.classList.remove("hidden");
    const bsStage = DATA.stages.stages[bs.stageIdx];
    rb.textContent = "つづきから（" + (bsStage.ex ? "EX面" : "第" + bsStage.id + "面") + " ターン" + bs.turn + "）";
  } else rb.classList.add("hidden");
  $("btn-anim").textContent = "戦闘アニメ（横画面）: " + (settings.anim ? "ON" : "OFF");
  $("btn-sound").textContent = "効果音: " + (settings.sound ? "ON" : "OFF");
  // 本編クリア済み表示（EX面の解放通知）
  let banner = $("clear-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "clear-banner";
    banner.style.cssText = "color:#fde68a;font-size:13px;font-weight:700";
    $("title-screen").insertBefore(banner, $("stage-select"));
  }
  const gameCleared = !!(saved && saved.gameCleared);
  banner.textContent = gameCleared ? "★ 本編クリア済み ★ 隠しEX面（後日談・全3面）が解放されています" : "";
  banner.classList.toggle("hidden", !gameCleared);
  // 手動セーブスロットからの再開（スロットがある時だけ出す）
  let slotBox = $("slot-loads");
  if (!slotBox) {
    slotBox = document.createElement("div");
    slotBox.id = "slot-loads";
    $("title-screen").insertBefore(slotBox, $("stage-select"));
  }
  slotBox.innerHTML = "";
  for (let slot = 1; slot <= E.SAVE_SLOTS; slot++) {
    const info = E.saveSlotInfo(localStorage, slot);
    if (!info) continue;
    const b = document.createElement("button");
    b.className = "sub";
    b.style.marginTop = "6px";
    b.textContent = "スロット" + slot + "からつづける（" + (info.gameCleared ? "本編クリア済み" : info.clearedCount + "面クリア") + (info.savedAt ? "／" + fmtDate(info.savedAt) : "") + "）";
    b.addEventListener("click", () => {
      const loaded = E.loadRunFromSlot(localStorage, DATA, slot);
      if (!loaded) { refreshTitle(); return; }
      run = loaded;
      E.saveRun(localStorage, run);
      localStorage.removeItem(BKEY);
      const path = E.stagePath(DATA, run);
      let idx = path.find(i => !(run.clearedStages || []).includes(i));
      if (idx === undefined) idx = path[path.length - 1];
      startStage(idx);
    });
    slotBox.appendChild(b);
  }
  const ss = $("stage-select");
  if (saved && saved.cleared > 0) {
    ss.classList.remove("hidden"); ss.innerHTML = "";
    const label = document.createElement("div");
    label.style.cssText = "color:#94a3b8;font-size:12px;margin-top:6px";
    label.textContent = "面を選んで始める（育成は引き継ぎます）";
    ss.appendChild(label);
    const unlockedSet = new Set([0, ...(saved.clearedStages || [])]);
    for (const i of (saved.clearedStages || [])) {
      const n = E.nextStageIndex(DATA, saved, i);
      if (n >= 0) unlockedSet.add(n);
      const s = DATA.stages.stages[i];
      if (s && s.nextByRoute) { unlockedSet.add(s.nextByRoute.A); unlockedSet.add(s.nextByRoute.B); }
    }
    if (saved.gameCleared) { // 本編クリアで EX 面（後日談・全EX面）を解放
      DATA.stages.stages.forEach((s, i) => { if (s.ex) unlockedSet.add(i); });
    }
    [...unlockedSet].sort((a, b) => a - b).forEach(i => {
      const s = DATA.stages.stages[i];
      if (!s) return;
      const b = document.createElement("button"); b.className = "sub";
      b.textContent = s.ex ? "EX面 " + s.title + "（後日談）" : "第" + s.id + "面 " + s.title + (s.route ? "（" + s.route + "ルート）" : "");
      b.style.marginTop = "6px";
      b.addEventListener("click", () => {
        run = saved;
        if (s.route && !run.route) { run.route = s.route; E.saveRun(localStorage, run); }
        startStage(i);
      });
      ss.appendChild(b);
    });
  } else ss.classList.add("hidden");
}
$("btn-new").addEventListener("click", () => { localStorage.removeItem(BKEY); run = E.createRun(DATA); startStage(0); });
$("btn-resume").addEventListener("click", () => {
  const savedRun = E.loadRun(localStorage, DATA);
  const bs = loadBattleSave();
  if (!savedRun || !bs) { refreshTitle(); return; }
  run = savedRun;
  st = E.restoreState(DATA, run, bs);
  stageIdx = st.stageIdx; sel = null; busy = false;
  $("title-screen").classList.add("hidden"); $("app").classList.remove("hidden");
  setOrientation();
  render(); // 再開直後は味方フェイズ（restoreState が phase を味方側に固定）
});
$("btn-continue").addEventListener("click", () => {
  const saved = E.loadRun(localStorage, DATA);
  if (saved) {
    run = saved;
    const path = E.stagePath(DATA, run);
    let idx = path.find(i => !(run.clearedStages || []).includes(i));
    if (idx === undefined) idx = path[path.length - 1];
    startStage(idx);
  }
});
$("btn-anim").addEventListener("click", () => {
  settings.anim = !settings.anim;
  localStorage.setItem("aobee-taisen-anim", settings.anim ? "on" : "off");
  refreshTitle();
});
$("btn-sound").addEventListener("click", () => {
  settings.sound = !settings.sound;
  localStorage.setItem("aobee-taisen-sound", settings.sound ? "on" : "off");
  window.SRPG_SFX_ON = settings.sound;
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

/* ===== 出撃メンバー選択（面開始前） =====
   既定選択は従来の allies どおり。固定メンバーは外せず、枠数を超えて選べない。
   選ばなかったメンバーはその面に出撃しない（配置は allies のスロット順に割り当てる）。 */
let deployIdx = 0, deploySel = new Set();
function startStage(idx) { openDeploy(idx); }
function openDeploy(idx) {
  const info = E.deployInfo(DATA, run, idx);
  // 全員出撃しかありえない面（第1面など）は選択画面を出さず、そのまま出撃する
  if (!info.needsChoice) { beginStage(idx, info.defaultSelection); return; }
  deployIdx = idx;
  deploySel = new Set(info.defaultSelection);
  renderDeploy();
  $("deploy").classList.remove("hidden");
}
function closeDeploy() { $("deploy").classList.add("hidden"); }
function renderDeploy() {
  const info = E.deployInfo(DATA, run, deployIdx);
  const stage = DATA.stages.stages[deployIdx];
  let h = "<div class='im-inner'>";
  h += "<div class='im-head'><h2>出撃メンバー選択</h2><div class='im-funds'>出撃枠 " + deploySel.size + " / " + info.limit + "</div></div>";
  h += "<div class='stat'>" + (stage.ex ? "EX面" : "第" + stage.id + "面") + "「" + stage.title + "」へ出撃するメンバーを選んでください。タップで選択／解除、固定メンバーは外せません。</div>";
  if (info.unavailable.length) {
    h += "<div class='stat' style='color:#fca5a5'>参加不可: " + info.unavailable.map(pid => DATA.pilots.pilots[pid].name + "（負傷療養中）").join("、") + "</div>";
  }
  h += "<div class='im-tabs'>";
  for (const pid of info.roster) {
    const p = DATA.pilots.pilots[pid], u = DATA.units.units[p.unit], g = run.pilots[pid];
    const face = window.FACE_MAP[pid];
    const fixed = info.fixed.includes(pid);
    const on = deploySel.has(pid);
    h += "<button class='im-tab" + (on ? " active" : "") + "' data-pilot='" + pid + "'" + (fixed ? " disabled" : "") + ">" +
      (face ? "<img src='" + assetUrl(face) + "' alt=''>" : "") + p.name + "／" + u.name + " Lv" + g.level + (fixed ? "（固定）" : "") + "</button>";
  }
  h += "</div>";
  h += "<div class='im-topbtns'><button data-act='go' class='primary'" + (deploySel.size === 0 ? " disabled" : "") + ">このメンバーで出撃</button><button data-act='cancel'>やめる</button></div>";
  h += "</div>";
  const el = $("deploy");
  el.innerHTML = h;
  el.querySelectorAll("button[data-pilot]").forEach(b => b.addEventListener("click", () => {
    const pid = b.dataset.pilot;
    if (info.fixed.includes(pid)) return;
    if (deploySel.has(pid)) deploySel.delete(pid);
    else { if (deploySel.size >= info.limit) return; deploySel.add(pid); }
    renderDeploy();
  }));
  el.querySelector("[data-act='go']").addEventListener("click", () => { closeDeploy(); beginStage(deployIdx, [...deploySel]); });
  el.querySelector("[data-act='cancel']").addEventListener("click", () => { closeDeploy(); $("btn-title").click(); });
}

async function beginStage(idx, selection) {
  stageIdx = idx; sel = null;
  st = E.startStage(DATA, run, idx, selection);
  $("title-screen").classList.add("hidden"); $("app").classList.remove("hidden");
  setOrientation();
  saveAll(); // 面開始時点の戦況も中断セーブに残す
  render();
  if (idx === 0 && !artShown) { artShown = true; await showEventArt("events/opening.jpg", "第1面「" + st.stage.title + "」 ― 祭りの朝"); }
  const introLines = E.stageIntroLines(st.stage, run); // 第14面はルート別台詞を差し込んだ実効行列
  if (introLines.length) await showDialog(introLines);
  await maybeForesightDialog(); // ティアの予見: 開始時点で既に致命的な危険があれば警告台詞
  render();
}
function objectiveText() {
  let t = st.stage.winType === "boss" ? "目的: ボスの撃破" : st.stage.winType === "bosses" ? "目的: ボス全員の撃破" : "目的: 敵の全滅";
  if (st.stage.coreChoice) { // 第24面: コア選択の状態に応じて目的を出し分ける
    const spec = st.stage.coreChoice;
    const trig = st.units.find(u => u.side === "enemy" && u.unitId === spec.triggerUnit);
    if (st.coreChoice === "stop") t = "目的: コアに隣接して制御の書き換え（作業 " + (st.sealProgress || 0) + "/" + (spec.sealTurns || 2) + "）";
    else if (st.coreChoice === "destroy") t = "目的: サビのコアを破壊する";
    else if (trig && trig.hp > 0) t = "目的: ラストギアを倒し、コアへの道を開く（コアはバリアで守られている）";
  }
  if (st.stage.gate) t += st.gateOpen ? "／砦の門は開いた" : "／砦の門は閉じている（ボスを倒すと開く）";
  if (st.stage.loseNpc) t += "／" + (st.stage.protectLabel || "動物") + "を守る";
  if (st.stage.turnLimit) t += "／" + st.stage.turnLimit + "ターン以内";
  if (st.fogActive) t += "／霧: 灯りの近く以外は命中-30";
  if (st.rustStorm) t += "／錆嵐: 敵攻撃+10%";
  return t;
}
function render() {
  if (!st) return;
  $("hd-stage").textContent = st.stage.ex ? "EX面 " + st.stage.title : "第" + st.stage.id + "面 " + st.stage.title;
  $("hd-turn").textContent = "TURN " + st.turn;
  $("hd-obj").textContent = objectiveText();
  $("hd-funds").textContent = "歯車コイン " + run.funds;
  let moveTiles = [], attackTiles = [];
  if (sel && sel.mode === "select") moveTiles = E.computeMoveRange(st, sel.unit);
  if (sel && sel.mode === "target") attackTiles = targetTiles();
  if (sel && sel.mode === "healTarget") attackTiles = healTargetTiles();
  if (sel && sel.mode === "hoshiTarget") attackTiles = E.living(st, "ally").map(u => ({ x: u.x, y: u.y }));
  // ティアの予見（味方フェイズ中だけ、次の敵フェイズの危険を先読みして警告を出す）
  st.foresight = (st.phase === "player" && !st.result) ? E.foreseeThreats(st) : null;
  grid.setHighlights(moveTiles, attackTiles);
  grid.render(st);
  renderPanel();
}
function targetTiles() {
  const u = sel.unit, w = u.weapons[sel.weaponIdx];
  return E.living(st, "enemy").filter(e => { const d = E.dist(u, e); return d >= w.min && d <= w.max; }).map(e => ({ x: e.x, y: e.y }));
}
function healWeapons(u) { return u.weapons.map((w, i) => ({ w, i })).filter(x => x.w.heal || x.w.supply); }
function healTargetTiles() {
  const u = sel.unit, w = u.weapons[sel.weaponIdx];
  return E.living(st, "ally").filter(a => { const d = E.dist(u, a); return d >= w.min && d <= w.max; }).map(a => ({ x: a.x, y: a.y }));
}
function attackWeaponsVsAny(u) {
  return u.weapons.map((w, i) => ({ w, i })).filter(x => !x.w.heal && !x.w.supply && u.en >= (x.w.en || 0) && u.morale >= (x.w.morale || 0) && E.comboPartnerOk(st, u, x.w) &&
    E.living(st, "enemy").some(e => { const d = E.dist(u, e); return d >= x.w.min && d <= x.w.max; }));
}
/* 武器が今使えない理由（武器リストで選択不可表示に添える）。使える場合は null */
function weaponBlockReason(u, w) {
  if (w.combo && !E.comboPartnerOk(st, u, w)) {
    const partner = DATA.units.units[w.combo.partner];
    return (partner ? partner.name : "相方") + "が近くにいないと使えない";
  }
  if (u.en < (w.en || 0)) return "EN不足";
  if (u.morale < (w.morale || 0)) return "気力不足（要" + w.morale + "）";
  if (!E.living(st, "enemy").some(e => { const d = E.dist(u, e); return d >= w.min && d <= w.max; })) return "射程内に敵がいない";
  return null;
}
function renderPanel() {
  if (st.result) return renderResultPanel();
  if (!sel) {
    let html = "<h3>味方フェイズ (TURN " + st.turn + ")</h3><div class='stat'>味方ユニットをタップして選択。移動→武器→予測→攻撃の順に進みます。ほしコマンドはSPを消費します。</div>";
    const fw = st.foresight ? Object.values(st.foresight) : [];
    if (fw.length) html += "<div class='stat' style='color:#fca5a5'>⚠ ティアの予見: " + fw.length + "人が次の敵フェイズで危険" + (fw.some(t => t.lethal) ? "（撃墜の恐れあり！）" : "") + "</div>";
    panel.show(html + "<div class='row'><button id='btn-suspend'>中断してタイトルへ</button></div>");
    $("btn-suspend").addEventListener("click", suspendToTitle);
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
    const supWs = healWeapons(u);
    if (supWs.length && healTargetTilesFor(u).length) {
      const supLabel = supWs.every(x => x.w.supply) ? "補給" : (supWs.some(x => x.w.supply) ? "回復・修理・補給" : "回復・修理");
      items.push({ label: supLabel, onClick: () => { sel.mode = "healWeapon"; render(); } });
    }
    items.push({ label: "移動をキャンセル", onClick: cancelMove });
    items.push({ label: "待機する", onClick: () => endUnitAction() });
    panel.buttons(items);
    addHoshiButtons(u, "moved");
  } else if (sel.mode === "weapon") {
    panel.show(html + "<div class='stat'>武器を選んでください。</div>");
    const items = u.weapons.map((w, i) => ({ w, i })).filter(x => !x.w.heal && !x.w.supply).map(x => {
      const reason = weaponBlockReason(u, x.w);
      return {
        label: x.w.name + " (威力" + x.w.power + " 命中" + x.w.hit + " 射程" + x.w.min + "-" + x.w.max + (x.w.en ? " EN" + x.w.en : "") + ")" + (reason ? " ※" + reason : ""),
        disabled: !!reason,
        onClick: () => { sel.weaponIdx = x.i; sel.mode = "target"; render(); }
      };
    });
    items.push({ label: "もどる", onClick: () => { sel.mode = "moved"; render(); } });
    panel.buttons(items);
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
    panel.show(html + "<div class='stat'>回復・修理・補給の方法を選んでください。</div>");
    panel.buttons(healWeapons(u).map(x => ({
      label: x.w.supply ? x.w.name + " (EN全回復 射程" + x.w.min + "-" + x.w.max + ")" : x.w.name + " (回復" + x.w.power + " 射程" + x.w.min + "-" + x.w.max + ")",
      onClick: () => { sel.weaponIdx = x.i; sel.mode = "healTarget"; render(); }
    })).concat([{ label: "もどる", onClick: () => { sel.mode = "moved"; render(); } }]));
  } else if (sel.mode === "healTarget") {
    const isSupply = !!(u.weapons[sel.weaponIdx] && u.weapons[sel.weaponIdx].supply);
    panel.show(html + "<div class='stat'>赤いマスの味方をタップで" + (isSupply ? "補給します（EN全回復）" : "回復・修理します") + "。</div>");
    panel.buttons([{ label: "もどる", onClick: () => { sel.mode = "healWeapon"; render(); } }]);
  } else if (sel.mode === "hoshiTarget") {
    panel.show(html + "<div class='stat'>対象の味方をタップしてください。</div>");
    panel.buttons([{ label: "やめる", onClick: () => { sel.mode = sel.prevMode; render(); } }]);
  }
}
/* 戦況を中断セーブしてタイトルへ戻る（run は継続状態のまま） */
function suspendToTitle() {
  if (!st || st.result) return;
  saveAll();
  sel = null;
  $("app").classList.add("hidden"); $("title-screen").classList.remove("hidden"); refreshTitle();
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
  saveAll(); /* 待機・ほし等の行動終了でも中断セーブを更新する */
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
  const w = u.weapons[sel.weaponIdx];
  const events = w.supply ? E.supplyAction(st, u, target, sel.weaponIdx, Math.random) : E.healAction(st, u, target, sel.weaponIdx, Math.random);
  await BattleView.playSimplified($("grid"), st, events);
  sel = null; u.acted = true; busy = false;
  render();
  await afterAction();
}
async function afterAction() {
  if (st.pendingDialog) { const d = st.pendingDialog; st.pendingDialog = null; await showDialog(d); }
  if (st.pendingChoice) await presentCoreChoice(); // 第24面: グランツ決着後のコア選択
  checkEnd(); render();
  saveAll(); /* 育成・コイン＋戦況を行動ごとに自動セーブ */
  await maybeAutoEnemyPhase();
}
/* 第24面: サビのコアへの選択肢オーバーレイ（ルート選択と同じ流儀）。
   台詞→選択→分岐台詞の順に見せ、選択は run.coreChoice に保存される */
async function presentCoreChoice() {
  const spec = st.stage.coreChoice;
  if (!spec || !st.pendingChoice) return;
  st.pendingChoice = null;
  if (spec.lines) await showDialog(spec.lines);
  const choice = await new Promise(resolve => {
    const ov = document.createElement("div");
    ov.className = "core-ov";
    ov.innerHTML = "<div class='core-card'>" +
      "<img class='core-img' src='" + assetUrl("events/core.jpg") + "' alt='サビのコア'>" +
      "<h2>サビのコアをどうする？</h2>" +
      "<p>止めるなら、制御を書き換える間コアに張り付く必要がある。壊すなら早いが、コアの防衛反応で守護機が集まってくる。</p>" +
      "<div class='core-btns'>" +
      "<button data-c='stop' class='core-btn stop'>止める（制御を書き換える）<small>コアに隣接して2ターン作業 ― 傷つけずに終わらせる</small></button>" +
      "<button data-c='destroy' class='core-btn destroy'>壊す（動力系を破壊する）<small>守護機の増援が来る ― 決着は早い</small></button>" +
      "</div></div>";
    ov.querySelectorAll("button[data-c]").forEach(b => b.addEventListener("click", () => { document.body.removeChild(ov); resolve(b.dataset.c); }));
    document.body.appendChild(ov);
  });
  E.applyCoreChoice(st, run, choice);
  if (st.pendingDialog) { const d = st.pendingDialog; st.pendingDialog = null; await showDialog(d); }
  E.saveRun(localStorage, run);
  render();
}
/* ティアの予見: 味方フェイズ開始時、撃墜の恐れがある味方がいればティアが台詞で警告する。
   危険（大ダメージ）止まりならマップ上の⚠バッジだけにし、台詞は致命的な時だけに絞る */
async function maybeForesightDialog() {
  if (!st || st.result) return;
  const fw = E.foreseeThreats(st);
  if (!fw) return;
  const names = Object.keys(fw).filter(k => fw[k].lethal)
    .map(k => { const u = st.units.find(u => String(u.uid) === k); return u ? u.name : null; })
    .filter(Boolean);
  if (!names.length) return;
  await showDialog([["tia", "待って…！ " + names.join("と") + "が危ない。このままだと、やられちゃう…！"]]);
}
function checkEnd() { /* 結果は renderResultPanel が st.result を見て表示する */ }
async function enemyTurn() {
  busy = true; sel = null;
  st.phase = "enemy"; render();
  const events = E.enemyPhase(st, Math.random);
  await BattleView.playSimplified($("grid"), st, events);
  if (st.pendingDialog) { const d = st.pendingDialog; st.pendingDialog = null; await showDialog(d); }
  if (st.pendingChoice) await presentCoreChoice();
  if (!st.result) {
    E.npcPhase(st, Math.random);
    E.startPlayerPhase(st);
    if (st.pendingDialog) { const d = st.pendingDialog; st.pendingDialog = null; render(); await showDialog(d); }
    if (!st.result && st.pendingChoice) await presentCoreChoice();
    if (!st.result) await maybeForesightDialog(); // ティアの予見: 致命的な危険がある時だけ台詞で警告
  }
  busy = false;
  render();
  saveAll(); /* ターン境界でも自動セーブ（戦況つき） */
  if (st.result) await handleResult();
}
function renderResultPanel() {
  if (st.result === "win") {
    E.applyStageClear(run, stageIdx, st.stage); // 第24面なら run.gameCleared が立ち EX が解放される
    E.saveRun(localStorage, run);
    panel.show("<h3>" + (st.stage.final ? "最終決戦クリア！" : st.stage.ex ? "EX面クリア！" : "面クリア！") + "</h3><div class='stat'>" + st.turn + "ターンでクリア" +
      (st.medal ? " ／ ほし勲章 獲得！" : "（ほし勲章は" + st.stage.medalTurns + "ターン以内）") +
      "<br>歯車コイン: " + run.funds + (st.stage.final ? "<br>★ 本編クリア！ タイトルで隠しEX面（後日談・全3面）が解放されました" : "") + "</div>");
    const items = [];
    if (E.nextStageIndex(DATA, run, stageIdx) >= 0 || st.stage.nextByRoute) items.push({
      label: "次の面へ", cls: "primary", onClick: async () => {
        if (st.stage.after) await showDialog(E.stageAfterLines(st.stage, run)); // 面間の物語
        if (st.stage.nextByRoute && !run.route) await chooseRoute(); // 第8面クリア後: ルート選択
        const next = E.nextStageIndex(DATA, run, stageIdx);
        if (next >= 0) openIntermission(next);                        // 整備・改造・買い物
        else $("btn-title").click();
      }
    });
    if (st.stage.final) { // 最終面クリア後は EX 面へ直行できる導線も出す
      const exIdx = DATA.stages.stages.findIndex(s => s.ex);
      if (exIdx >= 0) items.push({ label: "EX面「祭りのあとで」へ", cls: "primary", onClick: () => startStage(exIdx) });
    }
    items.push({ label: "タイトルへ", onClick: () => $("btn-title").click() });
    panel.buttons(items);
    let clearP = null;
    if (!st._clearShown) { st._clearShown = true; if (st.stage.clear) clearP = showDialog(st.stage.clear); }
    // 最終面・EX面は「次の面へ」が無いので、エンディング／後日談の会話をここで見せる（決着台詞の後）
    if (!st._afterShown && E.nextStageIndex(DATA, run, stageIdx) < 0 && !st.stage.nextByRoute && st.stage.after) {
      st._afterShown = true;
      const lines = E.stageAfterLines(st.stage, run);
      if (clearP) clearP.then(() => showDialog(lines)); else showDialog(lines);
    }
  } else {
    E.saveRun(localStorage, run);
    panel.show("<h3>敗北…</h3><div class='stat'>" + (st.loseReason || "") + "<br>獲得した経験値と歯車コインは引き継がれます。育成して再挑戦できます。</div>");
    panel.buttons([
      { label: "リトライ（育成引継ぎ）", cls: "primary", onClick: () => startStage(stageIdx) },
      { label: "タイトルへ", onClick: () => $("btn-title").click() }
    ]);
  }
}
async function handleResult() {
  localStorage.removeItem(BKEY); // 勝敗が確定したら中断セーブは破棄する
  if (run) E.saveRun(localStorage, run);
  render();
}

/* ===== ルート選択（第8面クリア後） ===== */
function chooseRoute() {
  return new Promise(resolve => {
    const ov = $("route-overlay");
    ov.classList.remove("hidden");
    const done = (r) => {
      run.route = r;
      E.saveRun(localStorage, run);
      ov.classList.add("hidden");
      resolve(r);
    };
    $("btn-route-a").onclick = () => done("A");
    $("btn-route-b").onclick = () => done("B");
  });
}

/* ===== インターミッション画面 ===== */
const MOD_LABEL = { hp: "HP", armor: "装甲", en: "EN", hit: "命中", power: "武器威力" };
let imNext = 0, imPilot = null;
function imPilots() {
  const seen = [];
  const idxs = new Set([...E.stagePath(DATA, run).filter(i => i <= imNext), ...(run.clearedStages || []), imNext]);
  for (const i of idxs) {
    const s = DATA.stages.stages[i];
    if (!s) continue;
    for (const a of s.allies) if (!seen.includes(a.pilot)) seen.push(a.pilot);
  }
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
  h += "<div class='im-head'><h2>インターミッション</h2><div class='im-funds'>歯車コイン: " + run.funds + "</div></div>";
  h += "<div class='im-topbtns'><button data-act='go' class='primary'>出撃（第" + DATA.stages.stages[imNext].id + "面「" + DATA.stages.stages[imNext].title + "」へ）</button><button data-act='title'>タイトルへ</button></div>";
  // 手動セーブスロット（3つ）。自動セーブとは別に、好きな時点を残せる
  h += "<div class='im-sec'><h3>セーブスロット（手動・3つ）</h3><table>";
  for (let slot = 1; slot <= E.SAVE_SLOTS; slot++) {
    const info = E.saveSlotInfo(localStorage, slot);
    const label = info ? (info.gameCleared ? "本編クリア済み" : info.clearedCount + "面クリア") + "／コイン " + info.funds + (info.savedAt ? "／" + fmtDate(info.savedAt) : "") : "（空）";
    h += "<tr><td>スロット" + slot + "</td><td>" + label + "</td><td><button data-act='slotsave' data-slot='" + slot + "'>ここにセーブ</button></td><td>" + (info ? "<button data-act='slotload' data-slot='" + slot + "'>ロード</button>" : "") + "</td></tr>";
  }
  h += "</table><div class='stat' style='color:#94a3b8'>セーブは自動でも行われます（改造・購入・習得のたび）。スロットは残しておきたい時点を手動で保存する用です。ロードすると今の進行はスロットの内容に置き換わります。</div></div>";
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
  if (d.act === "slotload") {
    const loaded = E.loadRunFromSlot(localStorage, DATA, Number(d.slot));
    if (!loaded) { renderIntermission(); return; }
    run = loaded;
    E.saveRun(localStorage, run); // 「つづきから」と足並みを揃える
    localStorage.removeItem(BKEY); // 別 run の戦況スナップショットは破棄する
    const path = E.stagePath(DATA, run);
    let idx = path.find(i => !(run.clearedStages || []).includes(i));
    if (idx === undefined) { // 全面クリア済みなら EX（後日談）、なければ最終面
      const exIdx = DATA.stages.stages.findIndex(s => s.ex);
      idx = (run.gameCleared && exIdx >= 0) ? exIdx : path[path.length - 1];
    }
    imPilot = null;
    openIntermission(idx);
    return;
  }
  if (d.act === "slotsave") E.saveRunToSlot(localStorage, run, Number(d.slot));
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
