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

export interface DeleteProjectModalData {
  projectId: string;
  projectName?: string;
}

export interface QuickVerseModalData {
  initialSurah?: number;
  initialAyah?: number;
}

export interface ReciterBrowserModalData {
  reciterId?: string;
  selectedReciter?: string;
}

export interface PexelsBrowserModalData {
  query?: string;
  type?: 'image' | 'video';
  mediaType?: 'photo' | 'video';
}

export interface ExportModalData {
  projectId?: string;
}

export interface ThumbnailModalData {
  projectId?: string;
}

export interface PublishKitModalData {
  projectId?: string;
  projectTitle?: string;
}

export interface ViralCaptionModalData {
  surahName?: string;
  versesText?: string;
}

export interface AiVoiceModalData {
  text?: string;
  voiceId?: string;
}

export interface PresetTemplatesModalData {
  category?: string;
  templateId?: string;
}

export interface ModalDataMap {
  'confirm-delete': DeleteProjectModalData;
  quickVerse: QuickVerseModalData | undefined;
  reciterBrowser: ReciterBrowserModalData | undefined;
  pexelsBrowser: PexelsBrowserModalData | undefined;
  export: ExportModalData | undefined;
  thumbnail: ThumbnailModalData | undefined;
  publishKit: PublishKitModalData | undefined;
  viralCaption: ViralCaptionModalData | undefined;
  aiVoice: AiVoiceModalData | undefined;
  onboarding: Record<string, unknown> | undefined;
  globalSearch: Record<string, unknown> | undefined;
  presetTemplates: PresetTemplatesModalData | undefined;
}

export type ModalName = keyof ModalDataMap;

export type ModalPayload =
  | { name: 'confirm-delete'; data: DeleteProjectModalData }
  | { name: 'quickVerse'; data?: QuickVerseModalData }
  | { name: 'reciterBrowser'; data?: ReciterBrowserModalData }
  | { name: 'pexelsBrowser'; data?: PexelsBrowserModalData }
  | { name: 'export'; data?: ExportModalData }
  | { name: 'thumbnail'; data?: ThumbnailModalData }
  | { name: 'publishKit'; data?: PublishKitModalData }
  | { name: 'viralCaption'; data?: ViralCaptionModalData }
  | { name: 'aiVoice'; data?: AiVoiceModalData }
  | { name: 'onboarding'; data?: Record<string, unknown> }
  | { name: 'globalSearch'; data?: Record<string, unknown> }
  | { name: 'presetTemplates'; data?: PresetTemplatesModalData };

export interface UiSlice {
  // Navigation
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Modals with typed payloads
  activeModal: ModalName | null;
  modalData: ModalDataMap[ModalName] | null;
  openModal: <K extends ModalName>(name: K, data?: ModalDataMap[K]) => void;
  closeModal: () => void;

  // Quotes
  activeQuoteDraft: Partial<QuoteCardSettings> | null;
  setActiveQuoteDraft: (draft: Partial<QuoteCardSettings> | null) => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts?: () => void;

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
  setTheme: (theme: 'dark' | 'light') => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export interface ExportSlice {
  exportJobs: ExportJob[];
  addExportJob: (job: ExportJob) => void;
  updateExportJob: (id: string, updates: Partial<ExportJob>) => void;
  deleteExportJob: (id: string) => void;
  loadExportJobs: () => Promise<void>;
  saveExportJobs: () => Promise<void>;
}

export type AppStoreState = UiSlice & ProjectSlice & SettingsSlice & ExportSlice & {
  initialized: boolean;
  initializeApp: () => Promise<void>;
};

export type AppSlice<T> = StateCreator<
  AppStoreState,
  [['zustand/persist', unknown]],
  [],
  T
>;
