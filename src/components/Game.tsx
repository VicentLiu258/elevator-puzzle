import { useEffect, useMemo, useState } from 'react'
import { LEVELS } from '../data/levels'
import { TOTAL_FLOORS } from '../engine/types'
import type { Passenger } from '../engine/types'
import { usePlayback } from '../hooks/usePlayback'
import { useProgress } from '../hooks/useProgress'
import { Building } from './Building'
import { CommandSlots } from './CommandSlots'
import { EventLog } from './EventLog'
import { FloorButtons } from './FloorButtons'
import { LevelSelect } from './LevelSelect'
import { ResultPanel } from './ResultPanel'

function buildInitialWaiting(passengers: Passenger[]): Map<number, Passenger[]> {
  const m = new Map<number, Passenger[]>()
  for (let f = 1; f <= TOTAL_FLOORS; f++) m.set(f, [])
  for (const p of passengers) {
    m.get(p.from)!.push(p)
  }
  for (const [, list] of m) {
    list.sort((a, b) => a.queueOrder - b.queueOrder)
  }
  return m
}

export function Game() {
  const [levelId, setLevelId] = useState(1)
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0]!
  const { markCleared, isCleared, isUnlocked } = useProgress()
  const playback = usePlayback(level)

  const initialWaiting = useMemo(
    () => buildInitialWaiting(level.passengers),
    [level],
  )

  const undeliveredIds = useMemo(() => {
    if (playback.mode !== 'finished' || !playback.result || playback.result.success) {
      return new Set<string>()
    }
    return new Set(
      playback.result.failureInfo?.undelivered.map((u) => u.passenger.id) ?? [],
    )
  }, [playback.mode, playback.result])

  const alightedKey = (playback.currentStep?.event.alighted ?? []).join(',')
  const [arrivalFlashIds, setArrivalFlashIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!alightedKey) {
      setArrivalFlashIds(new Set())
      return
    }
    setArrivalFlashIds(new Set(alightedKey.split(',')))
    const t = window.setTimeout(() => setArrivalFlashIds(new Set()), 1000)
    return () => window.clearTimeout(t)
  }, [alightedKey])

  useEffect(() => {
    if (playback.mode === 'finished' && playback.result?.success) {
      markCleared(level.id)
    }
  }, [playback.mode, playback.result?.success, level.id, markCleared])

  const editing = playback.mode === 'idle'
  const isRunning = playback.mode === 'playing'

  const slotHighlight =
    playback.mode === 'finished' && playback.result?.success
      ? level.maxStops
      : Math.max(0, playback.stepIndex)

  return (
    <div className="game">
      <div className="game__scroll">
        <header className="game__header">
          <div className="game__title-row">
            <h1 className="game__title">电梯今天听你的</h1>
            <div className="game__level-meta">
              <strong>
                {level.id}. {level.name}
              </strong>
              <span>
                容量 {level.capacity} · 停靠 ≤{level.maxStops}
              </span>
            </div>
          </div>
          <LevelSelect
            levels={LEVELS}
            currentId={level.id}
            isCleared={isCleared}
            isUnlocked={isUnlocked}
            onSelect={setLevelId}
          />
          {editing && level.description && (
            <p className="game__desc">{level.description}</p>
          )}
          <EventLog text={playback.currentStep?.event.description ?? ''} />
        </header>

        <Building
          capacity={level.capacity}
          startFloor={level.startFloor}
          step={playback.currentStep}
          initialWaiting={initialWaiting}
          arrivalFlashIds={arrivalFlashIds}
          undeliveredIds={undeliveredIds}
          isRunning={isRunning}
        />

        {playback.mode === 'finished' && playback.result && (
          <div className="game__result-inline">
            <ResultPanel
              success={playback.result.success}
              failureInfo={playback.result.failureInfo}
            />
          </div>
        )}
      </div>

      {/* 底部固定编排栏：无需滚动即可操作 */}
      <section className="game__dock" aria-label="编排与播放">
        <CommandSlots
          maxStops={level.maxStops}
          commands={playback.commands}
          onRemove={playback.removeSlot}
          highlightCount={slotHighlight}
          disabled={!editing}
        />
        <FloorButtons
          onSelect={playback.addFloor}
          disabled={!editing || playback.commands.length >= level.maxStops}
        />

        <div className="game__actions">
          {editing && (
            <>
              <button type="button" className="btn btn--ghost" onClick={playback.clearCommands}>
                清空
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={playback.run}
                disabled={playback.commands.length === 0}
              >
                运行
              </button>
            </>
          )}

          {(playback.mode === 'playing' ||
            playback.mode === 'paused' ||
            playback.mode === 'finished') && (
            <>
              <button type="button" className="btn btn--ghost" onClick={playback.stepBack}>
                上一步
              </button>
              <button type="button" className="btn btn--ghost" onClick={playback.stepForward}>
                下一步
              </button>
              {playback.mode === 'playing' ? (
                <button type="button" className="btn" onClick={playback.pause}>
                  暂停
                </button>
              ) : playback.mode === 'paused' ? (
                <button type="button" className="btn" onClick={playback.resume}>
                  继续
                </button>
              ) : null}
              <button type="button" className="btn" onClick={playback.replay}>
                重播
              </button>
              <button type="button" className="btn btn--ghost" onClick={playback.clearCommands}>
                重新编排
              </button>
              {playback.mode === 'finished' &&
                playback.result?.success &&
                level.id < LEVELS.length && (
                  <button
                    type="button"
                    className="btn btn--accent"
                    onClick={() => setLevelId(level.id + 1)}
                  >
                    下一关
                  </button>
                )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
