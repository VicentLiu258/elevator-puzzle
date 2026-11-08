import type { LevelConfig } from '../engine/types'

const CHAPTER_NAMES: Record<number, string> = {
  1: '入门指南',
  2: '进阶策略',
  3: '高手挑战',
  4: '大师殿堂',
}

interface Props {
  levels: LevelConfig[]
  currentId: number
  isCleared: (id: number) => boolean
  isUnlocked: (id: number) => boolean
  getBestStars: (id: number) => number
  onSelect: (id: number) => void
}

function MiniStars({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="level-chip__stars" aria-label={`${count} 星`}>
      {'★'.repeat(count)}
    </span>
  )
}

export function LevelSelect({
  levels,
  currentId,
  isCleared,
  isUnlocked,
  getBestStars,
  onSelect,
}: Props) {
  const demoLevel = levels.find((l) => l.id === 0)
  const chapters = new Map<number, LevelConfig[]>()
  for (const level of levels) {
    if (level.id === 0) continue
    const ch = level.chapter ?? 1
    if (!chapters.has(ch)) chapters.set(ch, [])
    chapters.get(ch)!.push(level)
  }

  return (
    <div className="level-select" role="navigation" aria-label="关卡选择">
      {/* 示例关 */}
      {demoLevel && (
        <div className="level-select__chapter">
          <button
            type="button"
            className={
              'level-chip level-chip--demo' +
              (currentId === 0 ? ' level-chip--current' : '') +
              (isCleared(0) ? ' level-chip--cleared' : '')
            }
            onClick={() => onSelect(0)}
            title="示例关卡"
          >
            例
          </button>
        </div>
      )}

      {/* 按章节分组 */}
      {[1, 2, 3, 4].map((ch) => {
        const chLevels = chapters.get(ch)
        if (!chLevels || chLevels.length === 0) return null
        return (
          <div key={ch} className="level-select__chapter">
            <span className="level-select__chapter-title">{CHAPTER_NAMES[ch]}</span>
            <div className="level-select__chips">
              {chLevels.map((level) => {
                const unlocked = isUnlocked(level.id)
                const cleared = isCleared(level.id)
                const current = level.id === currentId
                const stars = getBestStars(level.id)
                return (
                  <button
                    key={level.id}
                    type="button"
                    className={
                      'level-chip' +
                      (current ? ' level-chip--current' : '') +
                      (cleared ? ' level-chip--cleared' : '') +
                      (!unlocked ? ' level-chip--locked' : '') +
                      (stars === 3 ? ' level-chip--star3' : stars === 2 ? ' level-chip--star2' : stars === 1 ? ' level-chip--star1' : '')
                    }
                    disabled={!unlocked}
                    onClick={() => onSelect(level.id)}
                    title={`第 ${level.id} 关：${level.name}`}
                  >
                    {level.id}
                    <MiniStars count={stars} />
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
