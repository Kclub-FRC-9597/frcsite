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
