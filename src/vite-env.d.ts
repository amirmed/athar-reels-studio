/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    window: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
    };
    dialog: {
      openFile: (options?: {
        filters?: { name: string; extensions: string[] }[];
      }) => Promise<string | null>;
      saveFile: (options?: {
        defaultPath?: string;
        filters?: { name: string; extensions: string[] }[];
      }) => Promise<string | null>;
      openDirectory: () => Promise<string | null>;
    };
    projects: {
      loadAll: () => Promise<any[]>;
      save: (project: any) => Promise<{ success: boolean; error?: string }>;
      saveAll: (projects: any[]) => Promise<{ success: boolean; error?: string }>;
      delete: (projectId: string) => Promise<{ success: boolean; error?: string }>;
      deleteAll?: () => Promise<{ success: boolean; error?: string }>;
    };
    settings: {
      load: () => Promise<any>;
      save: (settings: any) => Promise<{ success: boolean; error?: string }>;
    };
    exports: {
      loadAll: () => Promise<any[]>;
      save: (jobs: any[]) => Promise<{ success: boolean; error?: string }>;
    };
    fs: {
      readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
      writeBinaryFile: (
        filePath: string,
        base64Data: string
      ) => Promise<{ success: boolean; error?: string }>;
      exists: (filePath: string) => Promise<boolean>;
    };
    shell: {
      openPath: (filePath: string) => Promise<void>;
      showItemInFolder: (filePath: string) => Promise<void>;
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
    };
    app: {
      getPath: (name: string) => Promise<string>;
      getDataPath: () => Promise<string>;
    };
    audio: {
      getTTSStream: (
        text: string
      ) => Promise<{ success: boolean; audioData?: string; mimeType?: string; error?: string }>;
    };
    videoExport: {
      start: (options: any) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      choosePath: (projectName: string) => Promise<string | null>;
      cancel: () => Promise<{ success: boolean }>;
      onProgress: (
        cb: (data: { phase: string; percent: number; timemark?: string }) => void
      ) => () => void;
    };
  };
}
