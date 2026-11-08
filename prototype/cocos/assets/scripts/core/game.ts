import {CONFIG,PASSENGER_TYPES,type Passenger,type PassengerKind} from './config';
import {TRIPS,type TripConfig} from './levels';
export {CONFIG,PASSENGER_TYPES,TRIPS};
export type {Passenger,PassengerKind,TripConfig};
export interface Placement {passenger:Passenger;slot:number}
export type Phase='ready'|'loading'|'closing'|'travel'|'stopping'|'opening'|'unloading'|'result'|'ended';
export interface TripResult {trip:number;title:string;floor:number;fares:number;bonus:number;smoothBonus:number;punctualBonus:number;courierBonus:number;maintenance:number;net:number;emergency:boolean;reason:string;passengers:number;mass:number;duration:number;maxTilt:number;}
export interface GameState {
 phase:Phase;queue:Passenger[];aboard:Placement[];timeLeft:number;doorTime:number;lastCallOffered:boolean;
 mass:number;balance:number;tilt:number;load:number;progress:number;result:TripResult|null;message:string;paused:boolean;
 elapsed:number;travelTime:number;tiltVelocity:number;correction:number;dangerTime:number;accumulator:number;
 tripIndex:number;tripElapsed:number;phaseTime:number;arrivalIndex:number;spawnId:number;seed:number;rng:number;
 total:number;records:TripResult[];warningTime:number;maxTilt:number;emergencyReason:string;
 doorPurpose:'departure'|'arrival';eventSign:number;eventText:string;leftBehind:number;started:boolean;
}
export type Action={type:'board';passengerId:string;slot:number}|{type:'move';passengerId:string;slot:number}|{type:'remove';passengerId:string}|{type:'begin'|'close'|'reopen'|'pause'|'resume'|'next'};
export const currentTrip=(s:GameState)=>TRIPS[s.tripIndex];
const clone=(s:GameState):GameState=>({...s,queue:s.queue.map(p=>({...p})),aboard:s.aboard.map(a=>({passenger:{...a.passenger},slot:a.slot})),records:s.records.slice(),result:s.result?{...s.result}:null});
export function legalSlot(slot:number,size:number,placements:Placement[],except=''):boolean {
 if(!Number.isInteger(slot)||slot<0||slot>=6||(size===2&&slot%3===2))return false;
 const cells=size===2?[slot,slot+1]:[slot];
 return placements.filter(a=>a.passenger.id!==except).every(a=>cells.every(i=>i<a.slot||i>=a.slot+a.passenger.size));
}
export function measure(aboard:Placement[]){const mass=aboard.reduce((v,a)=>v+a.passenger.mass,0);const moment=aboard.reduce((v,a)=>v+a.passenger.mass*(a.slot%3-1+(a.passenger.size===2?.5:0)),0);return{mass,balance:mass?moment/mass:0};}
function rng(s:GameState){s.rng=(Math.imul(1664525,s.rng)+1013904223)>>>0;return s.rng/4294967296;}
function passenger(s:GameState,kind:PassengerKind){return{...PASSENGER_TYPES[kind],id:`${s.seed}-${s.tripIndex}-${s.spawnId++}`};}
function initTrip(s:GameState){
 s.phase='loading';s.queue=[];s.aboard=[];s.mass=0;s.balance=0;s.tilt=0;s.tiltVelocity=0;s.correction=0;s.load=0;s.progress=0;s.dangerTime=0;s.warningTime=0;s.maxTilt=0;
 s.travelTime=0;s.tripElapsed=0;s.phaseTime=0;s.doorTime=0;s.arrivalIndex=0;s.lastCallOffered=false;s.result=null;s.emergencyReason='';s.doorPurpose='departure';s.eventText='';
 s.eventSign=rng(s)<.5?-1:1;currentTrip(s).initial.forEach(k=>s.queue.push(passenger(s,k)));s.message=currentTrip(s).goal;
}
export function createGame(seed:number=CONFIG.defaultSeed):GameState {
 const n=Number.isFinite(seed)?seed>>>0:CONFIG.defaultSeed;
 const s:GameState={phase:'ready',queue:[],aboard:[],timeLeft:CONFIG.daySeconds,doorTime:0,lastCallOffered:false,mass:0,balance:0,tilt:0,load:0,progress:0,result:null,message:'',paused:false,elapsed:0,travelTime:0,tiltVelocity:0,correction:0,dangerTime:0,accumulator:0,tripIndex:0,tripElapsed:0,phaseTime:0,arrivalIndex:0,spawnId:0,seed:n,rng:n,total:0,records:[],warningTime:0,maxTilt:0,emergencyReason:'',doorPurpose:'departure',eventSign:1,eventText:'',leftBehind:0,started:false};
 initTrip(s);s.phase='ready';return s;
}
function nextTrip(s:GameState){if(s.phase!=='result')return;if(s.timeLeft<=0||s.tripIndex>=TRIPS.length-1){s.phase='ended';return;}s.tripIndex++;initTrip(s);}
export function dispatch(state:GameState,action:Action):GameState {
 const s=clone(state);
 if(action.type==='pause'||action.type==='resume'){s.paused=action.type==='pause';s.accumulator=0;return s;}
 if(s.paused||s.phase==='ended')return s;
 if(action.type==='begin'&&s.phase==='ready'){s.started=true;s.phase='loading';return s;}
 if(action.type==='next'){nextTrip(s);return s;}
 if(action.type==='reopen'&&s.phase==='closing'&&s.timeLeft>0){s.phase='opening';s.doorPurpose='departure';s.doorTime=CONFIG.reopeningSeconds;s.message='重新开门中，门开好后才能上下客。';return s;}
 if(s.phase==='ready'&&(action.type==='board'||action.type==='close')){s.started=true;s.phase='loading';}
 if(s.phase!=='loading')return s;
 if(action.type==='close'){
  if(s.mass>CONFIG.maxMass){s.message='超过450kg，必须先下客减载。';return s;}
  s.phase='closing';s.doorTime=CONFIG.closingSeconds;s.message='关门中；重开门需额外1.5秒。';return s;
 }
 if(action.type==='board'){
  if(s.timeLeft<=0)return s;const i=s.queue.findIndex(p=>p.id===action.passengerId);if(i<0)return s;const p=s.queue[i];
  if(!legalSlot(action.slot,p.size,s.aboard)){s.message='站位不可用：两格货物只能横向相邻，不能跨行。';return s;}
  s.queue.splice(i,1);s.aboard.push({passenger:p,slot:action.slot});s.message=`${p.name}已上客，预计票款 ¥${s.aboard.reduce((v,a)=>v+a.passenger.fare,0)}。`;
 }else if(action.type==='move'){
  const a=s.aboard.find(a=>a.passenger.id===action.passengerId);if(!a)return s;
  if(!legalSlot(action.slot,a.passenger.size,s.aboard,action.passengerId)){s.message='该站位放不下，请选择空位。';return s;}a.slot=action.slot;s.message='站位已调整，查看左右重心。';
 }else if(action.type==='remove'){
  const i=s.aboard.findIndex(a=>a.passenger.id===action.passengerId);if(i<0)return s;const a=s.aboard.splice(i,1)[0];
  if(s.queue.length<CONFIG.queueLimit&&s.timeLeft>0)s.queue.push(a.passenger);s.message='已请下车；未收取票款。';
 }
 Object.assign(s,measure(s.aboard));return s;
}
function settle(s:GameState){
 if(s.result||s.records.some(r=>r.trip===s.tripIndex+1))return;
 const c=currentTrip(s),emergency=!!s.emergencyReason,base=s.aboard.reduce((v,a)=>v+a.passenger.fare,0),occupied=s.aboard.length>0;
 const punctual=occupied&&!emergency&&s.tripElapsed<=c.deadline;
 const smoothBonus=occupied&&!emergency&&s.warningTime<=CONFIG.smoothWarningSeconds?CONFIG.smoothBonus:0;
 const punctualBonus=punctual?c.punctualBonus:0;
 const courierBonus=punctual&&s.aboard.some(a=>a.passenger.kind==='courier')?CONFIG.courierBonus:0;
 const fares=emergency?Math.floor(base*CONFIG.emergencyFareRatio):base;
 const maintenance=emergency?CONFIG.emergencyMaintenance:Math.ceil(Math.max(0,(s.mass-CONFIG.normalMass)/(CONFIG.maxMass-CONFIG.normalMass))*CONFIG.overloadMaintenance);
 const bonus=smoothBonus+punctualBonus+courierBonus;
 s.result={trip:s.tripIndex+1,title:c.title,floor:c.floor,fares,bonus,smoothBonus,punctualBonus,courierBonus,maintenance,net:fares+bonus-maintenance,emergency,reason:s.emergencyReason,passengers:s.aboard.length,mass:s.mass,duration:s.tripElapsed,maxTilt:s.maxTilt};
 s.records.push(s.result);s.total+=s.result.net;s.phaseTime=CONFIG.resultSeconds;
 s.phase=s.tripIndex===TRIPS.length-1||s.timeLeft<=0?'ended':'result';
 s.message=emergency?`安全停靠：${s.emergencyReason}，收半票，维护费 ¥${maintenance}。`:'乘客安全到站，本趟已结算。';
}
function stop(s:GameState,reason=''){
 s.emergencyReason=reason;s.phase='stopping';s.phaseTime=CONFIG.stoppingSeconds+(reason?CONFIG.emergencyStopSeconds:0);
 s.message=reason?`安全停靠：${reason}。所有人安全，额外停靠4秒。`:'到站减速，乘客请稍候。';
}
function tick(s:GameState,input:-1|0|1){
 const dt=CONFIG.fixedStep;if(!s.started||s.phase==='ended')return;
 s.elapsed+=dt;s.timeLeft=Math.max(0,s.timeLeft-dt);
 if(s.phase==='result'){s.phaseTime-=dt;if(s.timeLeft<=0){s.phase='ended';return;}if(s.phaseTime<=0)nextTrip(s);return;}
 s.tripElapsed+=dt;const c=currentTrip(s);
 if(s.phase==='loading'||s.phase==='closing'||(s.phase==='opening'&&s.doorPurpose==='departure')){
  const before=s.queue.length;s.queue.forEach(p=>p.patience-=dt);s.queue=s.queue.filter(p=>p.patience>0);s.leftBehind+=before-s.queue.length;
  // Timed arrivals are dropped when queue is full, never accumulated into a later burst.
  while(s.arrivalIndex<c.arrivals.length&&s.tripElapsed>=c.arrivals[s.arrivalIndex].at){
   const a=c.arrivals[s.arrivalIndex++];if(s.timeLeft>0&&s.tripElapsed<=c.stopSpawning&&s.queue.length<CONFIG.queueLimit)s.queue.push(passenger(s,a.kind));
  }
  if(s.phase==='loading'&&s.timeLeft<=0){
   let off=0;while(s.mass>CONFIG.maxMass&&s.aboard.length){s.aboard.pop();Object.assign(s,measure(s.aboard));off++;}
   s.queue=[];s.phase='closing';s.doorTime=CONFIG.closingSeconds;s.message=off?`营业结束，${off}位乘客安全下车减载，现有乘客送达后结算。`:'营业结束，停止接客，完成当前运输。';
  }
  if(s.phase==='opening'){s.doorTime=Math.max(0,s.doorTime-dt);if(s.doorTime===0){s.phase='loading';s.message='门已打开，可以上客、换位或下客。';}}
  else if(s.phase==='closing'){
   s.doorTime=Math.max(0,s.doorTime-dt);
   if(s.doorTime<=2&&!s.lastCallOffered){s.lastCallOffered=true;if(c.lastCall&&s.timeLeft>0&&s.queue.length<CONFIG.queueLimit){const p=passenger(s,c.lastCall);s.queue.push(p);s.message=`再等一个！${p.name} ${p.mass}kg / ${p.size}格 / ¥${p.fare}`;}}
   if(s.doorTime===0){s.phase='travel';s.leftBehind+=s.queue.length;s.queue=[];s.message=s.mass>CONFIG.normalMass?'吃力运输：速度下降，电机负荷持续上升。':'行进中，按 A/D 或左右扶手微调重心。';}
  }return;
 }
 if(s.phase==='stopping'){s.phaseTime-=dt;if(s.phaseTime<=0){s.phase='opening';s.doorPurpose='arrival';s.doorTime=CONFIG.arrivalOpeningSeconds;s.message='到站开门，所有乘客安全下客。';}return;}
 if(s.phase==='opening'){s.doorTime=Math.max(0,s.doorTime-dt);if(s.doorTime===0){s.phase='unloading';s.phaseTime=CONFIG.unloadingSeconds;}return;}
 if(s.phase==='unloading'){s.phaseTime-=dt;if(s.phaseTime<=0)settle(s);return;}
 if(s.phase!=='travel')return;
 s.travelTime+=dt;const overload=Math.max(0,(s.mass-CONFIG.normalMass)/(CONFIG.maxMass-CONFIG.normalMass));
 s.correction+=(input*CONFIG.shiftLimit-s.correction)*Math.min(1,dt*CONFIG.shiftRate);
 const highCenter=s.aboard.some(a=>a.passenger.kind==='traveller')?1+CONFIG.highCenterFactor:1;
 const coachShare=s.mass?s.aboard.filter(a=>a.passenger.kind==='coach').reduce((v,a)=>v+a.passenger.mass,0)/s.mass:0;
 const at=c.journeySeconds*.48;const eventT=s.travelTime-at;
 const event=eventT>=0&&eventT<CONFIG.eventDuration?Math.sin(eventT/CONFIG.eventDuration*Math.PI)*c.eventDegrees*s.eventSign:0;
 s.eventText=c.eventDegrees&&eventT>=-CONFIG.eventWarningSeconds&&eventT<CONFIG.eventDuration?`${eventT<0?'前方接缝':'经过接缝'}：向${s.eventSign>0?'右':'左'}晃动` :'';
 const startStop=Math.sin(Math.min(1,s.travelTime/1.5)*Math.PI)*1.1+(s.progress>.85?Math.sin((s.progress-.85)/.15*Math.PI)*1.1:0);
 const target=Math.max(-CONFIG.maxTargetDegrees,Math.min(CONFIG.maxTargetDegrees,(s.balance+s.correction)*CONFIG.tiltTargetDegrees*highCenter+(event+startStop)*(1-CONFIG.coachDamping*coachShare)));
 s.tiltVelocity+=(CONFIG.springStiffness*(target-s.tilt)-CONFIG.springDamping*s.tiltVelocity)*dt;s.tilt+=s.tiltVelocity*dt;s.maxTilt=Math.max(s.maxTilt,Math.abs(s.tilt));
 if(Math.abs(s.tilt)>=CONFIG.tiltWarning)s.warningTime+=dt;
 s.dangerTime=Math.abs(s.tilt)>=CONFIG.tiltDanger?s.dangerTime+dt:Math.max(0,s.dangerTime-dt*CONFIG.dangerRecovery);
 s.load=Math.max(0,Math.min(CONFIG.loadLimit,s.load+(overload*CONFIG.loadRate-(overload===0?CONFIG.loadRecovery:0))*dt));
 s.progress=Math.min(1,s.progress+dt/(c.journeySeconds*(1+CONFIG.overloadSpeedFactor*overload)));
 if(s.dangerTime>=CONFIG.dangerSeconds)stop(s,'侧倾持续危险');else if(s.load>=CONFIG.loadLimit)stop(s,'电机负荷过高');else if(s.progress>=1)stop(s);
}
export function step(state:GameState,seconds:number,input:-1|0|1=0):GameState {
 if(state.paused||!Number.isFinite(seconds)||seconds<=0)return state;
 const s=clone(state);s.accumulator+=Math.min(seconds,CONFIG.maxFrame);
 const direction=input===-1||input===1?input:0;
 while(s.accumulator+1e-9>=CONFIG.fixedStep){s.accumulator-=CONFIG.fixedStep;tick(s,direction);}return s;
}
