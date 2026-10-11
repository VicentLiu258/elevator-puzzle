/** 乘客类型：仅外观/表情不同，规则完全相同 */
export type PassengerType = 'office' | 'student' | 'elder'

export interface Passenger {
  id: string
  type: PassengerType
  /** 起点楼层 1–5 */
  from: number
  /** 目的楼层 1–5 */
  to: number
  /** 同层排队顺序，越小越靠前 */
  queueOrder: number
}

export interface LevelConfig {
  id: number
  name: string
  /** 电梯容量 */
  capacity: number
  /** 电梯起始楼层（首版全部为 1） */
  startFloor: number
  /** 停靠上限（玩家指令长度上限） */
  maxStops: number
  passengers: Passenger[]
  /** 关卡说明，写明本关规则要点 */
  description?: string
}

export interface StepEvent {
  floor: number
  /** 如「5F：下车 1 人，上车 1 人，当前 2/2」 */
  description: string
  boarded: string[]
  alighted: string[]
  /** 本步因满员未能上车的乘客 id */
  deniedBoarding: string[]
}

export interface SimStep {
  floor: number
  inElevator: Passenger[]
  /** 各层等候乘客（按 queueOrder 从左到右） */
  waiting: Map<number, Passenger[]>
  /** 各层已到站乘客 */
  arrived: Map<number, Passenger[]>
  event: StepEvent
}

export interface UndeliveredInfo {
  passenger: Passenger
  currentFloor: number
}

export interface DeniedEvent {
  step: number
  passenger: Passenger
  floor: number
}

export interface FailureInfo {
  undelivered: UndeliveredInfo[]
  deniedEvents: DeniedEvent[]
}

export interface SimResult {
  steps: SimStep[]
  success: boolean
  failureInfo?: FailureInfo
}

/** 大楼总层数（日后加高只需改此值；UI 按视口分页） */
export const TOTAL_FLOORS = 5

/** 电梯视口一次显示的层数；超过后每 N 层滚一页 */
export const VIEWPORT_FLOORS = 5

export const PASSENGER_EMOJI: Record<PassengerType, string> = {
  office: '💼',
  student: '🎓',
  elder: '👴',
}

/** 到站表情：上班族看手表、学生跳跃、老人微笑点头 */
export const ARRIVAL_EMOJI: Record<PassengerType, string> = {
  office: '⌚',
  student: '🎉',
  elder: '😊',
}
