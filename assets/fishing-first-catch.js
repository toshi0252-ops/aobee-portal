(() => {
  'use strict';
  // はじめてサポート（2026-11-08、Muse／遊戯監査P1「序盤の初回成功体験」対応）
  // 初キャッチまでの序盤だけ、待ち時間と失敗の壁を下げる。本体HTML（7.2MB）は無改造で、
  // fishing-idle-trial.js と同じ流儀（ラッパー側スクリプト → iframe 内へ小さなスクリプトを注入）で実装する。
  // 注入コードは本体側の既存の後付けレイヤー（FUN等）と同じく updateFish / end を包む。
  // 失敗時は無介入（従来動作のまま）。
  if (window.__fishingFirstCatch) return;
  window.__fishingFirstCatch = '1';

  // ↓↓↓ この関数は iframe 内（ゲーム側の realm）で実行される自己完結コード。
  // ゲーム側のグローバル（updateFish / end / fish / bait / state / catchCount /
  // tension / slack / fishingCastId / showToast）だけを参照し、外側の変数は使わないこと。
  function hajiPatch() {
    if (window.__hajiSupport) return;
    window.__hajiSupport = '1';
    var oldUpdateFish = updateFish;
    var oldEnd = end;
    var saveUsed = false;
    var castId = -1;
    var castAt = 0;

    updateFish = function (f, dt) {
      oldUpdateFish(f, dt);
      try {
        if (catchCount > 0) return;
        // 最初の魚は「離れた」にならない（寄り直して、必ずパクッとくる）
        if (f.mode === 'spook' && state === 'cast') { f.mode = 'approach'; f.timer = 0; }
        if (state !== 'cast' || !bait || !f.c || !(f.c.curious > 0)) return;
        if (castId !== fishingCastId) { castId = fishingCastId; castAt = performance.now(); }
        if (f.mode !== 'swim') return;
        var d = Math.hypot(f.x - bait.x, (f.y - bait.y) * 0.75);
        // 寄ってくる範囲と確率を上乗せ（本体側: d<18・curious*dt*0.9）
        if (d < 26 && Math.random() < f.c.curious * dt * 1.8) { f.mode = 'approach'; f.timer = 0; f.nibbles = 0; return; }
        // 7秒たってもどの魚も寄っていないキャストでは、いちばん近い魚が必ず寄ってくる
        if (performance.now() - castAt > 7000) {
          var busy = false, best = null, bd = 1e9, i, g, gd;
          for (i = 0; i < fish.length; i++) { if (fish[i].mode !== 'swim') { busy = true; break; } }
          if (!busy) {
            for (i = 0; i < fish.length; i++) {
              g = fish[i];
              if (g.c && g.c.curious > 0) {
                gd = Math.hypot(g.x - bait.x, (g.y - bait.y) * 0.75);
                if (gd < bd) { bd = gd; best = g; }
              }
            }
            if (best) { best.mode = 'approach'; best.timer = 0; best.nibbles = 0; }
          }
        }
      } catch (e) { /* アシスト失敗時は無介入 */ }
    };

    end = function (ok, why) {
      if (!ok && !saveUsed) {
        try {
          if (catchCount === 0 && state === 'fight') {
            // 最初のファイトだけ、糸切れ・逃げられを1回だけ肩代わりする
            saveUsed = true;
            tension = 62;
            slack = 62;
            if (typeof showToast === 'function') showToast('あぶない！でも糸は無事だった\n（はじめてサポート）');
            return;
          }
        } catch (e) { /* そのまま通常終了へ */ }
      }
      return oldEnd(ok, why);
    };
  }
  // ↑↑↑ ここまで iframe 内実行コード

  function install(win) {
    let doc;
    try { doc = win.document; } catch (e) { return; }
    if (!doc || !doc.documentElement) return;
    if (doc.documentElement.dataset.fishingFirstCatch === '1') return;

    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (tries > 200) { clearInterval(timer); return; } // 約10秒で諦める（無介入＝従来動作）
      let ready = false;
      try { ready = typeof win.updateFish === 'function' && typeof win.end === 'function'; } catch (e) { clearInterval(timer); return; }
      if (!ready) return;
      clearInterval(timer);
      doc.documentElement.dataset.fishingFirstCatch = '1';
      try {
        const sc = doc.createElement('script');
        sc.textContent = '(' + hajiPatch.toString() + ')();';
        doc.documentElement.appendChild(sc);
        sc.remove();
      } catch (e) { /* 無介入 */ }
    }, 50);
  }

  function bind() {
    const frame = document.getElementById('gameFrame');
    if (!frame) return;
    const attach = () => { try { install(frame.contentWindow); } catch (e) { /* 無介入 */ } };
    frame.addEventListener('load', attach);
    attach();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
