import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppStoreState, Toast, DeleteProjectModalData, ModalDataMap, ModalName } from './types';
import { createUiSlice } from './slices/uiSlice';
import { createProjectSlice } from './slices/projectSlice';
import { createSettingsSlice, applyThemeToDom, defaultSettings, getInitialTheme } from './slices/settingsSlice';
import { createExportSlice } from './slices/exportSlice';

export type AppState = AppStoreState;
export type { Toast, DeleteProjectModalData, ModalDataMap, ModalName };
export { defaultSettings, applyThemeToDom, getInitialTheme };

export const CURRENT_STORAGE_VERSION = 1;

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get, api) => ({
      ...createUiSlice(set, get, api),
      ...createProjectSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
      ...createExportSlice(set, get, api),

      // App Initializer
      initialized: false,
      initializeApp: async () => {
        if (get().initialized) return;
        set({ initialized: true });
        await Promise.all([get().loadSettings(), get().loadProjects(), get().loadExportJobs()]);
      },
    }),
    {
      name: 'athar_app_storage',
      version: CURRENT_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      migrate: (persistedState: any, version: number) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { sidebarCollapsed: false };
        }
        if (version === 0) {
          // Migration from unversioned legacy state to v1
          return {
            ...persistedState,
            sidebarCollapsed: typeof persistedState.sidebarCollapsed === 'boolean' ? persistedState.sidebarCollapsed : false,
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDom(state.theme);
        }
      },
    }
  )
);
