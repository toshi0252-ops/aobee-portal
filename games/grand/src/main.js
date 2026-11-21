'use strict';
/* あおびーと失われた歯車 第1章 メイン: 状態管理・イベント進行・セーブ */
(() => {
  const { World, Dialogue, Snd } = Engine;
  const SAVE_PREFIX = 'aobeeGrandSaveV2_'; // スロット0=デバッグ専用、1〜3=通常セーブ。旧V1セーブは切り捨て（読まない）
  const slotKey = (n) => SAVE_PREFIX + n;
  let currentSlot = 1;
  const $ = (id) => document.getElementById(id);

  /* 画像の先読み（敵イラストは戦闘開始時に初めて読み込むと初回だけ1フレーム欠けるため） */
  const PRELOAD_SRCS = [
    'assets/chars/npc-gardo.png', 'assets/chars/npc-mami.png', 'assets/chars/npc-poco.png',
    'assets/chars/enemy-cog.png', 'assets/chars/enemy-guardian.png', 'assets/chars/enemy-karakuri.png',
    'assets/chars/npc-minori.png', 'assets/chars/enemy-kuwa.png', 'assets/chars/enemy-moguru.png',
    'assets/chars/animal-cow.png', 'assets/chars/animal-sheep.png', 'assets/chars/animal-chicken.png',
    'assets/chars/npc-mio.png', 'assets/chars/npc-choro.png', 'assets/chars/enemy-akari.png', 'assets/chars/enemy-hoshigami.png',
    'assets/chars/npc-jirou.png', 'assets/chars/enemy-torune.png', 'assets/chars/enemy-yuragi.png',
    'assets/chars/npc-ochiyo.png', 'assets/chars/npc-gen.png',
    'assets/chars/npc-genzou.png', 'assets/chars/npc-kaito.png', 'assets/chars/npc-tome.png', 'assets/chars/enemy-kani.png', 'assets/chars/enemy-tako.png', 'assets/fish-scene.jpg',
    'assets/warubee-front-v1.png',
    'assets/cut-warubee-roof.png'
  ];
  for (const src of PRELOAD_SRCS) { const im = new Image(); im.src = src; }

  function freshState() {
    return {
      hp: 40, maxHp: 40, herbs: 2, guts: 0,
      level: 1, exp: 0, // 簡易レベル制（上限5、最大HP = 40 + (Lv-1)×8）
      fragments: 0, losses: 0, playMs: 0, startedAt: Date.now(),
      flags: {}, // opening, boots, trailIntro, cogDone, millIntro, millGear, bridgeOpen, bossDone, cleared2
      talks: {}, // NPCごとの会話回数（2回目以降のセリフ出し分け用）
      picked: {}, // 'map:x,y' -> true
      choice: null, // 'strong' | 'weak'
      stats: { gutsSaves: 0 },
      chapter: 1, // 現在の章（14章プロット準拠の新番号: 村=1、水車小屋=2、牧場=3、風車=4、神殿編=5、神殿内部=6）
      hoshiba: 0, // 星歯の回収数（/7）
      animalsCaught: 0, capturedIds: [] // 第3章: 柵に戻した動物の数とID（捕獲順）
    };
  }
  let S = freshState();
  let curMap = 'village';
  let started = false;
  let visitDone = {}; // マップ滞在中のみ有効な雑魚の撃破記録（セーブしない）。マップ再入場で復活させ、レベリング可能にする

  /* ---------- セーブ ---------- */
  function save() {
    if (!started || S.flags.cleared2) { /* クリア後も記録は残す */ }
    try {
      localStorage.setItem(slotKey(currentSlot), JSON.stringify({
        S, map: curMap, x: World.player.gx, y: World.player.gy
      }));
    } catch (e) { /* 保存不可環境では無視 */ }
  }
  function loadSave(slot) {
    try { const raw = localStorage.getItem(slotKey(slot == null ? currentSlot : slot)); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function wipeSave() { try { localStorage.removeItem(slotKey(currentSlot)); } catch (e) {} }

  /* ---------- HUD ---------- */
  function objective() {
    const f = S.flags;
    if (S.chapter >= 8) {
      if (!f.ch8Intro) return '港町に着いた';
      if (!f.contestDone) return '桟橋で港の主と釣り勝負！（海に向かって糸を垂らそう）';
      if (!f.lighthouseKey) return '源造から灯台の鍵をもらおう';
      if (!f.takoDone) return '灯台を登って、タコぐるまを止めよう！';
      if (!f.ch8Done) return '桟橋の源造に報告しよう';
      return '第9章へつづく';
    }
    if (S.chapter >= 7) {
      if (!f.ch7Intro) return '港町に着いた';
      if (!f.trialQuest) return '桟橋の渡し守・源造に会おう（町の南から桟橋へ）';
      if (!f.fishDone) return `桟橋で小魚を釣ろう（${f.fishCount || 0}/3）`;
      if (!f.rumorGenzou) return '源造に釣果を見せよう';
      if (!f.hutChecked) return '灯台守の小屋を調べよう（西のはずれ・青い屋根の小屋）';
      if (!f.rumorTome || !f.rumorKaito) return '港の噂を集めよう（とめ・海斗）';
      if (!f.climaxDone) return '源造に報告しよう';
      return '第8章へつづく';
    }
    if (S.chapter >= 5) {
      if (!f.ch5Intro) return 'ガルドの話を聞こう';
      if (!f.mioMet) return '参道を登って、神殿の守り人ミオに会おう';
      if (!f.oilDone) {
        const dn = (f.dropCount || 0) + (f.oilItem ? 1 : 0);
        if (f.oilItem) return '星灯りの雫をミオに届けよう';
        if (f.oilQuest) return `星灯りの雫を集めよう（${dn}/4）`;
        return 'ミオにもう一度 話しかけよう';
      }
      if ((f.litCandles || []).length < 5) return `神殿の燭台を順に灯そう（${(f.litCandles || []).length}/5）`;
      if (!f.warubeeSeen5) return '星時計の間へ進もう';
      if (!f.boss3Done) return 'ホシガミさまを止めよう！';
      return '第7章へつづく';
    }
    if (S.chapter >= 3) {
      if (!f.ch3Intro) return 'ガルドの話を聞こう';
      if (!f.minoriMet) return '西の道を抜けて、星のしずく牧場へ行こう';
      if (!f.herdDone) return `逃げた動物を柵エリアに戻そう（${S.animalsCaught}/5）`;
      if (!f.brakeQuest && !f.brakeItem) return '牧場のみのりさんに話そう';
      if (!f.brakeItem) return '牧場の裏山でブレーキグリップを取り戻そう';
      if (!f.warubeeSeen) return '風車の丘へ 上ってみよう';
      if (!f.boss2Done) return '風車タワーのモーぐるマシンを止めよう！';
      if (!f.cleared4) return '牧場のみのりさんに報告しよう';
      return '第5章へつづく';
    }
    if (!f.opening) return '……';
    if (!f.boots) return '工房のガルドに話そう';
    if (!f.gearDone) {
      if (f.gearItem) return 'ガルドに丈夫な歯車を届けよう';
      if (f.gearQuest) return '村はずれの森の祠で、丈夫な歯車を取ってこよう';
      if (S.fragments >= 3) return '村長ダイジに話そう（村の南西の家）';
    }
    if (S.fragments < 3 && curMap !== 'mill') return `小道で歯車の欠片を集めよう（${S.fragments}/3）`;
    if (!f.millGear) return curMap === 'mill' ? '水車小屋で小歯車を回収しよう' : '南の出口から水車小屋へ進もう';
    if (!f.bridgeOpen && nestsCleared() < 3) return `水車のコグの巣を壊そう（${nestsCleared()}/3）`;
    if (!f.bridgeOpen) return '橋の仕掛けに小歯車をはめよう';
    if (!f.bossDone) return '橋を渡って わるびーを追い詰めよう！';
    return '村へ帰ろう';
  }
  function refreshHUD() {
    $('hud-obj').textContent = '⚙ ' + objective();
    $('hud-sub').textContent = (S.chapter >= 3 ? `星歯 ${S.hoshiba}/7 ・ ` : '') + `Lv${S.level || 1} ・ 欠片 ${S.fragments}/4 ・ ほし草 ${S.herbs} ・ HP ${Math.max(0, S.hp)}/${S.maxHp}`;
  }

  /* ---------- フック ---------- */
  const hooksState = () => ({
    boots: !!S.flags.boots,
    bridgeOpen: !!S.flags.bridgeOpen,
    gearRestored: !!S.flags.gearRestored,
    windmillFast: S.chapter >= 3 && !S.flags.boss2Done, // 第4章ボス停止までは風車が暴走回転
    boss2Ready: S.chapter >= 3 && !!S.flags.warubeeSeen && !S.flags.boss2Done && !S.flags.boss2Started, // 丘のボス発生マスに目印を出す条件
    templeLit: !!S.flags.boss3Done, // 第6章ボス撃破後は神殿の暗闇が晴れる
    clockRestored: !!S.flags.cleared6, // 星時計が復活したか（星時計の間の描画用）
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
    // 拡大版第3章: 星灯りのオイルがないと燭台は灯せない
    if (!S.flags.oilDone) { Dialogue.play(Data.dlg.candleNeedOil); return; }
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

  /* ---------- 拡大版第1章: 村はずれの森（見えるコグ・中ボス・薬草） ---------- */
  const FOREST_COGS = [
    { id: 'fcog1', x: 4, y: 4 },
    { id: 'fcog2', x: 13, y: 7 },
    { id: 'fcog3', x: 9, y: 9 }
  ];
  const HERB_SPOTS = [ { x: 4, y: 2 }, { x: 17, y: 3 }, { x: 10, y: 10 } ];

  /* ---------- 拡大版第2章: 牧場の裏山（見えるクワコグ・中ボス・鈴） ---------- */
  const URAYAMA_COGS = [
    { id: 'ukuwa1', x: 5, y: 8 },
    { id: 'ukuwa2', x: 13, y: 4 },
    { id: 'ukuwa3', x: 10, y: 10 }
  ];
  function spawnUrayama() {
    World.actors = URAYAMA_COGS.filter(c => !visitDone[c.id]).map(c => ({ id: c.id, kind: 'kuwa', x: c.x, y: c.y, visible: true }));
  }

  /* ---------- 拡大版第3章: 参道の見えるあかりコグ＋星灯りの雫スポット ---------- */
  const AKARI_SPOTS = [
    { id: 'aakari1', x: 4, y: 4 },
    { id: 'aakari2', x: 16, y: 9 },
    { id: 'aakari3', x: 7, y: 11 }
  ];
  const DROP_SPOTS = [
    { key: 'drop1', x: 3, y: 8 },
    { key: 'drop2', x: 17, y: 4 },
    { key: 'drop3', x: 12, y: 10 }
  ];
  /* ---------- 第7章: 桟橋の見えるカニコグ ---------- */
  const KANI_SPOTS = [
    { id: 'kani1', x: 15, y: 7 },
    { id: 'kani2', x: 17, y: 7 },
    { id: 'kani3', x: 9, y: 9 }
  ];
  function spawnPier() {
    World.actors = KANI_SPOTS.filter(c => !visitDone[c.id]).map(c => ({ id: c.id, kind: 'kani', x: c.x, y: c.y, visible: true }));
  }
  /* ---------- 第8章: 灯台内部の見えるうずコグ ---------- */
  const UZU_SPOTS = [
    { id: 'uzu1', x: 5, y: 11 },
    { id: 'uzu2', x: 14, y: 5 }
  ];
  function spawnLighthouse() {
    World.actors = UZU_SPOTS.filter(c => !visitDone[c.id]).map(c => ({ id: c.id, kind: 'uzu', x: c.x, y: c.y, visible: true }));
  }
  function spawnMinato() {
    // 壊れた自動魚獲り機の残骸（調べると spotWreck）
    World.actors = [{ id: 'wreck', kind: 'cog', x: 15, y: 11, visible: true }];
  }
  function spawnApproach() {
    World.actors = AKARI_SPOTS.filter(c => !visitDone[c.id]).map(c => ({ id: c.id, kind: 'akari', x: c.x, y: c.y, visible: true }));
  }
  function spawnForest() {
    World.actors = FOREST_COGS.filter(c => !visitDone[c.id]).map(c => ({ id: c.id, kind: 'cog', x: c.x, y: c.y, visible: true }));
    if (!S.flags.gearItem && !S.flags.gearDone) World.actors.push({ id: 'oocog', kind: 'oocog', x: 15, y: 3, visible: true });
  }

  function onStep(x, y, tile) {
    if (Battle.active || Dialogue.active) return;
    // 出入口
    const ex = World.map.exits.find(e => e.x === x && e.y === y);
    if (ex) {
      if (ex.gate === 'mill') {
        if (S.fragments < 3) {
          Dialogue.play([Data.L('あおびー', `まだ欠片が足りない……あと${3 - S.fragments}つ。落とした場所をもう一度探そう。`, 'aobee')]);
          World.player.gy -= 1; World.player.py = World.player.gy * Engine.TILE;
          return;
        }
        if (!S.flags.gearDone) {
          Dialogue.play(Data.dlg.gateGearMsg);
          pushBack(ex);
          return;
        }
      }
      if (ex.gate === 'ch3' && S.chapter < 3) {
        Dialogue.play(Data.dlg.gateCh3Msg);
        pushBack(ex);
        return;
      }
      if (ex.gate === 'herd' && !S.flags.herdDone) {
        Dialogue.play(Data.dlg.gateHerdMsg);
        pushBack(ex);
        return;
      }
      if (ex.gate === 'ch5' && S.chapter < 5) {
        Dialogue.play(Data.dlg.gateCh5Msg);
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
      if (ex.gate === 'lighthouse' && !S.flags.lighthouseKey) {
        Dialogue.play(Data.dlg.lighthouseGateMsg);
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
    // 第2章: ボスゾーン（風車タワー前）。拡大版第2章: 制御レバーのグリップがないとボス戦に入れない
    if (curMap === 'hill' && x === 10 && y === 3 && S.flags.warubeeSeen && !S.flags.boss2Done && !S.flags.boss2Started) {
      if (!S.flags.brakeItem) { Dialogue.play(Data.dlg.brakeNeed); return; }
      Dialogue.play(Data.dlg.brakeLever, () => { S.flags.boss2Started = true; if (S.chapter < 4) { S.chapter = 4; showChapterCard(4, () => startMoguruBattle()); } else startMoguruBattle(); });
      return;
    }
    // 拡大版第2章: 牧場の裏山（見えるクワコグ／トルネコグの巣／ジロウの鈴）
    if (curMap === 'urayama') {
      const ucog = URAYAMA_COGS.find(c => c.x === x && c.y === y && !visitDone[c.id]);
      if (ucog) { startUkuwaBattle(ucog); return; }
      if (x === 4 && y === 3 && !S.flags.brakeItem) { startToruneBattle(); return; }
      if (x === 16 && y === 11 && S.flags.bellQuest && !S.flags.bellItem && !S.flags.bellDone) {
        S.flags.bellItem = true;
        Snd.pickup();
        Dialogue.play(Data.dlg.bellFound, () => { refreshHUD(); save(); });
        return;
      }
    }
    // 拡大版第3章: 参道の見えるあかりコグ＋星灯りの雫スポット
    if (curMap === 'approach') {
      const ac = AKARI_SPOTS.find(c => c.x === x && c.y === y && !visitDone[c.id]);
      if (ac) { startAakariBattle(ac); return; }
      const dp = DROP_SPOTS.find(d => d.x === x && d.y === y);
      if (dp && S.flags.oilQuest && !S.flags[dp.key]) {
        S.flags[dp.key] = true;
        S.flags.dropCount = (S.flags.dropCount || 0) + 1;
        Snd.pickup();
        Dialogue.play([Data.L('', `星灯りの雫を拾った！（${S.flags.dropCount}/4）`)], () => { refreshHUD(); save(); });
        return;
      }
      // 拡大版第5章分: サブクエスト「ゲンさんの御朱印帳」（参道の上の方の光るスポット）
      if (x === 16 && y === 4 && S.flags.goshuinQuest && !S.flags.goshuinItem && !S.flags.goshuinDone) {
        S.flags.goshuinItem = true;
        Snd.pickup();
        Dialogue.play(Data.dlg.goshuinFound, () => { refreshHUD(); save(); });
        return;
      }
    }
    // 拡大版第3章: 油蔵の祠の中ボス「ゆらぎコグ」（雫の4つ目）
    if (curMap === 'oilshed' && x === 9 && y === 3 && S.flags.oilQuest && !S.flags.oilItem && !S.flags.oilDone) {
      startYuragiBattle();
      return;
    }
    // 拡大版第3章: サブクエスト「ミオのお守り」（神殿の暗闇・南東の隅）
    if (curMap === 'temple' && x === 17 && y === 11 && S.flags.charmQuest && !S.flags.charmItem && !S.flags.charmDone) {
      S.flags.charmItem = true;
      Snd.pickup();
      Dialogue.play(Data.dlg.charmFound, () => { refreshHUD(); save(); });
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
    if (curMap === 'clockroom' && x === 10 && y === 6 && S.flags.warubeeSeen5 && !S.flags.boss3Done && !S.flags.boss3Started) {
      S.flags.boss3Started = true;
      startHoshigamiBattle();
      return;
    }
    // 第7章: 海斗の流木集め（港町と桟橋の浜に3本）
    if ((curMap === 'minato' || curMap === 'pier') && S.flags.rodQuest && !S.flags.driftDone) {
      const isDrift = (curMap === 'minato' && x === 17 && y === 12) || (curMap === 'pier' && ((x === 2 && y === 2) || (x === 18 && y === 2)));
      const dkey = 'drift:' + curMap + ':' + x + ',' + y;
      if (isDrift && !S.flags[dkey]) {
        S.flags[dkey] = true;
        S.flags.driftCount = (S.flags.driftCount || 0) + 1;
        Snd.pickup();
        Dialogue.play([Data.L('', `流木を拾った！（${S.flags.driftCount}/3）`)], () => { refreshHUD(); save(); });
        return;
      }
    }
    // 拡大版第1章: 村はずれの森（見えるコグに触れると戦闘／祠前で中ボス／光る草で薬草集め）
    if (curMap === 'forest') {
      const fcog = FOREST_COGS.find(c => c.x === x && c.y === y && !visitDone[c.id]);
      if (fcog) { startMoriBattle(fcog); return; }
      if (x === 15 && y === 3 && !S.flags.gearItem && !S.flags.gearDone) { startOocogBattle(); return; }
      const herbSpot = HERB_SPOTS.find(h => h.x === x && h.y === y);
      if (herbSpot && S.flags.herbQuest && !S.flags.herbDone && !S.flags['herb:' + x + ',' + y]) {
        S.flags['herb:' + x + ',' + y] = true;
        S.flags.herbCount = (S.flags.herbCount || 0) + 1;
        Snd.pickup();
        Dialogue.play(Data.dlg.herbPickup, () => { refreshHUD(); save(); });
        return;
      }
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
    // 第8章ボスゾーン（灯室の装置の前）
    if (curMap === 'lamp' && !S.flags.takoDone && !S.flags.takoStarted && x >= 8 && x <= 11 && y >= 7 && y <= 8) {
      S.flags.takoStarted = true;
      startTakoEvent();
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
    if (w.mapId === 'lighthouse' && S.flags.gearDoorOpen) {
      // 開いた歯車扉を復元する
      if (w.tileAt(17, 3) === 'W') w.setTile(17, 3, '_');
      if (w.tileAt(18, 3) === 'W') w.setTile(18, 3, '_');
    }
    if (w.mapId === 'lamp' && S.flags.takoDone) {
      // 点灯した灯りの装置を復元する
      if (w.tileAt(9, 6) === 'C') w.setTile(9, 6, 'L');
      if (w.tileAt(10, 6) === 'C') w.setTile(10, 6, 'L');
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
      const chapterUp = S.chapter < 2;
      if (chapterUp) S.chapter = 2; // 第2章「水車小屋」開始
      if (!S.flags.millIntro) {
        S.flags.millIntro = true;
        if (chapterUp) showChapterCard(2, () => Dialogue.play(Data.dlg.millIntro));
        else setTimeout(() => Dialogue.play(Data.dlg.millIntro), 250);
      }
    }
    if (id === 'forest') spawnForest();
    if (id === 'urayama') spawnUrayama();
    if (id === 'approach') spawnApproach();
    if (id === 'minato') spawnMinato();
    if (id === 'pier') {
      spawnPier();
      // 第8章: タコぐるま撃破後に桟橋へ戻ると、締めのイベント（挑戦状の開示）
      if (S.flags.takoDone && !S.flags.ch8Done && S.chapter >= 8) {
        setTimeout(() => {
          if (curMap !== 'pier' || Battle.active || Dialogue.active) return;
          Dialogue.play(Data.dlg.pierFinale, () => { S.flags.ch8Done = true; S.playMs += Date.now() - S.startedAt; refreshHUD(); save(); showClear8(); });
        }, 400);
      }
    }
    if (id === 'lighthouse') spawnLighthouse();
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
      const chapterUp = S.chapter < 6;
      if (chapterUp) S.chapter = 6; // 第6章「神殿内部」開始
      S.flags.templeIntro = true;
      if (chapterUp) showChapterCard(6, () => Dialogue.play(Data.dlg.templeIntro));
      else setTimeout(() => Dialogue.play(Data.dlg.templeIntro), 250);
    }
    if (id === 'clockroom') {
      // 長老とミオはボス撃破後に姿を見せる
      for (const n of World.map.npcs) { if (n.id === 'choro' || n.id === 'mio2') n.hidden = !S.flags.boss3Done; }
      if (!S.flags.warubeeSeen5 && S.chapter >= 5) {
        // 初入室: わるびー目撃イベント（時計の前で鉢合わせ）
        World.actors = [{ id: 'warubee', kind: 'warubee', x: 10, y: 3, visible: true }];
        setTimeout(() => {
          Dialogue.play(Data.dlg.warubeeSpot5, () => {
            World.actors = [];
            S.flags.warubeeSeen5 = true;
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
    'monzen:4,2': 'spotPhoto', 'monzen:3,2': 'spotPhoto', 'monzen:5,2': 'spotPhoto',
    'monzen:9,2': 'spotMonzenShop', 'monzen:10,2': 'spotMonzenShop', 'monzen:11,2': 'spotMonzenShop',
    'monzen:3,10': 'spotMonzenInn', 'monzen:4,10': 'spotMonzenInn', 'monzen:5,10': 'spotMonzenInn',
    'lighthouse:2,0': 'spotRemnant', 'lighthouse:17,0': 'spotRecord',
    'lamp:9,6': 'spotLampAfter', 'lamp:10,6': 'spotLampAfter',
    'monzen:7,12': 'spotMonzenSign',
    'minato:7,2': 'spotMarket', 'minato:8,2': 'spotMarket', 'minato:9,2': 'spotMarket',
    'pier:18,1': 'spotPierSign',
    'temple:9,3': 'spotPillar', 'temple:10,3': 'spotPillar', 'temple:9,4': 'spotPillar', 'temple:10,4': 'spotPillar',
    'clockroom:3,4': 'spotCarving', 'clockroom:3,5': 'spotCarving', 'clockroom:16,4': 'spotCarving', 'clockroom:16,5': 'spotCarving'
  };

  function onInteract() {
    if (Battle.active || Dialogue.active) return;
    const f = World.frontTile();
    // 見える敵（コグ類）は、前に立って調べると戦闘開始。
    // 敵のいるマスには歩いて入れないため、従来の onStep 判定だけでは一生戦えなかった
    const actor = World.actors.find(a => a.visible && a.x === f.x && a.y === f.y);
    if (actor) {
      if (curMap === 'forest') {
        if (actor.kind === 'oocog' && !S.flags.gearItem && !S.flags.gearDone) { startOocogBattle(); return; }
        const fcog = FOREST_COGS.find(c => c.id === actor.id && !visitDone[c.id]);
        if (fcog) { startMoriBattle(fcog); return; }
      } else if (curMap === 'mill') {
        const nest = NESTS.find(n => n.id === actor.id && !S.flags[n.id]);
        if (nest) { startNestBattle(nest); return; }
      } else if (curMap === 'urayama') {
        const ucog = URAYAMA_COGS.find(c => c.id === actor.id && !visitDone[c.id]);
        if (ucog) { startUkuwaBattle(ucog); return; }
      } else if (curMap === 'approach') {
        const ac = AKARI_SPOTS.find(c => c.id === actor.id && !visitDone[c.id]);
        if (ac) { startAakariBattle(ac); return; }
      } else if (curMap === 'pier') {
        const kc = KANI_SPOTS.find(c => c.id === actor.id && !visitDone[c.id]);
        if (kc) { startKaniBattle(kc); return; }
      } else if (curMap === 'lighthouse') {
        const uc = UZU_SPOTS.find(c => c.id === actor.id && !visitDone[c.id]);
        if (uc) { startUzuBattle(uc); return; }
      } else if (curMap === 'minato') {
        if (actor.id === 'wreck') { Dialogue.play(Data.dlg.spotWreck); return; }
      }
    }
    const npc = World.map.npcs.find(n => !n.hidden && n.x === f.x && n.y === f.y);
    if (npc) {
      S.talks = S.talks || {};
      if (npc.id === 'gardo') {
        if (!S.flags.boots) {
          Dialogue.play(Data.dlg.gardoFirst, () => {
            S.flags.boots = true; S.herbs += 1;
            Snd.pickup(); refreshHUD(); save();
          });
        } else if (S.chapter >= 5) {
          Dialogue.play(Data.dlg.gardoCh5);
        } else if (S.chapter >= 3 && !S.flags.ch3Intro) {
          Dialogue.play(Data.dlg.ch3GardoNotice, () => { S.flags.ch3Intro = true; refreshHUD(); save(); });
        } else if (S.chapter >= 3) Dialogue.play(Data.dlg.gardoCh3);
        else if (!S.flags.gearDone && S.flags.gearItem) {
          Dialogue.play(Data.dlg.gardoGearGet, () => { S.flags.gearDone = true; Snd.gear(); refreshHUD(); save(); });
        }
        else if (!S.flags.gearDone && S.fragments >= 3) Dialogue.play(Data.dlg.gardoNeedGear);
        else if (S.flags.bossDone) Dialogue.play(Data.dlg.gardoBossDone);
        else if (S.fragments >= 3) Dialogue.play(Data.dlg.gardoFragmentsDone);
        else {
          const n = (S.talks.gardo = (S.talks.gardo || 0) + 1);
          if (n === 1) Dialogue.play(Data.dlg.gardoAfter);
          else Dialogue.play(Data.dlg.gardoChat[(n - 2) % Data.dlg.gardoChat.length]);
        }
      } else if (npc.id === 'baker') {
        if (S.flags.bossDone) Dialogue.play(Data.dlg.bakerBossDone);
        else if (S.flags.breadCarry) Dialogue.play(Data.dlg.breadHint);
        else if (S.flags.boots && (S.flags.gearQuest || S.flags.gearDone) && !S.flags.breadQuest && !S.flags.breadDone) {
          Dialogue.play(Data.dlg.breadOffer, () => { S.flags.breadQuest = true; S.flags.breadCarry = true; refreshHUD(); save(); });
        }
        else if (S.flags.breadDone && !S.flags.breadThanked) {
          Dialogue.play(Data.dlg.breadThanks, () => { S.flags.breadThanked = true; refreshHUD(); save(); });
        }
        else {
          const n = (S.talks.baker = (S.talks.baker || 0) + 1);
          if (n === 1) Dialogue.play(Data.dlg.baker);
          else Dialogue.play(Data.dlg.bakerChat[(n - 2) % Data.dlg.bakerChat.length]);
        }
      } else if (npc.id === 'mayor') {
        if (S.flags.breadCarry && !S.flags.breadDone) {
          Dialogue.play(Data.dlg.mayorBread, () => {
            S.flags.breadDone = true; S.flags.breadCarry = false; S.herbs += 1;
            Snd.pickup(); refreshHUD(); save();
          });
        }
        else if (!S.flags.boots) {
          const n = (S.talks.mayor = (S.talks.mayor || 0) + 1);
          Dialogue.play(Data.dlg.mayorChat[(n - 1) % Data.dlg.mayorChat.length]);
        }
        else if (!S.flags.gearQuest && !S.flags.gearDone) {
          if (S.flags.gearItem) Dialogue.play(Data.dlg.mayorHasGear, () => { S.flags.gearQuest = true; refreshHUD(); save(); });
          else Dialogue.play(Data.dlg.mayorFirst, () => { S.flags.gearQuest = true; refreshHUD(); save(); });
        }
        else if (S.flags.gearItem && !S.flags.gearDone) Dialogue.play(Data.dlg.mayorGearHint);
        else if (!S.flags.gearDone) Dialogue.play(Data.dlg.mayorQuestHint);
        else {
          const n = (S.talks.mayor = (S.talks.mayor || 0) + 1);
          Dialogue.play(Data.dlg.mayorChat[(n - 1) % Data.dlg.mayorChat.length]);
        }
      } else if (npc.id === 'herb') {
        // 薬屋ハル婆は回復スポット（話すたびに全回復）。初回で薬草集めの頼みごと
        const hurt = S.hp < S.maxHp;
        if (hurt) S.hp = S.maxHp;
        const withHeal = (lines, cb) => Dialogue.play(hurt ? Data.dlg.herbHeal.concat(lines) : lines, () => { refreshHUD(); save(); if (cb) cb(); });
        if (!S.flags.herbMet) {
          withHeal(Data.dlg.herbFirst, () => { S.flags.herbMet = true; S.flags.herbQuest = true; refreshHUD(); save(); });
        }
        else if (S.flags.herbQuest && !S.flags.herbDone && (S.flags.herbCount || 0) >= 3) {
          withHeal(Data.dlg.herbThanks, () => { S.flags.herbDone = true; S.herbs += 2; Snd.pickup(); refreshHUD(); save(); });
        }
        else if (S.flags.herbQuest && !S.flags.herbDone) withHeal(Data.dlg.herbHint);
        else if (S.flags.milkItem) {
          withHeal(Data.dlg.herbMilkThanks, () => { S.flags.milkItem = false; S.flags.milkDone = true; S.herbs += 2; Snd.pickup(); refreshHUD(); save(); });
        }
        else if (S.chapter >= 3 && S.flags.herbDone && !S.flags.milkQuest && !S.flags.milkDone) {
          withHeal(Data.dlg.herbMilkOffer, () => { S.flags.milkQuest = true; refreshHUD(); save(); });
        }
        else if (S.flags.milkQuest && !S.flags.milkDone) withHeal(Data.dlg.herbMilkHint);
        else {
          const n = (S.talks.herb = (S.talks.herb || 0) + 1);
          withHeal(Data.dlg.herbChat[(n - 1) % Data.dlg.herbChat.length]);
        }
      } else if (npc.id === 'postman') {
        const n = (S.talks.postman = (S.talks.postman || 0) + 1);
        Dialogue.play(Data.dlg.postChat[(n - 1) % Data.dlg.postChat.length]);
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
        if (S.flags.boss2Done && !S.flags.cleared4) {
          startEnding2();
        } else {
          // 回復スポット: みのりさんに話すたび、お茶でHP全回復（何度でも可）。段階会話の頭にお茶の一言を付ける
          S.hp = S.maxHp;
          const tea = [Data.L('みのりさん', 'お茶をどうぞ。ほし草のお茶よ。……はい、これで元気いっぱいのはず。', 'minori')];
          const withTea = (lines, cb) => Dialogue.play(tea.concat(lines), cb || (() => { refreshHUD(); save(); }));
          if (S.flags.cleared4) {
            const n = (S.talks.minori = (S.talks.minori || 0) + 1);
            if (n === 1) withTea(Data.dlg.minoriAfter2);
            else withTea(Data.dlg.minoriChat[(n - 2) % Data.dlg.minoriChat.length]);
          }
          else if (!S.flags.minoriMet) {
            withTea(Data.dlg.minoriFirst, () => { S.flags.minoriMet = true; refreshHUD(); save(); });
          } else if (!S.flags.herdDone) {
            withTea(Data.dlg.minoriHerd[Math.min(S.animalsCaught, 4)]);
          } else if (S.flags.brakeItem && !S.flags.brakeQuest) {
            withTea(Data.dlg.minoriBrakeEarly, () => { S.flags.brakeQuest = true; refreshHUD(); save(); });
          } else if (!S.flags.brakeQuest) {
            withTea(Data.dlg.minoriBrake, () => { S.flags.brakeQuest = true; refreshHUD(); save(); });
          } else if (S.flags.milkQuest && !S.flags.milkItem && !S.flags.milkDone) {
            withTea(Data.dlg.minoriMilk, () => { S.flags.milkItem = true; refreshHUD(); save(); });
          } else withTea(Data.dlg.minoriAfter);
        }
      }
      else if (npc.id === 'jirou') {
        if (S.flags.bellItem) {
          Dialogue.play(Data.dlg.jirouBellThanks, () => { S.flags.bellItem = false; S.flags.bellDone = true; S.herbs += 1; Snd.pickup(); refreshHUD(); save(); });
        }
        else if (!S.flags.jirouMet) {
          Dialogue.play(Data.dlg.jirouFirst, () => { S.flags.jirouMet = true; refreshHUD(); save(); });
        }
        else if (S.flags.brakeQuest && !S.flags.bellQuest && !S.flags.bellDone) {
          Dialogue.play(Data.dlg.jirouBellOffer, () => { S.flags.bellQuest = true; refreshHUD(); save(); });
        }
        else if (S.flags.bellQuest && !S.flags.bellDone) Dialogue.play(Data.dlg.jirouBellHint);
        else {
          const n = (S.talks.jirou = (S.talks.jirou || 0) + 1);
          Dialogue.play(Data.dlg.jirouChat[(n - 1) % Data.dlg.jirouChat.length]);
        }
      }
      else if (npc.id === 'ochiyo') {
        if (!S.flags.ochiyoMet) {
          Dialogue.play(Data.dlg.ochiyoFirst, () => { S.flags.ochiyoMet = true; refreshHUD(); save(); });
        } else {
          const n = (S.talks.ochiyo = (S.talks.ochiyo || 0) + 1);
          Dialogue.play(Data.dlg.ochiyoChat[(n - 1) % Data.dlg.ochiyoChat.length]);
        }
      }
      else if (npc.id === 'gen') {
        if (S.flags.goshuinItem) {
          Dialogue.play(Data.dlg.genThanks, () => { S.flags.goshuinItem = false; S.flags.goshuinDone = true; S.herbs += 1; Snd.pickup(); refreshHUD(); save(); });
        }
        else if (!S.flags.genMet) {
          Dialogue.play(Data.dlg.genFirst, () => { S.flags.genMet = true; S.flags.goshuinQuest = true; refreshHUD(); save(); });
        }
        else if (S.flags.goshuinQuest && !S.flags.goshuinDone) Dialogue.play(Data.dlg.genHint);
        else {
          const n = (S.talks.gen = (S.talks.gen || 0) + 1);
          Dialogue.play(Data.dlg.genChat[(n - 1) % Data.dlg.genChat.length]);
        }
      }
      else if (npc.id === 'tome') {
        if (!S.flags.tomeMet) {
          Dialogue.play(Data.dlg.tomeFirst, () => { S.flags.tomeMet = true; refreshHUD(); save(); });
        }
        else if (S.flags.fishDone && !S.flags.rumorTome) {
          Dialogue.play(Data.dlg.tomeRumor, () => { S.flags.rumorTome = true; refreshHUD(); save(); });
        }
        else if (S.flags.ch8Done) Dialogue.play(Data.dlg.tomeAfter8);
        else if (S.flags.rumorTome) Dialogue.play(Data.dlg.tomeAfter);
        else Dialogue.play(Data.dlg.tomeChat);
      }
      else if (npc.id === 'kaito') {
        if (!S.flags.kaitoMet) {
          Dialogue.play(Data.dlg.kaitoFirst, () => { S.flags.kaitoMet = true; S.flags.rodQuest = true; refreshHUD(); save(); });
        }
        else if (S.flags.rodQuest && !S.flags.driftDone && (S.flags.driftCount || 0) >= 3) {
          Dialogue.play(Data.dlg.kaitoRodDone, () => { S.flags.driftDone = true; refreshHUD(); save(); });
        }
        else if (S.flags.fishDone && !S.flags.rumorKaito) {
          Dialogue.play(Data.dlg.kaitoRumor, () => { S.flags.rumorKaito = true; refreshHUD(); save(); });
        }
        else if (S.flags.ch8Done) Dialogue.play(Data.dlg.kaitoAfter8);
        else if (S.flags.driftDone) Dialogue.play(Data.dlg.kaitoAfter);
        else Dialogue.play(Data.dlg.kaitoChat);
      }
      else if (npc.id === 'genzou') {
        const f7 = S.flags;
        if (S.chapter >= 8) {
          if (f7.ch8Done) Dialogue.play(Data.dlg.genzouAfter8);
          else if (f7.takoDone) Dialogue.play([Data.L('源造', '灯りが戻ったな！　桟橋の皆にも、顔を見せてやってくれ。', 'genzou')]);
          else if (f7.lighthouseKey) Dialogue.play(Data.dlg.genzouHint8);
          else if (f7.contestDone) Dialogue.play(Data.dlg.genzouKey, () => { f7.lighthouseKey = true; refreshHUD(); save(); });
          else Dialogue.play(Data.dlg.genzouContest);
        }
        else if (f7.climaxDone) Dialogue.play(Data.dlg.genzouAfter);
        else if (!f7.trialQuest) {
          Dialogue.play(Data.dlg.genzouFirst, () => { f7.trialQuest = true; refreshHUD(); save(); });
        }
        else if (!f7.fishDone) {
          Dialogue.play([Data.L('源造', `小魚を3匹だ。いま ${f7.fishCount || 0} 匹。桟橋の上で、海に向かって糸を垂らすんだ。`, 'genzou')]);
        }
        else if (!f7.rumorGenzou) {
          Dialogue.play(Data.dlg.genzouRumor, () => { f7.rumorGenzou = true; refreshHUD(); save(); });
        }
        else if (f7.hutChecked && f7.rumorTome && f7.rumorKaito) {
          Dialogue.play(Data.dlg.genzouClimax, () => { f7.climaxDone = true; f7.ch7Done = true; refreshHUD(); save(); showClear7(); });
        }
        else Dialogue.play(Data.dlg.genzouHint);
      }
      else if (npc.id === 'mio') {
        // ミオは参道の回復スポット（話すたびに全回復）。初回は出会いイベント
        if (!S.flags.mioMet) {
          Dialogue.play(Data.dlg.mioFirst, () => { S.flags.mioMet = true; S.hp = S.maxHp; refreshHUD(); save(); });
        } else {
          S.hp = S.maxHp;
          const withHeal = (lines, cb) => Dialogue.play(Data.dlg.mioHeal.concat(lines), () => { refreshHUD(); save(); if (cb) cb(); });
          if (S.flags.oilItem && !S.flags.oilDone) {
            withHeal(Data.dlg.mioOilThanks, () => { S.flags.oilItem = false; S.flags.oilDone = true; refreshHUD(); save(); });
          }
          else if (S.flags.charmItem) {
            withHeal(Data.dlg.mioCharmThanks, () => { S.flags.charmItem = false; S.flags.charmDone = true; S.herbs += 2; Snd.pickup(); refreshHUD(); save(); });
          }
          else if (!S.flags.oilQuest && !S.flags.oilDone) {
            withHeal(Data.dlg.mioOil, () => { S.flags.oilQuest = true; refreshHUD(); save(); });
          }
          else if (S.flags.oilQuest && !S.flags.oilDone) withHeal(Data.dlg.mioOilHint);
          else if (!S.flags.charmQuest && !S.flags.charmDone) {
            withHeal(Data.dlg.mioCharmOffer, () => { S.flags.charmQuest = true; refreshHUD(); save(); });
          }
          else if (S.flags.charmQuest && !S.flags.charmDone) withHeal(Data.dlg.mioCharmHint);
          else {
            const n = (S.talks.mio = (S.talks.mio || 0) + 1);
            const tail = n === 1 ? Data.dlg.mioAfter : Data.dlg.mioChat[(n - 2) % Data.dlg.mioChat.length];
            withHeal(tail);
          }
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
    // 第7章: 灯台守の小屋（通りの西の建物の正面）
    if (curMap === 'minato' && World.tileAt(f.x, f.y) === 'U') {
      if (!S.flags.trialQuest) Dialogue.play([Data.L('', '灯台守の小屋だ。……扉の鍵が、無理やり壊されている。')]);
      else if (!S.flags.hutChecked) Dialogue.play(Data.dlg.hutTrace, () => { S.flags.hutChecked = true; refreshHUD(); save(); });
      else Dialogue.play(Data.dlg.hutAfter);
      return;
    }
    // 調べるスポット（家具・大木・石柱・時計など）
    const spotKey = curMap + ':' + f.x + ',' + f.y;
    if (curMap === 'hill' && f.y === 2 && f.x >= 9 && f.x <= 11) { Dialogue.play(S.flags.cleared4 ? Data.dlg.spotWindmillAfter : Data.dlg.spotWindmill); return; }
    if (curMap === 'clockroom' && f.y === 1 && f.x >= 9 && f.x <= 11) { Dialogue.play(S.flags.cleared6 ? Data.dlg.spotClockAfter : Data.dlg.spotClock); return; }
    const spotDlg = SPOTS[spotKey];
    if (spotDlg) { Dialogue.play(Data.dlg[spotDlg]); return; }
    const t = World.tileAt(f.x, f.y);
    if (t === 'C') { tryLightCandle(f.x, f.y); return; }
    if (t === 'L') { Dialogue.play([Data.L('', 'もう灯っている。')]); return; }
    if (t === 'S') {
      if (curMap === 'lighthouse') pullLever();
      else Dialogue.play(curMap === 'road' ? Data.dlg.roadSign : curMap === 'approach' ? Data.dlg.approachSign : curMap === 'temple' ? Data.dlg.mural3 : Data.dlg.sign);
    }
    else if (t === '~' && curMap === 'pier') {
      if (S.chapter >= 8 && !S.flags.contestDone) {
        if (!S.flags.ch8Intro) {
          Dialogue.play([Data.L('あおびー', 'まずは源造の話を聞こう。', 'aobee')]);
        } else {
          Dialogue.play(Data.dlg.contestIntro, () => {
            Fishing.start(onContestResult, { zoneW: 14, speed: 2.9, msg: '大物だ！　マーカーが金色のゾーンに入ったら「ここだ！」' });
          });
        }
      } else if (!S.flags.trialQuest) {
        Dialogue.play([Data.L('あおびー', '釣り竿がないな。まずは桟橋の源造に話しかけよう。', 'aobee')]);
      } else {
        Fishing.start(onFishResult);
      }
    }
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
  /* 拡大版第1章: もりコグ戦（森の見える敵。再入場で復活） */
  function startMoriBattle(cog) {
    const begin = async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.mori }],
        intro: 'もりコグ が あらわれた！'
      });
      if (res === 'win') {
        visitDone[cog.id] = true;
        World.actors = World.actors.filter(a => a.id !== cog.id);
        refreshHUD(); save();
      } else onLose();
      refreshHUD();
    };
    if (S.flags.moriIntroSeen) begin();
    else { S.flags.moriIntroSeen = true; Dialogue.play(Data.dlg.moriIntro, begin); }
  }
  /* 拡大版第1章: 中ボス「オオコグ」戦（森の祠。勝つと丈夫な歯車） */
  function startOocogBattle() {
    Dialogue.play(Data.dlg.oocogIntro, async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.oocog }],
        intro: 'オオコグ が 祠を守っている！'
      });
      if (res === 'win') {
        S.flags.gearItem = true;
        World.actors = World.actors.filter(a => a.id !== 'oocog');
        Snd.pickup();
        Dialogue.play(Data.dlg.gearGet, () => { refreshHUD(); save(); });
      } else onLose();
      refreshHUD();
    });
  }
  /* 拡大版第2章: 裏山の見えるクワコグ戦（再入場で復活するレベリング相手） */
  async function startUkuwaBattle(cog) {
    const res = await Battle.start({
      state: S, enemies: [{ ...Data.enemies.kuwa }],
      intro: 'クワコグ が あらわれた！'
    });
    if (res === 'win') {
      visitDone[cog.id] = true;
      World.actors = World.actors.filter(a => a.id !== cog.id);
      refreshHUD(); save();
    } else onLose();
    refreshHUD();
  }
  /* 拡大版第2章: 中ボス「トルネコグ」戦（裏山の巣。勝つとブレーキグリップ） */
  function startToruneBattle() {
    Dialogue.play(Data.dlg.toruneIntro, async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.torune }],
        intro: 'トルネコグ が 宝物を守っている！'
      });
      if (res === 'win') {
        S.flags.brakeItem = true;
        Snd.pickup();
        Dialogue.play(Data.dlg.brakeGet, () => { refreshHUD(); save(); });
      } else onLose();
      refreshHUD();
    });
  }
  /* 第7章: 桟橋の見えるカニコグ戦（再入場で復活するレベリング相手） */
  async function startKaniBattle(cog) {
    const res = await Battle.start({
      state: S, enemies: [{ ...Data.enemies.kani }],
      intro: 'カニコグ が あらわれた！'
    });
    if (res === 'win') {
      visitDone[cog.id] = true;
      World.actors = World.actors.filter(a => a.id !== cog.id);
      refreshHUD(); save();
    } else onLose();
    refreshHUD();
  }

  /* 第7章: 釣り軽量版（タイミングバー。ゾーンで止めると釣れる） */
  const Fishing = {
    active: false, pos: 0, dir: 1, zoneStart: 55, zoneW: 18, speed: 2.2, timer: null, onDone: null,
    start(onDone, opts) {
      if (this.active) return;
      this.active = true; this.onDone = onDone || null;
      this.pos = 0; this.dir = 1;
      this.zoneW = (opts && opts.zoneW) || 18;
      this.speed = (opts && opts.speed) || 2.2;
      if (opts) this.zoneStart = 40 + Math.floor(Math.random() * (90 - this.zoneW - 40 + 1)); // 勝負用: 40%〜
      else this.zoneStart = 45 + Math.floor(Math.random() * 35); // 45〜79%
      const zone = $('fish-zone'), marker = $('fish-marker');
      zone.style.left = this.zoneStart + '%'; zone.style.width = this.zoneW + '%';
      marker.style.left = '0%';
      $('fish-msg').textContent = (opts && opts.msg) || 'マーカーが金色のゾーンに入ったら「ここだ！」';
      World.frozen = true;
      $('fish-screen').classList.remove('hidden');
      this.timer = setInterval(() => {
        this.pos += this.dir * this.speed;
        if (this.pos >= 100) { this.pos = 100; this.dir = -1; }
        if (this.pos <= 0) { this.pos = 0; this.dir = 1; }
        marker.style.left = this.pos + '%';
      }, 30);
    },
    stop() {
      if (!this.active) return;
      this.active = false;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      $('fish-screen').classList.add('hidden');
      World.frozen = false;
      const okF = this.pos >= this.zoneStart && this.pos <= this.zoneStart + this.zoneW;
      const cb = this.onDone; this.onDone = null;
      if (cb) cb(okF);
    }
  };
  window.__grandFishing = Fishing; // 状態遷移テスト用ハンドル
  function onFishResult(okF) {
    if (okF) {
      Snd.pickup();
      if (!S.flags.fishDone) {
        S.flags.fishCount = (S.flags.fishCount || 0) + 1;
        const lines = [Data.L('', `小魚を釣り上げた！（${S.flags.fishCount}/3）`)];
        if (S.flags.fishCount >= 3) {
          S.flags.fishDone = true;
          lines.push(Data.L('あおびー', '3匹目！　これで源造に見せられる。', 'aobee'));
        }
        Dialogue.play(lines, () => { refreshHUD(); save(); });
      } else {
        Dialogue.play([Data.L('', '小魚を釣り上げた！　……試練の分は、もう十分釣った。')]);
      }
    } else {
      Dialogue.play([Data.L('', '魚は逃げてしまった……。マーカーを金色のゾーンで止めよう。')]);
    }
  }

  /* 第8章: 港の主との釣り勝負（成功で囮の正体が判明する） */
  function onContestResult(okF) {
    if (okF) {
      Snd.pickup();
      Dialogue.play(Data.dlg.contestWin, () => { S.flags.contestDone = true; refreshHUD(); save(); });
    } else {
      Dialogue.play([Data.L('', '大物は逃げてしまった……。もう一度、糸を垂らそう。')]);
    }
  }

  /* 第8章: 灯台内部の見えるうずコグ戦（再入場で復活するレベリング相手） */
  async function startUzuBattle(cog) {
    const res = await Battle.start({
      state: S, enemies: [{ ...Data.enemies.uzu }],
      intro: 'うずコグ が あらわれた！'
    });
    if (res === 'win') {
      visitDone[cog.id] = true;
      World.actors = World.actors.filter(a => a.id !== cog.id);
      refreshHUD(); save();
    } else onLose();
    refreshHUD();
  }

  /* 第8章: 灯台の歯車扉レバー */
  function pullLever() {
    if (S.flags.gearDoorOpen) { Dialogue.play([Data.L('', 'レバーはもう引いてある。歯車扉は開いている。')]); return; }
    S.flags.gearDoorOpen = true; Snd.gear();
    World.setTile(17, 3, '_'); World.setTile(18, 3, '_');
    Dialogue.play([Data.L('', 'レバーを引いた！　ガコン、と大きな音がして、東の歯車扉が開いた。')], () => { refreshHUD(); save(); });
  }

  /* 第8章ボス: タコぐるま戦（背びれの歯車＋墨の複合フェーズ） */
  function startTakoEvent() {
    const intro = S.flags.driftDone ? Data.dlg.takoIntroHint : Data.dlg.takoIntroPlain;
    Dialogue.play(intro, async () => {
      const phase = S.flags.driftDone ? 'gear' : 'ink';
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.tako, phase, weakMode: phase === 'gear' ? 'gear' : 'ink' }],
        intro: 'タコぐるま が 灯りの装置に巻きついている！',
        hint: [
          '背びれの歯車が急所だ。墨フェーズでは目がかすんで、こうげきが半減する。',
          '背びれフェーズに「歯車チャージ→こうげき」を当てると、歯車が1つ外れる。3つ外せば本体がむき出しだ！',
          '墨の間は、歯車チャージや ほし草で立て直すのがおすすめ。'
        ]
      });
      if (res === 'win') {
        S.hoshiba = 3;
        S.flags.takoDone = true;
        World.setTile(9, 6, 'L'); World.setTile(10, 6, 'L');
        Snd.pickup();
        Dialogue.play(Data.dlg.takoWin, () => { refreshHUD(); save(); });
      } else {
        S.flags.takoStarted = false; // 敗北したら灯室に入り直して再挑戦できる
        onLose();
      }
      refreshHUD();
    });
  }

  /* 拡大版第3章: 参道の見えるあかりコグ戦（再入場で復活するレベリング相手） */
  async function startAakariBattle(cog) {
    const res = await Battle.start({
      state: S, enemies: [{ ...Data.enemies.akari }],
      intro: 'あかりコグ が あらわれた！'
    });
    if (res === 'win') {
      visitDone[cog.id] = true;
      World.actors = World.actors.filter(a => a.id !== cog.id);
      refreshHUD(); save();
    } else onLose();
    refreshHUD();
  }
  /* 拡大版第3章: 中ボス「ゆらぎコグ」戦（油蔵の祠。勝つと星灯りの雫4つ目） */
  function startYuragiBattle() {
    Dialogue.play(Data.dlg.yuragiIntro, async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.yuragi }],
        intro: 'ゆらぎコグ が ゆらめいている！',
        hint: [
          'ゆらぎコグは、明るいときは歯車が弱点、暗いときは ふつうのこうげきが弱点だ。',
          'ホシガミさまと同じ仕組み。明暗が切り替わるタイミングを見極めよう。'
        ]
      });
      if (res === 'win') {
        S.flags.oilItem = true;
        Snd.pickup();
        Dialogue.play(Data.dlg.oilGet, () => { refreshHUD(); save(); });
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
              S.flags.cleared6 = true;
              S.playMs += Date.now() - S.startedAt;
              showClear6();
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
    if (S.chapter >= 7) {
      // 第7・8章の復活点は港町（源造のところ）。ほし草のお茶で、ほし草も1つ分けてもらえる
      S.herbs += 1;
      curMap = 'minato';
      World.loadMap('minato', 10, 12, true);
      World.player.dir = 'up';
      setTimeout(() => Dialogue.play(Data.dlg.loseMinato, () => { refreshHUD(); save(); }), 200);
      return;
    }
    if (S.chapter >= 5) {
      // 第5・6章の復活点は参道（ミオのところ）。ほし草も1つ分けてもらえる
      S.herbs += 1;
      curMap = 'approach';
      World.loadMap('approach', 10, 12, true);
      World.player.dir = 'up';
      setTimeout(() => Dialogue.play(Data.dlg.loseApproach, () => { refreshHUD(); save(); }), 200);
      return;
    }
    if (S.chapter >= 3) {
      // 第3・4章の復活点は牧場（みのりさんの家前）。ほし草のお茶で、ほし草も1つ分けてもらえる
      S.herbs += 1;
      curMap = 'ranch';
      World.loadMap('ranch', 3, 5, true);
      World.player.dir = 'up';
      setTimeout(() => Dialogue.play(Data.dlg.loseRanch, () => { refreshHUD(); save(); }), 200);
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
        S.flags.cleared2 = true;
        S.playMs += Date.now() - S.startedAt;
        showClear2();
        save();
      });
    }, 300);
  }
  function showClear2() {
    const mins = Math.floor(S.playMs / 60000), secs = Math.floor((S.playMs % 60000) / 1000);
    $('clear-title').textContent = '第2章 クリア！';
    $('clear-stats').innerHTML =
      `プレイ時間： ${mins}分${secs}秒<br>` +
      `歯車の欠片： ${S.fragments}/4${S.fragments >= 4 ? '（コンプリート！）' : ''}<br>` +
      `対決前の態度： ${S.choice === 'strong' ? '強がった' : S.choice === 'weak' ? '下手に出た' : '—'}<br>` +
      `強がりで踏みとどまった回数： ${S.stats.gutsSaves}回<br>` +
      `たおれた回数： ${S.losses}回`;
    $('clear-next').innerHTML = '大歯車は戻った。でも、歯が1枚欠けたまま…。<br>わるびーは何を隠しているのか——第3章へつづく。';
    $('btn-to-ch3').style.display = '';
    $('btn-to-ch5').style.display = 'none';
    $('btn-to-ch7').style.display = 'none';
    $('btn-to-ch8').style.display = 'none';
    $('clear-link').style.display = 'none';
    $('clear-screen').classList.remove('hidden');
  }

  /* ---------- 章タイトルカード ---------- */
  const CHAPTER_TITLES = { 1: 'はぐるま村の異変', 2: '水車小屋の対決', 3: 'まきばの集落', 4: '暴走！ 大風車', 5: '神殿門前町', 6: '星の神殿と止まった時計', 7: '港町と灯台守', 8: '灯台と大ダコ騒動' };
  let chapterCardTimer = null;
  // 章が切り替わる瞬間にタイトルカードを出す（約1.75秒、ワールドは停止してから done へ）
  function showChapterCard(n, done) {
    const card = $('chapter-card');
    if (!card || !CHAPTER_TITLES[n]) { if (done) done(); return; }
    $('chapter-card-num').textContent = `第${n}章`;
    $('chapter-card-title').textContent = CHAPTER_TITLES[n];
    card.classList.remove('hidden');
    requestAnimationFrame(() => card.classList.add('show'));
    World.frozen = true;
    if (chapterCardTimer) clearTimeout(chapterCardTimer);
    chapterCardTimer = setTimeout(() => {
      chapterCardTimer = null;
      card.classList.remove('show');
      card.classList.add('hidden');
      World.frozen = false;
      if (done) done();
    }, 1750);
  }

  /* ---------- 第3章: 開始とエンディング ---------- */
  function startChapter3() {
    S.chapter = 3;
    S.flags.ch3Started = true;
    curMap = 'village';
    World.loadMap('village', 4, 5, true);
    World.player.dir = 'up';
    refreshHUD();
    showChapterCard(3, () => {
      Dialogue.play(Data.dlg.ch3GardoNotice, () => {
        S.flags.ch3Intro = true;
        refreshHUD(); save();
      });
    });
  }
  function startEnding2() {
    S.hoshiba = 1;
    S.herbs += 2;
    refreshHUD();
    Snd.pickup();
    Dialogue.play(Data.dlg.minoriEnding, () => {
      S.flags.cleared4 = true;
      S.playMs += Date.now() - S.startedAt;
      showClear4();
      save();
    });
  }
  function showClear4() {
    const mins = Math.floor(S.playMs / 60000), secs = Math.floor((S.playMs % 60000) / 1000);
    $('clear-title').textContent = '第4章 クリア！';
    $('clear-stats').innerHTML =
      `プレイ時間（累計）： ${mins}分${secs}秒<br>` +
      `星歯： ${S.hoshiba}/7<br>` +
      `柵に戻した動物： ${S.animalsCaught}/5<br>` +
      `強がりで踏みとどまった回数： ${S.stats.gutsSaves}回<br>` +
      `たおれた回数： ${S.losses}回`;
    $('clear-next').innerHTML = '風車は元通り。でも、神殿の星時計も止まったらしい——。<br>星歯の謎を追って、第5章へつづく。';
    $('btn-to-ch3').style.display = 'none';
    $('btn-to-ch5').style.display = '';
    $('btn-to-ch7').style.display = 'none';
    $('btn-to-ch8').style.display = 'none';
    $('clear-link').style.display = '';
    $('clear-screen').classList.remove('hidden');
  }

  /* ---------- 第5章: 開始 ---------- */
  function startChapter5() {
    S.chapter = 5;
    S.flags.ch5Started = true;
    curMap = 'village';
    World.loadMap('village', 4, 5, true);
    World.player.dir = 'up';
    refreshHUD();
    showChapterCard(5, () => {
      Dialogue.play(Data.dlg.ch5Start, () => {
        S.flags.ch5Intro = true;
        refreshHUD(); save();
      });
    });
  }
  function showClear6() {
    const mins = Math.floor(S.playMs / 60000), secs = Math.floor((S.playMs % 60000) / 1000);
    $('clear-title').textContent = '第6章 クリア！';
    $('clear-stats').innerHTML =
      `プレイ時間（累計）： ${mins}分${secs}秒<br>` +
      `星歯： ${S.hoshiba}/7<br>` +
      `灯した燭台： ${(S.flags.litCandles || []).length}/5<br>` +
      `強がりで踏みとどまった回数： ${S.stats.gutsSaves}回<br>` +
      `たおれた回数： ${S.losses}回`;
    $('clear-next').innerHTML = '星時計は動き出した。星歯は7枚、わるびーの目的は「空に浮かぶ塔」——。<br>次は港町。灯台の歯車が止まったらしい。第7章へつづく。';
    $('btn-to-ch3').style.display = 'none';
    $('btn-to-ch5').style.display = 'none';
    $('btn-to-ch7').style.display = '';
    const link = $('clear-link');
    link.href = '../aobee_star_temple_portal.html';
    link.textContent = '元ネタの「星の神殿」で遊ぶ ↗';
    link.style.display = '';
    $('clear-screen').classList.remove('hidden');
  }

  /* ---------- 第7章: 開始 ---------- */
  function startChapter7() {
    S.chapter = 7;
    S.flags.ch7Started = true;
    curMap = 'minato';
    World.loadMap('minato', 10, 12, true);
    World.player.dir = 'up';
    refreshHUD();
    showChapterCard(7, () => {
      Dialogue.play(Data.dlg.ch7Start, () => {
        S.flags.ch7Intro = true;
        refreshHUD(); save();
      });
    });
  }
  function showClear7() {
    const mins = Math.floor(S.playMs / 60000), secs = Math.floor((S.playMs % 60000) / 1000);
    $('clear-title').textContent = '第7章 クリア！';
    $('clear-stats').innerHTML =
      `プレイ時間（累計）： ${mins}分${secs}秒<br>` +
      `星歯： ${S.hoshiba}/7<br>` +
      `釣った小魚： ${S.flags.fishCount || 0}匹<br>` +
      `強がりで踏みとどまった回数： ${S.stats.gutsSaves}回<br>` +
      `たおれた回数： ${S.losses}回`;
    $('clear-next').innerHTML = '港の主が姿を現した。わるびーの挑戦状も届いた——。<br>灯台での決戦は、第8章「灯台と大ダコ騒動」へつづく。';
    $('btn-to-ch3').style.display = 'none';
    $('btn-to-ch5').style.display = 'none';
    $('btn-to-ch7').style.display = 'none';
    $('btn-to-ch8').style.display = 'none';
    $('btn-to-ch8').style.display = '';
    const link = $('clear-link');
    link.href = '../aobee_pico_fishing_v68_portal.html';
    link.textContent = '元ネタの「あおびーの釣り」で遊ぶ ↗';
    link.style.display = '';
    $('clear-screen').classList.remove('hidden');
  }

  /* ---------- 第8章: 開始とエンディング ---------- */
  function startChapter8() {
    S.chapter = 8;
    S.flags.ch8Started = true;
    curMap = 'minato';
    World.loadMap('minato', 10, 12, true);
    World.player.dir = 'up';
    refreshHUD();
    showChapterCard(8, () => {
      Dialogue.play(Data.dlg.ch8Start, () => {
        S.flags.ch8Intro = true;
        refreshHUD(); save();
      });
    });
  }
  function showClear8() {
    const mins = Math.floor(S.playMs / 60000), secs = Math.floor((S.playMs % 60000) / 1000);
    $('clear-title').textContent = '第8章 クリア！';
    $('clear-stats').innerHTML =
      `プレイ時間（累計）： ${mins}分${secs}秒<br>` +
      `星歯： ${S.hoshiba}/7<br>` +
      `レベル： Lv${S.level || 1}（上限は Lv8 に上昇）<br>` +
      `強がりで踏みとどまった回数： ${S.stats.gutsSaves}回<br>` +
      `たおれた回数： ${S.losses}回`;
    $('clear-next').innerHTML = '灯台に灯りが戻り、船が出せるようになった。<br>挑戦状の行き先は「歯車サーキット」——第9章へつづく。';
    $('btn-to-ch3').style.display = 'none';
    $('btn-to-ch5').style.display = 'none';
    $('btn-to-ch7').style.display = 'none';
    $('btn-to-ch8').style.display = 'none';
    $('btn-to-ch8').style.display = 'none';
    $('clear-link').style.display = 'none';
    $('clear-screen').classList.remove('hidden');
  }

  /* ---------- タイトル ---------- */
  /* ---------- フィールドメニュー（Bボタン／Xキー） ---------- */
  let menuOpen = false;
  function renderMenu() {
    $('menu-status').textContent = `第${S.chapter}章 ・ Lv${S.level} ・ HP ${S.hp}/${S.maxHp} ・ ほし草 ${S.herbs} ・ 星歯 ${S.hoshiba}/7`;
    const hb = $('btn-menu-herb');
    hb.textContent = `ほし草をつかう（HP 20 かいふく）`;
    hb.disabled = S.herbs <= 0 || S.hp >= S.maxHp;
    $('menu-note').textContent = '';
  }
  function openMenu() {
    menuOpen = true;
    World.frozen = true;
    renderMenu();
    $('menu-screen').classList.remove('hidden');
  }
  function closeMenu() {
    menuOpen = false;
    World.frozen = false;
    $('menu-screen').classList.add('hidden');
  }
  function onMenuKey() {
    if (!started || Battle.active || Dialogue.active) return;
    if (menuOpen) closeMenu(); else openMenu();
  }

  function beginGame(fromSave, slot) {
    currentSlot = slot == null ? 1 : slot;
    $('title-screen').classList.add('hidden');
    $('slot-screen').classList.add('hidden');
    $('clear-screen').classList.add('hidden');
    $('hud').classList.remove('hidden');
    started = true;
    Snd.bgm('field');
    if (fromSave) {
      const sv = loadSave(currentSlot);
      S = Object.assign(freshState(), sv.S);
      S.startedAt = Date.now(); S.playMs = S.playMs || 0;
      curMap = sv.map || 'village';
      Engine.start();
      if (S.flags.cleared2 && (S.chapter || 1) < 3) {
        // 第2章クリア画面で閉じたセーブは第3章の冒頭から開始
        startChapter3();
        return;
      }
      if (S.flags.cleared4 && (S.chapter || 1) < 5) {
        // 第4章クリア画面で閉じたセーブは第5章の冒頭から開始
        startChapter5();
        return;
      }
      if (S.flags.cleared6 && (S.chapter || 1) < 7) {
        // 第6章クリア画面で閉じたセーブは第7章の冒頭から開始
        startChapter7();
        return;
      }
      if (S.flags.ch7Done && (S.chapter || 1) < 8) {
        // 第7章クリア画面で閉じたセーブは第8章の冒頭から開始
        startChapter8();
        return;
      }
      if (S.chapter >= 8 && !S.flags.ch8Intro) {
        // 第8章の到着会話の途中で閉じた場合の救済: もう一度流す
        startChapter8();
        return;
      }
      if (S.chapter >= 7 && !S.flags.ch7Intro) {
        // 第7章の到着会話の途中で閉じた場合の救済: もう一度流す
        startChapter7();
        return;
      }
      if (S.chapter >= 5 && !S.flags.ch5Intro) {
        // 第5章の知らせ会話の途中で閉じた場合の救済: もう一度流す
        startChapter5();
        return;
      }
      if (S.chapter >= 3 && S.chapter < 5 && !S.flags.ch3Intro) {
        // 第3章の知らせ会話の途中で閉じた場合の救済: もう一度流す
        startChapter3();
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
      showChapterCard(1, () => {
        Dialogue.play(Data.dlg.opening, () => {
          S.flags.opening = true;
          World.actors = [];
          refreshHUD(); save();
        });
      });
    }
  }

  /* ---------- セーブスロット選択 ---------- */
  let slotMode = 'load'; // 'new' | 'load'
  let armedSlot = 0; // 上書き確認中のスロット（0=なし）
  function slotSummary(sv) {
    if (!sv || !sv.S) return 'あき';
    const st = sv.S;
    const mins = Math.floor((st.playMs || 0) / 60000);
    return `第${st.chapter || 1}章 ・ Lv${st.level || 1} ・ 星歯 ${st.hoshiba || 0}/7 ・ ${mins}分`;
  }
  function renderSlots() {
    $('slot-title').textContent = slotMode === 'new' ? 'はじめから： スロットをえらぶ' : 'つづきから： スロットをえらぶ';
    for (let n = 1; n <= 3; n++) {
      const sv = loadSave(n);
      const btn = $('slot-' + n);
      const occupied = !!(sv && sv.S);
      if (slotMode === 'new' && occupied && armedSlot === n) {
        btn.textContent = `スロット${n}： 上書きしますか？（もう一度タップで決定）`;
        btn.disabled = false;
      } else {
        btn.textContent = `スロット${n}： ${slotSummary(sv)}`;
        btn.disabled = slotMode === 'load' && !occupied;
      }
    }
    $('slot-note').textContent = slotMode === 'new'
      ? 'あいているスロットですぐ始まります。埋まっているスロットは2回タップで上書きします。'
      : 'セーブのあるスロットを選んでください。';
  }
  function openSlots(mode) {
    slotMode = mode;
    armedSlot = 0;
    renderSlots();
    $('slot-screen').classList.remove('hidden');
  }
  function pickSlot(n) {
    const sv = loadSave(n);
    const occupied = !!(sv && sv.S);
    if (slotMode === 'load') {
      if (!occupied) return;
      beginGame(true, n);
      return;
    }
    if (occupied && armedSlot !== n) { armedSlot = n; renderSlots(); return; }
    beginGame(false, n);
  }

  /* ---------- デバッグ: 章の途中スタート（専用スロット0に保存） ---------- */
  const CH1_DONE_FLAGS = {
    opening: true, boots: true, trailIntro: true, cogDone: true, millIntro: true, millGear: true,
    bridgeOpen: true, bossDone: true, gearRestored: true, cleared2: true,
    mayorMet: true, gearQuest: true, gearDone: true, herbMet: true, herbQuest: true, herbDone: true, herbCount: 3
  };
  const RANCH_DONE_FLAGS = {
    ch3Started: true, ch3Intro: true, roadIntro: true, ranchIntro: true, minoriMet: true,
    herdDone: true, brakeQuest: true, brakeItem: true, hillIntro: true, warubeeSeen: true,
    boss2Done: true, cleared4: true
  };
  const TEMPLE_DONE_FLAGS = {
    ch5Started: true, ch5Intro: true, approachIntro: true, templeIntro: true, mioMet: true,
    oilQuest: true, oilDone: true, dropCount: 3, warubeeSeen5: true, boss3Done: true, cleared6: true,
    litCandles: ['3,3', '16,3', '3,10', '16,10', '10,6']
  };
  const ALL_ANIMALS = ['cow1', 'cow2', 'sheep1', 'sheep2', 'chicken1'];
  function presetState(over, flags) {
    const st = freshState();
    Object.assign(st, over);
    st.flags = Object.assign({}, flags);
    st.startedAt = Date.now();
    return st;
  }
  function startDebugChapter(n) {
    currentSlot = 0;
    $('title-screen').classList.add('hidden');
    $('slot-screen').classList.add('hidden');
    $('clear-screen').classList.add('hidden');
    $('hud').classList.remove('hidden');
    started = true;
    Snd.bgm('field');
    Engine.start();
    if (n === 1) {
      S = freshState();
      curMap = 'village';
      World.loadMap('village', 10, 11, true);
      World.player.dir = 'down';
      refreshHUD();
      World.actors = [{ id: 'warubee', kind: 'warubee', x: 16, y: 1, visible: true }];
      Snd.gear();
      showChapterCard(1, () => {
        Dialogue.play(Data.dlg.opening, () => { S.flags.opening = true; World.actors = []; refreshHUD(); save(); });
      });
      return;
    }
    if (n === 2) {
      // 水車小屋に入った直後（巣・小歯車・橋はこれから）
      S = presetState(
        { chapter: 2, level: 3, exp: 75, maxHp: 56, hp: 56, herbs: 4, fragments: 4 },
        { opening: true, boots: true, trailIntro: true, mayorMet: true, gearQuest: true, gearDone: true, herbMet: true, herbQuest: true, herbDone: true, herbCount: 3, millIntro: true }
      );
      S.picked = { 'trail:4,4': true, 'trail:2,8': true, 'trail:16,10': true, 'trail:11,11': true };
      curMap = 'mill';
      World.loadMap('mill', 2, 11, true);
      World.player.dir = 'up';
      refreshHUD(); save();
      showChapterCard(2);
      return;
    }
    if (n === 3) {
      S = presetState(
        { chapter: 3, level: 4, exp: 140, maxHp: 64, hp: 64, herbs: 4, fragments: 4 },
        { ...CH1_DONE_FLAGS }
      );
      startChapter3();
      save();
      return;
    }
    if (n === 4) {
      // 風車の丘のボス手前（ブレーキグリップ入手済み）
      S = presetState(
        { chapter: 4, level: 4, exp: 140, maxHp: 64, hp: 64, herbs: 5, fragments: 4, animalsCaught: 5, capturedIds: [...ALL_ANIMALS] },
        { ...CH1_DONE_FLAGS, ch3Started: true, ch3Intro: true, roadIntro: true, ranchIntro: true, minoriMet: true, herdDone: true, brakeQuest: true, brakeItem: true, hillIntro: true, warubeeSeen: true }
      );
      curMap = 'hill';
      World.loadMap('hill', 10, 5, true);
      World.player.dir = 'up';
      refreshHUD(); save();
      showChapterCard(4);
      return;
    }
    if (n === 5) {
      S = presetState(
        { chapter: 5, level: 5, exp: 230, maxHp: 72, hp: 72, herbs: 5, fragments: 4, hoshiba: 1, animalsCaught: 5, capturedIds: [...ALL_ANIMALS] },
        { ...CH1_DONE_FLAGS, ...RANCH_DONE_FLAGS }
      );
      startChapter5();
      save();
      return;
    }
    if (n === 7) {
      // 第7章: 港町に着いた直後（試練はこれから）
      S = presetState(
        { chapter: 7, level: 5, exp: 230, maxHp: 72, hp: 72, herbs: 6, fragments: 4, hoshiba: 2, animalsCaught: 5, capturedIds: [...ALL_ANIMALS] },
        { ...CH1_DONE_FLAGS, ...RANCH_DONE_FLAGS, ...TEMPLE_DONE_FLAGS }
      );
      startChapter7();
      save();
      return;
    }
    if (n === 8) {
      // 第8章: 港町に着いた直後（釣り勝負はこれから。第7章の流木サブも完了済みの想定）
      S = presetState(
        { chapter: 8, level: 5, exp: 230, maxHp: 72, hp: 72, herbs: 6, fragments: 4, hoshiba: 2, animalsCaught: 5, capturedIds: [...ALL_ANIMALS] },
        { ...CH1_DONE_FLAGS, ...RANCH_DONE_FLAGS, ...TEMPLE_DONE_FLAGS,
          ch7Started: true, ch7Intro: true, tomeMet: true, kaitoMet: true, rodQuest: true, driftCount: 3, driftDone: true,
          trialQuest: true, fishCount: 3, fishDone: true, rumorGenzou: true, hutChecked: true, rumorTome: true, rumorKaito: true,
          climaxDone: true, ch7Done: true }
      );
      startChapter8();
      save();
      return;
    }
    // 第6章: 神殿に入った直後（燭台はこれから）
    S = presetState(
      { chapter: 6, level: 5, exp: 230, maxHp: 72, hp: 72, herbs: 6, fragments: 4, hoshiba: 1, animalsCaught: 5, capturedIds: [...ALL_ANIMALS] },
      { ...CH1_DONE_FLAGS, ...RANCH_DONE_FLAGS, ch5Started: true, ch5Intro: true, approachIntro: true, mioMet: true, oilQuest: true, oilDone: true, dropCount: 3 }
    );
    curMap = 'temple';
    World.loadMap('temple', 10, 12, true);
    World.player.dir = 'up';
    refreshHUD(); save();
  }

  World.hooks = { onStep, onInteract, onMapEnter, applyTiles, hooksState, SPOTS, onMenuKey };
  window.addEventListener('beforeunload', () => { if (started) { S.playMs += Date.now() - S.startedAt; S.startedAt = Date.now(); save(); } });

  document.addEventListener('DOMContentLoaded', () => {
    const anySave = [1, 2, 3].some(n => { const sv = loadSave(n); return !!(sv && sv.S); });
    $('btn-continue').disabled = !anySave;
    $('btn-new').addEventListener('click', () => openSlots('new'));
    $('btn-continue').addEventListener('click', () => openSlots('load'));
    for (let n = 1; n <= 3; n++) $('slot-' + n).addEventListener('click', () => pickSlot(n));
    $('btn-slot-back').addEventListener('click', () => { $('slot-screen').classList.add('hidden'); });
    $('btn-menu-herb').addEventListener('click', () => {
      if (S.herbs <= 0 || S.hp >= S.maxHp) return;
      S.herbs--;
      const heal = Math.min(20, S.maxHp - S.hp);
      S.hp += heal;
      Snd.pickup();
      refreshHUD();
      save();
      renderMenu();
      $('menu-note').textContent = `ほし草をつかった。HPが ${heal} かいふく！`;
    });
    $('btn-menu-save').addEventListener('click', () => {
      save();
      $('menu-note').textContent = `スロット${currentSlot === 0 ? '（デバッグ枠）' : currentSlot} にセーブしました。`;
    });
    $('btn-menu-title').addEventListener('click', () => {
      save();
      try { location.reload(); } catch (e) { /* テスト環境などでは無視 */ }
    });
    $('btn-menu-close').addEventListener('click', () => closeMenu());
    for (let n = 1; n <= 8; n++) $('btn-dbg-' + n).addEventListener('click', () => startDebugChapter(n));
    $('btn-howto').addEventListener('click', () => { $('howto-screen').classList.remove('hidden'); });
    $('btn-howto-back').addEventListener('click', () => { $('howto-screen').classList.add('hidden'); });
    $('btn-clear-back').addEventListener('click', () => location.reload());
    $('btn-to-ch3').addEventListener('click', () => {
      $('clear-screen').classList.add('hidden');
      startChapter3();
    });
    $('btn-to-ch5').addEventListener('click', () => {
      $('clear-screen').classList.add('hidden');
      startChapter5();
    });
    $('btn-to-ch7').addEventListener('click', () => {
      $('clear-screen').classList.add('hidden');
      startChapter7();
    });
    $('btn-to-ch8').addEventListener('click', () => {
      $('clear-screen').classList.add('hidden');
      startChapter8();
    });
    $('btn-fish-stop').addEventListener('click', () => Fishing.stop());
    window.addEventListener('grand-tapa', () => { if (Fishing.active) Fishing.stop(); });
    // BGMミュート切替（状態は Snd 側で localStorage に保存される）
    const bgmBtn = $('btn-bgm');
    const paintBgm = () => bgmBtn.classList.toggle('off', Snd.bgmMuted());
    bgmBtn.addEventListener('click', () => { Snd.setBgmMuted(!Snd.bgmMuted()); paintBgm(); });
    paintBgm();
  });
})();
