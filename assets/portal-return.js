(() => {
  'use strict';
  // Resolve from the shared script so nested games and repository paths work.
  const script = document.currentScript;
  const portal = new URL('../index.html#games', script.src);
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
