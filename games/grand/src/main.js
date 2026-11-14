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
    'assets/warubee-front-v1.png'
  ];
  for (const src of PRELOAD_SRCS) { const im = new Image(); im.src = src; }

  function freshState() {
    return {
      hp: 40, maxHp: 40, herbs: 2, guts: 0,
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
    if (!f.bridgeOpen) return '橋の仕掛けに小歯車をはめよう';
    if (!f.bossDone) return '橋を渡って わるびーを追い詰めよう！';
    return '村へ帰ろう';
  }
  function refreshHUD() {
    $('hud-obj').textContent = '⚙ ' + objective();
    $('hud-sub').textContent = (S.chapter >= 2 ? `星歯 ${S.hoshiba}/7 ・ ` : '') + `欠片 ${S.fragments}/4 ・ ほし草 ${S.herbs} ・ HP ${Math.max(0, S.hp)}/${S.maxHp}`;
  }

  /* ---------- フック ---------- */
  const hooksState = () => ({
    boots: !!S.flags.boots,
    bridgeOpen: !!S.flags.bridgeOpen,
    gearRestored: !!S.flags.gearRestored,
    windmillFast: S.chapter >= 2 && !S.flags.boss2Done, // 第2章ボス停止までは風車が暴走回転
    boss2Ready: S.chapter >= 2 && !!S.flags.warubeeSeen && !S.flags.boss2Done && !S.flags.boss2Started // 丘のボス発生マスに目印を出す条件
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
          Dialogue.play(Data.dlg.minoriHerdDone, () => { S.herbs += 2; Snd.pickup(); refreshHUD(); save(); });
        }
      }
    }
  }
  function pushBack(ex) {
    const p = World.player;
    if (ex.y === 0) p.gy += 1; else if (ex.y === 13) p.gy -= 1;
    else if (ex.x === 0) p.gx += 1; else if (ex.x === 19) p.gx -= 1;
    p.px = p.gx * Engine.TILE; p.py = p.gy * Engine.TILE;
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
    if (curMap === 'trail' && y === 6 && !S.flags.cogDone) {
      startCogBattle();
      return;
    }
    // 第2章: クワコグ戦（まきばの道）
    if (curMap === 'road' && x === 9 && !S.flags.kuwaRoad) {
      startKuwaBattle('kuwaRoad');
      return;
    }
    // 第2章: クワコグ戦（牧場・南の畑付近）
    if (curMap === 'ranch' && x === 7 && y === 12 && !S.flags.kuwaRanch) {
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
    // 第2章: 動物誘導（牧場を歩くたびに隣接判定）
    if (curMap === 'ranch') herdStep();
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
  }

  function onMapEnter(id) {
    refreshHUD();
    if (started) save();
    if (id === 'trail' && !S.flags.trailIntro) {
      S.flags.trailIntro = true;
      setTimeout(() => Dialogue.play(Data.dlg.trailIntro), 250);
    }
    if (id === 'mill') {
      const wb = World.map.npcs.find(n => n.id === 'warubee');
      if (wb) wb.hidden = !!S.flags.bossDone;
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
  }

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
        } else if (S.chapter >= 2 && !S.flags.ch2Intro) {
          Dialogue.play(Data.dlg.ch2GardoNotice, () => { S.flags.ch2Intro = true; refreshHUD(); save(); });
        } else if (S.chapter >= 2) Dialogue.play(Data.dlg.gardoCh2);
        else if (S.flags.bossDone) Dialogue.play(Data.dlg.gardoBossDone);
        else if (S.fragments >= 3) Dialogue.play(Data.dlg.gardoFragmentsDone);
        else Dialogue.play(Data.dlg.gardoAfter);
      } else if (npc.id === 'baker') {
        if (S.flags.bossDone) Dialogue.play(Data.dlg.bakerBossDone);
        else {
          const n = (S.talks.baker = (S.talks.baker || 0) + 1);
          if (n === 1) Dialogue.play(Data.dlg.baker);
          else Dialogue.play(Data.dlg.bakerChat[(n - 2) % Data.dlg.bakerChat.length]);
        }
      } else if (npc.id === 'kid') {
        if (S.flags.bossDone) Dialogue.play(Data.dlg.kidBossDone);
        else {
          const n = (S.talks.kid = (S.talks.kid || 0) + 1);
          if (n === 1) Dialogue.play(Data.dlg.kid);
          else Dialogue.play(Data.dlg.kidChat[(n - 2) % Data.dlg.kidChat.length]);
        }
      }
      else if (npc.id === 'minori') {
        if (S.flags.boss2Done && !S.flags.cleared2) {
          startEnding2();
        } else if (S.flags.cleared2) Dialogue.play(Data.dlg.minoriAfter2);
        else if (!S.flags.minoriMet) {
          Dialogue.play(Data.dlg.minoriFirst, () => { S.flags.minoriMet = true; refreshHUD(); save(); });
        } else if (!S.flags.herdDone) {
          Dialogue.play(Data.dlg.minoriHerd[Math.min(S.animalsCaught, 4)]);
        } else Dialogue.play(Data.dlg.minoriAfter);
      }
      else if (npc.id === 'warubee' && curMap === 'mill' && !S.flags.bossDone && !S.flags.bossStarted) {
        S.flags.bossStarted = true; startBoss();
      }
      return;
    }
    const t = World.tileAt(f.x, f.y);
    if (t === 'S') Dialogue.play(curMap === 'road' ? Data.dlg.roadSign : Data.dlg.sign);
    else if (t === 'X') {
      if (!S.flags.millGear) Dialogue.play(Data.dlg.bridgeNoGear);
      else if (!S.flags.bridgeOpen) {
        S.flags.bridgeOpen = true; Snd.gear();
        Dialogue.play(Data.dlg.bridgeOpen, () => { refreshHUD(); save(); });
      }
    }
  }

  /* ---------- 戦闘 ---------- */
  async function startCogBattle() {
    Dialogue.play(Data.dlg.cogIntro, async () => {
      const res = await Battle.start({
        state: S, enemies: [{ ...Data.enemies.cog }],
        intro: 'サビつきコグ が あらわれた！', tutorial: true
      });
      if (res === 'win') {
        S.flags.cogDone = true;
        Dialogue.play(Data.dlg.cogOutro, () => { refreshHUD(); save(); });
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
        S.flags[flagKey] = true;
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
    $('clear-link').style.display = '';
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
      S = Object.assign(freshState(), sv.S);
      S.startedAt = Date.now(); S.playMs = S.playMs || 0;
      curMap = sv.map || 'village';
      Engine.start();
      if (S.flags.cleared && (S.chapter || 1) < 2) {
        // 第1章クリア済みの旧セーブ（chapterフィールドなし含む）は第2章の冒頭から開始
        startChapter2();
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

  World.hooks = { onStep, onInteract, onMapEnter, applyTiles, hooksState };
  window.addEventListener('beforeunload', () => { if (started) { S.playMs += Date.now() - S.startedAt; S.startedAt = Date.now(); save(); } });

  document.addEventListener('DOMContentLoaded', () => {
    const sv = loadSave();
    $('btn-continue').disabled = !(sv && sv.S && !sv.S.flags.cleared2);
    $('btn-new').addEventListener('click', () => beginGame(false));
    $('btn-continue').addEventListener('click', () => beginGame(true));
    $('btn-howto').addEventListener('click', () => { $('howto-screen').classList.remove('hidden'); });
    $('btn-howto-back').addEventListener('click', () => { $('howto-screen').classList.add('hidden'); });
    $('btn-clear-back').addEventListener('click', () => location.reload());
    $('btn-to-ch2').addEventListener('click', () => {
      $('clear-screen').classList.add('hidden');
      startChapter2();
    });
    // BGMミュート切替（状態は Snd 側で localStorage に保存される）
    const bgmBtn = $('btn-bgm');
    const paintBgm = () => bgmBtn.classList.toggle('off', Snd.bgmMuted());
    bgmBtn.addEventListener('click', () => { Snd.setBgmMuted(!Snd.bgmMuted()); paintBgm(); });
    paintBgm();
  });
})();
