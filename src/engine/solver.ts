import { simulate } from './simulate'
import type { LevelConfig, Passenger } from './types'
import { TOTAL_FLOORS } from './types'

export interface SolveResult {
  /** 最少停靠次数；无解为 Infinity */
  minStops: number
  /** 达到最少停靠次数的可行解（最多收集若干条） */
  solutions: number[][]
  /** 是否所有最优解都需要折返（从起始楼层起方向发生改变） */
  hasReturn: boolean
}

interface SearchState {
  floor: number
  /** 车上乘客 id，排序后拼接 */
  inElevatorKey: string
  /** 等候：floor:id,id|floor:id */
  waitingKey: string
  /** 已送达乘客 id 集合 key */
  arrivedKey: string
  stopsUsed: number
  path: number[]
  inElevator: Passenger[]
  waiting: Map<number, Passenger[]>
  arrived: Set<string>
}

function idsKey(passengers: Passenger[]): string {
  return passengers
    .map((p) => p.id)
    .sort()
    .join(',')
}

function waitingKey(waiting: Map<number, Passenger[]>): string {
  const parts: string[] = []
  for (let f = 1; f <= TOTAL_FLOORS; f++) {
    const list = waiting.get(f) ?? []
    if (list.length > 0) {
      parts.push(`${f}:${idsKey(list)}`)
    }
  }
  return parts.join('|')
}

function cloneWaiting(src: Map<number, Passenger[]>): Map<number, Passenger[]> {
  const m = new Map<number, Passenger[]>()
  for (const [floor, list] of src) {
    m.set(floor, [...list])
  }
  return m
}

function buildInitialWaiting(passengers: Passenger[]): Map<number, Passenger[]> {
  const waiting = new Map<number, Passenger[]>()
  for (let f = 1; f <= TOTAL_FLOORS; f++) {
    waiting.set(f, [])
  }
  for (const p of passengers) {
    waiting.get(p.from)!.push(p)
  }
  for (const [, list] of waiting) {
    list.sort((a, b) => a.queueOrder - b.queueOrder)
  }
  return waiting
}

/** 在某层执行一次停靠：先下后上 */
function applyStop(
  floor: number,
  capacity: number,
  inElevator: Passenger[],
  waiting: Map<number, Passenger[]>,
  arrived: Set<string>,
): { inElevator: Passenger[]; waiting: Map<number, Passenger[]>; arrived: Set<string> } {
  const nextWaiting = cloneWaiting(waiting)
  const nextArrived = new Set(arrived)

  // 下客
  let nextIn = inElevator.filter((p) => {
    if (p.to === floor) {
      nextArrived.add(p.id)
      return false
    }
    return true
  })

  // 上客
  const queue = [...(nextWaiting.get(floor) ?? [])]
  const remain: Passenger[] = []
  for (const p of queue) {
    if (nextIn.length < capacity) {
      nextIn = [...nextIn, p]
    } else {
      remain.push(p)
    }
  }
  nextWaiting.set(floor, remain)

  return { inElevator: nextIn, waiting: nextWaiting, arrived: nextArrived }
}

/** 从起始楼层开始看指令序列是否发生方向改变（折返） */
function hasDirectionChange(path: number[], startFloor: number): boolean {
  const full = [startFloor, ...path]
  if (full.length < 3) return false
  let prevDir = 0
  for (let i = 1; i < full.length; i++) {
    const dir = Math.sign(full[i]! - full[i - 1]!)
    if (dir === 0) continue
    if (prevDir !== 0 && dir !== prevDir) return true
    prevDir = dir
  }
  return false
}

/**
 * BFS 搜索最少停靠序列。
 * 状态：(电梯楼层, 车上乘客, 等候乘客, 已送达, 已用停靠数)
 */
export function solve(
  level: LevelConfig,
  options?: { maxSolutions?: number; searchLimit?: number },
): SolveResult {
  const maxSolutions = options?.maxSolutions ?? 20
  const searchLimit = options?.searchLimit ?? level.maxStops + 8
  const total = level.passengers.length

  const waiting0 = buildInitialWaiting(level.passengers)
  // 初始上客（不计入停靠）
  const init = applyStop(
    level.startFloor,
    level.capacity,
    [],
    waiting0,
    new Set(),
  )

  if (init.arrived.size === total && init.inElevator.length === 0) {
    // 全部已在起点且目的地就是起点（极少见）
    return { minStops: 0, solutions: [[]], hasReturn: false }
  }

  const start: SearchState = {
    floor: level.startFloor,
    inElevatorKey: idsKey(init.inElevator),
    waitingKey: waitingKey(init.waiting),
    arrivedKey: [...init.arrived].sort().join(','),
    stopsUsed: 0,
    path: [],
    inElevator: init.inElevator,
    waiting: init.waiting,
    arrived: init.arrived,
  }

  const queue: SearchState[] = [start]
  // 同一乘客分布 + 楼层只访问一次（与 stops 无关，因 BFS 先到更优）
  const visited = new Set<string>([
    `${start.floor}|${start.inElevatorKey}|${start.waitingKey}|${start.arrivedKey}`,
  ])

  let minStops = Infinity
  const solutions: number[][] = []

  while (queue.length > 0) {
    const cur = queue.shift()!
    if (cur.stopsUsed >= searchLimit) continue
    if (cur.stopsUsed >= minStops) continue

    for (let nextFloor = 1; nextFloor <= TOTAL_FLOORS; nextFloor++) {
      const applied = applyStop(
        nextFloor,
        level.capacity,
        cur.inElevator,
        cur.waiting,
        cur.arrived,
      )
      const path = [...cur.path, nextFloor]
      const stopsUsed = cur.stopsUsed + 1

      if (applied.arrived.size === total && applied.inElevator.length === 0) {
        if (stopsUsed < minStops) {
          minStops = stopsUsed
          solutions.length = 0
          solutions.push(path)
        } else if (stopsUsed === minStops && solutions.length < maxSolutions) {
          solutions.push(path)
        }
        continue
      }

      if (stopsUsed >= searchLimit) continue
      if (stopsUsed >= minStops) continue

      const inKey = idsKey(applied.inElevator)
      const wKey = waitingKey(applied.waiting)
      const aKey = [...applied.arrived].sort().join(',')
      const vKey = `${nextFloor}|${inKey}|${wKey}|${aKey}`
      if (visited.has(vKey)) continue
      visited.add(vKey)

      queue.push({
        floor: nextFloor,
        inElevatorKey: inKey,
        waitingKey: wKey,
        arrivedKey: aKey,
        stopsUsed,
        path,
        inElevator: applied.inElevator,
        waiting: applied.waiting,
        arrived: applied.arrived,
      })
    }
  }

  // 若没有任何「无折返」的最优解，则视为本关需要折返
  const hasReturn =
    solutions.length > 0 &&
    solutions.every((s) => hasDirectionChange(s, level.startFloor))
  return { minStops, solutions, hasReturn }
}

/** 用 simulate 校验某条指令是否通关 */
export function verifySolution(level: LevelConfig, commands: number[]): boolean {
  if (commands.length > level.maxStops) return false
  return simulate(level, commands).success
}
