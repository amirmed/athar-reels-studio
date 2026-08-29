declare const electronAPI: {
    window: {
        minimize: () => Promise<any>;
        maximize: () => Promise<any>;
        close: () => Promise<any>;
        isMaximized: () => Promise<any>;
    };
    dialog: {
        openFile: (options?: {
            filters?: {
                name: string;
                extensions: string[];
            }[];
        }) => Promise<any>;
        saveFile: (options?: {
            defaultPath?: string;
            filters?: {
                name: string;
                extensions: string[];
            }[];
        }) => Promise<any>;
        openDirectory: () => Promise<any>;
    };
    projects: {
        loadAll: () => Promise<any>;
        save: (project: unknown) => Promise<any>;
        saveAll: (projects: unknown[]) => Promise<any>;
        delete: (projectId: string) => Promise<any>;
        deleteAll: () => Promise<any>;
    };
    settings: {
        load: () => Promise<any>;
        save: (settings: unknown) => Promise<any>;
    };
    exports: {
        loadAll: () => Promise<any>;
        save: (jobs: unknown[]) => Promise<any>;
    };
    fs: {
        readFile: (filePath: string) => Promise<any>;
        writeFile: (filePath: string, data: string) => Promise<any>;
        writeBinaryFile: (filePath: string, data: string | Uint8Array | ArrayBuffer) => Promise<any>;
        exists: (filePath: string) => Promise<any>;
    };
    shell: {
        openPath: (filePath: string) => Promise<any>;
        showItemInFolder: (filePath: string) => Promise<any>;
        openExternal: (url: string) => Promise<any>;
    };
    app: {
        getPath: (name: string) => Promise<any>;
        getDataPath: () => Promise<any>;
    };
    audio: {
        getTTSStream: (text: string, voice?: string) => Promise<any>;
    };
    videoExport: {
        start: (options: unknown) => Promise<any>;
        choosePath: (projectName: string) => Promise<any>;
        cancel: () => Promise<any>;
        onProgress: (cb: (data: {
            phase: string;
            percent: number;
            timemark?: string;
        }) => void) => () => Electron.IpcRenderer;
    };
};
export type ElectronAPI = typeof electronAPI;
export {};
