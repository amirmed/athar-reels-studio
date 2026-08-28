import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppStore, applyThemeToDom } from '../store';
import { createDefaultProject } from '../utils/projectDefaults';

describe('Zustand Modular Store (Slices & Persist)', () => {
  beforeEach(() => {
    if (typeof (globalThis as any).window === 'undefined') {
      (globalThis as any).window = globalThis;
    }

    const storage: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: vi.fn((k: string) => storage[k] || null),
      setItem: vi.fn((k: string, v: string) => {
        storage[k] = String(v);
      }),
      removeItem: vi.fn((k: string) => {
        delete storage[k];
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach((k) => delete storage[k]);
      }),
    };

    // Reset store state between tests
    useAppStore.setState({
      currentPage: 'welcome',
      sidebarCollapsed: false,
      activeModal: null,
      modalData: null,
      activeQuoteDraft: null,
      toasts: [],
      isTourActive: false,
      tourStep: 0,
      projects: [],
      currentProject: null,
      isLoadingProjects: false,
      theme: 'dark',
      settings: {
        language: 'ar',
        theme: 'dark',
        projectsPath: '',
        defaultExportQuality: 'high',
        defaultAspectRatio: '9:16',
        performanceMode: 'balanced',
        autoSave: true,
        autoSaveInterval: 5,
      },
      exportJobs: [],
      initialized: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('UI & Navigation Slice', () => {
    it('manages current page and sidebar state correctly', () => {
      const { setCurrentPage, toggleSidebar } = useAppStore.getState();

      setCurrentPage('editor');
      expect(useAppStore.getState().currentPage).toBe('editor');

      toggleSidebar();
      expect(useAppStore.getState().sidebarCollapsed).toBe(true);

      toggleSidebar();
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
    });

    it('opens and closes modals with typed payloads', () => {
      const { openModal, closeModal } = useAppStore.getState();

      openModal('confirm-delete', { projectId: 'proj-123', projectName: 'سورة الفاتحة' });
      expect(useAppStore.getState().activeModal).toBe('confirm-delete');
      expect(useAppStore.getState().modalData).toEqual({
        projectId: 'proj-123',
        projectName: 'سورة الفاتحة',
      });

      closeModal();
      expect(useAppStore.getState().activeModal).toBeNull();
      expect(useAppStore.getState().modalData).toBeNull();
    });

    it('adds and removes toasts with deduplication', () => {
      const { addToast, removeToast } = useAppStore.getState();

      addToast({ message: 'تم حفظ المشروع بنجاح', type: 'success' });
      expect(useAppStore.getState().toasts.length).toBe(1);
      const toastId = useAppStore.getState().toasts[0].id;
      expect(toastId).toBeTruthy();

      // Duplicate message should be ignored
      addToast({ message: 'تم حفظ المشروع بنجاح', type: 'success' });
      expect(useAppStore.getState().toasts.length).toBe(1);

      removeToast(toastId);
      expect(useAppStore.getState().toasts.length).toBe(0);
    });

    it('controls tour guide progression', () => {
      const { startTour, nextTourStep, prevTourStep, stopTour } = useAppStore.getState();

      startTour();
      expect(useAppStore.getState().isTourActive).toBe(true);
      expect(useAppStore.getState().tourStep).toBe(0);
      expect(useAppStore.getState().currentPage).toBe('dashboard');

      nextTourStep();
      expect(useAppStore.getState().tourStep).toBe(1);

      prevTourStep();
      expect(useAppStore.getState().tourStep).toBe(0);

      stopTour();
      expect(useAppStore.getState().isTourActive).toBe(false);
    });
  });

  describe('Project Management Slice', () => {
    it('creates, updates, and deletes projects', () => {
      const { addProject, updateProject, deleteProject } = useAppStore.getState();
      const project = createDefaultProject({ id: 'proj-1', name: 'مشروع تجريبي' });

      addProject(project);
      expect(useAppStore.getState().projects.length).toBe(1);
      expect(useAppStore.getState().currentProject?.id).toBe('proj-1');

      updateProject('proj-1', { name: 'مشروع محدث' });
      expect(useAppStore.getState().projects[0].name).toBe('مشروع محدث');
      expect(useAppStore.getState().currentProject?.name).toBe('مشروع محدث');

      deleteProject('proj-1');
      expect(useAppStore.getState().projects.length).toBe(0);
      expect(useAppStore.getState().currentProject).toBeNull();
    });

    it('duplicates existing project with new unique ID and copy label', () => {
      const { addProject, duplicateProject } = useAppStore.getState();
      const project = createDefaultProject({ id: 'proj-orig', name: 'مشروع الأصل' });

      addProject(project);
      duplicateProject('proj-orig');

      expect(useAppStore.getState().projects.length).toBe(2);
      const duplicate = useAppStore.getState().projects[0];
      expect(duplicate.id).not.toBe('proj-orig');
      expect(duplicate.name).toBe('مشروع الأصل (نسخة)');
    });
  });

  describe('Settings & Unified Theme Slice', () => {
    it('toggles theme between dark and light and keeps settings.theme in sync', () => {
      const { toggleTheme } = useAppStore.getState();

      expect(useAppStore.getState().theme).toBe('dark');
      expect(useAppStore.getState().settings.theme).toBe('dark');

      toggleTheme();
      expect(useAppStore.getState().theme).toBe('light');
      expect(useAppStore.getState().settings.theme).toBe('light');

      toggleTheme();
      expect(useAppStore.getState().theme).toBe('dark');
      expect(useAppStore.getState().settings.theme).toBe('dark');
    });

    it('updates settings and theme consistently through updateSettings', () => {
      const { updateSettings } = useAppStore.getState();

      updateSettings({
        language: 'en',
        defaultExportQuality: 'premium',
        theme: 'light',
      });

      expect(useAppStore.getState().settings.language).toBe('en');
      expect(useAppStore.getState().settings.defaultExportQuality).toBe('premium');
      expect(useAppStore.getState().settings.theme).toBe('light');
      expect(useAppStore.getState().theme).toBe('light');
    });

    it('applies theme classes to document root when applyThemeToDom is called', () => {
      if (typeof document !== 'undefined') {
        applyThemeToDom('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');

        applyThemeToDom('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('light')).toBe(false);
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      }
    });
  });

  describe('Export Jobs Slice', () => {
    it('manages export jobs queue', () => {
      const { addExportJob, updateExportJob } = useAppStore.getState();

      const job = {
        id: 'exp-101',
        projectId: 'proj-1',
        projectName: 'تصدير 1',
        aspectRatio: '9:16' as const,
        quality: 'high' as const,
        status: 'pending' as const,
        progress: 0,
        createdAt: new Date().toISOString(),
      };

      addExportJob(job);
      expect(useAppStore.getState().exportJobs.length).toBe(1);

      updateExportJob('exp-101', { status: 'completed', progress: 100 });
      expect(useAppStore.getState().exportJobs[0].status).toBe('completed');
      expect(useAppStore.getState().exportJobs[0].progress).toBe(100);
    });
  });

  describe('Single-Owner Persistence Architecture', () => {
    it('uses Electron IPC as primary owner and avoids duplicate localStorage writes when electronAPI is present', async () => {
      const mockSaveAll = vi.fn().mockResolvedValue({ success: true });
      const api = {
        projects: {
          saveAll: mockSaveAll,
          loadAll: vi.fn().mockResolvedValue([]),
        },
      };

      (globalThis as any).electronAPI = api;
      (window as any).electronAPI = api;

      const project = createDefaultProject({ id: 'proj-ipc', name: 'مشروع إلكترون' });
      useAppStore.getState().addProject(project);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSaveAll).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'proj-ipc' })])
      );

      // Clean up mock
      delete (globalThis as any).electronAPI;
      delete (window as any).electronAPI;
    });

    it('falls back cleanly to localStorage when Electron is absent (Web Mode)', async () => {
      delete (globalThis as any).electronAPI;
      delete (window as any).electronAPI;

      const project = createDefaultProject({ id: 'proj-web', name: 'مشروع ويب' });
      useAppStore.getState().addProject(project);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith(
        'ayahStudio_projects',
        expect.stringContaining('proj-web')
      );
    });
  });
});
