(function(root){
'use strict';
const lines={
 offerAdvice:{alliance:['同盟の申し出です。受諾すれば十二か月の条約になります。','同盟は各家二勢力までです。ほかの約束も確かめてご判断を。','この同盟を結ぶか、今回は見送るか。国境の備えと合わせて考えましょう。','同盟を受けても、兵や物資が自動で届くわけではありません。'],truce:['停戦の申し出です。受諾すれば六か月、双方とも攻撃できません。','戦いを休める機会です。六か月の停戦条件をご確認ください。','この停戦を受けるか、交戦を続けるか。今後の備えも考えましょう。','停戦と同盟は別の約束です。この提案は六か月の停戦になります。'],allianceCold:['関係が冷えた相手からの同盟提案です。条約の条件を慎重に見極めましょう。','この相手との関係は良好とはいえません。受諾の前に他家との約束もご確認を。'],truceLong:['長く続いた戦の停戦提案です。兵を休める判断も必要でしょう。','長期の交戦を休める機会です。六か月の停戦をどう使うか考えましょう。']},
 offerAccepted:{alliance:['同盟を受諾しました。十二か月の約束を踏まえて備えます。','同盟の締結を確認しました。条約の期限にもご注意を。','この同盟を結ぶ判断、承りました。今後の命令も条約に沿って進めましょう。'],truce:['停戦を受諾しました。六か月は双方とも攻撃できません。','停戦の締結を確認しました。戦いの合間の備えを進めましょう。','六か月の停戦が成立しました。期限と国境の備えを忘れずに。']},
 offerDeclined:{alliance:['今回の同盟提案は辞退しました。この返答で同盟は結んでいません。','同盟の申し出を見送る判断、承りました。','この同盟提案を辞退したことを記録します。'],truce:['今回の停戦提案は辞退しました。この返答で停戦は結んでいません。','停戦の申し出を見送る判断、承りました。','この停戦提案を辞退したことを記録します。']}
};
const templates=Object.entries(lines).flatMap(([scene,groups])=>Object.entries(groups).flatMap(([condition,texts])=>texts.map((text,i)=>({id:scene+':'+condition+':'+i,scene,condition,text}))));
function context(s,id){const offer=s.offers.find(o=>o.id===id),D=root.YabouDiplomacy,W=root.YabouMilitary;if(typeof id!=='string'||id.length>100||!offer||offer.expiresTurn<s.turn||offer.to!==s.playerFactionId||s.ending||!W.aliveFaction(s,offer.from))return null;const kind=offer.type||'alliance';if(!['alliance','truce'].includes(kind))return null;
 const o=s.officers.filter(o=>o.factionId===s.playerFactionId&&o.status==='active'&&s.castles.some(c=>c.id===o.locationCastleId&&c.ownerFactionId===s.playerFactionId)).sort((a,b)=>b.stats.intellect-a.stats.intellect||a.id.localeCompare(b.id))[0];if(!o)return null;
 const key=D.pair(offer.from,offer.to),war=s.wars[key];return {offer,kind,officerId:o.id,castleId:o.locationCastleId,cold:s.diplomacy[key].relation<0,long:!!war?.active&&s.turn-war.sinceTurn>=6};
}
function priority(t,c){if(t.condition===c.kind)return 0;if(t.condition==='allianceCold')return c.kind==='alliance'&&c.cold?5:-1;if(t.condition==='truceLong')return c.kind==='truce'&&c.long?5:-1;return -1;}
root.YabouOfferDialogue={templates,context,priority};if(typeof module!=='undefined')module.exports=root.YabouOfferDialogue;
})(globalThis);
