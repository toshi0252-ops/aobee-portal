"use strict";
/* Battle部品: 簡略戦闘（マップ上の数字ポップ）と横画面用戦闘シーン */
(function (global) {
  // 簡略: マップのセル上にダメージ数字をポップ表示する
  function showPop(gridEl, st, ev) {
    return new Promise(resolve => {
      const w = st.stage.terrain[0].length;
      const idx = ev.defY * w + ev.defX;
      const cell = gridEl.children[idx];
      if (!cell) { resolve(); return; }
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
  function playScene(atkU, defU, events) {
    return new Promise(resolve => {
      const ov = document.createElement("div");
      ov.className = "battle-scene";
      const attacks = events.filter(e => e.type === "attack");
      const main = attacks[0], counter = attacks[1];
      // 表示上の開始HP（エンジン側は計算済みなので、受けたダメージを足し戻して開始値にする）
      const startAtk = atkU.hp + (counter && counter.hit ? counter.dmg : 0);
      const startDef = defU.hp + (main && main.hit ? main.dmg : 0);
      const barHtml = (u, cur) =>
        "<div class='bs-side'><div class='bs-hpname'>" + u.name + "／" + u.unitName + "</div>" +
        "<div class='bs-barwrap'><i style='width:" + Math.max(0, Math.round(cur / u.maxHp * 100)) + "%'></i></div>" +
        "<div class='bs-hptext'>HP " + cur + "/" + u.maxHp + "</div></div>";
      ov.innerHTML =
        "<div class='bs-quote'></div>" +
        "<div class='bs-unit bs-left'><div class='bs-sprite' style='background:" + atkU.color + "'>" + atkU.name + "</div><div class='bs-name'>" + atkU.unitName + "</div></div>" +
        "<div class='bs-unit bs-right'><div class='bs-sprite' style='background:" + defU.color + "'>" + defU.name + "</div><div class='bs-name'>" + defU.unitName + "</div></div>" +
        "<div class='bs-bars'>" + barHtml(atkU, startAtk) + barHtml(defU, startDef) + "</div>" +
        "<button class='bs-skip'>スキップ ≫</button>";
      document.body.appendChild(ov);
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
      const steps = [];
      if (main) steps.push({ el: left, foe: right, ev: main, who: atkU, foeSide: defSide, foeU: defU });
      if (counter) steps.push({ el: right, foe: left, ev: counter, who: defU, foeSide: atkSide, foeU: atkU });
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
        const line = LINES[s.who.pilotId] || (s.who.side === "enemy" ? "……！" : "いくよ！");
        quote.textContent = s.who.name + "「" + line + " " + s.ev.weapon + "！」";
        s.el.classList.add("bs-dash");
        setTimeout(() => {
          if (done) return;
          s.el.classList.remove("bs-dash");
          dmgPop(s.foe, s.ev);
          if (s.ev.hit) {
            s.foe.classList.add("bs-shake");
            setHp(s.foeSide, s.foeU, s.ev.defHp);
            setTimeout(() => s.foe.classList.remove("bs-shake"), 350);
          } else {
            quote.textContent = s.who.name + "「" + s.ev.weapon + "！」…回避された";
          }
          if (s.ev.killed) quote.textContent += " 撃墜！";
          setTimeout(next, 800);
        }, 380);
      }
      next();
      setTimeout(finish, 9000); // 安全弁
    });
  }
  global.BattleView = { playSimplified, playScene };
})(window);
