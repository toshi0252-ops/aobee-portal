(() => {
  'use strict';
  // Resolve from the shared script so nested games and repository paths work.
  const script = document.currentScript;
  const portal = new URL('../index.html#games', script.src);
  const framed = /oshite_aobee|aobee_rhythm_game|aobee_grand_prix/.test(location.pathname);
  if (framed) {
    document.documentElement.classList.add('aobee-portal-framed');
    if (location.pathname.includes('oshite_aobee')) document.documentElement.classList.add('aobee-puzzle');
    const sheet = document.createElement('style');
    sheet.textContent = `
      html.aobee-portal-framed body{padding-top:48px!important;box-sizing:border-box}
      html.aobee-portal-framed body:before{content:'';position:fixed;inset:0 0 auto;height:48px;background:#102b48;z-index:2147483646;pointer-events:none}
      html.aobee-portal-framed #app{height:calc(100dvh - 48px)}
      html.aobee-portal-framed .game{height:calc(100dvh - 48px);min-height:0}
      html.aobee-portal-framed #storyRibbon{top:58px}
      html.aobee-portal-framed .titleScreen .titleArt{height:54%;max-height:54%;object-fit:cover}
      html.aobee-portal-framed .titleControls{position:absolute;left:0;right:0;bottom:8px;padding:0 18px 8px}
      html.aobee-portal-framed .titleControls:before{bottom:8px;height:100%}
      html.aobee-portal-framed .titleControls .diffRow{margin-bottom:10px}
      html.aobee-portal-framed .titleControls .diffBtn{height:54px;min-height:44px;font-size:15px;border-width:3px}
      html.aobee-portal-framed .titleControls .titleStart{height:58px;min-height:44px;font-size:24px}
      html.aobee-portal-framed .titleControls .subBtn{min-height:40px;margin-top:8px}
      html.aobee-portal-framed .titleControls .bestLine{height:22px;margin:5px 0 0;font-size:11px}
    `;
    document.head.append(sheet);
  }
  const host = document.createElement('div');
  host.id = 'aobee-portal-return';
  host.style.cssText = 'all:initial!important;position:fixed!important;top:max(8px,env(safe-area-inset-top))!important;left:50%!important;transform:translateX(-50%)!important;z-index:2147483647!important;display:block!important;width:max-content!important;height:auto!important;';
  const root = host.attachShadow({mode:'open'});
  root.innerHTML = `<style>
    :host{color-scheme:light}
    a{display:flex;align-items:center;gap:6px;min-height:36px;padding:4px 12px;border:1px solid #ffffffb3;border-radius:24px;background:#153456ed;color:#fff;font:700 12px/1.5 "Yu Gothic","Meiryo",sans-serif;text-decoration:none;box-shadow:0 2px 9px #0003;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    a:hover{background:#1267ce}a:focus-visible{outline:3px solid #ffd86a;outline-offset:3px}
    svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  </style><a aria-label="あおびーポータルのゲーム一覧へ戻る"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5-7 7 7 7M2 12h20"/></svg>ポータルへ</a>`;
  root.querySelector('a').href = portal.href;
  // Keep taps on the navigation link out of the games' document handlers.
  for (const type of ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','click','keydown','keyup']) {
    host.addEventListener(type, event => event.stopPropagation());
  }
  document.body.append(host);
})();
