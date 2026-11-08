import type { PassengerKind } from './config';
export interface TripConfig {
  id:number; title:string; goal:string; tradeoff:string; floor:number; journeySeconds:number;
  initial:PassengerKind[]; arrivals:{at:number;kind:PassengerKind}[]; stopSpawning:number;
  lastCall:PassengerKind|null; deadline:number; punctualBonus:number; eventDegrees:number;
}
/** Ten authored trips; seed varies an announced disturbance direction, never causes a random failure. */
export const TRIPS:TripConfig[]=[
 {id:1,title:'第一班，慢慢来',goal:'点选乘客，再点圆形站位；坐稳后关门。',tradeoff:'先熟悉上客和关门，空车也可发车但没有收入。',floor:3,journeySeconds:5,initial:['student','office','student'],arrivals:[],stopSpawning:0,lastCall:null,deadline:19,punctualBonus:4,eventDegrees:0},
 {id:2,title:'等人还是赶时间',goal:'16秒内送达奖 ¥18，等客也会计时。',tradeoff:'晚来的高票价客人，可能抵不过准时奖励。',floor:5,journeySeconds:6,initial:['student','courier'],arrivals:[{at:7,kind:'mover'},{at:11,kind:'office'}],stopSpawning:14,lastCall:'office',deadline:16,punctualBonus:18,eventDegrees:0},
 {id:3,title:'两边都照顾到',goal:'把乘客分到左右两边，观察重心指示。',tradeoff:'同样重量，站位不同，侧倾就不同。',floor:8,journeySeconds:8,initial:['coach','coach','student'],arrivals:[{at:4,kind:'office'},{at:10,kind:'student'}],stopSpawning:14,lastCall:'student',deadline:22,punctualBonus:5,eventDegrees:0},
 {id:4,title:'纸箱也要一个位置',goal:'搬家客占同一行相邻两格，不能跨行。',tradeoff:'一位搬家客 ¥30，但占去两格。',floor:4,journeySeconds:7,initial:['mover','student','office'],arrivals:[{at:4,kind:'courier'},{at:10,kind:'mover'}],stopSpawning:15,lastCall:'student',deadline:22,punctualBonus:5,eventDegrees:0},
 {id:5,title:'电机也会累',goal:'超过300kg会减速，负荷条满会安全停靠。',tradeoff:'更多票款可能换来更慢运输和维护费。',floor:10,journeySeconds:12,initial:['coach','traveller','courier','office'],arrivals:[{at:5,kind:'coach'},{at:11,kind:'mover'}],stopSpawning:15,lastCall:'student',deadline:26,punctualBonus:8,eventDegrees:0},
 {id:6,title:'扶稳，别慌',goal:'途中有提前提示的接缝晃动，用扶手微调。',tradeoff:'扶手只能部分补救，站位仍然重要。',floor:6,journeySeconds:9,initial:['traveller','coach','student'],arrivals:[{at:5,kind:'office'}],stopSpawning:12,lastCall:'courier',deadline:23,punctualBonus:6,eventDegrees:3.2},
 {id:7,title:'午高峰争分夺秒',goal:'16秒内送达奖 ¥24，别让短耐心客人白等。',tradeoff:'轻载准时的收入，有机会超过等满再走。',floor:9,journeySeconds:6,initial:['office','courier'],arrivals:[{at:7,kind:'mover'},{at:10,kind:'traveller'}],stopSpawning:13,lastCall:'coach',deadline:16,punctualBonus:24,eventDegrees:1.5},
 {id:8,title:'就差最后这一位',goal:'关门时出现搬家客；重开门要花1.5秒。',tradeoff:'本趟短途，最后一人的票款很诱人，但仍要留位。',floor:11,journeySeconds:5,initial:['student','office'],arrivals:[{at:4,kind:'traveller'},{at:8,kind:'courier'}],stopSpawning:12,lastCall:'mover',deadline:27,punctualBonus:4,eventDegrees:0},
 {id:9,title:'行李摆哪边',goal:'高重心行李加上偏载，会放大侧倾。',tradeoff:'用稳定乘客与左右分布平衡高价行李客。',floor:2,journeySeconds:12,initial:['traveller','traveller','coach'],arrivals:[{at:5,kind:'student'},{at:9,kind:'courier'}],stopSpawning:14,lastCall:'mover',deadline:26,punctualBonus:8,eventDegrees:2.6},
 {id:10,title:'最后一班，收工',goal:'留意剩余营业时间，稳稳完成最后一趟。',tradeoff:'载重、站位、等待和准时奖励一起取舍。',floor:7,journeySeconds:11,initial:['mover','courier','coach'],arrivals:[{at:4,kind:'traveller'},{at:8,kind:'office'},{at:12,kind:'student'}],stopSpawning:16,lastCall:'traveller',deadline:26,punctualBonus:12,eventDegrees:3},
];
