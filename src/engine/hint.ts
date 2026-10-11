import { solve } from './solver'
import type { LevelConfig } from './types'

export interface HintAnalysis {
  /** 最少停靠次数 */
  minStops: number
  /** 是否需要折返调头 */
  hasReturn: boolean
  /** 可行最优解总数 */
  solutionsCount: number
  /** 首条推荐最优解 */
  bestSolution: number[]
  /** 推荐下一步停靠楼层 */
  nextFloorHint: number | null
  /** 玩家当前指令是否与某一最优解前缀完全吻合 */
  isPrefixMatching: boolean
  /** 当前吻合或最推荐的最优解 */
  matchedSolution: number[]
  /** 战术与思路指引条目 */
  tactics: string[]
}

/**
 * 分析当前关卡与玩家输入，给出多层次求助建议
 */
export function analyzeHint(level: LevelConfig, currentCommands: number[]): HintAnalysis {
  // 求解器计算最优解
  const searchLevel = { ...level, maxStops: Math.max(level.maxStops, 20) }
  const result = solve(searchLevel, { searchLimit: 18, maxSolutions: 50 })
  const solutions = result.solutions.length > 0 ? result.solutions : []
  const bestSolution = solutions[0] ?? []

  // 寻找与玩家当前输入前缀匹配度最高的最优解
  let matchedSolution = bestSolution
  let maxMatchLength = -1

  for (const sol of solutions) {
    let matchLen = 0
    while (
      matchLen < currentCommands.length &&
      matchLen < sol.length &&
      currentCommands[matchLen] === sol[matchLen]
    ) {
      matchLen++
    }
    if (matchLen > maxMatchLength) {
      maxMatchLength = matchLen
      matchedSolution = sol
    }
  }

  const isPrefixMatching = currentCommands.length === 0 || maxMatchLength === currentCommands.length

  // 推荐下一步楼层
  let nextFloorHint: number | null = null
  if (isPrefixMatching && currentCommands.length < matchedSolution.length) {
    nextFloorHint = matchedSolution[currentCommands.length] ?? null
  } else if (!isPrefixMatching && matchedSolution.length > 0) {
    // 偏离时，给出推荐解对应的该步
    const targetIdx = Math.min(currentCommands.length, matchedSolution.length - 1)
    nextFloorHint = matchedSolution[targetIdx] ?? matchedSolution[0] ?? null
  }

  // 战术建议
  const tactics: string[] = []
  tactics.push(`最少需停靠 ${result.minStops} 站（关卡上限为 ${level.maxStops} 站）。`)

  if (result.hasReturn) {
    tactics.push(`⚠️ 需要折返：不可单向开到底，中途需调头接送或折返腾位。`)
  } else {
    tactics.push(`💡 单向调度：顺路梯次接送即可通关，无需大幅折返。`)
  }

  if (level.capacity === 2 && level.passengers.length >= 3) {
    tactics.push(`👥 容量博弈：轿厢限载 2 人。先去送达目的地近的乘客以腾出轿厢空位，再回头接其他等候乘客。`)
  } else if (level.capacity >= 3) {
    tactics.push(`🚀 大容量调度：电梯可容纳 ${level.capacity} 人，可同时搭载多人合乘。`)
  }

  const floorCounts = new Map<number, number>()
  for (const p of level.passengers) {
    floorCounts.set(p.from, (floorCounts.get(p.from) ?? 0) + 1)
  }
  const hasMultipleInFloor = [...floorCounts.values()].some((c) => c > 1)
  if (hasMultipleInFloor) {
    tactics.push(`🚪 靠门先上：同层多人等候时，排在队首（更靠近电梯门）的乘客先登梯。`)
  }

  return {
    minStops: result.minStops,
    hasReturn: result.hasReturn,
    solutionsCount: solutions.length,
    bestSolution,
    nextFloorHint,
    isPrefixMatching,
    matchedSolution,
    tactics,
  }
}
