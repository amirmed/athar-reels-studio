import { Project } from '../../types';
import { AppSlice, ProjectSlice } from '../types';
import { deletePersistentAudio } from '../../services/persistentAudioStorage';
import {
  saveProjectThumbnail,
  getAllProjectThumbnails,
  deleteProjectThumbnail,
  deleteProjectThumbnails,
  clearAllProjectThumbnails,
} from '../../services/persistentThumbnailStorage';

const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;
const STORAGE_KEY_PROJECTS = 'ayahStudio_projects';

function generateUniqueId(prefix = 'proj'): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {}
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

function saveToLocal(key: string, data: unknown) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn('localStorage save failed:', e);
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
    deletePersistentAudio(id).catch(() => {});
    deleteProjectThumbnail(id).catch(() => {});
    if (window.electronAPI?.projects?.delete) {
      window.electronAPI.projects.delete(id).catch(() => {});
    }
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
    get().saveProjects();
  },

  deleteProjects: (ids: string[]) => {
    deleteProjectThumbnails(ids).catch(() => {});
    ids.forEach((id) => {
      deletePersistentAudio(id).catch(() => {});
      if (window.electronAPI?.projects?.delete) {
        window.electronAPI.projects.delete(id).catch(() => {});
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
    clearAllProjectThumbnails().catch(() => {});
    get().projects.forEach((p) => deletePersistentAudio(p.id).catch(() => {}));
    if (window.electronAPI?.projects?.deleteAll) {
      window.electronAPI.projects.deleteAll().catch(() => {});
    } else {
      get().projects.forEach((p) => {
        if (window.electronAPI?.projects?.delete) {
          window.electronAPI.projects.delete(p.id).catch(() => {});
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
      }
      if (baseProjects.length === 0) {
        const local = loadFromLocal<Project[]>(STORAGE_KEY_PROJECTS);
        baseProjects = local || [];
      }

      // Fast async hydration of thumbnails from IndexedDB
      try {
        const thumbnailsMap = await getAllProjectThumbnails();
        const hydratedProjects = baseProjects.map((p) => {
          if (!p.thumbnail && thumbnailsMap.has(p.id)) {
            return { ...p, thumbnail: thumbnailsMap.get(p.id) };
          }
          return p;
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

      // 1. Offload heavy base64 data URLs to IndexedDB
      projects.forEach((p) => {
        if (p.thumbnail && p.thumbnail.startsWith('data:image/')) {
          saveProjectThumbnail(p.id, p.thumbnail).catch(() => {});
        }
      });

      // 2. Sanitize projects for localStorage (strip heavy base64 strings to preserve quota)
      const sanitizedProjects = projects.map((p) => {
        if (p.thumbnail && p.thumbnail.startsWith('data:image/')) {
          const { thumbnail: _t, ...rest } = p;
          return rest as Project;
        }
        return p;
      });

      if (isElectron() && window.electronAPI?.projects) {
        await window.electronAPI.projects.saveAll(projects);
      }
      saveToLocal(STORAGE_KEY_PROJECTS, sanitizedProjects);
    } catch (e) {
      console.warn('Failed to save projects:', e);
    }
  },
});
