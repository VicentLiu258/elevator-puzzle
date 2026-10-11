import { TOTAL_FLOORS } from '../engine/types'

interface Props {
  disabled?: boolean
  onSelect: (floor: number) => void
}

/** 3 列网格：高楼层在上，与大楼方向一致 */
export function FloorButtons({ disabled, onSelect }: Props) {
  const floors = Array.from({ length: TOTAL_FLOORS }, (_, i) => TOTAL_FLOORS - i)

  return (
    <div className="floor-buttons" role="group" aria-label="选择停靠楼层">
      {floors.map((floor) => (
        <button
          key={floor}
          type="button"
          className="floor-btn"
          disabled={disabled}
          onClick={() => onSelect(floor)}
        >
          {floor}
        </button>
      ))}
    </div>
  )
}
