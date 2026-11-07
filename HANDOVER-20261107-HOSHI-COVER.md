# HANDOVER 2026-11-07 ほしあつめ カバー差し替え — Muse

としの指摘「星集め、絵ないやん。めちゃくちゃ地味で見落とす」（2026-11-07）への対応。ブランチ `fix/hoshi-cover-20261107`。

## 変更
- `assets/title-covers/hoshi.jpg` / `hoshi.webp` を追加（生成済みタイトルイラストを 1672×941 に変換）。連携コネクタはバイナリを送れないため、GitHub Web UI からアップロード（コミット 409f1de、とし本人がサインインを引き継いで完了）
- `portal.js`: PR #14 で入れた hoshi 専用 CSS カバーの分岐を撤去し、他の15本と同じ title-covers 画像表示に統一。index.html の portal.js ?v= を hoshicover20261107 に更新
- `portal.css`: 不要になった .hoshi-stage 等のルールを削除

## 検証
- githack のブランチプレビューで、ライブラリの ほしあつめ カードにイラストが表示されることを確認（PR に結果を追記）
