/**
 * Athar Persistent Backgrounds & Media Storage Service (IndexedDB)
 * Stores user-favorited backgrounds, custom uploads, and AI generations
 * in IndexedDB with thumbnails and persistent Blob storage for seamless cross-project access.
 */

import { logger } from '../utils/logger';

export interface FavoriteBackground {
  id: string;
  url: string;
  previewUrl?: string;
  title: string;
  mediaType: 'image' | 'video';
  source?: 'pexels' | 'ai' | 'upload' | 'custom';
  aspectRatio?: string;
  createdAt: number;
}

const DB_NAME = 'AtharFavoriteBackgroundsDB';
const DB_VERSION = 2;
const STORE_NAME = 'favorite_backgrounds';
const STORE_BLOBS = 'favorite_blobs';

let dbPromise: Promise<IDBDatabase> | null = null;

export function _resetDBPromiseForTests(): void {
  dbPromise = null;
}

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
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('mediaType', 'mediaType', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'key' });
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
      logger.warn('[PersistentBackgroundStorage] Failed to open IndexedDB:', err);
      dbPromise = null;
      reject(err);
    };

    request.onblocked = () => {
      logger.warn('[PersistentBackgroundStorage] IndexedDB open blocked');
      dbPromise = null;
      reject(new Error('IndexedDB open request was blocked'));
    };
  });

  return dbPromise;
}

/**
 * Store a raw Blob in the favorite_blobs object store
 */
export async function putFavoriteBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, 'readwrite');
    const req = tx.objectStore(STORE_BLOBS).put({ key, blob, createdAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve a raw Blob from the favorite_blobs object store
 */
export async function getFavoriteBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(STORE_BLOBS, 'readonly');
      const req = tx.objectStore(STORE_BLOBS).get(key);
      req.onsuccess = () => resolve((req.result as { blob: Blob } | undefined)?.blob ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Delete a raw Blob from the favorite_blobs object store
 */
export async function deleteFavoriteBlob(key: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BLOBS, 'readwrite');
      const req = tx.objectStore(STORE_BLOBS).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    logger.warn('[PersistentBackgroundStorage] Error deleting blob:', e);
  }
}

/**
 * Save or update a favorite background in IndexedDB.
 * If the URL is a temporary blob: URL, the underlying Blob is fetched and stored in IndexedDB.
 */
export async function saveFavoriteBackground(
  item: Omit<FavoriteBackground, 'id' | 'createdAt'> & { id?: string; createdAt?: number }
): Promise<FavoriteBackground> {
  let storedUrl = item.url;
  let storedPreviewUrl = item.previewUrl || item.url;
  let blobKey: string | undefined;

  if (item.url.startsWith('blob:')) {
    try {
      const resp = await fetch(item.url);
      const blob = await resp.blob();
      blobKey = `favblob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await putFavoriteBlob(blobKey, blob);
      storedUrl = `idb-blob:${blobKey}`;
      if (storedPreviewUrl.startsWith('blob:')) {
        storedPreviewUrl = `idb-blob:${blobKey}`;
      }
    } catch (e) {
      logger.warn('[PersistentBackgroundStorage] Failed to persist blob URL:', e);
    }
  }

  const fullItem: FavoriteBackground = {
    id: item.id || `fav_bg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    url: storedUrl,
    previewUrl: storedPreviewUrl,
    title: item.title || (item.mediaType === 'video' ? 'فيديو سينمائي' : 'خلفية سينمائية'),
    mediaType: item.mediaType || 'image',
    source: item.source || (blobKey ? 'upload' : 'custom'),
    aspectRatio: item.aspectRatio,
    createdAt: item.createdAt || Date.now(),
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fullItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    logger.warn('[PersistentBackgroundStorage] Error saving favorite background:', err);
  }

  return {
    ...fullItem,
    url: item.url,
    previewUrl: item.previewUrl || item.url,
  };
}

/**
 * Get all favorite backgrounds sorted by newest first,
 * with any idb-blob: references resolved into active live Object URLs.
 */
export async function getAllFavoriteBackgrounds(): Promise<FavoriteBackground[]> {
  try {
    const db = await openDB();
    const rawItems = await new Promise<FavoriteBackground[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result as FavoriteBackground[]) || [];
        resolve(results);
      };
      req.onerror = () => resolve([]);
    });

    const resolvedItems: FavoriteBackground[] = [];
    for (const raw of rawItems) {
      const item = { ...raw };
      if (item.url.startsWith('idb-blob:')) {
        const key = item.url.slice('idb-blob:'.length);
        const blob = await getFavoriteBlob(key);
        if (blob) {
          const activeUrl = URL.createObjectURL(blob);
          item.url = activeUrl;
          if (item.previewUrl?.startsWith('idb-blob:')) {
            item.previewUrl = activeUrl;
          }
        }
      }
      resolvedItems.push(item);
    }

    resolvedItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return resolvedItems;
  } catch {
    return [];
  }
}

/**
 * Delete a favorite background by ID, cleaning up any associated blob in STORE_BLOBS
 */
export async function deleteFavoriteBackground(id: string): Promise<boolean> {
  if (!id) return false;

  try {
    const db = await openDB();
    const itemToDelete = await new Promise<FavoriteBackground | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve((req.result as FavoriteBackground) || null);
      req.onerror = () => resolve(null);
    });

    if (itemToDelete?.url?.startsWith('idb-blob:')) {
      const key = itemToDelete.url.slice('idb-blob:'.length);
      await deleteFavoriteBlob(key);
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return true;
  } catch (err) {
    logger.warn('[PersistentBackgroundStorage] Error deleting favorite background:', err);
    return false;
  }
}

/**
 * Check if a specific URL is already in favorites
 */
export async function isBackgroundFavorited(url: string): Promise<boolean> {
  if (!url) return false;

  try {
    const all = await getAllFavoriteBackgrounds();
    return all.some((item) => item.url === url || item.previewUrl === url);
  } catch {
    return false;
  }
}

/**
 * Toggle favorite status: if already favorited, remove it; if not, save it.
 */
export async function toggleFavoriteBackground(
  item: Omit<FavoriteBackground, 'id' | 'createdAt'>
): Promise<{ favorited: boolean; item?: FavoriteBackground }> {
  try {
    const all = await getAllFavoriteBackgrounds();
    const existing = all.find((f) => f.url === item.url || (item.previewUrl && f.previewUrl === item.previewUrl));

    if (existing) {
      await deleteFavoriteBackground(existing.id);
      return { favorited: false };
    } else {
      const saved = await saveFavoriteBackground(item);
      return { favorited: true, item: saved };
    }
  } catch (err) {
    logger.warn('[PersistentBackgroundStorage] Error toggling favorite:', err);
    return { favorited: false };
  }
}

