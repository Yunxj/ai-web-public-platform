import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cache, cached, generateCacheKey } from '@/lib/cache';

describe('缓存功能', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('应该能够设置和获取缓存', () => {
    cache.set('test-key', 'test-value');
    const value = cache.get<string>('test-key');
    expect(value).toBe('test-value');
  });

  it('应该返回null当缓存不存在时', () => {
    const value = cache.get<string>('non-existent');
    expect(value).toBeNull();
  });

  it('应该能够删除缓存', () => {
    cache.set('test-key', 'test-value');
    cache.delete('test-key');
    const value = cache.get<string>('test-key');
    expect(value).toBeNull();
  });

  it('应该能够生成缓存键', () => {
    const key = generateCacheKey('prefix', 'part1', 'part2', 123);
    expect(key).toBe('prefix:part1:part2:123');
  });

  it('应该能够使用cached装饰器', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      return 'result';
    };

    const result1 = await cached('test-key', fn);
    const result2 = await cached('test-key', fn);

    expect(result1).toBe('result');
    expect(result2).toBe('result');
    expect(callCount).toBe(1); // 应该只调用一次
  });

  it('应该能够处理过期缓存', async () => {
    vi.useFakeTimers();

    cache.set('test-key', 'value', 1000); // 1秒过期

    expect(cache.get<string>('test-key')).toBe('value');

    vi.advanceTimersByTime(2000); // 前进2秒

    // 手动清理过期缓存
    cache.cleanup();
    expect(cache.get<string>('test-key')).toBeNull();

    vi.useRealTimers();
  });
});
