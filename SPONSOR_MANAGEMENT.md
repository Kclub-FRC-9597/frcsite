# 赞助商管理系统文档

## 概述
赞助商管理系统允许管理员通过 Web UI 管理每个赛季的赞助商信息，包括添加、编辑、删除赞助商。赞助商数据存储在 D1 SQLite 数据库中，并在赛季页面上动态显示。

## 功能特性

### 1. 赞助商数据存储
- 每个赞助商包含以下信息：
  - `年份 (year)` - 赛季年份（2024、2025、2026）
  - `名称 (name)` - 赞助商名称
  - `Logo URL (logo_url)` - 赞助商 Logo 图片 URL（可选）
  - `网站 (website)` - 赞助商网站链接（可选）

### 2. 赞助商显示
- **有 Logo 时**：显示 Logo 图片，点击可跳转到赞助商网站（如提供）
- **无 Logo 但有网站**：显示文本链接，点击可跳转到网站
- **仅有名称**：显示纯文本

### 3. 管理员功能
只有以 `admin` 身份登录的用户才能访问赞助商管理功能。

#### 登录方式
1. 在网站上点击"工具"或其他需要登录的功能
2. 在登录页面输入：
   - 用户名：`admin`
   - 密码：`admin123`

#### 管理界面
登录后进入赛季页面（如 `/seasons/2025`），每个赛季下的赞助商部分会显示一个"✏️ 编辑赞助商"按钮。

### 4. 赞助商管理操作

#### 添加赞助商
1. 点击"✏️ 编辑赞助商"进入管理面板
2. 向下滑动到"➕ 添加新赞助商"部分
3. 填写以下信息：
   - **赞助商名称** * (必填)
   - **Logo URL** (可选) - 赞助商 Logo 图片的完整 URL
   - **公司网站** (可选) - 赞助商官方网站 URL
4. 点击"添加赞助商"按钮

#### 编辑赞助商
1. 在管理面板的赞助商列表中找到要编辑的赞助商
2. 修改对应的字段：
   - 名称
   - Logo URL
   - 网站
3. 点击对应行的"💾"(保存)按钮
4. 得到成功提示后更新完成

#### 删除赞助商
1. 在管理面板的赞助商列表中找到要删除的赞助商
2. 点击对应行的"🗑️"(删除)按钮
3. 确认删除提示
4. 赞助商被删除

#### 返回赛季页面
- 点击"返回赛季页面"按钮回到赛季详情页面
- 页面会自动显示更新后的赞助商列表

## 技术架构

### 后端 API (`/api/sponsors`)

#### GET - 获取赞助商列表
```
GET /api/sponsors?year=2025
```
- 返回指定年份的所有赞助商
- 成功返回: `[{id, year, name, logo_url, website, created_at, updated_at}, ...]`

#### POST - 添加赞助商 (需要认证)
```
POST /api/sponsors
Authorization: Bearer admin-token-2026
Content-Type: application/json

{
  "year": 2025,
  "name": "赞助商名称",
  "logo_url": "https://...",
  "website": "https://..."
}
```

#### PUT - 更新赞助商 (需要认证)
```
PUT /api/sponsors?id=<sponsor_id>
Authorization: Bearer admin-token-2026
Content-Type: application/json

{
  "year": 2025,
  "name": "新名称",
  "logo_url": "https://...",
  "website": "https://..."
}
```

#### DELETE - 删除赞助商 (需要认证)
```
DELETE /api/sponsors?id=<sponsor_id>
Authorization: Bearer admin-token-2026
```

### 前端函数

#### `getSponsorsByYear(year)`
获取指定年份的赞助商列表
```javascript
const sponsors = await getSponsorsByYear(2025);
```

#### `addSponsor(year, name, logoUrl, website)`
添加新赞助商（仅 Admin）

#### `updateSponsor(id, year, name, logoUrl, website)`
更新赞助商信息（仅 Admin）

#### `deleteSponsor(id)`
删除赞助商（仅 Admin）

#### `renderSponsorsSection(year)`
渲染赞助商显示区域（自动处理 Logo、链接等）

#### `showSponsorsManagement(year)`
打开赞助商管理面板（仅 Admin）

## 初始化数据

首次访问时，系统会自动创建赞助商表并填充以下初始数据：

### 2026 赛季
- SolidWorks (https://www.solidworks.com)
- OnShape (https://www.onshape.com)
- FRC (https://www.firstinspires.org)

### 2025 赛季
- Bambo
- MakeX
- XTool
- Makeblock
- SolidWorks (https://www.solidworks.com)
- FRC (https://www.firstinspires.org)

### 2024 赛季
- SolidWorks (https://www.solidworks.com)
- OnShape (https://www.onshape.com)
- FRC (https://www.firstinspires.org)
- 智慧土豆
- 敏源传感

## 使用示例

### 场景 1: 添加新赞助商
1. 以 admin 身份登录
2. 访问 `#seasons/2026`
3. 点击"✏️ 编辑赞助商"
4. 在"➕ 添加新赞助商"表单中：
   - 输入名称：`NVIDIA`
   - 输入 Logo URL：`https://www.nvidia.com/logo.png`
   - 输入网站：`https://www.nvidia.com`
   - 点击"添加赞助商"
5. 返回赛季页面查看更新

### 场景 2: 更新赞助商网站
1. 进入赞助商管理面板
2. 在现有赞助商列表中找到 FRC
3. 修改或保留相同信息
4. 点击"💾"保存
5. 刷新页面查看结果

### 场景 3: 删除过期赞助商
1. 进入赞助商管理面板
2. 找到要删除的赞助商
3. 点击"🗑️"
4. 确认删除
5. 赞助商从列表中移除

## 数据库结构

```sql
CREATE TABLE sponsors (
  id TEXT PRIMARY KEY,
  year INTEGER,
  name TEXT,
  logo_url TEXT,
  website TEXT,
  created_at INTEGER,
  updated_at INTEGER
)
```

## 安全性
- 赞助商列表查询不需要认证（公开读取）
- 添加、编辑、删除操作需要 Admin 认证
- 认证通过 `Bearer Token` 在 HTTP 请求头中传递
- Admin Token: `admin-token-2026`

## 故障排查

### 问题：没有看到"编辑赞助商"按钮
**解决方案**：确保你已以 admin 身份登录（用户名：admin，密码：admin123）

### 问题：赞助商数据不显示
**解决方案**：
1. 刷新页面
2. 检查浏览器控制台是否有错误
3. 确保 D1 数据库连接正常

### 问题：添加赞助商失败
**解决方案**：
1. 确保赞助商名称不为空
2. 检查 URL 格式是否正确
3. 查看浏览器控制台的详细错误信息

## 未来改进
- [ ] 上传 Logo 文件而不是输入 URL
- [ ] Logo 缓存和优化
- [ ] 赞助商分类（主要赞助商、金牌赞助商等）
- [ ] 赞助商展示顺序自定义
- [ ] 赞助商排名/权重设置
