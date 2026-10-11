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
  /** 是否冒出戏谑困惑问号（走错/未送达/满员被拒） */
  isConfused?: boolean
  /** 自定义戏谑问号文案，默认 ❓ */
  confusedText?: string
  /** 刚迈入电梯轿厢 */
  isEntering?: boolean
  /** 刚走出电梯 */
  isExiting?: boolean
}

export function PassengerBadge({
  passenger,
  showArrivalEmoji,
  highlight,
  place = 'hallway',
  queueIndex,
  isConfused = false,
  confusedText = '❓',
  isEntering = false,
  isExiting = false,
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
        isConfused ? 'passenger--confused' : '',
        isEntering ? 'passenger--entering' : '',
        isExiting ? 'passenger--exiting' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={
        isConfused
          ? `${passenger.id}：（疑惑中）${passenger.from}F → ${passenger.to}F`
          : queueIndex !== undefined
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
      {/* 达成送达的欢呼泡泡 */}
      {showArrivalEmoji && (
        <span className="passenger__bubble" aria-hidden>
          {ARRIVAL_EMOJI[passenger.type]}
        </span>
      )}
      {/* 戏谑困惑问号泡泡 */}
      {isConfused && (
        <span className="passenger__confused-bubble" aria-hidden title="哎？怎么回事？">
          <span className="passenger__confused-q">{confusedText}</span>
        </span>
      )}
    </div>
  )
}
