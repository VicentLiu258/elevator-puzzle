import { useEffect, useMemo, useRef, useState } from 'react'
import { TOTAL_FLOORS, type Passenger, type SimStep } from '../engine/types'
import { Elevator } from './Elevator'
import { FloorRow } from './Floor'

/** 楼层略压缩，方便与底部固定栏同屏 */
const FLOOR_HEIGHT = 68
/** 电梯层间过渡总时长（与 CSS transition 对齐） */
const TRANSIT_MS = 560

interface Props {
  capacity: number
  startFloor: number
  step: SimStep | null
  initialWaiting: Map<number, Passenger[]>
  arrivalFlashIds: Set<string>
  undeliveredIds: Set<string>
  /** 播放中：途经楼层逐层闪烁 */
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

  const prevFloorRef = useRef(floor)
  const [passingFloor, setPassingFloor] = useState<number | null>(null)
  const [inTransit, setInTransit] = useState(false)

  useEffect(() => {
    const from = prevFloorRef.current
    const to = floor
    prevFloorRef.current = to

    if (from === to) return

    // 仅在自动播放时做途经闪烁；单步也给一次短闪
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

  // 停止运行时清掉途经高亮
  useEffect(() => {
    if (!isRunning && !inTransit) {
      setPassingFloor(null)
    }
  }, [isRunning, inTransit])

  return (
    <div className="building">
      <div className="tower">
        <div className="tower__crown" aria-hidden>
          <div className="tower__crown-bar" />
          <div className="tower__crown-glass" />
        </div>

        <div
          className={`tower__facade${inTransit ? ' tower__facade--moving' : ''}`}
          style={{ height: TOTAL_FLOORS * FLOOR_HEIGHT }}
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

        <div className="tower__plinth" aria-hidden>
          <span>LOBBY</span>
        </div>
      </div>
    </div>
  )
}
