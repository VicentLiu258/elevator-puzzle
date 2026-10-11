import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL, EXAMPLE_SOLUTION } from '../engine/exampleLevel'
import { simulate } from '../engine/simulate'
import { solve, verifySolution } from '../engine/solver'

describe('solver — 示例关卡', () => {
  it('最少停靠次数为 3（最优解 [5,3,1]）', () => {
    // 需求文档 [3,5,3,1] 是可行解但非最少；按规则最优为 3
    const level = { ...EXAMPLE_LEVEL, maxStops: 6 }
    const result = solve(level, { searchLimit: 6, maxSolutions: 50 })
    expect(result.minStops).toBe(3)
    expect(result.solutions).toContainEqual([5, 3, 1])
  })

  it('需求文档解 [3,5,3,1] 仍可通过 simulate', () => {
    expect(simulate(EXAMPLE_LEVEL, [...EXAMPLE_SOLUTION]).success).toBe(true)
    expect(verifySolution(EXAMPLE_LEVEL, [...EXAMPLE_SOLUTION])).toBe(true)
  })

  it('最优解必须折返（从 1F 先上后下）', () => {
    const level = { ...EXAMPLE_LEVEL, maxStops: 6 }
    const result = solve(level, { searchLimit: 6, maxSolutions: 50 })
    expect(result.hasReturn).toBe(true)
  })
})
