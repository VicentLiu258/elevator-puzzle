/**
 * 关卡验证脚本：对每关打印最少停靠次数、可行解数量、是否存在折返。
 * 运行：npm run validate
 */
import { LEVELS } from '../src/data/levels'
import { solve, verifySolution } from '../src/engine/solver'

function main(): void {
  console.log('=== 电梯关卡验证 ===\n')

  let allOk = true

  for (const level of LEVELS) {
    const searchLevel = { ...level, maxStops: 10 }
    const result = solve(searchLevel, { searchLimit: 10, maxSolutions: 50 })

    if (!Number.isFinite(result.minStops)) {
      console.log(`关卡 ${level.id}「${level.name}」: ❌ 无解`)
      allOk = false
      continue
    }

    const sample = result.solutions[0] ?? []
    const playable = { ...level, maxStops: result.minStops }
    const verified = sample.length === 0 || verifySolution(playable, sample)
    const maxStopsMatch = level.maxStops === result.minStops

    const status = verified && maxStopsMatch ? '✅' : '❌'
    if (!verified || !maxStopsMatch) allOk = false

    console.log(
      `${status} 关卡 ${level.id}「${level.name}」\n` +
        `   最少停靠: ${result.minStops}（数据 maxStops=${level.maxStops}${maxStopsMatch ? '' : ' ⚠ 不一致'}）\n` +
        `   可行解数: ${result.solutions.length}${result.solutions.length >= 50 ? '+' : ''}\n` +
        `   需要折返: ${result.hasReturn ? '是' : '否'}\n` +
        `   示例解: [${sample.join(', ')}]\n` +
        `   乘客: ${level.passengers.map((p) => `${p.id}:${p.from}→${p.to}`).join(', ')}\n` +
        `   容量: ${level.capacity}\n`,
    )
  }

  console.log(allOk ? '全部关卡验证通过。' : '存在失败关卡，请检查设计。')
  if (!allOk) {
    process.exitCode = 1
  }
}

main()
