import { StateCreator } from 'zustand';
import { Page, Project, AppSettings, ExportJob, QuoteCardSettings } from '../types';

export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ModalName =
  | 'confirm-delete'
  | 'quickVerse'
  | 'reciterBrowser'
  | 'pexelsBrowser'
  | 'export'
  | 'thumbnail'
  | 'publishKit'
  | 'viralCaption'
  | 'aiVoice'
  | 'onboarding'
  | 'globalSearch'
  | 'presetTemplates';

export interface DeleteProjectModalData {
  projectId?: string;
  projectName?: string;
  [key: string]: unknown;
}

export interface ModalDataMap {
  'confirm-delete': DeleteProjectModalData;
  [key: string]: unknown;
}

export interface UiSlice {
  // Navigation
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Modals with typed payloads
  activeModal: ModalName | null;
  modalData: DeleteProjectModalData | Record<string, unknown> | unknown;
  openModal: <T = unknown>(name: ModalName, data?: T) => void;
  closeModal: () => void;

  // Quotes
  activeQuoteDraft: Partial<QuoteCardSettings> | null;
  setActiveQuoteDraft: (draft: Partial<QuoteCardSettings> | null) => void;

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
}

export interface ProjectSlice {
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
}

export interface SettingsSlice {
  theme: 'dark' | 'light';
  settings: AppSettings;
  toggleTheme: () => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export interface ExportSlice {
  exportJobs: ExportJob[];
  addExportJob: (job: ExportJob) => void;
  updateExportJob: (id: string, updates: Partial<ExportJob>) => void;
  loadExportJobs: () => Promise<void>;
  saveExportJobs: () => Promise<void>;
}

export interface AppStoreState extends UiSlice, ProjectSlice, SettingsSlice, ExportSlice {
  initialized: boolean;
  initializeApp: () => Promise<void>;
}

export type AppSlice<T> = StateCreator<
  AppStoreState,
  [['zustand/persist', unknown]],
  [],
  T
>;
