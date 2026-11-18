'use strict';
/* あおびーと失われた歯車 第1章 メイン: 状態管理・イベント進行・セーブ */
(() => {
  const { World, Dialogue, Snd } = Engine;
  const SAVE_KEY = 'aobeeGrandSaveV1';
  const $ = (id) => document.getElementById(id);

  /* 画像の先読み（敵イラストは戦闘開始時に初めて読み込むと初回だけ1フレーム欠けるため） */
  const PRELOAD_SRCS = [
    'assets/chars/npc-gardo.png', 'assets/chars/npc-mami.png', 'assets/chars/npc-poco.png',
    'assets/chars/enemy-cog.png', 'assets/chars/enemy-guardian.png', 'assets/chars/enemy-karakuri.png',
    'assets/chars/npc-minori.png', 'assets/chars/enemy-kuwa.png', 'assets/chars/enemy-moguru.png',
    'assets/chars/animal-cow.png', 'assets/chars/animal-sheep.png', 'assets/chars/animal-chicken.png',
    'assets/chars/npc-mio.png', 'assets/chars/npc-choro.png', 'assets/chars/enemy-akari.png', 'assets/chars/enemy-hoshigami.png',
    'assets/warubee-front-v1.png',
    'assets/cut-warubee-roof.png'
  ];
  for (const src of PRELOAD_SRCS) { const im = new Image(); im.src = src; }

  function freshState() {
    return {
      hp: 40, maxHp: 40, herbs: 2, guts: 0,
      level: 1, exp: 0, // 簡易レベル制（上限5、最大HP = 40 + (Lv-1)×8）
      fragments: 0, losses: 0, playMs: 0, startedAt: Date.now(),
      flags: {}, // opening, boots, trailIntro, cogDone, millIntro, millGear, bridgeOpen, bossDone, cleared
      talks: {}, // NPCごとの会話回数（2回目以降のセリフ出し分け用）
      picked: {}, // 'map:x,y' -> true
      choice: null, // 'strong' | 'weak'
      stats: { gutsSaves: 0 },
      chapter: 1, // 現在の章（第2章から 2）
      hoshiba: 0, // 星歯の回収数（/7）
      animalsCaught: 0, capturedIds: [] // 第2章: 柵に戻した動物の数とID（捕獲順）
    };
  }
  let S = freshState();
  let curMap = 'village';
  let started = false;
  let visitDone = {}; // マップ滞在中のみ有効な雑魚の撃破記録（セーブしない）。マップ再入場で復活させ、レベリング可能にする

  /* ---------- セーブ ---------- */
  function save() {
    if (!started || S.flags.cleared) { /* クリア後も記録は残す */ }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        S, map: curMap, x: World.player.gx, y: World.player.gy
      }));
    } catch (e) { /* 保存不可環境では無視 */ }
  }
  function loadSave() {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function wipeSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

  /* ---------- HUD ---------- */
  function objective() {
    const f = S.flags;
    if (S.chapter >= 3) {
      if (!f.ch3Intro) return 'ガルドの話を聞こう';
      if (!f.mioMet) return '参道を登って、神殿の守り人ミオに会おう';
      if ((f.litCandles || []).length < 5) return `神殿の燭台を順に灯そう（${(f.litCandles || []).length}/5）`;
      if (!f.warubeeSeen3) return '星時計の間へ進もう';
      if (!f.boss3Done) return 'ホシガミさまを止めよう！';
      return '第4章へつづく';
    }
    if (S.chapter >= 2) {
      if (!f.ch2Intro) return 'ガルドの話を聞こう';
      if (!f.minoriMet) return '西の道を抜けて、星のしずく牧場へ行こう';
      if (!f.herdDone) return `逃げた動物を柵エリアに戻そう（${S.animalsCaught}/5）`;
      if (!f.warubeeSeen) return '風車の丘へ 上ってみよう';
      if (!f.boss2Done) return '風車タワーのモーぐるマシンを止めよう！';
      if (!f.cleared2) return '牧場のみのりさんに報告しよう';
      return '第3章へつづく';
    }
    if (!f.opening) return '……';
    if (!f.boots) return '工房のガルドに話そう';
    if (S.fragments < 3 && curMap !== 'mill') return `小道で歯車の欠片を集めよう（${S.fragments}/3）`;
    if (!f.millGear) return curMap === 'mill' ? '水車小屋で小歯車を回収しよう' : '南の出口から水車小屋へ進もう';
    if (!f.bridgeOpen && nestsCleared() < 3) return `水車のコグの巣を壊そう（${nestsCleared()}/3）`;
    if (!f.bridgeOpen) return '橋の仕掛けに小歯車をはめよう';
    if (!f.bossDone) return '橋を渡って わるびーを追い詰めよう！';
    return '村へ帰ろう';
  }
  function refreshHUD() {
    $('hud-obj').textContent = '⚙ ' + objective();
    $('hud-sub').textContent = (S.chapter >= 2 ? `星歯 ${S.hoshiba}/7 ・ ` : '') + `Lv${S.level || 1} ・ 欠片 ${S.fragments}/4 ・ ほし草 ${S.herbs} ・ HP ${Math.max(0, S.hp)}/${S.maxHp}`;
  }

  /* ---------- フック ---------- */
  const hooksState = () => ({
    boots: !!S.flags.boots,
    bridgeOpen: !!S.flags.bridgeOpen,
    gearRestored: !!S.flags.gearRestored,
    windmillFast: S.chapter >= 2 && !S.flags.boss2Done, // 第2章ボス停止までは風車が暴走回転
    boss2Ready: S.chapter >= 2 && !!S.flags.warubeeSeen && !S.flags.boss2Done && !S.flags.boss2Started, // 丘のボス発生マスに目印を出す条件
    templeLit: !!S.flags.boss3Done, // 第3章ボス撃破後は神殿の暗闇が晴れる
    clockRestored: !!S.flags.cleared3, // 星時計が復活したか（星時計の間の描画用）
    darkLights: curMap === 'temple' ? (S.flags.litCandles || []).map(k => { const [lx, ly] = k.split(',').map(Number); return { x: lx, y: ly }; }) : [] // 点灯した燭台の位置（暗闇の灯り穴）
  });

  /* ---------- 第2章: 動物誘導 ---------- */
  const ANIMAL_DEFS = [
    { id: 'cow1', kind: 'cow', x: 5, y: 11 },
    { id: 'cow2', kind: 'cow', x: 16, y: 3 },
    { id: 'sheep1', kind: 'sheep', x: 7, y: 6 },
    { id: 'sheep2', kind: 'sheep', x: 11, y: 11 },
    { id: 'chicken1', kind: 'chicken', x: 16, y: 6 }
  ];
  const PEN_SLOTS = [ { x: 14, y: 9 }, { x: 16, y: 9 }, { x: 15, y: 10 }, { x: 14, y: 11 }, { x: 17, y: 11 } ];
  let animals = [];
  function spawnAnimals() {
    const caught = S.capturedIds || [];
    animals = ANIMAL_DEFS.map((d) => {
      const ci = caught.indexOf(d.id);
      const slot = ci >= 0 ? (PEN_SLOTS[ci] || PEN_SLOTS[0]) : null;
      return { id: d.id, kind: d.kind, animal: true, visible: true, captured: ci >= 0, x: slot ? slot.x : d.x, y: slot ? slot.y : d.y };
    });
    World.actors = animals;
  }
  function herdStep() {
    if (S.flags.herdDone) return;
    const p = World.player;
    const pen = (Data.maps.ranch && Data.maps.ranch.pen) || { x0: 13, y0: 8, x1: 18, y1: 12 };
    for (const a of animals) {
      if (a.captured) continue;
      if (Math.abs(a.x - p.gx) + Math.abs(a.y - p.gy) !== 1) continue;
      const tx = a.x + (a.x - p.gx), ty = a.y + (a.y - p.gy);
      const t = World.tileAt(tx, ty);
      if (t !== '.' && t !== ',') continue; // 壁・柵・水・看板などへは逃げない（詰まない処理）
      if (animals.some(o => o !== a && o.x === tx && o.y === ty)) continue;
      if (World.map.npcs.some(n => !n.hidden && n.x === tx && n.y === ty)) continue;
      a.x = tx; a.y = ty;
      if (tx >= pen.x0 && tx <= pen.x1 && ty >= pen.y0 && ty <= pen.y1) {
        // 柵エリアに入った → 捕獲して空きスロットへ固定表示
        a.captured = true;
        S.capturedIds = S.capturedIds || [];
        S.capturedIds.push(a.id);
        S.animalsCaught = S.capturedIds.length;
        const slot = PEN_SLOTS[S.animalsCaught - 1];
        if (slot) { a.x = slot.x; a.y = slot.y; }
        Snd.pickup();
        refreshHUD(); save();
        if (S.animalsCaught >= 5) {
          S.flags.herdDone = true;
          Dialogue.play(Data.dlg.minoriHerdDone, () => { S.herbs += 3; Snd.pickup(); refreshHUD(); save(); });
        }
      }
    }
  }
  /* ---------- 第3章: 燭台の順序点灯 ---------- */
  function tryLightCandle(x, y) {
    const defs = (Data.maps.temple && Data.maps.temple.candles) || [];
    const def = defs.find(c => c.x === x && c.y === y);
    if (!def) return;
    S.flags.litCandles = S.flags.litCandles || [];
    const next = S.flags.litCandles.length + 1;
    if (def.n === next) {
      S.flags.litCandles.push(x + ',' + y);
      World.setTile(x, y, 'L');
      Snd.pickup();
      if (S.flags.litCandles.length >= defs.length) {
        Dialogue.play(Data.dlg.candlesAllLit, () => { refreshHUD(); save(); });
      } else {
        Dialogue.play([Data.L('', `燭台に灯りがともった！（${S.flags.litCandles.length}/${defs.length}）`)], () => { refreshHUD(); save(); });
      }
    } else {
      // 順番が違うと、灯っていた分も全部消える（ペナルティはやり直しだけ）
      for (const k of S.flags.litCandles) {
        const [cx, cy] = k.split(',').map(Number);
        World.setTile(cx, cy, 'C');
      }
      S.flags.litCandles = [];
      Snd.hurt();
      Dialogue.play(Data.dlg.candleWrong, () => { refreshHUD(); save(); });
    }
  }

  function pushBack(ex) {
    const p = World.player;
    if (ex.y === 0) p.gy += 1; else if (ex.y === 13) p.gy -= 1;
    else if (ex.x === 0) p.gx += 1; else if (ex.x === 19) p.gx -= 1;
    p.px = p.gx * Engine.TILE; p.py = p.gy * Engine.TILE;
  }

  /* ---------- 第1章 肉付け: 水車のコグの巣（必須クエスト） ---------- */
  const NESTS = [
    { id: 'nest1', x: 10, y: 4 },
    { id: 'nest2', x: 3, y: 7 },
    { id: 'nest3', x: 6, y: 11 }
  ];
  function nestsCleared() { return NESTS.filter(n => S.flags[n.id]).length; }
  function spawnNests() {
    if (S.flags.bossDone) { World.actors = []; return; }
    World.actors = NESTS.filter(n => !S.flags[n.id]).map(n => ({ id: n.id, kind: 'cog', x: n.x, y: n.y, visible: true }));
  }

  function onStep(x, y, tile) {
    if (Battle.active || Dialogue.active) return;
    // 出入口
    const ex = World.map.exits.find(e => e.x === x && e.y === y);
    if (ex) {
      if (ex.gate === 'fragments' && S.fragments < 3) {
        Dialogue.play([Data.L('あおびー', `まだ欠片が足りない……あと${3 - S.fragments}つ。落とした場所をもう一度探そう。`, 'aobee')]);
        World.player.gy -= 1; World.player.py = World.player.gy * Engine.TILE;
        return;
      }
      if (ex.gate === 'ch2' && S.chapter < 2) {
        Dialogue.play(Data.dlg.gateCh2Msg);
        pushBack(ex);
        return;
      }
      if (ex.gate === 'herd' && !S.flags.herdDone) {
        Dialogue.play(Data.dlg.gateHerdMsg);
        pushBack(ex);
        return;
      }
      if (ex.gate === 'ch3' && S.chapter < 3) {
        Dialogue.play(Data.dlg.gateCh3Msg);
        pushBack(ex);
        return;
      }
      if (ex.gate === 'mio' && !S.flags.mioMet) {
        Dialogue.play(Data.dlg.mioGateMsg);
        pushBack(ex);
        return;
      }
      if (ex.gate === 'candles' && (S.flags.litCandles || []).length < 5) {
        Dialogue.play(Data.dlg.candlesGateMsg);
        pushBack(ex);
        return;
      }
      curMap = ex.to;
      World.loadMap(ex.to, ex.tx, ex.ty);
      save();
      return;
    }
    if (tile === 'F' || tile === 'G') {
      const key = curMap + ':' + x + ',' + y;
      if (S.picked[key]) return;
      if (tile === 'F') {
        S.picked[key] = true;
        World.setTile(x, y, '.');
        S.fragments++;
        Snd.pickup();
        World.player.joyT = performance.now() + 700;
        Dialogue.play([Data.L('', `歯車の欠片を拾った！（${S.fragments}/4）`)], () => { refreshHUD(); save(); });
      } else if (tile === 'G' && !S.flags.millGear) {
        startMillCogBattle();
      }
      return;
    }
    if (tile === 'R') {
      const key = curMap + ':' + x + ',' + y;
      if (!S.picked[key]) {
        S.picked[key] = true;
        World.setTile(x, y, '.');
        S.herbs++;
        Snd.pickup();
        Dialogue.play([Data.L('', 'ほし草を拾った！')], () => { refreshHUD(); save(); });
      }
      return;
    }
    // 初戦闘ゾーン（小道6行目を横切る）※敗北時は工房に戻され、再入場で再挑戦できる
    // チュートリアル完了後は通常個体として、マップ再入場ごとに復活する（レベリング用）
    if (curMap === 'trail' && y === 6) {
      if (!S.flags.cogDone) { startCogBattle(false); return; }
      if (!visitDone.trailCog) { startCogBattle(true); return; }
    }
    // 第1章 肉付け: まわりコグ（小道の東エリアの番人）。再入場で復活するレベリング相手
    if (curMap === 'trail' && x === 15 && !visitDone.mawari) {
      startMawariBattle();
      return;
    }
    // 第1章 肉付け: サブクエスト「ポコの木の剣」の落とし物（東の木の下）
    if (curMap === 'trail' && x === 16 && y === 7 && S.flags.swordQuest && !S.flags.swordFound) {
      S.flags.swordFound = true;
      Snd.pickup();
      Dialogue.play(Data.dlg.kidSwordPickup, () => { refreshHUD(); save(); });
      return;
    }
    // 第2章: クワコグ戦（まきばの道）。初回クリアはフラグに残しつつ、再入場で復活する
    if (curMap === 'road' && x === 9 && !visitDone.kuwaRoad) {
      startKuwaBattle('kuwaRoad');
      return;
    }
    // 第2章: クワコグ戦（牧場・南の畑付近）。同上
    if (curMap === 'ranch' && x === 7 && y === 12 && !visitDone.kuwaRanch) {
      startKuwaBattle('kuwaRanch');
      return;
    }
    // 第2章: わるびー目撃イベント（風車の丘の中腹を横切る）
    if (curMap === 'hill' && y === 7 && !S.flags.warubeeSeen) {
      startWarubeeSpot();
      return;
    }
    // 第2章: ボスゾーン（風車タワー前）
    if (curMap === 'hill' && x === 10 && y === 3 && S.flags.warubeeSeen && !S.flags.boss2Done && !S.flags.boss2Started) {
      S.flags.boss2Started = true;
      startMoguruBattle();
      return;
    }
    // 第3章: あかりコグ戦（神殿内部の2か所）。再入場で復活する
    if (curMap === 'temple' && x === 5 && y === 6 && !visitDone.akari1) {
      startAkariBattle('akari1');
      return;
    }
    if (curMap === 'temple' && x === 14 && y === 7 && !visitDone.akari2) {
      startAkariBattle('akari2');
      return;
    }
    // 第3章: ボスゾーン（星時計の間・時計の前）
    if (curMap === 'clockroom' && x === 10 && y === 6 && S.flags.warubeeSeen3 && !S.flags.boss3Done && !S.flags.boss3Started) {
      S.flags.boss3Started = true;
      startHoshigamiBattle();
      return;
    }
    // 第2章: 動物誘導（牧場を歩くたびに隣接判定）
    if (curMap === 'ranch') herdStep();
    // 第1章 肉付け: 水車のコグの巣（見えるコグに触れると戦闘）。倒した巣は戻らない
    if (curMap === 'mill') {
      const nest = NESTS.find(n => n.x === x && n.y === y && !S.flags[n.id]);
      if (nest) { startNestBattle(nest); return; }
    }
    // ボスゾーン（橋の向こう、わるびーのいる広場）
    if (curMap === 'mill' && x >= 16 && !S.flags.bossDone && !S.flags.bossStarted) {
      S.flags.bossStarted = true;
      startBoss();
      return;
    }
  }

  function applyTiles(w) {
    // 収集済みタイルを消す
    for (const key of Object.keys(S.picked)) {
      const [mid, pos] = key.split(':');
      if (mid !== w.mapId) continue;
      const [x, y] = pos.split(',').map(Number);
      if (w.tileAt(x, y) === 'F' || w.tileAt(x, y) === 'R') w.setTile(x, y, '.');
    }
    if (S.flags.millGear && w.mapId === 'mill') {
      // 小歯車タイル除去
      for (let y = 0; y < 14; y++) for (let x = 0; x < 20; x++) if (w.tileAt(x, y) === 'G') w.setTile(x, y, '.');
    }
    if (w.mapId === 'temple') {
      // 点灯済みの燭台を 'L' に復元する
      for (const k of (S.flags.litCandles || [])) {
        const [cx, cy] = k.split(',').map(Number);
        if (w.tileAt(cx, cy) === 'C') w.setTile(cx, cy, 'L');
      }
    }
  }

  function onMapEnter(id) {
    visitDone = {}; // マップに入り直すたびに固定雑魚が復活する
    refreshHUD();
    if (started) save();
    if (id === 'trail' && !S.flags.trailIntro) {
      S.flags.trailIntro = true;
      setTimeout(() => Dialogue.play(Data.dlg.trailIntro), 250);
    }
    if (id === 'mill') {
      const wb = World.map.npcs.find(n => n.id === 'warubee');
      if (wb) wb.hidden = !!S.flags.bossDone;
      spawnNests();
      if (!S.flags.millIntro) {
        S.flags.millIntro = true;
        setTimeout(() => Dialogue.play(Data.dlg.millIntro), 250);
      }
    }
    if (id === 'road' && !S.flags.roadIntro) {
      S.flags.roadIntro = true;
      setTimeout(() => Dialogue.play(Data.dlg.roadIntro), 250);
    }
    if (id === 'ranch') {
      spawnAnimals();
      if (!S.flags.ranchIntro) {
        S.flags.ranchIntro = true;
        setTimeout(() => Dialogue.play(Data.dlg.ranchIntro), 250);
      }
    }
    if (id === 'hill' && !S.flags.hillIntro) {
      S.flags.hillIntro = true;
      setTimeout(() => Dialogue.play(Data.dlg.hillIntro), 250);
    }
    if (id === 'approach' && !S.flags.approachIntro) {
      S.flags.approachIntro = true;
      setTimeout(() => Dialogue.play(Data.dlg.approachIntro), 250);
    }
    if (id === 'temple' && !S.flags.templeIntro) {
      S.flags.templeIntro = true;
      setTimeout(() => Dialogue.play(Data.dlg.templeIntro), 250);
    }
    if (id === 'clockroom') {
      // 長老とミオはボス撃破後に姿を見せる
      for (const n of World.map.npcs) { if (n.id === 'choro' || n.id === 'mio2') n.hidden = !S.flags.boss3Done; }
      if (!S.flags.warubeeSeen3 && S.chapter >= 3) {
        // 初入室: わるびー目撃イベント（時計の前で鉢合わせ）
        World.actors = [{ id: 'warubee', kind: 'warubee', x: 10, y: 3, visible: true }];
        setTimeout(() => {
          Dialogue.play(Data.dlg.warubeeSpot3, () => {
            World.actors = [];
            S.flags.warubeeSeen3 = true;
            refreshHUD(); save();
          });
        }, 250);
      }
    }
  }

  /* 調べるスポット: 「マップ名:正面タイルのx,y」→ 会話キー（本筋に関係ない読み物・小ネタ・伝承） */
  const SPOTS = {
    'village:2,3': 'spotWorkshop', 'village:3,3': 'spotWorkshop', 'village:4,3': 'spotWorkshop',
    'village:15,3': 'spotBakery', 'village:16,3': 'spotBakery', 'village:17,3': 'spotBakery',
    'village:5,1': 'spotTree', 'village:6,1': 'spotTree', 'village:13,1': 'spotTree', 'village:14,1': 'spotTree',
    'village:3,8': 'spotTree', 'village:16,8': 'spotTree',
    'trail:2,2': 'spotTrailTree', 'trail:3,2': 'spotTrailTree',
    'mill:2,3': 'spotMillHouse', 'mill:3,3': 'spotMillHouse', 'mill:4,3': 'spotMillHouse', 'mill:12,6': 'spotRiver',
    'road:3,1': 'spotRoadTree', 'road:4,1': 'spotRoadTree', 'road:15,1': 'spotRoadTree', 'road:16,1': 'spotRoadTree',
    'ranch:2,3': 'spotRanchHouse', 'ranch:3,3': 'spotRanchHouse', 'ranch:4,3': 'spotRanchHouse', 'ranch:15,8': 'spotPen',
    'approach:5,1': 'spotOldTree', 'approach:6,1': 'spotOldTree', 'approach:15,1': 'spotOldTree', 'approach:16,1': 'spotOldTree',
    'temple:9,3': 'spotPillar', 'temple:10,3': 'spotPillar', 'temple:9,4': 'spotPillar', 'temple:10,4': 'spotPillar',
    'clockroom:3,4': 'spotCarving', 'clockroom:3,5': 'spotCarving', 'clockroom:16,4': 'spotCarving', 'clockroom:16,5': 'spotCarving'
  };

  function onInteract() {
    if (Battle.active || Dialogue.active) return;
    const f = World.frontTile();
    const npc = World.map.npcs.find(n => !n.hidden && n.x === f.x && n.y === f.y);
    if (npc) {
      S.talks = S.talks || {};
      if (npc.id === 'gardo') {
        if (!S.flags.boots) {
          Dialogue.play(Data.dlg.gardoFirst, () => {
            S.flags.boots = true; S.herbs += 1;
            Snd.pickup(); refreshHUD(); save();
          });
        } else if (S.chapter >= 3) {
          Dialogue.play(Data.dlg.gardoCh3);
        } else if (S.chapter >= 2 && !S.flags.ch2Intro) {
          Dialogue.play(Data.dlg.ch2GardoNotice, () => { S.flags.ch2Intro = true; refreshHUD(); save(); });
        } else if (S.chapter >= 2) Dialogue.play(Data.dlg.gardoCh2);
        else if (S.flags.bossDone) Dialogue.play(Data.dlg.gardoBossDone);
        else if (S.fragments >= 3) Dialogue.play(Data.dlg.gardoFragmentsDone);
        else {
          const n = (S.talks.gardo = (S.talks.gardo || 0) + 1);
          if (n === 1) Dialogue.play(Data.dlg.gardoAfter);
          else Dialogue.play(Data.dlg.gardoChat[(n - 2) % Data.dlg.gardoChat.length]);
        }
      } else if (npc.id === 'baker') {
        if (S.flags.bossDone) Dialogue.play(Data.dlg.bakerBossDone);
        else {
          const n = (S.talks.baker = (S.talks.baker || 0) + 1);
          if (n === 1) Dialogue.play(Data.dlg.baker);
          else Dialogue.play(Data.dlg.bakerChat[(n - 2) % Data.dlg.bakerChat.length]);
        }
      } else if (npc.id === 'kid') {
        if (S.flags.swordFound && !S.flags.swordDone) {
          Dialogue.play(Data.dlg.kidQuestThanks, () => {
            S.flags.swordDone = true; S.herbs += 1;
            Snd.pickup(); refreshHUD(); save();
          });
        }
        else if (S.flags.bossDone) Dialogue.play(Data.dlg.kidBossDone);
        else if (S.flags.boots && !S.flags.swordQuest && !S.flags.swordDone) {
          Dialogue.play(Data.dlg.kidQuestOffer, () => { S.flags.swordQuest = true; refreshHUD(); save(); });
        }
        else if (S.flags.swordQuest && !S.flags.swordFound) Dialogue.play(Data.dlg.kidQuestHint);
        else {
          const n = (S.talks.kid = (S.talks.kid || 0) + 1);
          if (n === 1) Dialogue.play(Data.dlg.kid);
          else Dialogue.play(Data.dlg.kidChat[(n - 2) % Data.dlg.kidChat.length]);
        }
      }
      else if (npc.id === 'minori') {
        if (S.flags.boss2Done && !S.flags.cleared2) {
          startEnding2();
        } else {
          // 回復スポット: みのりさんに話すたび、お茶でHP全回復（何度でも可）。段階会話の頭にお茶の一言を付ける
          S.hp = S.maxHp;
          const tea = [Data.L('みのりさん', 'お茶をどうぞ。ほし草のお茶よ。……はい、これで元気いっぱいのはず。', 'minori')];
          const withTea = (lines, cb) => Dialogue.play(tea.concat(lines), cb || (() => { refreshHUD(); save(); }));
          if (S.flags.cleared2) {
            const n = (S.talks.minori = (S.talks.minori || 0) + 1);
            if (n === 1) withTea(Data.dlg.minoriAfter2);
            else withTea(Data.dlg.minoriChat[(n - 2) % Data.dlg.minoriChat.length]);
          }
          else if (!S.flags.minoriMet) {
            withTea(Data.dlg.minoriFirst, () => { S.flags.minoriMet = true; refreshHUD(); save(); });
          } else if (!S.flags.herdDone) {
            withTea(Data.dlg.minoriHerd[Math.min(S.animalsCaught, 4)]);
          } else withTea(Data.dlg.minoriAfter);
        }
      }
      else if (npc.id === 'mio') {
        // ミオは参道の回復スポット（話すたびに全回復）。初回は出会いイベント
        if (!S.flags.mioMet) {
          Dialogue.play(Data.dlg.mioFirst, () => { S.flags.mioMet = true; S.hp = S.maxHp; refreshHUD(); save(); });
        } else {
          S.hp = S.maxHp;
          const n = (S.talks.mio = (S.talks.mio || 0) + 1);
          const tail = n === 1 ? Data.dlg.mioAfter : Data.dlg.mioChat[(n - 2) % Data.dlg.mioChat.length];
          Dialogue.play(Data.dlg.mioHeal.concat(tail), () => { refreshHUD(); save(); });
        }
      }
      else if (npc.id === 'mio2') {
        const n = (S.talks.mio2 = (S.talks.mio2 || 0) + 1);
        Dialogue.play(n === 1 ? Data.dlg.mioClock : Data.dlg.mioClock2);
      }
      else if (npc.id === 'choro') {
        const n = (S.talks.choro = (S.talks.choro || 0) + 1);
        if (n === 1) Dialogue.play(Data.dlg.choroAfter);
        else Dialogue.play(Data.dlg.choroChat[(n - 2) % Data.dlg.choroChat.length]);
      }
      else if (npc.id === 'warubee' && curMap === 'mill' && !S.flags.bossDone && !S.flags.bossStarted) {
        S.flags.bossStarted = true; startBoss();
      }
      return;
    }
    // 調べるスポット（家具・大木・石柱・時計など）
    const spotKey = curMap + ':' + f.x + ',' + f.y;
    if (curMap === 'hill' && f.y === 2 && f.x >= 9 && f.x <= 11) { Dialogue.play(S.flags.cleared2 ? Data.dlg.spotWindmillAfter : Data.dlg.spotWindmill); return; }
    if (curMap === 'clockroom' && f.y === 1 && f.x >= 9 && f.x <= 11) { Dialogue.play(S.flags.cleared3 ? Data.dlg.spotClockAfter : Data.dlg.spotClock); return; }
    const spotDlg = SPOTS[spotKey];
    if (spotDlg) { Dialogue.play(Data.dlg[spotDlg]); return; }
    const t = World.tileAt(f.x, f.y);
    if (t === 'C') { tryLightCandle(f.x, f.y); return; }
    if (t === 'L') { Dialogue.play([Data.L('', 'もう灯っている。')]); return; }
    if (t === 'S') Dialogue.play(curMap === 'road' ? Data.dlg.roadSign : curMap === 'approach' ? Data.dlg.approachSign : curMap === 'temple' ? Data.dlg.mural3 : Data.dlg.sign);
    else if (t === 'X') {
      if (!S.flags.millGear) Dialogue.play(Data.dlg.bridgeNoGear);
      else if (nestsCleared() < 3) Dialogue.play(Data.dlg.bridgeJammed);
      else if (!S.flags.bridgeOpen) {
        S.flags.bridgeOpen = true; Snd.gear();
        Dialogue.play(Data.dlg.bridgeOpen, () => { refreshHUD(); save(); });
      }
    }
  }

  /* ---------- 戦闘 ---------- */
  async function startCogBattle(repeat) {
    const begin = async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.cog }],
        intro: 'サビつきコグ が あらわれた！', tutorial: !repeat
      });
      if (res === 'win') {
        if (repeat) {
          // 通常個体としての再戦: 進行フラグは触らず、この滞在中だけ撃破扱いにする
          visitDone.trailCog = true;
          refreshHUD(); save();
        } else {
          S.flags.cogDone = true;
          Dialogue.play(Data.dlg.cogOutro, () => { refreshHUD(); save(); });
        }
      } else onLose();
      refreshHUD();
    };
    if (repeat) begin();
    else Dialogue.play(Data.dlg.cogIntro, begin);
  }
  /* 第1章 肉付け: コグの巣の戦闘（必須クエスト）。倒すと巣が消え、3つ全部で水車が回る */
  function startNestBattle(nest) {
    const begin = async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.cog }],
        intro: '巣を守る サビつきコグ が あらわれた！'
      });
      if (res === 'win') {
        S.flags[nest.id] = true;
        World.actors = World.actors.filter(a => a.id !== nest.id);
        if (nestsCleared() >= 3) {
          Snd.gear();
          Dialogue.play(Data.dlg.nestAllClear, () => { refreshHUD(); save(); });
        } else {
          Dialogue.play([Data.L('', `コグの巣を壊した！（${nestsCleared()}/3）`)], () => { refreshHUD(); save(); });
        }
      } else onLose();
      refreshHUD();
    };
    if (S.flags.nestIntroSeen) begin();
    else { S.flags.nestIntroSeen = true; Dialogue.play(Data.dlg.nestIntro, begin); }
  }
  /* 第1章 肉付け: まわりコグ戦（小道の東エリア。再入場で復活） */
  function startMawariBattle() {
    Dialogue.play(Data.dlg.mawariIntro, async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.mawari }],
        intro: 'まわりコグ が あらわれた！'
      });
      if (res === 'win') {
        visitDone.mawari = true;
        refreshHUD(); save();
      } else onLose();
      refreshHUD();
    });
  }
  function startMillCogBattle() {
    Dialogue.play(Data.dlg.millCogIntro, async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.millCog }],
        intro: '番人コグ が 小歯車を守っている！'
      });
      if (res === 'win') {
        S.flags.millGear = true;
        World.setTile(World.player.gx, World.player.gy, '.');
        Snd.pickup();
        S.hp = S.maxHp; S.herbs += 1;
        Dialogue.play(Data.dlg.millCogOutro.concat([Data.L('', '水車小屋でひと休みした。HPが全回復！　ほし草を1つ見つけた。')]), () => { refreshHUD(); save(); });
      } else onLose();
      refreshHUD();
    });
  }
  function startKuwaBattle(flagKey) {
    Dialogue.play(Data.dlg.kuwaIntro, async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.kuwa }],
        intro: 'クワコグ が あらわれた！'
      });
      if (res === 'win') {
        S.flags[flagKey] = true; // 初回クリアの記録（進行用）
        visitDone[flagKey] = true; // この滞在中は再出現しない（再入場で復活）
        Dialogue.play(Data.dlg.kuwaOutro, () => { refreshHUD(); save(); });
      } else onLose();
      refreshHUD();
    });
  }
  function startWarubeeSpot() {
    S.flags.warubeeSeen = true;
    World.actors = [{ id: 'warubee', kind: 'warubee', x: 13, y: 3, visible: true }];
    Dialogue.play(Data.dlg.warubeeSpot, () => {
      World.actors = [];
      refreshHUD(); save();
    });
  }
  function startMoguruBattle() {
    Dialogue.play(Data.dlg.moguruIntro, async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.moguru }],
        intro: 'モーぐるマシン が 暴走している！',
        hint: [
          'モーぐるマシンは装甲が硬く、ふつうのこうげきは弾かれてしまう。',
          '「歯車チャージ」を溜めてから「こうげき」すると、歯車を1つ外せる。3つ外せば止められる！',
          '歯車が外れるほど暴走は激しくなる。ピンチのときは「ほし草」で回復しよう。'
        ]
      });
      if (res === 'win') {
        S.flags.boss2Done = true;
        S.hp = S.maxHp; // 風車が落ち着き、ひと息ついた
        Dialogue.play(Data.dlg.moguruOutro, () => { refreshHUD(); save(); });
      } else { S.flags.boss2Started = false; onLose(); }
      refreshHUD();
    });
  }
  function startAkariBattle(flagKey) {
    Dialogue.play(Data.dlg.akariIntro, async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.akari }],
        intro: 'あかりコグ が あらわれた！'
      });
      if (res === 'win') {
        visitDone[flagKey] = true; // この滞在中は再出現しない（再入場で復活）
        Dialogue.play(Data.dlg.akariOutro, () => { refreshHUD(); save(); });
      } else onLose();
      refreshHUD();
    });
  }
  function startHoshigamiBattle() {
    Dialogue.play(Data.dlg.hoshigamiIntro, async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.hoshigami }],
        intro: 'ホシガミさま が 立ちはだかった！',
        hint: [
          'ホシガミさまは、明暗で弱点が変わる。',
          '明るい間は歯車が見える → 歯車チャージが弱点。暗くなると歯車が見えない → ふつうのこうげきが弱点。',
          'フェーズは2ターンごとに切り替わる。敵の表示をよく見て戦おう。'
        ]
      });
      if (res === 'win') {
        S.flags.boss3Done = true;
        S.hp = S.maxHp; // 番人像が鎮まり、ひと息ついた
        for (const n of World.map.npcs) { if (n.id === 'choro' || n.id === 'mio2') n.hidden = false; }
        Dialogue.play(Data.dlg.hoshigamiOutro, () => {
          S.hoshiba = 2;
          S.herbs += 2;
          Snd.pickup();
          refreshHUD();
          Dialogue.play(Data.dlg.lore3, () => {
            Dialogue.play(Data.dlg.festival3, () => {
              S.flags.cleared3 = true;
              S.playMs += Date.now() - S.startedAt;
              showClear3();
              save();
            });
          });
        });
      } else { S.flags.boss3Started = false; onLose(); }
      refreshHUD();
    });
  }
  function startBoss() {
    const pre = Data.dlg.bossPre.concat([{
      name: 'わるびー', text: '……選べよ、あおびー。どう出る？', face: 'warubee',
      choice: [
        { label: '「歯車を返せ！いますぐだ！」と強がる', then: Data.dlg.bossStrong },
        { label: '「半分でいいから…」と下手に出る', then: Data.dlg.bossWeak }
      ]
    }]);
    Dialogue.play(pre, async (choiceIdx) => {
      const strong = choiceIdx === 0;
      S.choice = strong ? 'strong' : 'weak';
      if (strong) S.guts = Math.min(100, S.guts + 25);
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.karakuri, weakMode: 'normal' }],
        intro: 'わるびー＆からくり人形 が 立ちはだかった！',
        firstStrike: strong ? 'enemy' : 'player',
        onMid: () => new Promise(res2 => Dialogue.play(Data.dlg.bossMid, res2))
      });
      if (res === 'win') {
        S.flags.bossDone = true;
        const wb = World.map.npcs.find(n => n.id === 'warubee');
        if (wb) wb.hidden = true;
        Dialogue.play(Data.dlg.bossOutro, () => ending());
      } else { S.flags.bossStarted = false; onLose(); }
      refreshHUD();
    });
  }
  function onLose() {
    S.losses++;
    S.hp = S.maxHp; S.guts = 0;
    if (S.chapter >= 3) {
      // 第3章の復活点は参道（ミオのところ）。ほし草も1つ分けてもらえる
      S.herbs += 1;
      curMap = 'approach';
      World.loadMap('approach', 10, 12, true);
      World.player.dir = 'up';
      setTimeout(() => Dialogue.play(Data.dlg.lose3, () => { refreshHUD(); save(); }), 200);
      return;
    }
    if (S.chapter >= 2) {
      // 第2章の復活点は牧場（みのりさんの家前）。ほし草のお茶で、ほし草も1つ分けてもらえる
      S.herbs += 1;
      curMap = 'ranch';
      World.loadMap('ranch', 3, 5, true);
      World.player.dir = 'up';
      setTimeout(() => Dialogue.play(Data.dlg.lose2, () => { refreshHUD(); save(); }), 200);
      return;
    }
    curMap = 'village';
    World.loadMap('village', 4, 5, true);
    World.player.dir = 'up';
    setTimeout(() => Dialogue.play(Data.dlg.lose, () => { refreshHUD(); save(); }), 200);
  }
  function ending() {
    S.flags.gearRestored = true;
    curMap = 'village';
    World.loadMap('village', 10, 8, true);
    World.player.dir = 'up';
    World.player.joyT = performance.now() + 2500;
    Snd.win();
    setTimeout(() => {
      Dialogue.play(Data.dlg.ending, () => {
        S.flags.cleared = true;
        S.playMs += Date.now() - S.startedAt;
        showClear();
        save();
      });
    }, 300);
  }
  function showClear() {
    const mins = Math.floor(S.playMs / 60000), secs = Math.floor((S.playMs % 60000) / 1000);
    $('clear-title').textContent = '第1章 クリア！';
    $('clear-stats').innerHTML =
      `プレイ時間： ${mins}分${secs}秒<br>` +
      `歯車の欠片： ${S.fragments}/4${S.fragments >= 4 ? '（コンプリート！）' : ''}<br>` +
      `対決前の態度： ${S.choice === 'strong' ? '強がった' : S.choice === 'weak' ? '下手に出た' : '—'}<br>` +
      `強がりで踏みとどまった回数： ${S.stats.gutsSaves}回<br>` +
      `たおれた回数： ${S.losses}回`;
    $('clear-next').innerHTML = '大歯車は戻った。でも、歯が1枚欠けたまま…。<br>わるびーは何を隠しているのか——第2章へつづく。';
    $('btn-to-ch2').style.display = '';
    $('btn-to-ch3').style.display = 'none';
    $('clear-link').style.display = 'none';
    $('clear-screen').classList.remove('hidden');
  }

  /* ---------- 第2章: 開始とエンディング ---------- */
  function startChapter2() {
    S.chapter = 2;
    S.flags.ch2Started = true;
    curMap = 'village';
    World.loadMap('village', 4, 5, true);
    World.player.dir = 'up';
    refreshHUD();
    Dialogue.play(Data.dlg.ch2GardoNotice, () => {
      S.flags.ch2Intro = true;
      refreshHUD(); save();
    });
  }
  function startEnding2() {
    S.hoshiba = 1;
    S.herbs += 2;
    refreshHUD();
    Snd.pickup();
    Dialogue.play(Data.dlg.minoriEnding, () => {
      S.flags.cleared2 = true;
      S.playMs += Date.now() - S.startedAt;
      showClear2();
      save();
    });
  }
  function showClear2() {
    const mins = Math.floor(S.playMs / 60000), secs = Math.floor((S.playMs % 60000) / 1000);
    $('clear-title').textContent = '第2章 クリア！';
    $('clear-stats').innerHTML =
      `プレイ時間（累計）： ${mins}分${secs}秒<br>` +
      `星歯： ${S.hoshiba}/7<br>` +
      `柵に戻した動物： ${S.animalsCaught}/5<br>` +
      `強がりで踏みとどまった回数： ${S.stats.gutsSaves}回<br>` +
      `たおれた回数： ${S.losses}回`;
    $('clear-next').innerHTML = '風車は元通り。でも、神殿の星時計も止まったらしい——。<br>星歯の謎を追って、第3章へつづく。';
    $('btn-to-ch2').style.display = 'none';
    $('btn-to-ch3').style.display = '';
    $('clear-link').style.display = '';
    $('clear-screen').classList.remove('hidden');
  }

  /* ---------- 第3章: 開始とエンディング ---------- */
  function startChapter3() {
    S.chapter = 3;
    S.flags.ch3Started = true;
    curMap = 'village';
    World.loadMap('village', 4, 5, true);
    World.player.dir = 'up';
    refreshHUD();
    Dialogue.play(Data.dlg.ch3Start, () => {
      S.flags.ch3Intro = true;
      refreshHUD(); save();
    });
  }
  function showClear3() {
    const mins = Math.floor(S.playMs / 60000), secs = Math.floor((S.playMs % 60000) / 1000);
    $('clear-title').textContent = '第3章 クリア！';
    $('clear-stats').innerHTML =
      `プレイ時間（累計）： ${mins}分${secs}秒<br>` +
      `星歯： ${S.hoshiba}/7<br>` +
      `灯した燭台： ${(S.flags.litCandles || []).length}/5<br>` +
      `強がりで踏みとどまった回数： ${S.stats.gutsSaves}回<br>` +
      `たおれた回数： ${S.losses}回`;
    $('clear-next').innerHTML = '星時計は動き出した。星歯は7枚、わるびーの目的は「空に浮かぶ塔」——。<br>次は港町。灯台の歯車が止まったらしい。第4章へつづく。';
    $('btn-to-ch2').style.display = 'none';
    $('btn-to-ch3').style.display = 'none';
    const link = $('clear-link');
    link.href = '../aobee_star_temple_portal.html';
    link.textContent = '元ネタの「星の神殿」で遊ぶ ↗';
    link.style.display = '';
    $('clear-screen').classList.remove('hidden');
  }

  /* ---------- タイトル ---------- */
  function beginGame(fromSave) {
    $('title-screen').classList.add('hidden');
    $('clear-screen').classList.add('hidden');
    $('hud').classList.remove('hidden');
    started = true;
    Snd.bgm('field');
    if (fromSave) {
      const sv = loadSave();
      const hadLevel = !!(sv && sv.S && typeof sv.S.level === 'number' && typeof sv.S.exp === 'number');
      S = Object.assign(freshState(), sv.S);
      if (!hadLevel) {
        // レベル制導入前の旧セーブ移行: 第2章到達済みなら Lv2、それ以外は Lv1
        if ((S.chapter || 1) >= 2 || S.flags.cleared || S.flags.bossDone) {
          S.level = 2; S.exp = 30; S.maxHp = 48; S.hp = 48;
        } else { S.level = 1; S.exp = 0; }
      }
      S.startedAt = Date.now(); S.playMs = S.playMs || 0;
      curMap = sv.map || 'village';
      Engine.start();
      if (S.flags.cleared && (S.chapter || 1) < 2) {
        // 第1章クリア済みの旧セーブ（chapterフィールドなし含む）は第2章の冒頭から開始
        startChapter2();
        return;
      }
      if (S.flags.cleared2 && (S.chapter || 1) < 3) {
        // 第2章クリア済みセーブは第3章の冒頭から開始
        startChapter3();
        return;
      }
      if (S.chapter >= 3 && !S.flags.ch3Intro) {
        // 第3章の知らせ会話の途中で閉じた場合の救済: もう一度流す
        startChapter3();
        return;
      }
      if (S.chapter >= 2 && !S.flags.ch2Intro) {
        // 第2章の知らせ会話の途中で閉じた場合の救済: もう一度流す
        startChapter2();
        return;
      }
      World.loadMap(curMap, sv.x != null ? sv.x : 10, sv.y != null ? sv.y : 11, true);
      refreshHUD();
      if (!S.flags.opening && curMap === 'village') {
        // オープニング途中で閉じた場合の救済: もう一度流す
        World.actors = [{ id: 'warubee', kind: 'warubee', x: 16, y: 1, visible: true }];
        setTimeout(() => {
          Dialogue.play(Data.dlg.opening, () => { S.flags.opening = true; World.actors = []; refreshHUD(); save(); });
        }, 500);
      }
    } else {
      wipeSave();
      S = freshState();
      curMap = 'village';
      Engine.start();
      World.loadMap('village', 10, 11, true);
      World.player.dir = 'down';
      refreshHUD();
      // オープニング: わるびーを屋根上に表示してから会話
      World.actors = [{ id: 'warubee', kind: 'warubee', x: 16, y: 1, visible: true }];
      Snd.gear();
      setTimeout(() => {
        Dialogue.play(Data.dlg.opening, () => {
          S.flags.opening = true;
          World.actors = [];
          refreshHUD(); save();
        });
      }, 500);
    }
  }

  World.hooks = { onStep, onInteract, onMapEnter, applyTiles, hooksState, SPOTS };
  window.addEventListener('beforeunload', () => { if (started) { S.playMs += Date.now() - S.startedAt; S.startedAt = Date.now(); save(); } });

  document.addEventListener('DOMContentLoaded', () => {
    const sv = loadSave();
    $('btn-continue').disabled = !(sv && sv.S && !sv.S.flags.cleared3);
    $('btn-new').addEventListener('click', () => beginGame(false));
    $('btn-continue').addEventListener('click', () => beginGame(true));
    $('btn-howto').addEventListener('click', () => { $('howto-screen').classList.remove('hidden'); });
    $('btn-howto-back').addEventListener('click', () => { $('howto-screen').classList.add('hidden'); });
    $('btn-clear-back').addEventListener('click', () => location.reload());
    $('btn-to-ch2').addEventListener('click', () => {
      $('clear-screen').classList.add('hidden');
      startChapter2();
    });
    $('btn-to-ch3').addEventListener('click', () => {
      $('clear-screen').classList.add('hidden');
      startChapter3();
    });
    // BGMミュート切替（状態は Snd 側で localStorage に保存される）
    const bgmBtn = $('btn-bgm');
    const paintBgm = () => bgmBtn.classList.toggle('off', Snd.bgmMuted());
    bgmBtn.addEventListener('click', () => { Snd.setBgmMuted(!Snd.bgmMuted()); paintBgm(); });
    paintBgm();
  });
})();
