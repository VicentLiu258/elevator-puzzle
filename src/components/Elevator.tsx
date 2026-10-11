import type { Passenger } from '../engine/types'
import { PassengerBadge } from './PassengerBadge'

interface Props {
  floor: number
  capacity: number
  passengers: Passenger[]
  /** 楼层高度（px），用于 transform */
  floorHeight: number
}

export function Elevator({ floor, capacity, passengers, floorHeight }: Props) {
  // 5F 在顶部：floor 5 → translateY(0)，floor 1 → translateY(4 * floorHeight)
  const offset = (5 - floor) * floorHeight

  return (
    <div
      className="elevator"
      style={{ transform: `translateY(${offset}px)` }}
      aria-label={`电梯在 ${floor}F，${passengers.length}/${capacity}`}
    >
      <div className="elevator__cabin">
        <div className="elevator__occupancy">
          {passengers.length}/{capacity}
        </div>
        <div className="elevator__passengers">
          {passengers.map((p) => (
            <PassengerBadge key={p.id} passenger={p} />
          ))}
        </div>
      </div>
    </div>
  )
}
