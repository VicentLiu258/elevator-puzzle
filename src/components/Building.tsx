import { useEffect, useMemo, useRef, useState } from 'react'
import {
  TOTAL_FLOORS,
  VIEWPORT_FLOORS,
  type Passenger,
  type SimStep,
} from '../engine/types'
import { Elevator } from './Elevator'
import { FloorRow } from './Floor'

const TRANSIT_MS = 600
const MIN_FLOOR_HEIGHT = 48
const visibleCount = Math.min(VIEWPORT_FLOORS, TOTAL_FLOORS)

interface Props {
  capacity: number
  startFloor: number
  step: SimStep | null
  initialWaiting: Map<number, Passenger[]>
  arrivalFlashIds: Set<string>
  undeliveredIds: Set<string>
  isRunning?: boolean
  /** 为 true 时视口跟随电梯；编排预览时应为 false */
  followElevator?: boolean
  /** 外部请求聚焦到某层（如点选楼层按钮时） */
  focusFloor?: number | null
  /** 关卡 id，用于切换关卡时重置预览页 */
  levelId?: number
}

function floorsBetween(from: number, to: number): number[] {
  if (from === to) return [to]
  const dir = to > from ? 1 : -1
  const path: number[] = []
  for (let f = from + dir; ; f += dir) {
    path.push(f)
    if (f === to) break
  }
  return path
}

function pageForFloor(floor: number): number {
  return Math.floor((floor - 1) / VIEWPORT_FLOORS)
}

function pageTopFloor(page: number): number {
  return Math.min((page + 1) * VIEWPORT_FLOORS, TOTAL_FLOORS)
}

const MAX_PAGE = pageForFloor(TOTAL_FLOORS)

/** 编排时默认预览页：若有乘客在其他楼层段等候，自动切到该场景 */
function defaultPreviewPage(
  startFloor: number,
  waiting: Map<number, Passenger[]>,
): number {
  for (let f = 1; f <= TOTAL_FLOORS; f++) {
    if ((waiting.get(f)?.length ?? 0) > 0 && pageForFloor(f) !== pageForFloor(startFloor)) {
      return pageForFloor(f)
    }
  }
  return pageForFloor(startFloor)
}

export function Building({
  capacity,
  startFloor,
  step,
  initialWaiting,
  arrivalFlashIds,
  undeliveredIds,
  isRunning = false,
  followElevator = true,
  focusFloor = null,
  levelId,
}: Props) {
  // 电梯物理目标层
  const targetFloor = step?.floor ?? startFloor

  const floors = useMemo(() => {
    const list: number[] = []
    for (let f = TOTAL_FLOORS; f >= 1; f--) list.push(f)
    return list
  }, [])

  const pageScenes = useMemo(() => {
    const scenes: { page: number; label: string }[] = []
    for (let p = 0; p <= MAX_PAGE; p++) {
      const lo = p * VIEWPORT_FLOORS + 1
      const hi = pageTopFloor(p)
      scenes.push({ page: p, label: `${lo}–${hi}F` })
    }
    return scenes
  }, [])

  const needsPaging = TOTAL_FLOORS > VIEWPORT_FLOORS
  const [page, setPage] = useState(() =>
    followElevator
      ? pageForFloor(targetFloor)
      : defaultPreviewPage(startFloor, initialWaiting),
  )
  const viewportRef = useRef<HTMLDivElement>(null)
  const [floorHeight, setFloorHeight] = useState(72)

  // 视口高度变化时：楼层等高铺满
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const apply = (h: number) => {
      const next = Math.max(MIN_FLOOR_HEIGHT, Math.floor(h / visibleCount))
      setFloorHeight(next)
    }

    apply(el.clientHeight)
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      apply(entry.contentRect.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 切换关卡：编排模式下跳到有关键乘客的预览页
  useEffect(() => {
    if (followElevator) return
    setPage(defaultPreviewPage(startFloor, initialWaiting))
  }, [levelId, startFloor, initialWaiting, followElevator])

  // 运行时跟随电梯；编排时不强制拉回
  useEffect(() => {
    if (!followElevator) return
    const next = pageForFloor(targetFloor)
    setPage((prev) => (prev === next ? prev : next))
  }, [targetFloor, followElevator])

  // 外部聚焦（点选楼层按钮）
  useEffect(() => {
    if (focusFloor == null || focusFloor < 1) return
    const next = pageForFloor(focusFloor)
    setPage((prev) => (prev === next ? prev : next))
  }, [focusFloor])

  const facadeHeight = TOTAL_FLOORS * floorHeight
  const scrollY = needsPaging
    ? (TOTAL_FLOORS - pageTopFloor(page)) * floorHeight
    : 0

  const prevFloorRef = useRef(targetFloor)
  const prevStepRef = useRef<SimStep | null>(null)
  const [passingFloor, setPassingFloor] = useState<number | null>(null)
  const [inTransit, setInTransit] = useState(false)
  const [isArrivalSettled, setIsArrivalSettled] = useState(true)

  // 楼层变化与移动两阶段管理：运行时人在车内，到达后人出电梯
  useEffect(() => {
    const from = prevFloorRef.current
    const to = targetFloor
    prevFloorRef.current = to

    if (!step) {
      prevStepRef.current = null
      setIsArrivalSettled(true)
      setInTransit(false)
      setPassingFloor(null)
      return
    }

    if (from !== to) {
      // 正在奔向新楼层：进入 transit 阶段
      setIsArrivalSettled(false)
      setInTransit(true)
      const path = floorsBetween(from, to)
      const timers: number[] = []

      const slice = Math.max(70, Math.floor(TRANSIT_MS / path.length))
      path.forEach((f, i) => {
        timers.push(
          window.setTimeout(() => {
            setPassingFloor(f)
          }, i * slice),
        )
      })

      timers.push(
        window.setTimeout(() => {
          setPassingFloor(null)
          setInTransit(false)
          setIsArrivalSettled(true)
          prevStepRef.current = step
        }, TRANSIT_MS),
      )

      return () => {
        timers.forEach((t) => window.clearTimeout(t))
      }
    } else {
      // 同层停靠（或初始步 0）
      setIsArrivalSettled(true)
      setInTransit(false)
      setPassingFloor(null)
      prevStepRef.current = step
    }
  }, [targetFloor, step])

  useEffect(() => {
    if (!isRunning && !inTransit) {
      setPassingFloor(null)
    }
  }, [isRunning, inTransit])

  // 核心逻辑：如果在移动中且有前一步快照，人员展示保持前一步状态（人在电梯里运行）；到达开门后展示当前步！
  const activeStep = inTransit && prevStepRef.current ? prevStepRef.current : step
  const inElevator = activeStep?.inElevator ?? []
  const waiting = activeStep?.waiting ?? initialWaiting
  const arrived = activeStep?.arrived

  // 到达开门后触发的进出人与问号状态
  const justBoardedIds = useMemo(() => {
    if (!isArrivalSettled || !step) return new Set<string>()
    return new Set(step.event.boarded)
  }, [isArrivalSettled, step])

  const justAlightedIds = useMemo(() => {
    if (!isArrivalSettled || !step) return new Set<string>()
    return new Set(step.event.alighted)
  }, [isArrivalSettled, step])

  const deniedIds = useMemo(() => {
    if (!isArrivalSettled || !step) return new Set<string>()
    return new Set(step.event.deniedBoarding)
  }, [isArrivalSettled, step])

  return (
    <div className="building">
      {needsPaging && (
        <div className="building__page-bar" role="tablist" aria-label="楼层场景切换">
          <button
            type="button"
            className="building__page-btn"
            disabled={page >= MAX_PAGE}
            onClick={() => setPage((p) => Math.min(p + 1, MAX_PAGE))}
            title="更高楼层"
          >
            ↑
          </button>

          <div className="building__page-tabs">
            {pageScenes.map((scene) => (
              <button
                key={scene.page}
                type="button"
                role="tab"
                aria-selected={page === scene.page}
                className={
                  'building__page-tab' +
                  (page === scene.page ? ' building__page-tab--active' : '')
                }
                onClick={() => setPage(scene.page)}
                title={`预览 ${scene.label}`}
              >
                {scene.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="building__page-btn"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            title="更低楼层"
          >
            ↓
          </button>
        </div>
      )}

      <div className="tower">
        <div className="tower__crown" aria-hidden>
          <div className="tower__crown-bar" />
          <div className="tower__crown-glass" />
        </div>

        <div ref={viewportRef} className="tower__viewport">
          <div
            className={`tower__facade${inTransit ? ' tower__facade--moving' : ''}`}
            style={{
              height: facadeHeight,
              transform: `translateY(-${scrollY}px)`,
            }}
          >
            <div className="tower__glare" aria-hidden />
            <div className="tower__mullions" aria-hidden />

            <div className="tower__floors">
              {floors.map((f) => (
                <FloorRow
                  key={f}
                  floor={f}
                  height={floorHeight}
                  waiting={waiting.get(f) ?? []}
                  arrived={arrived?.get(f) ?? []}
                  arrivalFlashIds={arrivalFlashIds}
                  undeliveredIds={undeliveredIds}
                  isActive={f === targetFloor && !inTransit}
                  isPassing={passingFloor === f}
                  deniedIds={f === targetFloor ? deniedIds : undefined}
                  justAlightedIds={f === targetFloor ? justAlightedIds : undefined}
                />
              ))}
            </div>

            <div className="tower__shaft" aria-hidden>
              <div className="tower__shaft-metal" />
              <div className="tower__shaft-rail tower__shaft-rail--left" />
              <div className="tower__shaft-rail tower__shaft-rail--right" />
              <div className="tower__shaft-cables" />
            </div>

            <div className="tower__elevator-track">
              <Elevator
                floor={targetFloor}
                capacity={capacity}
                passengers={inElevator}
                floorHeight={floorHeight}
                doorsOpen={!inTransit}
                justBoardedIds={justBoardedIds}
                confusedIds={undeliveredIds}
              />
            </div>
          </div>
        </div>

        <div className="tower__plinth" aria-hidden>
          <span>LOBBY</span>
        </div>
      </div>
    </div>
  )
}
