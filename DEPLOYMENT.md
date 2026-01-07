# 零成本部署指南

本指南将帮助你使用完全免费的服务部署 AI 文章生成助手项目。

## 部署架构

```
用户请求
    ↓
Vercel (Next.js应用 - 免费层)
    ↓
┌─────────────────┬─────────────────┐
│   Neon/Supabase │   AI API服务     │
│   (PostgreSQL)  │   (DeepSeek等)   │
│   免费层         │   (按量付费)     │
└─────────────────┴─────────────────┘
```

## 免费资源清单

### 1. Vercel（应用托管）
- ✅ 无限个人项目
- ✅ 100GB 带宽/月
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动部署（Git 集成）

### 2. Neon（PostgreSQL 数据库，推荐）
- ✅ 512MB 免费数据库
- ✅ 自动备份
- ✅ 分支功能
- ✅ 无信用卡要求

### 3. Supabase（PostgreSQL 数据库，备选）
- ✅ 500MB 免费数据库
- ✅ 2GB 文件存储
- ✅ 50,000 月活用户
- ✅ 无信用卡要求

### 4. AI 服务（按量付费）
- DeepSeek：提供免费额度
- 豆包/ARK：提供免费额度

## 部署步骤

### 步骤 1：准备代码仓库

1. 确保代码已提交到 Git 仓库（GitHub、GitLab 或 Bitbucket）
2. 确保 `.env` 文件已添加到 `.gitignore`（不会被提交）

### 步骤 2：设置免费数据库（可选但推荐）

#### 选项 A：使用 Neon（推荐）

1. 访问 [Neon 官网](https://neon.tech/)
2. 使用 GitHub 账号注册
3. 创建新项目
4. 复制数据库连接字符串（Connection String）
   - 格式：`postgresql://user:password@host/dbname?sslmode=require`
   - 注意：生产环境必须使用 SSL（`?sslmode=require`）

#### 选项 B：使用 Supabase

1. 访问 [Supabase 官网](https://supabase.com/)
2. 使用 GitHub 账号注册
3. 创建新项目
4. 进入项目设置 → Database
5. 复制连接字符串（Connection String）
   - 格式：`postgresql://user:password@host:5432/dbname`
   - 注意：Supabase 默认启用 SSL

### 步骤 3：运行数据库迁移

如果使用数据库，需要运行迁移创建表结构：

```bash
# 安装依赖
pnpm install

# 配置数据库连接
export DATABASE_URL="your_database_connection_string"

# 运行迁移（如果使用 Drizzle）
pnpm drizzle-kit push
```

或者使用 Drizzle Studio 进行可视化迁移：

```bash
pnpm drizzle-kit studio
```

### 步骤 4：部署到 Vercel

#### 方式 A：通过 Vercel 网站部署（推荐）

1. 访问 [Vercel 官网](https://vercel.com/)
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 导入你的 Git 仓库
5. 配置项目设置：
   - **Framework Preset**: Next.js（自动检测）
   - **Build Command**: `pnpm build`（或使用默认值）
   - **Install Command**: `pnpm install`（或使用默认值）
   - **Output Directory**: `.next`（默认）
6. 配置环境变量（见下方）
7. 点击 "Deploy"

#### 方式 B：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

### 步骤 5：配置环境变量

在 Vercel 项目设置中，进入 "Environment Variables"，添加以下变量：

#### 必需的环境变量（至少配置一个 LLM 服务）

```env
# 文本生成使用 DeepSeek（推荐）
DEEPSEEK_API_KEY=your_deepseek_api_key

# 图片生成使用豆包/ARK
ARK_API_KEY=your_ark_api_key
```

#### 可选的环境变量

```env
# 数据库（如果使用）
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# AWS S3（如果使用图片存储）
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# 应用 URL（Vercel 会自动设置，通常不需要手动配置）
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**重要提示：**
- 环境变量配置后，需要重新部署才能生效
- 生产环境（Production）和预览环境（Preview）可以分别配置
- 敏感信息（API Key）不要提交到代码仓库

### 步骤 6：验证部署

1. 部署完成后，Vercel 会提供一个 URL（如 `https://your-project.vercel.app`）
2. 访问该 URL，测试应用功能
3. 检查控制台日志，确认没有错误

## 数据库迁移（如果使用数据库）

### 使用 Drizzle Kit

项目使用 Drizzle ORM，可以通过以下方式管理数据库：

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 应用迁移
pnpm drizzle-kit push

# 打开 Drizzle Studio（可视化工具）
pnpm drizzle-kit studio
```

### 手动创建表

如果不想使用迁移工具，可以手动在数据库中执行 SQL：

```sql
-- 创建对话表
CREATE TABLE conversations (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL DEFAULT '新对话',
  content_type VARCHAR(50) NOT NULL DEFAULT 'article',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建消息表
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX conversations_content_type_idx ON conversations(content_type);
CREATE INDEX conversations_created_at_idx ON conversations(created_at);
CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);
```

## 无数据库模式

如果不想配置数据库，应用可以在无数据库模式下运行：

- ✅ 核心功能（文章生成）完全可用
- ✅ AI 对话功能可用
- ❌ 对话历史不会被保存
- ❌ 无法查看历史对话列表

应用会自动检测数据库配置，如果 `DATABASE_URL` 未设置或连接失败，会自动切换到无数据库模式，不会影响核心功能。

## 故障排查

### 问题 1：构建失败

**可能原因：**
- 环境变量未正确配置
- 依赖安装失败
- TypeScript 类型错误

**解决方案：**
1. 检查 Vercel 构建日志
2. 确保所有必需的环境变量已配置
3. 本地运行 `pnpm build` 测试构建

### 问题 2：数据库连接失败

**可能原因：**
- `DATABASE_URL` 格式错误
- 数据库未启用 SSL
- 防火墙阻止连接

**解决方案：**
1. 确保连接字符串包含 `?sslmode=require`
2. 检查数据库是否允许外部连接
3. 验证数据库凭据是否正确

### 问题 3：API 调用失败

**可能原因：**
- API Key 未配置或错误
- API 服务不可用
- 网络问题

**解决方案：**
1. 检查环境变量中的 API Key
2. 验证 API Key 是否有效
3. 查看 Vercel 函数日志

### 问题 4：图片生成失败

**可能原因：**
- 图片生成 API Key 未配置
- API 额度用尽
- 提示词格式错误

**解决方案：**
1. 确保配置了 `ARK_API_KEY` 或 `DOUBAO_API_KEY`
2. 检查 API 使用额度
3. 查看错误日志获取详细信息

## 性能优化建议

1. **使用 Vercel Edge Functions**：对于简单的 API 路由，考虑使用 Edge Functions 降低延迟
2. **启用缓存**：利用 Next.js 的缓存机制减少 API 调用
3. **数据库连接池**：已配置连接池，无需额外优化
4. **CDN 加速**：Vercel 自动提供全球 CDN

## 成本估算

### 完全免费方案
- Vercel：免费（个人项目）
- Neon/Supabase：免费（512MB/500MB）
- AI API：按量付费，但通常有免费额度
- **总计：$0/月**（在免费额度内）

### 如果超出免费额度
- Vercel：$20/月起（Pro 计划）
- Neon：$19/月起（Launch 计划）
- Supabase：$25/月起（Pro 计划）
- AI API：按实际使用量付费

## 后续步骤

1. ✅ 配置自定义域名（Vercel 支持）
2. ✅ 设置自动部署（Git push 自动触发）
3. ✅ 配置监控和日志（Vercel Analytics）
4. ✅ 定期备份数据库（Neon/Supabase 自动备份）

## 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Neon 文档](https://neon.tech/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Drizzle ORM 文档](https://orm.drizzle.team/)

## 获取帮助

如果遇到问题，可以：
1. 查看 Vercel 构建日志
2. 检查应用控制台错误
3. 查看项目 GitHub Issues
4. 参考相关文档

---

**祝部署顺利！** 🚀
