(function(root){
 'use strict';
 const adventure=typeof module!=='undefined'&&module.exports?require('./adventure.js'):root.AobeeAdventure;
 function interact(app,t){if(typeof AobeePostgame!=='undefined'&&t&&AobeePostgame.interact(app,t))return;if(!t)return app.ui.toast('少し近づいて、話す・調べるを押してね。');if(typeof AobeeChapter6!=='undefined'&&AobeeChapter6.interact(app,t))return;if(typeof AobeeChapter5!=='undefined'&&AobeeChapter5.interact(app,t))return;if(typeof AobeeChapter4!=='undefined'&&AobeeChapter4.interact(app,t))return;
 if(typeof AobeeChapter3!=='undefined'&&AobeeChapter3.interact(app,t))return;
 if(typeof AobeeChapter2!=='undefined'&&AobeeChapter2.interact(app,t))return;
 if(adventure.interact(app,t))return;
 if(typeof AobeeChapter1!=='undefined'&&AobeeChapter1.interact(app,t))return;
 const s=app.state,p=AobeeStory.stage(s),id=t.id,say=(a,f)=>app.dialogue.start(a,f),one=(n,x,f)=>say([[n,x]],f);
 if(t.type==='house')return app.tap({x:t.x,y:t.y});
 if(t.type==='chest'){if(s.chests.includes(id))return one('あおびー','箱はもう空っぽだ。');s.chests.push(id);s.inventory.herb=(s.inventory.herb||0)+2;app.audio.effect('chest');return one('あおびー','ほし草を2つ見つけた！　ルミナのお茶の材料だ。');}
 if(p==='morning'){
  if(id==='bookshelf'&&!s.events['errand:book']){s.events['errand:book']=true;return one('あおびー','ルミナから預かった村長の本を、書棚へ戻した。栞には「星は、だれかの思い出」と書いてある。');}
  if(id==='elder')return one('村長オルド',s.events['errand:book']?'本をありがとう。思い出にも、帰る場所がある。':'ルミナに預けた本を、わしの家の書棚に戻してくれるかい？');
  if(id==='fountain'){s.events.waterCollected=true;return one('あおびー','じょうろに水をくんだ。花守りミナさんへ届けよう。');}
  if(id==='gardener'){if(s.events.waterCollected&&!s.events['errand:water']){s.events['errand:water']=true;return say([['花守りミナ','ありがとう。一緒に花へ水をあげましょう。'],['あおびー','葉っぱが、きらきらしてる！'],['花守りミナ','ルミナが植えた花よ。あの子は、明日咲く花の話が好きなの。']]);}return one('花守りミナ',s.events['errand:water']?'花も喜んでいるわ。ありがとう。':'噴水から水をくんできてくれる？　花が喉を渇かせているの。');}
  if(id==='lumina'){
   if(s.inventory.herb>0&&!s.events['errand:herb']){s.inventory.herb--;s.events['errand:herb']=true;return one('ルミナ','ほし草、ありがとう！　夕方にお茶をいれようね。');}
   if(AobeeStory.done(s)>=2)return say([['ルミナ','お手伝い、おつかれさま。森の入口まで一緒に歩かない？'],['ルミナ','……あれ？　ペンダントがない。さっき、小鳥を見ていた時に落としたのかも。'],['あおびー','大丈夫。一緒に探そう！']],()=>{s.events.prologueStage='search';app.ui.hud();});
   return one('ルミナ','本の返却、お花の水やり、ほし草のお届け。2つ終えたら一緒に出かけよう。旅の手帳から道案内もできるよ。');
  }
 }
 if(id==='forest'){if(p==='morning')return one('ルミナ','お手伝いを2つ終えたら、私に教えてね。');if(p==='depart')return app.scenes.play('farewell');return travel(app,'forest-edge',3,10);}
 if(id==='hill-gate'){if(!['sunset','night','missing','elder','depart','complete'].includes(p))return one('あおびー','ペンダントを見つけてから、丘へ行こう。');return travel(app,'sunset-hill',10,4,'down');}
 if(id==='return-village')return travel(app,'hoshi-village',s.mapId==='sunset-hill'?14:24,s.mapId==='sunset-hill'?18:19,s.mapId==='sunset-hill'?'up':'left');
 if(id==='pendant'){if(p!=='search')return one('あおびー','木の根元で、小鳥の羽根が揺れている。');return say([['あおびー','見つけた！　木の根っこの間に、星が光ってる。'],['ルミナ','よかった……。お母さんが残してくれたペンダントなの。'],['ルミナ','夕焼けの丘へ行こう。今日の空を、君と見たい。']],()=>{s.events.prologueStage='sunset';s.events.pendantFound=true;app.ui.hud();});}
 if(id==='lumina'&&s.mapId==='sunset-hill'&&p==='sunset')return app.scenes.play('sunset');
 if(id==='rest'&&p==='night')return app.scenes.play('night');
 if(p==='missing'&&id==='empty-place'){s.events['trace:plaza']=true;return say([['あおびー','ルミナ？'],['あおびー','……先に、お花のところへ行ったのかな。']]);}
 if(p==='missing'&&id==='tea-cups'){s.events['trace:tea']=true;return say([['あおびー','昨日のカップが、ふたつ。'],['あおびー','冷たくなってる。……ルミナ、どこに行ったの？']]);}
 if(['missing','elder','depart','complete'].includes(p)){
  if(id==='gardener'||id==='elder'){s.events['forgot:'+id]=true;if(id==='elder'&&p==='elder')return say([['村長オルド','この日記……読めない名前が、紙に沈んでいる。星の記録が失われた時の徴だ。'],['村長オルド','森の奥の星の祠へ行きなさい。記憶を守る泉がある。'],['あおびー','忘れられることと、存在しなかったことは違う。ルミナは、ここにいたんだ。'],['村長オルド','君が覚えている。そのことを、わしは信じよう。']],()=>{s.events.prologueStage='depart';app.ui.hud();});return one(id==='elder'?'村長オルド':'花守りミナ',id==='elder'?'ルミナ……？　この村に、そんな名前の子はいたかね？':'ルミナ？　この花は、私がひとりで植えたものよ。……どうして、そんなに悲しい顔をするの？');}
  if(id==='diary'){if(s.events.luminaCompanion)return one('あおびー','書きかけの言葉も、ルミナがここにいた証。続きを話してくれる人は、今は隣にいる。');if(p!=='missing')return one('あおびー','「君が覚えてくれるなら、私はきっと――」続きを、ルミナの声で聞きたい。');return say([['あおびー','……あ。ぼくの名前。'],['ルミナの日記','あおびーへ。今日のお茶、少し濃かったね。君はおいしいって言ってくれたけど。'],['ルミナの日記','明日の朝、私はきっと君を起こしに行けない。星に返さなくちゃいけないものがあるの。'],['ルミナの日記','君が覚えてくれるなら、私はきっと――'],['あおびー','……ここで、終わってる。']],()=>{s.events.diaryFound=true;s.events.prologueStage='elder';app.ui.hud();});}
 }
 if(id==='rest')return one('あおびー','ルミナのお気に入りの毛布だ。');
 if(id==='lumina')return one('ルミナ',p==='night'?'私の家へ帰っていて。ベッドを調べたら、おやすみしよう。':'森の入口は村の南東。夕焼けの丘は南の道だよ。');
 if(id==='sign')return one('案内板','西：ルミナの家 / 東：村長の家 / 南：夕焼けの丘 / 南東：星の森。旅の手帳から道案内できます。');
 if(t.dialogue)return say(app.data.dialogues[t.dialogue]);
 }
 function travel(a,to,x,y,direction){transition(a,{to,tx:x,ty:y,direction});}
 function intro(a){if(a.state.events.luminaIntro)return;a.dialogue.start(a.data.dialogues.intro,()=>{a.state.events.luminaIntro=true;a.ui.toast('旅の手帳に、おつかいを記しました。');});}
 function transition(a,d){if(typeof AobeePostgame!=='undefined')AobeePostgame.visit(a.state,d.to,a.state.mapId);a.state.mapId=d.to;a.state.position={x:d.tx,y:d.ty,direction:d.direction||'down'};if(d.event)a.state.events[d.event]=true;const m=a.map();if(m.visitedEvent)a.state.events[m.visitedEvent]=true;a.syncVisual();a.cancelPath();a.input.reset();a.ui.hud();a.audio.effect();a.audio.mood(AobeeStory.worldMood(a.state));}
 root.AobeeEvents={interact,intro,transition};
})(globalThis);

