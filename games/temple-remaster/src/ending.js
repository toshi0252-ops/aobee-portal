/* The ending reel is presentation only. The completed game is saved before it opens. */
var TempleEnding=(()=>{
 const entries=[
  {name:'ほしの村',title:'灯りが帰った日',art:'homecoming',color:'#d7aa71',text:()=> '星が砕けた夜から始まった旅。小さな灯りが、もう一度人々の顔を照らす。'},
  {name:'深緑の森',title:'根から芽吹く明日',art:'forestRestored',color:'#90c5a4',text:()=>TempleChapter2.getState().leafHelped?'水を取り戻した苗木は、森の守り手たちとともに新しい葉を広げた。':'根の光路が戻り、森の守り手たちがゆっくりと木々を育てていく。'},
  {name:'星を映さぬ港',title:'帰る場所を照らす光',art:'harborRescue',color:'#9bdef0',text:()=>TempleChapter3.getState().toolsReturned?'修理を終えた船が、航路灯に導かれて次の航海へ出ていく。':'帰還した船は、明日の海へ向かう準備を始めた。航路灯はもう消えない。'},
  {name:'消された島',title:'忘れないための約束',art:'templeChart',color:'#d5bce6',text:()=>TempleChapter4.getState().clockFixed?'動き出した時計の針とともに、島の人々は自分たちの記録を残していく。':'島で見つけた名札と記録は、持ち主と未来へ返されていく。'},
  {name:'星の神殿',title:'ひとりでは守れない光',art:'lightRestored',color:'#ffd992',text:()=> '四つの星門を結び、分かれていた光が空へ戻る。守護星は再び輝いた。'},
  {name:'星灯りの祭り',title:'また、冒険で会おう',art:'grandFestival',color:'#ffdda0',text:()=> 'あおびー、ミオ、わるびー。三人の旅はここで一区切り。でも、世界にはまだ見つけていない宝物がある。'}
 ];
 let index=0,opened=false;
 const panel=document.createElement('div');panel.id='endingReel';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','endingReelTitle');
 panel.innerHTML='<div class="ending-stage"><img id="endingReelArt" alt=""><div class="ending-vignette"></div><div class="ending-top"><span>星の神殿・旅の記憶</span><span id="endingReelCount"></span></div><div class="ending-card"><small id="endingReelPlace"></small><h2 id="endingReelTitle"></h2><p id="endingReelText"></p><p id="endingReelCredit" hidden>あおびーゲームス　企画・制作：とし<br>制作協力：葵・玲奈・MUSE</p><div class="ending-buttons"><button id="endingReelPrev" type="button">前へ</button><button id="endingReelNext" type="button">次へ</button><button id="endingReelSkip" type="button">クリア記録へ</button></div></div><div class="ending-stars" aria-hidden="true"></div></div>';
 document.body.appendChild(panel);
 const style=document.createElement('style');style.textContent=`
 #endingReel[hidden]{display:none!important}#endingReel{position:fixed;inset:0;z-index:90;background:#101e32;display:grid;place-items:center;color:#fff5dc}
 #endingReel .ending-stage{position:relative;width:100%;height:100%;overflow:hidden;isolation:isolate;background:radial-gradient(ellipse at 50% 15%,var(--ending-color,#d6b575) 0%,#243b53 40%,#101e32 95%)}
 #endingReelArt{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .6s ease}
 #endingReelArt.loaded{opacity:1}#endingReel .ending-vignette{position:absolute;inset:0;background:linear-gradient(180deg,#07142588,transparent 25%,transparent 40%,#071425e8 100%);pointer-events:none}
 #endingReel .ending-top{position:absolute;left:max(18px,env(safe-area-inset-left));right:max(18px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));display:flex;justify-content:space-between;font-size:14px;font-weight:700;letter-spacing:.08em;text-shadow:0 2px 6px #000}
 #endingReel .ending-card{position:absolute;z-index:2;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(740px,94vw);padding:12px 20px 10px;text-align:center;background:linear-gradient(transparent,#0d2035e6 22%);border-top:1px solid var(--ending-color,#d6b575);border-radius:12px;max-height:65vh;overflow:auto}
 #endingReel small{display:block;color:var(--ending-color,#d6b575);font-size:14px;letter-spacing:.22em}#endingReel h2{font-size:clamp(21px,4.2vw,34px);margin:5px 0 7px;color:#fff2d5;text-shadow:0 2px 8px #070e20}#endingReel p{font-size:clamp(14px,2.3vw,17px);line-height:1.65;margin:3px 0 10px}#endingReelCredit{color:#ead4a3;font-size:13px!important;line-height:1.45!important}
 #endingReel .ending-buttons{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}#endingReel button{min-height:44px;min-width:84px;padding:8px 16px;border:1px solid #dbc18b;border-radius:8px;background:#223b52;color:#fff1ca;font-weight:700;font-size:14px}#endingReel button:disabled{opacity:.45}#endingReelNext{background:#f2d99a!important;color:#213448!important}
 #endingReel .ending-stars{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(circle,#fff1b6 0 1px,transparent 2px),radial-gradient(circle,#bce7ff 0 1px,transparent 2px);background-size:133px 103px,181px 167px;opacity:.45;animation:ending-stars 9s linear infinite}
 @keyframes ending-stars{to{background-position:0 -103px,0 -167px}}
 @media(max-height:420px){#endingReel .ending-card{padding:6px 12px;max-height:72vh}#endingReel h2{margin:2px 0 4px}#endingReel p{margin:2px 0 5px}#endingReelCredit{font-size:12px!important}}
 @media(prefers-reduced-motion:reduce){#endingReelArt{transition:none}#endingReel .ending-stars{animation:none}}
 .journey-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:12px 0}.journey-stat{background:#182e40;border:1px solid #a9b28c55;border-radius:8px;padding:10px 6px;font-size:12px;color:#c5d5db}.journey-stat b{display:block;color:#ffe3a4;font-size:19px;margin-bottom:3px;font-variant-numeric:tabular-nums}
 `;document.head.appendChild(style);
 const record=$('journeyClear'),stats=document.createElement('div');stats.className='journey-stats';stats.setAttribute('aria-label','冒険の達成記録');$('journeySummary').after(stats);
 const replay=document.createElement('button');replay.type='button';replay.className='sub';replay.id='endingReelReplay';replay.textContent='旅の思い出をもう一度見る';$('journeyExplore').after(replay);
 function updateStats(){
  const counts=[['星巡りメダル',TempleCollections.count()+'/20'],['ハートのかけら',TempleAdventure.getState().hearts.length+'/20'],['遺跡の道具',[1,2,3,4,5].filter(n=>TempleFields.hasTool(n)).length+'/5'],['訪れた場所',String(TempleChronicle.getState().visited.length)]];
  stats.replaceChildren();for(const [label,value]of counts){const el=document.createElement('div'),num=document.createElement('b');el.className='journey-stat';num.textContent=value;el.append(num,document.createTextNode(label));stats.appendChild(el);}
 }
 function render(){
  const item=entries[index],art=templeEventArt[item.art],image=$('endingReelArt');
  panel.style.setProperty('--ending-color',item.color);$('endingReelCount').textContent=(index+1)+' / '+entries.length;
  $('endingReelPlace').textContent=item.name;$('endingReelTitle').textContent=item.title;$('endingReelText').textContent=item.text();
  $('endingReelCredit').hidden=index!==entries.length-1;$('endingReelPrev').disabled=index===0;$('endingReelNext').textContent=index===entries.length-1?'クリア記録へ':'次へ';$('endingReelSkip').hidden=index===entries.length-1;
  image.classList.remove('loaded');image.alt=art?.alt||'';const load=()=>{if(opened&&entries[index]===item&&image.naturalWidth>0)image.classList.add('loaded')};image.onload=load;image.onerror=()=>image.classList.remove('loaded');if(art){image.src=art.src;if(image.complete)requestAnimationFrame(load);}
 }
 function finish(){if(!opened)return;opened=false;panel.hidden=true;record.hidden=false;updateStats();$('journeyExplore').focus();}
 function play(){if(!TempleChapter5.getState().completed)return;index=0;opened=true;chapterClearOpen=true;clearStick();record.hidden=true;panel.hidden=false;render();$('endingReelNext').focus();}
 function next(){if(!opened)return;if(index===entries.length-1){finish();return;}index++;render();}
 $('endingReelNext').onclick=next;$('endingReelPrev').onclick=()=>{if(opened&&index>0){index--;render()}};$('endingReelSkip').onclick=finish;replay.onclick=play;
 document.addEventListener('keydown',e=>{if(!opened)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish();}else if(e.key==='ArrowRight'){e.preventDefault();e.stopImmediatePropagation();next();}else if(e.key==='ArrowLeft'){e.preventDefault();e.stopImmediatePropagation();$('endingReelPrev').click();}else if(e.key==='Tab'){e.preventDefault();e.stopImmediatePropagation();const list=[$('endingReelPrev'),$('endingReelNext'),$('endingReelSkip')].filter(b=>!b.disabled),i=list.indexOf(document.activeElement);list[(i+(e.shiftKey?-1:1)+list.length)%list.length].focus();}},true);
 // Replay participates in the existing record's keyboard focus loop.
 document.addEventListener('keydown',e=>{if(record.hidden||e.key!=='Tab')return;e.preventDefault();e.stopImmediatePropagation();const list=[$('journeyExplore'),replay,$('journeyTitle')],i=list.indexOf(document.activeElement);list[(i+(e.shiftKey?-1:1)+list.length)%list.length].focus();},true);
 return {play,updateStats,finish};
})();
