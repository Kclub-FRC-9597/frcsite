# Luban Robotics #FRC9597 - Scouting System

A Team From K CLUB

9597 主站: www.frc9597.com

## 项目简介

FRC Team 9597 的数据收集和分析系统，用于比赛前调研（PreScouting）和现场数据收集（Scouting）。

本项目由两部分组成：

- **主站系统**（本仓库）：队员/赛事/赞助商等管理 + PreScouting / Scouting / Analysis
- **Inspire 应用**：独立于本仓库维护（见下文「Inspire 独立管理与同步」），作为 submodule 挂载在 `public/inspire/`，主站与独立域名 `inspire.frc9597.com` 共用同一份代码

## 功能特性

- **PreScouting**: 赛前队伍信息收集（练习时长、比赛经验、底盘类型等）
- **Scouting**: 现场比赛数据收集，支持自定义字段和模板
- **Analysis**: 数据分析和可视化展示
- **模板系统**: 支持保存和管理自定义字段配置
- **Inspire**: 教务/任务/集训/自主练习一体化工具（本地优先、IndexedDB）

## 技术栈

- **前端**: Vanilla JavaScript (SPA with Hash Routing)
- **后端**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Cloudflare Pages/Workers
- **Inspire**: 纯静态（HTML/JS + IndexedDB），独立仓库管理

## 仓库结构（多仓库）

| 仓库 | 远程 | 作用 |
|------|------|------|
| `frcsite`（本仓库） | `github.com/Kclub-FRC-9597/frcsite.git` | 主站：Worker + D1，`public/` 静态资源 |
| `BK_course_and_training` | `github.com/Kclub-FRC-9597/BK_course_and_training.git` | Inspire 唯一代码来源，以 **submodule** 挂载到 `public/inspire/` |

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
git submodule update --init   # 克隆后/新环境必跑，否则 /inspire/ 404
npm run deploy
```

## 双电脑协作：保证操作同一数据库（D1）

适用于两台电脑都开发、都可部署到同一个 Cloudflare Worker。

### 一次性配置（两台电脑都做）
1. 拉取同一仓库并安装依赖（含 submodule）：
  ```bash
  git clone <仓库地址>
  cd frcsite
  git submodule update --init
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
git submodule update --init
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
git submodule update --init
npm run db:check
npm run deploy
```

### 常见报错排查
- `database binding not found`：检查 `wrangler.jsonc` 的 `binding` 是否与代码中使用名称一致。
- `not found / unauthorized`：重新执行 `npx wrangler login`，并确认账号有该 D1/Worker 权限。
- 两台电脑结果不一致：优先检查是否一台使用了 `dev --remote`，另一台使用了本地 `dev`。
- 部署后 `/inspire/` 404：submodule 未初始化，执行 `git submodule update --init`。

## Inspire 独立管理与同步（git submodule）

> 背景：inspire 之前以「双仓库同步」维护——`public/inspire` 与独立仓库各存一份，每次改动要提交两遍。现已改为 **submodule**：inspire 只在独立仓库 `BK_course_and_training` 维护，本仓库 `public/inspire/` 只记录它的 commit 指针。

### 日常更新流程

**A. 修改 inspire（只改独立仓库）**
```bash
# 在 E:\Git\BK_course_and_training —— 唯一开发点
git add -A && git commit -m "inspire: xxx" && git push origin main
```

**B. 同步最新改动到主站（frcsite）**
```bash
git submodule update --remote public/inspire   # 拉独立仓库 main 最新并移动指针
git add public/inspire
git commit -m "chore: sync inspire 最新改动"
git push origin main
```

> `--remote` 默认跟随独立仓库默认分支；如需显式指定，可在 `.gitmodules` 中加 `branch = main` 后执行 `git submodule sync`。

### 部署 / CI 注意事项

- **本地部署**：先 `git submodule update --init`，再 `npm run deploy`（wrangler 会连同 `public/inspire` 一起发布）。
- **GitHub Actions**：checkout 需带 `submodules: recursive`。
- **Cloudflare Pages（Git 集成）**：不会自动拉 submodule，build 命令前加 `git submodule update --init`。

### 常用命令速查

| 场景 | 命令 |
|------|------|
| 克隆后初始化子模块 | `git submodule update --init --recursive` |
| 拉取独立仓库最新改动 | `git submodule update --remote public/inspire` |
| 恢复到主仓库记录的版本 | `git submodule update --init` |
| 子模块内单独操作 | `cd public/inspire && git pull`（改完回主仓库 `git add public/inspire`） |
| 修改 `.gitmodules` 后对齐 | `git submodule sync` |
| 查看当前指向的 commit | `git submodule status` |
| 回退 inspire 到历史版本 | `cd public/inspire && git checkout <commit>`，回主仓库提交 |

### 常见问题

- **`git add` 时 `LF will be replaced by CRLF` warning？**
  换行符规范化提示，无害。Git for Windows 默认 `core.autocrlf=true`：入库存 LF、检出转 CRLF。提交一次后通常不再出现；想根治可加 `.gitattributes`（`* text=auto`）。
- **`git submodule update` 和 `--remote` 的区别？**
  前者恢复到主仓库记录的指针（部署用）；后者拉独立仓库最新分支并移动指针（日常同步用）。

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
│   │   ├── account.js             # 账户模块逻辑
│   │   ├── account-templates.js   # 账户模块模板函数
│   │   ├── seasons.js             # 赛季模块逻辑
│   │   ├── seasons-templates.js   # 赛季模块模板函数
│   │   └── sponsors.js            # 赞助商管理模块逻辑
│   ├── inspire/           # (git submodule) Inspire 独立应用，指向 BK_course_and_training 仓库
│   └── partials/
│       ├── header.html    # 页头组件
│       └── footer.html    # 页脚组件
├── src/              # 后端代码
│   └── index.ts      # Worker API 端点
├── package.json      # 项目依赖
├── wrangler.jsonc    # Cloudflare 配置
└── tsconfig.json     # TypeScript 配置
```

> `public/inspire/` 是 submodule，其文件不进入本仓库；内容与更新方式见上文「Inspire 独立管理与同步」。

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
