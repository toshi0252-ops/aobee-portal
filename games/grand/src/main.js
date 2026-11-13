'use strict';
/* あおびーと失われた歯車 第1章 メイン: 状態管理・イベント進行・セーブ */
(() => {
  const { World, Dialogue, Snd } = Engine;
  const SAVE_KEY = 'aobeeGrandSaveV1';
  const $ = (id) => document.getElementById(id);

  function freshState() {
    return {
      hp: 40, maxHp: 40, herbs: 2, guts: 0,
      fragments: 0, losses: 0, playMs: 0, startedAt: Date.now(),
      flags: {}, // opening, boots, trailIntro, cogDone, millIntro, millGear, bridgeOpen, bossDone, cleared
      picked: {}, // 'map:x,y' -> true
      choice: null, // 'strong' | 'weak'
      stats: { gutsSaves: 0 }
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
    if (!f.opening) return '……';
    if (!f.boots) return '工房のガルドに話そう';
    if (!f.cogDone && S.fragments < 3 && curMap !== 'mill') return `小道で歯車の欠片を集めよう（${S.fragments}/3）`;
    if (!f.millGear) return curMap === 'mill' ? '水車小屋で小歯車を回収しよう' : '南の出口から水車小屋へ進もう';
    if (!f.bridgeOpen) return '橋の仕掛けに小歯車をはめよう';
    if (!f.bossDone) return '橋を渡って わるびーを追い詰めよう！';
    return '村へ帰ろう';
  }
  function refreshHUD() {
    $('hud-obj').textContent = '⚙ ' + objective();
    $('hud-sub').textContent = `欠片 ${S.fragments}/4 ・ ほし草 ${S.herbs} ・ HP ${Math.max(0, S.hp)}/${S.maxHp}`;
  }

  /* ---------- フック ---------- */
  const hooksState = () => ({
    boots: !!S.flags.boots,
    bridgeOpen: !!S.flags.bridgeOpen,
    gearRestored: !!S.flags.gearRestored
  });

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
    // 初戦闘ゾーン（小道6行目を横切る）※敗北時は工房に戻され、再入場で再挑戦できる
    if (curMap === 'trail' && y === 6 && !S.flags.cogDone) {
      startCogBattle();
      return;
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
      if (w.tileAt(x, y) === 'F') w.setTile(x, y, '.');
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
  }

  function onInteract() {
    if (Battle.active || Dialogue.active) return;
    const f = World.frontTile();
    const npc = World.map.npcs.find(n => !n.hidden && n.x === f.x && n.y === f.y);
    if (npc) {
      if (npc.id === 'gardo') {
        if (!S.flags.boots) {
          Dialogue.play(Data.dlg.gardoFirst, () => {
            S.flags.boots = true; S.herbs += 1;
            Snd.pickup(); refreshHUD(); save();
          });
        } else Dialogue.play(Data.dlg.gardoAfter);
      } else if (npc.id === 'baker') Dialogue.play(Data.dlg.baker);
      else if (npc.id === 'kid') Dialogue.play(Data.dlg.kid);
      else if (npc.id === 'warubee' && curMap === 'mill' && !S.flags.bossDone && !S.flags.bossStarted) {
        S.flags.bossStarted = true; startBoss();
      }
      return;
    }
    const t = World.tileAt(f.x, f.y);
    if (t === 'S') Dialogue.play(Data.dlg.sign);
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
        Dialogue.play(Data.dlg.millCogOutro, () => { refreshHUD(); save(); });
      } else onLose();
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
    $('clear-stats').innerHTML =
      `プレイ時間： ${mins}分${secs}秒<br>` +
      `歯車の欠片： ${S.fragments}/4${S.fragments >= 4 ? '（コンプリート！）' : ''}<br>` +
      `対決前の態度： ${S.choice === 'strong' ? '強がった' : S.choice === 'weak' ? '下手に出た' : '—'}<br>` +
      `強がりで踏みとどまった回数： ${S.stats.gutsSaves}回<br>` +
      `たおれた回数： ${S.losses}回`;
    $('clear-screen').classList.remove('hidden');
  }

  /* ---------- タイトル ---------- */
  function beginGame(fromSave) {
    $('title-screen').classList.add('hidden');
    $('clear-screen').classList.add('hidden');
    $('hud').classList.remove('hidden');
    started = true;
    if (fromSave) {
      const sv = loadSave();
      S = Object.assign(freshState(), sv.S);
      S.startedAt = Date.now(); S.playMs = S.playMs || 0;
      curMap = sv.map || 'village';
      Engine.start();
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
    $('btn-continue').disabled = !(sv && sv.S && !sv.S.flags.cleared);
    $('btn-new').addEventListener('click', () => beginGame(false));
    $('btn-continue').addEventListener('click', () => beginGame(true));
    $('btn-howto').addEventListener('click', () => { $('howto-screen').classList.remove('hidden'); });
    $('btn-howto-back').addEventListener('click', () => { $('howto-screen').classList.add('hidden'); });
    $('btn-clear-back').addEventListener('click', () => location.reload());
  });
})();
