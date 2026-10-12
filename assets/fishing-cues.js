(() => {
  'use strict';
  window.AobeeFishingCue = ({state,charging=false,charge=0,phase='',reeling=false,mode='classic',outcome=''}) => {
    if(outcome==='failed')return {button:'次のキャストを待つ',hint:'逃げられた… 次のチャンスに備えよう。',kind:'wait',disabled:true};
    if(state==='aim')return charging
      ? {button:`離して投げる · ${Math.round(charge)}%`,hint:mode==='hunt'?'約68%で離すと、PERFECT CASTを狙える！':'遠くへ投げたいときは、長めにためよう。',kind:'charge',disabled:false}
      : {button:'長押しでキャスト',hint:mode==='hunt'?'水中をタップして狙いを決め、キャストを長押し。':'左右で立ち位置を合わせ、キャストを長押し。',kind:'cast',disabled:false};
    if(state==='cast')return {button:'食いつきを待つ…',hint:'魚が餌を調べているよ。HITまで待とう。',kind:'wait',disabled:true};
    if(state==='fight'){
      const pulling=['pull','fake','left','right'].includes(phase);
      if(pulling){
        const direction=mode==='hunt'&&phase==='left'?'right':mode==='hunt'&&phase==='right'?'left':'';
        return {button:'離して！',hint:direction==='right'?'魚が左へ！ 巻く手を離し、右ボタンでいなそう。':direction==='left'?'魚が右へ！ 巻く手を離し、左ボタンでいなそう。':'魚が引いている！ ボタンを離して耐えよう。',kind:'release',disabled:false,direction};
      }
      return {button:reeling?'巻いてる！':'今だ、長押しで巻く！',hint:'引きが弱まった！ キャストボタンを長押しして巻こう。',kind:'reel',disabled:false};
    }
    if(state==='result')return {button:'釣り上げた！',hint:'結果画面から、次の釣りへ進めるよ。',kind:'success',disabled:true};
    return {button:'長押しでキャスト',hint:'操作モードはタイトル画面から切り替えられます。',kind:'menu',disabled:false};
  };
})();
