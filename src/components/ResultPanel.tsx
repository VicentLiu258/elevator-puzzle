import type { FailureInfo } from '../engine/types'

interface Props {
  success: boolean
  failureInfo?: FailureInfo
}

export function ResultPanel({ success, failureInfo }: Props) {
  if (success) {
    return (
      <div className="result result--success" role="alert">
        <strong>全部送达</strong>
        <span>所有乘客都到了目的楼层！</span>
      </div>
    )
  }

  const undelivered = failureInfo?.undelivered ?? []
  const denied = failureInfo?.deniedEvents ?? []

  return (
    <div className="result result--fail" role="alert">
      <strong>未全部送达</strong>
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
