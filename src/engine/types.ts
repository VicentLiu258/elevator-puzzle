/** 乘客类型：仅外观/表情不同，规则完全相同 */
export type PassengerType = 'office' | 'student' | 'elder'

export interface Passenger {
  id: string
  type: PassengerType
  /** 起点楼层 1–TOTAL_FLOORS */
  from: number
  /** 目的楼层 1–TOTAL_FLOORS */
  to: number
  /** 同层排队顺序，越小越靠前 */
  queueOrder: number
}

export interface LevelConfig {
  id: number
  name: string
  /** 电梯容量 */
  capacity: number
  /** 电梯起始楼层 */
  startFloor: number
  /** 停靠上限（玩家指令长度上限） */
  maxStops: number
  /** 最优解停靠次数（solver 计算，用于星级评定） */
  optimalStops: number
  passengers: Passenger[]
  /** 关卡说明，写明本关规则要点 */
  description?: string
  /** 关卡所属章节 1-4 */
  chapter?: 1 | 2 | 3 | 4
  /**
   * 多波次乘客：waves[0] 为初始乘客（同 passengers），
   * waves[N] 在前 N 波全部送达后出现在各自起点楼层。
   * 若未设置，视为单波次。
   */
  waves?: Passenger[][]
  /** 波次触发说明（UI 展示用） */
  waveHint?: string
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
export const TOTAL_FLOORS = 15

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
