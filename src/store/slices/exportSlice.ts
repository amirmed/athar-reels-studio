import { ExportJob } from '../../types';
import { AppSlice, ExportSlice } from '../types';
import { saveToLocal } from '../../utils/localStorage';
import { loadWithLegacyMigration } from '../../utils/storageMigration';
import { logger } from '../../utils/logger';

const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;
const STORAGE_KEY_EXPORTS_V1 = 'ayahStudio_exportJobs_v1';
const LEGACY_EXPORTS_KEYS = ['ayahStudio_exportJobs', 'athar_exportJobs', 'exportJobs'];

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

  deleteExportJob: (id: string) => {
    set((state) => ({
      exportJobs: state.exportJobs.filter((j) => j.id !== id),
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
        const local = loadWithLegacyMigration<ExportJob[]>({
          primaryKey: STORAGE_KEY_EXPORTS_V1,
          legacyKeys: LEGACY_EXPORTS_KEYS,
          validate: (d): d is ExportJob[] => Array.isArray(d),
        });
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
      logger.warn('Failed to load export jobs:', e);
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
      logger.warn('Failed to save export jobs:', e);
    }
  },
});
