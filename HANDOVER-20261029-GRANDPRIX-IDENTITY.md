# 連携資料：GRAND PRIX v47 への character-identity 実効化（2026-10-29）

- 作業者: Muse（ユーザー承認のもと実施）
- ブランチ / PR: `claude/apply-identity-grandprix-v47-20261029`
- 対象: 『あおびー GRAND PRIX』現行プレイ版 v47

## 背景

- GRAND PRIX は character-identity 未適用だった。ただし調査の結果、単にスクリプトタグを足すだけでは**無効**だった。ゲーム内のあおびー絵は埋め込み画像 `AOBEE_RENA_REAR`（後ろ姿・単一ポーズ）1点のみで、`manifest-v1.json` に未登録だったため。
- そのため本PRは「登録＋生成規則＋タグ」の3点セットで実効化する。

## 変更内容（3ファイル）

1. `assets/characters/manifest-v1.json`：末尾に1件追加（`AOBEE_RENA_REAR` の署名 → `back`）。既存43件は内容・順序とも不変（機械検証済み）。合計44件。
2. `tools/build-character-manifest.cjs`：`classify()` に `AOBEE_RENA_REAR.src=` 文脈を `back` と判定する規則を1行追加。これがないと manifest 再生成時に GP の登録が消える。
3. `games/aobee_grand_prix_v41_portal.html`（ラッパー）：`portal-return.js` の直後に `<script defer src="../assets/character-identity.js?v=2"></script>` を追加（冒険 PR #2 と同じ方式。identity の iframe 自動適用で v47 本体に効く）。

## 検証済みのこと

- 公式チェック `tools/check-character-identity.cjs`：PASS
- identity.js 本体の実 `signature()` を使ったハーネスで、GP の data URL が `back` に解決すること、未登録画像と わるびー（`warubee-race-rear-v1.png`）が解決されない（＝触らない）ことを確認
- builder 再生成テスト：GP が 1件分類され登録が残ること、冒険 v5.37 の8件が不変であること、baseline との差分が GP の1件のみであること
- 描画互換性：v47 のキャラ描画は drawImage の4引数／2引数形式のみで、アトラス切り出しはないため汎用経路で安全

## 注意点

- **見た目の収まりが僅かに変わる**：元の後ろ姿は縦長（70×88 想定）だが、identity は共通アトラスの `back` セルを正方形・下端揃えで描く。マージ後に実機で一度目視確認を推奨。
- **わるびーには触れていない**：`warubee-race-rear-v1.png` は別キャラであり、identity に わるびー の扱い自体がない。本PRでも対象外。
- **既存の再生成ドリフト（本PRとは無関係の既知問題）**：現行 main の builder で manifest を再生成すると 43件→38件になり、committed manifest を再現できない（`asset:` 特例が builder 側にない等）。そのため本PRの manifest は再生成品ではなく「committed 43件＋GP 1件」の手当て版。再生成運用をどうするかは別途判断が必要。

## 触っていないもの

- GP 本体ファイル、ゲームロジック、バランス、セーブ、オンライン対戦、他の作品のファイルは一切変更していない。

## 同日調査で「やらない」と判断した作品（理由の記録）

- 釣り：埋め込み111点すべて未登録。状況別イラストを汎用ポーズに置換するのは意味的に不適なため対象外。
- ゴルフ：キャラ絵が共通アトラスと同寸の4×2シートでスイング位相アニメに使用されており、汎用経路では崩壊する。別設計が必要（＋開発中タイトル）。
- 群星絵巻：差し替え対象の絵がゲーム内に存在しない（表示はタイトル絵のみ）。統一は素材差し替えの話であり identity の対象外。なお `games/yabou/assets/aobee-official.png` は参照0件の複製で、整理候補。
