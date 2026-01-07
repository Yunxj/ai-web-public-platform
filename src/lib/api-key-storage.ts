/**
 * API Key 配置存储服务
 * 支持数据库和 localStorage 两种存储方式
 * 优先使用数据库，如果数据库不可用则降级到 localStorage
 */

import { getDb, isDbAvailable } from '@/storage/database/db';
import { eq } from 'drizzle-orm';
import { apiKeyConfigs } from '@/storage/database/shared/schema';

export interface ApiKeyConfig {
  deepseek?: string;
  qwen?: string;
  doubao?: string;
  ark?: string;
}

const STORAGE_KEY = 'ai_web_office_api_keys';

/**
 * 从数据库获取 API Key 配置
 */
async function getApiKeysFromDb(): Promise<ApiKeyConfig | null> {
  try {
    const db = await getDb();
    if (!db) {
      return null;
    }

    const configs = await db.select().from(apiKeyConfigs);

    if (configs.length === 0) {
      return null;
    }

    const result: ApiKeyConfig = {};
    for (const config of configs) {
      switch (config.keyName) {
        case 'deepseek':
          result.deepseek = config.keyValue;
          break;
        case 'qwen':
          result.qwen = config.keyValue;
          break;
        case 'doubao':
          result.doubao = config.keyValue;
          break;
        case 'ark':
          result.ark = config.keyValue;
          break;
      }
    }

    return result;
  } catch (error) {
    console.warn('从数据库读取 API Key 配置失败:', error);
    return null;
  }
}

/**
 * 从 localStorage 获取 API Key 配置
 */
function getApiKeysFromLocalStorage(): ApiKeyConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as ApiKeyConfig;
  } catch (error) {
    console.warn('从 localStorage 读取 API Key 配置失败:', error);
    return null;
  }
}

/**
 * 获取 API Key 配置
 * 优先从数据库读取，如果数据库不可用则从 localStorage 读取
 */
export async function getApiKeys(): Promise<ApiKeyConfig> {
  // 优先从数据库读取
  if (isDbAvailable()) {
    const dbConfig = await getApiKeysFromDb();
    if (dbConfig) {
      return dbConfig;
    }
  }

  // 降级到 localStorage（仅在客户端）
  if (typeof window !== 'undefined') {
    const localConfig = getApiKeysFromLocalStorage();
    if (localConfig) {
      return localConfig;
    }
  }

  return {};
}

/**
 * 保存 API Key 配置到数据库
 */
async function saveApiKeysToDb(config: ApiKeyConfig): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      return false;
    }

    // 先删除所有现有配置
    await db.delete(apiKeyConfigs);

    // 插入新配置
    const entries = [
      { keyName: 'deepseek', keyValue: config.deepseek },
      { keyName: 'qwen', keyValue: config.qwen },
      { keyName: 'doubao', keyValue: config.doubao },
      { keyName: 'ark', keyValue: config.ark },
    ].filter(entry => entry.keyValue); // 只保存有值的配置

    if (entries.length > 0) {
      await db.insert(apiKeyConfigs).values(
        entries.map(entry => ({
          keyName: entry.keyName,
          keyValue: entry.keyValue!,
        }))
      );
    }

    return true;
  } catch (error) {
    console.error('保存 API Key 配置到数据库失败:', error);
    return false;
  }
}

/**
 * 保存 API Key 配置到 localStorage
 */
function saveApiKeysToLocalStorage(config: ApiKeyConfig): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('保存 API Key 配置到 localStorage 失败:', error);
    return false;
  }
}

/**
 * 保存 API Key 配置
 * 优先保存到数据库，如果数据库不可用则保存到 localStorage
 */
export async function saveApiKeys(config: ApiKeyConfig): Promise<boolean> {
  // 优先保存到数据库
  if (isDbAvailable()) {
    const saved = await saveApiKeysToDb(config);
    if (saved) {
      return true;
    }
  }

  // 降级到 localStorage（仅在客户端）
  if (typeof window !== 'undefined') {
    return saveApiKeysToLocalStorage(config);
  }

  return false;
}

/**
 * 清除 API Key 配置
 */
export async function clearApiKeys(): Promise<boolean> {
  // 清除数据库配置
  try {
    const db = await getDb();
    if (db) {
      await db.delete(apiKeyConfigs);
    }
  } catch (error) {
    console.warn('清除数据库 API Key 配置失败:', error);
  }

  // 清除 localStorage 配置
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('清除 localStorage API Key 配置失败:', error);
    }
  }

  return true;
}
