(function(root){
'use strict';
const LIMIT=80,kinds=['hire','rejoin','transfer','departure','promotion','capture','release','firstBattle','victory','defeat','event'];
function init(s){if(!s.biography)s.biography={version:1,officers:Object.fromEntries(s.officers.map(o=>[o.id,{entries:[],firstBattle:null,served:!!o.factionId}]))};return s;}
function add(s,id,key,kind,text,turn=s.turn){init(s);const b=s.biography.officers[id];if(!b||b.entries.some(x=>x.key===key))return; b.entries.push({key,turn,kind,text});b.entries=b.entries.slice(-LIMIT);}
function changes(before,s,source){init(s);for(const o of s.officers){const old=before.officers.find(x=>x.id===o.id),b=s.biography.officers[o.id];if(!old)continue;const f=s.factions.find(x=>x.id===o.factionId)?.name;
 if(old.factionId!==o.factionId){if(o.factionId){add(s,o.id,source+':join:'+o.id,old.factionId?'transfer':b.served?'rejoin':'hire',(old.factionId?'他家から移籍し、':b.served?'再仕官し、':'登用され、')+f+'に仕える。');b.served=true;}else add(s,o.id,source+':leave:'+o.id,'departure','仕官先を離れ、浪人となる。');}
 if(old.role!==o.role)add(s,o.id,source+':role:'+o.id,'promotion',o.role+'に任じられる。');
 if(old.status!==o.status&&o.status==='prisoner')add(s,o.id,source+':capture:'+o.id,'capture','捕虜となる。');
 if(old.status==='prisoner'&&o.status!=='prisoner')add(s,o.id,source+':release:'+o.id,'release','捕虜から解放される。');
}}
function battle(s,h){init(s);for(const [side,ids]of Object.entries(h.participants||{}))for(const id of ids){const b=s.biography.officers[id];if(!b)continue;const place=s.castles.find(c=>c.id===h.castleId).name;if(!b.firstBattle){b.firstBattle=h.id;add(s,id,h.id+':first','firstBattle',place+'の戦いに出陣（列伝で最初の合戦記録）。',h.turn);}const won=h.winner===side;add(s,id,h.id+':result',won?'victory':'defeat',place+'の戦いに'+(won?'勝利。':'敗北。'),h.turn);}}
const unique={UE01:['N002'],UE02:['N001'],UE03:['N003','N024'],UE04:['N009','N012'],UE05:['N005'],UE06:['N006'],UE07:['N028'],UE08:['N021'],UE09:['N019'],UE10:['N030']};
function event(s,p,text){for(const id of new Set(unique[p.id]||[...p.officerIds,p.discoverId].filter(Boolean)))add(s,id,p.uid+':event','event',text);}
function followups(before,s){for(const h of s.events.history)if(h.followup&&!before.events.history.some(x=>x.uid===h.uid&&x.followup)){for(const o of s.officers)if(s.biography.officers[o.id].entries.some(x=>x.key===h.uid+':event'))add(s,o.id,h.uid+':followup','event','後日談：'+h.followup,h.followupTurn);}}
function validate(s){if(!s.biography)return;const v=s.biography,fail=()=>{throw Error('武将列伝が不正です');};if(v.version!==1||!v.officers||Object.keys(v.officers).length!==s.officers.length)fail();for(const o of s.officers){const b=v.officers[o.id];if(!b||typeof b.served!=='boolean'||!(b.firstBattle===null||typeof b.firstBattle==='string'&&b.firstBattle.length<=100)||!Array.isArray(b.entries)||b.entries.length>LIMIT||new Set(b.entries.map(x=>x.key)).size!==b.entries.length)fail();let turn=0;for(const x of b.entries){if(!x||typeof x.key!=='string'||x.key.length>200||!kinds.includes(x.kind)||typeof x.text!=='string'||x.text.length>1200||!Number.isSafeInteger(x.turn)||x.turn<1||x.turn>s.turn||x.turn<turn)fail();turn=x.turn;}}}
root.YabouBiography={LIMIT,init,add,changes,battle,event,followups,validate};if(typeof module!=='undefined')module.exports=root.YabouBiography;
})(globalThis);
