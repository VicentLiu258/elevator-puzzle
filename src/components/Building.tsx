import { useEffect, useMemo, useRef, useState } from 'react'
import {
  TOTAL_FLOORS,
  VIEWPORT_FLOORS,
  type Passenger,
  type SimStep,
} from '../engine/types'
import { Elevator } from './Elevator'
import { FloorRow } from './Floor'

const FLOOR_HEIGHT = 72
const TRANSIT_MS = 560

interface Props {
  capacity: number
  startFloor: number
  step: SimStep | null
  initialWaiting: Map<number, Passenger[]>
  arrivalFlashIds: Set<string>
  undeliveredIds: Set<string>
  isRunning?: boolean
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

/** 电梯所在层对应的视口页（每 VIEWPORT_FLOORS 层一页，从 1F 起算） */
function pageForFloor(floor: number): number {
  return Math.floor((floor - 1) / VIEWPORT_FLOORS)
}

/** 该页视口顶部应显示的最高楼层 */
function pageTopFloor(page: number): number {
  const windowEnd = Math.min((page + 1) * VIEWPORT_FLOORS, TOTAL_FLOORS)
  return windowEnd
}

export function Building({
  capacity,
  startFloor,
  step,
  initialWaiting,
  arrivalFlashIds,
  undeliveredIds,
  isRunning = false,
}: Props) {
  const floor = step?.floor ?? startFloor
  const inElevator = step?.inElevator ?? []
  const waiting = step?.waiting ?? initialWaiting
  const arrived = step?.arrived

  const floors = useMemo(() => {
    const list: number[] = []
    for (let f = TOTAL_FLOORS; f >= 1; f--) list.push(f)
    return list
  }, [])

  const needsPaging = TOTAL_FLOORS > VIEWPORT_FLOORS
  const [page, setPage] = useState(() => pageForFloor(floor))

  // 电梯换层时：若离开当前 5 层窗口，整页滚动
  useEffect(() => {
    const next = pageForFloor(floor)
    setPage((prev) => (prev === next ? prev : next))
  }, [floor])

  const viewportHeight = Math.min(VIEWPORT_FLOORS, TOTAL_FLOORS) * FLOOR_HEIGHT
  const facadeHeight = TOTAL_FLOORS * FLOOR_HEIGHT
  const scrollY = needsPaging
    ? (TOTAL_FLOORS - pageTopFloor(page)) * FLOOR_HEIGHT
    : 0

  const prevFloorRef = useRef(floor)
  const [passingFloor, setPassingFloor] = useState<number | null>(null)
  const [inTransit, setInTransit] = useState(false)

  useEffect(() => {
    const from = prevFloorRef.current
    const to = floor
    prevFloorRef.current = to
    if (from === to) return

    const path = floorsBetween(from, to)
    const timers: number[] = []
    setInTransit(true)

    const slice = Math.max(80, Math.floor(TRANSIT_MS / path.length))
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
      }, TRANSIT_MS),
    )

    return () => {
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [floor])

  useEffect(() => {
    if (!isRunning && !inTransit) {
      setPassingFloor(null)
    }
  }, [isRunning, inTransit])

  const pageLabel = needsPaging
    ? `${page * VIEWPORT_FLOORS + 1}–${pageTopFloor(page)}F`
    : null

  return (
    <div className="building">
      {needsPaging && (
        <div className="building__page-bar">
          <button
            type="button"
            className="building__page-btn"
            disabled={page >= pageForFloor(TOTAL_FLOORS)}
            onClick={() => setPage((p) => Math.min(p + 1, pageForFloor(TOTAL_FLOORS)))}
            title="更高楼层"
          >
            ↑
          </button>
          <span className="building__page-label">{pageLabel}</span>
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

        <div className="tower__viewport" style={{ height: viewportHeight }}>
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
                  height={FLOOR_HEIGHT}
                  waiting={waiting.get(f) ?? []}
                  arrived={arrived?.get(f) ?? []}
                  arrivalFlashIds={arrivalFlashIds}
                  undeliveredIds={undeliveredIds}
                  isActive={f === floor && !inTransit}
                  isPassing={passingFloor === f}
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
                floor={floor}
                capacity={capacity}
                passengers={inElevator}
                floorHeight={FLOOR_HEIGHT}
                doorsOpen={!inTransit}
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
