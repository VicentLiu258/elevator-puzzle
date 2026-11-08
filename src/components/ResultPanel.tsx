import type { FailureInfo } from '../engine/types'

interface Props {
  success: boolean
  failureInfo?: FailureInfo
  onOpenHelp?: () => void
  /** 本次通关获得的星级 1-3，仅在 success 时有效 */
  stars?: 1 | 2 | 3
  /** 本次实际停靠数 */
  stopsUsed?: number
  /** 最优停靠数 */
  optimalStops?: number
}

function StarDisplay({ stars }: { stars: 1 | 2 | 3 }) {
  return (
    <span className="result-stars" aria-label={`${stars} 星`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`result-star ${i <= stars ? 'result-star--lit' : 'result-star--dim'}`}
          style={{ animationDelay: `${(i - 1) * 0.25}s` }}
        >
          ★
        </span>
      ))}
    </span>
  )
}

export function ResultPanel({
  success,
  failureInfo,
  onOpenHelp,
  stars,
  stopsUsed,
  optimalStops,
}: Props) {
  if (success) {
    return (
      <div className="result result--success" role="alert">
        {stars && <StarDisplay stars={stars} />}
        <strong>全部送达 🎉</strong>
        {stopsUsed != null && optimalStops != null && (
          <span className="result__stats">
            本次 {stopsUsed} 步 / 最优 {optimalStops} 步
          </span>
        )}
        {stars != null && stars < 3 && (
          <span className="result__hint">还能更少步数通关！</span>
        )}
      </div>
    )
  }

  const undelivered = failureInfo?.undelivered ?? []
  const denied = failureInfo?.deniedEvents ?? []

  return (
    <div className="result result--fail" role="alert">
      <div className="result__head">
        <strong>未全部送达</strong>
        {onOpenHelp && (
          <button
            type="button"
            className="result__help-btn"
            onClick={onOpenHelp}
            title="查看本关解法提示与策略"
          >
            💡 求助提示
          </button>
        )}
      </div>
      {undelivered.length > 0 && (
        <ul>
          {undelivered.map(({ passenger, currentFloor }) => (
            <li key={passenger.id}>
              乘客 {passenger.id} 未送达，当前在 {currentFloor}F（目标 {passenger.to}F）
            </li>
          ))}
        </ul>
      )}
      {denied.length > 0 && (
        <ul className="result__denied">
          {denied.map((d, i) => (
            <li key={`${d.passenger.id}-${d.step}-${i}`}>
              第 {d.step} 步在 {d.floor}F：乘客 {d.passenger.id} 因满员未能上车
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
