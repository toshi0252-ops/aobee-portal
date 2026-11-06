(() => {
  'use strict';
  // 三者連携実験・試作 v0.1（釣り idle のみ公式デザイン化）
  // 本体 HTML は無改造。setAobee('idle') の時だけ公式 atlas の正面ポーズへ差し替え、
  // cast を含む他状態は元の処理へそのまま委譲する。
  // 公式素材の事前ロードに失敗した場合は捕捉自体を行わず、従来表示のままにする（フォールバック）。
  if (window.__fishingIdleTrial) return;
  window.__fishingIdleTrial = '1';

  const base = new URL('.', document.currentScript.src);
  const ATLAS_URL = new URL('characters/aobee-atlas-v1.png', base).href;

  function cropFrontPose(atlas) {
    // 公式 atlas は 4x2。front = index 0（1行1列）。character-identity.js と同じ 384x384 へ切り出す。
    const cw = atlas.naturalWidth / 4, ch = atlas.naturalHeight / 2;
    const c = document.createElement('canvas');
    c.width = 384; c.height = 384;
    c.getContext('2d').drawImage(atlas, 0, 0, cw, ch, 0, 0, 384, 384);
    return c.toDataURL('image/png');
  }

  const frontURLPromise = new Promise((resolve, reject) => {
    const atlas = new Image();
    atlas.onload = () => { try { resolve(cropFrontPose(atlas)); } catch (e) { reject(e); } };
    atlas.onerror = reject;
    atlas.src = ATLAS_URL;
  });
  // 失敗時は無介入でよいが、未処理の rejection を残さない
  frontURLPromise.catch(() => {});

  function install(win, frontURL) {
    let doc;
    try { doc = win.document; } catch (e) { return; }
    if (!doc || !doc.documentElement) return;
    if (doc.documentElement.dataset.fishingIdleTrial === '1') return;

    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (tries > 100) { clearInterval(timer); return; } // 約5秒で諦める（無介入＝従来表示）
      let orig;
      try { orig = win.setAobee; } catch (e) { clearInterval(timer); return; }
      if (typeof orig !== 'function') return;
      const sprite = doc.getElementById('aobeeGameSprite');
      if (!sprite) return;
      clearInterval(timer);
      doc.documentElement.dataset.fishingIdleTrial = '1';

      win.setAobee = function (k) {
        if (k === 'idle') {
          const img = doc.getElementById('aobeeGameSprite');
          if (img) { img.src = frontURL; return; }
        }
        return orig.apply(this, arguments);
      };
      // 初期表示（aim/idle で従来画像が表示済みのはず）を公式ポーズへ差し替える
      sprite.src = frontURL;
    }, 50);
  }

  function bind() {
    const frame = document.getElementById('gameFrame');
    if (!frame) return;
    const attach = () => {
      frontURLPromise.then(frontURL => {
        try { install(frame.contentWindow, frontURL); } catch (e) { /* 無介入 */ }
      }).catch(() => { /* 素材ロード失敗時は捕捉しない */ });
    };
    frame.addEventListener('load', attach);
    attach();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
