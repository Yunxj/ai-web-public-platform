# AI 文章生成助手

基于大模型的内容创作平台，支持多种内容类型生成（公众号文章、海报、小红书、电商文案等）。

## 技术栈

- **前端框架**: Next.js 16.0.10 (App Router) + React 19.2.1
- **样式方案**: Tailwind CSS 4
- **数据库**: PostgreSQL + Drizzle ORM
- **AI服务**: DeepSeek (文本生成) + 豆包/ARK (图片生成)
- **存储服务**: AWS S3 (图片存储)
- **类型系统**: TypeScript 5
- **测试框架**: Vitest

## 项目结构

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API路由
│   ├── layout.tsx   # 根布局（包含ErrorBoundary）
│   └── page.tsx     # 主页面
├── components/       # React组件
├── hooks/           # 自定义Hooks
├── lib/             # 工具库
│   ├── cache.ts     # 缓存工具
│   ├── error-handler.ts  # 错误处理
│   ├── env.ts       # 环境变量验证
│   └── rate-limiter.ts   # 限流工具
├── types/           # TypeScript类型定义
├── config/          # 配置文件
└── __tests__/       # 测试文件
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

项目提供了 `.env.example` 模板文件，包含所有需要的环境变量配置。

**快速开始：**

1. 复制 `.env.example` 为 `.env`：

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的实际 API Key 和配置

**重要提示：**
- `.env` 文件已添加到 `.gitignore`，不会被提交到版本控制
- `.env.example` 是模板文件，可以安全提交到版本控制
- 修改 `.env` 文件后需要重启开发服务器才能生效

**LLM服务配置：**

- **文本生成（推荐）**：`DEEPSEEK_API_KEY` - DeepSeek API Key
  - 获取方式：访问 [DeepSeek 平台](https://platform.deepseek.com/) 获取 API Key
  - 示例：`DEEPSEEK_API_KEY=your_deepseek_api_key`
- **文本生成（已废弃）**：`DASHSCOPE_API_KEY` 或 `QWEN_API_KEY` - 通义千问 API Key
  - 获取方式：访问 [阿里云DashScope](https://dashscope.aliyun.com/) 获取 API Key
  - 示例：`DASHSCOPE_API_KEY=your_qwen_api_key`（不推荐，建议使用 DeepSeek）
- **图片生成**：`ARK_API_KEY` 或 `DOUBAO_API_KEY` - 豆包/ARK API Key
  - 获取方式：访问 [豆包平台](https://www.doubao.com/) 获取 API Key
  - 推荐使用 `ARK_API_KEY`（优先），也支持 `DOUBAO_API_KEY`（向后兼容）
  - 示例：`ARK_API_KEY=your_ark_api_key` 或 `DOUBAO_API_KEY=your_doubao_api_key`

**可选的环境变量：**

- `DATABASE_URL`: PostgreSQL 数据库连接字符串（如果使用数据库功能）
- `AWS_ACCESS_KEY_ID`: AWS S3 访问密钥（如果使用图片存储功能）
- `AWS_SECRET_ACCESS_KEY`: AWS S3 密钥（如果使用图片存储功能）
- `AWS_REGION`: AWS 区域（如果使用图片存储功能）
- `AWS_S3_BUCKET`: S3 存储桶名称（如果使用图片存储功能）
- `NEXT_PUBLIC_APP_URL`: 应用URL（可选，默认 http://localhost:5000）
- `NODE_ENV`: 环境类型（可选，development/production/test）

**配置示例：**

`.env.example` 文件包含完整的配置模板，你可以参考以下方式配置：

```env
# ============================================
# LLM 服务配置
# ============================================

# 文本生成使用 DeepSeek（推荐）
DEEPSEEK_API_KEY=your_deepseek_api_key

# 文本生成使用通义千问（已废弃，不推荐）
# DASHSCOPE_API_KEY=your_qwen_api_key
# 或使用别名
# QWEN_API_KEY=your_qwen_api_key

# 图片生成使用豆包（推荐使用ARK_API_KEY）
ARK_API_KEY=your_ark_api_key
# 或使用向后兼容的DOUBAO_API_KEY
# DOUBAO_API_KEY=your_doubao_api_key

# ============================================
# 可选配置（根据实际需求）
# ============================================
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=your-bucket-name
# NEXT_PUBLIC_APP_URL=http://localhost:5000
# NODE_ENV=development
```

**服务说明：**

1. **文本生成**：使用 DeepSeek（推荐），如果没有配置则使用通义千问（已废弃）
2. **图片生成**：使用豆包/ARK
3. 如果所有配置都缺失，应用会提示配置错误
4. **推荐配置**：至少配置 `DEEPSEEK_API_KEY`（文本生成）和 `ARK_API_KEY`（图片生成）以确保功能可用

### 运行开发服务器

```bash
pnpm dev
```

应用将在 http://localhost:5000 启动

### 运行测试

```bash
pnpm test
```

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 部署

### 零成本部署方案

本项目支持完全免费的部署方案，使用 Vercel + Neon/Supabase 实现零成本部署。

**快速部署：**

1. **准备代码仓库**：确保代码已提交到 GitHub/GitLab/Bitbucket
2. **设置数据库**（可选）：
   - [Neon](https://neon.tech/) - 512MB 免费 PostgreSQL（推荐）
   - [Supabase](https://supabase.com/) - 500MB 免费 PostgreSQL
3. **部署到 Vercel**：
   - 访问 [Vercel](https://vercel.com/)
   - 导入 Git 仓库
   - 配置环境变量
   - 一键部署

**详细部署步骤请参考：[DEPLOYMENT.md](./DEPLOYMENT.md)**

### 无数据库模式

如果不想配置数据库，应用可以在无数据库模式下运行：
- ✅ 核心功能（文章生成）完全可用
- ✅ AI 对话功能可用
- ❌ 对话历史不会被保存

应用会自动检测数据库配置，如果 `DATABASE_URL` 未设置或连接失败，会自动切换到无数据库模式。

### 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

**必需（至少配置一个 LLM 服务）：**
- `DEEPSEEK_API_KEY` - DeepSeek API Key（文本生成，推荐）
- `ARK_API_KEY` - ARK/豆包 API Key（图片生成）

**可选：**
- `DATABASE_URL` - PostgreSQL 连接字符串
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` - S3 存储配置

更多详情请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## Git初始化

如果还没有初始化Git仓库，可以运行：

**Windows PowerShell:**
```powershell
.\init-git.ps1
```

**或者手动初始化:**
```bash
git init
git add .
git commit -m "chore: 初始化项目"
```

## 主要功能

- ✅ AI文章生成（流式响应）
- ✅ 多内容类型支持（文章、海报、小红书、电商、长图、装修等）
- ✅ 对话管理（PostgreSQL）
- ✅ 图片生成和批量处理
- ✅ 内容搜索
- ✅ 实时预览
- ✅ 错误处理和日志
- ✅ API限流
- ✅ 缓存机制

## 优化特性

- 🚀 **代码结构**: 模块化设计，易于维护
- 🔒 **类型安全**: 完整的TypeScript类型定义
- ⚡ **性能优化**: 缓存、流式响应优化
- 🛡️ **安全性**: API限流、错误处理、安全头
- 📊 **可观测性**: 结构化日志、错误监控
- ✅ **测试覆盖**: Vitest单元测试

## 开发规范

- 使用TypeScript严格模式
- 遵循ESLint规则
- 提交前运行测试和lint检查
- 使用语义化提交信息

## 许可证

MIT
