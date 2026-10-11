import { useMemo } from 'react'
import { analyzeHint } from '../engine/hint'
import type { LevelConfig } from '../engine/types'

interface Props {
  isOpen: boolean
  level: LevelConfig
  currentCommands: number[]
  onClose: () => void
  onApplyNextStep: (floor: number) => void
  onApplySolution: (solution: number[], autoRun?: boolean) => void
}

export function HelpModal({
  isOpen,
  level,
  currentCommands,
  onClose,
  onApplyNextStep,
  onApplySolution,
}: Props) {
  const hint = useMemo(
    () => analyzeHint(level, currentCommands),
    [level, currentCommands],
  )

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-card--help" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header__title">
            <span className="modal-header__icon">💡</span>
            <h2>关卡求助与调度提示</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* 关卡情报与策略指引 */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <span>📊 关卡情报（{level.id}. {level.name}）</span>
            </h3>
            <ul className="help-tactics">
              {hint.tactics.map((t, idx) => (
                <li key={idx} className="help-tactic-item">
                  {t}
                </li>
              ))}
            </ul>
          </section>

          {/* 渐进提示：建议下一步 */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <span>🔍 建议下一步</span>
            </h3>
            <div className="help-step-box">
              {hint.nextFloorHint !== null ? (
                <>
                  <div className="help-step-box__content">
                    {hint.isPrefixMatching ? (
                      <p>
                        当前已编排 <strong>{currentCommands.length}</strong> 步，建议下一步前往：
                      </p>
                    ) : (
                      <p className="help-step-box__warn">
                        ⚠️ 当前输入已偏离最优解，推荐首选前往：
                      </p>
                    )}
                    <span className="help-step-box__floor">{hint.nextFloorHint}F</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => {
                      if (hint.nextFloorHint !== null) {
                        onApplyNextStep(hint.nextFloorHint)
                        onClose()
                      }
                    }}
                  >
                    + 填入此楼层（{hint.nextFloorHint}F）
                  </button>
                </>
              ) : (
                <p>当前停靠序列已达上限或已全部送达。</p>
              )}
            </div>
          </section>

          {/* 终极解法：一键填入最优序列 */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <span>🎯 最优通关方案（终极锦囊）</span>
            </h3>
            <div className="help-solution-box">
              <div className="help-solution-chips">
                {hint.bestSolution.map((floor, i) => (
                  <span key={i} className="help-solution-chip">
                    <span className="help-solution-chip__idx">{i + 1}</span>
                    <span className="help-solution-chip__num">{floor}F</span>
                  </span>
                ))}
              </div>
              <p className="help-solution-desc">
                只需 {hint.bestSolution.length} 次停靠即可全部无误送达。可一键填入，亦可直接运行观看全套演示！
              </p>
              <div className="help-solution-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    onApplySolution(hint.bestSolution, false)
                    onClose()
                  }}
                >
                  填入指令序列
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    onApplySolution(hint.bestSolution, true)
                    onClose()
                  }}
                >
                  ⚡ 一键填入并运行
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            返回继续思考
          </button>
        </div>
      </div>
    </div>
  )
}
