# あおびーポータル：作品横断の目次

更新日：2026-10-30。掲載数は **15作品**。現行の入口と並び順は `portal.js` の `games` / `details` を正とする。
[公開サイト](https://toshi0252-ops.github.io/aobee-portal/) / [README](README.md) / [旧版保管](archive/README.md)

## 現行15作品

入口のリンクは現在の配信識別子を含む。カバー欄は `assets/title-covers/` のスラッグで、各WebP・JPGがある。

| # | 作品・入口 | ジャンル | 現行の実体・版識別 | カバー |
|---|---|---|---|---|
| 1 | [あおびーの冒険](games/aobee_adventure_v641_portal.html?v=ui49) | アクション | `aobee_adventure_v641_start_fix.html`（v6.4.1、ラッパー経由） | `adventure` |
| 2 | [あおびー牧場](games/aobee_farm_v48_soil_water.html?v=ui49) | くらし | `aobee_farm_v48_soil_water.html` | `farm` |
| 3 | [あおびー RPG](games/rpg/index.html) | RPG | `games/rpg/index.html` と `src/` のモジュール | `rpg` |
| 4 | [あおびー GRAND PRIX](games/aobee_grand_prix_v41_portal.html) | レース | `aobee_grand_prix_v47_visual_lobby.html?v=v47b`（v47、ラッパー名のv41は現役） | `race-v2` |
| 5 | [AOBEE MIX POWER](games/AOBEE_MIX_POWER_v2.32_4GAUGE.html) | バラエティ | `AOBEE_MIX_POWER_v2.32_4GAUGE.html` | `mix` |
| 6 | [あおびーの雑学クイズ！](games/aobee_quiz_v126_timer_gauge_motion_fix.html) | クイズ | `aobee_quiz_v126_timer_gauge_motion_fix.html` | `quiz` |
| 7 | [あおびーのリズムパーティ！](games/aobee_rhythm_game_v300_complete.html) | リズム | `aobee_rhythm_game_v300_complete.html` | `rhythm` |
| 8 | [あおびー STAR SHOOTER](games/aobee_shooter_v18_star_rush.html) | シューティング | `aobee_shooter_v18_star_rush.html` | `shooter` |
| 9 | [あおびーの星守り](games/aobee_star_guard_v1_complete.html) | バラエティ | `aobee_star_guard_v1_complete.html` | `guard` |
| 10 | [走れ！あおびー](games/hashire_aobee_v3.2.html) | アクション | `hashire_aobee_v3.2.html` | `runner` |
| 11 | [あおびーのピコピコフィッシング](games/aobee_pico_fishing_v68_dual_guide.html) | 釣り | `aobee_pico_fishing_v68_dual_guide.html` | `fishing` |
| 12 | [あおびーと星の神殿](games/aobee_star_temple_portal.html?v=32) | アクション | `aobee_star_temple_portal.html`（第1章・開発中） | `temple` |
| 13 | [押して！あおびー](games/oshite_aobee_superhard_reina_v15_hint.html?v=progress16) | パズル | `oshite_aobee_superhard_reina_v15_hint.html` | `puzzle` |
| 14 | [あおびー群星絵巻](games/yabou/index.html?v=campaign110c) | SLG | `games/yabou/index.html` と関連素材（v1.10c） | `yabou-gunsei-v1` |
| 15 | [あおびーゴルフ](games/aobee_golf.html?v=golf35) | スポーツ | `aobee_golf.html`（配信識別子golf35、開発中） | `golf` |

## 共通資料と完了済みの整理

- [CHARACTER_GUIDE.md](CHARACTER_GUIDE.md)：公式キャラクターデザイン。黄色い星は頭に直接、尻尾は青い歯車形。過去のアンテナ・結晶形指定は使わない。
- [カバー再生成仕様](COVER-REDESIGN-20261029.md) / [カバー制作の引き継ぎ](HANDOVER-20261030-COVER-IDENTITY.md)：12枚の修正は[PR #6](https://github.com/toshi0252-ops/aobee-portal/pull/6)で公開済み。引き継ぎ末尾の未公開記述は制作時点の記録。
- [冒険のidentity適用](HANDOVER-20261029-ADVENTURE-IDENTITY.md) / [GRAND PRIXのidentity適用](HANDOVER-20261029-GRANDPRIX-IDENTITY.md)：ラッパーからの適用に関する注意。
- [旧版の一覧・復元用ハッシュ](archive/legacy-20261030/manifest.json)：旧ゲーム本体10点と旧カバー4点を原本のまま保管。旧ゲームURLは現行入口へ移動する。
- [今回の整理記録](HANDOVER-20261030-PORTAL-HOUSEKEEPING.md)：作品数表記、旧版隔離、目次整備の変更と検証。

## 残作業と変更時の注意

1. 星の神殿のidentity atlas対応：Museの提案差分はリポジトリ未収録。受領と実プレイ確認が必要。
2. ゴルフのキャラ統一：4×2シートは方向ではなくスイング位相。汎用素材への置換は別設計が必要。
3. manifest再生成時の不整合修正：現在コミットされている `assets/characters/manifest-v1.json` を維持し、現行builderをそのまま実行して上書きしない。
4. 釣りは場面別のイラスト群が未登録。群星絵巻はidentityで差し替えるゲーム内プレイヤー絵がない。タグ追加だけで対応済みとしない。
5. カバーのMuse側独立検証は別途。玲奈側では本番画像24点のハッシュ一致とPC・スマホ幅表示を確認済み。

ゲームロジック・バランス・セーブキーの変更はこの整理に含めない。現行ファイルの判断は版番号だけで行わず、入口と実際の参照を確認する。
