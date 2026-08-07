# Decisions

## Stack  (2026-07-31)

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Database**: D1 (SQLite-compatible)
- **Frontend**: Vanilla JS + HTML/CSS in `public/`
- **Backend API**: `src/routes/` (Hono-style routing)
- **Deployment**: Wrangler CLI

## Design Principles  (2026-07-31)

- **Thin backend**: minimize Workers API routes. Where possible, push logic to frontend JS.
- MPA (Multi-Page Application): static HTML pages served directly, zero Worker cost
- Dynamic data fetched via dedicated `/api/*` routes only when needed
- Backend routes only handle: auth, CRUD to D1, data operations that can't be done client-side
- LocalStorage for offline-friendly features (scouting, prescout)
- No framework dependency on frontend

## API Key Policy  (2026-07-31)

User-provided AI API keys (OpenAI, Claude, etc.) are stored **in the browser by default**. Server storage requires user opt-in with risk acknowledgment.

### Why default to browser-only
- D1 leaks could expose keys if stored server-side
- Workers logs may inadvertently capture keys
- Compliance risk (GDPR, 个人信息保护法)
- Misconfiguration could leak keys across users

### How

| Location | What's stored | When |
|----------|--------------|------|
| `localStorage` (browser) | API key | ✅ **Recommended** — persists across sessions, never leaves browser |
| `sessionStorage` (browser) | API key | Optional — cleared on tab close |
| D1 (server) | API key | ⚠️ User opt-in — with risk disclosure |

### User Opt-in to Server Storage

If the user explicitly chooses to store their key in D1 (e.g., for cross-device convenience):

1. **Risk disclosure** — user must acknowledge: server-side storage carries risks of data breach, misconfiguration, or accidental logging
2. **Commitment** — the platform promises:
   - Never use the user's API key for any purpose
   - Never share, sell, or expose the key to third parties
   - Never log or output the key in plaintext

### Flow

```
Browser (JS) ──fetch──→ AI API (OpenAI/Claude)    ← key from localStorage (default)
                                     or D1 (user opt-in)
                        ↓
Browser (JS) ──fetch──→ Worker backend /api/...    ← stores results only
```

Default is zero server exposure. Server storage is a user choice with informed consent.

This aligns with the core design principle: **thin backend — logic lives in the frontend.**

## Project Layout  (2026-07-31)

| Directory | Purpose |
|-----------|---------|
| `src/` | Backend API routes, auth, types, DB migrations |
| `public/` | Frontend (HTML, CSS, JS) |
| `docs/dev/` | Developer documentation |
| `AGENTS.md` | AI agent instructions |

## prd-1/prd-2 决策  (2026-08-05)

- **新建独立后端项目** `frc9597-backend`（本地 Node.js + TypeScript REST API），与 frcsite（Cloudflare Worker）分开，可扩展到整个站点
- **技术栈**: Node.js + TypeScript + Hono + PostgreSQL 16（Docker Compose，Debian 13 设备）+ Cloudflare Tunnel（命名隧道 → api.inspire.frc9597.com）
- **prd-1**: frc9597-backend 项目搭建（R1 部署栈 / R2 穿透 / R3 数据库基础设施）
- **prd-2**: Inspire 多设备数据访问（schema / 契约 / 鉴权 / 只读 / 写 / 前端接入）
- **数据形态**: 只存文本/数字，JSONB 存嵌套成绩；rankings 不落库
- **读写分离**: 学员/家长只读（GET /api/snapshot 公开），教练/管理员写（POST /api/import，Bearer token，本机+公网同路径）
- **执行模式**: 所有步骤 `executor: human`（手动教学式，AI 只讲解/给命令/答疑/审查）—— 用户借此学习 Node.js
- **测试**: 独立 `frc9597-backend/TESTPLAN.md`，部分用例需另一台公网设备手工操作
- **选择 Cloudflare Tunnel 而非 frp/ngrok**: 域名已在 CF DNS、免费、无需 VPS；命名隧道无限流（Quick Tunnel 才有 200 并发限制）
