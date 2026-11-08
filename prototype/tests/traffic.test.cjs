const assert=require('node:assert/strict');const {pedestrianPath,segmentClear,PERSONAL_SPACE}=require(process.argv[2]);
const queue=Array.from({length:5},(_,i)=>({x:(i-2)*1.18,z:3.14}));
const slots=Array.from({length:6},(_,i)=>({x:(i%3-1)*1.68,z:i<3?-.78:.77}));
let checks=0;function route(start,end,others){const p=pedestrianPath(start,end,others);assert(p,`No route ${JSON.stringify({start,end})}`);let prev=start;for(const next of p){assert(segmentClear(prev,next,others),`intersecting segment`);prev=next;checks++;}assert(Math.hypot(prev.x-end.x,prev.z-end.z)<1e-8);return p;}
// Each cabin slot remains reachable around the other five standing people and four queue members.
for(let i=0;i<6;i++)route(queue[2],slots[i],[...queue.filter((_,j)=>j!==2),...slots.filter((_,j)=>j!==i)]);
// Full cabin unloads front-first while all five incoming passengers remain outside.
let aboard=slots.map(p=>({...p}));for(const i of [3,4,5,0,1,2]){route(slots[i],{x:-4,z:4.45},[...queue,...aboard.filter(p=>p!==aboard.find(a=>a.x===slots[i].x&&a.z===slots[i].z))]);aboard=aboard.filter(p=>p.x!==slots[i].x||p.z!==slots[i].z);}
// Queue replenishment and a gap in the middle do not require moving neighbours.
for(let i=0;i<5;i++)route({x:6.2,z:4.25},queue[i],queue.filter((_,j)=>j!==i));
// Occupied goals wait, rather than force the actor into an overlap.
assert.equal(pedestrianPath(queue[0],slots[0],[slots[0]]),null);
assert(!segmentClear({x:-1,z:0},{x:1,z:0},[{x:0,z:0}]));
assert.equal(PERSONAL_SPACE,.82);
console.log('PASS traffic: 6 crowded boarding routes, 6 full-cabin exits, 5 queue arrivals, blocked goal; '+checks+' collision-free segments');
