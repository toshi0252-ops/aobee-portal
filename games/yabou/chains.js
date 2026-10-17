(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const C=(label,bond,extra={})=>({label,bond,...extra});
const act=(title,text,a,b)=>({title,text,choices:[a,b]});
const defs=[
 {id:'CH01',title:'双狐の軍略',officerIds:['N002','N025'],prerequisite:'UE01',battleStage:2,acts:[
  act('再会','コンの仕官後、ユズリハが古い地図を携えて訪ねてきた。二人は同じ街道を別々の立場で見てきたという。再会を国の力へつなげよう。',C('二人で街道の状況を整理する',3),C('まず別々に見聞を語らせる',1)),
  act('対立','コンは先を読んだ布陣を、ユズリハは交渉の余地を説いた。目的は同じでも、守るための方法が食い違う。',C('双方の案を一つの作戦にまとめる',3),C('役割を分け、互いの判断を尊重する',-2)),
  act('共闘','対立を経た二人が、同じ陣営で実際に戦った。コンの読みとユズリハの機転は、机上では見えなかった互いの働きを確かめる機会になった。',C('協力できた場面を共に振り返る',4),C('各自の貢献をそれぞれ称える',2)),
  act('決着','二人が広げた地図には、以前と違う書き込みが並んでいる。同じ道を選ぶのか、異なる視点を保って並び立つのか。',C('共に国を支える約束を結ぶ',4),C('対等な好敵手として認め合う',2))
 ]},
 {id:'CH02',title:'老将と竜騎将',officerIds:['N001','N019'],prerequisite:'UE02',acts:[
  act('古びた具足','奉公を続ける玄八の具足を、グレンが静かに見つめていた。長い戦歴と強い誓いを持つ二人に、守り方を語る場を設けよう。',C('老将の経験を二人で聞き取る',3),C('それぞれの守り方を披露させる',1)),
  act('速さと備え','グレンは素早い展開を、玄八は退く道を残す備えを重んじる。どちらの経験も、もう一方には新しい問いを投げかけた。',C('攻守を入れ替えて合同稽古する',3,{defense:1}),C('互いの案を記録して比較する',1)),
  act('受け継ぐ備え','稽古を終えた兵が、二人の助言を一冊にまとめたいと願い出た。残すべきは英雄の名だけでなく、仲間を帰すための知恵でもある。',C('40金で稽古の手引きを整える',3,{gold:-40,defense:1}),C('口伝で伝え、今ある道具を使う',1)),
  act('次の旗へ','玄八は後を任せることの重さを、グレンは受け取ることの責任を語った。二人は次の旗を支える形を選ぼうとしている。',C('世代を越えて支える誓いを結ぶ',4),C('互いに磨き合う武人として並ぶ',2))
 ]},
 {id:'CH03',title:'約束の続きを',officerIds:['N003','N024'],prerequisite:'UE03',acts:[
  act('約束のあと','戦場に残された約束を語ったガルムとラウルが、その後の働き方を話し始めた。過去を語るだけでは、今の仲間を守れない。',C('守りたい仲間の名を挙げさせる',3),C('それぞれが担う役目を確かめる',1)),
  act('傭兵と将軍','ガルムは働きへの正当な見返りを、ラウルは隊をまとめる責任を求めた。待遇と責務を、対立させずに考えられるだろうか。',C('同じ基準で役割を話し合う',3),C('二人の裁量を別々に認める',-2)),
  act('仲間の帰路','兵が戻る道の点検を巡り、二人から具体的な提案が届いた。約束を、誰もが使える備えへ変える機会だ。',C('40金で帰路の備えを整える',3,{gold:-40,defense:1}),C('今ある備えを合同で点検する',1,{defense:1})),
  act('生きて帰る旗','二人は過去の約束に、今の仲間たちの名を重ねた。互いを信じて支えるか、力量を認めて競い続けるか。',C('仲間を帰す約束を共に守る',4),C('腕を競う対等な武人として認める',2))
 ]},
 {id:'CH04',title:'平和を支える力',officerIds:['N009','N012'],prerequisite:'UE04',acts:[
  act('議論の続き','平和と支配を語ったセシリアとヴェラが、今度は城下の暮らしについて向き合った。対話と力の間に、日々を支える仕事がある。',C('二人で城下の声を聞く',3),C('別々に見聞を集めて持ち寄る',1)),
  act('強さの使い道','ヴェラは備えの強さを、セシリアはその使い道を問う。異なる考えを隠さず、民を守る目的に立ち返ろう。',C('守るための基準を共同で書く',3),C('互いの立場を残して協力する',-2)),
  act('城門の向こう','城門の警備と旅人への案内を、同じ方針で整える案が出た。厳しさと親切さは、両立できるかもしれない。',C('40金で警備と案内を整える',3,{gold:-40,publicOrder:1}),C('二人で今の運用を見直す',1,{publicOrder:1})),
  act('同じ明日へ','二人は同じ結論に至らなくても、同じ明日を守れると知った。その違いを、信頼か、問いを投げ合う関係として残そう。',C('違いを支え合う信頼を結ぶ',4),C('互いに問い続ける好敵手となる',2))
 ]},
 {id:'CH05',title:'蔵と地の知恵',officerIds:['N007','N020'],prerequisite:null,acts:[
  act('商人と技師','クルミが蔵の帳面を、トトが地面の図面を持ち寄った。荷が届くまでと、荷を保つまで。別々の仕事には、つながる場所があった。',C('蔵と運び道を二人で調べる',3),C('それぞれの仕事を教え合う',1)),
  act('早さと確かさ','クルミは流れを速くしたい。トトは傷みや漏れを見逃したくない。早さと確かさを両立する方法を考えよう。',C('同じ帳面に検査と運びを記す',3),C('得意な工程をそれぞれ任せる',-2)),
  act('小さな改良','二人が見つけたのは、大工事ではなく道具の置き方や確認の順番だった。小さな工夫を、誰でも続けられる仕組みにしよう。',C('40金で共同の手引きを作る',3,{gold:-40,publicOrder:1}),C('今ある道具で手順を伝える',1)),
  act('届く仕事','帳面と図面に、同じ印が増えた。目立たない仕事が国を支えることを知る二人は、次の工夫へ向き合っている。',C('知恵を持ち寄る信頼を結ぶ',4),C('互いの工夫を競う仲間となる',2))
 ]}
];
const byId=Object.fromEntries(defs.map(d=>[d.id,d]));
function init(s){if(!Object.hasOwn(s.personnel,'chains'))s.personnel.chains={version:1,lastMonth:0,lastOffered:0,pending:null,tracks:Object.fromEntries(defs.map(d=>[d.id,{stage:0,choices:[],resolvedTurns:[],dueTurn:1,lastOffered:0,cofightTurn:0}])),history:[]};return s;}
function subjects(s,d){const os=d.officerIds.map(id=>s.officers.find(o=>o.id===id));return os.every(o=>o?.status==='active'&&o.factionId===s.playerFactionId)&&os[0].locationCastleId===os[1].locationCastleId&&s.castles.some(c=>c.id===os[0].locationCastleId&&c.ownerFactionId===s.playerFactionId)?os:null;}
function blocked(s,id){const d=byId[id],t=s.personnel.chains.tracks[id];if(t.stage===d.acts.length)return '完結';if(d.prerequisite&&!s.events.flags[d.prerequisite]?.resolvedCount)return '先に「'+root.YabouEvents.byId[d.prerequisite].title+'」を経験してください';if(!subjects(s,d))return '二人が自家の現役武将として同じ城にいると再開できます';if(d.battleStage===t.stage&&!t.cofightTurn)return '対立の後、二人が同じ陣営で合戦に参加すると続きます';if(s.turn<t.dueTurn)return '次の便りまであと'+(t.dueTurn-s.turn)+'か月';return null;}
function battle(s,h){init(s);for(const d of defs){const t=s.personnel.chains.tracks[d.id];if(d.battleStage===t.stage&&!t.cofightTurn&&h.turn>=t.resolvedTurns[t.stage-1]&&Object.values(h.participants||{}).some(ids=>d.officerIds.every(id=>ids.includes(id))))t.cofightTurn=h.turn;}}
function record(s,p,choiceId,text){const v=s.personnel.chains;v.history.push({...clone(p),choiceId,text});v.history=v.history.slice(-80);}
function expire(s){const v=s.personnel.chains,p=v.pending;if(p&&p.turn<s.turn){record(s,p,'SKIP','今月は見送り。物語の進行・費用・報酬は発生せず、後日また続きます。');v.tracks[p.id].dueTurn=s.turn+3;v.pending=null;}}
function month(s,report){init(s);const v=s.personnel.chains;if(v.lastMonth>=s.turn)return;v.lastMonth=s.turn;expire(s);if(s.ending||s.events.pending||s.personnel.drama.pending||s.turn%3!==2||v.lastOffered&&s.turn-v.lastOffered<6)return;
 const ready=defs.filter(d=>!blocked(s,d.id)).sort((a,b)=>Number(v.tracks[b.id].stage>0)-Number(v.tracks[a.id].stage>0)||v.tracks[a.id].lastOffered-v.tracks[b.id].lastOffered||a.id.localeCompare(b.id));if(!ready.length)return;const d=ready[0],t=v.tracks[d.id],castleId=subjects(s,d)[0].locationCastleId;
 v.pending={id:d.id,stage:t.stage,turn:s.turn,castleId,uid:d.id+':'+t.stage+':'+s.turn+':'+castleId};v.lastOffered=s.turn;t.lastOffered=s.turn;(report.personnel??=[]).push({turn:s.turn-1,factionId:s.playerFactionId,castleId,text:'連鎖の物語「'+d.title+'」第'+(t.stage+1)+'幕：'+d.acts[t.stage].title+'。「出来事」で続きを読めます。'});
}
function options(s,p=s.personnel.chains.pending){if(!p)return [];const final=p.stage===byId[p.id].acts.length-1,deep=s.personnel.chains.tracks[p.id].choices.filter(x=>x==='A').length>=2;return byId[p.id].acts[p.stage].choices.map((c,i)=>({...c,...(final?{bond:i?c.bond:deep?4:2,ending:i?'対等な好敵手':deep?'違いを支える信頼':'対話から築く信頼'}:{}),id:i?'B':'A'}));}
function preview(c){return ['二人の関係 '+(c.bond>0?'+':'')+c.bond,c.gold?'金 '+c.gold:null,c.defense?'城防 +'+c.defense+'（上限100）':null,c.publicOrder?'民心 +'+c.publicOrder+'（上限100）':null,c.ending?'結末：'+c.ending:null].filter(Boolean).join(' / ');}
function text(s,p){const d=byId[p.id],t=s.personnel.chains.tracks[p.id],previous=t.choices.length?d.acts[p.stage-1].choices[t.choices.at(-1)==='A'?0:1].label:null;return (previous?'前の幕では「'+previous+'」を選んだ。\n\n':'')+d.acts[p.stage].text;}
function canChoose(s,uid,id){const p=s.personnel.chains.pending;if(!p||p.uid!==uid||p.turn!==s.turn)return 'この幕の返答は終了しています';if(s.ending)return 'この戦記は終了しています';const reason=blocked(s,p.id),os=subjects(s,byId[p.id]);if(reason)return reason;if(!os||os[0].locationCastleId!==p.castleId)return '二人の配置が変わっています。見送り後に再開できます';const c=options(s,p).find(c=>c.id===id);if(!c)return '選択肢が存在しません';if(c.gold&&root.YabouEvents.available(s,p,'gold')<-c.gold)return '予約分を除く金が不足しています';return null;}
function choose(state,uid,id){const error=canChoose(state,uid,id);if(error)throw Error(error);const s=clone(state),v=s.personnel.chains,p=v.pending,d=byId[p.id],t=v.tracks[p.id],c=options(s,p).find(c=>c.id===id),castle=s.castles.find(c=>c.id===p.castleId);
 if(c.gold)castle.gold+=c.gold;if(c.defense)castle.defense=Math.min(100,castle.defense+c.defense);if(c.publicOrder)castle.publicOrder=Math.min(100,castle.publicOrder+c.publicOrder);root.YabouRelationships.change(s,...d.officerIds,c.bond,'chain',p.castleId,p.uid);
 t.choices.push(id);t.resolvedTurns.push(s.turn);t.stage++;t.dueTurn=s.turn+3;let message=d.title+' 第'+(p.stage+1)+'幕「'+d.acts[p.stage].title+'」：'+c.label+'。'+preview({...c,ending:null});
 if(t.stage===d.acts.length){const trust=id==='A',tag=trust?'trust':'rival',bond=s.personnel.loyalty.bonds[[...d.officerIds].sort().join(':')];if(!bond.tags.includes(tag))bond.tags.push(tag);message+=' 結末：'+c.ending+'。関係タグ「'+(trust?'信頼':'ライバル')+'」を記録した。';}
 record(s,p,id,message);for(const officerId of d.officerIds)root.YabouBiography.add(s,officerId,p.uid+':chain','event',message);v.pending=null;return {state:s,text:message};
}
function dismiss(state,uid){const s=clone(state),v=s.personnel.chains,p=v.pending;if(!p||p.uid!==uid||p.turn!==s.turn)throw Error('この幕の返答は終了しています');record(s,p,'SKIP','今月は見送り。物語の進行・費用・報酬は発生せず、後日また続きます。');v.tracks[p.id].dueTurn=s.turn+3;v.pending=null;return s;}
function validate(s){const v=s.personnel.chains,fail=()=>{throw Error('連鎖イベントの保存情報が不正です');},turn=n=>Number.isSafeInteger(n)&&n>=0&&n<=s.turn;
 if(!v||v.version!==1||!turn(v.lastMonth)||!turn(v.lastOffered)||!v.tracks||Object.keys(v.tracks).length!==defs.length||!Array.isArray(v.history)||v.history.length>80)fail();
 for(const d of defs){const t=v.tracks[d.id];if(!t||!Number.isInteger(t.stage)||t.stage<0||t.stage>d.acts.length||!Array.isArray(t.choices)||!Array.isArray(t.resolvedTurns)||t.stage!==t.choices.length||t.stage!==t.resolvedTurns.length||t.choices.some(x=>!['A','B'].includes(x))||t.resolvedTurns.some((n,i)=>!turn(n)||!n||(i&&n-t.resolvedTurns[i-1]<3))||!Number.isSafeInteger(t.dueTurn)||t.dueTurn<1||t.dueTurn>s.turn+3||!turn(t.lastOffered)||!turn(t.cofightTurn)||(d.battleStage!==undefined&&t.stage>d.battleStage&&!t.cofightTurn)||(t.cofightTurn&&(d.battleStage===undefined||t.stage<d.battleStage||t.cofightTurn<t.resolvedTurns[d.battleStage-1])))fail();}
 const valid=p=>p&&Object.hasOwn(byId,p.id)&&Number.isInteger(p.stage)&&p.stage>=0&&p.stage<byId[p.id].acts.length&&turn(p.turn)&&p.turn>0&&s.castles.some(c=>c.id===p.castleId)&&p.uid===p.id+':'+p.stage+':'+p.turn+':'+p.castleId;
 if(new Set(v.history.map(h=>h.uid)).size!==v.history.length)fail();let previous=0;for(const h of v.history){if(!valid(h)||h.turn<previous||!['A','B','SKIP'].includes(h.choiceId)||typeof h.text!=='string'||h.text.length>1200||(h.choiceId!=='SKIP'&&(v.tracks[h.id].choices[h.stage]!==h.choiceId||v.tracks[h.id].resolvedTurns[h.stage]!==h.turn)))fail();previous=h.turn;}
 if(v.pending!==null&&(!valid(v.pending)||v.pending.turn!==s.turn||v.tracks[v.pending.id].stage!==v.pending.stage||v.tracks[v.pending.id].lastOffered!==s.turn||v.lastOffered!==s.turn||v.history.some(h=>h.uid===v.pending.uid)||s.ending))fail();
}
root.YabouChains={defs,byId,init,subjects,blocked,battle,month,options,preview,text,canChoose,choose,dismiss,validate};if(typeof module!=='undefined')module.exports=root.YabouChains;
})(globalThis);
