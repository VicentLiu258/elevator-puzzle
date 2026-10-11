import { TOTAL_FLOORS } from '../engine/types'

interface Props {
  disabled?: boolean
  onSelect: (floor: number) => void
  currentFloor?: number
  selectedFloors?: number[]
}

/** 3 列网格：高楼层在上，与大楼方向一致；电梯呼梯金属按键 */
export function FloorButtons({
  disabled,
  onSelect,
  currentFloor,
  selectedFloors = [],
}: Props) {
  const floors = Array.from({ length: TOTAL_FLOORS }, (_, i) => TOTAL_FLOORS - i)
  const selectedSet = new Set(selectedFloors)

  return (
    <div className="floor-buttons" role="group" aria-label="选择停靠楼层">
      {floors.map((floor) => {
        const isCurrent = floor === currentFloor
        const isSelected = selectedSet.has(floor)
        return (
          <button
            key={floor}
            type="button"
            className={[
              'floor-btn',
              isCurrent ? 'floor-btn--current' : '',
              isSelected ? 'floor-btn--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={disabled}
            onClick={() => onSelect(floor)}
            title={`${floor}F ${isCurrent ? '（当前电梯所在层）' : ''}`}
          >
            <span className="floor-btn__light" aria-hidden />
            <span className="floor-btn__num">{floor}</span>
          </button>
        )
      })}
    </div>
  )
}
