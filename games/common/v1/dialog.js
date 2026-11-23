"use strict";
/* Dialog部品: 会話ウィンドウ。lines = [[who, text], ...] を順に表示し、終わったら resolve する */
(function (global) {
  const NAMES = { aobee: "あおびー", warubee: "わるびー", galdo: "ガルド", marmi: "マーミ", poco: "ポコ", minori: "みのり", mio: "ミオ", ganzou: "ガンジョウ" };
  const COLORS = { aobee: "#38bdf8", warubee: "#e879f9", galdo: "#d97706", marmi: "#f472b6", poco: "#4ade80", minori: "#facc15", mio: "#a78bfa", ganzou: "#94a3b8" };
  function showDialog(lines) {
    return new Promise(resolve => {
      const ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.45);display:flex;align-items:flex-end;justify-content:center;z-index:60";
      const box = document.createElement("div");
      box.style.cssText = "background:rgba(15,23,42,.96);border:2px solid #475569;border-radius:12px;margin:10px;padding:12px 14px;max-width:640px;width:100%;color:#e2e8f0;min-height:96px;cursor:pointer";
      ov.appendChild(box); document.body.appendChild(ov);
      let i = 0;
      function render() {
        if (i >= lines.length) { document.body.removeChild(ov); resolve(); return; }
        const [who, text] = lines[i];
        box.innerHTML = "<div style='font-weight:700;color:" + (COLORS[who] || "#e2e8f0") + "'>" + (NAMES[who] || who) + "</div><div style='margin-top:4px;line-height:1.6'>" + text + "</div><div style='text-align:right;color:#64748b;font-size:11px'>タップで進む ▼</div>";
      }
      ov.addEventListener("click", () => { i++; render(); });
      render();
    });
  }
  global.showDialog = showDialog;
})(window);
