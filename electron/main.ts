import { app, BrowserWindow, ipcMain, dialog, shell, Menu, nativeTheme, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setupExportHandlers, killActiveExport, cleanOldExportJobs } from './exportService.js';
import { isSafeUserPath } from './pathSecurity.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

// Data directories
function getAppDataPath(): string {
  return path.join(app.getPath('userData'), 'IslamicReelsStudio');
}

function getProjectsPath(): string {
  return path.join(getAppDataPath(), 'projects');
}

function getSettingsPath(): string {
  return path.join(getAppDataPath(), 'settings.json');
}

function getExportsPath(): string {
  return path.join(getAppDataPath(), 'exports');
}

// Ensure directories exist
function ensureDirectories() {
  const dirs = [getAppDataPath(), getProjectsPath(), getExportsPath()];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Atomic file writer to prevent corrupted state on sudden crash
function atomicWriteFileSync(filePath: string, content: string | Buffer) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, filePath);
}

// Sanitize project ID to prevent directory traversal
function sanitizeProjectId(id: any): string | null {
  if (!id || typeof id !== 'string') return null;
  const clean = id.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return clean.length > 0 && clean.length <= 120 ? clean : null;
}

function createWindow() {
  // Remove the menu bar (File, Edit, View, Window, Help)
  Menu.setApplicationMenu(null);

  // Force dark mode for the native title bar
  nativeTheme.themeSource = 'dark';

  // Secure default session permissions: deny untrusted device/camera/microphone requests by default
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler(() => {
    return false;
  });

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'استوديو الريلز الإسلامية',
    icon: path.join(__dirname, '../assets/icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#0d0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Secure navigation & prevent arbitrary window hijack
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        shell.openExternal(url);
      }
    } catch (err) {
      console.debug('[WindowOpenHandler] URL parse error:', err);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsed = new URL(navigationUrl);
      const isLocal = isDev
        ? parsed.origin === 'http://localhost:5173'
        : parsed.protocol === 'file:';
      if (!isLocal) {
        event.preventDefault();
        if (['http:', 'https:'].includes(parsed.protocol)) {
          shell.openExternal(navigationUrl);
        }
      }
    } catch {
      event.preventDefault();
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single-Instance Lock: prevent running multiple Electron instances
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = mainWindow || BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    ensureDirectories();
    createWindow();
    // Clean orphaned export jobs older than 24h on startup
    cleanOldExportJobs(getExportsPath());
    // Setup FFmpeg export IPC handlers
    setupExportHandlers(getExportsPath());
  });
}

app.on('before-quit', () => {
  killActiveExport();
});

app.on('will-quit', () => {
  killActiveExport();
});

app.on('window-all-closed', () => {
  killActiveExport();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ==================== Window Controls ====================
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// ==================== Dialogs ====================
ipcMain.handle('dialog:openFile', async (_event, options: { filters?: Electron.FileFilter[] }) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: options.filters || [
      { name: 'Media', extensions: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi'] },
    ],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (_event, options: { defaultPath?: string; filters?: Electron.FileFilter[] }) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: options.defaultPath,
    filters: options.filters || [
      { name: 'Video', extensions: ['mp4'] },
    ],
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

// ==================== Project Persistence ====================
ipcMain.handle('projects:loadAll', async () => {
  try {
    const projectsDir = getProjectsPath();
    if (!fs.existsSync(projectsDir)) return [];
    
    const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.json'));
    const projects = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
        projects.push(JSON.parse(content));
      } catch {
        // Skip corrupted files
      }
    }
    
    // Sort by updatedAt descending
    projects.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return projects;
  } catch {
    return [];
  }
});

ipcMain.handle('projects:save', async (_event, projectOrProjects: any) => {
  try {
    const sanitizeForDisk = (item: any) => {
      if (!item || typeof item !== 'object') return item;
      if (item.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.startsWith('data:image/')) {
        const { thumbnail: _t, ...rest } = item;
        return rest;
      }
      return item;
    };

    const projectsDir = getProjectsPath();
    if (Array.isArray(projectOrProjects)) {
      for (const p of projectOrProjects) {
        const safeId = sanitizeProjectId(p?.id);
        if (safeId) {
          const filePath = path.join(projectsDir, `${safeId}.json`);
          if (isSafeUserPath(filePath)) {
            atomicWriteFileSync(filePath, JSON.stringify(sanitizeForDisk(p), null, 2));
          }
        }
      }
      return { success: true };
    }
    const safeId = sanitizeProjectId(projectOrProjects?.id);
    if (!safeId) {
      return { success: false, error: 'Invalid project ID' };
    }
    const filePath = path.join(projectsDir, `${safeId}.json`);
    if (!isSafeUserPath(filePath)) {
      return { success: false, error: 'Unsafe path destination' };
    }
    atomicWriteFileSync(filePath, JSON.stringify(sanitizeForDisk(projectOrProjects), null, 2));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('projects:saveAll', async (_event, projects: any[]) => {
  try {
    const sanitizeForDisk = (item: any) => {
      if (!item || typeof item !== 'object') return item;
      if (item.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.startsWith('data:image/')) {
        const { thumbnail: _t, ...rest } = item;
        return rest;
      }
      return item;
    };

    const projectsDir = getProjectsPath();
    for (const p of projects) {
      const safeId = sanitizeProjectId(p?.id);
      if (safeId) {
        const filePath = path.join(projectsDir, `${safeId}.json`);
        if (isSafeUserPath(filePath)) {
          atomicWriteFileSync(filePath, JSON.stringify(sanitizeForDisk(p), null, 2));
        }
      }
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('projects:delete', async (_event, projectId: string) => {
  try {
    const safeId = sanitizeProjectId(projectId);
    if (!safeId) return { success: false, error: 'Invalid project ID' };
    const filePath = path.join(getProjectsPath(), `${safeId}.json`);
    if (isSafeUserPath(filePath) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('projects:deleteAll', async () => {
  try {
    const projectsDir = getProjectsPath();
    if (fs.existsSync(projectsDir)) {
      const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const filePath = path.join(projectsDir, file);
        if (isSafeUserPath(filePath) && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ==================== Settings Persistence ====================
ipcMain.handle('settings:load', async () => {
  try {
    const settingsFile = getSettingsPath();
    if (!fs.existsSync(settingsFile)) return null;
    const content = fs.readFileSync(settingsFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
});

ipcMain.handle('settings:save', async (_event, settings: any) => {
  try {
    atomicWriteFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ==================== Export Jobs Persistence ====================
ipcMain.handle('exports:loadAll', async () => {
  try {
    const exportsFile = path.join(getAppDataPath(), 'exports.json');
    if (!fs.existsSync(exportsFile)) return [];
    const content = fs.readFileSync(exportsFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
});

ipcMain.handle('exports:save', async (_event, jobs: any[]) => {
  try {
    const exportsFile = path.join(getAppDataPath(), 'exports.json');
    atomicWriteFileSync(exportsFile, JSON.stringify(jobs, null, 2));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});



// ==================== File System (Secured) ====================
ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    if (!isSafeUserPath(filePath)) {
      return { success: false, error: 'Access denied: Path outside allowed directories' };
    }
    const data = fs.readFileSync(filePath);
    return { success: true, data: data.toString('base64') };
  } catch {
    return { success: false, error: 'Failed to read file' };
  }
});

ipcMain.handle('fs:writeFile', async (_event, filePath: string, data: string) => {
  try {
    if (!isSafeUserPath(filePath)) {
      return { success: false, error: 'Access denied: Path outside allowed directories' };
    }
    atomicWriteFileSync(filePath, data);
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to write file' };
  }
});

ipcMain.handle('fs:writeBinaryFile', async (_event, filePath: string, data: any) => {
  try {
    if (!isSafeUserPath(filePath)) {
      return { success: false, error: 'Access denied: Path outside allowed directories' };
    }
    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
      buffer = Buffer.from(data as any);
    } else if (typeof data === 'string') {
      buffer = Buffer.from(data, 'base64');
    } else {
      return { success: false, error: 'Invalid binary data format' };
    }
    atomicWriteFileSync(filePath, buffer);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to write binary file' };
  }
});

ipcMain.handle('fs:exists', async (_event, filePath: string) => {
  if (!isSafeUserPath(filePath)) return false;
  return fs.existsSync(filePath);
});

// ==================== Shell & App ====================
ipcMain.handle('audio:getTTSStream', async (_event, text: string, voice: string = 'ar-SA-HamedNeural') => {
  try {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, { pitch: '-2Hz', rate: '-4%' });
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      audioStream.on('data', (c: any) => chunks.push(c));
      audioStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ success: true, base64: buffer.toString('base64'), mime: 'audio/mpeg' });
      });
      audioStream.on('error', (err: any) => {
        resolve({ success: false, error: err.message });
      });
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

const ALLOWED_OPEN_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.webm', '.mov', '.avi',
  '.mp3', '.wav', '.m4a', '.aac', '.ogg',
  '.png', '.jpg', '.jpeg', '.webp', '.svg',
  '.json', '.txt', '.pdf'
]);

ipcMain.handle('shell:openPath', async (_event, filePath: string) => {
  if (!filePath || typeof filePath !== 'string') return { success: false, error: 'Invalid path' };
  try {
    const resolved = path.resolve(filePath);
    const ext = path.extname(resolved).toLowerCase();
    
    // Disallow executables, batch files, shortcuts, scripts
    if (!ALLOWED_OPEN_EXTENSIONS.has(ext)) {
      return { success: false, error: 'نوع الملف غير مسموح بفتحه مباشرة لأسباب أمنية' };
    }
    
    if (!isSafeUserPath(resolved) || !fs.existsSync(resolved)) {
      return { success: false, error: 'الملف غير موجود أو المسار غير مسموح' };
    }
    
    const err = await shell.openPath(resolved);
    return { success: !err, error: err || undefined };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('shell:showItemInFolder', async (_event, filePath: string) => {
  if (filePath && typeof filePath === 'string') {
    const resolved = path.resolve(filePath);
    if (isSafeUserPath(resolved) && fs.existsSync(resolved)) {
      shell.showItemInFolder(resolved);
    }
  }
});

ipcMain.handle('shell:openExternal', async (_event, targetUrl: string) => {
  if (!targetUrl || typeof targetUrl !== 'string') return { success: false, error: 'Invalid URL' };
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      await shell.openExternal(targetUrl);
      return { success: true };
    }
    return { success: false, error: 'Protocol not allowed' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

const ALLOWED_APP_PATHS = new Set([
  'videos',
  'pictures',
  'documents',
  'downloads',
  'desktop',
  'temp',
  'userData',
]);

ipcMain.handle('app:getPath', async (_event, name: string) => {
  if (!name || typeof name !== 'string' || !ALLOWED_APP_PATHS.has(name)) {
    console.warn(`[Main] Security: Access to app path '${name}' is restricted or invalid.`);
    return '';
  }
  try {
    return app.getPath(name as any);
  } catch (err) {
    console.warn(`[Main] Failed to get app path for '${name}':`, err);
    return '';
  }
});

ipcMain.handle('app:getDataPath', async () => {
  return getAppDataPath();
});
