const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../aobee_rpg_final_v122.html'),'utf8');
assert.equal(/<script\s+src=|<link\s+rel="stylesheet"/.test(html),false,'no external code');
assert.equal(html.includes('assets/'),false,'all runtime images embedded');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,35);
for(const match of scripts)new vm.Script(match[1]);
assert.equal((html.match(/data:image\/png;base64,/g)||[]).length,fs.readdirSync(path.join(__dirname,'../assets')).filter(x=>x.endsWith('.png')).length,'images embedded once');
console.log('PASS: standalone HTML, all 35 scripts parse, embedded image assets');

const context=vm.createContext({console});const sourceHTML=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");for(const [,file]of sourceHTML.matchAll(/<script src="([^"]+)"/g)){if(file==="src/audio.js")break;vm.runInContext(fs.readFileSync(path.join(__dirname,"..",file),"utf8"),context,{filename:file});}assert.ok(context.AobeeChapter4);assert.ok(context.AobeeData.items.sharedRecord);vm.runInContext("AobeeSave.migrate(AobeeSave.createState())",context);console.log("PASS: browser module initialization order, data and old save migration");
