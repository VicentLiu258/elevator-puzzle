import { useCallback, useState } from 'react'

const STORAGE_KEY = 'elevator-puzzle-cleared'
const STARS_KEY = 'elevator-puzzle-stars'

function readCleared(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is number => typeof x === 'number'))
  } catch {
    return new Set()
  }
}

function writeCleared(ids: Set<number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

function readStars(): Map<number, number> {
  try {
    const raw = localStorage.getItem(STARS_KEY)
    if (!raw) return new Map()
    const obj = JSON.parse(raw) as unknown
    if (typeof obj !== 'object' || obj === null) return new Map()
    const m = new Map<number, number>()
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const id = Number(k)
      if (!Number.isNaN(id) && typeof v === 'number' && v >= 1 && v <= 3) {
        m.set(id, v)
      }
    }
    return m
  } catch {
    return new Map()
  }
}

function writeStars(stars: Map<number, number>): void {
  const obj: Record<string, number> = {}
  for (const [k, v] of stars) obj[String(k)] = v
  localStorage.setItem(STARS_KEY, JSON.stringify(obj))
}

/** 根据实际停靠次数和最优次数计算星级 */
export function computeStars(stopsUsed: number, optimalStops: number): 1 | 2 | 3 {
  if (stopsUsed <= optimalStops) return 3
  if (stopsUsed <= optimalStops + 1) return 2
  return 1
}

export function useProgress() {
  const [cleared, setCleared] = useState<Set<number>>(() => readCleared())
  const [starsMap, setStarsMap] = useState<Map<number, number>>(() => readStars())

  const markCleared = useCallback((levelId: number) => {
    setCleared((prev) => {
      if (prev.has(levelId)) return prev
      const next = new Set(prev)
      next.add(levelId)
      writeCleared(next)
      return next
    })
  }, [])

  const markStars = useCallback((levelId: number, stars: 1 | 2 | 3) => {
    setStarsMap((prev) => {
      const existing = prev.get(levelId) ?? 0
      if (stars <= existing) return prev
      const next = new Map(prev)
      next.set(levelId, stars)
      writeStars(next)
      return next
    })
  }, [])

  const isCleared = useCallback((levelId: number) => cleared.has(levelId), [cleared])

  const getBestStars = useCallback(
    (levelId: number): number => starsMap.get(levelId) ?? 0,
    [starsMap],
  )

  /** 关卡解锁：示例关(0)与第 1 关始终可玩；其余需通关前一关 */
  const isUnlocked = useCallback(
    (levelId: number) =>
      levelId === 0 || levelId === 1 || cleared.has(levelId - 1) || cleared.has(levelId),
    [cleared],
  )

  return { cleared, markCleared, isCleared, isUnlocked, markStars, getBestStars }
}
