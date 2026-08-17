/**
 * 通用内存限流器
 * 用于 API 路由级别的请求速率控制
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(options: { windowMs: number; maxRequests: number }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * 检查是否超出速率限制
   * @returns true = 已超限，应拒绝请求
   */
  check(key: string): { limited: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // 清理过期条目
    if (entry && now > entry.resetTime) {
      this.store.delete(key);
    }

    const current = this.store.get(key);

    if (!current) {
      this.store.set(key, { count: 1, resetTime: now + this.windowMs });
      return { limited: false, remaining: this.maxRequests - 1, resetIn: this.windowMs };
    }

    current.count++;

    if (current.count > this.maxRequests) {
      return {
        limited: true,
        remaining: 0,
        resetIn: current.resetTime - now,
      };
    }

    return {
      limited: false,
      remaining: this.maxRequests - current.count,
      resetIn: current.resetTime - now,
    };
  }
}

// 注册接口限流器：每 IP 每 15 分钟最多 5 次
export const registerLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});
