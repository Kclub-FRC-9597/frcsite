# PRD：目标管理改造 —— 移除「目标设定」+ 新增任务级目标梯度（级别规划）

> 日期：2026-08-10 ｜ 状态：已定稿，待实施 ｜ 范围：`frcsite/public/inspire/`（纯前端，localStorage）

## 一、背景与决策

「目标设定」最初以**记录类型**（`competitionType='goal'`）实现。该模型不适合"动态管理目标"：

- 目标是数值却被当成"打过分的比赛记录"录入，语义错位；
- 没有"目标 vs 实际"的对照，无法体现达标/未达标、差距；
- 调整目标需要重建/修改记录，无法频繁调整与留痕；
- 为了让目标成绩"不计入统计"，不得不在多个页面到处过滤（最佳成绩/综合最佳/排名/学员成绩卡/统计页/趋势图），维护成本高。

**决策**：移除「目标设定」记录类型；把目标重新建模为**任务级梯度（级别规划）**，全员共用同一套标准，创建任务时设定、后续可改。

## 二、需求 1：移除「目标设定」记录类型

- **入口**：新增记录弹窗不再显示 `🎯 目标设定` 选项（只留 模拟赛 / 正赛）。
- **内部实现**：删除目标设定的默认命名、类型辅助函数（goal 分支）、统计排除逻辑、changelog 记录。
- **数据**：已建的 goal 记录**保留在 localStorage 作历史**，不迁移、不清理。

### 定点删除清单（本次采用此方案，不用整体回撤）

| 文件 | 删点 |
|------|------|
| `public/inspire/training.html` | 下拉 `<option value="goal">🎯 目标设定</option>`；`confirmMockModal` 的 goal 默认命名与 `isStatCounted` 计数（还原为 `training.mockCompetitions.length`）；`addMockCompetition` 的 `isStatCounted` 计数与注释；`renderTrainingList` 的 `statMocks` 过滤与 goal 注释、占位 else 分支；`renderStudentDetail` 的 `chartRecords` 过滤与两处 `if (!Shared.isStatCounted(mock)) return;` |
| `public/inspire/shared.js` | `getMockTypeText/getMockTypeLabel/getMockTypeBg` 去掉 goal 分支（只保留 模拟赛/正赛）；删除 `isStatCounted` |
| `public/inspire/student.js` | 删除 `if (mockSource === 'goal') return;` |
| `public/inspire/stats.html` | 删除 `if (Shared.getMockType(m) === 'goal') return;` |
| `public/inspire/changelog.js` | 删除 2026-08-10「记录类型新增目标设定」条目 |

**保留（非目标设定）**：`__default__` 概览兜底修复（无任务但有成绩的记录也能进最佳成绩统计）；`Shared.getMockType*` 徽章/文案重构（行为等价）。

## 三、需求 2：任务级目标梯度（级别规划）

### 3.1 核心概念

- **梯度等级（goalLevel）**：挂在任务上的等级档，每档含 `名称 + 最低得分(minScore) + 最迟用时(maxTime)`。
- **判定**：取学员最佳成绩**同时满足「得分 ≥ minScore 且 用时 ≤ maxTime」的最高档**；单边阈值留空则只看另一边。
- **全员一致**：任务梯度为默认标准，所有学员共用 → 统计口径一致。
- **学员覆盖（附加能力）**：个别学员可覆盖某任务梯度，仅影响该学员。

### 3.2 功能需求（FR）

| 编号 | 需求 |
|------|------|
| FR1 | **任务梯度配置**（`tasks.html`）：创建/编辑任务时增删档位，每档填名称 + 最低得分(可空) + 最迟用时(可空)；后续可随时改，改完即生效；未配置梯度 = 该任务不参与等级判定 |
| FR2 | **等级判定函数**（`shared.js`/`analysis.js`）：`evaluateGoal(bestScore, bestTime, levels)` 返回最高达标档；无成绩或未达最低档 = 未达标 |
| FR3 | **集训统计展示**（`training.html`）：最佳成绩旁显示等级徽章；概览汇总各等级人数 + 达标率；学员可"调整目标"覆盖梯度 |
| FR4 | **学员详情 / 统计页**（`student.js`/`stats.html`）：每任务显示当前达到等级、距下一档差距（分/秒）；统计页加达标率 |
| FR5 | **移除旧「目标设定」**：按第二节清单定点删除 |

### 3.3 数据模型（纯前端 localStorage，无需迁移）

```js
// 任务上：梯度档位（自由增删）
task.goalLevels = [
  { id: 'lv1', name: '达标', minScore: 60, maxTime: 12 },  // 得分≥60 且 用时≤12s
  { id: 'lv2', name: '良好', minScore: 80, maxTime: 10 },
  { id: 'lv3', name: '优秀', minScore: 90, maxTime: 8  }
]

// 集训上：学员覆盖（可选，缺省走任务默认梯度）
training.studentGoals = [
  { id, studentId, taskId, goalLevels: [ /* 该学员专属梯度 */ ] }
]
```

### 3.4 判定规则

```
grade(bestScore, bestTime, levels):
    reached = null
    for lv in levels(按阈值升序):
        okScore = lv.minScore==null || bestScore>=lv.minScore
        okTime  = lv.maxTime==null || bestTime!=null && bestTime<=lv.maxTime
        if okScore && okTime: reached = lv
    return reached   // null = 未达标
```

成绩输入：以**最佳成绩**（best-of：得分优先、同分取短用时）为判定输入，与现有概览口径一致。

### 3.5 兼容与边界

- 旧任务无 `goalLevels` → 不判定，行为与现状一致。
- 已建的 goal 历史记录保留，仅移除入口。
- 成绩录入、赛程、CSV 导出不受影响。

### 3.6 非功能

- 纯前端，无后端/DB 改动。
- 判定函数集中在 `Shared`/`Analysis`，便于单测。
- 数据全部存 localStorage，无需迁移脚本。

## 四、推进计划

| 阶段 | 内容 | 文件 | 验证 |
|------|------|------|------|
| P0 前置 | ① git 提交安全点；② 定点删除目标设定 | 第二节 5 文件 | `node --check` + 内联脚本校验；浏览器确认下拉只剩 模拟赛/正赛、轮次编号回归 |
| P1 模型与判定 | `task.goalLevels` + `Shared.evaluateGoal`；旧任务无 `goalLevels` 兜底 | `shared.js` | 判定函数单测（含单边留空、无成绩、并列档位） |
| P2 梯度编辑 UI | 任务管理页维护梯度：增删档、改名称/阈值、留空支持 | `tasks.html` | 增删档位持久化、刷新保留 |
| P3 集训展示 | 最佳成绩旁等级徽章、概览各等级人数/达标率、学员"调整目标"覆盖弹窗 | `training.html` | 注入测试数据验证徽章/达标率/覆盖 |
| P4 学员与统计页 | 学员详情当前等级 + 差距；统计页达标率 | `student.js` `stats.html` | 数据回归 |
| P5 收尾 | changelog 记录「新增任务级梯度」；全量语法校验 | `changelog.js` | 浏览器回归 + 提交 |

**风险**：梯度 UI 是唯一新增交互，集中在 `tasks.html` + `shared.js` 判定函数；统计展示复用现有 best-of 逻辑，不触碰成绩录入/赛程。

## 五、验收标准

1. 「目标设定」不再出现在任何入口；新增模拟赛默认名回到「第N轮」（目标设定不再占用编号）。
2. `__default__` 概览修复仍生效（无任务记录也能进最佳成绩概览）。
3. 任务可配置/修改梯度，旧任务无梯度时不影响任何统计。
4. 集训详情、学员详情、统计页正确显示等级徽章、各等级人数、达标率与差距。
5. 全量语法校验通过，浏览器回归无异常。
