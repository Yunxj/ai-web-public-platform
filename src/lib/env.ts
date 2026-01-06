/**
 * 环境变量验证和管理
 */

import { z } from 'zod';

/**
 * 环境变量Schema
 */
const envSchema = z.object({
  // 数据库相关（如果使用环境变量）
  DATABASE_URL: z.string().optional(),
  
  // AWS S3相关（如果使用）
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Node环境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Next.js相关
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

/**
 * 验证并获取环境变量
 */
function getEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('环境变量验证失败:', error.errors);
      throw new Error(`环境变量配置错误: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

/**
 * 导出的环境变量对象
 */
export const env = getEnv();

/**
 * 检查是否为生产环境
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * 检查是否为开发环境
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * 检查是否为测试环境
 */
export const isTest = env.NODE_ENV === 'test';
