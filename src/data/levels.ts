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
 * 25 关灰盒版（大楼 15 层）。
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

  // —— 11–15：进阶组合 ——
  {
    id: 11,
    name: '满员博弈',
    capacity: 2,
    startFloor: 1,
    maxStops: 4,
    description: '四人等电梯、容量只有 2。谁先上、谁后上，满员时会卡住。',
    passengers: [
      p('A', 'office', 1, 3),
      p('B', 'student', 1, 5, 1),
      p('C', 'elder', 2, 4),
      p('D', 'office', 4, 5),
    ],
  },
  {
    id: 12,
    name: '双向交错',
    capacity: 2,
    startFloor: 1,
    maxStops: 6,
    description: '上行与下行乘客交错分布，需要多次折返才能全部送达。',
    passengers: [
      p('A', 'office', 1, 4),
      p('B', 'student', 2, 5),
      p('C', 'elder', 3, 1),
      p('D', 'office', 5, 2),
      p('E', 'student', 4, 3),
    ],
  },
  {
    id: 13,
    name: '高峰拼车',
    capacity: 2,
    startFloor: 1,
    maxStops: 5,
    description: '多层出发、不同目的地。尽量合乘，减少空跑。',
    passengers: [
      p('A', 'office', 1, 5),
      p('B', 'student', 2, 3),
      p('C', 'elder', 3, 5),
      p('D', 'office', 4, 1),
    ],
  },
  {
    id: 14,
    name: '连环腾位',
    capacity: 2,
    startFloor: 1,
    maxStops: 6,
    description: '需要多轮「先送人腾位，再回来接人」。容量始终紧张。',
    passengers: [
      p('A', 'office', 1, 5),
      p('B', 'student', 1, 4, 1),
      p('C', 'elder', 2, 5),
      p('D', 'office', 3, 1),
      p('E', 'student', 5, 2),
    ],
  },
  {
    id: 15,
    name: '低区综合',
    capacity: 2,
    startFloor: 1,
    maxStops: 6,
    description: '综合合乘、折返、腾位与排队。停靠上限刚好等于最少次数。',
    passengers: [
      p('A', 'office', 1, 3),
      p('B', 'student', 2, 5),
      p('C', 'elder', 3, 1),
      p('D', 'office', 4, 2),
      p('E', 'student', 5, 4),
    ],
  },

  // —— 16–18：初探高楼（6–10 层）——
  {
    id: 16,
    name: '直上高区',
    capacity: 2,
    startFloor: 1,
    maxStops: 1,
    description: '大楼有 15 层了。先把乘客送到中高区。',
    passengers: [p('A', 'office', 1, 8)],
  },
  {
    id: 17,
    name: '高区接送',
    capacity: 2,
    startFloor: 1,
    maxStops: 2,
    description: '乘客在 6 楼等，要去 10 楼。先上去接人。',
    passengers: [p('A', 'student', 6, 10)],
  },
  {
    id: 18,
    name: '中层合乘',
    capacity: 3,
    startFloor: 1,
    maxStops: 3,
    description: '两人同向上高区，容量足够可以一起送。',
    passengers: [p('A', 'office', 1, 9), p('B', 'elder', 4, 10)],
  },

  // —— 19–21：高低穿梭（跨越 1–10）——
  {
    id: 19,
    name: '高低折返',
    capacity: 2,
    startFloor: 1,
    maxStops: 5,
    description: '有人要上高区，有人要从高区下来，需要折返。',
    passengers: [
      p('A', 'office', 1, 9),
      p('B', 'student', 7, 2),
      p('C', 'elder', 4, 10),
    ],
  },
  {
    id: 20,
    name: '长途护送',
    capacity: 2,
    startFloor: 1,
    maxStops: 7,
    description: '跨越 1–10 层的接送：注意容量与折返时机。',
    passengers: [
      p('A', 'office', 2, 10),
      p('B', 'student', 8, 1),
      p('C', 'elder', 5, 9),
      p('D', 'office', 10, 3),
    ],
  },
  {
    id: 21,
    name: '中高腾位',
    capacity: 2,
    startFloor: 1,
    maxStops: 6,
    description: '满员后要先送人腾位，才能接高区等候的人。',
    passengers: [
      p('A', 'office', 1, 8),
      p('B', 'student', 1, 6, 1),
      p('C', 'elder', 5, 10),
      p('D', 'office', 9, 2),
    ],
  },

  // —— 22–24：满楼调度（1–15）——
  {
    id: 22,
    name: '顶层特快',
    capacity: 2,
    startFloor: 1,
    maxStops: 5,
    description: '有人直达 15 楼，沿途还有人要上下。',
    passengers: [
      p('A', 'office', 1, 15),
      p('B', 'student', 6, 12),
      p('C', 'elder', 10, 3),
    ],
  },
  {
    id: 23,
    name: '全楼穿梭',
    capacity: 2,
    startFloor: 1,
    maxStops: 7,
    description: '乘客分布在低中高三区，需要长途折返与合乘。',
    passengers: [
      p('A', 'office', 1, 12),
      p('B', 'student', 4, 15),
      p('C', 'elder', 8, 2),
      p('D', 'office', 14, 5),
    ],
  },
  {
    id: 24,
    name: '高峰全楼',
    capacity: 2,
    startFloor: 1,
    maxStops: 8,
    description: '五人分布全域，容量 2。多轮腾位与折返。',
    passengers: [
      p('A', 'office', 1, 10),
      p('B', 'student', 3, 15),
      p('C', 'elder', 7, 1),
      p('D', 'office', 12, 4),
      p('E', 'student', 15, 8),
    ],
  },

  // —— 25：终极全楼 ——
  {
    id: 25,
    name: '摩天挑战',
    capacity: 2,
    startFloor: 1,
    maxStops: 11,
    description: '15 层大楼终极关。综合全部技巧，停靠上限 = 最少次数。',
    passengers: [
      p('A', 'office', 1, 15),
      p('B', 'student', 2, 9),
      p('C', 'elder', 5, 12),
      p('D', 'office', 8, 1),
      p('E', 'student', 11, 3),
      p('F', 'elder', 14, 6),
    ],
  },
]

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find((l) => l.id === id)
}
