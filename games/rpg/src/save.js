(function (root) {
  'use strict';
  const VERSION = 3;
  const postgame=typeof module!=='undefined'&&module.exports?require('./postgame.js'):root.AobeePostgame;
  const battleCore=typeof module!=='undefined'&&module.exports?require('./battle-core.js'):root.AobeeBattleCore;
  const finale=typeof module!=='undefined'&&module.exports?require('./chapter1-finale.js'):root.AobeeFinale;
  const adventure=typeof module!=='undefined'&&module.exports?require('./adventure.js'):root.AobeeAdventure;
  const chapter2=typeof module!=='undefined'&&module.exports?require('./chapter2.js'):root.AobeeChapter2;
  const chapter3=typeof module!=='undefined'&&module.exports?require('./chapter3.js'):root.AobeeChapter3;
  const chapter4=typeof module!=='undefined'&&module.exports?require('./chapter4.js'):root.AobeeChapter4;
  const chapter5=typeof module!=='undefined'&&module.exports?require('./chapter5.js'):root.AobeeChapter5;
  const chapter6=typeof module!=='undefined'&&module.exports?require('./chapter6.js'):root.AobeeChapter6;
  const PREFIX = 'aobee-rpg:slot:';
  const clone = value => JSON.parse(JSON.stringify(value));
  function createState() {
    return { version: VERSION, mapId: 'hoshi-village', position: { x: 13, y: 12, direction: 'down' },
      party: ['aobee'], characters: { aobee: { level: 1, xp: 0, hp: 36, mp: 12, equipment: {ribbon:'gearRibbon'} } },
      encounter: { remaining:32, seed:Math.floor(Math.random()*4294967296) }, gear: [], sidequests: {}, inventory: {}, keyItems: [], events: {}, chests: [], choices: {},
      settings: { controls: 'stick', fontSize: 18, textSpeed: 30, battleSpeed: 1, bgm: 0.35, se: 0.5 } };
  }
  function migrate(data) {
    if (!data || typeof data !== 'object' || ![1,2,VERSION].includes(data.version)) throw new Error('未対応のセーブ形式です。元データは保持されています。');
    data=clone(data);if(data.version===1&&data.events)data.events.prologueStage=data.events.prologueStage||'morning';data.version=VERSION;
    if(data.events?.prologueStage&&!['morning','search','sunset','night','missing','elder','depart','complete'].includes(data.events.prologueStage))throw new Error('物語の進行が破損しています。');
    if(data.events?.cinematic){const c=data.events.cinematic,limits={sunset:11,night:8,morning:3,farewell:3,forest:3,bird:5,songTrail:3,leafyMeet:6,mocoApproach:3,forestRest:5,deer:4,leafBed:2,deerSong:6,springEcho:6,stonePath:3,springRest:3};const chapterScenes={bird:['memory-woods','bird'],songTrail:['memory-woods','trail'],leafyMeet:['memory-woods','leafy'],mocoApproach:['memory-woods','battle'],forestRest:['memory-woods','cleared'],deer:['deer-hollow','deer'],leafBed:['deer-hollow','soothe'],deerSong:['deer-hollow','soothe'],springEcho:['memory-spring','spring'],stonePath:['memory-spring','stones'],springRest:['memory-spring','shrineTrail']};const sceneMaps={sunset:'sunset-hill',night:'lumina-home',morning:'hoshi-village',farewell:'hoshi-village',forest:'memory-woods'},sceneStages={sunset:'sunset',night:'night',morning:'missing',farewell:'depart',forest:'complete'};for(const [id,[map,stage,count]] of Object.entries(finale.sceneSpecs)){chapterScenes[id]=[map,stage];limits[id]=count;}for(const [id,[map,stage,count]]of Object.entries(postgame.sceneSpecs)){limits[id]=count;sceneMaps[id]=map;sceneStages[id]=stage;if(c.id===id&&!data.events.gameClear)throw Error('クリア後の演出は未解放です。');}for(const [id,[map,stage,count]]of Object.entries(chapter6.sceneSpecs)){limits[id]=count;sceneMaps[id]=map;sceneStages[id]='complete';if(c.id===id&&data.events.chapter6Stage!==stage)throw Error('最終章の演出と進行が一致しません。');}for(const [id,[map,stage,count,field]]of Object.entries(chapter5.sceneSpecs)){limits[id]=count;sceneMaps[id]=map;sceneStages[id]='complete';if(c.id===id&&data.events[field||'chapter5Stage']!==stage)throw Error('第5章の演出と進行が一致しません。');}for(const [id,[map,stage,count]]of Object.entries(chapter4.sceneSpecs)){limits[id]=count;sceneMaps[id]=map;sceneStages[id]='complete';if(c.id===id&&data.events.chapter4Stage!==stage)throw Error('城の演出と進行が一致しません。');}for(const [id,[map,stage,count]]of Object.entries(chapter3.sceneSpecs)){limits[id]=count;sceneMaps[id]=map;sceneStages[id]='complete';if(c.id===id&&data.events.chapter3Stage!==stage)throw Error('都市の演出と進行が一致しません。');}for(const [id,[map,stage,count]]of Object.entries(chapter2.sceneSpecs)){limits[id]=count;sceneMaps[id]=map;sceneStages[id]='complete';if(c.id===id&&data.events.chapter2Stage!==stage)throw Error('港の演出と進行が一致しません。');}for(const [id,[map,stage]] of Object.entries(chapterScenes)){sceneMaps[id]=map;sceneStages[id]='complete';if(c.id===id&&data.events.chapter1Stage!==stage)throw Error('森の演出と進行が一致しません。');}if(!limits[c.id]||!Number.isInteger(c.step)||c.step<0||c.step>=limits[c.id]||(data.mapId!==sceneMaps[c.id]&&!(c.id==='morning'&&data.mapId==='lumina-home'))||data.events.prologueStage!==sceneStages[c.id])throw new Error('演出の記録が破損しています。');}
    if(data.choices?.sunsetPromise&&!['remember','again'].includes(data.choices.sunsetPromise))throw new Error('約束の記録が破損しています。');
    if (typeof data.mapId !== 'string' || !data.position || !Number.isInteger(data.position.x) || !Number.isInteger(data.position.y) || !['up','down','left','right'].includes(data.position.direction)) throw new Error('セーブの位置情報が破損しています。');
    if (!Array.isArray(data.party) || data.party.length < 1 || data.party.length > 4 || !data.characters || !data.settings) throw new Error('セーブの仲間・設定情報が破損しています。');
    for (const name of ['inventory','events','choices']) if (!data[name] || typeof data[name] !== 'object' || Array.isArray(data[name])) throw new Error('セーブ情報が破損しています。');
    for (const name of ['keyItems','chests']) if (!Array.isArray(data[name])) throw new Error('セーブ情報が破損しています。');
    for (const id of data.party) {
      const c=data.characters[id];
      if(typeof id!=='string'||!c||!Number.isInteger(c.level)||c.level<1||!Number.isFinite(c.hp)||c.hp<0||!Number.isFinite(c.mp)||c.mp<0||!Number.isFinite(c.xp)||c.xp<0||!c.equipment||typeof c.equipment!=='object')throw new Error('仲間の情報が破損しています。');
    }
    if(data.events.cinematic?.id==='forest'&&data.events.chapter1Stage!=='bird')throw new Error('森の演出と進行が一致しません。');
    if(data.events.chapter1Stage&&!['bird','trail','leafy','battle','cleared','deer','soothe','spring','stones','shrineTrail',...finale.stages].includes(data.events.chapter1Stage))throw new Error('森の進行が破損しています。');
    chapter2.validate(data);chapter3.validate(data);chapter4.validate(data);chapter5.validate(data);chapter6.validate(data);postgame.validate(data);
    if(data.events.chapter1Stage&&data.events.prologueStage!=='complete')throw new Error('章の記録が一致しません。');
    if(data.gear===undefined)data.gear=[];if(data.sidequests===undefined)data.sidequests={};if(!Array.isArray(data.gear)||data.gear.some(id=>!adventure.gear[id])||new Set(data.gear).size!==data.gear.length||!data.sidequests||typeof data.sidequests!=='object'||Array.isArray(data.sidequests)||Object.entries(data.sidequests).some(([id,status])=>!['garden','bird'].includes(id)||!['active','done'].includes(status)))throw Error('寄り道とお守りの記録が破損しています。');if([...adventure.seeds.map(x=>'gather:'+x[0]),'gather:nest-twig'].some(id=>data.events[id]!==undefined&&typeof data.events[id]!=='boolean'))throw Error('採集の記録が破損しています。');const used=new Set();for(const c of Object.values(data.characters)){if(c.equipment?.charm){if(!data.gear.includes(c.equipment.charm)||used.has(c.equipment.charm))throw Error('お守りの装備が一致しません。');used.add(c.equipment.charm);}}if(data.sidequests.garden==='done'&&(adventure.seedCount(data)!==3||!data.gear.includes('leafCharm'))||data.sidequests.bird==='done'&&(!data.events['gather:nest-twig']||!data.gear.includes('starPebble')))throw Error('寄り道の完了記録が一致しません。');
    for(const [id,c] of Object.entries(data.characters)){if(!['aobee','leafy','gardo','mira','warbee'].includes(id)||!c||!Number.isInteger(c.level)||c.level<1||c.level>99||!Number.isInteger(c.hp)||c.hp<0||!Number.isInteger(c.mp)||c.mp<0||!Number.isInteger(c.xp)||c.xp<0||c.xp>=c.level*24||!c.equipment||typeof c.equipment!=='object')throw new Error('仲間の情報が破損しています。');const d=battleCore.stats(id,c.level,c.equipment);if(c.hp>d.maxHp||c.mp>d.maxMp)throw new Error('HP・MPの記録が破損しています。');}
    if(data.encounter!==undefined&&(!data.encounter||!Number.isInteger(data.encounter.remaining)||data.encounter.remaining<0||data.encounter.remaining>60||!Number.isInteger(data.encounter.seed)||data.encounter.seed<0||data.encounter.seed>4294967295))throw Error('遭遇の記録が破損しています。');
    if(data.battle){battleCore.validate(data.battle);if(battleCore.encounters[data.battle.id].chapter6||battleCore.encounters[data.battle.id].chapter5){for(const a of data.battle.actors){const c=data.characters[a.id],d=battleCore.stats(a.id,c.level,c.equipment);if(['maxHp','maxMp','attack','defense'].some(k=>a[k]!==d[k]))throw Error('第5章の戦闘能力が一致しません。');}}else if(battleCore.encounters[data.battle.id].chapter4){for(const a of data.battle.actors){const c=data.characters[a.id],d=battleCore.stats(a.id,c.level,c.equipment);if(['maxHp','maxMp','attack','defense'].some(k=>a[k]!==d[k]))throw Error('城の戦闘能力が一致しません。');}}else if(battleCore.encounters[data.battle.id].chapter3){const b=data.battle;if(!chapter3.validateBattle(data)||!data.events.miraGuest||data.battle.freeParty&&!data.events.warbeeJoined||data.events.cinematic||b.actors.map(x=>x.id).join(',')!==data.party.join(','))throw Error('都市の戦闘記録が一致しません。');for(const a of b.actors){const c=data.characters[a.id],d=battleCore.stats(a.id,c.level,c.equipment);if(['maxHp','maxMp','attack','defense'].some(k=>a[k]!==d[k]))throw Error('戦闘の能力値が一致しません。');}}else if(battleCore.encounters[data.battle.id].chapter2){const b=data.battle,e=data.events;if(!e.gardoGuest||!data.party.includes('gardo')||b.actors.map(x=>x.id).join(',')!=='aobee,leafy,gardo'||e.cinematic||b.id==='cave-gear'&&(data.mapId!=='sea-cave'||e.recoveryBlocked)||b.id==='warbee-duel'&&(data.mapId!=='lighthouse-upper'||e.chapter2Stage!=='warbee'||!e.warbeeChapter2Warned||e.warbeeRetreated)||b.id==='memoria-gear'&&(data.mapId!=='star-furnace'||e.chapter2Stage!=='gear'||!e.gearApproachSeen||e.gearStopped))throw Error('第2章の戦闘と進行が一致しません。');for(const a of b.actors){const c=data.characters[a.id],d=battleCore.stats(a.id,c.level,c.equipment);if(['maxHp','maxMp','attack','defense'].some(k=>a[k]!==d[k]))throw Error('戦闘の能力値が一致しません。');}}else{const random=battleCore.encounters[data.battle.id].random;const boss=data.battle.id==='memoria-beast';if((random?(!['memory-woods','deer-hollow','memory-spring'].includes(data.mapId)||!data.events.leafyJoined||!data.events.mocoCleared||data.events.forestRecovered):boss?(data.mapId!=='star-shrine'||data.events.chapter1Stage!=='beast'||data.events.beastSubdued||!data.events.warbeeWarned):(data.mapId!=='memory-woods'||data.events.chapter1Stage!=='battle'||data.events.mocoCleared))||data.events.cinematic||!data.characters.leafy)throw new Error('戦闘と物語の記録が一致しません。');for(const a of data.battle.actors){const d=battleCore.stats(a.id,data.characters[a.id].level,data.characters[a.id].equipment);if(['maxHp','maxMp','attack','defense'].some(k=>a[k]!==d[k]))throw new Error('戦闘の能力値が一致しません。');}}}
    if(data.events.mocoCleared&&!['cleared','deer','soothe','spring','stones','shrineTrail',...finale.stages].includes(data.events.chapter1Stage)||['cleared','deer','soothe','spring','stones','shrineTrail',...finale.stages].includes(data.events.chapter1Stage)&&!data.events.mocoCleared)throw new Error('戦闘結果の記録が一致しません。');
    if(data.events.stoneStep!==undefined&&(!Number.isInteger(data.events.stoneStep)||data.events.stoneStep<0||data.events.stoneStep>3))throw Error('石碑の記録が破損しています。');
    if(['spring','stones','shrineTrail',...finale.stages].includes(data.events.chapter1Stage)&&(!data.events.deerCalmed||!data.events.leafyJoined||(!data.events.warbeeJoined&&!data.party.includes('leafy'))))throw Error('仲間と森の記録が一致しません。');
    if(data.events.chapter1Stage==='stones'&&(!data.events.pendantResonated||data.events.stoneStep===3&&data.events.cinematic?.id!=='stonePath'))throw Error('泉と石碑の記録が一致しません。');
    if(['shrineTrail',...finale.stages].includes(data.events.chapter1Stage)&&(!data.events.stoneSolved||data.events.stoneStep!==3))throw Error('石碑の完了記録が一致しません。');
    if(data.events.cinematic?.id==='deerSong'&&!data.events.deerBed)throw Error('鹿の演出と記録が一致しません。');
    if(data.events.sealRings!==undefined&&(!Array.isArray(data.events.sealRings)||data.events.sealRings.length!==3||data.events.sealRings.some(n=>!Number.isInteger(n)||n<0||n>2)))throw Error('封印装置の記録が破損しています。');
    if(['calming','seal','recovered','returning','homecoming','chapterComplete'].includes(data.events.chapter1Stage)&&!data.events.beastSubdued)throw Error('守護獣の記録が一致しません。');
    if(['seal','recovered','returning','homecoming','chapterComplete'].includes(data.events.chapter1Stage)&&!data.events.bossCalmed)throw Error('鎮静の記録が一致しません。');
    if(['recovered','returning','homecoming','chapterComplete'].includes(data.events.chapter1Stage)&&!data.events.forestRecovered)throw Error('森の記録が一致しません。');
    if(['returning','homecoming','chapterComplete'].includes(data.events.chapter1Stage)&&!data.events.serenaRemembered)throw Error('名前の記録が一致しません。');
    if(data.events.chapter1Stage==='chapterComplete'&&!data.events.chapter1Complete)throw Error('章の完了記録が一致しません。');
    const s=data.settings;
    if(!['tap','stick'].includes(s.controls)||!Number.isInteger(s.fontSize)||s.fontSize<16||s.fontSize>26||!Number.isFinite(s.textSpeed)||s.textSpeed<0||s.textSpeed>80||!Number.isFinite(s.battleSpeed)||s.battleSpeed<1||s.battleSpeed>3||!Number.isFinite(s.bgm)||s.bgm<0||s.bgm>1||!Number.isFinite(s.se)||s.se<0||s.se>1)throw new Error('設定情報が破損しています。');
    for(const n of Object.values(data.inventory))if(!Number.isInteger(n)||n<0)throw new Error('道具の情報が破損しています。');
    return clone(data);
  }
  function key(slot) {
    if (!Number.isInteger(slot) || slot < 1 || slot > 3) throw new Error('スロットは1〜3です。');
    return PREFIX + slot;
  }
  function save(storage, slot, state) {
    const valid = migrate(state);
    const record = { savedAt: new Date().toISOString(), state: valid };
    storage.setItem(key(slot), JSON.stringify(record));
    return record;
  }
  function load(storage, slot) {
    const raw = storage.getItem(key(slot));
    if (raw === null) return null;
    let record;
    try { record = JSON.parse(raw); } catch { throw new Error('セーブを読み取れません。元データは保持されています。'); }
    return { savedAt: record.savedAt, state: migrate(record.state) };
  }
  const api = { VERSION, createState, migrate, save, load };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AobeeSave = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
