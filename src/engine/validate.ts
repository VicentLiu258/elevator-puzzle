/**
 * 关卡验证逻辑（可被测试或脚本复用）。
 * CLI 入口见 scripts/validate.ts → npm run validate
 */
import { LEVELS } from '../data/levels'
import { solve, verifySolution } from './solver'
import type { LevelConfig } from './types'

export interface LevelValidation {
  id: number
  name: string
  configuredMaxStops: number
  minStops: number
  solutionCount: number
  hasReturn: boolean
  maxStopsMatchesMin: boolean
  sampleSolution?: number[]
  sampleOk?: boolean
}

export function validateLevels(levels: LevelConfig[] = LEVELS): LevelValidation[] {
  return levels.map((level) => {
    const result = solve({ ...level, maxStops: 12 }, { maxSolutions: 50, searchLimit: 12 })
    const sample = result.solutions[0]
    const sampleOk =
      sample !== undefined
        ? verifySolution(
            { ...level, maxStops: Math.max(level.maxStops, sample.length) },
            sample,
          )
        : false

    return {
      id: level.id,
      name: level.name,
      configuredMaxStops: level.maxStops,
      minStops: result.minStops,
      solutionCount: result.solutions.length,
      hasReturn: result.hasReturn,
      maxStopsMatchesMin: level.maxStops === result.minStops,
      sampleSolution: sample,
      sampleOk,
    }
  })
}

export function printValidation(rows: LevelValidation[]): void {
  console.log('\n=== 关卡验证报告 ===\n')
  for (const r of rows) {
    const minLabel = Number.isFinite(r.minStops) ? String(r.minStops) : '无解'
    console.log(
      `关卡 ${r.id}「${r.name}」: 最少停靠=${minLabel}, 可行解数=${r.solutionCount}, 折返=${r.hasReturn ? '是' : '否'}, 配置 maxStops=${r.configuredMaxStops}${r.maxStopsMatchesMin ? ' ✓' : ' ⚠ 与最少次数不一致'}, 样例解=${JSON.stringify(r.sampleSolution)} 校验=${r.sampleOk ? '通过' : '失败'}`,
    )
  }
  console.log('')
}
