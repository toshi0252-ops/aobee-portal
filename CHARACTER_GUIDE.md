# あおびー共通キャラクター

基準はユーザー指定の `aobee_reference_sheet.png`。水色の丸い頭と体、濃い青の垂れ耳、白い口元とお腹、桃色の頬、頭の黄色い星、星の目とオレンジ色の歯車の目、青い蝶ネクタイと黄色い歯車、青い歯車のしっぽを共通にする。

## 素材

`assets/characters/aobee-atlas-v1.png` は透過PNG、4列×2行。上段は正面・背面・左向き・右向き、下段は喜ぶ・手を伸ばす・左へ走る・右へ走る。実行時に等分して使用する。ゲームの当たり判定と画面サイズは元の設定を維持する。

`character-identity.js` は既存キャラ素材の署名を照合して描画を共通素材に置き換える。背景や敵は対象外。RPGの方向別切り出し、埋め込みゲーム、CSSキャラにも対応する。素材読み込みに失敗した場合は従来の描画を残す。

素材の照合表を更新する場合はリポジトリで `node tools/build-character-manifest.cjs`。描画の確認は `node tools/check-character-identity.cjs`。

## 生成方法とプロンプト

内蔵 ImageGen を使用し、参照シートを入力にして制作した。

共通ポーズ: "Create a transparent 4 by 2 sprite atlas from the supplied reference sheet. Preserve Aobee identity: sky blue round head and body, dark blue floppy ears, white muzzle and belly, pink cheeks, yellow head star, one star eye and one orange/yellow gear eye, blue bow with yellow gear center, blue gear tail. Eight equally sized cells: front, back, left, right, cheer, reaching, run left, run right. Clean flat cel shading, consistent proportions, no text or props, no clipping."

タイトル・物語絵: "Edit the FIRST image only. Preserve its composition, spaceship, scenery, lighting, all Japanese and English lettering and button geometry exactly. Change only the Aobee character to the consistent identity in SECOND reference sheet: sky blue round head/body, dark blue floppy ears without white tips, yellow star directly on head without antenna, white muzzle, pink cheeks, one dark star eye and one orange/yellow gear eye with warm dark pupil, blue bow with yellow gear center, blue gear-shaped tail instead of diamond. Respect existing pose and camera direction; back view must stay back view. Keep original scene rendering style, no new text, no layout changes."

画像内の文字は生成結果の目視確認対象。操作ボタンとゲームロジックはHTML側の既存実装を使う。
