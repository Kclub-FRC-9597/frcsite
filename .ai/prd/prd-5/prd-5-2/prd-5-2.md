---
id: prd-5-2
parent: prd-5
title: 老师机本地 hub 多端同步（闭合）
tags: [inspire, hub, 多端同步, 局域网, 本地优先]
status: approved
approved_by: 用户
approved_date: 2026-08-17
summary: 老师机运行单文件小服务 + 数据库文件作为 hub；学生在局域网内填 IP/扫码连接并自动同步；同步协议为 LWW 合并 + outbox + snapshot（client→hub）；数据不出局域网、闭合自持。prd-5 总纲下的第二个子 PRD（对应原 R2）。
structure:
  - type: r
    id: R2
    title: 老师机本地 hub 多端同步（闭合）
    file: R2.md
---

# prd-5-2 · 老师机本地 hub 多端同步（闭合）

## 背景

学生多端需要同步成绩等数据；采用**老师机本地 hub** 方案：闭合、数据自持、不出局域网、0 元跑在自有设备。复用 prd-5-1 的版本化记录与 merge()。

## 设计

### 1. 老师机 hub

- 单文件小服务（Node/Deno/Bun，约 200 行）实现统一同步协议
- 存储：数据库文件（先 JSON，量大可换 SQLite）；0 元跑在自有设备

### 2. 连接与发现

- 老师端管理页显示本机 IP + 二维码；学生填一次地址（或扫码）记住
- 可选 mDNS（`inspire.local`）作为免填增强
- 实操：固定端口 8787、Windows 防火墙放行入站、同一网段/关 AP 隔离、DHCP 保留或固定 IP、简单 4 位共享码准入

### 3. 同步协议（与 prd-5-1 格式一致）

- 记录级 **LWW 合并**（lamport/deviceId/deleted）
- **outbox** 待同步队列 + **snapshot** 全量引导
- 一律 **client→hub**；页面由 hub 本地托管（同源零障碍、离线可用），可选公司静态托管接入（CORS + PNA 预检）

### 4. 学生端

- 本地保留 IndexedDB 四库，断网可用本地数据
- 设置里填一次老师机地址 → 记住 → 自动同步

## 涉及文件

- 新增：`tools/ins-hub`（老师机小服务，单文件）
- `public/inspire/shared.js` / `shared_indexdb.js`（同步门面 + outbox）
- 新增：`public/inspire/sync.js`（同步引擎：push/pull/snapshot、后端地址配置）
- `public/inspire/devtools.html` / `devtools.js`（同步状态面板）

## 验收要点

1. 学生填 IP（或扫码）连上老师机 hub，自动合并。
2. hub 数据落盘、断电不丢；学生机断网仍可用本地数据。
3. 固定端口/防火墙/同网段/共享码等实操可用。
4. 语法校验与浏览器回归通过。

## 不做

- 开放云端服务（个人轨）
- 公网自动发现（不引入信令服务器）
- 应用化（prd-5-3）
