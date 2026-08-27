import { AppSettings } from '../../types';
import { AppSlice, SettingsSlice } from '../types';

export const defaultSettings: AppSettings = {
  language: 'ar',
  theme: 'dark',
  projectsPath: '',
  defaultExportQuality: 'high',
  defaultAspectRatio: '9:16',
  performanceMode: 'balanced',
  autoSave: true,
  autoSaveInterval: 5,
};

const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;
const STORAGE_KEY_SETTINGS = 'ayahStudio_settings';

export function applyThemeToDom(theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('athar_theme', theme);
    }
  } catch {}
}

export const getInitialTheme = (): 'dark' | 'light' => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('athar_theme');
      if (saved === 'light' || saved === 'dark') {
        applyThemeToDom(saved);
        return saved;
      }
    }
  } catch {}
  applyThemeToDom('dark');
  return 'dark';
};

function loadFromLocal<T>(key: string): T | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToLocal(key: string, data: unknown) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

export const createSettingsSlice: AppSlice<SettingsSlice> = (set, get) => ({
  theme: getInitialTheme(),
  settings: defaultSettings,

  toggleTheme: () => {
    const next: 'dark' | 'light' = get().theme === 'dark' ? 'light' : 'dark';
    applyThemeToDom(next);
    const updatedSettings: AppSettings = { ...get().settings, theme: next };
    set({ theme: next, settings: updatedSettings });
    get().saveSettings();
  },

  updateSettings: (updates: Partial<AppSettings>) => {
    const nextTheme: 'dark' | 'light' = updates.theme || get().settings.theme || 'dark';
    const nextSettings: AppSettings = { ...get().settings, ...updates, theme: nextTheme };
    if (updates.theme) {
      applyThemeToDom(updates.theme);
    }
    set({ settings: nextSettings, theme: nextTheme });
    get().saveSettings();
  },

  loadSettings: async () => {
    try {
      if (isElectron() && window.electronAPI?.settings) {
        const loaded = await window.electronAPI.settings.load();
        if (loaded && Object.keys(loaded).length > 0) {
          const loadedTheme = loaded.theme || getInitialTheme();
          applyThemeToDom(loadedTheme);
          set({ settings: { ...defaultSettings, ...loaded }, theme: loadedTheme });
          return;
        }
      }
      const local = loadFromLocal<AppSettings>(STORAGE_KEY_SETTINGS);
      if (local) {
        const localTheme = local.theme || getInitialTheme();
        applyThemeToDom(localTheme);
        set({ settings: { ...defaultSettings, ...local }, theme: localTheme });
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  },

  saveSettings: async () => {
    try {
      const { settings } = get();
      if (isElectron() && window.electronAPI?.settings) {
        await window.electronAPI.settings.save(settings);
      }
      saveToLocal(STORAGE_KEY_SETTINGS, settings);
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  },
});
