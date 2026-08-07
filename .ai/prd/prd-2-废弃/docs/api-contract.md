# API 契约（prd-2 R2）

> 本文档是前端（prd-2 R6）与后端（prd-2 R4/R5）的**唯一耦合点**。任何字段变更必须同步改本文档并重新评审。

- Base URL（公网）：`https://api.inspire.frc9597.com`
- Base URL（本机调试）：`http://localhost:8080`
- 数据格式：JSON；UTF-8
- 内容类型：请求/响应均 `application/json`
- CORS：后端允许来源 `https://inspire.frc9597.com`（及本机调试源）

## 1. 健康检查（prd-1 R1 已实现）

### GET /api/health
公开，无需鉴权。
```json
// 200
{ "status": "ok", "db": "up" }
```
错误：DB 不可达 → 500 `{ "status": "error", "db": "down" }`

## 2. 只读快照（prd-2 R4）

### GET /api/snapshot
公开，无需鉴权。返回全部数据（全量快照，数据量小一次拉取）。

```json
// 200
{
  "students":   [ { "id": "s1", "name": "张三" } ],
  "classes":    [ { "id": "c1", "name": "一班" } ],
  "enrollments":[ { "id": "e1", "studentId": "s1", "classId": "c1", "status": "active" } ],
  "tasks":      [ { "id": "t1", "name": "迷宫挑战", "type": "basic", "maxScore": 100 } ],
  "trainings": [
    {
      "id": "tr1",
      "name": "暑期集训",
      "date": "2026-07-01",
      "studentIds": ["s1"],
      "tasks": [ { "taskId": "t1", "rounds": 2 } ],
      "mockCompetitions": [
        {
          "id": "m1",
          "name": "模拟赛 1",
          "date": "2026-07-02",
          "competitionType": "mock",
          "type": "single",
          "tasks": [ { "taskId": "t1", "rounds": 2 } ],
          "scores": { "s1": { "t1": { "round1": { "score": 85 }, "round2": { "score": 90 } } } },
          "comments": { "s1": "稳定发挥" },
          "schedule": { "list": ["s1"], "roundId": "t1_R1" },
          "group": "senior",
          "participantCount": null
        }
      ]
    }
  ],
  "currentTrainingId": "tr1",
  "challengeTaskFilter": null
}
```

字段说明：
- `scores`：`{ studentId: { taskId: { roundN: { score?, time? } } } }`（与前端现状一致）
- `rankings` **不在契约内**——派生数据，前端现算
- `currentTrainingId` 映射 `meta.is_current`

## 3. 写接口·导入（prd-2 R5）

### POST /api/import
需鉴权：`Authorization: Bearer <ADMIN_TOKEN>`

请求体（结构与 `makexScoreData` 导出一致 + `mode`）：
```json
{
  "mode": "merge",            // merge | replace
  "students": [...],
  "classes": [...],
  "enrollments": [...],
  "tasks": [...],
  "trainings": [...]
}
```

| 字段 | 说明 |
|------|------|
| `mode: "merge"` | 默认。按 id **upsert**：存在则更新、不存在则插入；**不删除**服务器上多出的数据 |
| `mode: "replace"` | 清空 inspire 域数据后整体导入（初始/覆盖用） |

成功：
```json
// 200
{ "ok": true, "imported": { "students": 2, "classes": 1, "tasks": 2, "trainings": 1, "mocks": 1 } }
```

## 4. 统一错误码

| 状态码 | 含义 | 响应体 |
|--------|------|--------|
| 400 | 参数/请求体不合法 | `{ "error": "<描述>" }` |
| 401 | 未授权 / token 错误 | `{ "error": "unauthorized" }` |
| 404 | 路由不存在 | `{ "error": "not found" }` |
| 500 | 服务器内部错误 | `{ "error": "internal error" }` |

> 4xx = 客户端问题，5xx = 服务端问题。

## 5. 变更流程
1. 修改本文档 → 标注变更原因与版本
2. 前后端同步实现
3. 按 `.ai/prd/TESTPLAN.md` GATE C 核对契约
