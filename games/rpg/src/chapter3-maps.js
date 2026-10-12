(function(root){
'use strict';
function populate(make,rect,port){
 const maps={};
 function room(id,name,w=22,h=18){const m=make(id,name,w,h,'floor');m.indoors=true;m.theme='tower';for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(!x||!y||x===w-1||y===h-1)m.tiles[y][x]='wall';maps[id]=m;return m;}
 const station=room('chronoa-station','クロノア中央駅',26,18);
 station.npcs.push({id:'station-clerk',sprite:'guildmaster',name:'駅の係員',x:13,y:7});
 station.objects.push({id:'station-back',type:'gate',x:3,y:13,label:'ミナトリアへ'},{id:'city-gate',type:'gate',x:23,y:8,label:'歯車広場へ'},{id:'station-notice',type:'chart',x:7,y:5,label:'本人確認の掲示'},{type:'machine',x:12,y:4,w:3,h:2,label:'照合装置'});
 const plaza=make('chronoa-plaza','クロノア・歯車広場',30,24,'path');plaza.theme='harbor';maps[plaza.id]=plaza;
 plaza.objects.push({id:'plaza-station',type:'gate',x:3,y:12,label:'中央駅へ'},{id:'research-gate',type:'gate',x:26,y:8,label:'研究区へ'},{id:'commerce-gate',type:'gate',x:26,y:18,label:'商業区へ'},{id:'clocktower-gate',type:'gate',x:15,y:5,label:'時計塔へ'},{id:'city-clock',type:'clock',x:15,y:11,label:'広場の時計'},{type:'fountain',x:9,y:14,w:2,h:2});
 plaza.npcs.push({id:'city-worker',sprite:'sailor',name:'交通係',x:19,y:16});
 const commerce=make('chronoa-commerce','クロノア・商業区',24,18,'path');commerce.theme='harbor';maps[commerce.id]=commerce;
 commerce.objects.push({id:'commerce-back',type:'gate',x:3,y:9,label:'歯車広場へ'},{id:'city-rest',type:'restbank',x:10,y:11,label:'街角の休憩所'},{id:'service-terminal',type:'machine',x:15,y:6,label:'利用資格の端末'},{type:'market',x:7,y:4,w:3,h:2,label:'時計職人の露店'});commerce.npcs.push({id:'unlisted-worker',sprite:'fisher',name:'作業着の人',x:16,y:10});
 const research=make('chronoa-research','クロノア・研究区',26,20,'path');maps[research.id]=research;
 research.objects.push({id:'research-back',type:'gate',x:3,y:10,label:'歯車広場へ'},{id:'lab-gate',type:'gate',x:9,y:5,label:'ミラの研究室へ'},{id:'archive-gate',type:'gate',x:21,y:6,label:'研究資料庫へ'},{id:'bureau-gate',type:'gate',x:21,y:15,label:'記録管理局へ'},{type:'shelf',x:13,y:3,w:4,h:1});
 const lab=room('mira-lab','ミラの研究室',18,15);lab.npcs.push({id:'mira',sprite:'mira',name:'ミラ',x:10,y:6});lab.objects.push({id:'lab-back',type:'gate',x:3,y:11,label:'研究区へ'},{id:'orphe-notebook',type:'book',x:6,y:4,label:'オルフェの手書きノート'},{id:'practice-terminal',type:'machine',x:13,y:10,label:'解析訓練端末'},{type:'table',x:8,y:3,w:4,h:2});
 const archive=room('chronoa-archive','研究区・封鎖資料庫');archive.objects.push({id:'archive-back',type:'gate',x:3,y:13,label:'研究区へ'},{id:'paper-application',type:'book',x:15,y:6,label:'古い研究申請書'},{id:'archive-terminal',type:'machine',x:8,y:5,label:'星の照合端末'},{type:'shelf',x:5,y:2,w:12,h:1});
 const tower=room('chronoa-clocktower','時計塔・三系統の同期室',24,20);tower.objects.push({id:'clocktower-back',type:'gate',x:3,y:15,label:'歯車広場へ'},{id:'sync-chart',type:'chart',x:5,y:5,label:'同期の設計図'},{id:'sync-reset',type:'sign',x:18,y:15,label:'同期をやり直す'},{id:'sync-console',type:'machine',x:12,y:4,label:'同期制御盤'});
 for(let i=0;i<3;i++)tower.objects.push({id:'clock-direction-'+i,type:'valve',x:7+i*5,y:9,label:'系統'+(i+1)+'の回転方向'},{id:'clock-hand-'+i,type:'clock',x:7+i*5,y:12,label:'系統'+(i+1)+'の針を進める'},{id:'clock-start-'+i,type:'signal',x:7+i*5,y:6,label:'系統'+(i+1)+'を起動'});
 port.objects.push({id:'chronoa-gate',type:'gate',x:32,y:11,label:'クロノア中央駅へ'});
 (typeof module!=='undefined'&&module.exports?require('./chapter3-side.js'):root.AobeeChapter3Side).populate(maps);
 (typeof module!=='undefined'&&module.exports?require('./chapter3-finale.js'):root.AobeeChapter3Finale).populate(make,rect,maps);return (typeof module!=='undefined'&&module.exports?require('./chapter4.js'):root.AobeeChapter4).populate(make,rect,maps);
}
const api={populate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AobeeChapter3Maps=api;
})(globalThis);
