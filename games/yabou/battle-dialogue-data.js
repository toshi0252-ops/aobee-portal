(function(root){
'use strict';
const lines={
 battleWon:{base:['この合戦は我らの勝ちです。次の命令に備えます。','勝利の報告を申し上げます。戦いの記録を確かめましょう。','勝ちは得ました。ここからの備えも怠れません。','この一戦を制しました。次も慎重に進めましょう。'],heavy:['勝利は得ましたが、自軍の損耗も大きい一戦でした。','勝ったとはいえ、失った兵を軽く見ることはできません。','この勝利の代価は重い。戦力の立て直しも必要です。','大きな損耗を伴う勝利でした。次の出陣は慎重に。']},
 battleLost:{base:['この合戦は敗れました。結果を受け止め、次に備えます。','勝利には届きませんでした。戦況を見直しましょう。','敗戦を報告します。同じ過ちを繰り返さぬよう努めます。','一戦を落としました。次の判断こそ慎重に進めましょう。'],heavy:['敗戦に加え、自軍の損耗も大きくなりました。','大きな損耗を出した敗戦です。立て直しを急ぎましょう。','苦しい結果でした。失った戦力を踏まえて策を練り直します。','敗れ、兵も大きく減りました。無理な再戦は避けたいところです。']}
};
root.YABOU_BATTLE_DIALOGUE_DATA={templates:Object.entries(lines).flatMap(([scene,groups])=>Object.entries(groups).flatMap(([condition,texts])=>texts.map((text,i)=>({id:scene+':'+condition+':'+i,scene,condition,text}))))};
if(typeof module!=='undefined')module.exports=root.YABOU_BATTLE_DIALOGUE_DATA;
})(globalThis);
