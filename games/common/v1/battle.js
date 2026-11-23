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
  // 横画面用シーン: 左右対峙・HPバー・セリフ・スキップ可の簡易アニメーション
  function playScene(atkU, defU, events, firstForecast) {
    return new Promise(resolve => {
      const ov = document.createElement("div");
      ov.className = "battle-scene";
      const main = events.find(e => e.type === "attack");
      const counter = events.filter(e => e.type === "attack")[1];
      ov.innerHTML =
        "<div class='bs-sky'><div class='bs-quote'></div>" +
        "<div class='bs-unit bs-left'><div class='bs-sprite' style='background:" + atkU.color + "'>" + atkU.name + "</div><div class='bs-name'>" + atkU.unitName + "</div></div>" +
        "<div class='bs-unit bs-right'><div class='bs-sprite' style='background:" + defU.color + "'>" + defU.name + "</div><div class='bs-name'>" + defU.unitName + "</div></div>" +
        "<div class='bs-bars'><div>HP " + atkU.hp + "/" + atkU.maxHp + "</div><div>HP " + defU.hp + "/" + defU.maxHp + "</div></div></div>" +
        "<button class='bs-skip'>スキップ ≫</button>";
      document.body.appendChild(ov);
      const quote = ov.querySelector(".bs-quote");
      const left = ov.querySelector(".bs-left"), right = ov.querySelector(".bs-right");
      let done = false;
      const finish = () => { if (!done) { done = true; ov.remove(); resolve(); } };
      ov.querySelector(".bs-skip").addEventListener("click", finish);
      const steps = [];
      if (main) steps.push({ el: left, foe: right, ev: main, who: atkU });
      if (counter) steps.push({ el: right, foe: left, ev: counter, who: defU });
      let i = 0;
      function next() {
        if (i >= steps.length) { setTimeout(finish, 500); return; }
        const s = steps[i++];
        quote.textContent = s.who.name + "「" + s.ev.weapon + "！」 " + (s.ev.hit ? s.ev.dmg + "ダメージ" : "回避された");
        s.el.classList.add("bs-dash");
        setTimeout(() => { s.el.classList.remove("bs-dash"); if (s.ev.hit) { s.foe.classList.add("bs-shake"); setTimeout(() => s.foe.classList.remove("bs-shake"), 350); } setTimeout(next, 450); }, 350);
      }
      next();
      setTimeout(finish, 6000); // 安全弁
    });
  }
  global.BattleView = { playSimplified, playScene };
})(window);
