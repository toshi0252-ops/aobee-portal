const fs=require('fs'),path=require('path');
const entries=new Map(),report=[];
function signature(src){return src.length+':'+src.slice(0,90)+':'+src.slice(-90)}
function classify(context){
 const c=context.replaceAll('&quot;','"').replaceAll('&#39;',"'");
 const run=c.match(/loadAobeeFrame\(["']([^"']+)["'],\s*["']$/);
 if(run)return run[1].startsWith('run')?'runRight':'right';
 const direction=c.match(/["'](down|up|left|right|downleft|downright|upleft|upright)["']\s*:\s*["']$/);
 if(direction)return ({down:'front',up:'back',downleft:'left',upleft:'left',downright:'right',upright:'right'})[direction[1]]||direction[1];
 const face=c.match(/player[^\n]*data-face\s*=\s*["'](down|up|left|right)["'][\s\S]*?url\(["']$/);
 if(face)return ({down:'front',up:'back'})[face[1]]||face[1];
 if(/clearMascot[^}]*url\(["']$/.test(c))return 'cheer';
 if(/(?:\.mascot|\.player)[^}]*url\(["']$/.test(c))return 'front';
 if(/#[a-z-]*aobee[a-z-]*\s*\{[^}]*url\(["']?$/i.test(c))return 'front';
 if(/AOBEE_RENA_REAR\.src\s*=\s*["']$/.test(c))return 'back';
 if(/(?:aobeeImg|aobeeImage|playerImg|playerImage|sprite)\.src\s*=\s*["']$/i.test(c))return 'front';
 if(/["']aobee["']\s*:\s*["']$/i.test(c))return 'front';
 if(/\baobee\s*:\s*["']$/i.test(c))return 'rpg';
 if(/aobee-walk-v1\.png["']\s*:\s*["']$/i.test(c))return 'rpg';
 if(/(?:const|let|var)\s+(?:AOBEE|aobeeSrc|playerSrc)\s*=\s*["']$/i.test(c))return 'front';
 if(/(?:id|class)=["'][^"']*(?:aobee|mascot)[^"']*["'][^>]*src=["']$/i.test(c)&&!/warubee/i.test(c))return 'front';
 return null;
}
function inspect(source,label,depth=0){
 let count=0;
 for(const m of source.matchAll(/data:image\/(?:png|webp|jpeg);base64,[A-Za-z0-9+/=]+/g)){
  const context=source.slice(Math.max(0,m.index-250),m.index),pose=classify(context);
  if(!pose)continue;entries.set(signature(m[0]),pose);count++;
 }
 report.push({source:label,characterImages:count});
 if(depth>=2)return;
 const nested=new Set();
 for(const m of source.matchAll(/data:text\/html;base64,([A-Za-z0-9+/=]+)/g))nested.add(m[1]);
 for(const m of source.matchAll(/(?:const|let|var)\s+S[2-6]\s*=\s*["']([A-Za-z0-9+/=]+)["']/g))nested.add(m[1]);
 let i=0;for(const data of nested){const child=Buffer.from(data,'base64').toString('utf8');if(/<html|<!doctype/i.test(child))inspect(child,label+' / embedded '+(++i),depth+1)}
}
for(const file of fs.readdirSync('games').filter(f=>f.endsWith('.html')))inspect(fs.readFileSync(path.join('games',file),'utf8'),file);
inspect(fs.readFileSync('games/rpg/aobee_rpg_final_v122.html','utf8'),'rpg standalone');
fs.writeFileSync('assets/characters/manifest-v1.json',JSON.stringify(Object.fromEntries(entries)));
fs.writeFileSync('assets/characters/audit-v1.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({uniqueCharacterImages:entries.size,sources:report}));
