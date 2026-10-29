const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.resolve(__dirname,'..');let h=fs.readFileSync(path.join(root,'archive/legacy-20261030/games/aobee_grand_prix_v43_online_vs_icefix.html'),'utf8');
function replace(a,b){if(!h.includes(a))throw Error('Missing '+a.slice(0,80));h=h.replace(a,b);}
replace('<div id="onlinePlayers">',`<button type="button" id="retryConnection" style="min-height:44px">接続をやり直す</button><details id="connectionDetails"><summary>接続診断（v4.4）</summary><p style="font-size:11px">失敗したら、2台それぞれで診断をコピーして玲奈に伝えてください。IPアドレス・部屋番号は含みません。</p><textarea id="connectionReport" readonly aria-label="接続診断の内容" style="box-sizing:border-box;width:100%;height:160px;font-size:11px;background:#071c30;color:#deefff"></textarea><button type="button" id="copyConnectionReport" style="min-height:44px">診断をコピー</button><span id="connectionCopyNotice" role="status"></span></details><div id="onlinePlayers">`);
replace('<script src="https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js"></script>','<script src="../assets/gp-connection-diagnostics.js?v=44a"></script><script src="https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js"></script>');
replace('let netEpoch = 0, netTimer = 0;',`let netEpoch = 0, netTimer = 0, netHelloTimer = 0;
const netDiagnostics=GPConnectionDiagnostics.create({render:text=>{document.getElementById('connectionReport').value=text;}});
function stopNetTimers(){clearTimeout(netTimer);clearInterval(netHelloTimer);netDiagnostics.stop();}
function failNetAttempt(message){
 stopNetTimers();const failed=netConn;netConn=null;netConnected=netReady=netRemoteReady=false;remoteTarget=null;
 if(running)running=false;
 try{failed?.close()}catch(e){}
 netDiagnostics.record('結果',message);document.getElementById('connectionDetails').open=true;
 setNetStatus(message+(netRole==='host'&&netPeer?.open?' 部屋は残っています。相手の端末で再参加してください。':' 「接続をやり直す」で再試行できます。'),true);syncOnlineLobby();
}
function completeNetHandshake(){if(netConnected)return;netConnected=true;netReady=netRemoteReady=false;clearTimeout(netTimer);clearInterval(netHelloTimer);netDiagnostics.record('ゲーム応答','確認済み');setNetStatus('対戦通信の接続成功！ 2人ともREADYにしてください。');if(netRole==='host')sendCourse();syncOnlineLobby();}
`);
replace("netEpoch++; clearTimeout(netTimer);","netEpoch++; stopNetTimers();");
const a=h.indexOf('function waitForNetwork('),b=h.indexOf('function onNetData(',a);
h=h.slice(0,a)+`function waitForNetwork(message, epoch) {
 clearTimeout(netTimer);setNetStatus(message);
 netTimer=setTimeout(()=>{if(epoch!==netEpoch)return;const reason=netDiagnostics.reason();failNetAttempt('接続が時間切れになりました。'+reason)},35000);
}
function attachNetConnection(conn) {
 if(netConn&&netConn!==conn){conn.close();return;}
 const epoch=netEpoch;netConn=conn;
 const current=()=>epoch===netEpoch&&netConn===conn;
 const lost=()=>{if(current())failNetAttempt('相手との接続が切れました。');};
 netDiagnostics.newAttempt();netDiagnostics.record('相手','応答あり');
 waitForNetwork('相手を発見 → 対戦通信を接続中…',epoch);
 conn.on('open',()=>{if(!current())return;
  netDiagnostics.record('通信路','open');setNetStatus('通信路が開きました → ゲームの応答を確認中…');
  const hello=()=>{if(current()&&!netConnected)netSend({type:'hello',role:netRole,protocol:44});};
  clearInterval(netHelloTimer);netHelloTimer=setInterval(hello,1000);hello();
 });
 conn.on('data',msg=>{if(!current())return;
  if(msg&&typeof msg==='object'&&['hello','helloAck'].includes(msg.type)){
   if(msg.protocol!==44){failNetAttempt('ゲームの版が異なります。2台ともポータルから開き直してください。');return;}
   if(msg.type==='hello')netSend({type:'helloAck',protocol:44});completeNetHandshake();return;
  }
  if(netConnected)onNetData(msg);
 });
 conn.on('close',lost);conn.on('error',()=>{if(current())failNetAttempt('対戦用の通信路でエラーが発生しました。');});
 netDiagnostics.monitor(conn,current,()=>{if(current())failNetAttempt(netDiagnostics.reason());});
}
`+h.slice(b);
replace("closeNetwork(true);const epoch=netEpoch;netRole=role;netRoom=code;syncOnlineLobby();",`closeNetwork(true);const epoch=netEpoch;netRole=role;netRoom=code;syncOnlineLobby();
 const ua=navigator.userAgent;netDiagnostics.reset(role,{ブラウザ:/Edg/.test(ua)?'Edge':/Chrome|CriOS/.test(ua)?'Chrome':/Firefox|FxiOS/.test(ua)?'Firefox':/Safari/.test(ua)?'Safari':'その他',端末:/iPhone|iPad/.test(ua)?'iOS':/Android/.test(ua)?'Android':'PC等',WebRTC:typeof RTCPeerConnection==='function'?'対応':'非対応',中継:'未設定'});
 document.getElementById('connectionCopyNotice').textContent='';`);
// Avoid speculative gathering before the data channel exists; gather normally per attempt.
h=h.replace('iceCandidatePoolSize:4','iceCandidatePoolSize:0');
replace("clearTimeout(netTimer);if(role==='host')","clearTimeout(netTimer);netDiagnostics.record('サーバー','接続済み');if(role==='host')");
replace("const type=err?.type||'unknown';","const type=err?.type||'unknown';netDiagnostics.record('PeerJSエラー',/^[a-z-]+$/.test(type)?type:'unknown');");
const errorStart=h.indexOf(" peer.on('error',err=>"),errorEnd=h.indexOf(" peer.on('disconnected'",errorStart);
h=h.slice(0,errorStart)+` peer.on('error',err=>{if(!current())return;const type=err?.type||'unknown';netDiagnostics.record('PeerJSエラー',/^[a-z-]+$/.test(type)?type:'unknown');
 if(netConnected&&type==='network'){setNetStatus('接続サーバーとの通信が切れました。対戦通信は継続中。',true);return;}
 const messages={'peer-unavailable':'そのルームが見つかりません。番号と、2台ともv4.4であることを確認してください。','unavailable-id':'部屋番号が重複しました。接続をやり直してください。','network':'接続サーバーに届きません。','browser-incompatible':'このブラウザーは対戦通信に対応していません。','webrtc':'WebRTCの交渉でエラーが発生しました。'};
 failNetAttempt(messages[type]||'接続エラーが発生しました。');
 });
`+h.slice(errorEnd);
replace("peer.on('disconnected',()=>{if(!current())return;","peer.on('disconnected',()=>{if(!current())return;netDiagnostics.record('サーバー','切断');");
replace("document.getElementById('copyRoomCode').addEventListener",`document.getElementById('retryConnection').onclick=()=>{
 if(!netRole||!netRoom){setNetStatus('ルーム作成、または6桁を入力して参加してください。');return;}
 if(netConnected||running){setNetStatus('すでに対戦通信がつながっています。');return;}
 if(netRole==='host'&&netPeer?.open){failNetAttempt('再参加を待っています。');return;}
 const role=netRole,code=netRoom;if(role==='host')createOnlineRoom();else startNetwork(role,code);
};
document.getElementById('copyConnectionReport').onclick=async()=>{
 const box=document.getElementById('connectionReport'),notice=document.getElementById('connectionCopyNotice');
 try{await navigator.clipboard.writeText(box.value);notice.textContent='コピーしました';}catch(e){box.focus();box.select();notice.textContent='診断欄を長押ししてコピーしてください';}
};
document.getElementById('copyRoomCode').addEventListener`);
h=h.replaceAll('aobee-gp-','aobee-gp-v44-').replaceAll('aobee-gp-v44-v43','aobee-gp-v44');
h=h.replaceAll('v4.3','v4.4').replaceAll('v43','v44');
h=h.replace('通信：WebRTC / PeerJS Cloud（STUN強化版）。2台とも同じ公開ページを開いてください。','通信版 v4.4：2台ともポータルから開き直してください。つながらない時は「接続診断」を確認できます。TURN中継は未設定です。');
for(const m of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
fs.writeFileSync(path.join(root,'archive/legacy-20261030/games/aobee_grand_prix_v44_connection_diagnostics.html'),h);
const wrapper=path.join(root,'games/aobee_grand_prix_v41_portal.html');let w=fs.readFileSync(wrapper,'utf8').replace(/aobee_grand_prix_v(?:43_online_vs_icefix|44_connection_diagnostics)\.html\?v=[^"]+/, 'aobee_grand_prix_v44_connection_diagnostics.html?v=v44a');fs.writeFileSync(wrapper,w);
console.log('Built GP v4.4 diagnostics and persistent host room retries.');
