import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveFavoriteBackground,
  getAllFavoriteBackgrounds,
  deleteFavoriteBackground,
  isBackgroundFavorited,
  toggleFavoriteBackground,
  _resetDBPromiseForTests,
} from '../services/persistentBackgroundStorage';

describe('Persistent Background Storage Service (IndexedDB)', () => {
  beforeEach(() => {
    _resetDBPromiseForTests();
    // Setup in-memory mock IndexedDB for Node / Vitest with multi-store support
    const stores = new Map<string, Map<string, any>>();
    stores.set('favorite_backgrounds', new Map());
    stores.set('favorite_blobs', new Map());

    const getStore = (name: string) => {
      if (!stores.has(name)) {
        stores.set(name, new Map());
      }
      const storage = stores.get(name)!;

      return {
        put: (item: any) => {
          const key = item.id || item.key;
          storage.set(key, item);
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
        getAll: () => {
          const items = Array.from(storage.values());
          const req: any = { result: items };
          setTimeout(() => req.onsuccess && req.onsuccess(), 0);
          return req;
        },
        delete: (key: string) => {
          storage.delete(key);
          const req: any = {};
          setTimeout(() => req.onsuccess && req.onsuccess(), 0);
          return req;
        },
        createIndex: () => {},
      };
    };

    const mockDb = {
      objectStoreNames: { contains: () => true },
      createObjectStore: (name: string) => getStore(name),
      transaction: (storeName: string) => ({
        objectStore: () => getStore(storeName),
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

    // Mock fetch and URL.createObjectURL
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.startsWith('blob:')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['fake-image-bytes'], { type: 'image/jpeg' })),
        });
      }
      return Promise.reject(new Error('Network error'));
    });

    globalThis.URL.createObjectURL = vi.fn().mockImplementation((_blob: Blob) => {
      return `blob:http://localhost/resolved_${Math.random().toString(36).slice(2, 8)}`;
    });
  });

  it('saves and retrieves favorite backgrounds correctly', async () => {
    const saved = await saveFavoriteBackground({
      id: 'bg-fav-1',
      url: 'https://images.pexels.com/photos/12345.jpg',
      previewUrl: 'https://images.pexels.com/photos/12345_thumb.jpg',
      title: 'مسجد قباء بالمدينة',
      mediaType: 'image',
      source: 'pexels',
    });

    expect(saved.id).toBe('bg-fav-1');
    expect(saved.url).toBe('https://images.pexels.com/photos/12345.jpg');
    expect(saved.title).toBe('مسجد قباء بالمدينة');

    const all = await getAllFavoriteBackgrounds();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('bg-fav-1');
  });

  it('persists blob: URLs into raw Blob store and resolves back to active Object URLs', async () => {
    const tempBlobUrl = 'blob:http://localhost/temp-uploaded-bg-123';
    
    await saveFavoriteBackground({
      id: 'bg-upload-1',
      url: tempBlobUrl,
      title: 'خلفية مرفوعة مخصصة',
      mediaType: 'image',
    });

    // Verify raw blob was stored in favorite_blobs
    const all = await getAllFavoriteBackgrounds();
    expect(all.length).toBe(1);
    expect(all[0].title).toBe('خلفية مرفوعة مخصصة');
    expect(all[0].url.startsWith('blob:')).toBe(true);
    expect(all[0].source).toBe('upload');
  });

  it('checks if a background URL is favorited', async () => {
    await saveFavoriteBackground({
      id: 'bg-fav-2',
      url: 'https://images.pexels.com/photos/99999.jpg',
      title: 'غروب الصحراء',
      mediaType: 'image',
    });

    const isFav = await isBackgroundFavorited('https://images.pexels.com/photos/99999.jpg');
    expect(isFav).toBe(true);

    const isNotFav = await isBackgroundFavorited('https://images.pexels.com/photos/00000.jpg');
    expect(isNotFav).toBe(false);
  });

  it('deletes a favorite background by id and cleans up associated blob', async () => {
    const tempBlobUrl = 'blob:http://localhost/temp-uploaded-bg-to-delete';
    
    await saveFavoriteBackground({
      id: 'bg-fav-3',
      url: tempBlobUrl,
      title: 'طبيعة جبلية',
      mediaType: 'image',
    });

    const deleted = await deleteFavoriteBackground('bg-fav-3');
    expect(deleted).toBe(true);

    const all = await getAllFavoriteBackgrounds();
    expect(all.find((b) => b.id === 'bg-fav-3')).toBeUndefined();
  });

  it('toggles favorite background status on and off', async () => {
    const item = {
      url: 'https://images.pexels.com/photos/55555.jpg',
      title: 'الحرم المكي',
      mediaType: 'image' as const,
    };

    // First toggle: save
    const res1 = await toggleFavoriteBackground(item);
    expect(res1.favorited).toBe(true);
    expect(res1.item?.url).toBe(item.url);

    let isFav = await isBackgroundFavorited(item.url);
    expect(isFav).toBe(true);

    // Second toggle: delete
    const res2 = await toggleFavoriteBackground(item);
    expect(res2.favorited).toBe(false);

    isFav = await isBackgroundFavorited(item.url);
    expect(isFav).toBe(false);
  });
});

