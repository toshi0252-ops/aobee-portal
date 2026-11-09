# 連携資料：アクセス計測（GoatCounter）導入

- 日付：2026-11-09
- 担当：Muse
- ブランチ：feature/analytics-goatcounter-20261109

## 目的
ポータルへの来訪者数を把握する（画面にカウンターは出さない）。とし希望。

## 内容
- GoatCounter（無料・クッキーなし・個人情報を収集しない軽量解析）のアカウントを新規作成。サイトコード：aobee-portal（登録メールはとし本人のGmail、メール認証済み）。
- 計測対象は入口の2ページのみ：`index.html`、`manga.html` の `</body>` 直前に公式スニペットを1行追加。
- 集計は https://aobee-portal.goatcounter.com/ でログインして確認する。公開ページ側に数値は表示されない。

## 変更ファイル
- 修正：`index.html`、`manga.html`（スニペット追加のみ）
- 追加：本資料
