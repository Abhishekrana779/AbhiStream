type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class CacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = CACHE_TTL_MS): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new CacheService();

// Prune expired entries every 10 minutes
const pruneInterval = setInterval(() => {
  cache.prune();
}, 10 * 60 * 1000);
pruneInterval.unref();