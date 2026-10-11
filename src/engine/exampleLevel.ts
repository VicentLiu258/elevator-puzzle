import type { LevelConfig } from './types'

/**
 * 需求文档示例关卡：容量 2，起始 1 楼，maxStops=4。
 * 乘客 A：1→5；B：3→1；C：5→3。
 * 正确解 [3,5,3,1]。
 */
export const EXAMPLE_LEVEL: LevelConfig = {
  id: 0,
  name: '示例关卡',
  capacity: 2,
  startFloor: 1,
  maxStops: 4,
  description:
    '规则：停靠才上下客；先下后上；满员按排队顺序上车；重复楼层各算一次停靠。',
  passengers: [
    { id: 'A', type: 'office', from: 1, to: 5, queueOrder: 0 },
    { id: 'B', type: 'student', from: 3, to: 1, queueOrder: 0 },
    { id: 'C', type: 'elder', from: 5, to: 3, queueOrder: 0 },
  ],
}

export const EXAMPLE_SOLUTION = [3, 5, 3, 1] as const
