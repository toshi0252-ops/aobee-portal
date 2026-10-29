# 表示名とタイトル画像の変更記録

2026-10-23 / あおびー群星絵巻 / AOBEE GUNSEI EMAKI

としの「タイトル変えてポータルの表示も他のゲームと合わせた感じに」の指示で実施。保存キー aobee-yabou-domestic-auto、マップID、スキーマ、URL /games/yabou/index.html と既存記録の内容を維持。旧名は検索別名として残す。

## 名称の予備確認

一般ウェブ検索で「あおびー群星絵巻」「AOBEE GUNSEI EMAKI」「群星絵巻 ゲーム 商標」とJ-PlatPatドメイン指定の検索を実施。完全一致の作品・商標を検索結果から特定できなかった。一般検索は登録簿の網羅的検索ではなく、商標登録可能性や権利非抵触を確認したものではない。J-PlatPat登録簿での称呼・区分を含む確認は未完了。

似た語句「群星の絵巻」は別作品『崩壊3rd』のアップデート名として使用実績あり。[株式会社miHoYoの発表](https://prtimes.jp/main/html/rd/p/000000141.000048345.html)。同一名称・同一作品ではなく、この調査で法的結論を出さない。

## 画像制作

組込のimage_genを使用。外部AI APIをゲームへ組み込んだ変更ではない。参照1はassets/aobee-official.webp（公式キャラクター）、参照2はポータルのgolf.jpg（完成度と大きなロゴの参考のみ）。

最終生成指示：

> Create a polished 16:9 wide Japanese browser game title illustration for the existing Aobee portal. Preserve the official yellow star antenna, sky-blue body, dark-blue drooping ears, asymmetric star and gear eyes, white muzzle/chest/paws, blue ribbon and gold gear medallion, and blue gear tail. Do not cover the star with a helmet or redesign the character. Cute but stately original fantasy Sengoku strategy, emaki scroll, white castle on the right, layered mountains and winding river, starry night and golden horizon. Aobee holds a scroll with a simple star crest in the lower-left foreground. Large logo: あおびー in friendly sky-blue rounded letters edged in gold; 群星絵巻 in powerful original gold Japanese brush lettering on ink-dark scroll. Small English: AOBEE GUNSEI EMAKI. Exact tagline: 小さな星たちが、天下を動かす。 Gold, ink navy and sky blue, small vermilion star seal. Safe margins for thumbnails. No development/version labels, UI buttons, famous game logos or extra characters. Golf reference is quality only; do not copy its objects, wording or logo composition.

生成PNGを目視確認し、同一内容を1672×941のWebP/JPEGに符号化。画像内容をコードで編集していない。配置先はゲームassets/gunsei-title-v1.webpとポータルassets/title-covers/yabou-gunsei-v1.webp/.jpg。旧素材は維持。

スマホ縦横・PCでゲームタイトルとポータルカードを描画確認。バランス・進行機能の完成認定とは区別する。

## 追記（2026-10-29）

本記録は 2026-10-23 時点の制作履歴であり、本文は書き換えない。生成指示に含まれる "yellow star antenna" は、2026-10-29 のユーザー決定（CHARACTER_GUIDE.md「公式デザイン決定」）により今後は使わない。今後のタイトル絵制作では、星はアンテナなしで頭に直接付けること。なお本記録の尻尾指定（blue gear tail）は決定と一致している。
