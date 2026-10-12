(function(root){
 'use strict';
 const characters={mira:{name:'ミラ',role:'研究者・魔法と解析',maxHp:28,maxMp:24,attack:4,defense:4},gardo:{name:'ガルド',role:'機械職人・守りと修理',maxHp:56,maxMp:14,attack:10,defense:9},leafy:{name:'リーフィ',role:'回復・補助型',maxHp:30,maxMp:18,attack:5,defense:4},aobee:{name:'あおびー',role:'星を覚えている小さな友達',maxHp:36,maxMp:12,attack:8,defense:5}};
 const items={herb:{name:'ほし草',description:'探索中・戦闘中にHPを20回復。倒れた仲間も起こせます。'},gearRibbon:{name:'歯車のリボン',description:'あおびーがいつも身につけているリボン。'},luminaPendant:{name:'ルミナの星形ペンダント',description:'ルミナから預かった星形のペンダント。約束と、消えた記憶の手がかり。'}};
 Object.assign(items,{handbookCopy:{name:"点検した手順書の控え",description:"店と駅に届けた手動扉の手順。点検日・設備の型・修正者を記録。"},precisionTool:{name:'エマの精密調整工具',description:'ガルドが受け取った小さな工具。細い分配回路の現地修理に使える。'},erasedNames:{name:'消された人々の名簿の写し',description:'オルフェとルミナの移送記録。'},orpheDesign:{name:'オルフェの未完の設計図',description:'記憶管理と世界維持を分ける構想。重要な接続部分が欠けている。'},chronoaPass:{name:'クロノア仮入場証',description:'現認と同行者の証言による入場証。'},luminaApplication:{name:'ルミナの研究申請書',description:'端末にはない手書きの署名。'},lighthousePermit:{name:'灯台の正式通行許可',description:'遭難船の救助後、港湾組合から受け取った通行許可。'},memoryCrystal:{name:'記憶結晶の試作品',description:'星に接続せず、短い音声や映像を残せる。失われた記憶を戻す力はない。'},emmaToolbag:{name:'エマの工具袋',description:'丈夫な縫い目。もう一度会う約束と、旅立ちを支える贈り物。'}});
 const dialogues={
 intro:[['ルミナ','あおびー、朝だよ。……ふふ、まだ毛布にくるまってるの？'],['あおびー','ルミナ！　夢の中で、星が歌ってたんだ。'],['ルミナ','きっと、いい夢ね。今日は一緒に、ほしの丘を歩こう。'],['ルミナ','村長の本、お花の水やり、ほし草のお届け。2つ終えたら一緒に出かけよう。迷ったら「旅の手帳」を開いてね。']],
 lumina:[['ルミナ','この村の朝が好き。パンの香りがして、風が花の名前を教えてくれるの。'],['あおびー','ぼくは、ルミナが笑ってる朝が好き！'],['ルミナ','……ありがとう。ねえ、今日はゆっくり歩こうね。']],
 elder:[['村長オルド','おはよう、あおびー。星は、人の思い出を記録していると言われておる。'],['村長オルド','だが、思い出は星の中だけにあるわけではない。誰かを想う心にも宿るのじゃ。'],['村長オルド','私の家は広場の東だ。扉まで歩けば、中に入れるぞ。']],
 gardener:[['花守りミナ','ほし草には、水よりおしゃべりが効くんだって。ほんとかしらね。'],['花守りミナ','南西の木陰に小さな箱があるよ。旅の準備に使ってね。']],
 sign:[['案内板','ほしの丘\n西：ルミナの家　東：村長の家\n南西：ほし草の箱　南東：森への小道']],
 forest:[['あおびー','森のほうから、星の匂いがする……。'],['旅の案内','村長の話を聞いたら、森の奥へ進もう。']],
 diary:[['ルミナの日記','「今日は、あおびーと村を歩いた。あの子の笑顔を見ると、明日が少し楽しみになる。」'],['あおびー','ルミナの字だ。なんだか、あったかい。']],
 bookshelf:[['村長の書棚','『ステラリアの星と記憶』\n星は出来事を刻む。人は、その出来事に意味を与える。']],
 fountain:[['あおびー','水の底で、光がゆらゆらしてる。星が昼寝してるみたい。']]
 };
 const quests=[{id:'intro',name:'ルミナと朝の挨拶',check:s=>!!s.events.luminaIntro},
 {id:'luminaHome',name:'ルミナの家を訪ねる',check:s=>!!s.events.visitedLuminaHome},
 {id:'elderHome',name:'村長の家を訪ねる',check:s=>!!s.events.visitedElderHome},
 {id:'chest',name:'木陰の箱を調べる',check:s=>s.chests.includes('village-herb')}];
 Object.assign(items,AobeeAdventureSafeGear());function AobeeAdventureSafeGear(){return (typeof module!=='undefined'&&module.exports?require('./adventure.js'):root.AobeeAdventure).gear;}
 const api={characters,items,dialogues,quests};
 
Object.assign(api.characters,{warbee:{name:'わるびー',role:'闇の力で敵を妨害し、仲間を守る。'}});Object.assign(api.items,{friendBookmark:{name:'ふたりのしおり',description:'昔のページを閉じず、今のページを見失わないためのしおり。'},sharedRecord:{name:'二人で残した記憶結晶',description:'今日の声を保存。城の写しと一緒に、読み直す約束。'},astraStructure:{name:'アストラの構造図',description:'世界維持と記憶管理の分離を検討する設計図。'}});

 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AobeeData=api;
})(globalThis);
