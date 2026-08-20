---
id: prd-5-1
parent: prd-5
title: 数据 IndexedDB 化
tags: [inspire, IndexedDB, 本地优先, 数据迁移]
status: approved
approved_by: 用户
approved_date: 2026-08-17
summary: 将 inspire 数据从 localStorage 单键迁移为 IndexedDB 四库（本地优先、零配置）；记录采用版本化 LWW 格式；每库独立版本迁移；merge() 落地；一次性迁移与同机多标签联动。prd-5 总纲下的第一个子 PRD（对应原 R1）。
structure:
  - type: r
    id: R1
    title: 数据 IndexedDB 化
    file: R1.md
---

# prd-5-1 · 数据 IndexedDB 化

## 背景

把 inspire 全部业务数据从 localStorage 单键 `makexScoreData` 迁入 IndexedDB 四库，本地优先、零配置；记录格式一次到位（版本化 LWW），为多端同步（prd-5-2）零迁移铺路。

## 设计

### 1. 四库

| 库 | 承载 | Object Store |
|----|------|--------------|
| `ins_edu` | 教务 | `students` / `classes` / `enrollments` |
| `ins_training` | 任务 + 集训成绩 | `tasks` / `trainings`（内含 mockCompetitions/scores/schedule/studentGoals） |
| `ins_practice` | 自主练习 | `practiceRecords` |
| `ins_meta` | 配置/同步 | `kv`（key→value） |

### 2. 版本化记录与合并

```js
{ id, lamport, deviceId, deleted, data }
// merge(local, incoming)：按 lamport 决胜、deviceId 兜底、deleted 墓碑传播
```

- 每库独立 `DB_VERSION` + `_MIGRATIONS`；`onupgradeneeded` 从 `oldVersion+1` 逐级执行
- `merge()`（LWW 元素集）一并落地，含并发/删除复活/平局单测

### 3. 持久化门面

- `Shared.data` 内存模型不变；`loadData()` 读四库组装、`saveData()` 按域增量写
- 一次性迁移：`makexScoreData` → 四库；旧 `STS_DB` 清理
- 同机多标签页用 `BroadcastChannel` 通知（替代 localStorage `storage` 事件）
- localStorage 只留小配置，逐步弃用

## 涉及文件

- `public/inspire/shared.js`（loadData/saveData 换后端）
- `public/inspire/shared_indexdb.js`（四库 + 版本化记录 + 迁移框架 + merge）
- `public/inspire/devtools.js`（DB 管理 / 迁移工具同步）

## 验收要点

1. 数据完整迁入四库，格式冻结（版本化 LWW 记录）。
2. 每库版本迁移可回放、幂等；`merge()` 单测通过。
3. 打开即用、无服务器无配置；同机多标签实时联动。
4. 语法校验与浏览器回归通过。

## 不做

- 多端同步（prd-5-2）
- 开放云端服务
