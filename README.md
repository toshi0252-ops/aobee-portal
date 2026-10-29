# あおびーポータル

あおびーのブラウザゲーム **15作品** を集めたポータルです。
[公開サイト](https://toshi0252-ops.github.io/aobee-portal/) / [全15作品の目次・現行ファイル・残作業](STATUS.md) / [旧版の保管方針](archive/README.md)

2026-10-23：ゴルフv0.23。距離の青い印／芯の金の帯を明確化し、インパクトゲージの開始位置を統一。接触ポーズ・打音・球の飛び出しを同期し、パターとウェッジの振り幅を調整。コース・保存形式はv0.22のまま。

2026-10-23：ゴルフv0.22。最初の3Hにバンカーと3番の池を回るフェアウェイ、ティーショットの作戦候補、マップのラン後の目安・ランで池に入る警告を追加。旧途中保存は練習扱いで継承し、自己ベストは新版用へ分離。

2026-10-23：ゴルフv0.21。スポーツ欄に開発中表示を追加。パットの打ち出し線・曲がる予測線・曲がり量を表示し、あおびーの構えを球のそばへ調整。パット中のキャラクターサイズと案内の重なりを改善。打球物理・保存キー・公開パスは維持。

2026-10-23：15作目「あおびーゴルフ 青空カップ」をスポーツに追加。games/aobee_golf.html はv0.20（18H / 9H / 3H、途中再開、５球練習）。タイトル用縦長イラストとカード用横長イラストを制作し、カード画像はassets/title-covers/golf.webp / golf.jpg。トップとメニューからポータルへ戻れます。

検証：ゴルフのタイトル4サイズ、ラウンド選択・ショット・キャンセル、スポーツ絞り込み、15件の一覧、画像読込、メニューから一覧への復帰をブラウザー確認。18H進行・保存・物理はv0.19で通し検証済み。

現在15作品を収録した静的ポータル。ゲーム本体を配置し、共通の「ポータルへ」ボタンを読み込むスクリプトを追加しています。RPGはソース版index.htmlを使用します。下記の日付付き記録は各更新時点の履歴です。

## ローカル確認

このフォルダで `node serve.cjs` を実行し、 http://127.0.0.1:8787 を開きます。

## GitHub Pagesで公開

1. GitHubで `aobee-portal` というリポジトリを作成します。GitHub FreeでPagesを使う場合はPublicを選びます。
2. GitHub Desktopでこのフォルダを既存リポジトリとして追加します（Gitの初期化前ならCreate a Repositoryを使用）。コミットしてPublish repositoryから公開します。既にWebでリポジトリを作った場合は、まずCloneしてそのフォルダに本フォルダの中身をコピーします。
3. リポジトリの Settings → Pages → Deploy from a branch → main → /(root) → Save を設定します。
4. 公開URLは `https://ユーザー名.github.io/aobee-portal/` です。公開が完了するまで待ち、リンクとゲームを確認します。

GitHub公式手順: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

ゲームは大きなHTMLを含むため、Web画面のアップロードよりGitHub Desktopによる送信を使用してください。Publicではゲームのコードや素材も閲覧・取得できます。配信に必要なのはindex.html、style.css、portal.js、assets、games、.nojekyllです。

セーブはブラウザと配信元に依存します。元のローカルファイルから公開サイトへ自動で記録が移るとは限りません。ゲームに書き出し・読み込み機能があれば利用してください。

## 更新

games内の該当ファイルを差し替え、必要ならportal.jsのリンクを更新します。差し替えるHTMLには、head内に <script defer src="../assets/portal-return.js"></script> を追加してください（games/rpg内では ../../assets/portal-return.js）。同じ公開URL・ファイルパスを維持してください。

