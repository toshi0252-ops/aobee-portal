/* Deliberately records states and candidate TYPES only: no addresses, SDP or room IDs. */
(function(root){
 'use strict';
 function create({now=()=>Date.now(),render=()=>{}}={}){
  let started=now(),lines=[],states={},role='none',environment={},stopMonitor=()=>{};
  function report(){return ['AOBEE GP v4.4', '役割: '+role,...Object.entries(environment).map(([k,v])=>k+': '+v),...lines].join('\n');}
  function record(key,value){value=String(value);if(states[key]===value)return;states[key]=value;lines.push(((now()-started)/1000).toFixed(1)+'s '+key+': '+value);if(lines.length>45)lines.shift();render(report());}
  function reset(newRole,env={}){stopMonitor();started=now();lines=[];states={};role=newRole;environment=env;record('開始','接続を開始');}
  function newAttempt(){states={};record('対戦通信','新しい接続試行');record('サーバー','接続済み');}
  function reason(){
   if(states['通信路']==='open')return '通信路は開きましたが、ゲームの応答確認が完了しませんでした。';
   if(['connected','completed'].includes(states.ICE))return '通信経路は確立しましたが、データ通信路が開きませんでした。';
   if(states.ICE==='checking'||states.ICE==='failed')return '端末間の通信経路を確立できませんでした。';
   if(states['交渉'])return '端末間の通信条件の交渉が完了しませんでした。';
   if(states['サーバー']==='接続済み')return 'ルームまたは相手からの応答を確認できませんでした。';
   return '接続サーバーへの接続が完了しませんでした。';
  }
  function monitor(conn,isCurrent,onFailure){
   stopMonitor();let active=true,pc=null,channel=null,lastStats=-Infinity,pending=false;const cleanups=[],local=new Set(),remote=new Set();
   function listen(target,event,fn){target.addEventListener(event,fn);cleanups.push(()=>target.removeEventListener(event,fn));}
   function sample(){
    if(!active||!isCurrent())return;
    const next=conn.peerConnection;
    if(next&&next!==pc){pc=next;const tracked=pc;
     const read=()=>{if(!active||!isCurrent())return;record('交渉',tracked.signalingState||'unknown');record('候補収集',tracked.iceGatheringState||'unknown');record('ICE',tracked.iceConnectionState||'unknown');record('接続',tracked.connectionState||'unknown');if(tracked.sctp){record('SCTP',tracked.sctp.state);if(tracked.sctp.transport)record('DTLS',tracked.sctp.transport.state);}if(tracked.iceConnectionState==='failed'||tracked.connectionState==='failed')onFailure();};
     for(const ev of ['signalingstatechange','icegatheringstatechange','iceconnectionstatechange','connectionstatechange'])listen(tracked,ev,read);
     listen(tracked,'icecandidate',ev=>{if(!active||!isCurrent())return;if(ev.candidate){const type=ev.candidate.type||ev.candidate.candidate?.match(/ typ (host|srflx|prflx|relay)/)?.[1];if(type&&/^(host|srflx|prflx|relay)$/.test(type)){local.add(type);record('自分の候補',[...local].sort().join('/'));}}else record('候補収集','complete');});
     listen(tracked,'icecandidateerror',ev=>{if(active&&isCurrent())record('候補収集エラー',Number(ev.errorCode)||'不明');});read();
    }
    const nextChannel=conn.dataChannel;
    if(nextChannel&&nextChannel!==channel){channel=nextChannel;const tracked=channel;const read=()=>{if(active&&isCurrent())record('通信路',tracked.readyState);};for(const ev of ['open','close','error'])listen(tracked,ev,read);read();}
    if(pc?.sctp){record('SCTP',pc.sctp.state);if(pc.sctp.transport)record('DTLS',pc.sctp.transport.state);}
    if(pc?.getStats&&!pending&&now()-lastStats>=2000){lastStats=now();pending=true;Promise.resolve().then(()=>pc.getStats()).then(stats=>{if(!active||!isCurrent())return;stats.forEach(s=>{if(s.type==='local-candidate'&&/^(host|srflx|prflx|relay)$/.test(s.candidateType))local.add(s.candidateType);if(s.type==='remote-candidate'&&/^(host|srflx|prflx|relay)$/.test(s.candidateType))remote.add(s.candidateType);if(s.type==='candidate-pair'&&s.state==='succeeded'&&s.nominated)record('選択経路','確立済み');});if(local.size)record('自分の候補',[...local].sort().join('/'));if(remote.size)record('相手の候補',[...remote].sort().join('/'));}).catch(()=>{if(active&&isCurrent())record('詳細統計','取得不可');}).finally(()=>{pending=false;});}
   }
   const timer=setInterval(sample,500);stopMonitor=()=>{active=false;clearInterval(timer);for(const off of cleanups)off();};sample();return stopMonitor;
  }
  return {record,reset,newAttempt,report,reason,monitor,stop:()=>stopMonitor()};
 }
 if(typeof module==='object'&&module.exports)module.exports={create};else root.GPConnectionDiagnostics={create};
})(typeof window==='undefined'?{}:window);
