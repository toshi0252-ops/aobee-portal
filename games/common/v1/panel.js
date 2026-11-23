"use strict";
/* Panel部品: 中身の入れ替え表示だけを担当する（配置はCSS側） */
(function (global) {
  function Panel(el) { this.el = el; }
  Panel.prototype.show = function (html) { this.el.innerHTML = html; };
  Panel.prototype.buttons = function (items) {
    // items: [{label, cls, disabled, onClick}]
    const row = document.createElement("div"); row.className = "row";
    for (const it of items) {
      const b = document.createElement("button");
      b.textContent = it.label; if (it.cls) b.className = it.cls;
      if (it.disabled) b.disabled = true;
      b.addEventListener("click", it.onClick);
      row.appendChild(b);
    }
    this.el.appendChild(row);
    return row;
  };
  Panel.prototype.unitCard = function (u) {
    const hpPct = Math.max(0, Math.round(u.hp / u.maxHp * 100));
    const enPct = u.maxEn ? Math.round(u.en / u.maxEn * 100) : 0;
    const spPct = u.maxSp ? Math.round(u.sp / u.maxSp * 100) : 0;
    return "<h3>" + u.name + "／" + u.unitName + " Lv" + u.level + " 気力" + u.morale + "</h3>" +
      "<div class='stat'>HP " + u.hp + "/" + u.maxHp + "</div><div class='bar'><i style='width:" + hpPct + "%'></i></div>" +
      (u.maxEn ? "<div class='stat'>EN " + u.en + "/" + u.maxEn + "</div><div class='bar en'><i style='width:" + enPct + "%'></i></div>" : "") +
      (u.maxSp ? "<div class='stat'>SP " + u.sp + "/" + u.maxSp + "</div><div class='bar sp'><i style='width:" + spPct + "%'></i></div>" : "");
  };
  global.Panel = Panel;
})(window);
