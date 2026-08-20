---
id: prd-5
title: Inspire 数据架构升级（IndexedDB 本地化 + 老师机 hub 闭合同步）
tags: [inspire, 数据架构, IndexedDB, 本地优先, 多端同步, hub]
status: approved
approved_by: 用户
approved_date: 2026-08-17
summary: 将 inspire 数据从 localStorage 单键迁移为 IndexedDB 四库（本地优先、零配置）；提供老师机本地 hub 闭合多端同步（学生填 IP 连接，数据不出局域网）；可选的桌面应用化。统一 LWW 同步协议贯穿，默认本地优先；公司项目范围，不提供开放云端服务；独立部署暂缓，先用主站入口。
structure:
  - type: subprd
    id: prd-5-1
    title: 数据 IndexedDB 化
    file: prd-5-1/prd-5-1.md
  - type: subprd
    id: prd-5-2
    title: 老师机本地 hub 多端同步（闭合）
    file: prd-5-2/prd-5-2.md
  - type: subprd
    id: prd-5-3
    title: 应用化（可选）
    file: prd-5-3/prd-5-3.md
---

# prd-5 · Inspire 数据架构升级（总）

## 背景

当前 inspire 数据全部存于浏览器 `localStorage` 单键 `makexScoreData`：容量受限、每次全量序列化、无索引、多端无法协作、数据易丢。需要升级为「本地优先、可离线、闭合多端同步、渐进应用化」的架构。

## 范围

| 子 PRD | 内容 | 对应原 R |
|--------|------|---------|
| prd-5-1 数据 IndexedDB 化 | 四库 + 版本化 LWW 记录 + `merge()` + 一次性迁移 | R1 |
| prd-5-2 老师机本地 hub 闭合同步 | 老师机小服务 + 数据库文件；学生填 IP/扫码连接 | R2 |
| prd-5-3 应用化（可选） | Tauri/Electron 打包老师机 hub + 原生发现 | R3 |

## 数据模型（核心）

```js
// 每条记录为版本化 LWW 格式（为同步零迁移铺路）
{ id, lamport, deviceId, deleted, data }

// 四库（库名体现功能）
ins_edu      // 教务：students / classes / enrollments
ins_training // 任务 + 集训成绩：tasks / trainings（含 mockCompetitions/scores/schedule/studentGoals）
ins_practice // 自主练习：practiceRecords
ins_meta     // 配置：currentTrainingId / challengeTaskFilter / 同步配置

// 合并：LWW 元素集（lamport 决胜 + deviceId 兜底 + deleted 墓碑传播）
```

## 决策（已定稿）

- ✅ 默认**本地优先、零配置**打开即用；同步为可选能力
- ✅ 多端同步 = **老师机本地 hub**（0 元跑自有设备；闭合、数据自持、不出局域网）
- ✅ 同步协议统一：**LWW 合并 + outbox + snapshot**，一律 **client→hub** 形态
- ✅ 弃用 WebRTC 复制粘贴 P2P（操作复杂度不值）
- ✅ **独立部署暂缓**：先由主站入口（`/ins_tool.html` → `/inspire/`）承载，独立仓库/Pages 方案保留备用
- ✅ 公司项目范围：**不提供开放云端服务**；个人轨（推广域名 / Cloudflare Worker 开放服务）不进本项目

## 数据边界

- 学生机本地保留 IndexedDB 四库，**断网可用本地数据**
- 老师机 hub 数据**落盘、断电不丢**、可当权威
- 数据不出局域网（闭合）；不提供开放云端服务
- `Shared.data` 内存模型不变，只换持久化/同步后端

## 推进阶段（GATE）

| 阶段 | 子 PRD | 验证 |
|------|--------|------|
| P1 | prd-5-1 | 四库迁移后数据完整、格式冻结、语法/回归通过 |
| P2 | prd-5-2 | 学生填 IP 连上 hub、自动合并、hub 落盘 |
| P3 | prd-5-3 | 桌面应用打包运行、浏览器用户可连 |
