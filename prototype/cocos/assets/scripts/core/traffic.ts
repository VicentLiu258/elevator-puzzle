/** Deterministic visual pedestrian routing. Units are scene metres; no game-slot mutation. */
export interface Point {x:number;z:number}
export const PERSONAL_SPACE=.82;
const GRID=.14;
export function segmentClear(a:Point,b:Point,people:Point[],clearance=PERSONAL_SPACE):boolean {
 const dx=b.x-a.x,dz=b.z-a.z,len=dx*dx+dz*dz;
 return people.every(p=>{const t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/len)):0;return Math.hypot(a.x+t*dx-p.x,a.z+t*dz-p.z)>=clearance-1e-6;});
}
function inside(p:Point){return p.z>=-.98&&p.z<=4.65&&p.x>=-4.2&&p.x<=11.5&&(p.z>=1.65||Math.abs(p.x)<=2.25);}
/** A* around stationary passengers. One walker owns the route until it reaches its goal. */
export function pedestrianPath(start:Point,end:Point,people:Point[]):Point[]|null {
 if(!segmentClear(end,end,people))return null;
 if(segmentClear(start,end,people)&&inside({x:(start.x+end.x)/2,z:(start.z+end.z)/2})&&(start.z>=1.65&&end.z>=1.65||Math.abs(start.x)<=2.25&&Math.abs(end.x)<=2.25))return [{...end}];
 const key=(x:number,z:number)=>x+','+z;
 const sx=Math.round(start.x/GRID),sz=Math.round(start.z/GRID);
 interface Entry{x:number;z:number;g:number;f:number;parent:string|null}
 const nodes=new Map<string,Entry>(),open:string[]=[],closed=new Set<string>();
 // Connect exact start to nearby grid points without cutting through a neighbour.
 for(let x=sx-1;x<=sx+1;x++)for(let z=sz-1;z<=sz+1;z++){
  const p={x:x*GRID,z:z*GRID};if(!inside(p)||!segmentClear(start,p,people))continue;
  const g=Math.hypot(p.x-start.x,p.z-start.z),k=key(x,z);nodes.set(k,{x,z,g,f:g+Math.hypot(p.x-end.x,p.z-end.z),parent:null});open.push(k);
 }
 let goal:string|null=null;
 while(open.length&&closed.size<6000){
  let best=0;for(let i=1;i<open.length;i++)if(nodes.get(open[i])!.f<nodes.get(open[best])!.f)best=i;
  const k=open.splice(best,1)[0];if(closed.has(k))continue;closed.add(k);const n=nodes.get(k)!,p={x:n.x*GRID,z:n.z*GRID};
  if(Math.hypot(p.x-end.x,p.z-end.z)<.3&&segmentClear(p,end,people)){goal=k;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=n.x+dx,z=n.z+dz,next={x:x*GRID,z:z*GRID},nk=key(x,z);if(closed.has(nk)||!inside(next)||!segmentClear(p,next,people))continue;
   const g=n.g+Math.hypot(dx,dz)*GRID,old=nodes.get(nk);if(old&&old.g<=g)continue;
   nodes.set(nk,{x,z,g,f:g+Math.hypot(next.x-end.x,next.z-end.z),parent:k});open.push(nk);
  }
 }
 if(!goal)return null;
 const path:Point[]=[{...end}];let k:string|null=goal;
 while(k){const n:Entry=nodes.get(k)!;path.unshift({x:n.x*GRID,z:n.z*GRID});k=n.parent;}
 // Keep grid corner safety while removing unnecessary straight-line foot shuffles.
 const result:Point[]=[];let origin=start;
 for(let i=0;i<path.length;){let j=i;while(j+1<path.length&&segmentClear(origin,path[j+1],people)&&Math.abs(path[j+1].x)<=2.25&&Math.abs(origin.x)<=2.25)j++;result.push(path[j]);origin=path[j];i=j+1;}
 return result;
}
