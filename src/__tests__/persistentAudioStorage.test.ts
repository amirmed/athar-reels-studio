import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  savePersistentAudio,
  getPersistentAudioBlob,
  getPersistentAudioUrl,
  getAllStoredAudioMetadata,
  getAudioStorageStats,
  evictStaleAudioRecords,
  pruneOrphanAudioRecords,
  deletePersistentAudio,
  clearAllPersistentAudio,
  formatBytes,
  StoredAudioRecord,
} from '../services/persistentAudioStorage';

describe('Persistent Audio Storage & LRU Eviction Service', () => {
  let storage: Map<string, StoredAudioRecord>;

  beforeEach(() => {
    storage = new Map<string, StoredAudioRecord>();

    const mockStore = {
      put: (item: StoredAudioRecord) => {
        storage.set(item.id, item);
        const req: { onsuccess?: () => void; onerror?: () => void } = {};
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      get: (id: string) => {
        const item = storage.get(id);
        const req: { result?: StoredAudioRecord; onsuccess?: () => void; onerror?: () => void } = { result: item };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      getAll: () => {
        const items = Array.from(storage.values());
        const req: { result?: StoredAudioRecord[]; onsuccess?: () => void; onerror?: () => void } = { result: items };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      delete: (id: string) => {
        storage.delete(id);
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
    };

    const mockDb = {
      objectStoreNames: { contains: () => true },
      createObjectStore: () => mockStore,
      transaction: () => {
        const tx: {
          objectStore: () => typeof mockStore;
          oncomplete: (() => void) | null;
          onerror: (() => void) | null;
        } = {
          objectStore: () => mockStore,
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

    (globalThis as unknown as { window: unknown }).window =
      (globalThis as unknown as { window: unknown }).window || globalThis;

    (globalThis as unknown as { window: { indexedDB: unknown } }).window.indexedDB = {
      open: () => {
        const req: { result: typeof mockDb; onsuccess?: (e: unknown) => void } = { result: mockDb };
        setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
        return req;
      },
    };

    // Mock URL.createObjectURL and revokeObjectURL
    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = vi.fn((blob: Blob) => `blob:mock-audio-url-${blob.size}`);
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

  it('saves audio blob, computes size, and retrieves with lastAccessedAt tracking', async () => {
    const dummyBlob = new Blob(['sample-audio-data-payload'], { type: 'audio/webm' });
    const url = await savePersistentAudio('rec-test-1', dummyBlob, 12.5, 'audio/webm', 'My Recording');

    expect(url).toContain('blob:');

    const metadata = await getAllStoredAudioMetadata();
    expect(metadata.length).toBe(1);
    expect(metadata[0].id).toBe('rec-test-1');
    expect(metadata[0].size).toBe(dummyBlob.size);
    expect(metadata[0].duration).toBe(12.5);
    expect(metadata[0].name).toBe('My Recording');
    expect(metadata[0].lastAccessedAt).toBeGreaterThan(0);

    const retrievedBlob = await getPersistentAudioBlob('rec-test-1');
    expect(retrievedBlob).not.toBeNull();
    expect(retrievedBlob?.size).toBe(dummyBlob.size);
  });

  it('reports correct storage statistics and total sizes', async () => {
    const blob1 = new Blob([new Uint8Array(1000)], { type: 'audio/webm' });
    const blob2 = new Blob([new Uint8Array(2000)], { type: 'audio/webm' });

    await savePersistentAudio('rec-1', blob1);
    await savePersistentAudio('rec-2', blob2);

    const stats = await getAudioStorageStats();
    expect(stats.totalCount).toBe(2);
    expect(stats.totalSizeBytes).toBe(3000);
    expect(stats.formattedSize).toBe('2.9 KB');
  });

  it('performs LRU eviction when max items or max byte limits are exceeded', async () => {
    // Save 5 items with staggered access times
    const now = Date.now();
    for (let i = 1; i <= 5; i++) {
      const blob = new Blob([new Uint8Array(1000)], { type: 'audio/webm' });
      await savePersistentAudio(`item-${i}`, blob);
      const record = storage.get(`item-${i}`);
      if (record) {
        record.lastAccessedAt = now + i * 1000; // item-1 oldest, item-5 newest
      }
    }

    expect(storage.size).toBe(5);

    // Evict down to maxItems = 3 (target after eviction = 2)
    const result = await evictStaleAudioRecords({
      maxItems: 3,
      maxBytes: 100000,
    });

    expect(result.evictedCount).toBeGreaterThan(0);
    // Oldest items (item-1, item-2) should have been evicted
    expect(storage.has('item-1')).toBe(false);
  });

  it('protects pinned and active keys during LRU eviction', async () => {
    const now = Date.now();
    for (let i = 1; i <= 4; i++) {
      const blob = new Blob([new Uint8Array(1000)], { type: 'audio/webm' });
      await savePersistentAudio(`item-${i}`, blob, undefined, 'audio/webm', undefined, {
        pinned: i === 1, // item-1 is pinned
      });
      const record = storage.get(`item-${i}`);
      if (record) {
        record.lastAccessedAt = now + i * 1000;
      }
    }

    // item-1 is oldest accessed BUT pinned
    // item-2 is protected by protectedKeys set
    const result = await evictStaleAudioRecords({
      protectedKeys: ['item-2'],
      maxItems: 2,
    });

    expect(result.evictedCount).toBeGreaterThan(0);
    expect(storage.has('item-1')).toBe(true); // Pinned preserved
    expect(storage.has('item-2')).toBe(true); // Protected key preserved
  });

  it('prunes orphan audio records not present in active projects', async () => {
    const blob = new Blob([new Uint8Array(500)], { type: 'audio/webm' });
    await savePersistentAudio('proj-active-1', blob);
    await savePersistentAudio('proj-active-2', blob);
    await savePersistentAudio('orphan-recording-old', blob);

    const activeProjectKeys = ['proj-active-1', 'proj-active-2'];
    const res = await pruneOrphanAudioRecords(activeProjectKeys);

    expect(res.evictedCount).toBe(1);
    expect(storage.has('orphan-recording-old')).toBe(false);
    expect(storage.has('proj-active-1')).toBe(true);
    expect(storage.has('proj-active-2')).toBe(true);
  });

  it('deletes and clears persistent audio correctly', async () => {
    const blob = new Blob(['data'], { type: 'audio/webm' });
    await savePersistentAudio('del-target', blob);
    expect(await getPersistentAudioUrl('del-target')).not.toBeNull();

    await deletePersistentAudio('del-target');
    expect(await getPersistentAudioBlob('del-target')).toBeNull();

    await savePersistentAudio('multi-1', blob);
    await savePersistentAudio('multi-2', blob);
    expect(storage.size).toBe(2);

    await clearAllPersistentAudio();
    expect(storage.size).toBe(0);
  });
});
