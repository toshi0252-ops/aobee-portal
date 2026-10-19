(function(root){
'use strict';
// Display-only nearest-castle regions. Coordinates and ownership are never mutated.
function layout(castles,width=1000,height=1000){
 const cells=castles.map(c=>{let points=[[0,0],[width,0],[width,height],[0,height]];
 for(const other of castles){if(other.id===c.id)continue;const a=2*(other.x-c.x),b=2*(other.y-c.y),d=other.x**2+other.y**2-c.x**2-c.y**2;
 const next=[];for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length],u=a*p[0]+b*p[1]-d,v=a*q[0]+b*q[1]-d;if(u<=1e-7)next.push(p);if((u<0&&v>0)||(u>0&&v<0)){const t=u/(u-v);next.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}points=next;if(!points.length)break;}
 return {castleId:c.id,ownerFactionId:c.ownerFactionId,points};});
 const borders=[];for(let k=0;k<cells.length;k++){const c=castles[k],p=cells[k].points;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,dist=(x-c.x)**2+(y-c.y)**2;const neighbor=castles.find(o=>o.id!==c.id&&Math.abs((x-o.x)**2+(y-o.y)**2-dist)<.01);if(neighbor&&c.id<neighbor.id&&c.ownerFactionId!==neighbor.ownerFactionId)borders.push([a,b]);}}
 return {cells,borders};
}
root.YabouTerritory={layout};if(typeof module!=='undefined')module.exports=root.YabouTerritory;
})(globalThis);
