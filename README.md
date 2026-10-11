# 电梯今天听你的

网页益智游戏：为电梯编排有限次停靠序列，点击运行后自动播放结果，把所有乘客送到目的楼层。

## 技术栈

- React + TypeScript + Vite
- Vitest（引擎单元测试）
- 纯函数模拟引擎（`src/engine/`），UI 只播放 `steps`

## 开发

```bash
npm install
npm run dev
```

```bash
npm test           # 单元测试
npm run validate   # 打印 10 关最少停靠 / 解数量 / 是否折返
npm run build
```

## 规则摘要

1. 开始前电梯在起始楼层自动上客（不计停靠次数）
2. 指令为楼层数组，长度 ≤ maxStops；重复楼层各算一次
3. 每次停靠：移动 → 先下客 → 再上客（按排队顺序，不超过容量）
4. 经过不停靠的楼层不上下客
5. 全部指令执行完后，所有乘客都在目的楼层即成功

进度保存在 `localStorage`（键名 `elevator-puzzle-cleared`）。
