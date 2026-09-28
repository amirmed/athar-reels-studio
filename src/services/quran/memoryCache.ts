// ==================== Bounded LRU Cache & In-Flight Deduplication ====================
export const MAX_QURAN_MEMORY_CACHE_ITEMS = 60;
export const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const memoryCache = new Map<string, { data: unknown; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    memoryCache.delete(key);
    return null;
  }
  // Refresh LRU position in Map
  memoryCache.delete(key);
  memoryCache.set(key, entry);
  return entry.data as T;
}

export function setCache(key: string, data: unknown): void {
  if (memoryCache.has(key)) {
    memoryCache.delete(key);
  } else if (memoryCache.size >= MAX_QURAN_MEMORY_CACHE_ITEMS) {
    // Evict oldest entry (first key in Map insertion order)
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function clearQuranMemoryCache(): void {
  memoryCache.clear();
  inFlightRequests.clear();
}

/**
 * Deduplicate concurrent in-flight requests for the same key
 */
export function deduplicatedFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fetchFn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}
