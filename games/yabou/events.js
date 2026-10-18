(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const L=()=>root.YabouLoyalty,E=()=>root.Yabou,D=()=>root.YabouDiplomacy;
const active=(s,id)=>s.officers.find(o=>o.id===id&&o.status==='active'&&o.factionId===s.playerFactionId);
const known=(s,id)=>(s.personnel.known[s.playerFactionId]||[]).includes(id);
const ronin=(s,id)=>s.officers.find(o=>o.id===id&&o.status==='ronin');
const own=s=>s.castles.filter(c=>c.ownerFactionId===s.playerFactionId);
const C=(label,resources={},extra={},after='選択を受け、城下の暮らしには少しずつ変化が現れた。')=>({label,resources,...extra,after});
const defs=[];
function add(id,title,text,eligible,choices,unique=false,rumor=false){defs.push({id,title,text,eligible,choices,unique,rumor});}
const always=()=>true,hasOfficer=(s,p)=>p.officerIds.length>0,hasPair=(s,p)=>p.officerIds.length>=2;
const pairEffect=(p,delta,tag)=>({bond:{a:p.officerIds[0],b:p.officerIds[1],delta,...(tag?{tag}:{})}});
add('GE01','豊作','収穫を終えた城下に、実りを分かち合おうという声が上がった。通常の9月収穫はすでに月次収支へ計上されている。',s=>s.month===9,(s,p)=>[
 C('備蓄から民へ振る舞う',{food:-40,publicOrder:4},{},'食卓に届いた穀物を囲み、民は今年の実りを語り合った。'),C('余剰の穀物を売る',{food:-40,gold:60},{},'穀物商との取引が終わり、帳場には確かな売上の記録が残った。')]);
add('GE02','凶作','周辺の村から凶作の知らせが届いた。今回の通常収穫は変更せず、今ある備蓄で支えるかを決める。',s=>s.month===9,()=>[
 C('救援の穀物を買い入れる',{gold:-100,food:60},{},'買い入れた穀物が蔵へ届き、冬への備えが整った。'),C('今年は備蓄を守る',{}, {},'城では残る穀物の量を改めて確かめ、冬の献立を見直した。')]);
add('GE03','疫病','城下で熱病が広がり始めた。診療所は薬と清潔な水を求めている。',s=>s.turn>=6,()=>[
 C('薬代を出して治療を支える',{gold:-80,publicOrder:5},{},'診療所から、寝床を離れられる者が増えたとの便りが届いた。'),C('兵糧を療養所へ届ける',{food:-40,publicOrder:3},{},'温かな粥の配給が始まり、療養する人々の表情が和らいだ。')]);
add('GE04','商人','街道を越えてきた商人が、穀物の取引を持ちかけてきた。',always,()=>[
 C('80金で穀物100を買う',{gold:-80,food:100},{},'約束どおり穀物が納められ、商人は次の町へ旅立った。'),C('穀物80を100金で売る',{food:-80,gold:100},{},'取引を終えた商人は、この城では約束が守られると語った。')]);
add('GE05','盗賊','街道の見回り役が、荷馬車を狙う盗賊の足跡を見つけた。',s=>s.turn>=3,()=>[
 C('見回りの費用を出す',{gold:-60,publicOrder:5},{},'見回りの灯が街道に増え、荷馬車が再び夜明け前に走るようになった。'),C('兵を回して道を守る',{troops:-50,defense:2},{},'街道の警備に残った兵から、荷の往来が戻ったとの報告が届いた。')]);
add('GE06','浪人','主を持たない旅の武人が、城下の宿に滞在しているという。', (s,p)=>!!p.discoverId,(s,p)=>[
 C('身元を確かめて面会する',{}, {discover:[p.discoverId]},'面会のあと、浪人は正式な登用交渉を待つと告げた。'),C('今は迎えを出さない',{}, {},'旅人は宿を発った。街道には、まだ新しい出会いが待っている。')]);
add('GE07','逸材の噂','旅人が、並外れた才を持つ人物の居場所を語った。噂を手がかりに、人を遣わすことができる。',(s,p)=>!!p.discoverId&&(s.officers.find(o=>o.id===p.discoverId).stats.intellect>=85||s.officers.find(o=>o.id===p.discoverId).stats.charisma>=85),(s,p)=>[
 C('50金で足取りを調べる',{gold:-50},{discover:[p.discoverId]},'手がかりは確かだった。逸材の名と、交渉の窓口が人材帳に記された。'),C('噂として書き留める',{}, {},'旅人の話は書庫に収められた。真偽を確かめるのは、また別の機会になる。')],false,true);
add('GE08','家臣不満','家臣が待遇について静かに申し出た。忠誠の低い家臣ほど、言葉を交わす機会を必要としている。',(s,p)=>hasOfficer(s,p)&&s.officers.find(o=>o.id===p.officerIds[0]).loyalty<60,()=>[
 C('80金の慰労金を渡す',{gold:-80},{loyalty:8},'家臣から、気遣いは届いたとの返書があった。'),C('まず事情を聞く',{}, {loyalty:3},'家臣は、話を遮られずに聞いてもらえたことへ礼を述べた。')]);
add('GE09','家臣口論','二人の家臣が、城の運営を巡って声を荒らげた。対立の種を今のうちに扱う必要がある。',hasPair,(s,p)=>[
 C('席を設けて仲裁する',{},pairEffect(p,8),'二人は机を挟み、それぞれが見ていた事情を初めて聞いた。'),C('互いに成果で競わせる',{publicOrder:2},pairEffect(p,-3,'rival'),'競争は続いている。二人は互いの仕事を強く意識するようになった。')]);
add('GE10','訓練成果','兵たちが訓練の成果を披露した。次の備えに向けて、何を伸ばすかを決めよう。',always,()=>[
 C('兵糧を出して隊列を整える',{food:-30,troops:100},{},'隊列は以前より揃い、兵たちは日々の訓練に手応えを得た。'),C('城の守りに生かす',{defense:2},{},'訓練で得た工夫が、門と見張り台の配置に取り入れられた。')]);
add('GE11','密偵報告','隣国で兵が動いているとの報告が届いた。目的や規模はまだ確かではない。',s=>s.turn>=6,()=>[
 C('50金で守備の点検をする',{gold:-50,defense:3},{},'点検が済み、守備隊は見落としていた備えを補った。'),C('確報を待つ',{}, {},'続報はまだ届いていない。噂と確認済みの報告は分けて保管された。')],false,true);
add('GE12','不穏な密書','差出人不明の密書が見つかった。内容だけで家臣を疑うには、証拠が足りない。',hasOfficer,()=>[
 C('50金で城内の事情を調べる',{gold:-50,publicOrder:3},{},'調査記録がまとめられた。密書だけを根拠とした処罰は行われなかった。'),C('家臣と腹を割って話す',{}, {loyalty:2},'家臣は疑念を向けられる代わりに話し合いへ招かれたことを覚えている。')],false,true);
add('GE13','民の嘆願','城下の代表が、日々の暮らしを支えてほしいと願い出た。',(s,p)=>s.castles.find(c=>c.id===p.castleId).publicOrder<=75,()=>[
 C('80金を復旧に充てる',{gold:-80,publicOrder:8},{},'代表は、まず傷んだ橋と共同の井戸を直したと報告した。'),C('備蓄の穀物を分ける',{food:-40,publicOrder:5},{},'穀物が各戸へ届けられ、城下には少しずつ落ち着きが戻った。')]);
add('GE14','城改修','石垣を点検した職人が、今のうちに直せる傷みを見つけた。',(s,p)=>s.castles.find(c=>c.id===p.castleId).defense<95,()=>[
 C('100金で職人を雇う',{gold:-100,defense:6},{},'石垣の継ぎ目が整えられ、職人は手入れの覚え書きを残した。'),C('兵糧を出して共同作業にする',{food:-30,defense:3},{},'作業に集まった者たちは、直した壁を見上げて労をねぎらい合った。')]);
add('GE15','武器商人','手入れされた武具を積んだ商人が、城門に到着した。',always,()=>[
 C('100金で兵の武具を整える',{gold:-100,troops:150},{},'新たに装備を受け取った兵が、守備隊の列に加わった。'),C('60金で守備用具をそろえる',{gold:-60,defense:4},{},'守備隊は受け取った道具を各持ち場へ運び、扱い方を確かめた。')]);
add('GE16','祭り','城下から、小さな祭りを開きたいとの申し出があった。',always,()=>[
 C('80金で祭りを支える',{gold:-80,publicOrder:6},{loyalty:2},'灯がともる城下で、民も家臣もひととき肩の力を抜いた。'),C('穀物を振る舞う',{food:-40,publicOrder:4},{},'炊き出しの湯気が立ち、路地まで人々の笑い声が届いた。')]);
add('GE17','武将の病','家臣が体調を崩し、療養の申し出をしてきた。',hasOfficer,()=>[
 C('60金で医師を招く',{gold:-60},{loyalty:6},'医師の診立てを受けた家臣から、快方へ向かっているとの便りがあった。'),C('滋養のある食事を届ける',{food:-30},{loyalty:3},'家臣は届けられた食事を受け取り、気遣いへ礼を述べた。')]);
add('GE18','敵国内紛','他家で意見の対立が起きているという噂が流れている。事実や影響は確認できていない。',s=>s.turn>=6,()=>[
 C('40金で自城の備えを点検する',{gold:-40,defense:2},{},'他家の噂とは別に、自城の守備点検は予定どおり終わった。'),C('噂を記録して静観する',{}, {},'噂を裏付ける確報は届かなかった。無理な出兵は見送られた。')],false,true);
add('GE19','旅芸人の噂','旅芸人が、人と人をつなぐ妖精メルの話をした。紹介を頼むこともできそうだ。',s=>s.turn>=6,(s,p)=>[
 C('40金で一座を歓迎する',{gold:-40,publicOrder:3},{},'一座の演目は子どもたちの評判になり、次の公演を待つ声が上がった。'),C('60金でメルへの紹介を頼む',{gold:-60},ronin(s,'N029')&&!known(s,'N029')?{discover:['N029']}:{loyalty:2},'一座の縁は城下に残った。紹介できる相手がいた場合は、人材帳に名が記された。')],false,true);
add('GE20','流星','夜の見回りの途中、一筋の星が城の上を渡った。',hasOfficer,(s,p)=>[
 C('家臣と願いを語る',{}, {bond:{a:p.rulerId,b:p.officerIds[0],delta:3}},'あの夜に交わした言葉を、家臣は折に触れて思い返している。'),C('皆の働きをねぎらう',{}, {loyalty:3},'見回りを終えた兵たちは、それぞれの持ち場へ戻っていった。')]);
const story=(id,title,text,ids,choices)=>add(id,title,text,s=>ids.every(id=>!!active(s,id)),choices,true);
add('UE01','野に眠る軍師','コンは仕官を急いでいない。軍略を語るより先に、何を守りたいのかと問いかけてきた。',s=>!!ronin(s,'N002')&&known(s,'N002'),()=>[
 C('100金を用意し、教えを請う',{gold:-100},{bonus:{id:'N002',value:10}},'コンは地図を畳み、あなたの答えを覚えておくと告げた。登用交渉への信頼が残った。'),C('急がず、志を語る',{}, {bonus:{id:'N002',value:5}},'コンは静かにうなずいた。結論を急がない会話が、次の交渉への縁となった。')],true);
story('UE02','老将、最後の奉公','玄八は古びた具足を携え、もう一度この国に尽くしたいと願い出た。',['N001'],()=>[
 C('その経験を頼りにする',{}, {loyalty:10,loyaltyIds:['N001']},'玄八は具足を磨き直した。老将の声は、城の稽古場に再び響いている。'),C('後進を見守ってもらう',{defense:2},{loyalty:5,loyaltyIds:['N001']},'玄八の助言が守備の手入れに生かされ、若い兵たちが話を聞きに集まった。')]);
story('UE03','戦場に残された約束','ガルムとラウルが、かつて戦場で交わした約束について言葉を交わした。',['N003','N024'],()=>[
 C('二人が話し合う場を設ける',{}, {bond:{a:'N003',b:'N024',delta:15,tag:'friend'}},'長い沈黙のあと、二人は残された者のために共に歩くと確かめ合った。'),C('それぞれの働きを認める',{}, {loyalty:5,loyaltyIds:['N003','N024'],bond:{a:'N003',b:'N024',delta:3}},'約束の答えはまだ出ていない。それでも、二人は互いの立場を知った。')]);
story('UE04','平和か支配か','セシリアは対話を、ヴェラは強い備えを説く。二人が見据える国の形は異なっている。',['N009','N012'],()=>[
 C('交易と対話の道を支える',{commerce:3},{loyalty:5,loyaltyIds:['N009'],bond:{a:'N009',b:'N012',delta:-3}},'交易の手入れが始まった。ヴェラは異なる考えを保ちながら、その行方を見ている。'),C('城の備えを厚くする',{defense:5},{loyalty:5,loyaltyIds:['N012'],bond:{a:'N009',b:'N012',delta:-3}},'守備の点検が進んだ。セシリアは備えの先にも対話が必要だと語った。')]);
add('UE05','主を持たぬ忍び','カゲマルは、忠義という言葉よりも、守られる約束を信じると告げた。',s=>!!ronin(s,'N005')&&known(s,'N005'),()=>[
 C('100金を添え、条件を明らかにする',{gold:-100},{bonus:{id:'N005',value:10}},'カゲマルは書面を持ち帰った。明確な条件は、登用交渉への足掛かりとなった。'),C('自由な身で考えてもらう',{}, {bonus:{id:'N005',value:5}},'姿を消す間際、カゲマルは無理強いしなかったことを覚えておくと告げた。')],true);
story('UE06','小さな騎兵隊の誇り','リリィは体の大きさで役割を決めず、隊の働きを見てほしいと訴えた。',['N006'],()=>[
 C('兵糧を出し、隊の訓練を支える',{food:-30,troops:150},{},'訓練の列は揃い、リリィは仲間と共に新しい隊列を披露した。'),C('50金の慰労で功を称える',{gold:-50},{loyalty:8,loyaltyIds:['N006']},'隊の者たちは、自分たちの働きが見られていたことを喜んだ。')]);
add('UE07','復讐の果て','アッシュは復讐の旅について語り、それが終わったあとに帰る場所を持たないと打ち明けた。',s=>!!active(s,'N028')||!!ronin(s,'N028')&&known(s,'N028'),s=>[
 C('過去に向き合う話を聞く',{},active(s,'N028')?{loyalty:8,loyaltyIds:['N028']}:{bonus:{id:'N028',value:10}},'アッシュは旅の記録を閉じた。答えを押し付けられなかったことが、心に残っている。'),C('ここに帰る場所があると伝える',{},active(s,'N028')?{loyalty:5,loyaltyIds:['N028']}:{bonus:{id:'N028',value:5}},'アッシュはすぐには返事をしなかった。それでも、この城の名は覚えていると告げた。')],true);
story('UE08','微笑みの裏の野心','エリスは穏やかな笑みで、城の運営にもう一歩関わりたいと申し出た。',['N021'],()=>[
 C('商業の整備を託す',{commerce:5},{loyalty:5,loyaltyIds:['N021']},'エリスは取引の帳面を整えた。微笑みの奥にある望みは、まだ全て語られていない。'),C('役割を分けて民の声を集める',{publicOrder:5},{loyalty:-3,loyaltyIds:['N021']},'城下からの意見が届くようになった。エリスは決定を受け止め、次の機会を待っている。')]);
story('UE09','竜騎将の誓い','グレンは古い誓いを語り、この旗の下で守るべきものを確かめたいと願った。',['N019'],(s,p)=>[
 C('守るべきものを共に誓う',{}, {loyalty:8,loyaltyIds:['N019'],bond:{a:p.rulerId,b:'N019',delta:5,tag:'trust'}},'グレンは旗を見上げ、あの誓いを自らの言葉として引き受けた。'),C('まず城の守備を任せる',{defense:4},{loyalty:3,loyaltyIds:['N019']},'グレンは持ち場を一つずつ見て回った。誓いは日々の備えの中で形になり始めている。')]);
add('UE10','滅びた王国の旗','ゼノが携えた旗には、失われた王国の紋が残っていた。復興の願いを、どう受け止めるべきだろう。',s=>s.turn>=12&&own(s).length>=3&&!!ronin(s,'N030')&&!known(s,'N030'),()=>[
 C('250金を用意し、話し合いの場を開く',{gold:-250},{discover:['N030'],bonus:{id:'N030',value:5}},'ゼノは次の面会に応じると告げた。失われた旗を巡る交渉の窓口が開いた。'),C('歴史を聞き、旅立ちを見送る',{}, {},'ゼノは旗を巻き直して旅立った。国の歴史は城の書庫に残された。')],true);
add('EV01','最初の評定','家臣たちが最初の評定に集まった。まず、どの助言に耳を傾けよう。',s=>s.playerFactionId==='F01'&&s.turn===1,()=>[C('開墾の助言',{}, {panel:'agriculture'},'最初の評定で聞いた言葉は、国づくりの覚え書きに残された。'),C('外交の助言',{}, {panel:'diplomacy'},'隣国の使者を迎える準備について、家臣たちと話を交わした。')],true);
add('EV02','黒影からの書状','わるびー家から書状が届いた。返書を送るなら、既存の外交評定から使者を選べる。',s=>s.playerFactionId==='F01'&&s.castles.some(c=>c.ownerFactionId==='F02')&&!root.YabouMilitary.atWar(s,'F01','F02')&&root.YABOU_DATA.roads.some(r=>{const a=s.castles.find(c=>c.id===r.fromCastleId),b=s.castles.find(c=>c.id===r.toCastleId);return [a.ownerFactionId,b.ownerFactionId].sort().join(':')==='F01:F02';}),()=>[C('交渉を検討する',{}, {panel:'diplomacy'},'書状は外交の記録へ収められた。実際の交渉は、使者の予約を経て進められる。'),C('今は保留する',{}, {},'書状は封を戻して保管された。後の外交判断を妨げる約束は結んでいない。')],true);
add('SE04','疑惑の書状','盟約が破られるという書状が届いた。内容は未確認の噂で、裏切りが起きたという確報ではない。初期同盟は6か月。条約が有効な相手には攻撃や工作を行えず、期限後の判断は各家に委ねられる。',s=>s.scenarioId==='S04'&&s.turn===1,()=>[C('条約と相手国を確認する',{}, {panel:'diplomacy'},'盟約の期限と相手国を確認した。書状の噂を、裏切りの確報には置き換えず記録した。'),C('噂として記録し、判断を保留する',{}, {},'書状を未確認情報として保管した。噂だけを理由に同盟や家臣の忠誠を変えることはなかった。')],true,true);
add('SE05','六つの火種','領地が入り交じり、各城から守備と備蓄を確かめたいとの声が届いた。まだ戦争が起きたという報告ではない。軍議で配置を確認するか、外交から隣国との道を探すか。',s=>s.scenarioId==='S05'&&s.turn===1,()=>[C('軍議で守りと出陣を確かめる',{}, {panel:'military'},'軍議で配置を確かめた。実際の出陣は、編成と予約を経て行う。'),C('外交で隣国の状況を見る',{}, {panel:'diplomacy'},'隣国との関係を確認した。実際の条約や交易は、通常の交渉を経て決まる。')],true);
const byId=Object.fromEntries(defs.map(d=>[d.id,d]));
const hash=(s,n)=>{let x=(s.seed^Math.imul(n,2654435761))>>>0;x^=x>>>16;x=Math.imul(x,2246822507);x^=x>>>13;return x>>>0;};
function init(s){if(!Object.hasOwn(s,'events'))s.events={version:1,pending:null,history:[],flags:{},followups:[],hireBonuses:{}};return s;}
function context(s,c,turn){
 const os=s.officers.filter(o=>o.status==='active'&&o.factionId===s.playerFactionId&&o.locationCastleId===c.id&&o.role!=='大名').sort((a,b)=>a.loyalty-b.loyalty||a.id.localeCompare(b.id));
 const free=s.officers.filter(o=>o.status==='ronin'&&o.placement!=='locked'&&!known(s,o.id)&&(!o.regionCastleId||o.regionCastleId===c.id||o.placement==='wanderer'));
 return {castleId:c.id,officerIds:os.slice(0,2).map(o=>o.id),rulerId:s.officers.find(o=>o.factionId===s.playerFactionId&&o.role==='大名'&&o.status==='active')?.id||os[0]?.id||null,discoverId:free[hash(s,turn+7)%Math.max(1,free.length)]?.id||null};
}
function offer(s,d,p,turn){
 const flag=s.events.flags[d.id]||{lastOffered:0,resolvedCount:0};flag.lastOffered=turn;s.events.flags[d.id]=flag;
 s.events.pending={uid:d.id+':'+turn+':'+p.castleId,id:d.id,turn,...p};
}
function start(s){init(s);const opening=root.YabouScenarios?.get(s.scenarioId).openingEventId;if(opening){const c=own(s)[0];if(c){const p={...context(s,c,1),discoverId:null};if(!byId[opening]?.eligible(s,p))throw Error('初期出来事の条件が一致しません');offer(s,byId[opening],p,1);}}else if(s.playerFactionId==='F01'){const c=own(s)[0];if(c)offer(s,byId.EV01,context(s,c,1),1);}return s;}
function history(s,p,choiceId,text){const h={uid:p.uid,id:p.id,turn:s.turn,castleId:p.castleId,choiceId,text};s.events.history.push(h);s.events.history=s.events.history.slice(-120);return h;}
function month(s,report){
 const v=s.events,next=s.turn+1;report.events=[];
 if(v.pending){history(s,v.pending,'SKIP','今月は判断を見送り、追加の費用や報酬は発生しなかった。');v.pending=null;}
 for(const f of v.followups.filter(f=>f.dueTurn<=next)){const h=v.history.find(h=>h.uid===f.uid);if(h){h.followup=f.text;h.followupTurn=next;report.events.push({id:h.id,kind:'followup',text:f.text,castleId:h.castleId});}}
 v.followups=v.followups.filter(f=>f.dueTurn>next);
 // EV05 reuses the already committed harvest. EV08 reuses the existing victory.
 if(s.month===9&&v.flags.EV05?.year!==s.year){v.flags.EV05={lastOffered:next,resolvedCount:1,year:s.year};const entries=report.entries.filter(e=>e.factionId===s.playerFactionId);if(entries.length)report.events.push({id:'EV05',kind:'notice',castleId:entries[0].castleId,text:'収穫の秋：通常収穫 '+entries.reduce((n,x)=>n+x.harvest,0)+'。月次収支に計上済み。'});}
 if(s.ending){if(s.ending.type==='victory'&&!v.flags.EV08){v.flags.EV08={lastOffered:next,resolvedCount:1};report.events.push({id:'EV08',kind:'notice',castleId:own(s)[0].id,text:'乱世の終わり：既存の軍事統一を達成した。追加の統一報酬は発生しない。'});}return;}
 const castles=own(s).sort((a,b)=>a.id.localeCompare(b.id));if(!castles.length)return;
 const c=castles[hash(s,next)%castles.length],p=context(s,c,next);
 if(next===2&&!v.flags.EV02&&byId.EV02.eligible(s,p)){offer(s,byId.EV02,p,next);return;}
 if(s.turn%3!==0)return;
 const eligible=defs.filter(d=>!d.id.startsWith('EV')&&d.eligible(s,p)&&(!v.flags[d.id]||(!d.unique||!v.flags[d.id].resolvedCount)&&next-v.flags[d.id].lastOffered>=(d.unique?6:12)));
 const stories=eligible.filter(d=>d.unique),pool=stories.length?stories:eligible;
 if(pool.length)offer(s,pool[hash(s,next+41)%pool.length],p,next);
}
function options(s,p=s.events.pending){return p?byId[p.id].choices(s,p).map((c,i)=>({...c,id:String.fromCharCode(65+i)})):[];}
function available(s,p,k){const c=s.castles.find(c=>c.id===p.castleId);let n=c[k];for(const q of s.commands.filter(q=>q.castleId===c.id))n-=E().commandRule(q,root.YABOU_RULES).cost[k]||0;if(k==='gold')n-=D().reserved(s,c.id);if(k==='food')n-=root.YabouMilitary.food(s,c.id);if(k==='troops'){const reserved=s.militaryCommands.filter(q=>q.castleId===c.id).reduce((n,q)=>n+q.units.reduce((n,u)=>n+u.troops,0),0);n-=reserved+(reserved?100:0);}return n;}
function canChoose(s,uid,choiceId){
 const p=s.events.pending;if(!p||p.uid!==uid||p.turn!==s.turn)return 'この出来事はすでに終了しています';
 if(s.ending)return 'この戦記は終了しています';
 if(!s.castles.some(c=>c.id===p.castleId&&c.ownerFactionId===s.playerFactionId))return '対象の城はすでに自領ではありません';
 const c=options(s,p).find(c=>c.id===choiceId);if(!c)return '選択肢が存在しません';
 if(['GE01','GE02'].includes(p.id)&&s.month!==10)return 'この秋の出来事はすでに終了しています';
 if(!['GE01','GE02'].includes(p.id)&&!byId[p.id].eligible(s,p))return '出来事の対象条件が変わっています';
 if(['GE06','GE07'].includes(p.id)&&s.officers.find(o=>o.id===p.discoverId)?.placement==='locked')return 'この人物はまだ紹介されていません';
 const ids=c.loyaltyIds||(p.id==='GE16'?p.officerIds:p.officerIds.slice(0,1));if(c.loyalty&&ids.some(id=>!active(s,id)))return '対象の家臣の所属が変わっています';
 if(c.bond&&(c.bond.a===c.bond.b||!active(s,c.bond.a)||!active(s,c.bond.b)))return '関係を変える相手の所属が変わっています';
 if(c.discover?.some(id=>!ronin(s,id)))return '紹介相手はすでに仕官しています';
 if(c.bonus&&!ronin(s,c.bonus.id))return '交渉相手はすでに仕官しています';
 for(const [k,n]of Object.entries(c.resources))if(n<0&&available(s,p,k)<-n)return '予約分を除く'+({gold:'金',food:'兵糧',troops:'兵数'}[k]||k)+'が不足しています';
 return null;
}
function choose(state,uid,choiceId){
 const error=canChoose(state,uid,choiceId);if(error)throw Error(error);const s=clone(state),p=s.events.pending,c=options(s,p).find(c=>c.id===choiceId),castle=s.castles.find(x=>x.id===p.castleId),results=[];
 for(const [k,n]of Object.entries(c.resources)){const before=castle[k];castle[k]=clamp(before+n,0,['publicOrder','farm','commerce','defense'].includes(k)?100:Number.MAX_SAFE_INTEGER);results.push(({gold:'金',food:'兵糧',troops:'兵数',publicOrder:'民心',defense:'城防',farm:'農業',commerce:'商業'}[k]||k)+' '+before+'→'+castle[k]);}
 if(c.loyalty)for(const id of c.loyaltyIds||(p.id==='GE16'?p.officerIds:p.officerIds.slice(0,1))){const o=s.officers.find(o=>o.id===id),before=o.loyalty;o.loyalty=clamp(before+c.loyalty,0,100);results.push(o.name+'の忠誠 '+before+'→'+o.loyalty);}
 if(c.bond){L().addBond(s,c.bond.a,c.bond.b,c.bond.delta);const b=s.personnel.loyalty.bonds[[c.bond.a,c.bond.b].sort().join(':')];if(c.bond.tag&&b&&!b.tags.includes(c.bond.tag))b.tags.push(c.bond.tag);results.push('関係 '+(c.bond.delta>=0?'+':'')+c.bond.delta);}
 for(const id of c.discover||[]){const ids=s.personnel.known[s.playerFactionId]??=[];if(!ids.includes(id))ids.push(id);results.push(s.officers.find(o=>o.id===id).name+'を発見（登用は別の交渉）');}
 if(c.bonus){const key=s.playerFactionId+':'+c.bonus.id;s.events.hireBonuses[key]=Math.max(s.events.hireBonuses[key]||0,c.bonus.value);results.push('この武将への登用成功率補正 +'+s.events.hireBonuses[key]+'ポイント');}
 const flag=s.events.flags[p.id];flag.resolvedCount++;flag.lastResolved=s.turn;
 const text=c.label+'。'+(results.join(' / ')||'追加の費用・能力変化なし。');history(s,p,c.id,text);s.events.followups.push({uid:p.uid,dueTurn:s.turn+2,text:c.after});s.events.followups=s.events.followups.slice(-20);s.events.pending=null;
 return {state:s,text,panel:c.panel||null};
}
function dismiss(state,uid){if(!state.events.pending||state.events.pending.uid!==uid||state.events.pending.turn!==state.turn)throw Error('この出来事はすでに終了しています');const s=clone(state);history(s,s.events.pending,'SKIP','判断を見送り、追加の費用や報酬は発生しなかった。');s.events.pending=null;return s;}
function preview(s,c){return Object.entries(c.resources).map(([k,n])=>({gold:'金',food:'兵糧',troops:'兵数',publicOrder:'民心',defense:'城防',farm:'農業',commerce:'商業'}[k]||k)+(n>=0?' +':' ')+n).concat(c.loyalty?['対象家臣の忠誠 '+(c.loyalty>=0?'+':'')+c.loyalty]:[],c.bond?['関係 '+(c.bond.delta>=0?'+':'')+c.bond.delta]:[],c.discover?.length?['発見のみ・登用は別']:[],c.bonus?['登用補正 +'+c.bonus.value+'ポイント']:[]).join(' / ')||'追加の費用・能力変化なし';}
function hireBonus(s,f,id){return s.events.hireBonuses[f+':'+id]||0;}
function validateReport(entries,s){if(!Array.isArray(entries)||entries.length>24||entries.some(x=>!x||(!byId[x.id]&&!['EV05','EV08'].includes(x.id))||!['notice','followup'].includes(x.kind)||!s.castles.some(c=>c.id===x.castleId)||typeof x.text!=='string'||x.text.length>1500))throw Error('出来事の月次報告が不正です');}
function validate(s){
 const v=s.events,fail=()=>{throw Error('出来事の保存情報が不正です');},isObj=x=>x&&typeof x==='object'&&!Array.isArray(x),ids=new Set(s.officers.map(o=>o.id)),cs=new Set(s.castles.map(c=>c.id));
 if(!isObj(v)||v.version!==1||!Array.isArray(v.history)||v.history.length>120||!isObj(v.flags)||!Array.isArray(v.followups)||v.followups.length>20||!isObj(v.hireBonuses))fail();
 const validId=id=>!!byId[id]||['EV05','EV08'].includes(id),turn=n=>Number.isSafeInteger(n)&&n>=1&&n<=s.turn;
 for(const [id,f]of Object.entries(v.flags))if(!validId(id)||!isObj(f)||!turn(f.lastOffered)||!Number.isSafeInteger(f.resolvedCount)||f.resolvedCount<0||f.resolvedCount>s.turn+1||(f.lastResolved!==undefined&&!turn(f.lastResolved))||(f.year!==undefined&&(!Number.isInteger(f.year)||f.year<1||f.year>s.year)))fail();
 if(new Set(v.history.map(h=>h.uid)).size!==v.history.length)fail();
 for(const h of v.history)if(!isObj(h)||!byId[h.id]||!turn(h.turn)||!cs.has(h.castleId)||h.uid!==h.id+':'+h.turn+':'+h.castleId||typeof h.uid!=='string'||h.uid.length>80||!['A','B','SKIP'].includes(h.choiceId)||typeof h.text!=='string'||h.text.length>1500||(h.followup!==undefined&&(typeof h.followup!=='string'||h.followup.length>800||!turn(h.followupTurn))))fail();
 if(new Set(v.followups.map(f=>f.uid)).size!==v.followups.length)fail();
 for(const f of v.followups)if(!isObj(f)||!v.history.some(h=>h.uid===f.uid&&h.choiceId!=='SKIP'&&!h.followup)||!Number.isSafeInteger(f.dueTurn)||f.dueTurn<=s.turn||f.dueTurn>s.turn+2||typeof f.text!=='string'||f.text.length>800)fail();
 for(const [key,n]of Object.entries(v.hireBonuses)){const [f,id]=key.split(':');if(key!==f+':'+id||!s.factions.some(x=>x.id===f)||!ids.has(id)||![5,10].includes(n))fail();}
 if(v.pending!==null){const p=v.pending;if(!isObj(p)||!byId[p.id]||p.turn!==s.turn||p.uid!==p.id+':'+p.turn+':'+p.castleId||!cs.has(p.castleId)||!Array.isArray(p.officerIds)||p.officerIds.length>2||new Set(p.officerIds).size!==p.officerIds.length||p.officerIds.some(id=>!ids.has(id))||(p.rulerId!==null&&!ids.has(p.rulerId))||(p.discoverId!==null&&!ids.has(p.discoverId))||v.flags[p.id]?.lastOffered!==p.turn||(byId[p.id].unique&&v.flags[p.id]?.resolvedCount>0)||v.history.some(h=>h.uid===p.uid)||s.ending)fail();}
}
root.YabouEvents={available,defs,byId,init,start,month,options,canChoose,choose,dismiss,preview,hireBonus,validateReport,validate};
if(typeof module!=='undefined'&&module.exports)module.exports=root.YabouEvents;
})(globalThis);
