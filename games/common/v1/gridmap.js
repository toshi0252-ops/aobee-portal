"use strict";
/* GridMap部品: マップ描画・範囲ハイライト・タップ判定 */
(function (global) {
  const TERR_CLASS = { ".": "t-plain", P: "t-path", G: "t-gear", F: "t-forest", V: "t-village", R: "t-river", W: "t-water", S: "t-sand", L: "t-lamp", D: "t-block", X: "t-block" };
  function GridMap(el, onTap) {
    this.el = el; this.onTap = onTap;
    this.moveTiles = new Map(); this.attackTiles = new Set();
  }
  GridMap.prototype.setHighlights = function (moveTiles, attackTiles) {
    this.moveTiles = new Map((moveTiles || []).map(t => [t.x + "," + t.y, t]));
    this.attackTiles = new Set((attackTiles || []).map(t => t.x + "," + t.y));
  };
  GridMap.prototype.render = function (st) {
    const stage = st.stage, w = stage.terrain[0].length, h = stage.terrain.length;
    this.el.innerHTML = "";
    this.el.style.gridTemplateColumns = "repeat(" + w + ",1fr)";
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const cell = document.createElement("div");
      let ch = stage.terrain[y][x];
      if (ch === "D" && st.gateOpen) ch = "P"; // 開いた砦の門は通路として描く
      cell.className = "cell " + (TERR_CLASS[ch] || "t-plain");
      const tileEntry = (global.TILE_ART || {})[ch];
      // 地形ごとに複数バリエーションがある場合は座標ハッシュで決定的に選ぶ（再描画で変わらない）
      const tile = Array.isArray(tileEntry) ? tileEntry[(x * 7 + y * 13) % tileEntry.length] : tileEntry;
      if (tile) { cell.style.backgroundImage = "url(" + (global.assetUrl ? global.assetUrl(tile) : "assets/" + tile) + ")"; cell.style.backgroundSize = "cover"; cell.style.backgroundPosition = "center"; }
      const k = x + "," + y;
      if (this.moveTiles.has(k)) cell.classList.add("hl-move");
      if (this.attackTiles.has(k)) cell.classList.add("hl-attack");
      const u = st.units.find(u => u.hp > 0 && u.x === x && u.y === y);
      if (u) {
        const art = (global.UNIT_ICON || {})[u.unitId] || (global.UNIT_ART || {})[u.unitId];
        if (art) {
          const img = document.createElement("img");
          img.className = "chip-img " + u.side + (u.acted && u.side === "ally" ? " acted" : "") + (u.boss ? " boss" : "");
          img.src = global.assetUrl ? global.assetUrl(art) : "assets/" + art;
          img.alt = u.name;
          img.title = u.name + "／" + u.unitName + " HP" + u.hp;
          cell.appendChild(img);
        } else {
          const chip = document.createElement("div");
          chip.className = "chip-unit " + u.side + (u.acted && u.side === "ally" ? " acted" : "") + (u.boss ? " boss" : "");
          chip.style.background = u.color;
          chip.textContent = u.side === "npc" ? "動" : u.name.slice(0, 1);
          chip.title = u.name + "／" + u.unitName + " HP" + u.hp;
          cell.appendChild(chip);
        }
        { // HPバーは npc（動物・民間人・船）にも出す。護衛対象の残HPが見えないと守りようがないため
          const bar = document.createElement("div"); bar.className = "mini-hp";
          const i = document.createElement("i"); i.style.width = Math.max(0, u.hp / u.maxHp * 100) + "%";
          bar.appendChild(i); cell.appendChild(bar);
        }
        const fw = (st.foresight || {})[u.uid]; // ティアの予見: 次の敵フェイズの危険警告
        if (fw) {
          const b = document.createElement("div");
          b.className = "chip-warn" + (fw.lethal ? " lethal" : "");
          b.textContent = "⚠";
          b.title = "ティアの予見: 次の敵フェイズで " + fw.from + " から最大 " + fw.dmg + " ダメージ" + (fw.lethal ? "（撃墜の恐れ！）" : "");
          cell.appendChild(b);
        }
      }
      cell.addEventListener("click", () => this.onTap(x, y));
      this.el.appendChild(cell);
    }
  };
  global.GridMap = GridMap;
})(window);
