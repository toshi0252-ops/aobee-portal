# 星の神殿：キャラクター・第1章の仕掛け・スマホ文字の再修正 — 玲奈

としの「キャラしょぼいまま」「第1章のギミックがただの四角」「スマホで文字が見にくい」という指摘に対応。前回の背景強化では未対応だった人物・操作物・表示密度を対象とする。

## 変更

- あおびーは公式アトラスを維持し、全章で54px四方から70px四方へ拡大。描画の補間を有効にし、当たり判定と足元の座標を維持。
- 村の長老・タネ婆・トト・ミオ、港の住人、記録守、森の住人、子どもを8種の人物素材で描画。前回の小さな幾何図形から置換。
- 第1章の作業机、反射板、観測台、光源、橋、低木、壁画、協力台、閉/開宝箱、守護機械、星喰いの影を専用素材へ置換。反射方向の矢印、光路、点灯状態、HP、予兆など既存の機能表示は維持。
- 森の小さな守り手・倒木・巣にも専用素材を追加。封印の間では既存の公式わるびー背面素材を協力位置に表示。
- 遺跡の四角い光の台座を観測装置へ置換。石門の表示も門として描き直した。
- 目的を14px以上、会話を16px以上に調整。画面内の名前札は実際の縮小率に応じた文字サイズと濃色背景を使用。
- 近くの人物・物の名前を優先し、遠いラベルと名前札同士の重なりを抑制。出口の案内は維持。「近く：…」の表示で現在の対象を補助。
- 近くの対象とトーストを同時表示しない。HUDの高さに合わせてその下へ移動し、上部の文字を重ねない。
- タイトルの小さい操作説明も14pxへ更新。
- セーブ形式、進行条件、移動座標、当たり判定は無変更。

## 素材と保存先

基準：`C:\Users\toshi\OneDrive\ドキュメント\アプリ開発\aobee-temple-publish-20261116`。

|ファイル|内容|配信用サイズ|
|---|---|---|
|`assets/temple-npc-atlas.webp`|人物8種、4列×2行|1024×512、約200KB|
|`assets/temple-props-atlas.webp`|操作物12種、4列×3行|1024×768、約385KB|
|`assets/temple-forest-guardian.webp`|守り手・倒木・巣、3列×1行|1536×512、約194KB|
|`assets/temple-presentation.js`|キャラ・小物・名前札の描画|新規|

内蔵ImageGenで制作し、透過を保持してゲーム用のWebPへ書き出した。新規画像3点の合計は約0.78MB。生成PNGの原本はCodex生成画像フォルダーに保持。あおびー本体とわるびーは既存の公式素材を使用し、生成し直していない。

## 検証

- `temple-mobile-readability.cjs`：667×375と844×390、各8場面（村の人物、反射板、作業机、橋、森の守り手、守護機械、壁画、協力台）を撮影して目視確認。目的14px以上、会話16px以上、HUDの画面内収容、保存状態の非変更、JSエラーなし：PASS。
- `temple-dialogue-browser.cjs`：4サイズの会話表示・スクロール・誤送り防止・キーボード：PASS。
- `temple-edge-controls.cjs`：横画面4サイズ、左右余白、複数指入力、メニュー、手帳、装備、保存：PASS。
- `temple-visuals-browser.cjs`：全33エリア描画、専用挿絵4点、状態非変更：PASS。
- 既存のキーボード、道案内、壁画、イベント絵、全5章の通し進行・保存復帰・敗北再挑戦・クリア後再訪：PASS。
- 実機スマホの指操作は未確認。上記スマホ表示は実ブラウザーの画面サイズ検証。

前回の素材書き出しと検証の開始が重なり、一度画像待機が失敗した。書き出し完了後に画像のHTTP 200と読み込み成功を確認し、上記チェックを再実行して合格。

## 生成プロンプト

### 人物8種

Use case stylized-concept. ONE game-ready TRANSPARENT sprite atlas, exactly 4 columns and 2 rows, 8 equally sized square cells, aspect 2:1. Eight HUMAN NPCs only, no dogs or mascot characters. Full-body chibi fantasy villagers, 3-head-tall proportions, readable large faces, round eyes, warm expressions, distinct layered clothes, textured pixel-art storybook painted style matching the reference environment art. Slightly top-down FRONT VIEW, facing camera, static relaxed standing, no running. Every figure centered within its cell, entire feet at 90 percent cell height, similar head and body size. No text, names, borders, grid lines, backdrops or ground shadows. Transparent background and gaps between every figure. Row1 left to right: (1) kindly elderly male village elder with short gray beard, ivory-and-gold robe, simple wooden cane, (2) elderly female herbalist with white hair in bun, plum dress and moss green apron, small herb basket, (3) lively teenage boy mechanic Toto with brown hair, navy cap, warm ocher work apron and small tool pouch, (4) young adult female explorer Mio with shoulder-length dark brown hair, pale blue tunic, teal short cape and brass field-glass belt. Row2 left to right: (1) mature harbor keeper in slate blue sailor coat, gray beard and wool cap, (2) island archive keeper, adult woman with dark violet hair and ivory/violet scholarly robe holding a closed book, (3) gentle forest caretaker, adult human in moss green cloak and tan clothing, small leaf clasp, (4) cheerful village child with chestnut hair, cream shirt and orange-red vest. Rich but clean detail visible at 60px sprite height, not icon silhouettes. No weapons, no extra limbs, intact feet, no clipping, no objects crossing cell borders. Reference is environmental STYLE ONLY, do NOT include buildings or plants.

### 操作物12種

Use case stylized-concept. ONE TRANSPARENT 4-column by 3-row game sprite atlas of 12 fantasy RPG interactive PROPS, equal rectangular cells, aspect 4:3. Reference for detailed hand-painted pixel-art storybook materials/style only. Consistent slightly top-down frontal camera and warm brass/teal/wood/bluegray stone palette, strong recognizable silhouettes, detailed but readable at 50-100 pixels, every prop centered and fully within its own cell, base at 90 percent cell height. No text, letters, labels, frame, grid lines, people, ground plane or shadows outside objects. Background fully transparent. Row1 left to right: (1) wooden carpenter's workbench with four legs, pale parchment map spread on table, rolled scroll and small ink pot, NOT a building; (2) round SILVER MIRROR mounted on a brass swiveling pedestal with adjustment handle, clearly a tiltable reflective mirror, do not draw arrows on it; (3) astronomical light receiver, a blue crystal lens in a brass ring on a carved short stone pedestal with a tiny open notebook; (4) bright golden light-source lantern with warm amber core on a decorative low stone plinth. Row2: (1) small top-down wooden footbridge of planks with two handrails, straight north-south orientation and transparent surrounding area, no river; (2) lush round leafy low shrub with pink flowers, no star or treasure inside; (3) ancient upright stone mural tablet with moss and gold frame and a large EMPTY clean pale rectangular engraving panel on front for game symbols; (4) round floor pressure switch, carved bluegray stone rim and inset turquoise circular plate with a simple footprint engraving, a low plate on floor NOT a box. Row3: (1) closed small oak treasure chest with curved lid, brass straps and star-shaped lock; (2) exact same treasure chest open with dark interior and small golden glimmer; (3) squat ancient guardian automaton, full body of articulated carved stone and brass, round glowing cyan core in chest, two heavy legs and arms, distinct head, no weapons; (4) dark violet magical shadow guardian, floating smoky rounded silhouette with two glowing amber eyes and a central pale star core, not a stone pedestal or ordinary pillar. Render all 12 separate objects, never merge adjacent cells.

### 森の守り手・倒木・巣

Use case stylized-concept. ONE TRANSPARENT 3-column by 1-row fantasy RPG sprite atlas, three equally sized square cells, aspect 3:1. Match detailed hand-painted pixel-art storybook sprites. Background completely transparent, no text, no grid lines, no scenery, all sprites intact, centered, feet/base at 90 percent cell height and margins within each cell. First cell: a SMALL FRIENDLY FOREST GUARDIAN creature, an original round moss-green owl-like leaf spirit with two large kind amber eyes, tiny twig feet, layered leaf wings and a little leaf crown, slightly top-down front view, cute and timid not frightening, readable silhouette at 60px tall. Second cell: a horizontal fallen LOG with visible circular tree rings at the cut end, rough bark, one broken branch and moss tufts, clearly a cylindrical log not a wooden crate. Third cell: a cozy circular twig NEST with woven leaves, a few tiny golden lights, empty center, slightly top-down view. These are three separate gameplay sprites, not an illustration, none touches another cell. Palette emerald, warm wood brown and pale gold. No extra characters or props.
