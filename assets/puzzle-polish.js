(() => {
  const screen = document.querySelector('#gameScreen');
  const board = document.querySelector('#board');
  let frame;
  function fit() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!screen.classList.contains('on')) return;
      const css = getComputedStyle(screen);
      let used = parseFloat(css.paddingTop) + parseFloat(css.paddingBottom);
      const children = [...screen.children].filter(el => getComputedStyle(el).display !== 'none');
      for (const child of children) {
        if (child === board) continue;
        const style = getComputedStyle(child);
        used += child.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
      }
      used += Math.max(0, children.length - 1) * parseFloat(css.rowGap) + 4;
      const size = Math.floor(Math.min(520, screen.clientWidth - 20, screen.clientHeight - used));
      board.style.setProperty('--fit-board', Math.max(100, size) + 'px');
    });
  }
  const observer = new ResizeObserver(fit);
  for (const child of screen.children) if (child !== board) observer.observe(child);
  observer.observe(screen);
  new MutationObserver(fit).observe(screen, {attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',fit);
  window.visualViewport?.addEventListener('resize',fit);
  document.querySelector('#msg').setAttribute('role','status');
  document.querySelector('#msg').setAttribute('aria-live','polite');
  fit();
})();
