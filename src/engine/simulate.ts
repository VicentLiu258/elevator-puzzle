import type {
  DeniedEvent,
  LevelConfig,
  Passenger,
  SimResult,
  SimStep,
  StepEvent,
  UndeliveredInfo,
} from './types'
import { TOTAL_FLOORS } from './types'

function emptyFloorMap<T>(): Map<number, T[]> {
  const m = new Map<number, T[]>()
  for (let f = 1; f <= TOTAL_FLOORS; f++) {
    m.set(f, [])
  }
  return m
}

function cloneFloorMap(src: Map<number, Passenger[]>): Map<number, Passenger[]> {
  const m = new Map<number, Passenger[]>()
  for (const [floor, list] of src) {
    m.set(floor, [...list])
  }
  return m
}

function buildWaiting(passengers: Passenger[]): Map<number, Passenger[]> {
  const waiting = emptyFloorMap<Passenger>()
  for (const p of passengers) {
    waiting.get(p.from)!.push(p)
  }
  // 同层按排队顺序排序
  for (const [, list] of waiting) {
    list.sort((a, b) => a.queueOrder - b.queueOrder)
  }
  return waiting
}

/**
 * 上客：该层等候乘客按排队顺序上车，直到满员，其余原地等待。
 * 已到达目的楼层的乘客不会出现在 waiting 中（不再上车）。
 */
function boardAtFloor(
  floor: number,
  capacity: number,
  inElevator: Passenger[],
  waiting: Map<number, Passenger[]>,
): { boarded: Passenger[]; denied: Passenger[]; nextInElevator: Passenger[] } {
  const queue = [...(waiting.get(floor) ?? [])]
  const boarded: Passenger[] = []
  const denied: Passenger[] = []
  let nextInElevator = [...inElevator]

  for (const p of queue) {
    if (nextInElevator.length < capacity) {
      nextInElevator.push(p)
      boarded.push(p)
    } else {
      denied.push(p)
    }
  }

  waiting.set(
    floor,
    queue.filter((p) => denied.some((d) => d.id === p.id)),
  )

  return { boarded, denied, nextInElevator }
}

/**
 * 下客：目的地等于该层的乘客全部下车，进入 arrived，不再上车。
 */
function alightAtFloor(
  floor: number,
  inElevator: Passenger[],
  arrived: Map<number, Passenger[]>,
): { alighted: Passenger[]; nextInElevator: Passenger[] } {
  const alighted = inElevator.filter((p) => p.to === floor)
  const nextInElevator = inElevator.filter((p) => p.to !== floor)
  if (alighted.length > 0) {
    arrived.set(floor, [...(arrived.get(floor) ?? []), ...alighted])
  }
  return { alighted, nextInElevator }
}

function makeEvent(
  floor: number,
  alighted: Passenger[],
  boarded: Passenger[],
  denied: Passenger[],
  occupancy: number,
  capacity: number,
  prefix?: string,
): StepEvent {
  const parts = [
    `${floor}F：下车 ${alighted.length} 人，上车 ${boarded.length} 人，当前 ${occupancy}/${capacity}`,
  ]
  if (denied.length > 0) {
    parts.push(`满员未上车：${denied.map((p) => p.id).join('、')}`)
  }
  return {
    floor,
    description: prefix ? `${prefix}${parts.join('；')}` : parts.join('；'),
    boarded: boarded.map((p) => p.id),
    alighted: alighted.map((p) => p.id),
    deniedBoarding: denied.map((p) => p.id),
  }
}

function snapshotStep(
  floor: number,
  inElevator: Passenger[],
  waiting: Map<number, Passenger[]>,
  arrived: Map<number, Passenger[]>,
  event: StepEvent,
): SimStep {
  return {
    floor,
    inElevator: [...inElevator],
    waiting: cloneFloorMap(waiting),
    arrived: cloneFloorMap(arrived),
    event,
  }
}

/**
 * 纯函数模拟：输入关卡与指令序列，输出逐步状态。
 *
 * 规则摘要：
 * 1. 开始运行前，电梯在起始楼层，自动接上该层乘客（不计入停靠次数）。
 * 2. 指令是楼层数组，长度 ≤ maxStops；重复楼层各算一次停靠。
 * 3. 每次停靠：移动到该层 → 先下客 → 再上客（按排队顺序，不超过容量）。
 * 4. 经过但未停靠的楼层不上下客。
 * 5. 停靠楼层与当前楼层相同，仍算一次停靠并执行上下客。
 * 6. 成功：全部指令执行完后，每名乘客都在自己的目的楼层。
 * 7. 一旦乘客到达目的楼层，就不再上车。
 */
export function simulate(level: LevelConfig, commands: number[]): SimResult {
  if (commands.length > level.maxStops) {
    throw new Error(`指令长度 ${commands.length} 超过停靠上限 ${level.maxStops}`)
  }

  const waiting = buildWaiting(level.passengers)
  const arrived = emptyFloorMap<Passenger>()
  let floor = level.startFloor
  let inElevator: Passenger[] = []
  const steps: SimStep[] = []
  const deniedEvents: DeniedEvent[] = []

  // —— 初始上客（不计入停靠次数）——
  {
    const { boarded, denied, nextInElevator } = boardAtFloor(
      floor,
      level.capacity,
      inElevator,
      waiting,
    )
    inElevator = nextInElevator
    for (const p of denied) {
      deniedEvents.push({ step: 0, passenger: p, floor })
    }
    steps.push(
      snapshotStep(
        floor,
        inElevator,
        waiting,
        arrived,
        makeEvent(
          floor,
          [],
          boarded,
          denied,
          inElevator.length,
          level.capacity,
          '初始：',
        ),
      ),
    )
  }

  // —— 依次执行玩家指令 ——
  for (let i = 0; i < commands.length; i++) {
    const target = commands[i]!
    // 移动到目标楼层（即使相同也算一次停靠）
    floor = target

    const { alighted, nextInElevator: afterAlight } = alightAtFloor(
      floor,
      inElevator,
      arrived,
    )
    inElevator = afterAlight

    const { boarded, denied, nextInElevator } = boardAtFloor(
      floor,
      level.capacity,
      inElevator,
      waiting,
    )
    inElevator = nextInElevator

    const stepIndex = i + 1 // 步骤编号：初始为 0，第一次停靠为 1
    for (const p of denied) {
      deniedEvents.push({ step: stepIndex, passenger: p, floor })
    }

    steps.push(
      snapshotStep(
        floor,
        inElevator,
        waiting,
        arrived,
        makeEvent(floor, alighted, boarded, denied, inElevator.length, level.capacity),
      ),
    )
  }

  // —— 判定成功：每名乘客都在自己的目的楼层 ——
  const arrivedIds = new Set<string>()
  for (const [, list] of arrived) {
    for (const p of list) {
      arrivedIds.add(p.id)
    }
  }
  const success = level.passengers.every((p) => arrivedIds.has(p.id))

  if (success) {
    return { steps, success: true }
  }

  // 失败：指出没送达的乘客、所在楼层、满员未上车记录
  const undelivered: UndeliveredInfo[] = []
  for (const p of level.passengers) {
    if (arrivedIds.has(p.id)) continue
    if (inElevator.some((e) => e.id === p.id)) {
      undelivered.push({ passenger: p, currentFloor: floor })
    } else {
      for (const [f, list] of waiting) {
        if (list.some((w) => w.id === p.id)) {
          undelivered.push({ passenger: p, currentFloor: f })
          break
        }
      }
    }
  }

  return {
    steps,
    success: false,
    failureInfo: { undelivered, deniedEvents },
  }
}
