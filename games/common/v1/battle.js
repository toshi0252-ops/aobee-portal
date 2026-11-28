"use strict";
/* Battle部品: 簡略戦闘（マップ上の数字ポップ＋軽い演出）と横画面用戦闘シーン（武器種別エフェクトつき） */
(function (global) {
  // WAAPI でアニメーションし、終わったら要素を消す（非対応環境ではタイマーで消す）
  function anim(el, frames, opts) {
    const dur = (opts && opts.duration) || 300, delay = (opts && opts.delay) || 0;
    if (el.animate) {
      const a = el.animate(frames, opts);
      if (a && a.finished) a.finished.then(() => el.remove()).catch(() => {});
      else setTimeout(() => el.remove(), delay + dur + 80);
    } else setTimeout(() => el.remove(), delay + dur + 80);
  }
  // 簡略: マップのセル上にダメージ数字をポップ表示する。命中時はセルのフラッシュ、撃破時はバースト、回復時は光の粒も出す
  /* ===== 効果音（Web Audio合成・素材なし）: 撃墜時の爆発音 =====
     ON/OFF はホスト側（main.js のタイトル設定）が global.SRPG_SFX_ON で切り替える。未設定時は ON。
     AudioContext は最初の再生時に作る（タップ起点の流れで呼ばれるので自動再生制限に触れにくい）。 */
  let actx = null;
  function audioCtx() {
    if (global.SRPG_SFX_ON === false) return null;
    try {
      if (!actx) actx = new (global.AudioContext || global.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function sfxCombo() {
    const ac = audioCtx();
    if (!ac) return;
    try {
      const t0 = ac.currentTime;
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = i % 2 ? "square" : "triangle"; o.frequency.value = f;
        const vol = i % 2 ? 0.08 : 0.2;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.07);
        g.gain.exponentialRampToValueAtTime(vol, t0 + i * 0.07 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.07 + 0.26);
        o.connect(g).connect(ac.destination);
        o.start(t0 + i * 0.07); o.stop(t0 + i * 0.07 + 0.3);
      });
    } catch (e) { /* 音が出なくても演出は続行 */ }
  }
  function sfxLevelUp() {
    const ac = audioCtx();
    if (!ac) return;
    try {
      const t0 = ac.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "triangle"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.085);
        g.gain.exponentialRampToValueAtTime(0.22, t0 + i * 0.085 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.085 + 0.22);
        o.connect(g).connect(ac.destination);
        o.start(t0 + i * 0.085); o.stop(t0 + i * 0.085 + 0.25);
      });
    } catch (e) { /* 音が出なくても演出は続行 */ }
  }
  function sfxExplosion(big) {
    const ac = audioCtx();
    if (!ac) return;
    try {
      const t = ac.currentTime;
      const dur = big ? 0.8 : 0.55;
      // 破裂音: 減衰ノイズをローパスで高域から落とす
      const len = Math.floor(ac.sampleRate * dur);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
      const src = ac.createBufferSource(); src.buffer = buf;
      const lp = ac.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(big ? 3000 : 2400, t);
      lp.frequency.exponentialRampToValueAtTime(150, t + dur);
      const g = ac.createGain();
      g.gain.setValueAtTime(big ? 0.7 : 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(lp); lp.connect(g); g.connect(ac.destination);
      src.start(t);
      // 胴鳴り: 低いサインを落とす
      const osc = ac.createOscillator(); osc.type = "sine";
      osc.frequency.setValueAtTime(big ? 125 : 105, t);
      osc.frequency.exponentialRampToValueAtTime(36, t + dur * 0.8);
      const og = ac.createGain();
      og.gain.setValueAtTime(big ? 0.55 : 0.4, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.8);
      osc.connect(og); og.connect(ac.destination);
      osc.start(t); osc.stop(t + dur);
    } catch (e) { /* 音が出なくても演出は続行する */ }
  }
  /* マップ上の撃墜爆発: 火球＋衝撃波リング＋破片＋煙。セル（position:relative 前提）に重ねる */
  function mapExplosion(cell, big) {
    const boomEl = document.createElement("div");
    boomEl.className = "cell-boom" + (big ? " big" : "");
    cell.appendChild(boomEl);
    setTimeout(() => boomEl.remove(), 740);
    const ring = document.createElement("div");
    ring.className = "cell-ring";
    cell.appendChild(ring);
    setTimeout(() => ring.remove(), 660);
    const n = big ? 10 : 7;
    for (let i = 0; i < n; i++) {
      const sp = document.createElement("div");
      sp.className = "cell-spark boom-spark";
      sp.textContent = i % 3 ? "✸" : "✦";
      sp.style.left = "50%"; sp.style.top = "50%";
      cell.appendChild(sp);
      const ang = Math.random() * Math.PI * 2, distPx = (big ? 48 : 34) * (0.6 + Math.random() * 0.7);
      anim(sp, [{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: "translate(calc(-50% + " + (Math.cos(ang) * distPx).toFixed(1) + "px), calc(-50% + " + (Math.sin(ang) * distPx).toFixed(1) + "px)) scale(.4)", opacity: 0 }], { duration: 480 + Math.random() * 220, fill: "forwards" });
    }
    for (let i = 0; i < 3; i++) {
      const sm = document.createElement("div");
      sm.className = "cell-smoke";
      sm.style.left = (30 + Math.random() * 40) + "%";
      sm.style.top = (24 + Math.random() * 30) + "%";
      cell.appendChild(sm);
      anim(sm, [{ transform: "translate(-50%,-50%) scale(.6)", opacity: .55 }, { transform: "translate(-50%,-100%) scale(1.5)", opacity: 0 }], { duration: 900, delay: 120 + i * 90, fill: "forwards" });
    }
  }
  function showPop(gridEl, st, ev) {
    return new Promise(resolve => {
      const w = st.stage.terrain[0].length;
      const idx = ev.defY * w + ev.defX;
      const cell = gridEl.children[idx];
      if (!cell) { resolve(); return; }
      if (ev.type === "levelup") {
        // レベルアップ: 金色のポップ＋ジングルで必ず気づけるようにする
        const lp = document.createElement("div");
        lp.className = "lvup-pop";
        lp.textContent = "LEVEL UP! Lv" + ev.level;
        cell.appendChild(lp);
        sfxLevelUp();
        setTimeout(() => { lp.remove(); resolve(); }, 980);
        return;
      }
      let comboWait = 0;
      if (ev.combo && typeof ev.atkX === "number") {
        // 合体攻撃: 攻撃側のマスに金色のバナーポップ＋ファンファーレ
        const acell = gridEl.children[ev.atkY * w + ev.atkX];
        if (acell) {
          const cp = document.createElement("div");
          cp.className = "combo-pop";
          cp.textContent = "合体攻撃！ " + ev.combo.weapon;
          acell.appendChild(cp);
          setTimeout(() => cp.remove(), 1250);
        }
        sfxCombo();
        comboWait = 420;
      }
      if (ev.type === "heal" || ev.type === "supply") {
        const glow = document.createElement("div");
        glow.className = "cell-fx heal";
        cell.appendChild(glow);
        setTimeout(() => glow.remove(), 520);
        for (let i = 0; i < 5; i++) {
          const sp = document.createElement("div");
          sp.className = "cell-spark";
          sp.textContent = "✦";
          sp.style.left = (28 + Math.random() * 44) + "%";
          cell.appendChild(sp);
          anim(sp, [{ transform: "translateY(4px)", opacity: 0 }, { opacity: 1, offset: .3 }, { transform: "translateY(-26px)", opacity: 0 }], { duration: 560, delay: i * 60, fill: "forwards" });
        }
      } else if (ev.hit) {
        const fl = document.createElement("div");
        fl.className = "cell-fx";
        cell.appendChild(fl);
        setTimeout(() => fl.remove(), 520);
      }
      let wait = 650 + comboWait;
      if (ev.killed) {
        const defU = (st.units || []).find(u => u.x === ev.defX && u.y === ev.defY);
        const living = defU && (defU.unitId === "animal" || defU.unitId === "citizen");
        if (living) {
          // 動物・民間人は爆発させない（従来のバースト表示のみ）
          const b = document.createElement("div");
          b.className = "cell-burst";
          b.textContent = "✸";
          cell.appendChild(b);
          setTimeout(() => b.remove(), 680);
        } else {
          const big = defU ? (defU.maxHp >= 2500 || /boss/.test(defU.unitId)) : false;
          mapExplosion(cell, big);
          sfxExplosion(big);
          wait = 920 + comboWait; // 爆発を見せ切ってから次へ
        }
      }
      const pop = document.createElement("div");
      pop.className = "dmg-pop";
      pop.textContent = ev.type === "heal" ? "+" + ev.amount : ev.type === "supply" ? "EN+" + ev.amount : (ev.hit ? "-" + ev.dmg : "MISS");
      if (ev.killed) pop.textContent += " 撃墜!";
      cell.appendChild(pop);
      if (ev.exp > 0 && typeof ev.atkX === "number") {
        // 経験値は稼いだ側（攻撃・回復・補給の実行者）のマスに小さく出す
        const acell = gridEl.children[ev.atkY * w + ev.atkX];
        if (acell) {
          const xp = document.createElement("div");
          xp.className = "exp-pop";
          xp.textContent = "+" + ev.exp + " EXP";
          acell.appendChild(xp);
          setTimeout(() => xp.remove(), 900);
        }
      }
      setTimeout(() => { pop.remove(); resolve(); }, wait);
    });
  }
  async function playSimplified(gridEl, st, events) {
    for (const ev of events) {
      if (ev.type === "attack" || ev.type === "heal" || ev.type === "supply" || ev.type === "levelup") await showPop(gridEl, st, ev);
    }
  }
  // 横画面用シーン: 左右対峙・掛け合いセリフ・HPバーの減少アニメ・ダメージ数字・余韻つき
  const LINES = {
    aobee: "あおびーに任せてよ！",
    warubee: "ふ、ふっ…負けないよ？",
    galdo: "いくで、若いの！",
    marmi: "あちちになれ〜！",
    poco: "ポコポコいくよー！",
    minori: "みんなを守るよ！",
    mio: "星の導きで…！",
    teru: "お届けものでーす！",
    hayate: "速さなら負けない！"
  };
  const SPARK_COLORS = ["#fde68a", "#fb923c", "#f8fafc", "#f87171"];
  function playScene(atkU, defU, events, forecast, opts) {
    return new Promise(resolve => {
      const ov = document.createElement("div");
      ov.className = "battle-scene";
      if (atkU.unitId === "sabicore" || defU.unitId === "sabicore") ov.classList.add("bs-core"); // コア戦は専用の暗赤い舞台にする
      const attacks = events.filter(e => e.type === "attack");
      const heals = events.filter(e => e.type === "heal");
      const lvups = events.filter(e => e.type === "levelup");
      const main = attacks[0], counter = attacks[1];
      const coreDied = (defU.unitId === "sabicore" && main && main.killed) || (atkU.unitId === "sabicore" && counter && counter.killed);
      // 表示上の開始HP（エンジン側は計算済みなので、受けたダメージを足し戻して開始値にする）
      const startAtk = atkU.hp + (counter && counter.hit ? counter.dmg : 0);
      const startDef = defU.hp + (main && main.hit ? main.dmg : 0);
      const barHtml = (u, cur) =>
        "<div class='bs-side'><div class='bs-hpname'>" + u.name + "／" + u.unitName + "</div>" +
        "<div class='bs-barwrap'><i style='width:" + Math.max(0, Math.round(cur / u.maxHp * 100)) + "%'></i></div>" +
        "<div class='bs-hptext'>HP " + cur + "/" + u.maxHp + "</div></div>";
      const spriteHtml = u => {
        const art = (global.UNIT_ART || {})[u.unitId];
        // 待機モーション（浮遊）は内側の .bs-float に付ける。.bs-unit 側の dash/shake 等の transform と競合させないため
        if (art) return "<div class='bs-float'><img class='bs-img' src='" + (global.assetUrl ? global.assetUrl(art) : "assets/" + art) + "' alt='" + u.unitName + "'></div>";
        return "<div class='bs-float'><div class='bs-sprite' style='background:" + u.color + "'>" + u.name + "</div></div>";
      };
      ov.innerHTML =
        "<div class='bs-quote'></div>" +
        "<div class='bs-unit bs-left'>" + spriteHtml(atkU) + "<div class='bs-name'>" + atkU.unitName + "</div></div>" +
        "<div class='bs-unit bs-right'>" + spriteHtml(defU) + "<div class='bs-name'>" + defU.unitName + "</div></div>" +
        "<div class='bs-bars'>" + barHtml(atkU, startAtk) + barHtml(defU, startDef) + "</div>" +
        "<button class='bs-skip'>スキップ ≫</button>";
      // 地形別背景（防御側の地形で main が選んだ絵）を一番奥に敷く
      if (opts && opts.bg) {
        const bg = document.createElement("div");
        bg.className = "bs-bg";
        bg.style.backgroundImage = "url('" + (global.assetUrl ? global.assetUrl(opts.bg) : "assets/" + opts.bg) + "')";
        ov.insertBefore(bg, ov.firstChild);
      }
      document.body.appendChild(ov);
      const fxLayer = document.createElement("div");
      fxLayer.className = "fx-layer";
      ov.appendChild(fxLayer);
      const quote = ov.querySelector(".bs-quote");
      const left = ov.querySelector(".bs-left"), right = ov.querySelector(".bs-right");
      // 登場: 両ユニットが外側からスライドイン（約0.3秒。ステップ開始をその分遅らせて尺に収める）
      if (left.animate) {
        left.animate([{ transform: "translateX(-64px)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], { duration: 300, easing: "ease-out" });
        right.animate([{ transform: "translateX(64px)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], { duration: 300, easing: "ease-out" });
      }
      const sides = ov.querySelectorAll(".bs-side");
      const atkSide = sides[0], defSide = sides[1];
      let done = false;
      const finish = () => {
        if (done) return; done = true;
        ov.classList.add("bs-fade");
        setTimeout(() => { ov.remove(); resolve(); }, 260);
      };
      ov.querySelector(".bs-skip").addEventListener("click", finish);
      function setHp(sideEl, u, val) {
        sideEl.querySelector("i").style.width = Math.max(0, Math.round(val / u.maxHp * 100)) + "%";
        sideEl.querySelector(".bs-hptext").textContent = "HP " + val + "/" + u.maxHp;
      }
      function dmgPop(unitEl, ev) {
        const pop = document.createElement("div");
        pop.className = "bs-dmg";
        pop.textContent = ev.hit ? "-" + ev.dmg : "MISS";
        if (ev.killed) pop.textContent += " 撃墜!";
        unitEl.appendChild(pop);
        setTimeout(() => pop.remove(), 900);
      }
      /* ===== 武器種別エフェクト（DOM/CSSのみ） ===== */
      function spriteEl(unitEl) { return unitEl.querySelector(".bs-img,.bs-sprite") || unitEl; }
      // 絵が実際に描かれる矩形（fxLayer相対）。img は object-fit:contain のレターボックス分を
      // naturalWidth/Height から割り出して内側に寄せる。読み込み前やスプライト代替表示では要素の箱そのもの
      function contentRect(imgEl) {
        const lr = fxLayer.getBoundingClientRect();
        const r = imgEl.getBoundingClientRect();
        const box = { left: r.left - lr.left, top: r.top - lr.top, w: r.width, h: r.height };
        if (imgEl.tagName === "IMG" && imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
          const scale = Math.min(box.w / imgEl.naturalWidth, box.h / imgEl.naturalHeight);
          const cw = imgEl.naturalWidth * scale, ch = imgEl.naturalHeight * scale;
          // object-position は既定の 50% 50%（CSSで変更していない）
          return { left: box.left + (box.w - cw) / 2, top: box.top + (box.h - ch) / 2, w: cw, h: ch };
        }
        return box;
      }
      function spriteRect(unitEl) { return contentRect(spriteEl(unitEl)); }
      function centerOf(unitEl) {
        const r = spriteRect(unitEl);
        return { x: r.left + r.w / 2, y: r.top + r.h / 2 };
      }
      // ユニット絵「内容」の任意の割合位置（fx: 左0〜右1、fy: 上0〜下1）
      function pointOf(unitEl, fx, fy) {
        const r = spriteRect(unitEl);
        return { x: r.left + r.w * fx, y: r.top + r.h * fy };
      }
      /* 砲口アンカー表（unitId → 絵の内容座標。xはPNG左端基準・yは上端基準、描かれている向きのまま）
         味方は右向き・敵は左向きに描かれている前提で、発射はその向きの先端から出る */
      const MUZZLE = {
        gearstar: { x: .96, y: .50 },  // 突き出した腕の先端の発光部
        gardon: { x: .97, y: .62 },    // 右側の大砲の砲口
        pocodash: { x: .88, y: .42 },
        hoshifune: { x: .85, y: .38 },
        moomoo: { x: .88, y: .45 },
        karakuri: { x: .06, y: .45 },  // 左向きの絵なので左端側
        bannin: { x: .08, y: .40 }
      };
      // 発射点: ユニットごとの砲口アンカー（表に無ければ陣営の既定値）
      function muzzlePointOf(s) {
        const a = MUZZLE[s.who.unitId] || (s.who.side === "enemy" ? { x: .15, y: .42 } : { x: .85, y: .42 });
        return pointOf(s.el, a.x, a.y);
      }
      // 着弾点: 対象の内容の中心やや上
      function impactPointOf(unitEl) { return pointOf(unitEl, .5, .45); }
      function mk(cls, x, y) {
        const d = document.createElement("div");
        d.className = cls;
        d.style.left = x + "px"; d.style.top = y + "px";
        fxLayer.appendChild(d);
        return d;
      }
      function burst(x, y, n, spread) {
        for (let i = 0; i < n; i++) {
          const s = mk("fx-spark", x, y);
          const c = SPARK_COLORS[i % SPARK_COLORS.length];
          s.style.background = c; s.style.boxShadow = "0 0 6px " + c;
          const ang = Math.random() * Math.PI * 2, d = spread * (0.35 + Math.random() * 0.75);
          anim(s, [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: "translate(" + (Math.cos(ang) * d) + "px," + (Math.sin(ang) * d - 12) + "px) scale(.4)", opacity: 0 }], { duration: 380 + Math.random() * 220, fill: "forwards" });
        }
      }
      function smoke(x, y, size, dur) {
        const s = mk("fx-smoke", x, y);
        s.style.width = s.style.height = size + "px";
        s.style.marginLeft = s.style.marginTop = (-size / 2) + "px";
        s.style.animationDuration = (dur || .55) + "s";
        setTimeout(() => s.remove(), (dur || .55) * 1000 + 80);
      }
      function boom(x, y, big) {
        const size = big ? 300 : 210;
        const b = mk("fx-boom", x, y);
        b.style.width = b.style.height = size + "px";
        b.style.marginLeft = b.style.marginTop = (-size / 2) + "px";
        setTimeout(() => b.remove(), 560);
        smoke(x - 20, y - 8, 64, .95); smoke(x + 24, y + 4, 52, .85); smoke(x, y - 26, 44, .8);
      }
      // ビーム着弾点の閃光（金〜水色の星らしい閃光）
      function starflash(x, y, big) {
        const size = big ? 190 : 130;
        const f = mk("fx-starflash", x, y);
        f.style.width = f.style.height = size + "px";
        f.style.marginLeft = f.style.marginTop = (-size / 2) + "px";
        setTimeout(() => f.remove(), 420);
      }
      // 着弾点から短い光条が放射状に広がって消える
      function rays(x, y, n, big) {
        for (let i = 0; i < n; i++) {
          const r = mk("fx-ray", x, y);
          const ang = Math.random() * Math.PI * 2;
          r.style.width = ((big ? 78 : 54) * (0.6 + Math.random() * 0.7)) + "px";
          anim(r, [{ transform: "rotate(" + ang + "rad) scaleX(.2)", opacity: 1 }, { transform: "rotate(" + ang + "rad) scaleX(1)", opacity: 0 }], { duration: 300 + Math.random() * 140, fill: "forwards" });
        }
      }
      function healFx(unitEl) {
        const c = centerOf(unitEl);
        unitEl.classList.add("bs-healglow");
        setTimeout(() => unitEl.classList.remove("bs-healglow"), 750);
        for (let i = 0; i < 7; i++) {
          const s = mk("fx-heal", c.x + (Math.random() * 90 - 45), c.y + 26);
          s.textContent = "✦";
          anim(s, [{ transform: "translateY(6px)", opacity: 0 }, { opacity: 1, offset: .3 }, { transform: "translateY(-64px)", opacity: 0 }], { duration: 620, delay: i * 55, fill: "forwards" });
        }
      }
      // 絵だけを横に小さく揺らす（反動・よろけ用。.bs-unit 側の dash/shake と競合しないよう絵要素に付ける）
      function nudge(unitEl, dx, dur) {
        const t = spriteEl(unitEl);
        if (!t.animate) return;
        t.animate([{ transform: "translateX(0)" }, { transform: "translateX(" + dx + "px)", offset: .3 }, { transform: "translateX(0)" }], { duration: dur || 300, easing: "ease-out" });
      }
      // 攻撃モーションを発射し、着弾までのmsを返す（melee は呼び出し側の bs-dash が接近する）
      // 発射点はユニットごとの砲口アンカー（絵の内容座標）、着弾点は対象の内容の中心やや上
      function launchFx(s, big) {
        const fx = s.ev.fx || "melee";
        if (fx === "melee") return 380;
        const from = muzzlePointOf(s), foeI = impactPointOf(s.foe);
        // 射撃の反動: 対象と反対方向へ約10px下がって戻る
        nudge(s.el, (foeI.x >= from.x ? -1 : 1) * 10, 300);
        const to = s.ev.hit ? foeI : { x: foeI.x, y: foeI.y - 48 }; // ミス時は対象の上へ外れる
        if (fx === "beam") {
          const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
          const b = mk("fx-beam" + (big ? " big" : ""), from.x, from.y);
          b.style.width = len + "px";
          b.innerHTML = "<i class='glow'></i><i class='mid'></i><i class='core'></i>";
          // 伸びる → 一瞬太く輝く → 消える
          anim(b, [{ transform: "rotate(" + ang + "rad) scale(0,.4)", opacity: 1 }, { transform: "rotate(" + ang + "rad) scale(1,1)", opacity: 1, offset: .3 }, { transform: "rotate(" + ang + "rad) scale(1,1.5)", opacity: 1, offset: .5 }, { transform: "rotate(" + ang + "rad) scale(1,1)", opacity: 1, offset: .7 }, { transform: "rotate(" + ang + "rad) scale(1,.7)", opacity: 0 }], { duration: 450, fill: "forwards" });
          const fl = mk("fx-beamflash" + (big ? " big" : ""), from.x, from.y);
          setTimeout(() => fl.remove(), 300);
          if (big) {
            const sf = document.createElement("div");
            sf.className = "fx-screenflash";
            fxLayer.appendChild(sf);
            setTimeout(() => sf.remove(), 460);
          }
          return 210; // 伸び切って太く輝く頃に着弾させる
        }
        if (fx === "gun") {
          const m = mk("fx-muzzle", from.x, from.y);
          setTimeout(() => m.remove(), 220);
          const p = mk("fx-proj", from.x, from.y);
          anim(p, [{ transform: "translate(0,0)" }, { transform: "translate(" + (to.x - from.x) + "px," + (to.y - from.y) + "px)" }], { duration: 290, fill: "forwards" });
          return 320;
        }
        if (fx === "missile") {
          const p = mk("fx-proj missile", from.x, from.y);
          const dx = to.x - from.x, dy = to.y - from.y, lift = 84;
          anim(p, [{ transform: "translate(0,0)" }, { transform: "translate(" + (dx * .5) + "px," + (dy * .5 - lift * .5) + "px)", offset: .5 }, { transform: "translate(" + dx + "px," + dy + "px)" }], { duration: 470, fill: "forwards" });
          for (let i = 1; i <= 6; i++) {
            const t = i / 7;
            const px = from.x + dx * t, py = from.y + dy * t - 2 * lift * t * (1 - t);
            setTimeout(() => { if (!done) smoke(px, py, 13 + i * 2, .55); }, t * 470);
          }
          return 500;
        }
        return 380;
      }
      // 着弾時の共通演出: フラッシュ＋破片＋画面の揺れ（ダメージ比で大小）＋撃破時は大爆発と消滅
      function impactFx(s, big) {
        const foeC = impactPointOf(s.foe);
        // 被弾のよろけ: 衝撃方向（攻撃側と反対）へ約6px押し出されて戻る
        nudge(s.foe, (foeC.x >= centerOf(s.el).x ? 1 : -1) * 6, 280);
        s.foe.classList.add("bs-hitflash");
        setTimeout(() => s.foe.classList.remove("bs-hitflash"), 340);
        if (s.ev.fx === "beam") { starflash(foeC.x, foeC.y, big); rays(foeC.x, foeC.y, big ? 10 : 7, big); }
        if (s.ev.killed) { boom(foeC.x, foeC.y, big); burst(foeC.x, foeC.y, big ? 26 : 20, big ? 130 : 105); }
        else burst(foeC.x, foeC.y, big ? 16 : 10, big ? 95 : 68);
        const ratio = s.foeU.maxHp ? s.ev.dmg / s.foeU.maxHp : 0;
        if (s.ev.killed || big || ratio >= .45) { ov.classList.add("fx-quake-l"); setTimeout(() => ov.classList.remove("fx-quake-l"), 480); }
        else if (ratio >= .2) { ov.classList.add("fx-quake-s"); setTimeout(() => ov.classList.remove("fx-quake-s"), 360); }
        if (s.ev.killed) s.foe.classList.add("bs-destroyed");
        if (s.ev.killed) {
          sfxExplosion(big);
          // 二段爆発: 少し遅れてもう一回り大きい爆発が起きてから消滅する
          setTimeout(() => {
            if (done) return;
            boom(foeC.x + (Math.random() * 36 - 18), foeC.y - 10, true);
            burst(foeC.x, foeC.y, 18, 120);
            s.foe.classList.add("bs-hitflash");
            setTimeout(() => s.foe.classList.remove("bs-hitflash"), 300);
          }, 230);
        }
      }
      const steps = [];
      if (main) steps.push({ el: left, foe: right, ev: main, who: atkU, foeSide: defSide, foeU: defU });
      if (counter) steps.push({ el: right, foe: left, ev: counter, who: defU, foeSide: atkSide, foeU: atkU });
      else if (main && forecast && forecast.stance === "defend") steps.push({ react: "defend", el: right, who: defU });
      else if (main && forecast && forecast.stance === "evade" && main.hit) steps.push({ react: "evade", el: right, who: defU });
      let i = 0;
      // 合体攻撃の相方ユニット（必要な時だけ遅れて登場させる）
      let partnerEl = null;
      function ensurePartner(s) {
        if (partnerEl) return partnerEl;
        const c = s.ev.combo;
        const pseudo = { unitId: c.partnerUnitId, name: c.partnerName, unitName: c.partnerUnitName, color: c.partnerColor };
        partnerEl = document.createElement("div");
        partnerEl.className = "bs-unit " + (s.el.classList.contains("bs-left") ? "bs-left" : "bs-right") + " bs-partner";
        partnerEl.innerHTML = spriteHtml(pseudo) + "<div class='bs-name'>" + c.partnerUnitName + "</div>";
        ov.appendChild(partnerEl);
        if (partnerEl.animate) partnerEl.animate([{ transform: "translateY(30px) scale(.92)", opacity: 0 }, { transform: "translateY(0) scale(.92)", opacity: 1 }], { duration: 340, easing: "ease-out", fill: "forwards" });
        return partnerEl;
      }
      function fireStep(s) {
        const fx = s.ev.fx || "melee";
        const big = (s.ev.power || 0) >= 2000; // 威力2000以上の必殺は一回り派手に
        if (fx === "melee") s.el.classList.add("bs-dash");
        const delay = launchFx(s, big);
        if (s.ev.combo && fx === "beam" && partnerEl) {
          // 相方からも二本目のビームを撃ち、対象の一点で合流させる
          const from = centerOf(partnerEl), foeI = impactPointOf(s.foe);
          const to = s.ev.hit ? foeI : { x: foeI.x, y: foeI.y - 48 };
          const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
          const b2 = mk("fx-beam big", from.x, from.y);
          b2.style.width = len + "px";
          b2.innerHTML = "<i class='glow'></i><i class='mid'></i><i class='core'></i>";
          anim(b2, [{ transform: "rotate(" + ang + "rad) scale(0,.4)", opacity: 1 }, { transform: "rotate(" + ang + "rad) scale(1,1)", opacity: 1, offset: .3 }, { transform: "rotate(" + ang + "rad) scale(1,1.5)", opacity: 1, offset: .5 }, { transform: "rotate(" + ang + "rad) scale(1,1)", opacity: 1, offset: .7 }, { transform: "rotate(" + ang + "rad) scale(1,.7)", opacity: 0 }], { duration: 450, delay: 70, fill: "forwards" });
        }
        setTimeout(() => {
          if (done) return;
          s.el.classList.remove("bs-dash");
          dmgPop(s.foe, s.ev);
          if (s.ev.hit) {
            impactFx(s, big);
            s.foe.classList.add("bs-shake");
            setHp(s.foeSide, s.foeU, s.ev.defHp);
            setTimeout(() => s.foe.classList.remove("bs-shake"), 350);
          } else {
            quote.textContent = s.who.name + "「" + s.ev.weapon + "！」…回避された";
          }
          if (s.ev.killed) quote.textContent += " 撃墜！";
          // 経験値とレベルアップは攻撃側に出す（いつの間にか上がっていた、を無くす）
          if (s.ev.exp > 0) {
            const xp = document.createElement("div");
            xp.className = "bs-exp";
            xp.textContent = "+" + s.ev.exp + " EXP";
            s.el.appendChild(xp);
            setTimeout(() => xp.remove(), 900);
          }
          const lv = lvups.find(e => e.pilotId === s.who.pilotId);
          if (lv) {
            const lp = document.createElement("div");
            lp.className = "bs-lvup";
            lp.textContent = "LEVEL UP! Lv" + lv.level;
            s.el.appendChild(lp);
            sfxLevelUp();
            setTimeout(() => lp.remove(), 1200);
          }
          setTimeout(next, 800);
        }, delay);
      }
      function next() {
        if (done) return;
        if (i >= steps.length) {
          const killed = attacks.some(e => e.killed);
          quote.textContent = killed ? "撃墜！" : "戦闘終了";
          if (coreDied) {
            // サビのコア撃破: 白い閃光と長い余韻で最終決戦の決着らしくする
            const sf = document.createElement("div");
            sf.className = "fx-screenflash";
            fxLayer.appendChild(sf);
            setTimeout(() => sf.remove(), 720);
          }
          setTimeout(finish, coreDied ? 1800 : 950); // 余韻
          return;
        }
        const s = steps[i++];
        if (s.react) {
          quote.textContent = s.who.name + (s.react === "defend" ? "「防御した！ ダメージ半減」" : "「回避しきれなかった…！」");
          s.el.classList.add(s.react === "defend" ? "bs-guard" : "bs-evade");
          setTimeout(() => { s.el.classList.remove("bs-guard", "bs-evade"); setTimeout(next, 500); }, 650);
          return;
        }
        if (s.ev.combo && !s._comboShown) {
          // 合体攻撃の専用導入: 相方が駆けつけ、二人の名乗りとバナーの後に発射する
          s._comboShown = true;
          quote.textContent = s.who.name + "＆" + s.ev.combo.partnerName + "「「" + s.ev.combo.weapon + "！！」」";
          ensurePartner(s);
          // 二人の真剣な表情のカットイン（表情差分があればそちらを優先）
          const exprOf = pid => { const ex = (global.FACE_EXPR || {})[pid]; return (ex && ex.serious) || (global.FACE_MAP || {})[pid]; };
          const fA = exprOf(s.who.pilotId), fB = exprOf(s.ev.combo.partnerPilotId);
          if (fA && fB) {
            const url = p => global.assetUrl ? global.assetUrl(p) : "assets/" + p;
            const ci = document.createElement("div");
            ci.className = "bs-cutin combo";
            ci.innerHTML = "<img src='" + url(fA) + "' alt=''><img src='" + url(fB) + "' alt=''>";
            ov.appendChild(ci);
            if (ci.animate) ci.animate([{ transform: "scale(.92)", opacity: 0 }, { transform: "scale(1)", opacity: 1, offset: .2 }, { transform: "scale(1)", opacity: 1, offset: .8 }, { opacity: 0 }], { duration: 1300, easing: "ease-out", fill: "forwards" });
            setTimeout(() => ci.remove(), 1350);
          }
          const b = document.createElement("div");
          b.className = "bs-combo-banner";
          b.innerHTML = "<span>合体攻撃</span><strong>" + s.ev.combo.weapon + "</strong>";
          ov.appendChild(b);
          sfxCombo();
          setTimeout(() => b.remove(), 1350);
          setTimeout(() => { if (!done) fireStep(s); }, 840);
          return;
        }
        const line = LINES[s.who.pilotId] || (s.who.side === "enemy" ? "……！" : "いくよ！");
        quote.textContent = s.who.name + "「" + line + " " + s.ev.weapon + "！」";
        fireStep(s);
      }
      // ボス初対面カットイン: 名乗りを見せてから戦闘ステップへ（その分、開始を遅らせる）
      let startDelay = 300;
      if (opts && opts.cutin) {
        const c = document.createElement("div");
        c.className = "bs-cutin boss";
        c.innerHTML = "<img src='" + (global.assetUrl ? global.assetUrl(opts.cutin.img) : "assets/" + opts.cutin.img) + "' alt=''><div class='bs-cutin-name'><span>" + opts.cutin.label + "</span><strong>" + opts.cutin.name + "</strong></div>";
        ov.appendChild(c);
        if (c.animate) c.animate([{ transform: "translateX(46px)", opacity: 0 }, { transform: "translateX(0)", opacity: 1, offset: .25 }, { transform: "translateX(0)", opacity: 1, offset: .78 }, { transform: "translateX(24px)", opacity: 0 }], { duration: 1250, easing: "ease-out", fill: "forwards" });
        setTimeout(() => c.remove(), 1300);
        startDelay = 1100;
      }
      if (!steps.length && heals.length) {
        // 回復だけのシーン（現行の呼び出しでは発生しないが、渡された場合の受け口）
        quote.textContent = heals[0].atk + "「" + heals[0].weapon + "！」";
        healFx(right);
        setTimeout(finish, 1000);
      } else setTimeout(next, startDelay); // 登場スライドイン（＋ボスカットイン）を見せてから攻撃ステップへ
      setTimeout(finish, 9000); // 安全弁
    });
  }
  global.BattleView = { playSimplified, playScene };
})(window);
