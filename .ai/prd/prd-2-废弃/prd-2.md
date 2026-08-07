---
id: prd-2
title: Inspire 多设备数据访问
tags: [inspire, api, 读写分离, 数据导入, 前端接入, 学习]
status: deprecated
deprecated: true
deprecation_reason: "方案改为纯 Cloudflare Workers + D1（见 prd-3），本 PRD 基于 PostgreSQL 作废；仅保留作历史记录，不得执行"
approved_by: null
approved_date: null
summary: 【已废弃】在 frc9597-backend 上实现 inspire 业务域：数据库 schema、API 契约、Bearer 鉴权、只读/写接口、inspire 静态站接入；实现学员/家长只读、教练读写；全手动教学式推进。
mode: manual-teaching
structure:
  - type: sub
    path: prd-2-001/
    title: 数据与契约
  - type: sub
    path: prd-2-002/
    title: API 实现
  - type: sub
    path: prd-2-003/
    title: 前端接入
---

# prd-2 · Inspire 多设备数据访问

## 背景
inspire 当前数据全在浏览器（localStorage/IndexedDB），无法多设备访问。依赖 prd-1 的 frc9597-backend 基础设施，实现 inspire 业务域：数据上服务器、学员/家长公网只读、教练可写。

## 已锁定技术决策
```
数据库:    PostgreSQL（schema: inspire，实体表 + JSONB 列）
只存:      文本/数字（无二进制）
只读接口:  GET /api/snapshot（公开）
写接口:    POST /api/import（Bearer token、按 id upsert 幂等、两种模式）
当前集训:  meta.is_current 上服务器
读写分离:  学员/家长只读 · 教练/管理员写（本机+公网同路径）
```

## 本 PRD 范围（只做 inspire 域）
- 子组 A 数据与契约：R1 inspire schema、R2 API 契约
- 子组 B API 实现：R3 鉴权中间件、R4 只读接口、R5 写接口
- 子组 C 前端接入：R6 inspire 静态站接入

## 学习路径
| R | 🎓 学什么 |
|---|---------|
| R1 | SQL 建表、JSONB、外键/索引 |
| R2 | REST 设计、HTTP 请求/响应/状态码/错误码 |
| R3 | HTTP 头、Bearer token、中间件模式 |
| R4 | 写第一个 GET handler、JSON 响应、pg 查询 |
| R5 | POST 请求体、事务、upsert、幂等 |
| R6 | fetch、CORS、前后端联调 |

## 执行约定
- 所有步骤 `executor: human`（手动执行，AI 只讲解/给命令/答疑/审查）
- 测试见 `.ai/prd/TESTPLAN.md`（GATE C/D 部分），部分用例需另一台公网设备手工操作

## 验收总览（GATE）
- GATE C（R1~R5）：数据层 + API 层就绪，读写分离生效
- GATE D（R6）：端到端多设备访问可用
