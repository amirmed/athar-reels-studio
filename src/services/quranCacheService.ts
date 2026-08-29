/**
 * Quran Local Cache & Offline Resilience Service
 * Uses IndexedDB for rich persistent storage of Ayahs, Word Timings, Translations, and Audio Blobs
 * with automated LRU eviction, quota monitoring, and memory leak prevention.
 */

const DB_NAME = 'IslamicReels_QuranCache_v2';
const DB_VERSION = 2;
const STORE_AYAHS = 'ayahs_data';
const STORE_AUDIO = 'audio_blobs';
const STORE_TIMINGS = 'word_timings';

// Storage and LRU Limits for Quran Audio Cache
export const MAX_QURAN_AUDIO_RECORDS = 100; // Max stored Quran ayah/surah audio clips
export const MAX_QURAN_AUDIO_BYTES = 120 * 1024 * 1024; // 120 MB max total audio cache
export const TARGET_QURAN_AUDIO_BYTES_AFTER_EVICTION = 80 * 1024 * 1024; // 80 MB target on eviction (~70%)
export const TARGET_QURAN_AUDIO_RECORDS_AFTER_EVICTION = 70; // 70 items target on eviction (~70%)

export interface StoredQuranAudioRecord {
  key: string; // audioUrl
  blob: Blob;
  mimeType?: string;
  size: number;
  duration?: number;
  timestamp?: number; // legacy backwards compatibility
  createdAt: number;
  lastAccessedAt: number;
  pinned?: boolean;
}

export interface StoredQuranAudioMetadata {
  key: string;
  mimeType: string;
  size: number;
  duration?: number;
  createdAt: number;
  lastAccessedAt: number;
  pinned?: boolean;
}

export interface QuranStorageStats {
  totalCount: number;
  totalSizeBytes: number;
  formattedSize: string;
  quotaEstimate?: {
    usage: number;
    quota: number;
    percentUsed: number;
  };
}

export interface QuranEvictionResult {
  evictedCount: number;
  freedBytes: number;
}

/**
 * Format bytes to human-readable string (B / KB / MB / GB)
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

class QuranCacheService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  // Active blob URLs tracker to prevent memory leaks
  private activeBlobUrls = new Map<string, string>();

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.dbPromise = this.initDB();
      // Auto-purge any corrupted localStorage keys from older versions
      this.clearCorruptedLocalStorage();
    }
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      try {
        if (typeof window === 'undefined' || !window.indexedDB) {
          this.dbPromise = null;
          reject(new Error('IndexedDB not supported in this environment'));
          return;
        }

        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (event) => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_AYAHS)) {
            db.createObjectStore(STORE_AYAHS, { keyPath: 'key' });
          }

          let audioStore: IDBObjectStore;
          if (!db.objectStoreNames.contains(STORE_AUDIO)) {
            audioStore = db.createObjectStore(STORE_AUDIO, { keyPath: 'key' });
          } else {
            audioStore = (event.target as IDBOpenDBRequest).transaction!.objectStore(STORE_AUDIO);
          }

          if (audioStore && !audioStore.indexNames.contains('lastAccessedAt')) {
            audioStore.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
          }

          if (!db.objectStoreNames.contains(STORE_TIMINGS)) {
            db.createObjectStore(STORE_TIMINGS, { keyPath: 'key' });
          }
        };

        req.onsuccess = () => {
          const db = req.result;
          db.onclose = () => {
            this.dbPromise = null;
          };
          db.onversionchange = () => {
            db.close();
            this.dbPromise = null;
          };
          resolve(db);
        };

        req.onerror = () => {
          console.error('[QuranCache] Failed to open IndexedDB:', req.error);
          this.dbPromise = null;
          reject(req.error);
        };

        req.onblocked = () => {
          console.warn('[QuranCache] IndexedDB open blocked by another open connection');
          this.dbPromise = null;
          reject(new Error('IndexedDB open request was blocked by another tab or connection'));
        };
      } catch (err) {
        this.dbPromise = null;
        reject(err);
      }
    });
  }

  private getDB(): Promise<IDBDatabase> | null {
    if (!this.dbPromise && typeof window !== 'undefined' && 'indexedDB' in window) {
      this.dbPromise = this.initDB();
    }
    return this.dbPromise;
  }

  /**
   * Reset internal state and database promise (useful for tests)
   */
  _resetForTesting(): void {
    this.dbPromise = null;
    this.activeBlobUrls.clear();
  }

  // =================== AYAHS CACHE ===================
  async getCachedAyahs<T = unknown>(
    surahNumber: number,
    edition: string = 'quran-uthmani'
  ): Promise<T | null> {
    const storageKey = `surah_${surahNumber}_${edition}`;
    const isArabicRequested = edition.includes('ar') || edition.includes('uthmani');

    const validateData = (data: unknown): boolean => {
      if (
        !data ||
        typeof data !== 'object' ||
        !('ayahs' in data) ||
        !Array.isArray((data as { ayahs: unknown[] }).ayahs) ||
        (data as { ayahs: unknown[] }).ayahs.length === 0
      ) {
        return false;
      }
      if (isArabicRequested) {
        // Strict Arabic verification: First ayah must contain Arabic script
        const ayahsList = (data as { ayahs: Array<{ text?: string }> }).ayahs;
        const sampleText = ayahsList[0]?.text || '';
        const hasArabic = /[\u0600-\u06FF]/.test(sampleText);
        if (!hasArabic) {
          console.warn(
            `[QuranCache] Detected non-Arabic text in Arabic cache for surah ${surahNumber}, invalidating.`
          );
          return false;
        }
      }
      return true;
    };

    const dbP = this.getDB();
    if (!dbP) {
      const fallback = this.getFallbackLocalStorage(storageKey);
      return validateData(fallback) ? (fallback as T) : null;
    }

    try {
      const db = await dbP;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_AYAHS, 'readonly');
        const store = tx.objectStore(STORE_AYAHS);
        const req = store.get(storageKey);
        req.onsuccess = () => {
          const result = req.result?.data;
          if (validateData(result)) {
            resolve(result as T);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      const fallback = this.getFallbackLocalStorage(storageKey);
      return validateData(fallback) ? (fallback as T) : null;
    }
  }

  async setCachedAyahs(
    surahNumber: number,
    data: unknown,
    edition: string = 'quran-uthmani'
  ): Promise<void> {
    const storageKey = `surah_${surahNumber}_${edition}`;
    this.setFallbackLocalStorage(storageKey, data);
    const dbP = this.getDB();
    if (!dbP) return;
    try {
      const db = await dbP;
      const tx = db.transaction(STORE_AYAHS, 'readwrite');
      const store = tx.objectStore(STORE_AYAHS);
      store.put({ key: storageKey, data, timestamp: Date.now() });
    } catch (e) {
      console.warn('Failed to cache ayahs in IndexedDB:', e);
    }
  }

  // =================== WORD TIMINGS CACHE ===================
  async getCachedTimings<T = unknown>(reciterId: string, surahNumber: number): Promise<T | null> {
    const dbP = this.getDB();
    if (!dbP) return null;
    try {
      const db = await dbP;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_TIMINGS, 'readonly');
        const store = tx.objectStore(STORE_TIMINGS);
        const req = store.get(`timing_${reciterId}_${surahNumber}`);
        req.onsuccess = () => resolve((req.result?.data as T) || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async setCachedTimings(reciterId: string, surahNumber: number, data: unknown): Promise<void> {
    const dbP = this.getDB();
    if (!dbP) return;
    try {
      const db = await dbP;
      const tx = db.transaction(STORE_TIMINGS, 'readwrite');
      const store = tx.objectStore(STORE_TIMINGS);
      store.put({ key: `timing_${reciterId}_${surahNumber}`, data, timestamp: Date.now() });
    } catch (e) {
      console.warn('Failed to cache timings in IndexedDB:', e);
    }
  }

  // =================== AUDIO BLOB CACHE WITH LRU ===================

  /**
   * Retrieve audio Blob from IndexedDB and touch lastAccessedAt for LRU eviction.
   */
  async getCachedAudioBlob(audioUrl: string): Promise<Blob | null> {
    const dbP = this.getDB();
    if (!dbP) return null;
    try {
      const db = await dbP;
      return await new Promise<Blob | null>((resolve) => {
        const tx = db.transaction(STORE_AUDIO, 'readwrite');
        const store = tx.objectStore(STORE_AUDIO);
        const req = store.get(audioUrl);
        req.onsuccess = () => {
          const record = req.result as StoredQuranAudioRecord | undefined;
          if (record && record.blob) {
            // Touch lastAccessedAt in background
            try {
              record.lastAccessedAt = Date.now();
              store.put(record);
            } catch (touchErr) {
              console.debug('[QuranCache] Touch lastAccessedAt error:', touchErr);
            }
            resolve(record.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Retrieve cached audio Blob as Object URL, touching lastAccessedAt for LRU.
   */
  async getCachedAudioBlobUrl(audioUrl: string): Promise<string | null> {
    const blob = await this.getCachedAudioBlob(audioUrl);
    if (!blob) return null;

    const oldUrl = this.activeBlobUrls.get(audioUrl);
    if (oldUrl) {
      try {
        URL.revokeObjectURL(oldUrl);
      } catch (err) {
        console.debug('[QuranCache] URL revoke error:', err);
      }
    }

    const blobUrl = URL.createObjectURL(blob);
    this.activeBlobUrls.set(audioUrl, blobUrl);
    return blobUrl;
  }

  /**
   * Cache audio Blob permanently into IndexedDB with metadata and trigger async LRU eviction check.
   */
  async cacheAudioBlob(
    audioUrl: string,
    blob: Blob,
    options?: {
      pinned?: boolean;
      duration?: number;
      mimeType?: string;
      protectedKeys?: Set<string> | string[];
    }
  ): Promise<void> {
    const dbP = this.getDB();
    if (!dbP) return;

    try {
      const db = await dbP;
      const now = Date.now();
      const record: StoredQuranAudioRecord = {
        key: audioUrl,
        blob,
        mimeType: options?.mimeType || blob.type || 'audio/mp3',
        size: blob.size || 0,
        duration: options?.duration,
        createdAt: now,
        lastAccessedAt: now,
        pinned: Boolean(options?.pinned),
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_AUDIO, 'readwrite');
        const store = tx.objectStore(STORE_AUDIO);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Revoke old object URL if any
      const oldUrl = this.activeBlobUrls.get(audioUrl);
      if (oldUrl && oldUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(oldUrl);
        } catch (err) {
          console.debug('[QuranCache] URL revoke error:', err);
        }
        this.activeBlobUrls.delete(audioUrl);
      }

      // Trigger LRU eviction check asynchronously (non-blocking)
      const protectedKeys = new Set(
        options?.protectedKeys instanceof Set
          ? options.protectedKeys
          : options?.protectedKeys || []
      );
      protectedKeys.add(audioUrl);

      this.evictStaleAudioBlobs({ protectedKeys }).catch((err) => {
        console.debug('[QuranCache] Async eviction check:', err);
      });
    } catch (e) {
      console.warn('[QuranCache] Failed to cache audio blob:', e);
    }
  }

  /**
   * Get metadata for all stored Quran audio records without loading binary blobs into memory
   */
  async getAllStoredAudioMetadata(): Promise<StoredQuranAudioMetadata[]> {
    const dbP = this.getDB();
    if (!dbP) return [];
    try {
      const db = await dbP;
      return await new Promise<StoredQuranAudioMetadata[]>((resolve) => {
        const tx = db.transaction(STORE_AUDIO, 'readonly');
        const store = tx.objectStore(STORE_AUDIO);
        const req = store.getAll();
        req.onsuccess = () => {
          const records = (req.result as StoredQuranAudioRecord[]) || [];
          const metadata: StoredQuranAudioMetadata[] = records.map((r) => ({
            key: r.key,
            mimeType: r.mimeType || (r.blob ? r.blob.type : 'audio/mp3'),
            size: r.size || (r.blob ? r.blob.size : 0),
            duration: r.duration,
            createdAt: r.createdAt || r.timestamp || Date.now(),
            lastAccessedAt: r.lastAccessedAt || r.createdAt || r.timestamp || Date.now(),
            pinned: Boolean(r.pinned),
          }));
          resolve(metadata);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  /**
   * Get comprehensive Quran audio storage usage statistics
   */
  async getAudioStorageStats(): Promise<QuranStorageStats> {
    const metadata = await this.getAllStoredAudioMetadata();
    const totalCount = metadata.length;
    const totalSizeBytes = metadata.reduce((acc, m) => acc + (m.size || 0), 0);

    let quotaEstimate: QuranStorageStats['quotaEstimate'] | undefined = undefined;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage !== undefined && estimate.quota !== undefined && estimate.quota > 0) {
          quotaEstimate = {
            usage: estimate.usage,
            quota: estimate.quota,
            percentUsed: Math.round((estimate.usage / estimate.quota) * 100),
          };
        }
      } catch (err) {
        console.debug('[QuranCache] Storage estimate error:', err);
      }
    }

    return {
      totalCount,
      totalSizeBytes,
      formattedSize: formatBytes(totalSizeBytes),
      quotaEstimate,
    };
  }

  /**
   * Evict least recently accessed Quran audio records (LRU) when storage or count limits are exceeded.
   */
  async evictStaleAudioBlobs(options?: {
    protectedKeys?: Set<string> | string[];
    maxBytes?: number;
    maxItems?: number;
  }): Promise<QuranEvictionResult> {
    const maxBytes = options?.maxBytes ?? MAX_QURAN_AUDIO_BYTES;
    const maxItems = options?.maxItems ?? MAX_QURAN_AUDIO_RECORDS;
    const protectedSet = new Set<string>(
      options?.protectedKeys instanceof Set
        ? options.protectedKeys
        : options?.protectedKeys || []
    );

    const metadata = await this.getAllStoredAudioMetadata();
    const totalBytes = metadata.reduce((acc, m) => acc + (m.size || 0), 0);
    const totalCount = metadata.length;

    // If within limits, nothing to evict
    if (totalBytes <= maxBytes && totalCount <= maxItems) {
      return { evictedCount: 0, freedBytes: 0 };
    }

    // Filter candidates: exclude pinned records and protected active keys
    const candidates = metadata
      .filter((m) => !m.pinned && !protectedSet.has(m.key))
      .sort((a, b) => (a.lastAccessedAt || 0) - (b.lastAccessedAt || 0)); // Oldest accessed first

    let currentBytes = totalBytes;
    let currentCount = totalCount;
    const keysToEvict: string[] = [];
    let freedBytes = 0;

    const targetBytes =
      options?.maxBytes !== undefined
        ? Math.floor(options.maxBytes * 0.7)
        : TARGET_QURAN_AUDIO_BYTES_AFTER_EVICTION;
    const targetCount =
      options?.maxItems !== undefined
        ? Math.max(1, Math.floor(options.maxItems * 0.7))
        : TARGET_QURAN_AUDIO_RECORDS_AFTER_EVICTION;

    for (const item of candidates) {
      if (currentBytes <= targetBytes && currentCount <= targetCount) {
        break;
      }

      keysToEvict.push(item.key);
      currentBytes -= item.size || 0;
      currentCount -= 1;
      freedBytes += item.size || 0;
    }

    if (keysToEvict.length === 0) {
      return { evictedCount: 0, freedBytes: 0 };
    }

    const dbP = this.getDB();
    if (!dbP) return { evictedCount: 0, freedBytes: 0 };

    try {
      const db = await dbP;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_AUDIO, 'readwrite');
        const store = tx.objectStore(STORE_AUDIO);
        let pending = keysToEvict.length;
        let isSettled = false;

        const safeResolve = () => {
          if (!isSettled) {
            isSettled = true;
            resolve();
          }
        };

        for (const key of keysToEvict) {
          const req = store.delete(key);
          req.onsuccess = () => {
            pending--;
            if (pending <= 0) safeResolve();
          };
          req.onerror = () => {
            pending--;
            if (pending <= 0) safeResolve();
          };

          // Revoke active object URL
          const oldUrl = this.activeBlobUrls.get(key);
          if (oldUrl) {
            try {
              URL.revokeObjectURL(oldUrl);
            } catch (err) {
              console.debug('[QuranCache] URL revoke error:', err);
            }
            this.activeBlobUrls.delete(key);
          }
        }
        tx.oncomplete = () => safeResolve();
        tx.onerror = () => reject(tx.error);
      });

      console.info(
        `[QuranCache] LRU Eviction: removed ${keysToEvict.length} audio record(s), freed ${formatBytes(freedBytes)}.`
      );
    } catch (err) {
      console.warn('[QuranCache] LRU Eviction failed:', err);
    }

    return { evictedCount: keysToEvict.length, freedBytes };
  }

  /**
   * Delete a specific cached audio blob from IndexedDB and revoke its URL
   */
  async deleteCachedAudioBlob(audioUrl: string): Promise<void> {
    const oldUrl = this.activeBlobUrls.get(audioUrl);
    if (oldUrl) {
      try {
        URL.revokeObjectURL(oldUrl);
      } catch (err) {
        console.debug('[QuranCache] URL revoke error:', err);
      }
      this.activeBlobUrls.delete(audioUrl);
    }

    const dbP = this.getDB();
    if (!dbP) return;

    try {
      const db = await dbP;
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_AUDIO, 'readwrite');
        const store = tx.objectStore(STORE_AUDIO);
        const req = store.delete(audioUrl);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch (err) {
      console.warn(`[QuranCache] Delete error for audio ${audioUrl}:`, err);
    }
  }

  /**
   * Completely clears all Quran audio recordings from IndexedDB and revokes all blob URLs
   */
  async clearAllAudioCache(): Promise<void> {
    try {
      for (const url of this.activeBlobUrls.values()) {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          console.debug('[QuranCache] URL revoke error:', err);
        }
      }
      this.activeBlobUrls.clear();

      const dbP = this.getDB();
      if (!dbP) return;
      const db = await dbP;
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_AUDIO, 'readwrite');
        const store = tx.objectStore(STORE_AUDIO);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch (err) {
      console.warn('[QuranCache] Clear all audio error:', err);
    }
  }

  /**
   * Completely clears all stores (ayahs, timings, and audio) from IndexedDB
   */
  async clearEntireCache(): Promise<void> {
    await this.clearAllAudioCache();
    const dbP = this.getDB();
    if (!dbP) return;
    try {
      const db = await dbP;
      await new Promise<void>((resolve) => {
        const tx = db.transaction([STORE_AYAHS, STORE_TIMINGS], 'readwrite');
        tx.objectStore(STORE_AYAHS).clear();
        tx.objectStore(STORE_TIMINGS).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (err) {
      console.warn('[QuranCache] Clear entire cache error:', err);
    }
  }

  // =================== FALLBACK LOCALSTORAGE ===================
  private getFallbackLocalStorage<T = unknown>(key: string): T | null {
    try {
      const raw = localStorage.getItem(`quran_cache_${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private setFallbackLocalStorage(key: string, data: unknown): void {
    try {
      localStorage.setItem(`quran_cache_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('[QuranCache] localStorage quota exceeded:', e);
    }
  }

  private clearCorruptedLocalStorage(): void {
    try {
      // Remove any legacy unversioned ayahs caches
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('quran_cache_ayahs_')) {
          localStorage.removeItem(k);
        }
      }
    } catch (err) {
      console.warn('[QuranCache] clearCorruptedLocalStorage error:', err);
    }
  }
}

export const quranCacheService = new QuranCacheService();
