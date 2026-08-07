---
id: prd-1
title: frc9597-backend 本地后端项目搭建
tags: [backend, node, typescript, postgresql, docker, cloudflare-tunnel, 学习]
status: deprecated
deprecated: true
deprecation_reason: "方案改为纯 Cloudflare Workers + D1（见 prd-3），本地 PostgreSQL 生产方案作废；本 PRD 仅保留作历史记录，不得执行"
approved_by: null
approved_date: null
summary: 【已废弃】搭建本地 Node.js + TypeScript + PostgreSQL 后端项目 frc9597-backend，Docker Compose 部署，Cloudflare Tunnel 暴露公网；全手动教学式推进，边做边学 Node。
mode: manual-teaching   # 所有步骤 executor=human，AI 只讲解/答疑/审查，不代做
structure:
  - type: r
    id: R1
    title: 本地部署栈（Docker Compose + 项目骨架）
    file: R1.md
  - type: r
    id: R2
    title: Cloudflare Tunnel 公网穿透
    file: R2.md
  - type: r
    id: R3
    title: PostgreSQL 基础设施（连接 + 迁移 + schema 命名空间）
    file: R3.md
---

# prd-1 · frc9597-backend 本地后端项目搭建

## 背景
inspire 需要服务端数据库支撑"多设备数据访问"。经讨论确定：新建独立项目 `frc9597-backend`（本地 Node.js + TypeScript REST API），Docker Compose 部署在 Debian 13 设备，Cloudflare Tunnel 暴露公网。未来可扩展到整个站点，故按**域模块化**设计。

## 本 PRD 范围（只做基础设施）
- R1 部署栈：Docker Compose（postgres + api + cloudflared）+ 可运行骨架
- R2 穿透：命名隧道 + 公开主机名 api.inspire.frc9597.com
- R3 数据库基础设施：PG 连接、版本化迁移、schema 命名空间（inspire 域留待 prd-2）

> 业务功能（inspire 的 schema/API/前端）在 **prd-2**。

## 学习路径（每个 R 一课）
| R | 🎓 学什么 |
|---|---------|
| R1 | Node 项目结构、package.json、npm、Docker Compose 基础 |
| R2 | 域名/DNS、Cloudflare Tunnel 原理、cloudflared 用法 |
| R3 | SQL/PostgreSQL 基础、迁移（migration）、schema 概念 |

## 执行约定
- 所有步骤 `executor: human`（手动执行，AI 只讲解/给命令/答疑/审查）
- 每步包含：学什么 + 为什么 + 命令 + 预期现象 + 如何确认
- 测试见 `.ai/prd/TESTPLAN.md`（GATE A/B 部分）

## 验收总览（GATE）
- GATE A（R1+R2）：本机 health 200 且公网 health 200
- GATE B（R3）：迁移幂等可重复、schema 命名空间就绪
