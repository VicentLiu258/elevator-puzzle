# 电梯今天听你的

网页益智游戏：为电梯编排有限次数的停靠序列，点击运行后自动播放结果，把所有乘客送到目的楼层。

## 技术栈

- React + TypeScript + Vite
- Vitest（引擎单元测试）
- 规则引擎在 `src/engine/`，UI 只播放 `simulate` 返回的 steps

## 开发

```bash
npm install
npm run dev
```

```bash
npm test           # 单元测试
npm run validate   # 校验 10 关最少停靠 / 折返
npm run build
```

## 规则摘要

1. 开始前电梯在起始层自动上客（不计停靠）
2. 每次停靠：先下客，再按排队顺序上客（不超过容量）
3. 经过未停靠的楼层不上下客
4. 成功：指令执行完后所有乘客均在目的楼层

## 关卡

首版 10 关灰盒，`maxStops` 由 BFS solver 最少停靠次数固化。
