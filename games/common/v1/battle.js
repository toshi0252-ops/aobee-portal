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
  function showPop(gridEl, st, ev) {
    return new Promise(resolve => {
      const w = st.stage.terrain[0].length;
      const idx = ev.defY * w + ev.defX;
      const cell = gridEl.children[idx];
      if (!cell) { resolve(); return; }
      if (ev.type === "heal") {
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
      if (ev.killed) {
        const b = document.createElement("div");
        b.className = "cell-burst";
        b.textContent = "✸";
        cell.appendChild(b);
        setTimeout(() => b.remove(), 680);
      }
      const pop = document.createElement("div");
      pop.className = "dmg-pop";
      pop.textContent = ev.type === "heal" ? "+" + ev.amount : (ev.hit ? "-" + ev.dmg : "MISS");
      if (ev.killed) pop.textContent += " 撃墜!";
      cell.appendChild(pop);
      setTimeout(() => { pop.remove(); resolve(); }, 650);
    });
  }
  async function playSimplified(gridEl, st, events) {
    for (const ev of events) {
      if (ev.type === "attack" || ev.type === "heal") await showPop(gridEl, st, ev);
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
  function playScene(atkU, defU, events, forecast) {
    return new Promise(resolve => {
      const ov = document.createElement("div");
      ov.className = "battle-scene";
      const attacks = events.filter(e => e.type === "attack");
      const heals = events.filter(e => e.type === "heal");
      const main = attacks[0], counter = attacks[1];
      // 表示上の開始HP（エンジン側は計算済みなので、受けたダメージを足し戻して開始値にする）
      const startAtk = atkU.hp + (counter && counter.hit ? counter.dmg : 0);
      const startDef = defU.hp + (main && main.hit ? main.dmg : 0);
      const barHtml = (u, cur) =>
        "<div class='bs-side'><div class='bs-hpname'>" + u.name + "／" + u.unitName + "</div>" +
        "<div class='bs-barwrap'><i style='width:" + Math.max(0, Math.round(cur / u.maxHp * 100)) + "%'></i></div>" +
        "<div class='bs-hptext'>HP " + cur + "/" + u.maxHp + "</div></div>";
      const spriteHtml = u => {
        const art = (global.UNIT_ART || {})[u.unitId];
        if (art) return "<img class='bs-img' src='" + (global.assetUrl ? global.assetUrl(art) : "assets/" + art) + "' alt='" + u.unitName + "'>";
        return "<div class='bs-sprite' style='background:" + u.color + "'>" + u.name + "</div>";
      };
      ov.innerHTML =
        "<div class='bs-quote'></div>" +
        "<div class='bs-unit bs-left'>" + spriteHtml(atkU) + "<div class='bs-name'>" + atkU.unitName + "</div></div>" +
        "<div class='bs-unit bs-right'>" + spriteHtml(defU) + "<div class='bs-name'>" + defU.unitName + "</div></div>" +
        "<div class='bs-bars'>" + barHtml(atkU, startAtk) + barHtml(defU, startDef) + "</div>" +
        "<button class='bs-skip'>スキップ ≫</button>";
      document.body.appendChild(ov);
      const fxLayer = document.createElement("div");
      fxLayer.className = "fx-layer";
      ov.appendChild(fxLayer);
      const quote = ov.querySelector(".bs-quote");
      const left = ov.querySelector(".bs-left"), right = ov.querySelector(".bs-right");
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
      function spriteRect(unitEl) {
        const lr = fxLayer.getBoundingClientRect();
        const t = unitEl.querySelector(".bs-img,.bs-sprite") || unitEl;
        const r = t.getBoundingClientRect();
        return { left: r.left - lr.left, top: r.top - lr.top, w: r.width, h: r.height };
      }
      function centerOf(unitEl) {
        const r = spriteRect(unitEl);
        return { x: r.left + r.w / 2, y: r.top + r.h / 2 };
      }
      // ユニット絵の任意の割合位置（fx: 左0〜右1、fy: 上0〜下1）
      function pointOf(unitEl, fx, fy) {
        const r = spriteRect(unitEl);
        return { x: r.left + r.w * fx, y: r.top + r.h * fy };
      }
      // 発射点: 上半身（高さ約35%）、横は対象を向いた側の端
      function launchPointOf(s) {
        const foeC = centerOf(s.foe), myC = centerOf(s.el);
        return pointOf(s.el, foeC.x >= myC.x ? .85 : .15, .35);
      }
      // 着弾点: 中心やや上（高さ約40%）
      function impactPointOf(unitEl) { return pointOf(unitEl, .5, .4); }
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
      // 攻撃モーションを発射し、着弾までのmsを返す（melee は呼び出し側の bs-dash が接近する）
      // 発射点は上半身（高さ約35%・対象側の端）、着弾点は対象の中心やや上（高さ約40%）
      function launchFx(s, big) {
        const fx = s.ev.fx || "melee";
        if (fx === "melee") return 380;
        const from = launchPointOf(s), foeI = impactPointOf(s.foe);
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
        s.foe.classList.add("bs-hitflash");
        setTimeout(() => s.foe.classList.remove("bs-hitflash"), 340);
        if (s.ev.fx === "beam") { starflash(foeC.x, foeC.y, big); rays(foeC.x, foeC.y, big ? 10 : 7, big); }
        if (s.ev.killed) { boom(foeC.x, foeC.y, big); burst(foeC.x, foeC.y, big ? 26 : 20, big ? 130 : 105); }
        else burst(foeC.x, foeC.y, big ? 16 : 10, big ? 95 : 68);
        const ratio = s.foeU.maxHp ? s.ev.dmg / s.foeU.maxHp : 0;
        if (s.ev.killed || big || ratio >= .45) { ov.classList.add("fx-quake-l"); setTimeout(() => ov.classList.remove("fx-quake-l"), 480); }
        else if (ratio >= .2) { ov.classList.add("fx-quake-s"); setTimeout(() => ov.classList.remove("fx-quake-s"), 360); }
        if (s.ev.killed) s.foe.classList.add("bs-destroyed");
      }
      const steps = [];
      if (main) steps.push({ el: left, foe: right, ev: main, who: atkU, foeSide: defSide, foeU: defU });
      if (counter) steps.push({ el: right, foe: left, ev: counter, who: defU, foeSide: atkSide, foeU: atkU });
      else if (main && forecast && forecast.stance === "defend") steps.push({ react: "defend", el: right, who: defU });
      else if (main && forecast && forecast.stance === "evade" && main.hit) steps.push({ react: "evade", el: right, who: defU });
      let i = 0;
      function next() {
        if (done) return;
        if (i >= steps.length) {
          const killed = attacks.some(e => e.killed);
          quote.textContent = killed ? "撃墜！" : "戦闘終了";
          setTimeout(finish, 950); // 余韻
          return;
        }
        const s = steps[i++];
        if (s.react) {
          quote.textContent = s.who.name + (s.react === "defend" ? "「防御した！ ダメージ半減」" : "「回避しきれなかった…！」");
          s.el.classList.add(s.react === "defend" ? "bs-guard" : "bs-evade");
          setTimeout(() => { s.el.classList.remove("bs-guard", "bs-evade"); setTimeout(next, 500); }, 650);
          return;
        }
        const line = LINES[s.who.pilotId] || (s.who.side === "enemy" ? "……！" : "いくよ！");
        quote.textContent = s.who.name + "「" + line + " " + s.ev.weapon + "！」";
        const fx = s.ev.fx || "melee";
        const big = (s.ev.power || 0) >= 2000; // 威力2000以上の必殺は一回り派手に
        if (fx === "melee") s.el.classList.add("bs-dash");
        const delay = launchFx(s, big);
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
          setTimeout(next, 800);
        }, delay);
      }
      if (!steps.length && heals.length) {
        // 回復だけのシーン（現行の呼び出しでは発生しないが、渡された場合の受け口）
        quote.textContent = heals[0].atk + "「" + heals[0].weapon + "！」";
        healFx(right);
        setTimeout(finish, 1000);
      } else next();
      setTimeout(finish, 9000); // 安全弁
    });
  }
  global.BattleView = { playSimplified, playScene };
})(window);
