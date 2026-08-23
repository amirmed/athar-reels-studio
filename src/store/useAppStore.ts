import { create } from 'zustand';
import { Page, Project, AppSettings, ExportJob, QuoteCardSettings } from '../types';
import { deletePersistentAudio } from '../services/persistentAudioStorage';
import {
  saveProjectThumbnail,
  getAllProjectThumbnails,
  deleteProjectThumbnail,
  deleteProjectThumbnails,
  clearAllProjectThumbnails,
} from '../services/persistentThumbnailStorage';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface AppState {
  // Navigation & Modals
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeModal: string | null;
  modalData: any;
  openModal: (name: string, data?: any) => void;
  closeModal: () => void;

  // Quotes
  activeQuoteDraft: Partial<QuoteCardSettings> | null;
  setActiveQuoteDraft: (draft: Partial<QuoteCardSettings> | null) => void;

  // Projects
  projects: Project[];
  currentProject: Project | null;
  isLoadingProjects: boolean;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  deleteProjects: (ids: string[]) => void;
  deleteAllProjects: () => void;
  duplicateProject: (id: string) => void;
  loadProjects: () => Promise<void>;
  saveProjects: () => Promise<void>;

  // Settings & Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;

  // Export
  exportJobs: ExportJob[];
  addExportJob: (job: ExportJob) => void;
  updateExportJob: (id: string, updates: Partial<ExportJob>) => void;
  loadExportJobs: () => Promise<void>;
  saveExportJobs: () => Promise<void>;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Interactive Tour Guide
  isTourActive: boolean;
  tourStep: number;
  startTour: () => void;
  stopTour: () => void;
  setTourStep: (step: number) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;

  // App initialization
  initialized: boolean;
  initializeApp: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  language: 'ar',
  theme: 'dark',
  projectsPath: '',
  defaultExportQuality: 'high',
  defaultAspectRatio: '9:16',
  performanceMode: 'balanced',
  autoSave: true,
  autoSaveInterval: 5,
};

const isElectron = () => typeof window !== 'undefined' && !!(window as any).electronAPI;

const STORAGE_KEYS = {
  projects: 'ayahStudio_projects',
  exportJobs: 'ayahStudio_exportJobs',
  settings: 'ayahStudio_settings',
};

function saveToLocal(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

function loadFromLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function applyThemeToDom(theme: 'dark' | 'light') {
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
}

const getInitialTheme = (): 'dark' | 'light' => {
  try {
    const saved = localStorage.getItem('athar_theme');
    if (saved === 'light' || saved === 'dark') {
      applyThemeToDom(saved);
      return saved;
    }
  } catch {}
  applyThemeToDom('dark');
  return 'dark';
};

function generateUniqueId(prefix = 'id'): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

const getInitialPage = (): Page => {
  try {
    const hasOnboarded = localStorage.getItem('athar_has_onboarded');
    return hasOnboarded === 'true' ? 'dashboard' : 'welcome';
  } catch {
    return 'welcome';
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: getInitialPage(),
  setCurrentPage: (page) => set({ currentPage: page }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  activeModal: null,
  modalData: null,
  openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Quotes
  activeQuoteDraft: null,
  setActiveQuoteDraft: (draft) => set({ activeQuoteDraft: draft }),

  // Projects
  projects: [],
  currentProject: null,
  isLoadingProjects: false,

  setCurrentProject: (project) => set({ currentProject: project }),

  addProject: (project) => {
    set((state) => ({
      projects: [project, ...state.projects],
      currentProject: project,
    }));
    get().saveProjects();
  },

  updateProject: (id, updates) => {
    set((state) => {
      const updated = state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      const cur =
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates, updatedAt: new Date().toISOString() }
          : state.currentProject;
      return { projects: updated, currentProject: cur };
    });
    get().saveProjects();
  },

  deleteProject: (id) => {
    deletePersistentAudio(id).catch(() => {});
    deleteProjectThumbnail(id).catch(() => {});
    if (window.electronAPI?.projects?.delete) {
      window.electronAPI.projects.delete(id).catch(() => {});
    }
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
    get().saveProjects();
  },

  deleteProjects: (ids) => {
    deleteProjectThumbnails(ids).catch(() => {});
    ids.forEach((id) => {
      deletePersistentAudio(id).catch(() => {});
      if (window.electronAPI?.projects?.delete) {
        window.electronAPI.projects.delete(id).catch(() => {});
      }
    });
    set((state) => ({
      projects: state.projects.filter((p) => !ids.includes(p.id)),
      currentProject:
        state.currentProject && ids.includes(state.currentProject.id) ? null : state.currentProject,
    }));
    get().saveProjects();
  },

  deleteAllProjects: () => {
    clearAllProjectThumbnails().catch(() => {});
    get().projects.forEach((p) => deletePersistentAudio(p.id).catch(() => {}));
    if (window.electronAPI?.projects?.deleteAll) {
      window.electronAPI.projects.deleteAll().catch(() => {});
    } else {
      get().projects.forEach((p) => {
        if (window.electronAPI?.projects?.delete) {
          window.electronAPI.projects.delete(p.id).catch(() => {});
        }
      });
    }
    set({ projects: [], currentProject: null });
    get().saveProjects();
  },

  duplicateProject: (id) => {
    const target = get().projects.find((p) => p.id === id);
    if (!target) return;
    const duplicated: Project = {
      ...JSON.parse(JSON.stringify(target)),
      id: generateUniqueId('proj'),
      name: `${target.name} (نسخة)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      projects: [duplicated, ...state.projects],
      currentProject: duplicated,
    }));
    get().saveProjects();
  },

  loadProjects: async () => {
    set({ isLoadingProjects: true });
    try {
      let baseProjects: Project[] = [];
      if (isElectron() && window.electronAPI?.projects) {
        const loaded = await window.electronAPI.projects.loadAll();
        if (Array.isArray(loaded)) {
          baseProjects = loaded;
        }
      }
      if (baseProjects.length === 0) {
        const local = loadFromLocal<Project[]>(STORAGE_KEYS.projects);
        baseProjects = local || [];
      }

      // Fast async hydration of thumbnails from IndexedDB
      try {
        const thumbnailsMap = await getAllProjectThumbnails();
        const hydratedProjects = baseProjects.map((p) => {
          if (!p.thumbnail && thumbnailsMap.has(p.id)) {
            return { ...p, thumbnail: thumbnailsMap.get(p.id) };
          }
          return p;
        });
        set({ projects: hydratedProjects, isLoadingProjects: false });
      } catch {
        set({ projects: baseProjects, isLoadingProjects: false });
      }
    } catch (e) {
      console.warn('Failed to load projects:', e);
      set({ isLoadingProjects: false });
    }
  },

  saveProjects: async () => {
    try {
      const { projects } = get();

      // 1. Offload heavy base64 data URLs to IndexedDB
      projects.forEach((p) => {
        if (p.thumbnail && p.thumbnail.startsWith('data:image/')) {
          saveProjectThumbnail(p.id, p.thumbnail).catch(() => {});
        }
      });

      // 2. Sanitize projects for localStorage (strip heavy base64 strings to preserve 5MB quota)
      const sanitizedProjects = projects.map((p) => {
        if (p.thumbnail && p.thumbnail.startsWith('data:image/')) {
          const { thumbnail, ...rest } = p;
          return rest;
        }
        return p;
      });

      if (isElectron() && window.electronAPI?.projects) {
        await window.electronAPI.projects.saveAll(projects);
      }
      saveToLocal(STORAGE_KEYS.projects, sanitizedProjects);
    } catch (e) {
      console.warn('Failed to save projects:', e);
    }
  },

  // Settings & Theme
  theme: getInitialTheme(),
  settings: defaultSettings,

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('athar_theme', next);
    } catch {}
    applyThemeToDom(next);
    set({ theme: next });
    get().updateSettings({ theme: next });
  },

  updateSettings: (updates) => {
    const next = { ...get().settings, ...updates };
    if (updates.theme) {
      try {
        localStorage.setItem('athar_theme', updates.theme);
      } catch {}
      applyThemeToDom(updates.theme);
    }
    set({ settings: next, theme: next.theme || 'dark' });
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
      const local = loadFromLocal<AppSettings>(STORAGE_KEYS.settings);
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
      saveToLocal(STORAGE_KEYS.settings, settings);
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  },

  // Exports
  exportJobs: [],

  addExportJob: (job) => {
    set((state) => ({ exportJobs: [job, ...state.exportJobs] }));
    get().saveExportJobs();
  },

  updateExportJob: (id, updates) => {
    set((state) => ({
      exportJobs: state.exportJobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    }));
    get().saveExportJobs();
  },

  loadExportJobs: async () => {
    try {
      let rawJobs: ExportJob[] = [];
      if (isElectron() && window.electronAPI?.exports) {
        const loaded = await window.electronAPI.exports.loadAll();
        if (Array.isArray(loaded)) {
          rawJobs = loaded;
        }
      }
      if (rawJobs.length === 0) {
        const local = loadFromLocal<ExportJob[]>(STORAGE_KEYS.exportJobs);
        if (local && Array.isArray(local)) {
          rawJobs = local;
        }
      }

      // 🧹 Sanitize stuck / zombie jobs from interrupted previous sessions
      let hasChanges = false;
      const sanitizedJobs = rawJobs.map((job) => {
        if (job.status === 'processing' || job.status === 'pending') {
          hasChanges = true;
          return {
            ...job,
            status: 'failed' as const,
            error: 'توقف التصدير بسبب إغلاق غير متوقع للتطبيق أثناء المعالجة',
          };
        }
        return job;
      });

      set({ exportJobs: sanitizedJobs });
      if (hasChanges) {
        get().saveExportJobs();
      }
    } catch (e) {
      console.warn('Failed to load export jobs:', e);
    }
  },

  saveExportJobs: async () => {
    try {
      const { exportJobs } = get();
      if (isElectron() && window.electronAPI?.exports) {
        await window.electronAPI.exports.save(exportJobs);
      }
      saveToLocal(STORAGE_KEYS.exportJobs, exportJobs);
    } catch (e) {
      console.warn('Failed to save export jobs:', e);
    }
  },

  // Toasts with strict duplicate protection
  toasts: [],
  addToast: (toast) => {
    // Prevent duplicate toast if one with identical message is already visible
    const existing = get().toasts.find((t) => t.message === toast.message);
    if (existing) return;

    const id = generateUniqueId('toast');
    const newToast: Toast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    const dur = toast.duration || 4000;
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, dur);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  // Interactive Tour Guide
  isTourActive: false,
  tourStep: 0,
  startTour: () => set({ isTourActive: true, tourStep: 0, currentPage: 'dashboard' }),
  stopTour: () => set({ isTourActive: false, tourStep: 0 }),
  setTourStep: (step) => set({ tourStep: step }),
  nextTourStep: () => set((state) => ({ tourStep: state.tourStep + 1 })),
  prevTourStep: () => set((state) => ({ tourStep: Math.max(0, state.tourStep - 1) })),

  // App Initializer
  initialized: false,
  initializeApp: async () => {
    if (get().initialized) return;
    set({ initialized: true });
    await Promise.all([get().loadSettings(), get().loadProjects(), get().loadExportJobs()]);
  },
}));
