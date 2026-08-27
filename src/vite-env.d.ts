/// <reference types="vite/client" />
import type {
  Project,
  AppSettings,
  ExportJob,
  TextSettings,
  AudioSettings,
  AspectRatio,
} from './types';

export interface ElectronFileFilter {
  name: string;
  extensions: string[];
}

export interface ElectronWindowAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
}

export interface ElectronDialogAPI {
  openFile: (options?: {
    filters?: ElectronFileFilter[];
  }) => Promise<string | null>;
  saveFile: (options?: {
    defaultPath?: string;
    filters?: ElectronFileFilter[];
  }) => Promise<string | null>;
  openDirectory: () => Promise<string | null>;
}

export interface ElectronProjectsAPI {
  loadAll: () => Promise<Project[]>;
  save: (project: Project | Project[]) => Promise<{ success: boolean; error?: string }>;
  saveAll: (projects: Project[]) => Promise<{ success: boolean; error?: string }>;
  delete: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  deleteAll?: () => Promise<{ success: boolean; error?: string }>;
}

export interface ElectronSettingsAPI {
  load: () => Promise<Partial<AppSettings> | null>;
  save: (settings: AppSettings) => Promise<{ success: boolean; error?: string }>;
}

export interface ElectronExportsAPI {
  loadAll: () => Promise<ExportJob[]>;
  save: (jobs: ExportJob[]) => Promise<{ success: boolean; error?: string }>;
}

export interface ElectronFsAPI {
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
  writeBinaryFile: (
    filePath: string,
    data: string | Uint8Array | ArrayBuffer
  ) => Promise<{ success: boolean; error?: string }>;
  exists: (filePath: string) => Promise<boolean>;
}

export interface ElectronShellAPI {
  openPath: (filePath: string) => Promise<{ success?: boolean; error?: string } | void>;
  showItemInFolder: (filePath: string) => Promise<void>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
}

export type ElectronAppPathName =
  | 'home'
  | 'appData'
  | 'userData'
  | 'cache'
  | 'temp'
  | 'userDesktop'
  | 'desktop'
  | 'documents'
  | 'downloads'
  | 'music'
  | 'pictures'
  | 'videos'
  | 'recent'
  | 'logs'
  | 'crashDumps'
  | string;

export interface ElectronAppAPI {
  getPath: (name: ElectronAppPathName) => Promise<string>;
  getDataPath: () => Promise<string>;
}

export interface ElectronTTSResult {
  success: boolean;
  base64?: string;
  audioData?: string;
  mime?: string;
  mimeType?: string;
  error?: string;
}

export interface ElectronAudioAPI {
  getTTSStream: (text: string, voice?: string) => Promise<ElectronTTSResult>;
}

export interface ElectronExportWord {
  id?: number;
  position?: number;
  text: string;
  startTime: number;
  endTime: number;
  translation?: string;
}

export interface ElectronExportChunk {
  id?: string;
  words: ElectronExportWord[];
  startTime?: number;
  endTime?: number;
}

export interface ElectronExportAyah {
  text: string;
  startTime: number;
  endTime: number;
  numberInSurah?: number;
  translationText?: string;
  tafsirText?: string;
  words?: ElectronExportWord[];
  chunks?: ElectronExportChunk[];
}

export interface ElectronExportOptions {
  outputPath?: string;
  projectName?: string;
  backgroundPath?: string;
  bgOpacity?: number;
  audioUrls?: string[];
  ayahs: ElectronExportAyah[];
  aspectRatio: AspectRatio | string;
  quality: 'standard' | 'high' | 'premium' | string;
  watermark?: string;
  textColor?: string;
  fontFamily?: string;
  totalDuration?: number;
  transition?: string;
  videoEffect?: string;
  textSettings?: Partial<TextSettings>;
  audioSettings?: Partial<AudioSettings>;
  showTranslation?: boolean;
  showTafsir?: boolean;
  surahName?: string;
  reciterName?: string;
  fps?: number;
  bitrate?: number;
}

export interface ElectronExportProgressData {
  phase: string;
  percent: number;
  timemark?: string;
  currentFrame?: number;
  totalFrames?: number;
}

export interface ElectronVideoExportAPI {
  start: (options: ElectronExportOptions) => Promise<{
    success: boolean;
    outputPath?: string;
    error?: string;
    durationSec?: number;
    blobUrl?: string;
  }>;
  choosePath: (projectName: string) => Promise<string | null>;
  cancel: () => Promise<{ success: boolean }>;
  onProgress: (cb: (data: ElectronExportProgressData) => void) => () => void;
}

export interface ElectronAPI {
  window: ElectronWindowAPI;
  dialog: ElectronDialogAPI;
  projects: ElectronProjectsAPI;
  settings: ElectronSettingsAPI;
  exports: ElectronExportsAPI;
  fs: ElectronFsAPI;
  shell: ElectronShellAPI;
  app: ElectronAppAPI;
  audio: ElectronAudioAPI;
  videoExport: ElectronVideoExportAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
