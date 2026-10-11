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

  const currentFloor = playback.currentStep?.floor ?? level.startFloor
  const occupancy = playback.currentStep?.inElevator.length ?? 0

  return (
    <div className="game">
      {/* 顶部悬浮结果，不挤压布局 */}
      {playback.mode === 'finished' && playback.result && (
        <div className="result-float">
          <ResultPanel
            success={playback.result.success}
            failureInfo={playback.result.failureInfo}
          />
        </div>
      )}

      <header className="game__header">
        <div className="game__title-row">
          <h1 className="game__title">电梯今天听你的</h1>
          <div className="game__level-meta">
            <strong>
              {level.id}. {level.name}
            </strong>
            <span>
              容量 {level.capacity} · ≤{level.maxStops} 停
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
        <EventLog text={playback.currentStep?.event.description ?? ''} />
      </header>

      <div className="game__stage">
        <div className="game__tower-col">
          {/* 停靠序列：电梯顶部，横向缩小 */}
          <div className="tower-commands">
            <span className="tower-commands__label">序列</span>
            <CommandSlots
              maxStops={level.maxStops}
              commands={playback.commands}
              onRemove={playback.removeSlot}
              highlightCount={slotHighlight}
              disabled={!editing}
            />
          </div>

          <Building
            capacity={level.capacity}
            startFloor={level.startFloor}
            step={playback.currentStep}
            initialWaiting={initialWaiting}
            arrivalFlashIds={arrivalFlashIds}
            undeliveredIds={undeliveredIds}
            isRunning={isRunning}
          />
        </div>

        {/* 右侧电梯操纵面板：顶部显示屏，所有按钮置于容器底部 */}
        <aside className="game__dock cop-panel" aria-label="电梯内操纵盘">
          {/* 顶部：电梯 LED 指示器与状态面板 */}
          <div className="cop-display" aria-hidden>
            <div className="cop-display__screen">
              <div className="cop-display__led">
                <span className={`cop-display__arrow ${isRunning ? 'cop-display__arrow--active' : ''}`}>
                  {isRunning ? '▲' : '▪'}
                </span>
                <span className="cop-display__num">{currentFloor}</span>
                <span className="cop-display__unit">F</span>
              </div>
              <div className="cop-display__meta">
                <span className="cop-display__badge">
                  {isRunning ? 'RUN' : playback.mode === 'finished' ? 'FIN' : 'IDLE'}
                </span>
                <span className="cop-display__cap">
                  {occupancy}/{level.capacity}P
                </span>
              </div>
            </div>
            <div className="cop-display__brand">
              <span>COP-PANEL</span>
            </div>
          </div>

          {/* 底部按钮区域：沉在容器底部 */}
          <div className="cop-bottom">
            <div className="dock__section dock__section--floors">
              <div className="dock__label">
                <span>呼梯选层</span>
              </div>
              <FloorButtons
                onSelect={playback.addFloor}
                disabled={!editing || playback.commands.length >= level.maxStops}
                currentFloor={currentFloor}
                selectedFloors={playback.commands}
              />
            </div>

            <div className="dock__actions">
              {editing && (
                <>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={playback.clearCommands}
                  >
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
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={playback.clearCommands}
                  >
                    重编
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
          </div>
        </aside>
      </div>
    </div>
  )
}
