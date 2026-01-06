/**
 * 简单的内存缓存实现
 * 注意：生产环境应该使用Redis等专业缓存服务
 */

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, ttl: number = 3600000): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// 单例实例
const cache = new MemoryCache();

// 定期清理过期缓存（每5分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * 生成缓存键
 */
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * 缓存装饰器
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 3600000
): Promise<T> {
  const cachedValue = cache.get<T>(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  const value = await fn();
  cache.set(key, value, ttl);
  return value;
}

/**
 * 导出缓存实例（用于高级用法）
 */
export { cache };
