/**
 * Robust, type-safe localStorage wrapper for Athar Studio state slices & cache layers
 */

/**
 * Safely loads and parses JSON data from localStorage
 */
export function loadFromLocal<T>(key: string, defaultValue: T | null = null): T | null {
  try {
    if (typeof localStorage === 'undefined') return defaultValue;
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[localStorage] Failed to load key "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Safely serializes and saves data to localStorage
 */
export function saveToLocal(key: string, data: unknown): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn(`[localStorage] Failed to save key "${key}":`, err);
    return false;
  }
}

/**
 * Safely removes a key from localStorage
 */
export function removeFromLocal(key: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn(`[localStorage] Failed to remove key "${key}":`, err);
    return false;
  }
}
