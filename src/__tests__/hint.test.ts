import { describe, expect, it } from 'vitest'
import { LEVELS } from '../data/levels'
import { EXAMPLE_LEVEL } from '../engine/exampleLevel'
import { analyzeHint } from '../engine/hint'

describe('hint 求助分析器', () => {
  it('分析示例关卡：给出正确的策略与最优解', () => {
    const hint = analyzeHint(EXAMPLE_LEVEL, [])
    expect(hint.minStops).toBe(3)
    expect(hint.hasReturn).toBe(true)
    expect(hint.bestSolution.length).toBe(3)
    expect(hint.nextFloorHint).not.toBeNull()
    expect(hint.tactics.length).toBeGreaterThan(0)
  })

  it('分析第 10 关（入门毕业）：识别出需要折返且能给出下一步建议', () => {
    const level10 = LEVELS.find((l) => l.id === 10)!
    const hint = analyzeHint(level10, [])
    expect(hint.hasReturn).toBe(true)
    expect(hint.minStops).toBe(5)
    expect(hint.nextFloorHint).toBe(hint.bestSolution[0])

    const hintAfterStep1 = analyzeHint(level10, [hint.bestSolution[0]!])
    expect(hintAfterStep1.isPrefixMatching).toBe(true)
    expect(hintAfterStep1.nextFloorHint).toBe(hint.bestSolution[1])
  })
})
