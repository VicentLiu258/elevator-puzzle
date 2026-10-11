import { EXAMPLE_LEVEL, EXAMPLE_SOLUTION } from '../engine/exampleLevel'

interface Props {
  isOpen: boolean
  onClose: () => void
  onPlayDemo: (levelId: number, commands: number[]) => void
}

export function ExampleModal({ isOpen, onClose, onPlayDemo }: Props) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header__title">
            <span className="modal-header__icon">📖</span>
            <h2>新手入门与示例演练</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <h3 className="modal-section__title">💡 调度核心规则（30 秒速览）</h3>
            <div className="rule-cards">
              <div className="rule-card">
                <span className="rule-card__num">1</span>
                <div>
                  <strong>初始自动上车</strong>
                  <p>电梯在起始楼层自动接上该层乘客，<strong>不计入</strong>停靠次数。</p>
                </div>
              </div>
              <div className="rule-card">
                <span className="rule-card__num">2</span>
                <div>
                  <strong>先下后上 & 靠门先上</strong>
                  <p>停靠某层时，到站者<strong>先下车</strong>腾位；候梯者按排队顺序（靠门者先上）。</p>
                </div>
              </div>
              <div className="rule-card">
                <span className="rule-card__num">3</span>
                <div>
                  <strong>容量上限与戏谑问号</strong>
                  <p>轿厢满员时无法再上客；若最后未按时送达，乘客会晃头冒出<strong>戏谑问号 ❓</strong>！</p>
                </div>
              </div>
            </div>
          </section>

          <section className="modal-section">
            <h3 className="modal-section__title">🎯 经典示例拆解：巧用腾位与折返</h3>
            <div className="example-brief">
              <div className="example-brief__meta">
                <span>容量：{EXAMPLE_LEVEL.capacity} 人</span>
                <span>起点：{EXAMPLE_LEVEL.startFloor}F</span>
                <span>
                  乘客：A(1→5F)、B(3→1F)、C(5→3F)
                </span>
              </div>

              <div className="example-steps">
                <div className="example-step">
                  <span className="example-step__tag">开局</span>
                  <span className="example-step__desc">1F 起始：A 自动上车（轿厢 1/2）</span>
                </div>
                <div className="example-step">
                  <span className="example-step__tag">停 3F</span>
                  <span className="example-step__desc">B 上车合乘（轿厢满员 2/2：A + B）</span>
                </div>
                <div className="example-step">
                  <span className="example-step__tag">停 5F</span>
                  <span className="example-step__desc">A 下车到达 🎉！腾出空位，C 上车（2/2：B + C）</span>
                </div>
                <div className="example-step">
                  <span className="example-step__tag">停 3F</span>
                  <span className="example-step__desc">折返下行：C 下车到达 🎉！车内剩 B（1/2）</span>
                </div>
                <div className="example-step">
                  <span className="example-step__tag">停 1F</span>
                  <span className="example-step__desc">B 下车到达 🎉！全员成功送达，通关！</span>
                </div>
              </div>

              <div className="example-seq">
                <span className="example-seq__label">示范停靠序列：</span>
                <span className="example-seq__values">
                  {EXAMPLE_SOLUTION.map((f, i) => (
                    <span key={i} className="example-seq__chip">
                      {f}F
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            我知道了
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              onPlayDemo(0, [...EXAMPLE_SOLUTION])
              onClose()
            }}
          >
            🚀 载入示例并自动演练
          </button>
        </div>
      </div>
    </div>
  )
}
