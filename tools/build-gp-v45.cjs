const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.resolve(__dirname,'..');
let diagnostics=fs.readFileSync(path.join(root,'assets/gp-connection-diagnostics.js'),'utf8').replace('AOBEE GP v4.4','AOBEE GP v4.5');
diagnostics=diagnostics.replace("if(states['交渉'])return",`if(states['交渉']==='stable'&&states.ICE==='new')return '接続条件の交換後、通信経路の確認が始まりませんでした。候補の送受信・適用結果を確認してください。';
   if(states['交渉'])return`);
diagnostics=diagnostics.replace("const tracked=pc;",`const tracked=pc;
     if(typeof tracked.addIceCandidate==='function'){
      const original=tracked.addIceCandidate;let applied=0;
      const wrapped=function(candidate){return Promise.resolve().then(()=>original.call(tracked,candidate)).then(value=>{if(active&&isCurrent())record('相手候補の適用成功',++applied);return value;},error=>{if(active&&isCurrent())record('相手候補の適用エラー',/^[A-Za-z]+Error$/.test(error?.name)?error.name:'不明');throw error;});};
      tracked.addIceCandidate=wrapped;cleanups.push(()=>{if(tracked.addIceCandidate===wrapped)tracked.addIceCandidate=original;});
     }
`);
fs.writeFileSync(path.join(root,'assets/gp-connection-diagnostics-v45.js'),diagnostics);
let h=fs.readFileSync(path.join(root,'archive/legacy-20261030/games/aobee_grand_prix_v44_connection_diagnostics.html'),'utf8');
function change(a,b){if(!h.includes(a))throw Error('Missing '+a);h=h.replace(a,b);}
change('<script src="../assets/gp-connection-diagnostics.js?v=44a"></script>','<script src="../assets/gp-connection-diagnostics-v45.js?v=45"></script><script src="../assets/gp-ice-signaling.js?v=45"></script>');
change('let netEpoch = 0, netTimer = 0, netHelloTimer = 0;','let netEpoch = 0, netTimer = 0, netHelloTimer = 0, stopIceSignaling=()=>{};');
change('netEpoch++; stopNetTimers();','netEpoch++; stopNetTimers();stopIceSignaling();stopIceSignaling=()=>{};');
change('const current=()=>epoch===netEpoch&&netPeer===peer;', 'const current=()=>epoch===netEpoch&&netPeer===peer;stopIceSignaling=GPIceSignaling.install(peer,netDiagnostics,current);');
h=h.replaceAll('v4.4','v4.5').replaceAll('v44','v45').replaceAll('protocol:44','protocol:45').replaceAll('msg.protocol!==44','msg.protocol!==45');
for(const m of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
fs.writeFileSync(path.join(root,'archive/legacy-20261030/games/aobee_grand_prix_v45_ice_exchange.html'),h);
const wrapper=path.join(root,'games/aobee_grand_prix_v41_portal.html');let w=fs.readFileSync(wrapper,'utf8').replace(/aobee_grand_prix_v(?:44_connection_diagnostics|45_ice_exchange)\.html\?v=[^"]+/, 'aobee_grand_prix_v45_ice_exchange.html?v=v45');fs.writeFileSync(wrapper,w);
console.log('Built v4.5: bounded gathered-SDP signaling and candidate exchange diagnostics.');
