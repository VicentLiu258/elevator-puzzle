interface Props {
  maxStops: number
  commands: number[]
  /** 播放完成后依次亮起 */
  highlightCount?: number
  disabled?: boolean
  onRemove: (index: number) => void
}

export function CommandSlots({
  maxStops,
  commands,
  highlightCount = 0,
  disabled,
  onRemove,
}: Props) {
  const slots = Array.from({ length: maxStops }, (_, i) => commands[i] ?? null)

  return (
    <div className="command-slots" aria-label="停靠指令槽">
      {slots.map((floor, i) => (
        <button
          key={i}
          type="button"
          className={
            'slot' +
            (floor !== null ? ' slot--filled' : '') +
            (i < highlightCount ? ' slot--lit' : '')
          }
          disabled={disabled || floor === null}
          onClick={() => onRemove(i)}
          title={floor !== null ? `删除 ${floor}F` : '空槽'}
        >
          {floor !== null ? `${floor}F` : '·'}
        </button>
      ))}
    </div>
  )
}
