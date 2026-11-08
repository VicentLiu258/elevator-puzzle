/**
 * 关卡验证脚本：对每关打印最少停靠次数、可行解数量、是否存在折返。
 * 运行：npm run validate
 */
import { LEVELS } from '../src/data/levels'
import { solve, verifySolution } from '../src/engine/solver'

function main(): void {
  console.log('=== 电梯关卡验证 ===\n')

  let allOk = true
  const chapterStats = new Map<number, { count: number; totalOpt: number }>()

  for (const level of LEVELS) {
    const ch = level.chapter ?? 1
    if (!chapterStats.has(ch)) chapterStats.set(ch, { count: 0, totalOpt: 0 })
    const stats = chapterStats.get(ch)!

    const searchLevel = { ...level, maxStops: 25 }
    const result = solve(searchLevel, { searchLimit: 20, maxSolutions: 50 })

    if (!Number.isFinite(result.minStops)) {
      console.log(`关卡 ${level.id}「${level.name}」: ❌ 无解`)
      allOk = false
      continue
    }

    const sample = result.solutions[0] ?? []
    const playable = { ...level, maxStops: result.minStops }
    const verified = sample.length === 0 || verifySolution(playable, sample)
    const optMatch = level.optimalStops === result.minStops
    const maxValid = level.maxStops >= result.minStops
    const hasWaves = level.waves && level.waves.length > 1

    const status = verified && optMatch && maxValid ? '✅' : '❌'
    if (!verified || !optMatch || !maxValid) allOk = false

    stats.count++
    stats.totalOpt += result.minStops

    const slack = level.maxStops - result.minStops
    console.log(
      `${status} 关卡 ${level.id}「${level.name}」[Ch${ch}]\n` +
        `   最少停靠: ${result.minStops}（数据 optimalStops=${level.optimalStops}${optMatch ? '' : ' ⚠ 不一致'}）\n` +
        `   maxStops: ${level.maxStops}${maxValid ? '' : ' ⚠ < minStops'}  slack=${slack}\n` +
        `   可行解数: ${result.solutions.length}${result.solutions.length >= 50 ? '+' : ''}\n` +
        `   需要折返: ${result.hasReturn ? '是' : '否'}\n` +
        `   起始楼层: ${level.startFloor}  容量: ${level.capacity}${hasWaves ? `  波次: ${level.waves!.length}` : ''}\n` +
        `   示例解: [${sample.join(', ')}]\n` +
        `   乘客: ${(hasWaves ? level.waves!.flat() : level.passengers).map((p) => `${p.id}:${p.from}→${p.to}`).join(', ')}\n`,
    )
  }

  console.log('--- 章节统计 ---')
  for (const [ch, stats] of [...chapterStats.entries()].sort((a, b) => a[0] - b[0])) {
    const avgOpt = stats.count > 0 ? (stats.totalOpt / stats.count).toFixed(1) : '-'
    console.log(`  第${ch}章: ${stats.count} 关, 平均最优步数 ${avgOpt}`)
  }
  console.log()

  console.log(allOk ? '全部关卡验证通过。' : '存在失败关卡，请检查设计。')
  if (!allOk) {
    process.exitCode = 1
  }
}

main()
