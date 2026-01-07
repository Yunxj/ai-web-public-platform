# 部署检查清单

在部署前，请确保完成以下检查：

## 代码准备

- [ ] 代码已提交到 Git 仓库（GitHub/GitLab/Bitbucket）
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] 所有依赖已正确安装（`pnpm install`）
- [ ] 本地构建测试通过（`pnpm build`）

## 环境变量配置

### 必需配置（至少一个 LLM 服务）

- [ ] `DEEPSEEK_API_KEY` - DeepSeek API Key（文本生成，推荐）
- [ ] 或 `DEEPSEEK_API_KEY` - DeepSeek API Key（文本生成）
- [ ] 或 `ARK_API_KEY` - 豆包/ARK API Key（图片生成）

### 可选配置

- [ ] `DATABASE_URL` - PostgreSQL 连接字符串（如果使用数据库）
- [ ] `AWS_ACCESS_KEY_ID` - AWS S3 访问密钥（如果使用图片存储）
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS S3 密钥（如果使用图片存储）
- [ ] `AWS_REGION` - AWS 区域（如果使用图片存储）
- [ ] `AWS_S3_BUCKET` - S3 存储桶名称（如果使用图片存储）

## 数据库设置（可选）

- [ ] 已创建 Neon 或 Supabase 数据库
- [ ] 已复制数据库连接字符串
- [ ] 已运行数据库迁移（如果使用数据库）
- [ ] 已测试数据库连接

## Vercel 部署

- [ ] 已登录 Vercel 账号
- [ ] 已导入 Git 仓库
- [ ] 已配置所有环境变量
- [ ] 已设置构建命令（默认：`pnpm build`）
- [ ] 已设置安装命令（默认：`pnpm install`）
- [ ] 已触发首次部署
- [ ] 已验证部署成功

## 功能验证

- [ ] 应用可以正常访问
- [ ] AI 文章生成功能正常
- [ ] 图片生成功能正常（如果配置）
- [ ] 对话功能正常（如果配置数据库）
- [ ] 无控制台错误

## 性能检查

- [ ] 页面加载速度正常
- [ ] API 响应时间正常
- [ ] 无内存泄漏警告
- [ ] 无网络错误

## 安全检查

- [ ] 环境变量未提交到代码仓库
- [ ] API Key 已正确配置
- [ ] HTTPS 已启用（Vercel 自动）
- [ ] 无敏感信息泄露

## 后续优化（可选）

- [ ] 配置自定义域名
- [ ] 设置自动部署（Git push 触发）
- [ ] 配置监控和日志
- [ ] 设置数据库备份

---

**提示：** 如果遇到问题，请参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的故障排查章节。
