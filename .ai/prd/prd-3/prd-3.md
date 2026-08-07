---
id: prd-3
title: Inspire 多设备数据访问（D1 版）
tags: [inspire, d1, 多设备, 学生自主练习, 鉴权, 弹窗, 资源优化]
status: draft
approved_by: null
approved_date: null
summary: 在纯 Cloudflare Workers + D1 上实现 inspire 业务域：学生自主练习远程提交成绩、教练/学员按角色鉴权访问、前端统一弹窗引导登录；静态页公开、数据库访问全需登录+授权。
mode: manual-teaching
structure:
  - type: sub
    path: prd-3-001/
    title: 数据与契约
  - type: sub
    path: prd-3-002/
    title: API 实现
  - type: sub
    path: prd-3-003/
    title: 前端接入
  - type: sub
    path: prd-3-004/
    title: 资源优化
---

# prd-3 · Inspire 多设备数据访问（D1 版）

## 背景
inspire 当前数据全在浏览器（localStorage/IndexedDB），学生自主练习产生的成绩**无法远程提交**。原 prd-1/prd-2 基于本地 PostgreSQL（frc9597-backend），已废弃。本 PRD 改为**纯 Cloudflare Workers + D1** 方案，实现学生远程提交 + 鉴权 + 展示。

## 已锁定技术决策
```
平台:      纯 Cloudflare Workers + D1（免备案、零运维、免费档足够）
静态资源:  CF 边缘直出（免费无限、不触发 Worker），不拆 Pages
数据库:    D1（SQLite）10 张表；scores 拆独立表 mock_scores（增量写）
鉴权:      无状态签名 token（含 username+role+exp），验签不查库
访问控制:  所有数据库接口必须登录+授权；未授权不提供；前端弹窗引导
API:       GET /api/snapshot（需登录）· POST /api/import（教练）
           POST /api/submit（学生，只写自己）· POST /api/auth/login（公开）
资源策略:  平时免费档；赛季超量再升 Workers Paid $5/月（分钟级生效）
```

## 本 PRD 范围
- 子组 A 数据与契约：R1 D1 schema、R2 API 契约
- 子组 B API 实现：R3 鉴权、R4 snapshot、R5 import、R6 submit
- 子组 C 前端接入：R7 apiFetch + 401 弹窗
- 子组 D 资源优化：R8 索引+缓存、R9 清理死代码+合并接口

## 学习路径（每个 R 一课）
| R | 🎓 学什么 |
|---|---------|
| R1 | SQL 建表、索引、幂等迁移 |
| R2 | REST 设计、HTTP 状态码、错误码 |
| R3 | 签名 token、中间件、角色授权、验签不查库 |
| R4 | GET handler、JSON 响应、按角色裁剪、缓存头 |
| R5 | POST、事务、upsert 幂等、merge/replace |
| R6 | 学生提交、数据隔离（只写自己 username） |
| R7 | fetch 封装、401/403 弹窗引导、登录流程复用 |
| R8 | D1 索引优化、边缘缓存、rows_read 监控 |
| R9 | 死代码清理、接口合并 |

## 执行约定
- 所有步骤 `executor: human`（手动执行，AI 只讲解/给命令/答疑/审查）——待用户确认是否改为 agent
- 测试见 `.ai/prd/prd-3/TESTPLAN.md`（GATE A~E）

## 验收总览（GATE）
- GATE A（R1~R2）：schema + 契约就绪
- GATE B（R3）：鉴权生效（401/403/0 查询）
- GATE C（R4~R5）：读写接口就绪
- GATE D（R6~R7）：学生提交 + 弹窗端到端
- GATE E（R8~R9）：资源优化达标
