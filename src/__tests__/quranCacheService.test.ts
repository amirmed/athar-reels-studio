import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  quranCacheService,
  formatBytes,
  StoredQuranAudioRecord,
} from '../services/quranCacheService';

describe('Quran Local Cache & LRU Eviction Service', () => {
  let ayahsStorage: Map<string, any>;
  let audioStorage: Map<string, StoredQuranAudioRecord>;
  let timingsStorage: Map<string, any>;

  beforeEach(() => {
    quranCacheService._resetForTesting();
    ayahsStorage = new Map<string, any>();
    audioStorage = new Map<string, StoredQuranAudioRecord>();
    timingsStorage = new Map<string, any>();

    const createMockStore = (storage: Map<string, any>) => ({
      put: (item: any) => {
        storage.set(item.key, item);
        const req: { onsuccess?: () => void; onerror?: () => void } = {};
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      get: (key: string) => {
        const item = storage.get(key);
        const req: { result?: any; onsuccess?: () => void; onerror?: () => void } = { result: item };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      getAll: () => {
        const items = Array.from(storage.values());
        const req: { result?: any[]; onsuccess?: () => void; onerror?: () => void } = { result: items };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      delete: (key: string) => {
        storage.delete(key);
        const req: { onsuccess?: () => void; onerror?: () => void } = {};
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      clear: () => {
        storage.clear();
        const req: { onsuccess?: () => void; onerror?: () => void } = {};
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      createIndex: () => {},
      indexNames: { contains: () => true },
    });

    const mockStores: Record<string, ReturnType<typeof createMockStore>> = {
      ayahs_data: createMockStore(ayahsStorage),
      audio_blobs: createMockStore(audioStorage),
      word_timings: createMockStore(timingsStorage),
    };

    const mockDb = {
      objectStoreNames: { contains: () => true },
      createObjectStore: (name: string) => mockStores[name] || createMockStore(new Map()),
      transaction: (storeNames: string | string[]) => {
        const primaryStore = Array.isArray(storeNames) ? storeNames[0] : storeNames;
        const tx: {
          objectStore: (name?: string) => any;
          oncomplete: (() => void) | null;
          onerror: (() => void) | null;
        } = {
          objectStore: (name?: string) => mockStores[name || primaryStore] || mockStores.ayahs_data,
          oncomplete: null,
          onerror: null,
        };
        setTimeout(() => {
          if (tx.oncomplete) tx.oncomplete();
        }, 5);
        return tx;
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

    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = vi.fn((blob: Blob) => `blob:mock-quran-audio-${blob.size}`);
    }
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = vi.fn();
    }
  });

  it('formats byte numbers cleanly into human-readable strings', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    expect(formatBytes(1024 * 1024 * 1024 * 2)).toBe('2.0 GB');
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
    const cached = (await quranCacheService.getCachedAyahs(1, 'quran-uthmani')) as {
      ayahs: Array<{ number: number; text: string }>;
    } | null;
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
    expect(cached).toBeNull();
  });

  it('stores and retrieves word timings', async () => {
    const timings = [{ word: 'بِسْمِ', start: 0, end: 1 }];
    await quranCacheService.setCachedTimings('alafasy_128', 1, timings);
    const cached = await quranCacheService.getCachedTimings('alafasy_128', 1);
    expect(cached).toEqual(timings);
  });

  it('caches audio blob, tracks size and lastAccessedAt, and retrieves blob & url', async () => {
    const dummyBlob = new Blob(['sample-quran-audio-binary-data'], { type: 'audio/mp3' });
    const audioUrl = 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3';

    await quranCacheService.cacheAudioBlob(audioUrl, dummyBlob);

    const metadata = await quranCacheService.getAllStoredAudioMetadata();
    expect(metadata.length).toBe(1);
    expect(metadata[0].key).toBe(audioUrl);
    expect(metadata[0].size).toBe(dummyBlob.size);
    expect(metadata[0].lastAccessedAt).toBeGreaterThan(0);

    const blobUrl = await quranCacheService.getCachedAudioBlobUrl(audioUrl);
    expect(blobUrl).toContain('blob:');

    const retrievedBlob = await quranCacheService.getCachedAudioBlob(audioUrl);
    expect(retrievedBlob).not.toBeNull();
    expect(retrievedBlob?.size).toBe(dummyBlob.size);
  });

  it('reports correct storage statistics for Quran audio cache', async () => {
    const blob1 = new Blob([new Uint8Array(1000)], { type: 'audio/mp3' });
    const blob2 = new Blob([new Uint8Array(2000)], { type: 'audio/mp3' });

    await quranCacheService.cacheAudioBlob('https://everyayah.com/1.mp3', blob1);
    await quranCacheService.cacheAudioBlob('https://everyayah.com/2.mp3', blob2);

    const stats = await quranCacheService.getAudioStorageStats();
    expect(stats.totalCount).toBe(2);
    expect(stats.totalSizeBytes).toBe(3000);
    expect(stats.formattedSize).toBe('2.9 KB');
  });

  it('performs LRU eviction when max items or max byte limits are exceeded', async () => {
    const now = Date.now();
    for (let i = 1; i <= 5; i++) {
      const blob = new Blob([new Uint8Array(1000)], { type: 'audio/mp3' });
      const url = `https://everyayah.com/audio_${i}.mp3`;
      await quranCacheService.cacheAudioBlob(url, blob);
      const record = audioStorage.get(url);
      if (record) {
        record.lastAccessedAt = now + i * 1000; // audio_1 oldest, audio_5 newest
      }
    }

    expect(audioStorage.size).toBe(5);

    // Evict down to maxItems = 3 (target after eviction = 2)
    const result = await quranCacheService.evictStaleAudioBlobs({
      maxItems: 3,
      maxBytes: 100000,
    });

    expect(result.evictedCount).toBeGreaterThan(0);
    // Oldest items (audio_1) should have been evicted
    expect(audioStorage.has('https://everyayah.com/audio_1.mp3')).toBe(false);
  });

  it('protects pinned and active keys during LRU eviction', async () => {
    const now = Date.now();
    for (let i = 1; i <= 4; i++) {
      const blob = new Blob([new Uint8Array(1000)], { type: 'audio/mp3' });
      const url = `https://everyayah.com/protect_${i}.mp3`;
      await quranCacheService.cacheAudioBlob(url, blob, {
        pinned: i === 1, // protect_1 is pinned
      });
      const record = audioStorage.get(url);
      if (record) {
        record.lastAccessedAt = now + i * 1000;
      }
    }

    // protect_1 is oldest accessed BUT pinned
    // protect_2 is protected by protectedKeys set
    const result = await quranCacheService.evictStaleAudioBlobs({
      protectedKeys: ['https://everyayah.com/protect_2.mp3'],
      maxItems: 2,
    });

    expect(result.evictedCount).toBeGreaterThan(0);
    expect(audioStorage.has('https://everyayah.com/protect_1.mp3')).toBe(true); // Pinned preserved
    expect(audioStorage.has('https://everyayah.com/protect_2.mp3')).toBe(true); // Protected preserved
  });

  it('deletes specific audio and clears entire cache properly', async () => {
    const blob = new Blob(['audio-data'], { type: 'audio/mp3' });
    const url = 'https://everyayah.com/del-target.mp3';

    await quranCacheService.cacheAudioBlob(url, blob);
    expect(await quranCacheService.getCachedAudioBlob(url)).not.toBeNull();

    await quranCacheService.deleteCachedAudioBlob(url);
    expect(await quranCacheService.getCachedAudioBlob(url)).toBeNull();

    await quranCacheService.cacheAudioBlob('https://everyayah.com/a.mp3', blob);
    await quranCacheService.cacheAudioBlob('https://everyayah.com/b.mp3', blob);
    expect(audioStorage.size).toBe(2);

    await quranCacheService.clearAllAudioCache();
    expect(audioStorage.size).toBe(0);
  });
});
