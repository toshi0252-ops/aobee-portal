/* PeerJS 1.5.5 compatibility layer. Candidate addresses stay in signaling only. */
(function(root){
 'use strict';
 function install(peer,diagnostics,isCurrent){
  const socket=peer.socket,original=socket.send,pending=new Map(),counts=new Map();let active=true;
  function count(direction,message){const type=message?.type;if(!['OFFER','ANSWER','CANDIDATE'].includes(type))return;
   const id=message.payload?.connectionId;if(!id)return;
   let c=counts.get(id);if(!c){c={};counts.set(id,c);if(counts.size>8)counts.delete(counts.keys().next().value);}
   const key=direction+' '+type;c[key]=(c[key]||0)+1;diagnostics.record(key,c[key]);
   if(type!=='CANDIDATE'){const n=(message.payload?.sdp?.sdp?.match(/^a=candidate:/gm)||[]).length;diagnostics.record(direction+' SDP内の候補',n);}
  }
  function transmit(message){if(!active||!isCurrent())return;count('送信',message);return original.call(socket,message);}
  function wrapped(message){
   if(!active||!isCurrent())return;
   const id=message?.payload?.connectionId,type=message?.type;
   if(type==='CANDIDATE'&&pending.has(id)){pending.get(id).candidates.push(message);return;}
   if(!['OFFER','ANSWER'].includes(type)||!id)return transmit(message);
   const conn=peer.getConnection(message.dst,id),pc=conn?.peerConnection;
   if(!pc)return transmit(message);
   if(pc.iceGatheringState==='complete'){
    const d=pc.localDescription;return transmit(d?.type===message.payload.sdp?.type?{...message,payload:{...message.payload,sdp:{type:d.type,sdp:d.sdp}}}:message);
   }
   const old=pending.get(id);if(old)old.cancel();
   const entry={candidates:[],timer:null,cancel:null};
   const detach=()=>{clearTimeout(entry.timer);pc.removeEventListener('icegatheringstatechange',changed);pending.delete(id);};
   function flush(){if(pending.get(id)!==entry)return;detach();if(!active||!isCurrent()||pc.signalingState==='closed')return;
    const description=pc.localDescription;
    const packet=description?.type===message.payload.sdp?.type?{...message,payload:{...message.payload,sdp:{type:description.type,sdp:description.sdp}}}:message;
    transmit(packet);for(const candidate of entry.candidates)transmit(candidate);
   }
   function changed(){if(pc.signalingState==='closed'){entry.cancel();return;}if(pc.iceGatheringState==='complete')flush();}
   entry.cancel=detach;pending.set(id,entry);pc.addEventListener('icegatheringstatechange',changed);
   entry.timer=setTimeout(flush,5000);
   diagnostics.record('候補を含む接続情報','収集中（最大5秒）');
  }
  function received(message){if(active&&isCurrent())count('受信',message);}
  socket.send=wrapped;socket.on('message',received);diagnostics.record('候補交換の計測','有効');
  return ()=>{if(!active)return;active=false;for(const entry of [...pending.values()])entry.cancel();counts.clear();if(socket.send===wrapped)socket.send=original;socket.removeListener('message',received);};
 }
 if(typeof module==='object'&&module.exports)module.exports={install};else root.GPIceSignaling={install};
})(typeof window==='undefined'?{}:window);
