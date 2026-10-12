(() => {
  const app=document.querySelector('#app'),game=app.querySelector('.game');
  let frame;
  function fit(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
    let used=14;
    for(const el of app.children){if(el===game||getComputedStyle(el).display==='none')continue;const style=getComputedStyle(el);used+=el.getBoundingClientRect().height+parseFloat(style.marginTop)+parseFloat(style.marginBottom)}
    const height=Math.max(180,Math.floor(Math.min(innerHeight-48-used,(app.clientWidth-110)*2)));
    app.style.setProperty('--mix-height',height+'px');
  })}
  new ResizeObserver(fit).observe(app);
  for(const el of app.children)if(el!==game)new ResizeObserver(fit).observe(el);
  window.addEventListener('resize',fit);fit();
  const labels={left:'左へ移動',right:'右へ移動',down:'一段下へ',cw:'右回転',ccw:'左回転',drop:'一気に落とす'};
  for(const button of app.querySelectorAll('[data-act]'))if(labels[button.dataset.act])button.setAttribute('aria-label',labels[button.dataset.act]);
})();
