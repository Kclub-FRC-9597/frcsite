---
id: prd-4
title: 目标管理改造（移除目标设定 + 任务级梯度）
tags: [inspire, 目标管理, 梯度, 集训, 前端, localStorage]
status: draft
approved_by: null
approved_date: null
summary: 移除「目标设定」记录类型（定点删除，保留 __default__ 概览修复），将目标重新建模为任务级梯度（级别规划）：任务创建时可配置梯度档位、全员一致、可后续修改、支持学员覆盖；判定基于最佳成绩（得分+用时）。
structure:
  - type: r
    id: R1
    title: 移除目标设定
    file: R1.md
  - type: r
    id: R2
    title: 梯度模型判定
    file: R2.md
  - type: r
    id: R3
    title: 任务梯度配置
    file: R3.md
  - type: r
    id: R4
    title: 集训统计展示
    file: R4.md
  - type: r
    id: R5
    title: 学员统计展示
    file: R5.md
  - type: r
    id: R6
    title: 收尾验证
    file: R6.md
---

# prd-4 · 目标管理改造（移除目标设定 + 任务级梯度）

## 背景

「目标设定」最初以**记录类型**（`competitionType='goal'`）实现。该模型不适合"动态管理目标"：

- 目标是数值却被当成"打过分的比赛记录"录入，语义错位；
- 没有"目标 vs 实际"的对照，无法体现达标/未达标、差距；
- 调整目标需重建记录，无法频繁调整与留痕；
- 为让目标成绩"不计入统计"，需在多个页面到处过滤（最佳成绩/综合最佳/排名/学员成绩卡/统计页/趋势图），维护成本高。

**决策**：移除「目标设定」记录类型；把目标重新建模为**任务级梯度（级别规划）**，全员共用同一套标准，创建任务时设定、后续可改。

## 范围

| 需求 | R | 说明 |
|------|---|------|
| A 移除「目标设定」 | R1 | 定点删除记录类型（入口 + 内部实现） |
| B 任务级目标梯度 | R2 | 数据模型 `task.goalLevels` + 判定函数 `Shared.evaluateGoal` |
| | R3 | 任务管理页梯度配置 UI（`tasks.html`） |
| | R4 | 集训统计展示（`training.html` 徽章/达标率/学员覆盖） |
| | R5 | 学员详情与统计页展示（`student.js`/`stats.html`） |
| C 收尾 | R6 | changelog + 全量语法校验 + 浏览器回归 + 提交 |

## 数据模型（核心）

```js
task.goalLevels = [
  { id: 'lv1', name: '达标', minScore: 60, maxTime: 12 },  // 得分≥60 且 用时≤12s
  { id: 'lv2', name: '良好', minScore: 80, maxTime: 10 },
  { id: 'lv3', name: '优秀', minScore: 90, maxTime: 8  }
]
training.studentGoals = [ { id, studentId, taskId, goalLevels: [/* 学员专属 */] } ]
```

判定：取学员最佳成绩**同时满足「得分 ≥ minScore 且 用时 ≤ maxTime」的最高档**；单边阈值留空只看另一边；旧任务无 `goalLevels` 不判定。

## 待确认点（draft，需用户拍板）

1. 判定依据：**得分 + 用时**（两者都满足）——还是简化版「满分前提下的时间」？
2. 档位：**可自定义任意档数**（默认）还是固定 3 档？
3. 学员覆盖：保留作为**附加能力**，还是先只做全员一致？

## 推进阶段（GATE）

| 阶段 | R | 验证 |
|------|---|------|
| P0② | R1 | 定点删除后下拉只剩 模拟赛/正赛、轮次编号回归、语法校验 |
| P1 | R2 | 判定函数单测（含单边留空/无成绩/并列档位） |
| P2 | R3 | 梯度增删档持久化、刷新保留 |
| P3 | R4 | 徽章/各等级人数/达标率/学员覆盖 |
| P4 | R5 | 学员详情当前等级+差距、统计页达标率 |
| P5 | R6 | changelog + 全量校验 + 浏览器回归 + 提交 |

测试见 `TESTPLAN.md`（GATE 1~5）。P0①（git 安全点提交）已完成：`46389d3`。
