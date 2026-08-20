---
id: prd-5-3
parent: prd-5
title: 应用化（可选）
tags: [inspire, 应用化, Tauri, Electron, 局域网发现]
status: approved
approved_by: 用户
approved_date: 2026-08-17
summary: 将「静态 UI + 老师机 hub + 本地数据库」打包为桌面应用（Tauri/Electron），老师一键安装维护；原生层提供局域网互查（mDNS/DNS-SD + UDP 广播信标）与本机 IP 显示/二维码；浏览器用户可作为客户端连老师的 hub。prd-5 总纲下的第三个子 PRD（对应原 R3，可选）。
structure:
  - type: r
    id: R3
    title: 应用化（可选）
    file: R3.md
---

# prd-5-3 · 应用化（可选）

## 背景

把整个环境打包成老师机桌面应用，老师一键安装维护；浏览器用户无需安装即可连老师的 hub 互通。

## 设计

### 1. 形态

- **Tauri / Electron**：静态 UI + hub + 本地数据库打包成一个应用
- 老师应用 = hub（中心 + 权威）；浏览器用户 = 客户端连它的 hub

### 2. 原生层能力

- mDNS/DNS-SD（`_insync._tcp.local`）+ UDP 广播信标 → 局域网互查、自动发现
- 本机 IP 显示、二维码（原生层知道网卡 IP）

### 3. 复用

- UI 仍是静态页、同步协议不变——应用只是"外壳 + 原生发现/传输"
- 页面通过 localhost 桥接访问发现结果与同步后端

## 涉及文件

- 新增：应用外壳项目（Tauri 或 Electron）
- 复用：`public/`（静态 UI）、prd-5-2 的 hub 与同步协议

## 验收要点

1. 老师安装应用 → 打开即作为中心。
2. 浏览器用户可直接连老师的 hub。
3. 局域网互查（mDNS/UDP）可用；本机 IP/二维码显示正常。
4. 复用现有页面与协议，无重写。

## 不做

- 重写 UI（保持静态页）
- 开放云端服务（个人轨）
