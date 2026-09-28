import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getPexelsCacheEntry,
  setPexelsCacheEntry,
  clearPexelsCache,
  getPexelsRemainingHourlyQuota,
  _resetPexelsRateLimiterForTesting,
  searchVideos,
  setPexelsApiKey,
  PEXELS_MAX_CACHE_ENTRIES,
} from '../services/pexelsApi';
import {
  getCached,
  setCache,
  clearQuranMemoryCache,
  MAX_QURAN_MEMORY_CACHE_ITEMS,
  fetchAyahs,
} from '../services/quranApi';
import {
  quranCacheService,
  MAX_STORED_SURAHS,
  MAX_STORED_TIMINGS,
} from '../services/quranCacheService';

function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((k: string) => (k in store ? store[k] : null)),
    setItem: vi.fn((k: string, v: string) => {
      store[k] = String(v);
    }),
    removeItem: vi.fn((k: string) => {
      delete store[k];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('Rate Limiting, LRU Caching & Quota Enforcement', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).window = (globalThis as any).window || globalThis;
    (globalThis as any).window.localStorage = mockStorage;
  });

  describe('Pexels API Rate Limiter & LRU Cache', () => {
    beforeEach(() => {
      _resetPexelsRateLimiterForTesting();
      mockStorage.clear();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('initializes remaining hourly quota to 180 requests', () => {
      const quota = getPexelsRemainingHourlyQuota();
      expect(quota).toBe(180);
    });

    it('stores and retrieves cached items in Pexels cache', () => {
      const mockResult = { total_results: 1, page: 1, per_page: 15, videos: [] };
      setPexelsCacheEntry('videos:nature:1:15', mockResult);

      const cached = getPexelsCacheEntry('videos:nature:1:15');
      expect(cached).toEqual(mockResult);
    });

    it('evicts oldest entry when Pexels cache exceeds max capacity', () => {
      for (let i = 1; i <= PEXELS_MAX_CACHE_ENTRIES + 5; i++) {
        setPexelsCacheEntry(`key_${i}`, { index: i });
      }

      // Oldest keys (1 to 5) should have been evicted
      expect(getPexelsCacheEntry('key_1')).toBeNull();
      expect(getPexelsCacheEntry('key_5')).toBeNull();
      // Latest keys should be preserved
      expect(getPexelsCacheEntry(`key_${PEXELS_MAX_CACHE_ENTRIES + 5}`)).toEqual({
        index: PEXELS_MAX_CACHE_ENTRIES + 5,
      });
    });

    it('clears Pexels cache via clearPexelsCache', () => {
      setPexelsCacheEntry('test_entry', { a: 1 });
      expect(getPexelsCacheEntry('test_entry')).not.toBeNull();
      clearPexelsCache();
      expect(getPexelsCacheEntry('test_entry')).toBeNull();
    });

    it('returns cached results without invoking network fetch', async () => {
      setPexelsApiKey('valid_test_api_key_123456');
      const mockResponse = {
        total_results: 1,
        page: 1,
        per_page: 15,
        videos: [
          {
            id: 101,
            width: 1920,
            height: 1080,
            url: 'https://pexels.com/video/101',
            image: 'https://images.pexels.com/101.jpg',
            duration: 15,
            user: { name: 'Videographer' },
            video_files: [],
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      // First call -> hits network
      const res1 = await searchVideos('mountains', 1, 15);
      expect(res1.videos.length).toBe(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Second identical call -> served from LRU cache, 0 extra network calls
      const res2 = await searchVideos('mountains', 1, 15);
      expect(res2.videos.length).toBe(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('retries with exponential backoff on HTTP 429 Too Many Requests', async () => {
      setPexelsApiKey('valid_test_api_key_123456');
      const mockSuccessResponse = {
        total_results: 1,
        page: 1,
        per_page: 15,
        videos: [],
      };

      const rateLimitResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'Retry-After': '0' }),
      } as unknown as Response;

      const successResponse = {
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      } as unknown as Response;

      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(successResponse);

      const res = await searchVideos('ocean', 1, 15);
      expect(res.total_results).toBe(1);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      // Even with 2 attempts (1 failure + 1 retry success), only 1 successful request is counted
      expect(getPexelsRemainingHourlyQuota()).toBe(179);
    });

    it('does not consume hourly quota when a network error or 500 failure occurs', async () => {
      setPexelsApiKey('valid_test_api_key_123456');
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network disconnected'));

      expect(getPexelsRemainingHourlyQuota()).toBe(180);

      await expect(searchVideos('desert', 1, 15)).rejects.toThrow('Network disconnected');

      // Failed request must NOT deplete the quota
      expect(getPexelsRemainingHourlyQuota()).toBe(180);
    });
  });

  describe('Quran API In-Flight Deduplication & Memory Cache', () => {
    beforeEach(() => {
      clearQuranMemoryCache();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('stores and retrieves items from Quran memory cache', () => {
      setCache('test_key', { data: 'test_value' });
      const val = getCached<{ data: string }>('test_key');
      expect(val).toEqual({ data: 'test_value' });
    });

    it('evicts oldest item when memory cache exceeds MAX_QURAN_MEMORY_CACHE_ITEMS', () => {
      for (let i = 1; i <= MAX_QURAN_MEMORY_CACHE_ITEMS + 5; i++) {
        setCache(`quran_key_${i}`, i);
      }

      expect(getCached('quran_key_1')).toBeNull();
      expect(getCached('quran_key_2')).toBeNull();
      expect(getCached(`quran_key_${MAX_QURAN_MEMORY_CACHE_ITEMS + 5}`)).toBe(
        MAX_QURAN_MEMORY_CACHE_ITEMS + 5
      );
    });

    it('deduplicates concurrent in-flight requests for the same endpoint', async () => {
      const mockSurahData = {
        code: 200,
        status: 'OK',
        data: {
          number: 112,
          name: 'سُورَةُ الإِخۡلَاصِ',
          englishName: 'Al-Ikhlaas',
          numberOfAyahs: 4,
          ayahs: [
            { number: 1, numberInSurah: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', juz: 30, page: 604 },
            { number: 2, numberInSurah: 2, text: 'اللَّهُ الصَّمَدُ', juz: 30, page: 604 },
          ],
        },
      };

      let fetchCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        fetchCount++;
        // Small delay to ensure concurrent requests overlap
        await new Promise((r) => setTimeout(r, 20));
        return {
          ok: true,
          status: 200,
          json: async () => mockSurahData,
        } as Response;
      });

      // Fire 3 simultaneous calls for the same surah
      const [r1, r2, r3] = await Promise.all([
        fetchAyahs(112, 1, 2),
        fetchAyahs(112, 1, 2),
        fetchAyahs(112, 1, 2),
      ]);

      expect(r1.length).toBe(2);
      expect(r2.length).toBe(2);
      expect(r3.length).toBe(2);
      // Only ONE network fetch should have executed due to in-flight deduplication
      expect(fetchCount).toBe(1);
    });
  });

  describe('Quran Cache Service Quota Protection & IndexedDB LRU Eviction', () => {
    let mockAyahsMap: Map<string, any>;
    let mockTimingsMap: Map<string, any>;

    beforeEach(() => {
      localStorage.clear();
      mockAyahsMap = new Map();
      mockTimingsMap = new Map();

      const createStore = (map: Map<string, any>) => ({
        put: (item: any) => {
          map.set(item.key, item);
          const req: any = {};
          setTimeout(() => req.onsuccess && req.onsuccess(), 0);
          return req;
        },
        get: (key: string) => {
          const item = map.get(key);
          const req: any = { result: item };
          setTimeout(() => req.onsuccess && req.onsuccess(), 0);
          return req;
        },
        getAll: () => {
          const items = Array.from(map.values());
          const req: any = { result: items };
          setTimeout(() => req.onsuccess && req.onsuccess(), 0);
          return req;
        },
        delete: (key: string) => {
          map.delete(key);
          const req: any = {};
          setTimeout(() => req.onsuccess && req.onsuccess(), 0);
          return req;
        },
        clear: () => {
          map.clear();
          const req: any = {};
          setTimeout(() => req.onsuccess && req.onsuccess(), 0);
          return req;
        },
        createIndex: () => {},
        indexNames: { contains: () => true },
      });

      const mockDb = {
        objectStoreNames: { contains: () => true },
        createObjectStore: (name: string) =>
          createStore(name === 'word_timings' ? mockTimingsMap : mockAyahsMap),
        transaction: (names: string | string[]) => {
          const primary = Array.isArray(names) ? names[0] : names;
          const map = primary === 'word_timings' ? mockTimingsMap : mockAyahsMap;
          return {
            objectStore: () => createStore(map),
            oncomplete: null,
            onerror: null,
          };
        },
        close: () => {},
      };

      (globalThis as any).window = (globalThis as any).window || globalThis;
      (globalThis as any).window.indexedDB = {
        open: () => {
          const req: any = { result: mockDb };
          setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
          return req;
        },
      };

      quranCacheService._resetForTesting();
    });

    it('defines safe upper bounds for persistent storage quota', () => {
      expect(MAX_STORED_SURAHS).toBe(40);
      expect(MAX_STORED_TIMINGS).toBe(50);
    });

    it('does NOT write full surahs into localStorage to prevent quota exhaustion', async () => {
      const mockSurah = {
        surahNumber: 1,
        ayahs: [{ number: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' }],
      };

      await quranCacheService.setCachedAyahs(1, mockSurah, 'quran-uthmani');

      // localStorage must remain clean with 0 quran_cache_* keys
      let foundQuranKey = false;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('quran_cache_')) {
          foundQuranKey = true;
          break;
        }
      }
      expect(foundQuranKey).toBe(false);
      expect(mockAyahsMap.has('surah_1_quran-uthmani')).toBe(true);
    });

    it('purges legacy quran_cache_* keys from localStorage via clearCorruptedLocalStorage', () => {
      localStorage.setItem('quran_cache_surah_1_uthmani', '{"ayahs":[...]}');
      localStorage.setItem('quran_cache_ayahs_old', '{"data":1}');
      localStorage.setItem('user_preferred_reciter', 'alafasy_128'); // user setting, should stay

      const purged = quranCacheService.clearCorruptedLocalStorage();
      expect(purged).toBe(2);
      expect(localStorage.getItem('quran_cache_surah_1_uthmani')).toBeNull();
      expect(localStorage.getItem('quran_cache_ayahs_old')).toBeNull();
      expect(localStorage.getItem('user_preferred_reciter')).toBe('alafasy_128');
    });

    it('evicts oldest accessed surahs when count exceeds limit', async () => {
      const now = Date.now();
      for (let i = 1; i <= 5; i++) {
        mockAyahsMap.set(`surah_${i}_quran-uthmani`, {
          key: `surah_${i}_quran-uthmani`,
          data: { ayahs: [{ number: 1, text: 'بِسْمِ اللَّهِ' }] },
          lastAccessedAt: now + i * 1000, // surah 1 oldest, surah 5 newest
          createdAt: now,
        });
      }

      expect(mockAyahsMap.size).toBe(5);

      // Trigger eviction with limit = 3 (target ~ 2)
      const evictedCount = await quranCacheService.evictStaleAyahs(3);
      expect(evictedCount).toBeGreaterThan(0);
      // Oldest (surah_1) must be evicted
      expect(mockAyahsMap.has('surah_1_quran-uthmani')).toBe(false);
      // Newest (surah_5) must be preserved
      expect(mockAyahsMap.has('surah_5_quran-uthmani')).toBe(true);
    });

    it('evicts oldest accessed word timings when count exceeds limit', async () => {
      const now = Date.now();
      for (let i = 1; i <= 5; i++) {
        mockTimingsMap.set(`timing_alafasy_${i}`, {
          key: `timing_alafasy_${i}`,
          data: [{ word: 'كلمة', start: 0, end: 1 }],
          lastAccessedAt: now + i * 1000,
          createdAt: now,
        });
      }

      expect(mockTimingsMap.size).toBe(5);

      // Trigger eviction with limit = 3 (target ~ 2)
      const evictedCount = await quranCacheService.evictStaleTimings(3);
      expect(evictedCount).toBeGreaterThan(0);
      // Oldest (timing_alafasy_1) must be evicted
      expect(mockTimingsMap.has('timing_alafasy_1')).toBe(false);
      // Newest (timing_alafasy_5) must be preserved
      expect(mockTimingsMap.has('timing_alafasy_5')).toBe(true);
    });

    it('touches lastAccessedAt when retrieving cached ayahs', async () => {
      const oldTime = 1000;
      mockAyahsMap.set('surah_1_quran-uthmani', {
        key: 'surah_1_quran-uthmani',
        data: { ayahs: [{ number: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' }] },
        lastAccessedAt: oldTime,
      });

      const retrieved = await quranCacheService.getCachedAyahs(1, 'quran-uthmani');
      expect(retrieved).not.toBeNull();

      const updatedRecord = mockAyahsMap.get('surah_1_quran-uthmani');
      expect(updatedRecord.lastAccessedAt).toBeGreaterThan(oldTime);
    });
  });
});
