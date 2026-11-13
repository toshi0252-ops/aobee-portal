'use strict';
/* 軽量2Dエンジン: 描画・移動・会話・入力・簡易サウンド
   あおびーはアトラス（4列×2行）を使用。★左右反転は絶対にしない（公式デザインが左右非対称のため） */
const Engine = (() => {
  const TILE = 32, COLS = 20, ROWS = 14;
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  /* ---------- 画像 ---------- */
  const atlas = new Image();
  let atlasOK = false;
  atlas.onload = () => { atlasOK = true; };
  atlas.src = '../../assets/characters/aobee-atlas-v1.png';
  const warubeeImg = new Image();
  let warubeeOK = false;
  warubeeImg.onload = () => { warubeeOK = true; };
  warubeeImg.src = 'assets/warubee-front-v1.png';

  /* NPCイラスト（cx/cy=顔中心の割合, side=顔切り出しの一辺の割合 ※高さ基準） */
  const NPC_FACE = {
    gardo: { file: 'npc-gardo.png', cx: 0.51, cy: 0.29, side: 0.58 },
    baker: { file: 'npc-mami.png', cx: 0.50, cy: 0.27, side: 0.47 },
    kid:   { file: 'npc-poco.png', cx: 0.38, cy: 0.36, side: 0.62 }
  };
  const npcImgs = {};
  for (const k of Object.keys(NPC_FACE)) {
    const im = new Image();
    const rec = { img: im, ok: false };
    im.onload = () => { rec.ok = true; };
    im.src = 'assets/chars/' + NPC_FACE[k].file;
    npcImgs[k] = rec;
  }
  /* 接地影（半透明の楕円グラデーション） */
  function groundShadow(c2, cx, cy, w) {
    c2.save();
    const g = c2.createRadialGradient(cx, cy, 1, cx, cy, w / 2);
    g.addColorStop(0, 'rgba(18,38,20,0.38)');
    g.addColorStop(0.7, 'rgba(18,38,20,0.18)');
    g.addColorStop(1, 'rgba(18,38,20,0)');
    c2.fillStyle = g;
    c2.beginPath(); c2.ellipse(cx, cy, w / 2, Math.max(3, w / 6), 0, 0, Math.PI * 2); c2.fill();
    c2.restore();
  }
  /* フィールド用NPCイラスト描画（アスペクト維持・足元=groundY）。描けたら true */
  function drawNpcImage(kind, cx, groundY, h) {
    const rec = npcImgs[kind];
    if (!rec || !rec.ok) return false;
    const w = h * rec.img.naturalWidth / rec.img.naturalHeight;
    ctx.drawImage(rec.img, cx - w / 2, groundY - h, w, h);
    return true;
  }
  /* タイル質感用の決定的ハッシュ（座標から安定したバラつきを出す） */
  function hash2(x, y) { let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635; h = Math.imul(h ^ (h >> 13), 1274126177); return (h ^ (h >> 16)) >>> 0; }

  /* アトラスセル: 上段 0=正面 1=背面 2=左向き 3=右向き / 下段 0=喜ぶ 1=手を伸ばす 2=左へ走る 3=右へ走る */
  function aobeeCell(dir, moving) {
    if (moving && dir === 'left') return [2, 1];
    if (moving && dir === 'right') return [3, 1];
    if (dir === 'down') return [0, 0];
    if (dir === 'up') return [1, 0];
    if (dir === 'left') return [2, 0];
    return [3, 0];
  }
  function drawAobee(x, y, size, dir, moving, joy) {
    if (atlasOK) {
      const cw = atlas.naturalWidth / 4, ch = atlas.naturalHeight / 2;
      let cell = joy ? [0, 1] : aobeeCell(dir, moving);
      ctx.drawImage(atlas, cell[0] * cw, cell[1] * ch, cw, ch, x - size / 2, y - size, size, size);
    } else {
      drawAobeeFallback(x, y, size, false);
    }
  }
  function drawAobeeTo(c2, x, y, size, warubee) {
    if (!warubee && atlasOK) {
      const cw = atlas.naturalWidth / 4, ch = atlas.naturalHeight / 2;
      c2.drawImage(atlas, 0, 0, cw, ch, x - size / 2, y - size / 2, size, size);
    } else if (warubee && warubeeOK) {
      c2.drawImage(warubeeImg, x - size / 2, y - size / 2, size, size);
    } else {
      drawCritter(c2, x, y, size, warubee);
    }
  }
  /* フォールバック兼用の簡易キャラ描画（公式配色） */
  function gearPath(c2, x, y, r, teeth, color) {
    c2.save(); c2.translate(x, y); c2.fillStyle = color;
    for (let i = 0; i < teeth; i++) {
      c2.save(); c2.rotate((Math.PI * 2 * i) / teeth);
      c2.fillRect(-r * 0.22, -r * 1.25, r * 0.44, r * 0.5); c2.restore();
    }
    c2.beginPath(); c2.arc(0, 0, r, 0, Math.PI * 2); c2.fill();
    c2.globalCompositeOperation = 'destination-out';
    c2.beginPath(); c2.arc(0, 0, r * 0.42, 0, Math.PI * 2); c2.fill();
    c2.restore(); c2.globalCompositeOperation = 'source-over';
  }
  function starPath(c2, x, y, r, color, chip) {
    c2.save(); c2.translate(x, y); c2.fillStyle = color; c2.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5, a2 = a + Math.PI / 5;
      c2.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      c2.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
    }
    c2.closePath(); c2.fill();
    if (chip) { c2.globalCompositeOperation = 'destination-out'; c2.beginPath(); c2.arc(r * 0.55, -r * 0.5, r * 0.38, 0, Math.PI * 2); c2.fill(); c2.globalCompositeOperation = 'source-over'; }
    c2.restore();
  }
  function drawCritter(c2, cx, cy, s, warubee) {
    const P = warubee
      ? { body: '#343a42', ear: '#23272d', earTip: '#e84393', belly: '#4a5158', star: '#e84393', gearEye: '#c0c6cc', bow: '#e84393', bowGear: '#c0c6cc', tail: '#8e2a5c', cheek: '#7a4457' }
      : { body: '#56b7e8', ear: '#1d4e79', earTip: '#1d4e79', belly: '#ffffff', star: '#ffd21f', gearEye: '#f59e0b', bow: '#2470c2', bowGear: '#ffd21f', tail: '#2b6cb0', cheek: '#ffb3c1' };
    const u = s / 44;
    c2.save(); c2.translate(cx, cy);
    gearPath(c2, 15 * u, 10 * u, 6.5 * u, 8, P.tail); // 歯車形の尻尾
    c2.fillStyle = P.ear; // 垂れ耳
    c2.beginPath(); c2.ellipse(-14 * u, -6 * u, 5.5 * u, 11 * u, 0.25, 0, Math.PI * 2); c2.fill();
    c2.beginPath(); c2.ellipse(14 * u, -6 * u, 5.5 * u, 11 * u, -0.25, 0, Math.PI * 2); c2.fill();
    c2.fillStyle = P.earTip;
    c2.beginPath(); c2.ellipse(-16.5 * u, 3 * u, 3.4 * u, 4.5 * u, 0.25, 0, Math.PI * 2); c2.fill();
    c2.beginPath(); c2.ellipse(16.5 * u, 3 * u, 3.4 * u, 4.5 * u, -0.25, 0, Math.PI * 2); c2.fill();
    c2.fillStyle = P.body; // 体
    c2.beginPath(); c2.ellipse(0, 2 * u, 16 * u, 15 * u, 0, 0, Math.PI * 2); c2.fill();
    c2.fillStyle = P.belly; // お腹・口元
    c2.beginPath(); c2.ellipse(0, 8 * u, 9 * u, 7 * u, 0, 0, Math.PI * 2); c2.fill();
    c2.beginPath(); c2.ellipse(0, 1 * u, 8 * u, 5.5 * u, 0, 0, Math.PI * 2); c2.fill();
    c2.fillStyle = P.cheek; // 頬
    c2.beginPath(); c2.arc(-10.5 * u, 2 * u, 3 * u, 0, Math.PI * 2); c2.fill();
    c2.beginPath(); c2.arc(10.5 * u, 2 * u, 3 * u, 0, Math.PI * 2); c2.fill();
    starPath(c2, -5.5 * u, -3.5 * u, 3.6 * u, warubee ? '#ff7ac0' : '#173a5e', false); // 星の目
    if (warubee) { c2.fillStyle = '#fff'; c2.beginPath(); c2.arc(-5.5 * u, -3.5 * u, 1.2 * u, 0, Math.PI * 2); c2.fill(); }
    gearPath(c2, 6 * u, -3.5 * u, 2.6 * u, 8, P.gearEye); // 歯車の目
    if (warubee) { c2.fillStyle = '#fff'; c2.beginPath(); c2.moveTo(2.5 * u, 5 * u); c2.lineTo(5.5 * u, 5 * u); c2.lineTo(4 * u, 8.5 * u); c2.closePath(); c2.fill(); } // 牙
    starPath(c2, 0, -16.5 * u, 6 * u, P.star, warubee); // 頭に直接の星（わるびーは欠け）
    c2.fillStyle = P.bow; // 蝶ネクタイ
    c2.beginPath(); c2.moveTo(0, 13.5 * u); c2.lineTo(-7 * u, 10.5 * u); c2.lineTo(-7 * u, 16.5 * u); c2.closePath(); c2.fill();
    c2.beginPath(); c2.moveTo(0, 13.5 * u); c2.lineTo(7 * u, 10.5 * u); c2.lineTo(7 * u, 16.5 * u); c2.closePath(); c2.fill();
    gearPath(c2, 0, 13.5 * u, 2.6 * u, 8, P.bowGear);
    c2.restore();
  }
  function drawAobeeFallback(x, y, size) { drawCritter(ctx, x, y - size / 2, size, false); }

  /* NPC簡易描画 */
  function drawNPC(c2, cx, cy, s, kind) {
    const u = s / 44;
    c2.save(); c2.translate(cx, cy);
    const skin = '#f6cfa5';
    const clothes = { gardo: '#8a5a2b', baker: '#f2f2f2', kid: '#58b368' }[kind] || '#888';
    c2.fillStyle = clothes;
    c2.beginPath(); c2.ellipse(0, 8 * u, 11 * u, 10 * u, 0, 0, Math.PI * 2); c2.fill();
    c2.fillStyle = skin;
    c2.beginPath(); c2.arc(0, -6 * u, 9 * u, 0, Math.PI * 2); c2.fill();
    if (kind === 'gardo') {
      c2.fillStyle = '#5d3c17'; c2.fillRect(-10 * u, -15 * u, 20 * u, 5 * u); // 帽子
      c2.fillStyle = '#ddd'; c2.beginPath(); c2.ellipse(0, 0, 6 * u, 4.5 * u, 0, 0, Math.PI * 2); c2.fill(); // ひげ
      gearPath(c2, 12 * u, 6 * u, 4 * u, 8, '#c49a12');
    } else if (kind === 'baker') {
      c2.fillStyle = '#fff'; c2.beginPath(); c2.ellipse(0, -14 * u, 9 * u, 5 * u, 0, 0, Math.PI * 2); c2.fill();
      c2.fillStyle = '#c0392b'; c2.fillRect(-9 * u, -10 * u, 18 * u, 3 * u);
    } else if (kind === 'kid') {
      c2.fillStyle = '#ffd21f'; c2.beginPath(); c2.arc(0, -13 * u, 5 * u, 0, Math.PI * 2); c2.fill();
    }
    c2.fillStyle = '#222';
    c2.beginPath(); c2.arc(-3.5 * u, -6 * u, 1.3 * u, 0, Math.PI * 2); c2.fill();
    c2.beginPath(); c2.arc(3.5 * u, -6 * u, 1.3 * u, 0, Math.PI * 2); c2.fill();
    c2.restore();
  }
  /* 敵描画（コグ＝錆びた歯車モンスター） */
  function drawCog(c2, cx, cy, s) {
    const u = s / 60;
    c2.save(); c2.translate(cx, cy);
    gearPath(c2, 0, 0, 20 * u, 10, '#a35a24');
    gearPath(c2, 0, 0, 14 * u, 8, '#c97e35');
    c2.fillStyle = '#7a3f14'; c2.beginPath(); c2.arc(0, 0, 9 * u, 0, Math.PI * 2); c2.fill();
    c2.fillStyle = '#ffe066'; c2.beginPath(); c2.arc(-3 * u, -2 * u, 3 * u, 0, Math.PI * 2); c2.fill();
    c2.fillStyle = '#f33'; c2.beginPath(); c2.arc(-3 * u, -2 * u, 1.4 * u, 0, Math.PI * 2); c2.fill();
    c2.fillStyle = '#5d3c17';
    c2.save(); c2.rotate(0.6); c2.fillRect(10 * u, -24 * u, 5 * u, 10 * u); c2.restore();
    c2.restore();
  }
  function drawKarakuri(c2, cx, cy, s) {
    const u = s / 60;
    c2.save(); c2.translate(cx, cy);
    c2.fillStyle = '#b0854f'; c2.fillRect(-13 * u, -6 * u, 26 * u, 30 * u); // 木の胴
    c2.strokeStyle = '#7a5a30'; c2.lineWidth = 2; c2.strokeRect(-13 * u, -6 * u, 26 * u, 30 * u);
    gearPath(c2, 0, -16 * u, 11 * u, 9, '#8a929c'); // 頭の歯車
    c2.fillStyle = '#ffe066'; c2.beginPath(); c2.arc(-4 * u, 4 * u, 2.4 * u, 0, Math.PI * 2); c2.fill();
    c2.beginPath(); c2.arc(4 * u, 4 * u, 2.4 * u, 0, Math.PI * 2); c2.fill();
    c2.fillStyle = '#7a5a30'; c2.fillRect(-16 * u, 0, 5 * u, 18 * u); c2.fillRect(11 * u, 0, 5 * u, 18 * u); // 腕
    c2.restore();
  }

  /* ---------- サウンド（WebAudio・初回操作後に初期化） ---------- */
  let AC = null;
  function audioInit() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } if (AC && AC.state === 'suspended') AC.resume(); bgmKick(); }
  function beep(freq, dur, type, vol) {
    if (!AC) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.value = vol || 0.05;
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + dur);
  }
  /* ---------- BGM（WebAudio簡易シーケンサ・外部音源なし） ---------- */
  const BGM_VOL = 0.07; // マスター音量（効果音より小さめ）
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12); // MIDIノート番号→周波数
  // mel/bass は8分音符グリッドのMIDIノート列（0=休符）、各32ステップ（8小節）のループ
  const BGM_TRACKS = {
    field: { step: 0.30, wave: 'triangle', melVol: 0.55, bassVol: 0.9, // 穏やかな村: Cメジャーペンタ、コード C-F-C-G
      mel:  [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 69, 0, 71, 0, 72, 0, 76, 0, 81, 0, 79, 0, 76, 0, 74, 0, 72, 0, 0, 0],
      bass: [48, 0, 0, 0, 0, 0, 0, 0, 53, 0, 0, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0] },
    battle: { step: 0.24, wave: 'square', melVol: 0.38, bassVol: 0.9, // 少し緊張感: Aマイナー、コード Am-F-G-Am
      mel:  [69, 0, 72, 0, 69, 0, 67, 0, 69, 0, 74, 0, 72, 0, 69, 0, 65, 0, 69, 0, 65, 0, 64, 0, 67, 0, 71, 0, 69, 0, 0, 0],
      bass: [45, 0, 0, 0, 45, 0, 0, 0, 41, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0, 43, 0, 0, 0, 45, 0, 0, 0, 47, 0, 0, 0] },
    boss: { step: 0.20, wave: 'sawtooth', melVol: 0.30, bassVol: 0.95, // 速め・重め: Dマイナー、8分パルスのベース
      mel:  [62, 0, 62, 65, 0, 62, 0, 60, 0, 62, 0, 58, 0, 61, 0, 62, 0, 62, 65, 0, 69, 0, 67, 0, 65, 0, 64, 0, 62, 0, 0, 0],
      bass: [38, 0, 38, 0, 38, 0, 45, 0, 36, 0, 36, 0, 36, 0, 43, 0, 38, 0, 38, 0, 38, 0, 45, 0, 41, 0, 41, 0, 43, 0, 45, 0] }
  };
  let bgmName = null, bgmTimer = null, bgmStepIdx = 0, bgmNextTime = 0, bgmGainNode = null;
  let bgmIsMuted = false;
  try { bgmIsMuted = localStorage.getItem('aobeeGrandBgm') === 'off'; } catch (e) { /* 読めない環境ではON扱い */ }
  function bgmTone(freq, t, dur, type, vol) {
    if (!AC || !bgmGainNode) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0011, vol), t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bgmGainNode);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function bgmTick() { // ルックアヘッド方式: 0.22秒先まで予約してループ
    if (!AC || !bgmName) return;
    const tr = BGM_TRACKS[bgmName]; if (!tr) return;
    while (bgmNextTime < AC.currentTime + 0.22) {
      const i = bgmStepIdx % tr.mel.length;
      if (tr.mel[i]) bgmTone(mf(tr.mel[i]), bgmNextTime, tr.step * 0.92, tr.wave, tr.melVol);
      if (tr.bass[i]) bgmTone(mf(tr.bass[i]), bgmNextTime, tr.step * 1.9, 'sine', tr.bassVol);
      bgmNextTime += tr.step; bgmStepIdx++;
    }
  }
  function bgmKick() { // AudioContext準備後にシーケンサを（再）起動。曲名は保持されるのでジェスチャ前に指定しても鳴り出す
    if (!AC || !bgmName || bgmTimer) return;
    if (!bgmGainNode) {
      bgmGainNode = AC.createGain();
      bgmGainNode.gain.value = bgmIsMuted ? 0 : BGM_VOL;
      bgmGainNode.connect(AC.destination);
    }
    bgmStepIdx = 0; bgmNextTime = AC.currentTime + 0.06;
    bgmTimer = setInterval(bgmTick, 40);
  }
  function bgmSet(name) {
    if (name === bgmName) { bgmKick(); return; }
    bgmName = name;
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    if (name) bgmKick();
  }

  const Snd = {
    step: () => {}, ok: () => beep(660, 0.07, 'square', 0.04),
    pickup: () => { beep(880, 0.08, 'square', 0.05); setTimeout(() => beep(1320, 0.1, 'square', 0.05), 70); },
    hit: () => beep(140, 0.15, 'sawtooth', 0.07),
    hurt: () => beep(220, 0.18, 'sawtooth', 0.06),
    win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'square', 0.05), i * 110)); },
    gear: () => { beep(196, 0.3, 'triangle', 0.08); setTimeout(() => beep(98, 0.4, 'triangle', 0.08), 200); },
    /* BGM: bgm('field'|'battle'|'boss') で開始/切替、bgm(null) で停止。ミュートはBGMのみ（効果音は鳴る） */
    bgm: (name) => bgmSet(name || null),
    bgmMuted: () => bgmIsMuted,
    setBgmMuted: (m) => {
      bgmIsMuted = !!m;
      try { localStorage.setItem('aobeeGrandBgm', bgmIsMuted ? 'off' : 'on'); } catch (e) { /* 保存不可環境では無視 */ }
      if (bgmGainNode) bgmGainNode.gain.value = bgmIsMuted ? 0 : BGM_VOL;
    }
  };

  /* ---------- 入力 ---------- */
  const keys = {};
  const Input = {
    dirX: 0, dirY: 0, aPressed: false, bPressed: false, dash: false,
    _aEdge: false,
    consumeA() { const v = this._aEdge; this._aEdge = false; return v; }
  };
  const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
  function pressA() { if (!Input.aPressed) Input._aEdge = true; Input.aPressed = true; }
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase(); // 大文字WASD・Shift・矢印・Enterをすべて小文字キー名に統一
    keys[k] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (k === 'z' || k === 'enter' || k === ' ') pressA();
    audioInit();
    updateDir();
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = false;
    if (k === 'z' || k === 'enter' || k === ' ') Input.aPressed = false;
    updateDir();
  });
  const touchDir = { x: 0, y: 0 };
  function updateDir() {
    let x = 0, y = 0;
    if (keys['arrowleft'] || keys['a']) x = -1;
    else if (keys['arrowright'] || keys['d']) x = 1;
    if (keys['arrowup'] || keys['w']) y = -1;
    else if (keys['arrowdown'] || keys['s']) y = 1;
    if (x === 0 && y === 0) { x = touchDir.x; y = touchDir.y; }
    Input.dirX = x; Input.dirY = y;
    Input.dash = !!(keys['shift']);
  }
  function bindTouch() {
    if ('ontouchstart' in window) document.body.classList.add('touch');
    document.querySelectorAll('#dpad .dbtn').forEach((b) => {
      const d = b.dataset.dir, v = DIRV[d];
      const on = (e) => { e.preventDefault(); audioInit(); touchDir.x = v[0]; touchDir.y = v[1]; b.classList.add('on'); updateDir(); };
      const off = (e) => { e.preventDefault(); if (touchDir.x === v[0] && touchDir.y === v[1]) { touchDir.x = 0; touchDir.y = 0; } b.classList.remove('on'); updateDir(); };
      b.addEventListener('touchstart', on, { passive: false }); b.addEventListener('touchend', off, { passive: false });
      b.addEventListener('mousedown', on); b.addEventListener('mouseup', off); b.addEventListener('mouseleave', off);
    });
    const a = document.getElementById('btn-a'), bb = document.getElementById('btn-b');
    const aOn = (e) => { e.preventDefault(); audioInit(); pressA(); a.classList.add('on'); };
    const aOff = (e) => { e.preventDefault(); Input.aPressed = false; a.classList.remove('on'); };
    a.addEventListener('touchstart', aOn, { passive: false }); a.addEventListener('touchend', aOff, { passive: false });
    a.addEventListener('mousedown', aOn); a.addEventListener('mouseup', aOff);
    bb.addEventListener('touchstart', (e) => { e.preventDefault(); Input.bPressed = true; }, { passive: false });
    bb.addEventListener('touchend', () => { Input.bPressed = false; });
    cv.addEventListener('touchstart', () => { audioInit(); pressA(); }, { passive: true });
    cv.addEventListener('touchend', () => { Input.aPressed = false; });
  }

  /* ---------- 会話 ---------- */
  const dlgEl = document.getElementById('dlg');
  const dlgName = document.getElementById('dlg-name');
  const dlgText = document.getElementById('dlg-text');
  const dlgFaceImg = document.getElementById('dlg-face-img');
  const dlgFaceCv = document.getElementById('dlg-face-canvas');
  const dlgChoices = document.getElementById('dlg-choices');
  const Dialogue = {
    active: false, queue: [], idx: 0, chars: 0, timer: null, onDone: null, choiceCb: null, sel: 0,
    play(lines, onDone) {
      this.queue = lines.slice(); this.idx = 0; this.onDone = onDone || null;
      this.active = true; dlgEl.classList.remove('hidden'); this.showLine();
    },
    showLine() {
      const ln = this.queue[this.idx];
      if (!ln) return this.finish();
      dlgChoices.classList.add('hidden'); dlgChoices.innerHTML = '';
      dlgName.textContent = ln.name || '';
      this.setFace(ln.face);
      const full = ln.text; this.chars = 0;
      dlgText.textContent = '';
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        this.chars++;
        dlgText.textContent = full.slice(0, this.chars);
        if (this.chars >= full.length) clearInterval(this.timer);
      }, 24);
      this._full = full;
    },
    setFace(face) {
      dlgFaceImg.style.display = 'none'; dlgFaceCv.style.display = 'none';
      if (!face) return;
      if (face === 'warubee' && warubeeOK) { dlgFaceImg.src = warubeeImg.src; dlgFaceImg.style.display = 'block'; return; }
      const nrec = npcImgs[face];
      if (nrec && nrec.ok) { // NPCはイラストの顔部分を切り出して表示
        const c2 = dlgFaceCv.getContext('2d');
        c2.clearRect(0, 0, 96, 96);
        dlgFaceCv.style.display = 'block';
        const F = NPC_FACE[face], W = nrec.img.naturalWidth, H = nrec.img.naturalHeight;
        const sp = F.side * H;
        const sx = Math.min(Math.max(F.cx * W - sp / 2, 0), Math.max(0, W - sp));
        const sy = Math.min(Math.max(F.cy * H - sp / 2, 0), Math.max(0, H - sp));
        c2.drawImage(nrec.img, sx, sy, sp, sp, 0, 0, 96, 96);
        return;
      }
      const c2 = dlgFaceCv.getContext('2d');
      c2.clearRect(0, 0, 96, 96);
      dlgFaceCv.style.display = 'block';
      if (face === 'aobee') drawAobeeTo(c2, 48, 48, 88, false);
      else if (face === 'warubee') drawAobeeTo(c2, 48, 48, 88, true);
      else drawNPC(c2, 48, 52, 84, face);
    },
    advance() {
      if (!this.active) return false;
      if (this._choices) return true; // 選択中は進めない
      const ln = this.queue[this.idx];
      if (this.chars < (this._full || '').length) {
        clearInterval(this.timer); this.chars = this._full.length; dlgText.textContent = this._full; return true;
      }
      if (ln && ln.choice) { this.showChoices(ln.choice); return true; }
      this.idx++;
      if (this.idx >= this.queue.length) this.finish(); else this.showLine();
      return true;
    },
    showChoices(choices) {
      this.sel = 0;
      dlgChoices.innerHTML = '';
      choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.textContent = (i === 0 ? '▶ ' : '　') + c.label;
        b.addEventListener('click', (e) => { e.stopPropagation(); this.pick(i); });
        dlgChoices.appendChild(b);
      });
      dlgChoices.classList.remove('hidden');
      this._choices = choices;
    },
    moveSel(d) {
      if (!this._choices) return;
      this.sel = (this.sel + d + this._choices.length) % this._choices.length;
      [...dlgChoices.children].forEach((b, i) => { b.textContent = (i === this.sel ? '▶ ' : '　') + this._choices[i].label; });
    },
    pick(i) {
      const c = this._choices[i];
      this._choices = null;
      dlgChoices.classList.add('hidden'); dlgChoices.innerHTML = '';
      Snd.ok();
      const rest = c.then || [];
      if (rest.length) { this.queue = rest.slice(); this.idx = 0; this._choiceResult = i; this.showLine(); }
      else { this._choiceResult = i; this.finish(); }
    },
    confirmSel() { if (this._choices) this.pick(this.sel); },
    finish() {
      this.active = false; clearInterval(this.timer);
      dlgEl.classList.add('hidden');
      const cb = this.onDone, res = this._choiceResult;
      this.onDone = null; this._choiceResult = undefined;
      if (cb) cb(res);
    }
  };
  dlgEl.addEventListener('click', () => { audioInit(); Dialogue.advance(); });

  /* ---------- ワールド ---------- */
  const World = {
    mapId: null, map: null, hooks: {},
    player: { gx: 10, gy: 11, px: 10 * TILE, py: 11 * TILE, dir: 'down', moving: false, joyT: 0 },
    actors: [], fade: 0, fadeCb: null,
    tileAt(gx, gy) {
      if (!this.map || gy < 0 || gy >= ROWS || gx < 0 || gx >= COLS) return '#';
      return this.map.grid[gy][gx];
    },
    setTile(gx, gy, ch) {
      const row = this.map.grid[gy];
      this.map.grid[gy] = row.substring(0, gx) + ch + row.substring(gx + 1);
    },
    solid(gx, gy) {
      const t = this.tileAt(gx, gy);
      if (t === '#' || t === 'T' || t === 'H' || t === '~' || t === 'S') return true;
      if (t === 'X' && !(this.hooks.hooksState && this.hooks.hooksState().bridgeOpen)) return true;
      if (this.map.npcs.some(n => !n.hidden && n.x === gx && n.y === gy)) return true;
      if (this.actors.some(a => a.visible && a.x === gx && a.y === gy)) return true;
      return false;
    },
    loadMap(id, tx, ty, instant) {
      const doLoad = () => {
        this.mapId = id;
        this.map = JSON.parse(JSON.stringify(Data.maps[id]));
        // 収集済みタイルの復元はフック側の状態で行う
        if (this.hooks.applyTiles) this.hooks.applyTiles(this);
        this.player.gx = tx; this.player.gy = ty;
        this.player.px = tx * TILE; this.player.py = ty * TILE;
        this.actors = [];
        if (this.hooks.onMapEnter) this.hooks.onMapEnter(id);
      };
      if (instant) { doLoad(); return; }
      this.fade = 1; this._fadeIn = false;
      setTimeout(() => { doLoad(); this.fade = 0; }, 180);
    },
    update(dt) {
      const p = this.player;
      if (Dialogue.active) {
        if (Input.consumeA()) { if (Dialogue._choices) Dialogue.confirmSel(); else Dialogue.advance(); }
        this.render(); return;
      }
      if (this.frozen) { this.render(); return; }
      if (typeof Battle !== 'undefined' && Battle.active) { this.render(); return; }
      const targetX = p.gx * TILE, targetY = p.gy * TILE;
      const dx = targetX - p.px, dy = targetY - p.py;
      if (dx !== 0 || dy !== 0) {
        const sp = (Input.dash && this.hooks.hooksState && this.hooks.hooksState().boots ? 340 : 190) * dt;
        const dist = Math.hypot(dx, dy);
        if (dist <= sp) { p.px = targetX; p.py = targetY; }
        else { p.px += (dx / dist) * sp; p.py += (dy / dist) * sp; }
        p.moving = true;
      } else {
        p.moving = false;
        let mx = Input.dirX, my = Input.dirY;
        if (mx !== 0) my = 0;
        if (mx !== 0 || my !== 0) {
          p.dir = mx < 0 ? 'left' : mx > 0 ? 'right' : my < 0 ? 'up' : 'down';
          const nx = p.gx + mx, ny = p.gy + my;
          if (!this.solid(nx, ny)) {
            p.gx = nx; p.gy = ny;
            if (this.hooks.onStep) this.hooks.onStep(nx, ny, this.tileAt(nx, ny));
          }
        }
      }
      if (Input.consumeA()) {
        if (Dialogue.active) Dialogue.advance();
        else if (this.hooks.onInteract) this.hooks.onInteract();
      }
      this.render();
    },
    frontTile() {
      const v = DIRV[this.player.dir];
      return { x: this.player.gx + v[0], y: this.player.gy + v[1] };
    },
    render() {
      const m = this.map; if (!m) return;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const t = m.grid[y][x], px = x * TILE, py = y * TILE;
        const h1 = hash2(x, y);
        // 草地: 差を抑えた2色＋座標依存の微細ドット/草葉で質感を出す
        ctx.fillStyle = (x + y) % 2 ? '#7cb95e' : '#84bf64';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,220,0.10)';
        ctx.fillRect(px + 2 + (h1 % 24), py + 2 + ((h1 >> 3) % 24), 2, 2);
        ctx.fillRect(px + 3 + ((h1 >> 9) % 22), py + 4 + ((h1 >> 12) % 22), 2, 2);
        ctx.fillStyle = 'rgba(30,80,30,0.13)';
        ctx.fillRect(px + 3 + ((h1 >> 5) % 22), py + 4 + ((h1 >> 7) % 22), 3, 2);
        ctx.strokeStyle = 'rgba(43,100,40,0.55)'; ctx.lineWidth = 1.4;
        const gxx = px + 5 + ((h1 >> 15) % 18), gyy = py + 21 + ((h1 >> 18) % 7);
        ctx.beginPath(); ctx.moveTo(gxx, gyy + 4); ctx.lineTo(gxx, gyy); ctx.moveTo(gxx + 3, gyy + 5); ctx.lineTo(gxx + 3, gyy + 2); ctx.stroke();
        if (t === ',' ) { // 道: 砂色グラデーション＋小石と花
          const pg = ctx.createLinearGradient(px, py, px, py + TILE);
          pg.addColorStop(0, '#d3bd68'); pg.addColorStop(1, '#c0a954');
          ctx.fillStyle = pg; ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = 'rgba(120,95,40,0.25)';
          ctx.fillRect(px + 2 + ((h1 >> 4) % 24), py + 2 + ((h1 >> 6) % 24), 3, 2);
          ctx.fillStyle = '#e88bb0'; ctx.fillRect(px + 6, py + 8, 4, 4); ctx.fillRect(px + 20, py + 20, 4, 4);
          ctx.fillStyle = '#fff'; ctx.fillRect(px + 7, py + 9, 2, 2); ctx.fillRect(px + 21, py + 21, 2, 2);
        }
        if (t === 'T' || t === '#') { // 木: 接地影＋幹＋輪郭とハイライトつき樹冠
          groundShadow(ctx, px + 16, py + 29, 24);
          ctx.fillStyle = '#6d4c2f'; ctx.fillRect(px + 13, py + 20, 6, 11);
          ctx.fillStyle = '#8a6238'; ctx.fillRect(px + 13, py + 20, 2.5, 11);
          const cg = ctx.createRadialGradient(px + 12, py + 10, 3, px + 16, py + 14, 15);
          cg.addColorStop(0, '#6fae4e'); cg.addColorStop(0.65, '#4d7d3a'); cg.addColorStop(1, '#3a612b');
          ctx.fillStyle = cg;
          ctx.beginPath(); ctx.arc(px + 16, py + 14, 13, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(28,58,24,0.55)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(px + 16, py + 14, 13, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,230,0.20)';
          ctx.beginPath(); ctx.arc(px + 11, py + 9, 4.5, 0, Math.PI * 2); ctx.fill();
        }
        if (t === 'H') { // 家: 壁グラデーション＋屋根とその落とす影
          const wg = ctx.createLinearGradient(px, py + 8, px, py + 32);
          wg.addColorStop(0, '#f4ead2'); wg.addColorStop(1, '#dccca4');
          ctx.fillStyle = wg; ctx.fillRect(px, py + 8, TILE, 24);
          ctx.fillStyle = 'rgba(122,92,50,0.30)'; ctx.fillRect(px, py + 29, TILE, 3);
          ctx.fillStyle = '#b0512f'; ctx.beginPath(); ctx.moveTo(px - 2, py + 10); ctx.lineTo(px + 16, py - 2); ctx.lineTo(px + 34, py + 10); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.moveTo(px - 2, py + 10); ctx.lineTo(px + 16, py - 2); ctx.lineTo(px + 16, py + 10); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(60,30,10,0.20)'; ctx.fillRect(px, py + 10, TILE, 3);
        }
        if (t === '~') { // 水: 明るいグラデーション＋ゆらぐ波紋とキラキラ
          const wag = ctx.createLinearGradient(px, py, px, py + TILE);
          wag.addColorStop(0, '#57b6ec'); wag.addColorStop(1, '#2f7fc4');
          ctx.fillStyle = wag; ctx.fillRect(px, py, TILE, TILE);
          const tw = Math.round(Math.sin(performance.now() / 600 + x * 1.7 + y * 2.3) * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(px + 4 + tw, py + 8, 12, 2.5); ctx.fillRect(px + 16 - tw, py + 22, 12, 2.5);
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillRect(px + 8 + (h1 % 14), py + 15 + ((h1 >> 4) % 8), 2, 2);
        }
        if (t === '=') { ctx.fillStyle = '#a9805a'; ctx.fillRect(px, py + 4, TILE, 24); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(px, py + 4, TILE, 3); ctx.fillStyle = '#8a653f'; ctx.fillRect(px, py + 10, TILE, 3); ctx.fillRect(px, py + 22, TILE, 3); }
        if (t === 'X') {
          ctx.fillStyle = '#a9805a'; ctx.fillRect(px, py + 4, TILE, 24); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(px, py + 4, TILE, 3);
          const open = this.hooks.hooksState && this.hooks.hooksState().bridgeOpen;
          if (!open) gearPath(ctx, px + 16, py + 16, 7, 8, '#8a929c');
        }
        if (t === 'S') { ctx.fillStyle = '#8a653f'; ctx.fillRect(px + 13, py + 10, 6, 18); ctx.fillStyle = '#e8dcc3'; ctx.fillRect(px + 5, py + 2, 22, 13); }
        if (t === 'F') { ctx.save(); ctx.translate(px + 16, py + 16); ctx.rotate(performance.now() / 900); gearPath(ctx, 0, 0, 7, 8, '#ffd21f'); ctx.restore(); }
        if (t === 'G') { ctx.save(); ctx.translate(px + 16, py + 16); ctx.rotate(-performance.now() / 1200); gearPath(ctx, 0, 0, 9, 9, '#c0c6cc'); ctx.restore(); }
        if (t === 'D') { // 出入口: 道と同じ砂色グラデーション
          const dg = ctx.createLinearGradient(px, py, px, py + TILE);
          dg.addColorStop(0, '#d3bd68'); dg.addColorStop(1, '#bfa855');
          ctx.fillStyle = dg; ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = '#b39d45'; ctx.fillRect(px + 3, py + 6, 4, 4); ctx.fillRect(px + 24, py + 20, 4, 4);
        }
      }
      // 出口サイン（行き先ラベル＋矢印）
      if (m.exits) {
        const groups = {};
        for (const ex of m.exits) { if (!ex.label) continue; const k = ex.to + '|' + ex.label; (groups[k] = groups[k] || []).push(ex); }
        for (const k of Object.keys(groups)) {
          const arr = groups[k];
          const cx = (arr.reduce((s, e) => s + e.x, 0) / arr.length) * TILE + 16;
          const ey = arr[0].y;
          const atBottom = ey >= ROWS - 2, atTop = ey <= 1;
          const bob = Math.round(Math.sin(performance.now() / 350) * 2);
          const ly = atTop ? (ey + 1) * TILE + 10 : ey * TILE - 12;
          ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const w = ctx.measureText(arr[0].label).width + 14;
          ctx.fillStyle = 'rgba(23,45,59,0.88)';
          ctx.beginPath(); ctx.roundRect(cx - w / 2, ly - 9, w, 18, 9); ctx.fill();
          ctx.fillStyle = '#ffd21f'; ctx.fillText(arr[0].label, cx, ly + 1);
          ctx.fillStyle = '#ffd21f';
          ctx.beginPath();
          if (atBottom) { ctx.moveTo(cx - 6, ey * TILE - 24 + bob); ctx.lineTo(cx + 6, ey * TILE - 24 + bob); ctx.lineTo(cx, ey * TILE - 16 + bob); }
          else if (atTop) { ctx.moveTo(cx - 6, (ey + 1) * TILE + 22 + bob); ctx.lineTo(cx + 6, (ey + 1) * TILE + 22 + bob); ctx.lineTo(cx, (ey + 1) * TILE + 14 + bob); }
          ctx.closePath(); ctx.fill();
        }
      }
      // 村の大歯車タワー
      if (this.mapId === 'village') {
        ctx.fillStyle = '#8a929c'; ctx.fillRect(9 * TILE + 12, 0, 8, 30); ctx.fillRect(10 * TILE + 12, 0, 8, 30);
        const st = this.hooks.hooksState ? this.hooks.hooksState() : {};
        if (st.gearRestored) { ctx.save(); ctx.translate(10 * TILE, 16); ctx.rotate(performance.now() / 3000); gearPath(ctx, 0, 0, 15, 10, '#c49a12'); ctx.restore(); }
        else { ctx.fillStyle = '#6b7280'; ctx.fillRect(9 * TILE + 26, 10, 28, 5); }
      }
      // NPC（接地影つき。NPCはイラスト優先、読込失敗時のみコード描画）
      for (const n of m.npcs) {
        if (n.hidden) continue;
        const ncx = n.x * TILE + 16;
        if (n.kind === 'warubee') {
          groundShadow(ctx, ncx, n.y * TILE + 31, 26);
          if (warubeeOK) ctx.drawImage(warubeeImg, n.x * TILE - 6, n.y * TILE - 14, 44, 44);
          else drawCritter(ctx, ncx, n.y * TILE + 16, 40, true);
        } else {
          groundShadow(ctx, ncx, n.y * TILE + 33, 26);
          if (!drawNpcImage(n.kind, ncx, n.y * TILE + 33, 44)) drawNPC(ctx, ncx, n.y * TILE + 18, 40, n.kind);
        }
      }
      // イベントアクター
      for (const a of this.actors) {
        if (!a.visible) continue;
        if (a.kind === 'warubee') {
          groundShadow(ctx, a.x * TILE + 16, a.y * TILE + 27, 30);
          if (warubeeOK) ctx.drawImage(warubeeImg, a.x * TILE - 10, a.y * TILE - 26, 52, 52);
          else drawCritter(ctx, a.x * TILE + 16, a.y * TILE + 8, 48, true);
        }
      }
      // プレイヤー（接地影つき）
      const p = this.player;
      const joy = p.joyT > performance.now();
      groundShadow(ctx, p.px + 16, p.py + 33, 26);
      drawAobee(p.px + 16, p.py + 34, 42, p.dir, p.moving, joy);
      if (this.fade) { ctx.fillStyle = `rgba(0,0,0,${this.fade})`; ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE); }
    }
  };

  let last = 0;
  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    if (World.map) World.update(dt);
    requestAnimationFrame(loop);
  }
  function start() { bindTouch(); window.addEventListener('pointerdown', audioInit); requestAnimationFrame(loop); }
  // 会話中の方向キー選択
  window.addEventListener('keydown', (e) => {
    if (Dialogue.active && Dialogue._choices) {
      if (e.key === 'ArrowUp') { Dialogue.moveSel(-1); e.preventDefault(); }
      if (e.key === 'ArrowDown') { Dialogue.moveSel(1); e.preventDefault(); }
      if (e.key === 'z' || e.key === 'Enter' || e.key === ' ') { Dialogue.confirmSel(); e.preventDefault(); }
    }
  });

  return { World, Dialogue, Input, Snd, drawAobeeTo, drawCritter, drawNPC, drawCog, drawKarakuri, start, TILE };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
