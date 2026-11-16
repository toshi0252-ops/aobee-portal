# 星の神殿：後半挿絵4点と全章の描画強化 — 玲奈

としの「残りの挿絵」と「グラが全体的にしょぼいから強化」の指示を受け、前回残件だった専用絵を追加。全5章の通常画面も共通の描画素材へ更新した。

## 制作物

内蔵ImageGenを使用。公式 `CHARACTER_GUIDE.md` と `assets/characters/aobee-front-v1.png`、第1章の帰還祝い絵を参照。あおびーの非対称の目、頭に直付けの星、青い歯車の尻尾を維持。

保存先の基準ディレクトリー：`C:\Users\toshi\OneDrive\ドキュメント\アプリ開発\aobee-temple-publish-20261116`。

|保存ファイル|内容|
|---|---|
|`assets/temple-events/ch3-harbor-rescue.webp`|第3章：三つの航路灯に導かれて船が帰還|
|`assets/temple-events/ch4-temple-chart.webp`|第4章：村・森・港・島から神殿へつながる星図|
|`assets/temple-events/ch5-light-restored.webp`|最終章：四地域へ光が戻る景観|
|`assets/temple-events/ch5-grand-festival.webp`|エンディング専用の盛大な星灯りの祭り|
|`assets/temple-scenery-atlas.webp`|透過4列×2行：樹木、村の家、柱、星門、港の倉庫、島の天文資料館、花壇、制御装置|
|`assets/temple-visuals.js`|全章共通の地面・建物・樹木・装置・人物・光の描画|

挿絵は各1672×941pxのWebP、4点合計約2.7MB。背景素材アトラスは1774×887px、透過維持のロスレスWebP、約1.7MB。元PNGはCodex生成画像フォルダーに保持。ゲーム本体に画像データを埋め込まず、素材を必要時に読み込む。

## 表示変更

- ゲーム画面の静止キャプチャ3点と、第1章絵を流用した祭りを、それぞれ専用絵へ置換。既存の会話起動タイミングを維持。
- 章ごとに床の石材や草地の色・質感を変更。森の分岐には道筋を追加。
- 村・港・島・祭りの家、樹木、神殿の柱・星門、制御装置を新規素材で描画。
- 港などで人物が端末と同じ記号だった箇所は人物として描き分け。未確定の固有キャラクターデザインを新規に確定するものではない。
- 神殿には床の紋様、各地に光・影・水面の表現を追加。タイトル背景と会話枠の仕上げも更新。
- 番人の予兆・攻撃可能時・停止後の色表示を維持。装置や人物の名前、出口の案内を残す。
- 画像読み込み失敗時は、挿絵を隠して会話を継続。背景素材が読めない場合もコードによる描画へ戻る。
- 当たり判定、座標、進行条件、セーブ形式・キーを変更しない。
- ポータルのキャッシュ識別子を `temple-illustrated-20261116` に更新。

## 最終検証

- JS構文検証：PASS。
- `tests/temple-visuals-browser.cjs`：全33エリア描画、描画による保存状態の非変更、専用挿絵4点の読み込みと会話終了、画像失敗時の会話・背景フォールバック：PASS。
- 12エリアと4挿絵の実ブラウザー画像を保存して目視確認。原画4点と透過アトラスも目視確認。
- `tests/temple-dialogue-browser.cjs`：4画面サイズの長文スクロール・次へ・誤送り防止・初期非表示・キーボード：PASS。
- `tests/temple-edge-controls.cjs`：横画面4サイズ、左右余白・複数指入力・メニュー・手帳・装備・縦画面停止・保存：PASS。
- `tests/temple-chapter5-flow.cjs`：第1章から全5章の通し進行、分岐、各章セーブ復帰、敗北再挑戦、祭り、保存失敗、クリア後再訪：PASS。
- 実機スマホでの指操作と、長時間プレイでの性能測定は未実施。

背景スクリプトを本体が参照するため、既存のDOMアダプターテストでも同じスクリプトを実行するよう読込部分のみ更新。検証用画像・ページはローカル `verification/` に保持し、公開には含めない。

## 生成プロンプト

### 挿絵4点の共通指定

Use case illustration-story. Create a production landscape 16:9 story event illustration for Japanese fantasy game Aobee and the Star Temple. FIRST reference exact official mascot identity; SECOND existing environment/style reference only. Create NEW scene, rich pixel-art-inspired storybook scenery, detailed crisp pixel textures, cinematic depth, deep navy/cyan and warm gold. Aobee round light-blue mascot, dark-blue floppy ears, white muzzle/belly, pink cheeks, yellow star DIRECTLY on head no antenna; viewer-left eye has star pupil, viewer-right orange cog eye, blue bow with gold cog, blue cog tail. Preserve reference proportions and asymmetrical eyes, no mirroring. No text, letters, UI, borders, watermarks. Subjects within upper two-thirds because game dialogue covers bottom quarter.

### 第3章

Moonlit coastal harbor: exactly three golden navigation beacon towers along a curved stone breakwater guide a small wooden sailing boat safely home from misty teal sea. Aobee at near pier left in three-quarter front view, relieved, watching returning boat. Ancient lighthouse on far cliff, golden water reflections, ropes and mooring posts, stars partly veiled in clouds. Clearly a rescued boat arriving, not battle.

### 第4章

Ancient island observatory open to stars. Aobee in three-quarter front discovers a luminous circular stone star chart. Four golden paths from small visual emblems of a village cottage, forest tree, harbor lighthouse, island tower converge at a distant star temple visible through a monumental arch. Layered archive scrolls, ivy, astronomical brass rings, worn carved stone. Magical revelation. No written labels, no gameplay map.

### 最終章の復旧

One seamless epic panoramic coast and valley under dawn-blue stars. An ancient star temple centrally in distance releases FOUR gentle braided golden light streams to village, living forest, coastal harbor and distant island, naturally spread across landscape. Aobee at foreground left terrace, three-quarter front, quietly hopeful. Temple core repaired through cooperation, gentle restoration not explosion. Sparkling rivers and layers of landscape, visual culmination of long journey. No panels, diagrams or labels.

### エンディング

Grand dedicated FINALE: Aobee large and recognizable near upper-middle foreground of cozy village square, smiling with BOTH eyes open; celebrating tiny villagers around long feast tables in midground, no invented named companions. A canopy of golden star lanterns stretches between timber cottages; lush flowers and garlands; multicolored gold/pink/blue fireworks fill wide starry sky. Cobblestones reflect lantern glow, distant hills and glowing windows. Emotionally triumphant homecoming, joyous shared celebration. Noticeably grander and busier than reference homecoming. Important mascot face above bottom third.

### 背景素材アトラス

Use case stylized-concept. Asset type: ONE TRANSPARENT 4-column by 2-row sprite atlas for top-down cozy fantasy RPG scenery, 8 equally sized rectangular cells. Landscape aspect 2:1, ideally 2048x1024. Each sprite centered in its exact grid cell, equal margin, its ground/base at 88% of cell height. Full transparent background, NO ground plane, NO cast shadow outside sprite, NO cell borders, NO text, NO labels, NO people, no sky. All objects match one beautiful hand-painted pixel-art storybook visual style, detailed individual stones, wood grain, layered foliage, bright rim highlights, deep navy shadows, restrained teal/ivory/gold palette. Camera orthographic three-quarter top-down, frontal enough to clearly read cottage facades. Row1 left-to-right: (1) richly leafy rounded deciduous forest tree with visible trunk, (2) cozy cream timber cottage with teal tiled pitched roof, golden windows, flower boxes and a blue door, (3) ancient blue-gray stone temple column with carved segments and ivy, (4) ornate empty ancient stone archway with gold trim and a glowing cyan star keystone, central opening MUST transparent. Row2 left-to-right: (1) nautical harbor warehouse cottage with slate blue roof, ropes and wooden barrels, (2) violet-slate roofed small island observatory/archive cottage with brass star ornament and tall windows, (3) lush low flower planter filled with pink/gold/cyan flowers and moss, (4) ancient freestanding compact pedestal console with one cyan crystal and gold inlay, explicitly a machine. Give sprites crisp silhouette, intact bases, no clipping, nothing crosses grid cell boundaries. ONE coherent game-ready atlas, not a concept-art scene.
