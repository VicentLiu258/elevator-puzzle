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
  /** 当前激活波次索引 */
  waveIndex: number
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

/** 注入新波次乘客到等候队列 */
function injectWave(wave: Passenger[], waiting: Map<number, Passenger[]>): void {
  for (const p of wave) {
    const queue = waiting.get(p.from)
    if (queue) {
      queue.push(p)
      queue.sort((a, b) => a.queueOrder - b.queueOrder)
    } else {
      waiting.set(p.from, [p])
    }
  }
}

/** 检查某波乘客是否全部送达 */
function isWaveDelivered(wave: Passenger[], arrived: Set<string>): boolean {
  return wave.every((p) => arrived.has(p.id))
}

/** 下客：目的地等于该层的乘客下车 */
function applyAlight(
  floor: number,
  inElevator: Passenger[],
  arrived: Set<string>,
): { inElevator: Passenger[]; arrived: Set<string> } {
  const nextArrived = new Set(arrived)
  const nextIn = inElevator.filter((p) => {
    if (p.to === floor) {
      nextArrived.add(p.id)
      return false
    }
    return true
  })
  return { inElevator: nextIn, arrived: nextArrived }
}

/** 上客：按排队顺序上车直到满员 */
function applyBoard(
  floor: number,
  capacity: number,
  inElevator: Passenger[],
  waiting: Map<number, Passenger[]>,
): { inElevator: Passenger[]; waiting: Map<number, Passenger[]> } {
  const nextWaiting = cloneWaiting(waiting)
  let nextIn = [...inElevator]
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
  return { inElevator: nextIn, waiting: nextWaiting }
}

/**
 * 下客后检查波次推进，注入后续波乘客到 waiting。
 * 返回推进后的 waveIndex。
 */
function advanceWaves(
  waves: Passenger[][],
  waveIndex: number,
  waiting: Map<number, Passenger[]>,
  arrived: Set<string>,
): number {
  let wi = waveIndex
  while (wi < waves.length - 1) {
    if (!isWaveDelivered(waves[wi]!, arrived)) break
    wi++
    injectWave(waves[wi]!, waiting)
  }
  return wi
}

/**
 * 完整停靠：下客 → 波次推进 → 上客（与 simulate.ts 一致）
 */
function applyFullStop(
  floor: number,
  capacity: number,
  inElevator: Passenger[],
  waiting: Map<number, Passenger[]>,
  arrived: Set<string>,
  waves: Passenger[][],
  waveIndex: number,
): {
  inElevator: Passenger[]
  waiting: Map<number, Passenger[]>
  arrived: Set<string>
  waveIndex: number
} {
  // 1. 下客
  const alight = applyAlight(floor, inElevator, arrived)
  // 2. 波次推进（下客后、上客前）
  const clonedWaiting = cloneWaiting(waiting)
  const newWaveIndex = advanceWaves(waves, waveIndex, clonedWaiting, alight.arrived)
  // 3. 上客
  const board = applyBoard(floor, capacity, alight.inElevator, clonedWaiting)
  return {
    inElevator: board.inElevator,
    waiting: board.waiting,
    arrived: alight.arrived,
    waveIndex: newWaveIndex,
  }
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
 * 状态：(电梯楼层, 车上乘客, 等候乘客, 已送达, 当前波次, 已用停靠数)
 */
export function solve(
  level: LevelConfig,
  options?: { maxSolutions?: number; searchLimit?: number },
): SolveResult {
  const maxSolutions = options?.maxSolutions ?? 20
  const searchLimit = options?.searchLimit ?? level.maxStops + 8

  const waves = level.waves && level.waves.length > 0 ? level.waves : [level.passengers]
  const allPax = waves.flat()
  const total = allPax.length

  // 只搜乘客出发/目的楼层 + 起始层
  const relevant = new Set<number>()
  for (const p of allPax) {
    relevant.add(p.from)
    relevant.add(p.to)
  }
  relevant.add(level.startFloor)
  const searchFloors = [...relevant].sort((a, b) => a - b)

  const waiting0 = buildInitialWaiting(waves[0]!)
  // 初始上客（不计入停靠）——只做上客，不走 alight→wave→board 全流程
  const initBoard = applyBoard(level.startFloor, level.capacity, [], waiting0)
  const initArrived = new Set<string>()
  const initWaveIndex = advanceWaves(waves, 0, initBoard.waiting, initArrived)

  if (initArrived.size === total && initBoard.inElevator.length === 0) {
    return { minStops: 0, solutions: [[]], hasReturn: false }
  }

  const start: SearchState = {
    floor: level.startFloor,
    inElevatorKey: idsKey(initBoard.inElevator),
    waitingKey: waitingKey(initBoard.waiting),
    arrivedKey: [...initArrived].sort().join(','),
    waveIndex: initWaveIndex,
    stopsUsed: 0,
    path: [],
    inElevator: initBoard.inElevator,
    waiting: initBoard.waiting,
    arrived: initArrived,
  }

  const queue: SearchState[] = [start]
  const visited = new Set<string>([
    `${start.floor}|${start.waveIndex}|${start.inElevatorKey}|${start.waitingKey}|${start.arrivedKey}`,
  ])

  let minStops = Infinity
  const solutions: number[][] = []

  while (queue.length > 0) {
    const cur = queue.shift()!
    if (cur.stopsUsed >= searchLimit) continue
    if (cur.stopsUsed >= minStops) continue

    for (const nextFloor of searchFloors) {
      // 下客 → 波次推进 → 上客（与 simulate 一致）
      const applied = applyFullStop(
        nextFloor,
        level.capacity,
        cur.inElevator,
        cur.waiting,
        cur.arrived,
        waves,
        cur.waveIndex,
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
      const vKey = `${nextFloor}|${applied.waveIndex}|${inKey}|${wKey}|${aKey}`
      if (visited.has(vKey)) continue
      visited.add(vKey)

      queue.push({
        floor: nextFloor,
        inElevatorKey: inKey,
        waitingKey: wKey,
        arrivedKey: aKey,
        waveIndex: applied.waveIndex,
        stopsUsed,
        path,
        inElevator: applied.inElevator,
        waiting: applied.waiting,
        arrived: applied.arrived,
      })
    }
  }

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
