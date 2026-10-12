import { useCallback, useEffect, useRef, useState } from 'react'
import { simulate } from '../engine/simulate'
import type { LevelConfig, SimResult, SimStep } from '../engine/types'

export type PlaybackMode = 'idle' | 'playing' | 'paused' | 'finished'

const STEP_MS = 1250

export function usePlayback(level: LevelConfig) {
  const [commands, setCommands] = useState<number[]>([])
  const [result, setResult] = useState<SimResult | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [mode, setMode] = useState<PlaybackMode>('idle')
  const timerRef = useRef<number | null>(null)
  const levelIdRef = useRef(level.id)

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

  // 切换关卡时同步重置，避免沿用上一关的 finished/result 导致「下一关」看似失效
  if (levelIdRef.current !== level.id) {
    levelIdRef.current = level.id
    if (commands.length > 0) setCommands([])
    if (result !== null) setResult(null)
    if (stepIndex !== 0) setStepIndex(0)
    if (mode !== 'idle') setMode('idle')
  }

  // 关卡变化时清理播放定时器
  useEffect(() => {
    clearTimer()
  }, [level.id, clearTimer])

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

  const setCommandList = useCallback(
    (cmds: number[], autoRun = false) => {
      clearTimer()
      const valid = cmds.slice(0, level.maxStops)
      setCommands(valid)
      if (autoRun && valid.length > 0) {
        const sim = simulate(level, valid)
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
      } else {
        setResult(null)
        setStepIndex(0)
        setMode('idle')
      }
    },
    [clearTimer, level],
  )

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
    setCommandList,
    run,
    pause,
    resume,
    stepForward,
    stepBack,
    replay,
    reset,
  }
}
