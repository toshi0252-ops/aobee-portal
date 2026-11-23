"use strict";
/* GridMap部品: マップ描画・範囲ハイライト・タップ判定 */
(function (global) {
  const TERR_CLASS = { ".": "t-plain", P: "t-path", G: "t-gear", F: "t-forest", V: "t-village", R: "t-river", W: "t-water", L: "t-lamp", X: "t-block" };
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
      const ch = stage.terrain[y][x];
      cell.className = "cell " + (TERR_CLASS[ch] || "t-plain");
      const tile = (global.TILE_ART || {})[ch];
      if (tile) { cell.style.backgroundImage = "url(" + (global.assetUrl ? global.assetUrl(tile) : "assets/" + tile) + ")"; cell.style.backgroundSize = "cover"; cell.style.backgroundPosition = "center"; }
      const k = x + "," + y;
      if (this.moveTiles.has(k)) cell.classList.add("hl-move");
      if (this.attackTiles.has(k)) cell.classList.add("hl-attack");
      const u = st.units.find(u => u.hp > 0 && u.x === x && u.y === y);
      if (u) {
        const chip = document.createElement("div");
        chip.className = "chip-unit " + u.side + (u.acted && u.side === "ally" ? " acted" : "") + (u.boss ? " boss" : "");
        chip.style.background = u.color;
        chip.textContent = u.side === "npc" ? "動" : (u.pilotId ? u.name.slice(0, 1) : u.name.slice(0, 1));
        chip.title = u.name + "／" + u.unitName + " HP" + u.hp;
        cell.appendChild(chip);
        if (u.side !== "npc") {
          const bar = document.createElement("div"); bar.className = "mini-hp";
          const i = document.createElement("i"); i.style.width = Math.max(0, u.hp / u.maxHp * 100) + "%";
          bar.appendChild(i); cell.appendChild(bar);
        }
      }
      cell.addEventListener("click", () => this.onTap(x, y));
      this.el.appendChild(cell);
    }
  };
  global.GridMap = GridMap;
})(window);
