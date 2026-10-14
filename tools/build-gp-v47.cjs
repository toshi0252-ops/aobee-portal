const fs=require('fs');let s=fs.readFileSync('games/aobee_grand_prix_v46_turn_relay.html','utf8');
function r(a,b){if(!s.includes(a))throw Error(a.slice(0,90));s=s.replace(a,b)}
r('</head>','<link rel="stylesheet" href="../assets/gp-race-menu-v47.css?v=47b"></head>');
s=s.replaceAll('v4.6','v4.7');
r('<div class="titleBadge">','<div class="race-layout"><div class="race-intro"><picture id="raceTitleArt"><source type="image/webp" srcset="../assets/title-covers/race-v2.webp"><img src="../assets/title-covers/race-v2.jpg" width="1672" height="941" alt="あおびー GRAND PRIX — あおびーとわるびーのカート対決"></picture><div class="titleBadge">');
r('<div id="recordLine">','</div><div class="race-setup"><div id="recordLine">');
r('<button id="start">レーススタート！</button>','<button id="start">レーススタート！</button></div></div>');
r('<div class="online-actions">','<ol class="connection-steps" aria-label="対戦の手順"><li>1 部屋</li><li>2 接続</li><li>3 READY</li></ol><div class="online-actions">');
r('<div id="roomCodeDisplay">','<div id="roomNumberRow" hidden><div id="roomCodeDisplay">');
r('<div id="onlineStatus">','</div><div id="onlineStatus" role="status" aria-live="polite">');
r('placeholder="6桁"','placeholder="6桁の番号" aria-label="参加する部屋の6桁番号"');
s=s.replace(/<div class="net-note">.*?<\/div>/,'<div class="net-note">ホスト：あおびー ／ 参加者：わるびー<br>2人ともREADYになったら、ホストがスタート。</div>');
r("const TITLE_TEXT = '"+s.split("const TITLE_TEXT = '")[1].split("';")[0]+"';","const TITLE_TEXT = '3つのコースを、アイテムとドリフトで駆け抜けよう。';");
r("const ONLINE_TITLE_TEXT = '"+s.split("const ONLINE_TITLE_TEXT = '")[1].split("';")[0]+"';","const ONLINE_TITLE_TEXT = 'あおびー VS わるびー。先に3周で勝利！';");
r('if (!online) return;\n  el.roomCodeDisplay',"if (!online) return;\n  el.onlineLobby.dataset.stage=netReady&&netRemoteReady?'ready':netConnected?'connected':netRole?'waiting':'idle';\n  document.getElementById('roomNumberRow').hidden=!netRoom;\n  document.getElementById('retryConnection').hidden=!netRole||netConnected;\n  el.roomCodeDisplay");
r("function showPanel(title, html) {", "function showPanel(title, html) { el.panel.classList.toggle('result-panel',!title.includes('GRAND PRIX'));");
r("function syncModeUi() {","function syncModeUi() {\n  el.panel.classList.toggle('result-panel',false);");
r('<script src="../assets/gp-turn-client', '<script src="../assets/gp-racer-sprites.js?v=47"></script><script src="../assets/gp-turn-client');
r('function drawRenaMascot(c, variant = null) {',`const WARUBEE_RACE_REAR=new Image();WARUBEE_RACE_REAR.src='../assets/characters/warubee-race-rear-v1.png';
function drawRenaMascot(c, variant = null) {
  if(variant&&variant.evil&&WARUBEE_RACE_REAR.complete&&WARUBEE_RACE_REAR.naturalWidth){
    const scale=Math.min(92/WARUBEE_RACE_REAR.naturalWidth,106/WARUBEE_RACE_REAR.naturalHeight);
    const w=WARUBEE_RACE_REAR.naturalWidth*scale,h=WARUBEE_RACE_REAR.naturalHeight*scale;
    GPRacerSprites.draw(c,WARUBEE_RACE_REAR,-w/2,10-h,w,h);return;
  }`);
r(`c.drawImage(AOBEE_RENA_REAR, -35, -78, 70, 88);
    if (variant && variant.tint) {
      c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = variant.tint; c.fillRect(-35, -78, 70, 88); c.restore();
    }`,`GPRacerSprites.draw(c,AOBEE_RENA_REAR,-35,-78,70,88,variant&&variant.tint);`);
r('<details class="settings">','<details class="settings"><summary>操作・あそび方</summary><p>スマホ：左親指で左右、右親指でアクセル。DRIFT長押しでミニターボ！ ITEMでアイテムを使おう。</p><p>PC：↑ アクセル ／ ← → ハンドル ／ Space ドリフト ／ E アイテム ／ ↓ ブレーキ。</p><p>海岸と星空はコース外への落下に注意。グランプリは3コースの合計ポイントで競うよ。</p></details><details class="settings">');
const diagnostic=s.match(/<details id="connectionDetails">[\s\S]*?<\/details>/)[0];s=s.replace(diagnostic,'');s=s.replace('<div class="net-note">',diagnostic+'<div class="net-note">');
fs.writeFileSync('games/aobee_grand_prix_v47_visual_lobby.html',s);
let w=fs.readFileSync('games/aobee_grand_prix_v41_portal.html','utf8').replace('aobee_grand_prix_v46_turn_relay.html?v=v46','aobee_grand_prix_v47_visual_lobby.html?v=v47b');fs.writeFileSync('games/aobee_grand_prix_v41_portal.html',w);
let p=fs.readFileSync('portal.js','utf8').replace('"オンラインVS対応","race"','"オンラインVS対応","race-v2"');fs.writeFileSync('portal.js',p);
let idx=fs.readFileSync('index.html','utf8').replace(/portal.js\?v=[^"']+/, 'portal.js?v=race47');fs.writeFileSync('index.html',idx);
let t=fs.readFileSync('tools/check-gp-v46.cjs','utf8').replace('aobee_grand_prix_v46_turn_relay.html','aobee_grand_prix_v47_visual_lobby.html').replace("style:{},classList", "style:{},dataset:{},classList");fs.writeFileSync('tools/check-gp-v47.cjs',t);
