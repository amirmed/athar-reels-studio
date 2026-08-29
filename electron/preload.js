import { contextBridge, ipcRenderer } from 'electron';
const electronAPI = {
    window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close'),
        isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    },
    dialog: {
        openFile: (options) => ipcRenderer.invoke('dialog:openFile', options || {}),
        saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options || {}),
        openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    },
    projects: {
        loadAll: () => ipcRenderer.invoke('projects:loadAll'),
        save: (project) => ipcRenderer.invoke('projects:save', project),
        saveAll: (projects) => ipcRenderer.invoke('projects:saveAll', projects),
        delete: (projectId) => ipcRenderer.invoke('projects:delete', projectId),
        deleteAll: () => ipcRenderer.invoke('projects:deleteAll'),
    },
    settings: {
        load: () => ipcRenderer.invoke('settings:load'),
        save: (settings) => ipcRenderer.invoke('settings:save', settings),
    },
    exports: {
        loadAll: () => ipcRenderer.invoke('exports:loadAll'),
        save: (jobs) => ipcRenderer.invoke('exports:save', jobs),
    },
    fs: {
        readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
        writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
        writeBinaryFile: (filePath, data) => ipcRenderer.invoke('fs:writeBinaryFile', filePath, data),
        exists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),
    },
    shell: {
        openPath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath),
        showItemInFolder: (filePath) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
        openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
    },
    app: {
        getPath: (name) => ipcRenderer.invoke('app:getPath', name),
        getDataPath: () => ipcRenderer.invoke('app:getDataPath'),
    },
    audio: {
        getTTSStream: (text, voice) => ipcRenderer.invoke('audio:getTTSStream', text, voice),
    },
    videoExport: {
        start: (options) => ipcRenderer.invoke('export:start', options),
        choosePath: (projectName) => ipcRenderer.invoke('export:choosePath', projectName),
        cancel: () => ipcRenderer.invoke('export:cancel'),
        onProgress: (cb) => {
            const handler = (_, data) => cb(data);
            ipcRenderer.on('export:progress', handler);
            return () => ipcRenderer.removeListener('export:progress', handler);
        },
    },
};
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
