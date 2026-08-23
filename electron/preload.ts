import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
  dialog: {
    openFile: (options?: { filters?: { name: string; extensions: string[] }[] }) =>
      ipcRenderer.invoke('dialog:openFile', options || {}),
    saveFile: (options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) =>
      ipcRenderer.invoke('dialog:saveFile', options || {}),
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  },
  projects: {
    loadAll: () => ipcRenderer.invoke('projects:loadAll'),
    save: (project: any) => ipcRenderer.invoke('projects:save', project),
    saveAll: (projects: any[]) => ipcRenderer.invoke('projects:saveAll', projects),
    delete: (projectId: string) => ipcRenderer.invoke('projects:delete', projectId),
    deleteAll: () => ipcRenderer.invoke('projects:deleteAll'),
  },
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  },
  exports: {
    loadAll: () => ipcRenderer.invoke('exports:loadAll'),
    save: (jobs: any[]) => ipcRenderer.invoke('exports:save', jobs),
  },
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, data: string) => ipcRenderer.invoke('fs:writeFile', filePath, data),
    writeBinaryFile: (filePath: string, base64Data: string) => ipcRenderer.invoke('fs:writeBinaryFile', filePath, base64Data),
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
  },
  shell: {
    openPath: (filePath: string) => ipcRenderer.invoke('shell:openPath', filePath),
    showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  app: {
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
    getDataPath: () => ipcRenderer.invoke('app:getDataPath'),
  },
  audio: {
    getTTSStream: (text: string) => ipcRenderer.invoke('audio:getTTSStream', text),
  },
  videoExport: {
    start: (options: any) => ipcRenderer.invoke('export:start', options),
    choosePath: (projectName: string) => ipcRenderer.invoke('export:choosePath', projectName),
    cancel: () => ipcRenderer.invoke('export:cancel'),
    onProgress: (cb: (data: { phase: string; percent: number; timemark?: string }) => void) => {
      const handler = (_: any, data: any) => cb(data);
      ipcRenderer.on('export:progress', handler);
      return () => ipcRenderer.removeListener('export:progress', handler);
    },
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
