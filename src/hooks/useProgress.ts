import { useCallback, useState } from 'react'

const STORAGE_KEY = 'elevator-puzzle-cleared'

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

export function useProgress() {
  const [cleared, setCleared] = useState<Set<number>>(() => readCleared())

  const markCleared = useCallback((levelId: number) => {
    setCleared((prev) => {
      if (prev.has(levelId)) return prev
      const next = new Set(prev)
      next.add(levelId)
      writeCleared(next)
      return next
    })
  }, [])

  const isCleared = useCallback((levelId: number) => cleared.has(levelId), [cleared])

  /** 关卡解锁：第 1 关始终可玩；其余需通关前一关 */
  const isUnlocked = useCallback(
    (levelId: number) => levelId === 1 || cleared.has(levelId - 1) || cleared.has(levelId),
    [cleared],
  )

  return { cleared, markCleared, isCleared, isUnlocked }
}
