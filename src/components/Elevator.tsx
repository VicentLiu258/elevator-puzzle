import type { Passenger } from '../engine/types'
import { PassengerBadge } from './PassengerBadge'

interface Props {
  floor: number
  capacity: number
  passengers: Passenger[]
  floorHeight: number
  /** 电梯门是否打开（停靠在当前层） */
  doorsOpen?: boolean
}

export function Elevator({
  floor,
  capacity,
  passengers,
  floorHeight,
  doorsOpen = true,
}: Props) {
  // 5F 在顶部：floor 5 → 0，floor 1 → 4 * floorHeight
  const offset = (5 - floor) * floorHeight
  const emptySlots = Math.max(0, capacity - passengers.length)

  return (
    <div
      className={`elevator${doorsOpen ? ' elevator--open' : ''}`}
      style={{ transform: `translateY(${offset}px)`, height: floorHeight }}
      aria-label={`电梯在 ${floor}F，车上 ${passengers.length}/${capacity}`}
    >
      <div className="elevator__cabin">
        <div className="elevator__header">
          <span className="elevator__floor-badge">{floor}F</span>
          <span className="elevator__cap">
            {passengers.length}/{capacity}
          </span>
        </div>

        <div className="elevator__doors" aria-hidden>
          <div className="elevator__door elevator__door--left" />
          <div className="elevator__door elevator__door--right" />
        </div>

        <div className="elevator__inside">
          {passengers.map((p) => (
            <PassengerBadge key={p.id} passenger={p} place="cabin" />
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <div key={`empty-${i}`} className="elevator__slot" title="空位" />
          ))}
        </div>
      </div>
    </div>
  )
}
