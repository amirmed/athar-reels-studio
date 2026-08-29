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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDom(state.theme);
        }
      },
    }
  )
);
