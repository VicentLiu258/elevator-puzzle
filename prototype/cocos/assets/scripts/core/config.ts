/** All timing is in seconds, mass in kg, angles in degrees. Arcade rules only. */
export const CONFIG = {
  version: 1, daySeconds: 270, fixedStep: 1 / 60, maxFrame: .25,
  normalMass: 300, maxMass: 450, queueLimit: 5,
  closingSeconds: 3, reopeningSeconds: 1.5, stoppingSeconds: .8,
  arrivalOpeningSeconds: 1, unloadingSeconds: 1.2, resultSeconds: 6,
  shiftLimit: .24, shiftRate: 3, tiltTargetDegrees: 13, maxTargetDegrees: 17,
  springStiffness: 14, springDamping: 7, tiltWarning: 7, tiltDanger: 11,
  dangerSeconds: 2.5, dangerRecovery: 2, highCenterFactor: .18, coachDamping: .5,
  overloadSpeedFactor: 1.2, loadRate: 6, loadRecovery: 8, loadLimit: 100,
  smoothBonus: 5, smoothWarningSeconds: .6, courierBonus: 3,
  overloadMaintenance: 8, emergencyFareRatio: .5, emergencyMaintenance: 12,
  emergencyStopSeconds: 4, eventWarningSeconds: 1.2, eventDuration: 1.5,
  defaultSeed: 20261028,
} as const;
export type PassengerKind = 'student' | 'office' | 'courier' | 'traveller' | 'mover' | 'coach';
export interface Passenger { id: string; kind: PassengerKind; name: string; mass: number; size: 1|2; fare: number; trait: string; patience: number; maxPatience: number; }
export const PASSENGER_TYPES: Record<PassengerKind, Omit<Passenger,'id'>> = {
  student:{kind:'student',name:'学生',mass:45,size:1,fare:8,trait:'耐心较长',patience:48,maxPatience:48},
  office:{kind:'office',name:'上班族',mass:65,size:1,fare:12,trait:'等待耐心较短',patience:22,maxPatience:22},
  courier:{kind:'courier',name:'外卖员',mass:75,size:1,fare:15,trait:'准时送达额外奖 ¥3',patience:30,maxPatience:30},
  traveller:{kind:'traveller',name:'旅行客',mass:90,size:1,fare:18,trait:'行李重心较高',patience:38,maxPatience:38},
  mover:{kind:'mover',name:'搬家客',mass:130,size:2,fare:30,trait:'货物横向占相邻两格',patience:42,maxPatience:42},
  coach:{kind:'coach',name:'健身教练',mass:100,size:1,fare:20,trait:'站姿稳定，减小途中扰动',patience:38,maxPatience:38},
};
