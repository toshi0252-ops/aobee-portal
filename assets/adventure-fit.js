(() => {
 const game=document.querySelector('#game'),board=document.querySelector('#board');let frame;
 function fit(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
  if(!game.classList.contains('on'))return;
  const css=getComputedStyle(game),children=[...game.children].filter(el=>getComputedStyle(el).display!=='none'&&getComputedStyle(el).position!=='absolute');
  let used=parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)+(children.length-1)*parseFloat(css.rowGap);
  for(const child of children){if(child===board)continue;const s=getComputedStyle(child);used+=child.getBoundingClientRect().height+parseFloat(s.marginTop)+parseFloat(s.marginBottom)}
  board.style.setProperty('--adventure-board',Math.max(120,Math.floor(Math.min(game.clientWidth-12,game.clientHeight-used-4)))+'px');
 })}
 const observer=new ResizeObserver(fit);observer.observe(game);for(const child of game.children)if(child!==board)observer.observe(child);
 new MutationObserver(fit).observe(game,{attributes:true,attributeFilter:['class']});window.addEventListener('resize',fit);fit();
})();
