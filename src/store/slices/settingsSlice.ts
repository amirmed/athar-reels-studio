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
  const isLight = theme === 'light';
  const root = document.documentElement;
  const body = document.body;

  if (isLight) {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    if (body) {
      body.classList.remove('dark');
      body.classList.add('light');
      body.setAttribute('data-theme', 'light');
    }
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    if (body) {
      body.classList.remove('light');
      body.classList.add('dark');
      body.setAttribute('data-theme', 'dark');
    }
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('athar_theme', theme);
    }
  } catch (err) {
    console.debug('[SettingsSlice] localStorage theme save failed:', err);
  }
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
  } catch (err) {
    console.debug('[SettingsSlice] localStorage theme read failed:', err);
  }
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

export const createSettingsSlice: AppSlice<SettingsSlice> = (set, get) => {
  const initialTheme = getInitialTheme();
  return {
    theme: initialTheme,
    settings: { ...defaultSettings, theme: initialTheme },

    toggleTheme: () => {
      const currentTheme = get().theme;
      const next: 'dark' | 'light' = currentTheme === 'dark' ? 'light' : 'dark';
      applyThemeToDom(next);
      const updatedSettings: AppSettings = { ...get().settings, theme: next };
      set({ theme: next, settings: updatedSettings });
      get().saveSettings();
    },

    updateSettings: (updates: Partial<AppSettings>) => {
      const currentTheme = get().theme;
      const nextTheme: 'dark' | 'light' = updates.theme ?? currentTheme ?? 'dark';
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
            const loadedTheme = loaded.theme || get().theme || getInitialTheme();
            applyThemeToDom(loadedTheme);
            set({ settings: { ...defaultSettings, ...loaded, theme: loadedTheme }, theme: loadedTheme });
            return;
          }

          // First-run migration for Electron: Check localStorage if settings.json does not exist yet
          const legacyWebSettings =
            loadFromLocal<AppSettings>(STORAGE_KEY_SETTINGS) ||
            (loadFromLocal<{ state?: { settings?: AppSettings } }>('athar_app_storage')?.state?.settings);

          if (legacyWebSettings && typeof legacyWebSettings === 'object') {
            const mergedSettings: AppSettings = { ...defaultSettings, ...legacyWebSettings };
            const loadedTheme = mergedSettings.theme || get().theme || getInitialTheme();
            applyThemeToDom(loadedTheme);
            set({ settings: mergedSettings, theme: loadedTheme });
            window.electronAPI.settings.save(mergedSettings).catch(() => {});
            return;
          }
        } else {
          const local =
            loadFromLocal<AppSettings>(STORAGE_KEY_SETTINGS) ||
            (loadFromLocal<{ state?: { settings?: AppSettings } }>('athar_app_storage')?.state?.settings);
          if (local) {
            const localTheme = local.theme || get().theme || getInitialTheme();
            applyThemeToDom(localTheme);
            set({ settings: { ...defaultSettings, ...local, theme: localTheme }, theme: localTheme });
          }
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
        } else {
          saveToLocal(STORAGE_KEY_SETTINGS, settings);
        }
      } catch (e) {
        console.warn('Failed to save settings:', e);
      }
    },
  };
};
