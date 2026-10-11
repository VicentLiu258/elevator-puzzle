import { EXAMPLE_LEVEL } from '../engine/exampleLevel'
import type { LevelConfig, Passenger } from '../engine/types'

function p(
  id: string,
  type: Passenger['type'],
  from: number,
  to: number,
  queueOrder = 0,
): Passenger {
  return { id, type, from, to, queueOrder }
}

/**
 * 10 关灰盒版。
 * maxStops 均由 solver 算出的最少停靠次数固化（见 npm run validate）。
 * 第 7 关复用需求文档示例乘客。
 */
export const LEVELS: LevelConfig[] = [
  // —— 1–3：理解「停靠才上下客」，路线直观 ——
  {
    id: 1,
    name: '第一次乘梯',
    capacity: 2,
    startFloor: 1,
    maxStops: 1,
    description: '停靠才会上下客。把乘客送到目的楼层即可。',
    passengers: [p('A', 'office', 1, 3)],
  },
  {
    id: 2,
    name: '中途接人',
    capacity: 2,
    startFloor: 1,
    maxStops: 2,
    description: '乘客不在起始层时，必须先停靠接人，再送到目的地。',
    passengers: [p('A', 'student', 2, 4)],
  },
  {
    id: 3,
    name: '两位乘客',
    capacity: 3,
    startFloor: 1,
    maxStops: 3,
    description: '同向乘客可以一起送；容量足够时一次接完。',
    passengers: [p('A', 'office', 1, 3), p('B', 'elder', 2, 5)],
  },

  // —— 4–6：学会合乘，容量 2 ——
  {
    id: 4,
    name: '合乘入门',
    capacity: 2,
    startFloor: 1,
    maxStops: 3,
    description: '容量只有 2。同向合乘更省停靠次数。',
    passengers: [p('A', 'office', 1, 4), p('B', 'student', 2, 5)],
  },
  {
    id: 5,
    name: '三人对号',
    capacity: 2,
    startFloor: 1,
    maxStops: 4,
    description: '容量 2，三位乘客——安排好接送顺序。',
    passengers: [
      p('A', 'office', 1, 3),
      p('B', 'student', 2, 4),
      p('C', 'elder', 3, 5),
    ],
  },
  {
    id: 6,
    name: '同层排队',
    capacity: 2,
    startFloor: 1,
    maxStops: 4,
    description: '同层多名乘客按排队顺序上车；满员时后面的人要等下次。',
    passengers: [
      p('A', 'office', 1, 5),
      p('B', 'student', 3, 5, 0),
      p('C', 'elder', 3, 4, 1),
    ],
  },

  // —— 7–8：需要折返 ——
  {
    id: 7,
    name: '先上后下',
    capacity: 2,
    startFloor: 1,
    maxStops: 3,
    description:
      '示例关：A 1→5，B 3→1，C 5→3。最优 [5,3,1]；也可合乘折返 [3,5,3,1]（需放宽上限）。',
    passengers: EXAMPLE_LEVEL.passengers,
  },
  {
    id: 8,
    name: '折返护送',
    capacity: 2,
    startFloor: 1,
    maxStops: 5,
    description: '有人要下行、有人要上行，电梯需要折返才能全部送达。',
    passengers: [
      p('A', 'office', 2, 5),
      p('B', 'student', 4, 1),
      p('C', 'elder', 5, 2),
    ],
  },

  // —— 9：先送人再接人（腾位置）——
  {
    id: 9,
    name: '腾出空位',
    capacity: 2,
    startFloor: 1,
    maxStops: 4,
    description: '电梯满了就接不了新人。先把人送到目的地，腾出空位再接。',
    passengers: [
      p('A', 'office', 1, 4),
      p('B', 'student', 1, 5, 1),
      p('C', 'elder', 3, 5),
      p('D', 'office', 4, 2),
    ],
  },

  // —— 10：综合关 ——
  {
    id: 10,
    name: '终极调度',
    capacity: 2,
    startFloor: 1,
    maxStops: 5,
    description: '综合运用合乘、折返与腾位。停靠上限 = 最少停靠次数。',
    passengers: [
      p('A', 'office', 1, 5),
      p('B', 'student', 2, 4),
      p('C', 'elder', 4, 1),
      p('D', 'office', 5, 3),
    ],
  },
]

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find((l) => l.id === id)
}
