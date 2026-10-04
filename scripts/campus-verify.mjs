// SAT verifier for the v2 campus: proves zero overlaps and reports the tightest
// clearance in the whole layout. Reads the SAME constants campus-calc.mjs derives.
import fs from 'fs';
import path from 'path';

const CLEAR = 9;
// ring 1 — departments, unchanged sizes, 60° apart at r=60
const DEPTS = [['emails',20,26],['delivery',20,30],['sales',20,30],
               ['marketing',20,30],['fin',20,26],['ops',20,30]];
const D_R = 60;
// ring 2 / ring 3 — read straight from the generated tables
const ring2 = fs.readFileSync(path.join('scripts/out/ring2.txt'),'utf8');
const ring3 = fs.readFileSync(path.join('scripts/out/ring3.txt'),'utf8');
function parse(txt){
  return [...txt.matchAll(/id: '([^']+)'.*pos: \[([-\d.]+), ([-\d.]+)\], w: ([\d.]+), d: ([\d.]+)/g)]
    .map(m=>({id:m[1], x:+m[2], z:+m[3], w:+m[4], d:+m[5]}));
}
const benches = [...parse(ring2), ...parse(ring3)];

const D_PHASE = 3; // must match campus-calc.mjs DEPT_PHASE
const rects = [
  ...DEPTS.map(([id,w,d],i)=>{const a=(i*60+D_PHASE)*Math.PI/180;
    return {id:'dept:'+id, x:Math.cos(a)*D_R, z:Math.sin(a)*D_R, w, d};}),
  ...benches,
];
// the brain slab
rects.push({id:'BRAIN', x:0, z:0, w:16, d:16});

// exact AABB overlap + true clearance (gap between edges on the separating axis)
function overlap(a,b){
  return !(a.x+a.w/2 <= b.x-b.w/2 || b.x+b.w/2 <= a.x-a.w/2 || a.z+a.d/2 <= b.z-b.d/2 || b.z+b.d/2 <= a.z-a.d/2);
}
function clearance(a,b){
  const dx = Math.abs(a.x-b.x)-(a.w+b.w)/2;
  const dz = Math.abs(a.z-b.z)-(a.d+b.d)/2;
  return Math.max(dx,dz); // negative = overlap
}

let overlaps=0, minClear=Infinity, minPair='';
const tight=[];
for(let i=0;i<rects.length;i++){
  for(let j=i+1;j<rects.length;j++){
    const a=rects[i],b=rects[j];
    const c=clearance(a,b);
    if(c<0){ overlaps++; console.log(`OVERLAP  ${a.id} <-> ${b.id}  (${c.toFixed(1)})`); }
    else {
      if(c<minClear){ minClear=c; minPair=`${a.id} <-> ${b.id}`; }
      if(c<CLEAR) tight.push(`${c.toFixed(1)}  ${a.id} <-> ${b.id}`);
    }
  }
}
console.log(`platforms: ${rects.length}  (1 brain + 6 departments + 20 benches)`);
console.log(`pairs tested: ${(rects.length*(rects.length-1))/2}`);
console.log(`OVERLAPS: ${overlaps}`);
console.log(`tightest clearance: ${minClear.toFixed(1)}  ${minPair}`);
console.log(`required: >= ${CLEAR}`);
console.log(`pairs under ${CLEAR}: ${tight.length}`);
tight.forEach(t=>console.log('   '+t));

// radial spoke sanity: one spoke per platform, angles must be distinct at the hub
const angles = rects.filter(r=>r.id!=='BRAIN').map(r=>({
  id:r.id, deg:((Math.atan2(r.z,r.x)*180/Math.PI)+360)%360 }));
angles.sort((a,b)=>a.deg-b.deg);
let minAng=Infinity, minAngPair='';
for(let i=0;i<angles.length;i++){
  const a=angles[i].deg, b=angles[(i+1)%angles.length].deg;
  const d=(b-a+360)%360;
  if(d<minAng){ minAng=d; minAngPair=`${angles[i].id} / ${angles[(i+1)%angles.length].id}`; }
}
console.log(`\nclosest two platforms by angle: ${minAng.toFixed(1)}°  ${minAngPair}`);

process.exitCode = (overlaps===0 && minClear>=CLEAR) ? 0 : 1;