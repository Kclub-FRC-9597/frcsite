# prd-3 测试计划（D1 版）

| 项 | 值 |
|----|----|
| 关联 | `.ai/prd/prd-3`（R1~R9） |
| 版本 | v1.0（2026-08-07） |
| 覆盖 | GATE A~E 全部验收 |
| 性质 | 手动为主；鉴权/缓存部分可用 curl 自动化检查 |

> 本文档是唯一测试依据。PRD 的 R 文件只引用本文档的 GATE，不内嵌测试表（需求与测试解耦）。

## 1. 测试环境与设备分工

| 角色 | 设备 | 用途 | 标注 |
|------|------|------|------|
| 开发机 | Windows 开发机 | 写代码、wrangler dev/deploy、curl 验证 | `[开发机]` |
| 公网设备 | 手机/另一台电脑（切流量） | 验证公网访问、鉴权、多设备 | `[公网设备]` |

## 2. 前置条件（一次性）

- [human] Cloudflare：zone `frc9597.com` 在 CF DNS；已能 `wrangler deploy`
- [human] D1：`prescout_db` 已建（或新建 inspire 专用 D1 库，见 R1）
- [human] 数据：用 inspire `migration.html` 导出 `makexScoreData` JSON 备用
- [human] 账号：预置 admin/coach/student 三个测试账号（含 token 签发）

## 3. 测试数据准备

- `testdata/small.json`：2 学员、1 班级、2 任务、1 集训、1 模拟赛（含 2 成绩）
- `testdata/big.json`：small 基础上学员扩到 20 人（验证大数据 + 超量不担心）

---

## GATE A —— schema + 契约（R1 + R2）

### 自动化检查
| # | 位置 | 步骤 | 预期 |
|---|------|------|------|
| A-1 | R1 | 执行 D1 migration | 10 张表齐全，无报错 |
| A-2 | R1 | 重复执行 migration | 幂等，不报错 |
| A-3 | R1 | 检查索引 | mock_scores(mock_id,student_id) 等已建 |
| A-4 | R2 | 审查 api-contract.md | 4 个接口 + 错误码 + 权限矩阵齐全 |

### GATE A 通过条件
- [ ] [agent] A-1~A-4 全部通过
- [ ] [human] 契约评审通过

---

## GATE B —— 鉴权中间件（R3）

### 自动化检查
| # | 步骤 | 预期 |
|---|------|------|
| B-1 | 无 token 调 /api/snapshot | 401 |
| B-2 | 错误/过期 token 调 /api/snapshot | 401 |
| B-3 | student token 调 /api/import | 403 |
| B-4 | 鉴权过程检查 D1 查询计数（meta/日志） | **0 次查询**（纯验签） |

### GATE B 通过条件
- [ ] [agent] B-1~B-4 全部通过
- [ ] [human] 确认验签不查库

---

## GATE C —— 读写接口（R4 + R5）

### 自动化检查
| # | 步骤 | 预期 |
|---|------|------|
| C-1 | 未登录 GET /api/snapshot | 401 |
| C-2 | coach 登录 GET /api/snapshot | 200 全量数据 |
| C-3 | student 登录 GET /api/snapshot | 200 仅自己/公开字段 |
| C-4 | snapshot 响应头 | 含 Cache-Control: public, max-age=60 |
| C-5 | 无/错 token POST /api/import | 401 |
| C-6 | student POST /api/import | 403 |
| C-7 | coach POST /api/import (merge) 两次 | 幂等，计数不翻倍 |
| C-8 | coach POST /api/import (replace) | 与本地一致、无残留 |
| C-9 | import 后 coach snapshot | 与导入数据一致（含 mock_scores 行） |

### 手工验证 [human]
| # | 操作步骤 | 预期结果 |
|---|---------|---------|
| C-M1 | [公网设备] 手机流量登录 coach 拉 snapshot | 公网可访问、数据正确 |

### GATE C 通过条件
- [ ] [agent] C-1~C-9 全部通过
- [ ] [human] C-M1 公网验证通过

---

## GATE D —— 学生提交 + 前端弹窗（R6 + R7）

### 自动化检查
| # | 步骤 | 预期 |
|---|------|------|
| D-1 | student POST /api/submit 成功 | 200，mock_scores 新增/更新 1 行 |
| D-2 | 尝试提交他人 username | 403/400 拒绝 |
| D-3 | 重复提交同一 round | 更新不新增 |
| D-4 | coach/admin POST /api/submit | 403 |
| D-5 | 未登录打开需要数据的页面 | 弹窗"请先登录" + 跳转登录 |
| D-6 | student 点教练功能 | 弹窗"无权限" |
| D-7 | 静态页无登录访问 | 正常浏览，无弹窗 |

### 手工验证 [human]
| # | 操作步骤 | 预期结果 |
|---|---------|---------|
| D-M1 | [公网设备] student 手机提交一条成绩 | snapshot 学生视角读到 |
| D-M2 | 教练刷新后台 | 看到该学生的成绩 |

### GATE D 通过条件
- [ ] [agent] D-1~D-7 全部通过
- [ ] [human] D-M1、D-M2 通过

---

## GATE E —— 资源优化（R8 + R9）

### 自动化检查
| # | 步骤 | 预期 |
|---|------|------|
| E-1 | 相同查询加索引前后对比 rows_read | 显著下降 |
| E-2 | snapshot 缓存窗口内第二次请求 | 命中 CF 边缘，不触发 Worker/D1 |
| E-3 | 估算免费档用量占比 | <5%（目标） |
| E-4 | 删除 MyDurableObject 后 wrangler deploy | 部署通过 |
| E-5 | 清理后 /api/* 回归 | 全部路由正常 |
| E-6 | 前端合并后仍能取到数据 | 功能正常 |

### GATE E 通过条件
- [ ] [agent] E-1~E-6 全部通过
- [ ] [human] 确认免费档余量充足

---

## GATE 依赖链
```mermaid
flowchart LR
    A["GATE A schema+契约"] --> B["GATE B 鉴权"]
    B --> C["GATE C 读写接口"]
    C --> D["GATE D 学生提交+弹窗"]
    D --> E["GATE E 资源优化"]
```
