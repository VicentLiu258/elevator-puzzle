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
  /** hallway | cabin | arrived */
  place?: 'hallway' | 'cabin' | 'arrived'
  /** 等候队列序号：1 = 靠门先上 */
  queueIndex?: number
}

export function PassengerBadge({
  passenger,
  showArrivalEmoji,
  highlight,
  place = 'hallway',
  queueIndex,
}: Props) {
  return (
    <div
      className={[
        'passenger',
        TYPE_CLASS[passenger.type],
        `passenger--${place}`,
        highlight ? 'passenger--highlight' : '',
        showArrivalEmoji ? 'passenger--just-arrived' : '',
        queueIndex === 1 ? 'passenger--next' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={
        queueIndex !== undefined
          ? `${passenger.id}：排队第 ${queueIndex}（靠门先上）· ${passenger.from}F → ${passenger.to}F`
          : `${passenger.id}：${passenger.from}F → ${passenger.to}F`
      }
    >
      {place === 'hallway' && queueIndex !== undefined && (
        <span className="passenger__queue" aria-hidden>
          {queueIndex}
        </span>
      )}
      <span className="passenger__face" aria-hidden>
        {PASSENGER_EMOJI[passenger.type]}
      </span>
      <span className="passenger__meta">
        <span className="passenger__id">{passenger.id}</span>
        <span className="passenger__dest">→{passenger.to}F</span>
      </span>
      {showArrivalEmoji && (
        <span className="passenger__bubble" aria-hidden>
          {ARRIVAL_EMOJI[passenger.type]}
        </span>
      )}
    </div>
  )
}
