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
    L: { name: "灯り", cost: 1, evade: 5, def: 1.0, lamp: true },
    X: { name: "障害物", cost: Infinity, evade: 0, def: 1.0 }
  };
  function terrainAt(stage, x, y) {
    if (x < 0 || y < 0 || y >= stage.terrain.length || x >= stage.terrain[0].length) return TERRAIN.X;
    return TERRAIN[stage.terrain[y][x]] || TERRAIN["."];
  }
  function terrainChar(stage, x, y) { return stage.terrain[y][x]; }
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
    const run = { funds: 0, cleared: 0, pilots: {}, mods: {}, parts: {}, hoshiLearned: {}, partStock: {} };
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

  let uidSeq = 1;
  function allyUnit(data, run, spec) {
    const p = data.pilots.pilots[spec.pilot], u = data.units.units[p.unit], g = run.pilots[spec.pilot];
    const b = calcBonuses(data, run, p.unit);
    return {
      uid: uidSeq++, side: "ally", pilotId: spec.pilot, unitId: p.unit,
      name: p.name, unitName: u.name, color: p.color, x: spec.x, y: spec.y,
      maxHp: u.hp + g.hp + b.hp, hp: u.hp + g.hp + b.hp, maxEn: u.en + b.en, en: u.en + b.en,
      move: u.move + b.move, armor: u.armor + b.armor, aim: p.aim + g.aim + b.hit, eva: p.eva + g.eva, atk: p.atk + g.atk,
      weapons: u.weapons.map(w => Object.assign({}, w, { power: w.power + b.power })), maxSp: p.sp, sp: p.sp, morale: 100, level: g.level,
      acted: false, boss: false, flags: {}
    };
  }
  function enemyUnit(data, spec, stageId) {
    const u = data.units.units[spec.unit];
    const lv = stageId; // 敵の強さは面番号に連動
    return {
      uid: uidSeq++, side: "enemy", pilotId: null, unitId: spec.unit,
      name: u.name, unitName: u.name, color: u.color, x: spec.x, y: spec.y,
      maxHp: u.hp + (lv - 1) * 120, hp: u.hp + (lv - 1) * 120, maxEn: u.en, en: u.en,
      move: u.move, armor: u.armor + (lv - 1) * 20, aim: (u.aim || 95) + (lv - 1) * 2, eva: (u.eva || 90), atk: 100 + (lv - 1) * 6,
      weapons: u.weapons, maxSp: 0, sp: 0, morale: 100, level: lv,
      acted: false, boss: !!spec.boss, flags: {}
    };
  }
  function startStage(data, run, stageIdx) {
    const stage = data.stages.stages[stageIdx];
    const st = {
      data, run, stage, stageIdx, turn: 1, phase: "player", result: null,
      units: [], log: [], pendingDialog: null, rustStorm: false, bossHalfShown: false, medal: false
    };
    for (const a of stage.allies) st.units.push(allyUnit(data, run, a));
    for (const e of stage.enemies) st.units.push(enemyUnit(data, e, stage.id));
    for (const n of stage.npcs || []) {
      const u = data.units.units[n.unit];
      st.units.push({ uid: uidSeq++, side: "npc", pilotId: null, unitId: n.unit, name: u.name, unitName: u.name, color: u.color, x: n.x, y: n.y, maxHp: u.hp, hp: u.hp, maxEn: 0, en: 0, move: u.move, armor: u.armor, aim: 0, eva: u.eva, atk: 0, weapons: [], maxSp: 0, sp: 0, morale: 100, level: 1, acted: false, boss: false, flags: {} });
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
        const t = terrainAt(st.stage, nx, ny);
        if (!isFinite(t.cost)) continue;
        const occ = unitAt(st, nx, ny);
        if (occ && occ.side === "enemy" && unit.side !== "enemy") continue;
        if (occ && occ.side !== "enemy" && unit.side === "enemy") continue;
        const nc = cur.c + t.cost;
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
        if (!isFinite(terrainAt(st.stage, nx, ny).cost)) continue;
        const k = nx + "," + ny;
        if (!seen.has(k)) { seen.add(k); q.push({ x: nx, y: ny }); }
      }
    }
    return seen;
  }

  function fogPenalty(st, atk, def) {
    if (!st.stage.fog) return 0;
    const lamps = [];
    st.stage.terrain.forEach((row, y) => { [...row].forEach((c, x) => { if (c === "L") lamps.push({ x, y }); }); });
    const near = u => lamps.some(l => Math.abs(l.x - u.x) + Math.abs(l.y - u.y) <= (st.stage.lampRadius || 2));
    return (near(atk) || near(def)) ? 0 : 30;
  }
  function hitRate(st, atk, def, w, stance) {
    let h = w.hit + atk.aim - def.eva - terrainAt(st.stage, def.x, def.y).evade;
    h -= fogPenalty(st, atk, def);
    if (atk.flags.shuuchuu) h += 30;
    if (def.flags.shuuchuu) h -= 30;
    if (stance === "evade") h -= 30;
    if (atk.flags.hicchu) h = 100;
    if (def.flags.hirameki) h = 0;
    return clamp(h, 5, 100);
  }
  function damage(st, atk, def, w, stance) {
    let d = w.power + atk.atk * 5 - def.armor;
    d = Math.round(d * terrainAt(st.stage, def.x, def.y).def);
    if (st.rustStorm && atk.side === "enemy") d = Math.round(d * 1.1);
    if (stance === "defend") d = Math.round(d / 2);
    if (def.flags.fukutsu) d = Math.round(d / 2);
    return Math.max(50, d);
  }
  function canUseWeapon(st, atk, def, w) {
    const d = dist(atk, def);
    return d >= w.min && d <= w.max && atk.en >= (w.en || 0) && atk.morale >= (w.morale || 0) && !w.heal;
  }
  function chooseStance(st, atk, def) {
    // 防御側AI: 期待被害が最小になる 反撃/防御/回避 を選ぶ
    const options = ["counter", "defend", "evade"];
    let best = "defend", bestScore = Infinity;
    for (const s of options) {
      const w = def.weapons.filter(cw => canUseWeapon(st, def, atk, cw))[0];
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
      const cw = def.weapons.filter(x => canUseWeapon(st, def, atk, x))[0];
      if (cw) f.counter = { weapon: cw, hit: hitRate(st, def, atk, cw, null), dmg: damage(st, def, atk, cw, null) };
    }
    delete atk._w;
    return f;
  }
  function gainExp(st, unit, amount, rng) {
    if (unit.side !== "ally") return;
    const g = st.run.pilots[unit.pilotId];
    g.exp += amount;
    while (g.exp >= 100) {
      g.exp -= 100; g.level++; g.hp += 150; g.atk += 6; g.aim += 2; g.eva += 2;
      unit.level = g.level; unit.maxHp += 150; unit.hp = Math.min(unit.maxHp, unit.hp + 150);
      st.log.push({ type: "levelup", unit: unit.name, level: g.level });
    }
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
    events.push({ type: "attack", atk: atk.name, def: def.name, weapon: w.name, hit: isHit, hitRate: hit, dmg, killed, defHp: def.hp, atkX: atk.x, atkY: atk.y, defX: def.x, defY: def.y });
    if (atk.side === "ally" && def.side === "enemy") {
      let exp = isHit ? 20 : 8;
      if (killed) {
        exp += 40; st.run.funds += Math.round(def.maxHp / 8);
        st.run.pilots[atk.pilotId].kills++;
      }
      if (atk.level < def.level) exp = Math.round(exp * (1 + 0.3 * (def.level - atk.level))); // 追いつき補正
      gainExp(st, atk, exp, rng);
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
      const cw = def.weapons.filter(x => canUseWeapon(st, def, atk, x))[0];
      if (cw) doAttack(st, def, atk, cw, null, rng, events);
    }
    atk.flags.hicchu = false; atk.flags.shuuchuu = false;
    def.flags.hirameki = false; def.flags.fukutsu = false;
    checkBossHalf(st, events);
    updateResult(st);
    return events;
  }
  function checkBossHalf(st, events) {
    const boss = st.units.find(u => u.boss && u.side === "enemy");
    if (boss && !st.bossHalfShown && boss.hp > 0 && boss.hp <= boss.maxHp / 2 && st.stage.bossHalf) {
      st.bossHalfShown = true; st.pendingDialog = st.stage.bossHalf;
      events.push({ type: "bosshalf" });
    }
  }
  function healAction(st, atk, target, wIdx, rng) {
    const w = atk.weapons[wIdx];
    const amount = w.power + atk.atk * 3;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    const events = [{ type: "heal", atk: atk.name, def: target.name, weapon: w.name, amount, defHp: target.hp, defX: target.x, defY: target.y }];
    if (atk.side === "ally") gainExp(st, atk, 15, rng || Math.random);
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
  function npcPhase(st, rng) {
    rng = rng || Math.random;
    for (const n of living(st, "npc")) {
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
        for (const e of ev.enemies) st.units.push(enemyUnit(st.data, e, st.stage.id));
        if (ev.rustStorm) st.rustStorm = true;
        if (ev.lines) st.pendingDialog = ev.lines;
      }
    }
    st.phase = "player";
  }
  function updateResult(st) {
    if (st.result) return;
    const allies = living(st, "ally");
    const aobee = st.units.find(u => u.pilotId === "aobee");
    if (!allies.length || (aobee && aobee.hp <= 0)) { st.result = "lose"; st.loseReason = "あおびーの撃墜／全滅"; return; }
    if (st.stage.loseNpc && !living(st, "npc").length) { st.result = "lose"; st.loseReason = "動物が全てやられた"; return; }
    const enemies = living(st, "enemy");
    if (st.stage.winType === "boss") {
      const boss = st.units.find(u => u.boss && u.side === "enemy");
      if (boss && boss.hp <= 0) st.result = "win";
    } else if (!enemies.length) st.result = "win";
    if (st.result === "win") st.medal = st.turn <= (st.stage.medalTurns || 99);
  }
  function buildSave(run) {
    return { version: 1, funds: run.funds, cleared: run.cleared, pilots: run.pilots, mods: run.mods, parts: run.parts, hoshiLearned: run.hoshiLearned, partStock: run.partStock || {} };
  }
  function saveRun(storage, run) { storage.setItem("aobee-taisen-save-v1", JSON.stringify(buildSave(run))); }
  function loadRun(storage, data) {
    const raw = storage.getItem("aobee-taisen-save-v1");
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.version !== 1) return null;
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
    return run;
  }
  const api = { TERRAIN, terrainAt, terrainChar, dist, createRun, startStage, unitAt, living, computeMoveRange, reachableSet, fogPenalty, hitRate, damage, canUseWeapon, forecast, resolveCombat, healAction, applyHoshi, bestWeaponVs, enemyPhase, npcPhase, startPlayerPhase, updateResult, buildSave, saveRun, loadRun, gainExp, MOD_TRACKS, MOD_MAX, MOD_PER, HOSHI_COST, modCost, buyMod, buyPart, equipPart, unequipPart, learnHoshi, calcBonuses };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.SRPGEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
