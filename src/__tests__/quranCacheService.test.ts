import { describe, it, expect, beforeEach } from 'vitest';
import { quranCacheService } from '../services/quranCacheService';

describe('Quran Local Cache Service', () => {
  beforeEach(() => {
    const storage = new Map<string, any>();

    const mockStore = {
      put: (item: any) => {
        storage.set(item.key, item);
        const req: any = {};
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      get: (key: string) => {
        const item = storage.get(key);
        const req: any = { result: item };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
    };

    const mockDb = {
      objectStoreNames: { contains: () => true },
      createObjectStore: () => {},
      transaction: () => ({
        objectStore: () => mockStore,
      }),
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
  });

  it('validates and stores Arabic Quran Ayahs accurately', async () => {
    const validSurahData = {
      surahNumber: 1,
      ayahs: [
        {
          number: 1,
          text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        },
      ],
    };

    await quranCacheService.setCachedAyahs(1, validSurahData, 'quran-uthmani');
    const cached = (await quranCacheService.getCachedAyahs(1, 'quran-uthmani')) as { ayahs: Array<{ number: number; text: string }> } | null;
    expect(cached).not.toBeNull();
    expect(cached?.ayahs[0]?.text).toContain('بِسْمِ اللَّهِ');
  });

  it('invalidates Arabic cache if text does not contain Arabic characters', async () => {
    const corruptedData = {
      surahNumber: 1,
      ayahs: [
        {
          number: 1,
          text: 'In the name of Allah, Most Gracious, Most Merciful',
        },
      ],
    };

    await quranCacheService.setCachedAyahs(1, corruptedData, 'quran-uthmani');
    const cached = await quranCacheService.getCachedAyahs(1, 'quran-uthmani');
    // Should reject non-Arabic text for uthmani edition
    expect(cached).toBeNull();
  });

  it('stores and retrieves word timings', async () => {
    const timings = [{ word: 'بِسْمِ', start: 0, end: 1 }];
    await quranCacheService.setCachedTimings('alafasy_128', 1, timings);
    const cached = await quranCacheService.getCachedTimings('alafasy_128', 1);
    expect(cached).toEqual(timings);
  });
});
