import type { Passenger } from '../engine/types'
import { PassengerBadge } from './PassengerBadge'

interface Props {
  floor: number
  capacity: number
  passengers: Passenger[]
  floorHeight: number
  doorsOpen?: boolean
}

export function Elevator({
  floor,
  capacity,
  passengers,
  floorHeight,
  doorsOpen = true,
}: Props) {
  const offset = (5 - floor) * floorHeight
  const emptySlots = Math.max(0, capacity - passengers.length)

  return (
    <div
      className={`elevator${doorsOpen ? ' elevator--open' : ''}`}
      style={{ transform: `translateY(${offset}px)`, height: floorHeight }}
      aria-label={`电梯在 ${floor}F，车上 ${passengers.length}/${capacity}`}
    >
      <div className="elevator__cabin">
        <div className="elevator__chrome">
          <span className="elevator__led">{floor}</span>
          <span className="elevator__cap">
            {passengers.length}/{capacity}
          </span>
        </div>

        <div className="elevator__doors" aria-hidden>
          <div className="elevator__door elevator__door--left">
            <span className="elevator__door-shine" />
          </div>
          <div className="elevator__door elevator__door--right">
            <span className="elevator__door-shine" />
          </div>
        </div>

        <div className="elevator__inside">
          <div className="elevator__mirror" aria-hidden />
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
