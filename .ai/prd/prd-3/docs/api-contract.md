# API 契约（prd-3 R2）

> 本文档是前端（prd-3 R7）与后端（prd-3 R4~R6）的**唯一耦合点**。任何字段变更必须同步改本文档并重新评审。

- Base URL：同域（`https://inspire.frc9597.com`，静态 + API 同一 Worker，天然同源，无 CORS）
- 数据格式：JSON；UTF-8
- 内容类型：请求/响应均 `application/json`
- 鉴权：除 `/api/auth/login` 外，**所有 API 必须带 `Authorization: Bearer <token>`**

## 0. 访问控制总则（用户硬性要求）

- **使用数据库的部分，必须登录 + 有对应授权才提供服务；未授权不提供**
- 静态页面需要数据库数据但未授权 → **前端弹窗提示**（不静默返回空）
- 静态资源（HTML/CSS/JS/图片）→ 公开，CF 边缘直出

| 角色 | 说明 |
|------|------|
| admin | 管理员：全部权限 |
| coach | 教练：snapshot 全量 + import |
| student | 学员：snapshot 仅自己/公开字段 + submit 仅自己 |

## 1. 登录

### POST /api/auth/login
公开，无需鉴权。
```json
// 请求
{ "username": "张三", "password": "..." }
// 200 响应
{ "ok": true, "username": "张三", "role": "student", "token": "<signed token>" }
```
- token 内容：`{ username, role, exp }` + 签名；验签不查库
- 错误：账号或密码错误 → 401 `{ "error": "用户名或密码错误" }`

## 2. 只读快照

### GET /api/snapshot
**需登录**。按角色裁剪数据。

```json
// 200 教练/管理员（全量）
{
  "students":   [ { "id": "s1", "name": "张三" } ],
  "classes":    [ { "id": "c1", "name": "一班" } ],
  "enrollments":[ { "id": "e1", "studentId": "s1", "classId": "c1", "status": "active" } ],
  "tasks":      [ { "id": "t1", "name": "迷宫挑战", "type": "basic", "maxScore": 100 } ],
  "trainings": [
    {
      "id": "tr1", "name": "暑期集训", "date": "2026-07-01",
      "studentIds": ["s1"], "tasks": [ { "taskId": "t1", "rounds": 2 } ],
      "mockCompetitions": [
        {
          "id": "m1", "name": "模拟赛 1", "date": "2026-07-02",
          "competitionType": "mock", "type": "single",
          "tasks": [ { "taskId": "t1", "rounds": 2 } ],
          "scores": { "s1": { "t1": { "round1": { "score": 85 }, "round2": { "score": 90 } } } },
          "comments": { "s1": "稳定发挥" },
          "schedule": { "list": ["s1"], "roundId": "t1_R1" },
          "group": "senior", "participantCount": null
        }
      ]
    }
  ],
  "currentTrainingId": "tr1", "challengeTaskFilter": null
}
```
- **学员视角**：只返回自己的 scores/comments；`trainings[].mockCompetitions[].scores` 仅含自己；students 等公开基础数据可见
- 响应头：`Cache-Control: public, max-age=60`（CF 边缘缓存）
- `rankings` 不在契约内——派生数据，前端现算
- 未登录 → 401；角色无权限 → 403

## 3. 写接口·教练导入

### POST /api/import
**需登录**：`Authorization: Bearer <token>`；角色 admin/coach。

请求体（结构与 makexScoreData 导出一致 + mode）：
```json
{
  "mode": "merge",            // merge | replace
  "students": [...], "classes": [...], "enrollments": [...],
  "tasks": [...], "trainings": [...]
}
```
| 字段 | 说明 |
|------|------|
| `mode: "merge"` | 按 id upsert：存在更新、不存在插入；不删除服务器多出的数据 |
| `mode: "replace"` | 清空 inspire 域数据后整体导入（初始/覆盖用） |

- scores 拆分写入 `mock_scores` 多行（不存整坨 JSON）
- 成功：`200 { "ok": true, "imported": { "students": 2, "classes": 1, "tasks": 2, "trainings": 1, "mocks": 1, "scores": 4 } }`
- 未登录 → 401；角色不符（student）→ 403

## 4. 学生提交

### POST /api/submit
**需登录**：`Authorization: Bearer <token>`；角色 student。

```json
// 请求
{ "mockId": "m1", "taskId": "t1", "round": "round1", "score": 85, "time": null }
// 200 响应
{ "ok": true, "imported": { "scores": 1 } }
```
- **服务端强制 `username` = token 身份**，不信任客户端传值
- 同 mock+task+round 重复提交 → upsert 更新，不新增
- 学生尝试提交他人成绩 → 403/400
- 未登录 → 401；角色不符（coach/admin）→ 403

## 5. 统一错误码

| 状态码 | 含义 | 响应体 |
|--------|------|--------|
| 400 | 参数/请求体不合法 | `{ "error": "<描述>" }` |
| 401 | 未登录 / token 无效或过期 | `{ "error": "unauthorized" }` |
| 403 | 已登录但角色无权限 | `{ "error": "forbidden" }` |
| 404 | 路由不存在 | `{ "error": "not found" }` |
| 500 | 服务器内部错误 | `{ "error": "internal error" }` |

> 4xx = 客户端问题，5xx = 服务端问题；401 认证、403 授权。

## 6. 前端 401/403 处理（R7）

- 收到 401 → 弹窗"请先登录" + [去登录] 按钮（跳转 `#login`）
- 收到 403 → 弹窗"当前账号无权限"
- 登录成功后 token 存 localStorage（`frc_token`），apiFetch 自动携带

## 7. 变更流程
1. 修改本文档 → 标注变更原因与版本
2. 前后端同步实现
3. 按 `.ai/prd/prd-3/TESTPLAN.md` GATE A 核对契约
