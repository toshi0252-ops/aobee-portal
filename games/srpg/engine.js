"use strict";
/* あおびー大戦 エンジン: 移動・戦闘計算・予測・敵AI・勝敗・育成・セーブ
   ブラウザでは window.SRPGEngine、Nodeでは module.exports として動く。 */
(function (global) {
  const TERRAIN = {
    ".": { name: "平地", cost: 1, evade: 0, def: 1.0 },
    P: { name: "参道", cost: 1, evade: 0, def: 1.0 },
    G: { name: "歯車フロア", cost: 1, evade: 0, def: 1.0 },
    F: { name: "森", cost: 2, evade: 15, def: 1.0 },
    V: { name: "村・建物", cost: 1, evade: 10, def: 1.0, heal: true },
    R: { name: "川", cost: 3, evade: 0, def: 1.0 },
    W: { name: "水上", cost: 3, evade: 0, def: 1.0 },
    S: { name: "砂地", cost: 2, evade: 0, def: 1.0 },
    L: { name: "灯り", cost: 1, evade: 5, def: 1.0, lamp: true },
    D: { name: "砦の門", cost: Infinity, evade: 0, def: 1.0 },
    X: { name: "障害物", cost: Infinity, evade: 0, def: 1.0 }
  };
  function terrainAt(stage, x, y) {
    if (x < 0 || y < 0 || y >= stage.terrain.length || x >= stage.terrain[0].length) return TERRAIN.X;
    return TERRAIN[stage.terrain[y][x]] || TERRAIN["."];
  }
  function terrainChar(stage, x, y) { return stage.terrain[y][x]; }
  /* 移動コスト（st の状態を加味）: 砦の門（D）は閉じている間は通行不可、開門後はコスト1 */
  function moveCostAt(st, x, y) {
    const ch = terrainChar(st.stage, x, y);
    if (ch === "D") return st.gateOpen ? 1 : Infinity;
    const t = TERRAIN[ch];
    return t ? t.cost : 1;
  }
  /* 戦闘で使う地形補正: 飛行ユニットは地形の回避・防御補正を受けない（平地扱い） */
  function terrainBonusFor(st, unit) {
    if (unit && unit.moveType === "air") return { evade: 0, def: 1.0 };
    return terrainAt(st.stage, unit.x, unit.y);
  }
  function isWaterAt(st, unit) {
    const c = terrainChar(st.stage, unit.x, unit.y);
    return c === "W" || c === "R";
  }
  function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ===== インターミッション: 改造・強化パーツ・ほし習得 ===== */
  const MOD_TRACKS = ["hp", "armor", "en", "hit", "power"];
  const MOD_MAX = 5;
  const MOD_PER = { hp: 250, armor: 70, en: 15, hit: 3, power: 50 }; // 1段階あたりの上昇量
  const HOSHI_COST = 500;
  function emptyMods() { return { hp: 0, armor: 0, en: 0, hit: 0, power: 0 }; }
  function normalizeMods(m) {
    const out = emptyMods();
    if (m) for (const t of MOD_TRACKS) out[t] = clamp(Math.floor(m[t] || 0), 0, MOD_MAX);
    return out;
  }
  function modCost(track, curLv) { return 200 + 150 * curLv; }
  function buyMod(run, unitId, track) {
    if (!MOD_TRACKS.includes(track)) return false;
    if (!run.mods) run.mods = {};
    if (!run.mods[unitId]) run.mods[unitId] = emptyMods();
    const cur = run.mods[unitId][track] || 0;
    if (cur >= MOD_MAX) return false;
    const cost = modCost(track, cur);
    if (run.funds < cost) return false;
    run.funds -= cost; run.mods[unitId][track] = cur + 1;
    return true;
  }
  function buyPart(run, data, partId) {
    const master = data.parts && data.parts.parts[partId];
    if (!master) return false;
    if (run.funds < master.cost) return false;
    if (!run.partStock) run.partStock = {};
    run.funds -= master.cost;
    run.partStock[partId] = (run.partStock[partId] || 0) + 1;
    return true;
  }
  function equipPart(run, unitId, slotIdx, partId) {
    if (slotIdx !== 0 && slotIdx !== 1) return false;
    if (!run.partStock || (run.partStock[partId] || 0) <= 0) return false;
    if (!run.parts) run.parts = {};
    if (!Array.isArray(run.parts[unitId])) run.parts[unitId] = [null, null];
    const cur = run.parts[unitId][slotIdx];
    if (cur === partId) return false;
    if (cur) run.partStock[cur] = (run.partStock[cur] || 0) + 1; // 付け替え: 元のパーツは在庫へ戻す
    run.partStock[partId]--;
    run.parts[unitId][slotIdx] = partId;
    return true;
  }
  function unequipPart(run, unitId, slotIdx) {
    if (slotIdx !== 0 && slotIdx !== 1) return false;
    if (!run.parts || !Array.isArray(run.parts[unitId])) return false;
    const cur = run.parts[unitId][slotIdx];
    if (!cur) return false;
    if (!run.partStock) run.partStock = {};
    run.partStock[cur] = (run.partStock[cur] || 0) + 1;
    run.parts[unitId][slotIdx] = null;
    return true;
  }
  function learnHoshi(run, pilotId, cmdId, data) {
    const list = run.hoshiLearned && run.hoshiLearned[pilotId];
    if (!list || list.includes(cmdId)) return false;
    if (data && !(data.pilots.hoshiCommands || {})[cmdId]) return false;
    if (run.funds < HOSHI_COST) return false;
    run.funds -= HOSHI_COST; list.push(cmdId);
    return true;
  }
  /* 改造＋装備パーツの合算ボーナス（startStage と画面表示で共用） */
  function calcBonuses(data, run, unitId) {
    const b = { hp: 0, armor: 0, en: 0, hit: 0, power: 0, move: 0 };
    const m = (run.mods && run.mods[unitId]) || {};
    for (const t of MOD_TRACKS) b[t] += (m[t] || 0) * MOD_PER[t];
    const master = (data.parts && data.parts.parts) || {};
    for (const partId of (run.parts && run.parts[unitId]) || []) {
      if (!partId) continue;
      const ef = (master[partId] || {}).effect || {};
      for (const k of Object.keys(b)) if (ef[k]) b[k] += ef[k];
    }
    return b;
  }

  function createRun(data) {
    const run = { funds: 0, cleared: 0, pilots: {}, mods: {}, parts: {}, hoshiLearned: {}, partStock: {}, route: null, clearedStages: [], clearedStageKeys: [], gameCleared: false, coreChoice: null };
    for (const pid of Object.keys(data.pilots.pilots)) {
      run.pilots[pid] = { level: 1, exp: 0, kills: 0, hp: 0, atk: 0, aim: 0, eva: 0 };
      run.hoshiLearned[pid] = data.pilots.pilots[pid].hoshi.slice();
    }
    for (const uid of Object.keys(data.units.units)) {
      run.mods[uid] = emptyMods();               // 改造5トラック×最大5段階（全0）
      run.parts[uid] = [null, null];              // 強化パーツ枠（2枠・空）
    }
    return run;
  }

  /* 敵ユニットの強さスケールに使う面レベル。通常は面番号（stage.id）だが、
     id が数値でない面（EX面）は stage.enemyLevel を使う。 */
  function stageLevel(stage) {
    if (stage && typeof stage.enemyLevel === "number") return stage.enemyLevel;
    return (stage && typeof stage.id === "number") ? stage.id : 1;
  }
  let uidSeq = 1;
  function allyUnit(data, run, spec) {
    const p = data.pilots.pilots[spec.pilot], u = data.units.units[p.unit], g = run.pilots[spec.pilot];
    const b = calcBonuses(data, run, p.unit);
    return {
      uid: uidSeq++, side: "ally", pilotId: spec.pilot, unitId: p.unit,
      name: p.name, unitName: u.name, color: p.color, x: spec.x, y: spec.y,
      maxHp: u.hp + g.hp + b.hp, hp: u.hp + g.hp + b.hp, maxEn: u.en + b.en, en: u.en + b.en,
      move: u.move + b.move, moveType: u.moveType || "land", armor: u.armor + b.armor, aim: p.aim + g.aim + b.hit, eva: p.eva + g.eva, atk: p.atk + g.atk,
      weapons: u.weapons.map(w => Object.assign({}, w, { power: w.power + b.power })), maxSp: p.sp, sp: p.sp, morale: 100, level: g.level,
      acted: false, boss: false, flags: {}
    };
  }
  function enemyUnit(data, spec, stageId) {
    const u = data.units.units[spec.unit];
    const lv = stageId; // 敵の強さは面レベル（stageLevel）に連動
    const unit = {
      uid: uidSeq++, side: "enemy", pilotId: null, unitId: spec.unit,
      name: u.name, unitName: u.name, color: u.color, x: spec.x, y: spec.y,
      maxHp: u.hp + (lv - 1) * 120, hp: u.hp + (lv - 1) * 120, maxEn: u.en, en: u.en,
      move: u.move, moveType: u.moveType || "land", armor: u.armor + (lv - 1) * 20, aim: (u.aim || 95) + (lv - 1) * 2, eva: (u.eva || 90), atk: 100 + (lv - 1) * 6,
      weapons: u.weapons, maxSp: 0, sp: 0, morale: 100, level: lv,
      acted: false, boss: !!spec.boss, flags: {}
    };
    // バリア守護（第24面サビのコア等）: 指定ユニットが生存している間はダメージを受けない
    if (spec.shieldedBy) unit.shieldedBy = spec.shieldedBy;
    return unit;
  }
  /* ===== 出撃枠選択: ロスター／固定／参加不可／枠数 =====
     ロスター = その時点で加入済みの全員。加入判定は「周回経路（stagePath）上でこの面までに
     allies として登場するパイロット」＋「この面の allies」＋「クリア済み面の allies」
     （面セレクトで別ルート面や EX を遊ぶ場合の保険）。stage.unavailable の者は除く。
     stage.deployFixed（固定メンバー）と stage.deployLimit（出撃枠数）はデータ側で持つ。
     既定選択は従来の allies そのもの（何も変えなければ従来と完全に同じ編成・配置になる）。 */
  function deployInfo(data, run, stageIdx) {
    const stage = data.stages.stages[stageIdx];
    const unavailable = (stage.unavailable || []).slice();
    const order = [];
    const addFrom = s => { if (!s) return; for (const a of s.allies || []) if (!order.includes(a.pilot)) order.push(a.pilot); };
    const path = stagePath(data, run || { route: null, clearedStages: [] });
    const pos = path.indexOf(stageIdx);
    if (pos >= 0) for (let i = 0; i <= pos; i++) addFrom(data.stages.stages[path[i]]);
    addFrom(stage);
    for (const ci of (run && run.clearedStages) || []) addFrom(data.stages.stages[ci]);
    const roster = order.filter(pid => data.pilots.pilots[pid] && !unavailable.includes(pid));
    const fixed = (stage.deployFixed || ["aobee"]).filter(pid => roster.includes(pid));
    const limit = stage.deployLimit || stage.allies.length;
    const def = stage.allies.map(a => a.pilot).filter(pid => roster.includes(pid));
    for (const pid of fixed) if (!def.includes(pid)) def.push(pid);
    return {
      roster, fixed, unavailable, limit,
      defaultSelection: def.slice(0, Math.max(limit, fixed.length)),
      slots: stage.allies.map(a => ({ x: a.x, y: a.y })),
      // ロスター全員が枠に収まる面では選択の余地がない（全員出撃しかありえない）ので、
      // UI 側は選択画面を出さず即出撃する。その判定をここに集約する。
      needsChoice: roster.length > limit
    };
  }
  /* 選択をサニタイズする: ロスター外・重複を除き、固定メンバーを必ず含め、枠数で打ち切る */
  function sanitizeSelection(info, selection) {
    const sel = info.fixed.slice();
    for (const pid of selection || []) {
      if (info.roster.includes(pid) && !sel.includes(pid) && sel.length < info.limit) sel.push(pid);
    }
    return sel;
  }
  function startStage(data, run, stageIdx, selection) {
    const stage = data.stages.stages[stageIdx];
    const st = {
      data, run, stage, stageIdx, turn: 1, phase: "player", result: null,
      units: [], log: [], pendingDialog: null, rustStorm: false, bossHalfShown: false, medal: false,
      fogActive: !!stage.fog, coreChoice: null, sealProgress: 0, pendingChoice: null, gateOpen: false
    };
    // 最終面分割後のコア面: 選択は戦闘開始直後に提示する（triggerUnit を持たない atStart 形式）
    if (stage.coreChoice && stage.coreChoice.atStart) st.pendingChoice = stage.coreChoice.id || "core";
    let specs = stage.allies;
    if (selection) {
      // 配置位置は allies の座標（スロット）を、選択メンバーへ allies の並び順優先で割り当てる
      const info = deployInfo(data, run, stageIdx);
      const sel = sanitizeSelection(info, selection);
      const allyOrder = stage.allies.map(a => a.pilot);
      sel.sort((a, b) => {
        const ia = allyOrder.includes(a) ? allyOrder.indexOf(a) : 1000 + info.roster.indexOf(a);
        const ib = allyOrder.includes(b) ? allyOrder.indexOf(b) : 1000 + info.roster.indexOf(b);
        return ia - ib;
      });
      specs = sel.map((pid, i) => {
        const slot = info.slots[Math.min(i, info.slots.length - 1)];
        return { pilot: pid, x: slot.x, y: slot.y };
      });
    }
    for (const a of specs) st.units.push(allyUnit(data, run, a));
    for (const e of stage.enemies) st.units.push(enemyUnit(data, e, stageLevel(stage)));
    for (const n of stage.npcs || []) {
      const u = data.units.units[n.unit];
      st.units.push({ uid: uidSeq++, side: "npc", pilotId: null, unitId: n.unit, name: u.name, unitName: u.name, color: u.color, x: n.x, y: n.y, maxHp: u.hp, hp: u.hp, maxEn: 0, en: 0, move: u.move, moveType: u.moveType || "land", armor: u.armor, aim: 0, eva: u.eva, atk: 0, weapons: [], maxSp: 0, sp: 0, morale: 100, level: 1, acted: false, boss: false, stay: !!n.stay, flags: {} });
    }
    return st;
  }
  function unitAt(st, x, y) { return st.units.find(u => u.hp > 0 && u.x === x && u.y === y) || null; }
  function living(st, side) { return st.units.filter(u => u.hp > 0 && u.side === side); }

  function computeMoveRange(st, unit) {
    const maxCost = unit.move + (unit.flags.kasoku || 0);
    const key = (x, y) => x + "," + y;
    const cost = new Map([[key(unit.x, unit.y), 0]]);
    const q = [{ x: unit.x, y: unit.y, c: 0 }];
    while (q.length) {
      const cur = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (nx < 0 || ny < 0 || ny >= st.stage.terrain.length || nx >= st.stage.terrain[0].length) continue;
        let step = moveCostAt(st, nx, ny);
        if (unit.moveType === "air") step = isFinite(step) ? 1 : Infinity; // 飛行: 地形コストを無視（壁と閉じた門は越えられない）
        if (!isFinite(step)) continue;
        const occ = unitAt(st, nx, ny);
        if (occ && occ.side === "enemy" && unit.side !== "enemy") continue;
        if (occ && occ.side !== "enemy" && unit.side === "enemy") continue;
        const nc = cur.c + step;
        if (nc > maxCost) continue;
        if (cost.has(key(nx, ny)) && cost.get(key(nx, ny)) <= nc) continue;
        cost.set(key(nx, ny), nc); q.push({ x: nx, y: ny, c: nc });
      }
    }
    const tiles = [];
    for (const [k, c] of cost) {
      const [x, y] = k.split(",").map(Number);
      const occ = unitAt(st, x, y);
      if (!occ || occ === unit) tiles.push({ x, y, cost: c });
    }
    return tiles;
  }
  function reachableSet(st, sx, sy, movePoints, side) {
    // テスト用: 障害物のみ考慮した到達可能性（敵味方の占有は無視、地形コストは歩数換算で上限なし・到達可否のみ）
    const seen = new Set([sx + "," + sy]); const q = [{ x: sx, y: sy }];
    while (q.length) {
      const cur = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (nx < 0 || ny < 0 || ny >= st.stage.terrain.length || nx >= st.stage.terrain[0].length) continue;
        if (!isFinite(moveCostAt(st, nx, ny))) continue;
        const k = nx + "," + ny;
        if (!seen.has(k)) { seen.add(k); q.push({ x: nx, y: ny }); }
      }
    }
    return seen;
  }

  function fogPenalty(st, atk, def) {
    if (!(st.fogActive !== undefined ? st.fogActive : st.stage.fog)) return 0;
    const lamps = [];
    st.stage.terrain.forEach((row, y) => { [...row].forEach((c, x) => { if (c === "L") lamps.push({ x, y }); }); });
    const near = u => lamps.some(l => Math.abs(l.x - u.x) + Math.abs(l.y - u.y) <= (st.stage.lampRadius || 2));
    return (near(atk) || near(def)) ? 0 : 30;
  }
  function hitRate(st, atk, def, w, stance) {
    let h = w.hit + atk.aim - def.eva - terrainBonusFor(st, def).evade;
    h -= fogPenalty(st, atk, def);
    if (atk.flags.shuuchuu) h += 30;
    if (def.flags.shuuchuu) h -= 30;
    if (stance === "evade") h -= 30;
    if (atk.flags.hicchu) h = 100;
    if (def.flags.hirameki) h = 0;
    return clamp(h, 5, 100);
  }
  /* バリア守護中か: def.shieldedBy で指定されたユニットが生存している間は無敵 */
  function isShielded(st, def) {
    if (!def.shieldedBy) return false;
    return st.units.some(u => u !== def && u.side === def.side && u.unitId === def.shieldedBy && u.hp > 0);
  }
  function damage(st, atk, def, w, stance) {
    if (isShielded(st, def)) return 0;
    let d = w.power + atk.atk * 5 - def.armor;
    d = Math.round(d * terrainBonusFor(st, def).def);
    if (st.rustStorm && atk.side === "enemy") d = Math.round(d * 1.1);
    // セイラブリッグの水上ボーナス: 水上（W）・川（R）にいる時、与ダメージ+10%／被ダメージ-10%
    if (atk.unitId === "seirabrig" && isWaterAt(st, atk)) d = Math.round(d * 1.1);
    if (def.unitId === "seirabrig" && isWaterAt(st, def)) d = Math.round(d * 0.9);
    if (stance === "defend") d = Math.round(d / 2);
    if (def.flags.fukutsu) d = Math.round(d / 2);
    return Math.max(50, d);
  }
  /* 合体攻撃の使用条件: w.combo {partner: 相方ユニットID, range: 許容距離} がある武器は、
     相方が生存し、攻撃側から range 以内にいる時だけ使える（スターギア・クロス等）。 */
  function comboPartnerOk(st, atk, w) {
    if (!w || !w.combo) return true;
    const partner = st.units.find(u => u.side === atk.side && u.uid !== atk.uid && u.unitId === w.combo.partner && u.hp > 0);
    if (!partner) return false;
    return dist(atk, partner) <= (w.combo.range || 4);
  }
  function canUseWeapon(st, atk, def, w, forCounter) {
    const d = dist(atk, def);
    // counterOnly の武器（汎用敵の反撃用副兵装）は、自分から撃ちには行かず反撃でのみ使う
    return d >= w.min && d <= w.max && atk.en >= (w.en || 0) && atk.morale >= (w.morale || 0) && !w.heal && !w.supply && (!w.counterOnly || forCounter) && comboPartnerOk(st, atk, w);
  }
  function chooseStance(st, atk, def) {
    // 敵の防御側: 反撃できる武器があるなら基本は反撃する（スパロボ系の標準挙動）。
    // ただし、この一撃の期待被害で落ちる見込みの時だけ、下の期待値計算で守りの手を選ぶ。
    const counterWeapon = def.weapons.filter(cw => canUseWeapon(st, def, atk, cw, true))[0];
    if (def.side === "enemy" && counterWeapon) {
      const expTaken = damage(st, atk, def, atk._w, "counter") * (hitRate(st, atk, def, atk._w, "counter") / 100);
      if (expTaken < def.hp) return "counter";
    }
    // 防御側AI（味方の防御側はこちらが基本）: 期待被害と反撃の期待値を天秤にかけて選ぶ
    const options = ["counter", "defend", "evade"];
    let best = "defend", bestScore = Infinity;
    for (const s of options) {
      const w = def.weapons.filter(cw => canUseWeapon(st, def, atk, cw, true))[0];
      if (s === "counter" && !w) continue;
      const hit = hitRate(st, atk, def, atk._w, s) / 100;
      const taken = damage(st, atk, def, atk._w, s) * hit;
      let dealt = 0;
      if (s === "counter" && w) dealt = damage(st, def, atk, w, null) * (hitRate(st, def, atk, w, null) / 100);
      const score = taken - dealt * 0.7;
      if (score < bestScore) { bestScore = score; best = s; }
    }
    return best;
  }
  function forecast(st, atk, def, wIdx) {
    const w = atk.weapons[wIdx]; atk._w = w;
    const stance = chooseStance(st, atk, def);
    const f = { weapon: w, hit: hitRate(st, atk, def, w, stance), dmg: damage(st, atk, def, w, stance), stance, counter: null };
    if (stance === "counter") {
      const cw = def.weapons.filter(x => canUseWeapon(st, def, atk, x, true))[0];
      if (cw) f.counter = { weapon: cw, hit: hitRate(st, def, atk, cw, null), dmg: damage(st, def, atk, cw, null) };
    }
    delete atk._w;
    return f;
  }
  function gainExp(st, unit, amount, rng) {
    if (unit.side !== "ally") return 0;
    const g = st.run.pilots[unit.pilotId];
    g.exp += amount;
    let gained = 0;
    while (g.exp >= 100) {
      g.exp -= 100; g.level++; g.hp += 150; g.atk += 6; g.aim += 2; g.eva += 2; gained++;
      unit.level = g.level; unit.maxHp += 150; unit.hp = Math.min(unit.maxHp, unit.hp + 150);
      st.log.push({ type: "levelup", unit: unit.name, level: g.level });
    }
    return gained;
  }
  /* レベルアップしたら表示用のイベントを積む（マップ／戦闘シーンが拾ってポップと音を出す） */
  function pushLevelupEvent(st, unit, events, gained) {
    if (gained > 0) events.push({ type: "levelup", pilotId: unit.pilotId, name: unit.name, level: st.run.pilots[unit.pilotId].level, defX: unit.x, defY: unit.y, x: unit.x, y: unit.y });
  }
  function doAttack(st, atk, def, w, stance, rng, events) {
    const hit = hitRate(st, atk, def, w, stance);
    const roll = Math.floor(rng() * 100);
    const isHit = roll < hit;
    let dmg = 0, killed = false;
    atk.en -= (w.en || 0);
    if (isHit) {
      dmg = damage(st, atk, def, w, stance);
      def.hp -= dmg;
      def.morale = Math.min(150, def.morale + 3);
      if (def.hp <= 0) { def.hp = 0; killed = true; }
    }
    atk.morale = Math.min(150, atk.morale + 5 + (killed ? 8 : 0));
    const ev = { type: "attack", atk: atk.name, def: def.name, weapon: w.name, fx: w.fx || "melee", power: w.power, hit: isHit, hitRate: hit, dmg, killed, defHp: def.hp, atkX: atk.x, atkY: atk.y, defX: def.x, defY: def.y, exp: 0 };
    if (w.combo) {
      // 合体攻撃: 相方の情報をイベントに載せ、専用演出（バナー＋相方登場＋二重ビーム）が組めるようにする
      const partner = st.units.find(u => u.side === atk.side && u.uid !== atk.uid && u.unitId === w.combo.partner && u.hp > 0);
      if (partner) ev.combo = { weapon: w.name, partnerPilotId: partner.pilotId, partnerName: partner.name, partnerUnitId: partner.unitId, partnerUnitName: partner.unitName, partnerColor: partner.color };
    }
    events.push(ev);
    if (atk.side === "ally" && def.side === "enemy") {
      let exp = isHit ? 20 : 8;
      if (killed) {
        exp += 40; st.run.funds += Math.round(def.maxHp / 8);
        st.run.pilots[atk.pilotId].kills++;
      }
      if (atk.level < def.level) exp = Math.round(exp * (1 + 0.3 * (def.level - atk.level))); // 追いつき補正
      ev.exp = exp;
      pushLevelupEvent(st, atk, events, gainExp(st, atk, exp, rng));
    }
    if (killed && atk.side === "enemy" && def.side === "ally") { /* 味方撃墜 */ }
    return killed;
  }
  function resolveCombat(st, atk, def, wIdx, rng) {
    rng = rng || Math.random;
    const w = atk.weapons[wIdx]; atk._w = w;
    const stance = chooseStance(st, atk, def);
    delete atk._w;
    const events = [];
    const defKilled = doAttack(st, atk, def, w, stance, rng, events);
    if (!defKilled && stance === "counter") {
      const cw = def.weapons.filter(x => canUseWeapon(st, def, atk, x, true))[0];
      if (cw) doAttack(st, def, atk, cw, null, rng, events);
    }
    atk.flags.hicchu = false; atk.flags.shuuchuu = false;
    def.flags.hirameki = false; def.flags.fukutsu = false;
    checkBossHalf(st, events);
    checkFogDevice(st, events);
    checkGate(st, events);
    checkCoreChoice(st, events);
    updateResult(st);
    return events;
  }
  /* 砦の門（第9A面）: ボス（砦の守備隊長）を撃破すると門が開き、門タイルが通行可能になる */
  function checkGate(st, events) {
    if (!st.stage.gate || st.gateOpen) return;
    const boss = st.units.find(u => u.boss && u.side === "enemy");
    if (boss && boss.hp <= 0) {
      st.gateOpen = true;
      if (st.stage.gateOpenLines) st.pendingDialog = st.stage.gateOpenLines;
      if (events) events.push({ type: "gateopen" });
    }
  }
  function checkBossHalf(st, events) {
    const boss = st.units.find(u => u.boss && u.side === "enemy");
    if (boss && !st.bossHalfShown && boss.hp > 0 && boss.hp <= boss.maxHp / 2 && st.stage.bossHalf) {
      st.bossHalfShown = true; st.pendingDialog = st.stage.bossHalf;
      events.push({ type: "bosshalf" });
      // 第22面: ボス半減で霧の発生源が弱まり霧が晴れる（台本の bossHalf 台詞に対応）
      if (st.stage.fogClearOnBossHalf && st.fogActive) st.fogActive = false;
    }
  }
  /* 霧の発生装置（第22面）: 装置ユニットを破壊すると霧が晴れる */
  function checkFogDevice(st, events) {
    if (!st.fogActive || !st.stage.fogDeviceUnit) return;
    const dev = st.units.find(u => u.side === "enemy" && u.unitId === st.stage.fogDeviceUnit);
    if (dev && dev.hp <= 0) {
      st.fogActive = false;
      if (st.stage.fogClearLines) st.pendingDialog = st.stage.fogClearLines;
      events.push({ type: "fogclear" });
    }
  }
  /* ===== 第24面: サビのコアへの選択（止める／壊す） =====
     stage.coreChoice {triggerUnit, coreUnit, lines, stopLines, destroyLines, destroyReinforce, sealTurns, sealLines}
     triggerUnit（グランツ／ラストギア）を倒すと選択が発生する。コアは shieldedBy で守られ、
     グランツを倒すまでダメージを受けないため、順序は常に「決着→選択→後半」になる。 */
  function checkCoreChoice(st, events) {
    const spec = st.stage.coreChoice;
    if (!spec || st.coreChoice || st.pendingChoice) return;
    const trig = st.units.find(u => u.side === "enemy" && u.unitId === spec.triggerUnit);
    const core = st.units.find(u => u.side === "enemy" && u.unitId === spec.coreUnit);
    if (trig && trig.hp <= 0 && core && core.hp > 0) {
      st.pendingChoice = spec.id || "core";
      if (events) events.push({ type: "choice", id: st.pendingChoice });
    }
  }
  function applyCoreChoice(st, run, choice) {
    const spec = st.stage.coreChoice;
    if (!spec || st.coreChoice) return false;
    if (choice !== "stop" && choice !== "destroy") return false;
    st.coreChoice = choice;
    st.pendingChoice = null;
    if (run) run.coreChoice = choice; // エンディング台詞の出し分け用に run へ保存
    const core = st.units.find(u => u.side === "enemy" && u.unitId === spec.coreUnit);
    if (choice === "stop") {
      // 「止める」: コアは攻撃をやめ（受動化）、隣接した味方が制御の書き換え作業を進める
      if (core) core.passive = true;
      st.sealProgress = 0;
      st.pendingDialog = spec.stopLines || null;
    } else {
      // 「壊す」: コアが防衛反応を起こし、守護機が増援として現れる（後半の敵配置が変わる）
      for (const e of spec.destroyReinforce || []) st.units.push(enemyUnit(st.data, e, stageLevel(st.stage)));
      st.pendingDialog = spec.destroyLines || null;
    }
    updateResult(st);
    return true;
  }
  function healAction(st, atk, target, wIdx, rng) {
    const w = atk.weapons[wIdx];
    const amount = w.power + atk.atk * 3;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    const events = [{ type: "heal", atk: atk.name, def: target.name, weapon: w.name, fx: w.fx || "heal", power: w.power, amount, defHp: target.hp, defX: target.x, defY: target.y, atkX: atk.x, atkY: atk.y, exp: atk.side === "ally" ? 15 : 0 }];
    if (atk.side === "ally") pushLevelupEvent(st, atk, events, gainExp(st, atk, 15, rng || Math.random));
    return events;
  }
  /* 補給（テルキャリー）: 対象の味方1機のENを全回復させる。HPは回復しない。気力変動なし */
  function supplyAction(st, atk, target, wIdx, rng) {
    const w = atk.weapons[wIdx];
    const amount = Math.max(0, target.maxEn - target.en);
    target.en = target.maxEn;
    const events = [{ type: "supply", atk: atk.name, def: target.name, weapon: w.name, fx: w.fx || "heal", power: 0, amount, defEn: target.en, defX: target.x, defY: target.y, atkX: atk.x, atkY: atk.y, exp: atk.side === "ally" ? 15 : 0 }];
    if (atk.side === "ally") pushLevelupEvent(st, atk, events, gainExp(st, atk, 15, rng || Math.random));
    return events;
  }
  function applyHoshi(st, unit, cmdId, target) {
    const master = st.data.pilots.hoshiCommands[cmdId];
    if (!master || unit.sp < master.sp) return false;
    unit.sp -= master.sp;
    const t = target || unit;
    switch (cmdId) {
      case "hicchu": unit.flags.hicchu = true; break;
      case "hirameki": unit.flags.hirameki = true; break;
      case "fukutsu": unit.flags.fukutsu = true; break;
      case "konjou": unit.hp = Math.min(unit.maxHp, unit.hp + Math.round(unit.maxHp * 0.3)); break;
      case "kasoku": unit.flags.kasoku = 3; break;
      case "shuuchuu": unit.flags.shuuchuu = true; break;
      case "ouen": t.morale = Math.min(150, t.morale + 20); break;
      case "gekirei": t.sp = Math.min(t.maxSp, t.sp + 15); break;
    }
    return true;
  }
  function bestWeaponVs(st, atk, def) {
    let best = -1, bestScore = -1;
    atk.weapons.forEach((w, i) => {
      if (!canUseWeapon(st, atk, def, w)) return;
      atk._w = w;
      const stance = chooseStance(st, atk, def);
      const score = damage(st, atk, def, w, stance) * (hitRate(st, atk, def, w, stance) / 100);
      delete atk._w;
      if (score > bestScore) { bestScore = score; best = i; }
    });
    return best;
  }
  function enemyPhase(st, rng) {
    rng = rng || Math.random;
    const events = [];
    for (const e of living(st, "enemy")) {
      if (st.result) break;
      if (e.hp <= 0) continue;
      if (e.passive) { e.acted = true; continue; } // 受動化したユニット（止めるを選んだコア）は行動しない
      let targets = living(st, "ally");
      if (st.stage.loseNpc) targets = targets.concat(living(st, "npc"));
      if (!targets.length) break;
      // NPC（動物）は味方より優先度を下げる（距離+3のペナルティ）。近くに味方がいればそちらを狙う
      targets.sort((a, b) => (dist(e, a) + (a.side === "npc" ? 3 : 0)) - (dist(e, b) + (b.side === "npc" ? 3 : 0)));
      const target = targets[0];
      // 移動: 目標に最も近づけるマスへ
      const tiles = computeMoveRange(st, e);
      let bestTile = { x: e.x, y: e.y }, bestD = dist(e, target);
      for (const t of tiles) {
        const d = Math.abs(t.x - target.x) + Math.abs(t.y - target.y);
        const ev = terrainAt(st.stage, t.x, t.y).evade;
        if (d < bestD || (d === bestD && ev > terrainAt(st.stage, bestTile.x, bestTile.y).evade)) { bestD = d; bestTile = t; }
      }
      e.x = bestTile.x; e.y = bestTile.y;
      const wi = bestWeaponVs(st, e, target);
      if (wi >= 0) {
        const evs = resolveCombat(st, e, target, wi, rng);
        events.push(...evs);
      }
      e.acted = true;
      updateResult(st);
    }
    return events;
  }
  /* ティアの予見: 敵AIの思考（最寄りの目標→最適マス→最良武器）をそのまま先読みし、
     次の敵フェイズで大ダメージを受ける味方を洗い出す。ティアが出撃して生きている時だけ働く。
     敵の位置は一時的に動かして計算し、必ず元に戻す（状態を変えない）。 */
  function foreseeThreats(st) {
    const tia = st.units.find(u => u.side === "ally" && u.pilotId === "tia" && u.hp > 0);
    if (!tia) return null;
    const threats = {};
    for (const e of living(st, "enemy")) {
      if (e.passive) continue;
      let targets = living(st, "ally");
      if (st.stage.loseNpc) targets = targets.concat(living(st, "npc"));
      if (!targets.length) break;
      targets.sort((a, b) => (dist(e, a) + (a.side === "npc" ? 3 : 0)) - (dist(e, b) + (b.side === "npc" ? 3 : 0)));
      const target = targets[0];
      const tiles = computeMoveRange(st, e);
      let bestTile = { x: e.x, y: e.y }, bestD = dist(e, target);
      for (const t of tiles) {
        const d = Math.abs(t.x - target.x) + Math.abs(t.y - target.y);
        const ev = terrainAt(st.stage, t.x, t.y).evade;
        if (d < bestD || (d === bestD && ev > terrainAt(st.stage, bestTile.x, bestTile.y).evade)) { bestD = d; bestTile = t; }
      }
      const ox = e.x, oy = e.y;
      e.x = bestTile.x; e.y = bestTile.y;
      const wi = bestWeaponVs(st, e, target);
      let dmg = 0;
      if (wi >= 0) {
        const w = e.weapons[wi];
        e._w = w;
        const stance = chooseStance(st, e, target);
        delete e._w;
        dmg = damage(st, e, target, w, stance); // 命中前提の最大値（警告は安全側に倒す）
      }
      e.x = ox; e.y = oy;
      if (wi >= 0 && dmg >= target.hp * 0.5) {
        const cur = threats[target.uid];
        if (!cur || dmg > cur.dmg) threats[target.uid] = { dmg, lethal: dmg >= target.hp, from: e.name };
      }
    }
    return threats;
  }
  function npcPhase(st, rng) {
    rng = rng || Math.random;
    for (const n of living(st, "npc")) {
      if (n.stay) continue; // その場で作業中などのNPCは逃げない（EX2の修理中のミスト等）
      const enemies = living(st, "enemy");
      if (!enemies.length) break;
      const tiles = computeMoveRange(st, n);
      let best = { x: n.x, y: n.y }, bestScore = -1;
      for (const t of tiles.concat([{ x: n.x, y: n.y }])) {
        if (unitAt(st, t.x, t.y) && unitAt(st, t.x, t.y) !== n) continue;
        const md = Math.min(...enemies.map(e => Math.abs(e.x - t.x) + Math.abs(e.y - t.y)));
        if (md > bestScore) { bestScore = md; best = t; }
      }
      n.x = best.x; n.y = best.y;
    }
  }
  function startPlayerPhase(st) {
    st.turn++;
    if (st.stage.turnLimit && st.turn > st.stage.turnLimit) { st.result = "lose"; st.loseReason = "制限ターンを超えた"; return; }
    for (const u of st.units) { u.acted = false; u.flags.kasoku = 0; }
    for (const u of living(st, "ally")) {
      if (terrainAt(st.stage, u.x, u.y).heal) u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.1));
    }
    const evs = (st.stage.reinforce || []).concat(st.stage.events || []);
    for (const ev of evs) {
      if (ev.turn === st.turn) {
        for (const e of ev.enemies) st.units.push(enemyUnit(st.data, e, stageLevel(st.stage)));
        if (ev.rustStorm) st.rustStorm = true;
        if (ev.lines) st.pendingDialog = ev.lines;
      }
    }
    // 「止める」選択時: コアに隣接した味方がいれば制御の書き換え作業が1段階進む
    const spec = st.stage.coreChoice;
    if (spec && st.coreChoice === "stop" && !st.result) {
      const core = st.units.find(u => u.side === "enemy" && u.unitId === spec.coreUnit);
      if (core && core.hp > 0 && living(st, "ally").some(a => dist(a, core) <= 1)) {
        st.sealProgress = (st.sealProgress || 0) + 1;
        if (st.sealProgress >= (spec.sealTurns || 2)) {
          st.result = "win"; // コアを止めた＝決着（コアは無事なまま）
          st.medal = st.turn <= (st.stage.medalTurns || 99);
        } else if (spec.sealLines) {
          st.pendingDialog = spec.sealLines;
        }
      }
    }
    checkCoreChoice(st, null); // 中断復元などで選択発生を取りこぼした場合の再発火
    st.phase = "player";
  }
  function updateResult(st) {
    if (st.result) return;
    const allies = living(st, "ally");
    const aobee = st.units.find(u => u.pilotId === "aobee");
    if (!allies.length || (aobee && aobee.hp <= 0)) { st.result = "lose"; st.loseReason = "あおびーの撃墜／全滅"; return; }
    if (st.stage.loseNpc && !living(st, "npc").length) { st.result = "lose"; st.loseReason = st.stage.loseNpcText || "動物が全てやられた"; return; }
    const enemies = living(st, "enemy");
    if (st.stage.winType === "boss") {
      const boss = st.units.find(u => u.boss && u.side === "enemy");
      if (boss && boss.hp <= 0) st.result = "win";
    } else if (st.stage.winType === "bosses") {
      // 分割出撃面（第20面）: ボス格が複数いる場合は全員の撃破で勝利
      const bosses = st.units.filter(u => u.boss && u.side === "enemy");
      if (bosses.length && bosses.every(b => b.hp <= 0)) st.result = "win";
    } else if (!enemies.length) st.result = "win";
    if (st.result === "win") st.medal = st.turn <= (st.stage.medalTurns || 99);
  }
  /* ===== ルート分岐: 次の面の決定と周回経路 =====
     stage.nextByRoute {A,B} がある面（第8面）は run.route で分岐する。route 未選択なら -1（選択UIを出す）。
     stage.next が数値ならそのインデックス、-1 なら終端（続きは制作中）。どちらも無ければ線形に次へ。 */
  function nextStageIndex(data, run, idx) {
    const stages = data.stages.stages;
    const s = stages[idx];
    if (!s) return -1;
    if (s.nextByRoute) {
      if (!run || (run.route !== "A" && run.route !== "B")) return -1;
      const n = s.nextByRoute[run.route];
      return (typeof n === "number" && stages[n]) ? n : -1;
    }
    if (typeof s.next === "number") return (s.next >= 0 && stages[s.next]) ? s.next : -1;
    return idx + 1 < stages.length ? idx + 1 : -1;
  }
  /* 導入会話の実効行列: stage.introByRoute {at, A, B} がある面（第14面）は、
     run.route に応じた到着者台詞を at の位置に差し込んで返す（route 未確定時は A 扱い）。 */
  function stageIntroLines(stage, run) {
    const lines = (stage.intro || []).slice();
    if (stage.introByRoute) {
      const r = run && run.route === "B" ? "B" : "A";
      const ins = stage.introByRoute[r] || stage.introByRoute.A || [];
      const at = typeof stage.introByRoute.at === "number" ? stage.introByRoute.at : lines.length;
      lines.splice(at, 0, ...ins);
    }
    return lines;
  }
  /* 面間会話（エンディング）の実効行列: stage.afterByChoice {at, stop, destroy} がある面（第24面）は、
     run.coreChoice（未選択時は stop 扱い）に応じた台詞を at の位置に差し込んで返す。 */
  function stageAfterLines(stage, run) {
    const lines = (stage.after || []).slice();
    if (stage.afterByChoice) {
      const c = run && run.coreChoice === "destroy" ? "destroy" : "stop";
      const ins = stage.afterByChoice[c] || stage.afterByChoice.stop || [];
      const at = typeof stage.afterByChoice.at === "number" ? stage.afterByChoice.at : lines.length;
      lines.splice(at, 0, ...ins);
    }
    return lines;
  }
  /* 面クリアの run への反映（main の結果表示とテストで共用）。何度呼んでも結果は同じ。
     stage.final（第24面）をクリアすると run.gameCleared が立ち、EX面が解放される。 */
  /* ステージの安定キー（id＋ルート）。面の追加・並べ替えがあっても変わらない識別子で、
     セーブのクリア記録はこのキーで保持する（インデックスは表示順に過ぎない）。 */
  function stageKey(stage) { return String(stage.id) + (stage.route || ""); }
  /* v1セーブ（インデックス記録）解釈用の凍結リスト: 2026-11-28時点（全32面）のキー順。
     これ以降に面を挿入・改番しても、この並びで旧セーブのインデックスをキーへ変換する。 */
  const STAGE_KEYS_V1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9A", "10A", "9B", "10B", "11A", "12A", "13A", "11B", "12B", "13B", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "EX", "EX2", "EX3"];
  /* v2→v3 のキー改番表: 増面（2026-11-28）で面番号が繰り上がった分の旧キー→新キー。
     v1セーブは凍結リストでキー化した後、v2セーブはそのまま、この表を通してから解決する。 */
  const KEY_RENAMES_V3 = { "12A": "13A", "13A": "14A", "12B": "13B", "13B": "14B", "15": "16", "16": "17", "17": "18", "18": "19", "19": "20", "20": "21", "21": "22", "22": "23", "23": "24", "24": "25" };
  function applyStageClear(run, stageIdx, stage) {
    run.cleared = Math.max(run.cleared || 0, stageIdx + 1);
    if (!Array.isArray(run.clearedStages)) run.clearedStages = [];
    if (!run.clearedStages.includes(stageIdx)) run.clearedStages.push(stageIdx);
    if (stage) {
      if (!Array.isArray(run.clearedStageKeys)) run.clearedStageKeys = [];
      const k = stageKey(stage);
      if (!run.clearedStageKeys.includes(k)) run.clearedStageKeys.push(k);
    }
    if (stage && stage.final) run.gameCleared = true;
  }
  function stagePath(data, run) {
    const path = [0];
    let guard = 0;
    while (guard++ < 100) {
      const n = nextStageIndex(data, run, path[path.length - 1]);
      if (n < 0) break;
      path.push(n);
    }
    return path;
  }
  function buildSave(run) {
    return { version: 3, funds: run.funds, cleared: run.cleared, pilots: run.pilots, mods: run.mods, parts: run.parts, hoshiLearned: run.hoshiLearned, partStock: run.partStock || {}, route: run.route || null, clearedStages: run.clearedStages || [], clearedStageKeys: run.clearedStageKeys || [], gameCleared: !!run.gameCleared, coreChoice: run.coreChoice || null };
  }
  function saveRun(storage, run) { storage.setItem("aobee-taisen-save-v1", JSON.stringify(buildSave(run))); }
  function loadRun(storage, data) {
    const raw = storage.getItem("aobee-taisen-save-v1");
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (![1, 2, 3].includes(s.version)) return null;
    return parseRunSave(data, s);
  }
  /* 手動セーブスロット（3つ）: インターミッション等から任意の時点を残すための保存。
     中身は自動セーブと同じ形式（version 1）に savedAt を付けたもの。自動セーブとは独立に持つ。 */
  const SAVE_SLOTS = 3;
  function saveSlotKey(slot) { return "aobee-taisen-save-slot" + slot; }
  function saveRunToSlot(storage, run, slot) {
    const s = buildSave(run);
    s.savedAt = Date.now();
    storage.setItem(saveSlotKey(slot), JSON.stringify(s));
  }
  function loadRunFromSlot(storage, data, slot) {
    const raw = storage.getItem(saveSlotKey(slot));
    if (!raw) return null;
    let s;
    try { s = JSON.parse(raw); } catch (e) { return null; }
    if (!s || ![1, 2, 3].includes(s.version)) return null;
    return parseRunSave(data, s);
  }
  function saveSlotInfo(storage, slot) {
    const raw = storage.getItem(saveSlotKey(slot));
    if (!raw) return null;
    let s;
    try { s = JSON.parse(raw); } catch (e) { return null; }
    if (!s || ![1, 2, 3].includes(s.version)) return null;
    return { clearedCount: (Array.isArray(s.clearedStageKeys) && s.clearedStageKeys.length ? s.clearedStageKeys.length : (Array.isArray(s.clearedStages) ? s.clearedStages.length : (s.cleared || 0))), funds: s.funds || 0, route: (s.route === "A" || s.route === "B") ? s.route : null, gameCleared: !!s.gameCleared, savedAt: s.savedAt || null };
  }
  function parseRunSave(data, s) {
    const run = createRun(data);
    run.funds = s.funds || 0; run.cleared = s.cleared || 0;
    for (const pid of Object.keys(run.pilots)) if (s.pilots && s.pilots[pid]) run.pilots[pid] = s.pilots[pid];
    for (const uid of Object.keys(run.mods)) {
      if (s.mods && s.mods[uid]) run.mods[uid] = normalizeMods(s.mods[uid]); // 旧形式 {kaizou:0} も5トラックに正規化
      if (s.parts && s.parts[uid]) {
        const arr = Array.isArray(s.parts[uid]) ? s.parts[uid].slice(0, 2) : [null, null];
        while (arr.length < 2) arr.push(null);
        run.parts[uid] = arr;
      }
    }
    for (const pid of Object.keys(run.hoshiLearned)) if (s.hoshiLearned && s.hoshiLearned[pid]) run.hoshiLearned[pid] = s.hoshiLearned[pid];
    run.partStock = (s.partStock && typeof s.partStock === "object") ? s.partStock : {}; // 旧セーブ（partStockなし）は空で初期化
    run.route = (s.route === "A" || s.route === "B") ? s.route : null; // 旧セーブ（routeなし）は未選択
    run.gameCleared = !!s.gameCleared; // 旧セーブ（第24面実装前）は未クリア扱い
    run.coreChoice = (s.coreChoice === "stop" || s.coreChoice === "destroy") ? s.coreChoice : null;
    /* クリア記録の解決: まず安定キー（clearedStageKeys）を現行データのインデックスへ写す。
       キーが無い v1 セーブは、凍結リスト STAGE_KEYS_V1 経由でインデックス→キー→現行インデックスと変換する。
       写し替えが発生したら run._remapped を立て、main 側で旧インデックス前提の中断セーブを破棄する。 */
    const keyToIdx = new Map(data.stages.stages.map((s, i) => [stageKey(s), i]));
    const storedIdx = Array.isArray(s.clearedStages) ? s.clearedStages.slice() : null;
    let keys = null;
    if (Array.isArray(s.clearedStageKeys) && s.clearedStageKeys.length) {
      keys = s.clearedStageKeys.slice();
    } else if (storedIdx && storedIdx.length) {
      keys = storedIdx.map(i => STAGE_KEYS_V1[i]).filter(Boolean);
    }
    if (keys && s.version !== 3) keys = keys.map(k => KEY_RENAMES_V3[k] || k); // 増面改番より前のセーブは旧キーを新キーへ
    if (keys) keys = keys.filter(k => keyToIdx.has(k));
    if (keys) {
      run.clearedStageKeys = [...new Set(keys)];
      run.clearedStages = run.clearedStageKeys.map(k => keyToIdx.get(k));
      const before = (storedIdx || []).slice().sort((a, b) => a - b).join();
      const after = run.clearedStages.slice().sort((a, b) => a - b).join();
      if (before !== after) run._remapped = true;
    } else {
      run.clearedStageKeys = [];
      run.clearedStages = [];
    }
    // 旧セーブ互換: clearedStages が無く cleared だけある場合は、線形分（第1〜8面=インデックス0〜7）をクリア済みに移行
    if (!run.clearedStages.length && run.cleared > 0) {
      for (let i = 0; i < Math.min(run.cleared, 8); i++) run.clearedStages.push(i);
      run.clearedStageKeys = run.clearedStages.map(i => stageKey(data.stages.stages[i]));
    }
    return run;
  }
  /* ===== 中断セーブ: 面の途中の戦況（st）の保存・復元 =====
     st のうち保存対象はデータのみ（data/run/stage への参照、result、pendingDialog、loseReason、log は含めない）。
     ステージ固有フラグは現行では st 直下の rustStorm / bossHalfShown / medal。
     st.flags / st.firedEvents / st.protectIds は現行エンジンでは未使用だが、将来の追加に備えて存在すれば一緒に保存する。 */
  function deepCopyPlain(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function serializeState(st) {
    const units = st.units.map(u => {
      const c = deepCopyPlain(u); // uid/side/pilotId/unitId/name/x/y/hp/maxHp/en/level/acted/weapons/flags 等の全動的フィールド
      delete c._w; // 戦闘予測用の一時フィールドは保存しない
      return c;
    });
    const flags = {
      rustStorm: !!st.rustStorm,       // 錆嵐適用済み（第5面）
      bossHalfShown: !!st.bossHalfShown, // ボス半減会話の表示済み
      medal: !!st.medal,
      fogActive: st.fogActive !== undefined ? !!st.fogActive : !!st.stage.fog, // 霧の残存状態（第22面: 装置破壊で晴れる）
      coreChoice: st.coreChoice || null, // 第24面のコア選択（済の場合）
      sealProgress: st.sealProgress || 0, // 「止める」選択時の書き換え作業の進捗
      gateOpen: !!st.gateOpen // 砦の門の開門状態（第9A面）
    };
    if (st.flags && typeof st.flags === "object") flags.extra = deepCopyPlain(st.flags);
    const out = {
      version: 1,
      stageIdx: st.stageIdx,
      turn: st.turn,
      phase: st.phase,
      units,
      flags
    };
    if (st.firedEvents) out.firedEvents = Array.isArray(st.firedEvents) ? st.firedEvents.slice() : Array.from(st.firedEvents);
    if (st.protectIds) out.protectIds = deepCopyPlain(st.protectIds);
    return out;
  }
  function restoreState(data, run, saved) {
    const stage = data.stages.stages[saved.stageIdx];
    const units = deepCopyPlain(saved.units || []);
    let maxUid = 0;
    for (const u of units) {
      delete u._w;
      if (typeof u.uid === "number" && u.uid > maxUid) maxUid = u.uid;
    }
    if (maxUid >= uidSeq) uidSeq = maxUid + 1; // 復元後に来る増援の uid が復元ユニットと衝突しないように進める
    const fl = saved.flags || {};
    const pick = k => (fl[k] !== undefined ? fl[k] : saved[k]); // flags ネスト形式を正とし、直下形式も受ける
    const st = {
      data, run, stage, stageIdx: saved.stageIdx,
      turn: saved.turn || 1, phase: "player", result: null, // 再開直後は味方フェイズ（エンジン表記は "player"）
      units, log: [], pendingDialog: null,
      rustStorm: !!pick("rustStorm"), bossHalfShown: !!pick("bossHalfShown"), medal: !!pick("medal"),
      fogActive: pick("fogActive") !== undefined ? !!pick("fogActive") : !!stage.fog,
      coreChoice: pick("coreChoice") || null, sealProgress: pick("sealProgress") || 0, pendingChoice: null,
      gateOpen: !!pick("gateOpen")
    };
    if (fl.extra) st.flags = deepCopyPlain(fl.extra);
    if (saved.firedEvents) st.firedEvents = new Set(saved.firedEvents);
    if (saved.protectIds) st.protectIds = deepCopyPlain(saved.protectIds);
    return st;
  }
  const api = { TERRAIN, terrainAt, terrainChar, moveCostAt, terrainBonusFor, dist, createRun, startStage, deployInfo, unitAt, living, computeMoveRange, reachableSet, fogPenalty, hitRate, damage, isShielded, canUseWeapon, comboPartnerOk, forecast, resolveCombat, healAction, supplyAction, applyHoshi, bestWeaponVs, foreseeThreats, enemyPhase, npcPhase, startPlayerPhase, updateResult, buildSave, saveRun, loadRun, SAVE_SLOTS, saveRunToSlot, loadRunFromSlot, saveSlotInfo, serializeState, restoreState, nextStageIndex, stageKey, STAGE_KEYS_V1, KEY_RENAMES_V3, stagePath, stageIntroLines, stageAfterLines, applyStageClear, checkCoreChoice, applyCoreChoice, checkGate, stageLevel, gainExp, MOD_TRACKS, MOD_MAX, MOD_PER, HOSHI_COST, modCost, buyMod, buyPart, equipPart, unequipPart, learnHoshi, calcBonuses };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.SRPGEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
