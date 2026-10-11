import type { Passenger } from '../engine/types'
import { TOTAL_FLOORS } from '../engine/types'
import { PassengerBadge } from './PassengerBadge'

interface Props {
  floor: number
  capacity: number
  passengers: Passenger[]
  floorHeight: number
  doorsOpen?: boolean
  /** 刚上车的乘客 id 集合（进梯动画） */
  justBoardedIds?: Set<string>
  /** 困惑冒问号的乘客 id 集合（如失败时滞留车内） */
  confusedIds?: Set<string>
}

export function Elevator({
  floor,
  capacity,
  passengers,
  floorHeight,
  doorsOpen = true,
  justBoardedIds,
  confusedIds,
}: Props) {
  // 整栋楼坐标系：最高层在顶部
  const offset = (TOTAL_FLOORS - floor) * floorHeight
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

        {/* 观光电梯门：带有居中观光视窗，关门时也能透出车厢内的乘客 */}
        <div className="elevator__doors" aria-hidden>
          <div className="elevator__door elevator__door--left">
            <div className="elevator__door-window" />
            <span className="elevator__door-shine" />
          </div>
          <div className="elevator__door elevator__door--right">
            <div className="elevator__door-window" />
            <span className="elevator__door-shine" />
          </div>
        </div>

        <div className="elevator__inside">
          <div className="elevator__mirror" aria-hidden />
          {passengers.map((p) => (
            <PassengerBadge
              key={p.id}
              passenger={p}
              place="cabin"
              isEntering={justBoardedIds?.has(p.id)}
              isConfused={confusedIds?.has(p.id)}
            />
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <div key={`empty-${i}`} className="elevator__slot" title="空位" />
          ))}
        </div>
      </div>
    </div>
  )
}
