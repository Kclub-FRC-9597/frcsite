# frc9597-backend · prd-1/prd-2 测试计划（独立测试文档）

| 项 | 值 |
|----|----|
| 关联 | `.ai/prd/prd-1`（R1~R3）+ `.ai/prd/prd-2`（R1~R6） |
| 版本 | v1.0（2026-08-05） |
| 覆盖 | GATE A~D 全部验收 |
| 性质 | **全手动**；部分用例需在**另一台公网设备**上操作 |

> 本文档是唯一测试依据。PRD 的 R 文件只引用本文档的 GATE，不内嵌测试表（需求与测试解耦）。

## 1. 测试环境与设备分工

| 角色 | 设备 | 用途 | 标注 |
|------|------|------|------|
| 部署机 | **Debian 13**（Docker） | 跑 postgres+api+cloudflared，服务器端检查 | `[Debian]` |
| 开发机 | Windows 开发机 | 写代码、导出测试数据、git | `[开发机]` |
| 公网设备 | **手机/另一台电脑**（切流量，不同局域网） | 验证穿透、只读、多设备并发 | `[公网设备]` |

> ⚠️ 公网设备**必须用手机流量或另一网络**，不能与 Debian 同局域网，否则测的是内网而非穿透。

## 2. 前置条件（一次性）

- [human] Debian 13：Docker + compose 已装；已按学习路径搭建 frc9597-backend 并 `docker compose up -d`
- [human] Cloudflare：zone `frc9597.com` 在 CF DNS；API token（Tunnel+DNS 权限）；命名隧道已建
- [human] 数据：在 `[开发机]` 用 inspire `migration.html` 导出 `makexScoreData` JSON 备用
- [human] 公网设备：确认 `api.inspire.frc9597.com` DNS 解析指向 Cloudflare

## 3. 测试数据准备

- `testdata/small.json`：2 学员、1 班级、2 任务、1 集训、1 模拟赛（含 2 成绩）
- `testdata/big.json`：small 基础上学员扩到 20 人（验证大数据导入）
- 保存于你本地项目（`frc9597-backend/testdata/`）

---

## GATE A —— 公网可用性（prd-1 R1 + R2）

### 自动化检查
| # | 位置 | 步骤 | 预期 |
|---|------|------|------|
| A-1 | `[Debian]` | `docker compose up -d && docker compose ps` | postgres/api 均 `Up (healthy)` |
| A-2 | `[Debian]` | `curl -s localhost:8080/api/health` | `{"status":"ok","db":"up"}` 且 HTTP 200 |
| A-3 | `[Debian]` | `docker compose exec db psql -U inspire -d inspire -c 'select 1'` | 返回 1，无错误 |
| A-4 | `[Debian]` | `cloudflared tunnel list` | 命名隧道在列、ACTIVE |
| A-5 | `[公网设备]` | `curl -s https://api.inspire.frc9597.com/api/health` | 与 A-2 相同 |

### 手工验证
| # | 位置 | 操作 | 预期 |
|---|------|------|------|
| M-A1 | `[公网设备]` | 手机浏览器打开 health URL | 显示 JSON，无证书警告 |
| M-A2 | `[Debian]` | `docker compose restart cloudflared` 等 30s | 自动重连，A-5 恢复 200 |
| M-A3 | `[Debian]` | `docker compose stop` 等 1min | 公网 health 超时/5xx（**预期行为**） |

### GATE A 通过条件
- [ ] [human] A-1~A-5 全过；M-A1、M-A2 通过；M-A3 符合预期

---

## GATE B —— 数据层就绪（prd-1 R3 + prd-2 R1）

### 自动化检查
| # | 位置 | 步骤 | 预期 |
|---|------|------|------|
| B-1 | `[Debian]` | `docker compose exec api npm run migrate` | 迁移成功，schema_migrations 有记录 |
| B-2 | `[Debian]` | `psql -U inspire -d inspire -c "\dt inspire.*"` | 列出 **9 张表** |
| B-3 | `[Debian]` | 再次 `npm run migrate` | 无报错（幂等） |
| B-4 | `[Debian]` | `psql -c "\d inspire.mocks"` | 含 4 个 jsonb 列 |

### 手工验证
| # | 位置 | 操作 | 预期 |
|---|------|------|------|
| M-B1 | `[Debian]` | `docker compose down -v && up -d` 后重 migrate | 全新重建成功，表齐全 |

### GATE B 通过条件
- [ ] [human] B-1~B-4 全过；M-B1 通过

---

## GATE C —— API 层就绪（prd-2 R2~R5）

> R2 契约：与 `.ai/prd/prd-2/docs/api-contract.md` 逐条核对。

### 自动化检查
| # | 位置 | 步骤 | 预期 |
|---|------|------|------|
| C-1 | `[Debian]` | `curl -s -X POST localhost:8080/api/import -d '{}'`（无 token） | **401** |
| C-2 | `[Debian]` | 同上 + `-H "Authorization: Bearer wrong"` | **401** |
| C-3 | `[Debian]` | `curl -s localhost:8080/api/snapshot`（无 token） | **200**（只读公开） |
| C-4 | `[Debian]` | 空库 snapshot | 200 空结构 |
| C-5 | `[Debian]` | 带 token 导入 small.json（merge） | 200，计数正确 |
| C-6 | `[Debian]` | 再次导入 small.json | 200，计数不翻倍（幂等） |
| C-7 | `[Debian]` | snapshot 与 small.json 比对 | 完全一致 |
| C-8 | `[Debian]` | mode=replace 导入 big.json | 学员=20，无残留 |
| C-9 | `[公网设备]` | 手机流量带 token POST import | 200（公网写路径） |

### 手工验证
| # | 位置 | 操作 | 预期 |
|---|------|------|------|
| M-C1 | `[开发机]` | DevTools 手动调 import（带 token） | 正常返回，无 CORS 报错 |
| M-C2 | `[公网设备]` | 不带 token 访问 snapshot | 正常显示（只读可用） |

### GATE C 通过条件
- [ ] [human] C-1~C-9 全过；M-C1、M-C2 通过；契约核对完成

---

## GATE D —— 端到端多设备访问（prd-2 R6）

### 前置
- [human] 前端已指向 `https://api.inspire.frc9597.com`；共 2+ 台设备

### 手工验证（跨设备）
| # | 位置 | 操作 | 预期 |
|---|------|------|------|
| M-D1 | `[公网设备]` | 手机流量开 `https://inspire.frc9597.com/stats.html` | 显示服务器数据 |
| M-D2 | `[公网设备]` | 开 `training.html?id=<集训id>` | 集训/成绩可见 |
| M-D3 | `[开发机+公网设备]` | 两台同时刷新 stats/display ×5 | 均正常，无 429 |
| M-D4 | `[开发机]` | 教练 migration.html 导入新数据；公网设备刷新 | 公网端看到新数据 |
| M-D5 | `[公网设备]` | 学员视角无 token 尝试写 | 401（读写分离生效） |

### 自动化检查
| # | 位置 | 步骤 | 预期 |
|---|------|------|------|
| D-1 | `[Debian]` | `docker compose logs api --tail=50` | 无 5xx |

### GATE D 通过条件
- [ ] [human] M-D1~M-D5 全过；D-1 通过

---

## 回滚与清理

| 操作 | 命令 | 位置 |
|------|------|------|
| 清数据 | `docker compose down -v` | `[Debian]` |
| 停隧道 | `cloudflared tunnel cleanup <tunnel>` | `[Debian]` |
| 删域名 | Zero Trust 面板删公开主机名 / DNS | CF 面板 |
| 前端回退 | `git revert` | `[开发机]` |

## 已知限制（验收预期，不算失败）
- Debian 离线 → 公网不可达（M-A3 已确认）
- 写并发受 PG 事务约束；本场景单教练写为主
- 快照 >1MB 时首屏稍慢（后续可做增量/分页）
