# Architecture

## Overview

FRC Team 9597 website — Cloudflare Workers monolith with D1 database.

```
Browser ──→ public/ (static HTML, MPA)
          ──→ src/routes/* /api/* (Worker + D1, on-demand)
```

## Design Principles

- **MPA + API isolation**: static HTML pages served directly from `public/` (no Worker invocation). Only dynamic data pages call `/api/*` endpoints.
- **Thin backend first**: logic lives in the frontend wherever possible. Workers API routes are kept minimal.
- Backend routes only exist for: auth, D1 CRUD, and operations that require server-side execution.
- Each `/api/*` route = one Worker invocation + optional D1 call. No Worker is invoked for static pages.
- LocalStorage is used extensively for offline-capable features (scouting data, prescout data).
- No frontend framework — vanilla JS only.

## Backend API (`src/`)

```
src/
├── index.ts          # entry point, route registration
├── types.ts          # shared type definitions
├── auth.ts           # authentication logic
├── db/
│   └── migrations/   # D1 SQL migrations
└── routes/
    ├── auth.ts       # auth endpoints
    ├── events.ts     # event management
    ├── scouting.ts   # scouting data
    ├── prescout.ts   # pre-scouting
    ├── sponsors.ts   # sponsor management
    ├── students.ts   # student data
    ├── tasks.ts      # task management
    ├── teams.ts      # team info
    └── users.ts      # user management
```

## Frontend (`public/`)

```
public/
├── index.html
├── assets/
├── css/styles.css
├── js/               # core app logic, routing
├── inspire/          # Inspire-specific tools (admin, display, stats, ...)
└── partials/         # shared HTML templates (header, footer)
```
