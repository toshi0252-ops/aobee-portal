# カバー絵 再生成仕様（2026-10-29）

ポータルトップのゲームカード絵（`assets/title-covers/`）のうち、公式デザイン決定（2026-10-29、CHARACTER_GUIDE.md を正とする）と異なる **12枚** の再生成仕様。評価は全15枚を拡大確認して行った。

## 対象外（公式どおりのため触らない）

- 星の神殿（temple）：星が頭に直接・黄色。目も公式どおり
- 群星絵巻（yabou-gunsei-v1）：星が頭に直接・黄色、歯車形の尻尾も描かれている
- ゴルフ（golf）：星は頭に直接・黄色。目は両方星型（歯車目でない）だが軽微として今回は対象外

## 共通のキャラ指定（全対象カバー共通、プロンプトに必ず含める）

```
Aobee official character: a yellow star placed directly on top of the head, NO antenna, NO stalk, NO stick. Blue gear-shaped tail (not crystal, not diamond). One eye contains a star, the other eye is ringed by an orange gear. Blue bow tie with a small yellow gear at the center. Long droopy deep-blue ears, white muzzle and belly, pink cheeks, sky-blue round body.
```

- 現行カバーの多くは「青い星＋細い茎（アンテナ）」で、星の色もガイド（黄色）と違う。両方とも直すこと。
- 構図・背景・小物・画風は現行カバーを踏襲し、タイトルロゴ文字は現行と同一の表記で画像内に描くこと（ロゴはHTMLではなく画像内焼き込みが現行仕様）。
- 生成後の採用前チェック：①茎が描かれていないか ②星が黄色か ③尻尾が見える場合は歯車形か ④ロゴの文字が崩れていないか。

## 作品別仕様（12枚）

### 1. 冒険（adventure.webp / .jpg）※最優先：アンテナ＋結晶尻尾の複合
- ロゴ: 「あおびーの冒険」
- 構図: ダンジョンの石造遺跡、ランタンを手に持つ、宝箱・剣・宝石、松明の灯り
- 個別修正: 星は黄色で頭に直接。**尻尾は結晶形→青い歯車形**に変更（現行は右下に結晶尻尾が見えている）

### 2. 牧場（farm.webp / .jpg）
- ロゴ: 「あおびー牧場」
- 構図: 農場の畑、野菜の入ったカゴを持つ、羊とニワトリ、農家の家、青空
- 個別修正: 星は黄色で頭に直接（現行は青い星＋茎）

### 3. RPG（rpg.webp / .jpg）※アンテナが最も太く長い
- ロゴ: 「あおびーRPG」
- 構図: 夕焼け空と城下町を背景に座るポーズ、紫〜オレンジの空
- 個別修正: 星は黄色で頭に直接（現行は太く長い茎つき）

### 4. GRAND PRIX（race-v2.webp / .jpg）※対象は わるびー 側
- ロゴ: 「あおびー GRAND PRIX」
- 構図: カートレース（赤いカートのあおびー、黒×ピンクのカートのわるびー）、チェッカーフラッグ、海沿いのコース
- あおびー: 現行どおりでよい（星は頭に直接・黄色、目も公式どおり）。変えないこと
- わるびー個別修正:
```
Warubee (rival character, black body, pink inner ears): a slightly CHIPPED dark-magenta star placed directly on top of the head, NO antenna, NO stalk. Gear-shaped tail in dark magenta if visible. One eye with a pink star, the other ringed by a gear.
```
  現行は「ピンクの星が細い茎の先」で欠けもない。ここだけ直す

### 5. MIX POWER（mix.webp / .jpg）
- ロゴ: 「AOBEE MIX POWER」
- 構図: カラフルなブロック（赤・黄・青・緑）のパズル、ジャンプするポーズ
- 個別修正: 星は黄色で頭に直接

### 6. 雑学クイズ（quiz.webp / .jpg）
- ロゴ: 「あおびーの雑学クイズ！」
- 構図: 書斎・図書室、地球儀、本、電球、クエスチョンマーク
- 個別修正: 星は黄色で頭に直接

### 7. リズムパーティ（rhythm.webp / .jpg）
- ロゴ: 「あおびーのリズムパーティ！」
- 構図: ステージ、音符、流れてくるノーツ（寿司・野球ボール等）
- 個別修正: 星は黄色で頭に直接

### 8. STAR SHOOTER（shooter.webp / .jpg）
- ロゴ: 「あおびー STAR SHOOTER」
- 構図: 宇宙船のコックピット、星空、敵キャラ、星の弾
- 個別修正: 星は黄色で頭に直接

### 9. 星守り（guard.webp / .jpg）
- ロゴ: 「あおびーの星守り」
- 構図: 夕景の城と滝の風景、星のステッキを持つ
- 個別修正: 星は黄色で頭に直接

### 10. 走れ！あおびー（runner.webp / .jpg）
- ロゴ: 「走れ！あおびー」
- 構図: 緑の崖と滝の上を走る・跳ぶ、星を集める
- 個別修正: 星は黄色で頭に直接

### 11. ピコピコフィッシング（fishing.webp / .jpg）
- ロゴ: 「あおびーのピコピコフィッシング」
- 構図: 海辺で釣り竿を持つ、釣れた魚が跳ねる、青い海と空
- 個別修正: 星は黄色で頭に直接

### 12. 押して！あおびー（puzzle.webp / .jpg）
- ロゴ: 「押して！あおびー」
- 構図: 石の遺跡、歯車の紋章つき木箱を押す
- 個別修正: 星は黄色で頭に直接

## 成果物の形式（現行踏襲）

- 生成PNGを **1672×941** に符号化し、**WebP と JPG の2形式** を同じスラッグで配置する
  （配置先: `assets/title-covers/<スラッグ>.webp` と `.jpg`。スラッグは現行ファイル名をそのまま使う）
- 例外: 牧場（farm）は現行が 1672×940。再生成時に 941 にそろえること

## 差し替え手順と役割分担

1. ChatGPT（image_gen）で上記仕様で再生成し、採用前チェックを通す（制作側）
2. ファイルの差し替えアップロードは GitHub の画面から行う（カバーファイルは1枚 260〜740KB で、Muse の連携ツールの上限を超えるため、Muse からはアップロードできない）
3. アップロード後、Muse が検証する：寸法・形式・デザイン4項目・本番表示
4. ブラウザキャッシュ対策として、差し替え時に portal.js のキャッシュバスター（現行 `?v=iphone1` 等）の更新を Muse がPRで行う

## 未参照ファイル（参考）

`assets/title-covers/race.jpg/.webp` と `yabou.jpg/.webp` は現行 portal.js から参照されていない旧世代ファイル（約1.14MB）。本仕様の対象外。整理は別途判断。
