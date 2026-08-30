import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadFromLocal, saveToLocal, removeFromLocal } from '../utils/localStorage';

describe('Shared localStorage Utility', () => {
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

  it('saves and loads JSON objects correctly', () => {
    const data = { theme: 'dark', quality: 'premium' };
    const saved = saveToLocal('test_key', data);
    expect(saved).toBe(true);

    const loaded = loadFromLocal<typeof data>('test_key');
    expect(loaded).toEqual(data);
  });

  it('returns default value when key does not exist', () => {
    const loaded = loadFromLocal('non_existent_key', { fallback: true });
    expect(loaded).toEqual({ fallback: true });
  });

  it('removes keys safely', () => {
    saveToLocal('remove_key', 'val');
    expect(loadFromLocal('remove_key')).toBe('val');

    const removed = removeFromLocal('remove_key');
    expect(removed).toBe(true);
    expect(loadFromLocal('remove_key')).toBeNull();
  });

  it('handles JSON parse errors gracefully without throwing', () => {
    storage['corrupted_key'] = '{ invalid: json }';
    const loaded = loadFromLocal('corrupted_key', 'safe_fallback');
    expect(loaded).toBe('safe_fallback');
  });
});
