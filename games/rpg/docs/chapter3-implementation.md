# 第3章前半 v0.8.0

実装範囲はEV301〜304。第3章全体の完成版ではない。駅・広場・商業区・研究区・ミラの研究室・資料庫・時計塔の7マップ。第2章完了後、港の東の入口から開始する。

ミラは一時同行で4人目。スターショット・解析・解除・次魔法の強化。リーフィにも封印解除を追加。解除技は封印中も使える。訓練端末は既存の港の守護機の画像を利用した研究室の訓練機。章3のボスとは別で、経験値・道具の報酬はない。勝利・退却・敗北のすべてでHP・MP回復。第1章の2人、第2章の3人の敵編成は維持する。

時計塔は方向・針・起動順を個別操作。設計図で全条件が読める。方向を変えると針を逆向きに進められる。方向・針の変更時は起動順だけ初期化。失敗時は設定を保ち、全初期化ボタンも利用可。同期後は操作を保護する。

第3章の4つの重要演出はスキップ可能。未表示の台詞を会話履歴に入れ、通常進行と同じ完了処理を実行する。履歴は既存と同じく現在のプレイ中のみで、ロード後の前回履歴保存は未実装。

既存セーブ形式3を継続し、旧版には新フラグ不要。全20演出チェックポイント、紙と端末の調査順、通常送りとスキップ、加入一回、訓練の魔法強化・解析保持・封印解除・保存、時計の途中保存と失敗、同期後再訪をtests/chapter3.cjsで検証。

未実装：EV305〜313、警備巡回、地下マップ、新ボス2体、ルミナ再会・救出、ミラ正式加入、第3章終了。90〜120分は全章の目標で、この前半版の所要時間ではない。

## 画像生成

built-in image_genを使用。採用ファイル：assets/mira-v1.png。全身・透過PNG、暗紫のボブ、琥珀の瞳、丸眼鏡、青緑の研究コート、手書きノートと星の測定器。あおびーの素材は変更なし。

生成プロンプト：Use case: stylized-concept. Asset: single full-body transparent PNG RPG character Mira, an adult female star-record engineer and researcher for an original gentle fantasy RPG. Soft watercolor anime illustration, clean dark blue outlines, warmly expressive face, slightly rounded proportions matching a cozy storybook RPG. Mira has short dark violet bob hair, amber eyes, small round brass glasses, a teal fitted long research coat over cream high-neck blouse and practical dark trousers, ankle boots, small brass star measuring instrument and a handwritten notebook held close. Calm thoughtful posture, front three-quarter view, whole body and feet visible, centered with clear silhouette readable at 70 pixels tall, no cropped limbs, no text, no logos, no other characters, no background, genuine alpha transparency.

背景確認の編集プロンプト：Remove the entire dark charcoal gradient and golden haze background from this character illustration. Preserve the character exactly, including hair, glasses, notebook, astrolabe, all clothes, boots and fine outlines. Produce a clean full-body transparent PNG cutout with actual alpha zero outside the character and held objects, no shadow, no gradient, no halo, no black or white backdrop. This is a game sprite background extraction edit, not a redesign.

System.DrawingでPNGの角・外側3点のalpha=0を確認。ブラウザ390×844で4人のHP・MP・6コマンドが表示されることを目視確認。
