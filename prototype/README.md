# 电梯再等一个 · 玩偶公寓

Cocos Creator **3.8.8** / TypeScript / Blender，十趟完整经营游戏。原 React 项目及已有修改保留；当前发布入口是本目录的 Cocos 工程。载重、偏载和应急停靠均为虚构街机规则。

## 启动与操作

使用 Creator 3.8.8 打开 `cocos/`，场景为 `assets/scene/main.scene`。点击「开始营业」。点候梯乘客查看重量、占地、票价及属性，再点轿厢站位上客；也支持拖动。点已上客乘客可换位、下车。搬家客占同一行两格。关门倒计时可以重开，每趟最多一个额外乘客；开门完成才能进出。行进中 A/D 或大扶手调整重心，同时按左右为中性。

270 秒营业，最多十趟。结算停留 6 秒后自动下一趟，也可立即继续或暂停查看。营业时间耗尽后停止接客，当前运输安全完成再打烊。暂停及切后台不计时，返回需手动点继续。右上角有规则、静音和重开。仅本地保存静音设置、最好净收入和最多完成趟数。

## 构建、测试、发布

从项目根目录执行：

```sh
sh prototype/tests/run-core-tests.sh
sh prototype/scripts/build-web.sh
python3 -m http.server 4175 --directory prototype/cocos/build/web
```

构建脚本调用本机 Creator 3.8.8（可通过 `CREATOR_BIN` 指定同版本可执行文件）。Creator 成功退出码为 36；脚本同时要求成功日志。发布打包使用 Vercel Build Output API v3，仅上传实际 Web 产物，不上传 Blender 源工程或原 React 工程。发布目标已锁定原项目 `elevator-puzzle` 与原团队，域名仍是 `elevator.aiboomprompt.com`。

```sh
cd prototype/release
vercel deploy --prebuilt --prod --skip-domain --yes --scope vicente-lius-projects
# 验证暂存部署后，再执行：
vercel promote <实际部署URL> --yes --scope vicente-lius-projects
```

**后续更新也必须使用以上 Cocos 构建发布流程**。原仓库根目录 Vite 工程并非当前游戏入口，不应直接以旧 Vite 流程覆盖线上版本。此次未推送原有未提交修改。

## 文件入口

- `cocos/assets/scripts/core/config.ts`：全部规则参数、六类乘客初值。
- `core/levels.ts`：十趟目标、目的楼层、到达时刻、准时奖和取舍。
- `core/game.ts`：纯数据状态机与固定步长模型。
- `core/input.ts`、`core/save.ts`：双指/键盘输入与容错本地存档。
- `PrototypeUI.ts`、`Diorama.ts`、`GameAudio.ts`：交互界面、真实三维模型显示、原创合成声音。
- `art/generate_diorama.py`、`art/elevator-dolls.blend`：可重复生成脚本、可编辑 Blender 源文件。
- `cocos/assets/resources/models/`：实际导出的 9 个 FBX；六种玩偶、轿厢、门、搬家货物。携带物、扶手、指示灯和楼层平台包含于对应模型或场景节点。
- `docs/RULES.md`、`docs/TEST-RELEASE.md`、`docs/strategy-results.json`：模型说明、测试记录、实际策略模拟结果。

模型用节点动画表达等待、进出、摇晃和安全下客。固定略俯视镜头，视觉倾斜不修改逻辑站位。资源失败可重试且暂停计时，音频不可用时仍能游玩。
