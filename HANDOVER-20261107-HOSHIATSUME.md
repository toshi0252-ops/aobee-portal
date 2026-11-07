# HANDOVER 2026-11-07 新ゲーム『あおびーのほしあつめ』— Muse

としの追加指示「新しいゲームも！」（2026-11-07）で Muse が企画・制作した16本目。ブランチ `game/hoshiatsume-20261107`（`design/portal-polish-20261107` にスタック。PR #13 マージ後に base を main へ付け替える）。

## ゲーム内容（games/aobee_hoshiatsume_v1.html、単一ファイル 13KB）
- 30秒のタップ反射神経ゲーム。落ちてくる（出現する）星＝10点、金の歯車＝30点（レア）、わるびーのイジワル星（マゼンタの欠け星）＝−20点＆コンボ消滅
- コンボで倍率アップ（8連続ごとに+1、最大×4）。ベストスコアは localStorage 保存
- あおびーは公式正面絵（../assets/characters/aobee-front-v1.png）を表示。公式の口癖（「あおびーに任せてよ！」「……仕様です」等）を吹き出しに使用
- 星・歯車・イジワル星はインラインSVG（ブランド色）。スマホのタップ前提（56pxターゲット、touch-action:none、バイブ連携あり）

## ポータル登録
- portal.js の games に追加（カテゴリ: バラエティ、preview キー: hoshi）。details も同indexで push
- カバー画像はバイナリをコネクタでコミットできない制約のため、render() に hoshi 専用の CSS カバー（夜空グラデーション＋星＋公式正面絵）を分岐実装。ほかの15本は従来どおり title-covers 画像
- index.html の「15のゲーム」表記を2か所「16のゲーム」に更新。portal.js の ?v= を hoshi20261107 に
- portal.css 末尾に .hoshi-stage 等のカバー用ルールを追加

## 生成カバーについて
- タイトルイラスト（星の雨を捕まえるあおびー＋雲から覗くわるびー）は生成済みだが、バイナリのためリポジトリ未投入（Muse 側の作業ファイルに保存）。将来、直接 git で追加できる時に assets/title-covers/hoshi.webp/.jpg として差し替え可能（その際は render() の分岐を外す）

## 検証
- ゲーム本体・portal.js とも node --check 通過
- 画面確認は githack のブランチプレビューで実施予定（PR に結果を追記）
