(function(root){
'use strict';
const data=typeof module!=='undefined'&&module.exports?require('./postgame-data.js'):root.AobeePostgameData;
const defs=[...data.defs,data.festival],allDone=s=>data.defs.every(d=>s.events.postgame?.[d.id]?.done);
const get=(s,id)=>s.events.postgame?.[id]||{};
const sceneSpecs={};for(const d of defs){sceneSpecs['exStart'+d.id]=[d.map,'complete',4];sceneSpecs['exFinish'+d.id]=[d.id==='EX101'?'memory-spring':d.map,'complete',d.id==='EX301'?7:5];}
// Place additions in empty, walkable space without changing any old spawn or collision tile.
function populate(make,rect,maps){
 const room=make('post-record-room','ほしの丘・明日の資料室',20,16,'floor');room.indoors=true;maps[room.id]=room;for(let y=0;y<room.h;y++)for(let x=0;x<room.w;x++)if(!x||!y||x===room.w-1||y===room.h-1)room.tiles[y][x]='wall';room.objects.push({type:'window',x:8,y:1,w:3,h:1,passable:true},{type:'table',x:3,y:12,passable:true},{type:'flowers',x:15,y:12,passable:true});
 for(let x=3;x<17;x++)room.objects.push({type:'shelf',x,y:2,passable:true});
 const place=(map,id,type,label,prefer={x:7,y:10})=>{const m=maps[map],occupied=(x,y)=>m.objects.some(o=>x>=o.x&&x<o.x+(o.w||1)&&y>=o.y&&y<o.y+(o.h||1))||m.npcs.some(n=>n.x===x&&n.y===y)||m.doors.some(n=>Math.abs(n.x-x)+Math.abs(n.y-y)<=1)||m.blocked.has(x+','+y)||['water','wall','building','tree'].includes(m.tiles[y]?.[x]);let candidates=[];
  for(let y=3;y<m.h-3;y++)for(let x=2;x<m.w-2;x++)if(!occupied(x,y)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>!occupied(x+a,y+b)))candidates.push({x,y});
  candidates.sort((a,b)=>(Math.abs(a.x-prefer.x)+Math.abs(a.y-prefer.y))-(Math.abs(b.x-prefer.x)+Math.abs(b.y-prefer.y)));
  if(!candidates.length)throw Error('追加イベントを置けません: '+id);const p=candidates[0];m.objects.push({id,type,...p,label,passable:true,postgame:true});return p;
 };
 for(const d of defs){place(d.map,'ex-'+d.id,'book',d.name,{x:d.id==='EX105'?9:7,y:12});for(const [i,t]of d.tasks.entries())place(t.map,'ex-'+d.id+'-'+t.key,t.type,t.label,{x:10+i*2,y:14});if(d.id==='EX101')place('memory-spring','ex-report-EX101','music','ふたりの歌を泉で合わせる',{x:7,y:17});}
 place('hoshi-village','ex-record-gate','gate','明日の資料室へ',{x:8,y:18});place(room.id,'ex-record-back','gate','↑ ほしの丘へ',{x:10,y:13});
 place(room.id,'ex-exhibition','book','みんなの今日の記録',{x:6,y:6});place(room.id,'ex-journal','book','旅の手帳の展示',{x:12,y:6});
 place('chronoa-research','ex-research-reading','book','一般公開の研究資料',{x:14,y:10});place('gardo-workshop','ex-maintenance','machine','共同工房の無料整備',{x:5,y:8});
 place('tide-harbor','ex-trader','market','定期船の交易品',{x:30,y:20});place('starless-garden','ex-growth','flowers','新しい花壇の成長記録',{x:19,y:14});
 place('hoshi-village','ex-festival-talk','ribbon','祭り広場でひと休み',{x:17,y:14});
 return maps;
}
function next(d,v){return d.tasks.find(t=>!(v.steps||[]).includes(t.key));}
function goals(s){if(!s.events.gameClear)return [];return defs.map(d=>{const v=get(s,d.id),t=v.asked&&!v.done?next(d,v):null;return{name:(v.done?'✓ ':v.asked?'進行中：':'未発見：')+d.name,map:t?.map||(d.id==='EX101'&&v.asked&&!v.done&&!t?'memory-spring':d.map),id:t?'ex-'+d.id+'-'+t.key:d.id==='EX101'&&v.asked&&!v.done&&!t?'ex-report-EX101':'ex-'+d.id,hint:d.id==='EX301'&&!allDone(s)?'仲間の後日談5件・地域復興4件の完了で準備が始まります。':v.done?d.record+' 完了後の会話・手帳の回想を楽しめます。':t?t.label+'。 '+(t.options?'手順は現場の説明を確認。誤ってもやり直せます。':''):'現地で相談して始めよう。主筋の期限なし、控えの仲間も作業に参加します。',category:d.category};});}
function journal(s){if(!s.events.gameClear)return [];return defs.map(d=>{const v=get(s,d.id);return {...d,status:v.done?'完了':v.asked?'進行中':'未発見',collected:(v.steps||[]).map(key=>d.tasks.find(t=>t.key===key)),growth:d.id==='EX104'&&v.done?(s.events.postGardenVisits||0):null};});}
function cast(d,map){const who={EX101:['leafy','serena'],EX102:['gardo','emma'],EX103:['mira'],EX104:['warbee'],EX105:['lumina'],EX201:['leafy'],EX202:['gardo'],EX203:['mira'],EX204:['warbee'],EX301:['leafy','serena','gardo','emma','mira','lumina','warbee']}[d.id];return who.map((sprite,i)=>({id:sprite,sprite,x:who.length===1?11:8+(i%3)*2,y:who.length<=2?8:7+Math.floor(i/3)*2}));}
function complete(a,d){const v=get(a.state,d.id);if(v.done)return;v.done=true;a.audio.effect('chest');a.ui.toast('「'+d.name+'」を手帳に記録 / '+d.reward);}
function layout(a,d,map){const m=a.maps.maps[map],anchor=m.objects.find(o=>o.id===(d.id==='EX101'&&map==='memory-spring'?'ex-report-EX101':'ex-'+d.id)),actors=cast(d);const candidates=[];for(let y=3;y<m.h-3;y++)for(let x=3;x<m.w-3;x++)candidates.push({x,y});candidates.sort((p,q)=>(Math.abs(p.x-(anchor?.x||10))+Math.abs(p.y-(anchor?.y||9)))-(Math.abs(q.x-(anchor?.x||10))+Math.abs(q.y-(anchor?.y||9))));for(const c of candidates){const positions=actors.map((n,i)=>({x:actors.length===1?c.x+1:actors.length===2?c.x-1+i*2:c.x-2+(i%3)*2,y:actors.length<=2?c.y-1:c.y-2+Math.floor(i/3)*2})),hero={x:c.x-2,y:c.y+2};if([...positions,hero].every(p=>a.maps.walkable(m,p.x,p.y)&&!m.doors.some(o=>o.x===p.x&&o.y===p.y))){return {cast:actors.map((n,i)=>({...n,...positions[i]})),focus:c,player:{from:hero,to:hero,direction:'right'}};}}throw Error('演出の安全な足場がありません: '+map);}
function scenes(a,beat,talk){const result={};for(const d of defs){const finishMap=d.id==='EX101'?'memory-spring':d.map,extra=layout(a,d,d.map),finishExtra=layout(a,d,finishMap);result['exStart'+d.id]={map:d.map,name:d.name,mood:'morning',steps:[beat(d.category+'　'+d.name,'そばに座る',{...extra,duration:2800}),talk(d.intro,extra),beat('返事を急がず、隣にいる。\nこれから作る一日を、手帳の新しいページに書いた。','一緒に始める',{...extra,duration:3000}),beat('探索する場所と作業を、旅の手帳に記す。\n他の依頼へ寄り道しても、ここから続けられる。','自分の足で出かける',extra)],done(){const q=a.state.events.postgame||(a.state.events.postgame={});q[d.id]={asked:true,steps:[]};a.ui.toast('新しい毎日「'+d.name+'」開始。手帳から道案内できます。');}};
 const steps=[beat(d.pause,'少し、ここにいる',{...finishExtra,duration:4000,song:d.id==='EX101'||d.id==='EX301'}),talk(d.ending,finishExtra),beat(d.record,'今日を残す',{...finishExtra,duration:3500}),beat('過去の空白は残る。\nその隣に、今日の記録を一ページ増やした。','手帳へ書き留める',finishExtra),beat(d.reward,'続きを歩く',finishExtra)];if(d.id==='EX301')steps.push(beat('『星を忘れた世界』では、今日も新しい思い出が生まれている。','夜の余韻を残す',{...finishExtra,dark:.8,duration:4800}),beat('お祭りの席と記録は、ここに残る。\n明日も、また会いに来られる。','新しい毎日へ',finishExtra));result['exFinish'+d.id]={map:finishMap,name:d.name,mood:d.id==='EX301'?'night':'morning',steps,done(){complete(a,d);}};
 }return result;
}
function interact(a,t){const s=a.state;if(s.events.gameClear&&t.id==='serena')return interact(a,{id:'ex-EX101'});if(s.events.gameClear&&['lumina','c6-lumina'].includes(t.id)&&s.mapId==='hoshi-village')return interact(a,{id:'ex-EX105'});if(s.events.gameClear&&t.id==='emma'&&get(s,'EX102').done)return interact(a,{id:'ex-EX102'});if(!t.id?.startsWith('ex-'))return false;const id=t.id,say=(lines,fn)=>a.dialogue.start(lines,()=>{fn?.();a.ui.hud();});
 if(!s.events.gameClear){say([['あおびー','旅のあとに、またここへ来よう。']]);return true;}
 if(id==='ex-record-gate'){if(!get(s,'EX105').done)say([['ルミナ','ここは資料室にする空き家。先に、村で「明日の約束」の支度をしよう。']]);else a.events.transition(a,{to:'post-record-room',tx:10,ty:11,direction:'up'});return true;}
 if(id==='ex-record-back'){const gate=a.maps.maps['hoshi-village'].objects.find(o=>o.id==='ex-record-gate');a.events.transition(a,{to:'hoshi-village',tx:gate.x+1,ty:gate.y,direction:'right'});return true;}
 if(id==='ex-journal'){a.ui.postJournal();return true;}
 if(id.startsWith('ex-display-')){const d=defs.find(d=>id==='ex-display-'+d.id);if(d&&get(s,d.id).done)say([[d.name,d.record],...d.ending]);return true;}
 if(id==='ex-exhibition'){say([['資料室','森で歌う今日、港で交代する今日、街で店を開ける今日。公開する範囲を選んだ人々の同意書も、手帳と一緒に残している。'],...data.defs.filter(d=>get(s,d.id).done).map(d=>[d.name,d.record])]);return true;}
 if(id==='ex-research-reading'){say(get(s,'EX103').done?[['公開研究資料','オルフェとミラ。手書きの資料・紙帯の測定値・証言を分けて展示。失われた年月を自動的に埋めず、再現条件と誤差も公開する。']]:[['ミラ','「名前の残らない研究」を進めたら、ここで検証資料を読めるわ。']]);return true;}
 if(id==='ex-maintenance'){say([['ガルド',get(s,'EX102').done?'エマと点検した工具だ。無料で装備の整備と、全員の手当てをする。':'柱時計を二人で直したら、ここを共同の整備台にしよう。']],()=>{if(get(s,'EX102').done){const core=typeof module!=='undefined'&&module.exports?require('./battle-core.js'):root.AobeeBattleCore;for(const [who,c]of Object.entries(s.characters)){const stats=core.stats(who,c.level,c.equipment);c.hp=stats.maxHp;c.mp=stats.maxMp;}}});return true;}
 if(id==='ex-trader'){if(!get(s,'EX202').done)say([['港の管理人','定期船が戻ったら、交易の棚が開くよ。']]);else say([['交易商人',s.events.postTradeSupplies?'乾いた果物、布、時計の油。新しい品が届いたよ。復興のお礼の薬包は渡してある。':'定期船で果物と布、時計の油が届いた。復興のお礼に、ほし草5つの薬包もどうぞ。']],()=>{if(!s.events.postTradeSupplies){s.inventory.herb=(s.inventory.herb||0)+5;s.events.postTradeSupplies=true;}});return true;}
 if(['ex-student','ex-dock-worker','ex-new-citizen','ex-traveler'].includes(id)){const lines={'ex-student':[['学びに来た市民','答えを丸暗記しなくてもいいんだって。測り方から教えてもらえるのが、うれしい。']],'ex-dock-worker':[['作業員','交代した人と荷物を数える。船が戻ると、仕事も一つずつ戻ってくるね。']],'ex-new-citizen':[['街の住民','記録は見つからなかったけど、窓口で話を聞いてもらえた。今日は自分で選んだ名前を書いたよ。']],'ex-traveler':[['旅人',get(s,'EX104').done?'城の花を見に来た。ここまでの道も、帰り道も、もうわかるよ。':'道標のおかげで城まで来られた。帰りの灯りも見えるね。']]};say(lines[id]);return true;}
 if(id==='ex-growth'){const v=get(s,'EX104');say([['花壇の成長記録',v.done?['植えた日。土に、二人の手の跡がある。','一度帰って来た日。小さな芽が顔を出した。','二度帰って来た日。葉が開いた。','三度帰って来た日。丈夫な花が咲いた。'][s.events.postGardenVisits||0]:'新しい苗を植えたら、城を離れて戻るたびに成長を記録できます。']]);return true;}
 if(id==='ex-festival-talk'){say(get(s,'EX301').done?[['ルミナ','明日の展示、何を書こうか。'],['リーフィ','今日は、あの歌をもう一度！'],['ガルド','時計は俺たちで見ておく。'],['ミラ','灯りの当番、次は私。'],['わるびー','……水差しは置いておけ。']]:[['村長','九つの新しい毎日がそろったら、小さなお祭りを開こう。']]);return true;}
 const d=defs.find(d=>id==='ex-'+d.id||id==='ex-report-'+d.id||d.tasks.some(t=>id==='ex-'+d.id+'-'+t.key));if(!d)return false;
 if(d.id==='EX301'&&!allDone(s)){say([['村長','後日談5件と地域復興4件を終えたら、ここでお祭りの支度をしよう。手帳で未完了の場所を確認できる。']]);return true;}
 const v=get(s,d.id);if(v.done){say(d.after,()=>{if(d.id==='EX101')a.audio.newSong?.();});return true;}
 if(!v.asked){if(id!=='ex-'+d.id){say([[d.speaker,'先に「'+d.name+'」の相談をしよう。旅の手帳から現地へ案内できます。']]);return true;}a.scenes.play('exStart'+d.id);return true;}
 const task=d.tasks.find(t=>id==='ex-'+d.id+'-'+t.key),pending=next(d,v);
 if(!task){if(pending)say([[d.speaker,'次は「'+pending.label+'」。手帳に場所を記したよ。']]);else if(d.id==='EX101'&&s.mapId!=='memory-spring')say([['リーフィ','泉で、セレナと一緒に合わせよう。手帳から案内できるよ。']]);else a.scenes.play('exFinish'+d.id);return true;}
 if(v.steps.includes(task.key)){say([[d.speaker,'「'+task.label+'」は記録済み。'+task.text]]);return true;}
 // The gathering parts can be completed freely; assembly is gated by the preceding preparations.
 const free=(d.id==='EX101'&&['bird','water','wind'].includes(task.key))||(d.id==='EX201'&&task.key.startsWith('mirror'))||d.id==='EX105'&&['forest','harbor','city','stars'].includes(task.key)||d.id==='EX301';
 if(!free&&task.key!==pending?.key){say([[d.speaker,'先に「'+pending.label+'」を確かめよう。作業を飛ばさず、何度でも続けられます。']]);return true;}
 const mark=()=>{if(!v.steps.includes(task.key))v.steps.push(task.key);a.ui.toast(task.label+' / '+v.steps.length+'/'+d.tasks.length);};
 if(task.options)a.ui.postChoice(task.label,task.text,task.options,n=>{if(n===task.answer)say([[d.speaker,'確かめた手順で進めた。'+task.text]],mark);else say([[d.speaker,'いったん戻して、説明を確かめよう。材料は失われていない。何度でもやり直せます。']]);});else say([[d.speaker,task.text]],mark);return true;
}
function resolve(s,m){const q=s.events.postgame||{},done=id=>q[id]?.done;let result={...m,objects:m.objects.filter(o=>!o.postgame||s.events.gameClear),npcs:[...m.npcs],tiles:m.tiles};if(!s.events.gameClear)return result;
 result.objects=result.objects.map(o=>o.id?.startsWith('ex-')?{...o,label:defs.find(d=>o.id==='ex-'+d.id)&&done(o.id.slice(3))?o.label+'・完了':o.label}:o);
 const ornament=(type,x,y,extra={})=>result.objects.push({type,x,y,passable:true,...extra});
 if(done('EX101')&&m.id==='memory-spring')for(const [x,y]of [[5,16],[6,17],[16,17],[18,16]])ornament('flowers',x,y);
 if(done('EX102')&&m.id==='gardo-workshop'){ornament('clock',11,6,{running:true});ornament('table',4,8);}if(done('EX102')&&m.id==='tide-harbor')ornament('clock',10,12,{running:true});
 if(done('EX103')&&m.id==='chronoa-research'){ornament('chart',16,10,{label:'オルフェとミラ・公開研究'});result.npcs.push({id:'ex-student',sprite:'sailor',name:'学びに来た市民',x:16,y:12,passable:true});}
 if(done('EX104')&&m.id==='starless-garden')for(let i=0;i<4;i++)ornament((s.events.postGardenVisits||0)>=3?'flowers':'questbed',17+i,12,{postGrowth:s.events.postGardenVisits||0});
 if(done('EX105')&&m.id==='hoshi-village')ornament('chart',9,18,{label:'明日の資料室・開館'});
 if(done('EX105')&&m.id==='post-record-room')for(const [i,d]of data.defs.entries())if(done(d.id))ornament('chart',4+(i%3)*5,5+Math.floor(i/3)*2,{id:'ex-display-'+d.id,label:d.name,postgame:true});
 if(done('EX201')&&['memory-woods','forest-edge'].includes(m.id)){result.tiles=m.tiles.map(r=>r.slice());for(const [x,y]of [[4,12],[5,12],[6,12]])if(!m.blocked.has(x+','+y))result.tiles[y][x]='grass';ornament('tree',4,12,{young:true});ornament('flowers',5,12);ornament('bird',6,12);}
 if(done('EX202')&&m.id==='tide-harbor'){ornament('boat',7,25,{w:3,h:2});ornament('crate',30,21);result.npcs.push({id:'ex-dock-worker',sprite:'sailor',name:'荷を数える作業員',x:28,y:21,passable:true});}
 if(done('EX203')&&m.id==='chronoa-plaza'){ornament('sign',6,11,{label:'記録がなくても相談できます'});result.npcs.push({id:'ex-new-citizen',sprite:'fisher',name:'新しい街の住民',x:8,y:11,passable:true});}
 if(done('EX204')&&['star-waste','blackstar-gate'].includes(m.id)){ornament('signallamp',9,16);ornament('sign',11,16,{label:'城と帰路の道しるべ'});result.npcs.push({id:'ex-traveler',sprite:'sailor',name:done('EX104')?'花を見に来た旅人':'城を訪ねる旅人',x:12,y:16,passable:true});}
 if(done('EX301')&&m.id==='hoshi-village')for(const [x,y,type]of [[16,13,'ribbon'],[18,13,'signallamp'],[17,15,'table'],[19,14,'flowers']])ornament(type,x,y,{festival:true});
 return result;
}
function visit(s,to,from){if(to==='starless-garden'&&from!==to&&get(s,'EX104').done)s.events.postGardenVisits=Math.min(3,(s.events.postGardenVisits||0)+1);}
function npc(a,t){if(!t.id?.startsWith('ex-'))return false;return interact(a,t);}
function validate(s){const q=s.events.postgame===undefined?{}:s.events.postgame;if(s.events.postgame!==undefined&&(!s.events.gameClear||!q||typeof q!=='object'||Array.isArray(q)||Object.keys(q).some(k=>!defs.some(d=>d.id===k))))throw Error('クリア後の記録が破損しています。');if(s.events.postTradeSupplies!==undefined&&(typeof s.events.postTradeSupplies!=='boolean'||!get(s,'EX202').done))throw Error('交易の記録が一致しません。');for(const d of defs){const v=q[d.id];if(v===undefined)continue;if(!v||Array.isArray(v)||Object.keys(v).some(k=>!['asked','steps','done'].includes(k))||v.asked!==true||!Array.isArray(v.steps)||new Set(v.steps).size!==v.steps.length||v.steps.some(k=>!d.tasks.some(t=>t.key===k))||v.done!==undefined&&typeof v.done!=='boolean'||v.done&&v.steps.length!==d.tasks.length||d.id==='EX301'&&!allDone(s))throw Error('追加イベントの進行が一致しません。');const isFree=t=>d.id==='EX101'&&['bird','water','wind'].includes(t.key)||d.id==='EX201'&&t.key.startsWith('mirror')||d.id==='EX105'&&['forest','harbor','city','stars'].includes(t.key)||d.id==='EX301';for(const [i,t]of d.tasks.entries())if(v.steps.includes(t.key)&&!isFree(t)&&d.tasks.slice(0,i).some(prev=>!v.steps.includes(prev.key)))throw Error('追加作業の順番が一致しません。');}
 if(s.events.postGardenVisits!==undefined&&(!get(s,'EX104').done||!Number.isInteger(s.events.postGardenVisits)||s.events.postGardenVisits<0||s.events.postGardenVisits>3))throw Error('花壇の成長が破損しています。');if(s.mapId==='post-record-room'&&!get(s,'EX105').done)throw Error('資料室の位置が一致しません。');const c=s.events.cinematic;if(c?.id.startsWith('ex')){const d=defs.find(d=>c.id.endsWith(d.id));if(!d||!sceneSpecs[c.id]||c.id.startsWith('exStart')&&get(s,d.id).asked||c.id.startsWith('exFinish')&&(!get(s,d.id).asked||get(s,d.id).done||get(s,d.id).steps.length!==d.tasks.length))throw Error('追加演出の進行が一致しません。');}return s;}
const api={defs,sceneSpecs,populate,goals,journal,scenes,interact,npc,resolve,visit,validate,allDone};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AobeePostgame=api;
})(globalThis);
