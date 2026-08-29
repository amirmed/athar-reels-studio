import { ExportJob } from '../../types';
import { AppSlice, ExportSlice } from '../types';

const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;
const STORAGE_KEY_EXPORTS_V1 = 'ayahStudio_exportJobs_v1';
const LEGACY_EXPORTS_KEYS = ['ayahStudio_exportJobs', 'athar_exportJobs', 'exportJobs'];

function loadFromLocal<T>(key: string): T | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToLocal(key: string, data: unknown): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('localStorage save failed:', e);
    return false;
  }
}

export const createExportSlice: AppSlice<ExportSlice> = (set, get) => ({
  exportJobs: [],

  addExportJob: (job: ExportJob) => {
    set((state) => ({ exportJobs: [job, ...state.exportJobs] }));
    get().saveExportJobs();
  },

  updateExportJob: (id: string, updates: Partial<ExportJob>) => {
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
      } else {
        let local = loadFromLocal<ExportJob[]>(STORAGE_KEY_EXPORTS_V1);
        if (!local || local.length === 0) {
          for (const k of LEGACY_EXPORTS_KEYS) {
            const found = loadFromLocal<ExportJob[]>(k);
            if (found && Array.isArray(found) && found.length > 0) {
              local = found;
              // Migrate to v1 key
              saveToLocal(STORAGE_KEY_EXPORTS_V1, found);
              break;
            }
          }
        }
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
      } else {
        saveToLocal(STORAGE_KEY_EXPORTS_V1, exportJobs);
      }
    } catch (e) {
      console.warn('Failed to save export jobs:', e);
    }
  },
});
