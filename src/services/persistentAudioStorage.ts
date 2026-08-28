/**
 * Athar Persistent Audio Storage Service (IndexedDB)
 * Permanently stores user-recorded voice clips and custom audio files
 * with automated LRU eviction, quota monitoring, and orphan pruning
 * to prevent unmanaged storage accumulation and disk exhaustion.
 */

const DB_NAME = 'AtharAudioStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_recordings';

export const MAX_AUDIO_RECORDS = 50; // Max stored audio clips
export const MAX_AUDIO_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB max total audio cache
export const TARGET_STORAGE_BYTES_AFTER_EVICTION = 70 * 1024 * 1024; // 70 MB target on eviction
export const TARGET_RECORDS_AFTER_EVICTION = 35; // Target count on eviction

export interface StoredAudioRecord {
  id: string; // e.g. projectId or unique audioKey
  blob: Blob;
  mimeType: string;
  size: number;
  duration?: number;
  name?: string;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
  pinned?: boolean;
}

export interface StoredAudioMetadata {
  id: string;
  mimeType: string;
  size: number;
  duration?: number;
  name?: string;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
  pinned?: boolean;
}

export interface StorageStats {
  totalCount: number;
  totalSizeBytes: number;
  formattedSize: string;
  quotaEstimate?: {
    usage: number;
    quota: number;
    percentUsed: number;
  };
}

export interface EvictionResult {
  evictedCount: number;
  freedBytes: number;
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
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
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
 * Format bytes to human-readable string (KB / MB / GB)
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Get metadata for all stored audio records without loading binary blobs into memory
 */
export async function getAllStoredAudioMetadata(): Promise<StoredAudioMetadata[]> {
  try {
    const db = await openDB();
    return await new Promise<StoredAudioMetadata[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result as StoredAudioRecord[]) || [];
        const metadata: StoredAudioMetadata[] = records.map((r) => ({
          id: r.id,
          mimeType: r.mimeType,
          size: r.size || (r.blob ? r.blob.size : 0),
          duration: r.duration,
          name: r.name,
          createdAt: r.createdAt || Date.now(),
          updatedAt: r.updatedAt || Date.now(),
          lastAccessedAt: r.lastAccessedAt || r.updatedAt || r.createdAt || Date.now(),
          pinned: Boolean(r.pinned),
        }));
        resolve(metadata);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Get comprehensive storage usage statistics
 */
export async function getAudioStorageStats(): Promise<StorageStats> {
  const metadata = await getAllStoredAudioMetadata();
  const totalCount = metadata.length;
  const totalSizeBytes = metadata.reduce((acc, m) => acc + (m.size || 0), 0);

  let quotaEstimate: StorageStats['quotaEstimate'] | undefined = undefined;
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined && estimate.quota !== undefined && estimate.quota > 0) {
        quotaEstimate = {
          usage: estimate.usage,
          quota: estimate.quota,
          percentUsed: Math.round((estimate.usage / estimate.quota) * 100),
        };
      }
    } catch (err) {
      console.debug('[PersistentAudioStorage] Storage estimate error:', err);
    }
  }

  return {
    totalCount,
    totalSizeBytes,
    formattedSize: formatBytes(totalSizeBytes),
    quotaEstimate,
  };
}

/**
 * Evict least recently accessed audio records (LRU) when storage or count limits are exceeded.
 */
export async function evictStaleAudioRecords(options?: {
  protectedKeys?: Set<string> | string[];
  maxBytes?: number;
  maxItems?: number;
}): Promise<EvictionResult> {
  const maxBytes = options?.maxBytes ?? MAX_AUDIO_STORAGE_BYTES;
  const maxItems = options?.maxItems ?? MAX_AUDIO_RECORDS;
  const protectedSet = new Set<string>(
    options?.protectedKeys instanceof Set
      ? options.protectedKeys
      : options?.protectedKeys || []
  );

  const metadata = await getAllStoredAudioMetadata();
  const totalBytes = metadata.reduce((acc, m) => acc + (m.size || 0), 0);
  const totalCount = metadata.length;

  // If well within limits, nothing to evict
  if (totalBytes <= maxBytes && totalCount <= maxItems) {
    return { evictedCount: 0, freedBytes: 0 };
  }

  // Filter candidates: exclude pinned records and protected active keys
  const candidates = metadata
    .filter((m) => !m.pinned && !protectedSet.has(m.id))
    .sort((a, b) => (a.lastAccessedAt || 0) - (b.lastAccessedAt || 0)); // Oldest accessed first

  let currentBytes = totalBytes;
  let currentCount = totalCount;
  const keysToEvict: string[] = [];
  let freedBytes = 0;

  const targetBytes =
    options?.maxBytes !== undefined
      ? Math.floor(options.maxBytes * 0.7)
      : TARGET_STORAGE_BYTES_AFTER_EVICTION;
  const targetCount =
    options?.maxItems !== undefined
      ? Math.max(1, Math.floor(options.maxItems * 0.7))
      : TARGET_RECORDS_AFTER_EVICTION;

  for (const item of candidates) {
    if (currentBytes <= targetBytes && currentCount <= targetCount) {
      break;
    }

    keysToEvict.push(item.id);
    currentBytes -= item.size || 0;
    currentCount -= 1;
    freedBytes += item.size || 0;
  }

  if (keysToEvict.length === 0) {
    return { evictedCount: 0, freedBytes: 0 };
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      let pending = keysToEvict.length;
      let isSettled = false;

      const safeResolve = () => {
        if (!isSettled) {
          isSettled = true;
          resolve();
        }
      };

      for (const key of keysToEvict) {
        const req = store.delete(key);
        req.onsuccess = () => {
          pending--;
          if (pending <= 0) safeResolve();
        };
        req.onerror = () => {
          pending--;
          if (pending <= 0) safeResolve();
        };

        // Revoke active object URL
        const oldUrl = activeObjectUrls.get(key);
        if (oldUrl) {
          try {
            URL.revokeObjectURL(oldUrl);
          } catch (err) {
            console.debug('[PersistentAudioStorage] URL revoke error:', err);
          }
          activeObjectUrls.delete(key);
        }
      }
      tx.oncomplete = () => safeResolve();
      tx.onerror = () => reject(tx.error);
    });

    console.info(
      `[PersistentAudioStorage] LRU Eviction: removed ${keysToEvict.length} audio record(s), freed ${formatBytes(freedBytes)}.`
    );
  } catch (err) {
    console.warn('[PersistentAudioStorage] LRU Eviction failed:', err);
  }

  return { evictedCount: keysToEvict.length, freedBytes };
}

/**
 * Prunes orphan audio records that are no longer referenced by any existing project or recent draft.
 */
export async function pruneOrphanAudioRecords(
  activeProjectKeys: Set<string> | string[]
): Promise<EvictionResult> {
  const activeSet = new Set<string>(
    activeProjectKeys instanceof Set ? activeProjectKeys : activeProjectKeys
  );

  const metadata = await getAllStoredAudioMetadata();
  const now = Date.now();
  const DRAFT_MAX_AGE_MS = 48 * 60 * 60 * 1000; // Preserve voice studio draft for up to 48 hours

  const orphanKeys: string[] = [];
  let freedBytes = 0;

  for (const item of metadata) {
    if (item.pinned) continue;

    // Check if it's the active draft and recently touched
    if (item.id === 'athar_voice_studio_draft') {
      if (now - item.updatedAt < DRAFT_MAX_AGE_MS) {
        continue;
      }
    }

    // If key is not in active projects set
    if (!activeSet.has(item.id)) {
      orphanKeys.push(item.id);
      freedBytes += item.size || 0;
    }
  }

  if (orphanKeys.length === 0) {
    return { evictedCount: 0, freedBytes: 0 };
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      let pending = orphanKeys.length;
      let isSettled = false;

      const safeResolve = () => {
        if (!isSettled) {
          isSettled = true;
          resolve();
        }
      };

      for (const key of orphanKeys) {
        const req = store.delete(key);
        req.onsuccess = () => {
          pending--;
          if (pending <= 0) safeResolve();
        };
        req.onerror = () => {
          pending--;
          if (pending <= 0) safeResolve();
        };

        const oldUrl = activeObjectUrls.get(key);
        if (oldUrl) {
          try {
            URL.revokeObjectURL(oldUrl);
          } catch (err) {
            console.debug('[PersistentAudioStorage] URL revoke error:', err);
          }
          activeObjectUrls.delete(key);
        }
      }
      tx.oncomplete = () => safeResolve();
      tx.onerror = () => reject(tx.error);
    });

    console.info(
      `[PersistentAudioStorage] Orphan Prune: removed ${orphanKeys.length} orphan audio clip(s), freed ${formatBytes(freedBytes)}.`
    );
  } catch (err) {
    console.warn('[PersistentAudioStorage] Orphan prune failed:', err);
  }

  return { evictedCount: orphanKeys.length, freedBytes };
}

/**
 * Save audio Blob permanently to IndexedDB and return an active Object URL.
 * Automatically performs storage limits and LRU eviction.
 */
export async function savePersistentAudio(
  key: string,
  blobOrBuffer: Blob | ArrayBuffer,
  duration?: number,
  mimeType: string = 'audio/webm',
  name?: string,
  options?: { pinned?: boolean; protectedKeys?: Set<string> | string[] }
): Promise<string> {
  try {
    const db = await openDB();
    const blob =
      blobOrBuffer instanceof Blob ? blobOrBuffer : new Blob([blobOrBuffer], { type: mimeType });

    const now = Date.now();
    const record: StoredAudioRecord = {
      id: key,
      blob,
      mimeType: blob.type || mimeType,
      size: blob.size || 0,
      duration,
      name,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      pinned: Boolean(options?.pinned),
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

    // Trigger LRU eviction check asynchronously (non-blocking)
    const protectedKeys = new Set(
      options?.protectedKeys instanceof Set
        ? options.protectedKeys
        : options?.protectedKeys || []
    );
    protectedKeys.add(key);

    evictStaleAudioRecords({ protectedKeys }).catch((err) => {
      console.debug('[PersistentAudioStorage] Async eviction check:', err);
    });

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
 * Retrieve audio Blob from IndexedDB and touch lastAccessedAt for LRU
 */
export async function getPersistentAudioBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const record = req.result as StoredAudioRecord | undefined;
        if (record && record.blob) {
          // Touch lastAccessedAt in background
          try {
            record.lastAccessedAt = Date.now();
            store.put(record);
          } catch (touchErr) {
            console.debug('[PersistentAudioStorage] Touch lastAccessedAt error:', touchErr);
          }
          resolve(record.blob);
        } else {
          resolve(null);
        }
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

/**
 * Completely clears all audio records (e.g. factory reset or manual disk purge)
 */
export async function clearAllPersistentAudio(): Promise<void> {
  try {
    for (const url of activeObjectUrls.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.debug('[PersistentAudioStorage] URL revoke error:', err);
      }
    }
    activeObjectUrls.clear();

    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('[PersistentAudioStorage] Clear all error:', err);
  }
}
