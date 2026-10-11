import { useEffect, useMemo, useRef, useState } from 'react'
import {
  TOTAL_FLOORS,
  VIEWPORT_FLOORS,
  type Passenger,
  type SimStep,
} from '../engine/types'
import { Elevator } from './Elevator'
import { FloorRow } from './Floor'

const TRANSIT_MS = 560
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

  useEffect(() => {
    const next = pageForFloor(floor)
    setPage((prev) => (prev === next ? prev : next))
  }, [floor])

  const facadeHeight = TOTAL_FLOORS * floorHeight
  const scrollY = needsPaging
    ? (TOTAL_FLOORS - pageTopFloor(page)) * floorHeight
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
                floorHeight={floorHeight}
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
