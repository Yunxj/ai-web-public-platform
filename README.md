# AI 文章生成助手

基于大模型的内容创作平台，支持多种内容类型生成（公众号文章、海报、小红书、电商文案等）。

## 技术栈

- **前端框架**: Next.js 16.0.10 (App Router) + React 19.2.1
- **样式方案**: Tailwind CSS 4
- **数据库**: PostgreSQL + Drizzle ORM
- **AI服务**: Coze Coding Dev SDK (豆包模型)
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

复制 `.env.example` 为 `.env` 并填写必要的配置：

```bash
cp .env.example .env
```

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
