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
        const isDemo = level.id === 0
        const unlocked = isUnlocked(level.id)
        const cleared = isCleared(level.id)
        const current = level.id === currentId
        return (
          <button
            key={level.id}
            type="button"
            className={
              'level-chip' +
              (isDemo ? ' level-chip--demo' : '') +
              (current ? ' level-chip--current' : '') +
              (cleared ? ' level-chip--cleared' : '') +
              (!unlocked ? ' level-chip--locked' : '')
            }
            disabled={!unlocked}
            onClick={() => onSelect(level.id)}
            title={isDemo ? `示例关卡：${level.name}` : `第 ${level.id} 关：${level.name}`}
          >
            {isDemo ? '例' : level.id}
            {cleared && !isDemo ? '✓' : ''}
          </button>
        )
      })}
    </div>
  )
}
