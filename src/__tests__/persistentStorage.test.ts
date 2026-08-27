import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveProjectThumbnail,
  getProjectThumbnail,
  deleteProjectThumbnail,
  getAllProjectThumbnails,
} from '../services/persistentThumbnailStorage';

describe('Persistent Storage Service (IndexedDB)', () => {
  beforeEach(() => {
    // Setup in-memory mock IndexedDB for Node / Vitest
    const storage = new Map<string, any>();

    const mockStore = {
      put: (item: any) => {
        storage.set(item.id, item);
        const req: any = {};
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      get: (id: string) => {
        const item = storage.get(id);
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
      delete: (id: string) => {
        storage.delete(id);
        const req: any = {};
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

  it('saves, retrieves, and lists project thumbnails', async () => {
    await saveProjectThumbnail('proj-1', 'data:image/png;base64,test1');
    await saveProjectThumbnail('proj-2', 'data:image/png;base64,test2');

    const thumb1 = await getProjectThumbnail('proj-1');
    expect(thumb1).toBe('data:image/png;base64,test1');

    const allThumbs = await getAllProjectThumbnails();
    expect(allThumbs.get('proj-1')).toBe('data:image/png;base64,test1');
    expect(allThumbs.get('proj-2')).toBe('data:image/png;base64,test2');
  });

  it('deletes project thumbnail from storage', async () => {
    await saveProjectThumbnail('proj-del', 'data:image/png;base64,todelete');
    expect(await getProjectThumbnail('proj-del')).toBe('data:image/png;base64,todelete');

    await deleteProjectThumbnail('proj-del');
    const thumbAfter = await getProjectThumbnail('proj-del');
    expect(thumbAfter).toBeNull();
  });
});
