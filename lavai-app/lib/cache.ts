// ============================================================
// LAVAI — Simple in-memory cache for expensive computations
// ============================================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class SimpleCache {
  private store = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttlMs = 30_000): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs })
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  /** Delete all keys that contain the given pattern string */
  invalidate(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key)
      }
    }
  }

  clear(): void {
    this.store.clear()
  }

  /** Returns current number of live entries (for debugging) */
  size(): number {
    const now = Date.now()
    let count = 0
    for (const entry of this.store.values()) {
      if (now <= entry.expiresAt) count++
    }
    return count
  }
}

export const cache = new SimpleCache()

/**
 * Higher-order function: wraps an async function with caching.
 *
 * Usage:
 *   const getStats = withCache(
 *     () => fetchExpensiveData(),
 *     `dashboard:stats:${lavaJatoId}`,
 *     60_000
 *   )
 *   const data = await getStats()
 */
export function withCache<T>(
  fn: () => Promise<T>,
  key: string,
  ttlMs = 30_000
): () => Promise<T> {
  return async () => {
    const cached = cache.get<T>(key)
    if (cached !== null) return cached
    const data = await fn()
    cache.set(key, data, ttlMs)
    return data
  }
}

/**
 * Cache decorator for API route handlers.
 * Stores per-lavaJatoId data and respects TTL.
 */
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 60_000
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached !== null) return cached
  const data = await fetcher()
  cache.set(key, data, ttlMs)
  return data
}
