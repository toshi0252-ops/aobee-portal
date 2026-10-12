# 画像制作記録

方式：組み込み `image_gen`。API/CLIは使用していません。全画像は透明背景指定で生成。v0.1.0の外見について、としの「外見はいい！」という返答で確認済み。

## ルミナ立ち絵 / assets/lumina-portrait-v1.png
Use case: stylized-concept. Asset type: original JRPG character design, transparent full-body dialogue portrait. Create Lumina, a beautiful kind young fantasy heroine for Aobee RPG The World That Forgot the Stars. Family-friendly wholesome storybook anime illustration, clean confident outlines and soft cel shading suitable beside a cute sky-blue mascot. Long pearl-silver hair with pale lavender shadows, half-up braid, small gold star hairpin, luminous violet-blue eyes, warm gentle smile, ivory modest knee-length layered dress with lavender hem and short lavender capelet, brown ankle boots, a clearly readable small GOLD FIVE-POINT STAR pendant on a delicate neck chain. Full body front three-quarter view, relaxed standing pose holding one hand near her pendant. Elegant recognizable silhouette, no weapons, no crown, no wings, no sexualization. Entire figure inside frame, transparent margins, no scenery, no lettering, no grid, no watermark. Refined enchanting design with memorable star motif. Output a single polished character illustration.

## ルミナ村用 / assets/lumina-field-v1.png
Use case: stylized-concept. Reference image is the original design basis for Lumina in a cozy top-down 2D JRPG. Create ONE game-ready full-body FRONT-facing standing NPC sprite of exactly this heroine, chibi proportions 2.5 heads tall, crisp clean outlines, restrained cel shading matching a cute mascot game. Pearl-silver long hair, half-up braid, gold star hairpin, violet-blue eyes, lavender capelet, ivory modest dress with lavender hem, brown boots and tiny gold star pendant. Simplify embroidery to readable shapes. Feet on same baseline, symmetrical neutral idle stance, both arms at sides, face warm friendly. Entire figure inside square image with generous empty transparent padding. Genuine transparent background, NO glow, NO drop shadow, NO text, no floor, no other poses or characters. Preserve hair, palette and costume identity from reference. Asset must read well when rendered at 56 pixels tall.

## あおびー / assets/aobee-walk-v1.png
公式参照：`aobee_star_guard/references/aobee-official.png`。4列4行、前/左/右/後の4歩行フレームを依頼。顔の色、星/歯車の瞳、濃青の垂れ耳、金の星アンテナ、ピンクの頬、青リボンと金の歯車、白い腹、青の角張った結晶の尻尾を維持する指定。
最初の生成で輪郭外ノイズと後向きの尻尾が二重になる箇所を確認し、追加修正を依頼。最終編集指示：

Use case: background-extraction. Edit this exact 4x4 Aobee atlas. Change ONLY pixels outside the sixteen character silhouettes: REMOVE ALL isolated cyan, electric-blue and yellow speckles, flecks and noise between sprites and immediately outside edges. Replace with truly transparent alpha. Clean smooth anti-aliased perimeter. Keep all sixteen characters, their artwork, outlines, 4x4 cell layout, positions and exact dimensions unchanged. Do NOT add tail copies. In bottom row cells 2 and 4 remove the EXTRA side crystal on viewer left; KEEP the centered official back-view diamond tail only. No backgrounds, text, grids or added objects. Production clean transparent sprite sheet. Interior pale-blue face and bodies, gold antenna, eyes, gear pendants and dark-blue ear tips must remain unchanged. Most important: clean empty fully transparent inter-cell gutters, no neon fringe.

結果：尻尾の重複は修正。輪郭に微小な色ノイズが残るため、厳密な素材品質の承認済みとは扱わない。フレームの境界は描画時に個別座標で指定し、足先の切れを防止。


## v0.4.0
リーフィ：ミント色の髪、葉のケープ、木の笛、琥珀の種のペンダント。まよいモコ：ラベンダー色の雲の体、葉の耳、星の種、怖がる瞳。どちらもオリジナルの水彩調JRPG素材としてimagegenで制作。透明背景で生成し、出力をそのままバージョン付きPNGとして格納。あおびー・ルミナは前版の素材を継続使用。
