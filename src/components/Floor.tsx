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
  /** 电梯途经本层时的运转闪烁 */
  isPassing?: boolean
  /** 本步因满员被拒的乘客 id */
  deniedIds?: Set<string>
  /** 本步刚下车的乘客 id（出梯动效） */
  justAlightedIds?: Set<string>
}

export function FloorRow({
  floor,
  waiting,
  arrived,
  arrivalFlashIds,
  undeliveredIds,
  height,
  isActive,
  isPassing = false,
  deniedIds,
  justAlightedIds,
}: Props) {
  return (
    <div
      className={[
        'floor',
        isActive ? 'floor--active' : '',
        isPassing ? 'floor--passing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height }}
      data-floor={floor}
    >
      <div className="floor__slab" aria-hidden />

      <div className="floor__label">
        <span className="floor__num">{floor}</span>
        <span className="floor__unit">F</span>
        {isPassing && <span className="floor__pass-dot" aria-hidden />}
      </div>

      <div className="floor__hall">
        <div className="floor__ceiling" aria-hidden />
        {/* waiting 已按 queueOrder 排序；CSS row-reverse 让队首靠近右侧电梯门 */}
        <div className="floor__zone floor__zone--wait" aria-label={`${floor}F 等候（靠门者先上）`}>
          {waiting.map((p, index) => {
            const isDenied = deniedIds?.has(p.id) ?? false
            const isUndelivered = undeliveredIds.has(p.id)
            return (
              <PassengerBadge
                key={p.id}
                passenger={p}
                place="hallway"
                highlight={isUndelivered}
                queueIndex={index + 1}
                isConfused={isUndelivered || isDenied}
                confusedText={isDenied ? '❓' : '❓'}
              />
            )
          })}
        </div>
        <div className="floor__zone floor__zone--arrived" aria-label={`${floor}F 已送达`}>
          {arrived.map((p) => {
            const isJustAlighted =
              (justAlightedIds?.has(p.id) ?? false) || arrivalFlashIds.has(p.id)
            return (
              <PassengerBadge
                key={p.id}
                passenger={p}
                place="arrived"
                showArrivalEmoji={arrivalFlashIds.has(p.id)}
                isExiting={isJustAlighted}
              />
            )
          })}
        </div>
        <div className="floor__stone" aria-hidden />
      </div>

      <div
        className={`floor__doorway${isActive ? ' floor__doorway--open' : ''}${isPassing ? ' floor__doorway--pass' : ''}`}
        aria-hidden
      >
        <div className="floor__portal">
          {isActive && <span className="floor__door-tag">OPEN</span>}
        </div>
      </div>
    </div>
  )
}
