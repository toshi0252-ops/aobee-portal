(function(root){
 'use strict';
 const ENDPOINT='https://aobee-gp-turn.toshi0252.workers.dev/ice',SITEKEY='0x4AAAAAAFXC8TQbBDlUAtbI';
 function create({getToken,fetcher=fetch,now=()=>Date.now()}){
  let cached=null,controller=null;
  return {
   async prepare(onStatus=()=>{}){
    if(cached&&cached.expiresAt>now()+600000)return cached.config;
    onStatus('接続を確認しています…');const token=await getToken(onStatus);
    onStatus('中継サーバーへの接続を準備しています…');
    const current=new AbortController();controller=current;const timer=setTimeout(()=>current.abort(),10000);
    try{
     const response=await fetcher(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({turnstileToken:token}),credentials:'omit',cache:'no-store',signal:current.signal});
     if(!response.ok)throw Error(response.status===429?'接続の再試行が続いています。1分ほど待ってください。':'中継の認証を確認できませんでした（'+response.status+'）。');
     const data=await response.json();
     if(!Array.isArray(data.iceServers)||!data.iceServers.some(s=>(Array.isArray(s.urls)?s.urls:[s.urls]).some(u=>typeof u==='string'&&/^turns?:/.test(u))&&s.username&&s.credential))throw Error('中継の接続情報を取得できませんでした。');
     const ttl=Number(data.expiresIn);if(!Number.isFinite(ttl)||ttl<600||ttl>3600)throw Error('中継の有効期限を確認できませんでした。');
     const config={iceServers:data.iceServers,iceTransportPolicy:'relay',iceCandidatePoolSize:0};cached={config,expiresAt:now()+ttl*1000};return config;
    }finally{clearTimeout(timer);if(controller===current)controller=null;}
   },
   cancel(){controller?.abort();controller=null;}
  };
 }
 if(typeof module==='object'&&module.exports){module.exports={create};return;}
 let scriptPromise=null,cancelWidget=()=>{};
 function loadTurnstile(){
  if(root.turnstile)return Promise.resolve();
  if(!scriptPromise)scriptPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
   const timer=setTimeout(()=>reject(Error('接続確認の読み込みが時間切れになりました。')),15000);
   script.onload=()=>{clearTimeout(timer);if(root.turnstile)resolve();else reject(Error('接続確認を読み込めませんでした。'));};script.onerror=()=>{clearTimeout(timer);reject(Error('接続確認を読み込めませんでした。'));};document.head.append(script);
  }).catch(error=>{scriptPromise=null;throw error;});return scriptPromise;
 }
 function getToken(onStatus){
  return new Promise((resolve,reject)=>{
   let done=false,widget=null,box=null;
   const finish=(error,token)=>{if(done)return;done=true;clearTimeout(timer);if(widget!==null)try{root.turnstile.remove(widget)}catch(e){}box?.remove();cancelWidget=()=>{};if(error)reject(error);else resolve(token);};
   const timer=setTimeout(()=>finish(Error('接続確認が時間切れになりました。再度お試しください。')),60000);
   cancelWidget=()=>finish(Error('接続を取り消しました。'));
   loadTurnstile().then(()=>{if(done)return;box=document.createElement('div');box.style.cssText='display:flex;justify-content:center;max-width:100%;margin:8px 0';document.getElementById('onlineStatus').before(box);
    onStatus('接続を確認しています。確認画面が出た場合は操作してください。');
    widget=root.turnstile.render(box,{sitekey:SITEKEY,action:'gp-turn',appearance:'interaction-only',callback:token=>finish(null,token),'error-callback':()=>finish(Error('接続確認に失敗しました。ページを開き直してください。')),'expired-callback':()=>finish(Error('接続確認の期限が切れました。再度お試しください。'))});
   }).catch(error=>finish(error));
  });
 }
 const client=create({getToken});root.GPRaceTurn={prepare:status=>client.prepare(status),cancel(){cancelWidget();client.cancel();}};
})(typeof window==='undefined'?{}:window);
