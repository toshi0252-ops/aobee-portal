(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),L=()=>root.YabouLoyalty,P=()=>root.YabouRelationships;
const titles={friendship:'友情',training:'稽古',strategy:'軍略談義',argument:'口論の予兆',secret:'密談',appeal:'直訴',letter:'私信',duel:'決闘の申し出',rescue:'救出嘆願',recommend:'仕官推薦'};
const automatic=new Set(['friendship','training','strategy','letter']);
const hash=(s,n)=>{let h=(s.seed^Math.imul(n,2654435761))>>>0;h^=h>>>16;return h>>>0;};
function init(s){if(!Object.hasOwn(s.personnel,'drama'))s.personnel.drama={version:1,lastMonth:0,pending:null,history:[],lastTypes:{}};return s;}
function eligible(s,p){
 const c=s.castles.find(c=>c.id===p.castleId&&c.ownerFactionId===s.playerFactionId),os=p.officerIds.map(id=>s.officers.find(o=>o.id===id&&o.status==='active'&&o.factionId===s.playerFactionId&&o.locationCastleId===p.castleId));if(!c||os.length!==2||os.some(o=>!o)||os[0].id===os[1].id||os[0].role==='大名')return false;
 const [a,b]=os,bond=L().bond(s,a.id,b.id),target=s.officers.find(o=>o.id===p.targetId);
 return ({friendship:()=>bond>=15,training:()=>a.stats.valor>=70&&bond>=0,strategy:()=>a.stats.intellect>=80&&bond>=0,argument:()=>bond<=-15,secret:()=>a.loyalty<60&&(a.ambition??50)>=60,appeal:()=>a.loyalty<60,letter:()=>bond>=5&&a.loyalty<100,duel:()=>bond<=-35&&a.stats.valor>=70&&b.stats.valor>=70,rescue:()=>target?.status==='prisoner'&&target.factionId===s.playerFactionId&&target.captorFactionId!==s.playerFactionId&&L().bond(s,a.id,target.id)>=15,recommend:()=>a.stats.charisma>=75&&target?.status==='ronin'&&target.placement!=='locked'&&(!target.regionCastleId||target.regionCastleId===c.id||target.placement==='wanderer')&&!(s.personnel.known[s.playerFactionId]||[]).includes(target.id)})[p.kind]?.()||false;
}
function candidates(s){
 const result=[],homes=s.castles.filter(c=>c.ownerFactionId===s.playerFactionId).sort((a,b)=>a.id.localeCompare(b.id));
 for(const c of homes){const os=s.officers.filter(o=>o.status==='active'&&o.factionId===s.playerFactionId&&o.locationCastleId===c.id).sort((a,b)=>a.id.localeCompare(b.id));if(os.length<2)continue;const offset=hash(s,s.turn)%os.length;
  for(let i=0;i<Math.min(3,os.length);i++){const a=os[(offset+i)%os.length],b=os[(offset+i+1)%os.length];if(a.role==='大名')continue;
   const prisoner=s.officers.find(o=>o.status==='prisoner'&&o.factionId===s.playerFactionId&&o.captorFactionId!==s.playerFactionId&&L().bond(s,a.id,o.id)>=15),ronin=s.officers.find(o=>o.status==='ronin'&&o.placement!=='locked'&&(!o.regionCastleId||o.regionCastleId===c.id||o.placement==='wanderer')&&!(s.personnel.known[s.playerFactionId]||[]).includes(o.id));
   for(const kind of Object.keys(titles)){const p={kind,castleId:c.id,officerIds:[a.id,b.id],targetId:kind==='rescue'?prisoner?.id||null:kind==='recommend'?ronin?.id||null:null};if(eligible(s,p))result.push(p);}
  }
 }return result;
}
function options(p){const choice=(id,label,extra={})=>({id,label,...extra});return ({
 friendship:[choice('AUTO','親交を深めた',{bond:2})],training:[choice('AUTO','共に稽古した',{bond:1,defense:1})],strategy:[choice('AUTO','城の守りを語り合った',{bond:1,defense:1})],letter:[choice('AUTO','私信を交わした',{loyalty:1})],
 argument:[choice('A','席を設けて仲裁する',{bond:4}),choice('B','距離を置いて見守る',{bond:-2})],
 secret:[choice('A','二人の意見を直接聞く',{bond:2,loyalty:2}),choice('B','今は様子を見守る')],
 appeal:[choice('A','50金の慰労を認める',{gold:-50,loyalty:5}),choice('B','費用を使わず事情を聞く',{loyalty:2})],
 duel:[choice('A','制止して合同稽古に変える',{bond:3}),choice('B','立会いの下で技を比べる',{bond:1,defense:1})],
 rescue:[choice('A','捕虜の情報を集め、救援を検討する',{targetBond:2}),choice('B','無理な出兵を避け、まず話を聞く',{loyalty:1})],
 recommend:[choice('A','紹介を受け、人材帳に記す',{discover:true}),choice('B','今は紹介を見送る')]
 })[p.kind]||[];}
function preview(c){return [c.gold?'金 '+c.gold:null,c.bond?'二人の関係 '+(c.bond>0?'+':'')+c.bond:null,c.targetBond?'捕虜との関係 +'+c.targetBond:null,c.loyalty?'申し出た家臣の忠誠 +'+c.loyalty:null,c.defense?'城防 +'+c.defense+'（上限100）':null,c.discover?'所在を発見。登用は別の月に交渉':null].filter(Boolean).join(' / ')||'追加の費用・能力変化なし';}
function text(s,p){const [a,b]=p.officerIds.map(id=>s.officers.find(o=>o.id===id).name),target=s.officers.find(o=>o.id===p.targetId);return ({friendship:a+'と'+b+'が城で親交を深めた。',training:a+'が'+b+'を稽古に誘い、守りの動きを確かめた。',strategy:a+'と'+b+'が城の守備について軍略を語り合った。',letter:a+'から'+b+'へ私信が届き、日々の思いを伝え合った。',argument:a+'と'+b+'の意見が食い違い、周囲も口論の気配に気づいた。今なら間に入れる。',secret:a+'と'+b+'が人目を避けて話している。密談だけで謀反と決めつけず、意見を聞くことができる。',appeal:a+'が待遇について直訴した。慰労か対話か、方針を選べる。',duel:a+'と'+b+'が決闘を望んでいる。深刻な衝突になる前に扱いを決めよう。',rescue:a+'が'+(target?.name||'仲間')+'の救出を願い出た。捕虜の居城は'+(s.castles.find(c=>c.id===target?.locationCastleId)?.name||'不明')+'。情報の確認で、捕虜の解放や兵の移動が自動で起きることはない。',recommend:a+'が、この地方で出会った浪人を推薦したいと申し出た。紹介と登用交渉は別に扱う。'})[p.kind];}
function record(s,p,choiceId,message){const v=s.personnel.drama;v.history.push({...clone(p),choiceId,text:message});v.history=v.history.slice(-120);}
function apply(s,p,c){const castle=s.castles.find(x=>x.id===p.castleId),a=s.officers.find(o=>o.id===p.officerIds[0]);if(c.gold)castle.gold+=c.gold;if(c.defense)castle.defense=Math.min(100,castle.defense+c.defense);if(c.loyalty)a.loyalty=Math.min(100,a.loyalty+c.loyalty);if(c.bond)P().change(s,...p.officerIds,c.bond,'drama',p.castleId,p.uid);if(c.targetBond)P().change(s,a.id,p.targetId,c.targetBond,'drama',p.castleId,p.uid);if(c.discover){const known=s.personnel.known[s.playerFactionId]??=[];if(!known.includes(p.targetId))known.push(p.targetId);}
 const message=text(s,p)+' '+c.label+'。'+preview(c)+(c.discover?' / '+s.officers.find(o=>o.id===p.targetId).name+'を発見した。':'');record(s,p,c.id,message);for(const id of p.officerIds)root.YabouBiography.add(s,id,p.uid+':drama','event',message);return message;}
function month(s,report){init(s);const v=s.personnel.drama;if(v.lastMonth>=s.turn)return;v.lastMonth=s.turn;
 if(v.pending){record(s,v.pending,'SKIP','判断を見送り、追加の費用・変化は発生しなかった。');v.pending=null;}
 if(s.ending||s.turn%2||s.events.pending||s.personnel.chains?.pending||(s.personnel.chains?.lastOffered&&s.turn-s.personnel.chains.lastOffered<2))return;
 const pool=candidates(s).filter(p=>s.turn-(v.lastTypes[p.kind]||-12)>=12&&!v.history.some(h=>s.turn-h.turn<4&&h.officerIds.some(id=>p.officerIds.includes(id))));if(!pool.length)return;const weighted=pool.flatMap(p=>Array(root.YabouCamps?.weight(s,p)||1).fill(p)),p=weighted[hash(s,s.turn+19)%weighted.length];p.turn=s.turn;p.uid=p.kind+':'+p.turn+':'+p.castleId;v.lastTypes[p.kind]=s.turn;
 let message;if(automatic.has(p.kind))message=apply(s,p,options(p)[0]);else{v.pending=p;message=titles[p.kind]+'：'+text(s,p)+' 「出来事」で判断できます。';}
 (report.personnel??=[]).push({turn:s.turn-1,factionId:s.playerFactionId,castleId:p.castleId,text:message});
}
function canChoose(s,uid,id){const p=s.personnel.drama.pending;if(!p||p.uid!==uid||p.turn!==s.turn)return 'この申し出は終了しています';if(s.ending||!eligible(s,p))return '対象武将・所属・配置の条件が変わっています';const c=options(p).find(c=>c.id===id);if(!c||c.id==='AUTO')return '選択肢が存在しません';if(c.gold&&root.YabouEvents.available(s,p,'gold')<-c.gold)return '予約分を除く金が不足しています';return null;}
function choose(state,uid,id){const error=canChoose(state,uid,id);if(error)throw Error(error);const s=clone(state),p=s.personnel.drama.pending;const result=apply(s,p,options(p).find(c=>c.id===id));s.personnel.drama.pending=null;return {state:s,text:result};}
function dismiss(state,uid){const s=clone(state),p=s.personnel.drama.pending;if(!p||p.uid!==uid||p.turn!==s.turn)throw Error('この申し出は終了しています');record(s,p,'SKIP','判断を見送り、追加の費用・変化は発生しなかった。');s.personnel.drama.pending=null;return s;}
function validate(s){const v=s.personnel.drama,fail=()=>{throw Error('家臣ドラマの保存情報が不正です');},turn=n=>Number.isSafeInteger(n)&&n>=1&&n<=s.turn;
 if(!v||v.version!==1||!Number.isSafeInteger(v.lastMonth)||v.lastMonth<0||v.lastMonth>s.turn||!Array.isArray(v.history)||v.history.length>120||!v.lastTypes||typeof v.lastTypes!=='object'||Array.isArray(v.lastTypes))fail();for(const [kind,n]of Object.entries(v.lastTypes))if(!Object.hasOwn(titles,kind)||!turn(n))fail();
 const valid=p=>p&&Object.hasOwn(titles,p.kind)&&turn(p.turn)&&p.uid===p.kind+':'+p.turn+':'+p.castleId&&s.castles.some(c=>c.id===p.castleId)&&Array.isArray(p.officerIds)&&p.officerIds.length===2&&new Set(p.officerIds).size===2&&p.officerIds.every(id=>s.officers.some(o=>o.id===id))&&(p.targetId===null||!p.officerIds.includes(p.targetId)&&s.officers.some(o=>o.id===p.targetId))&&(['rescue','recommend'].includes(p.kind)?!!p.targetId:p.targetId===null);
 if(new Set(v.history.map(h=>h.uid)).size!==v.history.length)fail();let previous=0;for(const h of v.history){if(!valid(h)||h.turn<previous||!['AUTO','A','B','SKIP'].includes(h.choiceId)||(automatic.has(h.kind)?h.choiceId!=='AUTO':h.choiceId==='AUTO')||typeof h.text!=='string'||h.text.length>1200)fail();previous=h.turn;}
 if(v.pending!==null&&(!valid(v.pending)||automatic.has(v.pending.kind)||v.pending.turn!==s.turn||v.lastTypes[v.pending.kind]!==s.turn||v.history.some(h=>h.uid===v.pending.uid)||s.ending))fail();
}
root.YabouDrama={titles,init,eligible,candidates,options,preview,text,month,canChoose,choose,dismiss,validate};if(typeof module!=='undefined')module.exports=root.YabouDrama;
})(globalThis);
