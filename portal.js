const games=[
 ['あおびーの冒険','冒険へ、\n出発！','アクション','あおびーと冒険の世界へ。','aobee_adventure_v537_item_throw.html','#438fe8','#84d5fa'],
 ['あおびー牧場','のんびり\n牧場時間','くらし','あおびーの牧場で、自分のペースで遊ぼう。','aobee_farm_v48_soil_water.html','#3a967b','#a2df9b'],
 ['あおびー RPG','星を忘れた\n世界へ','RPG','星と記憶をめぐる、あおびーたちの物語。','rpg/index.html','#5058a4','#aba4df'],
 ['あおびー GRAND PRIX','走り出せ、\nグランプリ！','レース','あおびーとレースに挑戦しよう。','aobee_grand_prix_reboot_v29_visual_polish.html','#ed8451','#ffd38a'],
 ['AOBEE MIX POWER','MIX\nPOWER!','バラエティ','あおびーのMIX POWERを楽しもう。','AOBEE_MIX_POWER_v2.32_4GAUGE.html','#bb65b4','#f2abd5'],
 ['あおびーの雑学クイズ！','ひらめきの\n時間！','クイズ','雑学クイズで、知っていることも新しい発見も。','aobee_quiz_v126_timer_gauge_motion_fix.html','#c19333','#f7d97e'],
 ['あおびーのリズムパーティ！','音にのって、\nパーティ！','リズム','あおびーとリズムを楽しもう。','aobee_rhythm_game_v300_complete.html','#bb63a8','#f5a5c1'],
 ['あおびー STAR SHOOTER','STAR\nSHOOTER','シューティング','星の世界でシューティングに挑戦。','aobee_shooter_v18_star_rush.html','#3b579a','#8e9fe6'],
 ['あおびーの星守り','星を守る\nあおびー','バラエティ','STAR GUARDの世界へ出かけよう。','aobee_star_guard_v1_complete.html','#437898','#95cddb'],
 ['走れ！あおびー','走れ！\nあおびー','アクション','あおびーと一緒に、走り出そう。','hashire_aobee_v3.2.html','#378daa','#86d9d5'],
 ['押して！あおびー','じっくり、\nひと押し。','パズル','考えながら遊ぶ、あおびーのパズル。','oshite_aobee_superhard_reina_v15_hint.html','#7f80b2','#beb5e4']
].map((g,i)=>({name:g[0],cover:g[1],category:g[2],description:g[3],url:'games/'+g[4],color:g[5],light:g[6],number:i+1}));
let selected='すべて';const filters=document.querySelector('#filters'),list=document.querySelector('#game-list'),search=document.querySelector('#search');
for(const category of ['すべて',...new Set(games.map(g=>g.category))]){const button=document.createElement('button');button.textContent=category;button.type='button';button.setAttribute('aria-pressed',String(category===selected));button.onclick=()=>{selected=category;for(const b of filters.children)b.setAttribute('aria-pressed',String(b===button));render()};filters.append(button)}
function render(){const term=search.value.trim().toLocaleLowerCase();const visible=games.filter(g=>(selected==='すべて'||selected===g.category)&&(g.name+' '+g.category).toLocaleLowerCase().includes(term));list.replaceChildren();for(const g of visible){const card=document.createElement('a');card.className='card';card.href=g.url;card.target='_blank';card.rel='noopener';card.setAttribute('aria-label',g.name+'を遊ぶ（別タブで開きます）');card.style.setProperty('--color',g.color);card.style.setProperty('--light',g.light);card.innerHTML=`<div class="cover"><span class="number">${String(g.number).padStart(2,'0')} / AOBEE</span><b>${g.cover}</b><img src="assets/aobee.png" alt="" loading="lazy"></div><div class="body"><span class="tag">${g.category}</span><h3>${g.name}</h3><p>${g.description}</p><div class="play">あそぶ ↗ <small>別タブで開く</small></div></div>`;list.append(card)}document.querySelector('#count').textContent=`${visible.length} / ${games.length} 作品`;document.querySelector('#empty').hidden=visible.length!==0}
search.addEventListener('input',render);render();
