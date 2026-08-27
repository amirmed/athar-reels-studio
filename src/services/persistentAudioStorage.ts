/**
 * Athar Persistent Audio Storage Service (IndexedDB)
 * Permanently stores user-recorded voice clips and custom audio files
 * so they survive page reloads (F5), app restarts, and browser re-launches.
 */

const DB_NAME = 'AtharAudioStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_recordings';

interface StoredAudioRecord {
  id: string; // e.g. projectId or unique audioId
  blob: Blob;
  mimeType: string;
  duration?: number;
  name?: string;
  createdAt: number;
  updatedAt: number;
}

// In-memory active object URLs cache
const activeObjectUrls = new Map<string, string>();

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      dbPromise = null;
      reject(new Error('IndexedDB not supported in this environment'));
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
      console.error('[PersistentAudioStorage] Failed to open IndexedDB:', err);
      dbPromise = null; // Reset promise on rejection so subsequent calls can retry
      reject(err);
    };

    request.onblocked = () => {
      console.warn('[PersistentAudioStorage] IndexedDB open blocked');
      dbPromise = null;
    };
  });

  return dbPromise;
}

/**
 * Save audio Blob permanently to IndexedDB and return an active Object URL
 */
export async function savePersistentAudio(
  key: string,
  blobOrBuffer: Blob | ArrayBuffer,
  duration?: number,
  mimeType: string = 'audio/webm',
  name?: string
): Promise<string> {
  try {
    const db = await openDB();
    const blob =
      blobOrBuffer instanceof Blob ? blobOrBuffer : new Blob([blobOrBuffer], { type: mimeType });

    const record: StoredAudioRecord = {
      id: key,
      blob,
      mimeType: blob.type || mimeType,
      duration,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Revoke previous object URL if any
    const oldUrl = activeObjectUrls.get(key);
    if (oldUrl && oldUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(oldUrl);
      } catch (err) {
        console.debug('[PersistentAudioStorage] URL revoke error:', err);
      }
    }

    const newUrl = URL.createObjectURL(blob);
    activeObjectUrls.set(key, newUrl);
    return newUrl;
  } catch (err) {
    console.error('[PersistentAudioStorage] Save error:', err);
    // Fallback: Return in-memory URL
    const blob =
      blobOrBuffer instanceof Blob ? blobOrBuffer : new Blob([blobOrBuffer], { type: mimeType });
    const fallbackUrl = URL.createObjectURL(blob);
    activeObjectUrls.set(key, fallbackUrl);
    return fallbackUrl;
  }
}

/**
 * Retrieve audio Blob from IndexedDB
 */
export async function getPersistentAudioBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const record = req.result as StoredAudioRecord | undefined;
        resolve(record ? record.blob : null);
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Get or regenerate a valid Object URL from IndexedDB
 */
export async function getPersistentAudioUrl(key: string): Promise<string | null> {
  // Check if we already have an active URL in memory
  if (activeObjectUrls.has(key)) {
    const cachedUrl = activeObjectUrls.get(key)!;
    // Quickly check if cached URL is still responsive
    try {
      const res = await fetch(cachedUrl, { method: 'HEAD' });
      if (res.ok) return cachedUrl;
    } catch (err) {
      console.debug('[PersistentAudioStorage] Cached URL test error:', err);
    }
  }

  const blob = await getPersistentAudioBlob(key);
  if (!blob) return null;

  const newUrl = URL.createObjectURL(blob);
  activeObjectUrls.set(key, newUrl);
  return newUrl;
}

/**
 * Ensures an audio URL is valid. If it's a stale blob or missing, attempts to restore from IndexedDB.
 */
export async function resolveValidAudioUrl(
  currentUrl?: string,
  projectId?: string,
  customAudioKey?: string
): Promise<string | undefined> {
  // 1. If it's a remote URL (http/https/data:), it's always valid
  if (
    currentUrl &&
    (currentUrl.startsWith('http://') ||
      currentUrl.startsWith('https://') ||
      currentUrl.startsWith('data:') ||
      currentUrl.startsWith('/api/'))
  ) {
    return currentUrl;
  }

  // 2. If it's an existing blob URL, test if it is still live
  if (currentUrl && currentUrl.startsWith('blob:')) {
    try {
      const testRes = await fetch(currentUrl, { method: 'HEAD' });
      if (testRes.ok) {
        return currentUrl;
      }
    } catch (err) {
      console.debug('[PersistentAudioStorage] Blob verification failed:', err);
      // Blob is stale/dead -> needs restoration from IndexedDB!
    }
  }

  // 3. Try to restore from IndexedDB using candidate keys
  const candidateKeys = [customAudioKey, projectId, currentUrl].filter(Boolean) as string[];

  for (const key of candidateKeys) {
    const restoredUrl = await getPersistentAudioUrl(key);
    if (restoredUrl) {
      return restoredUrl;
    }
  }

  return currentUrl;
}

/**
 * Delete audio record from IndexedDB (e.g. when user deletes project or recording)
 */
export async function deletePersistentAudio(key: string): Promise<void> {
  try {
    const oldUrl = activeObjectUrls.get(key);
    if (oldUrl) {
      try {
        URL.revokeObjectURL(oldUrl);
      } catch (err) {
        console.debug('[PersistentAudioStorage] URL revoke error:', err);
      }
      activeObjectUrls.delete(key);
    }

    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn(`[PersistentAudioStorage] Delete error for key ${key}:`, err);
  }
}
