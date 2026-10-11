import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL, EXAMPLE_SOLUTION } from '../engine/exampleLevel'
import { simulate } from '../engine/simulate'
import type { LevelConfig } from '../engine/types'

describe('simulate — 示例关卡', () => {
  it('正确解 [3,5,3,1] 全部送达，并匹配逐步状态', () => {
    const result = simulate(EXAMPLE_LEVEL, [...EXAMPLE_SOLUTION])
    expect(result.success).toBe(true)
    expect(result.steps).toHaveLength(5) // 初始 + 4 次停靠

    // 初始：A 上车，车上 {A}，1/2
    const s0 = result.steps[0]!
    expect(s0.floor).toBe(1)
    expect(s0.inElevator.map((p) => p.id)).toEqual(['A'])
    expect(s0.event.boarded).toEqual(['A'])

    // 停靠 3F：B 上车，车上 {A,B}，2/2
    const s1 = result.steps[1]!
    expect(s1.floor).toBe(3)
    expect(s1.inElevator.map((p) => p.id).sort()).toEqual(['A', 'B'])
    expect(s1.event.boarded).toEqual(['B'])

    // 停靠 5F：A 下车，C 上车，车上 {B,C}，2/2
    const s2 = result.steps[2]!
    expect(s2.floor).toBe(5)
    expect(s2.event.alighted).toEqual(['A'])
    expect(s2.event.boarded).toEqual(['C'])
    expect(s2.inElevator.map((p) => p.id).sort()).toEqual(['B', 'C'])
    expect(s2.arrived.get(5)?.map((p) => p.id)).toEqual(['A'])

    // 停靠 3F：C 下车，车上 {B}，1/2
    const s3 = result.steps[3]!
    expect(s3.floor).toBe(3)
    expect(s3.event.alighted).toEqual(['C'])
    expect(s3.inElevator.map((p) => p.id)).toEqual(['B'])

    // 停靠 1F：B 下车，车上 {}，全部送达
    const s4 = result.steps[4]!
    expect(s4.floor).toBe(1)
    expect(s4.event.alighted).toEqual(['B'])
    expect(s4.inElevator).toHaveLength(0)
  })
})

describe('simulate — 满员排队顺序', () => {
  it('容量满时按 queueOrder 上车，其余原地等待并记录 denied', () => {
    const level: LevelConfig = {
      id: 100,
      name: '满员测试',
      capacity: 1,
      startFloor: 1,
      maxStops: 3,
      passengers: [
        { id: 'P1', type: 'office', from: 2, to: 4, queueOrder: 0 },
        { id: 'P2', type: 'student', from: 2, to: 5, queueOrder: 1 },
        { id: 'P3', type: 'elder', from: 2, to: 3, queueOrder: 2 },
      ],
    }

    const result = simulate(level, [2])
    const step = result.steps[1]!
    expect(step.event.boarded).toEqual(['P1'])
    expect(step.event.deniedBoarding).toEqual(['P2', 'P3'])
    expect(step.inElevator.map((p) => p.id)).toEqual(['P1'])
    expect(step.waiting.get(2)?.map((p) => p.id)).toEqual(['P2', 'P3'])
    expect(
      result.failureInfo?.deniedEvents.some((e) => e.passenger.id === 'P2'),
    ).toBe(true)
  })
})

describe('simulate — 重复楼层停靠', () => {
  it('与当前楼层相同仍算一次停靠，并再次执行下客和上客', () => {
    // 容量 1：初始 A(1→3)。先到 2 接 B(2→2 目的同层会立刻… 用另一设计)
    // A(1→2), B(2→4), C(2→5)。指令 [2,2,4,5]：
    // 停2：A下 B上 C denied；再停2：B 目的4 不下，满员 C 仍 denied → 证明第二次停靠执行了上客检查
    const level: LevelConfig = {
      id: 103,
      name: '重复停靠',
      capacity: 1,
      startFloor: 1,
      maxStops: 4,
      passengers: [
        { id: 'A', type: 'office', from: 1, to: 2, queueOrder: 0 },
        { id: 'B', type: 'student', from: 2, to: 4, queueOrder: 0 },
        { id: 'C', type: 'elder', from: 2, to: 5, queueOrder: 1 },
      ],
    }

    const result = simulate(level, [2, 2, 4, 5])
    expect(result.steps).toHaveLength(5)

    expect(result.steps[1]!.floor).toBe(2)
    expect(result.steps[1]!.event.alighted).toEqual(['A'])
    expect(result.steps[1]!.event.boarded).toEqual(['B'])
    expect(result.steps[1]!.event.deniedBoarding).toEqual(['C'])

    // 第二次停靠同一层：仍执行流程，C 因满员再次 denied
    expect(result.steps[2]!.floor).toBe(2)
    expect(result.steps[2]!.event.deniedBoarding).toEqual(['C'])
    expect(result.steps[2]!.inElevator.map((p) => p.id)).toEqual(['B'])
  })
})

describe('simulate — 失败场景', () => {
  it('指令不足时失败，并报告未送达乘客与所在楼层', () => {
    const result = simulate(EXAMPLE_LEVEL, [3, 5])
    expect(result.success).toBe(false)
    expect(result.failureInfo).toBeDefined()
    const ids = result.failureInfo!.undelivered.map((u) => u.passenger.id).sort()
    expect(ids).toContain('B')
    expect(ids).toContain('C')
    expect(ids).not.toContain('A')
  })

  it('超过 maxStops 抛错', () => {
    expect(() => simulate(EXAMPLE_LEVEL, [1, 2, 3, 4, 5])).toThrow(/停靠上限/)
  })
})

describe('simulate — 边界', () => {
  it('空乘客列表 + 空指令视为成功', () => {
    const level: LevelConfig = {
      id: 200,
      name: '空关',
      capacity: 2,
      startFloor: 1,
      maxStops: 0,
      passengers: [],
    }
    const result = simulate(level, [])
    expect(result.success).toBe(true)
    expect(result.steps).toHaveLength(1)
  })

  it('0 条指令时只有初始上客，未送达则失败', () => {
    const result = simulate(EXAMPLE_LEVEL, [])
    expect(result.success).toBe(false)
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0]!.inElevator.map((p) => p.id)).toEqual(['A'])
  })
})
