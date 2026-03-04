# Luban Robotics #FRC9597 - Scouting System

A Team From K CLUB

9597 主站: www.frc9597.com

## 项目简介

FRC Team 9597 的数据收集和分析系统，用于比赛前调研（PreScouting）和现场数据收集（Scouting）。

## 功能特性

- **PreScouting**: 赛前队伍信息收集（练习时长、比赛经验、底盘类型等）
- **Scouting**: 现场比赛数据收集，支持自定义字段和模板
- **Analysis**: 数据分析和可视化展示
- **模板系统**: 支持保存和管理自定义字段配置

## 技术栈

- **前端**: Vanilla JavaScript (SPA with Hash Routing)
- **后端**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Cloudflare Pages/Workers

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 本地开发

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 部署到 Cloudflare
```bash
npm run deploy
```

## 双电脑协作：保证操作同一数据库（D1）

适用于两台电脑都开发、都可部署到同一个 Cloudflare Worker。

### 一次性配置（两台电脑都做）
1. 拉取同一仓库并安装依赖：
  ```bash
  npm install
  ```
2. 登录 Cloudflare（各自账号）：
  ```bash
  npx wrangler login
  npm run cf:whoami
  ```
3. 确认 `wrangler.jsonc` 中 D1 配置一致（同一个 `database_id`）。

### 每次开发前检查（两台电脑都做）
按顺序执行以下命令：

```bash
git pull --rebase
npm run cf:whoami
npm run db:list
npm run db:check
```

检查标准：
- `cf:whoami` 显示同一个 Cloudflare Account。
- `db:list` 中存在 `prescout_db`，并且 ID 与 `wrangler.jsonc` 一致。
- `db:check` 返回 `ok = 1`（表示已连到远程数据库）。

### 联调同一远程数据库
如果希望本地开发就直接连同一个线上 D1，请使用：

```bash
npm run dev:remote
```

不要只用 `npm run dev` 做多人联调（默认可能使用本地状态，导致两台电脑看到的数据不一致）。

### 部署前固定流程（两台电脑都一样）
```bash
git pull --rebase
npm run db:check
npm run deploy
```

### 常见报错排查
- `database binding not found`：检查 `wrangler.jsonc` 的 `binding` 是否与代码中使用名称一致。
- `not found / unauthorized`：重新执行 `npx wrangler login`，并确认账号有该 D1/Worker 权限。
- 两台电脑结果不一致：优先检查是否一台使用了 `dev --remote`，另一台使用了本地 `dev`。

## 数据库配置

项目使用 Cloudflare D1 数据库。需要在 `wrangler.jsonc` 中配置数据库绑定：

```json
"d1_databases": [
  {
    "binding": "D1_PRESCOUT",
    "database_name": "prescout_db",
    "database_id": "YOUR_DATABASE_ID"
  }
]
```

## 项目结构

```
.
├── public/                # 前端静态文件
│   ├── index.html         # SPA 入口页面
│   ├── assets/            # 图片与图标等静态资源
│   │   ├── bg-pattern.svg
│   │   ├── favicon.ico
│   │   └── favicon.png
│   ├── css/
│   │   └── styles.css     # 全站样式文件
│   ├── js/
│   │   └── account.js     # 账户模块逻辑（从 index.html 拆分）
│   └── partials/
│       ├── header.html    # 页头组件
│       └── footer.html    # 页脚组件
├── src/              # 后端代码
│   └── index.ts      # Worker API 端点
├── package.json      # 项目依赖
├── wrangler.jsonc    # Cloudflare 配置
└── tsconfig.json     # TypeScript 配置
```

## 使用说明

# 测试账户
- 用户名: `tester`
- 密码: `password123`

### PreScouting
在工具页面收集队伍的赛前信息，数据存储在 D1 数据库中。

### Scouting
1. 配置字段：自定义收集的数据字段
2. 开始收集：根据配置的字段收集比赛数据
3. 查看数据：浏览和导出收集的数据

### Analysis
查看和分析 PreScouting 和 Scouting 阶段收集的所有数据。

## 后续工作计划说明

1. 添加账户 dashboard 页面（可修改自己的账户密码）。
2. 添加 K CLUB 介绍页面（考虑单独注册域名指向这个页面）。
3. `admin` 账户可以管理其他用户。
4. 主页文字介绍提供编辑权限（管理员特权）。
5. 添加常用系统管理员。
6. PreScouting/Scouting 单独设置一个管理员，负责模板编辑、scouting 工作分配等。
7. 添加 `root` 管理员，拥有所有系统管理权限；`admin` 为常规管理员，`root` 可修改所有可修改的信息。
8. 赛季信息添加本赛季的参赛队员/指导老师等信息，支持 `admin` 编辑。
9. 赞助商管理支持从系统已有赞助商列表直接添加；主页展示当年赞助商列表。

## License

© 2026 Luban Robotics #FRC9597 - K CLUB
