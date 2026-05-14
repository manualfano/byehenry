// Caché en memoria con TTL de 30 minutos
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T): void {
    const now = Date.now();
    this.store.set(key, {
      data,
      timestamp: now,
      expiresAt: now + CACHE_TTL_MS,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  getTimestamp(key: string): Date | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    return new Date(entry.timestamp);
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidateAll(): void {
    this.store.clear();
  }
}

// Singleton compartido entre requests en el mismo proceso de Node
const globalCache = global as typeof global & { __byeHenryCache?: MemoryCache };
if (!globalCache.__byeHenryCache) {
  globalCache.__byeHenryCache = new MemoryCache();
}

export const cache = globalCache.__byeHenryCache;
export const CACHE_KEY_SHEETS = "google_sheets_data";
