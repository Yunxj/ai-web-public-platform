/**
 * 数据库连接工具
 * 使用 Drizzle ORM 和 PostgreSQL
 * 支持优雅降级：当数据库不可用时返回null，允许应用在无数据库模式下运行
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema';

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;
let dbUnavailable = false; // 标记数据库是否不可用

/**
 * 检查数据库是否可用
 */
export function isDbAvailable(): boolean {
  return !dbUnavailable && dbInstance !== null;
}

/**
 * 获取数据库连接
 * @returns 数据库实例，如果数据库不可用则返回null
 */
export async function getDb(): Promise<ReturnType<typeof drizzle> | null> {
  // 如果已经标记为不可用，直接返回null
  if (dbUnavailable) {
    return null;
  }

  // 如果已经创建了连接，直接返回
  if (dbInstance) {
    return dbInstance;
  }

  // 检查是否有数据库URL配置
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('DATABASE_URL 环境变量未配置，数据库功能不可用，应用将在无数据库模式下运行');
    dbUnavailable = true;
    return null;
  }

  try {
    // 创建连接池
    pool = new Pool({
      connectionString: databaseUrl,
      max: 10, // 最大连接数
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // 测试连接
    await pool.query('SELECT 1');

    // 创建 Drizzle 实例
    dbInstance = drizzle(pool, { schema });

    return dbInstance;
  } catch (error) {
    console.warn('数据库连接失败，应用将在无数据库模式下运行:', error instanceof Error ? error.message : '未知错误');
    dbUnavailable = true;
    
    // 清理连接池
    if (pool) {
      try {
        await pool.end();
      } catch (e) {
        // 忽略清理错误
      }
      pool = null;
    }
    
    return null;
  }
}

/**
 * 关闭数据库连接
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
  }
}
