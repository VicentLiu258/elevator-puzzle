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

  it('分析第 8 关（折返护送）：识别出需要折返且能给出下一步建议', () => {
    const level8 = LEVELS.find((l) => l.id === 8)!
    const hint = analyzeHint(level8, [])
    expect(hint.hasReturn).toBe(true)
    expect(hint.minStops).toBe(5)
    expect(hint.nextFloorHint).toBe(hint.bestSolution[0])

    // 如果玩家填了最优解的第一步，下一步应该顺延给出第二步
    const hintAfterStep1 = analyzeHint(level8, [hint.bestSolution[0]!])
    expect(hintAfterStep1.isPrefixMatching).toBe(true)
    expect(hintAfterStep1.nextFloorHint).toBe(hint.bestSolution[1])
  })
})
