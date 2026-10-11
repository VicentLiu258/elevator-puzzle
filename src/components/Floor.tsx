import type { Passenger } from '../engine/types'
import { PassengerBadge } from './PassengerBadge'

interface Props {
  floor: number
  waiting: Passenger[]
  arrived: Passenger[]
  arrivalFlashIds: Set<string>
  undeliveredIds: Set<string>
  height: number
  isActive: boolean
}

export function FloorRow({
  floor,
  waiting,
  arrived,
  arrivalFlashIds,
  undeliveredIds,
  height,
  isActive,
}: Props) {
  return (
    <div
      className={`floor${isActive ? ' floor--active' : ''}`}
      style={{ height }}
      data-floor={floor}
    >
      <div className="floor__slab" aria-hidden />

      <div className="floor__label">
        <span className="floor__num">{floor}</span>
        <span className="floor__unit">F</span>
      </div>

      <div className="floor__hall">
        <div className="floor__ceiling" aria-hidden />
        <div className="floor__zone floor__zone--wait" aria-label={`${floor}F 等候`}>
          {waiting.map((p) => (
            <PassengerBadge
              key={p.id}
              passenger={p}
              place="hallway"
              highlight={undeliveredIds.has(p.id)}
            />
          ))}
        </div>
        <div className="floor__zone floor__zone--arrived" aria-label={`${floor}F 已送达`}>
          {arrived.map((p) => (
            <PassengerBadge
              key={p.id}
              passenger={p}
              place="arrived"
              showArrivalEmoji={arrivalFlashIds.has(p.id)}
            />
          ))}
        </div>
        <div className="floor__stone" aria-hidden />
      </div>

      <div
        className={`floor__doorway${isActive ? ' floor__doorway--open' : ''}`}
        aria-hidden
      >
        <div className="floor__portal">
          {isActive && <span className="floor__door-tag">OPEN</span>}
        </div>
      </div>
    </div>
  )
}
