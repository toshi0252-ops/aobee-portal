const fs=require('node:fs'),path=require('node:path');
const root=__dirname,assets={};
for(const name of fs.readdirSync(path.join(root,'assets')).filter(n=>n.endsWith('.png')))assets[name]='data:image/png;base64,'+fs.readFileSync(path.join(root,'assets',name)).toString('base64');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(root,'style.css'),'utf8')+'</style>');
html=html.replace(/src="assets\/([^"]+)"/g,(_,name)=>'data-aobee-asset="'+name+'"');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>{
 let source=fs.readFileSync(path.join(root,file),'utf8');
 source=source.replace(/(['"])assets\/([^'"]+)\1/g,(_,quote,name)=>{if(!assets[name])throw Error('Missing image: '+name);return 'AobeePackedAssets['+JSON.stringify(name)+']';});
 return '<script>'+source.replace(/<\/script/gi,'<\\/script')+'</script>';
});
const bootstrap='<script>const AobeePackedAssets='+JSON.stringify(assets)+';for(const img of document.querySelectorAll("img[data-aobee-asset]"))img.src=AobeePackedAssets[img.dataset.aobeeAsset];</script>';
html=html.replace('<script>',()=>bootstrap+'<script>');
const target=path.join(root,'aobee_rpg_final_v122.html');fs.writeFileSync(target,html);console.log('Packed '+target+' ('+Math.round(Buffer.byteLength(html)/1024/1024*10)/10+' MB)');
