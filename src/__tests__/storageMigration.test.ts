import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadWithLegacyMigration } from '../utils/storageMigration';

describe('Storage Migration Utility (loadWithLegacyMigration)', () => {
  const originalLocalStorage = (globalThis as any).localStorage;
  let storage: Record<string, string> = {};

  beforeEach(() => {
    storage = {};
    (globalThis as any).localStorage = {
      getItem: vi.fn((k: string) => storage[k] || null),
      setItem: vi.fn((k: string, v: string) => {
        storage[k] = v;
      }),
      removeItem: vi.fn((k: string) => {
        delete storage[k];
      }),
    };
  });

  afterEach(() => {
    (globalThis as any).localStorage = originalLocalStorage;
  });

  it('loads directly from primary key when present and valid', () => {
    storage['primary_v1'] = JSON.stringify([{ id: '1', name: 'Project 1' }]);
    storage['legacy_key'] = JSON.stringify([{ id: 'old', name: 'Old' }]);

    const result = loadWithLegacyMigration<{ id: string; name: string }[]>({
      primaryKey: 'primary_v1',
      legacyKeys: ['legacy_key'],
    });

    expect(result).toEqual([{ id: '1', name: 'Project 1' }]);
  });

  it('discovers data in legacy keys and automatically migrates to primary key', () => {
    storage['legacy_v0'] = JSON.stringify([{ id: 'migrated_1' }]);

    const result = loadWithLegacyMigration<{ id: string }[]>({
      primaryKey: 'primary_v1',
      legacyKeys: ['older_key', 'legacy_v0'],
    });

    expect(result).toEqual([{ id: 'migrated_1' }]);
    expect(storage['primary_v1']).toBe(JSON.stringify([{ id: 'migrated_1' }]));
  });

  it('discovers settings stored inside legacy Zustand persistent storage and migrates them', () => {
    storage['athar_app_storage'] = JSON.stringify({
      state: {
        settings: { theme: 'light', language: 'fr' },
      },
    });

    const result = loadWithLegacyMigration<{ theme: string; language: string }>({
      primaryKey: 'settings_v1',
      legacyKeys: ['old_settings'],
      zustandStoreKey: 'athar_app_storage',
      zustandSliceKey: 'settings',
      validate: (d): d is { theme: string; language: string } => typeof d === 'object' && d !== null,
    });

    expect(result).toEqual({ theme: 'light', language: 'fr' });
    expect(storage['settings_v1']).toBe(JSON.stringify({ theme: 'light', language: 'fr' }));
  });

  it('respects autoPersistToPrimary = false when migrating into in-memory/Electron disk staging', () => {
    storage['legacy_projects'] = JSON.stringify([{ id: 'p1' }]);

    const result = loadWithLegacyMigration<{ id: string }[]>({
      primaryKey: 'primary_v1',
      legacyKeys: ['legacy_projects'],
      autoPersistToPrimary: false,
    });

    expect(result).toEqual([{ id: 'p1' }]);
    expect(storage['primary_v1']).toBeUndefined();
  });

  it('returns null when no primary or legacy keys match', () => {
    const result = loadWithLegacyMigration<unknown>({
      primaryKey: 'empty_primary',
      legacyKeys: ['empty_legacy_1', 'empty_legacy_2'],
    });

    expect(result).toBeNull();
  });
});
