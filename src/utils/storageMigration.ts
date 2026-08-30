/**
 * Unified storage migration utility for Athar Studio state slices
 * Handles automatic discovery, validation, and migration of legacy localStorage keys to versioned storage.
 */

import { loadFromLocal, saveToLocal } from './localStorage';

export interface MigrationOptions<T> {
  primaryKey: string;
  legacyKeys: string[];
  validate?: (data: unknown) => data is T;
  zustandStoreKey?: string;
  zustandSliceKey?: string;
  autoPersistToPrimary?: boolean;
}

/**
 * Loads data from localStorage with automatic discovery and migration from legacy keys.
 * If data is discovered in an older legacy key, it is automatically persisted to the primary key.
 */
export function loadWithLegacyMigration<T>(options: MigrationOptions<T>): T | null {
  const {
    primaryKey,
    legacyKeys,
    validate = (data): data is T => data !== null && data !== undefined,
    zustandStoreKey,
    zustandSliceKey,
    autoPersistToPrimary = true,
  } = options;

  // 1. Try primary current storage key
  const primaryData = loadFromLocal<T>(primaryKey);
  if (primaryData && validate(primaryData)) {
    if (!Array.isArray(primaryData) || primaryData.length > 0) {
      return primaryData;
    }
  }

  // 2. Iterate through legacy keys in priority order
  for (const legacyKey of legacyKeys) {
    const legacyData = loadFromLocal<T>(legacyKey);
    if (legacyData && validate(legacyData)) {
      if (!Array.isArray(legacyData) || legacyData.length > 0) {
        if (autoPersistToPrimary) {
          saveToLocal(primaryKey, legacyData);
        }
        return legacyData;
      }
    }
  }

  // 3. Check legacy Zustand persistent store if specified
  if (zustandStoreKey && zustandSliceKey) {
    const rawZustand = loadFromLocal<Record<string, Record<string, unknown>>>(zustandStoreKey);
    const zustandData = rawZustand?.state?.[zustandSliceKey];
    if (zustandData && validate(zustandData)) {
      if (!Array.isArray(zustandData) || zustandData.length > 0) {
        if (autoPersistToPrimary) {
          saveToLocal(primaryKey, zustandData);
        }
        return zustandData as T;
      }
    }
  }

  return primaryData || null;
}
