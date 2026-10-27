# 予約順序の検証（2026-10-28）

対象：あおびー群星絵巻 v1.9v。今回の変更は回帰テストの追加のみ。

- 12城・18城版で、徴兵と移送の予約順序を反転。兵糧149・150・151、同一／別担当武将を検証。
- 内政・外交・軍事の全6順列で、2枠使用後の3件目を拒否し、取消後に予約できることを確認。
- 拒否時の状態不変、予約時に資源が減らないこと、セーブ往復、順序によらない翌月結果を確認。合計36ケース合格。
- 公開URLで既存の予約一覧・取消テストと軍議への戻りテストを実行。両マップ×スマホ縦／横・PCの全条件で合格。

今回の検証範囲では追加の不具合なし。ゲーム本体・バランス数値・セーブ形式・公開版番号は変更しない。長期バランスや全シナリオの網羅的なプレイ評価を示す結果ではない。

再実行：

```powershell
node tests/yabou-reservation-order.cjs
$env:YABOU_URL='https://toshi0252-ops.github.io/aobee-portal/games/yabou/index.html?v=supply19v'
node tests/yabou-orders-browser.cjs
node tests/yabou-march-return-browser.cjs
```
