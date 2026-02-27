# Luban Robotics #FRC9597 - Scouting System

A Team From K CLUB

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
├── public/           # 前端静态文件
│   ├── index.html    # 主页面
│   ├── header.html   # 页头组件
│   ├── footer.html   # 页脚组件
│   └── favicon.png   # 网站图标
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
8. 赛年信息添加本赛季的参赛队员/指导老师等信息，支持 `admin` 编辑。

## License

© 2026 Luban Robotics #FRC9597 - K CLUB
