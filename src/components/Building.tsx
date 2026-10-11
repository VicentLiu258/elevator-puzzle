import { useMemo } from 'react'
import { TOTAL_FLOORS, type Passenger, type SimStep } from '../engine/types'
import { Elevator } from './Elevator'
import { FloorRow } from './Floor'

const FLOOR_HEIGHT = 72

interface Props {
  capacity: number
  startFloor: number
  /** 播放中的当前步；idle 时用初始布局 */
  step: SimStep | null
  initialWaiting: Map<number, Passenger[]>
  arrivalFlashIds: Set<string>
  undeliveredIds: Set<string>
}

export function Building({
  capacity,
  startFloor,
  step,
  initialWaiting,
  arrivalFlashIds,
  undeliveredIds,
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

  return (
    <div className="building" style={{ height: TOTAL_FLOORS * FLOOR_HEIGHT }}>
      <div className="building__floors">
        {floors.map((f) => (
          <FloorRow
            key={f}
            floor={f}
            height={FLOOR_HEIGHT}
            waiting={waiting.get(f) ?? []}
            arrived={arrived?.get(f) ?? []}
            arrivalFlashIds={arrivalFlashIds}
            undeliveredIds={undeliveredIds}
          />
        ))}
      </div>
      <div className="building__elevator-track">
        <Elevator
          floor={floor}
          capacity={capacity}
          passengers={inElevator}
          floorHeight={FLOOR_HEIGHT}
        />
      </div>
    </div>
  )
}
