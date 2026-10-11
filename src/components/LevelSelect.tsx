import type { LevelConfig } from '../engine/types'

interface Props {
  levels: LevelConfig[]
  currentId: number
  isCleared: (id: number) => boolean
  isUnlocked: (id: number) => boolean
  onSelect: (id: number) => void
}

export function LevelSelect({
  levels,
  currentId,
  isCleared,
  isUnlocked,
  onSelect,
}: Props) {
  return (
    <div className="level-select" role="navigation" aria-label="关卡选择">
      {levels.map((level) => {
        const unlocked = isUnlocked(level.id)
        const cleared = isCleared(level.id)
        const current = level.id === currentId
        return (
          <button
            key={level.id}
            type="button"
            className={
              'level-chip' +
              (current ? ' level-chip--current' : '') +
              (cleared ? ' level-chip--cleared' : '') +
              (!unlocked ? ' level-chip--locked' : '')
            }
            disabled={!unlocked}
            onClick={() => onSelect(level.id)}
            title={level.name}
          >
            {level.id}
            {cleared ? '✓' : ''}
          </button>
        )
      })}
    </div>
  )
}
