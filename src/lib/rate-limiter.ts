/**
 * 简单的内存限流实现
 * 注意：生产环境应该使用Redis等分布式限流服务
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private records = new Map<string, RateLimitRecord>();

  /**
   * 检查是否超过限流
   * @param key 限流键（通常是IP或用户ID）
   * @param maxRequests 最大请求数
   * @param windowMs 时间窗口（毫秒）
   * @returns 是否允许请求，以及剩余请求数
   */
  check(
    key: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.records.get(key);

    // 如果没有记录或已过期，创建新记录
    if (!record || now > record.resetAt) {
      const resetAt = now + windowMs;
      this.records.set(key, {
        count: 1,
        resetAt,
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt,
      };
    }

    // 检查是否超过限制
    if (record.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
      };
    }

    // 增加计数
    record.count++;
    this.records.set(key, record);

    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }

  /**
   * 清理过期记录
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetAt) {
        this.records.delete(key);
      }
    }
  }
}

// 单例实例
const rateLimiter = new RateLimiter();

// 定期清理过期记录（每5分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * 获取客户端IP
 */
export function getClientIP(request: Request): string {
  // 尝试从各种头部获取IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // 默认返回一个标识
  return 'unknown';
}

/**
 * 限流中间件
 */
export function rateLimit(
  maxRequests: number = 100,
  windowMs: number = 60000
): (request: Request) => { allowed: boolean; remaining: number; resetAt: number } {
  return (request: Request) => {
    const key = getClientIP(request);
    return rateLimiter.check(key, maxRequests, windowMs);
  };
}

export { rateLimiter };
