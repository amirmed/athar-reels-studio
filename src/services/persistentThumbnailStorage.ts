/**
 * Athar Persistent Thumbnail Storage Service (IndexedDB)
 * Stores project preview cards and generated snapshots in IndexedDB
 * to completely eliminate localStorage 5MB quota overflow issues.
 */

const DB_NAME = 'AtharThumbnailStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'project_thumbnails';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      dbPromise = null;
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = (event) => {
      const err = (event.target as IDBOpenDBRequest).error;
      console.warn('[PersistentThumbnailStorage] Failed to open IndexedDB:', err);
      dbPromise = null;
      reject(err);
    };

    request.onblocked = () => {
      console.warn('[PersistentThumbnailStorage] IndexedDB open blocked by another open connection');
      dbPromise = null;
      reject(new Error('IndexedDB open request was blocked by another tab or connection'));
    };
  });

  return dbPromise;
}

/**
 * Save project thumbnail DataURL or Image URL to IndexedDB
 */
export async function saveProjectThumbnail(projectId: string, dataUrl: string): Promise<void> {
  if (!projectId || !dataUrl) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({
        id: projectId,
        thumbnail: dataUrl,
        updatedAt: Date.now(),
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[PersistentThumbnailStorage] Error saving thumbnail:', err);
  }
}

/**
 * Get project thumbnail from IndexedDB
 */
export async function getProjectThumbnail(projectId: string): Promise<string | null> {
  if (!projectId) return null;

  try {
    const db = await openDB();
    return await new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(projectId);
      req.onsuccess = () => {
        resolve(req.result ? req.result.thumbnail : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Load all stored project thumbnails in a single high-performance batch
 */
export async function getAllProjectThumbnails(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const db = await openDB();
    return await new Promise<Map<string, string>>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as Array<{ id: string; thumbnail: string }>;
        if (results && Array.isArray(results)) {
          for (const item of results) {
            if (item.id && item.thumbnail) {
              map.set(item.id, item.thumbnail);
            }
          }
        }
        resolve(map);
      };
      req.onerror = () => resolve(map);
    });
  } catch {
    return map;
  }
}

/**
 * Delete a project thumbnail from IndexedDB
 */
export async function deleteProjectThumbnail(projectId: string): Promise<void> {
  if (!projectId) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(projectId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Ignore cleanup error
  }
}

/**
 * Delete multiple project thumbnails in a single transaction
 */
export async function deleteProjectThumbnails(projectIds: string[]): Promise<void> {
  if (!projectIds || projectIds.length === 0) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of projectIds) {
        store.delete(id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore cleanup error
  }
}

/**
 * Clear all thumbnails
 */
export async function clearAllProjectThumbnails(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}
