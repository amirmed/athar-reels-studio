/**
 * Quran Local Cache & Offline Resilience Service
 * Uses IndexedDB for rich persistent storage of Ayahs, Word Timings, Translations, and Audio Blobs
 */

const DB_NAME = 'IslamicReels_QuranCache_v2';
const DB_VERSION = 1;
const STORE_AYAHS = 'ayahs_data';
const STORE_AUDIO = 'audio_blobs';
const STORE_TIMINGS = 'word_timings';

class QuranCacheService {
  private dbPromise: Promise<IDBDatabase> | null = null;

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
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_AYAHS)) {
            db.createObjectStore(STORE_AYAHS, { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains(STORE_AUDIO)) {
            db.createObjectStore(STORE_AUDIO, { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains(STORE_TIMINGS)) {
            db.createObjectStore(STORE_TIMINGS, { keyPath: 'key' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
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

  // Active blob URLs tracker to prevent memory leaks
  private activeBlobUrls = new Map<string, string>();

  // =================== AUDIO BLOB CACHE ===================
  async getCachedAudioBlobUrl(audioUrl: string): Promise<string | null> {
    if (!this.dbPromise) return null;
    try {
      const db = await this.dbPromise;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_AUDIO, 'readonly');
        const store = tx.objectStore(STORE_AUDIO);
        const req = store.get(audioUrl);
        req.onsuccess = () => {
          if (req.result?.blob) {
            const oldUrl = this.activeBlobUrls.get(audioUrl);
            if (oldUrl) {
              try {
                URL.revokeObjectURL(oldUrl);
              } catch (err) {
                console.debug('[QuranCache] URL revoke error:', err);
              }
            }
            const blobUrl = URL.createObjectURL(req.result.blob);
            this.activeBlobUrls.set(audioUrl, blobUrl);
            resolve(blobUrl);
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

  async cacheAudioBlob(audioUrl: string, blob: Blob): Promise<void> {
    const dbP = this.getDB();
    if (!dbP) return;
    try {
      const db = await dbP;
      const tx = db.transaction(STORE_AUDIO, 'readwrite');
      const store = tx.objectStore(STORE_AUDIO);
      store.put({ key: audioUrl, blob, timestamp: Date.now() });
    } catch (e) {
      console.warn('Failed to cache audio blob:', e);
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
