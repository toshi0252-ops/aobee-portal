(function(root){
'use strict';
const definitions={forest:{id:'wither-sentinel',enemy:'witherSentinel',name:'枯星の番人',hp:240,xp:72,map:'life-core',field:'c5ForestStage',flag:'c5ForestStopped',hint:'奇数ターンに衰弱、偶数ターンに枯れ毒。若葉の目覚め・クリアコードで解除。封印で特殊行動を止められる。'},harbor:{id:'abyss-echo',enemy:'abyssEcho',name:'深海の残響',hp:260,xp:72,map:'light-core',field:'c5HarborStage',flag:'c5HarborStopped',hint:'3ターン目は引き潮で攻撃をため、次は全体の大波。ためている間に攻撃するか、波を全員で防御。'},city:{id:'zero-clock',enemy:'zeroClock',name:'ゼロ・クロック',hp:280,xp:72,map:'compute-core',field:'c5CityStage',flag:'c5CityStopped',hint:'周期は単体攻撃→全体攻撃→封印光。解析で次の行動を確認。わるびーの封印で通常攻撃へ変えられる。'}};
const encounters=Object.fromEntries(Object.values(definitions).map(d=>[d.id,{chapter5:true,xp:d.xp,herbs:0,enemies:[{id:d.enemy,name:d.name,maxHp:d.hp}],intro:d.hint}]));
encounters['fading-moco']={chapter5:true,random:true,xp:18,herbs:1,enemies:[{id:'fadingMoco',name:'光をなくしたモコ',maxHp:56}],intro:'弱い光を探して迷ったモコ。短い戦闘で経験値とほし草を得られます。'};
function definition(id){return Object.values(definitions).find(d=>d.id===id);}
function allowed(s,id){const d=definition(id);return s.events.chapter5Stage==='journey'&&!!s.events.EV502&&(d?s.mapId===d.map&&s.events[d.field]==='boss'&&!s.events[d.flag]:Object.values(definitions).some(d=>s.mapId===d.map.replace('-core','-depths')&&s.events[d.field]!=='complete'));}
function enemyTurn(b,e,blocked,say,emit){const live=b.actors.filter(a=>a.hp>0);if(!live.length)return;
 if(b.id==='abyss-echo'&&b.turn%4===3&&!blocked){e.charged=true;say('深海の残響が引き潮に身を沈める。次の敵ターンは全体の大波。');return;}
 const wave=b.id==='abyss-echo'&&e.charged&&!blocked,all=wave||b.id==='zero-clock'&&b.turn%3===2&&!blocked;
 const power=b.id==='fading-moco'?9:wave?22:all?16:15;
 for(const intended of all?live:[live[(b.turn-1)%live.length]]){const cover=!all?live.find(a=>a.cover):null,t=cover||intended;
 const damage=Math.min(t.hp,Math.max(1,Math.floor((power-Math.floor(t.defense/2))/(t.guard?2:1)*(t.shield?.65:1)*(cover?.75:1))));t.hp-=damage;emit(t.id,'−'+damage,'damage');say(e.name+(wave?'の大波。':all?'の全体放射。':'の攻撃。')+t.name+'に'+damage+'ダメージ。');
 if(!blocked&&t.hp>0){if(b.id==='wither-sentinel'){if(b.turn%2){t.weaken=2;say(t.name+'は衰弱。次の敵ターンまで攻撃力が下がる。');}else{t.poison=3;say(t.name+'に枯れ毒。各敵ターンにHP4を失う。解除技で取り除ける。');}}if(b.id==='zero-clock'&&b.turn%3===0){t.silence=1;say(t.name+'のとくぎが次の1行動封じられた。');}}
 }e.charged=false;
}
function tick(b,say,emit){for(const a of b.actors){if(a.poison&&a.hp>0){const n=Math.min(4,a.hp);a.hp-=n;a.poison--;say(a.name+'は枯れ毒で'+n+'ダメージ。');emit(a.id,'毒 −'+n,'damage');}if(a.weaken)a.weaken--;}}
function finish(s,b,rewards,stats){const d=definition(b.id);if(d&&b.result==='won'&&!s.events[d.flag]){s.events[d.flag]=true;s.events[d.field]='restart';for(const a of b.actors){const c=s.characters[a.id];c.xp+=d.xp;while(c.level<99&&c.xp>=c.level*24){c.xp-=c.level*24;c.level++;}}rewards.push('経験値'+d.xp+' / 装置はまだ停止中。手動で再起動しよう。');}if(d||b.result==='lost'||b.result==='fled')for(const a of b.actors){const c=s.characters[a.id],v=stats(a.id,c.level,c.equipment);c.hp=v.maxHp;c.mp=v.maxMp;}}
const api={definitions,encounters,definition,allowed,enemyTurn,tick,finish};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AobeeChapter5Battle=api;
})(globalThis);
