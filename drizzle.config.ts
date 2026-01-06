import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/storage/database/shared/schema.ts',
  out: './src/storage/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // 注意：实际使用时应该从环境变量读取
    // url: process.env.DATABASE_URL || '',
  },
});
