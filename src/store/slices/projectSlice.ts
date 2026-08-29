import { Project } from '../../types';
import { AppSlice, ProjectSlice } from '../types';
import { deletePersistentAudio } from '../../services/persistentAudioStorage';
import {
  saveProjectThumbnail,
  getAllProjectThumbnails,
  saveProjectBackground,
  getAllProjectBackgrounds,
  saveProjectSceneBackgrounds,
  getAllProjectSceneBackgrounds,
  deleteProjectThumbnail,
  deleteProjectThumbnails,
  clearAllProjectThumbnails,
} from '../../services/persistentThumbnailStorage';

const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;
const STORAGE_KEY_PROJECTS_V1 = 'ayahStudio_projects_v1';
const LEGACY_PROJECTS_KEYS = ['ayahStudio_projects', 'athar_projects', 'projects'];

function generateUniqueId(prefix = 'proj'): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch (err) {
    console.debug('[ProjectSlice] crypto.randomUUID fallback:', err);
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

function loadFromLocal<T>(key: string): T | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToLocal(key: string, data: unknown): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('localStorage save failed:', e);
    return false;
  }
}

export const createProjectSlice: AppSlice<ProjectSlice> = (set, get) => ({
  projects: [],
  currentProject: null,
  isLoadingProjects: false,

  setCurrentProject: (project: Project | null) => set({ currentProject: project }),

  addProject: (project: Project) => {
    set((state) => ({
      projects: [project, ...state.projects],
      currentProject: project,
    }));
    get().saveProjects();
  },

  updateProject: (id: string, updates: Partial<Project>) => {
    set((state) => {
      const updated = state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      const cur =
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates, updatedAt: new Date().toISOString() }
          : state.currentProject;
      return { projects: updated, currentProject: cur };
    });
    get().saveProjects();
  },

  deleteProject: (id: string) => {
    deletePersistentAudio(id).catch((err) => {
      console.warn(`[ProjectSlice] Failed to delete audio for project ${id}:`, err);
    });
    deleteProjectThumbnail(id).catch((err) => {
      console.warn(`[ProjectSlice] Failed to delete thumbnail for project ${id}:`, err);
    });
    if (window.electronAPI?.projects?.delete) {
      window.electronAPI.projects.delete(id).catch((err) => {
        console.error(`[ProjectSlice] Electron IPC project deletion failed for ${id}:`, err);
      });
    }
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
    get().saveProjects();
  },

  deleteProjects: (ids: string[]) => {
    deleteProjectThumbnails(ids).catch((err) => {
      console.warn('[ProjectSlice] Failed to batch delete thumbnails:', err);
    });
    ids.forEach((id) => {
      deletePersistentAudio(id).catch((err) => {
        console.warn(`[ProjectSlice] Failed to delete audio for project ${id}:`, err);
      });
      if (window.electronAPI?.projects?.delete) {
        window.electronAPI.projects.delete(id).catch((err) => {
          console.error(`[ProjectSlice] Electron IPC project deletion failed for ${id}:`, err);
        });
      }
    });
    set((state) => ({
      projects: state.projects.filter((p) => !ids.includes(p.id)),
      currentProject:
        state.currentProject && ids.includes(state.currentProject.id) ? null : state.currentProject,
    }));
    get().saveProjects();
  },

  deleteAllProjects: () => {
    clearAllProjectThumbnails().catch((err) => {
      console.warn('[ProjectSlice] Failed to clear all thumbnails:', err);
    });
    get().projects.forEach((p) => {
      deletePersistentAudio(p.id).catch((err) => {
        console.warn(`[ProjectSlice] Failed to delete audio for project ${p.id}:`, err);
      });
    });
    if (window.electronAPI?.projects?.deleteAll) {
      window.electronAPI.projects.deleteAll().catch((err) => {
        console.error('[ProjectSlice] Electron IPC deleteAll failed:', err);
      });
    } else {
      get().projects.forEach((p) => {
        if (window.electronAPI?.projects?.delete) {
          window.electronAPI.projects.delete(p.id).catch((err) => {
            console.error(`[ProjectSlice] Electron IPC delete failed for ${p.id}:`, err);
          });
        }
      });
    }
    set({ projects: [], currentProject: null });
    get().saveProjects();
  },

  duplicateProject: (id: string) => {
    const target = get().projects.find((p) => p.id === id);
    if (!target) return;
    const duplicated: Project = {
      ...JSON.parse(JSON.stringify(target)),
      id: generateUniqueId('proj'),
      name: `${target.name} (نسخة)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      projects: [duplicated, ...state.projects],
      currentProject: duplicated,
    }));
    get().saveProjects();
  },

  loadProjects: async () => {
    set({ isLoadingProjects: true });
    try {
      let baseProjects: Project[] = [];
      if (isElectron() && window.electronAPI?.projects) {
        const loaded = await window.electronAPI.projects.loadAll();
        if (Array.isArray(loaded)) {
          baseProjects = loaded;
        }

        // Automatic Web-to-Electron Migration:
        // Check localStorage for legacy web projects and migrate them
        let legacyLocalProjects = loadFromLocal<Project[]>(STORAGE_KEY_PROJECTS_V1);
        if (!legacyLocalProjects || legacyLocalProjects.length === 0) {
          for (const k of LEGACY_PROJECTS_KEYS) {
            const found = loadFromLocal<Project[]>(k);
            if (found && Array.isArray(found) && found.length > 0) {
              legacyLocalProjects = found;
              break;
            }
          }
        }

        if (
          legacyLocalProjects &&
          Array.isArray(legacyLocalProjects) &&
          legacyLocalProjects.length > 0
        ) {
          const existingIds = new Set(baseProjects.map((p) => p.id));
          const migratedProjects: Project[] = [];

          for (const legacyP of legacyLocalProjects) {
            if (legacyP && legacyP.id && !existingIds.has(legacyP.id)) {
              migratedProjects.push(legacyP);
              baseProjects.push(legacyP);
              existingIds.add(legacyP.id);
            }
          }

          if (migratedProjects.length > 0) {
            console.info(
              `[ProjectSlice] Migrated ${migratedProjects.length} legacy project(s) into Electron disk.`
            );
            // Offload thumbnails and backgrounds to IndexedDB and save clean projects to Electron disk
            const sanitizedMigrated = migratedProjects.map((p) => {
              const clean = { ...p };
              const t = clean.thumbnail;
              if (t && typeof t === 'string' && t.startsWith('data:')) {
                saveProjectThumbnail(p.id, t).catch(() => {});
                delete clean.thumbnail;
              }
              const bg = clean.backgroundUrl;
              if (bg && typeof bg === 'string' && bg.startsWith('data:')) {
                saveProjectBackground(p.id, bg).catch(() => {});
                delete clean.backgroundUrl;
              }
              return clean as Project;
            });
            window.electronAPI.projects.saveAll(sanitizedMigrated).catch((err) => {
              console.warn('[ProjectSlice] Failed to save migrated projects to Electron:', err);
            });
          }
        }
      } else {
        let local = loadFromLocal<Project[]>(STORAGE_KEY_PROJECTS_V1);
        if (!local || local.length === 0) {
          for (const k of LEGACY_PROJECTS_KEYS) {
            const found = loadFromLocal<Project[]>(k);
            if (found && Array.isArray(found) && found.length > 0) {
              local = found;
              // Migrate to v1 key
              saveToLocal(STORAGE_KEY_PROJECTS_V1, found);
              break;
            }
          }
        }
        baseProjects = local || [];
      }

      // Fast async hydration of thumbnails, backgrounds, and scene media from IndexedDB
      try {
        const [thumbnailsMap, backgroundsMap, scenesMap] = await Promise.all([
          getAllProjectThumbnails(),
          getAllProjectBackgrounds(),
          getAllProjectSceneBackgrounds(),
        ]);
        const hydratedProjects = baseProjects.map((p) => {
          const thumbnail = p.thumbnail || thumbnailsMap.get(p.id);
          const backgroundUrl = p.backgroundUrl || backgroundsMap.get(p.id);
          const storedScenes = scenesMap.get(p.id);
          const sceneBackgrounds =
            p.textSettings?.sceneBackgrounds && Object.keys(p.textSettings.sceneBackgrounds).length > 0
              ? p.textSettings.sceneBackgrounds
              : storedScenes;

          return {
            ...p,
            ...(thumbnail ? { thumbnail } : {}),
            ...(backgroundUrl ? { backgroundUrl } : {}),
            ...(sceneBackgrounds
              ? {
                  textSettings: {
                    ...(p.textSettings || {}),
                    sceneBackgrounds,
                  },
                }
              : {}),
          };
        });
        set({ projects: hydratedProjects, isLoadingProjects: false });
      } catch {
        set({ projects: baseProjects, isLoadingProjects: false });
      }
    } catch (e) {
      console.warn('Failed to load projects:', e);
      set({ isLoadingProjects: false });
    }
  },

  saveProjects: async () => {
    try {
      const { projects } = get();

      // 1. Offload heavy base64 data URLs (thumbnails, backgrounds, scene media) to IndexedDB
      projects.forEach((p) => {
        if (p.thumbnail && p.thumbnail.startsWith('data:')) {
          saveProjectThumbnail(p.id, p.thumbnail).catch((err) => {
            console.warn(`[ProjectSlice] Failed to persist thumbnail for ${p.id}:`, err);
          });
        }
        if (p.backgroundUrl && p.backgroundUrl.startsWith('data:')) {
          saveProjectBackground(p.id, p.backgroundUrl).catch((err) => {
            console.warn(`[ProjectSlice] Failed to persist background for ${p.id}:`, err);
          });
        }
        const pAny = p as any;
        if (pAny.backgroundFile && typeof pAny.backgroundFile === 'string' && pAny.backgroundFile.startsWith('data:')) {
          saveProjectBackground(p.id, pAny.backgroundFile).catch((err) => {
            console.warn(`[ProjectSlice] Failed to persist backgroundFile for ${p.id}:`, err);
          });
        }
        if (p.textSettings?.sceneBackgrounds) {
          const hasDataUrlScenes = Object.values(p.textSettings.sceneBackgrounds).some(
            (v) => typeof v === 'string' && v.startsWith('data:')
          );
          if (hasDataUrlScenes) {
            saveProjectSceneBackgrounds(p.id, p.textSettings.sceneBackgrounds).catch((err) => {
              console.warn(`[ProjectSlice] Failed to persist sceneBackgrounds for ${p.id}:`, err);
            });
          }
        }
      });

      // 2. Sanitize projects: Strip heavy base64 data URLs from persistent JSON storage
      const sanitizedProjects = projects.map((p) => {
        const cleanProject = { ...p };
        if (cleanProject.thumbnail && cleanProject.thumbnail.startsWith('data:')) {
          delete cleanProject.thumbnail;
        }
        if (cleanProject.backgroundUrl && cleanProject.backgroundUrl.startsWith('data:')) {
          delete cleanProject.backgroundUrl;
        }
        const cleanAny = cleanProject as any;
        if (cleanAny.backgroundFile && typeof cleanAny.backgroundFile === 'string' && cleanAny.backgroundFile.startsWith('data:')) {
          delete cleanAny.backgroundFile;
        }
        if (cleanProject.textSettings?.sceneBackgrounds) {
          const hasDataUrl = Object.values(cleanProject.textSettings.sceneBackgrounds).some(
            (v) => typeof v === 'string' && v.startsWith('data:')
          );
          if (hasDataUrl) {
            cleanProject.textSettings = {
              ...cleanProject.textSettings,
              sceneBackgrounds: {},
            };
          }
        }
        return cleanProject as Project;
      });

      // 3. Single Owner: Electron IPC is primary, localStorage is web fallback
      if (isElectron() && window.electronAPI?.projects) {
        try {
          await window.electronAPI.projects.saveAll(sanitizedProjects);
        } catch (electronSaveErr) {
          console.error('[ProjectSlice] Electron save error:', electronSaveErr);
          get().addToast?.({
            message: '⚠️ تعذر حفظ المشاريع على القرص، تحقق من أذونات النظام',
            type: 'error',
          });
        }
      } else {
        const success = saveToLocal(STORAGE_KEY_PROJECTS_V1, sanitizedProjects);
        if (!success) {
          get().addToast?.({
            message: '⚠️ تحذير: تعذر حفظ المشروع محلياً بسبب امتلاء مساحة التخزين في المتصفح!',
            type: 'error',
          });
        }
      }
    } catch (e) {
      console.warn('Failed to save projects:', e);
      get().addToast?.({
        message: '⚠️ حدث خطأ أثناء حفظ بيانات المشروع',
        type: 'error',
      });
    }
  },
});
