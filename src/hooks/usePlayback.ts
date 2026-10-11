import { useCallback, useEffect, useRef, useState } from 'react'
import { simulate } from '../engine/simulate'
import type { LevelConfig, SimResult, SimStep } from '../engine/types'

export type PlaybackMode = 'idle' | 'playing' | 'paused' | 'finished'

const STEP_MS = 1000

export function usePlayback(level: LevelConfig) {
  const [commands, setCommands] = useState<number[]>([])
  const [result, setResult] = useState<SimResult | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [mode, setMode] = useState<PlaybackMode>('idle')
  const timerRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    setResult(null)
    setStepIndex(0)
    setMode('idle')
  }, [clearTimer])

  // 切换关卡时重置
  useEffect(() => {
    setCommands([])
    reset()
  }, [level.id, reset])

  useEffect(() => () => clearTimer(), [clearTimer])

  const addFloor = useCallback(
    (floor: number) => {
      if (mode === 'playing' || mode === 'paused' || mode === 'finished') return
      setCommands((prev) => {
        if (prev.length >= level.maxStops) return prev
        return [...prev, floor]
      })
    },
    [level.maxStops, mode],
  )

  const removeSlot = useCallback(
    (index: number) => {
      if (mode !== 'idle') return
      setCommands((prev) => prev.filter((_, i) => i !== index))
    },
    [mode],
  )

  const clearCommands = useCallback(() => {
    if (mode === 'playing') return
    setCommands([])
    reset()
  }, [mode, reset])

  const run = useCallback(() => {
    if (commands.length === 0) return
    clearTimer()
    const sim = simulate(level, commands)
    setResult(sim)
    setStepIndex(0)
    setMode('playing')

    let idx = 0
    timerRef.current = window.setInterval(() => {
      idx += 1
      if (idx >= sim.steps.length) {
        clearTimer()
        setStepIndex(sim.steps.length - 1)
        setMode('finished')
        return
      }
      setStepIndex(idx)
    }, STEP_MS)
  }, [clearTimer, commands, level])

  const pause = useCallback(() => {
    if (mode !== 'playing') return
    clearTimer()
    setMode('paused')
  }, [clearTimer, mode])

  const resume = useCallback(() => {
    if (mode !== 'paused' || !result) return
    setMode('playing')
    let idx = stepIndex
    timerRef.current = window.setInterval(() => {
      idx += 1
      if (idx >= result.steps.length) {
        clearTimer()
        setStepIndex(result.steps.length - 1)
        setMode('finished')
        return
      }
      setStepIndex(idx)
    }, STEP_MS)
  }, [clearTimer, mode, result, stepIndex])

  const stepForward = useCallback(() => {
    if (!result) return
    clearTimer()
    setMode('paused')
    setStepIndex((i) => {
      const next = Math.min(i + 1, result.steps.length - 1)
      if (next >= result.steps.length - 1) setMode('finished')
      return next
    })
  }, [clearTimer, result])

  const stepBack = useCallback(() => {
    if (!result) return
    clearTimer()
    setMode('paused')
    setStepIndex((i) => Math.max(i - 1, 0))
  }, [clearTimer, result])

  const replay = useCallback(() => {
    if (!result) return
    clearTimer()
    setStepIndex(0)
    setMode('playing')
    let idx = 0
    timerRef.current = window.setInterval(() => {
      idx += 1
      if (idx >= result.steps.length) {
        clearTimer()
        setStepIndex(result.steps.length - 1)
        setMode('finished')
        return
      }
      setStepIndex(idx)
    }, STEP_MS)
  }, [clearTimer, result])

  const currentStep: SimStep | null = result?.steps[stepIndex] ?? null

  return {
    commands,
    result,
    stepIndex,
    mode,
    currentStep,
    addFloor,
    removeSlot,
    clearCommands,
    run,
    pause,
    resume,
    stepForward,
    stepBack,
    replay,
    reset,
  }
}
