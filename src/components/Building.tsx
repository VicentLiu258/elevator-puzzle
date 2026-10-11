import { useMemo } from 'react'
import { TOTAL_FLOORS, type Passenger, type SimStep } from '../engine/types'
import { Elevator } from './Elevator'
import { FloorRow } from './Floor'

const FLOOR_HEIGHT = 88

interface Props {
  capacity: number
  startFloor: number
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
    <div className="building">
      <div className="building__legend">
        <span className="building__legend-item">
          <i className="building__dot building__dot--wait" />
          走廊排队
        </span>
        <span className="building__legend-item">
          <i className="building__dot building__dot--cab" />
          电梯内
        </span>
        <span className="building__legend-item">
          <i className="building__dot building__dot--ok" />
          已送达
        </span>
      </div>

      <div
        className="building__body"
        style={{ height: TOTAL_FLOORS * FLOOR_HEIGHT }}
      >
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
              isActive={f === floor}
            />
          ))}
        </div>

        <div className="building__shaft">
          <div className="building__shaft-rails" />
        </div>

        <div className="building__elevator-track">
          <Elevator
            floor={floor}
            capacity={capacity}
            passengers={inElevator}
            floorHeight={FLOOR_HEIGHT}
            doorsOpen
          />
        </div>
      </div>
    </div>
  )
}
