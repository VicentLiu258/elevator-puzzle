import { TOTAL_FLOORS } from '../engine/types'

interface Props {
  disabled?: boolean
  onSelect: (floor: number) => void
}

export function FloorButtons({ disabled, onSelect }: Props) {
  return (
    <div className="floor-buttons" role="group" aria-label="选择停靠楼层">
      {Array.from({ length: TOTAL_FLOORS }, (_, i) => i + 1).map((floor) => (
        <button
          key={floor}
          type="button"
          className="floor-btn"
          disabled={disabled}
          onClick={() => onSelect(floor)}
        >
          {floor}F
        </button>
      ))}
    </div>
  )
}
