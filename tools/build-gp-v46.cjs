const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.resolve(__dirname,'..');
let h=fs.readFileSync(path.join(root,'archive/legacy-20261030/games/aobee_grand_prix_v45_ice_exchange.html'),'utf8');
function change(a,b){if(!h.includes(a))throw Error('Missing '+a.slice(0,70));h=h.replace(a,b);}
change('<script src="../assets/gp-connection-diagnostics-v45.js?v=45"></script>','<script src="../assets/gp-turn-client.js?v=46"></script><script src="../assets/gp-connection-diagnostics-v46.js?v=46"></script>');
change('function startNetwork(role,code) {','async function startNetwork(role,code) {');
change("中継:'未設定'","中継:'Cloudflare・中継専用'");
change(" waitForNetwork('① 接続サーバーへ接続中…',epoch);",` setNetStatus('中継接続の認証を確認中…');
 let relayConfig;
 try{relayConfig=await GPRaceTurn.prepare(message=>{if(epoch===netEpoch)setNetStatus(message);});}
 catch(error){if(epoch!==netEpoch)return;failNetAttempt(error?.message||'中継接続を準備できませんでした。');return;}
 if(epoch!==netEpoch)return;
 netDiagnostics.record('中継認証','取得済み（期限付き）');
 waitForNetwork('① 接続サーバーへ接続中…',epoch);`);
const configStart=h.indexOf('  config:{',h.indexOf('async function startNetwork')),configEnd=h.indexOf('\n});netPeer=peer;',configStart);
if(configStart<0||configEnd<0)throw Error('Missing peer configuration');h=h.slice(0,configStart)+'  config:relayConfig'+h.slice(configEnd);
change('netEpoch++; stopNetTimers();','netEpoch++; GPRaceTurn.cancel();stopNetTimers();');
change('TURN中継は未設定です。','Cloudflareの中継で接続します。');
h=h.replaceAll('v4.5','v4.6').replaceAll('v45','v46').replaceAll('protocol:45','protocol:46').replaceAll('msg.protocol!==45','msg.protocol!==46');
for(const m of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
fs.writeFileSync(path.join(root,'archive/legacy-20261030/games/aobee_grand_prix_v46_turn_relay.html'),h);
let d=fs.readFileSync(path.join(root,'assets/gp-connection-diagnostics-v45.js'),'utf8').replaceAll('v4.5','v4.6');
d=d.replace("record('選択経路','確立済み')","record('選択経路',((stats.get?.(s.localCandidateId)?.candidateType==='relay')?'relay（中継）':'確立済み'))");
fs.writeFileSync(path.join(root,'assets/gp-connection-diagnostics-v46.js'),d);
const wrapper=path.join(root,'games/aobee_grand_prix_v41_portal.html');let w=fs.readFileSync(wrapper,'utf8').replace(/aobee_grand_prix_v(?:45_ice_exchange|46_turn_relay)\.html\?v=[^"]+/, 'aobee_grand_prix_v46_turn_relay.html?v=v46');fs.writeFileSync(wrapper,w);
console.log('Built GP v4.6: verified short-lived Cloudflare TURN credentials, relay-only ICE.');
