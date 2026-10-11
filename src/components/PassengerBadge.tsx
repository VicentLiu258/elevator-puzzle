import { ARRIVAL_EMOJI, PASSENGER_EMOJI, type Passenger } from '../engine/types'

const TYPE_CLASS: Record<Passenger['type'], string> = {
  office: 'passenger--office',
  student: 'passenger--student',
  elder: 'passenger--elder',
}

interface Props {
  passenger: Passenger
  showArrivalEmoji?: boolean
  highlight?: boolean
}

export function PassengerBadge({ passenger, showArrivalEmoji, highlight }: Props) {
  return (
    <div
      className={`passenger ${TYPE_CLASS[passenger.type]}${highlight ? ' passenger--highlight' : ''}`}
      title={`${passenger.id} ${passenger.from}→${passenger.to}`}
    >
      <span className="passenger__emoji">
        {showArrivalEmoji ? ARRIVAL_EMOJI[passenger.type] : PASSENGER_EMOJI[passenger.type]}
      </span>
      <span className="passenger__label">
        {passenger.id}
        <small>→{passenger.to}F</small>
      </span>
      {showArrivalEmoji && (
        <span className="passenger__bubble" aria-hidden>
          {ARRIVAL_EMOJI[passenger.type]}
        </span>
      )}
    </div>
  )
}
