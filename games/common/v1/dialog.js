"use strict";
/* Dialog部品: 会話ウィンドウ。lines = [[who, text], ...] を順に表示し、終わったら resolve する */
(function (global) {
  const NAMES = { aobee: "あおびー", warubee: "わるびー", galdo: "ガルド", marmi: "マーミ", poco: "ポコ", minori: "みのり", mio: "ミオ", ganzou: "ガンジョウ", tia: "ティア", seira: "セイラ", rocco: "ロッコ", mist: "ミスト", granz: "グランツ", teru: "テル", hayate: "ハヤテ", kuzoku: "空賊コグ頭目", toride: "砦の守備隊長", sniper: "狙撃隊長", kaizoku: "海賊コグ隊長", granz_young: "若きグランツ", sajou: "砂上機隊長", shuei: "守衛機", fortress: "空中要塞", kuutei: "空挺隊長", tsuigeki: "追撃隊長", bousou: "大型暴走機", toubatsu: "討伐隊長" };
  const COLORS = { aobee: "#38bdf8", warubee: "#e879f9", galdo: "#d97706", marmi: "#f472b6", poco: "#4ade80", minori: "#facc15", mio: "#a78bfa", ganzou: "#94a3b8", tia: "#7dd3fc", seira: "#38bdf8", rocco: "#fbbf24", mist: "#a5b4fc", granz: "#cbd5e1", teru: "#fb923c", hayate: "#ef4444", kuzoku: "#7dd3fc", toride: "#a3e635", sniper: "#c4b5fd", kaizoku: "#5eead4", granz_young: "#cbd5e1", sajou: "#fbbf24", shuei: "#94a3b8", fortress: "#f87171", kuutei: "#7dd3fc", tsuigeki: "#fca5a5", bousou: "#ef4444", toubatsu: "#fda4af" };
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
        const face = (global.FACE_MAP || {})[who];
        const faceHtml = face ? "<img src='" + (global.assetUrl ? global.assetUrl(face) : "assets/" + face) + "' alt='' style='width:64px;height:64px;border-radius:10px;object-fit:cover;object-position:top;flex:none;border:2px solid " + (COLORS[who] || "#475569") + "'>" : "";
        box.innerHTML = "<div style='display:flex;gap:10px;align-items:flex-start'>" + faceHtml + "<div style='flex:1'><div style='font-weight:700;color:" + (COLORS[who] || "#e2e8f0") + "'>" + (NAMES[who] || who) + "</div><div style='margin-top:4px;line-height:1.6'>" + text + "</div></div></div><div style='text-align:right;color:#64748b;font-size:11px'>タップで進む ▼</div>";
      }
      ov.addEventListener("click", () => { i++; render(); });
      render();
    });
  }
  global.showDialog = showDialog;
})(window);
