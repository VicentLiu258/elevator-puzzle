import type { Passenger } from '../engine/types'
import { PassengerBadge } from './PassengerBadge'

interface Props {
  floor: number
  waiting: Passenger[]
  arrived: Passenger[]
  arrivalFlashIds: Set<string>
  undeliveredIds: Set<string>
  height: number
}

export function FloorRow({
  floor,
  waiting,
  arrived,
  arrivalFlashIds,
  undeliveredIds,
  height,
}: Props) {
  return (
    <div className="floor" style={{ height }}>
      <div className="floor__label">{floor}F</div>
      <div className="floor__waiting">
        {waiting.map((p) => (
          <PassengerBadge
            key={p.id}
            passenger={p}
            highlight={undeliveredIds.has(p.id)}
          />
        ))}
      </div>
      <div className="floor__arrived">
        {arrived.map((p) => (
          <PassengerBadge
            key={p.id}
            passenger={p}
            showArrivalEmoji={arrivalFlashIds.has(p.id)}
          />
        ))}
      </div>
      <div className="floor__shaft" />
    </div>
  )
}
