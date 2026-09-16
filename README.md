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

> 子模块的路径、跟踪分支、本地开发克隆位置、拉取/合并方式与常见问题，统一见下文「Inspire 独立管理与同步（git submodule）」。

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

### 子模块信息

| 项 | 值 |
|------|------|
| 本仓库路径 | `public/inspire/` |
| 独立仓库（唯一代码来源） | `github.com/Kclub-FRC-9597/BK_course_and_training.git` |
| 跟踪分支 | `main`（`.gitmodules` 中未写 `branch`，`--remote` 走独立仓库默认分支，即 `main`） |
| 本地开发克隆 | `E:\Git\BK_course_and_training`（唯一开发点，含独立 `.git`） |
| 非代码来源 | `public copy/`（Windows 整站备份副本，已在 `.gitignore` 忽略，不入库、不参与构建） |
| 配置文件 | `.gitmodules`（**两个仓库都要入库**，缺了它新机器无法初始化子模块） |
| 当前指针 | 以 `git submodule status` 实测为准（每次 sync 都会变，故不在文档里写死 sha） |

查看当前实际状态：

```bash
git submodule status                            # <sha> public/inspire (heads/main) 表示在分支上
git diff --submodule=log -- public/inspire      # 指针已变但未提交时，列出落后的提交
```

> 括号内为 `(remotes/origin/HEAD)` 或 `HEAD (no branch)` 时，说明子模块处于 **detached HEAD**，属正常状态（见下文「常见问题」）。

### 日常更新流程

> **一键脚本**：`npm run syn:sub` —— 依次完成「拉取合并 → 部署 → 提交推送」。
> 脚本位于 `scripts/sync-inspire.mjs`（跟平台无关的 Node）：只有一个子模块时直接更新，多个时按编号选择；也可 `npm run syn:sub -- public/inspire` 直接指定。
> 提交信息自动带上子模块 sha，例如 `chore: sync inspire 子模块最新改动 (7443f24)`。

**A. 把独立仓库的改动同步到主站（frcsite）**

方式 A1 —— 一条命令拉取并移动指针（日常推荐）：

```bash
git submodule update --remote public/inspire   # 拉独立仓库 main 最新，并把工作区切到该 commit
git add public/inspire
git commit -m "chore: sync inspire 最新改动"
git push origin main
```

> `--remote` 默认跟随独立仓库默认分支（本仓库即 `main`）；如需显式指定，可在 `.gitmodules` 中加 `branch = main` 后执行 `git submodule sync`。
> 注意：该命令会让子模块处于 **detached HEAD**，这是正常的，部署只认 commit 指针。

方式 A2 —— 进子模块手动合并（能看到完整提交记录，便于确认合了什么）：

```bash
cd public/inspire
git checkout main                  # 若当前是 detached HEAD，先回到分支
git fetch origin
git merge --ff-only origin/main    # 历史未分叉时快进；等价于 git pull --ff-only
cd ../..
git add public/inspire
git commit -m "chore: sync inspire 子模块最新改动"
git push origin main
```

> `--ff-only` 失败说明独立仓库历史被改写（如 rebase/force push），改用 `git merge origin/main` 手动处理。
> **GitHub 连不上时（`Connection was reset`）**：改从本地开发克隆取，结果一致（commit 相同）：
> ```bash
> git fetch E:/Git/BK_course_and_training main && git merge --ff-only FETCH_HEAD
> ```
> 无论用哪种方式，父仓库里都**只提交 `public/inspire` 这一个 gitlink**，不要把它和无关改动混在同一个 commit（可用 `git add public/inspire` 精确暂存）。

**B. 验证同步结果**

```bash
git submodule status      # 首列 sha 应与独立仓库 main 的 sha 一致
git log --oneline -3      # 应看到 chore: sync inspire ...
```

**C. 回退 inspire 到历史版本**

```bash
cd public/inspire && git checkout <旧 commit>
cd ../.. && git add public/inspire && git commit -m "revert: inspire 回退到 <旧 commit>"
```

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
| 查看当前指向的 commit / 分支 | `git submodule status` |
| 查看指针落后的提交 | `git diff --submodule=log -- public/inspire` |
| 从 detached HEAD 回到分支 | `cd public/inspire && git checkout main` |
| 丢弃子模块内本地改动 | `git submodule update --init --force public/inspire` |
| 回退 inspire 到历史版本 | `cd public/inspire && git checkout <commit>`，回主仓库提交 |

### 常见问题

- **`git add` 时 `LF will be replaced by CRLF` warning？**
  换行符规范化提示，无害。Git for Windows 默认 `core.autocrlf=true`：入库存 LF、检出转 CRLF。提交一次后通常不再出现；想根治可加 `.gitattributes`（`* text=auto`）。
- **`git submodule update` 和 `--remote` 的区别？**
  前者恢复到主仓库记录的指针（部署用）；后者拉独立仓库最新分支并移动指针（日常同步用）。
- **子模块显示 `detached HEAD` / `HEAD (no branch)` 正常吗？**
  正常。`git submodule update`（含 `--remote`）都会把子模块置于 detached HEAD，只认 commit 指针。
  若要在子模块里继续开发，先 `cd public/inspire && git checkout main` 切回分支，否则新提交会变成游离提交，容易丢失。
- **`public copy/` 需要一起提交吗？**
  不需要。它是 Windows 下的整站备份副本，已在 `.gitignore` 忽略，不属于仓库也不会被部署，请勿当作 inspire 的代码来源。
- **子模块目录里有本地改动，`git submodule update` 会不会覆盖？**
  不会。命令会因「本地修改」而中止，需先 `cd public/inspire` 提交或 stash；确实要丢弃时用 `git submodule update --init --force public/inspire`。

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
